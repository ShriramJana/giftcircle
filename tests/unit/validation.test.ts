import { describe, expect, it } from 'vitest';
import { eventSchema, giftSchema } from '@/lib/validation';

const base = {
  name: 'Dutch oven',
  description: '',
  productUrl: '',
  imageUrl: '',
  requestedQuantity: '1',
  isUnlimited: false,
};

describe('gift price validation', () => {
  it('converts plain dollars to cents', () => {
    const parsed = giftSchema.parse({ ...base, estimatedPrice: '49.99' });
    expect(parsed.estimated_price_cents).toBe(4999);
  });

  it('forgives dollar signs, commas, and spaces', () => {
    const parsed = giftSchema.parse({ ...base, estimatedPrice: '$1,299.99' });
    expect(parsed.estimated_price_cents).toBe(129999);
  });

  it('treats an empty price as no price', () => {
    const parsed = giftSchema.parse({ ...base, estimatedPrice: '' });
    expect(parsed.estimated_price_cents).toBeNull();
  });

  it('rejects text that is not a price', () => {
    const result = giftSchema.safeParse({ ...base, estimatedPrice: 'around fifty' });
    expect(result.success).toBe(false);
  });

  it('rejects negative quantities', () => {
    const result = giftSchema.safeParse({ ...base, estimatedPrice: '', requestedQuantity: '-2' });
    expect(result.success).toBe(false);
  });
});

describe('eventSchema canvas fields', () => {
  const base = {
    title: 'Game night',
    eventType: 'other',
    hostName: 'Sam',
    eventDate: '2026-09-01',
    location: 'Our place',
    message: '',
    visibilityMode: 'public',
  };

  it('defaults every new field to null', () => {
    const parsed = eventSchema.parse(base);
    expect(parsed.startTime).toBeNull();
    expect(parsed.endTime).toBeNull();
    expect(parsed.hostNote).toBeNull();
    expect(parsed.background).toBeNull();
    expect(parsed.costMode).toBeNull();
    expect(parsed.costAmount).toBeNull();
    expect(parsed.venmoHandle).toBeNull();
  });

  it('accepts a full canvas payload and converts dollars to cents', () => {
    const parsed = eventSchema.parse({
      ...base,
      startTime: '17:00',
      endTime: '21:30',
      hostNote: 'Park on the street.',
      background: 'linen',
      costMode: 'suggested',
      costAmount: '$25.50',
      costMemo: 'Pizza fund',
      venmoHandle: '@sam-pays',
      zelleHandle: '',
      cashappHandle: '',
    });
    expect(parsed.startTime).toBe('17:00');
    expect(parsed.endTime).toBe('21:30');
    expect(parsed.background).toBe('linen');
    expect(parsed.costAmount).toBe(2550);
    expect(parsed.zelleHandle).toBeNull();
  });

  it('rejects malformed times', () => {
    expect(eventSchema.safeParse({ ...base, startTime: '24:00' }).success).toBe(false);
    expect(eventSchema.safeParse({ ...base, startTime: '5 pm' }).success).toBe(false);
  });

  it('rejects an end time without a start', () => {
    const result = eventSchema.safeParse({ ...base, endTime: '21:00' });
    expect(result.success).toBe(false);
  });

  it('rejects an end time at or before the start', () => {
    expect(eventSchema.safeParse({ ...base, startTime: '17:00', endTime: '17:00' }).success).toBe(false);
    expect(eventSchema.safeParse({ ...base, startTime: '17:00', endTime: '09:00' }).success).toBe(false);
  });

  it('rejects unknown backgrounds', () => {
    expect(eventSchema.safeParse({ ...base, background: 'neon' }).success).toBe(false);
  });

  it('requires an amount and one handle when costs are on', () => {
    expect(
      eventSchema.safeParse({ ...base, costMode: 'required', venmoHandle: '@x' }).success,
    ).toBe(false);
    expect(
      eventSchema.safeParse({ ...base, costMode: 'required', costAmount: '20' }).success,
    ).toBe(false);
    expect(
      eventSchema.safeParse({
        ...base,
        costMode: 'required',
        costAmount: '20',
        cashappHandle: '$sam',
      }).success,
    ).toBe(true);
  });
});
