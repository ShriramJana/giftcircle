import { describe, expect, it } from 'vitest';
import { isHostMasked, purchasersForViewer } from '@/lib/visibility';
import type { Purchaser } from '@/lib/types';

const purchasers: Purchaser[] = [
  { reservation_id: 'r1', name: 'Amara Osei', quantity: 4, created_at: '2026-08-02T09:00:00Z' },
  { reservation_id: 'r2', name: 'Ben Calloway', quantity: 1, created_at: '2026-08-03T09:00:00Z' },
];

describe('isHostMasked', () => {
  it('never masks in public mode', () => {
    expect(isHostMasked('public', '2026-11-14', '2026-08-12')).toBe(false);
  });

  it('masks in surprise_host mode before the event date', () => {
    expect(isHostMasked('surprise_host', '2026-11-14', '2026-08-12')).toBe(true);
  });

  it('unmasks on the event date itself', () => {
    expect(isHostMasked('surprise_host', '2026-11-14', '2026-11-14')).toBe(false);
  });

  it('unmasks after the event date', () => {
    expect(isHostMasked('surprise_host', '2026-11-14', '2026-12-01')).toBe(false);
  });
});

describe('purchasersForViewer', () => {
  it('shows names to guests in public mode', () => {
    const rows = purchasersForViewer('guest', 'public', '2026-11-14', purchasers, '2026-08-12');
    expect(rows.map((r) => r.name)).toEqual(['Amara Osei', 'Ben Calloway']);
    expect(rows.every((r) => !r.masked)).toBe(true);
  });

  it('shows names to guests even in surprise_host mode', () => {
    const rows = purchasersForViewer('guest', 'surprise_host', '2026-11-14', purchasers, '2026-08-12');
    expect(rows.map((r) => r.name)).toEqual(['Amara Osei', 'Ben Calloway']);
  });

  it('shows names to the host in public mode', () => {
    const rows = purchasersForViewer('host', 'public', '2026-11-14', purchasers, '2026-08-12');
    expect(rows.map((r) => r.name)).toEqual(['Amara Osei', 'Ben Calloway']);
  });

  it('hides names from the host in surprise_host mode before the event, keeping quantities', () => {
    const rows = purchasersForViewer('host', 'surprise_host', '2026-11-14', purchasers, '2026-08-12');
    expect(rows.map((r) => r.name)).toEqual([null, null]);
    expect(rows.map((r) => r.quantity)).toEqual([4, 1]);
    expect(rows.every((r) => r.masked)).toBe(true);
  });

  it('reveals names to the host once the event date arrives', () => {
    const rows = purchasersForViewer('host', 'surprise_host', '2026-11-14', purchasers, '2026-11-14');
    expect(rows.map((r) => r.name)).toEqual(['Amara Osei', 'Ben Calloway']);
  });

  it('never includes email fields', () => {
    const rows = purchasersForViewer('guest', 'public', '2026-11-14', purchasers, '2026-08-12');
    for (const row of rows) {
      expect(Object.keys(row).sort()).toEqual([
        'created_at',
        'masked',
        'name',
        'quantity',
        'reservation_id',
      ]);
    }
  });
});
