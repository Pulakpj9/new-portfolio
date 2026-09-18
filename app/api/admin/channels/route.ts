import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { parseRange } from "@/lib/admin/params";
import { getServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* Phase 2: read-only list (powers the channel filter).
   Phase 3: full CRUD (create here; update/delete in [slug]/route.ts). */

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const sb = getServiceClient();
  if (!sb) {
    return NextResponse.json({ error: "db_unconfigured" }, { status: 503 });
  }

  const { data, error } = await sb
    .from("channels")
    .select("slug, label, is_active")
    .order("slug");

  if (error) {
    console.error("[admin] channels list failed:", error);
    return NextResponse.json(
      { error: "query_failed", detail: `channels: ${error.message}` },
      { status: 500 },
    );
  }

  // With ?from&to, bundle per-channel engagement stats (Channels page).
  // Without, return the bare list (filter dropdown).
  const search = new URL(req.url).searchParams;
  if (!search.get("from") && !search.get("to")) {
    return NextResponse.json({ channels: data });
  }

  let range;
  try {
    range = parseRange(new URL(req.url).searchParams);
  } catch {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }
  const stats = await sb.rpc("analytics_channels", {
    p_from: range.from,
    p_to: range.to,
  });
  if (stats.error) {
    console.error("[admin] channel stats failed:", stats.error);
    return NextResponse.json(
      { error: "query_failed", detail: `channels: ${stats.error.message}` },
      { status: 500 },
    );
  }
  return NextResponse.json({ range, channels: data, stats: stats.data });
}

const createSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9-]{2,32}$/),
  label: z.string().trim().min(1).max(80),
});

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const sb = getServiceClient();
  if (!sb) {
    return NextResponse.json({ error: "db_unconfigured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  }

  const { error } = await sb.from("channels").insert({
    slug: parsed.data.slug.toLowerCase(),
    label: parsed.data.label,
    is_active: true,
  });
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "slug_exists" }, { status: 409 });
    }
    console.error("[admin] channel create failed:", error);
    return NextResponse.json(
      { error: "query_failed", detail: `channels: ${error.message}` },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
