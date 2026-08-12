'use server';

import { revalidatePath } from 'next/cache';
import { getStore } from '@/lib/data';
import { hashToken } from '@/lib/token';
import { fieldErrorsOf, reserveGiftSchema } from '@/lib/validation';
import type { FieldErrors } from '@/lib/validation';
import type { ReserveError } from '@/lib/types';

export interface ReserveState {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: FieldErrors;
  /** Private management path, e.g. /reservation/<token> */
  managementPath?: string;
  duplicate?: boolean;
}

const RESERVE_ERROR_MESSAGES: Partial<Record<ReserveError, string>> = {
  GIFT_NOT_FOUND: 'This gift is no longer on the registry.',
  INSUFFICIENT_QUANTITY:
    'Not enough left. Someone reserved this gift just now. Refresh to see what remains.',
  QUANTITY_INVALID: 'Choose a quantity of at least 1.',
  GUEST_INFO_REQUIRED: 'Enter your name and email so the host knows who reserved it.',
  TOKEN_INVALID: 'Something went wrong with the form. Reload the page and try again.',
};

export async function reserveGiftAction(
  _prev: ReserveState,
  formData: FormData,
): Promise<ReserveState> {
  const parsed = reserveGiftSchema.safeParse({
    giftId: formData.get('giftId'),
    guestName: formData.get('guestName'),
    guestEmail: formData.get('guestEmail'),
    quantity: formData.get('quantity'),
    managementToken: formData.get('managementToken'),
  });
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Check the highlighted fields and try again.',
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  const { giftId, guestName, guestEmail, quantity, managementToken } = parsed.data;
  const result = await getStore().createReservation({
    giftId,
    guestName,
    guestEmail,
    quantity,
    tokenHash: hashToken(managementToken),
  });

  if (!result.ok) {
    return {
      status: 'error',
      message: RESERVE_ERROR_MESSAGES[result.error] ?? 'Something went wrong. Please try again.',
    };
  }

  const slug = formData.get('slug');
  if (typeof slug === 'string' && /^[a-z0-9-]{3,80}$/.test(slug)) {
    revalidatePath(`/e/${slug}`);
  }

  return {
    status: 'success',
    duplicate: result.data.duplicate,
    managementPath: `/reservation/${managementToken}`,
    message: result.data.duplicate
      ? 'This reservation was already saved. Here is your management link again.'
      : 'Reserved! Save your private link below.',
  };
}
