-- Phase 2: admin analytics functions (called via supabase rpc from server routes
-- using the service-role key, which bypasses RLS).
-- On-demand exact aggregates: at portfolio scale these run in milliseconds.
-- If any ever passes ~500ms, cache at the route layer — not a pipeline.

-- Scope helper inlined per function: sessions in [p_from, p_to], optional channel.
-- p_channel NULL or '' = all channels.

-- ------------------------------------------------------- overview + trend --
create or replace function analytics_overview(
  p_from timestamptz, p_to timestamptz, p_channel text default null
)
returns json
language sql
stable
as $$
  with s as (
    select id, started_at
    from sessions
    where started_at >= p_from
      and started_at < p_to
      and (nullif(p_channel, '') is null or channel_slug = p_channel)
  ),
  spans as (
    select s.id,
           extract(epoch from (max(e.time) - s.started_at)) * 1000 as len_ms
    from s
    join events e on e.session_id = s.id
    group by s.id, s.started_at
  )
  select json_build_object(
    'sessions', (select count(*) from s),
    'total_events', (select count(*) from events e join s on s.id = e.session_id),
    'avg_session_ms', coalesce((select avg(len_ms) from spans), 0),
    'median_session_ms', coalesce(
      (select percentile_cont(0.5) within group (order by len_ms) from spans), 0),
    'channels', coalesce((
      select json_agg(row_to_json(c))
      from (
        select s2.channel_slug as slug, count(*) as sessions
        from sessions s2
        where s2.started_at >= p_from and s2.started_at < p_to
          and (nullif(p_channel, '') is null or s2.channel_slug = p_channel)
        group by s2.channel_slug
        order by sessions desc
      ) c
    ), '[]'::json),
    'top_sections', coalesce((
      select json_agg(row_to_json(t))
      from (
        select e.section, count(*) as views
        from events e
        join s on s.id = e.session_id
        where e.type = 'section_exit' and e.section is not null
        group by e.section
        order by views desc
        limit 6
      ) t
    ), '[]'::json)
  );
$$;

create or replace function analytics_trend(
  p_from timestamptz, p_to timestamptz, p_channel text default null
)
returns json
language sql
stable
as $$
  with days as (
    select generate_series(
      date_trunc('day', p_from), date_trunc('day', p_to), interval '1 day'
    )::date as day
  ),
  ds as (
    select count(*) as sessions,
           date_trunc('day', started_at)::date as day
    from sessions
    where started_at >= p_from
      and started_at < p_to
      and (nullif(p_channel, '') is null or channel_slug = p_channel)
    group by 2
  ),
  de as (
    select count(*) as events,
           date_trunc('day', e.time)::date as day
    from events e
    join sessions s on s.id = e.session_id
    where e.time >= p_from
      and e.time < p_to
      and (nullif(p_channel, '') is null or s.channel_slug = p_channel)
    group by 2
  )
  select coalesce(json_agg(row_to_json(t) order by t.day), '[]'::json)
  from (
    select d.day,
           coalesce(ds.sessions, 0) as sessions,
           coalesce(de.events, 0) as events
    from days d
    left join ds on ds.day = d.day
    left join de on de.day = d.day
  ) t;
$$;

-- ------------------------------------------------- sections deep dive ----
create or replace function analytics_sections(
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
  scoped as (
    select e.section, e.dwell_ms, e.session_id, s2.channel_slug
    from events e
    join s on s.id = e.session_id
    join sessions s2 on s2.id = e.session_id
    where e.type = 'section_exit' and e.section is not null
  ),
  total as (select count(*)::float as n from s)
  select json_build_object(
    'sessions', (select n::int from total),
    'overall', coalesce((
      select json_agg(row_to_json(o))
      from (
        select section,
               count(*) as views,
               count(distinct session_id) as sessions_reached,
               round(count(distinct session_id)::numeric
                 / greatest((select n from total), 1)::numeric, 4) as reach,
               coalesce(sum(dwell_ms), 0) as total_dwell_ms,
               round(avg(dwell_ms)) as avg_dwell_ms,
               percentile_cont(0.5) within group (order by dwell_ms)
                 as median_dwell_ms,
               percentile_cont(0.9) within group (order by dwell_ms)
                 as p90_dwell_ms,
               round((count(*) filter (where dwell_ms < 3000))::numeric
                 / greatest(count(*), 1), 4) as bounce_rate
        from scoped
        group by section
      ) o
    ), '[]'::json),
    'by_channel', coalesce((
      select json_agg(row_to_json(b))
      from (
        select section,
               channel_slug as channel,
               count(*) as views,
               round(avg(dwell_ms)) as avg_dwell_ms,
               percentile_cont(0.5) within group (order by dwell_ms)
                 as median_dwell_ms
        from scoped
        group by section, channel_slug
      ) b
    ), '[]'::json)
  );
$$;
