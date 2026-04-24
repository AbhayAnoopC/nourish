import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AmazfitConnectionTier } from '@/types';

interface AmazfitState {
  connectionTier: AmazfitConnectionTier;
  nudgeDismissed: boolean;
  lastSyncedAt: string | null;
  setConnectionTier: (tier: AmazfitConnectionTier) => void;
  dismissNudge: () => void;
  setLastSyncedAt: (iso: string) => void;
}

export const useAmazfitStore = create<AmazfitState>()(
  persist(
    (set) => ({
      connectionTier: 'none',
      nudgeDismissed: false,
      lastSyncedAt: null,
      setConnectionTier: (tier) => set({ connectionTier: tier }),
      dismissNudge: () => set({ nudgeDismissed: true }),
      setLastSyncedAt: (iso) => set({ lastSyncedAt: iso }),
    }),
    {
      name: 'amazfit-connection',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
