import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { BORDER_RADIUS, SPACING } from '@/constants/Spacing';

interface WeightLogModalProps {
  visible: boolean;
  unit: 'metric' | 'imperial';
  initialWeightKg?: number;
  onSave: (weightKg: number) => void;
  onDismiss: () => void;
}

export function WeightLogModal({
  visible,
  unit,
  initialWeightKg,
  onSave,
  onDismiss,
}: WeightLogModalProps) {
  const tokens = useTokens();
  const [text, setText] = useState('');

  useEffect(() => {
    if (visible) {
      const initial =
        initialWeightKg === undefined
          ? ''
          : unit === 'imperial'
          ? (initialWeightKg * 2.20462).toFixed(1)
          : initialWeightKg.toFixed(1);
      setText(initial);
    }
  }, [visible, initialWeightKg, unit]);

  const handleSave = () => {
    const parsed = parseFloat(text.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const kg = unit === 'imperial' ? parsed / 2.20462 : parsed;
    onSave(Math.round(kg * 10) / 10);
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        <View style={[styles.card, { backgroundColor: tokens.bg.surface }]}>
          <Text style={[Type.displayTitle, { color: tokens.text.primary }]}>Log weight</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: tokens.bg.surfaceMuted,
                  color: tokens.text.primary,
                  fontFamily: 'JetBrainsMono_500Medium',
                },
              ]}
              value={text}
              onChangeText={setText}
              keyboardType="decimal-pad"
              autoFocus
              placeholder={unit === 'imperial' ? 'lb' : 'kg'}
              placeholderTextColor={tokens.text.tertiary}
              maxLength={6}
            />
            <Text style={[Type.textLg, { color: tokens.text.secondary }]}>
              {unit === 'imperial' ? 'lb' : 'kg'}
            </Text>
          </View>
          <View style={styles.buttons}>
            <Pressable
              onPress={onDismiss}
              style={[styles.btn, { borderColor: tokens.border.hairline }]}
            >
              <Text style={[Type.textMd, { color: tokens.text.secondary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={[styles.btn, styles.btnPrimary, { backgroundColor: tokens.accent.primary }]}
            >
              <Text style={[Type.textMd, { color: '#FFFFFF' }]}>Save</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26,26,26,0.4)',
    padding: SPACING.xl,
  },
  card: {
    width: '100%',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  input: {
    flex: 1,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    fontSize: 24,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  btn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.button,
    borderWidth: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    borderWidth: 0,
  },
});
