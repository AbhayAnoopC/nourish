import { useEffect } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { Search, ScanBarcode, Camera, ScanText, ChevronRight } from 'lucide-react-native';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { BORDER_RADIUS, SPACING } from '@/constants/Spacing';
import { Duration } from '@/constants/Motion';
import type { LucideIcon } from 'lucide-react-native';

interface MethodRow {
  icon: LucideIcon;
  title: string;
  description: string;
  available: boolean;
  route: string;
}

const METHODS: MethodRow[] = [
  {
    icon: Search,
    title: 'Search foods',
    description: 'USDA & Open Food Facts',
    available: true,
    route: '/food-search',
  },
  {
    icon: ScanBarcode,
    title: 'Scan barcode',
    description: 'Product UPC / EAN',
    available: true,
    route: '/barcode-scan',
  },
  {
    icon: Camera,
    title: 'Photo scan',
    description: 'AI identifies your meal',
    available: false,
    route: '/photo-scan',
  },
  {
    icon: ScanText,
    title: 'Scan label',
    description: 'Read a nutrition facts panel',
    available: false,
    route: '/label-scan',
  },
];

interface LogMethodsSheetProps {
  visible: boolean;
  onDismiss: () => void;
}

export function LogMethodsSheet({ visible, onDismiss }: LogMethodsSheetProps) {
  const tokens = useTokens();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(800);
  const backdrop = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, {
        duration: Duration.medium,
        easing: Easing.out(Easing.ease),
      });
      backdrop.value = withTiming(0.4, { duration: 200 });
    } else {
      translateY.value = 800;
      backdrop.value = 0;
    }
  }, [visible, translateY, backdrop]);

  const handleDismiss = () => {
    translateY.value = withTiming(800, {
      duration: 250,
      easing: Easing.in(Easing.ease),
    }, (finished) => {
      if (finished) runOnJS(onDismiss)();
    });
    backdrop.value = withTiming(0, { duration: 200 });
  };

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }));

  const handleRowPress = (method: MethodRow) => {
    if (!method.available) return;
    handleDismiss();
    setTimeout(() => router.push(method.route as never), 260);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleDismiss}>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            {
              backgroundColor: tokens.bg.surface,
              paddingBottom: insets.bottom + SPACING.md,
            },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: tokens.text.tertiary }]} />
          <Text style={[Type.displayTitle, { color: tokens.text.primary }, styles.title]}>
            Log food
          </Text>
          <Text style={[Type.textSm, { color: tokens.text.secondary }, styles.subtitle]}>
            Choose how to add food
          </Text>
          <View style={styles.list}>
            {METHODS.map((m, idx) => {
              const Icon = m.icon;
              const isLast = idx === METHODS.length - 1;
              return (
                <Pressable
                  key={m.title}
                  onPress={() => handleRowPress(m)}
                  style={[
                    styles.row,
                    {
                      borderBottomColor: isLast ? 'transparent' : tokens.border.hairline,
                      opacity: m.available ? 1 : 0.55,
                    },
                  ]}
                >
                  <Icon size={22} color={tokens.text.primary} />
                  <View style={styles.rowText}>
                    <Text style={[Type.textLg, { color: tokens.text.primary }]}>{m.title}</Text>
                    <Text style={[Type.textSm, { color: tokens.text.secondary }]}>
                      {m.description}
                    </Text>
                  </View>
                  {!m.available ? (
                    <View style={[styles.soonPill, { backgroundColor: tokens.bg.surfaceMuted }]}>
                      <Text style={[Type.textXs, { color: tokens.text.secondary }]}>Soon</Text>
                    </View>
                  ) : (
                    <ChevronRight size={18} color={tokens.accent.primary} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: '#1A1A1A',
  },
  sheet: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    marginTop: SPACING.xs,
  },
  subtitle: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  list: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    borderBottomWidth: 1,
  },
  rowText: {
    flex: 1,
  },
  soonPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
});
