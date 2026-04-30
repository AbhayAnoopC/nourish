# Flexible Quantity Input — Design Spec

**Date:** 2026-04-29
**Status:** Approved (pending user spec review)
**Scope:** Replace the rigid `× 100g` quantity input on `confirm-food.tsx` with a chip-based picker driven by USDA portion data plus user-saved custom servings (fuzzy-matched by food name). Sets up the data substrate for the meal-builder + pantry spec that follows.

**Depends on:** UI redesign branch (`feature/ui-redesign`) tokens and components. Land that first.

---

## 1. Background

Today, the confirm-food screen at `app/confirm-food.tsx` only lets the user enter a multiplier of `100 g`. Logging a chicken breast means knowing it weighs 172 g, dividing by 100, and entering `1.72`. That's friction at the most-used screen in the app.

The user's mental model is mixed:

- "1 chicken breast" — piece count, no inherent mass
- "100g of pasta" — gram weight, direct
- "2 bananas" — piece count
- "100 ml of milk" — volume

USDA's FoodData Central API already returns `foodPortions` for most foods (e.g. "1 cup, chopped (142g)", "1 medium (118g)", "1 breast, half (172g)"). We are leaving this data on the table. Surfacing it as tappable chips, plus letting the user save their own custom servings for foods USDA doesn't have data for, removes nearly all the math from logging.

This spec covers the input redesign. It does **not** cover the meal-builder, pantry, or voice-logging features — those are subsequent specs that will reuse the customs infrastructure built here.

---

## 2. Goals

1. The user can log "1 chicken breast" or "1 cup milk" with a single tap, no manual gram math.
2. When USDA has portion data, those portions appear automatically as chips on the confirm-food screen.
3. When USDA doesn't, the user can save their own custom serving once and have it auto-appear next time they log any food whose name matches.
4. Fuzzy name matching is visible — when a custom is auto-applied to a food it wasn't originally saved for, the user sees a tag indicating it's a saved custom rather than the food's official portion.
5. Existing logged FoodLogItems continue to display correctly (no data loss, no broken UI for old entries).

## 3. Non-goals

- Voice-logging integration. Deferred.
- Per-food density tables for arbitrary volume conversions. Only support `ml` when USDA portion data gives us a volume-to-gram ratio for that food.
- Cloud sync of custom servings. Local-only via MMKV/AsyncStorage.
- Retroactive macro recomputation if a food's underlying nutrition changes. Macros are resolved at log time and stored on the log entry.

---

## 4. Data model

### 4.1 New types (`types/index.ts`)

```typescript
export interface CustomServing {
  id: string;
  matchKey: string;     // normalized food name to match, e.g. "chicken breast"
  label: string;        // e.g. "1 large breast"
  grams: number;        // e.g. 220
  createdAt: string;    // ISO timestamp
}

export interface ServingOption {
  label: string;        // "1 medium (118g)" or "1 cup, chopped"
  grams: number;
  source: 'usda' | 'off' | 'custom' | 'fallback';
  customId?: string;    // present when source = 'custom'
  isFuzzyMatch?: boolean; // true when source = 'custom' and the saved matchKey
                          // doesn't exactly equal this food's normalized name
}
```

`ServingOption` is ephemeral — it's the shape returned by the `useServingOptions` hook for rendering. It is never persisted.

### 4.2 Updated `FoodLogItem`

The existing fields:

```typescript
servingSize: string;       // e.g. "1 cup", "100 g"
servingQuantity: number;   // multiplier
```

are replaced with a single field:

```typescript
servingLabel: string;      // pre-formatted, e.g. "1 large breast" or "150 g"
```

Macros (calories, proteinG, carbsG, fatG) remain on `FoodLogItem` as resolved values at log time, unchanged. Adding food to the log:

- Old behavior: caller computes scaled macros from base × quantity, sets `servingQuantity` and `servingSize`.
- New behavior: caller computes scaled macros from `(grams / 100) × per-100g-values`, sets `servingLabel` to the chip's label (or the formatted custom input).

