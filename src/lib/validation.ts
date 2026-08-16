import { z } from 'zod';
import { EVENT_TYPES, VISIBILITY_MODES } from './types';
import type { CostMode } from './types';
import { MAX_RESERVATION_QUANTITY } from './registry';
import { BACKGROUNDS } from './backgrounds';

const trimmed = (max: number, label: string) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`);

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

const optionalTime = z
  .string()
  .trim()
  .default('')
  .refine((v) => v === '' || HHMM.test(v), 'Pick a valid time')
  .transform((v) => (v === '' ? null : v));

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer`)
    .default('')
    .transform((v) => (v === '' ? null : v));

const optionalHttpUrl = z
  .string()
  .trim()
  .max(2000, 'Link must be 2000 characters or fewer')
  .refine((v) => v === '' || /^https?:\/\/\S+$/i.test(v), 'Enter a full link starting with http:// or https://')
  .transform((v) => (v === '' ? null : v))
  .nullish()
  .transform((v) => v ?? null);

export const guestIdentitySchema = z.object({
  guestName: trimmed(120, 'Your name'),
  guestEmail: z
    .string({ error: 'Your email is required' })
    .trim()
    .toLowerCase()
    .min(3, 'Your email is required')
    .max(254, 'Email must be 254 characters or fewer')
    .email('Enter a valid email address'),
});

export const quantitySchema = z.coerce
  .number({ error: 'Enter a quantity' })
  .int('Quantity must be a whole number')
  .min(1, 'Quantity must be at least 1')
  .max(MAX_RESERVATION_QUANTITY, `Quantity must be ${MAX_RESERVATION_QUANTITY} or fewer`);

// Plain UUID shape (any variant) — matches Postgres's uuid type, which is
// looser than Zod's RFC-4122 .uuid() check.
const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const reserveGiftSchema = guestIdentitySchema.extend({
  giftId: z.string().regex(UUID_SHAPE, 'Unknown gift'),
  quantity: quantitySchema,
  managementToken: z
    .string({ error: 'Missing form token. Reload the page and try again' })
    .min(8, 'Missing form token. Reload the page and try again')
    .max(128),
});

export const updateReservationSchema = z.object({
  quantity: quantitySchema,
});

export const eventSchema = z
  .object({
    title: trimmed(120, 'Event title'),
    eventType: z.enum(EVENT_TYPES, { error: 'Choose an event type' }),
    hostName: trimmed(120, 'Host name'),
    eventDate: z
      .string({ error: 'Pick a date' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date')
      .refine((v) => !Number.isNaN(new Date(`${v}T00:00:00`).getTime()), 'Pick a valid date'),
    startTime: optionalTime,
    endTime: optionalTime,
    location: trimmed(200, 'Location'),
    message: z.string().trim().max(2000, 'Message must be 2000 characters or fewer').default(''),
    hostNote: optionalText(2000, 'Host note'),
    background: z
      .string()
      .trim()
      .default('')
      .refine((v) => v === '' || v in BACKGROUNDS, 'Pick one of the listed backgrounds')
      .transform((v) => (v === '' ? null : v)),
    costMode: z
      .string()
      .trim()
      .default('')
      .refine((v) => v === '' || v === 'required' || v === 'suggested', 'Choose how guests chip in')
      .transform((v) => (v === '' ? null : (v as CostMode))),
    costAmount: z
      .string()
      .trim()
      .default('')
      .transform((v) => v.replace(/[$,\s]/g, ''))
      .refine((v) => v === '' || /^\d{1,5}([.]\d{1,2})?$/.test(v), 'Enter an amount like 20 or 20.50')
      .transform((v) => (v === '' ? null : Math.round(parseFloat(v) * 100))),
    costMemo: optionalText(500, 'Memo'),
    venmoHandle: optionalText(120, 'Venmo username'),
    zelleHandle: optionalText(120, 'Zelle phone or email'),
    cashappHandle: optionalText(120, 'Cash App username'),
    visibilityMode: z.enum(VISIBILITY_MODES, { error: 'Choose who can see purchaser names' }),
  })
  .superRefine((data, ctx) => {
    if (data.endTime && !data.startTime) {
      ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'Add a start time first' });
    }
    if (data.endTime && data.startTime && data.endTime <= data.startTime) {
      ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'End time must be after the start' });
    }
    if (data.costMode) {
      if (data.costAmount === null || data.costAmount <= 0) {
        ctx.addIssue({ code: 'custom', path: ['costAmount'], message: 'Enter a per-person amount' });
      }
      if (!data.venmoHandle && !data.zelleHandle && !data.cashappHandle) {
        ctx.addIssue({
          code: 'custom',
          path: ['venmoHandle'],
          message: 'Add at least one way to pay',
        });
      }
    }
  });

export const giftSchema = z
  .object({
    name: trimmed(140, 'Gift name'),
    description: z.string().trim().max(1000, 'Description must be 1000 characters or fewer').default(''),
    productUrl: optionalHttpUrl,
    imageUrl: optionalHttpUrl,
    estimatedPrice: z
      .string()
      .trim()
      .default('')
      // Forgive "$1,299.99"-style input before validating.
      .transform((v) => v.replace(/[$,\s]/g, ''))
      .refine((v) => v === '' || /^\d{1,7}([.]\d{1,2})?$/.test(v), 'Enter a price like 49 or 49.99')
      .transform((v) => (v === '' ? null : Math.round(parseFloat(v) * 100))),
    requestedQuantity: z.coerce
      .number({ error: 'Enter how many you would like' })
      .int('Quantity must be a whole number')
      .min(1, 'Request at least 1')
      .max(1000, 'Request 1000 or fewer'),
    isUnlimited: z.coerce.boolean().default(false),
  })
  .transform((g) => ({
    name: g.name,
    description: g.description,
    product_url: g.productUrl,
    image_url: g.imageUrl,
    estimated_price_cents: g.estimatedPrice,
    requested_quantity: g.requestedQuantity,
    is_unlimited: g.isUnlimited,
  }));

export const signUpSchema = z.object({
  displayName: trimmed(120, 'Your name'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
});

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
  password: z.string().min(1, 'Enter your password').max(72),
});

export type FieldErrors = Record<string, string>;

/** Flatten a ZodError into { fieldName: firstMessage }. */
export function fieldErrorsOf(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form';
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
