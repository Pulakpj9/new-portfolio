import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { getServiceClient } from "@/lib/supabase/server";
import { KNOWN_SECTIONS } from "@/content/chat-kb";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ruleSchema = z.object({
  section: z.enum(KNOWN_SECTIONS as unknown as [string, ...string[]]),
  content_slug: z
    .string()
    .regex(/^[a-z0-9-]{1,80}$/)
    .nullable()
    .optional(),
  threshold_ms: z.number().int().min(5000).max(600000),
  teaser: z.string().trim().min(1).max(300),
  opener: z.string().trim().min(1).max(300),
});

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const sb = getServiceClient();
  if (!sb) {
    return NextResponse.json({ error: "db_unconfigured" }, { status: 503 });
  }
  const { data, error } = await sb
    .from("nudge_rules")
    .select("id, section, content_slug, threshold_ms, teaser, opener, is_active")
    .order("threshold_ms");
  if (error) {
    console.error("[admin] nudge rules list failed:", error);
    return NextResponse.json(
      { error: "query_failed", detail: `bot: ${error.message}` },
      { status: 500 },
    );
  }
  return NextResponse.json({ rules: data });
}

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
  const parsed = ruleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  }
  const { data, error } = await sb
    .from("nudge_rules")
    .insert({ ...parsed.data, content_slug: parsed.data.content_slug ?? null })
    .select("id")
    .single();
  if (error) {
    console.error("[admin] nudge rule create failed:", error);
    return NextResponse.json(
      { error: "query_failed", detail: `bot: ${error.message}` },
      { status: 500 },
    );
  }
  return NextResponse.json({ id: data.id }, { status: 201 });
}
