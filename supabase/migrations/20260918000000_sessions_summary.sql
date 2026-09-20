-- Sessions page summary: range-wide aggregates (the list itself is paged,
-- so client-side math would undercount). Conversion = session containing
-- any cta_click / social_click / chat_open.

create or replace function analytics_sessions_summary(
  p_from timestamptz, p_to timestamptz, p_channel text default null
)
returns json
language sql
stable
as $$
  with s as (
    select id, started_at, device
    from sessions
    where started_at >= p_from
      and started_at < p_to
      and (nullif(p_channel, '') is null or channel_slug = p_channel)
  ),
  agg as (
    select s.id,
           count(e.id)::int as events,
           case when count(e.id) > 0 then
             extract(epoch from (max(e.time) - s.started_at)) * 1000
           end as len_ms,
           bool_or(e.type in ('cta_click', 'social_click', 'chat_open'))
             as converted
    from s
    left join events e on e.session_id = s.id
    group by s.id, s.started_at
  )
  select json_build_object(
    'sessions', (select count(*) from s),
    'avg_events', coalesce((select round(avg(events), 1) from agg), 0),
    'avg_duration_ms', coalesce(
      (select round(avg(len_ms)) from agg where len_ms is not null), 0),
    'median_duration_ms', coalesce(
      (select percentile_cont(0.5) within group (order by len_ms)
       from agg where len_ms is not null), 0),
    'conversion_rate', round(
      (select count(*) filter (where converted) from agg)::numeric
      / greatest((select count(*) from agg), 1)::numeric, 4),
    'devices', coalesce((
      select json_agg(row_to_json(d))
      from (
        select device, count(*) as sessions
        from s group by device order by sessions desc
      ) d
    ), '[]'::json)
  );
$$;
