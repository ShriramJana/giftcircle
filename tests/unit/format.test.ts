import { describe, expect, it } from 'vitest';
import { formatEventDateTime, formatTime } from '@/lib/format';

describe('formatTime', () => {
  it('formats afternoon times', () => {
    expect(formatTime('17:30')).toBe('5:30 PM');
  });
  it('formats midnight and noon', () => {
    expect(formatTime('00:00')).toBe('12:00 AM');
    expect(formatTime('12:15')).toBe('12:15 PM');
  });
  it('tolerates Postgres seconds', () => {
    expect(formatTime('09:05:00')).toBe('9:05 AM');
  });
  it('returns unrecognized input unchanged', () => {
    expect(formatTime('later')).toBe('later');
  });
});

describe('formatEventDateTime', () => {
  it('is date-only without a start time', () => {
    expect(formatEventDateTime('2026-11-14')).toBe('Saturday, November 14, 2026');
    expect(formatEventDateTime('2026-11-14', null, '21:00')).toBe('Saturday, November 14, 2026');
  });
  it('appends the start time', () => {
    expect(formatEventDateTime('2026-11-14', '17:00')).toBe('Saturday, November 14, 2026, 5:00 PM');
  });
  it('collapses a same-meridiem range', () => {
    expect(formatEventDateTime('2026-11-14', '17:00', '21:00')).toBe(
      'Saturday, November 14, 2026, 5:00 to 9:00 PM',
    );
  });
  it('keeps both meridiems when they differ', () => {
    expect(formatEventDateTime('2026-11-14', '11:00', '13:00')).toBe(
      'Saturday, November 14, 2026, 11:00 AM to 1:00 PM',
    );
  });
});
