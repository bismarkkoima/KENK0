import type { IconName } from '@/components/ui';
import type { GradientName } from '@/constants/theme';

export type WorkoutType = {
  id: string;
  name: string;
  icon: IconName;
  color: GradientName;
  /**
   * Metabolic equivalent at moderate effort (Compendium of Physical Activities). Calories per
   * minute ≈ MET × 3.5 × kg / 200.
   */
  met: number;
  /** Whether distance makes sense to record. */
  distance?: boolean;
  group: 'cardio' | 'sports' | 'strength' | 'mind-body';
};

export const WORKOUT_TYPES: WorkoutType[] = [
  {
    id: 'walk',
    name: 'Outdoor Walk',
    icon: { ios: 'figure.walk', android: 'directions_walk', web: 'directions_walk' },
    color: 'tint',
    met: 3.5,
    distance: true,
    group: 'cardio',
  },
  {
    id: 'run',
    name: 'Outdoor Run',
    icon: { ios: 'figure.run', android: 'directions_run', web: 'directions_run' },
    color: 'tint',
    met: 9.8,
    distance: true,
    group: 'cardio',
  },
  {
    id: 'cycle',
    name: 'Outdoor Cycle',
    icon: {
      ios: 'figure.outdoor.cycle',
      android: 'directions_bike',
      web: 'directions_bike',
    },
    color: 'tint',
    met: 7.5,
    distance: true,
    group: 'cardio',
  },
  {
    id: 'hiit',
    name: 'HIIT',
    icon: {
      ios: 'figure.highintensity.intervaltraining',
      android: 'bolt',
      web: 'bolt',
    },
    color: 'move',
    met: 8,
    group: 'cardio',
  },
  {
    id: 'swim',
    name: 'Swimming',
    icon: { ios: 'figure.pool.swim', android: 'pool', web: 'pool' },
    color: 'water',
    met: 7,
    distance: true,
    group: 'cardio',
  },
  {
    id: 'football',
    name: 'Football',
    icon: { ios: 'figure.soccer', android: 'sports_soccer', web: 'sports_soccer' },
    color: 'warm',
    met: 7,
    group: 'sports',
  },
  {
    id: 'basketball',
    name: 'Basketball',
    icon: {
      ios: 'figure.basketball',
      android: 'sports_basketball',
      web: 'sports_basketball',
    },
    color: 'warm',
    met: 6.5,
    group: 'sports',
  },
  {
    id: 'tennis',
    name: 'Tennis',
    icon: { ios: 'figure.tennis', android: 'sports_tennis', web: 'sports_tennis' },
    color: 'warm',
    met: 7.3,
    group: 'sports',
  },
  {
    id: 'strength',
    name: 'Strength Training',
    icon: {
      ios: 'figure.strengthtraining.traditional',
      android: 'fitness_center',
      web: 'fitness_center',
    },
    color: 'move',
    met: 5,
    group: 'strength',
  },
  {
    id: 'yoga',
    name: 'Yoga',
    icon: { ios: 'figure.yoga', android: 'self_improvement', web: 'self_improvement' },
    color: 'mind',
    met: 2.5,
    group: 'mind-body',
  },
  {
    id: 'dance',
    name: 'Dance',
    icon: { ios: 'figure.dance', android: 'nightlife', web: 'nightlife' },
    color: 'calm',
    met: 5,
    group: 'mind-body',
  },
  {
    id: 'other',
    name: 'Other',
    icon: { ios: 'figure.mixed.cardio', android: 'sports', web: 'sports' },
    color: 'tint',
    met: 4,
    group: 'cardio',
  },
];

export const WORKOUT_GROUPS: { id: WorkoutType['group']; label: string }[] = [
  { id: 'cardio', label: 'Cardio' },
  { id: 'sports', label: 'Sports' },
  { id: 'strength', label: 'Strength' },
  { id: 'mind-body', label: 'Mind & Body' },
];

export function getWorkoutType(id: string): WorkoutType {
  return WORKOUT_TYPES.find((w) => w.id === id) ?? WORKOUT_TYPES[WORKOUT_TYPES.length - 1];
}

/** Effort scale (1–5) mapped to how much it scales the moderate-effort MET. */
export const EFFORT_LEVELS = [
  { value: 1, label: 'Easy', factor: 0.7 },
  { value: 2, label: 'Light', factor: 0.85 },
  { value: 3, label: 'Moderate', factor: 1 },
  { value: 4, label: 'Hard', factor: 1.15 },
  { value: 5, label: 'All out', factor: 1.3 },
] as const;

/** Estimated active calories for a workout. */
export function estimateCalories(
  type: WorkoutType,
  seconds: number,
  weightKg: number,
  effort = 3,
): number {
  const factor = EFFORT_LEVELS.find((e) => e.value === effort)?.factor ?? 1;
  const perMinute = (type.met * factor * 3.5 * weightKg) / 200;
  return Math.round(perMinute * (seconds / 60));
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = String(m).padStart(h ? 2 : 1, '0');
  return h ? `${h}:${mm}:${String(s).padStart(2, '0')}` : `${mm}:${String(s).padStart(2, '0')}`;
}
