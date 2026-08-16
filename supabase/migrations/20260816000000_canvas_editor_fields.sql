-- Canvas editor fields: optional times, host note, background theme, and
-- share-costs details. All nullable; existing rows are untouched.

alter table public.events
  add column start_time time,
  add column end_time time,
  add column host_note text,
  add column background text,
  add column cost_mode text,
  add column cost_amount_cents integer,
  add column cost_memo text,
  add column venmo_handle text,
  add column zelle_handle text,
  add column cashapp_handle text;

alter table public.events
  add constraint events_cost_mode_check
    check (cost_mode is null or cost_mode in ('required', 'suggested'));

alter table public.events
  add constraint events_cost_amount_check
    check (cost_amount_cents is null or cost_amount_cents >= 0);

alter table public.events
  add constraint events_end_requires_start_check
    check (end_time is null or start_time is not null);
