import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyLog, FoodLogItem } from '@/types';
import { getTodayDateString } from '@/utils/dateUtils';

export function migrateDailyLogs(persisted: unknown, _version: number): unknown {
  if (persisted === null || persisted === undefined) return persisted;
  if (typeof persisted !== 'object') return persisted;
  const state = persisted as { logs?: Record<string, { foodItems?: unknown[] }> };
  if (!state.logs || typeof state.logs !== 'object') return persisted;

  for (const log of Object.values(state.logs)) {
    if (!log.foodItems || !Array.isArray(log.foodItems)) continue;
    for (const item of log.foodItems) {
      if (item === null || typeof item !== 'object') continue;
      const itemAny = item as Record<string, unknown>;
      if ('servingLabel' in itemAny) continue;
      if ('servingQuantity' in itemAny && 'servingSize' in itemAny) {
        const qty = itemAny.servingQuantity as number;
        const size = itemAny.servingSize as string;
        itemAny.servingLabel = qty !== 1 ? `${qty} × ${size}` : size;
        delete itemAny.servingQuantity;
        delete itemAny.servingSize;
      }
    }
  }
  return persisted;
}

function createEmptyLog(date: string): DailyLog {
  return {
    date,
    foodItems: [],
    waterMl: 0,
    caloriesBurned: 0,
    caloriesBurnedSource: 'manual',
  };
}

interface DailyLogState {
  logs: Record<string, DailyLog>;
  ensureLogExists: (date: string) => void;
  addFoodItem: (item: FoodLogItem) => void;
  removeFoodItem: (date: string, id: string) => void;
  addWater: (date: string, ml: number) => void;
  setCaloriesBurned: (
    date: string,
    calories: number,
    source: DailyLog['caloriesBurnedSource'],
  ) => void;
  setBodyWeight: (date: string, weightKg: number) => void;
}

const TODAY = getTodayDateString();

export const useDailyLogStore = create<DailyLogState>()(
  persist(
    (set, get) => ({
      logs: { [TODAY]: createEmptyLog(TODAY) },

      ensureLogExists: (date) => {
        if (!get().logs[date]) {
          set((state) => ({
            logs: { ...state.logs, [date]: createEmptyLog(date) },
          }));
        }
      },

      addFoodItem: (item) => {
        set((state) => {
          const existing = state.logs[item.date] ?? createEmptyLog(item.date);
          return {
            logs: {
              ...state.logs,
              [item.date]: {
                ...existing,
                foodItems: [...existing.foodItems, item],
              },
            },
          };
        });
      },

      removeFoodItem: (date, id) => {
        set((state) => {
          const log = state.logs[date];
          if (!log) return state;
          return {
            logs: {
              ...state.logs,
              [date]: {
                ...log,
                foodItems: log.foodItems.filter((item) => item.id !== id),
              },
            },
          };
        });
      },

      addWater: (date, ml) => {
        set((state) => {
          const existing = state.logs[date] ?? createEmptyLog(date);
          return {
            logs: {
              ...state.logs,
              [date]: { ...existing, waterMl: existing.waterMl + ml },
            },
          };
        });
      },

      setCaloriesBurned: (date, calories, source) => {
        set((state) => {
          const existing = state.logs[date] ?? createEmptyLog(date);
          return {
            logs: {
              ...state.logs,
              [date]: {
                ...existing,
                caloriesBurned: calories,
                caloriesBurnedSource: source,
              },
            },
          };
        });
      },

      setBodyWeight: (date, weightKg) => {
        set((state) => {
          const existing = state.logs[date] ?? createEmptyLog(date);
          return {
            logs: {
              ...state.logs,
              [date]: {
                ...existing,
                bodyWeightKg: weightKg,
              },
            },
          };
        });
      },
    }),
    {
      name: 'nourish-daily-logs',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: migrateDailyLogs as never,
    },
  ),
);
