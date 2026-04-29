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
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { BORDER_RADIUS, SPACING } from '@/constants/Spacing';
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
  const tokens = useTokens();
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

  const cardShadow = {
    shadowColor: '#1A1A1A',
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  } as const;

  const statusSection = (
    <View style={[styles.statusCard, { backgroundColor: tokens.bg.surface }, cardShadow]}>
      <View style={styles.statusRow}>
        <Text style={[Type.textXs, { color: tokens.text.secondary }]}>STATUS</Text>
        <View style={[styles.badge, { backgroundColor: isConnected ? tokens.status.success : tokens.bg.surfaceMuted }]}>
          <Text style={[Type.textXs, { color: isConnected ? '#FFFFFF' : tokens.text.secondary }]}>
            {isConnected ? 'Connected' : 'Not connected'}
          </Text>
        </View>
      </View>
      <Text style={[Type.textLg, { color: tokens.text.primary }]}>{TIER_LABEL[connectionTier]}</Text>
      {isConnected && (
        <View style={styles.syncRow}>
          <Text style={[Type.monoSm, { color: tokens.text.secondary }]}>
            Last synced: {syncing ? 'syncing…' : lastSyncLabel}
          </Text>
          {syncing && <ActivityIndicator size="small" color={tokens.accent.primary} />}
        </View>
      )}
    </View>
  );

  const connectSection = (
    <View style={styles.optionList}>
      <Text style={[Type.textXs, { color: tokens.text.secondary }, styles.sectionTitle]}>
        CONNECTION METHOD
      </Text>

      {(['zepp', 'healthconnect', 'applehealth', 'manual'] as const).map((tier) => {
        const isActive = connectionTier === tier;
        return (
          <TouchableOpacity
            key={tier}
            style={[
              styles.optionCard,
              {
                backgroundColor: tokens.bg.surface,
                borderBottomColor: tokens.border.hairline,
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
              <Text style={[Type.textLg, { color: tokens.text.primary }]}>{TIER_LABEL[tier]}</Text>
              <Text style={[Type.textSm, { color: tokens.text.secondary }]}>
                {tier === 'zepp' && 'OAuth via Zepp app — requires ZEPP_CLIENT_ID'}
                {tier === 'healthconnect' && 'Android Health Connect — requires dev build'}
                {tier === 'applehealth' && 'iOS Apple Health — requires dev build'}
                {tier === 'manual' && 'Enter calories burned manually on the home screen'}
              </Text>
            </View>
            {isActive && (
              <View style={[styles.activeDot, { backgroundColor: tokens.accent.primary }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: tokens.bg.primary }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + SPACING.md, paddingBottom: insets.bottom + 120 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[Type.displayTitle, { color: tokens.text.primary }, styles.heading]}>
        Settings
      </Text>

      <Text style={[Type.textXs, { color: tokens.text.secondary }, styles.sectionHeading]}>
        AMAZFIT / WATCH
      </Text>
      {statusSection}
      {connectSection}
      {isConnected && (
        <TouchableOpacity
          style={[styles.disconnectBtn, { borderColor: tokens.status.danger }]}
          onPress={handleDisconnect}
          activeOpacity={0.8}
        >
          <Text style={[Type.textMd, { color: tokens.status.danger }]}>Disconnect</Text>
        </TouchableOpacity>
      )}

      <Text style={[Type.textXs, { color: tokens.text.secondary }, styles.sectionHeading]}>
        PROFILE
      </Text>
      <View style={[styles.comingSoon, { backgroundColor: tokens.bg.surface }, cardShadow]}>
        <Text style={[Type.textSm, { color: tokens.text.secondary }]}>Coming soon</Text>
      </View>

      <Text style={[Type.textXs, { color: tokens.text.secondary }, styles.sectionHeading]}>
        DAILY TARGETS
      </Text>
      <View style={[styles.comingSoon, { backgroundColor: tokens.bg.surface }, cardShadow]}>
        <Text style={[Type.textSm, { color: tokens.text.secondary }]}>Coming soon</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: SPACING.md, gap: SPACING.sm },
  heading: { marginBottom: SPACING.sm },
  sectionHeading: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  statusCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.cardPad,
    gap: SPACING.xs,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 2 },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  optionList: { gap: 0 },
  sectionTitle: { marginBottom: SPACING.xs },
  optionCard: {
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderBottomWidth: 1,
  },
  optionInfo: { flex: 1 },
  activeDot: { width: 10, height: 10, borderRadius: 5, marginLeft: SPACING.sm },
  disconnectBtn: {
    height: 48,
    borderRadius: BORDER_RADIUS.button,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  comingSoon: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
  },
});
