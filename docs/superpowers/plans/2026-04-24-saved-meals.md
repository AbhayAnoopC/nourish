# Saved Meals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to save a food item as a named meal, browse/search saved meals, re-log them with a quantity multiplier, and delete or rename them.

**Architecture:** New Zustand store (`savedMealsStore`) persisted with AsyncStorage holds all saved meals. The existing confirm-food screen gets a "Save as Meal" sheet. A new `confirm-meal` screen handles re-logging with a global quantity multiplier. The Meals tab shows a searchable FlatList of `SavedMealCard` components.

**Tech Stack:** Zustand v5 + AsyncStorage persistence, Expo Router, React Native FlatList, TextInput for search/rename.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `store/savedMealsStore.ts` | Create | Zustand + AsyncStorage store for saved meals CRUD |
| `hooks/useSavedMeals.ts` | Create | Hook wrapping store — search filter + CRUD actions |
| `components/SavedMealCard.tsx` | Create | Row card: name, calorie count, macro pills, long-press menu |
| `app/(tabs)/meals.tsx` | Replace | Searchable FlatList of saved meals + empty state |
| `app/confirm-meal.tsx` | Create | Re-log screen: meal name, items list, quantity multiplier, Add to Log |
| `app/confirm-food.tsx` | Modify | Add "Save as Meal" button that opens a name-input bottom sheet |
| `app/_layout.tsx` | Modify | Register `confirm-meal` screen in Stack |
| `store/logFlowStore.ts` | Modify | Add `pendingMeal: SavedMeal \| null` + `setPendingMeal` / `clearPendingMeal` |
| `store/savedMealsStore.test.ts` | Create | Unit tests for store actions |
| `hooks/useSavedMeals.test.ts` | Create | Unit tests for search filter logic |

---

### Task 1: savedMealsStore

**Files:**
- Create: `store/savedMealsStore.ts`

- [ ] **Step 1: Write the store**

```typescript
// store/savedMealsStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SavedMeal } from '@/types';

interface SavedMealsState {
  meals: SavedMeal[];
  addMeal: (meal: SavedMeal) => void;
  renameMeal: (id: string, name: string) => void;
  deleteMeal: (id: string) => void;
}

export const useSavedMealsStore = create<SavedMealsState>()(
  persist(
    (set) => ({
      meals: [],
      addMeal: (meal) => set((s) => ({ meals: [meal, ...s.meals] })),
      renameMeal: (id, name) =>
        set((s) => ({
          meals: s.meals.map((m) => (m.id === id ? { ...m, name } : m)),
        })),
      deleteMeal: (id) =>
        set((s) => ({ meals: s.meals.filter((m) => m.id !== id) })),
    }),
    {
      name: 'saved_meals',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
```

- [ ] **Step 2: Commit**

```bash
git add store/savedMealsStore.ts
git commit -m "feat: add savedMealsStore with AsyncStorage persistence"
```

---

### Task 2: Store unit tests

**Files:**
- Create: `store/savedMealsStore.test.ts`

Note: Jest config `testMatch` currently only covers `utils/**` and `services/**`. We'll add `store/**` and `hooks/**` to it as part of this task.

- [ ] **Step 1: Extend testMatch in package.json**

In `package.json`, change:
```json
"testMatch": [
  "**/utils/**/*.test.ts",
  "**/services/**/*.test.ts"
]
```
to:
```json
"testMatch": [
  "**/utils/**/*.test.ts",
  "**/services/**/*.test.ts",
  "**/store/**/*.test.ts",
  "**/hooks/**/*.test.ts"
]
```

- [ ] **Step 2: Write the tests**

```typescript
// store/savedMealsStore.test.ts
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
});
```

- [ ] **Step 3: Run tests — verify pass**

```bash
npm test -- --testPathPattern="savedMealsStore"
```

Expected: 4 tests pass.

- [ ] **Step 4: Commit**

```bash
git add package.json store/savedMealsStore.test.ts
git commit -m "test: savedMealsStore unit tests; extend testMatch to store/ and hooks/"
```

---

### Task 3: useSavedMeals hook

**Files:**
- Create: `hooks/useSavedMeals.ts`
- Create: `hooks/useSavedMeals.test.ts`

- [ ] **Step 1: Write the hook**

```typescript
// hooks/useSavedMeals.ts
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
```

- [ ] **Step 2: Write hook tests**

