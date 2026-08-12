'use server';

import { revalidatePath } from 'next/cache';
import { getStore } from '@/lib/data';
import { hashToken, isPlausibleToken } from '@/lib/token';
import { fieldErrorsOf, updateReservationSchema } from '@/lib/validation';
import type { FieldErrors } from '@/lib/validation';

export interface ManageState {
  status: 'idle' | 'error' | 'updated' | 'cancelled';
  message?: string;
  fieldErrors?: FieldErrors;
}

function revalidateReservationPaths(token: string, slug: string | null) {
  revalidatePath(`/reservation/${token}`);
  if (slug) revalidatePath(`/e/${slug}`);
}

export async function updateReservationAction(
  _prev: ManageState,
  formData: FormData,
): Promise<ManageState> {
  const token = formData.get('token');
  if (typeof token !== 'string' || !isPlausibleToken(token)) {
    return { status: 'error', message: 'This management link is not valid.' };
  }

  const parsed = updateReservationSchema.safeParse({ quantity: formData.get('quantity') });
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Check the quantity and try again.',
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  const store = getStore();
  const result = await store.updateReservationByTokenHash(hashToken(token), parsed.data.quantity);
  if (!result.ok) {
    return {
      status: 'error',
      message:
        result.error === 'INSUFFICIENT_QUANTITY'
          ? 'Not enough left to increase to that amount. Other guests have reserved the rest.'
          : result.error === 'RESERVATION_NOT_FOUND'
            ? 'This reservation no longer exists.'
            : 'Could not update the reservation. Please try again.',
    };
  }

  const slug = formData.get('slug');
  revalidateReservationPaths(token, typeof slug === 'string' ? slug : null);
  return {
    status: 'updated',
    message: `Updated! You're now bringing ${parsed.data.quantity}.`,
  };
}

export async function cancelReservationAction(
  _prev: ManageState,
  formData: FormData,
): Promise<ManageState> {
  const token = formData.get('token');
  if (typeof token !== 'string' || !isPlausibleToken(token)) {
    return { status: 'error', message: 'This management link is not valid.' };
  }

  const result = await getStore().cancelReservationByTokenHash(hashToken(token));
  if (!result.ok) {
    return {
      status: 'error',
      message:
        result.error === 'RESERVATION_NOT_FOUND'
          ? 'This reservation was already cancelled.'
          : 'Could not cancel the reservation. Please try again.',
    };
  }

  // No revalidatePath here: the reservation is gone, so re-rendering this
  // route would swap the page to not-found before the confirmation shows.
  // The registry page is dynamic and reflects the freed inventory on the
  // next request.
  return {
    status: 'cancelled',
    message: 'Your reservation is cancelled. The gift is back on the list for other guests.',
  };
}
