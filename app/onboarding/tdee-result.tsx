import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { calculateTargets } from '@/utils/tdeeCalculator';
import { UserProfile } from '@/types';

interface MacroRowProps {
  label: string;
  grams: number;
  calories: number;
  color: string;
  textColor: string;
}

function MacroRow({ label, grams, calories, color, textColor }: MacroRowProps) {
  return (
    <View style={macroStyles.row}>
      <View style={[macroStyles.dot, { backgroundColor: color }]} />
      <Text style={[macroStyles.label, { color: textColor }]}>{label}</Text>
      <Text style={[macroStyles.value, { color: textColor }]}>{grams}g</Text>
      <Text style={[macroStyles.kcal, { color: textColor }]}>{calories} kcal</Text>
    </View>
  );
}

const macroStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  label: {
    flex: 1,
    fontSize: 15,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    width: 52,
    textAlign: 'right',
  },
  kcal: {
    fontSize: 13,
    width: 64,
    textAlign: 'right',
    opacity: 0.6,
  },
});

export default function TdeeResultScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
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
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <OnboardingHeader step={3} totalSteps={4} title="Your Target" />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.danger }]}>
            Profile data is missing. Please go back and complete all fields.
          </Text>
          <Pressable onPress={() => router.back()} style={[styles.button, { backgroundColor: colors.tint }]}>
            <Text style={styles.buttonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const { dailyCalorieTarget, dailyProteinTarget, dailyCarbTarget, dailyFatTarget } = targets;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <OnboardingHeader step={3} totalSteps={4} title="Your Target" />

      <View style={styles.body}>
        <View style={[styles.calorieCard, { backgroundColor: colors.tint }]}>
          <Text style={styles.calorieLabel}>Daily calorie target</Text>
          <Text style={styles.calorieNumber}>{dailyCalorieTarget}</Text>
          <Text style={styles.calorieUnit}>kcal / day</Text>
        </View>

        <View style={[styles.macroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.macroTitle, { color: colors.text }]}>Macro breakdown</Text>
          <MacroRow
            label="Protein"
            grams={dailyProteinTarget}
            calories={dailyProteinTarget * 4}
            color="#2D9CDB"
            textColor={colors.text}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MacroRow
            label="Carbohydrates"
            grams={dailyCarbTarget}
            calories={dailyCarbTarget * 4}
            color="#F2994A"
            textColor={colors.text}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MacroRow
            label="Fat"
            grams={dailyFatTarget}
            calories={dailyFatTarget * 9}
            color="#27AE60"
            textColor={colors.text}
          />
        </View>

        <Text style={[styles.footnote, { color: colors.placeholder }]}>
          These targets are calculated using the Mifflin-St Jeor equation. The app will adapt them over time as it learns your metabolism.
        </Text>

        <Pressable onPress={handleLooksGood} style={[styles.button, { backgroundColor: colors.tint }]}>
          <Text style={styles.buttonText}>Looks good!</Text>
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
    paddingBottom: 48,
  },
  body: {
    paddingHorizontal: 24,
  },
  calorieCard: {
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
  },
  calorieLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  calorieNumber: {
    color: '#fff',
    fontSize: 56,
    fontWeight: '800',
    lineHeight: 60,
  },
  calorieUnit: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  macroCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  macroTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  divider: {
    height: 1,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 24,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
