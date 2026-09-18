import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { getServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const patchSchema = z
  .object({
    label: z.string().trim().min(1).max(80).optional(),
    is_active: z.boolean().optional(),
  })
  .refine((v) => v.label !== undefined || v.is_active !== undefined, {
    message: "nothing to update",
  });

function slugOf(params: { slug?: string }): string | null {
  const slug = params.slug ?? "";
  return /^[a-z0-9-]{2,32}$/.test(slug) ? slug : null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const slug = slugOf(await params);
  if (!slug) return NextResponse.json({ error: "invalid_slug" }, { status: 400 });

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
  if (slug === "direct" && parsed.data.is_active === false) {
    return NextResponse.json({ error: "direct_locked" }, { status: 400 });
  }

  const sb = getServiceClient();
  if (!sb) {
    return NextResponse.json({ error: "db_unconfigured" }, { status: 503 });
  }
  const { data, error } = await sb
    .from("channels")
    .update(parsed.data)
    .eq("slug", slug)
    .select("slug");
  if (error) {
    console.error("[admin] channel update failed:", error);
    return NextResponse.json(
      { error: "query_failed", detail: `channels: ${error.message}` },
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
  { params }: { params: Promise<{ slug: string }> },
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const slug = slugOf(await params);
  if (!slug) return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
  if (slug === "direct") {
    return NextResponse.json({ error: "direct_locked" }, { status: 400 });
  }

  const sb = getServiceClient();
  if (!sb) {
    return NextResponse.json({ error: "db_unconfigured" }, { status: 503 });
  }
  // Attribution history is honest only if kept: refuse while sessions exist.
  // Deactivate instead — the toggle is the reversible path.
  const { count, error: countError } = await sb
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("channel_slug", slug);
  if (countError) {
    console.error("[admin] channel delete check failed:", countError);
    return NextResponse.json(
      { error: "query_failed", detail: `channels: ${countError.message}` },
      { status: 500 },
    );
  }
  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "has_sessions", sessions: count },
      { status: 409 },
    );
  }

  const { data, error } = await sb
    .from("channels")
    .delete()
    .eq("slug", slug)
    .select("slug");
  if (error) {
    console.error("[admin] channel delete failed:", error);
    return NextResponse.json(
      { error: "query_failed", detail: `channels: ${error.message}` },
      { status: 500 },
    );
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