### 4.3 Migration

`store/dailyLogStore.ts` currently uses Zustand `persist` middleware to load logs from AsyncStorage. Add a `migrate` config that runs once on load:

```typescript
migrate: (persisted: unknown, version: number) => {
  if (version < 2) {
    // Convert old { servingQuantity, servingSize } pair to servingLabel
    const state = persisted as { logs: Record<string, DailyLog> };
    Object.values(state.logs).forEach((log) => {
      log.foodItems.forEach((item) => {
        const itemAny = item as unknown as Record<string, unknown>;
        if ('servingQuantity' in itemAny && 'servingSize' in itemAny) {
          const qty = itemAny.servingQuantity as number;
          const size = itemAny.servingSize as string;
          itemAny.servingLabel = qty !== 1 ? `${qty} × ${size}` : size;
          delete itemAny.servingQuantity;
          delete itemAny.servingSize;
        }
      });
    });
  }
  return persisted;
},
version: 2,
```

The `version` constant in the persist config bumps from whatever it is today (likely 1 or unset) to 2. After migration runs once on a given device, all future loads see the new shape.

### 4.4 New store: `store/customServingsStore.ts`

```typescript
interface CustomServingsState {
  customs: CustomServing[];
  addCustom: (input: Omit<CustomServing, 'id' | 'createdAt'>) => CustomServing;
  removeCustom: (id: string) => void;
  findMatchesForFood: (foodName: string) => CustomServing[];
}
```

Persisted with the same Zustand + AsyncStorage pattern as `savedMealsStore`. Storage key: `nourish-custom-servings`.

`findMatchesForFood(foodName)` returns all customs whose `matchKey` token-set is a subset of the normalized `foodName` token-set (see §5).

---

## 5. Fuzzy name matching

`utils/normalizeFoodName.ts`:

```typescript
export function normalizeFoodName(name: string): string {
  // Lowercase, strip punctuation, collapse whitespace
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(name: string): string[] {
  return normalizeFoodName(name).split(' ').filter((t) => t.length >= 2);
}

export function isFuzzyMatch(matchKey: string, foodName: string): boolean {
  const matchTokens = new Set(tokenize(matchKey));
  const nameTokens = new Set(tokenize(foodName));
  if (matchTokens.size === 0) return false;
  for (const t of matchTokens) {
    if (!nameTokens.has(t)) return false;
  }
  return true;
}

export function isExactMatch(matchKey: string, foodName: string): boolean {
  return normalizeFoodName(matchKey) === normalizeFoodName(foodName);
}
```

A custom serving applies when **all** of its `matchKey` tokens (length ≥ 2) appear as tokens in the food's name. The `isFuzzyMatch` flag (used to tag chips visually) is `!isExactMatch(matchKey, foodName)`.

Token length filter ≥ 2 prevents single-letter or one-character tokens from matching too broadly.

When the user saves a new custom on the confirm-food screen, `matchKey` defaults to the current food's `normalizeFoodName(foodName)` — meaning by default the custom is "scoped" to this food, but token-subset matching makes it apply to similar names too.

---

## 6. Serving option resolution

`hooks/useServingOptions.ts`:

```typescript
export function useServingOptions(food: SearchResult): ServingOption[] {
  const profile = useUserStore((s) => s.profile);
  const customs = useCustomServingsStore((s) => s.findMatchesForFood(food.foodName));

  return useMemo(() => {
    const options: ServingOption[] = [];

    // 1. USDA portions
    if (food.foodPortions) {
      for (const p of food.foodPortions) {
        options.push({
          label: p.label,           // e.g. "1 cup, chopped"
          grams: p.gramWeight,
          source: 'usda',
        });
      }
    }

    // 2. OFF serving
    if (food.source === 'openfoodfacts' && food.servingGrams) {
      options.push({
        label: food.servingSize,    // e.g. "30 g"
        grams: food.servingGrams,
        source: 'off',
      });
    }

    // 3. Custom matches
    for (const c of customs) {
      options.push({
        label: c.label,
        grams: c.grams,
        source: 'custom',
        customId: c.id,
        isFuzzyMatch: !isExactMatch(c.matchKey, food.foodName),
      });
    }

    // 4. Fallbacks
    options.push({ label: '100 g', grams: 100, source: 'fallback' });
    if (profile?.units === 'imperial') {
      options.push({ label: '1 oz', grams: 28.35, source: 'fallback' });
    }

    // Dedupe by gramWeight (within ±0.5g tolerance), keeping higher-priority sources
    const seen = new Map<number, ServingOption>();
    for (const opt of options) {
      const key = Math.round(opt.grams * 2) / 2; // 0.5g buckets
      if (!seen.has(key)) {
        seen.set(key, opt);
      }
    }

    return Array.from(seen.values()).slice(0, 6);
  }, [food, customs, profile?.units]);
}
```

