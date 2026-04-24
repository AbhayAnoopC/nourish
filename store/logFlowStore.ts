import { create } from 'zustand';
import type { SavedMeal, SearchResult, PhotoScanItem, LabelScanResult } from '@/types';

// Transient store — holds the item/meal being reviewed on the Confirm screens.
// Not persisted; cleared after the user confirms or cancels.
interface LogFlowState {
  pendingItem: SearchResult | null;
  setPendingItem: (item: SearchResult) => void;
  clearPendingItem: () => void;
  pendingMeal: SavedMeal | null;
  setPendingMeal: (meal: SavedMeal) => void;
  clearPendingMeal: () => void;
  pendingPhotoItems: PhotoScanItem[] | null;
  setPendingPhotoItems: (items: PhotoScanItem[]) => void;
  clearPendingPhotoItems: () => void;
  pendingLabelResult: LabelScanResult | null;
  setPendingLabelResult: (result: LabelScanResult) => void;
  clearPendingLabelResult: () => void;
}

export const useLogFlowStore = create<LogFlowState>()((set) => ({
  pendingItem: null,
  setPendingItem: (item) => set({ pendingItem: item }),
  clearPendingItem: () => set({ pendingItem: null }),
  pendingMeal: null,
  setPendingMeal: (meal) => set({ pendingMeal: meal }),
  clearPendingMeal: () => set({ pendingMeal: null }),
  pendingPhotoItems: null,
  setPendingPhotoItems: (items) => set({ pendingPhotoItems: items }),
  clearPendingPhotoItems: () => set({ pendingPhotoItems: null }),
  pendingLabelResult: null,
  setPendingLabelResult: (result) => set({ pendingLabelResult: result }),
  clearPendingLabelResult: () => set({ pendingLabelResult: null }),
}));
