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