```typescript
// hooks/useSavedMeals.test.ts
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
import { useSavedMeals } from './useSavedMeals';
import type { SavedMeal } from '@/types';

// Minimal React hook runner without renderHook (no RNTL in this jest config)
function getHookResult() {
  return useSavedMeals();
}

function makeMeal(id: string, name: string): SavedMeal {
  return { id, name, createdAt: '', items: [], totalCalories: 0, totalProteinG: 0, totalCarbsG: 0, totalFatG: 0 };
}

beforeEach(() => {
  useSavedMealsStore.setState({ meals: [] });
});

describe('filteredMeals', () => {
  it('returns all meals when query is empty', () => {
    useSavedMealsStore.setState({ meals: [makeMeal('a', 'Oat Bowl'), makeMeal('b', 'Chicken')] });
    // Call store directly — filter logic is a pure useMemo, test it standalone
    const meals = useSavedMealsStore.getState().meals;
    const q = '';
    const result = q ? meals.filter((m) => m.name.toLowerCase().includes(q)) : meals;
    expect(result).toHaveLength(2);
  });

  it('filters case-insensitively by name', () => {
    useSavedMealsStore.setState({ meals: [makeMeal('a', 'Oat Bowl'), makeMeal('b', 'Chicken Wrap')] });
    const meals = useSavedMealsStore.getState().meals;
    const q = 'oat';
    const result = meals.filter((m) => m.name.toLowerCase().includes(q));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
  });

  it('returns empty array when nothing matches', () => {
    useSavedMealsStore.setState({ meals: [makeMeal('a', 'Oat Bowl')] });
    const meals = useSavedMealsStore.getState().meals;
    const q = 'pizza';
    const result = meals.filter((m) => m.name.toLowerCase().includes(q));
    expect(result).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npm test -- --testPathPattern="useSavedMeals"
```

Expected: 3 tests pass.

- [ ] **Step 4: Commit**

```bash
git add hooks/useSavedMeals.ts hooks/useSavedMeals.test.ts
git commit -m "feat: useSavedMeals hook with search filter"
```

---

### Task 4: SavedMealCard component

**Files:**
- Create: `components/SavedMealCard.tsx`

- [ ] **Step 1: Write the component**

```typescript
// components/SavedMealCard.tsx
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/constants/Spacing';
import type { SavedMeal } from '@/types';

interface Props {
  meal: SavedMeal;
  onPress: (meal: SavedMeal) => void;
  onRename: (id: string, currentName: string) => void;
  onDelete: (id: string) => void;
}

export function SavedMealCard({ meal, onPress, onRename, onDelete }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const handleLongPress = () => {
    Alert.alert(meal.name, undefined, [
      { text: 'Rename', onPress: () => onRename(meal.id, meal.name) },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(meal.id) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const macroSummary = `P ${meal.totalProteinG}g · C ${meal.totalCarbsG}g · F ${meal.totalFatG}g`;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => onPress(meal)}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {meal.name}
        </Text>
        <Text style={[styles.macros, { color: colors.placeholder }]}>{macroSummary}</Text>
      </View>
      <Text style={[styles.calories, { color: colors.tint }]}>
        {meal.totalCalories}
        <Text style={[styles.kcal, { color: colors.placeholder }]}> kcal</Text>
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  left: {
    flex: 1,
    marginRight: SPACING.md,
  },
  name: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    marginBottom: 2,
  },
  macros: {
    fontSize: FONT_SIZE.sm,
  },
  calories: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  kcal: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '400',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/SavedMealCard.tsx
git commit -m "feat: SavedMealCard component with long-press rename/delete"
```

---

### Task 5: logFlowStore — add pendingMeal

**Files:**
- Modify: `store/logFlowStore.ts`

The `confirm-meal` screen needs the selected meal available without URL params, same pattern as `pendingItem`.

- [ ] **Step 1: Update the store**

Replace the full contents of `store/logFlowStore.ts`:

```typescript
// store/logFlowStore.ts
import { create } from 'zustand';
import type { SavedMeal, SearchResult } from '@/types';

// Transient store — holds the item/meal being reviewed on the Confirm screens.
// Not persisted; cleared after the user confirms or cancels.
interface LogFlowState {
  pendingItem: SearchResult | null;
  setPendingItem: (item: SearchResult) => void;
  clearPendingItem: () => void;
  pendingMeal: SavedMeal | null;
  setPendingMeal: (meal: SavedMeal) => void;
  clearPendingMeal: () => void;
}

export const useLogFlowStore = create<LogFlowState>()((set) => ({
  pendingItem: null,
  setPendingItem: (item) => set({ pendingItem: item }),
  clearPendingItem: () => set({ pendingItem: null }),
  pendingMeal: null,
  setPendingMeal: (meal) => set({ pendingMeal: meal }),
  clearPendingMeal: () => set({ pendingMeal: null }),
}));
```

