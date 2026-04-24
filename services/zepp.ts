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
