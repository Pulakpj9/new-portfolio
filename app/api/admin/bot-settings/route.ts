import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { getServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SETTABLE = ["bot_enabled", "proactive_enabled"] as const;

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const sb = getServiceClient();
  if (!sb) {
    return NextResponse.json({ error: "db_unconfigured" }, { status: 503 });
  }
  const { data, error } = await sb.from("bot_settings").select("key, value");
  if (error) {
    console.error("[admin] bot settings failed:", error);
    return NextResponse.json(
      { error: "query_failed", detail: `bot: ${error.message}` },
      { status: 500 },
    );
  }
  const settings: Record<string, boolean> = {
    bot_enabled: true,
    proactive_enabled: true,
  };
  for (const row of data ?? []) {
    if ((SETTABLE as readonly string[]).includes(row.key)) {
      settings[row.key] = row.value === true;
    }
  }
  return NextResponse.json({ settings });
}

const patchSchema = z.object({
  key: z.enum(SETTABLE),
  value: z.boolean(),
});

export async function PATCH(req: Request) {
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
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  }
  const { error } = await sb
    .from("bot_settings")
    .upsert({ key: parsed.data.key, value: parsed.data.value });
  if (error) {
    console.error("[admin] bot settings update failed:", error);
    return NextResponse.json(
      { error: "query_failed", detail: `bot: ${error.message}` },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
