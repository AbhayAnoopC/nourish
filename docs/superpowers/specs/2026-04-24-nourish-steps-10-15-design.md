# Nourish — Steps 10–15 Design Spec

**Date:** 2026-04-24  
**Status:** Approved  
**Scope:** Steps 10–14 from PLANNING.md build order, plus step 15 polish. Voice logging (step 13) is cut.

---

## Context

Steps 1–9 are complete. The codebase has a working home dashboard, manual food search, barcode scanner, saved meals, water tracking, and Amazfit integration. The remaining work adds:

- Live macro display on the dashboard and body weight check-in (step 10)
- Photo meal scan via Anthropic Vision (step 11)
- Pantry system with nutrition label scan and barcode-to-pantry flow (step 12)
- Adaptive TDEE recalculation (step 14)
- Polish: skeletons, empty states, error handling, animations (step 15)

Voice logging is deferred indefinitely (requires a separate transcription service with no clear fit yet).

---

## Architecture Overview

| Unit | Steps | Key new files |
|---|---|---|
| Dashboard completion | 10 | `BodyWeightCard`, MacroBar wired to home screen |
| AI scan + Pantry | 11–12 | `app/api/scan+api.ts`, `services/anthropic.ts`, `app/photo-scan.tsx`, `app/label-scan.tsx`, `app/pantry-confirm.tsx`, `pantryStore.ts`, `PantryItem` type, Pantry section in Meals tab |
| Adaptive TDEE | 14 | `utils/adaptiveTdee.ts`, `useAdaptiveTdee.ts`, `AdaptiveTdeeModal.tsx`, `adaptiveTdeeStore.ts` |
| Polish | 15 | Skeletons, empty states, error handling passes, targeted animations |

All Anthropic API calls go through an Expo API route (`app/api/scan+api.ts`). The client never holds the Anthropic key. The existing `confirm-food.tsx` and `logFlowStore` are reused as-is for photo scan. Barcode and label scan share a new `pantry-confirm.tsx` destination.

---

## Step 10 — Dashboard Completion

### MacroBar
`MacroBar` is already built but not rendered on the home screen. Wire it up in `app/(tabs)/index.tsx` by reading `totals.totalProteinG`, `totals.totalCarbsG`, `totals.totalFatG` from `useDailyLog`. Render it between `NetCaloriesCard` and `WaterTracker`. No new logic required.

### BodyWeightCard
New component `components/BodyWeightCard.tsx`. Visual pattern matches `WaterTracker`.

- Shows today's logged weight, or a "Log today's weight" prompt if none
- Tapping opens a number input modal
- Respects `profile.units` (kg / lbs) via existing `unitConverter`
- On confirm: calls `setBodyWeight(today, kg)` on `dailyLogStore`

### dailyLogStore addition
One new action:
```ts
setBodyWeight: (date: string, weightKg: number) => void
```
`bodyWeightKg` is already typed as optional on `DailyLog` — no type changes needed.

---

## Step 11 — Photo Meal Scan

### Expo API route — `app/api/scan+api.ts`
Handles `POST` requests. Request body:
```ts
{ type: 'photo' | 'label'; imageBase64: string }
```

Uses the Anthropic SDK server-side (`process.env.ANTHROPIC_API_KEY`).

**Photo prompt:**
> "Identify all food items visible in this meal photo. For each item, estimate the food name, portion size in common units (e.g. '1 medium chicken breast', '1 cup cooked rice'), and approximate calories, protein (g), carbs (g), and fat (g). Return as a JSON array with fields: foodName, servingSize, calories, proteinG, carbsG, fatG. If uncertain about a quantity, add uncertain: true."

**Label prompt:**
> "This is a photo of a nutrition label. Extract: product name (if visible), serving description (e.g. '2 slices', '1 cup', '100g'), serving quantity (the numeric count in that description), calories, total fat (g), total carbohydrates (g), protein (g). Return as JSON with fields: foodName, servingDescription, servingQuantity, caloriesPerServing, fatGPerServing, carbsGPerServing, proteinGPerServing."

Response shapes:
```ts
// type: 'photo'
{ items: Array<{ foodName: string; servingSize: string; calories: number; proteinG: number; carbsG: number; fatG: number; uncertain?: boolean }> }

// type: 'label'
{ foodName: string; servingDescription: string; servingQuantity: number; caloriesPerServing: number; proteinGPerServing: number; carbsGPerServing: number; fatGPerServing: number }
```

