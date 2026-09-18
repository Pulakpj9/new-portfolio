import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { parseRange } from "@/lib/admin/params";
import { getServiceClient } from "@/lib/supabase/server";

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

  const [summary, trend] = await Promise.all([
    sb.rpc("analytics_overview", {
      p_from: range.from,
      p_to: range.to,
      p_channel: range.channel,
    }),
    sb.rpc("analytics_trend", {
      p_from: range.from,
      p_to: range.to,
      p_channel: range.channel,
      p_gran: range.gran,
    }),
  ]);

  if (summary.error) {
    console.error("[admin] overview rpc failed:", summary.error);
    return NextResponse.json(
      { error: "query_failed", detail: `overview: ${summary.error.message}` },
      { status: 500 },
    );
  }
  if (trend.error) {
    console.error("[admin] trend rpc failed:", trend.error);
    return NextResponse.json(
      { error: "query_failed", detail: `trend: ${trend.error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    range,
    summary: summary.data,
    trend: trend.data,
  });
}
