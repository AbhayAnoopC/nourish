import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/constants/Spacing';
import { useAmazfit } from '@/hooks/useAmazfit';
import type { AmazfitConnectionTier } from '@/types';

const TIER_LABEL: Record<AmazfitConnectionTier, string> = {
  zepp: 'Zepp (Amazfit)',
  healthconnect: 'Health Connect',
  applehealth: 'Apple Health',
  manual: 'Manual',
  none: 'Not connected',
};

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { connectionTier, syncing, lastSyncedAt, connectZepp, connectHealthKit, setManual, disconnect } = useAmazfit();
  const [connecting, setConnecting] = useState(false);

  const handleConnectZepp = useCallback(async () => {
    setConnecting(true);
    try {
      await connectZepp();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      Alert.alert('Connection Failed', message);
    } finally {
      setConnecting(false);
    }
  }, [connectZepp]);

  const handleConnectHealth = useCallback(async () => {
    setConnecting(true);
    try {
      await connectHealthKit();
    } finally {
      setConnecting(false);
    }
  }, [connectHealthKit]);

  const handleDisconnect = useCallback(() => {
    Alert.alert('Disconnect', 'Remove the current watch connection?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: disconnect },
    ]);
  }, [disconnect]);

  const lastSyncLabel = useMemo(() => {
    if (!lastSyncedAt) return 'Never';
    const d = new Date(lastSyncedAt);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [lastSyncedAt]);

  const isConnected = connectionTier !== 'none';

  const statusSection = (
    <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.statusRow}>
        <Text style={[styles.statusLabel, { color: colors.placeholder }]}>Status</Text>
        <View style={[styles.badge, { backgroundColor: isConnected ? colors.success : colors.border }]}>
          <Text style={[styles.badgeText, { color: isConnected ? '#FFFFFF' : colors.placeholder }]}>
            {isConnected ? 'Connected' : 'Not connected'}
          </Text>
        </View>
      </View>
      <Text style={[styles.tierName, { color: colors.text }]}>{TIER_LABEL[connectionTier]}</Text>
      {isConnected && (
        <Text style={[styles.syncTime, { color: colors.placeholder }]}>
          Last synced: {syncing ? 'syncing…' : lastSyncLabel}
          {syncing && <ActivityIndicator size="small" color={colors.tint} />}
        </Text>
      )}
    </View>
  );

  const connectSection = (
    <View style={styles.optionList}>
      <Text style={[styles.sectionTitle, { color: colors.placeholder }]}>Connection method</Text>

      {(['zepp', 'healthconnect', 'applehealth', 'manual'] as const).map((tier) => {
        const isActive = connectionTier === tier;
        return (
          <TouchableOpacity
            key={tier}
            style={[
              styles.optionCard,
              {
                backgroundColor: colors.card,
                borderColor: isActive ? colors.tint : colors.border,
              },
            ]}
            onPress={() => {
              if (tier === 'zepp') handleConnectZepp();
              else if (tier === 'healthconnect' || tier === 'applehealth') handleConnectHealth();
              else setManual();
            }}
            disabled={connecting || isActive}
            activeOpacity={0.7}
          >
            <View style={styles.optionInfo}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>{TIER_LABEL[tier]}</Text>
              <Text style={[styles.optionDesc, { color: colors.placeholder }]}>
                {tier === 'zepp' && 'OAuth via Zepp app — requires ZEPP_CLIENT_ID'}
                {tier === 'healthconnect' && 'Android Health Connect — requires dev build'}
                {tier === 'applehealth' && 'iOS Apple Health — requires dev build'}
                {tier === 'manual' && 'Enter calories burned manually on the home screen'}
              </Text>
            </View>
            {isActive && (
              <View style={[styles.activeDot, { backgroundColor: colors.tint }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + SPACING.md, paddingBottom: insets.bottom + SPACING.xl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.heading, { color: colors.text }]}>Settings</Text>

      <Text style={[styles.sectionHeading, { color: colors.placeholder }]}>
        Amazfit / Watch
      </Text>
      {statusSection}
      {connectSection}
      {isConnected && (
        <TouchableOpacity
          style={[styles.disconnectBtn, { borderColor: colors.danger }]}
          onPress={handleDisconnect}
          activeOpacity={0.8}
        >
          <Text style={[styles.disconnectBtnText, { color: colors.danger }]}>Disconnect</Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.sectionHeading, { color: colors.placeholder }]}>Profile</Text>
      <View style={[styles.comingSoon, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.comingSoonText, { color: colors.placeholder }]}>Coming in step 15 (polish)</Text>
      </View>

      <Text style={[styles.sectionHeading, { color: colors.placeholder }]}>Daily Targets</Text>
      <View style={[styles.comingSoon, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.comingSoonText, { color: colors.placeholder }]}>Coming in step 15 (polish)</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: SPACING.md, gap: SPACING.sm },
  heading: { fontSize: FONT_SIZE.xxl, fontWeight: '700', marginBottom: SPACING.sm },
  sectionHeading: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  statusCard: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.xs,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusLabel: { fontSize: FONT_SIZE.sm, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  badge: { borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 2 },
  badgeText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  tierName: { fontSize: FONT_SIZE.lg, fontWeight: '600' },
  syncTime: { fontSize: FONT_SIZE.sm },
  optionList: { gap: SPACING.sm },
  sectionTitle: { fontSize: FONT_SIZE.sm, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  optionCard: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionInfo: { flex: 1 },
  optionTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', marginBottom: 2 },
  optionDesc: { fontSize: FONT_SIZE.sm, lineHeight: FONT_SIZE.sm * 1.4 },
  activeDot: { width: 10, height: 10, borderRadius: 5, marginLeft: SPACING.sm },
  disconnectBtn: {
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  disconnectBtnText: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  comingSoon: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  comingSoonText: { fontSize: FONT_SIZE.sm },
});
