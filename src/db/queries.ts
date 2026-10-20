import type { SQLiteDatabase } from 'expo-sqlite';

import { addDays, toDayKey } from '@/lib/dates';

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export type Meal = {
  id: number;
  day: string;
  meal_type: MealType;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: string;
};

export type NewMeal = Omit<Meal, 'id' | 'created_at'>;

export type Totals = { calories: number; protein: number; carbs: number; fat: number };

export type Goals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meditationMinutes: number;
};

export const DEFAULT_GOALS: Goals = {
  calories: 2000,
  protein: 100,
  carbs: 250,
  fat: 70,
  meditationMinutes: 10,
};

export type DaySummary = Totals & { day: string; meditationMinutes: number };

// --- Meals ---------------------------------------------------------------

export function getMealsForDay(db: SQLiteDatabase, day: string) {
  return db.getAllAsync<Meal>('SELECT * FROM meals WHERE day = ? ORDER BY created_at', day);
}

export async function addMeal(db: SQLiteDatabase, meal: NewMeal) {
  await db.runAsync(
    `INSERT INTO meals (day, meal_type, name, calories, protein, carbs, fat, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    meal.day,
    meal.meal_type,
    meal.name,
    meal.calories,
    meal.protein,
    meal.carbs,
    meal.fat,
    new Date().toISOString(),
  );
}

export async function deleteMeal(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM meals WHERE id = ?', id);
}

/** Recently logged foods, deduplicated by name, for one-tap re-logging. */
export function getRecentFoods(db: SQLiteDatabase, limit = 8) {
  return db.getAllAsync<Meal>(
    `SELECT * FROM meals WHERE id IN (SELECT MAX(id) FROM meals GROUP BY name)
     ORDER BY created_at DESC LIMIT ?`,
    limit,
  );
}

// --- Meditation ----------------------------------------------------------

export async function logMeditation(db: SQLiteDatabase, meditationId: string, minutes: number) {
  await db.runAsync(
    'INSERT INTO meditation_sessions (day, meditation_id, minutes, created_at) VALUES (?, ?, ?, ?)',
    toDayKey(),
    meditationId,
    minutes,
    new Date().toISOString(),
  );
}

// --- Summaries -----------------------------------------------------------

/** Per-day totals for every day in `[from, to]`, including empty days. */
export async function getDaySummaries(
  db: SQLiteDatabase,
  from: string,
  to: string,
): Promise<DaySummary[]> {
  const mealRows = await db.getAllAsync<Totals & { day: string }>(
    `SELECT day, SUM(calories) AS calories, SUM(protein) AS protein,
            SUM(carbs) AS carbs, SUM(fat) AS fat
     FROM meals WHERE day BETWEEN ? AND ? GROUP BY day`,
    from,
    to,
  );
  const meditationRows = await db.getAllAsync<{ day: string; minutes: number }>(
    `SELECT day, SUM(minutes) AS minutes
     FROM meditation_sessions WHERE day BETWEEN ? AND ? GROUP BY day`,
    from,
    to,
  );

  const meals = new Map(mealRows.map((r) => [r.day, r]));
  const meditation = new Map(meditationRows.map((r) => [r.day, r.minutes]));

  const result: DaySummary[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) {
    const m = meals.get(day);
    result.push({
      day,
      calories: m?.calories ?? 0,
      protein: m?.protein ?? 0,
      carbs: m?.carbs ?? 0,
      fat: m?.fat ?? 0,
      meditationMinutes: meditation.get(day) ?? 0,
    });
  }
  return result;
}

/**
 * Consecutive days, ending today, with any activity (a meal or a meditation).
 * Today without activity yet doesn't break a streak that ran through yesterday.
 */
export async function getStreak(db: SQLiteDatabase): Promise<number> {
  const rows = await db.getAllAsync<{ day: string }>(
    `SELECT day FROM meals UNION SELECT day FROM meditation_sessions ORDER BY day DESC`,
  );
  const active = new Set(rows.map((r) => r.day));
  let day = toDayKey();
  if (!active.has(day)) day = addDays(day, -1);
  let streak = 0;
  while (active.has(day)) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}

// --- Goals ---------------------------------------------------------------

export async function getGoals(db: SQLiteDatabase): Promise<Goals> {
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'goals'",
  );
  if (!row) return DEFAULT_GOALS;
  return { ...DEFAULT_GOALS, ...(JSON.parse(row.value) as Partial<Goals>) };
}

export async function saveGoals(db: SQLiteDatabase, goals: Goals) {
  await db.runAsync(
    "INSERT INTO settings (key, value) VALUES ('goals', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    JSON.stringify(goals),
  );
}
