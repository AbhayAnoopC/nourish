import { useCallback, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/constants/Spacing';
import { usePantryStore } from '@/store/pantryStore';
import { useDailyLogStore } from '@/store/dailyLogStore';
import { getTodayDateString } from '@/utils/dateUtils';
import type { FoodLogItem, PantryItem } from '@/types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface PantryItemCardProps {
  item: PantryItem;
}

export function PantryItemCard({ item }: PantryItemCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [sheetVisible, setSheetVisible] = useState(false);
  const [servingsText, setServingsText] = useState('1');
  const removeItem = usePantryStore((s) => s.removeItem);
  const addFoodItem = useDailyLogStore((s) => s.addFoodItem);

  const servings = parseFloat(servingsText) || 1;

  const handleLog = useCallback(() => {
    const logItem: FoodLogItem = {
      id: generateId(),
      date: getTodayDateString(),
      timestamp: new Date().toISOString(),
      foodName: item.foodName,
      brandName: item.brandName,
      servingSize: `${servings} × ${item.servingDescription}`,
      servingQuantity: servings,
      calories: Math.round(item.caloriesPerServing * servings),
      proteinG: Math.round(item.proteinGPerServing * servings * 10) / 10,
      carbsG: Math.round(item.carbsGPerServing * servings * 10) / 10,
      fatG: Math.round(item.fatGPerServing * servings * 10) / 10,
      source: item.source,
    };
    addFoodItem(logItem);
    setSheetVisible(false);
    router.navigate('/(tabs)');
  }, [item, servings, addFoodItem]);

  const brandRow =
    item.brandName !== undefined ? (
      <Text style={[styles.brand, { color: colors.placeholder }]}>{item.brandName}</Text>
    ) : null;

  const totalCalories = Math.round(item.caloriesPerServing * servings);

  return (
    <>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setSheetVisible(true)}
        onLongPress={() => removeItem(item.id)}
        activeOpacity={0.7}
        delayLongPress={600}
      >
        <View style={styles.cardBody}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {item.foodName}
          </Text>
          {brandRow}
          <Text style={[styles.serving, { color: colors.placeholder }]}>
            {item.servingDescription} · {item.caloriesPerServing} kcal
          </Text>
        </View>
        <Text style={[styles.arrow, { color: colors.placeholder }]}>›</Text>
      </TouchableOpacity>

      <Modal visible={sheetVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>{item.foodName}</Text>
            <Text style={[styles.sheetServing, { color: colors.placeholder }]}>
              {item.caloriesPerServing} kcal per {item.servingDescription}
            </Text>
            <View style={styles.servingsRow}>
              <Text style={[styles.servingsLabel, { color: colors.text }]}>Servings</Text>
              <TextInput
                style={[styles.servingsInput, { color: colors.text, borderColor: colors.border }]}
                value={servingsText}
                onChangeText={setServingsText}
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
            </View>
            <Text style={[styles.total, { color: colors.text }]}>
              {totalCalories} kcal total
            </Text>
            <TouchableOpacity
              style={[styles.logBtn, { backgroundColor: colors.tint }]}
              onPress={handleLog}
              activeOpacity={0.8}
            >
              <Text style={styles.logBtnText}>Add to Today's Log</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSheetVisible(false)} activeOpacity={0.7}>
              <Text style={[styles.cancelText, { color: colors.placeholder }]}>Cancel</Text>
            </TouchableOpacity>
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
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
  },
  cardBody: { flex: 1, gap: 2 },
  name: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  brand: { fontSize: FONT_SIZE.sm },
  serving: { fontSize: FONT_SIZE.sm },
  arrow: { fontSize: FONT_SIZE.xl, marginLeft: SPACING.sm },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  sheetTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700' },
  sheetServing: { fontSize: FONT_SIZE.sm },
  servingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  servingsLabel: { fontSize: FONT_SIZE.md },
  servingsInput: {
    width: 72,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    fontSize: FONT_SIZE.lg,
    textAlign: 'center',
  },
  total: { fontSize: FONT_SIZE.lg, fontWeight: '600' },
  logBtn: {
    height: 52,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },
  cancelText: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    paddingVertical: SPACING.sm,
  },
});
