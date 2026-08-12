import { createHash, randomBytes } from 'node:crypto';

/**
 * Reservation management tokens: the raw token lives only in the guest's
 * private link; the database stores its sha256 hash. The raw token also acts
 * as an idempotency key — resubmitting the same reserve form reuses it.
 */

export function generateManagementToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Loose shape check before hitting the database. */
export function isPlausibleToken(token: string): boolean {
  return typeof token === 'string' && token.length >= 8 && token.length <= 128;
}
