# Nourish UI Redesign — Design Spec

**Date:** 2026-04-28
**Status:** Approved (pending user spec review)
**Scope:** Full visual identity overhaul + home screen restructure + tab bar + "+" log flow. Quantity input redesign and cooked-meal portion tracking are separate specs that follow this one.

---

## 1. Background

The current Nourish UI is functional but lacks identity. It uses a generic blue tint (`#2D9CDB`), bordered white cards stacked vertically, default system typography, and a tab bar with no icons. The result reads as a "settings list" instead of a food app and does not differentiate Nourish from any other tracker.

The user wants a **calm/premium** aesthetic (Whoop / Oura / Things 3 lineage), in **light-first** mode, with a **deep terracotta** accent and an **editorial-meets-data-tracker** typographic voice. Hero data should feel hero; secondary data should recede.

This spec defines the new visual language and the home-screen architecture that exercises it. Other screens get token-level updates only in this round; structural redesign of `confirm-food`, `meals`, etc. is deliberately out of scope to keep the change reviewable.

---

## 2. Visual identity tokens

### 2.1 Palette

**Light mode (default):**

| Token | Value | Usage |
|---|---|---|
| `bg.primary` | `#FAFAF7` | App background (warm off-white) |
| `bg.surface` | `#FFFFFF` | Cards, hero canvas, bottom sheet, tab bar |
| `bg.surfaceMuted` | `#F4F2ED` | Pressed state, hairline section dividers behind content |
| `text.primary` | `#1A1A1A` | Headings, body text, hero numbers |
| `text.secondary` | `#6B6B66` | Captions, placeholders, inactive labels |
| `text.tertiary` | `#9C9A95` | Disabled, inactive tab icons |
| `accent.primary` | `#B8553A` | CTAs, calorie ring, water level, active tab, FAB |
| `accent.muted` | `#F4E5DD` | Ring track, progress bar background, accent at 10% |
| `accent.pressed` | `#9D4730` | Pressed state for primary buttons / FAB |
| `border.hairline` | `#EFEDE8` | Row separators, tab bar top edge |
| `macro.protein` | `#7A4A3F` | Macros page only (deep brick) |
| `macro.carbs` | `#C49B5C` | Macros page only (warm gold) |
| `macro.fat` | `#8B7355` | Macros page only (taupe) |
| `status.success` | `#5B7A5E` | Success toasts, on-target indicators (desaturated sage) |
| `status.warning` | `#C48B3F` | Warning toasts, near-limit indicators |
| `status.danger` | `#A03A2E` | Errors, destructive confirms (cousin of accent) |

**Dark mode (alternative):**

| Token | Value | Usage |
|---|---|---|
| `bg.primary` | `#14110E` | Warm near-black |
| `bg.surface` | `#1F1A16` | Cards |
| `bg.surfaceMuted` | `#2A2420` | Pressed state |
| `text.primary` | `#F0EDE8` | Headings, body |
| `text.secondary` | `#9C958C` | Captions |
| `text.tertiary` | `#6B655E` | Disabled |
| `accent.primary` | `#D26F50` | Brighter terracotta for dark contrast |
| `accent.muted` | `#3A2A22` | Ring track, accent at 10% over dark |
| `accent.pressed` | `#B8553A` | Pressed primary (matches light primary) |
| `border.hairline` | `#2A2420` | Row separators |
| `macro.protein` | `#8C5C50` | Macros page (lifted brick) |
| `macro.carbs` | `#D2AC72` | Macros page (lifted gold) |
| `macro.fat` | `#9D866A` | Macros page (lifted taupe) |
| `status.success` | `#6F8E72` | Lifted sage |
| `status.warning` | `#D49E54` | Lifted amber |
| `status.danger` | `#B45044` | Lifted danger |

The current `Colors.ts` will be replaced by a token map of this shape. Components must read tokens by semantic name (`bg.surface`), not by mode.

### 2.2 Typography

Three families, all free-licensed, loaded via `expo-font`:

- **Fraunces** (variable, weights 300–600, optical size enabled). Used for: hero numbers (calorie total, weight, water L), screen titles, hero card captions where editorial tone is wanted. Optical size is enabled so display weights read warm and small weights stay legible.
- **Inter** (weights 400, 500, 600). Used for: body text, button labels, menu items, descriptions, food names in log rows, all UI labels not covered by the above.
- **JetBrains Mono** (weights 400, 500, tabular figures enabled). Used for: every numeric figure shown inside cards, vitals rows, log row calorie values, macro grams, time/date stamps. Tabular figures so columns of numbers align vertically.

