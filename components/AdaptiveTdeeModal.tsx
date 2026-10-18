import { useCallback } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useTokens } from '@/hooks/useTokens';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/constants/Spacing';
import { useAdaptiveTdeeStore } from '@/store/adaptiveTdeeStore';
import { useUserStore } from '@/store/userStore';
import { getTodayDateString } from '@/utils/dateUtils';
import type { AdaptiveTdeeResult } from '@/types';

const GOAL_MESSAGES: Record<string, string> = {
  lose: 'Keep it up — your updated target keeps you on track to lose weight.',
  maintain: 'Your target is now dialled in to your actual metabolism.',
  gain: 'Your updated target reflects what your body needs to grow.',
};

interface AdaptiveTdeeModalContentProps {
  result: AdaptiveTdeeResult;
}

function AdaptiveTdeeModalContent({ result }: AdaptiveTdeeModalContentProps) {
  const tokens = useTokens();
  const updateProfile = useUserStore((s) => s.updateProfile);
  const profile = useUserStore((s) => s.profile);
  const recordRecalculation = useAdaptiveTdeeStore((s) => s.recordRecalculation);

  const handleDismiss = useCallback(() => {
    updateProfile({ dailyCalorieTarget: result.newTarget });
    recordRecalculation({
      date: getTodayDateString(),
      oldTarget: result.oldTarget,
      newTarget: result.newTarget,
      impliedTdee: result.impliedTdee,
    });
  }, [result, updateProfile, recordRecalculation]);

  const goalKey = profile?.goal ?? 'maintain';
  const goalMessage = GOAL_MESSAGES[goalKey] ?? GOAL_MESSAGES['maintain']!;

  return (
    <Animated.View
      entering={ZoomIn.springify()}
      style={[styles.card, { backgroundColor: tokens.bg.surface }]}
    >
      <Text style={[styles.headline, { color: tokens.text.primary }]}>
        Your body burns ~{result.impliedTdee} cal/day
      </Text>
      <Text style={[styles.body, { color: tokens.text.secondary }]}>
        {goalMessage}
      </Text>
      <View style={[styles.targetsRow, { borderColor: tokens.border.hairline }]}>
        <View style={styles.targetCol}>
          <Text style={[styles.targetLabel, { color: tokens.text.secondary }]}>
            Old target
          </Text>
          <Text style={[styles.targetValue, { color: tokens.text.secondary }]}>
            {result.oldTarget} kcal
          </Text>
        </View>
        <Text style={[styles.arrow, { color: tokens.accent.primary }]}>→</Text>
        <View style={styles.targetCol}>
          <Text style={[styles.targetLabel, { color: tokens.text.secondary }]}>
            New target
          </Text>
          <Text style={[styles.targetValue, { color: tokens.text.primary }]}>
            {result.newTarget} kcal
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: tokens.accent.primary }]}
        onPress={handleDismiss}
        activeOpacity={0.8}
      >
        <Text style={styles.btnText}>Got it</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function AdaptiveTdeeModal() {
  const pendingResult = useAdaptiveTdeeStore((s) => s.pendingResult);

  if (!pendingResult) return null;

  return (
    <Modal transparent animationType="none" visible>
      <Animated.View entering={FadeIn} style={styles.overlay}>
        <AdaptiveTdeeModalContent result={pendingResult} />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  card: {
    width: '100%',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  headline: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    lineHeight: FONT_SIZE.md * 1.5,
  },
  targetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: SPACING.md,
  },
  targetCol: {
    alignItems: 'center',
    gap: 4,
  },
  targetLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  targetValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  arrow: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '300',
  },
  btn: {
    height: 52,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
});
