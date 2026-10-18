import Constants from 'expo-constants';

export const USDA_API_BASE = 'https://api.nal.usda.gov/fdc/v1';
export const OPEN_FOOD_FACTS_API_BASE = 'https://world.openfoodfacts.org/api/v0';
export const ZEPP_API_BASE = 'https://api-mifit.huami.com';

export function getAppApiBase(): string {
  if (__DEV__) {
    const hostUri = (Constants.expoConfig?.hostUri as string | undefined) ?? 'localhost:8081';
    return `http://${hostUri}`;
  }
  return process.env.EXPO_PUBLIC_APP_URL ?? '';
}
