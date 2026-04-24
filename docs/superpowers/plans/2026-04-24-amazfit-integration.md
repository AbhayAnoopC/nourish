# Amazfit Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up calories-burned tracking via three tiers — Zepp OAuth (Tier 1), Health Connect / Apple Health stubs (Tier 2), and always-available manual entry (Tier 3) — with a dismissible nudge card on the home screen and a real Amazfit section in Settings.

**Architecture:** A persisted `amazfitStore` tracks which tier is active and the nudge state. `services/zepp.ts` handles OAuth and REST (needs real credentials at runtime). `services/healthKit.ts` provides correctly-typed stubs that return safe defaults when native modules are unavailable (Health Connect / Apple Health require a dev build — stubs keep the app buildable in Expo Go). `useAmazfit` hook selects the right service tier and syncs on app foreground. The home screen gains a `WatchNudgeCard` and a `BurnedCaloriesCard`.

**Tech Stack:** `expo-secure-store` (token storage), `expo-web-browser` (already installed, for Zepp OAuth), Zustand + AsyncStorage persistence, React Native AppState.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `types/index.ts` | Modify | Add `AmazfitConnectionTier` type |
| `app.config.ts` | Modify | Add `zeppClientId` to extra; add `expo-secure-store` plugin |
| `store/amazfitStore.ts` | Create | Persisted state: connectionTier, nudgeDismissed, lastSyncedAt |
| `store/amazfitStore.test.ts` | Create | Unit tests for store actions |
| `services/zepp.ts` | Create | SecureStore token helpers + OAuth flow + calories fetch |
| `services/zepp.test.ts` | Create | Unit tests for URL builder, token helpers (mocked SecureStore) |
| `services/healthKit.ts` | Create | Stubs for Health Connect / Apple Health with graceful degradation |
| `services/healthKit.test.ts` | Create | Verify stubs return expected safe defaults |
| `hooks/useAmazfit.ts` | Create | Unified hook: tier selection, sync on foreground, connect/disconnect |
| `components/WatchNudgeCard.tsx` | Create | Dismissible "Connect your watch" card shown on home screen |
| `components/BurnedCaloriesCard.tsx` | Create | Shows burned calories; editable inline input when manual/none |
| `app/(tabs)/settings.tsx` | Replace | Full settings screen with Amazfit section |
| `app/(tabs)/index.tsx` | Modify | Add WatchNudgeCard + BurnedCaloriesCard; wire refresh to sync |

---

### Task 1: Type + config additions

**Files:**
- Modify: `types/index.ts`
- Modify: `app.config.ts`

- [ ] **Step 1: Add AmazfitConnectionTier to types/index.ts**

Append at the bottom of `types/index.ts`:
```typescript
export type AmazfitConnectionTier = 'zepp' | 'healthconnect' | 'applehealth' | 'manual' | 'none';
```

- [ ] **Step 2: Update app.config.ts**

Add `expo-secure-store` plugin and `zeppClientId` to extra:
```typescript
  plugins: [
    'expo-router',
    'expo-font',
    'expo-web-browser',
    'expo-secure-store',
  ],
  extra: {
    usdaApiKey: process.env.USDA_API_KEY ?? '',
    zeppClientId: process.env.ZEPP_CLIENT_ID ?? '',
  },
```

- [ ] **Step 3: Install expo-secure-store**

```bash
npx expo install expo-secure-store
```

Expected: package added to `package.json` dependencies.

- [ ] **Step 4: Commit**

```bash
git add types/index.ts app.config.ts package.json package-lock.json
git commit -m "feat: add AmazfitConnectionTier type, install expo-secure-store"
```

---

### Task 2: amazfitStore

**Files:**
- Create: `store/amazfitStore.ts`
- Create: `store/amazfitStore.test.ts`

- [ ] **Step 1: Write the store**