**Type scale (extends current `FONT_SIZE`):**

| Token | Value | Family | Usage |
|---|---|---|---|
| `display.hero` | 64 | Fraunces (weight 400, optical 144) | Hero number on Calories / Weight / Water pages |
| `display.title` | 32 | Fraunces (weight 500) | Screen titles, bottom sheet title |
| `text.xl` | 20 | Inter (weight 600) | Section headings, modal titles |
| `text.lg` | 17 | Inter (weight 500) | Food row primary, list item titles |
| `text.md` | 15 | Inter (weight 400) | Body, button labels |
| `text.sm` | 13 | Inter (weight 400) | Captions, secondary lines |
| `text.xs` | 11 | Inter (weight 600, letter-spaced 0.8) | Section labels (UPPERCASE), tab labels |
| `mono.lg` | 17 | JetBrains Mono (weight 500) | Calorie value in log rows, primary numerics |
| `mono.md` | 15 | JetBrains Mono (weight 400) | Vitals row figures, macro grams |
| `mono.sm` | 13 | JetBrains Mono (weight 400) | Timestamps, secondary numerics |

The existing `FONT_SIZE` constant stays in place but is augmented; new tokens are added to a separate `Typography` constant exporting `(family, weight, size, letterSpacing)` triples so usage at call sites is one token, not three properties.

### 2.3 Spacing, radius, elevation

**Spacing** uses the existing `SPACING` scale (`xs:4, sm:8, md:16, lg:24, xl:32, xxl:48`) — no new values needed; what changes is **which step gets used where**:

- Section gaps on the home screen: `lg` (24) — was `md` (16)
- Card / hero canvas inner padding: 20 (new — between `md` and `lg`; add `SPACING.cardPad = 20` constant)
- Hero canvas outer horizontal margin: `md` (16)
- List row vertical padding: `md` (16) top/bottom — was tighter
- Touch targets minimum 44pt high

**Border radius:**

- Cards / list rows: 16 (`BORDER_RADIUS.lg`)
- Hero canvas: 24 (`BORDER_RADIUS.xl`)
- Bottom sheet: 24 top corners only
- "+" FAB: full circle (28pt radius for 56pt button)
- Buttons: 14 (new — add `BORDER_RADIUS.button = 14`)
- Pills / chips: full

**Elevation (shadow):**

Two levels only. Both very faint.

- `shadow.subtle` — light: `color rgba(26,26,26,0.04), blur 16, y-offset 2`. Dark: shadows are imperceptible on dark surfaces, so dark-mode replaces this with a 1px top-edge highlight `rgba(255,255,255,0.04)` to imply elevation. Used on hero canvas, cards that need to lift off the bg.
- `shadow.fab` — light: `color rgba(184,85,58,0.22), blur 16, y-offset 6`. Dark: same shadow color and parameters (the terracotta tint reads on dark too because the shadow is colored, not luminance-only). Used only on the floating "+" button.

No 1px borders anywhere in the new design. Surface separation comes from background lightness contrast (`#FAFAF7` bg vs `#FFFFFF` surface) and shadow.subtle.

---

## 3. Home screen architecture

### 3.1 Layout

Vertical stack, scrolling, in this order:

1. **Header** — date (Inter sm, secondary color) + greeting "Good morning, Abhay" (Fraunces title 32). 16pt horizontal padding, top safe-area + 16pt.
2. **Watch nudge banner** *(conditional)* — only when `connectionTier === 'none' && !nudgeDismissed`. Slim 60pt-tall surface, terracotta-muted background, single-line copy + "Connect" button right-aligned, dismiss × on far right. Lives between header and hero, never overlaps either.
3. **Hero canvas** — single horizontally-paginated canvas, 320pt tall, 16pt horizontal margins, 24pt radius, white surface with `shadow.subtle`. Peeks the next page by ~10pt at the right edge to signal swipeability. Page dots (4 circles, 6pt each, 8pt gap) sit 16pt from canvas bottom, centered. Active dot is terracotta, inactive is `text.tertiary`.
4. **Section header** "TODAY'S LOG" — Inter xs, uppercase, letter-spaced, secondary color, 16pt horizontal padding, 24pt top, 12pt bottom.
5. **Food log list** — borderless rows separated by 1px `border.hairline`. Each row described in §3.3.
6. **Bottom safe-area + tab bar** — see §4.

