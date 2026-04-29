import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useTokens } from '@/hooks/useTokens';
import { HomeHeader } from '@/components/HomeHeader';
import { HomeHeroPager } from '@/components/HomeHero/HomeHeroPager';
import { CaloriesPage } from '@/components/HomeHero/CaloriesPage';
import { MacrosPage } from '@/components/HomeHero/MacrosPage';
import { WaterPage } from '@/components/HomeHero/WaterPage';
import { WeightPage } from '@/components/HomeHero/WeightPage';
import { WatchNudgeBanner } from '@/components/WatchNudgeBanner';
import { FoodLogRow } from '@/components/FoodLogRow';
import { WeightLogModal } from '@/components/WeightLogModal';
import { Type } from '@/constants/Typography';
import { SPACING } from '@/constants/Spacing';
import { useAmazfit } from '@/hooks/useAmazfit';
import { useDailyLog } from '@/hooks/useDailyLog';
import { useDailyLogStore } from '@/store/dailyLogStore';
import { useUserStore } from '@/store/userStore';
import { getTodayDateString, formatDisplayDate, getTimeOfDayGreeting } from '@/utils/dateUtils';
import type { FoodLogItem as FoodLogItemType, WeightEntry } from '@/types';

export default function HomeScreen() {
  const tokens = useTokens();
  const profile = useUserStore((state) => state.profile);
  const { log, totals, addWater, removeFoodItem } = useDailyLog();
  const allLogs = useDailyLogStore((s) => s.logs);
  const setBodyWeight = useDailyLogStore((s) => s.setBodyWeight);
  const [weightModalOpen, setWeightModalOpen] = useState(false);
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

  const today = getTodayDateString();

  const weightEntries = useMemo<WeightEntry[]>(() => {
    return Object.values(allLogs)
      .filter((l) => typeof l.bodyWeightKg === 'number')
      .map((l) => ({ date: l.date, weightKg: l.bodyWeightKg as number }));
  }, [allLogs]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await sync();
    setRefreshing(false);
  }, [sync]);

  const handleLogWeight = useCallback(() => {
    setWeightModalOpen(true);
  }, []);

  const handleWeightSave = useCallback(
    (kg: number) => {
      setBodyWeight(today, kg);
    },
    [setBodyWeight, today],
  );

  const latestWeightKg = useMemo(() => {
    const todayLog = allLogs[today];
    if (todayLog?.bodyWeightKg) return todayLog.bodyWeightKg;
    const sorted = Object.values(allLogs)
      .filter((l) => typeof l.bodyWeightKg === 'number')
      .sort((a, b) => b.date.localeCompare(a.date));
    return sorted[0]?.bodyWeightKg;
  }, [allLogs, today]);

  const renderItem = useCallback(
    ({ item, index }: { item: FoodLogItemType; index: number }) => (
      <FoodLogRow
        item={item}
        onDelete={removeFoodItem}
        isLast={index === log.foodItems.length - 1}
      />
    ),
    [removeFoodItem, log.foodItems.length],
  );

  const showNudge = connectionTier === 'none' && !nudgeDismissed;

  const heroPages = useMemo(
    () => [
      <CaloriesPage
        key="cal"
        eaten={totals.totalCalories}
        burned={log.caloriesBurned}
        target={profile?.dailyCalorieTarget ?? 2000}
      />,
      <MacrosPage
        key="mac"
        proteinG={totals.totalProteinG}
        carbsG={totals.totalCarbsG}
        fatG={totals.totalFatG}
        proteinTarget={profile?.dailyProteinTarget ?? 120}
        carbsTarget={profile?.dailyCarbTarget ?? 250}
        fatTarget={profile?.dailyFatTarget ?? 65}
      />,
      <WaterPage
        key="wat"
        currentMl={log.waterMl}
        targetMl={profile?.dailyWaterTargetMl ?? 2000}
        onAdd={addWater}
      />,
      <WeightPage
        key="wgt"
        entries={weightEntries}
        anchorDate={today}
        goal={profile?.goal ?? 'maintain'}
        onLogTap={handleLogWeight}
      />,
    ],
    [totals, log, profile, addWater, weightEntries, today, handleLogWeight],
  );

  const listHeader = useMemo(
    () => (
      <View>
        <HomeHeader date={formatDisplayDate(new Date())} greeting={greeting} />
        {showNudge && (
          <WatchNudgeBanner
            onConnectZepp={connectZepp}
            onConnectHealth={connectHealthKit}
            onDismiss={dismissNudge}
          />
        )}
        <HomeHeroPager pages={heroPages} />
        <Text style={[Type.textXs, { color: tokens.text.secondary }, styles.sectionHeader]}>
          TODAY'S LOG
        </Text>
      </View>
    ),
    [greeting, showNudge, connectZepp, connectHealthKit, dismissNudge, heroPages, tokens.text.secondary],
  );

  const emptyComponent = useMemo(
    () => (
      <View style={styles.empty}>
        <Text style={[Type.displayTitle, { color: tokens.text.primary }]}>No food logged yet</Text>
        <Text style={[Type.textMd, { color: tokens.text.secondary }, styles.emptyBody]}>
          Tap + below to add your first entry.
        </Text>
      </View>
    ),
    [tokens.text.primary, tokens.text.secondary],
  );

  return (
    <View style={[styles.container, { backgroundColor: tokens.bg.primary }]}>
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
            tintColor={tokens.accent.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      <WeightLogModal
        visible={weightModalOpen}
        unit={profile?.units ?? 'metric'}
        initialWeightKg={latestWeightKg}
        onSave={handleWeightSave}
        onDismiss={() => setWeightModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { flexGrow: 1, paddingBottom: 120 },
  sectionHeader: {
    textTransform: 'uppercase',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  empty: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyBody: {
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
});
