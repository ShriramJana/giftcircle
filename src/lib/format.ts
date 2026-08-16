export function formatPrice(cents: number | null): string | null {
  if (cents === null) return null;
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(dollars);
}

/** "Saturday, November 14, 2026" from a YYYY-MM-DD date. */
export function formatEventDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatShortDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

const SLUG_SUFFIX_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** URL slug from a title plus a short random suffix to keep it unguessable-ish and unique. */
export function generateSlug(title: string): string {
  let suffix = '';
  for (let i = 0; i < 6; i += 1) {
    suffix += SLUG_SUFFIX_ALPHABET[Math.floor(Math.random() * SLUG_SUFFIX_ALPHABET.length)];
  }
  const base = slugify(title) || 'event';
  return `${base}-${suffix}`;
}

/** "5:30 PM" from "17:30" (also accepts Postgres's "17:30:00"). */
export function formatTime(time: string): string {
  const match = time.match(/^(\d{2}):(\d{2})/);
  if (!match) return time;
  const hours24 = parseInt(match[1], 10);
  if (hours24 > 23) return time;
  const meridiem = hours24 >= 12 ? 'PM' : 'AM';
  const hours = hours24 % 12 || 12;
  return `${hours}:${match[2]} ${meridiem}`;
}

/**
 * "Saturday, November 14, 2026, 5:00 to 9:00 PM". Date only when there is
 * no start time; an end time without a start is ignored (cannot happen via
 * validation, but Postgres data is the source of truth).
 */
export function formatEventDateTime(
  isoDate: string,
  startTime?: string | null,
  endTime?: string | null,
): string {
  const datePart = formatEventDate(isoDate);
  if (!startTime) return datePart;
  const start = formatTime(startTime);
  if (!endTime) return `${datePart}, ${start}`;
  const end = formatTime(endTime);
  const [startClock, startMeridiem] = start.split(' ');
  const [, endMeridiem] = end.split(' ');
  const range = startMeridiem === endMeridiem ? `${startClock} to ${end}` : `${start} to ${end}`;
  return `${datePart}, ${range}`;
}
