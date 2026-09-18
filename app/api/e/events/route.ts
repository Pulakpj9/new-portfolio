import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { ingestSchema } from "./schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* Public ingest: validate → upsert session (first touch wins) → insert events.
   Always 202 on success. No queues: direct inserts are plenty at this scale. */

interface ChannelCache {
  at: number;
  slugs: Set<string>;
}

let channelCache: ChannelCache | null = null;
const CHANNEL_TTL_MS = 60_000;

async function getActiveChannels(): Promise<Set<string>> {
  const now = Date.now();
  if (channelCache && now - channelCache.at < CHANNEL_TTL_MS) {
    return channelCache.slugs;
  }
  const slugs = new Set<string>(["direct"]);
  try {
    const sb = getServiceClient();
    if (sb) {
      const { data } = await sb
        .from("channels")
        .select("slug")
        .eq("is_active", true);
      for (const row of data ?? []) slugs.add(row.slug);
    }
  } catch {
    /* DB unreachable: fall back to {direct}; payload still validates. */
  }
  channelCache = { at: now, slugs };
  return slugs;
}

export async function POST(req: Request) {
  // Preview/localhost isolation: when ANALYTICS_ALLOWED_HOSTS is set
  // (comma-separated, e.g. "example.com,www.example.com"), events from
  // other hosts are acknowledged but dropped. Unset = accept all (dev).
  const allowlist = (process.env.ANALYTICS_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  if (allowlist.length > 0) {
    const ref = req.headers.get("origin") ?? req.headers.get("referer") ?? "";
    let host = "";
    try {
      host = new URL(ref).host.toLowerCase();
    } catch {
      host = "";
    }
    if (!allowlist.includes(host)) {
      return NextResponse.json({ received: 0, dropped: true }, { status: 202 });
    }
  }

  const sb = getServiceClient();
  if (!sb) {
    // Backend not configured: SDK swallows this; site unaffected.
    return NextResponse.json(
      { error: "analytics_unconfigured" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = ingestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { session, session_id, events } = parsed.data;
  const activeChannels = await getActiveChannels();

  try {
    if (session) {
      const channel = activeChannels.has(session.channel)
        ? session.channel
        : "direct";
      // First touch wins: ignoreDuplicates keeps the original attribution.
      const { error } = await sb.from("sessions").upsert(
        {
          id: session.id,
          channel_slug: channel,
          landing_path: session.landing_path,
          referrer: session.referrer ?? null,
          utm_source: session.utm_source ?? null,
          utm_medium: session.utm_medium ?? null,
          device: session.device,
          user_agent: session.user_agent ?? null,
        },
        { onConflict: "id", ignoreDuplicates: true },
      );
      if (error) throw error;
    }

    const rows = events.map((e) => ({
      session_id,
      type: e.type,
      section: e.section ?? null,
      content_slug: e.content_slug ?? null,
      dwell_ms: e.dwell_ms ?? null,
      meta: e.meta ?? {},
    }));

    const { error } = await sb.from("events").insert(rows);
    if (error) throw error;

    return NextResponse.json({ received: rows.length }, { status: 202 });
  } catch (err) {
    console.error("[analytics] ingest failed:", err);
    return NextResponse.json({ error: "ingest_failed" }, { status: 500 });
  }
}
