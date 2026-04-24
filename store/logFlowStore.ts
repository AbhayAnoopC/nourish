import { create } from 'zustand';
import { SearchResult } from '@/types';

// Transient store — holds the food item being reviewed on the Confirm screen.
// Not persisted; cleared after the user confirms or cancels.
interface LogFlowState {
  pendingItem: SearchResult | null;
  setPendingItem: (item: SearchResult) => void;
  clearPendingItem: () => void;
}

export const useLogFlowStore = create<LogFlowState>()((set) => ({
  pendingItem: null,
  setPendingItem: (item) => set({ pendingItem: item }),
  clearPendingItem: () => set({ pendingItem: null }),
}));
