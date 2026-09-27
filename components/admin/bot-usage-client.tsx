"use client";

import { useCallback, useEffect, useState } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingGrid,
  Panel,
  StatCard,
} from "@/components/admin/ui";
import { formatMs, formatNum, formatUsd } from "@/components/admin/format";
import { estimateCostUsd } from "@/lib/chat/cost";
import { cn } from "@/lib/utils";

interface UsageData {
  chats: number;
  tokens_in: number;
  tokens_out: number;
  avg_latency_ms: number;
  median_latency_ms: number;
  avg_user_reply_ms: number;
  median_user_reply_ms: number;
  month: {
    tokens_in: number;
    tokens_out: number;
    spent_usd: number;
    cap_usd: number | null;
    capped: boolean;
  };
  settings: Record<string, boolean>;
}

const SETTING_LABELS: Record<string, { title: string; body: string }> = {
  bot_enabled: {
    title: "Chat replies",
    body: "Off = /api/chat returns 503 and the widget shows its offline note.",
  },
  proactive_enabled: {
    title: "Proactive teasers",
    body: "Off = dwell engine never fires; chat still answers when opened.",
  },
};

export function BotUsageClient() {
  const [data, setData] = useState<UsageData | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [detail, setDetail] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setDetail(null);
    try {
      const res = await fetch("/api/admin/bot/overview");
      if (!res.ok) {
        let d: string | null = null;
        try {
          const body = await res.json();
          d = typeof body.detail === "string" ? body.detail : null;
        } catch {
          /* ignore */
        }
        setDetail(d);
        throw new Error("bad status");
      }
      const body = await res.json();
      setData({
        chats: body.overview?.chats ?? 0,
        tokens_in: body.overview?.tokens_in ?? 0,
        tokens_out: body.overview?.tokens_out ?? 0,
        avg_latency_ms: Number(body.overview?.avg_latency_ms ?? 0),
        median_latency_ms: Number(body.overview?.median_latency_ms ?? 0),
        avg_user_reply_ms: Number(body.overview?.avg_user_reply_ms ?? 0),
        median_user_reply_ms: Number(body.overview?.median_user_reply_ms ?? 0),
        month: body.month,
        settings: body.settings ?? {},
      });
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (key: string, value: boolean) => {
    try {
      const res = await fetch("/api/admin/bot-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) {
        setNotice(`Toggle failed (${res.status}).`);
      } else {
        setNotice(`"${key}" ${value ? "enabled" : "disabled"}.`);
        await load();
      }
    } catch {
      setNotice("Network error. Try again.");
    }
    window.setTimeout(() => setNotice(null), 4000);
  };

  const est = data
    ? estimateCostUsd(data.tokens_in, data.tokens_out)
    : 0;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Cost is estimated from logged tokens at documented speed-tier rates —
        verify provider pricing periodically.
      </p>

      {notice && (
        <p role="status" className="rounded-2xl border border-border bg-card px-4 py-3 font-mono text-xs text-foreground">
          {notice}
        </p>
      )}

      {status === "loading" && <LoadingGrid rows={2} />}
      {status === "error" && <ErrorState onRetry={load} detail={detail} />}
      {status === "ready" && !data && (
        <EmptyState title="No usage data" body="Chat activity will appear here." />
      )}
      {status === "ready" && data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Chats (30d)" value={formatNum(data.chats)} />
            <StatCard label="Tokens in/out" value={`${formatNum(data.tokens_in)} / ${formatNum(data.tokens_out)}`} />
            <StatCard label="Est. cost (30d)" value={formatUsd(est)} hint="at $0.30 / $2.50 per 1M tokens" />
            <StatCard
              label="Month spend"
              value={formatUsd(data.month.spent_usd)}
              hint={data.month.cap_usd !== null ? `cap $${data.month.cap_usd}` : "no cap set (CHAT_MONTHLY_CAP_USD)"}
            />
            <StatCard
              label="Median bot reply"
              value={formatMs(data.median_latency_ms)}
              hint={`Mean ${formatMs(data.avg_latency_ms)} · successful generations`}
            />
            <StatCard
              label="Median user reply"
              value={formatMs(data.median_user_reply_ms)}
              hint={`Mean ${formatMs(data.avg_user_reply_ms)} · capped at 5m`}
            />
          </div>

          {data.month.cap_usd !== null && (
            <Panel title="Monthly budget" subtitle={data.month.capped ? "Cap reached — chat serves capped replies" : "Spending within cap"}>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    data.month.capped ? "bg-red-500" : "bg-primary",
                  )}
                  style={{
                    width: `${Math.min(100, (data.month.spent_usd / data.month.cap_usd) * 100)}%`,
                  }}
                />
              </div>
            </Panel>
          )}

          <Panel title="Kill switches" subtitle="Remote control, no deploy. Chat route caches flags for 60s.">
            <div className="space-y-3">
              {Object.entries(SETTING_LABELS).map(([key, meta]) => {
                const on = data.settings[key] !== false;
                return (
                  <div key={key} className="flex items-center justify-between gap-4 rounded-2xl border border-border px-4 py-3">
                    <div>
                      <p className="font-mono text-sm font-semibold text-foreground">{meta.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{meta.body}</p>
                    </div>
                    <button
                      onClick={() => void toggle(key, !on)}
                      className={cn(
                        "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                        on
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {on ? "On" : "Off"}
                    </button>
                  </div>
                );
              })}
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
