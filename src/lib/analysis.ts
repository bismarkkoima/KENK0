import type { SQLiteDatabase } from 'expo-sqlite';

import { getDaySummaries, getWorkoutsBetween, type DaySummary, type Workout } from '@/db/queries';
import { addDays, fromDayKey, shortWeekday, toDayKey } from '@/lib/dates';
import { timeSlot, type TimeSlot } from '@/lib/stats';

export type Period = 'week' | 'month' | 'year';

export const PERIODS: { id: Period; label: string; days: number; title: string }[] = [
  { id: 'week', label: 'Week', days: 7, title: 'Last 7 days' },
  { id: 'month', label: 'Month', days: 30, title: 'Last 30 days' },
  { id: 'year', label: 'Year', days: 365, title: 'Last 12 months' },
];

/** One bar on a chart: a day (week / month views) or a calendar month (year view). */
export type Bucket = {
  key: string;
  label: string;
  days: number;
  workouts: number;
  exerciseMinutes: number;
  activeCalories: number;
  steps: number;
  distanceKm: number;
  meditationMinutes: number;
  waterMl: number;
  calories: number;
  mood: number | null;
  stress: number | null;
};

export type Totals = Omit<Bucket, 'key' | 'label'> & { activeDays: number; loggedFoodDays: number };

export type PeriodAnalysis = {
  period: Period;
  from: string;
  to: string;
  days: DaySummary[];
  buckets: Bucket[];
  totals: Totals;
  previous: Totals;
  workouts: Workout[];
};

const average = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

function aggregate(days: DaySummary[]): Omit<Bucket, 'key' | 'label'> {
  const sum = (pick: (d: DaySummary) => number) => days.reduce((s, d) => s + pick(d), 0);
  return {
    days: days.length,
    workouts: sum((d) => d.workouts),
    exerciseMinutes: sum((d) => d.exerciseMinutes),
    activeCalories: sum((d) => d.activeCalories),
    steps: sum((d) => d.steps),
    distanceKm: sum((d) => d.distanceKm),
    meditationMinutes: sum((d) => d.meditationMinutes),
    waterMl: sum((d) => d.waterMl),
    calories: sum((d) => d.calories),
    mood: average(days.flatMap((d) => (d.mood === null ? [] : [d.mood]))),
    stress: average(days.flatMap((d) => (d.stress === null ? [] : [d.stress]))),
  };
}

function totals(days: DaySummary[]): Totals {
  return {
    ...aggregate(days),
    activeDays: days.filter((d) => d.workouts > 0 || d.meditationMinutes > 0).length,
    loggedFoodDays: days.filter((d) => d.calories > 0).length,
  };
}

function bucketize(period: Period, days: DaySummary[]): Bucket[] {
  if (period !== 'year') {
    return days.map((d) => ({
      key: d.day,
      label: period === 'week' ? shortWeekday(d.day) : String(fromDayKey(d.day).getDate()),
      ...aggregate([d]),
    }));
  }
  const months = new Map<string, DaySummary[]>();
  for (const d of days) {
    const key = d.day.slice(0, 7);
    months.set(key, [...(months.get(key) ?? []), d]);
  }
  return [...months.entries()].slice(-12).map(([key, ds]) => ({
    key,
    label: fromDayKey(`${key}-01`).toLocaleDateString(undefined, { month: 'narrow' }),
    ...aggregate(ds),
  }));
}

export async function analyzePeriod(db: SQLiteDatabase, period: Period): Promise<PeriodAnalysis> {
  const length = PERIODS.find((p) => p.id === period)!.days;
  const to = toDayKey();
  // The year view starts on the 1st of the month eleven months ago so each bar is a full month.
  const from =
    period === 'year'
      ? (() => {
          const d = fromDayKey(to);
          d.setMonth(d.getMonth() - 11, 1);
          return toDayKey(d);
        })()
      : addDays(to, -(length - 1));
  const span = Math.round((fromDayKey(to).getTime() - fromDayKey(from).getTime()) / 86_400_000) + 1;
  const prevTo = addDays(from, -1);
  const prevFrom = addDays(prevTo, -(span - 1));

  const [days, prevDays, workouts] = await Promise.all([
    getDaySummaries(db, from, to),
    getDaySummaries(db, prevFrom, prevTo),
    getWorkoutsBetween(db, from, to),
  ]);

  return {
    period,
    from,
    to,
    days,
    buckets: bucketize(period, days),
    totals: totals(days),
    previous: totals(prevDays),
    workouts,
  };
}

/** Percent change from the previous period, or null when there's nothing to compare against. */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export type Patterns = {
  byWeekday: number[];
  bySlot: Record<TimeSlot, number>;
  byType: { type: string; minutes: number; count: number }[];
};

/** When and how this person moves: workouts per weekday, per time of day, and per activity. */
export function workoutPatterns(workouts: Workout[]): Patterns {
  const byWeekday = [0, 0, 0, 0, 0, 0, 0];
  const bySlot: Record<TimeSlot, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  const types = new Map<string, { minutes: number; count: number }>();
  for (const w of workouts) {
    const start = new Date(w.started_at);
    byWeekday[start.getDay()]++;
    bySlot[timeSlot(start)]++;
    const t = types.get(w.type) ?? { minutes: 0, count: 0 };
    types.set(w.type, { minutes: t.minutes + w.duration_sec / 60, count: t.count + 1 });
  }
  return {
    byWeekday,
    bySlot,
    byType: [...types.entries()]
      .map(([type, v]) => ({ type, ...v }))
      .sort((a, b) => b.minutes - a.minutes),
  };
}
