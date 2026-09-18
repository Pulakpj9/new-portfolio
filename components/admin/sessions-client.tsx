"use client";

import { useCallback, useEffect, useState } from "react";
import { FiltersBar, useFilters } from "@/components/admin/filters-bar";
import {
  EmptyState,
  ErrorState,
  LoadingGrid,
  Panel,
  StatCard,
} from "@/components/admin/ui";
import {
  daysToRange,
  formatMs,
  formatNum,
  formatPct,
} from "@/components/admin/format";
import { cn } from "@/lib/utils";

interface SessionRow {
  id: string;
  started_at: string;
  channel: string;
  device: string;
  events: number;
  duration_ms: number | null;
  sections: string[];
}

interface SessionEvent {
  time: string;
  type: string;
  section: string | null;
  content_slug: string | null;
  dwell_ms: number | null;
  meta: Record<string, unknown>;
}

interface SessionSummary {
  sessions: number;
  avg_events: number;
  avg_duration_ms: number;
  median_duration_ms: number;
  conversion_rate: number;
  devices: { device: string; sessions: number }[];
}

interface SessionDetail {
  session: {
    id: string;
    started_at: string;
    channel: string;
    landing_path: string;
    referrer: string | null;
    utm_source: string | null;
    device: string;
  } | null;
  events: SessionEvent[];
}

function eventLabel(e: SessionEvent): string {
  switch (e.type) {
    case "section_enter":
      return `→ ${e.section?.replace("-", " ") ?? "?"}`;
    case "section_exit":
      return `← ${e.section?.replace("-", " ") ?? "?"} · ${formatMs(e.dwell_ms)}`;
    case "heartbeat":
      return `… ${e.section?.replace("-", " ") ?? "?"} · ${formatMs(e.dwell_ms)} so far`;
    case "content_view":
      return `👁 ${e.content_slug ?? "?"}`;
    case "cta_click": {
      const target = (e.meta?.target as string) ?? "cta";
      return `🖱 ${target}${e.content_slug ? ` · ${e.content_slug}` : ""}`;
    }
    case "social_click":
      return `🔗 ${(e.meta?.network as string) ?? "social"}`;
    case "chat_open":
      return "🤖 chat opened";
    case "video_play":
      return `▶ ${e.content_slug ?? "video"}`;
    default:
      return e.type;
  }
}

