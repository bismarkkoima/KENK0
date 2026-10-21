import { Pedometer } from 'expo-sensors';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

import { saveDailySteps } from '@/db/queries';
import { addDays, fromDayKey, toDayKey } from '@/lib/dates';

export type StepData = {
  total: number;
  /** Steps per hour of today (iOS), or null when only a running total is known (Android). */
  hourly: number[] | null;
};

/**
 * Today's steps, total and per hour, from the phone's motion coprocessor. Only iOS can query past
 * step counts (Android needs Health Connect), so elsewhere this resolves to `null` and callers
 * hide the card.
 *
 * iOS keeps just seven days of step history, so each refresh also saves the last week's daily
 * totals to the local database — that's what the weekly, monthly and yearly charts read.
 */
export function useTodaySteps(): StepData | null {
  const db = useSQLiteContext();
  const [data, setData] = useState<StepData | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') return watchAndroidSteps(db, setData);
      if (Platform.OS !== 'ios') return;
      let cancelled = false;

      (async () => {
        if (!(await Pedometer.isAvailableAsync())) return;
        const permission = await Pedometer.requestPermissionsAsync();
        if (!permission.granted) return;

        const now = new Date();
        const hours = Array.from({ length: now.getHours() + 1 }, (_, h) => h);
        const hourly = await Promise.all(
          hours.map(async (h) => {
            const start = new Date(now);
            start.setHours(h, 0, 0, 0);
            const end = new Date(start);
            end.setHours(h + 1);
            const result = await Pedometer.getStepCountAsync(start, end < now ? end : now);
            return result.steps;
          }),
        );
        const padded = [...hourly, ...Array(24 - hourly.length).fill(0)];
        const total = hourly.reduce((a, b) => a + b, 0);
        if (!cancelled) setData({ total, hourly: padded });

        const today = toDayKey(now);
        await saveDailySteps(db, today, total);
        for (let i = 1; i < 7; i++) {
          const day = addDays(today, -i);
          const start = fromDayKey(day);
          const end = fromDayKey(addDays(day, 1));
          const result = await Pedometer.getStepCountAsync(start, end);
          await saveDailySteps(db, day, result.steps);
        }
      })().catch(() => {
        // Motion data unavailable (e.g. simulator) — leave the card hidden.
      });

      return () => {
        cancelled = true;
      };
    }, [db]),
  );

  return data;
}

/**
 * Android can't look up past step counts without Health Connect, so Kenko counts live from the
 * step sensor while the app is open and adds that to what it has already saved for today.
 */
function watchAndroidSteps(db: SQLiteDatabase, setData: (d: StepData) => void) {
  let subscription: { remove: () => void } | null = null;
  let cancelled = false;

  (async () => {
    if (!(await Pedometer.isAvailableAsync())) return;
    if (!(await Pedometer.requestPermissionsAsync()).granted) return;
    const today = toDayKey();
    const saved = await db.getFirstAsync<{ steps: number }>(
      'SELECT steps FROM daily_steps WHERE day = ?',
      today,
    );
    const base = saved?.steps ?? 0;
    if (cancelled) return;
    setData({ total: base, hourly: null });
    subscription = Pedometer.watchStepCount(({ steps }) => {
      setData({ total: base + steps, hourly: null });
      saveDailySteps(db, today, base + steps);
    });
  })().catch(() => {
    // No step sensor — leave the card hidden.
  });

  return () => {
    cancelled = true;
    subscription?.remove();
  };
}
