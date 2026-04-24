import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { useDailyLogStore } from '@/store/dailyLogStore';
import { useUserStore } from '@/store/userStore';
import { getTodayDateString } from '@/utils/dateUtils';
import { DailyLog, FoodLogItem } from '@/types';

interface DailyTotals {
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  remainingCalories: number;
}

interface UseDailyLogReturn {
  log: DailyLog;
  totals: DailyTotals;
  addWater: (ml: number) => void;
  removeFoodItem: (id: string) => void;
}

export function useDailyLog(): UseDailyLogReturn {
  // Re-compute today whenever the app returns to foreground so the
  // log resets correctly at midnight without requiring an app restart.
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') forceUpdate((n) => n + 1);
    });
    return () => sub.remove();
  }, []);

  const today = getTodayDateString();
  const logs = useDailyLogStore((state) => state.logs);
  const ensureLogExists = useDailyLogStore((state) => state.ensureLogExists);
  const storeAddWater = useDailyLogStore((state) => state.addWater);
  const storeRemoveFoodItem = useDailyLogStore((state) => state.removeFoodItem);
  const profile = useUserStore((state) => state.profile);

  useEffect(() => {
    ensureLogExists(today);
  }, [today, ensureLogExists]);

  const log = useMemo<DailyLog>(() => {
    const raw = logs[today] ?? {
      date: today,
      foodItems: [] as FoodLogItem[],
      waterMl: 0,
      caloriesBurned: 0,
      caloriesBurnedSource: 'manual' as const,
    };
    // Sort food items chronologically (oldest first) for display
    const sortedItems = [...raw.foodItems].sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp),
    );
    return { ...raw, foodItems: sortedItems };
  }, [logs, today]);

  const totals = useMemo<DailyTotals>(() => {
    const totalCalories = log.foodItems.reduce((sum, item) => sum + item.calories, 0);
    const totalProteinG = log.foodItems.reduce((sum, item) => sum + item.proteinG, 0);
    const totalCarbsG = log.foodItems.reduce((sum, item) => sum + item.carbsG, 0);
    const totalFatG = log.foodItems.reduce((sum, item) => sum + item.fatG, 0);
    const dailyTarget = profile?.dailyCalorieTarget ?? 2000;
    const remainingCalories = dailyTarget - totalCalories + log.caloriesBurned;
    return { totalCalories, totalProteinG, totalCarbsG, totalFatG, remainingCalories };
  }, [log, profile]);

  const addWater = useCallback(
    (ml: number) => storeAddWater(today, ml),
    [storeAddWater, today],
  );

  const removeFoodItem = useCallback(
    (id: string) => storeRemoveFoodItem(today, id),
    [storeRemoveFoodItem, today],
  );

  return { log, totals, addWater, removeFoodItem };
}
