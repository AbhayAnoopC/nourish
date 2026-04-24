import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/constants/Spacing';

interface Props {
  onConnectZepp: () => void;
  onConnectHealth: () => void;
  onDismiss: () => void;
}

export function WatchNudgeCard({ onConnectZepp, onConnectHealth, onDismiss }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: colors.text }]}>Connect your watch</Text>
        <Text style={[styles.body, { color: colors.placeholder }]}>
          Link your Amazfit to automatically track calories burned.
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
          onPress={onConnectZepp}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>Zepp</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
          onPress={onConnectHealth}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>Health</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dismissBtn, { borderColor: colors.border }]}
          onPress={onDismiss}
          activeOpacity={0.8}
        >
          <Text style={[styles.dismissBtnText, { color: colors.placeholder }]}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  textBlock: {
    gap: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  body: {
    fontSize: FONT_SIZE.sm,
    lineHeight: FONT_SIZE.sm * 1.5,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  dismissBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  dismissBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
});
