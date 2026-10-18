import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { FONT_SIZE, SPACING } from '@/constants/Spacing';
import { BORDER_RADIUS } from '@/constants/Spacing';

interface CameraPermissionPromptProps {
  title?: string;
  body?: string;
  canAskAgain: boolean;
  onRequest: () => void;
}

export default function CameraPermissionPrompt({
  title = 'Camera Access Needed',
  body = 'Allow camera access to use this feature.',
  canAskAgain,
  onRequest,
}: CameraPermissionPromptProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const action = canAskAgain ? (
    <TouchableOpacity
      style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
      onPress={onRequest}
      activeOpacity={0.8}
    >
      <Text style={styles.primaryBtnText}>Allow Camera</Text>
    </TouchableOpacity>
  ) : (
    <TouchableOpacity onPress={() => Linking.openSettings()} activeOpacity={0.8}>
      <Text style={[styles.settingsLink, { color: colors.tint }]}>Open Settings</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.body, { color: colors.placeholder }]}>{body}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  body: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: FONT_SIZE.md * 1.5,
  },
  primaryBtn: {
    height: 44,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },
  settingsLink: { fontSize: FONT_SIZE.md, fontWeight: '600', marginTop: SPACING.md },
});
