import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/Spacing';

interface WaterTrackerProps {
  currentMl: number;
  targetMl: number;
  onAdd: (ml: number) => void;
}

export function WaterTracker({ currentMl, targetMl, onAdd }: WaterTrackerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const progress = Math.min(currentMl / targetMl, 1);
  const progressPercent = `${Math.round(progress * 100)}%` as `${number}%`;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.placeholder }]}>Water</Text>
        <Text style={[styles.amount, { color: colors.text }]}>
          {currentMl} / {targetMl} ml
        </Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View
          style={[styles.progressFill, { width: progressPercent, backgroundColor: colors.tint }]}
        />
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={() => onAdd(250)}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>+250 ml</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={() => onAdd(500)}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>+500 ml</Text>
        </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  amount: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  progressTrack: {
    height: 8,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  buttons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
});
