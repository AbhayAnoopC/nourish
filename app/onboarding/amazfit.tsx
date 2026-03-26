import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface ConnectionCardProps {
  title: string;
  description: string;
  badge?: string;
  onPress: () => void;
  colors: typeof Colors.light;
}

function ConnectionCard({ title, description, badge, onPress, colors }: ConnectionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.cardContent}>
        {badge !== undefined && (
          <View style={[styles.badge, { backgroundColor: colors.tint + '22' }]}>
            <Text style={[styles.badgeText, { color: colors.tint }]}>{badge}</Text>
          </View>
        )}
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.cardDesc, { color: colors.placeholder }]}>{description}</Text>
      </View>
    </Pressable>
  );
}

export default function AmazfitScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const finishOnboarding = useUserStore((s) => s.finishOnboarding);

  function handleSkip() {
    finishOnboarding();
    router.replace('/(tabs)');
  }

  // Zepp OAuth and Health Connect require development build (step 9).
  // For now all options complete onboarding without native integration.
  function handleZepp() {
    finishOnboarding();
    router.replace('/(tabs)');
  }

  function handleHealthConnect() {
    finishOnboarding();
    router.replace('/(tabs)');
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <OnboardingHeader step={4} totalSteps={4} title="Connect Your Watch" />

      <View style={styles.body}>
        <Text style={[styles.subtitle, { color: colors.placeholder }]}>
          Sync burned calories from your Amazfit watch for a live net calorie balance.
        </Text>

        <ConnectionCard
          title="Connect with Zepp"
          description="Sign in with your Zepp / Huami account for automatic daily sync."
          badge="Recommended"
          onPress={handleZepp}
          colors={colors}
        />

        <ConnectionCard
          title="Use Health Connect / Apple Health"
          description="Read calories burned via your phone's health platform."
          onPress={handleHealthConnect}
          colors={colors}
        />

        <ConnectionCard
          title="Skip for now"
          description="You can connect your watch later in Settings."
          onPress={handleSkip}
          colors={colors}
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
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 14,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
});
