import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import type { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';

import { getSetting, saveSetting } from '@/db/queries';

export type ReminderId =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'workout'
  | 'checkin'
  | 'meditation'
  | 'water';

export type Reminder = {
  id: ReminderId;
  enabled: boolean;
  hour: number;
  minute: number;
};

export const REMINDER_INFO: Record<ReminderId, { label: string; title: string; body: string }> = {
  breakfast: {
    label: 'Breakfast',
    title: 'Good morning ☀️',
    body: "Log your breakfast to start the day's tracking.",
  },
  lunch: { label: 'Lunch', title: 'Lunch time 🥗', body: 'Take a moment to log your lunch.' },
  dinner: { label: 'Dinner', title: 'Dinner 🍽️', body: "Don't forget to log your dinner." },
  workout: {
    label: 'Workout',
    title: 'Time to move 🏃',
    body: 'A quick workout or walk will help close your rings today.',
  },
  checkin: {
    label: 'Mind check-in',
    title: 'How are you, really? 💭',
    body: 'Take a minute to check in with how you feel.',
  },
  meditation: {
    label: 'Meditation',
    title: 'Time to unwind 🍃',
    body: 'A few mindful minutes can reset your whole day.',
  },
  water: {
    label: 'Water',
    title: 'Hydration check 💧',
    body: 'Have a glass of water and log it in Kenko.',
  },
};

export const DEFAULT_REMINDERS: Reminder[] = [
  { id: 'breakfast', enabled: false, hour: 8, minute: 0 },
  { id: 'lunch', enabled: false, hour: 12, minute: 30 },
  { id: 'dinner', enabled: false, hour: 18, minute: 30 },
  { id: 'workout', enabled: false, hour: 17, minute: 30 },
  { id: 'checkin', enabled: false, hour: 20, minute: 0 },
  { id: 'meditation', enabled: false, hour: 21, minute: 0 },
  { id: 'water', enabled: false, hour: 10, minute: 0 },
];

/** The water reminder repeats every few hours from its start time until evening. */
const WATER_INTERVAL_HOURS = 3;
const WATER_LAST_HOUR = 20;
const CHANNEL_ID = 'reminders';

export const remindersSupported = Platform.OS !== 'web';

export async function getReminders(db: SQLiteDatabase): Promise<Reminder[]> {
  const saved = (await getSetting<Reminder[]>(db, 'reminders')) ?? [];
  return DEFAULT_REMINDERS.map((d) => saved.find((r) => r.id === d.id) ?? d);
}

/** Asks for notification permission if needed. Resolves to whether we may notify. */
export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** Saves the reminders and replaces every scheduled notification to match them. */
export async function saveReminders(db: SQLiteDatabase, reminders: Reminder[]) {
  await saveSetting(db, 'reminders', reminders);
  if (!remindersSupported) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Reminders',
      importance: AndroidImportance.DEFAULT,
    });
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const r of reminders.filter((r) => r.enabled)) {
    const info = REMINDER_INFO[r.id];
    const hours = r.id === 'water' ? waterHours(r.hour) : [r.hour];
    for (const hour of hours) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${r.id}-${hour}`,
        content: { title: info.title, body: info.body },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute: r.minute,
          channelId: CHANNEL_ID,
        },
      });
    }
  }
}

function waterHours(start: number): number[] {
  const hours: number[] = [];
  for (let h = start; h <= WATER_LAST_HOUR; h += WATER_INTERVAL_HOURS) hours.push(h);
  return hours.length ? hours : [start];
}

export function describeReminder(r: Reminder): string {
  const time = formatTime(r.hour, r.minute);
  if (r.id !== 'water') return `Every day at ${time}`;
  return `Every ${WATER_INTERVAL_HOURS} h from ${time} to ${formatTime(
    waterHours(r.hour).at(-1)!,
    r.minute,
  )}`;
}

export function formatTime(hour: number, minute: number): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** Moves a time by `deltaMinutes`, wrapping around midnight. */
export function shiftTime(r: Reminder, deltaMinutes: number): Reminder {
  const total = (((r.hour * 60 + r.minute + deltaMinutes) % 1440) + 1440) % 1440;
  return { ...r, hour: Math.floor(total / 60), minute: total % 60 };
}
