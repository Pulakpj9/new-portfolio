-- Phase 2 follow-up: bucketed trend (day | week | month).
-- DROP + CREATE (not overload): PostgREST rpc() cannot resolve overloaded
-- function names, so the old (timestamptz, timestamptz, text) signature must go.

drop function if exists analytics_trend(timestamptz, timestamptz, text);

create function analytics_trend(
  p_from timestamptz, p_to timestamptz,
  p_channel text default null,
  p_gran text default 'day'
)
returns json
language sql
stable
as $$
  with cfg as (
    select
      case p_gran when 'month' then 'month' when 'week' then 'week' else 'day' end as unit,
      case p_gran when 'month' then interval '1 month'
                 when 'week' then interval '1 week'
                 else interval '1 day' end as step
  ),
  buckets as (
    select generate_series(
      date_trunc((select unit from cfg), p_from),
      date_trunc((select unit from cfg), p_to),
      (select step from cfg)
    )::date as day
  ),
  ds as (
    select count(*) as sessions,
           date_trunc((select unit from cfg), started_at)::date as day
    from sessions
    where started_at >= p_from
      and started_at < p_to
      and (nullif(p_channel, '') is null or channel_slug = p_channel)
    group by 2
  ),
  de as (
    select count(*) as events,
           date_trunc((select unit from cfg), e.time)::date as day
    from events e
    join sessions s on s.id = e.session_id
    where e.time >= p_from
      and e.time < p_to
      and (nullif(p_channel, '') is null or s.channel_slug = p_channel)
    group by 2
  )
  select coalesce(json_agg(row_to_json(t) order by t.day), '[]'::json)
  from (
    select b.day,
           coalesce(ds.sessions, 0) as sessions,
           coalesce(de.events, 0) as events
    from buckets b
    left join ds on ds.day = b.day
    left join de on de.day = b.day
  ) t;
$$;
