import { useCallback, useMemo, useState } from 'react';
import { useSavedMealsStore } from '@/store/savedMealsStore';
import type { SavedMeal } from '@/types';

interface UseSavedMealsReturn {
  query: string;
  setQuery: (q: string) => void;
  filteredMeals: SavedMeal[];
  addMeal: (meal: SavedMeal) => void;
  renameMeal: (id: string, name: string) => void;
  deleteMeal: (id: string) => void;
}

export function useSavedMeals(): UseSavedMealsReturn {
  const [query, setQuery] = useState('');
  const meals = useSavedMealsStore((s) => s.meals);
  const storeAdd = useSavedMealsStore((s) => s.addMeal);
  const storeRename = useSavedMealsStore((s) => s.renameMeal);
  const storeDelete = useSavedMealsStore((s) => s.deleteMeal);

  const filteredMeals = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return meals;
    return meals.filter((m) => m.name.toLowerCase().includes(q));
  }, [meals, query]);

  const addMeal = useCallback((meal: SavedMeal) => storeAdd(meal), [storeAdd]);
  const renameMeal = useCallback((id: string, name: string) => storeRename(id, name), [storeRename]);
  const deleteMeal = useCallback((id: string) => storeDelete(id), [storeDelete]);

  return { query, setQuery, filteredMeals, addMeal, renameMeal, deleteMeal };
}
