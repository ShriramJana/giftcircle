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
