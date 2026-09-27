import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";

/* Public bot config: active nudge rules + remote flags. No auth needed —
   rules contain no sensitive data. Cached 5 minutes at the edge. */

export const revalidate = 300;
export const runtime = "nodejs";

const DEFAULTS = { bot_enabled: true, proactive_enabled: true };

export async function GET() {
  const sb = getServiceClient();
  if (!sb) {
    return NextResponse.json({
      ...DEFAULTS,
      rules: [],
    });
  }
  try {
    const [settings, rules] = await Promise.all([
      sb.from("bot_settings").select("key, value"),
      sb
        .from("nudge_rules")
        .select("id, section, content_slug, threshold_ms, teaser, opener")
        .eq("is_active", true)
        .order("threshold_ms"),
    ]);
    if (settings.error) throw settings.error;
    if (rules.error) throw rules.error;

    const flags = { ...DEFAULTS };
    for (const row of settings.data ?? []) {
      if (row.key === "bot_enabled") flags.bot_enabled = row.value === true;
      if (row.key === "proactive_enabled") {
        flags.proactive_enabled = row.value === true;
      }
    }
    return NextResponse.json({ ...flags, rules: rules.data ?? [] });
  } catch (err) {
    console.error("[bot] config failed:", err);
    return NextResponse.json({ ...DEFAULTS, rules: [] });
  }
}
