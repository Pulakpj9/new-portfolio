import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { getServiceClient } from "@/lib/supabase/server";
import { KNOWN_SECTIONS } from "@/content/chat-kb";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const patchSchema = z
  .object({
    section: z.enum(KNOWN_SECTIONS as unknown as [string, ...string[]]).optional(),
    content_slug: z
      .string()
      .regex(/^[a-z0-9-]{1,80}$/)
      .nullable()
      .optional(),
    threshold_ms: z.number().int().min(5000).max(600000).optional(),
    teaser: z.string().trim().min(1).max(300).optional(),
    opener: z.string().trim().min(1).max(300).optional(),
    is_active: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "nothing to update" });

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  }

  const sb = getServiceClient();
  if (!sb) {
    return NextResponse.json({ error: "db_unconfigured" }, { status: 503 });
  }
  const { data, error } = await sb
    .from("nudge_rules")
    .update(parsed.data)
    .eq("id", id)
    .select("id");
  if (error) {
    console.error("[admin] nudge rule update failed:", error);
    return NextResponse.json(
      { error: "query_failed", detail: `bot: ${error.message}` },
      { status: 500 },
    );
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }

  const sb = getServiceClient();
  if (!sb) {
    return NextResponse.json({ error: "db_unconfigured" }, { status: 503 });
  }
  const { data, error } = await sb
    .from("nudge_rules")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) {
    console.error("[admin] nudge rule delete failed:", error);
    return NextResponse.json(
      { error: "query_failed", detail: `bot: ${error.message}` },
      { status: 500 },
    );
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
