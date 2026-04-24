import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAmazfitStore } from '@/store/amazfitStore';
import { useDailyLogStore } from '@/store/dailyLogStore';
import { getTodayDateString } from '@/utils/dateUtils';
import * as ZeppService from '@/services/zepp';
import * as HealthKitService from '@/services/healthKit';
import type { AmazfitConnectionTier } from '@/types';

interface UseAmazfitReturn {
  connectionTier: AmazfitConnectionTier;
  nudgeDismissed: boolean;
  syncing: boolean;
  lastSyncedAt: string | null;
  connectZepp: () => Promise<void>;
  connectHealthKit: () => Promise<void>;
  setManual: () => void;
  disconnect: () => void;
  sync: () => Promise<void>;
  dismissNudge: () => void;
}

export function useAmazfit(): UseAmazfitReturn {
  const connectionTier = useAmazfitStore((s) => s.connectionTier);
  const nudgeDismissed = useAmazfitStore((s) => s.nudgeDismissed);
  const lastSyncedAt = useAmazfitStore((s) => s.lastSyncedAt);
  const setConnectionTier = useAmazfitStore((s) => s.setConnectionTier);
  const dismissNudge = useAmazfitStore((s) => s.dismissNudge);
  const setLastSyncedAt = useAmazfitStore((s) => s.setLastSyncedAt);
  const setCaloriesBurned = useDailyLogStore((s) => s.setCaloriesBurned);
  const [syncing, setSyncing] = useState(false);

  const sync = useCallback(async () => {
    const today = getTodayDateString();
    if (connectionTier === 'manual' || connectionTier === 'none') return;

    setSyncing(true);
    try {
      let calories = 0;

      if (connectionTier === 'zepp') {
        const token = await ZeppService.getStoredToken();
        if (token) {
          calories = await ZeppService.fetchTodayCaloriesBurned(token);
        }
      } else if (connectionTier === 'healthconnect' || connectionTier === 'applehealth') {
        calories = await HealthKitService.fetchTodayCaloriesBurned();
      }

      setCaloriesBurned(today, calories, connectionTier as 'zepp' | 'healthconnect' | 'applehealth');
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      console.error('[useAmazfit] sync failed:', error);
    } finally {
      setSyncing(false);
    }
  }, [connectionTier, setCaloriesBurned, setLastSyncedAt]);

  // Sync on mount and whenever the app comes to foreground
  const syncRef = useRef(sync);
  syncRef.current = sync;

  useEffect(() => {
    syncRef.current();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncRef.current();
    });
    return () => sub.remove();
  }, []);

  const connectZepp = useCallback(async () => {
    try {
      const token = await ZeppService.startZeppAuth();
      if (token) {
        setConnectionTier('zepp');
      }
    } catch (error) {
      console.error('[useAmazfit] Zepp connect failed:', error);
      throw error;
    }
  }, [setConnectionTier]);

  const connectHealthKit = useCallback(async () => {
    const granted = await HealthKitService.requestPermissions();
    if (granted) {
      const platform = require('react-native').Platform.OS;
      setConnectionTier(platform === 'android' ? 'healthconnect' : 'applehealth');
    }
  }, [setConnectionTier]);

  const setManual = useCallback(() => {
    setConnectionTier('manual');
  }, [setConnectionTier]);

  const disconnect = useCallback(async () => {
    if (connectionTier === 'zepp') {
      await ZeppService.clearToken();
    }
    setConnectionTier('none');
  }, [connectionTier, setConnectionTier]);

  return {
    connectionTier,
    nudgeDismissed,
    syncing,
    lastSyncedAt,
    connectZepp,
    connectHealthKit,
    setManual,
    disconnect,
    sync,
    dismissNudge,
  };
}
