import { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTokens } from '@/hooks/useTokens';
import { MacroBar } from '@/components/MacroBar';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/constants/Spacing';
import { useLogFlowStore } from '@/store/logFlowStore';
import { usePantryStore } from '@/store/pantryStore';
import { useDailyLogStore } from '@/store/dailyLogStore';
import { getTodayDateString } from '@/utils/dateUtils';
import type { FoodLogItem } from '@/types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function PantryConfirmScreen() {
  const tokens = useTokens();
  const insets = useSafeAreaInsets();

  const pendingLabelResult = useLogFlowStore((s) => s.pendingLabelResult);
  const clearPendingLabelResult = useLogFlowStore((s) => s.clearPendingLabelResult);
  const addPantryItem = usePantryStore((s) => s.addItem);
  const addFoodItem = useDailyLogStore((s) => s.addFoodItem);

  const [foodName, setFoodName] = useState(pendingLabelResult?.foodName ?? '');
  const [brandName, setBrandName] = useState(pendingLabelResult?.brandName ?? '');
  const [servingDesc, setServingDesc] = useState(pendingLabelResult?.servingDescription ?? '');
  const [servingQtyText, setServingQtyText] = useState(
    String(pendingLabelResult?.servingQuantity ?? 1),
  );
  const [alsoLog, setAlsoLog] = useState(false);
  const [logServingsText, setLogServingsText] = useState('1');

  const servingQty = useMemo(() => parseFloat(servingQtyText) || 1, [servingQtyText]);
  const logServings = useMemo(() => parseFloat(logServingsText) || 1, [logServingsText]);

  const item = pendingLabelResult;

  const handleSave = useCallback(() => {
    if (!item) return;

    const pantryId = generateId();
    addPantryItem({
      id: pantryId,
      foodName: foodName.trim() || item.foodName,
      brandName: brandName.trim() || item.brandName,
      barcode: item.barcode,
      servingDescription: servingDesc.trim() || item.servingDescription,
      servingQuantity: servingQty,
      caloriesPerServing: item.caloriesPerServing,
      proteinGPerServing: item.proteinGPerServing,
      carbsGPerServing: item.carbsGPerServing,
      fatGPerServing: item.fatGPerServing,
      addedAt: new Date().toISOString(),
      source: item.barcode ? 'barcode' : 'label',
    });

    if (alsoLog) {
      const logItem: FoodLogItem = {
        id: generateId(),
        date: getTodayDateString(),
        timestamp: new Date().toISOString(),
        foodName: foodName.trim() || item.foodName,
        brandName: brandName.trim() || item.brandName,
        servingLabel: `${logServings} × ${servingDesc.trim() || item.servingDescription}`,
        calories: Math.round(item.caloriesPerServing * logServings),
        proteinG: Math.round(item.proteinGPerServing * logServings * 10) / 10,
        carbsG: Math.round(item.carbsGPerServing * logServings * 10) / 10,
        fatG: Math.round(item.fatGPerServing * logServings * 10) / 10,
        source: item.barcode ? 'barcode' : 'label',
      };
      addFoodItem(logItem);
    }

    clearPendingLabelResult();
    router.navigate('/(tabs)');
  }, [
    item, foodName, brandName, servingDesc, servingQty,
    alsoLog, logServings, addPantryItem, addFoodItem, clearPendingLabelResult,
  ]);

  if (!item) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: tokens.bg.primary }]}>
        <Stack.Screen options={{ title: 'Save to Pantry' }} />
        <Text style={[styles.errorText, { color: tokens.status.danger }]}>
          No scan result. Please go back and scan again.
        </Text>
      </View>
    );
  }

  const servingLabel = `${servingQty} × ${servingDesc || item.servingDescription}`;

  const logServingsSection = alsoLog ? (
    <View style={styles.logServingsRow}>
      <Text style={[styles.label, { color: tokens.text.secondary }]}>How many servings?</Text>
      <TextInput
        style={[styles.smallInput, { color: tokens.text.primary, borderColor: tokens.border.hairline }]}
        value={logServingsText}
        onChangeText={setLogServingsText}
        keyboardType="decimal-pad"
        selectTextOnFocus
      />
    </View>
  ) : null;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: tokens.bg.primary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          title: 'Save to Pantry',
          headerStyle: { backgroundColor: tokens.bg.surface },
          headerTintColor: tokens.text.primary,
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: tokens.bg.surface, borderColor: tokens.border.hairline }]}>
          <Text style={[styles.label, { color: tokens.text.secondary }]}>Food name</Text>
          <TextInput
            style={[styles.input, { color: tokens.text.primary, borderColor: tokens.border.hairline }]}
            value={foodName}
            onChangeText={setFoodName}
            placeholder={item.foodName}
            placeholderTextColor={tokens.text.secondary}
          />
          <Text style={[styles.label, { color: tokens.text.secondary, marginTop: SPACING.sm }]}>
            Brand (optional)
          </Text>
          <TextInput
            style={[styles.input, { color: tokens.text.primary, borderColor: tokens.border.hairline }]}
            value={brandName}
            onChangeText={setBrandName}
            placeholder="e.g. Wonder"
            placeholderTextColor={tokens.text.secondary}
          />
        </View>

        <View style={[styles.card, { backgroundColor: tokens.bg.surface, borderColor: tokens.border.hairline }]}>
          <Text style={[styles.label, { color: tokens.text.secondary }]}>Serving description</Text>
          <TextInput
            style={[styles.input, { color: tokens.text.primary, borderColor: tokens.border.hairline }]}
            value={servingDesc}
            onChangeText={setServingDesc}
            placeholder={item.servingDescription}
            placeholderTextColor={tokens.text.secondary}
          />
          <Text style={[styles.label, { color: tokens.text.secondary, marginTop: SPACING.sm }]}>
            Serving quantity (count in that description)
          </Text>
          <TextInput
            style={[styles.input, { color: tokens.text.primary, borderColor: tokens.border.hairline }]}
            value={servingQtyText}
            onChangeText={setServingQtyText}
            keyboardType="decimal-pad"
            placeholder="1"
            placeholderTextColor={tokens.text.secondary}
          />
        </View>

        <View style={[styles.card, { backgroundColor: tokens.bg.surface, borderColor: tokens.border.hairline }]}>
          <Text style={[styles.label, { color: tokens.text.secondary }]}>
            {`Nutrition per serving (${servingLabel})`}
          </Text>
          <Text style={[styles.calorieValue, { color: tokens.text.primary }]}>
            {item.caloriesPerServing}
            <Text style={[styles.calorieUnit, { color: tokens.text.secondary }]}> kcal</Text>
          </Text>
          <MacroBar
            proteinG={item.proteinGPerServing}
            carbsG={item.carbsGPerServing}
            fatG={item.fatGPerServing}
          />
        </View>

        <View style={[styles.card, { backgroundColor: tokens.bg.surface, borderColor: tokens.border.hairline }]}>
          <View style={styles.row}>
            <Text style={[styles.toggleLabel, { color: tokens.text.primary }]}>
              Also add to today's log
            </Text>
            <Switch
              value={alsoLog}
              onValueChange={setAlsoLog}
              trackColor={{ true: tokens.accent.primary }}
            />
          </View>
          {logServingsSection}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: tokens.accent.primary }]}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>Save to Pantry</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  scroll: { padding: SPACING.md, gap: SPACING.md },
  card: { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.lg, gap: SPACING.xs },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    fontSize: FONT_SIZE.md,
    marginTop: 4,
  },
  calorieValue: { fontSize: FONT_SIZE.xxl, fontWeight: '700', marginVertical: SPACING.xs },
  calorieUnit: { fontSize: FONT_SIZE.lg, fontWeight: '400' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { fontSize: FONT_SIZE.md, fontWeight: '500' },
  logServingsRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginTop: SPACING.sm },
  smallInput: {
    width: 72,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    fontSize: FONT_SIZE.lg,
    textAlign: 'center',
  },
  saveBtn: {
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontSize: FONT_SIZE.lg, fontWeight: '700' },
  errorText: { fontSize: FONT_SIZE.md, textAlign: 'center' },
});
