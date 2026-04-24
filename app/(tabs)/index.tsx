import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import { FoodLogItem } from '@/components/FoodLogItem';
import { NetCaloriesCard } from '@/components/NetCaloriesCard';
import { WaterTracker } from '@/components/WaterTracker';
import Colors from '@/constants/Colors';
import { FONT_SIZE, SPACING } from '@/constants/Spacing';
import { useDailyLog } from '@/hooks/useDailyLog';
import { useUserStore } from '@/store/userStore';
import type { FoodLogItem as FoodLogItemType } from '@/types';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatTodayDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const profile = useUserStore((state) => state.profile);
  const { log, totals, addWater, removeFoodItem } = useDailyLog();

  const [refreshing, setRefreshing] = useState(false);

  const greeting = useMemo(() => {
    const base = getGreeting();
    return profile?.name ? `${base}, ${profile.name}` : base;
  }, [profile?.name]);

  // Amazfit sync will be wired in step 9
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: FoodLogItemType }) => (
      <FoodLogItem item={item} onDelete={removeFoodItem} />
    ),
    [removeFoodItem],
  );

  const listHeader = useMemo(
    () => (
      <View>
        <View style={[styles.headerSection, { paddingTop: insets.top + SPACING.md }]}>
          <Text style={[styles.date, { color: colors.placeholder }]}>{formatTodayDate()}</Text>
          <Text style={[styles.greeting, { color: colors.text }]}>{greeting}</Text>
        </View>
        <NetCaloriesCard
          eaten={totals.totalCalories}
          burned={log.caloriesBurned}
          remaining={totals.remainingCalories}
        />
        <WaterTracker
          currentMl={log.waterMl}
          targetMl={profile?.dailyWaterTargetMl ?? 2000}
          onAdd={addWater}
        />
        <Text style={[styles.sectionHeader, { color: colors.placeholder }]}>Today's log</Text>
      </View>
    ),
    [insets.top, colors, greeting, totals, log, addWater, profile?.dailyWaterTargetMl],
  );

  const emptyComponent = useMemo(
    () => (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: colors.placeholder }]}>
          No food logged yet. Tap + to add your first entry.
        </Text>
      </View>
    ),
    [colors.placeholder],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList<FoodLogItemType>
        data={log.foodItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.tint}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + SPACING.xl },
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  headerSection: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  date: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  greeting: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  empty: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    lineHeight: FONT_SIZE.md * 1.5,
  },
});
