export default function ManageEventLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 pb-20 sm:px-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading event…</span>
      <div className="mt-10 animate-pulse space-y-6">
        <div className="h-9 w-3/4 rounded-lg bg-shell" />
        <div className="h-16 rounded-2xl border border-sand bg-card" />
        <div className="h-48 rounded-2xl border border-sand bg-card" />
        <div className="h-64 rounded-2xl border border-sand bg-card" />
      </div>
    </main>
  );
}
