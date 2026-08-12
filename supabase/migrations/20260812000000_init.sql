-- GiftCircle initial schema
-- Tables: profiles, events, gifts, reservations
-- Security model:
--   * events + gifts are publicly readable (invitation pages are public by link).
--   * reservations carry guest emails + management token hashes, so they have
--     RLS enabled with NO policies: all access goes through SECURITY DEFINER
--     functions below, which return only sanitized fields.
--   * Only an event's host can insert/update/delete that event and its gifts.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Auto-create a profile row when an auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,80}$'),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  event_type text not null check (
    event_type in ('wedding','birthday','baby_shower','graduation','anniversary','housewarming','other')
  ),
  host_name text not null check (char_length(btrim(host_name)) between 1 and 120),
  event_date date not null,
  location text not null check (char_length(btrim(location)) between 1 and 200),
  message text not null default '' check (char_length(message) <= 2000),
  visibility_mode text not null default 'public' check (visibility_mode in ('public','surprise_host')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_host_id_idx on public.events (host_id);

alter table public.events enable row level security;

-- Invitation pages are public: anyone with the link can read event details.
create policy "events_select_public" on public.events
  for select to anon, authenticated
  using (true);

create policy "events_insert_own" on public.events
  for insert to authenticated
  with check ((select auth.uid()) = host_id);

create policy "events_update_own" on public.events
  for update to authenticated
  using ((select auth.uid()) = host_id)
  with check ((select auth.uid()) = host_id);

create policy "events_delete_own" on public.events
  for delete to authenticated
  using ((select auth.uid()) = host_id);

-- ---------------------------------------------------------------------------
-- gifts
-- ---------------------------------------------------------------------------
create table public.gifts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 140),
  description text not null default '' check (char_length(description) <= 1000),
  product_url text check (product_url is null or product_url ~* '^https?://'),
  image_url text check (image_url is null or image_url ~* '^https?://'),
  estimated_price_cents integer check (estimated_price_cents is null or estimated_price_cents >= 0),
  requested_quantity integer not null default 1 check (requested_quantity between 1 and 1000),
  is_unlimited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index gifts_event_id_idx on public.gifts (event_id);

alter table public.gifts enable row level security;

create policy "gifts_select_public" on public.gifts
  for select to anon, authenticated
  using (true);

create policy "gifts_insert_host" on public.gifts
  for insert to authenticated
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_id and e.host_id = (select auth.uid())
    )
  );

create policy "gifts_update_host" on public.gifts
  for update to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id and e.host_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_id and e.host_id = (select auth.uid())
    )
  );

create policy "gifts_delete_host" on public.gifts
  for delete to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id and e.host_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- reservations
