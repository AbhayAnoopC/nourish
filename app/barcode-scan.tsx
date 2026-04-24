import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/constants/Spacing';
import { lookupByBarcode as offLookup } from '@/services/openFoodFacts';
import { lookupByBarcode as usdaLookup } from '@/services/usda';
import { useLogFlowStore } from '@/store/logFlowStore';

type ScanState = 'scanning' | 'loading' | 'not_found' | 'error';

export default function BarcodeScanScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
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
    headerStyle: { backgroundColor: colors.card },
    headerTintColor: colors.text,
    headerShadowVisible: false,
  };

  if (!permission) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  if (!permission.granted) {
    const canAsk = permission.canAskAgain;
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={screenOptions} />
        <Text style={[styles.permissionTitle, { color: colors.text }]}>Camera Access Needed</Text>
        <Text style={[styles.permissionBody, { color: colors.placeholder }]}>
          Allow camera access to scan product barcodes.
        </Text>
        {canAsk ? (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.tint }]}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Allow Camera</Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.settingsHint, { color: colors.placeholder }]}>
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
          <Text style={styles.hintText}>Point at a barcode</Text>
        )}

        {scanState === 'loading' && (
          <View style={[styles.feedbackCard, { backgroundColor: colors.card }]}>
            <ActivityIndicator size="small" color={colors.tint} />
            <Text style={[styles.feedbackText, { color: colors.text }]}>Looking up product…</Text>
          </View>
        )}

        {scanState === 'not_found' && (
          <View style={[styles.feedbackCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.feedbackTitle, { color: colors.text }]}>Product not found</Text>
            <Text style={[styles.feedbackBody, { color: colors.placeholder }]}>
              This barcode isn't in our database.
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.tint }]}
                onPress={handleReset}
                activeOpacity={0.8}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.tint }]}>Scan Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.tint }]}
                onPress={handleManualSearch}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Manual Search</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {scanState === 'error' && (
          <View style={[styles.feedbackCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.feedbackTitle, { color: colors.danger }]}>Error</Text>
            <Text style={[styles.feedbackBody, { color: colors.placeholder }]}>{errorMessage}</Text>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.tint }]}
              onPress={handleReset}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Try Again</Text>
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
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
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
  feedbackText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  feedbackTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  feedbackBody: {
    fontSize: FONT_SIZE.sm,
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
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 44,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  permissionTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  permissionBody: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: FONT_SIZE.md * 1.5,
  },
  settingsHint: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
