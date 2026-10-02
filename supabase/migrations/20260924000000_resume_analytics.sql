-- Resume download analytics: overall total, distinct sessions, daily trend,
-- and per-channel split. Same on-demand doctrine — no pipelines.

create or replace function analytics_resumes(
  p_from timestamptz, p_to timestamptz, p_channel text default null
)
returns json
language sql
stable
as $$
  with scoped as (
    select e.session_id, e.time, s.channel_slug
    from events e
    join sessions s on s.id = e.session_id
    where e.type = 'resume_download'
      and e.time >= p_from
      and e.time < p_to
      and (nullif(p_channel, '') is null or s.channel_slug = p_channel)
  )
  select json_build_object(
    'total', (select count(*) from scoped),
    'sessions', (select count(distinct session_id) from scoped),
    'trend', coalesce((
      select json_agg(row_to_json(t) order by t.day)
      from (
        select date_trunc('day', time)::date as day, count(*) as downloads
        from scoped
        group by 1
      ) t
    ), '[]'::json),
    'by_channel', coalesce((
      select json_agg(row_to_json(c))
      from (
        select channel_slug as channel, count(*) as downloads,
               count(distinct session_id) as sessions
        from scoped
        group by channel_slug
        order by downloads desc
      ) c
    ), '[]'::json)
  );
$$;
