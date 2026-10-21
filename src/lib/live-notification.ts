import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { formatDuration, type WorkoutType } from '@/data/workouts';

/**
 * A notification that stays in the tray for the length of a workout and is refreshed with the
 * elapsed time and calories, plus encouragement at milestones that fire even if the app is in
 * the background.
 *
 * Android shows it as an ongoing ("sticky") notification. iOS has no ongoing notifications for
 * regular apps — Lock Screen Live Activities need a native widget extension and a development
 * build — so there it's a quiet notification that updates in Notification Center.
 */

export const LIVE_ID = 'kenko-live-workout';
const CHANNEL_ID = 'live-workout';
const MILESTONE_MINUTES = [10, 20, 30, 45, 60, 90];
const supported = Platform.OS !== 'web';

const CHEERS = [
  'You’re doing great 💪',
  'Strong work — keep going 🔥',
  'Every minute counts ⚡',
  'Looking good. Breathe and keep moving 🌿',
];

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  // Low importance: visible in the shade, but no sound or vibration on every update.
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Live workout',
    importance: AndroidImportance.LOW,
  });
}

async function permitted() {
  if (!supported) return false;
  return (await Notifications.getPermissionsAsync()).granted;
}

export async function showLiveWorkout(
  type: WorkoutType,
  seconds: number,
  calories: number,
  paused = false,
) {
  if (!(await permitted())) return;
  await ensureChannel();
  const minutes = Math.floor(seconds / 60);
  await Notifications.scheduleNotificationAsync({
    identifier: LIVE_ID,
    content: {
      title: paused ? `${type.name} · paused` : `${type.name} in progress`,
      body: `${formatDuration(seconds)} · ${calories} kcal — ${
        paused ? 'tap to resume' : CHEERS[Math.floor(minutes / 5) % CHEERS.length]
      }`,
      data: { url: `/workout/${type.id}` },
      sticky: true,
      autoDismiss: false,
      sound: false,
      interruptionLevel: 'passive',
    },
    trigger: Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null,
  });
}

/** Schedules encouraging check-ins at each milestone still ahead of `elapsedSeconds`. */
export async function scheduleMilestones(type: WorkoutType, elapsedSeconds: number) {
  if (!(await permitted())) return;
  await cancelMilestones();
  await ensureChannel();
  for (const m of MILESTONE_MINUTES) {
    const wait = m * 60 - elapsedSeconds;
    if (wait <= 0) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: `${LIVE_ID}-${m}`,
      content: {
        title: `${m} minutes of ${type.name.toLowerCase()} 🎉`,
        body:
          m >= 30
            ? 'Incredible effort. You’re well into your session.'
            : 'You’re doing well — keep it up!',
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: wait,
        channelId: CHANNEL_ID,
      },
    });
  }
}

export async function cancelMilestones() {
  if (!supported) return;
  await Promise.all(
    MILESTONE_MINUTES.map((m) => Notifications.cancelScheduledNotificationAsync(`${LIVE_ID}-${m}`)),
  );
}

export async function endLiveWorkout() {
  if (!supported) return;
  await cancelMilestones();
  await Notifications.dismissNotificationAsync(LIVE_ID);
}
