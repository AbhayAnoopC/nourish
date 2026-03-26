import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { SelectOption } from '@/components/SelectOption';
import { HeightWeightInputs } from '@/components/HeightWeightInputs';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { lbsToKg, ftInToCm } from '@/utils/unitConverter';
import { UserProfile } from '@/types';

type Sex = UserProfile['sex'];

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other / Prefer not to say' },
];

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
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

  const inputStyle = [styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }];

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <OnboardingHeader step={1} totalSteps={4} title="Your Profile" showBack={false} />

      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.placeholder }]}>Name (optional)</Text>
        <TextInput
          style={inputStyle}
          placeholder="e.g. Alex"
          placeholderTextColor={colors.placeholder}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          returnKeyType="next"
        />

        <Text style={[styles.label, styles.topSpacing, { color: colors.placeholder }]}>
          Biological sex
        </Text>
        {SEX_OPTIONS.map((opt) => (
          <SelectOption
            key={opt.value}
            label={opt.label}
            selected={sex === opt.value}
            onPress={() => setSex(opt.value)}
          />
        ))}

        <Text style={[styles.label, styles.topSpacing, { color: colors.placeholder }]}>
          Date of birth
        </Text>
        <View style={styles.dobRow}>
          <TextInput
            style={[inputStyle, styles.dobDay]}
            placeholder="DD"
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
            maxLength={2}
            value={dobDay}
            onChangeText={setDobDay}
          />
          <TextInput
            style={[inputStyle, styles.dobMonth]}
            placeholder="MM"
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
            maxLength={2}
            value={dobMonth}
            onChangeText={setDobMonth}
          />
          <TextInput
            style={[inputStyle, styles.dobYear]}
            placeholder="YYYY"
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
            maxLength={4}
            value={dobYear}
            onChangeText={setDobYear}
          />
        </View>

        <Text style={[styles.label, styles.topSpacing, { color: colors.placeholder }]}>Units</Text>
        <View style={styles.unitsRow}>
          {(['metric', 'imperial'] as const).map((u) => (
            <Pressable
              key={u}
              onPress={() => setUnits(u)}
              style={[
                styles.unitChip,
                {
                  backgroundColor: units === u ? colors.tint : colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.unitChipText, { color: units === u ? '#fff' : colors.text }]}>
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
          style={[styles.button, { backgroundColor: isValid ? colors.tint : colors.border }]}
        >
          <Text style={styles.buttonText}>Next</Text>
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
  form: {
    paddingHorizontal: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  topSpacing: {
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 4,
  },
  dobRow: {
    flexDirection: 'row',
    gap: 8,
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
    gap: 10,
  },
  unitChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  unitChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    marginTop: 32,
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
