# Nourish — App Planning Document

## Overview
Nourish is a native mobile calorie tracking app built with React Native (Expo) for both iOS and Android. It is designed for users who do not have access to a food scale, making logging as fast and frictionless as possible through multiple input methods. The app integrates with Amazfit smartwatches to pull daily calories burned and display a live net calorie balance.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native via Expo (managed workflow → development build for health integrations) |
| Language | TypeScript (strict mode) |
| Navigation | Expo Router (file-based routing) |
| Local storage | AsyncStorage + MMKV |
| Camera / barcode | expo-camera + expo-barcode-scanner |
| Microphone / audio | expo-av |
| Health Connect (Android) | react-native-health-connect |
| Apple Health (iOS) | react-native-health |
| AI features | Anthropic API (Vision + text) |
| Food database — whole foods | USDA FoodData Central API (free, no key required for basic use) |
| Food database — packaged/branded | Open Food Facts API (free, open source) |
| Amazfit integration (primary) | Zepp REST API with OAuth 2.0 |
| Amazfit integration (fallback) | Google Health Connect (Android) / Apple Health (iOS) |

---

## App Architecture

### Folder Structure
```
nourish/
├── app/                        # Expo Router screens
│   ├── (tabs)/
│   │   ├── index.tsx           # Home / Dashboard
│   │   ├── log.tsx             # Log food (quick-add entry point)
│   │   ├── meals.tsx           # Saved meals library
│   │   └── settings.tsx        # Settings
│   ├── onboarding/
│   │   ├── welcome.tsx
│   │   ├── profile.tsx
│   │   ├── activity.tsx
│   │   ├── tdee-result.tsx
│   │   └── amazfit.tsx
│   └── _layout.tsx
├── components/                 # Reusable UI components
├── hooks/                      # Custom React hooks
├── services/                   # API calls, data services
│   ├── usda.ts                 # USDA FoodData Central
│   ├── openFoodFacts.ts        # Open Food Facts
│   ├── anthropic.ts            # Anthropic Vision + text
│   ├── zepp.ts                 # Zepp OAuth + REST API
│   └── healthKit.ts            # Apple Health / Health Connect
├── store/                      # State management (Zustand or Context)
├── utils/                      # TDEE calc, unit conversion, helpers
├── constants/                  # Colors, fonts, spacing tokens
├── types/                      # TypeScript interfaces and types
├── PLANNING.md                 # This file
└── CLAUDE.md                   # Claude Code engineering rules
```

---

## Screens & Navigation

### Onboarding Flow (first launch only, stored in MMKV)
1. **Welcome** — App name, brief value prop, "Get Started" CTA
2. **Profile Setup** — Name (optional), biological sex, date of birth, height, weight (imperial/metric toggle)
3. **Activity & Goal** — Activity level (sedentary / lightly active / moderately active / very active / extremely active), Goal (lose weight / maintain / gain muscle)
4. **TDEE Result** — Shows calculated daily calorie target with macro breakdown (protein / carbs / fat). Explain it adapts over time. "Looks good" CTA.
5. **Amazfit Connection** — Three options presented as cards:
   - Connect with Zepp account (OAuth) — recommended
   - Connect via Health Connect / Apple Health — fallback
   - Skip for now — always available, can connect later in Settings
6. **Done** — Brief confirmation, transition to main app

### Main App — Bottom Tab Navigation
- 🏠 **Home** (index) — Dashboard
- ➕ **Log** — Quick-add entry point, opens bottom sheet with 5 logging methods
- 🍽️ **Meals** — Saved meals library
- ⚙️ **Settings** — Profile, connections, preferences

---

## Screen Specifications

### Home Screen
- Header: today's date + greeting
- **Net Calories card** (most prominent): three numbers — Eaten / Burned / Remaining
  - Eaten = sum of all logged food today
  - Burned = calories from Amazfit (or manual entry)
  - Remaining = daily target - eaten + burned
- **Water tracker**: progress bar + tap to add (250ml increments, daily goal adjustable, default 2000ml)
- **Today's meal log**: chronological list of logged food items, swipe to delete
- Pull to refresh syncs Amazfit data

