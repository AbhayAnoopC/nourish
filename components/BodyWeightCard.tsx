import { useState } from 'react';
import {
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/constants/Spacing';
import { kgToLbs, lbsToKg } from '@/utils/unitConverter';

interface BodyWeightCardProps {
  weightKg: number | undefined;
  units: 'metric' | 'imperial';
  onSave: (weightKg: number) => void;
}

export function BodyWeightCard({ weightKg, units, onSave }: BodyWeightCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [modalVisible, setModalVisible] = useState(false);
  const [inputText, setInputText] = useState('');

  const displayWeight =
    weightKg !== undefined
      ? units === 'imperial'
        ? `${kgToLbs(weightKg)} lbs`
        : `${weightKg} kg`
      : undefined;

  const unitLabel = units === 'imperial' ? 'lbs' : 'kg';
  const placeholder = units === 'imperial' ? 'e.g. 165.0' : 'e.g. 75.0';

  const handleOpen = () => {
    if (weightKg !== undefined) {
      const initialValue =
        units === 'imperial' ? String(kgToLbs(weightKg)) : String(weightKg);
      setInputText(initialValue);
    } else {
      setInputText('');
    }
    setModalVisible(true);
  };

  const handleCancel = () => {
    setInputText('');
    setModalVisible(false);
  };

  const handleConfirm = () => {
    const parsed = parseFloat(inputText);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const valueKg = units === 'imperial' ? lbsToKg(parsed) : parsed;
    onSave(valueKg);
    setInputText('');
    setModalVisible(false);
  };

  const weightDisplay = displayWeight !== undefined ? (
    <Text style={[styles.weight, { color: colors.text }]}>{displayWeight}</Text>
  ) : (
    <Text style={[styles.prompt, { color: colors.tint }]}>Log today's weight</Text>
  );

  const modalContent = (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
    >
      <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.modalTitle, { color: colors.text }]}>Log Body Weight</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
            ]}
            value={inputText}
            onChangeText={setInputText}
            keyboardType="decimal-pad"
            placeholder={placeholder}
            placeholderTextColor={colors.placeholder}
            autoFocus
            maxLength={7}
            onSubmitEditing={handleConfirm}
            returnKeyType="done"
          />
          <Text style={[styles.unitLabel, { color: colors.placeholder }]}>{unitLabel}</Text>
        </View>
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: colors.border }]}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelBtnText, { color: colors.placeholder }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: colors.tint }]}
            onPress={handleConfirm}
            activeOpacity={0.7}
          >
            <Text style={styles.confirmBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={handleOpen}
        activeOpacity={0.7}
      >
        <Text style={[styles.title, { color: colors.placeholder }]}>Body Weight</Text>
        {weightDisplay}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <Pressable style={styles.backdrop} onPress={handleCancel}>
          <Pressable onPress={() => undefined}>
            {modalContent}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  weight: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  prompt: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  keyboardAvoid: {
    width: '100%',
  },
  modalCard: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZE.lg,
    textAlign: 'center',
  },
  unitLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    minWidth: 28,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
});