- [ ] **Step 2: Commit**

```bash
git add store/logFlowStore.ts
git commit -m "feat: add pendingMeal to logFlowStore"
```

---

### Task 6: confirm-meal screen

**Files:**
- Create: `app/confirm-meal.tsx`

This screen receives `pendingMeal` from `logFlowStore`. It shows each food item in the meal, a quantity multiplier input (default `1`), scaled totals, and an "Add to Log" button that logs all items.

- [ ] **Step 1: Write the screen**

```typescript
// app/confirm-meal.tsx
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/constants/Spacing';
import { useLogFlowStore } from '@/store/logFlowStore';
import { useDailyLogStore } from '@/store/dailyLogStore';
import { getTodayDateString } from '@/utils/dateUtils';
import type { FoodLogItem } from '@/types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function ConfirmMealScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const pendingMeal = useLogFlowStore((s) => s.pendingMeal);
  const clearPendingMeal = useLogFlowStore((s) => s.clearPendingMeal);
  const addFoodItem = useDailyLogStore((s) => s.addFoodItem);

  const [multiplierText, setMultiplierText] = useState('1');

  const multiplier = useMemo(() => {
    const parsed = parseFloat(multiplierText);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [multiplierText]);

  const scaledTotals = useMemo(() => {
    if (!pendingMeal || multiplier === 0) return null;
    return {
      calories: Math.round(pendingMeal.totalCalories * multiplier),
      proteinG: Math.round(pendingMeal.totalProteinG * multiplier * 10) / 10,
      carbsG: Math.round(pendingMeal.totalCarbsG * multiplier * 10) / 10,
      fatG: Math.round(pendingMeal.totalFatG * multiplier * 10) / 10,
    };
  }, [pendingMeal, multiplier]);

  const handleAddToLog = useCallback(() => {
    if (!pendingMeal || multiplier === 0) return;
    const today = getTodayDateString();
    const baseTimestamp = Date.now();

    pendingMeal.items.forEach((item, index) => {
      const logItem: FoodLogItem = {
        id: generateId(),
        date: today,
        timestamp: new Date(baseTimestamp + index).toISOString(),
        foodName: item.foodName,
        brandName: item.brandName,
        servingSize: item.servingSize,
        servingQuantity: item.servingQuantity * multiplier,
        calories: Math.round(item.calories * multiplier),
        proteinG: Math.round(item.proteinG * multiplier * 10) / 10,
        carbsG: Math.round(item.carbsG * multiplier * 10) / 10,
        fatG: Math.round(item.fatG * multiplier * 10) / 10,
        source: item.source,
      };
      addFoodItem(logItem);
    });

    clearPendingMeal();
    router.navigate('/(tabs)');
  }, [pendingMeal, multiplier, addFoodItem, clearPendingMeal]);

  if (!pendingMeal) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Log Meal' }} />
        <Text style={[styles.errorText, { color: colors.danger }]}>
          No meal selected. Please go back and choose a meal.
        </Text>
      </View>
    );
  }

  const canAdd = multiplier > 0 && scaledTotals !== null;

  const itemRows = pendingMeal.items.map((item, i) => (
    <View
      key={i}
      style={[styles.itemRow, { borderBottomColor: colors.border }]}
    >
      <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
        {item.foodName}
      </Text>
      <Text style={[styles.itemCalories, { color: colors.placeholder }]}>
        {Math.round(item.calories * (multiplier || 1))} kcal
      </Text>
    </View>
  ));

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          title: 'Log Meal',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <FlatList
        data={[]}
        renderItem={null}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + SPACING.xl },
        ]}
        ListHeaderComponent={
          <View style={styles.inner}>
            {/* Meal name */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.mealName, { color: colors.text }]}>{pendingMeal.name}</Text>
              <Text style={[styles.itemCount, { color: colors.placeholder }]}>
                {pendingMeal.items.length} item{pendingMeal.items.length !== 1 ? 's' : ''}
              </Text>
            </View>

            {/* Multiplier */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionLabel, { color: colors.placeholder }]}>Quantity</Text>
              <View style={styles.multiplierRow}>
                <TextInput
                  style={[styles.multiplierInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  value={multiplierText}
                  onChangeText={setMultiplierText}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                  maxLength={4}
                />
                <Text style={[styles.multiplierLabel, { color: colors.text }]}>× serving</Text>
              </View>
            </View>

            {/* Totals */}
            {scaledTotals && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.sectionLabel, { color: colors.placeholder }]}>Totals</Text>
                <Text style={[styles.totalCalories, { color: colors.text }]}>
                  {scaledTotals.calories}
                  <Text style={[styles.kcalUnit, { color: colors.placeholder }]}> kcal</Text>
                </Text>
                <Text style={[styles.macroLine, { color: colors.placeholder }]}>
                  P {scaledTotals.proteinG}g · C {scaledTotals.carbsG}g · F {scaledTotals.fatG}g
                </Text>
              </View>
            )}

            {/* Item breakdown */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionLabel, { color: colors.placeholder }]}>Items</Text>
              {itemRows}
            </View>

            {/* Add button */}
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: canAdd ? colors.tint : colors.border }]}
              onPress={handleAddToLog}
              disabled={!canAdd}
              activeOpacity={0.8}
            >
              <Text style={[styles.addButtonText, { color: canAdd ? '#FFFFFF' : colors.placeholder }]}>
                Add to Log
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  content: { flexGrow: 1 },
  inner: { padding: SPACING.md, gap: SPACING.md },
  card: { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.lg },
  mealName: { fontSize: FONT_SIZE.xl, fontWeight: '700' },
  itemCount: { fontSize: FONT_SIZE.sm, marginTop: SPACING.xs },
  sectionLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  multiplierRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  multiplierInput: {
    width: 80,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    textAlign: 'center',
  },
  multiplierLabel: { fontSize: FONT_SIZE.lg, fontWeight: '500' },
  totalCalories: { fontSize: FONT_SIZE.xxxl, fontWeight: '700' },
  kcalUnit: { fontSize: FONT_SIZE.lg, fontWeight: '400' },
  macroLine: { fontSize: FONT_SIZE.sm, marginTop: SPACING.xs },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemName: { fontSize: FONT_SIZE.md, flex: 1, marginRight: SPACING.sm },
  itemCalories: { fontSize: FONT_SIZE.sm },
  addButton: { height: 56, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.sm },
  addButtonText: { fontSize: FONT_SIZE.lg, fontWeight: '700' },
  errorText: { fontSize: FONT_SIZE.md, textAlign: 'center' },
});
```