### 3.2 Hero canvas pages

Four pages, swipeable horizontally (`react-native-pager-view` or `react-native-reanimated` + gesture handler — pick whichever is already in the project). Default page on every launch is page 1 (Calories). Page state is **not persisted** between launches — always opens on Calories.

**Page 1 — Calories (default).** Centered terracotta arc (270° sweep, opens at the bottom), 220pt diameter, 14pt stroke, track in `accent.muted`, fill in `accent.primary`. Inside the arc, vertically centered: hero number "1,840" in Fraunces display.hero, then "kcal" in Inter sm secondary directly below. Beneath the arc inside the canvas: caption row "of 2,200 · 360 to go" in Inter sm secondary. Beneath that, smaller still: "−420 burned today" in mono.sm tertiary. If `caloriesBurned === 0`, the burned line is omitted (don't show a dead "0").

**Page 2 — Macros.** Three stacked horizontal bars. Each bar row: macro name left in Inter md primary ("Protein"), value right in mono.md primary ("124 / 165 g"). Bar fills its row beneath the labels: track in `accent.muted`, fill in the macro's earth-tone color (`macro.protein` / `macro.carbs` / `macro.fat`). Bar height 6pt, 12pt gap between rows. Page padded 24pt all sides.

**Page 3 — Water.** Centered glass illustration (a simple SVG outline, ~140pt tall, terracotta stroke 2pt, rounded base). Inside the glass, a terracotta wave fills from bottom to current ml-as-percentage-of-target. Wave has a subtle 3pt amplitude sine that animates ~4s loop. Below the glass: "1.2 / 2.0 L" in Fraunces display.hero (smaller variant — 48pt size). Below that: "+250 ml" hint chip (terracotta border, mono.sm). Tap **anywhere on the canvas** (not just the chip) → `+250 ml`, wave fills with a spring, light haptic.

**Page 4 — Weight.** Top of page: "74.3" in Fraunces display.hero with "kg" small to the right in Inter md secondary. Beneath: "−0.8 kg this week" in mono.sm secondary (or "+0.4 kg" with `status.warning` if going up against a `lose` goal — color depends on `goal` from profile). Bottom half of page: a 7-day weight sparkline. Sparkline data is the last 7 calendar days; for each day, the value is that day's `bodyWeightKg` from `dailyLogStore`, or — for days with no entry — the carry-forward of the most recent prior entry (so missing days don't break the line). The sparkline is drawn in muted terracotta (`#B8553A` at 60% opacity), 1.5pt stroke, with a small terracotta dot on the most recent actual entry (not on carry-forward days). **Animation:** path draws left-to-right over 600ms with ease-out when the page is focused (entered via swipe or initial mount). Tap anywhere on the page → opens existing weight-logging modal (`BodyWeightCard` modal, restyled).

If fewer than 2 actual weight entries exist within the last 7 days, the sparkline section shows an Inter md secondary placeholder: "Log your weight regularly to see trends." The "delta this week" caption is also omitted in this case.

### 3.3 Food log row

Each row is borderless, 64pt tall, full-width, with hairline `border.hairline` underneath (last row has no underline). Internal layout:

- Left: food name in Inter lg primary, single line, ellipsis. Below it: "120 g · 6:42 AM" in Inter sm secondary (or whatever serving label the item carries).
- Right: calorie value in mono.lg primary ("180"), with "kcal" in mono.sm tertiary beneath, right-aligned.
- 16pt horizontal padding.
- Swipe-left reveals delete (existing functionality preserved).
- Press: brief surface-muted background flash, no haptic (avoids being noisy when scrolling).

Empty state (no items yet today) is centered text 80pt below the hero: Fraunces title 32 "No food logged yet" then Inter md secondary "Tap + below to add your first entry."

---

## 4. Tab bar + "+" flow

### 4.1 Tab bar

