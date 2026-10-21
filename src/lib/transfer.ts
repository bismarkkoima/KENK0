import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';

import { estimateCalories, getWorkoutType } from '@/data/workouts';
import { getGoals, saveDailySteps } from '@/db/queries';
import { parseBackup, type Backup } from '@/lib/backup';

/**
 * Bring health history from other ecosystems into Kenko:
 *
 * - Apple Health: the `export.xml` inside the zip from Health › profile › Export All Health Data.
 * - Samsung Health: the `com.samsung.shealth.step_daily_trend.*.csv` file from
 *   Settings › Download personal data.
 * - Google Fit: `Daily activity metrics.csv` from Google Takeout.
 * - Kenko itself: a transfer/backup file exported on another phone (iPhone ⇄ Android).
 *
 * Imports merge into what's already here and skip anything already imported.
 */

export type ImportedWorkout = {
  type: string;
  startedAt: string;
  durationSec: number;
  calories: number | null;
  distanceKm: number | null;
};

export type ImportedVital = {
  measuredAt: string;
  restingHr: number | null;
  systolic: number | null;
  diastolic: number | null;
};

export type HealthImport = {
  source: 'Apple Health' | 'Samsung Health' | 'Google Fit';
  workouts: ImportedWorkout[];
  steps: Map<string, number>;
  vitals: ImportedVital[];
  mindful: { startedAt: string; minutes: number }[];
};

export type PickedFile =
  | { kind: 'kenko'; backup: Backup }
  | { kind: 'health'; data: HealthImport }
  | { kind: 'zip' }
  | { kind: 'unknown' };

/** Lets the person choose a file, reads it and works out which kind of export it is. */
export async function pickTransferFile(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (asset.name.toLowerCase().endsWith('.zip')) return { kind: 'zip' };
  const text =
    Platform.OS === 'web'
      ? await (await fetch(asset.uri)).text()
      : await new File(asset.uri).text();
  return detect(text);
}

export function detect(text: string): PickedFile {
  const head = text.slice(0, 4000);
  if (head.trimStart().startsWith('{')) {
    try {
      return { kind: 'kenko', backup: parseBackup(text) };
    } catch {
      return { kind: 'unknown' };
    }
  }
  if (head.includes('<HealthData')) return { kind: 'health', data: parseAppleHealth(text) };
  if (/day_time/.test(head) && /\bcount\b/.test(head)) {
    return { kind: 'health', data: parseSamsungSteps(text) };
  }
  if (/(^|,)Date,/.test(head) && /Step count/.test(head)) {
    return { kind: 'health', data: parseGoogleFitDaily(text) };
  }
  return { kind: 'unknown' };
}

// --- Apple Health -----------------------------------------------------------------------------

/** Apple Health workout types → Kenko activity ids. */
const APPLE_TYPES: Record<string, string> = {
  Running: 'run',
  Walking: 'walk',
  Cycling: 'cycle',
  Swimming: 'swim',
  Hiking: 'hike',
  Yoga: 'yoga',
  TraditionalStrengthTraining: 'strength',
  FunctionalStrengthTraining: 'free-weights',
  HighIntensityIntervalTraining: 'hiit',
  Rowing: 'rower',
  Elliptical: 'elliptical',
  StairClimbing: 'stairs',
  Stairs: 'stairs',
  JumpRope: 'jump-rope',
  Soccer: 'football',
  Basketball: 'basketball',
  Tennis: 'tennis',
  Badminton: 'badminton',
  Volleyball: 'volleyball',
  TableTennis: 'table-tennis',
  Cricket: 'cricket',
  Baseball: 'baseball',
  Softball: 'baseball',
  Rugby: 'rugby',
  AmericanFootball: 'american-football',
  Hockey: 'hockey',
  Handball: 'handball',
  Squash: 'squash',
  Golf: 'golf',
  Boxing: 'boxing',
  Kickboxing: 'martial-arts',
  MartialArts: 'martial-arts',
  Wrestling: 'wrestling',
  Fencing: 'fencing',
  WaterPolo: 'water-polo',
  PaddleSports: 'kayaking',
  SurfingSports: 'surfing',
  Sailing: 'sailing',
  DownhillSkiing: 'ski',
  CrossCountrySkiing: 'ski-xc',
  Snowboarding: 'snowboard',
  SkatingSports: 'skating',
  Climbing: 'climbing',
  EquestrianSports: 'horse-riding',
  Pilates: 'pilates',
  TaiChi: 'tai-chi',
  Flexibility: 'stretching',
  Dance: 'dance',
  SocialDance: 'dance',
  CardioDance: 'dance',
  Gymnastics: 'gymnastics',
  CoreTraining: 'core',
  CrossTraining: 'circuit',
  MixedCardio: 'other',
};

function attrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of tag.matchAll(/(\w+)="([^"]*)"/g)) out[m[1]] = m[2];
  return out;
}