- [ ] **Step 2: Register screen in `app/_layout.tsx`**

Add after the `confirm-food` Stack.Screen:
```tsx
<Stack.Screen name="confirm-meal" options={{ headerShown: true }} />
```

- [ ] **Step 3: Commit**

```bash
git add app/confirm-meal.tsx app/_layout.tsx
git commit -m "feat: confirm-meal screen for re-logging saved meals"
```

---

### Task 7: Meals tab screen

**Files:**
- Replace: `app/(tabs)/meals.tsx`

- [ ] **Step 1: Write the screen**

```typescript
// app/(tabs)/meals.tsx
import { useCallback, useMemo } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import { SavedMealCard } from '@/components/SavedMealCard';
import Colors from '@/constants/Colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/constants/Spacing';
import { useSavedMeals } from '@/hooks/useSavedMeals';
import { useLogFlowStore } from '@/store/logFlowStore';
import type { SavedMeal } from '@/types';

export default function MealsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { query, setQuery, filteredMeals, renameMeal, deleteMeal } = useSavedMeals();
  const setPendingMeal = useLogFlowStore((s) => s.setPendingMeal);

  const handleSelect = useCallback(
    (meal: SavedMeal) => {
      setPendingMeal(meal);
      router.push('/confirm-meal');
    },
    [setPendingMeal],
  );

  const handleRename = useCallback(
    (id: string, currentName: string) => {
      Alert.prompt(
        'Rename Meal',
        undefined,
        (newName) => {
          const trimmed = newName?.trim();
          if (trimmed) renameMeal(id, trimmed);
        },
        'plain-text',
        currentName,
      );
    },
    [renameMeal],
  );

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert('Delete Meal', 'Are you sure you want to delete this meal?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMeal(id) },
      ]);
    },
    [deleteMeal],
  );

  const listHeader = useMemo(
    () => (
      <View style={[styles.headerSection, { paddingTop: insets.top + SPACING.md }]}>
        <Text style={[styles.heading, { color: colors.text }]}>Saved Meals</Text>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          placeholder="Search meals…"
          placeholderTextColor={colors.placeholder}
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
        />
      </View>
    ),
    [insets.top, colors, query, setQuery],
  );

  const emptyComponent = useMemo(
    () => (
      <View style={styles.empty}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No saved meals yet</Text>
        <Text style={[styles.emptyBody, { color: colors.placeholder }]}>
          When you log a food item, tap "Save as Meal" to store it here for quick re-logging.
        </Text>
      </View>
    ),
    [colors],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList<SavedMeal>
        data={filteredMeals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SavedMealCard
            meal={item}
            onPress={handleSelect}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyComponent}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + SPACING.xl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { flexGrow: 1 },
  headerSection: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.md },
  heading: { fontSize: FONT_SIZE.xxl, fontWeight: '700', marginBottom: SPACING.md },
  searchInput: {
    height: 44,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZE.md,
  },
  empty: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl, alignItems: 'center' },
  emptyTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', marginBottom: SPACING.sm },
  emptyBody: { fontSize: FONT_SIZE.md, textAlign: 'center', lineHeight: FONT_SIZE.md * 1.5 },
});
```

