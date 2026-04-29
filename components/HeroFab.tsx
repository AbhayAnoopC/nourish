import { Pressable, StyleSheet, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTokens } from '@/hooks/useTokens';
import { PressScale } from '@/constants/Motion';

interface HeroFabProps {
  onPress: () => void;
}

export function HeroFab({ onPress }: HeroFabProps) {
  const tokens = useTokens();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = () => {
    scale.value = withTiming(PressScale.scaleTo, { duration: PressScale.pressDuration });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: PressScale.releaseDuration });
  };

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Animated.View style={[animStyle]}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityLabel="Log food"
          style={[
            styles.fab,
            {
              backgroundColor: tokens.accent.primary,
              shadowColor: tokens.accent.primary,
              shadowOpacity: 0.22,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: 8,
            },
          ]}
        >
          <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