/** "2024-03-01 07:12:00 +0100" → ISO 8601. */
function appleDate(value: string): string {
  const m = value.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([+-])(\d{2})(\d{2})$/);
  if (!m) return new Date(value).toISOString();
  return new Date(`${m[1]}T${m[2]}${m[3]}${m[4]}:${m[5]}`).toISOString();
}

function toKm(value: number, unit: string) {
  if (unit === 'mi') return value * 1.609344;
  if (unit === 'm') return value / 1000;
  return value;
}

function toKcal(value: number, unit: string) {
  return unit === 'kJ' ? value / 4.184 : value;
}

export function parseAppleHealth(xml: string): HealthImport {
  // Steps: sum per day per source, then keep the busiest source each day — a phone and a watch
  // both count the same steps, so adding them together would double-count.
  const stepsBySource = new Map<string, Map<string, number>>();
  const vitalsByTime = new Map<string, ImportedVital>();
  const mindful: HealthImport['mindful'] = [];

  for (const m of xml.matchAll(/<Record\b([^>]*?)\/?>/g)) {
    const tag = m[1];
    if (
      !/type="HK(QuantityTypeIdentifier(StepCount|RestingHeartRate|BloodPressure)|CategoryTypeIdentifierMindfulSession)/.test(
        tag,
      )
    ) {
      continue;
    }
    const a = attrs(tag);
    if (a.type === 'HKQuantityTypeIdentifierStepCount') {
      const day = a.startDate.slice(0, 10);
      const bySource = stepsBySource.get(day) ?? new Map<string, number>();
      bySource.set(a.sourceName, (bySource.get(a.sourceName) ?? 0) + Number(a.value));
      stepsBySource.set(day, bySource);
    } else if (a.type === 'HKCategoryTypeIdentifierMindfulSession') {
      const start = new Date(appleDate(a.startDate));
      const end = new Date(appleDate(a.endDate));
      const minutes = (end.getTime() - start.getTime()) / 60000;
      if (minutes > 0)
        mindful.push({ startedAt: start.toISOString(), minutes: Math.round(minutes * 10) / 10 });
    } else {
      const at = appleDate(a.startDate);
      const v = vitalsByTime.get(at) ?? {
        measuredAt: at,
        restingHr: null,
        systolic: null,
        diastolic: null,
      };
      const n = Math.round(Number(a.value));
      if (a.type.endsWith('RestingHeartRate')) v.restingHr = n;
      if (a.type.endsWith('BloodPressureSystolic')) v.systolic = n;
      if (a.type.endsWith('BloodPressureDiastolic')) v.diastolic = n;
      vitalsByTime.set(at, v);
    }
  }

  const workouts: ImportedWorkout[] = [];
  for (const m of xml.matchAll(/<Workout\b([^>]*?)(?:\/>|>([\s\S]*?)<\/Workout>)/g)) {
    const a = attrs(m[1]);
    const body = m[2] ?? '';
    const kind = (a.workoutActivityType ?? '').replace('HKWorkoutActivityType', '');
    const minutes =
      a.durationUnit === 'sec'
        ? Number(a.duration) / 60
        : a.durationUnit === 'hr'
          ? Number(a.duration) * 60
          : Number(a.duration);
    let calories = a.totalEnergyBurned
      ? toKcal(Number(a.totalEnergyBurned), a.totalEnergyBurnedUnit)
      : null;
    let distanceKm = a.totalDistance ? toKm(Number(a.totalDistance), a.totalDistanceUnit) : null;
    // Newer exports keep totals in child <WorkoutStatistics> elements instead.
    for (const s of body.matchAll(/<WorkoutStatistics\b([^>]*?)\/?>/g)) {
      const st = attrs(s[1]);
      if (!st.sum) continue;
      if (st.type?.endsWith('ActiveEnergyBurned') && calories === null)
        calories = toKcal(Number(st.sum), st.unit);
      if (/Distance/.test(st.type ?? '') && distanceKm === null)
        distanceKm = toKm(Number(st.sum), st.unit);
    }
    if (!Number.isFinite(minutes) || minutes <= 0) continue;
    workouts.push({
      type: APPLE_TYPES[kind] ?? 'other',
      startedAt: appleDate(a.startDate),
      durationSec: Math.round(minutes * 60),
      calories: calories !== null && Number.isFinite(calories) ? Math.round(calories) : null,
      distanceKm: distanceKm !== null && distanceKm > 0 ? Math.round(distanceKm * 100) / 100 : null,
    });
  }

  const steps = new Map<string, number>();
  for (const [day, bySource] of stepsBySource) {
    steps.set(day, Math.round(Math.max(...bySource.values())));
  }

  return { source: 'Apple Health', workouts, steps, vitals: [...vitalsByTime.values()], mindful };
}

// --- Samsung Health & Google Fit (CSV) ---------------------------------------------------------

