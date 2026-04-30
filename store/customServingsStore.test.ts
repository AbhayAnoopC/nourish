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

import { useCustomServingsStore } from './customServingsStore';

describe('customServingsStore', () => {
  beforeEach(() => {
    useCustomServingsStore.setState({ customs: [] });
  });

  it('addCustom creates a CustomServing with id and createdAt', () => {
    const created = useCustomServingsStore.getState().addCustom({
      matchKey: 'chicken breast',
      label: '1 large breast',
      grams: 220,
    });

    expect(created.id).toBeTruthy();
    expect(created.createdAt).toBeTruthy();
    expect(created.matchKey).toBe('chicken breast');
    expect(created.label).toBe('1 large breast');
    expect(created.grams).toBe(220);

    expect(useCustomServingsStore.getState().customs).toHaveLength(1);
  });

  it('removeCustom removes by id', () => {
    const c = useCustomServingsStore.getState().addCustom({
      matchKey: 'apple',
      label: '1 medium apple',
      grams: 182,
    });
    expect(useCustomServingsStore.getState().customs).toHaveLength(1);

    useCustomServingsStore.getState().removeCustom(c.id);
    expect(useCustomServingsStore.getState().customs).toHaveLength(0);
  });

  it('findMatchesForFood returns customs whose matchKey tokens are subset of food name tokens', () => {
    const store = useCustomServingsStore.getState();
    store.addCustom({ matchKey: 'chicken breast', label: '1 large breast', grams: 220 });
    store.addCustom({ matchKey: 'apple', label: '1 medium', grams: 182 });
    store.addCustom({ matchKey: 'salmon', label: '1 fillet', grams: 170 });

    const matches = useCustomServingsStore.getState().findMatchesForFood('Boneless chicken breast, raw');
    expect(matches).toHaveLength(1);
    expect(matches[0].matchKey).toBe('chicken breast');
  });

  it('findMatchesForFood returns empty array when no matches', () => {
    useCustomServingsStore.getState().addCustom({
      matchKey: 'chicken breast',
      label: '1 large breast',
      grams: 220,
    });

    expect(useCustomServingsStore.getState().findMatchesForFood('Whole milk')).toEqual([]);
  });
});
