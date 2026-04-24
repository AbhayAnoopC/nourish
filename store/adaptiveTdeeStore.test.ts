jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
}));

import { useAdaptiveTdeeStore } from './adaptiveTdeeStore';
import type { AdaptiveTdeeResult, TdeeRecalculation } from '@/types';

const mockResult: AdaptiveTdeeResult = {
  newTarget: 1950,
  impliedTdee: 2450,
  oldTarget: 2000,
  avgDailyIntake: 1800,
  weightDeltaKg: -0.8,
  daysAnalysed: 14,
};

describe('adaptiveTdeeStore', () => {
  beforeEach(() => {
    useAdaptiveTdeeStore.setState({
      enabled: true, lastRecalculatedAt: undefined,
      history: [], pendingResult: null,
    });
  });

  it('setEnabled toggles the flag', () => {
    useAdaptiveTdeeStore.getState().setEnabled(false);
    expect(useAdaptiveTdeeStore.getState().enabled).toBe(false);
  });

  it('setPendingResult stores the result', () => {
    useAdaptiveTdeeStore.getState().setPendingResult(mockResult);
    expect(useAdaptiveTdeeStore.getState().pendingResult?.newTarget).toBe(1950);
  });

  it('recordRecalculation appends to history and clears pending', () => {
    useAdaptiveTdeeStore.getState().setPendingResult(mockResult);
    const rec: TdeeRecalculation = { date: '2026-04-24', oldTarget: 2000, newTarget: 1950, impliedTdee: 2450 };
    useAdaptiveTdeeStore.getState().recordRecalculation(rec);
    expect(useAdaptiveTdeeStore.getState().history).toHaveLength(1);
    expect(useAdaptiveTdeeStore.getState().pendingResult).toBeNull();
    expect(useAdaptiveTdeeStore.getState().lastRecalculatedAt).toBe('2026-04-24');
  });
});
