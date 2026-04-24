# Nourish

A React Native (Expo) calorie tracking app built for people who don't own a food scale. Log meals in seconds using AI-powered photo recognition, barcode scanning, voice logging, or manual search — then see your real net calories after pulling burned calories from your Amazfit watch.

---

## Features

### Logging Methods
- **Manual Search** — Search the USDA FoodData Central and Open Food Facts databases
- **Barcode Scanner** — Scan any packaged food's EAN/UPC barcode
- **Nutrition Label Scan** — Point the camera at a nutrition facts panel; Anthropic Vision extracts all values automatically
- **Photo Log** — Photograph your meal; AI identifies each food item and estimates portions
- **Voice Log** — Say what you ate; the app parses food items and quantities from natural speech

Every method flows to a shared Confirm screen where you can review and adjust quantities before adding to your log.

### Dashboard
- **Net Calories card** — Eaten / Burned / Remaining at a glance
- **Water tracker** — Tap to log in 250 ml increments, configurable daily goal
- **Today's meal log** — Chronological list with swipe-to-delete
- Pull to refresh syncs the latest activity data from your watch

### Amazfit / Watch Integration
- Connects to Zepp (Amazfit) accounts via OAuth 2.0 to pull daily calories burned
- Falls back to Google Health Connect (Android) or Apple Health (iOS)
- Manual calorie entry available if no watch is connected

### Saved Meals
- Save any meal for quick re-logging later
- Global quantity multiplier (0.5×, 1×, 2×) or edit individual items
- Search and filter your library

### Adaptive TDEE
- Recalculates your calorie target after 14+ days of logging by comparing actual intake to real weight change
- Surfaces the update as an in-app notification with clear, positive framing

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native via Expo |
| Language | TypeScript (strict mode) |
| Navigation | Expo Router (file-based) |
| State | Zustand + MMKV persistence |
| AI features | Anthropic Claude (Vision + text) |
| Food data | USDA FoodData Central + Open Food Facts |
| Watch sync | Zepp REST API (OAuth 2.0) |
| Health fallback | Health Connect (Android) / Apple Health (iOS) |
| Camera / barcode | expo-camera |
| Audio | expo-av |

---

## Project Structure

```
app/            Expo Router screens (thin — no business logic)
components/     Reusable UI components
hooks/          Custom React hooks
services/       All API calls (USDA, OpenFoodFacts, Anthropic, Zepp, Health)
store/          Zustand global state
utils/          Pure functions: TDEE calc, unit conversion, date helpers
constants/      Colors, spacing, font sizes, API endpoints
types/          TypeScript interfaces and types
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- A development build (Expo Go is not supported — native modules are required)

### Install

```bash
git clone https://github.com/AbhayAnoopC/nourish.git
cd nourish
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Anthropic (server-side only — never expose to the client)
ANTHROPIC_API_KEY=your_key_here

# Zepp / Amazfit OAuth
ZEPP_CLIENT_ID=your_client_id
ZEPP_CLIENT_SECRET=your_client_secret
```

> API keys for Anthropic and Zepp are sensitive. They are routed through Expo API routes and are never bundled into the client.

### Run

```bash
# Start the dev server
npx expo start

# Run on Android
npx expo start --android

# Run on iOS
npx expo start --ios
```

For features that require native modules (watch sync, Health Connect, secure storage), run a development build:

```bash
npx expo prebuild
npx expo run:android   # or run:ios
```

---

## Environment Notes

- Uses `app.config.ts` (not `app.json`) so environment variables are injected at build time
- Secrets must **not** be prefixed `EXPO_PUBLIC_` — they are accessed only from server-side API routes
- MMKV is used for fast local persistence; sensitive tokens go to `expo-secure-store`

---

## License

MIT
