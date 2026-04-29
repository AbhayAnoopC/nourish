import { Pressable, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { BORDER_RADIUS, SPACING } from '@/constants/Spacing';

interface WatchNudgeBannerProps {
  onConnectZepp: () => void;
  onConnectHealth: () => void;
  onDismiss: () => void;
}

export function WatchNudgeBanner({
  onConnectZepp,
  onConnectHealth,
  onDismiss,
}: WatchNudgeBannerProps) {
  const tokens = useTokens();
  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: tokens.accent.muted,
        },
      ]}
    >
      <View style={styles.textWrap}>
        <Text style={[Type.textMd, { color: tokens.text.primary }]} numberOfLines={1}>
          Connect a watch for accurate burn data
        </Text>
      </View>
      <Pressable
        onPress={onConnectZepp}
        style={[styles.connectBtn, { backgroundColor: tokens.accent.primary }]}
      >
        <Text style={[Type.textSm, { color: '#FFFFFF' }]}>Connect</Text>
      </Pressable>
      <Pressable hitSlop={8} onPress={onDismiss} style={styles.dismiss} accessibilityLabel="Dismiss">
        <X size={18} color={tokens.text.secondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    height: 60,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  textWrap: {
    flex: 1,
  },
  connectBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.button,
  },
  dismiss: {
    padding: 4,
  },
});
