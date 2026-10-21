import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import type { AppIcon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { RingsArt, Tile, TileGrid } from '@/components/tiles';
import { Button, Card, CardTitle, IconTile, Screen } from '@/components/ui';
import { Spacing, type GradientName } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { exportBackup, restoreBackup, summarizeBackup } from '@/lib/backup';
import {
  mergeHealthImport,
  pickTransferFile,
  summarizeImport,
  type HealthImport,
} from '@/lib/transfer';

function count(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

function confirm(title: string, message: string, action: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: action, onPress: () => resolve(true) },
    ]),
  );
}

export default function TransferScreen() {
  const db = useSQLiteContext();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [preview, setPreview] = useState<HealthImport | null>(null);

  async function chooseFile() {
    setStatus(null);
    setPreview(null);
    const picked = await pickTransferFile().catch(() => null);
    if (!picked) return;
    if (picked.kind === 'zip') {
      setStatus(
        'That’s a zip file. Unzip it first (tap it in the Files app), then choose the export.xml inside.',
      );
      return;
    }
    if (picked.kind === 'unknown') {
      setStatus(
        'Kenko doesn’t recognise that file. Choose an Apple Health export.xml, a Samsung step_daily_trend CSV, a Google Fit Daily activity metrics CSV or a Kenko transfer file.',
      );
      return;
    }
    if (picked.kind === 'kenko') {
      const s = summarizeBackup(picked.backup);
      const ok = await confirm(
        'Move this Kenko data here?',
        `From ${s.exportedAt.toLocaleDateString()}: ${s.workouts} workouts, ${s.meals} meals and ${s.checkins} check-ins. Everything currently on this phone will be replaced.`,
        'Replace',
      );
      if (!ok) return;
      setBusy(true);
      try {
        await restoreBackup(db, picked.backup);
        setStatus('Done! Your Kenko history has moved to this phone.');
      } catch {
        setStatus('Transfer failed — your existing data was left unchanged.');
      } finally {
        setBusy(false);
      }
      return;
    }
    setPreview(picked.data);
  }

  async function importPreview() {
    if (!preview) return;
    setBusy(true);
    try {
      const added = await mergeHealthImport(db, preview);
      setStatus(
        `Imported from ${preview.source}: ${count(added.workouts, 'workout')}, ${count(added.stepDays, 'day')} of steps, ${count(added.vitals, 'heart reading')} and ${count(added.mindful, 'mindful session')}.`,
      );
      setPreview(null);
    } catch {
      setStatus('Import failed — nothing was changed.');
    } finally {
      setBusy(false);
    }
  }

  const summary = preview ? summarizeImport(preview) : null;

  return (
    <Screen tabs={false}>
      <TileGrid>
        <Tile
          title="Transfer data"
          color="energy"
          wide
          height="auto"
          art={<RingsArt icon={{ mci: 'swap-horizontal' }} color="#5B8CFF" size={130} />}>
          <ThemedText type="quote" style={styles.heroTitle}>
            iPhone ⇄ Android, without losing a day.
          </ThemedText>
          <ThemedText style={styles.heroBody}>
            Move your Kenko history between phones, or bring in years of steps and workouts from
            Apple Health, Samsung Health and Google Fit.
          </ThemedText>
        </Tile>
      </TileGrid>

      <Card>
        <CardTitle>Switching phones</CardTitle>
        <Step
          n={1}
          text="On your old phone, open Kenko › Profile › Transfer data and tap Export."
        />
        <Step
          n={2}
          text="Send the file to your new phone — Google Drive, iCloud Drive, email or Quick Share all work."
        />
        <Step n={3} text="On the new phone, install Kenko, come here and tap Import a file." />
        <Button
          label="Export Kenko transfer file"
          icon={{ mci: 'export-variant' }}
          disabled={busy}
          onPress={async () => {
            await exportBackup(db);
            setStatus('Transfer file created. Send it to your other phone.');
          }}
        />
      </Card>

      <Source
        icon={{ mci: 'apple' }}
        color="move"
        title="From Apple Health"
        detail="Workouts, steps, resting heart rate, blood pressure and mindful minutes."
        steps={[
          'Open the Health app and tap your profile picture.',
          'Tap Export All Health Data, then Export, and save to Files.',
          'In Files, tap the export.zip to unzip it.',
          'Tap Import a file below and choose export.xml.',
        ]}
      />
      <Source
        icon={{ mci: 'android' }}
        color="tint"
        title="From Samsung Health"
        detail="Daily step history."
        steps={[
          'In Samsung Health, open Settings › Download personal data.',
          'Open the downloaded folder in My Files.',
          'Tap Import a file below and choose the file starting with com.samsung.shealth.step_daily_trend.',
        ]}
      />
      <Source
        icon={{ mci: 'google-fit' }}
        color="sky"
        title="From Google Fit"
        detail="Daily step history."
        steps={[
          'Go to takeout.google.com, select only Fit, and create the export.',
          'Unzip the download and find Fit › Daily activity metrics.',
          'Tap Import a file below and choose Daily activity metrics.csv.',
        ]}
      />

      <Button
        label="Import a file"
        icon={{ mci: 'file-import' }}
        disabled={busy}
        onPress={chooseFile}
      />

      {preview && summary && (
        <Card accent="tint">
          <CardTitle>Ready to import from {preview.source}</CardTitle>
          <ThemedText>
            {count(summary.workouts, 'workout')} · {count(summary.stepDays, 'day')} of steps ·{' '}
            {count(summary.vitals, 'heart reading')} · {count(summary.mindful, 'mindful session')}
          </ThemedText>
          {summary.from && (
            <ThemedText type="small" themeColor="textSecondary">
              {summary.from} to {summary.to ?? 'today'} · anything already in Kenko is skipped.
            </ThemedText>
          )}
          <Button label="Add to Kenko" disabled={busy} onPress={importPreview} />
          <Button label="Cancel" variant="secondary" onPress={() => setPreview(null)} />
        </Card>
      )}

      {status && (
        <Card>
          <ThemedText type="smallBold">{status}</ThemedText>
        </Card>
      )}

      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        Files are read only on this phone — nothing is uploaded. Kenko can’t write into Apple Health
        or Health Connect directly; that needs a native build and is on the roadmap.
      </ThemedText>
    </Screen>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.step}>
      <View style={[styles.stepNumber, { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText type="smallBold">{n}</ThemedText>
      </View>
      <ThemedText style={styles.flex}>{text}</ThemedText>
    </View>
  );
}

function Source({
  icon,
  color,
  title,
  detail,
  steps,
}: {
  icon: AppIcon;
  color: GradientName;
  title: string;
  detail: string;
  steps: string[];
}) {
  return (
    <Card>
      <View style={styles.sourceHead}>
        <IconTile icon={icon} color={color} />
        <View style={styles.flex}>
          <ThemedText type="heading">{title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {detail}
          </ThemedText>
        </View>
      </View>
      {steps.map((s, i) => (
        <Step key={i} n={i + 1} text={s} />
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 31,
    marginTop: Spacing.two,
    marginRight: 90,
  },
  heroBody: {
    color: 'rgba(255,255,255,0.9)',
    marginTop: Spacing.two,
  },
  step: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceHead: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
  },
});