```typescript
// store/amazfitStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AmazfitConnectionTier } from '@/types';

interface AmazfitState {
  connectionTier: AmazfitConnectionTier;
  nudgeDismissed: boolean;
  lastSyncedAt: string | null;
  setConnectionTier: (tier: AmazfitConnectionTier) => void;
  dismissNudge: () => void;
  setLastSyncedAt: (iso: string) => void;
}

export const useAmazfitStore = create<AmazfitState>()(
  persist(
    (set) => ({
      connectionTier: 'none',
      nudgeDismissed: false,
      lastSyncedAt: null,
      setConnectionTier: (tier) => set({ connectionTier: tier }),
      dismissNudge: () => set({ nudgeDismissed: true }),
      setLastSyncedAt: (iso) => set({ lastSyncedAt: iso }),
    }),
    {
      name: 'amazfit-connection',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
```

- [ ] **Step 2: Write the tests**

```typescript
// store/amazfitStore.test.ts
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

import { useAmazfitStore } from './amazfitStore';

beforeEach(() => {
  useAmazfitStore.setState({
    connectionTier: 'none',
    nudgeDismissed: false,
    lastSyncedAt: null,
  });
});

describe('setConnectionTier', () => {
  it('updates the connection tier', () => {
    useAmazfitStore.getState().setConnectionTier('manual');
    expect(useAmazfitStore.getState().connectionTier).toBe('manual');
  });

  it('can be set to zepp', () => {
    useAmazfitStore.getState().setConnectionTier('zepp');
    expect(useAmazfitStore.getState().connectionTier).toBe('zepp');
  });

  it('can be reset to none', () => {
    useAmazfitStore.getState().setConnectionTier('zepp');
    useAmazfitStore.getState().setConnectionTier('none');
    expect(useAmazfitStore.getState().connectionTier).toBe('none');
  });
});

describe('dismissNudge', () => {
  it('sets nudgeDismissed to true', () => {
    useAmazfitStore.getState().dismissNudge();
    expect(useAmazfitStore.getState().nudgeDismissed).toBe(true);
  });
});

describe('setLastSyncedAt', () => {
  it('stores the ISO timestamp', () => {
    const iso = '2026-04-24T10:00:00.000Z';
    useAmazfitStore.getState().setLastSyncedAt(iso);
    expect(useAmazfitStore.getState().lastSyncedAt).toBe(iso);
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npm test -- --testPathPattern="amazfitStore"
```

Expected: 5 tests pass.

- [ ] **Step 4: Commit**

```bash
git add store/amazfitStore.ts store/amazfitStore.test.ts
git commit -m "feat: amazfitStore — connection tier, nudge dismissed, last synced"
```

---

### Task 3: zepp service

**Files:**
- Create: `services/zepp.ts`
- Create: `services/zepp.test.ts`

- [ ] **Step 1: Write the service**

```typescript
// services/zepp.ts
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { ZEPP_API_BASE } from '@/constants/Api';

const TOKEN_KEY = 'zepp_access_token';
const REDIRECT_URI = 'nourish://auth/zepp';

// ─── Token storage ────────────────────────────────────────────────────────────

export async function getStoredToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function storeToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// ─── OAuth helpers ────────────────────────────────────────────────────────────

export function buildAuthUrl(clientId: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'activity',
  });
  return `https://api-user.huami.com/registrations/oauth/redirect?${params.toString()}`;
}

export function extractCodeFromRedirect(redirectUrl: string): string | null {
  try {
    const url = new URL(redirectUrl);
    return url.searchParams.get('code');
  } catch {
    return null;
  }
}

// ─── Auth flow ────────────────────────────────────────────────────────────────

export async function startZeppAuth(): Promise<string | null> {
  const clientId = (Constants.expoConfig?.extra?.zeppClientId as string) ?? '';
  if (!clientId) {
    throw new Error('ZEPP_CLIENT_ID is not configured. Add it to your .env file.');
  }

  const authUrl = buildAuthUrl(clientId);
  const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);

  if (result.type !== 'success' || !result.url) return null;

  const code = extractCodeFromRedirect(result.url);
  if (!code) return null;

  // Exchange authorization code for access token
  const response = await fetch('https://auth.huami.com/server/oauth2/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    }).toString(),
  });

  if (!response.ok) {
    throw new Error(`Zepp token exchange failed with status ${response.status}`);
  }

  const data: { access_token?: string } = await response.json();
  if (!data.access_token) {
    throw new Error('Zepp token response missing access_token');
  }

  await storeToken(data.access_token);
  return data.access_token;
}

