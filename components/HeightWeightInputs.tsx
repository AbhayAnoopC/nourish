import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { BORDER_RADIUS, SPACING } from '@/constants/Spacing';

interface HeightWeightInputsProps {
  units: 'metric' | 'imperial';
  heightCm: string;
  weightKg: string;
  heightFeet: string;
  heightInches: string;
  weightLbs: string;
  onHeightCmChange: (v: string) => void;
  onWeightKgChange: (v: string) => void;
  onHeightFeetChange: (v: string) => void;
  onHeightInchesChange: (v: string) => void;
  onWeightLbsChange: (v: string) => void;
}

export function HeightWeightInputs({
  units,
  heightCm,
  weightKg,
  heightFeet,
  heightInches,
  weightLbs,
  onHeightCmChange,
  onWeightKgChange,
  onHeightFeetChange,
  onHeightInchesChange,
  onWeightLbsChange,
}: HeightWeightInputsProps) {
  const tokens = useTokens();

  const inputStyle = [styles.input, { color: tokens.text.primary, backgroundColor: tokens.bg.surface }];

  return (
    <View>
      <Text style={[Type.textXs, { color: tokens.text.secondary }, styles.fieldLabel]}>HEIGHT</Text>
      {units === 'metric' ? (
        <View style={styles.row}>
          <TextInput
            style={[...inputStyle, styles.flex]}
            placeholder="cm"
            placeholderTextColor={tokens.text.tertiary}
            keyboardType="numeric"
            value={heightCm}
            onChangeText={onHeightCmChange}
            maxLength={3}
          />
        </View>
      ) : (
        <View style={styles.row}>
          <TextInput
            style={[...inputStyle, styles.flex]}
            placeholder="ft"
            placeholderTextColor={tokens.text.tertiary}
            keyboardType="numeric"
            value={heightFeet}
            onChangeText={onHeightFeetChange}
            maxLength={1}
          />
          <View style={styles.gap} />
          <TextInput
            style={[...inputStyle, styles.flex]}
            placeholder="in"
            placeholderTextColor={tokens.text.tertiary}
            keyboardType="numeric"
            value={heightInches}
            onChangeText={onHeightInchesChange}
            maxLength={2}
          />
        </View>
      )}

      <Text style={[Type.textXs, { color: tokens.text.secondary }, styles.fieldLabel, styles.topSpacing]}>
        WEIGHT
      </Text>
      <View style={styles.row}>
        <TextInput
          style={[...inputStyle, styles.flex]}
          placeholder={units === 'metric' ? 'kg' : 'lbs'}
          placeholderTextColor={tokens.text.tertiary}
          keyboardType="numeric"
          value={units === 'metric' ? weightKg : weightLbs}
          onChangeText={units === 'metric' ? onWeightKgChange : onWeightLbsChange}
          maxLength={5}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex: {
    flex: 1,
  },
  gap: {
    width: SPACING.sm,
  },
  fieldLabel: {
    marginBottom: 6,
  },
  topSpacing: {
    marginTop: SPACING.md,
  },
  input: {
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 16,
    fontFamily: 'JetBrainsMono_400Regular',
  },
});
