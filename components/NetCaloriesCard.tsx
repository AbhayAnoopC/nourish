import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/Spacing';

interface NetCaloriesCardProps {
  eaten: number;
  burned: number;
  remaining: number;
}

interface CalorieColumnProps {
  label: string;
  value: number;
  valueColor: string;
  labelColor: string;
}

function CalorieColumn({ label, value, valueColor, labelColor }: CalorieColumnProps) {
  return (
    <View style={styles.column}>
      <Text style={[styles.value, { color: valueColor }]}>{Math.round(Math.abs(value))}</Text>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
    </View>
  );
}

export function NetCaloriesCard({ eaten, burned, remaining }: NetCaloriesCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const remainingColor = remaining >= 0 ? colors.success : colors.danger;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.placeholder }]}>Net Calories</Text>
      <View style={styles.row}>
        <CalorieColumn
          label="Eaten"
          value={eaten}
          valueColor={colors.text}
          labelColor={colors.placeholder}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <CalorieColumn
          label="Burned"
          value={burned}
          valueColor={colors.success}
          labelColor={colors.placeholder}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <CalorieColumn
          label="Remaining"
          value={remaining}
          valueColor={remainingColor}
          labelColor={colors.placeholder}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: '700',
    lineHeight: FONT_SIZE.xxxl * 1.2,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.xs,
  },
  divider: {
    width: 1,
    height: 48,
  },
});
