jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('zustand/middleware', () => {
  const actual = jest.requireActual('zustand/middleware');
  return {
    ...actual,
    persist: (config: unknown) => config,
    createJSONStorage: () => null,
  };
});

import { useAmazfitStore } from './amazfitStore';

beforeEach(() => {
  useAmazfitStore.setState({
    connectionTier: 'none',
    nudgeDismissed: false,
    lastSyncedAt: null,
  });
});

describe('setConnectionTier', () => {
  it('updates the connection tier', () => {
    useAmazfitStore.getState().setConnectionTier('manual');
    expect(useAmazfitStore.getState().connectionTier).toBe('manual');
  });

  it('can be set to zepp', () => {
    useAmazfitStore.getState().setConnectionTier('zepp');
    expect(useAmazfitStore.getState().connectionTier).toBe('zepp');
  });

  it('can be reset to none', () => {
    useAmazfitStore.getState().setConnectionTier('zepp');
    useAmazfitStore.getState().setConnectionTier('none');
    expect(useAmazfitStore.getState().connectionTier).toBe('none');
  });
});

describe('dismissNudge', () => {
  it('sets nudgeDismissed to true', () => {
    useAmazfitStore.getState().dismissNudge();
    expect(useAmazfitStore.getState().nudgeDismissed).toBe(true);
  });
});

describe('setLastSyncedAt', () => {
  it('stores the ISO timestamp', () => {
    const iso = '2026-04-24T10:00:00.000Z';
    useAmazfitStore.getState().setLastSyncedAt(iso);
    expect(useAmazfitStore.getState().lastSyncedAt).toBe(iso);
  });
});
