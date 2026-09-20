-- Phase 3 fix: group content engagement by (slug, kind), not slug alone.
-- Slugs are shared between projects and case-studies (activity-tracker, …),
-- so max(kind) collapsed every row to 'project' and hid the expands column.
-- Same signature → CREATE OR REPLACE is safe.

create or replace function analytics_content(
  p_from timestamptz, p_to timestamptz, p_channel text default null
)
returns json
language sql
stable
as $$
  with scoped as (
    select e.*
    from events e
    join sessions s on s.id = e.session_id
    where e.time >= p_from
      and e.time < p_to
      and (nullif(p_channel, '') is null or s.channel_slug = p_channel)
      and e.content_slug is not null
  )
  select coalesce(json_agg(row_to_json(t) order by t.views desc), '[]'::json)
  from (
    select slug, kind, views, expands, video_plays
    from (
      select content_slug as slug,
             (e.meta ->> 'kind') as kind,
             count(*) filter (where e.type = 'content_view')::int as views,
             count(*) filter (where e.type = 'cta_click'
               and e.meta ->> 'target' = 'expand-case-study')::int as expands,
             count(*) filter (where e.type = 'video_play')::int as video_plays
      from scoped e
      group by content_slug, (e.meta ->> 'kind')
    ) g
    where views > 0 or expands > 0 or video_plays > 0
  ) t;
$$;
