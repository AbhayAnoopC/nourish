import { useCallback, useMemo } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import { SavedMealCard } from '@/components/SavedMealCard';
import Colors from '@/constants/Colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/constants/Spacing';
import { useSavedMeals } from '@/hooks/useSavedMeals';
import { useLogFlowStore } from '@/store/logFlowStore';
import type { SavedMeal } from '@/types';

export default function MealsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
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
        <Text style={[styles.heading, { color: colors.text }]}>Saved Meals</Text>
        <TextInput
          style={[
            styles.searchInput,
            { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
          ]}
          placeholder="Search meals\u2026"
          placeholderTextColor={colors.placeholder}
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
        />
      </View>
    ),
    [insets.top, colors, query, setQuery],
  );

  const emptyComponent = useMemo(
    () => (
      <View style={styles.empty}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No saved meals yet</Text>
        <Text style={[styles.emptyBody, { color: colors.placeholder }]}>
          When you log a food item, tap \u201cSave as Meal\u201d to store it here for quick re-logging.
        </Text>
      </View>
    ),
    [colors],
  );

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
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyComponent}
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
});
