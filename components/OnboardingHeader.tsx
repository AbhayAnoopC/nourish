import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface OnboardingHeaderProps {
  step: number;
  totalSteps: number;
  title: string;
  showBack?: boolean;
}

export function OnboardingHeader({ step, totalSteps, title, showBack = true }: OnboardingHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const dots = Array.from({ length: totalSteps });

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {showBack ? (
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
            <Text style={[styles.backText, { color: colors.tint }]}>← Back</Text>
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
                { backgroundColor: i < step ? colors.tint : colors.border },
              ]}
            />
          ))}
        </View>
        <View style={styles.backButton} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 60,
  },
  backText: {
    fontSize: 15,
    fontWeight: '500',
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
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 4,
  },
});
