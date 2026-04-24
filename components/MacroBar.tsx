import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/Spacing';

interface MacroBarProps {
  proteinG: number;
  carbsG: number;
  fatG: number;
}

interface MacroCellProps {
  label: string;
  value: number;
  unit: string;
  valueColor: string;
  labelColor: string;
}

function MacroCell({ label, value, unit, valueColor, labelColor }: MacroCellProps) {
  return (
    <View style={styles.cell}>
      <Text style={[styles.value, { color: valueColor }]}>
        {value}
        <Text style={[styles.unit, { color: labelColor }]}>{unit}</Text>
      </Text>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
    </View>
  );
}

export function MacroBar({ proteinG, carbsG, fatG }: MacroBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <MacroCell
        label="Protein"
        value={proteinG}
        unit="g"
        valueColor={colors.success}
        labelColor={colors.placeholder}
      />
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <MacroCell
        label="Carbs"
        value={carbsG}
        unit="g"
        valueColor={colors.tint}
        labelColor={colors.placeholder}
      />
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <MacroCell
        label="Fat"
        value={fatG}
        unit="g"
        valueColor={colors.warning}
        labelColor={colors.placeholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  unit: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '400',
  },
  label: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    marginHorizontal: SPACING.sm,
  },
});
