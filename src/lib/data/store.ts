import type {
  Gift,
  GiftInput,
  HostEvent,
  HostReservationRow,
  RegistryPayload,
  ReservationDetail,
  StoreResult,
  EventType,
  VisibilityMode,
} from '../types';

export interface EventInput {
  title: string;
  event_type: EventType;
  host_name: string;
  event_date: string;
  location: string;
  message: string;
  visibility_mode: VisibilityMode;
}

export interface EventSummary extends HostEvent {
  gift_count: number;
  reservation_count: number;
}

export interface HostGift extends Gift {
  claimed_quantity: number;
}

export interface HostEventDetail {
  event: HostEvent;
  gifts: HostGift[];
  /** Reservation rows with names already masked per the visibility rules. */
  reservations: HostReservationRow[];
}

export interface CreateReservationInput {
  giftId: string;
  guestName: string;
  guestEmail: string;
  quantity: number;
  tokenHash: string;
}

/**
 * One interface, two implementations: SupabaseStore (production) and
 * MemoryStore (seeded fixtures for credential-free development and tests).
 */
export interface DataStore {
  // Guest-facing
  getRegistryBySlug(slug: string): Promise<RegistryPayload | null>;
  createReservation(
    input: CreateReservationInput,
  ): Promise<StoreResult<{ id: string; duplicate: boolean }>>;
  getReservationByTokenHash(tokenHash: string): Promise<ReservationDetail | null>;
  updateReservationByTokenHash(
    tokenHash: string,
    quantity: number,
  ): Promise<StoreResult<{ id: string; quantity: number }>>;
  cancelReservationByTokenHash(tokenHash: string): Promise<StoreResult<{ id: string }>>;

  // Host-facing (hostId comes from the verified session; the Supabase
  // implementation additionally enforces this via RLS)
  listHostEvents(hostId: string): Promise<EventSummary[]>;
  getHostEventDetail(hostId: string, eventId: string): Promise<HostEventDetail | null>;
  createEvent(
    hostId: string,
    slug: string,
    input: EventInput,
  ): Promise<StoreResult<{ id: string; slug: string }>>;
  updateEvent(hostId: string, eventId: string, input: EventInput): Promise<StoreResult<{ id: string }>>;
  deleteEvent(hostId: string, eventId: string): Promise<StoreResult<{ id: string }>>;
  createGift(hostId: string, eventId: string, input: GiftInput): Promise<StoreResult<{ id: string }>>;
  updateGift(hostId: string, giftId: string, input: GiftInput): Promise<StoreResult<{ id: string }>>;
  deleteGift(hostId: string, giftId: string): Promise<StoreResult<{ id: string }>>;
}
