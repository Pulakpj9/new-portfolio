-- Phase C (chatbot intel + hardening): per-call token usage + overview RPC.

alter table bot_conversations
  add column if not exists input_tokens int,
  add column if not exists output_tokens int;

create index if not exists bot_conversations_session_idx
  on bot_conversations (session_id);

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
