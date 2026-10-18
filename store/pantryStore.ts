import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PantryItem } from '@/types';

interface PantryState {
  items: PantryItem[];
  addItem: (item: PantryItem) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, partial: Partial<PantryItem>) => void;
}

export const usePantryStore = create<PantryState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateItem: (id, partial) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, ...partial } : i)),
        })),
    }),
    { name: 'nourish-pantry', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
