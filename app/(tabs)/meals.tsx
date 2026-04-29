import { useCallback, useMemo } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTokens } from '@/hooks/useTokens';
import { SavedMealCard } from '@/components/SavedMealCard';
import { Type } from '@/constants/Typography';
import { BORDER_RADIUS, SPACING } from '@/constants/Spacing';
import { useSavedMeals } from '@/hooks/useSavedMeals';
import { useLogFlowStore } from '@/store/logFlowStore';
import type { SavedMeal } from '@/types';

export default function MealsScreen() {
  const tokens = useTokens();
  const insets = useSafeAreaInsets();
  const { query, setQuery, filteredMeals, renameMeal, deleteMeal } = useSavedMeals();
  const setPendingMeal = useLogFlowStore((s) => s.setPendingMeal);

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

  const listHeader = useMemo(
    () => (
      <View style={[styles.headerSection, { paddingTop: insets.top + SPACING.md }]}>
        <Text style={[Type.displayTitle, { color: tokens.text.primary }, styles.heading]}>
          Saved Meals
        </Text>
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
    [insets.top, tokens, query, setQuery],
  );

  const emptyComponent = useMemo(
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
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyComponent}
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
});
