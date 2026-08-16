import Link from 'next/link';
import { signOutAction } from '@/app/(auth)/actions';
import { getSessionUser } from '@/lib/auth';
import { Wordmark } from './wordmark';

export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="border-b border-sand bg-card/70 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="GiftCircle home" className="transition-opacity hover:opacity-80">
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink hover:bg-shell/50"
              >
                My events
              </Link>
              <span className="hidden text-sm text-ink-faint sm:inline" aria-hidden>
                ·
              </span>
              <span className="hidden max-w-40 truncate text-sm text-ink-soft sm:inline">
                {user.displayName || user.email}
              </span>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink-soft hover:bg-shell/50 hover:text-ink"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink hover:bg-shell/50"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-clay px-4 py-1.5 text-sm font-semibold text-card hover:bg-clay-deep"
              >
                Host an event
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
