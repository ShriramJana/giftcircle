import { createHash, randomUUID } from 'node:crypto';
import type {
  Gift,
  GiftInput,
  HostEvent,
  HostReservationRow,
  Purchaser,
  RegistryGift,
  RegistryPayload,
  ReservationDetail,
  StoreResult,
} from '../types';
import { canReserve, claimedQuantity } from '../registry';
import { isHostMasked } from '../visibility';
import type {
  CreateReservationInput,
  DataStore,
  EventInput,
  EventSummary,
  HostEventDetail,
  HostGift,
} from './store';

/**
 * In-memory implementation of DataStore, seeded with the same fixtures as
 * supabase/seed.sql. Used when Supabase credentials are absent (credential-
 * free UI development, Playwright) and directly by unit tests. Mirrors the
 * semantics of the SQL functions in supabase/migrations, including token
 * idempotency and over-claim rejection. JavaScript's single-threaded
 * execution makes the check-then-insert effectively atomic here; production
 * atomicity comes from the SQL function's row lock.
 */

interface MemoryUser {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
}

interface MemoryReservation {
  id: string;
  gift_id: string;
  guest_name: string;
  guest_email: string;
  quantity: number;
  management_token_hash: string;
  created_at: string;
  updated_at: string;
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export const DEMO_HOST = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'demo@giftcircle.test',
  password: 'password123',
  displayName: 'Maya Whitfield',
};

export const SEED_WEDDING_SLUG = 'maya-and-jordan';
export const SEED_SHOWER_SLUG = 'baby-whitfield-shower';
export const SEED_TOKENS = {
  amara: 'seed-token-amara',
  ben: 'seed-token-ben',
  chloe: 'seed-token-chloe',
  dev: 'seed-token-dev',
};

const now = () => new Date().toISOString();

export class MemoryStore implements DataStore {
  users = new Map<string, MemoryUser>();
  events = new Map<string, HostEvent>();
  gifts = new Map<string, Gift>();
  reservations = new Map<string, MemoryReservation>();

  constructor(seed = true) {
    if (seed) this.seed();
  }

  // -- auth (memory mode only) ----------------------------------------------

  findUserByEmail(email: string): MemoryUser | null {
    const needle = email.trim().toLowerCase();
    for (const u of this.users.values()) if (u.email === needle) return u;
    return null;
  }

  getUserById(id: string): MemoryUser | null {
    return this.users.get(id) ?? null;
  }

  createUser(email: string, password: string, displayName: string): StoreResult<MemoryUser> {
    if (this.findUserByEmail(email)) return { ok: false, error: 'UNKNOWN' };
    const user: MemoryUser = {
      id: randomUUID(),
      email: email.trim().toLowerCase(),
      passwordHash: sha256(password),
      displayName: displayName.trim(),
    };
    this.users.set(user.id, user);
    return { ok: true, data: user };
  }

  verifyPassword(user: MemoryUser, password: string): boolean {
    return user.passwordHash === sha256(password);
  }

  // -- guest-facing ----------------------------------------------------------

