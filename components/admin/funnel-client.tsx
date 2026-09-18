"use client";

import { useCallback, useEffect, useState } from "react";
import { FiltersBar, useFilters } from "@/components/admin/filters-bar";
import {
  EmptyState,
  ErrorState,
  LoadingGrid,
  Panel,
} from "@/components/admin/ui";
import { daysToRange, formatNum, formatPct } from "@/components/admin/format";
import { SECTIONS } from "@/lib/analytics/types";

interface FunnelStep {
  section: string;
  sessions: number;
  reach: number;
}

export function FunnelClient() {
  const { days, channel } = useFilters();
  const [sessions, setSessions] = useState(0);
  const [steps, setSteps] = useState<FunnelStep[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [detail, setDetail] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setDetail(null);
    try {
      const { from, to } = daysToRange(days);
      const qs = new URLSearchParams({ from, to });
      if (channel) qs.set("channel", channel);
      const res = await fetch(`/api/admin/funnel?${qs.toString()}`);
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
      const bySlug = new Map<string, FunnelStep>(
        (body.steps ?? []).map((s: FunnelStep) => [s.section, s]),
      );
      setSessions(body.sessions ?? 0);
      setSteps(
        SECTIONS.map(
          (s) => bySlug.get(s) ?? { section: s, sessions: 0, reach: 0 },
        ),
      );
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [days, channel]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Funnel</h1>
          <p className="text-sm text-muted-foreground">
            Share of sessions reaching each section, in page order — where does
            the scroll die?
          </p>
        </div>
        <FiltersBar />
      </div>

      {status === "loading" && <LoadingGrid rows={2} />}
      {status === "error" && <ErrorState onRetry={load} detail={detail} />}
      {status === "ready" && sessions === 0 && (
        <EmptyState
          title="No sessions in this range"
          body="Browse the portfolio, wait a few seconds for the batch flush, then refresh this page."
        />
      )}
      {status === "ready" && sessions > 0 && (
        <Panel
          title={`${formatNum(sessions)} sessions in range`}
          subtitle="Reach = sessions with a completed section view ÷ all sessions"
        >
          <div className="space-y-4">
            {steps.map((s, i) => {
              const prev = i === 0 ? 1 : steps[i - 1].reach;
              const dropoff = i === 0 ? null : prev - s.reach;
              return (
                <div key={s.section}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-mono font-medium capitalize text-foreground">
                      <span className="mr-2 text-xs text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {s.section.replace("-", " ")}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {formatPct(s.reach)}
                      </span>{" "}
                      · {formatNum(s.sessions)}
                      {dropoff !== null && dropoff > 0 && (
                        <span className="text-red-500">
                          {" "}
                          −{formatPct(dropoff)}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.min(100, s.reach * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );
}