### Log Screen / Bottom Sheet
A bottom sheet modal with 5 logging method buttons:

| Button | Icon | Action |
|---|---|---|
| Manual Search | 🔍 | Opens searchable food database |
| Barcode Scan | 📊 | Opens camera in barcode mode |
| Nutrition Label Scan | 🏷️ | Opens camera, sends to Anthropic Vision |
| Photo Scan | 📷 | Opens camera, sends full image to Anthropic Vision |
| Voice Log | 🎙️ | Records audio, transcribes, sends to Anthropic text API |

**Every logging method flows to a shared Confirm Screen:**
- Shows food name, quantity, and nutrition breakdown (calories, protein, carbs, fat)
- User can adjust quantity/serving before confirming
- Option to save as a meal before confirming
- "Add to Log" button

### Saved Meals Screen
- List of user-saved meals with name, calorie count, and macro summary
- Tap a meal → opens Confirm Screen with pre-filled values (quantity editable)
- Long press → rename or delete
- Search/filter bar at top

### Settings Screen
- **Profile**: edit height, weight, goal, activity level
- **Daily targets**: manually override calorie and macro targets
- **Amazfit / Watch**: connection status, switch methods, disconnect
- **Water goal**: adjust daily water target
- **Units**: metric / imperial
- **Adaptive TDEE**: toggle on/off, view recalculation history

---

## Feature Specifications

### TDEE Calculator
Use the Mifflin-St Jeor equation for BMR, then multiply by activity factor:
- Sedentary: BMR × 1.2
- Lightly active: BMR × 1.375
- Moderately active: BMR × 1.55
- Very active: BMR × 1.725
- Extremely active: BMR × 1.9

Default macro split:
- Protein: 25% of calories (4 cal/g)
- Fat: 30% of calories (9 cal/g)
- Carbs: 45% of calories (4 cal/g)

### Adaptive TDEE Recalculation
- Triggers after the user has logged food for 14+ days AND logged body weight at least 3 times
- Algorithm: compare actual average daily intake vs. real weight change over the period
  - If weight dropped more than expected → actual TDEE is higher than estimated → increase target
  - If weight dropped less than expected → actual TDEE is lower → decrease target
- On the user's next app open after recalculation, show an **in-app alert modal**:
  - Explain that the app has learned their metabolism
  - Show old target vs. new target
  - Positive framing: "Your body burns X calories a day. Here's your updated target."
  - User taps "Got it" to dismiss

### Barcode Scanner
- Uses expo-barcode-scanner to scan EAN/UPC barcodes
- Queries Open Food Facts API: `https://world.openfoodfacts.org/api/v0/product/{barcode}.json`
- Falls back to USDA if not found in Open Food Facts
- If not found in either: prompt user to scan the nutrition label instead

### Nutrition Label Scanner
- User points camera at a nutrition facts panel
- Frame is sent to Anthropic Vision API with prompt:
  > "This is a photo of a nutrition label. Extract: product name (if visible), serving size, calories, total fat (g), saturated fat (g), sodium (mg), total carbohydrates (g), dietary fiber (g), sugars (g), protein (g), and any vitamins/minerals listed. Return as JSON."
- Parsed values are pre-filled on the Confirm Screen
- User can edit any field before confirming

### Photo Logging
- User takes a photo of their meal
- Image sent to Anthropic Vision API with prompt:
  > "Identify all food items visible in this meal photo. For each item, estimate the food name, portion size in common units (e.g. '1 medium chicken breast', '1 cup cooked rice'), and approximate calories. Return as a JSON array. If you are uncertain about a quantity, give your best estimate and flag it with 'uncertain: true'."
- Results displayed on Confirm Screen
- User reviews and adjusts each item before confirming
- Items flagged as uncertain are highlighted for user attention

### Voice Logging
- User taps mic button, records up to 30 seconds
- expo-av records audio, transcription handled by sending audio description / using Anthropic text API after transcription
- Transcribed text sent to Anthropic API with prompt:
  > "The user said: '{transcription}'. Identify all food items mentioned. For each, extract the food name and quantity (in common units if stated, or estimate a standard serving if not). Return as a JSON array."
