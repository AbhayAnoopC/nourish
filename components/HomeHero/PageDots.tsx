import { StyleSheet, View } from 'react-native';
import { useTokens } from '@/hooks/useTokens';

interface PageDotsProps {
  count: number;
  activeIndex: number;
}

export function PageDots({ count, activeIndex }: PageDotsProps) {
  const tokens = useTokens();
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: i === activeIndex ? tokens.accent.primary : tokens.text.tertiary,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
