export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 pb-20 sm:px-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your events…</span>
      <div className="mt-10 animate-pulse space-y-6">
        <div className="h-9 w-64 rounded-lg bg-shell" />
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-sand bg-card" />
        ))}
      </div>
    </main>
  );
}
