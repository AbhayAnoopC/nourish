# Nourish UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current generic-blue, bordered-card UI with a calm/premium light-first identity (warm cream + deep terracotta + Fraunces/Inter/JetBrains Mono), restructure the home screen as a swipeable 4-page hero canvas, and replace the Log tab with a floating "+" FAB that opens a bottom sheet of log methods.

**Architecture:** The redesign is delivered in five logical layers, built bottom-up: (1) design tokens + fonts + new dependencies, (2) primitive SVG/animation building blocks, (3) hero canvas pages and pager, (4) tab bar + FAB + bottom sheet, (5) home assembly + token application sweep across remaining screens + motion polish. Token application uses semantic names (`bg.surface`, `accent.primary`) read through a `useTokens()` hook so the same component renders correctly in light or dark mode.

**Tech Stack:** React Native (Expo SDK 54), TypeScript strict, Zustand, Expo Router, Reanimated 4 + Worklets (already installed), plus new deps: `react-native-svg`, `react-native-gesture-handler`, `react-native-pager-view`, `expo-haptics`, `lucide-react-native`, `@expo-google-fonts/fraunces`, `@expo-google-fonts/inter`, `@expo-google-fonts/jetbrains-mono`.

**Spec:** `docs/superpowers/specs/2026-04-28-nourish-ui-redesign-design.md`

---

## File Map

### New files (created by this plan)

**Constants & hooks:**
- `constants/Tokens.ts` — semantic token map (light + dark palettes)
- `constants/Typography.ts` — type scale (family/weight/size triples)
- `constants/Motion.ts` — duration / easing / spring constants
- `hooks/useTokens.ts` — returns the active-mode token object
- `hooks/useReduceMotion.ts` — reads OS Reduce Motion preference

**Utils (with tests):**
- `utils/sparklineData.ts` + `utils/sparklineData.test.ts`
- `utils/weightDelta.ts` + `utils/weightDelta.test.ts`

**Hero canvas:**
- `components/HomeHero/CalorieArc.tsx`
- `components/HomeHero/WaterGlass.tsx`
- `components/HomeHero/Sparkline.tsx`
- `components/HomeHero/PageDots.tsx`
- `components/HomeHero/CaloriesPage.tsx`
- `components/HomeHero/MacrosPage.tsx`
- `components/HomeHero/WaterPage.tsx`
- `components/HomeHero/WeightPage.tsx`
- `components/HomeHero/HomeHeroPager.tsx`

**Other UI:**
- `components/HeroFab.tsx`
- `components/TabBarWithFab.tsx`
- `components/LogMethodsSheet.tsx`
- `components/HomeHeader.tsx`
- `components/WatchNudgeBanner.tsx`
- `components/FoodLogRow.tsx`
- `components/WeightLogModal.tsx`

### Modified files

- `package.json` — add deps
- `app.config.ts` — register `react-native-svg` & gesture handler if needed
- `app/_layout.tsx` — load Fraunces/Inter/JetBrains Mono fonts; wrap in `GestureHandlerRootView`
- `constants/Spacing.ts` — augment with `cardPad: 20`, `BORDER_RADIUS.button: 14`
- `app/(tabs)/_layout.tsx` — switch to 3 tabs + custom `TabBarWithFab`
- `app/(tabs)/index.tsx` — full restructure to header + hero pager + log list
- `app/(tabs)/meals.tsx` — token-only restyle
- `app/(tabs)/settings.tsx` — token-only restyle
- `app/confirm-food.tsx` — token-only restyle
- `app/food-search.tsx` — token-only restyle
- `app/barcode-scan.tsx` — token-only restyle
- `app/confirm-meal.tsx` — token-only restyle
- `app/onboarding/welcome.tsx` — token-only restyle
- `app/onboarding/profile.tsx` — token-only restyle
- `app/onboarding/activity.tsx` — token-only restyle
- `app/onboarding/tdee-result.tsx` — token-only restyle
- `app/onboarding/amazfit.tsx` — token-only restyle
- `components/FoodLogItem.tsx` — replaced by `FoodLogRow.tsx` (delete)
- `components/MacroBar.tsx` — restyled for new palette (kept; used outside hero on confirm-food)
- `components/SavedMealCard.tsx` — restyled
- `components/FoodSearchResultItem.tsx` — restyled, skeleton variant updated
- `components/OnboardingHeader.tsx` — restyled
- `components/SelectOption.tsx` — restyled
- `components/HeightWeightInputs.tsx` — restyled

### Deleted files

- `app/(tabs)/log.tsx` — Log tab removed; replaced by `LogMethodsSheet`
- `components/NetCaloriesCard.tsx` — replaced by `CaloriesPage`
- `components/BurnedCaloriesCard.tsx` — folded into `CaloriesPage`
- `components/WaterTracker.tsx` — replaced by `WaterPage`
- `components/WatchNudgeCard.tsx` — replaced by `WatchNudgeBanner`
- `components/FoodLogItem.tsx` — replaced by `FoodLogRow`
- `constants/Colors.ts` — replaced by `Tokens.ts` (kept until last task, then deleted)

---

## Conventions

- **Tests:** Project tests run via `npm test` (Jest with `testEnvironment: node`). Test patterns are `utils/*.test.ts`, `services/*.test.ts`, `store/*.test.ts`, `hooks/*.test.ts`. RN component visual tests are NOT in scope (no RN-test setup); we test pure functions only. Visual components are verified manually after each task.
- **Type safety:** TypeScript strict on. No `any`. All component props have an interface above the component.
- **Styles:** Always `StyleSheet.create()` at the bottom of each component file. Never inline `style={{ }}` literals (per `CLAUDE.md`).
- **Tokens at consumption sites:** Components must call `useTokens()` and read tokens by semantic name (`tokens.bg.surface`). Never hard-code hex values inside components.
- **Commits:** One commit per task. Commit message format `[ui-redesign] <task summary>`.

---

## Task 1: Add new dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install new runtime dependencies**

Run from project root:

```bash
npx expo install react-native-svg react-native-gesture-handler react-native-pager-view expo-haptics
npm install lucide-react-native @expo-google-fonts/fraunces @expo-google-fonts/inter @expo-google-fonts/jetbrains-mono
```

`expo install` resolves Expo-SDK-54-compatible versions for the first four packages. `npm install` is fine for the rest because they have no native side.

- [ ] **Step 2: Verify native packages reflect in package.json**

Run: `cat package.json | grep -E "(svg|gesture-handler|pager-view|haptics|lucide|fraunces|inter|jetbrains)"`

Expected output (versions may differ): each of the 7 packages appears in `dependencies`.

- [ ] **Step 3: Run TypeScript to confirm no immediate type breaks**

Run: `npx tsc --noEmit`

