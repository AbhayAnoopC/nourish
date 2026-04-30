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

interface SaveCustomServingModalProps {
  visible: boolean;
  forFoodName: string;
  initialLabel?: string;
  initialGrams?: number;
  onSave: (label: string, grams: number) => void;
  onDismiss: () => void;
}

export function SaveCustomServingModal({
  visible,
  forFoodName,
  initialLabel,
  initialGrams,
  onSave,
  onDismiss,
}: SaveCustomServingModalProps) {
  const tokens = useTokens();
  const [label, setLabel] = useState('');
  const [gramsText, setGramsText] = useState('');

  useEffect(() => {
    if (visible) {
      setLabel(initialLabel ?? '');
      setGramsText(initialGrams !== undefined ? String(initialGrams) : '');
    }
  }, [visible, initialLabel, initialGrams]);

  const trimmedLabel = label.trim();
  const parsedGrams = parseFloat(gramsText.replace(',', '.'));
  const isValid = trimmedLabel.length > 0 && Number.isFinite(parsedGrams) && parsedGrams > 0;

  const handleSave = () => {
    if (!isValid) return;
    onSave(trimmedLabel, Math.round(parsedGrams * 10) / 10);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        <View style={[styles.card, { backgroundColor: tokens.bg.surface }]}>
          <Text style={[Type.displayTitle, { color: tokens.text.primary }]}>Save serving</Text>
          <Text style={[Type.textSm, { color: tokens.text.secondary }]}>
            for "{forFoodName}"
          </Text>

          <Text style={[Type.textXs, { color: tokens.text.secondary }, styles.label]}>LABEL</Text>
          <TextInput
            style={[Type.textMd, styles.input, { color: tokens.text.primary, backgroundColor: tokens.bg.surfaceMuted }]}
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. 1 large breast"
            placeholderTextColor={tokens.text.tertiary}
            autoFocus
            maxLength={40}
          />

          <Text style={[Type.textXs, { color: tokens.text.secondary }, styles.label]}>GRAMS</Text>
          <TextInput
            style={[
              Type.textMd,
              styles.input,
              { color: tokens.text.primary, backgroundColor: tokens.bg.surfaceMuted, fontFamily: 'JetBrainsMono_500Medium' },
            ]}
            value={gramsText}
            onChangeText={setGramsText}
            placeholder="e.g. 220"
            placeholderTextColor={tokens.text.tertiary}
            keyboardType="decimal-pad"
            maxLength={6}
          />

          <Text style={[Type.textSm, { color: tokens.text.secondary }, styles.hint]}>
            This will appear as a quick pick whenever you log a food whose name contains "{forFoodName.split(/[\s,]+/).filter((t) => t.length >= 2).join(' ')}".
          </Text>

          <View style={styles.buttons}>
            <Pressable onPress={onDismiss} style={[styles.btn, { borderColor: tokens.border.hairline }]}>
              <Text style={[Type.textMd, { color: tokens.text.secondary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!isValid}
              style={[
                styles.btn,
                styles.btnPrimary,
                { backgroundColor: isValid ? tokens.accent.primary : tokens.bg.surfaceMuted },
              ]}
            >
              <Text style={[Type.textMd, { color: isValid ? '#FFFFFF' : tokens.text.tertiary }]}>Save</Text>
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
    gap: SPACING.sm,
  },
  label: {
    marginTop: SPACING.sm,
  },
  input: {
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
  },
  hint: {
    marginTop: SPACING.sm,
    lineHeight: 18,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.md,
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
