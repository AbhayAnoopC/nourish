import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Sparkline } from './Sparkline';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { buildSparklineSeries } from '@/utils/sparklineData';
import { weeklyWeightDelta } from '@/utils/weightDelta';
import type { WeightEntry } from '@/utils/sparklineData';

interface WeightPageProps {
  entries: WeightEntry[];
  anchorDate: string;
  goal: 'lose' | 'maintain' | 'gain';
  onLogTap: () => void;
}

export function WeightPage({ entries, anchorDate, goal, onLogTap }: WeightPageProps) {
  const tokens = useTokens();
  const reduceMotion = useReduceMotion();

  const series = useMemo(
    () => buildSparklineSeries(entries, anchorDate),
    [entries, anchorDate],
  );
  const delta = useMemo(() => weeklyWeightDelta(series), [series]);
  const actualCount = useMemo(() => series.filter((p) => p.actual).length, [series]);

  const latest = useMemo(() => {
    const actuals = series.filter((p) => p.actual);
    return actuals.length > 0 ? actuals[actuals.length - 1].weightKg : null;
  }, [series]);

  const deltaSign = delta === null ? '' : delta > 0 ? '+' : delta < 0 ? '−' : '±';
  const deltaAbs = delta === null ? '' : Math.abs(delta).toFixed(1);

  const deltaColor =
    delta === null
      ? tokens.text.secondary
      : (goal === 'lose' && delta > 0) || (goal === 'gain' && delta < 0)
      ? tokens.status.warning
      : tokens.text.secondary;

  return (
    <Pressable style={styles.page} onPress={onLogTap}>
      <View style={styles.top}>
        {latest !== null ? (
          <>
            <Text style={[Type.displayHero, { color: tokens.text.primary }]}>
              {latest.toFixed(1)} <Text style={[Type.textMd, { color: tokens.text.secondary }]}>kg</Text>
            </Text>
            {delta !== null && (
              <Text style={[Type.monoSm, { color: deltaColor }]}>
                {deltaSign}{deltaAbs} kg this week
              </Text>
            )}
          </>
        ) : (
          <Text style={[Type.textXl, { color: tokens.text.primary }]}>Log your weight</Text>
        )}
      </View>
      <View style={styles.chart}>
        {actualCount >= 2 ? (
          <Sparkline
            series={series}
            color={`${tokens.accent.primary}99`}
            width={280}
            height={64}
            reduceMotion={reduceMotion}
          />
        ) : (
          <Text style={[Type.textMd, { color: tokens.text.secondary }, styles.placeholder]}>
            Log your weight regularly to see trends.
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    justifyContent: 'space-between',
  },
  top: {
    alignItems: 'flex-start',
    gap: 4,
  },
  chart: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
  },
  placeholder: {
    textAlign: 'center',
  },
});
