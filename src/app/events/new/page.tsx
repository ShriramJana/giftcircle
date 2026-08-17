import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { EventCanvas } from '@/components/event-canvas';
import { getSessionUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'New event' };

export default async function NewEventPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return <EventCanvas />;
}
