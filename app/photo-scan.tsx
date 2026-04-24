import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/constants/Spacing';
import { scanMealPhoto, AnthropicServiceError } from '@/services/anthropic';
import { useLogFlowStore } from '@/store/logFlowStore';
import CameraPermissionPrompt from '@/components/CameraPermissionPrompt';

type ScanState = 'ready' | 'scanning' | 'error';

const ERROR_MESSAGES: Record<string, string> = {
  network: 'Check your connection and try again.',
  parse: "Couldn't identify the meal — try retaking the photo.",
  anthropic: 'Scan failed — you can search manually instead.',
};

export default function PhotoScanScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('ready');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const setPendingPhotoItems = useLogFlowStore((s) => s.setPendingPhotoItems);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || scanState === 'scanning') return;
    setScanState('scanning');
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) throw new AnthropicServiceError('network', 'Camera capture failed');
      const result = await scanMealPhoto(photo.uri);
      if (!result.items || result.items.length === 0) {
        throw new AnthropicServiceError('parse', 'No food items detected');
      }
      setPendingPhotoItems(result.items);
      router.push('/photo-confirm');
    } catch (err) {
      const type = err instanceof AnthropicServiceError ? err.errorType : 'anthropic';
      setErrorMessage(ERROR_MESSAGES[type] ?? ERROR_MESSAGES['anthropic']!);
      setScanState('error');
    }
  }, [scanState, setPendingPhotoItems]);

  const handleReset = useCallback(() => {
    setErrorMessage(null);
    setScanState('ready');
  }, []);

  const screenOptions = {
    title: 'Photo Scan',
    headerStyle: { backgroundColor: colors.card },
    headerTintColor: colors.text,
    headerShadowVisible: false,
  };

  if (!permission) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  if (!permission.granted) {
    return (
      <>
        <Stack.Screen options={screenOptions} />
        <CameraPermissionPrompt
          body="Allow camera access to photograph your meal."
          canAskAgain={permission.canAskAgain}
          onRequest={requestPermission}
        />
      </>
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
          <Text style={styles.primaryBtnText}>Search Manually</Text>
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
        <Text style={styles.hint}>Frame your meal, then tap Scan</Text>
        {errorCard}
        {captureBtn}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
});
