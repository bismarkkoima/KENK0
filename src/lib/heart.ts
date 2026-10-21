import type { SQLiteDatabase } from 'expo-sqlite';

import type { GradientName } from '@/constants/theme';
import { toDayKey } from '@/lib/dates';

export type Vital = {
  id: number;
  day: string;
  measured_at: string;
  resting_hr: number | null;
  systolic: number | null;
  diastolic: number | null;
  note: string;
};

export async function addVital(
  db: SQLiteDatabase,
  v: { resting_hr?: number | null; systolic?: number | null; diastolic?: number | null },
) {
  const now = new Date();
  await db.runAsync(
    `INSERT INTO vitals (day, measured_at, resting_hr, systolic, diastolic) VALUES (?, ?, ?, ?, ?)`,
    toDayKey(now),
    now.toISOString(),
    v.resting_hr ?? null,
    v.systolic ?? null,
    v.diastolic ?? null,
  );
}

export function getVitals(db: SQLiteDatabase, limit = 60) {
  return db.getAllAsync<Vital>('SELECT * FROM vitals ORDER BY measured_at DESC LIMIT ?', limit);
}

export async function deleteVital(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM vitals WHERE id = ?', id);
}

export type Category = { label: string; color: GradientName; advice: string };

/**
 * Blood pressure categories from the 2017 ACC/AHA guideline, as published by the American Heart
 * Association. Uses the higher of the two categories when systolic and diastolic disagree.
 */
export function bloodPressureCategory(systolic: number, diastolic: number): Category {
  if (systolic > 180 || diastolic > 120) {
    return {
      label: 'Hypertensive crisis',
      color: 'move',
      advice:
        'Wait five minutes and measure again. If it is still this high — or you have chest pain, shortness of breath, weakness or vision changes — call emergency services now.',
    };
  }
  if (systolic >= 140 || diastolic >= 90) {
    return {
      label: 'High (stage 2)',
      color: 'move',
      advice: 'Talk to a doctor about these readings soon.',
    };
  }
  if (systolic >= 130 || diastolic >= 80) {
    return {
      label: 'High (stage 1)',
      color: 'warm',
      advice: 'Worth discussing with a doctor. Activity, less salt and good sleep all help.',
    };
  }
  if (systolic >= 120) {
    return {
      label: 'Elevated',
      color: 'gold',
      advice: 'Slightly above normal. Regular activity and a balanced diet can bring it down.',
    };
  }
  return { label: 'Normal', color: 'tint', advice: 'In the healthy range. Keep it up.' };
}

/** Typical adult resting heart rate is 60–100 bpm (American Heart Association). */
export function restingHeartCategory(bpm: number): Category {
  if (bpm < 40) {
    return {
      label: 'Very low',
      color: 'warm',
      advice:
        'Can be normal for trained athletes, but see a doctor if you feel dizzy, faint or tired.',
    };
  }
  if (bpm < 60) {
    return {
      label: 'Low',
      color: 'sky',
      advice: 'Common in fit people. Check with a doctor if you have dizziness or fatigue.',
    };
  }
  if (bpm <= 100) {
    return { label: 'Typical', color: 'tint', advice: 'Within the typical adult range of 60–100.' };
  }
  return {
    label: 'High',
    color: 'move',
    advice:
      'Above 100 at rest. Re-measure after sitting quietly for 5 minutes; if it stays high, talk to a doctor.',
  };
}
