/** Pure local-date math for the date picker. No timezone conversions. */

export interface CalendarDay {
  iso: string;
  day: number;
  inMonth: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Local YYYY-MM-DD. (new Date().toISOString() would use UTC and shift evenings.) */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "August 2026" for a 0-based month. */
export function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    new Date(year, month, 1),
  );
}

export function addMonths(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

/** 42 cells (6 full weeks) starting Sunday, covering the 0-based month. */
export function monthGrid(year: number, month: number): CalendarDay[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const cells: CalendarDay[] = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(year, month, 1 - firstWeekday + i);
    cells.push({ iso: toISODate(d), day: d.getDate(), inMonth: d.getMonth() === month });
  }
  return cells;
}

/** "00:00" through "23:45" in stepMinutes increments. */
export function timeOptions(stepMinutes = 15): string[] {
  const out: string[] = [];
  for (let m = 0; m < 24 * 60; m += stepMinutes) {
    out.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
  }
  return out;
}
