import { useCallback, useMemo, useState } from 'react';
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
import type { FoodLogItem } from '@/types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function ConfirmMealScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const pendingMeal = useLogFlowStore((s) => s.pendingMeal);
  const clearPendingMeal = useLogFlowStore((s) => s.clearPendingMeal);
  const addFoodItem = useDailyLogStore((s) => s.addFoodItem);

  const [multiplierText, setMultiplierText] = useState('1');

  const multiplier = useMemo(() => {
    const parsed = parseFloat(multiplierText);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [multiplierText]);

  const scaledTotals = useMemo(() => {
    if (!pendingMeal || multiplier === 0) return null;
    return {
      calories: Math.round(pendingMeal.totalCalories * multiplier),
      proteinG: Math.round(pendingMeal.totalProteinG * multiplier * 10) / 10,
      carbsG: Math.round(pendingMeal.totalCarbsG * multiplier * 10) / 10,
      fatG: Math.round(pendingMeal.totalFatG * multiplier * 10) / 10,
    };
  }, [pendingMeal, multiplier]);

  const handleAddToLog = useCallback(() => {
    if (!pendingMeal || multiplier === 0) return;
    const today = getTodayDateString();
    const baseTimestamp = Date.now();

    pendingMeal.items.forEach((item, index) => {
      const logItem: FoodLogItem = {
        id: generateId(),
        date: today,
        timestamp: new Date(baseTimestamp + index).toISOString(),
        foodName: item.foodName,
        brandName: item.brandName,
        servingSize: item.servingSize,
        servingQuantity: item.servingQuantity * multiplier,
        calories: Math.round(item.calories * multiplier),
        proteinG: Math.round(item.proteinG * multiplier * 10) / 10,
        carbsG: Math.round(item.carbsG * multiplier * 10) / 10,
        fatG: Math.round(item.fatG * multiplier * 10) / 10,
        source: item.source,
      };
      addFoodItem(logItem);
    });

    clearPendingMeal();
    router.navigate('/(tabs)');
  }, [pendingMeal, multiplier, addFoodItem, clearPendingMeal]);

  const screenOptions = {
    title: 'Log Meal',
    headerStyle: { backgroundColor: colors.card },
    headerTintColor: colors.text,
    headerShadowVisible: false,
  };

  if (!pendingMeal) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={screenOptions} />
        <Text style={[styles.errorText, { color: colors.danger }]}>
          No meal selected. Please go back and choose a meal.
        </Text>
      </View>
    );
  }

  const canAdd = multiplier > 0 && scaledTotals !== null;

  const itemRows = pendingMeal.items.map((item, i) => (
    <View key={i} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
        {item.foodName}
      </Text>
      <Text style={[styles.itemCalories, { color: colors.placeholder }]}>
        {Math.round(item.calories * (multiplier || 1))} kcal
      </Text>
    </View>
  ));

  const content = (
    <View style={styles.inner}>
      {/* Meal name */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.mealName, { color: colors.text }]}>{pendingMeal.name}</Text>
        <Text style={[styles.itemCount, { color: colors.placeholder }]}>
          {pendingMeal.items.length} item{pendingMeal.items.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Multiplier */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.placeholder }]}>Quantity</Text>
        <View style={styles.multiplierRow}>
          <TextInput
            style={[
              styles.multiplierInput,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
            ]}
            value={multiplierText}
            onChangeText={setMultiplierText}
            keyboardType="decimal-pad"
            selectTextOnFocus
            maxLength={4}
          />
          <Text style={[styles.multiplierLabel, { color: colors.text }]}>× serving</Text>
        </View>
      </View>

      {/* Totals */}
      {scaledTotals && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.placeholder }]}>Totals</Text>
          <Text style={[styles.totalCalories, { color: colors.text }]}>
            {scaledTotals.calories}
            <Text style={[styles.kcalUnit, { color: colors.placeholder }]}> kcal</Text>
          </Text>
          <Text style={[styles.macroLine, { color: colors.placeholder }]}>
            P {scaledTotals.proteinG}g · C {scaledTotals.carbsG}g · F {scaledTotals.fatG}g
          </Text>
        </View>
      )}

      {/* Item breakdown */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.placeholder }]}>Items</Text>
        {itemRows}
      </View>

      {/* Add button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: canAdd ? colors.tint : colors.border }]}
        onPress={handleAddToLog}
        disabled={!canAdd}
        activeOpacity={0.8}
      >
        <Text style={[styles.addButtonText, { color: canAdd ? '#FFFFFF' : colors.placeholder }]}>
          Add to Log
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={screenOptions} />
      <FlatList
        data={[]}
        renderItem={null}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + SPACING.xl }]}
        ListHeaderComponent={content}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  listContent: { flexGrow: 1 },
  inner: { padding: SPACING.md, gap: SPACING.md },
  card: { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.lg },
  mealName: { fontSize: FONT_SIZE.xl, fontWeight: '700' },
  itemCount: { fontSize: FONT_SIZE.sm, marginTop: SPACING.xs },
  sectionLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  multiplierRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  multiplierInput: {
    width: 80,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    textAlign: 'center',
  },
  multiplierLabel: { fontSize: FONT_SIZE.lg, fontWeight: '500' },
  totalCalories: { fontSize: FONT_SIZE.xxxl, fontWeight: '700' },
  kcalUnit: { fontSize: FONT_SIZE.lg, fontWeight: '400' },
  macroLine: { fontSize: FONT_SIZE.sm, marginTop: SPACING.xs },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemName: { fontSize: FONT_SIZE.md, flex: 1, marginRight: SPACING.sm },
  itemCalories: { fontSize: FONT_SIZE.sm },
  addButton: {
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  addButtonText: { fontSize: FONT_SIZE.lg, fontWeight: '700' },
  errorText: { fontSize: FONT_SIZE.md, textAlign: 'center' },
});
