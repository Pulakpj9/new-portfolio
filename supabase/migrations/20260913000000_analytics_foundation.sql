-- Phase 1: analytics foundation (channels, sessions, events).
-- Apply via Supabase Dashboard > SQL Editor, or `supabase db push`.
-- Single events table by design (see docs/IMPLEMENTATION_PLAN.md ADR 4):
-- portfolio-scale traffic never justifies partitions or rollup pipelines.

-- ---------------------------------------------------------------- channels
create table if not exists channels (
  slug        text primary key
              check (slug ~ '^[a-z0-9-]{2,32}$'),
  label       text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

insert into channels (slug, label) values
  ('direct',   'Direct / unknown'),
  ('linkedin', 'LinkedIn'),
  ('resume',   'Resume PDF'),
  ('github',   'GitHub')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------- sessions
create table if not exists sessions (
  id           uuid primary key,
  started_at   timestamptz not null default now(),
  channel_slug text not null default 'direct'
               references channels (slug),
  landing_path text not null default '/',
  referrer     text,
  utm_source   text,
  utm_medium   text,
  device       text not null default 'desktop'
               check (device in ('desktop', 'mobile', 'tablet')),
  user_agent   text,
  closed_at    timestamptz
);

create index if not exists sessions_started_at_idx
  on sessions (started_at desc);
create index if not exists sessions_channel_started_idx
  on sessions (channel_slug, started_at desc);

-- ------------------------------------------------------------------ events
create table if not exists events (
  id           bigint generated always as identity primary key,
  time         timestamptz not null default now(),
  session_id   uuid not null references sessions (id) on delete cascade,
  type         text not null,
  section      text,
  content_slug text,
  dwell_ms     integer check (dwell_ms >= 0),
  meta         jsonb not null default '{}'
);

-- Time-range scans (dashboard date filters).
create index if not exists events_time_brin_idx
  on events using brin (time);
-- Session timelines (drill-down).
create index if not exists events_session_time_idx
  on events (session_id, time);
-- Section dwell aggregates (partial: only the hot event types).
create index if not exists events_section_dwell_idx
  on events (type, section, time)
  where type in ('section_enter', 'section_exit');

-- ---------------------------------------------------------------------- RLS
-- Deny everything to anon/authenticated: ALL access goes through server
-- routes using the service-role key (belt and suspenders with key hygiene).
alter table channels enable row level security;
alter table sessions enable row level security;
alter table events   enable row level security;
-- No policies created intentionally: with RLS enabled and zero policies,
-- every direct client query is denied.
