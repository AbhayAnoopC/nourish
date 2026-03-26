import { View, Text, TextInput, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const inputStyle = [styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }];
  const labelStyle = [styles.fieldLabel, { color: colors.placeholder }];

  return (
    <View>
      <Text style={labelStyle}>Height</Text>
      {units === 'metric' ? (
        <View style={styles.row}>
          <TextInput
            style={[inputStyle, styles.flex]}
            placeholder="cm"
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
            value={heightCm}
            onChangeText={onHeightCmChange}
            maxLength={3}
          />
        </View>
      ) : (
        <View style={styles.row}>
          <TextInput
            style={[inputStyle, styles.flex]}
            placeholder="ft"
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
            value={heightFeet}
            onChangeText={onHeightFeetChange}
            maxLength={1}
          />
          <View style={styles.gap} />
          <TextInput
            style={[inputStyle, styles.flex]}
            placeholder="in"
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
            value={heightInches}
            onChangeText={onHeightInchesChange}
            maxLength={2}
          />
        </View>
      )}

      <Text style={[labelStyle, styles.topSpacing]}>Weight</Text>
      <View style={styles.row}>
        <TextInput
          style={[inputStyle, styles.flex]}
          placeholder={units === 'metric' ? 'kg' : 'lbs'}
          placeholderTextColor={colors.placeholder}
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
    width: 10,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topSpacing: {
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
});
