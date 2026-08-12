export const EVENT_TYPES = [
  'wedding',
  'birthday',
  'baby_shower',
  'graduation',
  'anniversary',
  'housewarming',
  'other',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  wedding: 'Wedding',
  birthday: 'Birthday',
  baby_shower: 'Baby shower',
  graduation: 'Graduation',
  anniversary: 'Anniversary',
  housewarming: 'Housewarming',
  other: 'Celebration',
};

export const VISIBILITY_MODES = ['public', 'surprise_host'] as const;
export type VisibilityMode = (typeof VISIBILITY_MODES)[number];

export interface PublicEvent {
  id: string;
  slug: string;
  title: string;
  event_type: EventType;
  host_name: string;
  /** ISO date, YYYY-MM-DD */
  event_date: string;
  location: string;
  message: string;
  visibility_mode: VisibilityMode;
}

export interface HostEvent extends PublicEvent {
  host_id: string;
  created_at: string;
  updated_at: string;
}

export interface GiftInput {
  name: string;
  description: string;
  product_url: string | null;
  image_url: string | null;
  estimated_price_cents: number | null;
  requested_quantity: number;
  is_unlimited: boolean;
}

export interface Gift extends GiftInput {
  id: string;
  event_id: string;
  created_at: string;
  updated_at: string;
}

/** A purchaser as shown to guests: name + quantity, never an email. */
export interface Purchaser {
  reservation_id: string;
  name: string;
  quantity: number;
  created_at: string;
}

export interface RegistryGift extends Gift {
  claimed_quantity: number;
  purchasers: Purchaser[];
}

export interface RegistryPayload {
  event: PublicEvent;
  gifts: RegistryGift[];
}

/** A reservation row as shown to the host; name is null while masked. */
export interface HostReservationRow {
  reservation_id: string;
  gift_id: string;
  name: string | null;
  quantity: number;
  created_at: string;
  masked: boolean;
}

export interface ReservationDetail {
  reservation: {
    id: string;
    guest_name: string;
    guest_email: string;
    quantity: number;
    created_at: string;
  };
  gift: {
    id: string;
    name: string;
    description: string;
    image_url: string | null;
    product_url: string | null;
    estimated_price_cents: number | null;
    requested_quantity: number;
    is_unlimited: boolean;
    claimed_quantity: number;
  };
  event: {
    slug: string;
    title: string;
    event_date: string;
    host_name: string;
  };
}

export type ReserveError =
  | 'GIFT_NOT_FOUND'
  | 'INSUFFICIENT_QUANTITY'
  | 'QUANTITY_INVALID'
  | 'GUEST_INFO_REQUIRED'
  | 'TOKEN_INVALID'
  | 'RESERVATION_NOT_FOUND'
  | 'NOT_AUTHORIZED'
  | 'UNKNOWN';

export type StoreResult<T> = { ok: true; data: T } | { ok: false; error: ReserveError };
