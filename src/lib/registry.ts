/**
 * Pure availability math for gifts. The PostgreSQL create_reservation
 * function is the source of truth in production; these mirror its rules for
 * UI display, the in-memory store, and unit tests.
 */

export interface QuantityShape {
  requested_quantity: number;
  is_unlimited: boolean;
}

export function claimedQuantity(reservations: Array<{ quantity: number }>): number {
  return reservations.reduce((sum, r) => sum + r.quantity, 0);
}

/** Remaining units, or null for unlimited gifts. Never negative. */
export function remainingQuantity(gift: QuantityShape, claimed: number): number | null {
  if (gift.is_unlimited) return null;
  return Math.max(0, gift.requested_quantity - claimed);
}

export function isFullyClaimed(gift: QuantityShape, claimed: number): boolean {
  return !gift.is_unlimited && claimed >= gift.requested_quantity;
}

export const MAX_RESERVATION_QUANTITY = 1000;

export type ReserveCheck =
  | { ok: true }
  | { ok: false; reason: 'QUANTITY_INVALID' | 'INSUFFICIENT_QUANTITY' };

/**
 * Can `requested` more units be reserved, given `claimedByOthers` units
 * already claimed by other reservations? For an update, pass the claim total
 * excluding the reservation being changed.
 */
export function canReserve(
  gift: QuantityShape,
  claimedByOthers: number,
  requested: number,
): ReserveCheck {
  if (!Number.isInteger(requested) || requested < 1 || requested > MAX_RESERVATION_QUANTITY) {
    return { ok: false, reason: 'QUANTITY_INVALID' };
  }
  if (!gift.is_unlimited && claimedByOthers + requested > gift.requested_quantity) {
    return { ok: false, reason: 'INSUFFICIENT_QUANTITY' };
  }
  return { ok: true };
}

/** Largest quantity a single reservation could take right now (null = no cap). */
export function maxReservable(gift: QuantityShape, claimedByOthers: number): number | null {
  if (gift.is_unlimited) return null;
  return Math.max(0, gift.requested_quantity - claimedByOthers);
}
