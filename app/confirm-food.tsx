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
import { useColorScheme } from '@/components/useColorScheme';
import { MacroBar } from '@/components/MacroBar';
import Colors from '@/constants/Colors';
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
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
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Confirm' }} />
        <Text style={[styles.errorText, { color: colors.danger }]}>
          No food selected. Please go back and choose a food.
        </Text>
      </View>
    );
  }

  const canAdd = quantity > 0 && scaled !== null;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          title: 'Confirm',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
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
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.foodName, { color: colors.text }]} numberOfLines={3}>
            {pendingItem.foodName}
          </Text>
          {pendingItem.brandName ? (
            <Text style={[styles.brandName, { color: colors.placeholder }]}>
              {pendingItem.brandName}
            </Text>
          ) : null}
        </View>

        {/* Quantity input */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.placeholder }]}>Quantity</Text>
          <View style={styles.quantityRow}>
            <TextInput
              style={[
                styles.quantityInput,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
              ]}
              value={quantityText}
              onChangeText={setQuantityText}
              keyboardType="decimal-pad"
              selectTextOnFocus
              maxLength={6}
            />
            <Text style={[styles.servingUnit, { color: colors.text }]}>
              × {pendingItem.servingSize}
            </Text>
          </View>
        </View>

        {/* Calorie total */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.placeholder }]}>Calories</Text>
          <Text style={[styles.calorieValue, { color: colors.text }]}>
            {scaled ? scaled.calories : '—'}
            <Text style={[styles.calorieUnit, { color: colors.placeholder }]}> kcal</Text>
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
            style={[styles.saveButton, { borderColor: colors.tint }]}
            onPress={handleSaveAsMeal}
            activeOpacity={0.8}
          >
            <Text style={[styles.saveButtonText, { color: colors.tint }]}>Save as Meal</Text>
          </TouchableOpacity>
        )}

        {/* Add to Log button */}
        <TouchableOpacity
          style={[
            styles.addButton,
            { backgroundColor: canAdd ? colors.tint : colors.border },
          ]}
          onPress={handleAddToLog}
          disabled={!canAdd}
          activeOpacity={0.8}
        >
          <Text style={[styles.addButtonText, { color: canAdd ? '#FFFFFF' : colors.placeholder }]}>
            Add to Log
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Save as Meal modal */}
      <Modal visible={saveModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Save as Meal</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={mealNameText}
              onChangeText={setMealNameText}
              autoFocus
              selectTextOnFocus
              maxLength={60}
              placeholder="Meal name"
              placeholderTextColor={colors.placeholder}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: colors.border }]}
                onPress={() => setSaveModalVisible(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.placeholder }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary, { backgroundColor: colors.tint }]}
                onPress={handleSaveConfirm}
              >
                <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Save</Text>
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
    borderWidth: 1,
    padding: SPACING.lg,
  },
  foodName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    lineHeight: FONT_SIZE.xl * 1.3,
  },
  brandName: {
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.xs,
  },
  sectionLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    textAlign: 'center',
  },
  servingUnit: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '500',
  },
  calorieValue: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: '700',
  },
  calorieUnit: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '400',
  },
  addButton: {
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  addButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  errorText: {
    fontSize: FONT_SIZE.md,
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
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
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
