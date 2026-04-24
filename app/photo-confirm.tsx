import { useCallback, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/constants/Spacing';
import { useLogFlowStore } from '@/store/logFlowStore';
import { useDailyLogStore } from '@/store/dailyLogStore';
import { getTodayDateString } from '@/utils/dateUtils';
import type { PhotoScanItem, FoodLogItem } from '@/types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface EditableItem extends PhotoScanItem {
  quantityText: string;
}

export default function PhotoConfirmScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const rawItems = useLogFlowStore((s) => s.pendingPhotoItems);
  const clearPendingPhotoItems = useLogFlowStore((s) => s.clearPendingPhotoItems);
  const addFoodItem = useDailyLogStore((s) => s.addFoodItem);

  const [items, setItems] = useState<EditableItem[]>(
    () => (rawItems ?? []).map((i) => ({ ...i, quantityText: '1' })),
  );

  const handleRemove = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleQtyChange = useCallback((index: number, text: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantityText: text } : item)),
    );
  }, []);

  const handleAddAll = useCallback(() => {
    const today = getTodayDateString();
    items.forEach((item) => {
      const qty = parseFloat(item.quantityText) || 1;
      const logItem: FoodLogItem = {
        id: generateId(),
        date: today,
        timestamp: new Date().toISOString(),
        foodName: item.foodName,
        servingSize: item.servingSize,
        servingQuantity: qty,
        calories: Math.round(item.calories * qty),
        proteinG: Math.round(item.proteinG * qty * 10) / 10,
        carbsG: Math.round(item.carbsG * qty * 10) / 10,
        fatG: Math.round(item.fatG * qty * 10) / 10,
        source: 'photo',
      };
      addFoodItem(logItem);
    });
    clearPendingPhotoItems();
    router.navigate('/(tabs)');
  }, [items, addFoodItem, clearPendingPhotoItems]);

  if (!rawItems) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Review Meal' }} />
        <Text style={[styles.errorText, { color: colors.danger }]}>
          No scan result. Go back and try again.
        </Text>
      </View>
    );
  }

  const listHeader = (
    <Text style={[styles.subheading, { color: colors.placeholder }]}>
      {items.length} item{items.length !== 1 ? 's' : ''} detected — review and adjust before logging.
    </Text>
  );

  const listFooter = items.length > 0 ? (
    <TouchableOpacity
      style={[styles.addAllBtn, { backgroundColor: colors.tint }]}
      onPress={handleAddAll}
      activeOpacity={0.8}
    >
      <Text style={styles.addAllBtnText}>Add All to Log</Text>
    </TouchableOpacity>
  ) : (
    <View style={styles.centered}>
      <Text style={[styles.emptyText, { color: colors.placeholder }]}>
        All items removed. Go back to retake the photo.
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          title: 'Review Meal',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <FlatList<EditableItem>
        data={items}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + SPACING.xl }]}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        renderItem={({ item, index }) => {
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
                    onChangeText={(t) => handleQtyChange(index, t)}
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                  />
                </View>
                <Text style={[styles.itemCal, { color: colors.text }]}>
                  {scaledCal} kcal
                </Text>
                <TouchableOpacity onPress={() => handleRemove(index)} activeOpacity={0.7}>
                  <Text style={[styles.removeBtn, { color: colors.danger }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  list: { padding: SPACING.md, gap: SPACING.md },
  subheading: { fontSize: FONT_SIZE.sm, marginBottom: SPACING.sm },
  itemCard: { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.md, gap: SPACING.xs },
  uncertainBadge: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  itemName: { fontSize: FONT_SIZE.lg, fontWeight: '600' },
  itemServing: { fontSize: FONT_SIZE.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginTop: SPACING.xs },
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
  addAllBtn: {
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  addAllBtnText: { color: '#fff', fontSize: FONT_SIZE.lg, fontWeight: '700' },
  emptyText: { fontSize: FONT_SIZE.md, textAlign: 'center' },
  errorText: { fontSize: FONT_SIZE.md, textAlign: 'center' },
});
