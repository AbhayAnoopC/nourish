import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyLog, FoodLogItem } from '@/types';

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function buildPlaceholderItems(date: string): FoodLogItem[] {
  const now = Date.now();
  return [
    {
      id: 'placeholder-1',
      date,
      timestamp: new Date(now - 5 * 3_600_000).toISOString(),
      foodName: 'Oatmeal with berries',
      servingSize: '1 bowl',
      servingQuantity: 1,
      calories: 310,
      proteinG: 10,
      carbsG: 54,
      fatG: 6,
      source: 'manual',
    },
    {
      id: 'placeholder-2',
      date,
      timestamp: new Date(now - 3 * 3_600_000).toISOString(),
      foodName: 'Grilled chicken breast',
      servingSize: '150g',
      servingQuantity: 1,
      calories: 248,
      proteinG: 46,
      carbsG: 0,
      fatG: 5,
      source: 'manual',
    },
    {
      id: 'placeholder-3',
      date,
      timestamp: new Date(now - 1 * 3_600_000).toISOString(),
      foodName: 'Brown rice',
      servingSize: '1 cup cooked',
      servingQuantity: 1,
      calories: 216,
      proteinG: 5,
      carbsG: 45,
      fatG: 2,
      source: 'manual',
    },
  ];
}

function createDefaultLog(date: string): DailyLog {
  const today = getTodayDateString();
  return {
    date,
    foodItems: date === today ? buildPlaceholderItems(date) : [],
    waterMl: date === today ? 750 : 0,
    caloriesBurned: date === today ? 320 : 0,
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
}

const TODAY = getTodayDateString();

export const useDailyLogStore = create<DailyLogState>()(
  persist(
    (set, get) => ({
      logs: { [TODAY]: createDefaultLog(TODAY) },

      ensureLogExists: (date) => {
        if (!get().logs[date]) {
          set((state) => ({
            logs: { ...state.logs, [date]: createDefaultLog(date) },
          }));
        }
      },

      addFoodItem: (item) => {
        set((state) => {
          const existing = state.logs[item.date] ?? createDefaultLog(item.date);
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
          const existing = state.logs[date] ?? createDefaultLog(date);
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
          const existing = state.logs[date] ?? createDefaultLog(date);
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
    }),
    {
      name: 'nourish-daily-logs',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
