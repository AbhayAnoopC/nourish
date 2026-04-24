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
import type { AmazfitConnectionTier } from '@/types';

const SOURCE_LABEL: Record<AmazfitConnectionTier, string> = {
  zepp: 'Zepp',
  healthconnect: 'Health Connect',
  applehealth: 'Apple Health',
  manual: 'Manual',
  none: 'Manual',
};

interface Props {
  caloriesBurned: number;
  connectionTier: AmazfitConnectionTier;
  onSave: (calories: number) => void;
}

export function BurnedCaloriesCard({ caloriesBurned, connectionTier, onSave }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [editing, setEditing] = useState(false);
  const [inputText, setInputText] = useState('');

  const isManual = connectionTier === 'manual' || connectionTier === 'none';

  const handleStartEdit = () => {
    setInputText(caloriesBurned > 0 ? String(caloriesBurned) : '');
    setEditing(true);
  };

  const handleConfirm = () => {
    const val = parseInt(inputText, 10);
    if (Number.isFinite(val) && val >= 0) onSave(val);
    setEditing(false);
  };

  const handleCancel = () => setEditing(false);

  const sourceLabel = SOURCE_LABEL[connectionTier];

  const displayValue = (
    <View style={styles.valueRow}>
      <Text style={[styles.calories, { color: colors.text }]}>
        {caloriesBurned}
        <Text style={[styles.unit, { color: colors.placeholder }]}> kcal burned</Text>
      </Text>
      <View style={styles.rightRow}>
        <View style={[styles.sourceBadge, { backgroundColor: colors.border }]}>
          <Text style={[styles.sourceText, { color: colors.placeholder }]}>{sourceLabel}</Text>
        </View>
        {isManual && (
          <TouchableOpacity onPress={handleStartEdit} activeOpacity={0.7}>
            <Text style={[styles.editLink, { color: colors.tint }]}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const editInput = (
    <View style={styles.editRow}>
      <TextInput
        style={[
          styles.editInput,
          { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
        ]}
        value={inputText}
        onChangeText={setInputText}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor={colors.placeholder}
        autoFocus
        maxLength={5}
        onSubmitEditing={handleConfirm}
      />
      <Text style={[styles.unit, { color: colors.placeholder }]}>kcal</Text>
      <TouchableOpacity
        style={[styles.confirmBtn, { backgroundColor: colors.tint }]}
        onPress={handleConfirm}
        activeOpacity={0.7}
      >
        <Text style={styles.confirmBtnText}>Save</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.cancelBtn, { borderColor: colors.border }]}
        onPress={handleCancel}
        activeOpacity={0.7}
      >
        <Text style={[styles.cancelBtnText, { color: colors.placeholder }]}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.placeholder }]}>Calories Burned</Text>
      {editing ? editInput : displayValue}
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
    gap: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calories: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  unit: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '400',
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sourceBadge: {
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  sourceText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  editLink: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  editInput: {
    width: 72,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
  },
  confirmBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  cancelBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
});
