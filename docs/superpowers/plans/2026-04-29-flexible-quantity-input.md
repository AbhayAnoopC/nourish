# Flexible Quantity Input Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the rigid `× 100g` quantity multiplier on `confirm-food.tsx` with a chip-based picker driven by USDA portion data plus user-saved custom servings (fuzzy-matched by food name).

**Architecture:** Three layers, built bottom-up: (1) data — token types, custom-servings store, dailyLogStore migration; (2) sourcing — USDA service surfaces portions, OFF surfaces serving grams, a `useServingOptions` hook composes the chip array; (3) UI — chip rail + custom amount input replaces the existing multiplier on `confirm-food.tsx`, plus a small "Saved servings" management list in Settings. Existing `FoodLogItem` entries are migrated lazily on first load via Zustand `persist` migrate hook.

**Tech Stack:** React Native (Expo SDK 54), TypeScript strict, Zustand persist, USDA FoodData Central API, OpenFoodFacts API. No new native dependencies.

**Spec:** `docs/superpowers/specs/2026-04-29-flexible-quantity-input-design.md`

---

## File Map

### New files (created by this plan)

**Types:** *(modifies `types/index.ts` only — no new file)*

**Utils (with tests):**
- `utils/normalizeFoodName.ts` + `utils/normalizeFoodName.test.ts`
- `utils/volumeConversions.ts` + `utils/volumeConversions.test.ts`
- `utils/parseCustomAmount.ts` + `utils/parseCustomAmount.test.ts`

**Store (with tests):**
- `store/customServingsStore.ts` + `store/customServingsStore.test.ts`

**Hook:**
- `hooks/useServingOptions.ts`

**Components:**
- `components/ServingChip.tsx`
- `components/SaveCustomServingModal.tsx`
- `components/QuantityInput.tsx`
- `components/SavedServingsList.tsx`

### Modified files

- `types/index.ts` — add `CustomServing`, `ServingOption`, `FoodPortion` types; modify `SearchResult` and `FoodLogItem`.
- `services/usda.ts` — fetch + parse `foodPortions`.
- `services/usda.test.ts` — add coverage for portion parsing.
- `services/openFoodFacts.ts` — extract `servingGrams` when present.
- `services/openFoodFacts.test.ts` — add coverage for serving extraction.
- `store/dailyLogStore.ts` — bump persist `version` to 2 + add `migrate`.
- `store/dailyLogStore.test.ts` — *(create if missing)* add coverage for migration.
- `app/confirm-food.tsx` — replace existing quantity input section with `QuantityInput`.
- `app/confirm-meal.tsx` — minimal compile-fix for the new `FoodLogItem` shape (full restyling deferred to meal-builder spec).
- `app/(tabs)/settings.tsx` — add "Saved servings" section using `SavedServingsList`.
- `components/FoodLogRow.tsx` — read `servingLabel` instead of `servingQuantity` + `servingSize`.
- `hooks/useDailyLog.ts` — no shape change needed but verify it doesn't reference the old fields.

### Deleted files

None.

---

## Conventions

- **Branch:** Implement on `feature/quantity-input` branched off `feature/ui-redesign`. The redesign brings the tokens, type styles, and `Type.*` constants this plan depends on. Create a worktree at `.worktrees/quantity-input` to keep work isolated. (See **Setup** below.)
- **Tests:** Run via `npm test` (Jest, `testEnvironment: node`). Test patterns: `utils/*.test.ts`, `services/*.test.ts`, `store/*.test.ts`, `hooks/*.test.ts`. Visual components are NOT tested (consistent with existing project conventions).
- **Type safety:** TypeScript strict on. No `any`. Each component's props have an explicit interface above the component.
- **Styles:** Always `StyleSheet.create()` at the bottom; never inline `style={{ }}` literals.
- **Tokens at consumption sites:** Read tokens via `useTokens()` and `Type.*` from `@/constants/Typography`. Never hard-code hex values.
- **Commits + push:** One commit per task. Message format `[quantity-input] <task summary>`. After every commit run `git push` immediately — the project rule is "always push after every commit."

---

## Setup (one-time, before Task 1)

- [ ] **Step 1: Create the worktree from the redesign branch**

Run from the main repo root (`C:/Users/ASUS/Desktop/Abhay_projects/calorie-tracker`):

```bash
git worktree add -b feature/quantity-input .worktrees/quantity-input feature/ui-redesign
```

- [ ] **Step 2: Push the new branch with upstream tracking**

Run from inside the new worktree (`C:/Users/ASUS/Desktop/Abhay_projects/calorie-tracker/.worktrees/quantity-input`):

```bash
git push -u origin feature/quantity-input
```

- [ ] **Step 3: Verify clean baseline**

```bash
npx tsc --noEmit
npm test -- --silent
```

Expected: zero TypeScript errors, all 92 existing tests pass.

---

## Task 1: Update `types/index.ts`

**Files:**
- Modify: `types/index.ts`
- Modify: `app/confirm-food.tsx` — minimal compile-fix
- Modify: `app/confirm-meal.tsx` — minimal compile-fix
- Modify: `components/FoodLogRow.tsx` — minimal compile-fix

- [ ] **Step 1: Modify `types/index.ts`**

Replace the existing `FoodLogItem` interface and `SearchResult` interface, and add the new ones. The full replacement file — keep all existing exports above and below the changed sections:

```typescript
export interface UserProfile {
  name?: string;
  sex: 'male' | 'female' | 'other';
  dateOfBirth: string;
  heightCm: number;
  weightKg: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very' | 'extreme';
  goal: 'lose' | 'maintain' | 'gain';
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  dailyCarbTarget: number;
  dailyFatTarget: number;
  dailyWaterTargetMl: number;
  units: 'metric' | 'imperial';
  onboardingComplete: boolean;
}

export interface FoodLogItem {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO datetime
  foodName: string;
  brandName?: string;
  servingLabel: string; // pre-formatted, e.g. "1 large breast" or "150 g"
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: 'usda' | 'openfoodfacts' | 'photo' | 'barcode' | 'label' | 'voice' | 'manual';
}

export interface DailyLog {
  date: string;
  foodItems: FoodLogItem[];
  waterMl: number;
  caloriesBurned: number;
  caloriesBurnedSource: 'zepp' | 'healthconnect' | 'applehealth' | 'manual';
  bodyWeightKg?: number;
}

export interface SavedMeal {
  id: string;
  name: string;
  createdAt: string;
  items: Omit<FoodLogItem, 'id' | 'date' | 'timestamp'>[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
}

export type ActivityLevel = UserProfile['activityLevel'];
export type Goal = UserProfile['goal'];
export type FoodSource = FoodLogItem['source'];
export type CaloriesBurnedSource = DailyLog['caloriesBurnedSource'];
export type AmazfitConnectionTier = 'zepp' | 'healthconnect' | 'applehealth' | 'manual' | 'none';

export interface FoodPortion {
  label: string;       // e.g. "1 cup, chopped"
  gramWeight: number;  // e.g. 142
}

export interface SearchResult {
  id: string;
  foodName: string;
  brandName?: string;
  servingSize: string;
  calories: number; // kcal per 100g
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: 'usda' | 'openfoodfacts' | 'barcode';
  foodPortions?: FoodPortion[];   // populated by USDA service when available
  servingGrams?: number;          // populated by OFF service when available (single serving)
}

export interface CustomServing {
  id: string;
  matchKey: string;  // normalized food name to match, e.g. "chicken breast"
  label: string;     // e.g. "1 large breast"
  grams: number;     // e.g. 220
  createdAt: string;
}

export interface ServingOption {
  label: string;
  grams: number;
  source: 'usda' | 'off' | 'custom' | 'fallback';
  customId?: string;
  isFuzzyMatch?: boolean; // true when source = 'custom' and matchKey != normalized food name
}

export type { WeightEntry } from '@/utils/sparklineData';
```

