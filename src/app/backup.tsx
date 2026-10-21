import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, CardTitle, IconTile, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import {
  exportBackup,
  pickBackup,
  restoreBackup,
  summarizeBackup,
  type Backup,
} from '@/lib/backup';

function confirm(title: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Restore', style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}

export default function BackupScreen() {
  const db = useSQLiteContext();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onExport() {
    setBusy(true);
    setStatus(null);
    try {
      await exportBackup(db);
      setStatus('Backup created. Save it somewhere safe — Google Drive works great.');
    } catch {
      setStatus('Couldn’t create the backup. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function onRestore() {
    setStatus(null);
    let backup: Backup | null;
    try {
      backup = await pickBackup();
    } catch (e) {
      setStatus((e as Error).message);
      return;
    }
    if (!backup) return;
    const s = summarizeBackup(backup);
    const ok = await confirm(
      'Replace data on this phone?',
      `This backup is from ${s.exportedAt.toLocaleDateString()} and has ${s.workouts} workouts, ${s.meals} meals and ${s.checkins} check-ins. Everything currently on this phone will be replaced.`,
    );
    if (!ok) return;
    setBusy(true);
    try {
      await restoreBackup(db, backup);
      setStatus('Restored! Your history is back.');
    } catch {
      setStatus('Restore failed — your existing data was left unchanged.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen tabs={false}>
      <Card>
        <View style={styles.row}>
          <IconTile icon={{ mci: 'database-lock' }} color="tint" />
          <View style={styles.flex}>
            <ThemedText type="heading">Stored on your phone</ThemedText>
            <ThemedText themeColor="textSecondary">
              Kenko keeps everything in a private database on this device. Nothing is sent to a
              Kenko server.
            </ThemedText>
          </View>
        </View>
      </Card>

      <Card accent="sky">
        <CardTitle>Automatic backup</CardTitle>
        <AutoRow
          icon={{ mci: 'google-drive' }}
          title="Android — Google backup"
          body="Kenko's data is included in your phone's Google backup. Make sure it's on in Settings › Google › Backup. Android backs up about once a day on Wi-Fi while charging, and restores it when you set up a new phone with the same Google account."
        />
        <AutoRow
          icon={{ mci: 'apple-icloud' }}
          title="iPhone — iCloud Backup"
          body="Included in your iPhone's iCloud Backup (Settings › your name › iCloud › iCloud Backup)."
        />
      </Card>

      <Card>
        <CardTitle>Backup file</CardTitle>
        <ThemedText themeColor="textSecondary">
          Export a copy of all your data to keep in Google Drive or your files, or to move to
          another phone. You can restore it at any time.
        </ThemedText>
        <Button
          label="Export backup"
          icon={{ mci: 'cloud-upload' }}
          disabled={busy}
          onPress={onExport}
        />
        <Button
          label="Restore from file"
          variant="secondary"
          icon={{ mci: 'cloud-download' }}
          disabled={busy}
          onPress={onRestore}
        />
        {status && <ThemedText type="smallBold">{status}</ThemedText>}
      </Card>

      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        Backup files contain your health notes and journal. Store them somewhere private.
      </ThemedText>
    </Screen>
  );
}

function AutoRow({
  icon,
  title,
  body,
}: {
  icon: React.ComponentProps<typeof IconTile>['icon'];
  title: string;
  body: string;
}) {
  return (
    <View style={styles.row}>
      <IconTile icon={icon} color="sky" size={40} />
      <View style={styles.flex}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {body}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    gap: Spacing.half,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  center: {
    textAlign: 'center',
  },
});
