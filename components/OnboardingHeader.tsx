import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { SPACING } from '@/constants/Spacing';

interface OnboardingHeaderProps {
  step: number;
  totalSteps: number;
  title: string;
  showBack?: boolean;
}

export function OnboardingHeader({ step, totalSteps, title, showBack = true }: OnboardingHeaderProps) {
  const tokens = useTokens();

  const dots = Array.from({ length: totalSteps });

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {showBack ? (
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
            <Text style={[Type.textMd, { color: tokens.accent.primary }]}>← Back</Text>
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}
        <View style={styles.dots}>
          {dots.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i < step ? tokens.accent.primary : tokens.border.hairline },
              ]}
            />
          ))}
        </View>
        <View style={styles.backButton} />
      </View>
      <Text style={[Type.displayTitle, { color: tokens.text.primary }, styles.title]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  backButton: {
    width: 60,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    marginBottom: SPACING.xs,
  },
});