- [ ] **Step 2: Compile-fix `components/FoodLogRow.tsx`**

In `components/FoodLogRow.tsx`, find the row that currently reads:

```typescript
{item.servingQuantity} × {item.servingSize} · {formatTime(item.timestamp)}
```

Replace with:

```typescript
{item.servingLabel} · {formatTime(item.timestamp)}
```

- [ ] **Step 3: Compile-fix `app/confirm-food.tsx`**

Find the block that currently constructs the new `FoodLogItem`:

```typescript
const item: FoodLogItem = {
  id: generateId(),
  date: getTodayDateString(),
  timestamp: new Date().toISOString(),
  foodName: pendingItem.foodName,
  brandName: pendingItem.brandName,
  servingSize: pendingItem.servingSize,
  servingQuantity: quantity,
  calories: scaled.calories,
  proteinG: scaled.proteinG,
  carbsG: scaled.carbsG,
  fatG: scaled.fatG,
  source: pendingItem.source,
};
```

Replace with:

```typescript
const item: FoodLogItem = {
  id: generateId(),
  date: getTodayDateString(),
  timestamp: new Date().toISOString(),
  foodName: pendingItem.foodName,
  brandName: pendingItem.brandName,
  servingLabel: quantity !== 1 ? `${quantity} × ${pendingItem.servingSize}` : pendingItem.servingSize,
  calories: scaled.calories,
  proteinG: scaled.proteinG,
  carbsG: scaled.carbsG,
  fatG: scaled.fatG,
  source: pendingItem.source,
};
```

Also update the "Save as Meal" block (further down in the same file) which constructs `items: [{...}]` — replace its `servingSize` and `servingQuantity` lines with `servingLabel` using the same expression.

(Task 13 will replace the whole quantity input UI; this step is just a temporary compile-fix.)

- [ ] **Step 4: Compile-fix `app/confirm-meal.tsx`**

In `app/confirm-meal.tsx`, find the block constructing `logItem: FoodLogItem`:

```typescript
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
```

Replace with:

```typescript
const itemAny = item as unknown as { servingLabel?: string; servingSize?: string; servingQuantity?: number };
const baseLabel = itemAny.servingLabel ?? `${itemAny.servingQuantity ?? 1} × ${itemAny.servingSize ?? '100g'}`;
const logItem: FoodLogItem = {
  id: generateId(),
  date: today,
  timestamp: new Date(baseTimestamp + index).toISOString(),
  foodName: item.foodName,
  brandName: item.brandName,
  servingLabel: multiplier !== 1 ? `${multiplier} × ${baseLabel}` : baseLabel,
  calories: Math.round(item.calories * multiplier),
  proteinG: Math.round(item.proteinG * multiplier * 10) / 10,
  carbsG: Math.round(item.carbsG * multiplier * 10) / 10,
  fatG: Math.round(item.fatG * multiplier * 10) / 10,
  source: item.source,
};
```

The `as unknown as { servingLabel?: string; ... }` cast is a temporary bridge for `SavedMeal.items` which still carry the old shape from previously persisted data. The migration in Task 6 will normalize all log entries; saved meals migrate when their `addSavedMeal` action runs again.

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 6: Run tests**

```bash
npm test -- --silent
```

Expected: all 92 existing tests still pass.

- [ ] **Step 7: Commit + push**

```bash
git add types/index.ts components/FoodLogRow.tsx app/confirm-food.tsx app/confirm-meal.tsx
git commit -m "[quantity-input] add CustomServing/ServingOption/FoodPortion types; switch FoodLogItem to servingLabel"
git push
```

---

## Task 2: `utils/normalizeFoodName.ts` (TDD)

**Files:**
- Create: `utils/normalizeFoodName.ts`
- Create: `utils/normalizeFoodName.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `utils/normalizeFoodName.test.ts`:

```typescript
import {
  normalizeFoodName,
  tokenize,
  isFuzzyMatch,
  isExactMatch,
} from './normalizeFoodName';

describe('normalizeFoodName', () => {
  it('lowercases and trims', () => {
    expect(normalizeFoodName('  Chicken Breast  ')).toBe('chicken breast');
  });

  it('strips punctuation and collapses whitespace', () => {
    expect(normalizeFoodName('Chicken breast, raw (boneless)')).toBe(
      'chicken breast raw boneless',
    );
  });

  it('preserves unicode letters and digits', () => {
    expect(normalizeFoodName('Café — 80g')).toBe('café 80g');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(normalizeFoodName('   ')).toBe('');
  });
});

describe('tokenize', () => {
  it('splits on whitespace and drops tokens shorter than 2 chars', () => {
    expect(tokenize('chicken breast a b')).toEqual(['chicken', 'breast']);
  });

  it('returns an empty array for empty input', () => {
    expect(tokenize('')).toEqual([]);
  });
});

describe('isExactMatch', () => {
  it('matches identical normalized names', () => {
    expect(isExactMatch('Chicken Breast', 'chicken breast')).toBe(true);
  });

  it('does not match when names differ', () => {
    expect(isExactMatch('chicken breast', 'chicken breast, raw')).toBe(false);
  });
});

