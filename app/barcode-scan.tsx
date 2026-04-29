import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { BORDER_RADIUS, SPACING } from '@/constants/Spacing';
import { lookupByBarcode as offLookup } from '@/services/openFoodFacts';
import { lookupByBarcode as usdaLookup } from '@/services/usda';
import { useLogFlowStore } from '@/store/logFlowStore';

type ScanState = 'scanning' | 'loading' | 'not_found' | 'error';

export default function BarcodeScanScreen() {
  const tokens = useTokens();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const setPendingItem = useLogFlowStore((s) => s.setPendingItem);
  const isProcessingRef = useRef(false);

  const handleBarcodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      setScanState('loading');

      try {
        let result = await offLookup(data);

        if (!result) {
          result = await usdaLookup(data);
        }

        if (result) {
          setPendingItem(result);
          router.push('/confirm-food');
          return;
        }

        setScanState('not_found');
      } catch {
        setErrorMessage('Could not reach the food database. Check your internet connection.');
        setScanState('error');
      }
    },
    [setPendingItem],
  );

  const handleReset = useCallback(() => {
    isProcessingRef.current = false;
    setErrorMessage(null);
    setScanState('scanning');
  }, []);

  const handleManualSearch = useCallback(() => {
    router.replace('/food-search');
  }, []);

  const screenOptions = {
    title: 'Scan Barcode',
    headerStyle: { backgroundColor: tokens.bg.surface },
    headerTintColor: tokens.text.primary,
    headerShadowVisible: false,
  };

  if (!permission) {
    return <View style={[styles.container, { backgroundColor: tokens.bg.primary }]} />;
  }

  if (!permission.granted) {
    const canAsk = permission.canAskAgain;
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: tokens.bg.primary }]}>
        <Stack.Screen options={screenOptions} />
        <Text style={[Type.displayTitle, { color: tokens.text.primary }, styles.permissionTitle]}>
          Camera Access Needed
        </Text>
        <Text style={[Type.textMd, { color: tokens.text.secondary }, styles.permissionBody]}>
          Allow camera access to scan product barcodes.
        </Text>
        {canAsk ? (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: tokens.accent.primary }]}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <Text style={[Type.textMd, styles.primaryButtonText]}>Allow Camera</Text>
          </TouchableOpacity>
        ) : (
          <Text style={[Type.textSm, { color: tokens.text.secondary }, styles.settingsHint]}>
            Camera permission was denied. Please enable it in Settings.
          </Text>
        )}
      </View>
    );
  }

  const isScanning = scanState === 'scanning';

  const overlay = (
    <View style={[styles.overlay, { paddingBottom: insets.bottom + SPACING.xl }]}>
      <View style={styles.finderFrame}>
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
      </View>

      <View style={styles.statusArea}>
        {isScanning && (
          <Text style={[Type.textMd, styles.hintText]}>Point at a barcode</Text>
        )}

        {scanState === 'loading' && (
          <View style={[styles.feedbackCard, { backgroundColor: tokens.bg.surface }]}>
            <ActivityIndicator size="small" color={tokens.accent.primary} />
            <Text style={[Type.textMd, { color: tokens.text.primary }]}>Looking up product…</Text>
          </View>
        )}

        {scanState === 'not_found' && (
          <View style={[styles.feedbackCard, { backgroundColor: tokens.bg.surface }]}>
            <Text style={[Type.textXl, { color: tokens.text.primary }]}>Product not found</Text>
            <Text style={[Type.textSm, { color: tokens.text.secondary }, styles.feedbackBody]}>
              This barcode isn't in our database.
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: tokens.accent.primary }]}
                onPress={handleReset}
                activeOpacity={0.8}
              >
                <Text style={[Type.textMd, { color: tokens.accent.primary }]}>Scan Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: tokens.accent.primary }]}
                onPress={handleManualSearch}
                activeOpacity={0.8}
              >
                <Text style={[Type.textMd, styles.primaryButtonText]}>Manual Search</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {scanState === 'error' && (
          <View style={[styles.feedbackCard, { backgroundColor: tokens.bg.surface }]}>
            <Text style={[Type.textXl, { color: tokens.status.danger }]}>Error</Text>
            <Text style={[Type.textSm, { color: tokens.text.secondary }, styles.feedbackBody]}>{errorMessage}</Text>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: tokens.accent.primary }]}
              onPress={handleReset}
              activeOpacity={0.8}
            >
              <Text style={[Type.textMd, styles.primaryButtonText]}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <Stack.Screen options={screenOptions} />
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
        }}
        onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
      />
      {overlay}
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;
const FINDER_SIZE = 240;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.xxl,
  },
  finderFrame: {
    width: FINDER_SIZE,
    height: FINDER_SIZE,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#FFFFFF',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: BORDER_RADIUS.sm,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: BORDER_RADIUS.sm,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: BORDER_RADIUS.sm,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: BORDER_RADIUS.sm,
  },
  statusArea: {
    width: '100%',
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  hintText: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  feedbackCard: {
    width: '100%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  feedbackBody: {
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  primaryButton: {
    height: 44,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  secondaryButton: {
    height: 44,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.button,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: {
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  permissionBody: {
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  settingsHint: {
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
