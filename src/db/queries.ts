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
  waterMl: number;
  /** Active calories burned in workouts. */
  moveCalories: number;
  exerciseMinutes: number;
  /** Used to estimate workout calories. */
  weightKg: number;
  steps: number;
  /** Workouts per week. */
  weeklyWorkouts: number;
};

export const DEFAULT_GOALS: Goals = {
  calories: 2000,
  protein: 100,
  carbs: 250,
  fat: 70,
  meditationMinutes: 10,
  waterMl: 2000,
  moveCalories: 400,
  exerciseMinutes: 30,
  weightKg: 70,
  steps: 8000,
  weeklyWorkouts: 3,
};

export type DaySummary = Totals & {
  day: string;
  meditationMinutes: number;
  waterMl: number;
  /** 1 (low) – 5 (great): average of the day's mood check-in and mind entries, or null. */
  mood: number | null;
  /** 1 (calm) – 5 (very stressed), averaged over the day's mind entries, or null. */
  stress: number | null;
  activeCalories: number;
  exerciseMinutes: number;
  workouts: number;
  /** Phone-recorded steps, or 0 when unknown. */
  steps: number;
  distanceKm: number;
};

export type MoodCheckin = { day: string; mood: number; note: string };

export type Workout = {
  id: number;
  day: string;
  type: string;
  started_at: string;
  duration_sec: number;
  calories: number;
  distance_km: number | null;
  /** 1 (easy) – 5 (all out). */
  effort: number;
  note: string;
};

export type NewWorkout = Omit<Workout, 'id'>;

export type MindEntry = {
  id: number;
  day: string;
  created_at: string;
  mood: number;
  stress: number;
  energy: number;
  sleep: number;
  emotions: string[];
  journal: string;
  gratitude: string;
};

export type NewMindEntry = Omit<MindEntry, 'id' | 'created_at'>;

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

// --- Water & mood ------------------------------------------------------

export async function logWater(db: SQLiteDatabase, ml: number, day: string = toDayKey()) {
  await db.runAsync(
    'INSERT INTO water_logs (day, ml, created_at) VALUES (?, ?, ?)',
    day,
    ml,
    new Date().toISOString(),
  );
}

/** Removes the most recent water entry for the day (an "undo" for the + buttons). */
export async function undoLastWater(db: SQLiteDatabase, day: string = toDayKey()) {
  await db.runAsync(
    'DELETE FROM water_logs WHERE id = (SELECT MAX(id) FROM water_logs WHERE day = ?)',
    day,
  );
}

export function getMoodCheckin(db: SQLiteDatabase, day: string = toDayKey()) {
  return db.getFirstAsync<MoodCheckin>(
    'SELECT day, mood, note FROM mood_checkins WHERE day = ?',
    day,
  );
}

export async function saveMoodCheckin(db: SQLiteDatabase, checkin: MoodCheckin) {
  await db.runAsync(
    `INSERT INTO mood_checkins (day, mood, note, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(day) DO UPDATE SET mood = excluded.mood, note = excluded.note,
       updated_at = excluded.updated_at`,
    checkin.day,
    checkin.mood,
    checkin.note,
    new Date().toISOString(),
  );
}

// --- Workouts ------------------------------------------------------------