All JSON parsing wrapped in try/catch. Error responses:
```ts
{ error: 'network' | 'parse' | 'anthropic'; message: string }
```

### `services/anthropic.ts`
Client-side façade. Two exported functions:

```ts
scanMealPhoto(imageUri: string): Promise<PhotoScanResult>
scanNutritionLabel(imageUri: string): Promise<LabelScanResult>
```

Both:
1. Compress image to ≤1 MB using `expo-image-manipulator`
2. Convert to base64
3. POST to `/api/scan` with the appropriate `type`
4. Return typed result or throw a typed `AnthropicServiceError`

### `app/photo-scan.tsx`
Camera screen (uses `expo-camera`). On capture:
1. Calls `scanMealPhoto`
2. On success: writes first item to `logFlowStore.setPendingItem`, navigates to existing `confirm-food.tsx`
3. On error: shows inline error message with "Enter manually" fallback that also routes to `food-search.tsx`

Source field on the resulting `FoodLogItem`: `'photo'`.

### Log tab update
Photo scan card switches from `available: false` to active, routing to `app/photo-scan.tsx`.

---

## Step 12 — Pantry + Nutrition Label Scan

### New type — `PantryItem`
Added to `types/index.ts`:
```ts
interface PantryItem {
  id: string;
  foodName: string;
  brandName?: string;
  barcode?: string;
  servingDescription: string;   // e.g. "2 slices", "1 cup", "100g"
  servingQuantity: number;      // numeric count in the serving description
  caloriesPerServing: number;
  proteinGPerServing: number;
  carbsGPerServing: number;
  fatGPerServing: number;
  addedAt: string;              // ISO datetime
  source: 'barcode' | 'label';
}
```

### `pantryStore.ts`
Zustand store with AsyncStorage persist. State:
```ts
interface PantryState {
  items: PantryItem[];
  addItem: (item: PantryItem) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, partial: Partial<PantryItem>) => void;
}
```
Persisted under key `'nourish-pantry'`.

### `app/label-scan.tsx`
Camera screen. On capture:
1. Calls `scanNutritionLabel` from `services/anthropic.ts`
2. On success: navigates to `app/pantry-confirm.tsx` with the parsed `LabelScanResult`
3. On error: inline error with "Enter manually" fallback

### Barcode scan — modified flow
`app/barcode-scan.tsx` currently routes to `confirm-food.tsx`. Change: after lookup, map the `SearchResult` to the `LabelScanResult` shape and route to `pantry-confirm.tsx` instead.

Mapping:
```ts
{
  foodName: result.foodName,
  brandName: result.brandName,
  barcode: scannedBarcode,
  servingDescription: result.servingSize,
  servingQuantity: 1,
  caloriesPerServing: result.calories,
  proteinGPerServing: result.proteinG,
  carbsGPerServing: result.carbsG,
  fatGPerServing: result.fatG,
  source: 'barcode',
}
```

### `app/pantry-confirm.tsx`
Shared confirm screen for all pantry-bound items (barcode + label scan).

Fields shown:
- Food name (editable)
- Brand name (editable, optional)
- Serving description (editable — user can correct "2 slices" to "1 slice")
- Serving quantity (numeric input — the count in the serving description)
- Nutrition facts per serving (read-only display, derived from scan)

Actions:
- **"Save to Pantry"** (primary) — creates a `PantryItem`, calls `pantryStore.addItem`, navigates back
- **"Also add to today's log" toggle** — when enabled, reveals a "How many servings?" numeric input. On "Save to Pantry" with this active: also creates a `FoodLogItem` scaled by `servingCount × perServingMacros` and calls `dailyLogStore.addFoodItem`

### Pantry UI — Meals tab
`app/(tabs)/meals.tsx` gains a segmented control at the top: **Saved Meals | Pantry**.

Pantry segment: `FlatList` of `PantryItem` cards showing name, brand, serving description, and calories per serving. Tapping a card opens a bottom sheet with:
- "How many servings?" numeric input
- "Add to Today's Log" button — creates a scaled `FoodLogItem` and navigates home

Long-press on a pantry card: delete.

### Log tab update
Label scan card switches from `available: false` to active, routing to `app/label-scan.tsx`.

---

## Step 14 — Adaptive TDEE

### `utils/adaptiveTdee.ts`
Pure function:
```ts
function calculateAdaptiveTdee(
  logs: DailyLog[],
  currentTarget: number,
): AdaptiveTdeeResult | null
```

