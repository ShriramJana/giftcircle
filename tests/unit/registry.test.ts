import { describe, expect, it } from 'vitest';
import {
  canReserve,
  claimedQuantity,
  isFullyClaimed,
  maxReservable,
  remainingQuantity,
} from '@/lib/registry';

const finite = (requested: number) => ({ requested_quantity: requested, is_unlimited: false });
const unlimited = { requested_quantity: 1, is_unlimited: true };

describe('claimedQuantity', () => {
  it('sums reservation quantities', () => {
    expect(claimedQuantity([{ quantity: 2 }, { quantity: 3 }])).toBe(5);
  });

  it('is zero with no reservations', () => {
    expect(claimedQuantity([])).toBe(0);
  });
});

describe('remainingQuantity', () => {
  it('subtracts claimed from requested', () => {
    expect(remainingQuantity(finite(8), 3)).toBe(5);
  });

  it('never goes negative even if data over-claims', () => {
    expect(remainingQuantity(finite(2), 5)).toBe(0);
  });

  it('is null for unlimited gifts', () => {
    expect(remainingQuantity(unlimited, 42)).toBeNull();
  });
});

describe('isFullyClaimed', () => {
  it('is true at exactly the requested quantity', () => {
    expect(isFullyClaimed(finite(3), 3)).toBe(true);
  });

  it('is false below the requested quantity', () => {
    expect(isFullyClaimed(finite(3), 2)).toBe(false);
  });

  it('is never true for unlimited gifts', () => {
    expect(isFullyClaimed(unlimited, 9999)).toBe(false);
  });
});

describe('canReserve', () => {
  it('allows a reservation that fits', () => {
    expect(canReserve(finite(5), 2, 3)).toEqual({ ok: true });
  });

  it('rejects over-claiming a finite gift', () => {
    expect(canReserve(finite(5), 3, 3)).toEqual({ ok: false, reason: 'INSUFFICIENT_QUANTITY' });
  });

  it('rejects zero quantity', () => {
    expect(canReserve(finite(5), 0, 0)).toEqual({ ok: false, reason: 'QUANTITY_INVALID' });
  });

  it('rejects negative quantity', () => {
    expect(canReserve(finite(5), 0, -2)).toEqual({ ok: false, reason: 'QUANTITY_INVALID' });
  });

  it('rejects non-integer quantity', () => {
    expect(canReserve(finite(5), 0, 1.5)).toEqual({ ok: false, reason: 'QUANTITY_INVALID' });
  });

  it('rejects quantities above the hard cap even for unlimited gifts', () => {
    expect(canReserve(unlimited, 0, 1001)).toEqual({ ok: false, reason: 'QUANTITY_INVALID' });
  });

  it('allows any positive quantity for unlimited gifts', () => {
    expect(canReserve(unlimited, 500, 400)).toEqual({ ok: true });
  });
});

describe('maxReservable', () => {
  it('is the remaining inventory for finite gifts', () => {
    expect(maxReservable(finite(8), 5)).toBe(3);
  });

  it('is zero when fully claimed', () => {
    expect(maxReservable(finite(2), 2)).toBe(0);
  });

  it('is null (uncapped) for unlimited gifts', () => {
    expect(maxReservable(unlimited, 100)).toBeNull();
  });
});
