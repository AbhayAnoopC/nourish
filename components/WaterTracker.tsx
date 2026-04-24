import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/constants/Spacing';

interface WaterTrackerProps {
  currentMl: number;
  targetMl: number;
  onAdd: (ml: number) => void;
}

export function WaterTracker({ currentMl, targetMl, onAdd }: WaterTrackerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState('');

  const progress = Math.min(currentMl / targetMl, 1);
  const progressPercent = `${Math.round(progress * 100)}%` as `${number}%`;

  const handleConfirmCustom = () => {
    const ml = parseInt(customText, 10);
    if (Number.isFinite(ml) && ml > 0) {
      onAdd(ml);
    }
    setCustomText('');
    setShowCustom(false);
  };

  const handleCancelCustom = () => {
    setCustomText('');
    setShowCustom(false);
  };

  const quickButtons = (
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
      <TouchableOpacity
        style={[styles.button, styles.customButton, { borderColor: colors.tint }]}
        onPress={() => setShowCustom(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.customButtonText, { color: colors.tint }]}>Custom</Text>
      </TouchableOpacity>
    </View>
  );

  const customInput = (
    <View style={styles.customRow}>
      <TextInput
        style={[
          styles.customInput,
          { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
        ]}
        value={customText}
        onChangeText={setCustomText}
        keyboardType="number-pad"
        placeholder="ml"
        placeholderTextColor={colors.placeholder}
        autoFocus
        maxLength={5}
        onSubmitEditing={handleConfirmCustom}
      />
      <TouchableOpacity
        style={[styles.confirmButton, { backgroundColor: colors.tint }]}
        onPress={handleConfirmCustom}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>Add</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.cancelButton, { borderColor: colors.border }]}
        onPress={handleCancelCustom}
        activeOpacity={0.7}
      >
        <Text style={[styles.cancelButtonText, { color: colors.placeholder }]}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

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
      {showCustom ? customInput : quickButtons}
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
  customButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  customButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  customRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  customInput: {
    flex: 1,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
  },
  confirmButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  cancelButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
});
