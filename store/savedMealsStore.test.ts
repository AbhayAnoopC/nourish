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

import { useSavedMealsStore } from './savedMealsStore';
import type { SavedMeal } from '@/types';

function makeMeal(id: string, name: string): SavedMeal {
  return {
    id,
    name,
    createdAt: new Date().toISOString(),
    items: [],
    totalCalories: 300,
    totalProteinG: 20,
    totalCarbsG: 30,
    totalFatG: 10,
  };
}

beforeEach(() => {
  useSavedMealsStore.setState({ meals: [] });
});

describe('addMeal', () => {
  it('prepends the new meal to the list', () => {
    const { addMeal } = useSavedMealsStore.getState();
    addMeal(makeMeal('a', 'Oat Bowl'));
    addMeal(makeMeal('b', 'Chicken Wrap'));
    const { meals } = useSavedMealsStore.getState();
    expect(meals[0].id).toBe('b');
    expect(meals[1].id).toBe('a');
  });

  it('stores meal with all fields intact', () => {
    const meal = makeMeal('z', 'Test Meal');
    useSavedMealsStore.getState().addMeal(meal);
    expect(useSavedMealsStore.getState().meals[0]).toEqual(meal);
  });
});

describe('renameMeal', () => {
  it('updates the name of the matching meal', () => {
    const { addMeal, renameMeal } = useSavedMealsStore.getState();
    addMeal(makeMeal('x', 'Old Name'));
    renameMeal('x', 'New Name');
    expect(useSavedMealsStore.getState().meals[0].name).toBe('New Name');
  });

  it('leaves other meals unchanged', () => {
    const { addMeal, renameMeal } = useSavedMealsStore.getState();
    addMeal(makeMeal('x', 'A'));
    addMeal(makeMeal('y', 'B'));
    renameMeal('x', 'A2');
    const { meals } = useSavedMealsStore.getState();
    expect(meals.find((m) => m.id === 'y')?.name).toBe('B');
  });
});

describe('deleteMeal', () => {
  it('removes the meal with the given id', () => {
    const { addMeal, deleteMeal } = useSavedMealsStore.getState();
    addMeal(makeMeal('del', 'To Delete'));
    deleteMeal('del');
    expect(useSavedMealsStore.getState().meals).toHaveLength(0);
  });

  it('leaves other meals when deleting one', () => {
    const { addMeal, deleteMeal } = useSavedMealsStore.getState();
    addMeal(makeMeal('keep', 'Keep Me'));
    addMeal(makeMeal('del', 'Delete Me'));
    deleteMeal('del');
    const { meals } = useSavedMealsStore.getState();
    expect(meals).toHaveLength(1);
    expect(meals[0].id).toBe('keep');
  });
});
