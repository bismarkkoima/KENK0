import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { getFoodByBarcode } from '@/lib/open-food-facts';

type Status =
  | { kind: 'scanning' }
  | { kind: 'looking-up'; code: string }
  | { kind: 'not-found'; code: string }
  | { kind: 'error'; code: string };

export default function ScanScreen() {
  const params = useLocalSearchParams<{ day?: string; mealType?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState<Status>({ kind: 'scanning' });
  // The camera fires many events per second; only handle one code at a time.
  const busy = useRef(false);

  async function onScanned({ data }: BarcodeScanningResult) {
    if (busy.current) return;
    busy.current = true;
    setStatus({ kind: 'looking-up', code: data });
    try {
      const food = await getFoodByBarcode(data);
      if (!food) {
        setStatus({ kind: 'not-found', code: data });
        return;
      }
      router.dismissTo({
        pathname: '/add-meal',
        params: { ...params, food: JSON.stringify(food) },
      });
    } catch {
      setStatus({ kind: 'error', code: data });
    }
  }

  function scanAgain() {
    busy.current = false;
    setStatus({ kind: 'scanning' });
  }

  if (!permission) {
    return <ThemedView style={styles.fill} />;
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.message}>
          <ThemedText type="subtitle">Scan a barcode</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.center}>
            Kenko needs camera access to read barcodes on packaged food. Images are never saved or
            uploaded.
          </ThemedText>
          {permission.canAskAgain ? (
            <Button label="Allow camera" onPress={requestPermission} />
          ) : (
            <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
              Camera access is turned off. Enable it for Kenko in your device settings.
            </ThemedText>
          )}
          <Button label="Cancel" variant="secondary" onPress={() => router.back()} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <View style={styles.fill}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
        onBarcodeScanned={status.kind === 'scanning' ? onScanned : undefined}
      />
      <SafeAreaView style={styles.overlay}>
        <View style={styles.top}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.pill}>
            <ThemedText type="smallBold" style={styles.light}>
              Close
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.frame} />

        <View style={styles.panel}>
          {status.kind === 'scanning' && (
            <ThemedText style={[styles.light, styles.center]}>
              Point the camera at the barcode on the package
            </ThemedText>
          )}
          {status.kind === 'looking-up' && <ActivityIndicator color="#ffffff" />}
          {status.kind === 'not-found' && (
            <>
              <ThemedText style={[styles.light, styles.center]}>
                No nutrition info found for {status.code}.
              </ThemedText>
              <Button label="Scan again" onPress={scanAgain} />
              <Button label="Enter manually" variant="secondary" onPress={() => router.back()} />
            </>
          )}
          {status.kind === 'error' && (
            <>
              <ThemedText style={[styles.light, styles.center]}>
                Couldn&apos;t look up that barcode. Check your connection and try again.
              </ThemedText>
              <Button label="Try again" onPress={scanAgain} />
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: '#000000',
  },
  message: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  center: {
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: Spacing.three,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  pill: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
  },
  light: {
    color: '#ffffff',
  },
  frame: {
    alignSelf: 'center',
    width: '80%',
    maxWidth: 360,
    aspectRatio: 1.8,
    borderWidth: 3,
    borderColor: '#ffffff',
    borderRadius: Spacing.three,
  },
  panel: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
    minHeight: 64,
    justifyContent: 'center',
  },
});
