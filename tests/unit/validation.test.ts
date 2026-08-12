import { describe, expect, it } from 'vitest';
import { giftSchema } from '@/lib/validation';

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
