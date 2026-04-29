import { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTokens } from '@/hooks/useTokens';
import { MacroBar } from '@/components/MacroBar';
import { Type } from '@/constants/Typography';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/constants/Spacing';
import { useLogFlowStore } from '@/store/logFlowStore';
import { useDailyLogStore } from '@/store/dailyLogStore';
import { useSavedMealsStore } from '@/store/savedMealsStore';
import { getTodayDateString } from '@/utils/dateUtils';
import type { FoodLogItem } from '@/types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function ConfirmFoodScreen() {
  const tokens = useTokens();
  const insets = useSafeAreaInsets();
  const pendingItem = useLogFlowStore((s) => s.pendingItem);
  const clearPendingItem = useLogFlowStore((s) => s.clearPendingItem);
  const addFoodItem = useDailyLogStore((s) => s.addFoodItem);
  const addSavedMeal = useSavedMealsStore((s) => s.addMeal);

  const [quantityText, setQuantityText] = useState('1');
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [mealNameText, setMealNameText] = useState('');

  const quantity = useMemo(() => {
    const parsed = parseFloat(quantityText);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [quantityText]);

  const scaled = useMemo(() => {
    if (!pendingItem || quantity === 0) return null;
    return {
      calories: Math.round(pendingItem.calories * quantity),
      proteinG: Math.round(pendingItem.proteinG * quantity * 10) / 10,
      carbsG: Math.round(pendingItem.carbsG * quantity * 10) / 10,
      fatG: Math.round(pendingItem.fatG * quantity * 10) / 10,
    };
  }, [pendingItem, quantity]);

  const handleAddToLog = useCallback(() => {
    if (!pendingItem || !scaled) return;

    const item: FoodLogItem = {
      id: generateId(),
      date: getTodayDateString(),
      timestamp: new Date().toISOString(),
      foodName: pendingItem.foodName,
      brandName: pendingItem.brandName,
      servingSize: pendingItem.servingSize,
      servingQuantity: quantity,
      calories: scaled.calories,
      proteinG: scaled.proteinG,
      carbsG: scaled.carbsG,
      fatG: scaled.fatG,
      source: pendingItem.source,
    };

    addFoodItem(item);
    clearPendingItem();
    router.navigate('/(tabs)');
  }, [pendingItem, scaled, quantity, addFoodItem, clearPendingItem]);

  const handleSaveAsMeal = useCallback(() => {
    if (!pendingItem || !scaled) return;
    setMealNameText(pendingItem.foodName);
    setSaveModalVisible(true);
  }, [pendingItem, scaled]);

  const handleSaveConfirm = useCallback(() => {
    if (!pendingItem || !scaled) return;
    const name = mealNameText.trim();
    if (!name) return;
    addSavedMeal({
      id: generateId(),
      name,
      createdAt: new Date().toISOString(),
      items: [
        {
          foodName: pendingItem.foodName,
          brandName: pendingItem.brandName,
          servingSize: pendingItem.servingSize,
          servingQuantity: quantity,
          calories: scaled.calories,
          proteinG: scaled.proteinG,
          carbsG: scaled.carbsG,
          fatG: scaled.fatG,
          source: pendingItem.source,
        },
      ],
      totalCalories: scaled.calories,
      totalProteinG: scaled.proteinG,
      totalCarbsG: scaled.carbsG,
      totalFatG: scaled.fatG,
    });
    setSaveModalVisible(false);
  }, [pendingItem, scaled, quantity, mealNameText, addSavedMeal]);

  if (!pendingItem) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: tokens.bg.primary }]}>
        <Stack.Screen options={{ title: 'Confirm' }} />
        <Text style={[styles.errorText, { color: tokens.status.danger }]}>
          No food selected. Please go back and choose a food.
        </Text>
      </View>
    );
  }

  const canAdd = quantity > 0 && scaled !== null;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: tokens.bg.primary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          title: 'Confirm',
          headerStyle: { backgroundColor: tokens.bg.surface },
          headerTintColor: tokens.text.primary,
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SPACING.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Food identity */}
        <View style={[styles.card, { backgroundColor: tokens.bg.surface }]}>
          <Text style={[styles.foodName, Type.textXl, { color: tokens.text.primary }]} numberOfLines={3}>
            {pendingItem.foodName}
          </Text>
          {pendingItem.brandName ? (
            <Text style={[styles.brandName, Type.textSm, { color: tokens.text.secondary }]}>
              {pendingItem.brandName}
            </Text>
          ) : null}
        </View>

        {/* Quantity input */}
        <View style={[styles.card, { backgroundColor: tokens.bg.surface }]}>
          <Text style={[styles.sectionLabel, Type.textXs, { color: tokens.text.secondary }]}>Quantity</Text>
          <View style={styles.quantityRow}>
            <TextInput
              style={[
                styles.quantityInput,
                Type.textXl,
                { color: tokens.text.primary, backgroundColor: tokens.bg.primary },
              ]}
              value={quantityText}
              onChangeText={setQuantityText}
              keyboardType="decimal-pad"
              selectTextOnFocus
              maxLength={6}
            />
            <Text style={[styles.servingUnit, Type.textLg, { color: tokens.text.primary }]}>
              × {pendingItem.servingSize}
            </Text>
          </View>
        </View>

        {/* Calorie total */}
        <View style={[styles.card, { backgroundColor: tokens.bg.surface }]}>
          <Text style={[styles.sectionLabel, Type.textXs, { color: tokens.text.secondary }]}>Calories</Text>
          <Text style={[styles.calorieValue, Type.displayHero, { color: tokens.text.primary }]}>
            {scaled ? scaled.calories : '—'}
            <Text style={[styles.calorieUnit, Type.textLg, { color: tokens.text.secondary }]}> kcal</Text>
          </Text>
        </View>

        {/* Macro breakdown */}
        {scaled && (
          <MacroBar
            proteinG={scaled.proteinG}
            carbsG={scaled.carbsG}
            fatG={scaled.fatG}
          />
        )}

        {/* Save as Meal button */}
        {scaled && (
          <TouchableOpacity
            style={[styles.saveButton, { borderColor: tokens.accent.primary }]}
            onPress={handleSaveAsMeal}
            activeOpacity={0.8}
          >
            <Text style={[styles.saveButtonText, Type.textMd, { color: tokens.accent.primary }]}>Save as Meal</Text>
          </TouchableOpacity>
        )}

        {/* Add to Log button */}
        <TouchableOpacity
          style={[
            styles.addButton,
            { backgroundColor: canAdd ? tokens.accent.primary : tokens.bg.surfaceMuted },
          ]}
          onPress={handleAddToLog}
          disabled={!canAdd}
          activeOpacity={0.8}
        >
          <Text style={[styles.addButtonText, Type.textLg, { color: canAdd ? '#FFFFFF' : tokens.text.tertiary }]}>
            Add to Log
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Save as Meal modal */}
      <Modal visible={saveModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: tokens.bg.surface }]}>
            <Text style={[styles.modalTitle, Type.textLg, { color: tokens.text.primary }]}>Save as Meal</Text>
            <TextInput
              style={[styles.modalInput, Type.textMd, { color: tokens.text.primary, backgroundColor: tokens.bg.primary }]}
              value={mealNameText}
              onChangeText={setMealNameText}
              autoFocus
              selectTextOnFocus
              maxLength={60}
              placeholder="Meal name"
              placeholderTextColor={tokens.text.secondary}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: tokens.border.hairline }]}
                onPress={() => setSaveModalVisible(false)}
              >
                <Text style={[styles.modalBtnText, Type.textMd, { color: tokens.text.secondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary, { backgroundColor: tokens.accent.primary }]}
                onPress={handleSaveConfirm}
              >
                <Text style={[styles.modalBtnText, Type.textMd, { color: '#FFFFFF' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  card: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: '#1A1A1A',
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  foodName: {
    marginTop: SPACING.xs,
  },
  brandName: {
    marginTop: SPACING.xs,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  quantityInput: {
    width: 80,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    textAlign: 'center',
  },
  servingUnit: {
  },
  calorieValue: {
  },
  calorieUnit: {
  },
  addButton: {
    height: 56,
    borderRadius: BORDER_RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  addButtonText: {
  },
  errorText: {
    textAlign: 'center',
  },
  saveButton: {
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
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
  },
  modalInput: {
    height: 48,
    borderRadius: BORDER_RADIUS.md,
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
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnPrimary: {
    borderWidth: 0,
  },
  modalBtnText: {
  },
});
