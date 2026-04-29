import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { BORDER_RADIUS, SPACING } from '@/constants/Spacing';

export default function WelcomeScreen() {
  const tokens = useTokens();

  function handleGetStarted() {
    router.push('/onboarding/profile');
  }

  return (
    <View style={[styles.container, { backgroundColor: tokens.bg.primary }]}>
      <Text style={[styles.appName, { color: tokens.accent.primary }]}>Nourish</Text>
      <Text style={[Type.textLg, { color: tokens.text.secondary }, styles.tagline]}>
        Track calories without a food scale.
      </Text>
      <Pressable
        style={[styles.button, { backgroundColor: tokens.accent.primary }]}
        onPress={handleGetStarted}
      >
        <Text style={[Type.textLg, styles.buttonText]}>Get Started</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  appName: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 56,
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  tagline: {
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.button,
  },
  buttonText: {
    color: '#FFFFFF',
  },
});
