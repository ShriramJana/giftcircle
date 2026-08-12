import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-bold tracking-[0.18em] uppercase text-clay">Nothing here</p>
      <h1 className="font-display mt-4 text-3xl text-ink">
        This page seems to have slipped out of its envelope.
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        The invitation or reservation you&rsquo;re looking for doesn&rsquo;t exist or its link has
        changed. Double-check the link you were sent.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-card hover:bg-clay-deep"
      >
        Go to GiftCircle
      </Link>
    </main>
  );
}
