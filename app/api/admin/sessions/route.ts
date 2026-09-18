import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { parseRange } from "@/lib/admin/params";
import { getServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const cursorSchema = z.object({
  cursor_time: z.string().datetime({ offset: true }).optional(),
  cursor_id: z.string().uuid().optional(),
});

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const sb = getServiceClient();
  if (!sb) {
    return NextResponse.json({ error: "db_unconfigured" }, { status: 503 });
  }

  const search = new URL(req.url).searchParams;
  let range;
  try {
    range = parseRange(search);
  } catch {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }
  const cursor = cursorSchema.safeParse({
    cursor_time: search.get("cursor_time") ?? undefined,
    cursor_id: search.get("cursor_id") ?? undefined,
  });
  if (!cursor.success) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }

  const [list, summary] = await Promise.all([
    sb.rpc("analytics_sessions", {
      p_from: range.from,
      p_to: range.to,
      p_channel: range.channel,
      p_cursor_time: cursor.data.cursor_time ?? null,
      p_cursor_id: cursor.data.cursor_id ?? null,
      p_limit: 20,
    }),
    sb.rpc("analytics_sessions_summary", {
      p_from: range.from,
      p_to: range.to,
      p_channel: range.channel,
    }),
  ]);

  if (list.error) {
    console.error("[admin] sessions rpc failed:", list.error);
    return NextResponse.json(
      { error: "query_failed", detail: `sessions: ${list.error.message}` },
      { status: 500 },
    );
  }
  if (summary.error) {
    console.error("[admin] sessions summary rpc failed:", summary.error);
    return NextResponse.json(
      {
        error: "query_failed",
        detail: `sessions: ${summary.error.message}`,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ range, ...list.data, summary: summary.data });
}
