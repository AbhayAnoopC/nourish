jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
}));

import { usePantryStore } from './pantryStore';
import type { PantryItem } from '@/types';

const item: PantryItem = {
  id: 'p1',
  foodName: 'Wonder Bread',
  brandName: 'Wonder',
  servingDescription: '2 slices',
  servingQuantity: 2,
  caloriesPerServing: 140,
  proteinGPerServing: 4,
  carbsGPerServing: 26,
  fatGPerServing: 2,
  addedAt: '2026-04-24T12:00:00.000Z',
  source: 'label',
};

describe('pantryStore', () => {
  beforeEach(() => {
    usePantryStore.setState({ items: [] });
  });

  it('addItem adds an item to the list', () => {
    usePantryStore.getState().addItem(item);
    expect(usePantryStore.getState().items).toHaveLength(1);
    expect(usePantryStore.getState().items[0]!.foodName).toBe('Wonder Bread');
  });

  it('removeItem removes by id', () => {
    usePantryStore.getState().addItem(item);
    usePantryStore.getState().removeItem('p1');
    expect(usePantryStore.getState().items).toHaveLength(0);
  });

  it('updateItem merges partial fields', () => {
    usePantryStore.getState().addItem(item);
    usePantryStore.getState().updateItem('p1', { foodName: 'Whole Wheat Bread' });
    expect(usePantryStore.getState().items[0]!.foodName).toBe('Whole Wheat Bread');
    expect(usePantryStore.getState().items[0]!.caloriesPerServing).toBe(140);
  });

  it('removeItem is a no-op for unknown id', () => {
    usePantryStore.getState().addItem(item);
    usePantryStore.getState().removeItem('nonexistent');
    expect(usePantryStore.getState().items).toHaveLength(1);
  });
});
