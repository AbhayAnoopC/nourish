import { create } from 'zustand';
import type { SavedMeal, SearchResult } from '@/types';

// Transient store — holds the item/meal being reviewed on the Confirm screens.
// Not persisted; cleared after the user confirms or cancels.
interface LogFlowState {
  pendingItem: SearchResult | null;
  setPendingItem: (item: SearchResult) => void;
  clearPendingItem: () => void;
  pendingMeal: SavedMeal | null;
  setPendingMeal: (meal: SavedMeal) => void;
  clearPendingMeal: () => void;
}

export const useLogFlowStore = create<LogFlowState>()((set) => ({
  pendingItem: null,
  setPendingItem: (item) => set({ pendingItem: item }),
  clearPendingItem: () => set({ pendingItem: null }),
  pendingMeal: null,
  setPendingMeal: (meal) => set({ pendingMeal: meal }),
  clearPendingMeal: () => set({ pendingMeal: null }),
}));
