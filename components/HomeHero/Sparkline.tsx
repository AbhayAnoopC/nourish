import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import type { SparklinePoint } from '@/utils/sparklineData';
import { Duration } from '@/constants/Motion';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface SparklineProps {
  series: SparklinePoint[];
  color: string;
  width: number;
  height: number;
  strokeWidth?: number;
  reduceMotion?: boolean;
}

function buildPathD(series: SparklinePoint[], width: number, height: number): string {
  if (series.length < 2) return '';
  const values = series.map((p) => p.weightKg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (series.length - 1);
  return series
    .map((p, i) => {
      const x = i * stepX;
      const y = height - ((p.weightKg - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

export function Sparkline({
  series,
  color,
  width,
  height,
  strokeWidth = 1.5,
  reduceMotion = false,
}: SparklineProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    if (reduceMotion) {
      progress.value = 1;
    } else {
      progress.value = withTiming(1, {
        duration: Duration.slow,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [series, reduceMotion, progress]);

  const pathD = buildPathD(series, width, height);
  const totalLength = width;

  const animatedProps = useAnimatedProps(() => {
    const dashLen = totalLength * progress.value;
    const gap = totalLength - dashLen;
    return {
      strokeDasharray: [dashLen, gap] as unknown as string,
    };
  });

  if (series.length < 2) return null;

  const lastActualIndex = series.map((p, i) => (p.actual ? i : -1)).filter((i) => i >= 0).pop() ?? series.length - 1;
  const lastPoint = series[lastActualIndex];
  const values = series.map((p) => p.weightKg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (series.length - 1);
  const dotX = lastActualIndex * stepX;
  const dotY = height - ((lastPoint.weightKg - min) / range) * height;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <AnimatedPath
          d={pathD}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          animatedProps={animatedProps}
        />
        <Circle cx={dotX} cy={dotY} r={3} fill={color} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
