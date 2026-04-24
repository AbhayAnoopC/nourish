import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/constants/Spacing';
import type { EditablePhotoItem } from '@/types';

export type { EditablePhotoItem };

interface PhotoItemRowProps {
  item: EditablePhotoItem;
  index: number;
  onRemove: (index: number) => void;
  onQtyChange: (index: number, text: string) => void;
}

export default function PhotoItemRow({ item, index, onRemove, onQtyChange }: PhotoItemRowProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const qty = parseFloat(item.quantityText) || 1;
  const scaledCal = Math.round(item.calories * qty);
  const borderColor = item.uncertain ? colors.warning : colors.border;

  const uncertainBadge = item.uncertain ? (
    <Text style={[styles.uncertainBadge, { color: colors.warning }]}>⚠ Uncertain</Text>
  ) : null;

  return (
    <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor }]}>
      {uncertainBadge}
      <Text style={[styles.itemName, { color: colors.text }]}>{item.foodName}</Text>
      <Text style={[styles.itemServing, { color: colors.placeholder }]}>{item.servingSize}</Text>
      <View style={styles.row}>
        <View style={styles.qtyRow}>
          <Text style={[styles.qtyLabel, { color: colors.placeholder }]}>Qty</Text>
          <TextInput
            style={[styles.qtyInput, { color: colors.text, borderColor: colors.border }]}
            value={item.quantityText}
            onChangeText={(t) => onQtyChange(index, t)}
            keyboardType="decimal-pad"
            selectTextOnFocus
          />
        </View>
        <Text style={[styles.itemCal, { color: colors.text }]}>{scaledCal} kcal</Text>
        <TouchableOpacity onPress={() => onRemove(index)} activeOpacity={0.7}>
          <Text style={[styles.removeBtn, { color: colors.danger }]}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  itemCard: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  uncertainBadge: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  itemName: { fontSize: FONT_SIZE.lg, fontWeight: '600' },
  itemServing: { fontSize: FONT_SIZE.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  qtyLabel: { fontSize: FONT_SIZE.sm },
  qtyInput: {
    width: 56,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
  },
  itemCal: { flex: 1, fontSize: FONT_SIZE.md, fontWeight: '600', textAlign: 'right' },
  removeBtn: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
});
