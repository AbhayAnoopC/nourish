import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTokens } from '@/hooks/useTokens';
import { PantryItemCard } from '@/components/PantryItemCard';
import { SavedMealCard } from '@/components/SavedMealCard';
import { Type } from '@/constants/Typography';
import { BORDER_RADIUS, SPACING } from '@/constants/Spacing';
import { useSavedMeals } from '@/hooks/useSavedMeals';
import { useLogFlowStore } from '@/store/logFlowStore';
import { usePantryStore } from '@/store/pantryStore';
import type { PantryItem, SavedMeal } from '@/types';

type ActiveTab = 'meals' | 'pantry';

export default function MealsScreen() {
  const tokens = useTokens();
  const insets = useSafeAreaInsets();
  const { query, setQuery, filteredMeals, renameMeal, deleteMeal } = useSavedMeals();
  const setPendingMeal = useLogFlowStore((s) => s.setPendingMeal);
  const pantryItems = usePantryStore((s) => s.items);
  const [activeTab, setActiveTab] = useState<ActiveTab>('meals');

  const handleSelect = useCallback(
    (meal: SavedMeal) => {
      setPendingMeal(meal);
      router.push('/confirm-meal');
    },
    [setPendingMeal],
  );

  const handleRename = useCallback(
    (id: string, name: string) => renameMeal(id, name),
    [renameMeal],
  );

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert('Delete Meal', 'Are you sure you want to delete this meal?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMeal(id) },
      ]);
    },
    [deleteMeal],
  );

  const segmentControl = useMemo(
    () => (
      <View style={styles.segmentRow}>
        {(['meals', 'pantry'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.segment,
              {
                backgroundColor: activeTab === tab ? tokens.accent.primary : tokens.bg.surface,
                borderColor: tokens.border.hairline,
              },
            ]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                { color: activeTab === tab ? '#fff' : tokens.text.secondary },
              ]}
            >
              {tab === 'meals' ? 'Saved Meals' : 'Pantry'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    ),
    [activeTab, tokens],
  );

  const mealsListHeader = useMemo(
    () => (
      <View style={[styles.headerSection, { paddingTop: insets.top + SPACING.md }]}>
        <Text style={[Type.displayTitle, { color: tokens.text.primary }, styles.heading]}>
          Saved Meals
        </Text>
        {segmentControl}
        <TextInput
          style={[
            Type.textMd,
            styles.searchInput,
            { backgroundColor: tokens.bg.surface, color: tokens.text.primary },
          ]}
          placeholder="Search meals…"
          placeholderTextColor={tokens.text.tertiary}
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
        />
      </View>
    ),
    [insets.top, tokens, query, setQuery, segmentControl],
  );

  const pantryListHeader = useMemo(
    () => (
      <View style={[styles.headerSection, { paddingTop: insets.top + SPACING.md }]}>
        <Text style={[Type.displayTitle, { color: tokens.text.primary }, styles.heading]}>Saved Meals</Text>
        {segmentControl}
      </View>
    ),
    [insets.top, tokens, segmentControl],
  );

  const mealsEmptyComponent = useMemo(
    () => (
      <View style={styles.empty}>
        <Text style={[Type.displayTitle, { color: tokens.text.primary }, styles.emptyTitle]}>
          No saved meals yet
        </Text>
        <Text style={[Type.textMd, { color: tokens.text.secondary }, styles.emptyBody]}>
          When you log a food item, tap "Save as Meal" to store it here for quick re-logging.
        </Text>
      </View>
    ),
    [tokens],
  );

  const pantryEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={[Type.textMd, { color: tokens.text.secondary }, styles.emptyText]}>
          Your pantry is empty. Scan a barcode or nutrition label to add items.
        </Text>
      </View>
    ),
    [tokens.text.secondary],
  );

  if (activeTab === 'pantry') {
    return (
      <View style={[styles.container, { backgroundColor: tokens.bg.primary }]}>
        <FlatList<PantryItem>
          data={pantryItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PantryItemCard item={item} />}
          ListHeaderComponent={pantryListHeader}
          ListEmptyComponent={pantryEmptyComponent}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + SPACING.xl },
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: tokens.bg.primary }]}>
      <FlatList<SavedMeal>
        data={filteredMeals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SavedMealCard
            meal={item}
            onPress={handleSelect}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        )}
        ListHeaderComponent={mealsListHeader}
        ListEmptyComponent={mealsEmptyComponent}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { flexGrow: 1 },
  headerSection: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  heading: {
    marginBottom: SPACING.md,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  segment: {
    flex: 1,
    height: 40,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontWeight: '600',
  },
  searchInput: {
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
  },
  empty: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    marginBottom: SPACING.sm,
  },
  emptyBody: {
    textAlign: 'center',
  },
  emptyContainer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  separator: {
    height: SPACING.sm,
    marginHorizontal: SPACING.md,
  },
});
