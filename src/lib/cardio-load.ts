import type { SQLiteDatabase } from 'expo-sqlite';

import type { GradientName } from '@/constants/theme';
import { getWorkoutsBetween } from '@/db/queries';
import { addDays, toDayKey } from '@/lib/dates';

/**
 * Cardio load without a heart-rate monitor, using the session-RPE method (Foster et al., 2001):
 * load = minutes × perceived effort on a 0–10 scale. Kenko's 1–5 effort rating maps onto that
 * scale.
 */
const EFFORT_TO_RPE: Record<number, number> = { 1: 2, 2: 4, 3: 5, 4: 7, 5: 9 };

export function sessionLoad(durationSeconds: number, effort: number) {
  return Math.round((durationSeconds / 60) * (EFFORT_TO_RPE[effort] ?? 5));
}

export type LoadStatus = { label: string; short: string; detail: string; color: GradientName };

export type CardioLoad = {
  days: { day: string; load: number }[];
  today: number;
  /** Average daily load over the last 7 days. */
  acute: number;
  /** Average daily load over the last 28 days. */
  chronic: number;
  ratio: number | null;
  status: LoadStatus;
};

export async function getCardioLoad(db: SQLiteDatabase): Promise<CardioLoad> {
  const to = toDayKey();
  const from = addDays(to, -27);
  const workouts = await getWorkoutsBetween(db, from, to);
  const byDay = new Map<string, number>();
  for (const w of workouts) {
    byDay.set(w.day, (byDay.get(w.day) ?? 0) + sessionLoad(w.duration_sec, w.effort));
  }
  const days: { day: string; load: number }[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) days.push({ day: d, load: byDay.get(d) ?? 0 });

  const avg = (xs: { load: number }[]) => xs.reduce((s, x) => s + x.load, 0) / xs.length;
  const acute = avg(days.slice(-7));
  const chronic = avg(days);
  // Without any training before this week there's no "usual" to compare against yet.
  const hasBaseline = days.slice(0, -7).some((d) => d.load > 0);
  const ratio = hasBaseline && chronic > 0 ? acute / chronic : null;
  return {
    days,
    today: days[days.length - 1].load,
    acute,
    chronic,
    ratio,
    status: statusFor(ratio),
  };
}

/**
 * Compares this week with the last four (the acute:chronic workload ratio). A ratio of about
 * 0.8–1.3 is often described as the training "sweet spot" (Gabbett, 2016).
 */
function statusFor(ratio: number | null): LoadStatus {
  if (ratio === null) {
    return {
      label: 'Building your baseline',
      short: 'Building baseline',
      detail:
        'Log workouts for a couple of weeks and Kenko will compare each week with your usual.',
      color: 'sky',
    };
  }
  if (ratio < 0.8) {
    return {
      label: 'Below your usual',
      short: 'Below usual',
      detail: 'A lighter week than normal — great for recovery, or room to add a session.',
      color: 'sky',
    };
  }
  if (ratio <= 1.3) {
    return {
      label: 'Steady — in your sweet spot',
      short: 'Steady',
      detail: 'Your training this week matches what your body is used to.',
      color: 'tint',
    };
  }
  if (ratio <= 1.5) {
    return {
      label: 'Above your usual',
      short: 'Above usual',
      detail: 'You’re pushing harder than normal. Prioritise sleep and an easy day soon.',
      color: 'warm',
    };
  }
  return {
    label: 'Well above your usual',
    short: 'Well above usual',
    detail: 'A big jump in load raises injury risk. Consider a rest or easy day.',
    color: 'move',
  };
}