// ─── Activity data ────────────────────────────────────────────────────────────

export async function fetchTodayCaloriesBurned(accessToken: string): Promise<number> {
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

  const url = `${ZEPP_API_BASE}/v1/data/band_data.json?query_type=summary&device_type=0&from_date=${dateStr}&to_date=${dateStr}`;

  const response = await fetch(url, {
    headers: { apptoken: accessToken },
  });

  if (!response.ok) {
    throw new Error(`Zepp API responded with status ${response.status}`);
  }

  const data: { data?: Array<{ summary?: { caloriesOut?: number } }> } = await response.json();
  return data.data?.[0]?.summary?.caloriesOut ?? 0;
}
```

- [ ] **Step 2: Write the tests**

```typescript
// services/zepp.test.ts
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { zeppClientId: 'TEST_CLIENT' } } },
}));

import * as SecureStore from 'expo-secure-store';
import {
  buildAuthUrl,
  extractCodeFromRedirect,
  getStoredToken,
  storeToken,
  clearToken,
} from './zepp';

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('buildAuthUrl', () => {
  it('includes client_id, redirect_uri, and scope', () => {
    const url = buildAuthUrl('my-client-id');
    expect(url).toContain('client_id=my-client-id');
    expect(url).toContain('redirect_uri=');
    expect(url).toContain('scope=activity');
  });

  it('targets the Huami auth endpoint', () => {
    const url = buildAuthUrl('x');
    expect(url).toContain('api-user.huami.com');
  });
});

describe('extractCodeFromRedirect', () => {
  it('extracts the code query param', () => {
    const code = extractCodeFromRedirect('nourish://auth/zepp?code=ABC123');
    expect(code).toBe('ABC123');
  });

  it('returns null for URLs without a code param', () => {
    expect(extractCodeFromRedirect('nourish://auth/zepp?error=access_denied')).toBeNull();
  });

  it('returns null for invalid URLs', () => {
    expect(extractCodeFromRedirect('not-a-url')).toBeNull();
  });
});

describe('getStoredToken', () => {
  it('returns the stored token', async () => {
    mockSecureStore.getItemAsync.mockResolvedValueOnce('my-token');
    expect(await getStoredToken()).toBe('my-token');
  });

  it('returns null when SecureStore throws', async () => {
    mockSecureStore.getItemAsync.mockRejectedValueOnce(new Error('unavailable'));
    expect(await getStoredToken()).toBeNull();
  });
});

describe('storeToken', () => {
  it('calls SecureStore.setItemAsync with the token', async () => {
    mockSecureStore.setItemAsync.mockResolvedValueOnce();
    await storeToken('tok');
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('zepp_access_token', 'tok');
  });
});

