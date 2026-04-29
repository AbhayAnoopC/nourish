import { useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { BORDER_RADIUS, SPACING } from '@/constants/Spacing';
import type { SavedMeal } from '@/types';

interface Props {
  meal: SavedMeal;
  onPress: (meal: SavedMeal) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export function SavedMealCard({ meal, onPress, onRename, onDelete }: Props) {
  const tokens = useTokens();
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameText, setRenameText] = useState('');

  const handleLongPress = () => {
    Alert.alert(meal.name, undefined, [
      {
        text: 'Rename',
        onPress: () => {
          setRenameText(meal.name);
          setRenameVisible(true);
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Delete Meal', `Delete "${meal.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => onDelete(meal.id) },
          ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRenameConfirm = () => {
    const trimmed = renameText.trim();
    if (trimmed) onRename(meal.id, trimmed);
    setRenameVisible(false);
  };

  const macroSummary = `P ${meal.totalProteinG}g · C ${meal.totalCarbsG}g · F ${meal.totalFatG}g`;

  return (
    <>
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: tokens.bg.surface,
            shadowColor: '#1A1A1A',
            shadowOpacity: 0.04,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          },
        ]}
        onPress={() => onPress(meal)}
        onLongPress={handleLongPress}
        activeOpacity={0.7}
      >
        <View style={styles.left}>
          <Text style={[Type.textLg, { color: tokens.text.primary }, styles.name]} numberOfLines={1}>
            {meal.name}
          </Text>
          <Text style={[Type.textSm, { color: tokens.text.secondary }]}>{macroSummary}</Text>
        </View>
        <View style={styles.right}>
          <Text style={[Type.monoLg, { color: tokens.accent.primary }]}>{meal.totalCalories}</Text>
          <Text style={[Type.monoSm, { color: tokens.text.tertiary }]}>kcal</Text>
        </View>
      </TouchableOpacity>

      {/* Cross-platform rename modal */}
      <Modal visible={renameVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: tokens.bg.surface }]}>
            <Text style={[Type.displayTitle, { color: tokens.text.primary }]}>Rename Meal</Text>
            <TextInput
              style={[
                Type.textMd,
                styles.modalInput,
                { color: tokens.text.primary, backgroundColor: tokens.bg.surfaceMuted },
              ]}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              selectTextOnFocus
              maxLength={60}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: tokens.border.hairline }]}
                onPress={() => setRenameVisible(false)}
              >
                <Text style={[Type.textMd, { color: tokens.text.secondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary, { backgroundColor: tokens.accent.primary }]}
                onPress={handleRenameConfirm}
              >
                <Text style={[Type.textMd, { color: '#FFFFFF' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.cardPad,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  left: {
    flex: 1,
    marginRight: SPACING.md,
  },
  name: {
    marginBottom: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,26,26,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  modalCard: {
    width: '100%',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  modalInput: {
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'flex-end',
  },
  modalBtn: {
    height: 40,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.button,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnPrimary: {
    borderWidth: 0,
  },
});
