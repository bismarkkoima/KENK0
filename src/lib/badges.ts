import type { AppIcon } from '@/components/icon';
import type { GradientName } from '@/constants/theme';
import type { LifetimeStats } from '@/lib/stats';

export type BadgeCategory = 'movement' | 'consistency' | 'steps' | 'mind' | 'nutrition';

export type Badge = {
  id: string;
  title: string;
  description: string;
  category: BadgeCategory;
  icon: AppIcon;
  color: GradientName;
  target: number;
  value: (s: LifetimeStats) => number;
  /** Reward points for earning it. */
  points: number;
};

export const BADGE_CATEGORIES: { id: BadgeCategory; label: string }[] = [
  { id: 'movement', label: 'Movement' },
  { id: 'consistency', label: 'Consistency' },
  { id: 'steps', label: 'Steps' },
  { id: 'mind', label: 'Mind' },
  { id: 'nutrition', label: 'Fuel' },
];

const workouts = (s: LifetimeStats) => s.workouts;
const minutes = (s: LifetimeStats) => s.exerciseMinutes;
const km = (s: LifetimeStats) => s.distanceKm;

export const BADGES: Badge[] = [
  // Movement
  b(
    'first-workout',
    'First Step',
    'Complete your first workout',
    'movement',
    'shoe-sneaker',
    'tint',
    1,
    workouts,
    50,
  ),
  b(
    'workouts-10',
    'Getting Going',
    'Complete 10 workouts',
    'movement',
    'run',
    'tint',
    10,
    workouts,
    100,
  ),
  b(
    'workouts-50',
    'Habit Formed',
    'Complete 50 workouts',
    'movement',
    'run-fast',
    'tint',
    50,
    workouts,
    250,
  ),
  b(
    'workouts-100',
    'Centurion',
    'Complete 100 workouts',
    'movement',
    'trophy',
    'gold',
    100,
    workouts,
    500,
  ),
  b(
    'minutes-600',
    '10 Hour Club',
    'Exercise for 10 hours in total',
    'movement',
    'timer-outline',
    'sky',
    600,
    minutes,
    150,
  ),
  b(
    'minutes-3000',
    '50 Hour Club',
    'Exercise for 50 hours in total',
    'movement',
    'timer-sand-complete',
    'sky',
    3000,
    minutes,
    400,
  ),
  b(
    'distance-10',
    'First 10K',
    'Cover 10 km in recorded workouts',
    'movement',
    'map-marker-distance',
    'water',
    10,
    km,
    100,
  ),
  b(
    'distance-42',
    'Marathoner',
    'Cover 42.2 km in total — a marathon',
    'movement',
    'medal',
    'gold',
    42.2,
    km,
    300,
  ),
  b(
    'distance-100',
    'Century Rider',
    'Cover 100 km in total',
    'movement',
    'road-variant',
    'water',
    100,
    km,
    400,
  ),
  b(
    'explorer',
    'Explorer',
    'Try 5 different kinds of workout',
    'movement',
    'compass',
    'warm',
    5,
    (s) => s.workoutTypes,
    150,
  ),
  b(
    'early-bird',
    'Early Bird',
    'Work out before 8 am five times',
    'movement',
    'weather-sunset-up',
    'warm',
    5,
    (s) => s.earlyWorkouts,
    150,
  ),
  b(
    'night-owl',
    'Night Owl',
    'Work out after 8 pm five times',
    'movement',
    'owl',
    'calm',
    5,
    (s) => s.lateWorkouts,
    150,
  ),
  b(
    'weekend-warrior',
    'Weekend Warrior',
    'Complete 10 weekend workouts',
    'movement',
    'sword-cross',
    'move',
    10,
    (s) => s.weekendWorkouts,
    200,
  ),
  // Consistency
  b(
    'streak-3',
    'On a Roll',
    'Stay active 3 days in a row',
    'consistency',
    'fire',
    'warm',
    3,
    (s) => s.longestStreak,
    50,
  ),
  b(
    'streak-7',
    'Week Strong',
    'Stay active 7 days in a row',
    'consistency',
    'fire',
    'move',
    7,
    (s) => s.longestStreak,
    150,
  ),
  b(
    'streak-30',
    'Unstoppable',
    'Stay active 30 days in a row',
    'consistency',
    'fire-circle',
    'gold',
    30,
    (s) => s.longestStreak,
    600,
  ),
  b(
    'rings-1',
    'Full Circle',
    'Close all three rings in one day',
    'consistency',
    'circle-double',
    'tint',
    1,
    (s) => s.ringsClosedDays,
    100,
  ),
  b(
    'rings-7',
    'Ring Master',
    'Close all three rings on 7 days',
    'consistency',
    'target',
    'gold',
    7,
    (s) => s.ringsClosedDays,
    300,
  ),
  // Steps
  b(
    'steps-10k',
    '10K Day',
    'Walk 10,000 steps in a day',
    'steps',
    'shoe-print',
    'calm',
    10000,
    (s) => s.bestStepDay,
    150,
  ),
  b(
    'steps-20k',
    'Trailblazer',
    'Walk 20,000 steps in a day',
    'steps',
    'hiking',
    'calm',
    20000,
    (s) => s.bestStepDay,
    300,
  ),
  // Mind
  b(
    'first-checkin',
    'Checked In',
    'Log your first mood check-in',
    'mind',
    'emoticon-happy-outline',
    'mind',
    1,
    (s) => s.checkins,
    50,
  ),
  b(
    'checkins-30',
    'Self-Aware',
    'Log 30 check-ins',
    'mind',
    'brain',
    'mind',
    30,
    (s) => s.checkins,
    250,
  ),
  b(
    'zen-60',
    'Calm Mind',
    'Meditate for 60 minutes in total',
    'mind',
    'meditation',
    'calm',
    60,
    (s) => s.mindfulMinutes,
    150,
  ),
  b(
    'zen-600',
    'Zen Master',
    'Meditate for 10 hours in total',
    'mind',
    'flower-tulip',
    'gold',
    600,
    (s) => s.mindfulMinutes,
    500,
  ),
  // Nutrition & hydration
  b(
    'meals-50',
    'Mindful Eater',
    'Log 50 meals',
    'nutrition',
    'food-apple',
    'tint',
    50,
    (s) => s.mealsLogged,
    150,
  ),
  b(
    'hydrated-7',
    'Hydrated',
    'Hit your water goal on 7 days',
    'nutrition',
    'cup-water',
    'water',
    7,
    (s) => s.hydratedDays,
    100,
  ),
  b(
    'hydrated-30',
    'Like Water',
    'Hit your water goal on 30 days',
    'nutrition',
    'waves',
    'water',
    30,
    (s) => s.hydratedDays,
    300,
  ),
];

