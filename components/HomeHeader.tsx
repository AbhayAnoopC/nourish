import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { SPACING } from '@/constants/Spacing';

interface HomeHeaderProps {
  date: string;
  greeting: string;
}

export function HomeHeader({ date, greeting }: HomeHeaderProps) {
  const tokens = useTokens();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.md }]}>
      <Text style={[Type.textSm, { color: tokens.text.secondary }]}>{date}</Text>
      <Text style={[Type.displayTitle, { color: tokens.text.primary }, styles.greeting]}>
        {greeting}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  greeting: {
    marginTop: SPACING.xs,
  },
});
