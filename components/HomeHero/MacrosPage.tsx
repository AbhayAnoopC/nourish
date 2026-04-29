import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { Springs } from '@/constants/Motion';
import { useReduceMotion } from '@/hooks/useReduceMotion';

interface MacroBarRowProps {
  label: string;
  current: number;
  target: number;
  color: string;
  trackColor: string;
  textPrimary: string;
  textSecondary: string;
}

function MacroBarRow({
  label,
  current,
  target,
  color,
  trackColor,
  textPrimary,
  textSecondary,
}: MacroBarRowProps) {
  const reduceMotion = useReduceMotion();
  const fill = target > 0 ? Math.min(1, current / target) : 0;
  const animated = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      animated.value = fill;
    } else {
      animated.value = withSpring(fill, Springs.bar);
    }
  }, [fill, reduceMotion, animated]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${animated.value * 100}%`,
  }));

  return (
    <View style={styles.row}>
      <View style={styles.rowHead}>
        <Text style={[Type.textMd, { color: textPrimary }]}>{label}</Text>
        <Text style={[Type.monoMd, { color: textSecondary }]}>
          {Math.round(current)} / {Math.round(target)} g
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View style={[styles.fill, { backgroundColor: color }, fillStyle]} />
      </View>
    </View>
  );
}

interface MacrosPageProps {
  proteinG: number;
  carbsG: number;
  fatG: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
}

export function MacrosPage({
  proteinG,
  carbsG,
  fatG,
  proteinTarget,
  carbsTarget,
  fatTarget,
}: MacrosPageProps) {
  const tokens = useTokens();
  return (
    <View style={styles.page}>
      <MacroBarRow
        label="Protein"
        current={proteinG}
        target={proteinTarget}
        color={tokens.macro.protein}
        trackColor={tokens.accent.muted}
        textPrimary={tokens.text.primary}
        textSecondary={tokens.text.secondary}
      />
      <MacroBarRow
        label="Carbs"
        current={carbsG}
        target={carbsTarget}
        color={tokens.macro.carbs}
        trackColor={tokens.accent.muted}
        textPrimary={tokens.text.primary}
        textSecondary={tokens.text.secondary}
      />
      <MacroBarRow
        label="Fat"
        current={fatG}
        target={fatTarget}
        color={tokens.macro.fat}
        trackColor={tokens.accent.muted}
        textPrimary={tokens.text.primary}
        textSecondary={tokens.text.secondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 12,
  },
  row: {
    gap: 8,
  },
  rowHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
