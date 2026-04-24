import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SavedMeal } from '@/types';

interface SavedMealsState {
  meals: SavedMeal[];
  addMeal: (meal: SavedMeal) => void;
  renameMeal: (id: string, name: string) => void;
  deleteMeal: (id: string) => void;
}

export const useSavedMealsStore = create<SavedMealsState>()(
  persist(
    (set) => ({
      meals: [],
      addMeal: (meal) => set((s) => ({ meals: [meal, ...s.meals] })),
      renameMeal: (id, name) =>
        set((s) => ({
          meals: s.meals.map((m) => (m.id === id ? { ...m, name } : m)),
        })),
      deleteMeal: (id) =>
        set((s) => ({ meals: s.meals.filter((m) => m.id !== id) })),
    }),
    {
      name: 'saved_meals',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