-- ---------------------------------------------------------------------------
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references public.gifts (id) on delete cascade,
  guest_name text not null check (char_length(btrim(guest_name)) between 1 and 120),
  guest_email text not null check (char_length(btrim(guest_email)) between 3 and 254),
  quantity integer not null check (quantity between 1 and 1000),
  management_token_hash text not null unique check (char_length(management_token_hash) = 64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reservations_gift_id_idx on public.reservations (gift_id);

-- RLS on, zero policies: reservations are never readable or writable directly
-- through the Data API. Emails and token hashes stay private; every access
-- path is one of the functions below.
alter table public.reservations enable row level security;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_set_updated_at before update on public.events
  for each row execute function public.set_updated_at();
create trigger gifts_set_updated_at before update on public.gifts
  for each row execute function public.set_updated_at();
create trigger reservations_set_updated_at before update on public.reservations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Reservation functions (the only access path to public.reservations)
-- ---------------------------------------------------------------------------

-- Atomically reserve a gift. Locks the gift row (SELECT ... FOR UPDATE) so
-- concurrent reservations of a finite gift cannot over-claim. Idempotent on
-- management_token_hash: re-submitting the same form returns the existing
-- reservation instead of double-booking.
create or replace function public.create_reservation(
  p_gift_id uuid,
  p_guest_name text,
  p_guest_email text,
  p_quantity integer,
  p_token_hash text
) returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gift public.gifts%rowtype;
  v_claimed integer;
  v_res public.reservations%rowtype;
begin
  if p_quantity is null or p_quantity < 1 or p_quantity > 1000 then
    raise exception 'QUANTITY_INVALID';
  end if;
  if coalesce(btrim(p_guest_name), '') = '' or coalesce(btrim(p_guest_email), '') = '' then
    raise exception 'GUEST_INFO_REQUIRED';
  end if;
  if p_token_hash is null or char_length(p_token_hash) <> 64 then
    raise exception 'TOKEN_INVALID';
  end if;

  -- Duplicate submission of the same form (same idempotency token).
  select * into v_res from public.reservations where management_token_hash = p_token_hash;
  if found then
    return json_build_object('id', v_res.id, 'gift_id', v_res.gift_id,
      'guest_name', v_res.guest_name, 'quantity', v_res.quantity, 'duplicate', true);
  end if;

  select * into v_gift from public.gifts where id = p_gift_id for update;
  if not found then
    raise exception 'GIFT_NOT_FOUND';
  end if;

  if not v_gift.is_unlimited then
    select coalesce(sum(quantity), 0) into v_claimed
    from public.reservations where gift_id = p_gift_id;
    if v_claimed + p_quantity > v_gift.requested_quantity then
      raise exception 'INSUFFICIENT_QUANTITY';
    end if;
  end if;

  begin
    insert into public.reservations (gift_id, guest_name, guest_email, quantity, management_token_hash)
    values (p_gift_id, btrim(p_guest_name), lower(btrim(p_guest_email)), p_quantity, p_token_hash)
    returning * into v_res;
  exception when unique_violation then
    select * into v_res from public.reservations where management_token_hash = p_token_hash;
    return json_build_object('id', v_res.id, 'gift_id', v_res.gift_id,
      'guest_name', v_res.guest_name, 'quantity', v_res.quantity, 'duplicate', true);
  end;

  return json_build_object('id', v_res.id, 'gift_id', v_res.gift_id,
    'guest_name', v_res.guest_name, 'quantity', v_res.quantity, 'duplicate', false);
end;
$$;

-- Full registry payload for the public invitation page.
-- Purchaser names are always visible to guests (both visibility modes);
-- emails and token hashes are never returned.
create or replace function public.get_event_registry(p_slug text)
returns json
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_event public.events%rowtype;
begin
  select * into v_event from public.events where slug = p_slug;
  if not found then
    return null;
  end if;

  return json_build_object(
    'event', json_build_object(
      'id', v_event.id, 'slug', v_event.slug, 'title', v_event.title,
      'event_type', v_event.event_type, 'host_name', v_event.host_name,
      'event_date', v_event.event_date, 'location', v_event.location,
      'message', v_event.message, 'visibility_mode', v_event.visibility_mode
    ),
    'gifts', coalesce((
      select json_agg(g_row order by g_row ->> 'created_at')
      from (
        select json_build_object(
          'id', g.id, 'name', g.name, 'description', g.description,
          'product_url', g.product_url, 'image_url', g.image_url,
          'estimated_price_cents', g.estimated_price_cents,
          'requested_quantity', g.requested_quantity,
          'is_unlimited', g.is_unlimited,
          'created_at', g.created_at,
          'claimed_quantity', coalesce((
            select sum(r.quantity) from public.reservations r where r.gift_id = g.id
          ), 0),
          'purchasers', coalesce((
            select json_agg(json_build_object(
              'reservation_id', r.id, 'name', r.guest_name,
              'quantity', r.quantity, 'created_at', r.created_at
            ) order by r.created_at)
            from public.reservations r where r.gift_id = g.id
          ), '[]'::json)
        ) as g_row
        from public.gifts g
        where g.event_id = v_event.id
      ) sub
    ), '[]'::json)
  );
end;
$$;

-- Host-side reservation report. In surprise_host mode, purchaser names are
-- masked until the event date has arrived. Emails are never returned.
create or replace function public.get_host_event_reservations(p_event_id uuid)
returns json
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_event public.events%rowtype;
  v_masked boolean;
begin
  select * into v_event from public.events where id = p_event_id;
  if not found or v_event.host_id is distinct from (select auth.uid()) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  v_masked := v_event.visibility_mode = 'surprise_host' and current_date < v_event.event_date;

  return coalesce((
    select json_agg(json_build_object(
      'reservation_id', r.id,
      'gift_id', r.gift_id,
      'name', case when v_masked then null else r.guest_name end,
      'quantity', r.quantity,
      'created_at', r.created_at,
      'masked', v_masked
    ) order by r.created_at)
    from public.reservations r
    join public.gifts g on g.id = r.gift_id
    where g.event_id = v_event.id
  ), '[]'::json);
end;
$$;

-- Look up a reservation with its private management token (hashed).
create or replace function public.get_reservation_by_token(p_token_hash text)
returns json
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_res public.reservations%rowtype;
  v_gift public.gifts%rowtype;
  v_event public.events%rowtype;
  v_claimed integer;
begin
  select * into v_res from public.reservations where management_token_hash = p_token_hash;
  if not found then
    return null;
  end if;
  select * into v_gift from public.gifts where id = v_res.gift_id;
  select * into v_event from public.events where id = v_gift.event_id;
  select coalesce(sum(quantity), 0) into v_claimed
  from public.reservations where gift_id = v_gift.id;

  return json_build_object(
    'reservation', json_build_object(
      'id', v_res.id, 'guest_name', v_res.guest_name, 'guest_email', v_res.guest_email,
      'quantity', v_res.quantity, 'created_at', v_res.created_at
    ),
    'gift', json_build_object(
      'id', v_gift.id, 'name', v_gift.name, 'description', v_gift.description,
      'image_url', v_gift.image_url, 'product_url', v_gift.product_url,
      'estimated_price_cents', v_gift.estimated_price_cents,
      'requested_quantity', v_gift.requested_quantity,
      'is_unlimited', v_gift.is_unlimited, 'claimed_quantity', v_claimed
    ),
    'event', json_build_object(
      'slug', v_event.slug, 'title', v_event.title, 'event_date', v_event.event_date,
      'host_name', v_event.host_name
    )
  );
end;
$$;

-- Update a reservation's quantity via its management token. Locks the gift
-- row and re-checks inventory (excluding this reservation's current claim).
create or replace function public.update_reservation_by_token(
  p_token_hash text,
  p_quantity integer
) returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_res public.reservations%rowtype;
  v_gift public.gifts%rowtype;
  v_other_claimed integer;
begin
  if p_quantity is null or p_quantity < 1 or p_quantity > 1000 then
    raise exception 'QUANTITY_INVALID';
  end if;

  select * into v_res from public.reservations where management_token_hash = p_token_hash;
  if not found then
    raise exception 'RESERVATION_NOT_FOUND';
  end if;

  select * into v_gift from public.gifts where id = v_res.gift_id for update;

  if not v_gift.is_unlimited then
    select coalesce(sum(quantity), 0) into v_other_claimed
    from public.reservations
    where gift_id = v_gift.id and id <> v_res.id;
    if v_other_claimed + p_quantity > v_gift.requested_quantity then
      raise exception 'INSUFFICIENT_QUANTITY';
    end if;
  end if;

  update public.reservations set quantity = p_quantity where id = v_res.id;
  return json_build_object('id', v_res.id, 'quantity', p_quantity);
end;
$$;

-- Cancel a reservation via its management token.
create or replace function public.cancel_reservation_by_token(p_token_hash text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  delete from public.reservations
  where management_token_hash = p_token_hash
  returning id into v_id;
  if v_id is null then
    raise exception 'RESERVATION_NOT_FOUND';
  end if;
  return json_build_object('id', v_id, 'cancelled', true);
end;
$$;

-- ---------------------------------------------------------------------------
-- Function grants: guest-facing functions are callable by anon; the host
-- report requires an authenticated session (and checks auth.uid() itself).
-- ---------------------------------------------------------------------------
revoke all on function public.create_reservation(uuid, text, text, integer, text) from public;
revoke all on function public.get_event_registry(text) from public;
revoke all on function public.get_reservation_by_token(text) from public;
revoke all on function public.update_reservation_by_token(text, integer) from public;
revoke all on function public.cancel_reservation_by_token(text) from public;
revoke all on function public.get_host_event_reservations(uuid) from public;
revoke all on function public.handle_new_user() from public;
revoke all on function public.set_updated_at() from public;

grant execute on function public.create_reservation(uuid, text, text, integer, text) to anon, authenticated;
grant execute on function public.get_event_registry(text) to anon, authenticated;
grant execute on function public.get_reservation_by_token(text) to anon, authenticated;
grant execute on function public.update_reservation_by_token(text, integer) to anon, authenticated;
grant execute on function public.cancel_reservation_by_token(text) to anon, authenticated;
grant execute on function public.get_host_event_reservations(uuid) to authenticated;
