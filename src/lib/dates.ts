/** Local calendar day as `YYYY-MM-DD`, used as the grouping key for all logs. */
export function toDayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromDayKey(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(day: string, delta: number): string {
  const date = fromDayKey(day);
  date.setDate(date.getDate() + delta);
  return toDayKey(date);
}

/** The `count` days ending today, oldest first. */
export function lastDays(count: number, end: string = toDayKey()): string[] {
  return Array.from({ length: count }, (_, i) => addDays(end, i - count + 1));
}

export function formatDayLabel(day: string): string {
  const today = toDayKey();
  if (day === today) return 'Today';
  if (day === addDays(today, -1)) return 'Yesterday';
  return fromDayKey(day).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function shortWeekday(day: string): string {
  return fromDayKey(day).toLocaleDateString(undefined, { weekday: 'narrow' });
}

export function greeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
