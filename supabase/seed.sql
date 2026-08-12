-- GiftCircle seed data for LOCAL DEVELOPMENT ONLY.
-- Creates a demo host (demo@giftcircle.test / password123), a public wedding
-- registry, a surprise-mode baby shower, gifts, and a few reservations.
-- Seeded reservation management tokens (plaintext) for trying /reservation/[token]:
--   seed-token-amara, seed-token-ben, seed-token-chloe, seed-token-dev

-- Demo auth user (works with the local Supabase stack; do not run in prod).
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token,
  email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated', 'demo@giftcircle.test',
  crypt('password123', gen_salt('bf')),
  now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Maya Whitfield"}',
  now(), now(), '', '', '', ''
) on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"demo@giftcircle.test","email_verified":true}',
  'email', now(), now(), now()
) on conflict do nothing;

insert into public.profiles (id, display_name)
values ('11111111-1111-1111-1111-111111111111', 'Maya Whitfield')
on conflict (id) do nothing;

-- Public wedding registry -----------------------------------------------------
insert into public.events (id, host_id, slug, title, event_type, host_name, event_date, location, message, visibility_mode)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'maya-and-jordan',
  'Maya & Jordan are getting married',
  'wedding',
  'Maya Whitfield & Jordan Rees',
  '2026-11-14',
  'Hollis Farm, Petaluma, California',
  'After eight years, two apartments, and one very opinionated cat, we are finally making it official. Join us under the oaks for vows at golden hour, dinner under string lights, and dancing until they make us stop. Your company is the real gift, but if you would like to bring something, we put together a few things for the home we are building together.',
  'public'
) on conflict (id) do nothing;

insert into public.gifts (id, event_id, name, description, product_url, image_url, estimated_price_cents, requested_quantity, is_unlimited) values
  ('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222222',
   'Dutch oven, 5.5 qt',
   'The enameled cast-iron one in flame orange. Destined for a decade of Sunday ragù.',
   'https://www.lecreuset.com/round-dutch-oven/LS2501.html', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=70', 41500, 1, false),
  ('33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222222',
   'Stoneware dinner plates',
   'Handmade plates from the ceramics studio where we had our third date. We are collecting eight.',
   null, 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=70', 4800, 8, false),
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222',
   'Linen tablecloth',
   'Washed linen, rust stripe, big enough for the long table we keep promising to buy.',
   null, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=70', 12900, 1, false),
  ('33333333-3333-3333-3333-333333333334', '22222222-2222-2222-2222-222222222222',
   'Picnic hamper for two',
   'Wicker, leather straps, real cutlery. For the coast drives we never plan properly.',
   null, null, 15000, 1, false),
  ('33333333-3333-3333-3333-333333333335', '22222222-2222-2222-2222-222222222222',
   'A bottle for the cellar',
   'Bring a bottle you love with a note about when we should open it. There is no such thing as too many.',
   null, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=70', 3500, 1, true),
  ('33333333-3333-3333-3333-333333333336', '22222222-2222-2222-2222-222222222222',
   'Wool picnic blanket',
   'Recycled wool, plaid, machine washable because we know ourselves.',
   null, 'https://images.unsplash.com/photo-1600369672770-985fd30004eb?auto=format&fit=crop&w=900&q=70', 9800, 2, false)
on conflict (id) do nothing;

-- Surprise-mode baby shower ---------------------------------------------------
insert into public.events (id, host_id, slug, title, event_type, host_name, event_date, location, message, visibility_mode)
values (
  '22222222-2222-2222-2222-222222222223',
  '11111111-1111-1111-1111-111111111111',
  'baby-whitfield-shower',
  'A shower for Baby Whitfield',
  'baby_shower',
  'Maya Whitfield',
  '2026-10-03',
  'The Fern Room, Oakland, California',
  'Someone very small is arriving this winter. Come for cake and terrible guessing games. Maya has asked not to see who is bringing what until the big day, so reserve freely. Your name stays a surprise to her.',
  'surprise_host'
) on conflict (id) do nothing;

insert into public.gifts (id, event_id, name, description, product_url, image_url, estimated_price_cents, requested_quantity, is_unlimited) values
  ('33333333-3333-3333-3333-333333333341', '22222222-2222-2222-2222-222222222223',
   'Muslin swaddle set',
   'The soft ones, in any color that is not beige.',
   null, 'https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=900&q=70', 4200, 3, false),
  ('33333333-3333-3333-3333-333333333342', '22222222-2222-2222-2222-222222222223',
   'A favorite children''s book',
   'Bring the book you loved most as a kid, inscribed with a note.',
   null, null, 1500, 1, true)
on conflict (id) do nothing;

-- Sample reservations (management token hashes are sha256 of the plaintext
-- tokens listed at the top of this file) --------------------------------------
insert into public.reservations (gift_id, guest_name, guest_email, quantity, management_token_hash) values
  ('33333333-3333-3333-3333-333333333332', 'Amara Osei', 'amara@example.com', 4,
   'f3343326b6ac4223b8dcab6bbc035d17f21e9adf965fa904e957eddbd004f62c'),
  ('33333333-3333-3333-3333-333333333331', 'Ben Calloway', 'ben@example.com', 1,
   '597a1e4ca735976701ae53b6552bd21a3cf05c5628e023d0b714f55e825fbf98'),
  ('33333333-3333-3333-3333-333333333335', 'Chloe Marsh', 'chloe@example.com', 2,
   '0ad6bb3c397d7d20dace07524a4baee5276a3fb1ab1cbc2e844482cfcb4280de'),
  ('33333333-3333-3333-3333-333333333341', 'Dev Raghunathan', 'dev@example.com', 1,
   '015555b741cdc0da4399f81a0a4e437a6756febf238855c8e865d6568157d5b3')
on conflict (management_token_hash) do nothing;
