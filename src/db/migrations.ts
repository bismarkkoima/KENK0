import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Each entry upgrades the schema by one version. Never edit a shipped migration —
 * append a new one instead, so existing installs upgrade cleanly.
 */
const MIGRATIONS: string[] = [
  `
  CREATE TABLE meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day TEXT NOT NULL,
    meal_type TEXT NOT NULL,
    name TEXT NOT NULL,
    calories REAL NOT NULL DEFAULT 0,
    protein REAL NOT NULL DEFAULT 0,
    carbs REAL NOT NULL DEFAULT 0,
    fat REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE INDEX meals_day ON meals (day);

  CREATE TABLE meditation_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day TEXT NOT NULL,
    meditation_id TEXT NOT NULL,
    minutes REAL NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX meditation_sessions_day ON meditation_sessions (day);

  CREATE TABLE settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  `,
  `
  CREATE TABLE water_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day TEXT NOT NULL,
    ml REAL NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX water_logs_day ON water_logs (day);

  CREATE TABLE mood_checkins (
    day TEXT PRIMARY KEY NOT NULL,
    mood INTEGER NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL
  );
  `,
  `
  CREATE TABLE workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day TEXT NOT NULL,
    type TEXT NOT NULL,
    started_at TEXT NOT NULL,
    duration_sec INTEGER NOT NULL,
    calories REAL NOT NULL,
    distance_km REAL,
    effort INTEGER NOT NULL DEFAULT 3,
    note TEXT NOT NULL DEFAULT ''
  );
  CREATE INDEX workouts_day ON workouts (day);

  CREATE TABLE mind_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day TEXT NOT NULL,
    created_at TEXT NOT NULL,
    mood INTEGER NOT NULL,
    stress INTEGER NOT NULL,
    energy INTEGER NOT NULL,
    sleep INTEGER NOT NULL,
    emotions TEXT NOT NULL DEFAULT '[]',
    journal TEXT NOT NULL DEFAULT '',
    gratitude TEXT NOT NULL DEFAULT ''
  );
  CREATE INDEX mind_entries_day ON mind_entries (day);
  `,
  `
  CREATE TABLE daily_steps (
    day TEXT PRIMARY KEY NOT NULL,
    steps INTEGER NOT NULL,
    updated_at TEXT NOT NULL
  );
  `,
  `
  CREATE TABLE vitals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day TEXT NOT NULL,
    measured_at TEXT NOT NULL,
    resting_hr INTEGER,
    systolic INTEGER,
    diastolic INTEGER,
    note TEXT NOT NULL DEFAULT ''
  );
  CREATE INDEX vitals_day ON vitals (day);
  `,
];

export async function migrateDb(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;

  while (version < MIGRATIONS.length) {
    const sql = MIGRATIONS[version];
    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
    });
    version += 1;
    await db.execAsync(`PRAGMA user_version = ${version}`);
  }
}
