import { useCameraPermissions } from 'expo-camera';
import * as Notifications from 'expo-notifications';
import { useLocalSearchParams } from 'expo-router';
import { Pedometer } from 'expo-sensors';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Platform, StyleSheet, View } from 'react-native';

import { Icon, type AppIcon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, IconTile, Screen } from '@/components/ui';
import { Spacing, type GradientName } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { goBack } from '@/lib/navigation';

type Status = 'granted' | 'denied' | 'undetermined' | 'unavailable';

type PermissionResult = { granted: boolean; canAskAgain: boolean };

function toStatus(p: PermissionResult | null): Status {
  if (!p) return 'undetermined';
  if (p.granted) return 'granted';
  return p.canAskAgain ? 'undetermined' : 'denied';
}

const isWeb = Platform.OS === 'web';

async function readStatuses(): Promise<{ motion: Status; notifications: Status }> {
  const available = await Pedometer.isAvailableAsync().catch(() => false);
  return {
    motion: available ? toStatus(await Pedometer.getPermissionsAsync()) : 'unavailable',
    notifications: toStatus(await Notifications.getPermissionsAsync()),
  };
}

export default function PermissionsScreen() {
  const { welcome } = useLocalSearchParams<{ welcome?: string }>();
  const [camera, requestCamera] = useCameraPermissions();
  const [motion, setMotion] = useState<Status>(isWeb ? 'unavailable' : 'undetermined');
  const [notifications, setNotifications] = useState<Status>(
    isWeb ? 'unavailable' : 'undetermined',
  );

  const refresh = useCallback(() => {
    if (isWeb) return;
    readStatuses().then(({ motion, notifications }) => {
      setMotion(motion);
      setNotifications(notifications);
    });
  }, []);

  // Re-check when coming back from the system Settings app.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => sub.remove();
  }, [refresh]);
  useEffect(() => {
    if (isWeb) return;
    readStatuses().then(({ motion, notifications }) => {
      setMotion(motion);
      setNotifications(notifications);
    });
  }, []);

  async function ask(request: () => Promise<PermissionResult>) {
    await request();
    refresh();
  }

  return (
    <Screen tabs={false}>
      {welcome === '1' && (
        <View style={styles.intro}>
          <ThemedText type="quote" style={styles.introTitle}>
            A few permissions.
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            Each one is optional and only used for the feature described. You can change them at any
            time in your phone&apos;s settings.
          </ThemedText>
        </View>
      )}

      <PermissionCard
        icon={{ mci: 'shoe-print' }}
        color="calm"
        title="Motion & fitness"
        body={
          Platform.OS === 'ios'
            ? 'Reads your step count from the iPhone’s motion sensor for the Steps card, activity trends and step badges.'
            : 'Lets Kenko count steps with the phone’s step sensor while the app is open.'
        }
        status={motion}
        onAllow={() => ask(Pedometer.requestPermissionsAsync)}
      />
      <PermissionCard
        icon={{ mci: 'bell-ring' }}
        color="warm"
        title="Notifications"
        body="For your reminders and the live workout notification that shows your time and calories while you train."
        status={notifications}
        onAllow={() => ask(Notifications.requestPermissionsAsync)}
      />
      <PermissionCard
        icon={{ mci: 'barcode-scan' }}
        color="tint"
        title="Camera"
        body="Only used to scan barcodes on packaged food. Images are never saved or uploaded."
        status={isWeb ? 'unavailable' : toStatus(camera)}
        onAllow={() => ask(requestCamera)}
      />

      {welcome === '1' && <Button label="Continue" onPress={goBack} />}
    </Screen>
  );
}

function PermissionCard({
  icon,
  color,
  title,
  body,
  status,
  onAllow,
}: {
  icon: AppIcon;
  color: GradientName;
  title: string;
  body: string;
  status: Status;
  onAllow: () => void;
}) {
  const theme = useTheme();
  const badge = {
    granted: { label: 'Allowed', color: theme.tintText, icon: 'check-circle' as const },
    denied: { label: 'Off', color: theme.danger, icon: 'close-circle' as const },
    undetermined: { label: 'Not set', color: theme.textSecondary, icon: 'help-circle' as const },
    unavailable: {
      label: isWeb ? 'Phone only' : 'Not on this device',
      color: theme.textSecondary,
      icon: 'minus-circle' as const,
    },
  }[status];

  return (
    <Card>
      <View style={styles.row}>
        <IconTile icon={icon} color={color} />
        <View style={styles.flex}>
          <View style={styles.titleRow}>
            <ThemedText type="heading" style={styles.flex}>
              {title}
            </ThemedText>
            <View style={styles.badge}>
              <Icon name={{ mci: badge.icon }} size={16} color={badge.color} />
              <ThemedText type="smallBold" style={{ color: badge.color }}>
                {badge.label}
              </ThemedText>
            </View>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {body}
          </ThemedText>
        </View>
      </View>
      {status === 'undetermined' && (
        <Button label={`Allow ${title.toLowerCase()}`} onPress={onAllow} />
      )}
      {status === 'denied' && (
        <Button label="Open settings" variant="secondary" onPress={() => Linking.openSettings()} />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  intro: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  introTitle: {
    fontSize: 32,
    lineHeight: 38,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  flex: {
    flex: 1,
    gap: Spacing.one,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
