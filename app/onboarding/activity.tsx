import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { SelectOption } from '@/components/SelectOption';
import { useUserStore } from '@/store/userStore';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { BORDER_RADIUS, SPACING } from '@/constants/Spacing';
import { ActivityLevel, Goal } from '@/types';

interface ActivityOption {
  value: ActivityLevel;
  label: string;
  description: string;
}

interface GoalOption {
  value: Goal;
  label: string;
  description: string;
}

const ACTIVITY_OPTIONS: ActivityOption[] = [
  { value: 'sedentary', label: 'Sedentary', description: 'Desk job, little or no exercise' },
  { value: 'light', label: 'Lightly Active', description: 'Light exercise 1–3 days/week' },
  { value: 'moderate', label: 'Moderately Active', description: 'Moderate exercise 3–5 days/week' },
  { value: 'very', label: 'Very Active', description: 'Hard exercise 6–7 days/week' },
  { value: 'extreme', label: 'Extremely Active', description: 'Very hard exercise + physical job' },
];

const GOAL_OPTIONS: GoalOption[] = [
  { value: 'lose', label: 'Lose Weight', description: '−500 kcal/day deficit' },
  { value: 'maintain', label: 'Maintain Weight', description: 'Eat at your TDEE' },
  { value: 'gain', label: 'Gain Muscle', description: '+250 kcal/day surplus' },
];

export default function ActivityScreen() {
  const tokens = useTokens();
  const updateDraft = useUserStore((s) => s.updateDraft);

  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);

  const isValid = activityLevel !== null && goal !== null;

  function handleCalculate() {
    if (!isValid || activityLevel === null || goal === null) return;
    updateDraft({ activityLevel, goal });
    router.push('/onboarding/tdee-result');
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: tokens.bg.primary }]}
      contentContainerStyle={styles.content}
    >
      <OnboardingHeader step={2} totalSteps={4} title="Activity & Goal" />

      <View style={styles.section}>
        <Text style={[Type.textXl, { color: tokens.text.primary }, styles.sectionTitle]}>Activity Level</Text>
        {ACTIVITY_OPTIONS.map((opt) => (
          <SelectOption
            key={opt.value}
            label={opt.label}
            description={opt.description}
            selected={activityLevel === opt.value}
            onPress={() => setActivityLevel(opt.value)}
          />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[Type.textXl, { color: tokens.text.primary }, styles.sectionTitle]}>Your Goal</Text>
        {GOAL_OPTIONS.map((opt) => (
          <SelectOption
            key={opt.value}
            label={opt.label}
            description={opt.description}
            selected={goal === opt.value}
            onPress={() => setGoal(opt.value)}
          />
        ))}
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          onPress={handleCalculate}
          disabled={!isValid}
          style={[styles.button, { backgroundColor: isValid ? tokens.accent.primary : tokens.bg.surfaceMuted }]}
        >
          <Text style={[Type.textLg, { color: isValid ? '#FFFFFF' : tokens.text.tertiary }]}>
            Calculate my target
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingBottom: SPACING.xxl,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  buttonRow: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  button: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.button,
    alignItems: 'center',
  },
});