The order in `options.push` calls determines source priority — earlier entries win on dedup ties. So a USDA `"100 g"` portion (rare) would beat the fallback `"100 g"`; a custom `"1 large breast (220g)"` beats nothing else if no USDA portion has 220g.

Cap of 6 chips keeps the UI breathable. Order in the array determines visible order: USDA first, then OFF, then customs, then fallbacks.

---

## 7. Search service updates

### 7.1 USDA service (`services/usda.ts`)

The USDA FoodData Central API returns a `foodPortions` array on most foods. Currently we only parse macros; we now also parse portions:

```typescript
interface UsdaFoodPortion {
  amount: number;
  modifier: string;        // e.g. "cup, chopped"
  gramWeight: number;
}

// Returned in SearchResult
interface FoodPortion {
  label: string;           // e.g. "1 cup, chopped"
  gramWeight: number;
}
```

Parser logic:
- For each `foodPortions[i]`: format `amount` cleanly (strip trailing zeros: `1.0 → "1"`, `0.5 → "0.5"`), then `label = ${formattedAmount} ${modifier.trim()}`. Examples: `(1, "cup, chopped") → "1 cup, chopped"`, `(0.5, "breast, half") → "0.5 breast, half"`, `(100, "g") → "100 g"`.
- Filter out portions with `gramWeight <= 0` or missing `modifier`.
- Sort ascending by `gramWeight`.

Add `foodPortions: FoodPortion[]` to the `SearchResult` interface. Existing USDA results that lack the field default to `undefined`.

### 7.2 OFF service (`services/openFoodFacts.ts`)

OFF products commonly include `serving_size: "30 g"` and `serving_quantity: 30`. When both are present:
- Add `servingGrams: number` to the OFF-sourced `SearchResult`.

When `serving_size` is in `ml` and `serving_quantity` is in `ml`, store `servingGrams` only if a density is available — for V1, skip ml-only OFF servings. Treat them as data we don't have.

---

## 8. Confirm-food screen UX

### 8.1 Layout

```
┌───────────────────────────────────┐
│  Chicken breast, raw              │
│  USDA · per 100g                  │
│                                   │
│  How much?                        │
│                                   │
│  [1 breast (172g)]  [½ breast]    │
│  [1 large (220g) custom]          │
│  [100 g]   [+ Custom]             │
│                                   │
│  ── or type a custom amount ──    │
│  [    150     ]   g  ▾            │
│                                   │
│  Calories: 248 kcal               │
│  P 47g · C 0g · F 5g              │
│                                   │
│  [   Save as Meal   ]             │
│  [    Add to Log    ]             │
└───────────────────────────────────┘
```

### 8.2 Chip behavior

- **Selected state:** terracotta (`accent.primary`) border, `accent.muted` fill, primary-text label. One chip selected at a time.
- **Tap to select:** updates the active grams for macro recalculation; clears the custom amount field.
- **Custom-source chips:** show a small italic "custom" tag inside the chip when `isFuzzyMatch === true`. (When the custom was saved on this exact food, the chip reads as a normal portion; the tag only appears when the custom was saved for a *different but matching* food.)
- **Long-press on a custom chip:** opens an action sheet — "Saved for '{matchKey}' · {grams}g — Edit / Remove". Removing deletes the custom from the store; editing reopens the SaveCustomServingModal pre-filled with current values.

