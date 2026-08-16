'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getStore } from '@/lib/data';
import { generateSlug } from '@/lib/format';
import { eventSchema, fieldErrorsOf, giftSchema } from '@/lib/validation';
import type { FieldErrors } from '@/lib/validation';

export interface CrudState {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: FieldErrors;
  /** Submitted values echoed back on error so forms can re-fill fields
   * (React resets uncontrolled inputs after a form action). */
  values?: Record<string, string>;
}

const NOT_SIGNED_IN: CrudState = {
  status: 'error',
  message: 'Your session expired. Sign in again.',
};

const EVENT_FIELD_KEYS = ['title', 'eventType', 'hostName', 'eventDate', 'location', 'message', 'visibilityMode'];
const GIFT_FIELD_KEYS = ['name', 'description', 'productUrl', 'imageUrl', 'estimatedPrice', 'requestedQuantity', 'isUnlimited'];

function echoValues(formData: FormData, keys: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of keys) {
    const value = formData.get(key);
    if (typeof value === 'string') out[key] = value;
  }
  return out;
}

function eventInputFromForm(formData: FormData) {
  return eventSchema.safeParse({
    title: formData.get('title'),
    eventType: formData.get('eventType'),
    hostName: formData.get('hostName'),
    eventDate: formData.get('eventDate'),
    location: formData.get('location'),
    message: formData.get('message') ?? '',
    visibilityMode: formData.get('visibilityMode'),
  });
}

function giftInputFromForm(formData: FormData) {
  return giftSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') ?? '',
    productUrl: formData.get('productUrl') ?? '',
    imageUrl: formData.get('imageUrl') ?? '',
    estimatedPrice: formData.get('estimatedPrice') ?? '',
    requestedQuantity: formData.get('requestedQuantity'),
    isUnlimited: formData.get('isUnlimited') === 'on',
  });
}

export async function createEventAction(
  _prev: CrudState,
  formData: FormData,
): Promise<CrudState> {
  const user = await getSessionUser();
  if (!user) return NOT_SIGNED_IN;

  const parsed = eventInputFromForm(formData);
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Check the highlighted fields.',
      fieldErrors: fieldErrorsOf(parsed.error),
      values: echoValues(formData, EVENT_FIELD_KEYS),
    };
  }

  const d = parsed.data;
  const input = {
    title: d.title,
    event_type: d.eventType,
    host_name: d.hostName,
    event_date: d.eventDate,
    location: d.location,
    message: d.message,
    visibility_mode: d.visibilityMode,
    start_time: null,
    end_time: null,
    host_note: null,
    background: null,
    cost_mode: null,
    cost_amount_cents: null,
    cost_memo: null,
    venmo_handle: null,
    zelle_handle: null,
    cashapp_handle: null,
  };

  // Slugs carry a random suffix; retry once on the unlikely collision.
  let created = await getStore().createEvent(user.id, generateSlug(d.title), input);
  if (!created.ok) {
    created = await getStore().createEvent(user.id, generateSlug(d.title), input);
  }
  if (!created.ok) {
    return {
      status: 'error',
      message: 'Could not create the event. Please try again.',
      values: echoValues(formData, EVENT_FIELD_KEYS),
    };
  }

  revalidatePath('/dashboard');
  redirect(`/dashboard/events/${created.data.id}`);
}

export async function updateEventAction(
  _prev: CrudState,
  formData: FormData,
): Promise<CrudState> {
  const user = await getSessionUser();
  if (!user) return NOT_SIGNED_IN;

  const eventId = formData.get('eventId');
  if (typeof eventId !== 'string') return { status: 'error', message: 'Unknown event.' };

  const parsed = eventInputFromForm(formData);
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Check the highlighted fields.',
      fieldErrors: fieldErrorsOf(parsed.error),
      values: echoValues(formData, EVENT_FIELD_KEYS),
    };
  }

  const d = parsed.data;
  const result = await getStore().updateEvent(user.id, eventId, {
    title: d.title,
    event_type: d.eventType,
    host_name: d.hostName,
    event_date: d.eventDate,
    location: d.location,
    message: d.message,
    visibility_mode: d.visibilityMode,
    start_time: null,
    end_time: null,
    host_note: null,
    background: null,
    cost_mode: null,
    cost_amount_cents: null,
    cost_memo: null,
    venmo_handle: null,
    zelle_handle: null,
    cashapp_handle: null,
  });
  if (!result.ok) {
    return {
      status: 'error',
      message: 'Could not save. Only the event host can edit it.',
      values: echoValues(formData, EVENT_FIELD_KEYS),
    };
  }

  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath('/dashboard');
  return { status: 'success', message: 'Event details saved.' };
}

export async function deleteEventAction(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const eventId = formData.get('eventId');
  if (typeof eventId === 'string') {
    await getStore().deleteEvent(user.id, eventId);
    revalidatePath('/dashboard');
  }
  redirect('/dashboard');
}

export async function createGiftAction(_prev: CrudState, formData: FormData): Promise<CrudState> {
  const user = await getSessionUser();
  if (!user) return NOT_SIGNED_IN;

  const eventId = formData.get('eventId');
  if (typeof eventId !== 'string') return { status: 'error', message: 'Unknown event.' };

  const parsed = giftInputFromForm(formData);
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Check the highlighted fields.',
      fieldErrors: fieldErrorsOf(parsed.error),
      values: echoValues(formData, GIFT_FIELD_KEYS),
    };
  }

  const result = await getStore().createGift(user.id, eventId, parsed.data);
  if (!result.ok) {
    return {
      status: 'error',
      message: 'Could not add the gift. Only the event host can.',
      values: echoValues(formData, GIFT_FIELD_KEYS),
    };
  }

  revalidatePath(`/dashboard/events/${eventId}`);
  return { status: 'success', message: `Added “${parsed.data.name}” to the list.` };
}

export async function updateGiftAction(_prev: CrudState, formData: FormData): Promise<CrudState> {
  const user = await getSessionUser();
  if (!user) return NOT_SIGNED_IN;

  const giftId = formData.get('giftId');
  const eventId = formData.get('eventId');
  if (typeof giftId !== 'string' || typeof eventId !== 'string') {
    return { status: 'error', message: 'Unknown gift.' };
  }

  const parsed = giftInputFromForm(formData);
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Check the highlighted fields.',
      fieldErrors: fieldErrorsOf(parsed.error),
      values: echoValues(formData, GIFT_FIELD_KEYS),
    };
  }

  const result = await getStore().updateGift(user.id, giftId, parsed.data);
  if (!result.ok) {
    return {
      status: 'error',
      message: 'Could not save. Only the event host can edit gifts.',
      values: echoValues(formData, GIFT_FIELD_KEYS),
    };
  }

  revalidatePath(`/dashboard/events/${eventId}`);
  return { status: 'success', message: 'Gift saved.' };
}

export async function deleteGiftAction(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const giftId = formData.get('giftId');
  const eventId = formData.get('eventId');
  if (typeof giftId === 'string' && typeof eventId === 'string') {
    await getStore().deleteGift(user.id, giftId);
    revalidatePath(`/dashboard/events/${eventId}`);
  }
}
