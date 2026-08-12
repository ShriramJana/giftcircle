import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryStore, sha256 } from '@/lib/data/memory-store';
import type { GiftInput } from '@/lib/types';

/**
 * Reservation workflow tests against the in-memory store, which mirrors the
 * semantics of the create_reservation / update_reservation_by_token /
 * cancel_reservation_by_token SQL functions.
 */

const HOST = 'host-1';

const baseGift: GiftInput = {
  name: 'Dutch oven',
  description: '',
  product_url: null,
  image_url: null,
  estimated_price_cents: 41500,
  requested_quantity: 3,
  is_unlimited: false,
};

async function setup(gift: Partial<GiftInput> = {}) {
  const store = new MemoryStore(false);
  const event = await store.createEvent(HOST, 'test-event', {
    title: 'Test event',
    event_type: 'wedding',
    host_name: 'Test Host',
    event_date: '2026-11-14',
    location: 'Somewhere',
    message: '',
    visibility_mode: 'public',
  });
  if (!event.ok) throw new Error('event setup failed');
  const created = await store.createGift(HOST, event.data.id, { ...baseGift, ...gift });
  if (!created.ok) throw new Error('gift setup failed');
  return { store, eventId: event.data.id, giftId: created.data.id };
}

function reserveInput(giftId: string, quantity: number, token: string) {
  return {
    giftId,
    guestName: 'Guest Name',
    guestEmail: 'guest@example.com',
    quantity,
    tokenHash: sha256(token),
  };
}

describe('finite gifts cannot be over-claimed', () => {
  let store: MemoryStore;
  let giftId: string;

  beforeEach(async () => {
    ({ store, giftId } = await setup({ requested_quantity: 3 }));
  });

  it('rejects a single reservation larger than the requested quantity', async () => {
    const result = await store.createReservation(reserveInput(giftId, 4, 't1'));
    expect(result).toEqual({ ok: false, error: 'INSUFFICIENT_QUANTITY' });
  });

  it('rejects the reservation that would tip past the limit', async () => {
    expect((await store.createReservation(reserveInput(giftId, 2, 't1'))).ok).toBe(true);
    const second = await store.createReservation(reserveInput(giftId, 2, 't2'));
    expect(second).toEqual({ ok: false, error: 'INSUFFICIENT_QUANTITY' });
    // But a fitting quantity still works.
    expect((await store.createReservation(reserveInput(giftId, 1, 't3'))).ok).toBe(true);
  });

  it('never over-claims under concurrent attempts', async () => {
    const attempts = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        store.createReservation(reserveInput(giftId, 1, `concurrent-${i}`)),
      ),
    );
    const succeeded = attempts.filter((r) => r.ok);
    expect(succeeded).toHaveLength(3);

    const registry = await store.getRegistryBySlug('test-event');
    expect(registry?.gifts[0].claimed_quantity).toBe(3);
  });

  it('rejects zero and negative quantities', async () => {
    expect(await store.createReservation(reserveInput(giftId, 0, 't1'))).toEqual({
      ok: false,
      error: 'QUANTITY_INVALID',
    });
    expect(await store.createReservation(reserveInput(giftId, -1, 't2'))).toEqual({
      ok: false,
      error: 'QUANTITY_INVALID',
    });
  });

  it('requires guest name and email', async () => {
    const result = await store.createReservation({
      ...reserveInput(giftId, 1, 't1'),
      guestName: '   ',
    });
    expect(result).toEqual({ ok: false, error: 'GUEST_INFO_REQUIRED' });
  });
});

describe('duplicate form submissions', () => {
  it('returns the existing reservation for a repeated token instead of double-booking', async () => {
    const { store, giftId } = await setup({ requested_quantity: 2 });

    const first = await store.createReservation(reserveInput(giftId, 2, 'same-token'));
    const second = await store.createReservation(reserveInput(giftId, 2, 'same-token'));

    expect(first).toEqual({ ok: true, data: { id: expect.any(String), duplicate: false } });
    expect(second).toEqual({
      ok: true,
      data: { id: first.ok ? first.data.id : '', duplicate: true },
    });

    const registry = await store.getRegistryBySlug('test-event');
    expect(registry?.gifts[0].claimed_quantity).toBe(2);
    expect(registry?.gifts[0].purchasers).toHaveLength(1);
  });
});

describe('unlimited gifts', () => {
  it('accepts repeated reservations without limit', async () => {
    const { store, giftId } = await setup({ requested_quantity: 1, is_unlimited: true });

    for (let i = 0; i < 25; i += 1) {
      const result = await store.createReservation(reserveInput(giftId, 3, `token-${i}`));
      expect(result.ok).toBe(true);
    }

    const registry = await store.getRegistryBySlug('test-event');
    expect(registry?.gifts[0].claimed_quantity).toBe(75);
    expect(registry?.gifts[0].purchasers).toHaveLength(25);
  });
});

