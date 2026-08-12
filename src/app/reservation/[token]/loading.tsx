export default function ReservationLoading() {
  return (
    <main className="mx-auto max-w-xl px-4 pb-20 sm:px-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your reservation…</span>
      <div className="mt-10 animate-pulse space-y-6">
        <div className="mx-auto h-3 w-32 rounded-full bg-shell" />
        <div className="mx-auto h-8 w-3/4 rounded-lg bg-shell" />
        <div className="h-48 rounded-2xl border border-sand bg-card" />
        <div className="h-40 rounded-2xl border border-sand bg-card" />
      </div>
    </main>
  );
}