  private reservationsForGift(giftId: string): MemoryReservation[] {
    return [...this.reservations.values()]
      .filter((r) => r.gift_id === giftId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  private toRegistryGift(gift: Gift): RegistryGift {
    const rows = this.reservationsForGift(gift.id);
    const purchasers: Purchaser[] = rows.map((r) => ({
      reservation_id: r.id,
      name: r.guest_name,
      quantity: r.quantity,
      created_at: r.created_at,
    }));
    return { ...gift, claimed_quantity: claimedQuantity(rows), purchasers };
  }

  private giftsForEvent(eventId: string): Gift[] {
    return [...this.gifts.values()]
      .filter((g) => g.event_id === eventId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  async getRegistryBySlug(slug: string): Promise<RegistryPayload | null> {
    const event = [...this.events.values()].find((e) => e.slug === slug);
    if (!event) return null;
    return {
      event: {
        id: event.id,
        slug: event.slug,
        title: event.title,
        event_type: event.event_type,
        host_name: event.host_name,
        event_date: event.event_date,
        location: event.location,
        message: event.message,
        visibility_mode: event.visibility_mode,
      },
      gifts: this.giftsForEvent(event.id).map((g) => this.toRegistryGift(g)),
    };
  }

  async createReservation(
    input: CreateReservationInput,
  ): Promise<StoreResult<{ id: string; duplicate: boolean }>> {
    const { giftId, guestName, guestEmail, quantity, tokenHash } = input;
    if (!guestName.trim() || !guestEmail.trim()) return { ok: false, error: 'GUEST_INFO_REQUIRED' };
    if (tokenHash.length !== 64) return { ok: false, error: 'TOKEN_INVALID' };

    const existing = [...this.reservations.values()].find(
      (r) => r.management_token_hash === tokenHash,
    );
    if (existing) return { ok: true, data: { id: existing.id, duplicate: true } };

    const gift = this.gifts.get(giftId);
    if (!gift) return { ok: false, error: 'GIFT_NOT_FOUND' };

    const claimed = claimedQuantity(this.reservationsForGift(giftId));
    const check = canReserve(gift, claimed, quantity);
    if (!check.ok) return { ok: false, error: check.reason };

    const ts = now();
    const reservation: MemoryReservation = {
      id: randomUUID(),
      gift_id: giftId,
      guest_name: guestName.trim(),
      guest_email: guestEmail.trim().toLowerCase(),
      quantity,
      management_token_hash: tokenHash,
      created_at: ts,
      updated_at: ts,
    };
    this.reservations.set(reservation.id, reservation);
    return { ok: true, data: { id: reservation.id, duplicate: false } };
  }

  private findByTokenHash(tokenHash: string): MemoryReservation | null {
    return (
      [...this.reservations.values()].find((r) => r.management_token_hash === tokenHash) ?? null
    );
  }

  async getReservationByTokenHash(tokenHash: string): Promise<ReservationDetail | null> {
    const res = this.findByTokenHash(tokenHash);
    if (!res) return null;
    const gift = this.gifts.get(res.gift_id);
    if (!gift) return null;
    const event = this.events.get(gift.event_id);
    if (!event) return null;
    return {
      reservation: {
        id: res.id,
        guest_name: res.guest_name,
        guest_email: res.guest_email,
        quantity: res.quantity,
        created_at: res.created_at,
      },
      gift: {
        id: gift.id,
        name: gift.name,
        description: gift.description,
        image_url: gift.image_url,
        product_url: gift.product_url,
        estimated_price_cents: gift.estimated_price_cents,
        requested_quantity: gift.requested_quantity,
        is_unlimited: gift.is_unlimited,
        claimed_quantity: claimedQuantity(this.reservationsForGift(gift.id)),
      },
      event: {
        slug: event.slug,
        title: event.title,
        event_date: event.event_date,
        host_name: event.host_name,
      },
    };
  }

  async updateReservationByTokenHash(
    tokenHash: string,
    quantity: number,
  ): Promise<StoreResult<{ id: string; quantity: number }>> {
    const res = this.findByTokenHash(tokenHash);
    if (!res) return { ok: false, error: 'RESERVATION_NOT_FOUND' };
    const gift = this.gifts.get(res.gift_id);
    if (!gift) return { ok: false, error: 'GIFT_NOT_FOUND' };

    const claimedByOthers = claimedQuantity(
      this.reservationsForGift(gift.id).filter((r) => r.id !== res.id),
    );
    const check = canReserve(gift, claimedByOthers, quantity);
    if (!check.ok) return { ok: false, error: check.reason };

    res.quantity = quantity;
    res.updated_at = now();
    return { ok: true, data: { id: res.id, quantity } };
  }

  async cancelReservationByTokenHash(tokenHash: string): Promise<StoreResult<{ id: string }>> {
    const res = this.findByTokenHash(tokenHash);
    if (!res) return { ok: false, error: 'RESERVATION_NOT_FOUND' };
    this.reservations.delete(res.id);
    return { ok: true, data: { id: res.id } };
  }

  // -- host-facing -----------------------------------------------------------

  async listHostEvents(hostId: string): Promise<EventSummary[]> {
    return [...this.events.values()]
      .filter((e) => e.host_id === hostId)
      .sort((a, b) => a.event_date.localeCompare(b.event_date))
      .map((event) => {
        const gifts = this.giftsForEvent(event.id);
        const reservationCount = gifts.reduce(
          (sum, g) => sum + this.reservationsForGift(g.id).length,
          0,
        );
        return { ...event, gift_count: gifts.length, reservation_count: reservationCount };
      });
  }

  async getHostEventDetail(hostId: string, eventId: string): Promise<HostEventDetail | null> {
    const event = this.events.get(eventId);
    if (!event || event.host_id !== hostId) return null;

    const gifts: HostGift[] = this.giftsForEvent(event.id).map((g) => ({
      ...g,
      claimed_quantity: claimedQuantity(this.reservationsForGift(g.id)),
    }));

    const masked = isHostMasked(event.visibility_mode, event.event_date);
    const reservations: HostReservationRow[] = gifts
      .flatMap((g) => this.reservationsForGift(g.id))
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((r) => ({
        reservation_id: r.id,
        gift_id: r.gift_id,
        name: masked ? null : r.guest_name,
        quantity: r.quantity,
        created_at: r.created_at,
        masked,
      }));

    return { event, gifts, reservations };
  }

  async createEvent(
    hostId: string,
    slug: string,
    input: EventInput,
  ): Promise<StoreResult<{ id: string; slug: string }>> {
    const ts = now();
    const event: HostEvent = {
      id: randomUUID(),
      host_id: hostId,
      slug,
      ...input,
      created_at: ts,
      updated_at: ts,
    };
    this.events.set(event.id, event);
    return { ok: true, data: { id: event.id, slug } };
  }

  async updateEvent(
    hostId: string,
    eventId: string,
    input: EventInput,
  ): Promise<StoreResult<{ id: string }>> {
    const event = this.events.get(eventId);
    if (!event || event.host_id !== hostId) return { ok: false, error: 'NOT_AUTHORIZED' };
    Object.assign(event, input, { updated_at: now() });
    return { ok: true, data: { id: eventId } };
  }

  async deleteEvent(hostId: string, eventId: string): Promise<StoreResult<{ id: string }>> {
    const event = this.events.get(eventId);
    if (!event || event.host_id !== hostId) return { ok: false, error: 'NOT_AUTHORIZED' };
    for (const gift of this.giftsForEvent(eventId)) {
      for (const r of this.reservationsForGift(gift.id)) this.reservations.delete(r.id);
      this.gifts.delete(gift.id);
    }
    this.events.delete(eventId);
    return { ok: true, data: { id: eventId } };
  }

  private assertHostOwnsEvent(hostId: string, eventId: string): boolean {
    const event = this.events.get(eventId);
    return !!event && event.host_id === hostId;
  }

  async createGift(
    hostId: string,
    eventId: string,
    input: GiftInput,
  ): Promise<StoreResult<{ id: string }>> {
    if (!this.assertHostOwnsEvent(hostId, eventId)) return { ok: false, error: 'NOT_AUTHORIZED' };
    const ts = now();
    const gift: Gift = { id: randomUUID(), event_id: eventId, ...input, created_at: ts, updated_at: ts };
    this.gifts.set(gift.id, gift);
    return { ok: true, data: { id: gift.id } };
  }

  async updateGift(
    hostId: string,
    giftId: string,
    input: GiftInput,
  ): Promise<StoreResult<{ id: string }>> {
    const gift = this.gifts.get(giftId);
    if (!gift || !this.assertHostOwnsEvent(hostId, gift.event_id)) {
      return { ok: false, error: 'NOT_AUTHORIZED' };
    }
    Object.assign(gift, input, { updated_at: now() });
    return { ok: true, data: { id: giftId } };
  }

  async deleteGift(hostId: string, giftId: string): Promise<StoreResult<{ id: string }>> {
    const gift = this.gifts.get(giftId);
    if (!gift || !this.assertHostOwnsEvent(hostId, gift.event_id)) {
      return { ok: false, error: 'NOT_AUTHORIZED' };
    }
    for (const r of this.reservationsForGift(giftId)) this.reservations.delete(r.id);
    this.gifts.delete(giftId);
    return { ok: true, data: { id: giftId } };
  }

  // -- fixtures (mirror supabase/seed.sql) -----------------------------------

  private seed() {
    this.users.set(DEMO_HOST.id, {
      id: DEMO_HOST.id,
      email: DEMO_HOST.email,
      passwordHash: sha256(DEMO_HOST.password),
      displayName: DEMO_HOST.displayName,
    });

    const ts = '2026-08-01T12:00:00.000Z';
    const wedding: HostEvent = {
      id: '22222222-2222-2222-2222-222222222222',
      host_id: DEMO_HOST.id,
      slug: SEED_WEDDING_SLUG,
      title: 'Maya & Jordan are getting married',
      event_type: 'wedding',
      host_name: 'Maya Whitfield & Jordan Rees',
      event_date: '2026-11-14',
      location: 'Hollis Farm, Petaluma, California',
      message:
        'After eight years, two apartments, and one very opinionated cat, we are finally making it official. Join us under the oaks for vows at golden hour, dinner under string lights, and dancing until they make us stop. Your company is the real gift, but if you would like to bring something, we put together a few things for the home we are building together.',
      visibility_mode: 'public',
      created_at: ts,
      updated_at: ts,
    };
    const shower: HostEvent = {
      id: '22222222-2222-2222-2222-222222222223',
      host_id: DEMO_HOST.id,
      slug: SEED_SHOWER_SLUG,
      title: 'A shower for Baby Whitfield',
      event_type: 'baby_shower',
      host_name: 'Maya Whitfield',
      event_date: '2026-10-03',
      location: 'The Fern Room, Oakland, California',
      message:
        'Someone very small is arriving this winter. Come for cake and terrible guessing games. Maya has asked not to see who is bringing what until the big day, so reserve freely. Your name stays a surprise to her.',
      visibility_mode: 'surprise_host',
      created_at: ts,
      updated_at: ts,
    };
    this.events.set(wedding.id, wedding);
    this.events.set(shower.id, shower);

    const img = (id: string) =>
      `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=70`;
    const giftRows: Array<
      [string, string, string, string, string | null, string | null, number | null, number, boolean]
    > = [
      // id, event, name, description, product_url, image_url, price cents, qty, unlimited
      ['33333333-3333-3333-3333-333333333331', wedding.id, 'Dutch oven, 5.5 qt',
        'The enameled cast-iron one in flame orange. Destined for a decade of Sunday ragù.',
        'https://www.lecreuset.com/round-dutch-oven/LS2501.html',
        img('1556909114-f6e7ad7d3136'), 41500, 1, false],
      ['33333333-3333-3333-3333-333333333332', wedding.id, 'Stoneware dinner plates',
        'Handmade plates from the ceramics studio where we had our third date. We are collecting eight.',
        null, img('1610701596007-11502861dcfa'), 4800, 8, false],
      ['33333333-3333-3333-3333-333333333333', wedding.id, 'Linen tablecloth',
        'Washed linen, rust stripe, big enough for the long table we keep promising to buy.',
        null, img('1414235077428-338989a2e8c0'), 12900, 1, false],
      ['33333333-3333-3333-3333-333333333334', wedding.id, 'Picnic hamper for two',
        'Wicker, leather straps, real cutlery. For the coast drives we never plan properly.',
        null, null, 15000, 1, false],
      ['33333333-3333-3333-3333-333333333335', wedding.id, 'A bottle for the cellar',
        'Bring a bottle you love with a note about when we should open it. There is no such thing as too many.',
        null, img('1510812431401-41d2bd2722f3'), 3500, 1, true],
      ['33333333-3333-3333-3333-333333333336', wedding.id, 'Wool picnic blanket',
        'Recycled wool, plaid, machine washable because we know ourselves.',
        null, img('1600369672770-985fd30004eb'), 9800, 2, false],
      ['33333333-3333-3333-3333-333333333341', shower.id, 'Muslin swaddle set',
        'The soft ones, in any color that is not beige.',
        null, img('1522771930-78848d9293e8'), 4200, 3, false],
      ['33333333-3333-3333-3333-333333333342', shower.id, "A favorite children's book",
        'Bring the book you loved most as a kid, inscribed with a note.',
        null, null, 1500, 1, true],
    ];
    giftRows.forEach(([id, eventId, name, description, productUrl, imageUrl, price, qty, unlimited], i) => {
      const created = `2026-08-01T12:0${Math.min(i, 9)}:00.000Z`;
      this.gifts.set(id, {
        id,
        event_id: eventId,
        name,
        description,
        product_url: productUrl,
        image_url: imageUrl,
        estimated_price_cents: price,
        requested_quantity: qty,
        is_unlimited: unlimited,
        created_at: created,
        updated_at: created,
      });
    });

    const reservationRows: Array<[string, string, string, string, number, string]> = [
      ['44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333332',
        'Amara Osei', 'amara@example.com', 4, SEED_TOKENS.amara],
      ['44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333331',
        'Ben Calloway', 'ben@example.com', 1, SEED_TOKENS.ben],
      ['44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333335',
        'Chloe Marsh', 'chloe@example.com', 2, SEED_TOKENS.chloe],
      ['44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333341',
        'Dev Raghunathan', 'dev@example.com', 1, SEED_TOKENS.dev],
    ];
    reservationRows.forEach(([id, giftId, name, email, quantity, token], i) => {
      const created = `2026-08-0${2 + i}T09:00:00.000Z`;
      this.reservations.set(id, {
        id,
        gift_id: giftId,
        guest_name: name,
        guest_email: email,
        quantity,
        management_token_hash: sha256(token),
        created_at: created,
        updated_at: created,
      });
    });
  }
}

/**
 * Process-wide singleton so dev-server module reloads and separate server
 * actions share one dataset.
 */
export function getMemoryStore(): MemoryStore {
  const g = globalThis as typeof globalThis & { __giftcircleMemoryStore?: MemoryStore };
  if (!g.__giftcircleMemoryStore) g.__giftcircleMemoryStore = new MemoryStore();
  return g.__giftcircleMemoryStore;
}
