-- DEV ONLY synthetic traffic. Run on a DEV project to make /admin reviewable.
-- DO NOT run on production: it fabricates sessions and pollutes real stats.
-- ~300 sessions across the last 30 days, weighted channels/devices,
-- per-section reach decay + plausible dwell ranges + 10% bounces.

begin;

create extension if not exists pgcrypto;
select setseed(0.42);

do $$
declare
  i int;
  sid uuid;
  started timestamptz;
  t timestamptz;
  r float;
  ch text;
  dev text;
  dwell_ms int;
  -- section, reach probability, dwell min/max seconds
  secs text[][] := array[
    ['hero',         '1.00', '4',  '18'],
    ['about',        '0.80', '8',  '40'],
    ['experience',   '0.70', '12', '80'],
    ['projects',     '0.62', '15', '160'],
    ['case-studies', '0.45', '12', '140'],
    ['contact',      '0.35', '4',  '25']
  ];
  s text[];
begin
  for i in 1..300 loop
    -- weighted channel: direct .40 / linkedin .30 / resume .20 / github .10
    r := random();
    ch := case
      when r < 0.40 then 'direct'
      when r < 0.70 then 'linkedin'
      when r < 0.90 then 'resume'
      else 'github' end;
    -- weighted device: desktop .65 / mobile .30 / tablet .05
    r := random();
    dev := case
      when r < 0.65 then 'desktop'
      when r < 0.95 then 'mobile'
      else 'tablet' end;

    started := now() - (random() * interval '30 days');
    t := started;

    insert into sessions (id, started_at, channel_slug, landing_path,
                          referrer, device, user_agent)
    values (gen_random_uuid(), started, ch, '/',
            case when ch = 'direct' then null
                 else 'https://www.' || ch || '.com/' end,
            dev, 'seed/1.0')
    returning id into sid;

    foreach s slice 1 in array secs loop
      if random() < s[2]::float then
        -- 10% bounce: 1–2.9s dwell
        if random() < 0.10 then
          dwell_ms := (1000 + random() * 1900)::int;
        else
          dwell_ms := ((s[3]::int + random() * (s[4]::int - s[3]::int)) * 1000)::int;
        end if;
        insert into events (time, session_id, type, section, meta)
        values (t, sid, 'section_enter', s[1], '{"seed": true}');
        insert into events (time, session_id, type, section, dwell_ms, meta)
        values (t + (dwell_ms || ' milliseconds')::interval,
                sid, 'section_exit', s[1], dwell_ms, '{"seed": true}');
        t := t + (dwell_ms || ' milliseconds')::interval
               + ((2 + random() * 8) || ' seconds')::interval;
      end if;
    end loop;

    update sessions set closed_at = t where id = sid;
  end loop;
end $$;

commit;
