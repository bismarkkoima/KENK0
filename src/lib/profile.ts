import type { SQLiteDatabase } from 'expo-sqlite';

import { getSetting, saveGoals, saveSetting, type Goals } from '@/db/queries';

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type Focus = 'lose' | 'fitter' | 'stronger' | 'calmer';
export type Sex = 'female' | 'male' | 'unspecified';

export type Profile = {
  name: string;
  fitnessLevel: FitnessLevel;
  focus: Focus;
  sex: Sex;
  birthYear: number;
  heightCm: number;
  weightKg: number;
};

export const FITNESS_LEVELS: { id: FitnessLevel; label: string; description: string }[] = [
  {
    id: 'beginner',
    label: 'Just starting',
    description: 'New to exercise or returning after a long break.',
  },
  {
    id: 'intermediate',
    label: 'Fairly active',
    description: 'You move a few times a week and want more consistency.',
  },
  {
    id: 'advanced',
    label: 'Very active',
    description: 'You train regularly and want to push further.',
  },
];

export const FOCUSES: { id: Focus; label: string; emoji: string }[] = [
  { id: 'lose', label: 'Lose weight', emoji: '⚖️' },
  { id: 'fitter', label: 'Get fitter', emoji: '🏃' },
  { id: 'stronger', label: 'Build strength', emoji: '💪' },
  { id: 'calmer', label: 'Feel calmer', emoji: '🧘' },
];

export function getProfile(db: SQLiteDatabase) {
  return getSetting<Profile>(db, 'profile');
}

/**
 * Daily and weekly targets sized to this person: their body (BMR from the Mifflin–St Jeor
 * equation), their current fitness level and what they want to work on. Starting goals for a
 * beginner are deliberately small — consistency beats intensity.
 */
export function suggestGoals(p: Profile): Goals {
  const age = Math.max(13, new Date().getFullYear() - p.birthYear);
  const sexOffset = p.sex === 'male' ? 5 : p.sex === 'female' ? -161 : -78;
  const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * age + sexOffset;

  const level = {
    beginner: { activity: 1.375, exercise: 20, workouts: 3, steps: 6000, mindful: 5, protein: 1.2 },
    intermediate: {
      activity: 1.55,
      exercise: 30,
      workouts: 4,
      steps: 8000,
      mindful: 10,
      protein: 1.4,
    },
    advanced: {
      activity: 1.725,
      exercise: 45,
      workouts: 5,
      steps: 10000,
      mindful: 10,
      protein: 1.6,
    },
  }[p.fitnessLevel];

  const focusCalories = { lose: 0.85, fitter: 1, stronger: 1.08, calmer: 1 }[p.focus];
  const calories = roundTo(bmr * level.activity * focusCalories, 50);
  const proteinPerKg = p.focus === 'stronger' ? level.protein + 0.4 : level.protein;
  const protein = Math.round(p.weightKg * proteinPerKg);
  const fat = Math.round((calories * 0.28) / 9);
  const carbs = Math.max(50, Math.round((calories - protein * 4 - fat * 9) / 4));
  // Moderate effort (≈5 MET) for the daily exercise target, from the person's own weight.
  const moveCalories = roundTo(((5 * 3.5 * p.weightKg) / 200) * level.exercise, 10);

  return {
    calories,
    protein,
    carbs,
    fat,
    meditationMinutes: p.focus === 'calmer' ? level.mindful + 5 : level.mindful,
    waterMl: roundTo(p.weightKg * 35, 250),
    moveCalories,
    exerciseMinutes: level.exercise,
    weightKg: p.weightKg,
    steps: level.steps,
    weeklyWorkouts: level.workouts,
  };
}

/** Saves the profile and resets every goal to the personalized suggestion. */
export async function saveProfile(db: SQLiteDatabase, profile: Profile) {
  await saveSetting(db, 'profile', profile);
  await saveGoals(db, suggestGoals(profile));
}

export function levelLabel(level: FitnessLevel): string {
  return FITNESS_LEVELS.find((l) => l.id === level)?.label ?? level;
}

function roundTo(n: number, step: number) {
  return Math.round(n / step) * step;
}
