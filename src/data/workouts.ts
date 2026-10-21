import type { IconName } from '@/components/ui';
import type { GradientName } from '@/constants/theme';

export type WorkoutGroup =
  | 'cardio'
  | 'gym'
  | 'team'
  | 'racket'
  | 'combat'
  | 'water'
  | 'winter'
  | 'outdoor'
  | 'mind-body';

export type WorkoutType = {
  id: string;
  name: string;
  icon: IconName;
  color: GradientName;
  /**
   * Approximate metabolic equivalent at moderate effort, based on the Compendium of Physical
   * Activities. Calories per minute ≈ MET × 3.5 × kg / 200.
   */
  met: number;
  /** Whether distance makes sense to record. */
  distance?: boolean;
  group: WorkoutGroup;
};

export const WORKOUT_TYPES: WorkoutType[] = [
  {
    id: 'walk',
    name: 'Outdoor Walk',
    icon: { mci: 'walk' },
    color: 'tint',
    met: 3.5,
    distance: true,
    group: 'cardio',
  },
  {
    id: 'walk-brisk',
    name: 'Brisk Walk',
    icon: { mci: 'walk' },
    color: 'tint',
    met: 4.3,
    distance: true,
    group: 'cardio',
  },
  {
    id: 'run',
    name: 'Outdoor Run',
    icon: { mci: 'run-fast' },
    color: 'tint',
    met: 9.8,
    distance: true,
    group: 'cardio',
  },
  {
    id: 'treadmill',
    name: 'Treadmill Run',
    icon: { mci: 'run' },
    color: 'tint',
    met: 8.3,
    distance: true,
    group: 'cardio',
  },
  {
    id: 'cycle',
    name: 'Outdoor Cycle',
    icon: { mci: 'bike-fast' },
    color: 'tint',
    met: 7.5,
    distance: true,
    group: 'cardio',
  },
  {
    id: 'cycle-indoor',
    name: 'Indoor Cycle',
    icon: { mci: 'bike' },
    color: 'tint',
    met: 6.8,
    distance: true,
    group: 'cardio',
  },
  {
    id: 'rower',
    name: 'Rowing Machine',
    icon: { mci: 'rowing' },
    color: 'water',
    met: 7.0,
    distance: true,
    group: 'cardio',
  },
  {
    id: 'elliptical',
    name: 'Elliptical',
    icon: { mci: 'run' },
    color: 'tint',
    met: 5.0,
    group: 'cardio',
  },
  {
    id: 'stairs',
    name: 'Stair Climber',
    icon: { mci: 'stairs' },
    color: 'warm',
    met: 9.0,
    group: 'cardio',
  },
  {
    id: 'jump-rope',
    name: 'Jump Rope',
    icon: { mci: 'jump-rope' },
    color: 'move',
    met: 11.8,
    group: 'cardio',
  },
  {
    id: 'hiit',
    name: 'HIIT',
    icon: { mci: 'lightning-bolt' },
    color: 'move',
    met: 8.0,
    group: 'cardio',
  },
  {
    id: 'strength',
    name: 'Strength Training',
    icon: { mci: 'weight-lifter' },
    color: 'move',
    met: 5.0,
    group: 'gym',
  },
  {
    id: 'weight-machines',
    name: 'Weight Machines',
    icon: { mci: 'weight' },
    color: 'move',
    met: 3.5,
    group: 'gym',
  },
  {
    id: 'free-weights',
    name: 'Free Weights',
    icon: { mci: 'dumbbell' },
    color: 'move',
    met: 6.0,
    group: 'gym',
  },
  {
    id: 'kettlebell',
    name: 'Kettlebell',
    icon: { mci: 'kettlebell' },
    color: 'move',
    met: 6.0,
    group: 'gym',
  },
  {
    id: 'circuit',
    name: 'Circuit Training',
    icon: { mci: 'arm-flex' },
    color: 'move',
    met: 8.0,
    group: 'gym',
  },
  {
    id: 'core',
    name: 'Core & Calisthenics',
    icon: { mci: 'human-handsup' },
    color: 'move',
    met: 3.8,
    group: 'gym',
  },
  {
    id: 'football',
    name: 'Football (Soccer)',
    icon: { mci: 'soccer' },
    color: 'warm',
    met: 7.0,
    group: 'team',
  },
  {
    id: 'basketball',
    name: 'Basketball',
    icon: { mci: 'basketball' },
    color: 'warm',
    met: 6.5,
    group: 'team',
  },
  {
    id: 'volleyball',
    name: 'Volleyball',
    icon: { mci: 'volleyball' },
    color: 'warm',
    met: 4.0,
    group: 'team',
  },
  {
    id: 'cricket',
    name: 'Cricket',
    icon: { mci: 'cricket' },
    color: 'warm',
    met: 4.8,
    group: 'team',
  },
  {
    id: 'baseball',
    name: 'Baseball / Softball',
    icon: { mci: 'baseball' },
    color: 'warm',
    met: 5.0,
    group: 'team',
  },
  {
    id: 'rugby',
    name: 'Rugby',
    icon: { mci: 'rugby' },
    color: 'warm',
    met: 8.3,
    group: 'team',
  },
  {
    id: 'american-football',
    name: 'American Football',
    icon: { mci: 'football' },
    color: 'warm',
    met: 8.0,
    group: 'team',
  },
  {
    id: 'hockey',
    name: 'Field Hockey',
    icon: { mci: 'hockey-sticks' },
    color: 'warm',
    met: 7.8,
    group: 'team',
  },
  {
    id: 'ice-hockey',
    name: 'Ice Hockey',
    icon: { mci: 'hockey-puck' },
    color: 'sky',
    met: 8.0,
    group: 'team',
  },
  {
    id: 'handball',
    name: 'Handball',
    icon: { mci: 'handball' },
    color: 'warm',
    met: 12.0,
    group: 'team',
  },
  {
    id: 'tennis',
    name: 'Tennis',
    icon: { mci: 'tennis' },
    color: 'gold',
    met: 7.3,
    group: 'racket',
  },
  {
    id: 'badminton',
    name: 'Badminton',
    icon: { mci: 'badminton' },
    color: 'gold',
    met: 5.5,
    group: 'racket',
  },
  {
    id: 'squash',
    name: 'Squash',
    icon: { mci: 'tennis' },
    color: 'gold',
    met: 7.3,
    group: 'racket',
  },
  {
    id: 'table-tennis',
    name: 'Table Tennis',
    icon: { mci: 'table-tennis' },
    color: 'gold',
    met: 4.0,
    group: 'racket',
  },
  {
    id: 'golf',
    name: 'Golf',
    icon: { mci: 'golf' },
    color: 'tint',
    met: 4.8,
    distance: true,
    group: 'racket',
  },
  {
    id: 'boxing',
    name: 'Boxing (Bag)',
    icon: { mci: 'boxing-glove' },
    color: 'move',
    met: 5.5,
    group: 'combat',
  },
  {
    id: 'sparring',
    name: 'Boxing (Sparring)',
    icon: { mci: 'boxing-glove' },
    color: 'move',
    met: 7.8,
    group: 'combat',
  },
  {
    id: 'martial-arts',
    name: 'Martial Arts',
    icon: { mci: 'karate' },
    color: 'move',
    met: 7.5,
    group: 'combat',
  },
  {
    id: 'wrestling',
    name: 'Wrestling',
    icon: { mci: 'human-greeting-variant' },
    color: 'move',
    met: 6.0,
    group: 'combat',
  },
  {
    id: 'fencing',
    name: 'Fencing',
    icon: { mci: 'fencing' },
    color: 'move',
    met: 6.0,
    group: 'combat',
  },
  {
    id: 'swim',
    name: 'Swimming',
    icon: { mci: 'swim' },
    color: 'water',
    met: 7.0,
    distance: true,
    group: 'water',
  },
  {
    id: 'water-polo',
    name: 'Water Polo',
    icon: { mci: 'waves' },
    color: 'water',
    met: 10.0,
    group: 'water',
  },
  {
    id: 'kayaking',
    name: 'Kayaking',
    icon: { mci: 'kayaking' },
    color: 'water',
    met: 5.0,
    distance: true,
    group: 'water',
  },
  {
    id: 'paddleboard',
    name: 'Paddleboarding',
    icon: { mci: 'surfing' },
    color: 'water',
    met: 6.0,
    distance: true,
    group: 'water',
  },
  {
    id: 'surfing',
    name: 'Surfing',
    icon: { mci: 'surfing' },
    color: 'water',
    met: 3.0,
    group: 'water',
  },
  {
    id: 'sailing',
    name: 'Sailing',
    icon: { mci: 'sail-boat' },
    color: 'water',
    met: 3.0,
    distance: true,
    group: 'water',
  },
  {
    id: 'ski',
    name: 'Downhill Skiing',
    icon: { mci: 'ski' },
    color: 'sky',
    met: 5.3,
    distance: true,
    group: 'winter',
  },
  {
    id: 'ski-xc',
    name: 'Cross-Country Skiing',
    icon: { mci: 'ski-cross-country' },
    color: 'sky',
    met: 9.0,
    distance: true,
    group: 'winter',
  },
  {
    id: 'snowboard',
    name: 'Snowboarding',
    icon: { mci: 'snowboard' },
    color: 'sky',
    met: 5.3,
    distance: true,
    group: 'winter',
  },
  {
    id: 'skating',
    name: 'Ice Skating',
    icon: { mci: 'skate' },
    color: 'sky',
    met: 7.0,
    group: 'winter',
  },
  {
    id: 'hike',
    name: 'Hiking',
    icon: { mci: 'hiking' },
    color: 'tint',
    met: 6.0,
    distance: true,
    group: 'outdoor',
  },
  {
    id: 'trail-run',
    name: 'Trail Run',
    icon: { mci: 'image-filter-hdr' },
    color: 'tint',
    met: 9.0,
    distance: true,
    group: 'outdoor',
  },
  {
    id: 'climbing',
    name: 'Climbing',
    icon: { mci: 'carabiner' },
    color: 'warm',
    met: 7.5,
    group: 'outdoor',
  },
  {
    id: 'skateboarding',
    name: 'Skateboarding',
    icon: { mci: 'skateboarding' },
    color: 'warm',
    met: 5.0,
    distance: true,
    group: 'outdoor',
  },
  {
    id: 'horse-riding',
    name: 'Horse Riding',
    icon: { mci: 'horse-human' },
    color: 'warm',
    met: 5.5,
    distance: true,
    group: 'outdoor',
  },
  {
    id: 'yoga',
    name: 'Yoga',
    icon: { mci: 'yoga' },
    color: 'mind',
    met: 2.5,
    group: 'mind-body',
  },
  {
    id: 'pilates',
    name: 'Pilates',
    icon: { mci: 'human-handsup' },
    color: 'mind',
    met: 3.0,
    group: 'mind-body',
  },
  {
    id: 'tai-chi',
    name: 'Tai Chi',
    icon: { mci: 'meditation' },
    color: 'mind',
    met: 3.0,
    group: 'mind-body',
  },
  {
    id: 'stretching',
    name: 'Stretching',
    icon: { mci: 'human-handsup' },
    color: 'mind',
    met: 2.3,
    group: 'mind-body',
  },
  {
    id: 'dance',
    name: 'Dance',
    icon: { mci: 'human-female-dance' },
    color: 'calm',
    met: 5.0,
    group: 'mind-body',
  },
  {
    id: 'gymnastics',
    name: 'Gymnastics',
    icon: { mci: 'gymnastics' },
    color: 'calm',
    met: 3.8,
    group: 'mind-body',
  },
  {
    id: 'other',
    name: 'Other',
    icon: { mci: 'arm-flex' },
    color: 'tint',
    met: 4.0,
    group: 'cardio',
  },
];

export const WORKOUT_GROUPS: { id: WorkoutGroup; label: string }[] = [
  { id: 'cardio', label: 'Cardio' },
  { id: 'gym', label: 'Gym & Strength' },
  { id: 'team', label: 'Team Sports' },
  { id: 'racket', label: 'Racket & Golf' },
  { id: 'combat', label: 'Combat' },
  { id: 'water', label: 'Water' },
  { id: 'winter', label: 'Winter' },
  { id: 'outdoor', label: 'Outdoor' },
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

/** Estimated calories for an hour of this activity at moderate effort, for this body weight. */
export function caloriesPerHour(type: WorkoutType, weightKg: number): number {
  return estimateCalories(type, 3600, weightKg);
}

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
