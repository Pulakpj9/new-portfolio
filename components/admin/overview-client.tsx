"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FiltersBar, useFilters } from "@/components/admin/filters-bar";
import {
  CHART_STYLES,
  EmptyState,
  ErrorState,
  LoadingGrid,
  Panel,
  StatCard,
} from "@/components/admin/ui";
import {
  daysToRange,
  formatDay,
  formatMs,
  formatNum,
} from "@/components/admin/format";

interface OverviewData {
  summary: {
    sessions: number;
    total_events: number;
    avg_session_ms: number;
    median_session_ms: number;
    channels: { slug: string; sessions: number }[];
    top_sections: { section: string; views: number }[];
  };
  trend: { day: string; sessions: number; events: number }[];
}

export function OverviewClient() {
  const { days, channel, gran } = useFilters();
  const [data, setData] = useState<OverviewData | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [detail, setDetail] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setDetail(null);
    try {
      const { from, to } = daysToRange(days);
      const qs = new URLSearchParams({ from, to, gran });
      if (channel) qs.set("channel", channel);
      const res = await fetch(`/api/admin/overview?${qs.toString()}`);
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
      setData(await res.json());
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [days, channel, gran]);

  useEffect(() => {
    void load();
  }, [load]);

  if (status === "loading") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Overview</h1>
          <FiltersBar showGranularity />
        </div>
        <LoadingGrid />
      </div>
    );
  }
  if (status === "error" || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Overview</h1>
          <FiltersBar showGranularity />
        </div>
        <ErrorState onRetry={load} detail={detail} />
      </div>
    );
  }

  const { summary, trend } = data;
  const maxViews = Math.max(1, ...summary.top_sections.map((s) => s.views));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Overview</h1>
        <FiltersBar showGranularity />
      </div>

      {summary.sessions === 0 ? (
        <EmptyState
          title="No sessions in this range"
          body="Browse the portfolio (try ?ref=linkedin to test channel attribution), wait a few seconds for the batch flush, then refresh this page."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Sessions" value={formatNum(summary.sessions)} />
            <StatCard
              label="Median session"
              value={formatMs(summary.median_session_ms)}
              hint={`Mean ${formatMs(summary.avg_session_ms)}`}
            />
            <StatCard label="Events" value={formatNum(summary.total_events)} />
            <StatCard
              label="Top channel"
              value={summary.channels[0]?.slug ?? "—"}
              hint={
                summary.channels[0]
                  ? `${formatNum(summary.channels[0].sessions)} sessions`
                  : undefined
              }
            />
          </div>

          <Panel
            title="Traffic"
            subtitle={`Sessions and events per ${gran === "day" ? "day" : gran === "week" ? "week" : "month"} in the selected range`}
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="day"
                    tickFormatter={formatDay}
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                    minTickGap={28}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={CHART_STYLES.tooltip}
                    labelFormatter={formatDay}
                  />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    name="Sessions"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="events"
                    name="Events"
                    stroke="hsl(var(--muted-foreground))"
                    fill="hsl(var(--muted-foreground))"
                    fillOpacity={0.12}
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Top sections" subtitle="Section exits (completed views)">
              <div className="space-y-3">
                {summary.top_sections.map((s) => (
                  <div key={s.section}>
                    <div className="mb-1 flex items-baseline justify-between text-xs">
                      <span className="font-mono font-medium capitalize text-foreground">
                        {s.section.replace("-", " ")}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatNum(s.views)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(s.views / maxViews) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Channels" subtitle="Sessions by first-touch channel">
              <div className="space-y-3">
                {summary.channels.map((c) => (
                  <div
                    key={c.slug}
                    className="flex items-center justify-between rounded-2xl border border-border px-4 py-3"
                  >
                    <div>
                      <p className="font-mono text-sm font-medium text-foreground">
                        ?ref={c.slug}
                      </p>
                      <a
                        href={`/?ref=${c.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Open share link
                      </a>
                    </div>
                    <p className="text-lg font-bold tabular-nums text-foreground">
                      {formatNum(c.sessions)}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