describe('isFuzzyMatch', () => {
  it('returns true when all matchKey tokens appear in food name', () => {
    expect(isFuzzyMatch('chicken breast', 'Boneless skinless chicken breast')).toBe(true);
  });

  it('returns false when any matchKey token is absent', () => {
    expect(isFuzzyMatch('chicken thigh', 'Boneless skinless chicken breast')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isFuzzyMatch('CHICKEN', 'Chicken Breast')).toBe(true);
  });

  it('returns false when matchKey produces no tokens (e.g., all 1-char)', () => {
    expect(isFuzzyMatch('a b', 'Chicken Breast')).toBe(false);
  });

  it('returns false when food name is empty', () => {
    expect(isFuzzyMatch('chicken', '')).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- utils/normalizeFoodName.test.ts
```

Expected: FAIL with "Cannot find module './normalizeFoodName'".

- [ ] **Step 3: Write the implementation**

Create `utils/normalizeFoodName.ts`:

```typescript
export function normalizeFoodName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(name: string): string[] {
  const normalized = normalizeFoodName(name);
  if (normalized === '') return [];
  return normalized.split(' ').filter((t) => t.length >= 2);
}

export function isExactMatch(matchKey: string, foodName: string): boolean {
  return normalizeFoodName(matchKey) === normalizeFoodName(foodName);
}

export function isFuzzyMatch(matchKey: string, foodName: string): boolean {
  const matchTokens = tokenize(matchKey);
  if (matchTokens.length === 0) return false;
  const nameTokens = new Set(tokenize(foodName));
  if (nameTokens.size === 0) return false;
  return matchTokens.every((t) => nameTokens.has(t));
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test -- utils/normalizeFoodName.test.ts
```

Expected: PASS, all 13 tests green.

- [ ] **Step 5: Commit + push**

```bash
git add utils/normalizeFoodName.ts utils/normalizeFoodName.test.ts
git commit -m "[quantity-input] add normalizeFoodName + tokenize + match utils with tests"
git push
```

---

## Task 3: `utils/volumeConversions.ts` (TDD)

**Files:**
- Create: `utils/volumeConversions.ts`
- Create: `utils/volumeConversions.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `utils/volumeConversions.test.ts`:

```typescript
import { ML_PER_UNIT, modifierToMl } from './volumeConversions';

describe('ML_PER_UNIT', () => {
  it('has correct conversion factors', () => {
    expect(ML_PER_UNIT.ml).toBe(1);
    expect(ML_PER_UNIT.cup).toBeCloseTo(236.588, 3);
    expect(ML_PER_UNIT.tbsp).toBeCloseTo(14.7868, 4);
    expect(ML_PER_UNIT.tsp).toBeCloseTo(4.92892, 5);
    expect(ML_PER_UNIT['fl oz']).toBeCloseTo(29.5735, 4);
  });
});

describe('modifierToMl', () => {
  it('detects cup', () => {
    expect(modifierToMl('cup, chopped')).toBeCloseTo(236.588, 3);
    expect(modifierToMl('1 cup')).toBeCloseTo(236.588, 3);
  });

  it('detects tablespoon', () => {
    expect(modifierToMl('tbsp')).toBeCloseTo(14.7868, 4);
    expect(modifierToMl('tablespoon')).toBeCloseTo(14.7868, 4);
  });

  it('detects teaspoon', () => {
    expect(modifierToMl('tsp')).toBeCloseTo(4.92892, 5);
    expect(modifierToMl('teaspoon')).toBeCloseTo(4.92892, 5);
  });

  it('detects fl oz', () => {
    expect(modifierToMl('fl oz')).toBeCloseTo(29.5735, 4);
    expect(modifierToMl('fluid ounce')).toBeCloseTo(29.5735, 4);
  });

  it('detects ml', () => {
    expect(modifierToMl('ml')).toBe(1);
    expect(modifierToMl('100 ml')).toBe(1);
  });

  it('returns null for non-volume modifiers', () => {
    expect(modifierToMl('breast, half')).toBeNull();
    expect(modifierToMl('medium')).toBeNull();
    expect(modifierToMl('g')).toBeNull();
    expect(modifierToMl('')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- utils/volumeConversions.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Write the implementation**

Create `utils/volumeConversions.ts`:

```typescript
export const ML_PER_UNIT = {
  ml: 1,
  cup: 236.588,
  tbsp: 14.7868,
  tsp: 4.92892,
  'fl oz': 29.5735,
} as const;

export type VolumeUnit = keyof typeof ML_PER_UNIT;

export function modifierToMl(modifier: string): number | null {
  const lc = modifier.toLowerCase();
  // Order matters: longer matches first (e.g., "tablespoon" before "ml")
  if (lc.includes('fluid ounce') || lc.includes('fl oz') || lc.includes('fl. oz')) {
    return ML_PER_UNIT['fl oz'];
  }
  if (lc.includes('tablespoon') || /\btbsp\b/.test(lc)) {
    return ML_PER_UNIT.tbsp;
  }
  if (lc.includes('teaspoon') || /\btsp\b/.test(lc)) {
    return ML_PER_UNIT.tsp;
  }
  if (/\bcup\b/.test(lc)) {
    return ML_PER_UNIT.cup;
  }
  if (/\bml\b/.test(lc)) {
    return ML_PER_UNIT.ml;
  }
  return null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test -- utils/volumeConversions.test.ts
```

Expected: PASS, all 7 tests green.

- [ ] **Step 5: Commit + push**

```bash
git add utils/volumeConversions.ts utils/volumeConversions.test.ts
git commit -m "[quantity-input] add volume conversion table + modifierToMl util with tests"
git push
```

---

## Task 4: `utils/parseCustomAmount.ts` (TDD)

**Files:**
- Create: `utils/parseCustomAmount.ts`
- Create: `utils/parseCustomAmount.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `utils/parseCustomAmount.test.ts`:

```typescript
import { parseCustomAmount } from './parseCustomAmount';

describe('parseCustomAmount', () => {
  it('passes grams through directly', () => {
    expect(parseCustomAmount(150, 'g')).toBe(150);
  });

  it('converts ounces to grams', () => {
    expect(parseCustomAmount(1, 'oz')).toBeCloseTo(28.35, 2);
    expect(parseCustomAmount(4, 'oz')).toBeCloseTo(113.4, 1);
  });

  it('converts ml to grams when density is provided', () => {
    expect(parseCustomAmount(100, 'ml', 1)).toBe(100);
    expect(parseCustomAmount(100, 'ml', 1.03)).toBeCloseTo(103, 0);
  });

  it('throws when ml is requested without density', () => {
    expect(() => parseCustomAmount(100, 'ml')).toThrow(/density/i);
  });

  it('rounds to 1 decimal place', () => {
    expect(parseCustomAmount(0.789, 'oz')).toBeCloseTo(22.4, 1);
  });

  it('handles zero', () => {
    expect(parseCustomAmount(0, 'g')).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- utils/parseCustomAmount.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Write the implementation**

Create `utils/parseCustomAmount.ts`:

```typescript
export type CustomAmountUnit = 'g' | 'ml' | 'oz';

const GRAMS_PER_OZ = 28.349523125;

export function parseCustomAmount(
  value: number,
  unit: CustomAmountUnit,
  gramsPerMl?: number,
): number {
  let grams: number;
  switch (unit) {
    case 'g':
      grams = value;
      break;
    case 'oz':
      grams = value * GRAMS_PER_OZ;
      break;
    case 'ml':
      if (gramsPerMl === undefined) {
        throw new Error(
          'parseCustomAmount: density (gramsPerMl) is required when converting ml',
        );
      }
      grams = value * gramsPerMl;
      break;
  }
  return Math.round(grams * 10) / 10;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test -- utils/parseCustomAmount.test.ts
```

Expected: PASS, all 6 tests green.

- [ ] **Step 5: Commit + push**

```bash
git add utils/parseCustomAmount.ts utils/parseCustomAmount.test.ts
git commit -m "[quantity-input] add parseCustomAmount util with tests"
git push
```

---

## Task 5: `store/customServingsStore.ts` (TDD)

**Files:**
- Create: `store/customServingsStore.ts`
- Create: `store/customServingsStore.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `store/customServingsStore.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- store/customServingsStore.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Write the implementation**

Create `store/customServingsStore.ts`:

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CustomServing } from '@/types';
import { isFuzzyMatch } from '@/utils/normalizeFoodName';

interface CustomServingsState {
  customs: CustomServing[];
  addCustom: (input: Omit<CustomServing, 'id' | 'createdAt'>) => CustomServing;
  removeCustom: (id: string) => void;
  findMatchesForFood: (foodName: string) => CustomServing[];
}

function generateId(): string {
  return `cs-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useCustomServingsStore = create<CustomServingsState>()(
  persist(
    (set, get) => ({
      customs: [],

      addCustom: (input) => {
        const created: CustomServing = {
          ...input,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ customs: [...state.customs, created] }));
        return created;
      },

      removeCustom: (id) => {
        set((state) => ({ customs: state.customs.filter((c) => c.id !== id) }));
      },

      findMatchesForFood: (foodName) => {
        return get().customs.filter((c) => isFuzzyMatch(c.matchKey, foodName));
      },
    }),
    {
      name: 'nourish-custom-servings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test -- store/customServingsStore.test.ts
```

Expected: PASS, all 4 tests green.

- [ ] **Step 5: Commit + push**

```bash
git add store/customServingsStore.ts store/customServingsStore.test.ts
git commit -m "[quantity-input] add customServingsStore + tests"
git push
```

---

## Task 6: `dailyLogStore` migration (TDD)

**Files:**
- Modify: `store/dailyLogStore.ts`
- Create: `store/dailyLogStore.test.ts` *(if it does not exist)*

- [ ] **Step 1: Write the failing test**

Create or extend `store/dailyLogStore.test.ts` with a focused test on the migrate function. We test the pure migrate behavior, not the store integration.

```typescript
import { migrateDailyLogs } from './dailyLogStore';

describe('migrateDailyLogs', () => {
  it('converts old servingQuantity + servingSize pair into servingLabel', () => {
    const persisted = {
      logs: {
        '2026-04-28': {
          date: '2026-04-28',
          foodItems: [
            {
              id: 'a',
              date: '2026-04-28',
              timestamp: '2026-04-28T08:00:00.000Z',
              foodName: 'Apple',
              servingSize: '1 medium',
              servingQuantity: 2,
              calories: 200,
              proteinG: 0,
              carbsG: 50,
              fatG: 0,
              source: 'usda',
            },
          ],
          waterMl: 0,
          caloriesBurned: 0,
          caloriesBurnedSource: 'manual',
        },
      },
    };

    const result = migrateDailyLogs(persisted, 1);
    const item = (result as typeof persisted).logs['2026-04-28'].foodItems[0] as unknown as {
      servingLabel: string;
      servingSize?: string;
      servingQuantity?: number;
    };
    expect(item.servingLabel).toBe('2 × 1 medium');
    expect(item.servingSize).toBeUndefined();
    expect(item.servingQuantity).toBeUndefined();
  });

  it('uses bare servingSize when servingQuantity is 1', () => {
    const persisted = {
      logs: {
        '2026-04-28': {
          date: '2026-04-28',
          foodItems: [
            {
              id: 'a',
              date: '2026-04-28',
              timestamp: '2026-04-28T08:00:00.000Z',
              foodName: 'Apple',
              servingSize: '1 medium',
              servingQuantity: 1,
              calories: 100,
              proteinG: 0,
              carbsG: 25,
              fatG: 0,
              source: 'usda',
            },
          ],
          waterMl: 0,
          caloriesBurned: 0,
          caloriesBurnedSource: 'manual',
        },
      },
    };

    const result = migrateDailyLogs(persisted, 1);
    const item = (result as typeof persisted).logs['2026-04-28'].foodItems[0] as unknown as {
      servingLabel: string;
    };
    expect(item.servingLabel).toBe('1 medium');
  });

  it('is idempotent: leaves already-migrated items alone', () => {
    const persisted = {
      logs: {
        '2026-04-28': {
          date: '2026-04-28',
          foodItems: [
            {
              id: 'a',
              date: '2026-04-28',
              timestamp: '2026-04-28T08:00:00.000Z',
              foodName: 'Apple',
              servingLabel: '1 medium',
              calories: 100,
              proteinG: 0,
              carbsG: 25,
              fatG: 0,
              source: 'usda',
            },
          ],
          waterMl: 0,
          caloriesBurned: 0,
          caloriesBurnedSource: 'manual',
        },
      },
    };

    const result = migrateDailyLogs(persisted, 2);
    const item = (result as typeof persisted).logs['2026-04-28'].foodItems[0] as unknown as {
      servingLabel: string;
    };
    expect(item.servingLabel).toBe('1 medium');
  });

  it('returns persisted untouched when shape is unrecognizable', () => {
    expect(migrateDailyLogs(null, 1)).toBeNull();
    expect(migrateDailyLogs({ unknown: true }, 1)).toEqual({ unknown: true });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- store/dailyLogStore.test.ts
```

Expected: FAIL — `migrateDailyLogs` not exported.

- [ ] **Step 3: Implement and wire `migrateDailyLogs`**

In `store/dailyLogStore.ts`:

1. Add the exported migrate function near the top of the file (after imports):

```typescript
export function migrateDailyLogs(persisted: unknown, _version: number): unknown {
  if (persisted === null || persisted === undefined) return persisted;
  if (typeof persisted !== 'object') return persisted;
  const state = persisted as { logs?: Record<string, { foodItems?: unknown[] }> };
  if (!state.logs || typeof state.logs !== 'object') return persisted;

  for (const log of Object.values(state.logs)) {
    if (!log.foodItems || !Array.isArray(log.foodItems)) continue;
    for (const item of log.foodItems) {
      if (item === null || typeof item !== 'object') continue;
      const itemAny = item as Record<string, unknown>;
      if ('servingLabel' in itemAny) continue;
      if ('servingQuantity' in itemAny && 'servingSize' in itemAny) {
        const qty = itemAny.servingQuantity as number;
        const size = itemAny.servingSize as string;
        itemAny.servingLabel = qty !== 1 ? `${qty} × ${size}` : size;
        delete itemAny.servingQuantity;
        delete itemAny.servingSize;
      }
    }
  }
  return persisted;
}
```

2. In the `persist(...)` config wrapping `useDailyLogStore`, add `version: 2` and `migrate`:

```typescript
{
  name: 'nourish-daily-logs',
  storage: createJSONStorage(() => AsyncStorage),
  version: 2,
  migrate: migrateDailyLogs as never,
}
```

(The cast to `never` is because Zustand's `migrate` typing expects a return type of `T`, but at migration time the persisted shape is `unknown`. The cast is intentional and isolated.)

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test -- store/dailyLogStore.test.ts
```

Expected: PASS, all 4 tests green.

- [ ] **Step 5: Run full test suite + type check**

```bash
npx tsc --noEmit && npm test -- --silent
```

Expected: zero TypeScript errors, all tests pass.

- [ ] **Step 6: Commit + push**

```bash
git add store/dailyLogStore.ts store/dailyLogStore.test.ts
git commit -m "[quantity-input] migrate FoodLogItem old shape to servingLabel (persist version 2)"
git push
```

---

## Task 7: USDA service — fetch + parse `foodPortions`

**Files:**
- Modify: `services/usda.ts`
- Modify: `services/usda.test.ts`

- [ ] **Step 1: Write the failing test**

Open `services/usda.test.ts`. Add the following test inside the `describe('searchFoods'` block (or wherever the existing search tests live). If the file imports types/mocks at the top, reuse them.

```typescript
it('parses foodPortions when present in the response', async () => {
  const mockResponse = {
    foods: [
      {
        fdcId: 12345,
        description: 'Chicken breast, raw',
        foodNutrients: [
          { nutrientId: 1008, value: 165 },
          { nutrientId: 1003, value: 31 },
          { nutrientId: 1004, value: 3.6 },
          { nutrientId: 1005, value: 0 },
        ],
        foodPortions: [
          { amount: 1, modifier: 'breast, half', gramWeight: 172 },
          { amount: 0.5, modifier: 'breast, half', gramWeight: 86 },
          { amount: 1, modifier: 'piece', gramWeight: 0 }, // filtered out (gramWeight 0)
        ],
      },
    ],
  };

  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => mockResponse,
  }) as jest.Mock;

  const { searchFoods } = await import('./usda');
  const results = await searchFoods('chicken');

  expect(results).toHaveLength(1);
  expect(results[0].foodPortions).toBeDefined();
  expect(results[0].foodPortions).toEqual([
    { label: '0.5 breast, half', gramWeight: 86 },
    { label: '1 breast, half', gramWeight: 172 },
  ]);
});
```

If `searchFoods` is not the export name in this project, use the actual exported function (likely `searchFoods` based on conventions; verify by reading the file before writing the test).

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- services/usda.test.ts
```

Expected: FAIL — `foodPortions` is undefined or empty.

- [ ] **Step 3: Update USDA service**

In `services/usda.ts`:

1. Add to the `FdcFood` interface (top of file):

```typescript
interface FdcFoodPortion {
  amount?: number;
  modifier?: string;
  gramWeight?: number;
}

interface FdcFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  brandName?: string;
  foodNutrients: FdcNutrient[];
  foodPortions?: FdcFoodPortion[];
}
```

2. Add this helper above `mapFdcFoodToSearchResult`:

```typescript
function formatPortionAmount(amount: number): string {
  // Strip trailing zeros: 1.0 -> "1", 0.5 -> "0.5", 0.333 -> "0.333"
  return Number(amount).toString();
}

function parseFoodPortions(portions?: FdcFoodPortion[]): FoodPortion[] | undefined {
  if (!portions || portions.length === 0) return undefined;
  const parsed: FoodPortion[] = [];
  for (const p of portions) {
    if (!p.modifier || typeof p.gramWeight !== 'number' || p.gramWeight <= 0) continue;
    if (typeof p.amount !== 'number' || p.amount <= 0) continue;
    parsed.push({
      label: `${formatPortionAmount(p.amount)} ${p.modifier.trim()}`,
      gramWeight: p.gramWeight,
    });
  }
  if (parsed.length === 0) return undefined;
  parsed.sort((a, b) => a.gramWeight - b.gramWeight);
  return parsed;
}
```

3. At the top of the file, ensure `FoodPortion` is imported:

```typescript
import { FoodPortion, SearchResult } from '@/types';
```

4. In `mapFdcFoodToSearchResult`, add `foodPortions: parseFoodPortions(food.foodPortions)` to the returned object:

```typescript
function mapFdcFoodToSearchResult(food: FdcFood): SearchResult {
  return {
    id: `usda-${food.fdcId}`,
    foodName: food.description,
    brandName: food.brandOwner ?? food.brandName,
    servingSize: '100g',
    calories: Math.round(getNutrientValue(food.foodNutrients, NUTRIENT_ENERGY_KCAL)),
    proteinG: Math.round(getNutrientValue(food.foodNutrients, NUTRIENT_PROTEIN) * 10) / 10,
    carbsG: Math.round(getNutrientValue(food.foodNutrients, NUTRIENT_CARBS) * 10) / 10,
    fatG: Math.round(getNutrientValue(food.foodNutrients, NUTRIENT_FAT) * 10) / 10,
    source: 'usda',
    foodPortions: parseFoodPortions(food.foodPortions),
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test -- services/usda.test.ts
```

Expected: PASS, including the new portions test and all pre-existing tests.

- [ ] **Step 5: Commit + push**

```bash
git add services/usda.ts services/usda.test.ts
git commit -m "[quantity-input] usda service: parse foodPortions into SearchResult"
git push
```

---

## Task 8: OpenFoodFacts service — extract `servingGrams`

**Files:**
- Modify: `services/openFoodFacts.ts`
- Modify: `services/openFoodFacts.test.ts`

- [ ] **Step 1: Write the failing test**

Add the following test to `services/openFoodFacts.test.ts`:

```typescript
it('extracts servingGrams when serving_size is in grams', async () => {
  const mockResponse = {
    products: [
      {
        _id: 'abc',
        product_name: 'Test bar',
        brands: 'TestCo',
        nutriments: {
          'energy-kcal_100g': 400,
          proteins_100g: 10,
          fat_100g: 20,
          carbohydrates_100g: 50,
        },
        serving_size: '30 g',
        serving_quantity: 30,
      },
    ],
  };

  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => mockResponse,
  }) as jest.Mock;

  const { searchFoods } = await import('./openFoodFacts');
  const results = await searchFoods('test');

  expect(results).toHaveLength(1);
  expect(results[0].servingGrams).toBe(30);
});

it('does not set servingGrams when serving_size is in ml', async () => {
  const mockResponse = {
    products: [
      {
        _id: 'def',
        product_name: 'Test drink',
        nutriments: {
          'energy-kcal_100g': 50,
          proteins_100g: 1,
          fat_100g: 0,
          carbohydrates_100g: 12,
        },
        serving_size: '250 ml',
        serving_quantity: 250,
      },
    ],
  };

  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => mockResponse,
  }) as jest.Mock;

  const { searchFoods } = await import('./openFoodFacts');
  const results = await searchFoods('test');

  expect(results).toHaveLength(1);
  expect(results[0].servingGrams).toBeUndefined();
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- services/openFoodFacts.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Update OFF service**

In `services/openFoodFacts.ts`, extend the `OFFProduct` interface and the mapper:

```typescript
interface OFFProduct {
  _id: string;
  product_name?: string;
  brands?: string;
  nutriments: OFFNutriments;
  serving_size?: string;
  serving_quantity?: number;
}

function extractServingGrams(product: OFFProduct): number | undefined {
  if (typeof product.serving_quantity !== 'number') return undefined;
  if (!product.serving_size) return undefined;
  // Only accept gram-denominated servings — treat ml/oz/etc. as "no gram data"
  if (/\bg\b/i.test(product.serving_size) && !/\bml\b/i.test(product.serving_size)) {
    return product.serving_quantity;
  }
  return undefined;
}

function mapOFFProductToSearchResult(product: OFFProduct): SearchResult | null {
  const name = product.product_name?.trim();
  if (!name) return null;

  const rawKcal = product.nutriments['energy-kcal_100g'];
  const rawKj = product.nutriments['energy_100g'];
  const calories =
    rawKcal != null
      ? Math.round(rawKcal)
      : rawKj != null
        ? Math.round(rawKj / 4.184)
        : 0;

  return {
    id: `off-${product._id}`,
    foodName: name,
    brandName: product.brands?.split(',')[0]?.trim() || undefined,
    servingSize: '100g',
    calories,
    proteinG: Math.round((product.nutriments.proteins_100g ?? 0) * 10) / 10,
    carbsG: Math.round((product.nutriments.carbohydrates_100g ?? 0) * 10) / 10,
    fatG: Math.round((product.nutriments.fat_100g ?? 0) * 10) / 10,
    source: 'openfoodfacts',
    servingGrams: extractServingGrams(product),
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test -- services/openFoodFacts.test.ts
```

Expected: PASS, all tests green.

- [ ] **Step 5: Commit + push**

```bash
git add services/openFoodFacts.ts services/openFoodFacts.test.ts
git commit -m "[quantity-input] off service: extract servingGrams when serving_size is in g"
git push
```

---

## Task 9: `useServingOptions` hook

**Files:**
- Create: `hooks/useServingOptions.ts`

This hook is not unit-tested (consistent with project conventions for hooks that return composed React state). It is verified through the manual test pass at the end.

- [ ] **Step 1: Write the hook**

Create `hooks/useServingOptions.ts`:

```typescript
import { useMemo } from 'react';
import type { SearchResult, ServingOption } from '@/types';
import { useUserStore } from '@/store/userStore';
import { useCustomServingsStore } from '@/store/customServingsStore';
import { isExactMatch } from '@/utils/normalizeFoodName';

const FALLBACK_GRAMS_100 = 100;
const GRAMS_PER_OZ = 28.349523125;
const MAX_OPTIONS = 6;

export function useServingOptions(food: SearchResult): ServingOption[] {
  const profileUnits = useUserStore((s) => s.profile?.units);
  const customs = useCustomServingsStore((s) => s.findMatchesForFood(food.foodName));

  return useMemo(() => {
    const options: ServingOption[] = [];

    if (food.foodPortions) {
      for (const p of food.foodPortions) {
        options.push({ label: p.label, grams: p.gramWeight, source: 'usda' });
      }
    }

    if (food.source === 'openfoodfacts' && typeof food.servingGrams === 'number' && food.servingGrams > 0) {
      options.push({
        label: `${food.servingGrams} g (serving)`,
        grams: food.servingGrams,
        source: 'off',
      });
    }

    for (const c of customs) {
      options.push({
        label: c.label,
        grams: c.grams,
        source: 'custom',
        customId: c.id,
        isFuzzyMatch: !isExactMatch(c.matchKey, food.foodName),
      });
    }

    options.push({ label: '100 g', grams: FALLBACK_GRAMS_100, source: 'fallback' });
    if (profileUnits === 'imperial') {
      options.push({ label: '1 oz', grams: GRAMS_PER_OZ, source: 'fallback' });
    }

    // Dedupe by gramWeight (0.5g buckets); earlier-pushed wins.
    const seen = new Map<number, ServingOption>();
    for (const opt of options) {
      const key = Math.round(opt.grams * 2) / 2;
      if (!seen.has(key)) seen.set(key, opt);
    }

    return Array.from(seen.values()).slice(0, MAX_OPTIONS);
  }, [food, customs, profileUnits]);
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit + push**

```bash
git add hooks/useServingOptions.ts
git commit -m "[quantity-input] add useServingOptions hook composing chips from USDA/OFF/customs"
git push
```

---

## Task 10: `components/ServingChip.tsx`

**Files:**
- Create: `components/ServingChip.tsx`

- [ ] **Step 1: Write the component**

Create `components/ServingChip.tsx`:

```typescript
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { BORDER_RADIUS, SPACING } from '@/constants/Spacing';
import type { ServingOption } from '@/types';

interface ServingChipProps {
  option: ServingOption;
  selected: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

export function ServingChip({ option, selected, onPress, onLongPress }: ServingChipProps) {
  const tokens = useTokens();

  const showFuzzyTag = option.source === 'custom' && option.isFuzzyMatch === true;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.chip,
        {
          borderColor: selected ? tokens.accent.primary : tokens.border.hairline,
          backgroundColor: selected ? tokens.accent.muted : tokens.bg.surface,
        },
      ]}
    >
      <Text style={[Type.textMd, { color: tokens.text.primary }]} numberOfLines={1}>
        {option.label}
      </Text>
      {showFuzzyTag && (
        <View style={[styles.tag, { backgroundColor: tokens.bg.surfaceMuted }]}>
          <Text style={[Type.textXs, { color: tokens.text.secondary }]}>custom</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
  },
  tag: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.xs,
  },
});
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit + push**

```bash
git add components/ServingChip.tsx
git commit -m "[quantity-input] add ServingChip component"
git push
```

---

## Task 11: `components/SaveCustomServingModal.tsx`

**Files:**
- Create: `components/SaveCustomServingModal.tsx`

- [ ] **Step 1: Write the component**

Create `components/SaveCustomServingModal.tsx`:

```typescript
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { BORDER_RADIUS, SPACING } from '@/constants/Spacing';

interface SaveCustomServingModalProps {
  visible: boolean;
  forFoodName: string;
  initialLabel?: string;
  initialGrams?: number;
  onSave: (label: string, grams: number) => void;
  onDismiss: () => void;
}

export function SaveCustomServingModal({
  visible,
  forFoodName,
  initialLabel,
  initialGrams,
  onSave,
  onDismiss,
}: SaveCustomServingModalProps) {
  const tokens = useTokens();
  const [label, setLabel] = useState('');
  const [gramsText, setGramsText] = useState('');

  useEffect(() => {
    if (visible) {
      setLabel(initialLabel ?? '');
      setGramsText(initialGrams !== undefined ? String(initialGrams) : '');
    }
  }, [visible, initialLabel, initialGrams]);

  const trimmedLabel = label.trim();
  const parsedGrams = parseFloat(gramsText.replace(',', '.'));
  const isValid = trimmedLabel.length > 0 && Number.isFinite(parsedGrams) && parsedGrams > 0;

  const handleSave = () => {
    if (!isValid) return;
    onSave(trimmedLabel, Math.round(parsedGrams * 10) / 10);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        <View style={[styles.card, { backgroundColor: tokens.bg.surface }]}>
          <Text style={[Type.displayTitle, { color: tokens.text.primary }]}>Save serving</Text>
          <Text style={[Type.textSm, { color: tokens.text.secondary }]}>
            for "{forFoodName}"
          </Text>

          <Text style={[Type.textXs, { color: tokens.text.secondary }, styles.label]}>LABEL</Text>
          <TextInput
            style={[Type.textMd, styles.input, { color: tokens.text.primary, backgroundColor: tokens.bg.surfaceMuted }]}
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. 1 large breast"
            placeholderTextColor={tokens.text.tertiary}
            autoFocus
            maxLength={40}
          />

          <Text style={[Type.textXs, { color: tokens.text.secondary }, styles.label]}>GRAMS</Text>
          <TextInput
            style={[
              Type.textMd,
              styles.input,
              { color: tokens.text.primary, backgroundColor: tokens.bg.surfaceMuted, fontFamily: 'JetBrainsMono_500Medium' },
            ]}
            value={gramsText}
            onChangeText={setGramsText}
            placeholder="e.g. 220"
            placeholderTextColor={tokens.text.tertiary}
            keyboardType="decimal-pad"
            maxLength={6}
          />

          <Text style={[Type.textSm, { color: tokens.text.secondary }, styles.hint]}>
            This will appear as a quick pick whenever you log a food whose name contains "{forFoodName.split(/[\s,]+/).filter((t) => t.length >= 2).join(' ')}".
          </Text>

          <View style={styles.buttons}>
            <Pressable onPress={onDismiss} style={[styles.btn, { borderColor: tokens.border.hairline }]}>
              <Text style={[Type.textMd, { color: tokens.text.secondary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!isValid}
              style={[
                styles.btn,
                styles.btnPrimary,
                { backgroundColor: isValid ? tokens.accent.primary : tokens.bg.surfaceMuted },
              ]}
            >
              <Text style={[Type.textMd, { color: isValid ? '#FFFFFF' : tokens.text.tertiary }]}>Save</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26,26,26,0.4)',
    padding: SPACING.xl,
  },
  card: {
    width: '100%',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  label: {
    marginTop: SPACING.sm,
  },
  input: {
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
  },
  hint: {
    marginTop: SPACING.sm,
    lineHeight: 18,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  btn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.button,
    borderWidth: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    borderWidth: 0,
  },
});
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit + push**

```bash
git add components/SaveCustomServingModal.tsx
git commit -m "[quantity-input] add SaveCustomServingModal"
git push
```

---

## Task 12: `components/QuantityInput.tsx`

**Files:**
- Create: `components/QuantityInput.tsx`

- [ ] **Step 1: Write the component**

Create `components/QuantityInput.tsx`:

```typescript
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { BORDER_RADIUS, SPACING } from '@/constants/Spacing';
import { ServingChip } from './ServingChip';
import { SaveCustomServingModal } from './SaveCustomServingModal';
import { useServingOptions } from '@/hooks/useServingOptions';
import { useCustomServingsStore } from '@/store/customServingsStore';
import { normalizeFoodName } from '@/utils/normalizeFoodName';
import { parseCustomAmount, type CustomAmountUnit } from '@/utils/parseCustomAmount';
import { modifierToMl } from '@/utils/volumeConversions';
import { useUserStore } from '@/store/userStore';
import type { SearchResult, ServingOption } from '@/types';

interface QuantityInputProps {
  food: SearchResult;
  onChange: (grams: number, label: string) => void;
}

const UNITS: CustomAmountUnit[] = ['g', 'ml', 'oz'];

function pickDefaultOption(options: ServingOption[]): ServingOption | null {
  if (options.length === 0) return null;
  // 1. Exact-match custom (saved on this exact food name) wins
  const exactCustom = options.find((o) => o.source === 'custom' && o.isFuzzyMatch === false);
  if (exactCustom) return exactCustom;
  // 2. USDA portion closest to 100g
  const usda = options.filter((o) => o.source === 'usda');
  if (usda.length > 0) {
    return usda.reduce((best, cur) =>
      Math.abs(cur.grams - 100) < Math.abs(best.grams - 100) ? cur : best,
    );
  }
  // 3. 100g fallback
  const fallback = options.find((o) => o.label === '100 g');
  return fallback ?? options[0];
}

function detectGramsPerMl(food: SearchResult): number | undefined {
  if (!food.foodPortions) return undefined;
  for (const p of food.foodPortions) {
    const ml = modifierToMl(p.modifier ?? p.label.replace(/^[\d.]+\s*/, ''));
    if (ml !== null && ml > 0) {
      return p.gramWeight / ml;
    }
  }
  return undefined;
}

export function QuantityInput({ food, onChange }: QuantityInputProps) {
  const tokens = useTokens();
  const profileUnits = useUserStore((s) => s.profile?.units);
  const options = useServingOptions(food);
  const addCustom = useCustomServingsStore((s) => s.addCustom);
  const removeCustom = useCustomServingsStore((s) => s.removeCustom);

  const [selectedOption, setSelectedOption] = useState<ServingOption | null>(() =>
    pickDefaultOption(options),
  );
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [customUnit, setCustomUnit] = useState<CustomAmountUnit>(
    profileUnits === 'imperial' ? 'oz' : 'g',
  );
  const [modalOpen, setModalOpen] = useState(false);

  const gramsPerMl = useMemo(() => detectGramsPerMl(food), [food]);
  const mlAvailable = gramsPerMl !== undefined;

  // Re-pick default when options change (e.g., a custom is added)
  useEffect(() => {
    if (!customMode && (selectedOption === null || !options.some((o) => o.label === selectedOption.label && o.grams === selectedOption.grams))) {
      const next = pickDefaultOption(options);
      setSelectedOption(next);
    }
  }, [options, selectedOption, customMode]);

  // Notify parent of grams + label changes
  useEffect(() => {
    if (customMode) {
      const value = parseFloat(customValue.replace(',', '.'));
      if (Number.isFinite(value) && value > 0) {
        try {
          const grams = parseCustomAmount(value, customUnit, gramsPerMl);
          onChange(grams, `${value} ${customUnit}`);
        } catch {
          onChange(0, '');
        }
      } else {
        onChange(0, '');
      }
    } else if (selectedOption) {
      onChange(selectedOption.grams, selectedOption.label);
    } else {
      onChange(0, '');
    }
  }, [customMode, customValue, customUnit, selectedOption, gramsPerMl, onChange]);

  const handleSelectChip = (opt: ServingOption) => {
    setCustomMode(false);
    setSelectedOption(opt);
  };

  const handleLongPressChip = (opt: ServingOption) => {
    if (opt.source !== 'custom' || !opt.customId) return;
    Alert.alert(
      `Saved for "${opt.label}"`,
      `${opt.grams} g per serving`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeCustom(opt.customId!);
            if (selectedOption === opt) {
              const next = pickDefaultOption(options.filter((o) => o.customId !== opt.customId));
              setSelectedOption(next);
            }
          },
        },
      ],
    );
  };

  const handleSaveCustom = (label: string, grams: number) => {
    const created = addCustom({
      matchKey: normalizeFoodName(food.foodName),
      label,
      grams,
    });
    setModalOpen(false);
    setSelectedOption({
      label,
      grams,
      source: 'custom',
      customId: created.id,
      isFuzzyMatch: false,
    });
    setCustomMode(false);
  };

  const handleCustomValueChange = (text: string) => {
    setCustomMode(true);
    setCustomValue(text);
  };

  return (
    <View style={styles.container}>
      <Text style={[Type.textXs, { color: tokens.text.secondary }, styles.heading]}>HOW MUCH?</Text>

      <View style={styles.chipRow}>
        {options.map((opt) => (
          <ServingChip
            key={`${opt.source}-${opt.label}-${opt.grams}`}
            option={opt}
            selected={!customMode && selectedOption?.label === opt.label && selectedOption?.grams === opt.grams}
            onPress={() => handleSelectChip(opt)}
            onLongPress={() => handleLongPressChip(opt)}
          />
        ))}

        <Pressable
          onPress={() => setModalOpen(true)}
          style={[styles.addChip, { borderColor: tokens.border.hairline }]}
        >
          <Plus size={14} color={tokens.text.secondary} />
          <Text style={[Type.textMd, { color: tokens.text.secondary }]}>Custom</Text>
        </Pressable>
      </View>

      <Text style={[Type.textSm, { color: tokens.text.tertiary }, styles.divider]}>
        — or type a custom amount —
      </Text>

      <View style={styles.customRow}>
        <TextInput
          style={[
            Type.textLg,
            styles.customInput,
            { color: tokens.text.primary, backgroundColor: tokens.bg.surfaceMuted, fontFamily: 'JetBrainsMono_500Medium' },
          ]}
          value={customValue}
          onChangeText={handleCustomValueChange}
          placeholder="0"
          placeholderTextColor={tokens.text.tertiary}
          keyboardType="decimal-pad"
          maxLength={6}
        />

        <View style={styles.unitGroup}>
          {UNITS.map((u) => {
            const enabled = u !== 'ml' || mlAvailable;
            const active = customUnit === u;
            return (
              <Pressable
                key={u}
                disabled={!enabled}
                onPress={() => {
                  setCustomMode(true);
                  setCustomUnit(u);
                }}
                style={[
                  styles.unitChip,
                  {
                    backgroundColor: active ? tokens.accent.primary : tokens.bg.surface,
                    borderColor: active ? tokens.accent.primary : tokens.border.hairline,
                    opacity: enabled ? 1 : 0.4,
                  },
                ]}
              >
                <Text style={[Type.textSm, { color: active ? '#FFFFFF' : tokens.text.primary }]}>
                  {u}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {customMode && customUnit === 'ml' && !mlAvailable && (
        <Text style={[Type.textSm, { color: tokens.status.warning }]}>
          ml not available for this food (no volume data).
        </Text>
      )}

      <SaveCustomServingModal
        visible={modalOpen}
        forFoodName={food.foodName}
        onSave={handleSaveCustom}
        onDismiss={() => setModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  heading: {
    marginBottom: SPACING.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  divider: {
    textAlign: 'center',
    marginVertical: SPACING.sm,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  customInput: {
    flex: 1,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    textAlign: 'center',
  },
  unitGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  unitChip: {
    paddingHorizontal: SPACING.md,
    height: 48,
    borderRadius: BORDER_RADIUS.button,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit + push**

```bash
git add components/QuantityInput.tsx
git commit -m "[quantity-input] add QuantityInput component (chips + custom field + Save modal)"
git push
```

---

## Task 13: Wire `QuantityInput` into `app/confirm-food.tsx`

**Files:**
- Modify: `app/confirm-food.tsx`

- [ ] **Step 1: Replace the quantity input section**

Open `app/confirm-food.tsx` and make the following changes.

1. **Remove old state** (the `quantityText`, `setQuantityText`, and `quantity` `useMemo`):

```typescript
// REMOVE these lines
const [quantityText, setQuantityText] = useState('1');
const quantity = useMemo(() => {
  const parsed = parseFloat(quantityText);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}, [quantityText]);
```

2. **Add new state** in their place:

```typescript
const [activeGrams, setActiveGrams] = useState(0);
const [activeLabel, setActiveLabel] = useState('');
```

3. **Update the `scaled` memo** so it computes from grams (per-100g basis) instead of multiplier:

```typescript
const scaled = useMemo(() => {
  if (!pendingItem || activeGrams === 0) return null;
  const factor = activeGrams / 100;
  return {
    calories: Math.round(pendingItem.calories * factor),
    proteinG: Math.round(pendingItem.proteinG * factor * 10) / 10,
    carbsG: Math.round(pendingItem.carbsG * factor * 10) / 10,
    fatG: Math.round(pendingItem.fatG * factor * 10) / 10,
  };
}, [pendingItem, activeGrams]);
```

4. **Update the `FoodLogItem` construction in `handleAddToLog`** — replace the placeholder logic from Task 1 with the new label:

```typescript
const item: FoodLogItem = {
  id: generateId(),
  date: getTodayDateString(),
  timestamp: new Date().toISOString(),
  foodName: pendingItem.foodName,
  brandName: pendingItem.brandName,
  servingLabel: activeLabel,
  calories: scaled.calories,
  proteinG: scaled.proteinG,
  carbsG: scaled.carbsG,
  fatG: scaled.fatG,
  source: pendingItem.source,
};
```

Do the same in the "Save as Meal" handler (`handleSaveConfirm`) — set `servingLabel: activeLabel` on the saved-meal item.

5. **Replace the old quantity card JSX** — find the `View` containing `Quantity` label, the `quantity` row with the `× servingSize` text, and replace it with:

```typescript
{/* Quantity input */}
<View
  style={[
    styles.card,
    {
      backgroundColor: tokens.bg.surface,
      shadowColor: '#1A1A1A',
      shadowOpacity: 0.04,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
  ]}
>
  <QuantityInput
    food={pendingItem}
    onChange={(grams, label) => {
      setActiveGrams(grams);
      setActiveLabel(label);
    }}
  />
</View>
```

6. **Update `canAdd`** so it derives from the new state:

```typescript
const canAdd = activeGrams > 0 && activeLabel.length > 0 && scaled !== null;
```

7. **Add the import** at the top of the file:

```typescript
import { QuantityInput } from '@/components/QuantityInput';
```

8. **Remove unused old styles** in the `StyleSheet.create({...})` block: `quantityRow`, `quantityInput`, `servingUnit` are no longer used. Delete them. Also remove the `useMemo` import if no longer used (likely still used by `scaled` so leave it).

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Run tests**

```bash
npm test -- --silent
```

Expected: all tests pass.

- [ ] **Step 4: Commit + push**

```bash
git add app/confirm-food.tsx
git commit -m "[quantity-input] wire QuantityInput into confirm-food; compute macros from grams"
git push
```

---

## Task 14: `SavedServingsList` + Settings integration

**Files:**
- Create: `components/SavedServingsList.tsx`
- Modify: `app/(tabs)/settings.tsx`

- [ ] **Step 1: Write `SavedServingsList`**

Create `components/SavedServingsList.tsx`:

```typescript
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { SPACING } from '@/constants/Spacing';
import { useCustomServingsStore } from '@/store/customServingsStore';
import { SaveCustomServingModal } from './SaveCustomServingModal';
import type { CustomServing } from '@/types';

export function SavedServingsList() {
  const tokens = useTokens();
  const customs = useCustomServingsStore((s) => s.customs);
  const removeCustom = useCustomServingsStore((s) => s.removeCustom);
  const addCustom = useCustomServingsStore((s) => s.addCustom);
  const [editing, setEditing] = useState<CustomServing | null>(null);

  if (customs.length === 0) return null;

  const handleEdit = (c: CustomServing) => setEditing(c);

  const handleSaveEdit = (label: string, grams: number) => {
    if (!editing) return;
    // Editing = remove old, add new (keeps schema simple)
    removeCustom(editing.id);
    addCustom({ matchKey: editing.matchKey, label, grams });
    setEditing(null);
  };

  const handleLongPress = (c: CustomServing) => {
    Alert.alert(c.label, `Saved for "${c.matchKey}" · ${c.grams} g`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Edit', onPress: () => handleEdit(c) },
      { text: 'Delete', style: 'destructive', onPress: () => removeCustom(c.id) },
    ]);
  };

  return (
    <View>
      <Text style={[Type.textXs, { color: tokens.text.secondary }, styles.sectionHeading]}>
        SAVED SERVINGS
      </Text>
      {customs.map((c, i) => {
        const isLast = i === customs.length - 1;
        return (
          <Pressable
            key={c.id}
            onPress={() => handleEdit(c)}
            onLongPress={() => handleLongPress(c)}
            style={[
              styles.row,
              {
                backgroundColor: tokens.bg.surface,
                borderBottomColor: isLast ? 'transparent' : tokens.border.hairline,
              },
            ]}
          >
            <View style={styles.left}>
              <Text style={[Type.textLg, { color: tokens.text.primary }]} numberOfLines={1}>
                {c.label}
              </Text>
              <Text style={[Type.textSm, { color: tokens.text.secondary }]} numberOfLines={1}>
                saved for "{c.matchKey}"
              </Text>
            </View>
            <Text style={[Type.monoMd, { color: tokens.text.primary }]}>{c.grams} g</Text>
          </Pressable>
        );
      })}

      <SaveCustomServingModal
        visible={editing !== null}
        forFoodName={editing?.matchKey ?? ''}
        initialLabel={editing?.label}
        initialGrams={editing?.grams}
        onSave={handleSaveEdit}
        onDismiss={() => setEditing(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeading: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    minHeight: 56,
    borderBottomWidth: 1,
  },
  left: {
    flex: 1,
    paddingRight: SPACING.md,
  },
});
```

- [ ] **Step 2: Add `SavedServingsList` to Settings**

In `app/(tabs)/settings.tsx`, after the existing "Daily Targets" placeholder section (and before the closing `</ScrollView>`), add:

```typescript
<SavedServingsList />
```

Add the import at the top:

```typescript
import { SavedServingsList } from '@/components/SavedServingsList';
```

The list internally returns `null` when there are zero customs, so when there are none, settings shows nothing extra.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Commit + push**

```bash
git add components/SavedServingsList.tsx 'app/(tabs)/settings.tsx'
git commit -m "[quantity-input] add SavedServingsList; surface in settings"
git push
```

---

## Task 15: Manual end-to-end test pass

**Files:**
- None (verification only)

The implementer cannot drive a device, so this task lists the checks to run on a real or simulated device after the implementation lands.

- [ ] **Step 1: Cold-start flow**

Kill the app. Start fresh from the worktree:

```bash
npx expo start --clear
```

Open in Expo Go. Verify the app boots without errors.

- [ ] **Step 2: Migration sanity check**

If existing log entries were saved before this branch (with `servingQuantity` + `servingSize`), open the home tab. The "Today's log" rows should display the migrated `servingLabel`. Tap-and-hold a row to delete; entries persist correctly.

- [ ] **Step 3: USDA quick chips**

Tap "+" → Search foods → search "chicken breast". Pick a USDA result. The confirm-food screen should show chips like "1 breast, half (172g)", "100 g", and the imperial fallback "1 oz" if the user is on imperial units.

Tap a chip → calorie total updates. Tap "Add to Log". Return home; the log row shows the chip label as `servingLabel`.

- [ ] **Step 4: Custom amount input**

Search any food, on the confirm screen tap into the custom amount field, type `150` and pick `g`. Macros recompute. Add to log. Verify the log row reads `"150 g"`.

- [ ] **Step 5: Save a custom serving**

Search "chicken breast" again. Tap `+ Custom` → modal appears. Enter label `"1 large breast"` and grams `220`. Save. The new chip should appear with no `(custom)` tag (exact-match for this food). Tap it; macros recompute. Add to log.

- [ ] **Step 6: Fuzzy match flag**

Now search "Boneless skinless chicken breast" (a different USDA entry). The custom serving "1 large breast" should appear as a chip with a small `custom` tag (because the matchKey "chicken breast" is a token-subset but not equal to the new food's normalized name).

- [ ] **Step 7: Manage saved servings**

Go to Settings → "Saved servings" should list "1 large breast / 220 g / saved for 'chicken breast'". Long-press the row → Edit / Delete options work. Delete; verify the chip no longer appears on chicken-breast searches.

- [ ] **Step 8: Volume (ml) gating**

Search "milk". USDA milk should have volume portions (`1 cup`, etc.). On the confirm screen, tap into the custom field, then `ml` — should be enabled. Type `100`, see macros update.

Search a manual or non-USDA food without volume data; tap `ml` — should be disabled (greyed out, low opacity).

- [ ] **Step 9: TypeScript + tests final**

```bash
npx tsc --noEmit && npm test -- --silent
```

Expected: zero TS errors, all tests pass.

- [ ] **Step 10: Final commit if needed**

If any small fixes are uncovered during the test pass:

```bash
git add -u
git commit -m "[quantity-input] post-QA fixes"
git push
```

If no fixes needed, skip this commit.

---

## Done

When all 15 tasks are checked, the flexible quantity input is shipped on `feature/quantity-input`. Open a PR against `feature/ui-redesign` (so the redesign and the quantity input land together as a stack). Once both are merged to `master`, the next spec — meal builder + pantry — can proceed.

A short post-merge sweep (separate branch) should clean up the temporary `as unknown as ...` cast in `app/confirm-meal.tsx` (Task 1, Step 4) once the meal-builder spec rebuilds that screen anyway.
