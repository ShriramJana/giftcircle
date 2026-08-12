import type {
  GiftInput,
  HostEvent,
  RegistryPayload,
  ReservationDetail,
  ReserveError,
  StoreResult,
} from '../types';
import { createSupabaseServerClient } from '../supabase/server';
import type {
  CreateReservationInput,
  DataStore,
  EventInput,
  EventSummary,
  HostEventDetail,
  HostGift,
} from './store';

/**
 * Supabase-backed DataStore. Reservation paths go through the SECURITY
 * DEFINER SQL functions (atomic inventory checks, sanitized output); host
 * CRUD uses the session-scoped client so RLS enforces ownership.
 */

const KNOWN_ERRORS: ReserveError[] = [
  'GIFT_NOT_FOUND',
  'INSUFFICIENT_QUANTITY',
  'QUANTITY_INVALID',
  'GUEST_INFO_REQUIRED',
  'TOKEN_INVALID',
  'RESERVATION_NOT_FOUND',
  'NOT_AUTHORIZED',
];

function toReserveError(message: string | undefined): ReserveError {
  const hit = KNOWN_ERRORS.find((code) => message?.includes(code));
  return hit ?? 'UNKNOWN';
}

export class SupabaseStore implements DataStore {
  async getRegistryBySlug(slug: string): Promise<RegistryPayload | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('get_event_registry', { p_slug: slug });
    if (error) throw new Error(`get_event_registry failed: ${error.message}`);
    return (data as RegistryPayload | null) ?? null;
  }

  async createReservation(
    input: CreateReservationInput,
  ): Promise<StoreResult<{ id: string; duplicate: boolean }>> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('create_reservation', {
      p_gift_id: input.giftId,
      p_guest_name: input.guestName,
      p_guest_email: input.guestEmail,
      p_quantity: input.quantity,
      p_token_hash: input.tokenHash,
    });
    if (error) return { ok: false, error: toReserveError(error.message) };
    const row = data as { id: string; duplicate: boolean };
    return { ok: true, data: { id: row.id, duplicate: Boolean(row.duplicate) } };
  }

  async getReservationByTokenHash(tokenHash: string): Promise<ReservationDetail | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('get_reservation_by_token', {
      p_token_hash: tokenHash,
    });
    if (error) throw new Error(`get_reservation_by_token failed: ${error.message}`);
    return (data as ReservationDetail | null) ?? null;
  }

  async updateReservationByTokenHash(
    tokenHash: string,
    quantity: number,
  ): Promise<StoreResult<{ id: string; quantity: number }>> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('update_reservation_by_token', {
      p_token_hash: tokenHash,
      p_quantity: quantity,
    });
    if (error) return { ok: false, error: toReserveError(error.message) };
    const row = data as { id: string; quantity: number };
    return { ok: true, data: row };
  }

  async cancelReservationByTokenHash(tokenHash: string): Promise<StoreResult<{ id: string }>> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('cancel_reservation_by_token', {
      p_token_hash: tokenHash,
    });
    if (error) return { ok: false, error: toReserveError(error.message) };
    return { ok: true, data: { id: (data as { id: string }).id } };
  }

  async listHostEvents(hostId: string): Promise<EventSummary[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('events')
      .select('*, gifts(id)')
      .eq('host_id', hostId)
      .order('event_date', { ascending: true });
    if (error) throw new Error(`listHostEvents failed: ${error.message}`);

    const events = (data ?? []) as Array<HostEvent & { gifts: Array<{ id: string }> }>;
    const summaries: EventSummary[] = [];
    for (const row of events) {
      const { gifts, ...event } = row;
      let reservationCount = 0;
      // Reservation counts come from the host RPC (reservations have no
      // direct read access).
      const { data: rows } = await supabase.rpc('get_host_event_reservations', {
        p_event_id: event.id,
      });
      if (Array.isArray(rows)) reservationCount = rows.length;
      summaries.push({ ...event, gift_count: gifts.length, reservation_count: reservationCount });
    }
    return summaries;
  }

  async getHostEventDetail(hostId: string, eventId: string): Promise<HostEventDetail | null> {
    const supabase = await createSupabaseServerClient();
    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('host_id', hostId)
      .maybeSingle();
    if (error) throw new Error(`getHostEventDetail failed: ${error.message}`);
    if (!event) return null;

    const { data: giftRows, error: giftsError } = await supabase
      .from('gifts')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });
    if (giftsError) throw new Error(`getHostEventDetail gifts failed: ${giftsError.message}`);

    const { data: reservationRows, error: resError } = await supabase.rpc(
      'get_host_event_reservations',
      { p_event_id: eventId },
    );
    if (resError) throw new Error(`get_host_event_reservations failed: ${resError.message}`);

    const reservations = (Array.isArray(reservationRows) ? reservationRows : []) as
      HostEventDetail['reservations'];
    const claimedByGift = new Map<string, number>();
    for (const r of reservations) {
      claimedByGift.set(r.gift_id, (claimedByGift.get(r.gift_id) ?? 0) + r.quantity);
    }

    const gifts: HostGift[] = (giftRows ?? []).map((g) => ({
      ...(g as HostGift),
      claimed_quantity: claimedByGift.get((g as HostGift).id) ?? 0,
    }));

    return { event: event as HostEvent, gifts, reservations };
  }

  async createEvent(
    hostId: string,
    slug: string,
    input: EventInput,
  ): Promise<StoreResult<{ id: string; slug: string }>> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('events')
      .insert({ host_id: hostId, slug, ...input })
      .select('id, slug')
      .single();
    if (error) return { ok: false, error: 'UNKNOWN' };
    return { ok: true, data };
  }

  async updateEvent(
    hostId: string,
    eventId: string,
    input: EventInput,
  ): Promise<StoreResult<{ id: string }>> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('events')
      .update(input)
      .eq('id', eventId)
      .eq('host_id', hostId)
      .select('id')
      .maybeSingle();
    if (error || !data) return { ok: false, error: 'NOT_AUTHORIZED' };
    return { ok: true, data };
  }

  async deleteEvent(hostId: string, eventId: string): Promise<StoreResult<{ id: string }>> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('host_id', hostId)
      .select('id')
      .maybeSingle();
    if (error || !data) return { ok: false, error: 'NOT_AUTHORIZED' };
    return { ok: true, data };
  }

  async createGift(
    hostId: string,
    eventId: string,
    input: GiftInput,
  ): Promise<StoreResult<{ id: string }>> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('gifts')
      .insert({ event_id: eventId, ...input })
      .select('id')
      .single();
    if (error) return { ok: false, error: 'NOT_AUTHORIZED' };
    return { ok: true, data };
  }

  async updateGift(
    hostId: string,
    giftId: string,
    input: GiftInput,
  ): Promise<StoreResult<{ id: string }>> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('gifts')
      .update(input)
      .eq('id', giftId)
      .select('id')
      .maybeSingle();
    if (error || !data) return { ok: false, error: 'NOT_AUTHORIZED' };
    return { ok: true, data };
  }

  async deleteGift(hostId: string, giftId: string): Promise<StoreResult<{ id: string }>> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('gifts')
      .delete()
      .eq('id', giftId)
      .select('id')
      .maybeSingle();
    if (error || !data) return { ok: false, error: 'NOT_AUTHORIZED' };
    return { ok: true, data };
  }
}