function csvRows(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter((l) => l.trim() !== '')
    .map((l) => l.split(',').map((c) => c.trim().replace(/^"|"$/g, '')));
}

/** Samsung's daily step summary. The first line is metadata; the second is the header. */
export function parseSamsungSteps(text: string): HealthImport {
  const rows = csvRows(text);
  const headerIndex = rows.findIndex((r) => r.includes('day_time'));
  const header = rows[headerIndex];
  const col = (name: string) => header.findIndex((h) => h === name || h.endsWith(`.${name}`));
  const dayCol = col('day_time');
  const countCol = col('count');
  const sourceCol = col('source_type');
  const data = rows.slice(headerIndex + 1);
  // source_type -2 is Samsung's merged total across phone and watch; prefer it when present.
  const hasMerged = sourceCol >= 0 && data.some((r) => r[sourceCol] === '-2');
  const steps = new Map<string, number>();
  for (const r of data) {
    if (hasMerged && r[sourceCol] !== '-2') continue;
    const day = new Date(Number(r[dayCol])).toISOString().slice(0, 10);
    const count = Number(r[countCol]);
    if (!Number.isFinite(count) || day.startsWith('NaN')) continue;
    steps.set(day, Math.max(steps.get(day) ?? 0, Math.round(count)));
  }
  return { source: 'Samsung Health', workouts: [], steps, vitals: [], mindful: [] };
}

/** Google Takeout › Fit › Daily activity metrics. */
export function parseGoogleFitDaily(text: string): HealthImport {
  const [header, ...rows] = csvRows(text);
  const dateCol = header.indexOf('Date');
  const stepCol = header.indexOf('Step count');
  const steps = new Map<string, number>();
  for (const r of rows) {
    const count = Number(r[stepCol]);
    if (/^\d{4}-\d{2}-\d{2}$/.test(r[dateCol]) && Number.isFinite(count) && count > 0) {
      steps.set(r[dateCol], Math.round(count));
    }
  }
  return { source: 'Google Fit', workouts: [], steps, vitals: [], mindful: [] };
}

// --- Merge into Kenko ---------------------------------------------------------------------------

export function summarizeImport(data: HealthImport) {
  const days = [...data.steps.keys()].sort();
  return {
    workouts: data.workouts.length,
    stepDays: days.length,
    vitals: data.vitals.length,
    mindful: data.mindful.length,
    from: days[0] ?? data.workouts[0]?.startedAt.slice(0, 10) ?? null,
    to: days[days.length - 1] ?? null,
  };
}

/** Adds imported records, skipping any that are already in Kenko. Returns what was added. */
export async function mergeHealthImport(db: SQLiteDatabase, data: HealthImport) {
  const { weightKg } = await getGoals(db);
  const added = { workouts: 0, stepDays: 0, vitals: 0, mindful: 0 };
  const localDay = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  await db.withTransactionAsync(async () => {
    for (const w of data.workouts) {
      const exists = await db.getFirstAsync(
        'SELECT 1 FROM workouts WHERE started_at = ? AND type = ?',
        w.startedAt,
        w.type,
      );
      if (exists) continue;
      await db.runAsync(
        `INSERT INTO workouts (day, type, started_at, duration_sec, calories, distance_km, effort, note)
         VALUES (?, ?, ?, ?, ?, ?, 3, ?)`,
        localDay(w.startedAt),
        w.type,
        w.startedAt,
        w.durationSec,
        w.calories ?? estimateCalories(getWorkoutType(w.type), w.durationSec, weightKg),
        w.distanceKm,
        `Imported from ${data.source}`,
      );
      added.workouts++;
    }
    for (const [day, steps] of data.steps) {
      await saveDailySteps(db, day, steps);
      added.stepDays++;
    }
    for (const v of data.vitals) {
      const exists = await db.getFirstAsync(
        'SELECT 1 FROM vitals WHERE measured_at = ?',
        v.measuredAt,
      );
      if (exists) continue;
      await db.runAsync(
        `INSERT INTO vitals (day, measured_at, resting_hr, systolic, diastolic, note) VALUES (?, ?, ?, ?, ?, ?)`,
        localDay(v.measuredAt),
        v.measuredAt,
        v.restingHr,
        v.systolic,
        v.diastolic,
        `Imported from ${data.source}`,
      );
      added.vitals++;
    }
    for (const s of data.mindful) {
      const exists = await db.getFirstAsync(
        'SELECT 1 FROM meditation_sessions WHERE created_at = ?',
        s.startedAt,
      );
      if (exists) continue;
      await db.runAsync(
        'INSERT INTO meditation_sessions (day, meditation_id, minutes, created_at) VALUES (?, ?, ?, ?)',
        localDay(s.startedAt),
        'imported',
        s.minutes,
        s.startedAt,
      );
      added.mindful++;
    }
  });
  return added;
}
