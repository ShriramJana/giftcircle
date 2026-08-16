/**
 * The registry's signature availability mark: one tick per requested unit,
 * filled as units are claimed — a punch card for the gift list. Falls back to
 * a compact bar for large quantities and a pill for unlimited gifts.
 */
export function QuantityTicks({
  requested,
  claimed,
  isUnlimited,
}: {
  requested: number;
  claimed: number;
  isUnlimited: boolean;
}) {
  if (isUnlimited) {
    return (
      <div className="flex items-center gap-2 text-sm text-ink-soft">
        <span
          aria-hidden
          className="inline-flex h-5 items-center rounded-full bg-leaf-tint px-2 font-display text-xs text-leaf"
        >
          ∞
        </span>
        <span>
          Unlimited: {claimed === 0 ? 'be the first to bring one' : `${claimed} reserved so far`}
        </span>
      </div>
    );
  }

  const remaining = Math.max(0, requested - claimed);
  const label = `${claimed} of ${requested} claimed, ${remaining} remaining`;

  if (requested > 9) {
    const pct = Math.min(100, Math.round((claimed / requested) * 100));
    return (
      <div className="space-y-1" role="img" aria-label={label}>
        <div className="h-2 w-full overflow-hidden rounded-full bg-shell">
          <div className="h-full rounded-full bg-clay transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-ink-soft">{label}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1" role="img" aria-label={label}>
        {Array.from({ length: requested }, (_, i) => (
          <span
            key={i}
            aria-hidden
            className={`h-3.5 w-3.5 rounded-[5px] border transition-colors duration-500 ${
              i < claimed ? 'border-clay bg-clay' : 'border-sand bg-card'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-ink-soft">
        {remaining === 0 ? (
          <span className="font-semibold text-leaf">Fully claimed. Thank you!</span>
        ) : (
          <>
            <span className="font-semibold text-ink">{remaining}</span> of {requested} still
            available
          </>
        )}
      </p>
    </div>
  );
}
