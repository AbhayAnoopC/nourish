import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AdaptiveTdeeResult, TdeeRecalculation } from '@/types';

interface AdaptiveTdeeState {
  enabled: boolean;
  lastRecalculatedAt: string | undefined;
  history: TdeeRecalculation[];
  pendingResult: AdaptiveTdeeResult | null;
  setEnabled: (enabled: boolean) => void;
  setPendingResult: (result: AdaptiveTdeeResult | null) => void;
  recordRecalculation: (rec: TdeeRecalculation) => void;
}

export const useAdaptiveTdeeStore = create<AdaptiveTdeeState>()(
  persist(
    (set) => ({
      enabled: true,
      lastRecalculatedAt: undefined,
      history: [],
      pendingResult: null,
      setEnabled: (enabled) => set({ enabled }),
      setPendingResult: (result) => set({ pendingResult: result }),
      recordRecalculation: (rec) =>
        set((state) => ({
          history: [...state.history, rec],
          pendingResult: null,
          lastRecalculatedAt: rec.date,
        })),
    }),
    { name: 'nourish-adaptive-tdee', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