### 8.3 Custom amount input

Below the chips:

- A number input + unit dropdown (`g`, `ml`, `oz`).
- Default unit: `g` for metric profile, `oz` for imperial profile.
- `ml` is only enabled when the food has at least one USDA volume portion (a portion whose `modifier` contains `cup`, `tbsp`, `tsp`, `fl oz`, or `ml`). Density is computed as `usdaVolumePortion.gramWeight / volumeMl` (volume converted to ml using a static conversion table for cup/tbsp/tsp/fl oz). When `ml` is disabled, it appears greyed out with a "(not available)" hint on tap.
- Typing a number deselects all chips.
- The resolved label when user uses the custom field: `"${value} ${unit}"` (e.g. `"150 g"`).

Static volume conversion table (`utils/volumeConversions.ts`):
```typescript
export const ML_PER_UNIT = {
  ml: 1,
  cup: 236.588,
  tbsp: 14.7868,
  tsp: 4.92892,
  'fl oz': 29.5735,
};
```

### 8.4 Default selection on screen open

The `useServingOptions` array is computed; the default-selected chip is chosen by:

1. If any custom serving with `isFuzzyMatch === false` exists (i.e., user has saved a custom for this exact food), select it.
2. Else if any USDA portion exists, select the one whose `gramWeight` is closest to 100.
3. Else select the `"100 g"` fallback.

### 8.5 "+ Custom" chip → SaveCustomServingModal

Tapping `+ Custom` opens a modal:

```
┌──────────────────────────────────┐
│  Save custom serving             │
│                                  │
│  for "Chicken breast, raw"       │
│                                  │
│  Label                           │
│  [1 large breast               ] │
│                                  │
│  Grams                           │
│  [220                          ] │
│                                  │
│  This will appear as a quick     │
│  pick whenever you log a food    │
│  containing "chicken breast".    │
│                                  │
│  [Cancel]            [   Save  ] │
└──────────────────────────────────┘
```

On save:
- `matchKey = normalizeFoodName(food.foodName)`
- `addCustom({ matchKey, label, grams })` returns a new `CustomServing`.
- The newly saved custom becomes the active chip; modal dismisses.

The modal pre-fills nothing (label and grams blank). Validation: `label.trim().length > 0`, `grams > 0`. Save button disabled when invalid.

---

## 9. Settings: Saved servings list

A new section in `app/(tabs)/settings.tsx` titled **"Saved servings"** lists all `CustomServing[]` from the store:

```
SAVED SERVINGS
─────────────────────────────────
1 large breast        220 g
saved for "chicken breast"

1 cup milk            245 g
saved for "milk"
─────────────────────────────────
```

Each row: label + grams on the right (mono), `matchKey` line underneath (`textSm` secondary). Swipe-left reveals delete. Tap opens the SaveCustomServingModal pre-filled to edit. Section is omitted from settings entirely when there are zero saved servings.

---

## 10. Components

### 10.1 New components

- `components/QuantityInput.tsx` — composes the chip rail, custom amount input, and "+ Custom" trigger. Owns: array of options, currently-selected option, custom-input state. Exposes: `onChange(grams: number, label: string)`.
- `components/ServingChip.tsx` — single chip pill. Props: `option: ServingOption`, `selected: boolean`, `onPress`, `onLongPress`. Internally renders the `(custom)` tag when applicable.
- `components/SaveCustomServingModal.tsx` — modal for saving/editing a custom. Reused from confirm-food and settings.
- `components/SavedServingsList.tsx` — list view used in settings.

### 10.2 New utils

- `utils/normalizeFoodName.ts` — `normalizeFoodName`, `tokenize`, `isFuzzyMatch`, `isExactMatch`. (TDD; see §11.)
- `utils/volumeConversions.ts` — `ML_PER_UNIT` map and `mlToGrams(mlValue, gramsPerMl)` helper. (TDD; see §11.)
- `utils/parseCustomAmount.ts` — given `(value: number, unit: 'g'|'ml'|'oz', gramsPerMl?: number)`, returns `grams: number`. Throws when ml is requested without `gramsPerMl`. (TDD; see §11.)