function b(
  id: string,
  title: string,
  description: string,
  category: BadgeCategory,
  icon: string,
  color: GradientName,
  target: number,
  value: (s: LifetimeStats) => number,
  points: number,
): Badge {
  return {
    id,
    title,
    description,
    category,
    icon: { mci: icon as never },
    color,
    target,
    value,
    points,
  };
}

export type BadgeProgress = Badge & { current: number; earned: boolean; progress: number };

export function evaluateBadges(stats: LifetimeStats): BadgeProgress[] {
  return BADGES.map((badge) => {
    const current = badge.value(stats);
    return {
      ...badge,
      current,
      earned: current >= badge.target,
      progress: Math.min(current / badge.target, 1),
    };
  });
}

// --- Rewards: points and levels ---------------------------------------------

export const LEVELS = [
  { min: 0, title: 'Seedling' },
  { min: 300, title: 'Sprout' },
  { min: 1000, title: 'Mover' },
  { min: 2500, title: 'Achiever' },
  { min: 5000, title: 'Athlete' },
  { min: 10000, title: 'Champion' },
  { min: 20000, title: 'Legend' },
];

/**
 * Points reward effort, not just outcomes: every workout minute, mindful minute and check-in
 * counts, plus a bonus for each badge.
 */
export function rewardPoints(stats: LifetimeStats, badges: BadgeProgress[]): number {
  return Math.round(
    stats.workouts * 20 +
      stats.exerciseMinutes +
      stats.mindfulMinutes * 2 +
      stats.checkins * 10 +
      stats.hydratedDays * 10 +
      badges.filter((x) => x.earned).reduce((s, x) => s + x.points, 0),
  );
}

export function levelFor(points: number) {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) if (points >= LEVELS[i].min) index = i;
  const current = LEVELS[index];
  const next = LEVELS[index + 1] ?? null;
  return {
    level: index + 1,
    title: current.title,
    next,
    progress: next ? (points - current.min) / (next.min - current.min) : 1,
  };
}
