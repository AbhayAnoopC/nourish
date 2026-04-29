import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { useUserStore } from '@/store/userStore';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { BORDER_RADIUS, SPACING } from '@/constants/Spacing';
import type { TokenSet } from '@/constants/Tokens';

interface ConnectionCardProps {
  title: string;
  description: string;
  badge?: string;
  onPress: () => void;
  tokens: TokenSet;
}

function ConnectionCard({ title, description, badge, onPress, tokens }: ConnectionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: tokens.bg.surface,
          shadowColor: '#1A1A1A',
          shadowOpacity: 0.04,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        },
      ]}
    >
      <View style={styles.cardContent}>
        {badge !== undefined && (
          <View style={[styles.badge, { backgroundColor: tokens.accent.muted }]}>
            <Text style={[Type.textXs, { color: tokens.accent.primary }]}>{badge}</Text>
          </View>
        )}
        <Text style={[Type.textLg, { color: tokens.text.primary }, styles.cardTitle]}>{title}</Text>
        <Text style={[Type.textSm, { color: tokens.text.secondary }]}>{description}</Text>
      </View>
    </Pressable>
  );
}

export default function AmazfitScreen() {
  const tokens = useTokens();
  const finishOnboarding = useUserStore((s) => s.finishOnboarding);

  function handleSkip() {
    finishOnboarding();
    router.replace('/(tabs)');
  }

  function handleZepp() {
    finishOnboarding();
    router.replace('/(tabs)');
  }

  function handleHealthConnect() {
    finishOnboarding();
    router.replace('/(tabs)');
  }

  return (
    <View style={[styles.screen, { backgroundColor: tokens.bg.primary }]}>
      <OnboardingHeader step={4} totalSteps={4} title="Connect Your Watch" />

      <View style={styles.body}>
        <Text style={[Type.textMd, { color: tokens.text.secondary }, styles.subtitle]}>
          Sync burned calories from your Amazfit watch for a live net calorie balance.
        </Text>

        <ConnectionCard
          title="Connect with Zepp"
          description="Sign in with your Zepp / Huami account for automatic daily sync."
          badge="Recommended"
          onPress={handleZepp}
          tokens={tokens}
        />

        <ConnectionCard
          title="Use Health Connect / Apple Health"
          description="Read calories burned via your phone's health platform."
          onPress={handleHealthConnect}
          tokens={tokens}
        />

        <ConnectionCard
          title="Skip for now"
          description="You can connect your watch later in Settings."
          onPress={handleSkip}
          tokens={tokens}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  body: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  subtitle: {
    marginBottom: SPACING.lg,
  },
  card: {
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  cardContent: {
    padding: SPACING.cardPad,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.xs,
  },
  cardTitle: {
    marginBottom: SPACING.xs,
  },
});