describe('reservation management by token', () => {
  it('looks up a reservation by hashed token only', async () => {
    const { store, giftId } = await setup();
    await store.createReservation(reserveInput(giftId, 1, 'lookup-token'));

    expect(await store.getReservationByTokenHash(sha256('lookup-token'))).not.toBeNull();
    expect(await store.getReservationByTokenHash(sha256('wrong-token'))).toBeNull();
  });

  it('updates quantity within available inventory', async () => {
    const { store, giftId } = await setup({ requested_quantity: 3 });
    await store.createReservation(reserveInput(giftId, 1, 'mine'));

    const result = await store.updateReservationByTokenHash(sha256('mine'), 3);
    expect(result.ok).toBe(true);

    const detail = await store.getReservationByTokenHash(sha256('mine'));
    expect(detail?.reservation.quantity).toBe(3);
  });

  it('rejects an update that would over-claim, counting other guests', async () => {
    const { store, giftId } = await setup({ requested_quantity: 3 });
    await store.createReservation(reserveInput(giftId, 2, 'other-guest'));
    await store.createReservation(reserveInput(giftId, 1, 'mine'));

    const result = await store.updateReservationByTokenHash(sha256('mine'), 2);
    expect(result).toEqual({ ok: false, error: 'INSUFFICIENT_QUANTITY' });
  });

  it('rejects zero-quantity updates', async () => {
    const { store, giftId } = await setup();
    await store.createReservation(reserveInput(giftId, 1, 'mine'));
    expect(await store.updateReservationByTokenHash(sha256('mine'), 0)).toEqual({
      ok: false,
      error: 'QUANTITY_INVALID',
    });
  });

  it('cancels a reservation and frees the inventory', async () => {
    const { store, giftId } = await setup({ requested_quantity: 1 });
    await store.createReservation(reserveInput(giftId, 1, 'mine'));

    // Fully claimed: another guest is turned away.
    expect((await store.createReservation(reserveInput(giftId, 1, 'late'))).ok).toBe(false);

    const cancelled = await store.cancelReservationByTokenHash(sha256('mine'));
    expect(cancelled.ok).toBe(true);

    // Inventory is free again.
    expect((await store.createReservation(reserveInput(giftId, 1, 'late-2'))).ok).toBe(true);
    expect(await store.getReservationByTokenHash(sha256('mine'))).toBeNull();
  });

  it('cancelling twice reports RESERVATION_NOT_FOUND', async () => {
    const { store, giftId } = await setup();
    await store.createReservation(reserveInput(giftId, 1, 'mine'));
    await store.cancelReservationByTokenHash(sha256('mine'));
    expect(await store.cancelReservationByTokenHash(sha256('mine'))).toEqual({
      ok: false,
      error: 'RESERVATION_NOT_FOUND',
    });
  });
});

describe('host masking through the store', () => {
  it('masks purchaser names for surprise_host events before the event date', async () => {
    const store = new MemoryStore(false);
    const event = await store.createEvent(HOST, 'surprise-event', {
      title: 'Surprise event',
      event_type: 'baby_shower',
      host_name: 'Host',
      event_date: '2999-01-01',
      location: 'Somewhere',
      message: '',
      visibility_mode: 'surprise_host',
    });
    if (!event.ok) throw new Error('setup failed');
    const gift = await store.createGift(HOST, event.data.id, baseGift);
    if (!gift.ok) throw new Error('setup failed');
    await store.createReservation(reserveInput(gift.data.id, 1, 'secret-guest'));

    // Host view: quantity visible, name hidden.
    const hostDetail = await store.getHostEventDetail(HOST, event.data.id);
    expect(hostDetail?.reservations).toHaveLength(1);
    expect(hostDetail?.reservations[0].name).toBeNull();
    expect(hostDetail?.reservations[0].masked).toBe(true);
    expect(hostDetail?.reservations[0].quantity).toBe(1);

    // Guest view: name visible.
    const registry = await store.getRegistryBySlug('surprise-event');
    expect(registry?.gifts[0].purchasers[0].name).toBe('Guest Name');
  });

  it('only the owning host can read event details', async () => {
    const { store, eventId } = await setup();
    expect(await store.getHostEventDetail('someone-else', eventId)).toBeNull();
    expect(await store.getHostEventDetail(HOST, eventId)).not.toBeNull();
  });
});
