import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CustomServing } from '@/types';
import { isFuzzyMatch } from '@/utils/normalizeFoodName';

interface CustomServingsState {
  customs: CustomServing[];
  addCustom: (input: Omit<CustomServing, 'id' | 'createdAt'>) => CustomServing;
  removeCustom: (id: string) => void;
  findMatchesForFood: (foodName: string) => CustomServing[];
}

function generateId(): string {
  return `cs-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useCustomServingsStore = create<CustomServingsState>()(
  persist(
    (set, get) => ({
      customs: [],

      addCustom: (input) => {
        const created: CustomServing = {
          ...input,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ customs: [...state.customs, created] }));
        return created;
      },

      removeCustom: (id) => {
        set((state) => ({ customs: state.customs.filter((c) => c.id !== id) }));
      },

      findMatchesForFood: (foodName) => {
        return get().customs.filter((c) => isFuzzyMatch(c.matchKey, foodName));
      },
    }),
    {
      name: 'nourish-custom-servings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
