import type { SQLiteDatabase } from 'expo-sqlite';

import { getDaySummaries, getGoals, getWorkoutsBetween, type DaySummary } from '@/db/queries';
import { addDays, fromDayKey, toDayKey } from '@/lib/dates';

export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  morning: 'morning',
  afternoon: 'afternoon',
  evening: 'evening',
  night: 'night',
};

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function timeSlot(date: Date): TimeSlot {
  const h = date.getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
}

/** Everything the badges, rewards and motivation messages are computed from. */
export type LifetimeStats = {
  firstDay: string | null;
  days: DaySummary[];
  workouts: number;
  exerciseMinutes: number;
  activeCalories: number;
  distanceKm: number;
  workoutTypes: number;
  earlyWorkouts: number;
  lateWorkouts: number;
  weekendWorkouts: number;
  /** Workouts per weekday (0 = Sunday) and time slot. */
  weekdaySlots: Record<string, number>;
  mindfulMinutes: number;
  checkins: number;
  mealsLogged: number;
  hydratedDays: number;
  ringsClosedDays: number;
  bestStepDay: number;
  currentStreak: number;
  longestStreak: number;
};

export async function getLifetimeStats(db: SQLiteDatabase): Promise<LifetimeStats> {
  const today = toDayKey();
  const first = await db.getFirstAsync<{ day: string | null }>(
    `SELECT MIN(day) AS day FROM (
       SELECT day FROM meals UNION ALL SELECT day FROM workouts
       UNION ALL SELECT day FROM meditation_sessions UNION ALL SELECT day FROM water_logs
       UNION ALL SELECT day FROM mood_checkins UNION ALL SELECT day FROM mind_entries
       UNION ALL SELECT day FROM daily_steps
     )`,
  );
  const firstDay = first?.day ?? null;
  const goals = await getGoals(db);
  const days = firstDay ? await getDaySummaries(db, firstDay, today) : [];
  const workouts = firstDay ? await getWorkoutsBetween(db, firstDay, today) : [];

  const counts = await db.getFirstAsync<{ checkins: number; meals: number }>(
    `SELECT (SELECT COUNT(*) FROM mind_entries) + (SELECT COUNT(*) FROM mood_checkins) AS checkins,
            (SELECT COUNT(*) FROM meals) AS meals`,
  );

  const weekdaySlots: Record<string, number> = {};
  for (const w of workouts) {
    const start = new Date(w.started_at);
    const key = `${start.getDay()}-${timeSlot(start)}`;
    weekdaySlots[key] = (weekdaySlots[key] ?? 0) + 1;
  }

  const active = (d: DaySummary) =>
    d.calories > 0 ||
    d.workouts > 0 ||
    d.meditationMinutes > 0 ||
    d.waterMl > 0 ||
    d.mood !== null ||
    d.steps > 0;
  let longestStreak = 0;
  let run = 0;
  for (const d of days) {
    run = active(d) ? run + 1 : 0;
    longestStreak = Math.max(longestStreak, run);
  }
  // Today not being logged yet doesn't break the current streak.
  let currentStreak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (active(days[i])) currentStreak++;
    else if (i !== days.length - 1) break;
  }

  return {
    firstDay,
    days,
    workouts: workouts.length,
    exerciseMinutes: workouts.reduce((s, w) => s + w.duration_sec / 60, 0),
    activeCalories: workouts.reduce((s, w) => s + w.calories, 0),
    distanceKm: workouts.reduce((s, w) => s + (w.distance_km ?? 0), 0),
    workoutTypes: new Set(workouts.map((w) => w.type)).size,
    earlyWorkouts: workouts.filter((w) => new Date(w.started_at).getHours() < 8).length,
    lateWorkouts: workouts.filter((w) => new Date(w.started_at).getHours() >= 20).length,
    weekendWorkouts: workouts.filter((w) => [0, 6].includes(fromDayKey(w.day).getDay())).length,
    weekdaySlots,
    mindfulMinutes: days.reduce((s, d) => s + d.meditationMinutes, 0),
    checkins: counts?.checkins ?? 0,
    mealsLogged: counts?.meals ?? 0,
    hydratedDays: days.filter((d) => d.waterMl >= goals.waterMl).length,
    ringsClosedDays: days.filter(
      (d) =>
        d.activeCalories >= goals.moveCalories &&
        d.exerciseMinutes >= goals.exerciseMinutes &&
        d.meditationMinutes >= goals.meditationMinutes,
    ).length,
    bestStepDay: days.reduce((m, d) => Math.max(m, d.steps), 0),
    currentStreak,
    longestStreak,
  };
}

/** The weekday + time slot the person works out in most, if there's a clear favourite. */
export function favouriteSlot(stats: LifetimeStats) {
  const entries = Object.entries(stats.weekdaySlots).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0 || entries[0][1] < 2) return null;
  const [key, count] = entries[0];
  const [weekday, slot] = key.split('-');
  return {
    weekday: WEEKDAYS[Number(weekday)],
    slot: slot as TimeSlot,
    count,
    share: count / stats.workouts,
  };
}

/** Days in [from, to] — a small helper for period maths. */
export function daysBetween(from: string, to: string) {
  let n = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) n++;
  return n;
}