function eventTime(t: string): string {
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return t;
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function SessionsClient() {
  const { days, channel } = useFilters();
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [cursor, setCursor] = useState<{ time: string; id: string } | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [detail, setDetail] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<SessionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchPage = useCallback(
    async (cur: { time: string; id: string } | null) => {
      const { from, to } = daysToRange(days);
      const qs = new URLSearchParams({ from, to });
      if (channel) qs.set("channel", channel);
      if (cur) {
        qs.set("cursor_time", cur.time);
        qs.set("cursor_id", cur.id);
      }
      const res = await fetch(`/api/admin/sessions?${qs.toString()}`);
      if (!res.ok) {
        let d: string | null = null;
        try {
          const body = await res.json();
          d = typeof body.detail === "string" ? body.detail : null;
        } catch {
          /* ignore */
        }
        throw new Error(d ?? "bad status");
      }
      return (await res.json()) as {
        rows: SessionRow[];
        next_cursor: { time: string; id: string } | null;
        summary: SessionSummary;
      };
    },
    [days, channel],
  );

  const load = useCallback(async () => {
    setStatus("loading");
    setDetail(null);
    setOpenId(null);
    setDetailData(null);
    try {
      const page = await fetchPage(null);
      setRows(page.rows);
      setSummary(page.summary);
      setCursor(page.next_cursor);
      setStatus("ready");
    } catch (e) {
      setDetail(e instanceof Error ? e.message : null);
      setStatus("error");
    }
  }, [fetchPage]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchPage(cursor);
      setRows((r) => [...r, ...page.rows]);
      setCursor(page.next_cursor);
    } catch {
      /* keep existing rows; cursor stays for retry */
    } finally {
      setLoadingMore(false);
    }
  };

  const openSession = async (id: string) => {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    setDetailData(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/sessions/${id}`);
      if (res.ok) setDetailData(await res.json());
    } catch {
      /* show empty */
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Sessions</h1>
          <p className="text-sm text-muted-foreground">
            Anonymous tab sessions, newest first. IPs are never stored — there
            is nothing personal to see here by design.
          </p>
        </div>
        <FiltersBar />
      </div>

      {status === "loading" && <LoadingGrid rows={2} />}
      {status === "error" && <ErrorState onRetry={load} detail={detail} />}
      {status === "ready" && rows.length === 0 && (
        <EmptyState
          title="No sessions in this range"
          body="Browse the portfolio, wait a few seconds for the batch flush, then refresh this page."
        />
      )}
      {status === "ready" && rows.length > 0 && (
        <>
          {summary && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Sessions"
                value={formatNum(summary.sessions)}
              />
              <StatCard
                label="Median duration"
                value={formatMs(Number(summary.median_duration_ms))}
                hint={`Mean ${formatMs(Number(summary.avg_duration_ms))}`}
              />
              <StatCard
                label="Avg events / session"
                value={Number(summary.avg_events).toFixed(1)}
              />
              <StatCard
                label="Converted"
                value={formatPct(Number(summary.conversion_rate))}
                hint="sessions with email, social, or chat"
              />
            </div>
          )}
          {summary && summary.devices.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Devices:</span>
              {summary.devices.map((d) => (
                <span
                  key={d.device}
                  className="rounded-full border border-border bg-card px-3 py-1 font-mono text-[11px] text-foreground"
                >
                  {d.device} · {formatNum(d.sessions)}
                </span>
              ))}
            </div>
          )}
          <Panel title={`${formatNum(rows.length)} sessions shown`} subtitle="Select a row for its full event timeline">
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="overflow-hidden rounded-2xl border border-border">
                <button
                  onClick={() => void openSession(r.id)}
                  className={cn(
                    "flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50",
                    openId === r.id && "bg-muted/50",
                  )}
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {new Date(r.started_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-foreground">
                    ?ref={r.channel}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-foreground">
                    {r.device}
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {r.duration_ms != null ? formatMs(r.duration_ms) : "—"} ·{" "}
                    {r.events} events
                  </span>
                  <span className="flex flex-wrap gap-1">
                    {r.sections.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                      >
                        {s.replace("-", " ")}
                      </span>
                    ))}
                  </span>
                </button>
                {openId === r.id && (
                  <div className="border-t border-border bg-background/50 px-4 py-3">
                    {detailLoading && (
                      <p className="font-mono text-xs text-muted-foreground">
                        Loading timeline…
                      </p>
                    )}
                    {!detailLoading && detailData && (
                      <div className="space-y-1.5">
                        <p className="break-all font-mono text-[11px] text-muted-foreground">
                          {detailData.session?.landing_path ?? "/"}
                          {detailData.session?.referrer
                            ? ` ← ${detailData.session.referrer}`
                            : ""}
                        </p>
                        {detailData.events.map((e, i) => (
                          <div
                            key={i}
                            className="flex items-baseline gap-3 font-mono text-xs"
                          >
                            <span className="shrink-0 tabular-nums text-muted-foreground">
                              {eventTime(e.time)}
                            </span>
                            <span className="text-foreground">
                              {eventLabel(e)}
                            </span>
                          </div>
                        ))}
                        {detailData.events.length === 0 && (
                          <p className="font-mono text-xs text-muted-foreground">
                            No events recorded.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          {cursor && (
            <button
              onClick={() => void loadMore()}
              disabled={loadingMore}
              className="mt-4 w-full rounded-2xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          )}
        </Panel>
        </>
      )}
    </div>
  );
}
