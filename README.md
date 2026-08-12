# GiftCircle

Electronic event invitations with a collaborative gift registry built in. Hosts create an
event (wedding, birthday, baby shower, graduation, …), add gifts, and share one link.
Guests open the invitation, see who is bringing what, and reserve gifts in seconds —
no guest accounts.

## Features

- **Invitation + registry in one page** at `/e/[slug]`, shareable with a single link.
- **Account-free guest reservations** — guests identify with just a name and email and
  receive a **private management link** to change or cancel later.
- **Atomic inventory** — finite gifts can never be over-claimed; enforced by a
  row-locking PostgreSQL function, not just the UI. Duplicate form submissions are
  idempotent (same token → same reservation).
- **Unlimited gifts** — "bring a bottle"-style items accept any number of reservations.
- **Purchaser visibility modes**
  - `public`: host and guests see purchaser names.
  - `surprise_host`: guests see purchaser names, but the host sees only quantities
    until the event date.
- **Privacy**: guest emails are never displayed anywhere; management tokens are stored
  only as SHA-256 hashes; the reservations table has RLS with zero direct-access
  policies (all access via sanitizing SQL functions).
- **Host dashboard** with event and gift CRUD, guarded by Supabase Auth + RLS.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres + Auth) ·
Zod · Vitest · Playwright. Vercel-compatible (no special config needed).

## Getting started

```bash
npm install
npm run dev
```

With no Supabase credentials configured, the app runs in **demo mode**: an in-memory
store seeded with sample fixtures (resets on restart). This is intended for UI
development and tests only.

- Sample public registry: <http://localhost:3000/e/maya-and-jordan>
- Sample surprise-mode registry: <http://localhost:3000/e/baby-whitfield-shower>
- Demo host sign-in: `demo@giftcircle.test` / `password123`
- Sample guest management links: `/reservation/seed-token-amara`, `/reservation/seed-token-ben`,
  `/reservation/seed-token-chloe`, `/reservation/seed-token-dev`

### Connecting Supabase

1. Create a Supabase project (or `supabase start` for the local stack).
2. Apply the schema and seed:
   ```bash
   supabase link --project-ref <your-ref>   # hosted project
   supabase db push                          # applies supabase/migrations
   # seed (local: `supabase db reset` runs it automatically; hosted: paste
   # supabase/seed.sql into the SQL editor — dev/staging only, it creates a
   # demo auth user)
   ```
3. Configure env vars:
   ```bash
   cp .env.example .env.local
   # fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
   ```
4. `npm run dev` — the app now uses Supabase for auth and data. Sign up at
   `/signup` (enable the Email provider in Supabase Auth settings; with email
   confirmation on, confirm before signing in).

### Deploying to Vercel

Push the repo, import it in Vercel, and set the two `NEXT_PUBLIC_SUPABASE_*`
environment variables. Do **not** run the seed against production, and never expose
the `service_role`/secret key — the app only ever needs the publishable key.

## Verification

```bash
npm run verify     # lint + typecheck + unit tests + build
npm run test       # Vitest unit tests (availability math, visibility, reservations)
npm run test:e2e   # Playwright: full guest reserve → manage → cancel flow (demo mode)
```

## Architecture notes

- `src/lib/data/` — one `DataStore` interface, two implementations:
  `SupabaseStore` (SQL functions + RLS) and `MemoryStore` (seeded fixtures that
  mirror the SQL semantics; used without credentials and in tests).
- `supabase/migrations/` — schema, indexes, RLS policies, and the SECURITY DEFINER
  functions (`create_reservation`, `update_reservation_by_token`,
  `cancel_reservation_by_token`, `get_event_registry`,
  `get_host_event_reservations`, `get_reservation_by_token`).
- Reservation atomicity: `create_reservation` takes `SELECT … FOR UPDATE` on the gift
  row, re-checks claimed totals, then inserts — concurrent claims serialize per gift.
- Visibility masking is implemented twice on purpose: in SQL for production reads and
  in `src/lib/visibility.ts` for the memory store + unit tests.

## Limitations (MVP)

- No payments, retailer APIs, email notifications, or invitation templates.
- Demo mode data is per-process and non-persistent; not for production.
- Guests who lose their management link cannot recover the reservation themselves
  (no email delivery in the MVP); the host can remove the gift or the row in Supabase.
