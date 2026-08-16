import { describe, expect, it } from 'vitest';
import { BACKGROUNDS, backgroundOf } from '@/lib/backgrounds';

describe('BACKGROUNDS', () => {
  it('has ten complete entries', () => {
    const entries = Object.entries(BACKGROUNDS);
    expect(entries).toHaveLength(10);
    for (const [key, bg] of entries) {
      expect(key).toMatch(/^[a-z][a-z-]*$/);
      expect(bg.label.length).toBeGreaterThan(0);
      expect(bg.css.length).toBeGreaterThan(0);
      expect(['light', 'dark']).toContain(bg.tone);
    }
  });
  it('includes the seeded key', () => {
    expect(BACKGROUNDS.linen).toBeDefined();
  });
});

describe('backgroundOf', () => {
  it('resolves known keys and rejects the rest', () => {
    expect(backgroundOf('paper')?.label).toBe('Paper');
    expect(backgroundOf('not-a-key')).toBeNull();
    expect(backgroundOf(null)).toBeNull();
    expect(backgroundOf(undefined)).toBeNull();
  });
});
