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
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { BORDER_RADIUS, SPACING } from '@/constants/Spacing';
import { useLogFlowStore } from '@/store/logFlowStore';
import { useDailyLogStore } from '@/store/dailyLogStore';
import { getTodayDateString } from '@/utils/dateUtils';
import type { FoodLogItem } from '@/types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function ConfirmMealScreen() {
  const tokens = useTokens();
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
    headerStyle: { backgroundColor: tokens.bg.surface },
    headerTintColor: tokens.text.primary,
    headerShadowVisible: false,
  };

  if (!pendingMeal) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: tokens.bg.primary }]}>
        <Stack.Screen options={screenOptions} />
        <Text style={[Type.textMd, { color: tokens.status.danger }, styles.errorText]}>
          No meal selected. Please go back and choose a meal.
        </Text>
      </View>
    );
  }

  const canAdd = multiplier > 0 && scaledTotals !== null;

  const cardShadow = {
    shadowColor: '#1A1A1A',
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  } as const;

  const itemRows = pendingMeal.items.map((item, i) => (
    <View key={i} style={[styles.itemRow, { borderBottomColor: tokens.border.hairline }]}>
      <Text style={[Type.textMd, { color: tokens.text.primary }, styles.itemName]} numberOfLines={1}>
        {item.foodName}
      </Text>
      <Text style={[Type.monoSm, { color: tokens.text.secondary }]}>
        {Math.round(item.calories * (multiplier || 1))} kcal
      </Text>
    </View>
  ));

  const content = (
    <View style={styles.inner}>
      {/* Meal name */}
      <View style={[styles.card, { backgroundColor: tokens.bg.surface }, cardShadow]}>
        <Text style={[Type.displayTitle, { color: tokens.text.primary }]}>{pendingMeal.name}</Text>
        <Text style={[Type.textSm, { color: tokens.text.secondary }, styles.itemCount]}>
          {pendingMeal.items.length} item{pendingMeal.items.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Multiplier */}
      <View style={[styles.card, { backgroundColor: tokens.bg.surface }, cardShadow]}>
        <Text style={[Type.textXs, { color: tokens.text.secondary }, styles.sectionLabel]}>QUANTITY</Text>
        <View style={styles.multiplierRow}>
          <TextInput
            style={[
              styles.multiplierInput,
              {
                color: tokens.text.primary,
                backgroundColor: tokens.bg.surfaceMuted,
                fontFamily: 'JetBrainsMono_500Medium',
              },
            ]}
            value={multiplierText}
            onChangeText={setMultiplierText}
            keyboardType="decimal-pad"
            selectTextOnFocus
            maxLength={4}
          />
          <Text style={[Type.textLg, { color: tokens.text.primary }]}>× serving</Text>
        </View>
      </View>

      {/* Totals */}
      {scaledTotals && (
        <View style={[styles.card, { backgroundColor: tokens.bg.surface }, cardShadow]}>
          <Text style={[Type.textXs, { color: tokens.text.secondary }, styles.sectionLabel]}>TOTALS</Text>
          <Text style={[Type.displayHero, { color: tokens.text.primary }]}>
            {scaledTotals.calories}
            <Text style={[Type.textLg, { color: tokens.text.secondary }]}> kcal</Text>
          </Text>
          <Text style={[Type.monoSm, { color: tokens.text.secondary }, styles.macroLine]}>
            P {scaledTotals.proteinG}g · C {scaledTotals.carbsG}g · F {scaledTotals.fatG}g
          </Text>
        </View>
      )}

      {/* Item breakdown */}
      <View style={[styles.card, { backgroundColor: tokens.bg.surface }, cardShadow]}>
        <Text style={[Type.textXs, { color: tokens.text.secondary }, styles.sectionLabel]}>ITEMS</Text>
        {itemRows}
      </View>

      {/* Add button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: canAdd ? tokens.accent.primary : tokens.bg.surfaceMuted }]}
        onPress={handleAddToLog}
        disabled={!canAdd}
        activeOpacity={0.8}
      >
        <Text style={[Type.textLg, { color: canAdd ? '#FFFFFF' : tokens.text.tertiary }]}>
          Add to Log
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: tokens.bg.primary }]}
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
  card: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.cardPad },
  itemCount: { marginTop: SPACING.xs },
  sectionLabel: {
    marginBottom: SPACING.sm,
  },
  multiplierRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  multiplierInput: {
    width: 80,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    fontSize: 24,
    textAlign: 'center',
  },
  macroLine: { marginTop: SPACING.xs },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemName: { flex: 1, marginRight: SPACING.sm },
  addButton: {
    height: 56,
    borderRadius: BORDER_RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  errorText: { textAlign: 'center' },
});
