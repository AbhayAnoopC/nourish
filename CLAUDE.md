# CLAUDE.md — Engineering Rules for Nourish

This file defines the engineering conventions and rules for this project.
Read this before writing any code. Follow these rules in every file, every time.

---

## Project Context
Nourish is a React Native (Expo) calorie tracking app. Full product spec is in PLANNING.md.
Read PLANNING.md at the start of every new feature or session.

---

## Language & Types

- **Always use TypeScript.** No `.js` files anywhere in the project.
- **Strict mode is on.** `tsconfig.json` must have `"strict": true`. Never disable it.
- **No `any`.** If you don't know a type, use `unknown` and narrow it. Never use `any`.
- **Define all data models in `types/`.** Import from there — never inline ad-hoc interfaces in component files.
- **Use `interface` for object shapes, `type` for unions and aliases.**

---

## Component Rules

- **All components are functional.** No class components.
- **One component per file.** File name matches the component name in PascalCase.
- **Props must be typed.** Every component has an explicit props interface defined above it in the same file.
- **No inline styles.** Use StyleSheet.create() at the bottom of each component file. Never use the `style={{ }}` prop with object literals in JSX.
- **Keep components small.** If a component exceeds ~150 lines, split it.
- **No logic in JSX.** Extract complex conditional rendering into variables above the return statement.

---

## File & Folder Structure

Follow the structure defined in PLANNING.md exactly:
```
app/          → Expo Router screens only. No business logic here.
components/   → Reusable UI components
hooks/        → Custom React hooks (useFood, useLog, useAmazfit, etc.)
services/     → All API calls. One file per external service.
store/        → Global state (Zustand preferred)
utils/        → Pure functions: TDEE calc, unit conversion, date helpers
constants/    → Colors, spacing, font sizes, API endpoints
types/        → All TypeScript interfaces and types
```

Screens in `app/` should be thin — they import components and call hooks. No fetch calls or business logic directly in screen files.

---

## State Management

- Use **Zustand** for global state (user profile, daily log, saved meals).
- Use **local component state** (useState) only for UI state (modal open/closed, input values).
- **Never store derived data.** Compute totals (totalCalories, macros) from raw items on the fly using `useMemo`.
- Persist user profile and daily logs using **MMKV** via a Zustand persist middleware.

---

## API & Services

- All API calls live in `services/`. Never call `fetch` directly in a component or hook.
- Each service file exports typed async functions. Example: `searchFoods(query: string): Promise<FoodItem[]>`
- **Always handle errors.** Every service function must have a try/catch. Never swallow errors silently.
- **Never hardcode API keys.** All keys come from environment variables.
- API keys that must stay secret (Anthropic, Zepp) must never be prefixed `EXPO_PUBLIC_` — call them from a backend proxy or Expo API route.

---

## Anthropic API Usage

- The Anthropic API key is sensitive. **Never expose it in client-side code.**
- All Anthropic API calls must go through a backend proxy or Expo API route.
- For Vision requests (photo, label scan): compress images before sending (max 1MB).
- Always include a fallback UI if the Anthropic API returns an error — the user must be able to enter food manually.
- Parse Anthropic responses defensively. Wrap all JSON.parse calls in try/catch.

---

## Navigation

- Use **Expo Router** file-based routing. Screen files go in `app/`.
- Use typed routes. Enable `expo-router`'s typed routes feature.
- **No inline navigation logic in components.** Use the `useRouter` hook in the screen or a dedicated hook.

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Components | PascalCase | `FoodLogItem.tsx` |
| Hooks | camelCase, prefix `use` | `useDailyLog.ts` |
| Services | camelCase | `openFoodFacts.ts` |
| Types/Interfaces | PascalCase | `FoodLogItem`, `UserProfile` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_WATER_ML` |
| Variables & functions | camelCase | `calculateTDEE()` |
| Files (non-component) | camelCase | `tdeeCalculator.ts` |

---

## Error Handling

- **Never silently ignore errors.** Every catch block must either log the error or surface it to the user.
- Use a shared `ErrorMessage` component or toast for consistent error display.
- Network errors must show a user-friendly message, not a raw error string.
- Camera/microphone permission denials must be handled gracefully with a prompt to open Settings.

---

## Performance

- Use `useMemo` for expensive calculations (daily totals, macro percentages).
- Use `useCallback` for functions passed as props to avoid unnecessary re-renders.
- Use `FlatList` for all scrollable lists. Never use `ScrollView` with `.map()` for long lists.

---

## Testing

- Write unit tests for all `utils/` functions (TDEE calculator, unit conversions, date helpers).
- Write unit tests for all `services/` functions using mocked fetch responses.
- Use **Jest** + **React Native Testing Library**.
- Test files live next to the file they test: `tdeeCalculator.test.ts` beside `tdeeCalculator.ts`.

---

## Git & Commits

- Commit after each completed build step from the build order in PLANNING.md.
- Commit message format: `[step N] short description` — e.g. `[step 4] manual food search with USDA + confirm screen`
- Never commit `.env`, `node_modules`, or build artifacts.
- `.gitignore` must include: `.env`, `.env.local`, `node_modules/`, `.expo/`, `dist/`

---

## Expo-Specific Rules

- Use a **development build** (not Expo Go) for any feature requiring:
  - react-native-health-connect
  - react-native-health
  - expo-secure-store with sensitive data
  - Zepp OAuth (expo-web-browser redirect)
- Use `app.config.ts` (not `app.json`) for dynamic config so environment variables can be injected at build time.
- Run `npx expo prebuild` before testing native modules.

---

## Do Not

- Do not use `any` type
- Do not call APIs directly from screen files
- Do not store secrets in client-side code or MMKV
- Do not use `ScrollView` with `.map()` for long lists
- Do not create files outside the defined folder structure
- Do not skip error handling
- Do not use inline styles in JSX
- Do not commit `.env` files
