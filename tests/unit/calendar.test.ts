import { describe, expect, it } from 'vitest';
import { addMonths, monthGrid, monthLabel, timeOptions, toISODate } from '@/lib/calendar';

describe('monthGrid', () => {
  it('returns 42 Sunday-first cells for August 2026', () => {
    const grid = monthGrid(2026, 7);
    expect(grid).toHaveLength(42);
    // 2026-08-01 is a Saturday: the week starts on Sunday July 26.
    expect(grid[0]).toEqual({ iso: '2026-07-26', day: 26, inMonth: false });
    expect(grid[6]).toEqual({ iso: '2026-08-01', day: 1, inMonth: true });
    expect(grid.filter((c) => c.inMonth)).toHaveLength(31);
  });
  it('handles leap February', () => {
    const grid = monthGrid(2028, 1);
    expect(grid.some((c) => c.iso === '2028-02-29' && c.inMonth)).toBe(true);
  });
});

describe('addMonths', () => {
  it('wraps year boundaries both ways', () => {
    expect(addMonths(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
    expect(addMonths(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
  });
});

describe('monthLabel', () => {
  it('names the month and year', () => {
    expect(monthLabel(2026, 7)).toBe('August 2026');
  });
});

describe('toISODate', () => {
  it('uses the local date', () => {
    expect(toISODate(new Date(2026, 7, 15))).toBe('2026-08-15');
  });
});

describe('timeOptions', () => {
  it('covers the day in 15-minute steps', () => {
    const times = timeOptions();
    expect(times).toHaveLength(96);
    expect(times[0]).toBe('00:00');
    expect(times[95]).toBe('23:45');
    expect(times).toContain('17:30');
  });
});
