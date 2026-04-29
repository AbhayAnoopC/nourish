import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Defs, ClipPath, Rect } from 'react-native-svg';
import { Springs } from '@/constants/Motion';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface WaterGlassProps {
  fill: number;
  strokeColor: string;
  fillColor: string;
  size?: number;
  reduceMotion?: boolean;
}

const GLASS_PATH = 'M 30 10 L 90 10 L 80 110 Q 60 116 40 110 Z';

export function WaterGlass({
  fill,
  strokeColor,
  fillColor,
  size = 140,
  reduceMotion = false,
}: WaterGlassProps) {
  const fillProgress = useSharedValue(0);
  const wave = useSharedValue(0);

  useEffect(() => {
    const target = Math.max(0, Math.min(1, fill));
    if (reduceMotion) {
      fillProgress.value = target;
    } else {
      fillProgress.value = withSpring(target, Springs.wave);
    }
  }, [fill, reduceMotion, fillProgress]);

  useEffect(() => {
    if (reduceMotion) return;
    wave.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [reduceMotion, wave]);

  const VIEWBOX = 120;
  const TOP = 10;
  const BOTTOM = 116;

  const animatedProps = useAnimatedProps(() => {
    const yTop = BOTTOM - (BOTTOM - TOP) * fillProgress.value + Math.sin(wave.value * Math.PI * 2) * 1.5;
    const height = BOTTOM - yTop;
    return { y: yTop, height };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
        <Defs>
          <ClipPath id="glassClip">
            <Path d={GLASS_PATH} />
          </ClipPath>
        </Defs>
        <AnimatedRect
          x={0}
          y={0}
          width={VIEWBOX}
          height={VIEWBOX}
          fill={fillColor}
          clipPath="url(#glassClip)"
          animatedProps={animatedProps}
        />
        <Path
          d={GLASS_PATH}
          stroke={strokeColor}
          strokeWidth={2}
          fill="none"
          strokeLinejoin="round"
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
