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
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/constants/Spacing';
import type { SavedMeal } from '@/types';

interface Props {
  meal: SavedMeal;
  onPress: (meal: SavedMeal) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export function SavedMealCard({ meal, onPress, onRename, onDelete }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
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
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => onPress(meal)}
        onLongPress={handleLongPress}
        activeOpacity={0.7}
      >
        <View style={styles.left}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {meal.name}
          </Text>
          <Text style={[styles.macros, { color: colors.placeholder }]}>{macroSummary}</Text>
        </View>
        <Text style={[styles.calories, { color: colors.tint }]}>
          {meal.totalCalories}
          <Text style={[styles.kcal, { color: colors.placeholder }]}> kcal</Text>
        </Text>
      </TouchableOpacity>

      {/* Cross-platform rename modal */}
      <Modal visible={renameVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Rename Meal</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              selectTextOnFocus
              maxLength={60}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: colors.border }]}
                onPress={() => setRenameVisible(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.placeholder }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary, { backgroundColor: colors.tint }]}
                onPress={handleRenameConfirm}
              >
                <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Save</Text>
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
    borderWidth: 1,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  left: {
    flex: 1,
    marginRight: SPACING.md,
  },
  name: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    marginBottom: 2,
  },
  macros: {
    fontSize: FONT_SIZE.sm,
  },
  calories: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  kcal: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '400',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  modalInput: {
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZE.md,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'flex-end',
  },
  modalBtn: {
    height: 40,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnPrimary: {
    borderWidth: 0,
  },
  modalBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
});
