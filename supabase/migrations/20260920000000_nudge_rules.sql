-- Phase B (chatbot proactivity): dwell-triggered nudge rules + remote flags.
-- RLS on, zero policies (service-role only). Seeds are starter rules the
-- admin can edit; fixed UUIDs make re-runs idempotent.

create table if not exists nudge_rules (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  content_slug text,
  threshold_ms int not null check (threshold_ms >= 5000),
  teaser text not null check (char_length(teaser) between 1 and 300),
  opener text not null check (char_length(opener) between 1 and 300),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists bot_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into bot_settings (key, value) values
  ('bot_enabled', 'true'),
  ('proactive_enabled', 'true')
on conflict (key) do nothing;

insert into nudge_rules
  (id, section, content_slug, threshold_ms, teaser, opener) values
  ('11111111-1111-1111-1111-111111111111', 'experience', null, 45000,
   'Spent some time here — want the 2-minute story of his backend journey?',
   'Give me the 2-minute tour of his experience'),
  ('22222222-2222-2222-2222-222222222222', 'projects', null, 60000,
   'Browsing the work — want to know which project pushed him hardest technically?',
   'Which project was the most technically challenging and why?'),
  ('33333333-3333-3333-3333-333333333333', 'case-studies', null, 75000,
   'Deep in the case studies — want the pattern across all three?',
   'What patterns connect all three case studies?'),
  ('44444444-4444-4444-4444-444444444444', 'contact', null, 30000,
   'Looking to reach out — want the fastest path?',
   'What is the fastest way to contact him?'),
  ('55555555-5555-5555-5555-555555555555', 'projects', 'whatsapp-crm', 30000,
   'Eyeing the WhatsApp CRM — want the story behind the Flow Builder?',
   'Tell me the story behind the WhatsApp CRM Flow Builder')
on conflict (id) do nothing;

alter table nudge_rules enable row level security;
alter table bot_settings enable row level security;
-- No policies: RLS enabled + zero policies = denied direct access.
