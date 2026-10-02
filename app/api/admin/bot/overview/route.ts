import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { parseRange } from "@/lib/admin/params";
import { getServiceClient } from "@/lib/supabase/server";
import { estimateCostUsd } from "@/lib/chat/cost";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const sb = getServiceClient();
  if (!sb) {
    return NextResponse.json({ error: "db_unconfigured" }, { status: 503 });
  }

  let range;
  try {
    range = parseRange(new URL(req.url).searchParams);
  } catch {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }

  const [overview, monthRows, settings] = await Promise.all([
    sb.rpc("analytics_bot_overview", { p_from: range.from, p_to: range.to }),
    sb.from("bot_conversations").select("input_tokens, output_tokens").gte(
      "time",
      (() => {
        const d = new Date();
        d.setUTCDate(1);
        d.setUTCHours(0, 0, 0, 0);
        return d.toISOString();
      })(),
    ).limit(10000),
    sb.from("bot_settings").select("key, value"),
  ]);

  if (overview.error) {
    console.error("[admin] bot overview rpc failed:", overview.error);
    return NextResponse.json(
      { error: "query_failed", detail: `bot: ${overview.error.message}` },
      { status: 500 },
    );
  }
  if (monthRows.error) {
    console.error("[admin] bot month usage failed:", monthRows.error);
    return NextResponse.json(
      { error: "query_failed", detail: `bot: ${monthRows.error.message}` },
      { status: 500 },
    );
  }

  const monthTokens = (monthRows.data ?? []).reduce(
    (acc, r) => ({
      in: acc.in + (r.input_tokens ?? 0),
      out: acc.out + (r.output_tokens ?? 0),
    }),
    { in: 0, out: 0 },
  );
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const { count: todayChats } = await sb
    .from("bot_conversations")
    .select("id", { count: "exact", head: true })
    .gte("time", todayStart.toISOString());
  const capRaw = Number(process.env.CHAT_MONTHLY_CAP_USD);
  const cap = Number.isFinite(capRaw) && capRaw > 0 ? capRaw : null;
  const spent = estimateCostUsd(monthTokens.in, monthTokens.out);

  const flags: Record<string, boolean> = {
    bot_enabled: true,
    proactive_enabled: true,
  };
  for (const row of settings.data ?? []) {
    if (row.key in flags) flags[row.key] = row.value === true;
  }

  return NextResponse.json({
    range,
    overview: overview.data,
    today: { chats: todayChats ?? 0 },
    month: {
      tokens_in: monthTokens.in,
      tokens_out: monthTokens.out,
      spent_usd: spent,
      cap_usd: cap,
      capped: cap !== null && spent >= cap,
    },
    settings: flags,
  });
}
