import { isAvailable, requestPermissions, fetchTodayCaloriesBurned } from './healthKit';

describe('isAvailable', () => {
  it('returns false in the Expo Go / node test environment', () => {
    expect(isAvailable()).toBe(false);
  });
});

describe('requestPermissions', () => {
  it('returns false when native module is unavailable', async () => {
    expect(await requestPermissions()).toBe(false);
  });
});

describe('fetchTodayCaloriesBurned', () => {
  it('returns 0 when native module is unavailable', async () => {
    expect(await fetchTodayCaloriesBurned()).toBe(0);
  });
});