describe('clearToken', () => {
  it('calls SecureStore.deleteItemAsync', async () => {
    mockSecureStore.deleteItemAsync.mockResolvedValueOnce();
    await clearToken();
    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('zepp_access_token');
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npm test -- --testPathPattern="zepp"
```

Expected: 9 tests pass.

- [ ] **Step 4: Commit**

```bash
git add services/zepp.ts services/zepp.test.ts
git commit -m "feat: zepp service — SecureStore token helpers, OAuth URL builder, activity fetch"
```

---

### Task 4: healthKit service (stubs)

**Files:**
- Create: `services/healthKit.ts`
- Create: `services/healthKit.test.ts`

- [ ] **Step 1: Write the service**

```typescript
// services/healthKit.ts
// Tier 2 — Health Connect (Android) / Apple Health (iOS)
//
// Real implementation requires:
//   Android: react-native-health-connect (needs dev build + npx expo prebuild)
//   iOS:     react-native-health (needs dev build + npx expo prebuild)
//
// These stubs keep the app buildable in Expo Go and provide the correct
// interface for when native packages are added in a dev build.

export function isAvailable(): boolean {
  // Returns true only when the native module is linked (i.e., in a dev build).
  // In Expo Go there is no native health module, so always false here.
  return false;
}

export async function requestPermissions(): Promise<boolean> {
  if (!isAvailable()) return false;
  // Dev-build implementation: request READ_TOTAL_CALORIES_BURNED (Android)
  // or HKQuantityTypeIdentifierActiveEnergyBurned (iOS).
  return false;
}

export async function fetchTodayCaloriesBurned(): Promise<number> {
  if (!isAvailable()) return 0;
  // Dev-build implementation: query health records for today's active calories.
  return 0;
}
```

- [ ] **Step 2: Write the tests**

```typescript
// services/healthKit.test.ts
import { isAvailable, requestPermissions, fetchTodayCaloriesBurned } from './healthKit';

describe('isAvailable', () => {
  it('returns false in the Expo Go / node test environment', () => {
    expect(isAvailable()).toBe(false);
  });
});

describe('requestPermissions', () => {
  it('returns false when native module is unavailable', async () => {
    expect(await requestPermissions()).toBe(false);
  });
});

describe('fetchTodayCaloriesBurned', () => {
  it('returns 0 when native module is unavailable', async () => {
    expect(await fetchTodayCaloriesBurned()).toBe(0);
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npm test -- --testPathPattern="healthKit"
```

Expected: 3 tests pass.

- [ ] **Step 4: Commit**

```bash
git add services/healthKit.ts services/healthKit.test.ts
git commit -m "feat: healthKit service stubs — correct interface, safe defaults for Expo Go"
```

---

### Task 5: useAmazfit hook

**Files:**
- Create: `hooks/useAmazfit.ts`

- [ ] **Step 1: Write the hook**

```typescript
// hooks/useAmazfit.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAmazfitStore } from '@/store/amazfitStore';
import { useDailyLogStore } from '@/store/dailyLogStore';
import { getTodayDateString } from '@/utils/dateUtils';
import * as ZeppService from '@/services/zepp';
import * as HealthKitService from '@/services/healthKit';
import type { AmazfitConnectionTier } from '@/types';

interface UseAmazfitReturn {
  connectionTier: AmazfitConnectionTier;
  nudgeDismissed: boolean;
  syncing: boolean;
  lastSyncedAt: string | null;
  connectZepp: () => Promise<void>;
  connectHealthKit: () => Promise<void>;
  setManual: () => void;
  disconnect: () => void;
  sync: () => Promise<void>;
  dismissNudge: () => void;
}

export function useAmazfit(): UseAmazfitReturn {
  const connectionTier = useAmazfitStore((s) => s.connectionTier);
  const nudgeDismissed = useAmazfitStore((s) => s.nudgeDismissed);
  const lastSyncedAt = useAmazfitStore((s) => s.lastSyncedAt);
  const setConnectionTier = useAmazfitStore((s) => s.setConnectionTier);
  const dismissNudge = useAmazfitStore((s) => s.dismissNudge);
  const setLastSyncedAt = useAmazfitStore((s) => s.setLastSyncedAt);
  const setCaloriesBurned = useDailyLogStore((s) => s.setCaloriesBurned);
  const [syncing, setSyncing] = useState(false);

  const sync = useCallback(async () => {
    const today = getTodayDateString();
    if (connectionTier === 'manual' || connectionTier === 'none') return;

    setSyncing(true);
    try {
      let calories = 0;

      if (connectionTier === 'zepp') {
        const token = await ZeppService.getStoredToken();
        if (token) {
          calories = await ZeppService.fetchTodayCaloriesBurned(token);
        }
      } else if (connectionTier === 'healthconnect' || connectionTier === 'applehealth') {
        calories = await HealthKitService.fetchTodayCaloriesBurned();
      }

      setCaloriesBurned(today, calories, connectionTier as 'zepp' | 'healthconnect' | 'applehealth');
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      console.error('[useAmazfit] sync failed:', error);
    } finally {
      setSyncing(false);
    }
  }, [connectionTier, setCaloriesBurned, setLastSyncedAt]);

  // Sync on mount and whenever the app comes to foreground
  const syncRef = useRef(sync);
  syncRef.current = sync;

  useEffect(() => {
    syncRef.current();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncRef.current();
    });
    return () => sub.remove();
  }, []);

  const connectZepp = useCallback(async () => {
    try {
      const token = await ZeppService.startZeppAuth();
      if (token) {
        setConnectionTier('zepp');
      }
    } catch (error) {
      console.error('[useAmazfit] Zepp connect failed:', error);
      throw error;
    }
  }, [setConnectionTier]);

  const connectHealthKit = useCallback(async () => {
    const granted = await HealthKitService.requestPermissions();
    if (granted) {
      const platform = require('react-native').Platform.OS;
      setConnectionTier(platform === 'android' ? 'healthconnect' : 'applehealth');
    }
  }, [setConnectionTier]);

  const setManual = useCallback(() => {
    setConnectionTier('manual');
  }, [setConnectionTier]);

  const disconnect = useCallback(async () => {
    if (connectionTier === 'zepp') {
      await ZeppService.clearToken();
    }
    setConnectionTier('none');
  }, [connectionTier, setConnectionTier]);

  return {
    connectionTier,
    nudgeDismissed,
    syncing,
    lastSyncedAt,
    connectZepp,
    connectHealthKit,
    setManual,
    disconnect,
    sync,
    dismissNudge,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/useAmazfit.ts
git commit -m "feat: useAmazfit hook — tier selection, sync on foreground, connect/disconnect"
```

---

### Task 6: WatchNudgeCard component

**Files:**
- Create: `components/WatchNudgeCard.tsx`

- [ ] **Step 1: Write the component**

```typescript
// components/WatchNudgeCard.tsx
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/constants/Spacing';

interface Props {
  onConnectZepp: () => void;
  onConnectHealth: () => void;
  onDismiss: () => void;
}

export function WatchNudgeCard({ onConnectZepp, onConnectHealth, onDismiss }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: colors.text }]}>Connect your watch</Text>
        <Text style={[styles.body, { color: colors.placeholder }]}>
          Link your Amazfit to automatically track calories burned.
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
          onPress={onConnectZepp}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>Zepp</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
          onPress={onConnectHealth}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>Health</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dismissBtn, { borderColor: colors.border }]}
          onPress={onDismiss}
          activeOpacity={0.8}
        >
          <Text style={[styles.dismissBtnText, { color: colors.placeholder }]}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  textBlock: {
    gap: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  body: {
    fontSize: FONT_SIZE.sm,
    lineHeight: FONT_SIZE.sm * 1.5,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  dismissBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  dismissBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/WatchNudgeCard.tsx
git commit -m "feat: WatchNudgeCard — Zepp / Health / Skip connect prompt"
```

---

### Task 7: BurnedCaloriesCard component

**Files:**
- Create: `components/BurnedCaloriesCard.tsx`

Shows burned calories on the home screen. When connectionTier is `manual` or `none`, provides an inline editable input. When connected to a watch, shows the synced value with a source badge.

- [ ] **Step 1: Write the component**

```typescript
// components/BurnedCaloriesCard.tsx
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/constants/Spacing';
import type { AmazfitConnectionTier } from '@/types';

const SOURCE_LABEL: Record<AmazfitConnectionTier, string> = {
  zepp: 'Zepp',
  healthconnect: 'Health Connect',
  applehealth: 'Apple Health',
  manual: 'Manual',
  none: 'Manual',
};

interface Props {
  caloriesBurned: number;
  connectionTier: AmazfitConnectionTier;
  onSave: (calories: number) => void;
}

export function BurnedCaloriesCard({ caloriesBurned, connectionTier, onSave }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [editing, setEditing] = useState(false);
  const [inputText, setInputText] = useState('');

  const isManual = connectionTier === 'manual' || connectionTier === 'none';

  const handleStartEdit = () => {
    setInputText(caloriesBurned > 0 ? String(caloriesBurned) : '');
    setEditing(true);
  };

  const handleConfirm = () => {
    const val = parseInt(inputText, 10);
    if (Number.isFinite(val) && val >= 0) onSave(val);
    setEditing(false);
  };

  const handleCancel = () => setEditing(false);

  const sourceLabel = SOURCE_LABEL[connectionTier];

  const displayValue = (
    <View style={styles.valueRow}>
      <Text style={[styles.calories, { color: colors.text }]}>
        {caloriesBurned}
        <Text style={[styles.unit, { color: colors.placeholder }]}> kcal burned</Text>
      </Text>
      <View style={styles.rightRow}>
        <View style={[styles.sourceBadge, { backgroundColor: colors.border }]}>
          <Text style={[styles.sourceText, { color: colors.placeholder }]}>{sourceLabel}</Text>
        </View>
        {isManual && (
          <TouchableOpacity onPress={handleStartEdit} activeOpacity={0.7}>
            <Text style={[styles.editLink, { color: colors.tint }]}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const editInput = (
    <View style={styles.editRow}>
      <TextInput
        style={[
          styles.editInput,
          { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
        ]}
        value={inputText}
        onChangeText={setInputText}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor={colors.placeholder}
        autoFocus
        maxLength={5}
        onSubmitEditing={handleConfirm}
      />
      <Text style={[styles.unit, { color: colors.placeholder }]}>kcal</Text>
      <TouchableOpacity
        style={[styles.confirmBtn, { backgroundColor: colors.tint }]}
        onPress={handleConfirm}
        activeOpacity={0.7}
      >
        <Text style={styles.confirmBtnText}>Save</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.cancelBtn, { borderColor: colors.border }]}
        onPress={handleCancel}
        activeOpacity={0.7}
      >
        <Text style={[styles.cancelBtnText, { color: colors.placeholder }]}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.placeholder }]}>Calories Burned</Text>
      {editing ? editInput : displayValue}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calories: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  unit: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '400',
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sourceBadge: {
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  sourceText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  editLink: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  editInput: {
    width: 72,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
  },
  confirmBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  cancelBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/BurnedCaloriesCard.tsx
git commit -m "feat: BurnedCaloriesCard — shows burned kcal with source badge, inline edit for manual"
```

---

### Task 8: Settings screen — Amazfit section

**Files:**
- Replace: `app/(tabs)/settings.tsx`

- [ ] **Step 1: Write the settings screen**

```typescript
// app/(tabs)/settings.tsx
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/constants/Spacing';
import { useAmazfit } from '@/hooks/useAmazfit';
import type { AmazfitConnectionTier } from '@/types';

const TIER_LABEL: Record<AmazfitConnectionTier, string> = {
  zepp: 'Zepp (Amazfit)',
  healthconnect: 'Health Connect',
  applehealth: 'Apple Health',
  manual: 'Manual',
  none: 'Not connected',
};

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { connectionTier, syncing, lastSyncedAt, connectZepp, connectHealthKit, setManual, disconnect } = useAmazfit();
  const [connecting, setConnecting] = useState(false);

  const handleConnectZepp = useCallback(async () => {
    setConnecting(true);
    try {
      await connectZepp();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      Alert.alert('Connection Failed', message);
    } finally {
      setConnecting(false);
    }
  }, [connectZepp]);

  const handleConnectHealth = useCallback(async () => {
    setConnecting(true);
    try {
      await connectHealthKit();
    } finally {
      setConnecting(false);
    }
  }, [connectHealthKit]);

  const handleDisconnect = useCallback(() => {
    Alert.alert('Disconnect', 'Remove the current watch connection?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: disconnect },
    ]);
  }, [disconnect]);

  const lastSyncLabel = useMemo(() => {
    if (!lastSyncedAt) return 'Never';
    const d = new Date(lastSyncedAt);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [lastSyncedAt]);

  const isConnected = connectionTier !== 'none';

  const statusSection = (
    <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.statusRow}>
        <Text style={[styles.statusLabel, { color: colors.placeholder }]}>Status</Text>
        <View style={[styles.badge, { backgroundColor: isConnected ? colors.success : colors.border }]}>
          <Text style={[styles.badgeText, { color: isConnected ? '#FFFFFF' : colors.placeholder }]}>
            {isConnected ? 'Connected' : 'Not connected'}
          </Text>
        </View>
      </View>
      <Text style={[styles.tierName, { color: colors.text }]}>{TIER_LABEL[connectionTier]}</Text>
      {isConnected && (
        <Text style={[styles.syncTime, { color: colors.placeholder }]}>
          Last synced: {syncing ? 'syncing…' : lastSyncLabel}
          {syncing && <ActivityIndicator size="small" color={colors.tint} />}
        </Text>
      )}
    </View>
  );

  const connectSection = (
    <View style={styles.optionList}>
      <Text style={[styles.sectionTitle, { color: colors.placeholder }]}>Connection method</Text>

      {(['zepp', 'healthconnect', 'applehealth', 'manual'] as const).map((tier) => {
        const isActive = connectionTier === tier;
        return (
          <TouchableOpacity
            key={tier}
            style={[
              styles.optionCard,
              {
                backgroundColor: colors.card,
                borderColor: isActive ? colors.tint : colors.border,
              },
            ]}
            onPress={() => {
              if (tier === 'zepp') handleConnectZepp();
              else if (tier === 'healthconnect' || tier === 'applehealth') handleConnectHealth();
              else setManual();
            }}
            disabled={connecting || isActive}
            activeOpacity={0.7}
          >
            <View style={styles.optionInfo}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>{TIER_LABEL[tier]}</Text>
              <Text style={[styles.optionDesc, { color: colors.placeholder }]}>
                {tier === 'zepp' && 'OAuth via Zepp app — requires ZEPP_CLIENT_ID'}
                {tier === 'healthconnect' && 'Android Health Connect — requires dev build'}
                {tier === 'applehealth' && 'iOS Apple Health — requires dev build'}
                {tier === 'manual' && 'Enter calories burned manually on the home screen'}
              </Text>
            </View>
            {isActive && (
              <View style={[styles.activeDot, { backgroundColor: colors.tint }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + SPACING.md, paddingBottom: insets.bottom + SPACING.xl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.heading, { color: colors.text }]}>Settings</Text>

      <Text style={[styles.sectionHeading, { color: colors.placeholder }]}>
        Amazfit / Watch
      </Text>
      {statusSection}
      {connectSection}
      {isConnected && (
        <TouchableOpacity
          style={[styles.disconnectBtn, { borderColor: colors.danger }]}
          onPress={handleDisconnect}
          activeOpacity={0.8}
        >
          <Text style={[styles.disconnectBtnText, { color: colors.danger }]}>Disconnect</Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.sectionHeading, { color: colors.placeholder }]}>Profile</Text>
      <View style={[styles.comingSoon, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.comingSoonText, { color: colors.placeholder }]}>Coming in step 15 (polish)</Text>
      </View>

      <Text style={[styles.sectionHeading, { color: colors.placeholder }]}>Daily Targets</Text>
      <View style={[styles.comingSoon, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.comingSoonText, { color: colors.placeholder }]}>Coming in step 15 (polish)</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: SPACING.md, gap: SPACING.sm },
  heading: { fontSize: FONT_SIZE.xxl, fontWeight: '700', marginBottom: SPACING.sm },
  sectionHeading: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  statusCard: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.xs,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusLabel: { fontSize: FONT_SIZE.sm, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  badge: { borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 2 },
  badgeText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  tierName: { fontSize: FONT_SIZE.lg, fontWeight: '600' },
  syncTime: { fontSize: FONT_SIZE.sm },
  optionList: { gap: SPACING.sm },
  sectionTitle: { fontSize: FONT_SIZE.sm, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  optionCard: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionInfo: { flex: 1 },
  optionTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', marginBottom: 2 },
  optionDesc: { fontSize: FONT_SIZE.sm, lineHeight: FONT_SIZE.sm * 1.4 },
  activeDot: { width: 10, height: 10, borderRadius: 5, marginLeft: SPACING.sm },
  disconnectBtn: {
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  disconnectBtnText: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  comingSoon: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  comingSoonText: { fontSize: FONT_SIZE.sm },
});
```

- [ ] **Step 2: Commit**

```bash
git add "app/(tabs)/settings.tsx"
git commit -m "feat: settings screen — Amazfit section with tier selection and status"
```

---

### Task 9: Wire home screen

**Files:**
- Modify: `app/(tabs)/index.tsx`

Add `WatchNudgeCard`, `BurnedCaloriesCard`, wire pull-to-refresh to `sync()`.

- [ ] **Step 1: Update index.tsx**

Replace the full file contents:

```typescript
// app/(tabs)/index.tsx
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import { BurnedCaloriesCard } from '@/components/BurnedCaloriesCard';
import { FoodLogItem } from '@/components/FoodLogItem';
import { NetCaloriesCard } from '@/components/NetCaloriesCard';
import { WatchNudgeCard } from '@/components/WatchNudgeCard';
import { WaterTracker } from '@/components/WaterTracker';
import Colors from '@/constants/Colors';
import { FONT_SIZE, SPACING } from '@/constants/Spacing';
import { useAmazfit } from '@/hooks/useAmazfit';
import { useDailyLog } from '@/hooks/useDailyLog';
import { useDailyLogStore } from '@/store/dailyLogStore';
import { useUserStore } from '@/store/userStore';
import { getTodayDateString, formatDisplayDate, getTimeOfDayGreeting } from '@/utils/dateUtils';
import type { FoodLogItem as FoodLogItemType } from '@/types';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const profile = useUserStore((state) => state.profile);
  const { log, totals, addWater, removeFoodItem } = useDailyLog();
  const setCaloriesBurned = useDailyLogStore((s) => s.setCaloriesBurned);
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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await sync();
    setRefreshing(false);
  }, [sync]);

  const handleSaveBurned = useCallback(
    (calories: number) => {
      setCaloriesBurned(getTodayDateString(), calories, 'manual');
    },
    [setCaloriesBurned],
  );

  const renderItem = useCallback(
    ({ item }: { item: FoodLogItemType }) => (
      <FoodLogItem item={item} onDelete={removeFoodItem} />
    ),
    [removeFoodItem],
  );

  const showNudge = connectionTier === 'none' && !nudgeDismissed;

  const listHeader = useMemo(
    () => (
      <View>
        <View style={[styles.headerSection, { paddingTop: insets.top + SPACING.md }]}>
          <Text style={[styles.date, { color: colors.placeholder }]}>
            {formatDisplayDate(new Date())}
          </Text>
          <Text style={[styles.greeting, { color: colors.text }]}>{greeting}</Text>
        </View>
        <NetCaloriesCard
          eaten={totals.totalCalories}
          burned={log.caloriesBurned}
          remaining={totals.remainingCalories}
        />
        {showNudge && (
          <WatchNudgeCard
            onConnectZepp={connectZepp}
            onConnectHealth={connectHealthKit}
            onDismiss={dismissNudge}
          />
        )}
        <BurnedCaloriesCard
          caloriesBurned={log.caloriesBurned}
          connectionTier={connectionTier}
          onSave={handleSaveBurned}
        />
        <WaterTracker
          currentMl={log.waterMl}
          targetMl={profile?.dailyWaterTargetMl ?? 2000}
          onAdd={addWater}
        />
        <Text style={[styles.sectionHeader, { color: colors.placeholder }]}>Today's log</Text>
      </View>
    ),
    [
      insets.top, colors, greeting, totals, log, addWater,
      profile?.dailyWaterTargetMl, showNudge, connectionTier,
      connectZepp, connectHealthKit, dismissNudge, handleSaveBurned,
    ],
  );

  const emptyComponent = useMemo(
    () => (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: colors.placeholder }]}>
          No food logged yet. Tap + to add your first entry.
        </Text>
      </View>
    ),
    [colors.placeholder],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
            tintColor={colors.tint}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + SPACING.xl },
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { flexGrow: 1 },
  headerSection: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.lg },
  date: { fontSize: FONT_SIZE.sm, fontWeight: '500', marginBottom: SPACING.xs },
  greeting: { fontSize: FONT_SIZE.xxl, fontWeight: '700' },
  sectionHeader: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  empty: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl, alignItems: 'center' },
  emptyText: { fontSize: FONT_SIZE.md, textAlign: 'center', lineHeight: FONT_SIZE.md * 1.5 },
});
```

- [ ] **Step 2: Run full test suite**

```bash
npm test
```

Expected: all existing tests pass (≥ 65).

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Final commit**

```bash
git add "app/(tabs)/index.tsx" "app/(tabs)/settings.tsx" components/WatchNudgeCard.tsx components/BurnedCaloriesCard.tsx hooks/useAmazfit.ts services/zepp.ts services/zepp.test.ts services/healthKit.ts services/healthKit.test.ts store/amazfitStore.ts store/amazfitStore.test.ts types/index.ts app.config.ts package.json package-lock.json
git commit -m "[step 9] Amazfit integration — Zepp OAuth, Health stubs, manual entry, settings"
```
