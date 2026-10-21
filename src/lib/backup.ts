import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';

/** Every table holding the person's data. Order matters for restore (no foreign keys today). */
const TABLES = [
  'settings',
  'meals',
  'workouts',
  'meditation_sessions',
  'water_logs',
  'mood_checkins',
  'mind_entries',
  'daily_steps',
] as const;

type Row = Record<string, string | number | null>;

export type Backup = {
  app: 'kenko';
  format: 1;
  schemaVersion: number;
  exportedAt: string;
  tables: Partial<Record<(typeof TABLES)[number], Row[]>>;
};

export async function createBackup(db: SQLiteDatabase): Promise<Backup> {
  const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const tables: Backup['tables'] = {};
  for (const t of TABLES) tables[t] = await db.getAllAsync<Row>(`SELECT * FROM ${t}`);
  return {
    app: 'kenko',
    format: 1,
    schemaVersion: version?.user_version ?? 0,
    exportedAt: new Date().toISOString(),
    tables,
  };
}

export function backupFileName(date = new Date()) {
  return `kenko-backup-${date.toISOString().slice(0, 10)}.json`;
}

/**
 * Writes a backup file and opens the share sheet, so it can be saved to Google Drive, Files,
 * email, etc. On the web it downloads the file instead.
 */
export async function exportBackup(db: SQLiteDatabase) {
  const json = JSON.stringify(await createBackup(db));
  const name = backupFileName();

  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  await file.write(json);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'Save your Kenko backup',
  });
}

/** Lets the person choose a backup file. Resolves to `null` if they cancel. */
export async function pickBackup(): Promise<Backup | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  const text =
    Platform.OS === 'web'
      ? await (await fetch(asset.uri)).text()
      : await new File(asset.uri).text();
  return parseBackup(text);
}

export function parseBackup(text: string): Backup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file isn’t a Kenko backup.');
  }
  const backup = data as Partial<Backup>;
  if (backup.app !== 'kenko' || backup.format !== 1 || typeof backup.tables !== 'object') {
    throw new Error('That file isn’t a Kenko backup.');
  }
  return backup as Backup;
}

export function summarizeBackup(backup: Backup) {
  const t = backup.tables;
  return {
    exportedAt: new Date(backup.exportedAt),
    workouts: t.workouts?.length ?? 0,
    meals: t.meals?.length ?? 0,
    checkins: (t.mind_entries?.length ?? 0) + (t.mood_checkins?.length ?? 0),
  };
}

/**
 * Replaces everything on this phone with the backup's contents, in one transaction so a failure
 * leaves the current data untouched. Only columns that exist in this app version are restored.
 */
export async function restoreBackup(db: SQLiteDatabase, backup: Backup) {
  await db.withTransactionAsync(async () => {
    for (const table of TABLES) {
      const columns = new Set(
        (await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`)).map((c) => c.name),
      );
      await db.runAsync(`DELETE FROM ${table}`);
      for (const row of backup.tables[table] ?? []) {
        const keys = Object.keys(row).filter((k) => columns.has(k));
        if (keys.length === 0) continue;
        await db.runAsync(
          `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
          keys.map((k) => row[k]),
        );
      }
    }
  });
}
