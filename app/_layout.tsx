import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useColorScheme } from '@/components/useColorScheme';
import { useUserStore } from '@/store/userStore';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const onboardingComplete = useUserStore((s) => s.profile?.onboardingComplete ?? false);

  useEffect(() => {
    if (!onboardingComplete) {
      router.replace('/onboarding/welcome');
    }
  }, [onboardingComplete]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="food-search" options={{ headerShown: true }} />
        <Stack.Screen name="confirm-food" options={{ headerShown: true }} />
        <Stack.Screen name="barcode-scan" options={{ headerShown: true }} />
        <Stack.Screen name="confirm-meal" options={{ headerShown: true }} />
      </Stack>
    </ThemeProvider>
  );
}
