import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { WaterGlass } from './WaterGlass';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { WATER_INCREMENT_ML } from '@/constants/Spacing';

interface WaterPageProps {
  currentMl: number;
  targetMl: number;
  onAdd: (ml: number) => void;
}

export function WaterPage({ currentMl, targetMl, onAdd }: WaterPageProps) {
  const tokens = useTokens();
  const reduceMotion = useReduceMotion();

  const fill = targetMl > 0 ? Math.min(1, currentMl / targetMl) : 0;
  const currentL = (currentMl / 1000).toFixed(1);
  const targetL = (targetMl / 1000).toFixed(1);

  const handleAdd = () => {
    if (currentMl < targetMl) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onAdd(WATER_INCREMENT_ML);
  };

  return (
    <Pressable style={styles.page} onPress={handleAdd}>
      <WaterGlass
        fill={fill}
        strokeColor={tokens.accent.primary}
        fillColor={tokens.accent.primary}
        reduceMotion={reduceMotion}
      />
      <Text style={[Type.displayHeroSmall, { color: tokens.text.primary }, styles.value]}>
        {currentL} <Text style={[Type.textMd, { color: tokens.text.secondary }]}>/ {targetL} L</Text>
      </Text>
      <View style={[styles.hintChip, { borderColor: tokens.accent.primary }]}>
        <Text style={[Type.monoSm, { color: tokens.accent.primary }]}>Tap to add +250 ml</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  value: {
    marginTop: 8,
  },
  hintChip: {
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
  },
});
