-- Chat latency, both directions.
-- Bot generation time: server-measured per exchange (pairs with intent/tools).
-- User reply time: client-measured chat_user_reply events (dwell_ms, capped
-- at 5 min client-side); aggregated here for the Usage tab.

alter table bot_conversations
  add column if not exists latency_ms int
    check (latency_ms is null or latency_ms >= 0);

create or replace function analytics_bot_overview(
  p_from timestamptz, p_to timestamptz
)
returns json
language sql
stable
as $$
  select json_build_object(
    'chats', (select count(*) from bot_conversations
              where time >= p_from and time < p_to),
    'tokens_in', (select coalesce(sum(input_tokens), 0) from bot_conversations
                  where time >= p_from and time < p_to),
    'tokens_out', (select coalesce(sum(output_tokens), 0) from bot_conversations
                   where time >= p_from and time < p_to),
    'avg_latency_ms', (select coalesce(round(avg(latency_ms)), 0)
                       from bot_conversations
                       where time >= p_from and time < p_to
                         and latency_ms is not null),
    'median_latency_ms', (select coalesce(
      percentile_cont(0.5) within group (order by latency_ms), 0)
      from bot_conversations
      where time >= p_from and time < p_to and latency_ms is not null),
    'avg_user_reply_ms', (select coalesce(round(avg(dwell_ms)), 0)
                          from events
                          where type = 'chat_user_reply'
                            and time >= p_from and time < p_to),
    'median_user_reply_ms', (select coalesce(
      percentile_cont(0.5) within group (order by dwell_ms), 0)
      from events
      where type = 'chat_user_reply'
        and time >= p_from and time < p_to),
    'by_intent', coalesce((
      select json_agg(row_to_json(t))
      from (
        select coalesce(intent, 'other') as intent, count(*) as chats
        from bot_conversations
        where time >= p_from and time < p_to
        group by coalesce(intent, 'other')
        order by chats desc
      ) t
    ), '[]'::json),
    'recent', coalesce((
      select json_agg(row_to_json(r) order by r.time desc)
      from (
        select time, question, intent, tools_used as tools, low_confidence
        from bot_conversations
        where time >= p_from and time < p_to
        order by time desc
        limit 50
      ) r
    ), '[]'::json)
  );
$$;
