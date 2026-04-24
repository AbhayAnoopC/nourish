import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import { PantryItemCard } from '@/components/PantryItemCard';
import { SavedMealCard } from '@/components/SavedMealCard';
import Colors from '@/constants/Colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/constants/Spacing';
import { useSavedMeals } from '@/hooks/useSavedMeals';
import { useLogFlowStore } from '@/store/logFlowStore';
import { usePantryStore } from '@/store/pantryStore';
import type { PantryItem, SavedMeal } from '@/types';

type ActiveTab = 'meals' | 'pantry';

export default function MealsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
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
                backgroundColor: activeTab === tab ? colors.tint : colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                { color: activeTab === tab ? '#fff' : colors.placeholder },
              ]}
            >
              {tab === 'meals' ? 'Saved Meals' : 'Pantry'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    ),
    [activeTab, colors],
  );

  const mealsListHeader = useMemo(
    () => (
      <View style={[styles.headerSection, { paddingTop: insets.top + SPACING.md }]}>
        <Text style={[styles.heading, { color: colors.text }]}>Saved Meals</Text>
        {segmentControl}
        <TextInput
          style={[
            styles.searchInput,
            { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
          ]}
          placeholder="Search meals…"
          placeholderTextColor={colors.placeholder}
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
        />
      </View>
    ),
    [insets.top, colors, query, setQuery, segmentControl],
  );

  const pantryListHeader = useMemo(
    () => (
      <View style={[styles.headerSection, { paddingTop: insets.top + SPACING.md }]}>
        <Text style={[styles.heading, { color: colors.text }]}>Saved Meals</Text>
        {segmentControl}
      </View>
    ),
    [insets.top, colors, segmentControl],
  );

  const mealsEmptyComponent = useMemo(
    () => (
      <View style={styles.empty}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No saved meals yet</Text>
        <Text style={[styles.emptyBody, { color: colors.placeholder }]}>
          When you log a food item, tap “Save as Meal” to store it here for quick re-logging.
        </Text>
      </View>
    ),
    [colors],
  );

  const pantryEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.placeholder }]}>
          Your pantry is empty. Scan a barcode or nutrition label to add items.
        </Text>
      </View>
    ),
    [colors],
  );

  if (activeTab === 'pantry') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
          { paddingBottom: insets.bottom + SPACING.xl },
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
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
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
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  searchInput: {
    height: 44,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZE.md,
  },
  empty: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  emptyBody: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    lineHeight: FONT_SIZE.md * 1.5,
  },
  emptyContainer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    lineHeight: FONT_SIZE.md * 1.5,
  },
  separator: {
    height: SPACING.sm,
    marginHorizontal: SPACING.md,
  },
});