- 3 tabs: **Home**, **Meals**, **Settings**. The previous Log tab is removed entirely; its functionality moves to the bottom sheet (§4.3).
- Bar height: 56pt + bottom safe-area padding.
- Background: `bg.surface`. Top edge: 1px `border.hairline`.
- Each tab is a vertical stack: 22pt Lucide line icon + label below in `text.xs` Inter weight 600 letter-spaced 0.4. Icon names: Home tab uses Lucide `House`; Meals tab uses Lucide `UtensilsCrossed` (or `Soup` if `UtensilsCrossed` reads too small at 22pt — implementer's call); Settings tab uses Lucide `Settings`. Active state: icon and label both `accent.primary`. Inactive: icon and label both `text.tertiary`. No background fill for active tab — color change alone signals state.
- Tap target: full width of the tab cell, full height including label.

### 4.2 Floating "+" FAB

- 56pt diameter circle, `accent.primary` fill, white "+" glyph (Lucide `Plus`, 24pt, weight 2.5).
- Centered horizontally over the tab bar, vertical position: `bottom: tabBar.height + 6pt` so the bottom 28pt of the FAB lies over the tab bar, top 28pt floats above. Reads as a single "lifted" element.
- `shadow.fab` (terracotta-tinted shadow).
- Press: scale 0.94 over 80ms, light haptic, then scale back over 150ms ease-out.
- Visible on **all three tabs** (always present). Tapping always opens the bottom sheet, regardless of current tab.

### 4.3 Log methods bottom sheet

Triggered by tapping the FAB. Slides up from bottom over 300ms ease-out, snap to 480pt initial height (or content height if smaller). Backdrop is `rgba(26,26,26,0.4)`. Drag-down on the sheet dismisses; backdrop tap dismisses. Top has a 36pt × 4pt rounded grabber centered, 8pt from top edge.

Sheet structure:

- **Title:** "Log food" in Fraunces display.title, left-aligned, 24pt horizontal padding, 16pt top.
- **Subtitle:** "Choose how to add food" in Inter sm secondary, beneath title.
- **Method rows** (vertical list, 16pt row gap):
  - **Search** — Lucide `Search` icon left, "Search foods" Inter lg primary + "USDA & Open Food Facts" Inter sm secondary, terracotta `ChevronRight` right. Routes to `/food-search`.
  - **Barcode** — Lucide `ScanBarcode` icon. Routes to `/barcode-scan`.
  - **Photo** — Lucide `Camera` icon. Routes to `/photo-scan` *(only visible when feature is unlocked; same `available` flag logic as today)*.
  - **Label** — Lucide `ScanText` icon. Routes to `/label-scan` *(same gating)*.

The `/photo-scan` and `/label-scan` routes only exist on the `feature/steps-10-15` branch (not yet merged to `master` at spec time). The redesign assumes those routes are available; if this redesign is implemented before steps 10–15 ship, the corresponding rows in the bottom sheet must remain in the `available: false` "Soon" state until the routes land. The implementation plan will explicitly check route availability against branch state.
- Each row: 64pt tall, surface-muted on press, no surrounding border. Separator is the same hairline as log rows.
- Sheet bottom: 16pt + bottom safe-area padding.

The `available: false` "Soon" pattern from the current Log screen is preserved — gated rows render at 55% opacity and don't navigate, with a small "Soon" pill on the right.

---

## 5. Other screens (token application only)

This redesign does not restructure the following screens, but **all of them must adopt the new tokens** to avoid visual inconsistency:

- `confirm-food.tsx` — replace bordered cards with borderless surfaces + `shadow.subtle`. Calorie total in Fraunces display.hero. Macros in mono.md. Primary "Add to Log" button uses `accent.primary` background. Quantity input region styling stays the same; full quantity-input overhaul is a separate spec.
- `food-search.tsx` — search input restyled to 48pt with 16pt radius and `bg.surface`, no border. Results render as log-row-style entries (borderless, hairline dividers) with skeleton variant matching the new row design.
- `(tabs)/meals.tsx` — saved meal cards lose their border, gain `shadow.subtle`. Search input matches `food-search.tsx`. Empty state typography updates per new hierarchy.
- `(tabs)/settings.tsx` — sections use hairline dividers, no card borders. Section labels in Inter xs uppercase letter-spaced.
- `confirm-meal.tsx`, `pantry-confirm.tsx`, `photo-confirm.tsx`, `barcode-scan.tsx`, `photo-scan.tsx`, `label-scan.tsx` — token application only (palette, type, radius). Layout unchanged.
- Onboarding screens (`onboarding/*.tsx`) — token application only. Welcome/profile/activity/tdee-result/amazfit keep their layouts; only colors, fonts, and spacing change.

**Out of scope (deferred to follow-up specs):**

- Quantity input redesign on `confirm-food.tsx` (per-food units like "1 chicken breast", "100 ml").
- Cooked-meal portion tracking on Meals tab (multi-ingredient recipes divided into servings).
- Tab bar reorganization beyond what's described in §4 (e.g., merging Meals + Pantry into one screen) — those are product-design questions outside this visual redesign.

---

## 6. Motion catalog

| Trigger | Animation | Notes |
|---|---|---|
| Calorie total change (food added or removed) | Count-up over 200ms ease-out from old to new value; arc fill spring (stiffness 180, damping 20) from old to new percentage | Both run simultaneously |
| Hero card swipe between pages | Native pager 300ms ease-out; content has subtle parallax — content offset moves at 0.94× the page offset | Page-dot active state crossfades |
| Water tap (canvas press on water page) | Wave fill spring (stiffness 140, damping 18); +250ml count-up; light haptic (`Haptics.ImpactFeedbackStyle.Light`) | If user is at or above target, no haptic — just a softer count-up |
| Weight sparkline | Path draws left-to-right over 600ms ease-out on page focus; final dot fades in over last 100ms | Re-runs on every swipe back to the page |
| FAB ("+") press | Scale to 0.94 over 80ms, light haptic, scale back 150ms ease-out | Press triggers bottom sheet open |
| Bottom sheet open | Slide up 300ms ease-out, backdrop fade-in 200ms | |
| Bottom sheet dismiss | Slide down 250ms ease-in | |
| Food row swipe-delete | Native swipeable (preserved) | Existing behavior |
| Add-to-log success | Brief terracotta toast at top, 2s auto-dismiss; medium haptic (`ImpactFeedbackStyle.Medium`) | |
| Macro bar fills (when totals change) | Spring (stiffness 160, damping 22) | All three bars animate simultaneously |
| Tab change | Color crossfade on icon + label, 150ms | No layout movement |
| Pressed state on cards / rows | Surface flashes to `bg.surfaceMuted`, 100ms, no haptic | Avoids scroll noise |
| Onboarding screen transitions | Existing native push/pop, unchanged | |

All animations honor `Reduce Motion` accessibility preference: count-ups become instant, springs become linear 100ms, parallax disabled.

---

## 7. Implementation breakdown (preview)

The implementation plan (separate document, generated next) will likely organize work as:

1. **Tokens** — replace `Colors.ts`, add `Typography.ts`, augment `Spacing.ts`, add font loading via `expo-font` for Fraunces / Inter / JetBrains Mono.
2. **Shared primitives** — restyle base components (`Button`, `Card` if it exists, list rows, section headers) to read from new tokens.
3. **Hero canvas** — new component `HomeHeroPager` with four child pages (`CaloriesPage`, `MacrosPage`, `WaterPage`, `WeightPage`).
4. **Home screen restructure** — replace card stack in `(tabs)/index.tsx` with header + hero pager + log list using new row component.
5. **Tab bar + FAB** — new `TabBarWithFab` component replacing the default Expo Router tab bar; bottom sheet `LogMethodsSheet` component.
6. **Token application sweep** — restyle all screens listed in §5 to consume new tokens.
7. **Motion** — wire animations per §6 catalog.
8. **Accessibility pass** — Reduce Motion handling, color contrast verification, dynamic type respect.

---

## 8. Open questions

None at spec time. Any new questions raised during implementation are deferred to the implementation plan.

---

## 9. Success criteria

The redesign is "done" when:

- Every screen in the app reads from the new token map (no leftover `#2D9CDB`, no leftover bordered cards).
- Home shows a working four-page swipeable hero with all four pages functional.
- The tab bar shows three labeled, iconed tabs and a floating terracotta "+" FAB.
- Tapping "+" opens the log methods bottom sheet with all currently-available methods.
- All existing tests still pass; new tests cover any new utility functions introduced (e.g., sparkline data prep).
- Manual test plan exercises: cold start → home → swipe through 4 pages → tap "+" → log a food via search → return to home → see calorie count-up animate → swipe to weight page → see sparkline draw.
- Motion respects Reduce Motion when enabled at the OS level.
- Light mode and dark mode both work and look consistent.
