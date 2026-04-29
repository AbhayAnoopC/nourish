import { View, Text, StyleSheet } from 'react-native';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { SPACING, BORDER_RADIUS } from '@/constants/Spacing';

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
      <Text style={[Type.monoLg, { color: valueColor }]}>
        {value}
        <Text style={[Type.monoSm, { color: labelColor }]}>{unit}</Text>
      </Text>
      <Text style={[Type.textSm, { color: labelColor }, styles.label]}>{label}</Text>
    </View>
  );
}

export function MacroBar({ proteinG, carbsG, fatG }: MacroBarProps) {
  const tokens = useTokens();

  return (
    <View
      style={[
        styles.container,
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
      <MacroCell
        label="Protein"
        value={proteinG}
        unit="g"
        valueColor={tokens.macro.protein}
        labelColor={tokens.text.secondary}
      />
      <View style={[styles.divider, { backgroundColor: tokens.border.hairline }]} />
      <MacroCell
        label="Carbs"
        value={carbsG}
        unit="g"
        valueColor={tokens.macro.carbs}
        labelColor={tokens.text.secondary}
      />
      <View style={[styles.divider, { backgroundColor: tokens.border.hairline }]} />
      <MacroCell
        label="Fat"
        value={fatG}
        unit="g"
        valueColor={tokens.macro.fat}
        labelColor={tokens.text.secondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.cardPad,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    marginTop: 2,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    marginHorizontal: SPACING.sm,
  },
});
