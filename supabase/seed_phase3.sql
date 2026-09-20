-- DEV ONLY Phase 3 engagement data. Run on a DEV project AFTER seed.sql
-- (or after real traffic exists) — it attaches content/click events to a
-- sample of existing sessions. Never on production.
-- Cleanup: delete from events where meta->>'seed3' = 'true';

begin;

select setseed(0.7);

-- content views: 3 project cards + 3 case-study cards, reach-weighted
insert into events (time, session_id, type, content_slug, meta)
select s.started_at + ((random() * 120) || ' seconds')::interval,
       s.id, 'content_view', x.slug, jsonb_build_object('kind', x.kind, 'seed3', 'true')
from (select id, started_at from sessions order by random() limit 220) s
cross join lateral (
  values ('project', 'activity-tracker', 0.55),
         ('project', 'whatsapp-crm', 0.50),
         ('project', 'salesapp', 0.45),
         ('case-study', 'activity-tracker', 0.30),
         ('case-study', 'whatsapp-crm', 0.28),
         ('case-study', 'salesapp', 0.25)
) as x(kind, slug, reach)
where random() < x.reach;

-- case-study expands: subset of case-study viewers open the accordion
insert into events (time, session_id, type, content_slug, meta)
select v.time + ((5 + random() * 40) || ' seconds')::interval,
       v.session_id, 'cta_click', v.content_slug,
       jsonb_build_object('kind', 'case-study', 'target', 'expand-case-study', 'seed3', 'true')
from events v
where v.type = 'content_view'
  and v.meta ->> 'kind' = 'case-study'
  and random() < 0.45;

-- video plays: subset of viewers on the two video projects
insert into events (time, session_id, type, content_slug, meta)
select v.time + ((3 + random() * 20) || ' seconds')::interval,
       v.session_id, 'video_play', v.content_slug,
       jsonb_build_object('kind', 'project', 'seed3', 'true')
from events v
where v.type = 'content_view'
  and v.meta ->> 'kind' = 'project'
  and v.content_slug in ('whatsapp-crm', 'salesapp')
  and random() < 0.35;

-- conversions: email / social / chat sprinkled across sessions
insert into events (time, session_id, type, meta)
select s.started_at + ((60 + random() * 300) || ' seconds')::interval,
       s.id, 'cta_click', jsonb_build_object('target', 'email', 'seed3', 'true')
from (select id, started_at from sessions order by random() limit 40) s;

insert into events (time, session_id, type, meta)
select s.started_at + ((60 + random() * 300) || ' seconds')::interval,
       s.id, 'social_click',
       jsonb_build_object('network',
         case when random() < 0.5 then 'github' else 'linkedin' end,
         'seed3', 'true')
from (select id, started_at from sessions order by random() limit 55) s;

insert into events (time, session_id, type, meta)
select s.started_at + ((30 + random() * 200) || ' seconds')::interval,
       s.id, 'chat_open', jsonb_build_object('seed3', 'true')
from (select id, started_at from sessions order by random() limit 35) s;

commit;
