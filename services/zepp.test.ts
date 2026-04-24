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