### 10.3 New hook

- `hooks/useServingOptions.ts` — described in §6.

### 10.4 New store

- `store/customServingsStore.ts` — described in §4.4.

---

## 11. Testing

Tests run via `npm test` with the existing Jest `node` environment. Test patterns: `utils/*.test.ts`, `services/*.test.ts`, `store/*.test.ts`, `hooks/*.test.ts`.

**Unit tests (TDD):**
- `utils/normalizeFoodName.test.ts` — normalization, tokenization, `isFuzzyMatch`, `isExactMatch`. Cover: case-insensitivity, punctuation stripping, ≥2-token filter, exact vs subset matching, edge cases (empty string, all-whitespace, unicode).
- `utils/volumeConversions.test.ts` — conversion factors are correct.
- `utils/parseCustomAmount.test.ts` — g/ml/oz conversion to grams, error when `ml` requested without density.
- `services/usda.test.ts` — extend with a new test case: a mocked USDA response containing `foodPortions` is parsed correctly into `SearchResult.foodPortions`. Existing tests must continue to pass.
- `store/customServingsStore.test.ts` — `addCustom` produces well-formed objects with id+timestamp; `findMatchesForFood` returns expected matches given a populated store.

**Migration tests:** `store/dailyLogStore.test.ts` — gain a test that simulates persisted state at version 1 (with `servingQuantity` + `servingSize`), runs the migrate function, and asserts the resulting state has `servingLabel` correctly composed.

**Visual components are not tested** (consistent with the project's Jest config); they are verified manually after implementation.

---

## 12. Files

### Created

- `types/index.ts` — extend with `CustomServing`, `ServingOption`, `FoodPortion`; modify `SearchResult` and `FoodLogItem`.
- `store/customServingsStore.ts`
- `store/customServingsStore.test.ts`
- `hooks/useServingOptions.ts`
- `utils/normalizeFoodName.ts` + `.test.ts`
- `utils/volumeConversions.ts` + `.test.ts`
- `utils/parseCustomAmount.ts` + `.test.ts`
- `components/QuantityInput.tsx`
- `components/ServingChip.tsx`
- `components/SaveCustomServingModal.tsx`
- `components/SavedServingsList.tsx`

### Modified

- `services/usda.ts` — fetch + parse `foodPortions`.
- `services/usda.test.ts` — add coverage for portion parsing.
- `services/openFoodFacts.ts` — extract `servingGrams` when available.
- `app/confirm-food.tsx` — replace existing quantity input with `QuantityInput`. Update calorie / macro recompute to use the active option's grams.
- `app/confirm-meal.tsx` — also uses the same multiplier pattern; out of scope for *this* spec but flagged for the meal-builder spec.
- `app/(tabs)/settings.tsx` — add "Saved servings" section.
- `store/dailyLogStore.ts` — bump `version` to 2, add migrate function; update the type of `foodItems` to use the new `FoodLogItem` shape.
- `types/index.ts` — see above.

### Deleted

None.

---

## 13. Out of scope

- Voice logging.
- Pantry visibility / management.
- Meal builder.
- Multi-food density tables.
- Sharing / syncing custom servings across devices.

These are tracked as separate specs that build on the foundations laid here.

---

## 14. Success criteria

- Logging a USDA food with a portion entry takes one tap (chip select) + one tap (Add to Log). No typed math.
- Saving a custom serving for one food, then searching a different food whose name shares the same key tokens, shows the saved custom as a chip with a `(custom)` tag.
- Removing a custom from settings removes it from all chips that previously surfaced it.
- Existing `FoodLogItem` entries logged before this change continue to display correctly after the migration runs.
- All existing tests pass; new tests cover all utils, the customs store, the migrate function, and the USDA portion parser.
- TypeScript strict mode remains green throughout.
