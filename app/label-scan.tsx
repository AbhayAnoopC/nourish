import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/constants/Spacing';
import { scanNutritionLabel, AnthropicServiceError } from '@/services/anthropic';
import { useLogFlowStore } from '@/store/logFlowStore';

type ScanState = 'ready' | 'scanning' | 'error';

const ERROR_MESSAGES: Record<string, string> = {
  network: 'Check your connection and try again.',
  parse: "Couldn't read that — try moving closer and retrying.",
  anthropic: 'Scan failed — you can enter the details manually.',
};

export default function LabelScanScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('ready');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const setPendingLabelResult = useLogFlowStore((s) => s.setPendingLabelResult);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || scanState === 'scanning') return;
    setScanState('scanning');

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) throw new AnthropicServiceError('network', 'Camera capture failed');
      const result = await scanNutritionLabel(photo.uri);
      setPendingLabelResult(result);
      router.push('/pantry-confirm');
    } catch (err) {
      const type =
        err instanceof AnthropicServiceError ? err.errorType : 'anthropic';
      setErrorMessage(ERROR_MESSAGES[type] ?? ERROR_MESSAGES['anthropic']!);
      setScanState('error');
    }
  }, [scanState, setPendingLabelResult]);

  const handleReset = useCallback(() => {
    setErrorMessage(null);
    setScanState('ready');
  }, []);

  const screenOptions = {
    title: 'Scan Nutrition Label',
    headerStyle: { backgroundColor: colors.card },
    headerTintColor: colors.text,
    headerShadowVisible: false,
  };

  if (!permission) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  if (!permission.granted) {
    const permissionAction = permission.canAskAgain ? (
      <TouchableOpacity
        style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
        onPress={requestPermission}
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
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={screenOptions} />
        <Text style={[styles.permTitle, { color: colors.text }]}>Camera Access Needed</Text>
        <Text style={[styles.permBody, { color: colors.placeholder }]}>
          Allow camera access to scan nutrition labels.
        </Text>
        {permissionAction}
      </View>
    );
  }

  const errorCard = scanState === 'error' ? (
    <View style={[styles.feedbackCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.feedbackText, { color: colors.danger }]}>{errorMessage}</Text>
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.secondaryBtn, { borderColor: colors.tint }]}
          onPress={handleReset}
          activeOpacity={0.8}
        >
          <Text style={[styles.secondaryBtnText, { color: colors.tint }]}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
          onPress={() => router.replace('/food-search')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>Enter Manually</Text>
        </TouchableOpacity>
      </View>
    </View>
  ) : null;

  const captureBtn = scanState !== 'error' ? (
    <TouchableOpacity
      style={[styles.captureBtn, { backgroundColor: colors.tint }]}
      onPress={handleCapture}
      disabled={scanState === 'scanning'}
      activeOpacity={0.8}
    >
      {scanState === 'scanning' ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.captureBtnText}>Scan</Text>
      )}
    </TouchableOpacity>
  ) : null;

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <Stack.Screen options={screenOptions} />
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <View style={[styles.overlay, { paddingBottom: insets.bottom + SPACING.xl }]}>
        <Text style={styles.hint}>Point camera at the nutrition label, then tap Scan</Text>
        {errorCard}
        {captureBtn}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  camera: { ...StyleSheet.absoluteFillObject },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
  },
  hint: {
    color: '#fff',
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    marginBottom: SPACING.lg,
  },
  feedbackCard: {
    width: '100%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  feedbackText: { fontSize: FONT_SIZE.md, textAlign: 'center' },
  btnRow: { flexDirection: 'row', gap: SPACING.sm },
  primaryBtn: {
    height: 44,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },
  secondaryBtn: {
    height: 44,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  captureBtn: {
    width: 120,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnText: { color: '#fff', fontSize: FONT_SIZE.lg, fontWeight: '700' },
  permTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  permBody: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: FONT_SIZE.md * 1.5,
  },
  settingsLink: { fontSize: FONT_SIZE.md, fontWeight: '600', marginTop: SPACING.md },
});
