-- Phase 3: funnel, content engagement, channel stats, session drill-down.
-- Same doctrine as Phase 2: on-demand exact SQL, no pipelines.

-- ---------------------------------------------------------------- funnel --
create or replace function analytics_funnel(
  p_from timestamptz, p_to timestamptz, p_channel text default null
)
returns json
language sql
stable
as $$
  with s as (
    select id
    from sessions
    where started_at >= p_from
      and started_at < p_to
      and (nullif(p_channel, '') is null or channel_slug = p_channel)
  ),
  total as (select count(*)::int as n from s)
  select json_build_object(
    'sessions', (select n from total),
    'steps', coalesce((
      select json_agg(row_to_json(t))
      from (
        select e.section,
               count(distinct e.session_id)::int as sessions,
               round((count(distinct e.session_id))::numeric
                 / greatest((select n from total), 1)::numeric, 4) as reach
        from events e
        join s on s.id = e.session_id
        where e.type = 'section_exit' and e.section is not null
        group by e.section
      ) t
    ), '[]'::json)
  );
$$;

-- --------------------------------------------------------------- content --
-- Engagement per content item. kind comes from meta->>'kind'
-- ('project' | 'case-study'); expands = case-study accordion opens.
-- NOTE: grouped by (slug, kind) — see 20260917000000_content_kind_split.sql.
-- This definition is superseded there; kept for migration-order clarity.
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
  select coalesce(json_agg(row_to_json(t)), '[]'::json)
  from (
    select content_slug as slug,
           max(e.meta ->> 'kind') filter (where e.meta ->> 'kind' is not null)
             as kind,
           count(*) filter (where e.type = 'content_view')::int as views,
           count(*) filter (where e.type = 'cta_click'
             and e.meta ->> 'target' = 'expand-case-study')::int as expands,
           count(*) filter (where e.type = 'video_play')::int as video_plays
    from scoped e
    group by content_slug
    order by views desc
  ) t;
$$;

-- -------------------------------------------------------- channel stats --
create or replace function analytics_channels(
  p_from timestamptz, p_to timestamptz
)
returns json
language sql
stable
as $$
  select coalesce(json_agg(row_to_json(t) order by t.sessions desc), '[]'::json)
  from (
    select c.slug, c.label, c.is_active,
           count(s.id)::int as sessions,
           coalesce(
             percentile_cont(0.5) within group (
               order by extract(epoch from (last_ev.max_t - s.started_at)) * 1000
             ), 0) as median_session_ms,
           (select e.section
            from events e
            join sessions s2 on s2.id = e.session_id
            where s2.channel_slug = c.slug
              and e.time >= p_from and e.time < p_to
              and e.type = 'section_exit' and e.section is not null
            group by e.section
            order by count(*) desc
            limit 1) as top_section
    from channels c
    left join sessions s
      on s.channel_slug = c.slug
      and s.started_at >= p_from and s.started_at < p_to
    left join lateral (
      select max(e.time) as max_t
      from events e
      where e.session_id = s.id
    ) last_ev on true
    group by c.slug, c.label, c.is_active
  ) t;
$$;

-- ---------------------------------------------------------- sessions -----
create or replace function analytics_sessions(
  p_from timestamptz, p_to timestamptz,
  p_channel text default null,
  p_cursor_time timestamptz default null,
  p_cursor_id uuid default null,
  p_limit int default 20
)
returns json
language sql
stable
as $$
  with lim as (select greatest(least(p_limit, 100), 1) as v),
  s as (
    select s2.id, s2.started_at, s2.channel_slug, s2.device
    from sessions s2
    where s2.started_at >= p_from
      and s2.started_at < p_to
      and (nullif(p_channel, '') is null or s2.channel_slug = p_channel)
      and ((p_cursor_time is null and p_cursor_id is null)
        or (s2.started_at, s2.id) < (p_cursor_time, p_cursor_id))
    order by s2.started_at desc, s2.id desc
    limit (select v + 1 from lim)
  ),
  rows as (
    select s.id,
           s.started_at,
           s.channel_slug as channel,
           s.device,
           count(e.id)::int as events,
           case when count(e.id) > 0 then round(
             extract(epoch from (max(e.time) - s.started_at)) * 1000)::int
           else null end as duration_ms,
           coalesce((
             select array_agg(x.section order by x.first_t)
             from (
               select e2.section, min(e2.time) as first_t
               from events e2
               where e2.session_id = s.id
                 and e2.type = 'section_exit' and e2.section is not null
               group by e2.section
             ) x
           ), '{}') as sections
    from s
    left join events e on e.session_id = s.id
    group by s.id, s.started_at, s.channel_slug, s.device
    order by s.started_at desc, s.id desc
  ),
  capped as (
    select * from rows
    limit (select v from lim)
  )
  select json_build_object(
    'rows', coalesce((select json_agg(row_to_json(c)) from capped c), '[]'::json),
    'next_cursor', case when (select count(*) from rows)
        > (select v from lim)
      then (select row_to_json(n) from (
        select started_at as time, id from capped
        order by started_at asc, id asc limit 1
      ) n)
      else null end
  );
$$;

create or replace function analytics_session_detail(p_session uuid)
returns json
language sql
stable
as $$
  select json_build_object(
    'session', (select row_to_json(s) from (
      select id, started_at, channel_slug as channel, landing_path,
             referrer, utm_source, utm_medium, device, user_agent
      from sessions where id = p_session
    ) s),
    'events', coalesce((
      select json_agg(row_to_json(e) order by e.time)
      from (
        select time, type, section, content_slug, dwell_ms, meta
        from events
        where session_id = p_session
        order by time
        limit 500
      ) e
    ), '[]'::json)
  );
$$;
