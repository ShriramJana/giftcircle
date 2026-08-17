import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { EventCanvas } from '@/components/event-canvas';
import { getSessionUser } from '@/lib/auth';
import { getStore } from '@/lib/data';

export const metadata: Metadata = { title: 'Edit invitation' };

export default async function DesignPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const { id } = await params;
  const detail = await getStore().getHostEventDetail(user.id, id);
  if (!detail) notFound();
  return <EventCanvas event={detail.event} />;
}