- Results displayed on Confirm Screen for review

### Saved Meals
- Saved as JSON in AsyncStorage/MMKV under key `saved_meals`
- Structure:
```typescript
interface SavedMeal {
  id: string;
  name: string;
  createdAt: string;
  items: FoodLogItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}
```
- When re-logging, user sees the meal's items with a global quantity multiplier (e.g. "0.5x", "1x", "2x") or can edit individual items

### Water Tracking
- Simple integer counter per day stored in MMKV
- Buttons: +250ml, +500ml, custom
- Progress shown as a bar on home screen
- Daily total resets at midnight

---

## Amazfit Integration

### Tier 1 — Zepp REST API (OAuth 2.0) — Primary
- Endpoint base: `https://api-mifit.huami.com`
- OAuth flow: open Zepp authorization URL in an in-app browser (expo-web-browser), capture redirect with access token
- After auth, store access token securely (expo-secure-store)
- Daily sync: fetch activity data including calories burned
  - Scope needed: `activity` (steps, calories, active minutes)
- Sync on app foreground / pull to refresh on home screen

### Tier 2 — Health Connect (Android) / Apple Health (iOS) — Fallback
- Android: react-native-health-connect
  - Permission: `android.permission.health.READ_TOTAL_CALORIES_BURNED`
  - Read `TotalCaloriesBurnedRecord` for today
- iOS: react-native-health
  - Permission: `HKQuantityTypeIdentifierActiveEnergyBurned`
  - Read today's active energy burned

### Tier 3 — Manual Entry — Always Available
- Simple number input on home screen
- Stored in daily log alongside food data

### Sync Logic
- On app open: check which tier is connected, fetch accordingly
- If no connection: show "Connect your watch" nudge card on home screen (dismissible)
- Burned calories update the Net Calories card in real time

---

## Data Models

```typescript
interface UserProfile {
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

interface FoodLogItem {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  timestamp: string; // ISO datetime
  foodName: string;
  brandName?: string;
  servingSize: string; // e.g. "1 cup", "100g", "1 medium"
  servingQuantity: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: 'usda' | 'openfoodfacts' | 'photo' | 'barcode' | 'label' | 'voice' | 'manual';
}

interface DailyLog {
  date: string; // YYYY-MM-DD
  foodItems: FoodLogItem[];
  waterMl: number;
  caloriesBurned: number;
  caloriesBurnedSource: 'zepp' | 'healthconnect' | 'applehealth' | 'manual';
  bodyWeightKg?: number;
}

interface SavedMeal {
  id: string;
  name: string;
  createdAt: string;
  items: Omit<FoodLogItem, 'id' | 'date' | 'timestamp'>[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
}
```

---

## API Keys & Environment Variables
Store in `.env` (never commit to git):
```
ANTHROPIC_API_KEY=
ZEPP_CLIENT_ID=
ZEPP_CLIENT_SECRET=
USDA_API_KEY=        # optional, higher rate limits
```

---

## Suggested Build Order
Build in this sequence so there is a working, testable app at each stage:

1. Project setup — Expo init, TypeScript config, folder structure, navigation shell
2. Onboarding flow — Profile setup + TDEE calculator
3. Home dashboard — Static layout with hardcoded placeholder data
4. Manual food search — USDA + Open Food Facts search + Confirm Screen
5. Daily log — Store and display food items, calorie totals
6. Barcode scanner — expo-barcode-scanner + Open Food Facts lookup
7. Saved meals — Save, list, and re-log meals
8. Water tracking — Counter on home screen
9. Amazfit integration — OAuth + Health Connect + manual fallback
10. Net calories — Live eaten / burned / remaining on dashboard
11. Photo logging — Anthropic Vision
12. Nutrition label scanner — Anthropic Vision (label-specific prompt)
13. Voice logging — expo-av + Anthropic text API
14. Adaptive TDEE recalculation — Algorithm + in-app alert
15. Polish — Animations, empty states, error handling, loading skeletons