Returns `null` if:
- Fewer than 14 days have food items logged
- Fewer than 3 days have `bodyWeightKg` recorded

Otherwise:
1. Computes average daily calorie intake over the period
2. Derives actual weight delta (earliest vs. latest weight entry)
3. Computes expected weight delta: `(currentTarget - avgIntake) × days / 7700` (kcal per kg)
4. Derives implied true TDEE: `currentTarget + (actualDelta - expectedDelta) × 7700 / days`
5. New suggested target = implied TDEE adjusted for goal (lose: −500, maintain: 0, gain: +250)

Return type:
```ts
interface AdaptiveTdeeResult {
  newTarget: number;
  impliedTdee: number;
  oldTarget: number;
  avgDailyIntake: number;
  weightDeltaKg: number;
  daysAnalysed: number;
}
```

### `adaptiveTdeeStore.ts`
Small Zustand store, AsyncStorage persisted:
```ts
interface AdaptiveTdeeState {
  enabled: boolean;
  lastRecalculatedAt?: string;
  history: TdeeRecalculation[];
  setEnabled: (enabled: boolean) => void;
  recordRecalculation: (r: TdeeRecalculation) => void;
}

interface TdeeRecalculation {
  date: string;
  oldTarget: number;
  newTarget: number;
  impliedTdee: number;
}
```

### `useAdaptiveTdee.ts`
Hook that runs the check on every app foreground event (same `AppState` pattern as `useDailyLog`). Logic:
1. Read all logs from `dailyLogStore`
2. Read `profile.dailyCalorieTarget` and `profile.goal` from `userStore`
3. Read `adaptiveTdeeStore.enabled` and `lastRecalculatedAt`
4. Skip if disabled, or if `lastRecalculatedAt` is within the last 14 days
5. Call `calculateAdaptiveTdee`
6. If a result is returned, expose it as `pendingRecalculation` state

### `AdaptiveTdeeModal.tsx`
Rendered at `app/_layout.tsx` root level, conditionally visible when `useAdaptiveTdee` returns a `pendingRecalculation`.

Content:
- "Your body burns ~{impliedTdee} calories a day."
- Old target → new target display
- Positive framing based on `profile.goal`
- "Got it" button: calls `userStore.updateProfile({ dailyCalorieTarget: newTarget })`, calls `adaptiveTdeeStore.recordRecalculation(...)`, clears modal

Entrance animation: scale + fade using `react-native-reanimated` (already installed).

### Settings screen addition
Under a new "Adaptive TDEE" section:
- Toggle for `adaptiveTdeeStore.enabled`
- Read-only list of `adaptiveTdeeStore.history` (date, old target, new target)

---

## Step 15 — Polish

### Loading skeletons
`FoodSearchResultItem` and `SavedMealCard` get skeleton variants — grey animated rectangles matching the real layout dimensions. `useFoodSearch` already exposes `isLoading`; the search screen renders 6 skeleton rows while loading. Same pattern for the Pantry `FlatList`.

### Empty states
Every list that can be empty gets a purpose-built empty component:

| List | Message |
|---|---|
| Today's food log | Already exists — keep as-is |
| Saved Meals | "No saved meals yet. Log a meal and tap ☆ to save it." |
| Pantry | "Your pantry is empty. Scan a barcode or nutrition label to add items." |
| Food search, no results | "No results for '{query}'. Try scanning a barcode instead." |

### Error handling
- **Camera screens** (`photo-scan.tsx`, `label-scan.tsx`, `barcode-scan.tsx`): permission-denied state renders an inline prompt with `Linking.openSettings()`
- **Anthropic service** (`services/anthropic.ts`): three distinct error states surfaced to the UI:
  - `'network'` → "Check your connection and try again"
  - `'parse'` → "Couldn't read that — try moving closer and retrying"
  - `'anthropic'` → "Scan failed — you can enter the details manually"
  - All three offer a fallback route to manual entry

### Animations
- `BodyWeightCard` and `WaterTracker` progress bars animate on value change using `Animated.spring`
- `AdaptiveTdeeModal` entrance: scale + fade via `react-native-reanimated`

No new animation libraries added.

---

## What is explicitly out of scope

- Voice logging — deferred (no transcription service selected)
- Health Connect / Apple Health real implementation — stubs remain, requires a dev build
- Weekly or historical calorie charts
- Push notifications
- Any backend beyond Expo API routes
