"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
} from "@/components/admin/ui";
import {
  daysToRange,
  formatMs,
  formatNum,
  formatPct,
} from "@/components/admin/format";
import { SECTIONS } from "@/lib/analytics/types";

interface SectionRow {
  section: string;
  views: number;
  sessions_reached: number;
  reach: number;
  total_dwell_ms: number;
  avg_dwell_ms: number;
  median_dwell_ms: number;
  p90_dwell_ms: number;
  bounce_rate: number;
}

interface ChannelRow {
  section: string;
  channel: string;
  views: number;
  avg_dwell_ms: number;
  median_dwell_ms: number;
}

interface SectionsData {
  sessions: number;
  overall: SectionRow[];
  by_channel: ChannelRow[];
}

const pretty = (s: string) => s.replace("-", " ");

export function SectionsClient() {
  const { days, channel } = useFilters();
  const [data, setData] = useState<SectionsData | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [detail, setDetail] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setDetail(null);
    try {
      const { from, to } = daysToRange(days);
      const qs = new URLSearchParams({ from, to });
      if (channel) qs.set("channel", channel);
      const res = await fetch(`/api/admin/sections?${qs.toString()}`);
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
  }, [days, channel]);

  useEffect(() => {
    void load();
  }, [load]);

  const ordered = useMemo(() => {
    if (!data) return [];
    const bySlug = new Map(data.overall.map((r) => [r.section, r]));
    return SECTIONS.map((s) => bySlug.get(s)).filter(
      (r): r is SectionRow => r !== undefined,
    );
  }, [data]);

  const channels = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.by_channel.map((r) => r.channel))].sort();
  }, [data]);

  const pivot = useMemo(() => {
    if (!data) return new Map<string, ChannelRow>();
    return new Map(data.by_channel.map((r) => [`${r.section}::${r.channel}`, r]));
  }, [data]);

  const maxMedian = Math.max(1, ...ordered.map((r) => Number(r.median_dwell_ms)));

  if (status === "loading") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Sections</h1>
          <FiltersBar />
        </div>
        <LoadingGrid rows={2} />
      </div>
    );
  }
  if (status === "error" || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Sections</h1>
          <FiltersBar />
        </div>
        <ErrorState onRetry={load} detail={detail} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Sections</h1>
          <p className="text-sm text-muted-foreground">
            {formatNum(data.sessions)} sessions · dwell counts only visible,
            active tab time (idle &gt; 60s excluded)
          </p>
        </div>
        <FiltersBar />
      </div>

      {ordered.length === 0 ? (
        <EmptyState
          title="No section data in this range"
          body="Browse the portfolio so sections enter and exit the viewport, wait a few seconds for the batch flush, then refresh this page."
        />
      ) : (
        <>
          <Panel
            title="Median dwell by section"
            subtitle="Median resists outliers (overnight tabs); p90 in the table shows the long tail"
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ordered.map((r) => ({
                    name: pretty(r.section),
                    median_s: Math.round(Number(r.median_dwell_ms) / 1000),
                  }))}
                  margin={{ top: 4, right: 4, bottom: 0, left: -8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                    interval={0}
                    angle={-12}
                    dy={8}
                    height={48}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                    label={{ value: "seconds", angle: -90, fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={CHART_STYLES.tooltip}
                    formatter={(v) => [`${v}s median`, "Dwell"]}
                  />
                  <Bar dataKey="median_s" radius={[6, 6, 0, 0]}>
                    {ordered.map((r, i) => (
                      <Cell
                        key={r.section}
                        fill={
                          Number(r.median_dwell_ms) >= maxMedian * 0.66
                            ? "hsl(var(--primary))"
                            : "hsl(var(--primary) / 0.45)"
                        }
                        fillOpacity={1 - i * 0.02}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Depth table" subtitle="Bounce = exit under 3s · reach = share of sessions that got here">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    {["Section", "Views", "Reach", "Total", "Avg", "Median", "P90", "Bounce"].map(
                      (h, i) => (
                        <th
                          key={h}
                          className={
                            i === 0
                              ? "py-2 pr-4 font-medium"
                              : "px-2 py-2 text-right font-medium"
                          }
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {ordered.map((r) => (
                    <tr key={r.section} className="border-b border-border/50 last:border-0">
                      <td className="py-2.5 pr-4 font-mono font-medium capitalize text-foreground">
                        {pretty(r.section)}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums">
                        {formatNum(r.views)}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums">
                        {formatPct(r.reach)}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums">
                        {formatMs(Number(r.total_dwell_ms))}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-muted-foreground">
                        {formatMs(Number(r.avg_dwell_ms))}
                      </td>
                      <td className="px-2 py-2.5 text-right font-semibold tabular-nums text-foreground">
                        {formatMs(Number(r.median_dwell_ms))}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-muted-foreground">
                        {formatMs(Number(r.p90_dwell_ms))}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums">
                        {formatPct(r.bounce_rate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {channels.length > 0 && (
            <Panel
              title="Channel split"
              subtitle="Median dwell per section per first-touch channel — do LinkedIn visitors read longer than resume visitors?"
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">Section</th>
                      {channels.map((c) => (
                        <th key={c} className="px-2 py-2 text-right font-medium">
                          <span className="font-mono normal-case">?ref={c}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SECTIONS.map((s) => {
                      const cells = channels.map(
                        (c) => pivot.get(`${s}::${c}`) ?? null,
                      );
                      if (cells.every((c) => c === null)) return null;
                      return (
                        <tr key={s} className="border-b border-border/50 last:border-0">
                          <td className="py-2.5 pr-4 font-mono font-medium capitalize text-foreground">
                            {pretty(s)}
                          </td>
                          {cells.map((c, i) => (
                            <td
                              key={channels[i]}
                              className="px-2 py-2.5 text-right tabular-nums"
                            >
                              {c ? (
                                <>
                                  <span className="font-semibold text-foreground">
                                    {formatMs(Number(c.median_dwell_ms))}
                                  </span>{" "}
                                  <span className="text-xs text-muted-foreground">
                                    · {formatNum(c.views)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-muted-foreground/50">—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
