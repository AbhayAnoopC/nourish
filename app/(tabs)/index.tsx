import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import { BurnedCaloriesCard } from '@/components/BurnedCaloriesCard';
import { FoodLogItem } from '@/components/FoodLogItem';
import { NetCaloriesCard } from '@/components/NetCaloriesCard';
import { WatchNudgeCard } from '@/components/WatchNudgeCard';
import { WaterTracker } from '@/components/WaterTracker';
import Colors from '@/constants/Colors';
import { FONT_SIZE, SPACING } from '@/constants/Spacing';
import { useAmazfit } from '@/hooks/useAmazfit';
import { useDailyLog } from '@/hooks/useDailyLog';
import { useDailyLogStore } from '@/store/dailyLogStore';
import { useUserStore } from '@/store/userStore';
import { getTodayDateString, formatDisplayDate, getTimeOfDayGreeting } from '@/utils/dateUtils';
import type { FoodLogItem as FoodLogItemType } from '@/types';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const profile = useUserStore((state) => state.profile);
  const { log, totals, addWater, removeFoodItem } = useDailyLog();
  const setCaloriesBurned = useDailyLogStore((s) => s.setCaloriesBurned);
  const {
    connectionTier,
    nudgeDismissed,
    syncing,
    connectZepp,
    connectHealthKit,
    sync,
    dismissNudge,
  } = useAmazfit();

  const [refreshing, setRefreshing] = useState(false);

  const greeting = useMemo(() => {
    const base = getTimeOfDayGreeting();
    return profile?.name ? `${base}, ${profile.name}` : base;
  }, [profile?.name]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await sync();
    setRefreshing(false);
  }, [sync]);

  const handleSaveBurned = useCallback(
    (calories: number) => {
      setCaloriesBurned(getTodayDateString(), calories, 'manual');
    },
    [setCaloriesBurned],
  );

  const renderItem = useCallback(
    ({ item }: { item: FoodLogItemType }) => (
      <FoodLogItem item={item} onDelete={removeFoodItem} />
    ),
    [removeFoodItem],
  );

  const showNudge = connectionTier === 'none' && !nudgeDismissed;

  const listHeader = useMemo(
    () => (
      <View>
        <View style={[styles.headerSection, { paddingTop: insets.top + SPACING.md }]}>
          <Text style={[styles.date, { color: colors.placeholder }]}>
            {formatDisplayDate(new Date())}
          </Text>
          <Text style={[styles.greeting, { color: colors.text }]}>{greeting}</Text>
        </View>
        <NetCaloriesCard
          eaten={totals.totalCalories}
          burned={log.caloriesBurned}
          remaining={totals.remainingCalories}
        />
        {showNudge && (
          <WatchNudgeCard
            onConnectZepp={connectZepp}
            onConnectHealth={connectHealthKit}
            onDismiss={dismissNudge}
          />
        )}
        <BurnedCaloriesCard
          caloriesBurned={log.caloriesBurned}
          connectionTier={connectionTier}
          onSave={handleSaveBurned}
        />
        <WaterTracker
          currentMl={log.waterMl}
          targetMl={profile?.dailyWaterTargetMl ?? 2000}
          onAdd={addWater}
        />
        <Text style={[styles.sectionHeader, { color: colors.placeholder }]}>Today's log</Text>
      </View>
    ),
    [
      insets.top, colors, greeting, totals, log, addWater,
      profile?.dailyWaterTargetMl, showNudge, connectionTier,
      connectZepp, connectHealthKit, dismissNudge, handleSaveBurned,
    ],
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
            refreshing={refreshing || syncing}
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
  container: { flex: 1 },
  listContent: { flexGrow: 1 },
  headerSection: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.lg },
  date: { fontSize: FONT_SIZE.sm, fontWeight: '500', marginBottom: SPACING.xs },
  greeting: { fontSize: FONT_SIZE.xxl, fontWeight: '700' },
  sectionHeader: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  empty: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl, alignItems: 'center' },
  emptyText: { fontSize: FONT_SIZE.md, textAlign: 'center', lineHeight: FONT_SIZE.md * 1.5 },
});
