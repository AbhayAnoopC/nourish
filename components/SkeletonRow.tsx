import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTokens } from '@/hooks/useTokens';
import { BORDER_RADIUS } from '@/constants/Spacing';

interface SkeletonRowProps {
  height?: number;
  width?: number | `${number}%`;
}

export function SkeletonRow({ height = 20, width = '100%' }: SkeletonRowProps) {
  const tokens = useTokens();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.bone,
        { height, width, backgroundColor: tokens.border.hairline, opacity },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  bone: { borderRadius: BORDER_RADIUS.sm },
});
