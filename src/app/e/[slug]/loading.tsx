export default function EventLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 sm:px-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading invitation…</span>
      <div className="mx-auto mt-8 max-w-2xl animate-pulse rounded-2xl bg-card px-6 py-16 shadow-sm">
        <div className="mx-auto h-3 w-40 rounded-full bg-shell" />
        <div className="mx-auto mt-6 h-8 w-3/4 rounded-lg bg-shell" />
        <div className="mx-auto mt-4 h-4 w-1/2 rounded-full bg-shell" />
        <div className="mx-auto mt-8 h-20 w-full rounded-xl bg-paper" />
      </div>
      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-56 animate-pulse rounded-2xl border border-sand bg-card" />
        ))}
      </div>
    </main>
  );
}
