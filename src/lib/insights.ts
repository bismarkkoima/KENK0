import type { DaySummary, Goals } from '@/db/queries';

/** Need at least this many check-in days on each side before comparing moods. */
const MIN_DAYS_PER_GROUP = 2;
/** Mood differences smaller than this (on a 1–5 scale) are treated as noise. */
const MIN_MOOD_DIFFERENCE = 0.3;

const average = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export type RangeStats = {
  loggedDays: number;
  avgCalories: number;
  avgProtein: number;
  onTargetDays: number;
  totalMindful: number;
  mindfulDays: number;
  avgWater: number;
  hydratedDays: number;
  checkinDays: number;
  avgMood: number | null;
};

export function rangeStats(days: DaySummary[], goals: Goals): RangeStats {
  const logged = days.filter((d) => d.calories > 0);
  const waterDays = days.filter((d) => d.waterMl > 0);
  const moods = days.flatMap((d) => (d.mood === null ? [] : [d.mood]));
  return {
    loggedDays: logged.length,
    avgCalories: average(logged.map((d) => d.calories)),
    avgProtein: average(logged.map((d) => d.protein)),
    onTargetDays: logged.filter(
      (d) => d.calories >= goals.calories * 0.9 && d.calories <= goals.calories * 1.1,
    ).length,
    totalMindful: days.reduce((s, d) => s + d.meditationMinutes, 0),
    mindfulDays: days.filter((d) => d.meditationMinutes >= goals.meditationMinutes).length,
    avgWater: average(waterDays.map((d) => d.waterMl)),
    hydratedDays: days.filter((d) => d.waterMl >= goals.waterMl).length,
    checkinDays: moods.length,
    avgMood: moods.length ? average(moods) : null,
  };
}

/**
 * Compares average mood on days that met a habit against days that didn't.
 * Returns null when there isn't enough data for a fair comparison.
 */
export function moodDifference(days: DaySummary[], metHabit: (d: DaySummary) => boolean) {
  const withMood = days.filter((d) => d.mood !== null);
  const yes = withMood.filter(metHabit).map((d) => d.mood!);
  const no = withMood.filter((d) => !metHabit(d)).map((d) => d.mood!);
  if (yes.length < MIN_DAYS_PER_GROUP || no.length < MIN_DAYS_PER_GROUP) return null;
  return { withHabit: average(yes), without: average(no), diff: average(yes) - average(no) };
}

export function buildInsights(days: DaySummary[], goals: Goals, streak: number): string[] {
  const s = rangeStats(days, goals);
  const range = days.length;
  const anyActivity =
    s.loggedDays + s.totalMindful + s.checkinDays + days.filter((d) => d.waterMl > 0).length;
  if (anyActivity === 0) {
    return [
      'Log a meal, a glass of water, a meditation or a mood check-in to start seeing trends.',
    ];
  }

  const out: string[] = [];

  // Habit ↔ mood connections are the most motivating, so lead with them.
  const habits: { name: string; met: (d: DaySummary) => boolean }[] = [
    { name: 'meditate', met: (d) => d.meditationMinutes >= goals.meditationMinutes },
    { name: 'hit your water goal', met: (d) => d.waterMl >= goals.waterMl },
    {
      name: 'eat within your calorie target',
      met: (d) => d.calories >= goals.calories * 0.9 && d.calories <= goals.calories * 1.1,
    },
  ];
  for (const h of habits) {
    const m = moodDifference(days, h.met);
    if (m && m.diff >= MIN_MOOD_DIFFERENCE) {
      out.push(
        `Your mood averages ${m.withHabit.toFixed(1)}/5 on days you ${h.name}, vs ${m.without.toFixed(1)} on days you don't.`,
      );
    }
  }

  if (s.loggedDays > 0) {
    out.push(
      `You hit your calorie target (±10%) on ${s.onTargetDays} of ${s.loggedDays} logged days.`,
    );
    if (s.avgProtein < goals.protein * 0.8) {
      out.push(
        `Protein averages ${Math.round(s.avgProtein)} g — try adding eggs, beans, yogurt or fish to reach ${goals.protein} g.`,
      );
    } else {
      out.push(`Nice work on protein: ${Math.round(s.avgProtein)} g a day on average.`);
    }
  }
  if (s.loggedDays < range / 2) {
    out.push('Logging meals more consistently will make these insights more accurate.');
  }
  if (s.hydratedDays === 0) {
    out.push(`Try keeping a glass of water nearby — your goal is ${goals.waterMl} ml a day.`);
  } else {
    out.push(`You reached your water goal on ${s.hydratedDays} of ${range} days.`);
  }
  if (s.mindfulDays === 0) {
    out.push('Even a 2-minute breathing session counts — try one today.');
  } else {
    out.push(`You met your mindfulness goal on ${s.mindfulDays} days. Keep it up!`);
  }
  if (s.checkinDays < range / 2) {
    out.push('Daily mood check-ins help Kenko spot which habits make you feel your best.');
  }
  if (streak >= 3) out.push(`You're on a ${streak}-day streak 🔥`);
  return out;
}