Expected: no errors. (We haven't written any code yet, so types should still be clean.)

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "[ui-redesign] add deps: svg, gesture-handler, pager-view, haptics, lucide, google fonts"
```

---

## Task 2: Create design tokens — `Tokens.ts`

**Files:**
- Create: `constants/Tokens.ts`

- [ ] **Step 1: Write the token file**

Create `constants/Tokens.ts`:

```typescript
export type ColorScheme = 'light' | 'dark';

export interface TokenSet {
  bg: {
    primary: string;
    surface: string;
    surfaceMuted: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  accent: {
    primary: string;
    muted: string;
    pressed: string;
  };
  border: {
    hairline: string;
  };
  macro: {
    protein: string;
    carbs: string;
    fat: string;
  };
  status: {
    success: string;
    warning: string;
    danger: string;
  };
}

const light: TokenSet = {
  bg: {
    primary: '#FAFAF7',
    surface: '#FFFFFF',
    surfaceMuted: '#F4F2ED',
  },
  text: {
    primary: '#1A1A1A',
    secondary: '#6B6B66',
    tertiary: '#9C9A95',
  },
  accent: {
    primary: '#B8553A',
    muted: '#F4E5DD',
    pressed: '#9D4730',
  },
  border: {
    hairline: '#EFEDE8',
  },
  macro: {
    protein: '#7A4A3F',
    carbs: '#C49B5C',
    fat: '#8B7355',
  },
  status: {
    success: '#5B7A5E',
    warning: '#C48B3F',
    danger: '#A03A2E',
  },
};

const dark: TokenSet = {
  bg: {
    primary: '#14110E',
    surface: '#1F1A16',
    surfaceMuted: '#2A2420',
  },
  text: {
    primary: '#F0EDE8',
    secondary: '#9C958C',
    tertiary: '#6B655E',
  },
  accent: {
    primary: '#D26F50',
    muted: '#3A2A22',
    pressed: '#B8553A',
  },
  border: {
    hairline: '#2A2420',
  },
  macro: {
    protein: '#8C5C50',
    carbs: '#D2AC72',
    fat: '#9D866A',
  },
  status: {
    success: '#6F8E72',
    warning: '#D49E54',
    danger: '#B45044',
  },
};

export const Tokens: Record<ColorScheme, TokenSet> = { light, dark };
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add constants/Tokens.ts
git commit -m "[ui-redesign] add semantic color token map (light + dark)"
```

---

## Task 3: Create typography tokens — `Typography.ts`

**Files:**
- Create: `constants/Typography.ts`

- [ ] **Step 1: Write the typography token file**

Create `constants/Typography.ts`:

```typescript
import type { TextStyle } from 'react-native';

export const FontFamily = {
  fraunces: 'Fraunces_400Regular',
  frauncesMedium: 'Fraunces_500Medium',
  fraunces600: 'Fraunces_600SemiBold',
  inter: 'Inter_400Regular',
  interMedium: 'Inter_500Medium',
  interSemibold: 'Inter_600SemiBold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
} as const;

export const Type: Record<string, TextStyle> = {
  displayHero: {
    fontFamily: FontFamily.fraunces,
    fontSize: 64,
    lineHeight: 64 * 1.05,
    letterSpacing: -0.5,
  },
  displayHeroSmall: {
    fontFamily: FontFamily.fraunces,
    fontSize: 48,
    lineHeight: 48 * 1.1,
    letterSpacing: -0.25,
  },
  displayTitle: {
    fontFamily: FontFamily.frauncesMedium,
    fontSize: 32,
    lineHeight: 32 * 1.15,
  },
  textXl: {
    fontFamily: FontFamily.interSemibold,
    fontSize: 20,
    lineHeight: 20 * 1.3,
  },
  textLg: {
    fontFamily: FontFamily.interMedium,
    fontSize: 17,
    lineHeight: 17 * 1.35,
  },
  textMd: {
    fontFamily: FontFamily.inter,
    fontSize: 15,
    lineHeight: 15 * 1.4,
  },
  textSm: {
    fontFamily: FontFamily.inter,
    fontSize: 13,
    lineHeight: 13 * 1.4,
  },
  textXs: {
    fontFamily: FontFamily.interSemibold,
    fontSize: 11,
    lineHeight: 11 * 1.4,
    letterSpacing: 0.8,
  },
  monoLg: {
    fontFamily: FontFamily.monoMedium,
    fontSize: 17,
    lineHeight: 17 * 1.35,
  },
  monoMd: {
    fontFamily: FontFamily.mono,
    fontSize: 15,
    lineHeight: 15 * 1.4,
  },
  monoSm: {
    fontFamily: FontFamily.mono,
    fontSize: 13,
    lineHeight: 13 * 1.4,
  },
};
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add constants/Typography.ts
git commit -m "[ui-redesign] add typography tokens (Fraunces + Inter + JetBrains Mono scale)"
```

---

## Task 4: Create motion tokens — `Motion.ts`

**Files:**
- Create: `constants/Motion.ts`

- [ ] **Step 1: Write the motion token file**

Create `constants/Motion.ts`:

```typescript
import { Easing } from 'react-native-reanimated';

export const Duration = {
  fast: 150,
  base: 200,
  medium: 300,
  slow: 600,
} as const;

export const Easings = {
  easeOut: Easing.out(Easing.ease),
  easeIn: Easing.in(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),
} as const;

export const Springs = {
  arc: { stiffness: 180, damping: 20, mass: 1 },
  bar: { stiffness: 160, damping: 22, mass: 1 },
  wave: { stiffness: 140, damping: 18, mass: 1 },
} as const;

export const PressScale = {
  scaleTo: 0.94,
  pressDuration: 80,
  releaseDuration: 150,
} as const;
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add constants/Motion.ts
git commit -m "[ui-redesign] add motion tokens (durations, easings, spring configs)"
```

---

## Task 5: Augment `Spacing.ts`

**Files:**
- Modify: `constants/Spacing.ts`

- [ ] **Step 1: Add new constants**

Edit `constants/Spacing.ts`:

```typescript
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  cardPad: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const BORDER_RADIUS = {
  sm: 6,
  md: 12,
  button: 14,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const MAX_WATER_ML = 5000;
export const DEFAULT_WATER_TARGET_ML = 2000;
export const WATER_INCREMENT_ML = 250;
export const MAX_VOICE_RECORDING_SECONDS = 30;
export const MAX_IMAGE_SIZE_BYTES = 1_048_576; // 1MB
```

- [ ] **Step 2: Type-check + run tests**

Run: `npx tsc --noEmit && npm test -- --silent`

Expected: no errors, all existing tests pass (the additions are non-breaking).

- [ ] **Step 3: Commit**

```bash
git add constants/Spacing.ts
git commit -m "[ui-redesign] augment Spacing tokens (cardPad: 20, BORDER_RADIUS.button: 14)"
```

---

## Task 6: `useTokens` hook

**Files:**
- Create: `hooks/useTokens.ts`

- [ ] **Step 1: Write the hook**

Create `hooks/useTokens.ts`:

```typescript
import { useColorScheme } from '@/components/useColorScheme';
import { Tokens } from '@/constants/Tokens';
import type { TokenSet } from '@/constants/Tokens';

export function useTokens(): TokenSet {
  const scheme = useColorScheme();
  return Tokens[scheme];
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/useTokens.ts
git commit -m "[ui-redesign] add useTokens hook"
```

---

## Task 7: `useReduceMotion` hook

**Files:**
- Create: `hooks/useReduceMotion.ts`
- Test: `hooks/useReduceMotion.test.ts`

- [ ] **Step 1: Write the failing test**

Create `hooks/useReduceMotion.test.ts`:

```typescript
import { renderHook } from '@testing-library/react-hooks';
import { AccessibilityInfo } from 'react-native';
import { useReduceMotion } from './useReduceMotion';

jest.mock('react-native', () => ({
  AccessibilityInfo: {
    isReduceMotionEnabled: jest.fn(),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

describe('useReduceMotion', () => {
  it('returns false initially when reduce motion is off', async () => {
    (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(false);
    const { result, waitForNextUpdate } = renderHook(() => useReduceMotion());
    expect(result.current).toBe(false);
    await waitForNextUpdate();
    expect(result.current).toBe(false);
  });

  it('returns true when reduce motion is enabled', async () => {
    (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(true);
    const { result, waitForNextUpdate } = renderHook(() => useReduceMotion());
    await waitForNextUpdate();
    expect(result.current).toBe(true);
  });
});
```

- [ ] **Step 2: Install `@testing-library/react-hooks` if missing**

Run: `ls node_modules/@testing-library/react-hooks 2>/dev/null && echo PRESENT || npm install --save-dev @testing-library/react-hooks`

If installed, skip. If not, the command installs it.

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- hooks/useReduceMotion.test.ts`

Expected: FAIL with "Cannot find module './useReduceMotion'".

- [ ] **Step 4: Write the hook**

Create `hooks/useReduceMotion.ts`:

```typescript
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduce(value);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduce;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- hooks/useReduceMotion.test.ts`

Expected: PASS, both tests green.

- [ ] **Step 6: Commit**

```bash
git add hooks/useReduceMotion.ts hooks/useReduceMotion.test.ts package.json package-lock.json
git commit -m "[ui-redesign] add useReduceMotion hook with tests"
```

---

## Task 8: Sparkline data util (TDD)

**Files:**
- Create: `utils/sparklineData.ts`
- Create: `utils/sparklineData.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `utils/sparklineData.test.ts`:

```typescript
import { buildSparklineSeries } from './sparklineData';

describe('buildSparklineSeries', () => {
  // entries: { date: 'YYYY-MM-DD', weightKg: number }
  // anchorDate: 'YYYY-MM-DD' (the day the chart is being viewed)
  // returns 7 numbers: weight for each of the last 7 days, with carry-forward
  // each entry also marked actual: true | false (false = carried forward)

  it('returns 7 entries with carry-forward for missing days', () => {
    const entries = [
      { date: '2026-04-22', weightKg: 75.0 },
      { date: '2026-04-25', weightKg: 74.5 },
      { date: '2026-04-28', weightKg: 74.0 },
    ];
    const series = buildSparklineSeries(entries, '2026-04-28');
    expect(series).toHaveLength(7);
    // Days 04-22..04-28
    expect(series.map((p) => p.weightKg)).toEqual([75.0, 75.0, 75.0, 74.5, 74.5, 74.5, 74.0]);
    expect(series.map((p) => p.actual)).toEqual([true, false, false, true, false, false, true]);
  });

  it('carries forward from before the 7-day window', () => {
    const entries = [{ date: '2026-04-15', weightKg: 76.0 }];
    const series = buildSparklineSeries(entries, '2026-04-28');
    expect(series.map((p) => p.weightKg)).toEqual([76.0, 76.0, 76.0, 76.0, 76.0, 76.0, 76.0]);
    expect(series.every((p) => p.actual === false)).toBe(true);
  });

  it('returns empty array if no entries at all', () => {
    expect(buildSparklineSeries([], '2026-04-28')).toEqual([]);
  });

  it('returns empty array if no entries exist on or before the anchor date', () => {
    const entries = [{ date: '2026-05-01', weightKg: 75.0 }];
    expect(buildSparklineSeries(entries, '2026-04-28')).toEqual([]);
  });

  it('counts only actual entries within the window for "fewer than 2" check', () => {
    // Caller can use series.filter(p => p.actual).length to determine if to render
    const entries = [{ date: '2026-04-28', weightKg: 74.0 }];
    const series = buildSparklineSeries(entries, '2026-04-28');
    const actualCount = series.filter((p) => p.actual).length;
    expect(actualCount).toBe(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- utils/sparklineData.test.ts`

Expected: FAIL with "Cannot find module './sparklineData'".

- [ ] **Step 3: Write the implementation**

Create `utils/sparklineData.ts`:

```typescript
export interface WeightEntry {
  date: string; // YYYY-MM-DD
  weightKg: number;
}

export interface SparklinePoint {
  date: string;
  weightKg: number;
  actual: boolean; // true = real entry; false = carry-forward
}

function addDays(dateIso: string, days: number): string {
  const d = new Date(dateIso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function buildSparklineSeries(
  entries: WeightEntry[],
  anchorDate: string,
): SparklinePoint[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const startDate = addDays(anchorDate, -6);

  const onOrBeforeStart = sorted.filter((e) => e.date <= startDate);
  const inWindow = sorted.filter((e) => e.date >= startDate && e.date <= anchorDate);

  if (inWindow.length === 0 && onOrBeforeStart.length === 0) {
    return [];
  }

  let carry: number | null =
    onOrBeforeStart.length > 0 ? onOrBeforeStart[onOrBeforeStart.length - 1].weightKg : null;

  const byDate = new Map<string, number>();
  inWindow.forEach((e) => byDate.set(e.date, e.weightKg));

  const series: SparklinePoint[] = [];
  for (let i = 0; i < 7; i += 1) {
    const date = addDays(startDate, i);
    const actualValue = byDate.get(date);
    if (actualValue !== undefined) {
      carry = actualValue;
      series.push({ date, weightKg: actualValue, actual: true });
    } else if (carry !== null) {
      series.push({ date, weightKg: carry, actual: false });
    }
  }

  return series;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- utils/sparklineData.test.ts`

Expected: PASS, all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add utils/sparklineData.ts utils/sparklineData.test.ts
git commit -m "[ui-redesign] add sparkline data util with carry-forward semantics + tests"
```

---

## Task 9: Weight delta util (TDD)

**Files:**
- Create: `utils/weightDelta.ts`
- Create: `utils/weightDelta.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `utils/weightDelta.test.ts`:

```typescript
import { weeklyWeightDelta } from './weightDelta';

describe('weeklyWeightDelta', () => {
  it('returns delta from oldest to newest actual entry within last 7 days', () => {
    const series = [
      { date: '2026-04-22', weightKg: 75.0, actual: true },
      { date: '2026-04-25', weightKg: 74.5, actual: false },
      { date: '2026-04-28', weightKg: 74.0, actual: true },
    ];
    expect(weeklyWeightDelta(series)).toBe(-1.0);
  });

  it('ignores carry-forward entries when computing delta', () => {
    const series = [
      { date: '2026-04-22', weightKg: 75.0, actual: false },
      { date: '2026-04-23', weightKg: 75.0, actual: false },
      { date: '2026-04-28', weightKg: 74.5, actual: true },
    ];
    // Only one actual entry — no delta possible
    expect(weeklyWeightDelta(series)).toBeNull();
  });

  it('returns null when fewer than 2 actual entries', () => {
    expect(weeklyWeightDelta([])).toBeNull();
    expect(weeklyWeightDelta([{ date: '2026-04-28', weightKg: 74.0, actual: true }])).toBeNull();
  });

  it('handles a positive delta', () => {
    const series = [
      { date: '2026-04-22', weightKg: 73.0, actual: true },
      { date: '2026-04-28', weightKg: 74.0, actual: true },
    ];
    expect(weeklyWeightDelta(series)).toBe(1.0);
  });

  it('rounds to 1 decimal place', () => {
    const series = [
      { date: '2026-04-22', weightKg: 75.123, actual: true },
      { date: '2026-04-28', weightKg: 74.876, actual: true },
    ];
    expect(weeklyWeightDelta(series)).toBe(-0.2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- utils/weightDelta.test.ts`

Expected: FAIL with "Cannot find module './weightDelta'".

- [ ] **Step 3: Write the implementation**

Create `utils/weightDelta.ts`:

```typescript
import type { SparklinePoint } from './sparklineData';

export function weeklyWeightDelta(series: SparklinePoint[]): number | null {
  const actuals = series.filter((p) => p.actual);
  if (actuals.length < 2) return null;
  const oldest = actuals[0].weightKg;
  const newest = actuals[actuals.length - 1].weightKg;
  return Math.round((newest - oldest) * 10) / 10;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- utils/weightDelta.test.ts`

Expected: PASS, all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add utils/weightDelta.ts utils/weightDelta.test.ts
git commit -m "[ui-redesign] add weeklyWeightDelta util + tests"
```

---

## Task 10: Wire font loading + GestureHandlerRootView in `_layout.tsx`

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Replace `_layout.tsx` content**

Replace the entire contents of `app/_layout.tsx`:

```typescript
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import {
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme } from '@/components/useColorScheme';
import { useUserStore } from '@/store/userStore';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Fraunces_400Regular,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootLayoutNav />
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const onboardingComplete = useUserStore((s) => s.profile?.onboardingComplete ?? false);

  useEffect(() => {
    if (!onboardingComplete) {
      router.replace('/onboarding/welcome');
    }
  }, [onboardingComplete]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="food-search" options={{ headerShown: true }} />
        <Stack.Screen name="confirm-food" options={{ headerShown: true }} />
        <Stack.Screen name="barcode-scan" options={{ headerShown: true }} />
        <Stack.Screen name="confirm-meal" options={{ headerShown: true }} />
      </Stack>
    </ThemeProvider>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Manual smoke test**

Run: `npx expo start` then open the app on a device/simulator. App should boot to home or onboarding without crashing. Splash should hide once fonts load (~1-2 seconds extra on cold start).

If it crashes with "Could not find native module" for `react-native-gesture-handler`, run `npx expo prebuild --clean` and rebuild.

- [ ] **Step 4: Commit**

```bash
git add app/_layout.tsx
git commit -m "[ui-redesign] load Fraunces/Inter/JetBrains Mono fonts; wrap in GestureHandlerRootView"
```

---

## Task 11: `CalorieArc` SVG primitive

**Files:**
- Create: `components/HomeHero/CalorieArc.tsx`

- [ ] **Step 1: Create the directory**

Run: `mkdir -p components/HomeHero`

- [ ] **Step 2: Write the component**

Create `components/HomeHero/CalorieArc.tsx`:

```typescript
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Springs } from '@/constants/Motion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CalorieArcProps {
  progress: number; // 0..1
  trackColor: string;
  fillColor: string;
  size?: number;
  stroke?: number;
  reduceMotion?: boolean;
}

const SWEEP_DEG = 270; // arc opens at the bottom
const START_OFFSET_DEG = -225; // rotate so the gap is centered at the bottom

export function CalorieArc({
  progress,
  trackColor,
  fillColor,
  size = 220,
  stroke = 14,
  reduceMotion = false,
}: CalorieArcProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const sweepLength = circumference * (SWEEP_DEG / 360);

  const animated = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      animated.value = Math.max(0, Math.min(1, progress));
    } else {
      animated.value = withSpring(Math.max(0, Math.min(1, progress)), Springs.arc);
    }
  }, [progress, reduceMotion, animated]);

  const animatedProps = useAnimatedProps(() => {
    const filled = animated.value * sweepLength;
    const empty = circumference - filled;
    return {
      strokeDasharray: [filled, empty] as unknown as string,
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={[sweepLength, circumference - sweepLength] as unknown as string}
          strokeLinecap="round"
          transform={`rotate(${START_OFFSET_DEG} ${size / 2} ${size / 2})`}
        />
        {/* Fill */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={fillColor}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          animatedProps={animatedProps}
          transform={`rotate(${START_OFFSET_DEG} ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/HomeHero/CalorieArc.tsx
git commit -m "[ui-redesign] add CalorieArc SVG primitive with spring animation"
```

---

## Task 12: `Sparkline` SVG primitive

**Files:**
- Create: `components/HomeHero/Sparkline.tsx`

- [ ] **Step 1: Write the component**

Create `components/HomeHero/Sparkline.tsx`:

```typescript
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import type { SparklinePoint } from '@/utils/sparklineData';
import { Duration } from '@/constants/Motion';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface SparklineProps {
  series: SparklinePoint[];
  color: string;
  width: number;
  height: number;
  strokeWidth?: number;
  reduceMotion?: boolean;
}

function buildPathD(series: SparklinePoint[], width: number, height: number): string {
  if (series.length < 2) return '';
  const values = series.map((p) => p.weightKg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (series.length - 1);
  return series
    .map((p, i) => {
      const x = i * stepX;
      const y = height - ((p.weightKg - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

export function Sparkline({
  series,
  color,
  width,
  height,
  strokeWidth = 1.5,
  reduceMotion = false,
}: SparklineProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    if (reduceMotion) {
      progress.value = 1;
    } else {
      progress.value = withTiming(1, {
        duration: Duration.slow,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [series, reduceMotion, progress]);

  const pathD = buildPathD(series, width, height);
  const totalLength = width;

  const animatedProps = useAnimatedProps(() => {
    const dashLen = totalLength * progress.value;
    const gap = totalLength - dashLen;
    return {
      strokeDasharray: [dashLen, gap] as unknown as string,
    };
  });

  if (series.length < 2) return null;

  const lastActualIndex = series.map((p, i) => (p.actual ? i : -1)).filter((i) => i >= 0).pop() ?? series.length - 1;
  const lastPoint = series[lastActualIndex];
  const values = series.map((p) => p.weightKg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (series.length - 1);
  const dotX = lastActualIndex * stepX;
  const dotY = height - ((lastPoint.weightKg - min) / range) * height;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <AnimatedPath
          d={pathD}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          animatedProps={animatedProps}
        />
        <Circle cx={dotX} cy={dotY} r={3} fill={color} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/HomeHero/Sparkline.tsx
git commit -m "[ui-redesign] add Sparkline SVG primitive with left-to-right draw animation"
```

---

## Task 13: `WaterGlass` SVG primitive

**Files:**
- Create: `components/HomeHero/WaterGlass.tsx`

- [ ] **Step 1: Write the component**

Create `components/HomeHero/WaterGlass.tsx`:

```typescript
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Defs, ClipPath, Rect } from 'react-native-svg';
import { Springs } from '@/constants/Motion';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface WaterGlassProps {
  fill: number; // 0..1
  strokeColor: string;
  fillColor: string;
  size?: number;
  reduceMotion?: boolean;
}

const GLASS_PATH = 'M 30 10 L 90 10 L 80 110 Q 60 116 40 110 Z';

export function WaterGlass({
  fill,
  strokeColor,
  fillColor,
  size = 140,
  reduceMotion = false,
}: WaterGlassProps) {
  const fillProgress = useSharedValue(0);
  const wave = useSharedValue(0);

  useEffect(() => {
    const target = Math.max(0, Math.min(1, fill));
    if (reduceMotion) {
      fillProgress.value = target;
    } else {
      fillProgress.value = withSpring(target, Springs.wave);
    }
  }, [fill, reduceMotion, fillProgress]);

  useEffect(() => {
    if (reduceMotion) return;
    wave.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [reduceMotion, wave]);

  const VIEWBOX = 120;
  const TOP = 10;
  const BOTTOM = 116;

  const animatedProps = useAnimatedProps(() => {
    const yTop = BOTTOM - (BOTTOM - TOP) * fillProgress.value + Math.sin(wave.value * Math.PI * 2) * 1.5;
    const height = BOTTOM - yTop;
    return { y: yTop, height };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
        <Defs>
          <ClipPath id="glassClip">
            <Path d={GLASS_PATH} />
          </ClipPath>
        </Defs>
        <AnimatedRect
          x={0}
          y={0}
          width={VIEWBOX}
          height={VIEWBOX}
          fill={fillColor}
          clipPath="url(#glassClip)"
          animatedProps={animatedProps}
        />
        <Path
          d={GLASS_PATH}
          stroke={strokeColor}
          strokeWidth={2}
          fill="none"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/HomeHero/WaterGlass.tsx
git commit -m "[ui-redesign] add WaterGlass SVG primitive with wave + fill spring"
```

---

## Task 14: `PageDots` indicator

**Files:**
- Create: `components/HomeHero/PageDots.tsx`

- [ ] **Step 1: Write the component**

Create `components/HomeHero/PageDots.tsx`:

```typescript
import { StyleSheet, View } from 'react-native';
import { useTokens } from '@/hooks/useTokens';

interface PageDotsProps {
  count: number;
  activeIndex: number;
}

export function PageDots({ count, activeIndex }: PageDotsProps) {
  const tokens = useTokens();
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: i === activeIndex ? tokens.accent.primary : tokens.text.tertiary,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/HomeHero/PageDots.tsx
git commit -m "[ui-redesign] add PageDots indicator"
```

---

## Task 15: `CaloriesPage` (hero page 1)

**Files:**
- Create: `components/HomeHero/CaloriesPage.tsx`

- [ ] **Step 1: Write the component**

Create `components/HomeHero/CaloriesPage.tsx`:

```typescript
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { CalorieArc } from './CalorieArc';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { Duration } from '@/constants/Motion';
import { useReduceMotion } from '@/hooks/useReduceMotion';

const AnimatedText = Animated.createAnimatedComponent(Text);

interface CaloriesPageProps {
  eaten: number;
  burned: number;
  target: number;
}

export function CaloriesPage({ eaten, burned, target }: CaloriesPageProps) {
  const tokens = useTokens();
  const reduceMotion = useReduceMotion();
  const animated = useSharedValue(0);
  const remaining = Math.max(0, target - eaten);
  const progress = target > 0 ? eaten / target : 0;

  useEffect(() => {
    if (reduceMotion) {
      animated.value = eaten;
    } else {
      animated.value = withTiming(eaten, {
        duration: Duration.base,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [eaten, reduceMotion, animated]);

  const animatedProps = useAnimatedProps(() => ({
    text: `${Math.round(animated.value)}`,
    defaultValue: `${Math.round(animated.value)}`,
  }));

  return (
    <View style={styles.page}>
      <View style={styles.arcWrap}>
        <CalorieArc
          progress={progress}
          trackColor={tokens.accent.muted}
          fillColor={tokens.accent.primary}
          reduceMotion={reduceMotion}
        />
        <View style={styles.numberCenter} pointerEvents="none">
          <AnimatedText
            style={[Type.displayHero, { color: tokens.text.primary }]}
            animatedProps={animatedProps}
          />
          <Text style={[Type.textSm, { color: tokens.text.secondary }]}>kcal</Text>
        </View>
      </View>
      <Text style={[Type.textSm, { color: tokens.text.secondary }, styles.caption]}>
        of {target} · {remaining} to go
      </Text>
      {burned > 0 && (
        <Text style={[Type.monoSm, { color: tokens.text.tertiary }, styles.burned]}>
          −{Math.round(burned)} burned today
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  arcWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    marginTop: 16,
  },
  burned: {
    marginTop: 4,
  },
});
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/HomeHero/CaloriesPage.tsx
git commit -m "[ui-redesign] add CaloriesPage with animated count-up + arc"
```

---

## Task 16: `MacrosPage` (hero page 2)

**Files:**
- Create: `components/HomeHero/MacrosPage.tsx`

- [ ] **Step 1: Write the component**

Create `components/HomeHero/MacrosPage.tsx`:

```typescript
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { Springs } from '@/constants/Motion';
import { useReduceMotion } from '@/hooks/useReduceMotion';

interface MacroBarRowProps {
  label: string;
  current: number;
  target: number;
  color: string;
  trackColor: string;
  textPrimary: string;
  textSecondary: string;
}

function MacroBarRow({
  label,
  current,
  target,
  color,
  trackColor,
  textPrimary,
  textSecondary,
}: MacroBarRowProps) {
  const reduceMotion = useReduceMotion();
  const fill = target > 0 ? Math.min(1, current / target) : 0;
  const animated = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      animated.value = fill;
    } else {
      animated.value = withSpring(fill, Springs.bar);
    }
  }, [fill, reduceMotion, animated]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${animated.value * 100}%`,
  }));

  return (
    <View style={styles.row}>
      <View style={styles.rowHead}>
        <Text style={[Type.textMd, { color: textPrimary }]}>{label}</Text>
        <Text style={[Type.monoMd, { color: textSecondary }]}>
          {Math.round(current)} / {Math.round(target)} g
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View style={[styles.fill, { backgroundColor: color }, fillStyle]} />
      </View>
    </View>
  );
}

interface MacrosPageProps {
  proteinG: number;
  carbsG: number;
  fatG: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
}

export function MacrosPage({
  proteinG,
  carbsG,
  fatG,
  proteinTarget,
  carbsTarget,
  fatTarget,
}: MacrosPageProps) {
  const tokens = useTokens();
  return (
    <View style={styles.page}>
      <MacroBarRow
        label="Protein"
        current={proteinG}
        target={proteinTarget}
        color={tokens.macro.protein}
        trackColor={tokens.accent.muted}
        textPrimary={tokens.text.primary}
        textSecondary={tokens.text.secondary}
      />
      <MacroBarRow
        label="Carbs"
        current={carbsG}
        target={carbsTarget}
        color={tokens.macro.carbs}
        trackColor={tokens.accent.muted}
        textPrimary={tokens.text.primary}
        textSecondary={tokens.text.secondary}
      />
      <MacroBarRow
        label="Fat"
        current={fatG}
        target={fatTarget}
        color={tokens.macro.fat}
        trackColor={tokens.accent.muted}
        textPrimary={tokens.text.primary}
        textSecondary={tokens.text.secondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 12,
  },
  row: {
    gap: 8,
  },
  rowHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/HomeHero/MacrosPage.tsx
git commit -m "[ui-redesign] add MacrosPage with three animated macro bars"
```

---

## Task 17: `WaterPage` (hero page 3)

**Files:**
- Create: `components/HomeHero/WaterPage.tsx`

- [ ] **Step 1: Write the component**

Create `components/HomeHero/WaterPage.tsx`:

```typescript
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { WaterGlass } from './WaterGlass';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { WATER_INCREMENT_ML } from '@/constants/Spacing';

interface WaterPageProps {
  currentMl: number;
  targetMl: number;
  onAdd: (ml: number) => void;
}

export function WaterPage({ currentMl, targetMl, onAdd }: WaterPageProps) {
  const tokens = useTokens();
  const reduceMotion = useReduceMotion();

  const fill = targetMl > 0 ? Math.min(1, currentMl / targetMl) : 0;
  const currentL = (currentMl / 1000).toFixed(1);
  const targetL = (targetMl / 1000).toFixed(1);

  const handleAdd = () => {
    if (currentMl < targetMl) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onAdd(WATER_INCREMENT_ML);
  };

  return (
    <Pressable style={styles.page} onPress={handleAdd}>
      <WaterGlass
        fill={fill}
        strokeColor={tokens.accent.primary}
        fillColor={tokens.accent.primary}
        reduceMotion={reduceMotion}
      />
      <Text style={[Type.displayHeroSmall, { color: tokens.text.primary }, styles.value]}>
        {currentL} <Text style={[Type.textMd, { color: tokens.text.secondary }]}>/ {targetL} L</Text>
      </Text>
      <View style={[styles.hintChip, { borderColor: tokens.accent.primary }]}>
        <Text style={[Type.monoSm, { color: tokens.accent.primary }]}>Tap to add +250 ml</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  value: {
    marginTop: 8,
  },
  hintChip: {
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
  },
});
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/HomeHero/WaterPage.tsx
git commit -m "[ui-redesign] add WaterPage with tap-to-add and haptic"
```

---

## Task 18: `WeightPage` (hero page 4)

**Files:**
- Create: `components/HomeHero/WeightPage.tsx`

- [ ] **Step 1: Write the component**

Create `components/HomeHero/WeightPage.tsx`:

```typescript
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Sparkline } from './Sparkline';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { buildSparklineSeries } from '@/utils/sparklineData';
import { weeklyWeightDelta } from '@/utils/weightDelta';
import type { WeightEntry } from '@/utils/sparklineData';

interface WeightPageProps {
  entries: WeightEntry[];
  anchorDate: string;
  goal: 'lose' | 'maintain' | 'gain';
  onLogTap: () => void;
}

export function WeightPage({ entries, anchorDate, goal, onLogTap }: WeightPageProps) {
  const tokens = useTokens();
  const reduceMotion = useReduceMotion();

  const series = useMemo(
    () => buildSparklineSeries(entries, anchorDate),
    [entries, anchorDate],
  );
  const delta = useMemo(() => weeklyWeightDelta(series), [series]);
  const actualCount = useMemo(() => series.filter((p) => p.actual).length, [series]);

  const latest = useMemo(() => {
    const actuals = series.filter((p) => p.actual);
    return actuals.length > 0 ? actuals[actuals.length - 1].weightKg : null;
  }, [series]);

  const deltaSign = delta === null ? '' : delta > 0 ? '+' : delta < 0 ? '−' : '±';
  const deltaAbs = delta === null ? '' : Math.abs(delta).toFixed(1);

  const deltaColor =
    delta === null
      ? tokens.text.secondary
      : (goal === 'lose' && delta > 0) || (goal === 'gain' && delta < 0)
      ? tokens.status.warning
      : tokens.text.secondary;

  return (
    <Pressable style={styles.page} onPress={onLogTap}>
      <View style={styles.top}>
        {latest !== null ? (
          <>
            <Text style={[Type.displayHero, { color: tokens.text.primary }]}>
              {latest.toFixed(1)} <Text style={[Type.textMd, { color: tokens.text.secondary }]}>kg</Text>
            </Text>
            {delta !== null && (
              <Text style={[Type.monoSm, { color: deltaColor }]}>
                {deltaSign}{deltaAbs} kg this week
              </Text>
            )}
          </>
        ) : (
          <Text style={[Type.textXl, { color: tokens.text.primary }]}>Log your weight</Text>
        )}
      </View>
      <View style={styles.chart}>
        {actualCount >= 2 ? (
          <Sparkline
            series={series}
            color={`${tokens.accent.primary}99`}
            width={280}
            height={64}
            reduceMotion={reduceMotion}
          />
        ) : (
          <Text style={[Type.textMd, { color: tokens.text.secondary }, styles.placeholder]}>
            Log your weight regularly to see trends.
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    justifyContent: 'space-between',
  },
  top: {
    alignItems: 'flex-start',
    gap: 4,
  },
  chart: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
  },
  placeholder: {
    textAlign: 'center',
  },
});
```

Note: `'#B8553A99'` syntax appends an alpha hex byte (60% opacity ≈ 99 hex). Some platforms accept this; if rendering looks wrong on Android, replace with `rgba(184, 85, 58, 0.6)` and read terracotta from token.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/HomeHero/WeightPage.tsx
git commit -m "[ui-redesign] add WeightPage with sparkline + weekly delta"
```

---

## Task 19: `HomeHeroPager` (swipeable container)

**Files:**
- Create: `components/HomeHero/HomeHeroPager.tsx`

- [ ] **Step 1: Write the component**

Create `components/HomeHero/HomeHeroPager.tsx`:

```typescript
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { PageDots } from './PageDots';
import { useTokens } from '@/hooks/useTokens';
import { BORDER_RADIUS, SPACING } from '@/constants/Spacing';

interface HomeHeroPagerProps {
  pages: ReactNode[];
}

export function HomeHeroPager({ pages }: HomeHeroPagerProps) {
  const tokens = useTokens();
  const [active, setActive] = useState(0);

  return (
    <View style={styles.outer}>
      <View
        style={[
          styles.canvas,
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
        <PagerView
          style={styles.pager}
          initialPage={0}
          onPageSelected={(e) => setActive(e.nativeEvent.position)}
        >
          {pages.map((page, i) => (
            <View key={i} style={styles.page}>
              {page}
            </View>
          ))}
        </PagerView>
        <View style={styles.dotsRow}>
          <PageDots count={pages.length} activeIndex={active} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: SPACING.md,
    // Reserve right padding so the canvas peeks the next page
    paddingRight: SPACING.md - 10,
  },
  canvas: {
    height: 320,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  dotsRow: {
    position: 'absolute',
    bottom: SPACING.md,
    left: 0,
    right: 0,
  },
});
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/HomeHero/HomeHeroPager.tsx
git commit -m "[ui-redesign] add HomeHeroPager with PagerView + edge peek + dots"
```

---

## Task 20: `HomeHeader` component

**Files:**
- Create: `components/HomeHeader.tsx`

- [ ] **Step 1: Write the component**

Create `components/HomeHeader.tsx`:

```typescript
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { SPACING } from '@/constants/Spacing';

interface HomeHeaderProps {
  date: string;
  greeting: string;
}

export function HomeHeader({ date, greeting }: HomeHeaderProps) {
  const tokens = useTokens();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.md }]}>
      <Text style={[Type.textSm, { color: tokens.text.secondary }]}>{date}</Text>
      <Text style={[Type.displayTitle, { color: tokens.text.primary }, styles.greeting]}>
        {greeting}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  greeting: {
    marginTop: SPACING.xs,
  },
});
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/HomeHeader.tsx
git commit -m "[ui-redesign] add HomeHeader (date + greeting)"
```

---

## Task 21: `WatchNudgeBanner` component

**Files:**
- Create: `components/WatchNudgeBanner.tsx`

- [ ] **Step 1: Write the component**

Create `components/WatchNudgeBanner.tsx`:

```typescript
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { BORDER_RADIUS, SPACING } from '@/constants/Spacing';

interface WatchNudgeBannerProps {
  onConnectZepp: () => void;
  onConnectHealth: () => void;
  onDismiss: () => void;
}

export function WatchNudgeBanner({ onConnectZepp, onConnectHealth, onDismiss }: WatchNudgeBannerProps) {
  const tokens = useTokens();
  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: tokens.accent.muted,
        },
      ]}
    >
      <View style={styles.textWrap}>
        <Text style={[Type.textMd, { color: tokens.text.primary }]} numberOfLines={1}>
          Connect a watch for accurate burn data
        </Text>
      </View>
      <Pressable
        onPress={onConnectZepp}
        style={[styles.connectBtn, { backgroundColor: tokens.accent.primary }]}
      >
        <Text style={[Type.textSm, { color: '#FFFFFF' }]}>Connect</Text>
      </Pressable>
      <Pressable hitSlop={8} onPress={onDismiss} style={styles.dismiss} accessibilityLabel="Dismiss">
        <X size={18} color={tokens.text.secondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    height: 60,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  textWrap: {
    flex: 1,
  },
  connectBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.button,
  },
  dismiss: {
    padding: 4,
  },
});
```

Note: this uses `onConnectZepp` directly (no method picker). If both Zepp and HealthKit options need exposure, we keep the original two-button shape — for now we collapse to single primary action since the banner is slim. If platform-specific routing is desired, the implementer can split based on `Platform.OS` inside the handler.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/WatchNudgeBanner.tsx
git commit -m "[ui-redesign] add WatchNudgeBanner (slim conditional banner)"
```

---

## Task 22: `FoodLogRow` component (with swipe-to-delete)

**Files:**
- Create: `components/FoodLogRow.tsx`

- [ ] **Step 1: Write the component**

Create `components/FoodLogRow.tsx`:

```typescript
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { Trash2 } from 'lucide-react-native';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { SPACING } from '@/constants/Spacing';
import type { FoodLogItem } from '@/types';

interface FoodLogRowProps {
  item: FoodLogItem;
  onDelete: (id: string) => void;
  isLast?: boolean;
}

function formatTime(ts: string): string {
  const d = new Date(ts);
  const h = d.getHours();
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mm} ${ampm}`;
}

export function FoodLogRow({ item, onDelete, isLast }: FoodLogRowProps) {
  const tokens = useTokens();
  const [pressed, setPressed] = useState(false);

  const renderRightActions = () => (
    <RectButton
      style={[styles.deleteAction, { backgroundColor: tokens.status.danger }]}
      onPress={() => onDelete(item.id)}
    >
      <Trash2 size={20} color="#FFFFFF" />
    </RectButton>
  );

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <Pressable
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={[
          styles.row,
          {
            backgroundColor: pressed ? tokens.bg.surfaceMuted : tokens.bg.primary,
            borderBottomColor: isLast ? 'transparent' : tokens.border.hairline,
          },
        ]}
      >
        <View style={styles.left}>
          <Text style={[Type.textLg, { color: tokens.text.primary }]} numberOfLines={1}>
            {item.foodName}
          </Text>
          <Text style={[Type.textSm, { color: tokens.text.secondary }]} numberOfLines={1}>
            {item.servingQuantity} × {item.servingSize} · {formatTime(item.timestamp)}
          </Text>
        </View>
        <View style={styles.right}>
          <Text style={[Type.monoLg, { color: tokens.text.primary }]}>
            {Math.round(item.calories)}
          </Text>
          <Text style={[Type.monoSm, { color: tokens.text.tertiary }]}>kcal</Text>
        </View>
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    minHeight: 64,
    borderBottomWidth: 1,
  },
  left: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  right: {
    alignItems: 'flex-end',
  },
  deleteAction: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/FoodLogRow.tsx
git commit -m "[ui-redesign] add FoodLogRow (borderless row with hairline divider)"
```

---

## Task 23: `HeroFab` floating "+" button

**Files:**
- Create: `components/HeroFab.tsx`

- [ ] **Step 1: Write the component**

Create `components/HeroFab.tsx`:

```typescript
import { Pressable, StyleSheet, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTokens } from '@/hooks/useTokens';
import { PressScale } from '@/constants/Motion';

interface HeroFabProps {
  onPress: () => void;
}

export function HeroFab({ onPress }: HeroFabProps) {
  const tokens = useTokens();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = () => {
    scale.value = withTiming(PressScale.scaleTo, { duration: PressScale.pressDuration });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: PressScale.releaseDuration });
  };

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Animated.View style={[animStyle]}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityLabel="Log food"
          style={[
            styles.fab,
            {
              backgroundColor: tokens.accent.primary,
              shadowColor: tokens.accent.primary,
              shadowOpacity: 0.22,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: 8,
            },
          ]}
        >
          <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/HeroFab.tsx
git commit -m "[ui-redesign] add HeroFab (floating terracotta + button)"
```

---

## Task 24: `LogMethodsSheet` (bottom sheet)

**Files:**
- Create: `components/LogMethodsSheet.tsx`

- [ ] **Step 1: Write the component**

Create `components/LogMethodsSheet.tsx`:

```typescript
import { useEffect } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { Search, ScanBarcode, Camera, ScanText, ChevronRight } from 'lucide-react-native';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { BORDER_RADIUS, SPACING } from '@/constants/Spacing';
import { Duration } from '@/constants/Motion';
import type { LucideIcon } from 'lucide-react-native';

interface MethodRow {
  icon: LucideIcon;
  title: string;
  description: string;
  available: boolean;
  route: string;
}

const METHODS: MethodRow[] = [
  {
    icon: Search,
    title: 'Search foods',
    description: 'USDA & Open Food Facts',
    available: true,
    route: '/food-search',
  },
  {
    icon: ScanBarcode,
    title: 'Scan barcode',
    description: 'Product UPC / EAN',
    available: true,
    route: '/barcode-scan',
  },
  {
    icon: Camera,
    title: 'Photo scan',
    description: 'AI identifies your meal',
    available: false, // gated until photo-scan route lands (steps 10-15)
    route: '/photo-scan',
  },
  {
    icon: ScanText,
    title: 'Scan label',
    description: 'Read a nutrition facts panel',
    available: false, // gated until label-scan route lands (steps 10-15)
    route: '/label-scan',
  },
];

interface LogMethodsSheetProps {
  visible: boolean;
  onDismiss: () => void;
}

export function LogMethodsSheet({ visible, onDismiss }: LogMethodsSheetProps) {
  const tokens = useTokens();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(800);
  const backdrop = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, {
        duration: Duration.medium,
        easing: Easing.out(Easing.ease),
      });
      backdrop.value = withTiming(0.4, { duration: 200 });
    } else {
      translateY.value = 800;
      backdrop.value = 0;
    }
  }, [visible, translateY, backdrop]);

  const handleDismiss = () => {
    translateY.value = withTiming(800, {
      duration: 250,
      easing: Easing.in(Easing.ease),
    }, (finished) => {
      if (finished) runOnJS(onDismiss)();
    });
    backdrop.value = withTiming(0, { duration: 200 });
  };

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }));

  const handleRowPress = (method: MethodRow) => {
    if (!method.available) return;
    handleDismiss();
    setTimeout(() => router.push(method.route as never), 260);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleDismiss}>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            {
              backgroundColor: tokens.bg.surface,
              paddingBottom: insets.bottom + SPACING.md,
            },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: tokens.text.tertiary }]} />
          <Text style={[Type.displayTitle, { color: tokens.text.primary }, styles.title]}>
            Log food
          </Text>
          <Text style={[Type.textSm, { color: tokens.text.secondary }, styles.subtitle]}>
            Choose how to add food
          </Text>
          <View style={styles.list}>
            {METHODS.map((m, idx) => {
              const Icon = m.icon;
              const isLast = idx === METHODS.length - 1;
              return (
                <Pressable
                  key={m.title}
                  onPress={() => handleRowPress(m)}
                  style={[
                    styles.row,
                    {
                      borderBottomColor: isLast ? 'transparent' : tokens.border.hairline,
                      opacity: m.available ? 1 : 0.55,
                    },
                  ]}
                >
                  <Icon size={22} color={tokens.text.primary} />
                  <View style={styles.rowText}>
                    <Text style={[Type.textLg, { color: tokens.text.primary }]}>{m.title}</Text>
                    <Text style={[Type.textSm, { color: tokens.text.secondary }]}>
                      {m.description}
                    </Text>
                  </View>
                  {!m.available ? (
                    <View style={[styles.soonPill, { backgroundColor: tokens.bg.surfaceMuted }]}>
                      <Text style={[Type.textXs, { color: tokens.text.secondary }]}>Soon</Text>
                    </View>
                  ) : (
                    <ChevronRight size={18} color={tokens.accent.primary} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: '#1A1A1A',
  },
  sheet: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    marginTop: SPACING.xs,
  },
  subtitle: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  list: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    borderBottomWidth: 1,
  },
  rowText: {
    flex: 1,
  },
  soonPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
});
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/LogMethodsSheet.tsx
git commit -m "[ui-redesign] add LogMethodsSheet bottom sheet (Modal + Reanimated)"
```

---

## Task 25: `TabBarWithFab` component

**Files:**
- Create: `components/TabBarWithFab.tsx`

- [ ] **Step 1: Write the component**

Create `components/TabBarWithFab.tsx`:

```typescript
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, UtensilsCrossed, Settings } from 'lucide-react-native';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { HeroFab } from './HeroFab';
import { LogMethodsSheet } from './LogMethodsSheet';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const ICONS: Record<string, typeof House> = {
  index: House,
  meals: UtensilsCrossed,
  settings: Settings,
};

const LABELS: Record<string, string> = {
  index: 'Home',
  meals: 'Meals',
  settings: 'Settings',
};

export function TabBarWithFab({ state, navigation }: BottomTabBarProps) {
  const tokens = useTokens();
  const insets = useSafeAreaInsets();
  const [sheetVisible, setSheetVisible] = useState(false);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: tokens.bg.surface,
          borderTopColor: tokens.border.hairline,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.row}>
        {state.routes.map((route, idx) => {
          const focused = state.index === idx;
          const Icon = ICONS[route.name] ?? House;
          const label = LABELS[route.name] ?? route.name;
          const color = focused ? tokens.accent.primary : tokens.text.tertiary;
          return (
            <Pressable
              key={route.key}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={styles.tab}
            >
              <Icon size={22} color={color} />
              <Text style={[Type.textXs, { color }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.fabPosition} pointerEvents="box-none">
        <HeroFab onPress={() => setSheetVisible(true)} />
      </View>
      <LogMethodsSheet visible={sheetVisible} onDismiss={() => setSheetVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
  },
  row: {
    flexDirection: 'row',
    height: 56,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  fabPosition: {
    position: 'absolute',
    top: -34, // half of 56 (FAB) + 6pt above the bar = -34
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/TabBarWithFab.tsx
git commit -m "[ui-redesign] add TabBarWithFab custom tab bar with floating + button"
```

---

## Task 26: Restructure `(tabs)/_layout.tsx`

**Files:**
- Modify: `app/(tabs)/_layout.tsx`
- Delete: `app/(tabs)/log.tsx`

- [ ] **Step 1: Replace tab layout**

Replace the entire contents of `app/(tabs)/_layout.tsx`:

```typescript
import { Tabs } from 'expo-router';
import { TabBarWithFab } from '@/components/TabBarWithFab';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBarWithFab {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="meals" options={{ title: 'Meals' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
```

- [ ] **Step 2: Delete the Log tab**

Run: `rm app/\(tabs\)/log.tsx`

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors. If there are import errors elsewhere referencing `/(tabs)/log`, address in this same task.

- [ ] **Step 4: Manual smoke test**

Run: `npx expo start`

The app should boot. Tab bar should now show Home, Meals, Settings + the floating "+" button. Tapping "+" should open the bottom sheet. Search and Barcode rows route correctly; Photo and Label show "Soon".

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/_layout.tsx
git rm app/\(tabs\)/log.tsx
git commit -m "[ui-redesign] swap to 3-tab layout with TabBarWithFab; remove Log tab"
```

---

## Task 27: New home screen `(tabs)/index.tsx` (with weight log modal)

**Files:**
- Create: `components/WeightLogModal.tsx`
- Modify: `app/(tabs)/index.tsx`
- Modify: `types/index.ts` (add re-export)

- [ ] **Step 0a: Verify `dailyLogStore` exposes a `setBodyWeight` action**

Run: `grep -n "setBodyWeight\|bodyWeightKg" store/dailyLogStore.ts`

If `setBodyWeight(date: string, weightKg: number)` already exists, proceed. If not, add this action to the store:

```typescript
// inside store/dailyLogStore.ts, in the create() body:
setBodyWeight: (date: string, weightKg: number) =>
  set((state) => ({
    logs: {
      ...state.logs,
      [date]: {
        ...(state.logs[date] ?? { date, foodItems: [], waterMl: 0, caloriesBurned: 0, caloriesBurnedSource: 'manual' }),
        bodyWeightKg: weightKg,
      },
    },
  })),
```

And expose in the store's TypeScript interface. If the existing store uses a different shape (e.g., array of logs), match the existing pattern instead.

- [ ] **Step 0b: Create `components/WeightLogModal.tsx`**

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

interface WeightLogModalProps {
  visible: boolean;
  unit: 'metric' | 'imperial';
  initialWeightKg?: number;
  onSave: (weightKg: number) => void;
  onDismiss: () => void;
}

export function WeightLogModal({
  visible,
  unit,
  initialWeightKg,
  onSave,
  onDismiss,
}: WeightLogModalProps) {
  const tokens = useTokens();
  const [text, setText] = useState('');

  useEffect(() => {
    if (visible) {
      const initial =
        initialWeightKg === undefined
          ? ''
          : unit === 'imperial'
          ? (initialWeightKg * 2.20462).toFixed(1)
          : initialWeightKg.toFixed(1);
      setText(initial);
    }
  }, [visible, initialWeightKg, unit]);

  const handleSave = () => {
    const parsed = parseFloat(text.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const kg = unit === 'imperial' ? parsed / 2.20462 : parsed;
    onSave(Math.round(kg * 10) / 10);
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        <View style={[styles.card, { backgroundColor: tokens.bg.surface }]}>
          <Text style={[Type.displayTitle, { color: tokens.text.primary }]}>Log weight</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: tokens.bg.surfaceMuted,
                  color: tokens.text.primary,
                  fontFamily: 'JetBrainsMono_500Medium',
                },
              ]}
              value={text}
              onChangeText={setText}
              keyboardType="decimal-pad"
              autoFocus
              placeholder={unit === 'imperial' ? 'lb' : 'kg'}
              placeholderTextColor={tokens.text.tertiary}
              maxLength={6}
            />
            <Text style={[Type.textLg, { color: tokens.text.secondary }]}>
              {unit === 'imperial' ? 'lb' : 'kg'}
            </Text>
          </View>
          <View style={styles.buttons}>
            <Pressable
              onPress={onDismiss}
              style={[styles.btn, { borderColor: tokens.border.hairline }]}
            >
              <Text style={[Type.textMd, { color: tokens.text.secondary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={[styles.btn, styles.btnPrimary, { backgroundColor: tokens.accent.primary }]}
            >
              <Text style={[Type.textMd, { color: '#FFFFFF' }]}>Save</Text>
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
    gap: SPACING.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  input: {
    flex: 1,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    fontSize: 24,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
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

- [ ] **Step 1: Replace the home screen**

Replace the entire contents of `app/(tabs)/index.tsx`:

```typescript
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useTokens } from '@/hooks/useTokens';
import { HomeHeader } from '@/components/HomeHeader';
import { HomeHeroPager } from '@/components/HomeHero/HomeHeroPager';
import { CaloriesPage } from '@/components/HomeHero/CaloriesPage';
import { MacrosPage } from '@/components/HomeHero/MacrosPage';
import { WaterPage } from '@/components/HomeHero/WaterPage';
import { WeightPage } from '@/components/HomeHero/WeightPage';
import { WatchNudgeBanner } from '@/components/WatchNudgeBanner';
import { FoodLogRow } from '@/components/FoodLogRow';
import { WeightLogModal } from '@/components/WeightLogModal';
import { Type } from '@/constants/Typography';
import { SPACING } from '@/constants/Spacing';
import { useAmazfit } from '@/hooks/useAmazfit';
import { useDailyLog } from '@/hooks/useDailyLog';
import { useDailyLogStore } from '@/store/dailyLogStore';
import { useUserStore } from '@/store/userStore';
import { getTodayDateString, formatDisplayDate, getTimeOfDayGreeting } from '@/utils/dateUtils';
import type { FoodLogItem as FoodLogItemType, WeightEntry } from '@/types';

export default function HomeScreen() {
  const tokens = useTokens();
  const profile = useUserStore((state) => state.profile);
  const { log, totals, addWater, removeFoodItem } = useDailyLog();
  const allLogs = useDailyLogStore((s) => s.logs);
  const setBodyWeight = useDailyLogStore((s) => s.setBodyWeight);
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const {
    connectionTier,
    nudgeDismissed,
    syncing,
    connectZepp,
    connectHealthKit,
    sync,
    dismissNudge,
  } = useAmazfit();

  const [refreshing, setRefreshing] = useState(false);

  const greeting = useMemo(() => {
    const base = getTimeOfDayGreeting();
    return profile?.name ? `${base}, ${profile.name}` : base;
  }, [profile?.name]);

  const today = getTodayDateString();

  const weightEntries = useMemo<WeightEntry[]>(() => {
    return Object.values(allLogs)
      .filter((l) => typeof l.bodyWeightKg === 'number')
      .map((l) => ({ date: l.date, weightKg: l.bodyWeightKg as number }));
  }, [allLogs]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await sync();
    setRefreshing(false);
  }, [sync]);

  const handleLogWeight = useCallback(() => {
    setWeightModalOpen(true);
  }, []);

  const handleWeightSave = useCallback(
    (kg: number) => {
      setBodyWeight(today, kg);
    },
    [setBodyWeight, today],
  );

  const latestWeightKg = useMemo(() => {
    const todayLog = allLogs[today];
    if (todayLog?.bodyWeightKg) return todayLog.bodyWeightKg;
    const sorted = Object.values(allLogs)
      .filter((l) => typeof l.bodyWeightKg === 'number')
      .sort((a, b) => b.date.localeCompare(a.date));
    return sorted[0]?.bodyWeightKg;
  }, [allLogs, today]);

  const renderItem = useCallback(
    ({ item, index }: { item: FoodLogItemType; index: number }) => (
      <FoodLogRow
        item={item}
        onDelete={removeFoodItem}
        isLast={index === log.foodItems.length - 1}
      />
    ),
    [removeFoodItem, log.foodItems.length],
  );

  const showNudge = connectionTier === 'none' && !nudgeDismissed;

  const heroPages = useMemo(
    () => [
      <CaloriesPage
        key="cal"
        eaten={totals.totalCalories}
        burned={log.caloriesBurned}
        target={profile?.dailyCalorieTarget ?? 2000}
      />,
      <MacrosPage
        key="mac"
        proteinG={totals.totalProteinG}
        carbsG={totals.totalCarbsG}
        fatG={totals.totalFatG}
        proteinTarget={profile?.dailyProteinTarget ?? 120}
        carbsTarget={profile?.dailyCarbTarget ?? 250}
        fatTarget={profile?.dailyFatTarget ?? 65}
      />,
      <WaterPage
        key="wat"
        currentMl={log.waterMl}
        targetMl={profile?.dailyWaterTargetMl ?? 2000}
        onAdd={addWater}
      />,
      <WeightPage
        key="wgt"
        entries={weightEntries}
        anchorDate={today}
        goal={profile?.goal ?? 'maintain'}
        onLogTap={handleLogWeight}
      />,
    ],
    [
      totals,
      log,
      profile,
      addWater,
      weightEntries,
      today,
      handleLogWeight,
    ],
  );

  const listHeader = useMemo(
    () => (
      <View>
        <HomeHeader date={formatDisplayDate(new Date())} greeting={greeting} />
        {showNudge && (
          <WatchNudgeBanner
            onConnectZepp={connectZepp}
            onConnectHealth={connectHealthKit}
            onDismiss={dismissNudge}
          />
        )}
        <HomeHeroPager pages={heroPages} />
        <Text style={[Type.textXs, { color: tokens.text.secondary }, styles.sectionHeader]}>
          TODAY'S LOG
        </Text>
      </View>
    ),
    [greeting, showNudge, connectZepp, connectHealthKit, dismissNudge, heroPages, tokens.text.secondary],
  );

  const emptyComponent = useMemo(
    () => (
      <View style={styles.empty}>
        <Text style={[Type.displayTitle, { color: tokens.text.primary }]}>No food logged yet</Text>
        <Text style={[Type.textMd, { color: tokens.text.secondary }, styles.emptyBody]}>
          Tap + below to add your first entry.
        </Text>
      </View>
    ),
    [tokens.text.primary, tokens.text.secondary],
  );

  return (
    <View style={[styles.container, { backgroundColor: tokens.bg.primary }]}>
      <FlatList<FoodLogItemType>
        data={log.foodItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || syncing}
            onRefresh={handleRefresh}
            tintColor={tokens.accent.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      <WeightLogModal
        visible={weightModalOpen}
        unit={profile?.units ?? 'metric'}
        initialWeightKg={latestWeightKg}
        onSave={handleWeightSave}
        onDismiss={() => setWeightModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { flexGrow: 1, paddingBottom: 120 },
  sectionHeader: {
    textTransform: 'uppercase',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  empty: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyBody: {
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
});
```

Note: `WeightEntry` must be exported from `@/types`. Add this in step 2.

- [ ] **Step 2: Export `WeightEntry` from `@/types`**

Modify `types/index.ts` to add this export at the bottom:

```typescript
export type { WeightEntry } from '@/utils/sparklineData';
```

- [ ] **Step 3: Verify `useDailyLogStore` exposes `logs` map and `useDailyLog` exposes `addWater` & `removeFoodItem`**

Run: `grep -n "addWater\|removeFoodItem\|logs:" hooks/useDailyLog.ts store/dailyLogStore.ts`

Expected: both names appear. If `addWater` is named differently in `useDailyLog`, alias the destructure to match. If `logs` is structured differently (e.g., `logsByDate`), update the `weightEntries` memo accordingly.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors. Adjust the destructured names if they differ from spec.

- [ ] **Step 5: Manual smoke test**

Run: `npx expo start`

Open home. Verify: header renders with date + greeting; hero canvas shows; swipe between 4 pages; tap water page increments by 250ml; weight page shows placeholder if no weight entries; food log rows render below; "+" FAB visible; tapping "+" opens sheet.

- [ ] **Step 6: Commit**

```bash
git add app/\(tabs\)/index.tsx types/index.ts components/WeightLogModal.tsx store/dailyLogStore.ts
git commit -m "[ui-redesign] new home screen: header + 4-page hero pager + log list + weight modal"
```

---

## Task 28: Restyle `confirm-food.tsx` (token application)

**Files:**
- Modify: `app/confirm-food.tsx`

- [ ] **Step 1: Apply tokens**

Replace the imports and StyleSheet usages in `app/confirm-food.tsx` so that:

- `useColorScheme` + `Colors[colorScheme]` is replaced by `useTokens()` returning `tokens`.
- All `colors.background` → `tokens.bg.primary`, `colors.card` → `tokens.bg.surface`, `colors.text` → `tokens.text.primary`, `colors.placeholder` → `tokens.text.secondary`, `colors.border` → `tokens.border.hairline`, `colors.tint` → `tokens.accent.primary`, `colors.danger` → `tokens.status.danger`.
- Remove every `borderColor` / `borderWidth: 1` from card styles. Replace with `shadowColor: '#1A1A1A', shadowOpacity: 0.04, shadowRadius: 16, shadowOffset: { width: 0, height: 2 }, elevation: 2`.
- Calorie total `Text` uses `Type.displayHero` from `@/constants/Typography`. Macro values inside `MacroBar` (kept as-is for now) should use `Type.monoMd`.
- Primary "Add to Log" button `backgroundColor` is `tokens.accent.primary` when enabled; `tokens.bg.surfaceMuted` when disabled.

Read the current file at `app/confirm-food.tsx` and apply these replacements throughout.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Manual smoke test**

Open the app, navigate Home → "+" → Search → pick a food → confirm screen. Verify: borderless cards, terracotta button, Fraunces calorie number, mono macros.

- [ ] **Step 4: Commit**

```bash
git add app/confirm-food.tsx
git commit -m "[ui-redesign] restyle confirm-food screen with new tokens"
```

---

## Task 29: Restyle `food-search.tsx` + `FoodSearchResultItem.tsx`

**Files:**
- Modify: `app/food-search.tsx`
- Modify: `components/FoodSearchResultItem.tsx`

- [ ] **Step 1: Restyle `FoodSearchResultItem.tsx`**

Read the current `components/FoodSearchResultItem.tsx`. Replace `Colors`/`useColorScheme` with `useTokens()`. Result row should match `FoodLogRow` aesthetics: borderless, hairline divider, name in `Type.textLg`, calories in `Type.monoLg`, secondary line in `Type.textSm`. The skeleton variant uses `tokens.bg.surfaceMuted` blocks.

- [ ] **Step 2: Restyle `app/food-search.tsx`**

Replace `Colors`/`useColorScheme` with `useTokens()`. Search input: 48pt height, 16pt radius, `tokens.bg.surface` background, no border. List background `tokens.bg.primary`. Empty/skeleton states use `tokens.text.secondary`.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 4: Manual smoke test**

Open Home → "+" → Search. Type "chicken." Verify: search input matches new look; results render in row style; tapping a result navigates to confirm-food.

- [ ] **Step 5: Commit**

```bash
git add app/food-search.tsx components/FoodSearchResultItem.tsx
git commit -m "[ui-redesign] restyle food-search + FoodSearchResultItem with new tokens"
```

---

## Task 30: Restyle `(tabs)/meals.tsx` + `SavedMealCard.tsx`

**Files:**
- Modify: `app/(tabs)/meals.tsx`
- Modify: `components/SavedMealCard.tsx`

- [ ] **Step 1: Restyle `SavedMealCard.tsx`**

Read and replace `Colors`/`useColorScheme` with `useTokens()`. Remove all 1px borders. Add shadow.subtle. Title in `Type.textLg`, totals in `Type.monoMd`, item count in `Type.textSm`.

- [ ] **Step 2: Restyle `(tabs)/meals.tsx`**

Replace `Colors`/`useColorScheme` with `useTokens()`. Heading in `Type.displayTitle`. Search input matches `food-search.tsx` style. List background `tokens.bg.primary`. Empty state in `Type.displayTitle` + `Type.textMd` secondary.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 4: Manual smoke test**

Tap Meals tab. Verify new look. If saved meals exist, verify card render. If empty, verify empty state.

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/meals.tsx components/SavedMealCard.tsx
git commit -m "[ui-redesign] restyle meals tab + SavedMealCard with new tokens"
```

---

## Task 31: Restyle `(tabs)/settings.tsx`

**Files:**
- Modify: `app/(tabs)/settings.tsx`

- [ ] **Step 1: Restyle**

Read the current file and replace `Colors`/`useColorScheme` with `useTokens()`. Section headers in `Type.textXs` uppercase letter-spaced. List rows: borderless with bottom hairline, 56pt min height. Destructive actions use `tokens.status.danger`.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Manual smoke test**

Tap Settings tab. Verify new section/list aesthetic.

- [ ] **Step 4: Commit**

```bash
git add app/\(tabs\)/settings.tsx
git commit -m "[ui-redesign] restyle settings tab with new tokens"
```

---

## Task 32: Restyle `barcode-scan.tsx` and `confirm-meal.tsx`

**Files:**
- Modify: `app/barcode-scan.tsx`
- Modify: `app/confirm-meal.tsx`

- [ ] **Step 1: Restyle each**

For each file, replace `Colors`/`useColorScheme` with `useTokens()`. Apply token names per the conventions established in Task 28.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/barcode-scan.tsx app/confirm-meal.tsx
git commit -m "[ui-redesign] restyle barcode-scan + confirm-meal with new tokens"
```

---

## Task 33: Restyle onboarding screens

**Files:**
- Modify: `app/onboarding/welcome.tsx`
- Modify: `app/onboarding/profile.tsx`
- Modify: `app/onboarding/activity.tsx`
- Modify: `app/onboarding/tdee-result.tsx`
- Modify: `app/onboarding/amazfit.tsx`
- Modify: `components/OnboardingHeader.tsx`
- Modify: `components/SelectOption.tsx`
- Modify: `components/HeightWeightInputs.tsx`

- [ ] **Step 1: Restyle each**

For every file: replace `Colors`/`useColorScheme` with `useTokens()`. Replace `colors.tint` with `tokens.accent.primary`, etc. Hero numbers (TDEE result) use `Type.displayHero`. Body uses `Type.textMd`. Buttons use 14pt radius (`BORDER_RADIUS.button`).

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Manual smoke test**

To test onboarding, set `profile.onboardingComplete = false` in MMKV (or wipe app data) and re-run. Walk all onboarding screens.

- [ ] **Step 4: Commit**

```bash
git add app/onboarding components/OnboardingHeader.tsx components/SelectOption.tsx components/HeightWeightInputs.tsx
git commit -m "[ui-redesign] restyle onboarding screens with new tokens"
```

---

## Task 34: Restyle `MacroBar.tsx`

**Files:**
- Modify: `components/MacroBar.tsx`

- [ ] **Step 1: Restyle**

Replace `Colors`/`useColorScheme` with `useTokens()`. Bars use `tokens.macro.protein`, `tokens.macro.carbs`, `tokens.macro.fat`. Track uses `tokens.accent.muted`. Numerics use `Type.monoMd`.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/MacroBar.tsx
git commit -m "[ui-redesign] restyle MacroBar with new tokens"
```

---

## Task 35: Delete unused old components

**Files:**
- Delete: `components/NetCaloriesCard.tsx`
- Delete: `components/BurnedCaloriesCard.tsx`
- Delete: `components/WaterTracker.tsx`
- Delete: `components/WatchNudgeCard.tsx`
- Delete: `components/FoodLogItem.tsx`
- Delete: `constants/Colors.ts`

- [ ] **Step 1: Verify no remaining references**

Run: `grep -rn "NetCaloriesCard\|BurnedCaloriesCard\|WaterTracker\|WatchNudgeCard\|from '@/components/FoodLogItem'\|from '@/constants/Colors'" --include='*.ts' --include='*.tsx' .`

Expected: no matches in `app/` or `components/` (only the files-to-be-deleted should reference each other internally).

If any reference remains, fix it before deleting.

- [ ] **Step 2: Delete files**

```bash
rm components/NetCaloriesCard.tsx \
   components/BurnedCaloriesCard.tsx \
   components/WaterTracker.tsx \
   components/WatchNudgeCard.tsx \
   components/FoodLogItem.tsx \
   constants/Colors.ts
```

- [ ] **Step 3: Type-check + tests**

Run: `npx tsc --noEmit && npm test -- --silent`

Expected: no errors, all tests pass.

- [ ] **Step 4: Commit**

```bash
git add -u components/ constants/Colors.ts
git commit -m "[ui-redesign] delete old card components and Colors.ts (replaced by Tokens.ts)"
```

---

## Task 36: Add Reduce Motion guards across motion sites

**Files:**
- Audit: every `withSpring`, `withTiming`, `withRepeat` call site

- [ ] **Step 1: Find all motion call sites**

Run: `grep -rn "withSpring\|withTiming\|withRepeat" --include='*.ts' --include='*.tsx' components/ app/`

For each match outside the hero page components (which already accept `reduceMotion`), confirm they take a `useReduceMotion()` early-return path: if `reduceMotion` is true, set the shared value directly to its target.

- [ ] **Step 2: Add guards where missing**

Specifically check: `HeroFab.tsx` (`withTiming` on press scale), `LogMethodsSheet.tsx` (`withTiming` on slide). For each, import `useReduceMotion` and skip the `withTiming` (set value to target instantly) when reduce motion is on.

Example pattern:

```typescript
const reduceMotion = useReduceMotion();
const handlePressIn = () => {
  if (reduceMotion) {
    scale.value = PressScale.scaleTo;
  } else {
    scale.value = withTiming(PressScale.scaleTo, { duration: PressScale.pressDuration });
  }
};
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 4: Manual smoke test**

Enable Reduce Motion in OS settings (iOS: Settings → Accessibility → Motion → Reduce Motion ON; Android: Settings → Accessibility → Remove animations ON). Reopen app. Verify: animations are instant or absent; UI still works.

- [ ] **Step 5: Commit**

```bash
git add -u components/
git commit -m "[ui-redesign] respect Reduce Motion across all animated sites"
```

---

## Task 37: Manual end-to-end test pass

**Files:**
- None (verification only)

- [ ] **Step 1: Cold-start flow**

Kill the app. Start fresh. Verify splash → fonts load → home renders without flash of unstyled text.

- [ ] **Step 2: Hero canvas exhaustive check**

On home, swipe through all 4 pages. Verify each renders correctly:
- Page 1: terracotta arc, Fraunces calorie number, count-up animates when a food is added.
- Page 2: three macro bars, each animates.
- Page 3: water glass, tap canvas → wave fills + haptic + count increments.
- Page 4: weight number + sparkline draws on focus.

- [ ] **Step 3: "+" flow**

Tap "+". Bottom sheet slides up. Tap each row:
- Search → routes to food-search → confirm-food → add to log → return to home → calorie ring fills with spring.
- Barcode → routes to barcode-scan.
- Photo / Label → "Soon" pill visible, no navigation (until steps 10-15 land).
- Backdrop tap dismisses sheet.
- Drag-down dismisses sheet.

- [ ] **Step 4: Tab navigation**

Switch between Home/Meals/Settings. Tab icons + labels swap colors smoothly.

- [ ] **Step 5: Light/dark mode**

Toggle OS theme. App should switch between light/dark token sets without crashes. Visual identity should hold in both.

- [ ] **Step 6: Reduce Motion**

Enable OS Reduce Motion. Animations should become instant; everything still functional.

- [ ] **Step 7: Run TypeScript + tests**

Run: `npx tsc --noEmit && npm test`

Expected: green on both.

- [ ] **Step 8: Commit a passing checkpoint**

If any small fixes were made during the test pass, commit them now:

```bash
git add -u
git commit -m "[ui-redesign] post-redesign QA fixes"
```

If no fixes needed, skip this commit.

- [ ] **Step 9: Final summary**

The redesign is complete. Branch should be pushed and a PR opened against `master` (or merged if working directly). Document any deferred items uncovered during QA as follow-up tickets.

---

## Done

When all tasks above are checked, the redesign is shipped. Two follow-up specs (per spec §5) will then be brainstormed and written:

1. Quantity input redesign on `confirm-food.tsx` (per-food units).
2. Cooked-meal portion tracking on Meals tab (recipes divided into servings).

Both will use the tokens / type / motion system established here.
