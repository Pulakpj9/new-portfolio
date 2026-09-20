-- Phase A (chatbot): anonymous conversation log.
-- Editorial intel (what visitors ask) + eval mining. Same posture as events:
-- RLS on, zero policies, service-role only, 13-month session cascade.

create table if not exists bot_conversations (
  id bigint generated always as identity primary key,
  time timestamptz not null default now(),
  session_id uuid references sessions(id) on delete cascade,
  question text not null,
  intent text,
  tools_used text[] not null default '{}',
  low_confidence boolean not null default false
);

create index if not exists bot_conversations_time_brin_idx
  on bot_conversations using brin (time);

alter table bot_conversations enable row level security;
-- No policies: with RLS enabled and zero policies, direct client access
-- is denied; all writes go through /api/chat with the service key.
