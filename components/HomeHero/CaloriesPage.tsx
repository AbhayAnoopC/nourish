import { StyleSheet, Text, View } from 'react-native';
import { CalorieArc } from './CalorieArc';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { useReduceMotion } from '@/hooks/useReduceMotion';

interface CaloriesPageProps {
  eaten: number;
  burned: number;
  target: number;
}

export function CaloriesPage({ eaten, burned, target }: CaloriesPageProps) {
  const tokens = useTokens();
  const reduceMotion = useReduceMotion();
  const remaining = Math.max(0, target - eaten);
  const progress = target > 0 ? eaten / target : 0;

  return (
    <View style={styles.page}>
      <View style={styles.arcWrap}>
        <CalorieArc
          progress={progress}
          trackColor={tokens.accent.muted}
          fillColor={tokens.accent.primary}
          reduceMotion={reduceMotion}
        />
        <View style={styles.numberCenter} pointerEvents="none">
          <Text style={[Type.displayHero, { color: tokens.text.primary }]}>{eaten}</Text>
          <Text style={[Type.textSm, { color: tokens.text.secondary }]}>kcal</Text>
        </View>
      </View>
      <Text style={[Type.textSm, { color: tokens.text.secondary }, styles.caption]}>
        of {target} · {remaining} to go
      </Text>
      {burned > 0 && (
        <Text style={[Type.monoSm, { color: tokens.text.tertiary }, styles.burned]}>
          −{Math.round(burned)} burned today
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  arcWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    marginTop: 16,
  },
  burned: {
    marginTop: 4,
  },
});