export async function addWorkout(db: SQLiteDatabase, w: NewWorkout) {
  await db.runAsync(
    `INSERT INTO workouts (day, type, started_at, duration_sec, calories, distance_km, effort, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    w.day,
    w.type,
    w.started_at,
    w.duration_sec,
    w.calories,
    w.distance_km,
    w.effort,
    w.note,
  );
}

export function getRecentWorkouts(db: SQLiteDatabase, limit = 10) {
  return db.getAllAsync<Workout>('SELECT * FROM workouts ORDER BY started_at DESC LIMIT ?', limit);
}

export async function deleteWorkout(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM workouts WHERE id = ?', id);
}

/** Every workout between two days (inclusive), oldest first — for pattern analysis. */
export function getWorkoutsBetween(db: SQLiteDatabase, from: string, to: string) {
  return db.getAllAsync<Workout>(
    'SELECT * FROM workouts WHERE day BETWEEN ? AND ? ORDER BY started_at',
    from,
    to,
  );
}

// --- Steps -----------------------------------------------------------------

/** Remembers a day's step total; phones only keep a few days of step history themselves. */
export async function saveDailySteps(db: SQLiteDatabase, day: string, steps: number) {
  await db.runAsync(
    `INSERT INTO daily_steps (day, steps, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(day) DO UPDATE SET steps = MAX(steps, excluded.steps),
       updated_at = excluded.updated_at`,
    day,
    steps,
    new Date().toISOString(),
  );
}

// --- Mind entries ----------------------------------------------------------

export async function addMindEntry(db: SQLiteDatabase, e: NewMindEntry) {
  await db.runAsync(
    `INSERT INTO mind_entries
       (day, created_at, mood, stress, energy, sleep, emotions, journal, gratitude)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    e.day,
    new Date().toISOString(),
    e.mood,
    e.stress,
    e.energy,
    e.sleep,
    JSON.stringify(e.emotions),
    e.journal,
    e.gratitude,
  );
}

export async function getRecentMindEntries(db: SQLiteDatabase, limit = 10): Promise<MindEntry[]> {
  const rows = await db.getAllAsync<Omit<MindEntry, 'emotions'> & { emotions: string }>(
    'SELECT * FROM mind_entries ORDER BY created_at DESC LIMIT ?',
    limit,
  );
  return rows.map((r) => ({ ...r, emotions: JSON.parse(r.emotions) as string[] }));
}

export async function deleteMindEntry(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM mind_entries WHERE id = ?', id);
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

  const waterRows = await db.getAllAsync<{ day: string; ml: number }>(
    'SELECT day, SUM(ml) AS ml FROM water_logs WHERE day BETWEEN ? AND ? GROUP BY day',
    from,
    to,
  );
  // The quick daily check-in and full mind entries both say how the day felt.
  const moodRows = await db.getAllAsync<{ day: string; mood: number }>(
    `SELECT day, AVG(mood) AS mood FROM (
       SELECT day, mood FROM mood_checkins WHERE day BETWEEN ? AND ?
       UNION ALL
       SELECT day, mood FROM mind_entries WHERE day BETWEEN ? AND ?
     ) GROUP BY day`,
    from,
    to,
    from,
    to,
  );
  const stressRows = await db.getAllAsync<{ day: string; stress: number }>(
    'SELECT day, AVG(stress) AS stress FROM mind_entries WHERE day BETWEEN ? AND ? GROUP BY day',
    from,
    to,
  );
  const workoutRows = await db.getAllAsync<{
    day: string;
    calories: number;
    seconds: number;
    count: number;
    km: number;
  }>(
    `SELECT day, SUM(calories) AS calories, SUM(duration_sec) AS seconds, COUNT(*) AS count,
            SUM(COALESCE(distance_km, 0)) AS km
     FROM workouts WHERE day BETWEEN ? AND ? GROUP BY day`,
    from,
    to,
  );
  const stepRows = await db.getAllAsync<{ day: string; steps: number }>(
    'SELECT day, steps FROM daily_steps WHERE day BETWEEN ? AND ?',
    from,
    to,
  );
  const steps = new Map(stepRows.map((r) => [r.day, r.steps]));

  const meals = new Map(mealRows.map((r) => [r.day, r]));
  const meditation = new Map(meditationRows.map((r) => [r.day, r.minutes]));
  const water = new Map(waterRows.map((r) => [r.day, r.ml]));
  const moods = new Map(moodRows.map((r) => [r.day, r.mood]));
  const stress = new Map(stressRows.map((r) => [r.day, r.stress]));
  const workouts = new Map(workoutRows.map((r) => [r.day, r]));

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
      waterMl: water.get(day) ?? 0,
      mood: moods.get(day) ?? null,
      stress: stress.get(day) ?? null,
      activeCalories: workouts.get(day)?.calories ?? 0,
      exerciseMinutes: (workouts.get(day)?.seconds ?? 0) / 60,
      workouts: workouts.get(day)?.count ?? 0,
      steps: steps.get(day) ?? 0,
      distanceKm: workouts.get(day)?.km ?? 0,
    });
  }
  return result;
}

/**
 * Consecutive days, ending today, with any activity (meal, workout, meditation, water or
 * check-in).
 * Today without activity yet doesn't break a streak that ran through yesterday.
 */
export async function getStreak(db: SQLiteDatabase): Promise<number> {
  const rows = await db.getAllAsync<{ day: string }>(
    `SELECT day FROM meals UNION SELECT day FROM meditation_sessions
     UNION SELECT day FROM water_logs UNION SELECT day FROM mood_checkins
     UNION SELECT day FROM workouts UNION SELECT day FROM mind_entries
     ORDER BY day DESC`,
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

// --- Generic settings ----------------------------------------------------

export async function getSetting<T>(db: SQLiteDatabase, key: string): Promise<T | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    key,
  );
  return row ? (JSON.parse(row.value) as T) : null;
}

export async function saveSetting(db: SQLiteDatabase, key: string, value: unknown) {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    JSON.stringify(value),
  );
}
