import type { Purchaser, VisibilityMode } from './types';

/**
 * Purchaser-name visibility rules:
 *  - public: host and guests both see purchaser names.
 *  - surprise_host: guests see purchaser names; the host sees only
 *    quantities until the event date arrives.
 */

export function todayIsoDate(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** True while the host must not see purchaser names. */
export function isHostMasked(
  mode: VisibilityMode,
  eventDate: string,
  today: string = todayIsoDate(),
): boolean {
  if (mode !== 'surprise_host') return false;
  // ISO YYYY-MM-DD strings compare chronologically; masked strictly before
  // the event date.
  return today < eventDate;
}

export type Viewer = 'host' | 'guest';

export interface VisiblePurchaser {
  reservation_id: string;
  name: string | null;
  quantity: number;
  created_at: string;
  masked: boolean;
}

/** Purchasers as a given viewer may see them. Never includes emails. */
export function purchasersForViewer(
  viewer: Viewer,
  mode: VisibilityMode,
  eventDate: string,
  purchasers: Purchaser[],
  today: string = todayIsoDate(),
): VisiblePurchaser[] {
  const masked = viewer === 'host' && isHostMasked(mode, eventDate, today);
  return purchasers.map((p) => ({
    reservation_id: p.reservation_id,
    name: masked ? null : p.name,
    quantity: p.quantity,
    created_at: p.created_at,
    masked,
  }));
}