- [ ] **Step 2: Commit**

```bash
git add "app/(tabs)/meals.tsx"
git commit -m "feat: meals tab — searchable FlatList of saved meals"
```

---

### Task 8: "Save as Meal" on confirm-food screen

**Files:**
- Modify: `app/confirm-food.tsx`

Add a "Save as Meal" button below the macros. When tapped it shows an `Alert.prompt` for a meal name, then creates and saves a `SavedMeal` from `pendingItem` and the current quantity.

- [ ] **Step 1: Add the button to confirm-food.tsx**

Add these imports:
```typescript
import { Alert } from 'react-native';
import { useSavedMealsStore } from '@/store/savedMealsStore';
```

Add this hook call inside the component (after existing hooks):
```typescript
const addSavedMeal = useSavedMealsStore((s) => s.addMeal);
```

Add this handler (after `handleAddToLog`):
```typescript
const handleSaveAsMeal = useCallback(() => {
  if (!pendingItem || !scaled) return;
  Alert.prompt(
    'Save as Meal',
    'Give this meal a name',
    (name) => {
      const trimmed = name?.trim();
      if (!trimmed) return;
      addSavedMeal({
        id: generateId(),
        name: trimmed,
        createdAt: new Date().toISOString(),
        items: [
          {
            foodName: pendingItem.foodName,
            brandName: pendingItem.brandName,
            servingSize: pendingItem.servingSize,
            servingQuantity: quantity,
            calories: scaled.calories,
            proteinG: scaled.proteinG,
            carbsG: scaled.carbsG,
            fatG: scaled.fatG,
            source: pendingItem.source === 'barcode' ? 'barcode' : pendingItem.source,
          },
        ],
        totalCalories: scaled.calories,
        totalProteinG: scaled.proteinG,
        totalCarbsG: scaled.carbsG,
        totalFatG: scaled.fatG,
      });
    },
    'plain-text',
    pendingItem.foodName,
  );
}, [pendingItem, scaled, quantity, addSavedMeal]);
```

Add this button in JSX, between the MacroBar and the "Add to Log" button:
```tsx
{scaled && (
  <TouchableOpacity
    style={[styles.saveButton, { borderColor: colors.tint }]}
    onPress={handleSaveAsMeal}
    activeOpacity={0.8}
  >
    <Text style={[styles.saveButtonText, { color: colors.tint }]}>Save as Meal</Text>
  </TouchableOpacity>
)}
```

Add these styles to the StyleSheet:
```typescript
saveButton: {
  height: 48,
  borderRadius: BORDER_RADIUS.lg,
  borderWidth: 1.5,
  alignItems: 'center',
  justifyContent: 'center',
},
saveButtonText: {
  fontSize: FONT_SIZE.md,
  fontWeight: '600',
},
```

Also update the `source` type handling in `handleAddToLog` — `FoodLogItem.source` accepts `'barcode'` directly from `pendingItem.source` now that `SearchResult.source` includes `'barcode'`.

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: all tests pass (count ≥ 51).

- [ ] **Step 3: Commit**

```bash
git add app/confirm-food.tsx store/savedMealsStore.ts
git commit -m "feat: Save as Meal button on confirm-food screen"
```

---

### Task 9: Final integration commit

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "[step 7] saved meals — store, meals tab, save-as-meal, re-log with multiplier"
```
