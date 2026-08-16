/**
 * Typographic wordmark: crisp at any size and DPI (no raster asset).
 * Young Serif in clay with a calligraphic swash underneath, echoing the
 * brand logo's flourish.
 */
export function Wordmark({ className = 'text-xl' }: { className?: string }) {
  return (
    <span className={`relative inline-block leading-none ${className}`}>
      <span className="font-display tracking-tight text-clay">GiftCircle</span>
      <svg
        aria-hidden
        viewBox="0 0 100 8"
        preserveAspectRatio="none"
        className="absolute -bottom-[0.28em] left-0 h-[0.32em] w-full text-butter"
      >
        <path
          d="M2 5.5 C 26 1.5, 58 7.5, 84 3.5 C 90 2.6, 95 3.2, 98 4.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
