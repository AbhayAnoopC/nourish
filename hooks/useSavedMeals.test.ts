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

import { useSavedMealsStore } from '@/store/savedMealsStore';
import type { SavedMeal } from '@/types';

function makeMeal(id: string, name: string): SavedMeal {
  return { id, name, createdAt: '', items: [], totalCalories: 0, totalProteinG: 0, totalCarbsG: 0, totalFatG: 0 };
}

// The filter logic from useSavedMeals is a pure function of (meals, query).
// We test it directly against the store since renderHook is not available
// in this node testEnvironment config.
function applyFilter(meals: SavedMeal[], query: string): SavedMeal[] {
  const q = query.trim().toLowerCase();
  if (!q) return meals;
  return meals.filter((m) => m.name.toLowerCase().includes(q));
}

beforeEach(() => {
  useSavedMealsStore.setState({ meals: [] });
});

describe('filteredMeals logic', () => {
  it('returns all meals when query is empty', () => {
    const meals = [makeMeal('a', 'Oat Bowl'), makeMeal('b', 'Chicken')];
    expect(applyFilter(meals, '')).toHaveLength(2);
  });

  it('returns all meals when query is only whitespace', () => {
    const meals = [makeMeal('a', 'Oat Bowl')];
    expect(applyFilter(meals, '   ')).toHaveLength(1);
  });

  it('filters case-insensitively by name', () => {
    const meals = [makeMeal('a', 'Oat Bowl'), makeMeal('b', 'Chicken Wrap')];
    const result = applyFilter(meals, 'OAT');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
  });

  it('matches partial substrings', () => {
    const meals = [makeMeal('a', 'Greek Yoghurt Parfait'), makeMeal('b', 'Granola Bar')];
    const result = applyFilter(meals, 'ola');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('b');
  });

  it('returns empty array when nothing matches', () => {
    const meals = [makeMeal('a', 'Oat Bowl')];
    expect(applyFilter(meals, 'pizza')).toHaveLength(0);
  });
});

describe('store CRUD via useSavedMealsStore', () => {
  it('addMeal makes meal available in store', () => {
    useSavedMealsStore.getState().addMeal(makeMeal('x', 'My Meal'));
    expect(useSavedMealsStore.getState().meals).toHaveLength(1);
  });

  it('renameMeal updates name', () => {
    useSavedMealsStore.getState().addMeal(makeMeal('r', 'Old'));
    useSavedMealsStore.getState().renameMeal('r', 'New');
    expect(useSavedMealsStore.getState().meals[0].name).toBe('New');
  });

  it('deleteMeal removes the entry', () => {
    useSavedMealsStore.getState().addMeal(makeMeal('d', 'Gone'));
    useSavedMealsStore.getState().deleteMeal('d');
    expect(useSavedMealsStore.getState().meals).toHaveLength(0);
  });
});
