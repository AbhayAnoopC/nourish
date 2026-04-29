import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Springs } from '@/constants/Motion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CalorieArcProps {
  progress: number;
  trackColor: string;
  fillColor: string;
  size?: number;
  stroke?: number;
  reduceMotion?: boolean;
}

const SWEEP_DEG = 270;
const START_OFFSET_DEG = -225;

export function CalorieArc({
  progress,
  trackColor,
  fillColor,
  size = 220,
  stroke = 14,
  reduceMotion = false,
}: CalorieArcProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const sweepLength = circumference * (SWEEP_DEG / 360);

  const animated = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      animated.value = Math.max(0, Math.min(1, progress));
    } else {
      animated.value = withSpring(Math.max(0, Math.min(1, progress)), Springs.arc);
    }
  }, [progress, reduceMotion, animated]);

  const animatedProps = useAnimatedProps(() => {
    const filled = animated.value * sweepLength;
    const empty = circumference - filled;
    return {
      strokeDasharray: [filled, empty] as unknown as string,
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={[sweepLength, circumference - sweepLength] as unknown as string}
          strokeLinecap="round"
          transform={`rotate(${START_OFFSET_DEG} ${size / 2} ${size / 2})`}
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={fillColor}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          animatedProps={animatedProps}
          transform={`rotate(${START_OFFSET_DEG} ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
