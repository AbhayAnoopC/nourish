import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { PageDots } from './PageDots';
import { useTokens } from '@/hooks/useTokens';
import { BORDER_RADIUS, SPACING } from '@/constants/Spacing';

interface HomeHeroPagerProps {
  pages: ReactNode[];
}

export function HomeHeroPager({ pages }: HomeHeroPagerProps) {
  const tokens = useTokens();
  const [active, setActive] = useState(0);

  return (
    <View style={styles.outer}>
      <View
        style={[
          styles.canvas,
          {
            backgroundColor: tokens.bg.surface,
            shadowColor: '#1A1A1A',
            shadowOpacity: 0.04,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          },
        ]}
      >
        <PagerView
          style={styles.pager}
          initialPage={0}
          onPageSelected={(e) => setActive(e.nativeEvent.position)}
        >
          {pages.map((page, i) => (
            <View key={i} style={styles.page}>
              {page}
            </View>
          ))}
        </PagerView>
        <View style={styles.dotsRow}>
          <PageDots count={pages.length} activeIndex={active} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: SPACING.md,
    paddingRight: SPACING.md - 10,
  },
  canvas: {
    height: 320,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  dotsRow: {
    position: 'absolute',
    bottom: SPACING.md,
    left: 0,
    right: 0,
  },
});
