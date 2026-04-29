import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { useUserStore } from '@/store/userStore';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { BORDER_RADIUS, SPACING } from '@/constants/Spacing';
import { calculateTargets } from '@/utils/tdeeCalculator';
import { UserProfile } from '@/types';

interface MacroRowProps {
  label: string;
  grams: number;
  calories: number;
  color: string;
  textColor: string;
  secondaryColor: string;
}

function MacroRow({ label, grams, calories, color, textColor, secondaryColor }: MacroRowProps) {
  return (
    <View style={macroStyles.row}>
      <View style={[macroStyles.dot, { backgroundColor: color }]} />
      <Text style={[Type.textMd, { color: textColor }, macroStyles.label]}>{label}</Text>
      <Text style={[Type.monoMd, { color: textColor }, macroStyles.value]}>{grams}g</Text>
      <Text style={[Type.monoSm, { color: secondaryColor }, macroStyles.kcal]}>{calories} kcal</Text>
    </View>
  );
}

const macroStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.sm,
  },
  label: {
    flex: 1,
  },
  value: {
    width: 52,
    textAlign: 'right',
  },
  kcal: {
    width: 64,
    textAlign: 'right',
  },
});

export default function TdeeResultScreen() {
  const tokens = useTokens();
  const { draft, updateDraft } = useUserStore();

  const targets = useMemo(() => {
    const required: (keyof UserProfile)[] = ['sex', 'weightKg', 'heightCm', 'dateOfBirth', 'activityLevel', 'goal'];
    const hasAll = required.every((k) => draft[k] !== undefined);
    if (!hasAll) return null;

    return calculateTargets({
      sex: draft.sex!,
      weightKg: draft.weightKg!,
      heightCm: draft.heightCm!,
      dateOfBirth: draft.dateOfBirth!,
      activityLevel: draft.activityLevel!,
      goal: draft.goal!,
    });
  }, [draft]);

  function handleLooksGood() {
    if (!targets) return;
    updateDraft(targets);
    router.push('/onboarding/amazfit');
  }

  if (!targets) {
    return (
      <View style={[styles.screen, { backgroundColor: tokens.bg.primary }]}>
        <OnboardingHeader step={3} totalSteps={4} title="Your Target" />
        <View style={styles.errorContainer}>
          <Text style={[Type.textMd, { color: tokens.status.danger }, styles.errorText]}>
            Profile data is missing. Please go back and complete all fields.
          </Text>
          <Pressable onPress={() => router.back()} style={[styles.button, { backgroundColor: tokens.accent.primary }]}>
            <Text style={[Type.textLg, styles.buttonText]}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const { dailyCalorieTarget, dailyProteinTarget, dailyCarbTarget, dailyFatTarget } = targets;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: tokens.bg.primary }]}
      contentContainerStyle={styles.content}
    >
      <OnboardingHeader step={3} totalSteps={4} title="Your Target" />

      <View style={styles.body}>
        <View style={[styles.calorieCard, { backgroundColor: tokens.accent.primary }]}>
          <Text style={[Type.textSm, styles.calorieLabel]}>Daily calorie target</Text>
          <Text style={[Type.displayHero, styles.calorieNumber]}>{dailyCalorieTarget}</Text>
          <Text style={[Type.textSm, styles.calorieUnit]}>kcal / day</Text>
        </View>

        <View
          style={[
            styles.macroCard,
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
          <Text style={[Type.textXl, { color: tokens.text.primary }, styles.macroTitle]}>
            Macro breakdown
          </Text>
          <MacroRow
            label="Protein"
            grams={dailyProteinTarget}
            calories={dailyProteinTarget * 4}
            color={tokens.macro.protein}
            textColor={tokens.text.primary}
            secondaryColor={tokens.text.secondary}
          />
          <View style={[styles.divider, { backgroundColor: tokens.border.hairline }]} />
          <MacroRow
            label="Carbohydrates"
            grams={dailyCarbTarget}
            calories={dailyCarbTarget * 4}
            color={tokens.macro.carbs}
            textColor={tokens.text.primary}
            secondaryColor={tokens.text.secondary}
          />
          <View style={[styles.divider, { backgroundColor: tokens.border.hairline }]} />
          <MacroRow
            label="Fat"
            grams={dailyFatTarget}
            calories={dailyFatTarget * 9}
            color={tokens.macro.fat}
            textColor={tokens.text.primary}
            secondaryColor={tokens.text.secondary}
          />
        </View>

        <Text style={[Type.textSm, { color: tokens.text.secondary }, styles.footnote]}>
          These targets are calculated using the Mifflin-St Jeor equation. The app will adapt them over time as it learns your metabolism.
        </Text>

        <Pressable onPress={handleLooksGood} style={[styles.button, { backgroundColor: tokens.accent.primary }]}>
          <Text style={[Type.textLg, styles.buttonText]}>Looks good!</Text>
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
  body: {
    paddingHorizontal: SPACING.lg,
  },
  calorieCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  calorieLabel: {
    color: 'rgba(255,255,255,0.85)',
    marginBottom: SPACING.xs,
  },
  calorieNumber: {
    color: '#FFFFFF',
  },
  calorieUnit: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: SPACING.xs,
  },
  macroCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.cardPad,
    marginBottom: SPACING.lg,
  },
  macroTitle: {
    marginBottom: SPACING.sm,
  },
  divider: {
    height: 1,
  },
  footnote: {
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  button: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.button,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
  },
});
