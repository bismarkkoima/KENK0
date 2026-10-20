import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useFocusedQuery } from '@/hooks/use-focused-query';
import { useTheme } from '@/hooks/use-theme';
import {
  describeReminder,
  ensurePermission,
  formatTime,
  getReminders,
  REMINDER_INFO,
  remindersSupported,
  saveReminders,
  shiftTime,
  type Reminder,
} from '@/lib/reminders';

export default function RemindersScreen() {
  const { data } = useFocusedQuery(getReminders);
  if (!remindersSupported) {
    return (
      <Screen tabs={false}>
        <ThemedText themeColor="textSecondary">
          Reminders use your phone&apos;s notifications. Open Kenko on iOS or Android to set them
          up.
        </ThemedText>
      </Screen>
    );
  }
  if (!data) return <Screen tabs={false} />;
  return <RemindersForm initial={data} />;
}

function RemindersForm({ initial }: { initial: Reminder[] }) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [reminders, setReminders] = useState(initial);
  const [denied, setDenied] = useState(false);

  async function update(next: Reminder) {
    if (next.enabled && !(await ensurePermission())) {
      setDenied(true);
      return;
    }
    setDenied(false);
    const all = reminders.map((r) => (r.id === next.id ? next : r));
    setReminders(all);
    await saveReminders(db, all);
  }

  return (
    <Screen tabs={false}>
      <ThemedText type="small" themeColor="textSecondary">
        Gentle nudges to keep your habits on track. Reminders are scheduled on this device only.
      </ThemedText>

      {denied && (
        <Card>
          <ThemedText type="small">
            Notifications are turned off for Kenko. Turn them on in your device settings to get
            reminders.
          </ThemedText>
          <Button
            label="Open settings"
            variant="secondary"
            onPress={() => Linking.openSettings()}
          />
        </Card>
      )}

      {reminders.map((r) => (
        <Card key={r.id}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <ThemedText type="smallBold">{REMINDER_INFO[r.id].label}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {describeReminder(r)}
              </ThemedText>
            </View>
            <Switch
              accessibilityLabel={`${REMINDER_INFO[r.id].label} reminder`}
              value={r.enabled}
              onValueChange={(enabled) => update({ ...r, enabled })}
              trackColor={{ true: theme.tint }}
            />
          </View>
          {r.enabled && (
            <View style={styles.timeRow}>
              <TimeButton label="−15 min" onPress={() => update(shiftTime(r, -15))} />
              <ThemedText style={styles.time}>{formatTime(r.hour, r.minute)}</ThemedText>
              <TimeButton label="+15 min" onPress={() => update(shiftTime(r, 15))} />
            </View>
          )}
        </Card>
      ))}
    </Screen>
  );
}

function TimeButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.timeButton,
        { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.7 : 1 },
      ]}>
      <ThemedText type="small">{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  time: {
    fontWeight: 700,
    fontVariant: ['tabular-nums'],
  },
  timeButton: {
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});
