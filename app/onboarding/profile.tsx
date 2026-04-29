import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { SelectOption } from '@/components/SelectOption';
import { HeightWeightInputs } from '@/components/HeightWeightInputs';
import { useUserStore } from '@/store/userStore';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { BORDER_RADIUS, SPACING } from '@/constants/Spacing';
import { lbsToKg, ftInToCm } from '@/utils/unitConverter';
import { UserProfile } from '@/types';

type Sex = UserProfile['sex'];

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other / Prefer not to say' },
];

export default function ProfileScreen() {
  const tokens = useTokens();
  const updateDraft = useUserStore((s) => s.updateDraft);

  const [name, setName] = useState('');
  const [sex, setSex] = useState<Sex | null>(null);
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [weightLbs, setWeightLbs] = useState('');

  const dobFilled = dobDay.length > 0 && dobMonth.length > 0 && dobYear.length === 4;
  const heightFilled = units === 'metric' ? heightCm.length > 0 : heightFeet.length > 0;
  const weightFilled = units === 'metric' ? weightKg.length > 0 : weightLbs.length > 0;
  const isValid = sex !== null && dobFilled && heightFilled && weightFilled;

  function handleNext() {
    if (!isValid || sex === null) return;

    const month = dobMonth.padStart(2, '0');
    const day = dobDay.padStart(2, '0');
    const dateOfBirth = `${dobYear}-${month}-${day}`;

    const finalHeightCm =
      units === 'metric' ? parseFloat(heightCm) : ftInToCm(parseInt(heightFeet, 10), parseInt(heightInches || '0', 10));
    const finalWeightKg =
      units === 'metric' ? parseFloat(weightKg) : lbsToKg(parseFloat(weightLbs));

    updateDraft({
      name: name.trim() || undefined,
      sex,
      dateOfBirth,
      heightCm: finalHeightCm,
      weightKg: finalWeightKg,
      units,
    });

    router.push('/onboarding/activity');
  }

  const inputStyle = [styles.input, { color: tokens.text.primary, backgroundColor: tokens.bg.surface }];

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: tokens.bg.primary }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <OnboardingHeader step={1} totalSteps={4} title="Your Profile" showBack={false} />

      <View style={styles.form}>
        <Text style={[Type.textXs, { color: tokens.text.secondary }, styles.label]}>NAME (OPTIONAL)</Text>
        <TextInput
          style={inputStyle}
          placeholder="e.g. Alex"
          placeholderTextColor={tokens.text.tertiary}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          returnKeyType="next"
        />

        <Text style={[Type.textXs, { color: tokens.text.secondary }, styles.label, styles.topSpacing]}>
          BIOLOGICAL SEX
        </Text>
        {SEX_OPTIONS.map((opt) => (
          <SelectOption
            key={opt.value}
            label={opt.label}
            selected={sex === opt.value}
            onPress={() => setSex(opt.value)}
          />
        ))}

        <Text style={[Type.textXs, { color: tokens.text.secondary }, styles.label, styles.topSpacing]}>
          DATE OF BIRTH
        </Text>
        <View style={styles.dobRow}>
          <TextInput
            style={[...inputStyle, styles.dobDay]}
            placeholder="DD"
            placeholderTextColor={tokens.text.tertiary}
            keyboardType="numeric"
            maxLength={2}
            value={dobDay}
            onChangeText={setDobDay}
          />
          <TextInput
            style={[...inputStyle, styles.dobMonth]}
            placeholder="MM"
            placeholderTextColor={tokens.text.tertiary}
            keyboardType="numeric"
            maxLength={2}
            value={dobMonth}
            onChangeText={setDobMonth}
          />
          <TextInput
            style={[...inputStyle, styles.dobYear]}
            placeholder="YYYY"
            placeholderTextColor={tokens.text.tertiary}
            keyboardType="numeric"
            maxLength={4}
            value={dobYear}
            onChangeText={setDobYear}
          />
        </View>

        <Text style={[Type.textXs, { color: tokens.text.secondary }, styles.label, styles.topSpacing]}>UNITS</Text>
        <View style={styles.unitsRow}>
          {(['metric', 'imperial'] as const).map((u) => (
            <Pressable
              key={u}
              onPress={() => setUnits(u)}
              style={[
                styles.unitChip,
                {
                  backgroundColor: units === u ? tokens.accent.primary : tokens.bg.surface,
                  borderColor: tokens.border.hairline,
                },
              ]}
            >
              <Text style={[Type.textMd, { color: units === u ? '#fff' : tokens.text.primary }]}>
                {u === 'metric' ? 'Metric (kg/cm)' : 'Imperial (lbs/ft)'}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.topSpacing}>
          <HeightWeightInputs
            units={units}
            heightCm={heightCm}
            weightKg={weightKg}
            heightFeet={heightFeet}
            heightInches={heightInches}
            weightLbs={weightLbs}
            onHeightCmChange={setHeightCm}
            onWeightKgChange={setWeightKg}
            onHeightFeetChange={setHeightFeet}
            onHeightInchesChange={setHeightInches}
            onWeightLbsChange={setWeightLbs}
          />
        </View>

        <Pressable
          onPress={handleNext}
          disabled={!isValid}
          style={[styles.button, { backgroundColor: isValid ? tokens.accent.primary : tokens.bg.surfaceMuted }]}
        >
          <Text style={[Type.textLg, { color: isValid ? '#fff' : tokens.text.tertiary }]}>Next</Text>
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
  form: {
    paddingHorizontal: SPACING.lg,
  },
  label: {
    marginBottom: SPACING.sm,
  },
  topSpacing: {
    marginTop: SPACING.lg,
  },
  input: {
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 16,
    marginBottom: SPACING.xs,
  },
  dobRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dobDay: {
    flex: 1,
  },
  dobMonth: {
    flex: 1,
  },
  dobYear: {
    flex: 1.6,
  },
  unitsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  unitChip: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.button,
    alignItems: 'center',
  },
  button: {
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.button,
    alignItems: 'center',
  },
});
