import { useDailyLogStore } from './dailyLogStore';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
}));

describe('dailyLogStore.setBodyWeight', () => {
  beforeEach(() => {
    useDailyLogStore.setState({ logs: {} });
  });

  it('sets bodyWeightKg on the log for the given date', () => {
    useDailyLogStore.getState().setBodyWeight('2026-04-24', 72.5);
    expect(useDailyLogStore.getState().logs['2026-04-24']?.bodyWeightKg).toBe(72.5);
  });

  it('creates the log entry if it does not yet exist', () => {
    useDailyLogStore.getState().setBodyWeight('2026-01-01', 70);
    const log = useDailyLogStore.getState().logs['2026-01-01'];
    expect(log).toBeDefined();
    expect(log?.bodyWeightKg).toBe(70);
  });

  it('does not overwrite existing food items', () => {
    useDailyLogStore.getState().addFoodItem({
      id: '1', date: '2026-04-24', timestamp: new Date().toISOString(),
      foodName: 'Apple', servingLabel: '1 medium',
      calories: 95, proteinG: 0.5, carbsG: 25, fatG: 0.3, source: 'usda',
    });
    useDailyLogStore.getState().setBodyWeight('2026-04-24', 72);
    const log = useDailyLogStore.getState().logs['2026-04-24'];
    expect(log?.foodItems).toHaveLength(1);
    expect(log?.bodyWeightKg).toBe(72);
  });
});
