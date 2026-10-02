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
import { daysToRange, formatDay, formatNum } from "@/components/admin/format";
import { cn } from "@/lib/utils";

interface ContentRow {
  slug: string;
  kind: string | null;
  views: number;
  expands: number;
  video_plays: number;
}

interface ResumeStats {
  total: number;
  sessions: number;
  trend: { day: string; downloads: number }[];
  by_channel: { channel: string; downloads: number; sessions: number }[];
}

export function ContentClient() {
  const { days, channel } = useFilters();
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [resume, setResume] = useState<ResumeStats | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [detail, setDetail] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setDetail(null);
    try {
      const { from, to } = daysToRange(days);
      const qs = new URLSearchParams({ from, to });
      if (channel) qs.set("channel", channel);
      const [contentRes, resumeRes] = await Promise.all([
        fetch(`/api/admin/content?${qs.toString()}`),
        fetch(`/api/admin/resumes?${qs.toString()}`),
      ]);
      if (!contentRes.ok) {
        let d: string | null = null;
        try {
          const body = await contentRes.json();
          d = typeof body.detail === "string" ? body.detail : null;
        } catch {
          /* ignore */
        }
        setDetail(d);
        throw new Error("bad content status");
      }
      const body = await contentRes.json();
      setRows(body.rows ?? []);
      if (resumeRes.ok) {
        const rbody = await resumeRes.json();
        setResume({
          total: rbody.total ?? 0,
          sessions: rbody.sessions ?? 0,
          trend: rbody.trend ?? [],
          by_channel: rbody.by_channel ?? [],
        });
      } else {
        setResume(null);
      }
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
          <h1 className="text-xl font-bold">Content</h1>
          <p className="text-sm text-muted-foreground">
            Per-item engagement. Expands apply to case studies, video plays to
            projects — cards carry no outbound links, so there is no CTR to show.
          </p>
        </div>
        <FiltersBar />
      </div>

      {status === "loading" && <LoadingGrid rows={2} />}
      {status === "error" && <ErrorState onRetry={load} detail={detail} />}
      {status === "ready" && resume && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              label="Resume downloads"
              value={formatNum(resume.total)}
              hint={`${formatNum(resume.sessions)} sessions grabbed it`}
            />
            <StatCard
              label="Downloads / session"
              value={
                resume.sessions > 0
                  ? (resume.total / resume.sessions).toFixed(2)
                  : "—"
              }
              hint="repeat downloads within a visit"
            />
          </div>
          {resume.trend.length > 0 && (
            <Panel title="Downloads per day" subtitle="In the selected range">
              <div className="flex h-24 items-end gap-1">
                {resume.trend.map((t) => {
                  const max = Math.max(1, ...resume.trend.map((x) => x.downloads));
                  return (
                    <div
                      key={t.day}
                      title={`${formatDay(t.day)}: ${t.downloads}`}
                      className="min-w-0 flex-1 rounded-t bg-primary/70"
                      style={{ height: `${Math.max(4, (t.downloads / max) * 100)}%` }}
                    />
                  );
                })}
              </div>
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                {formatDay(resume.trend[0].day)} →{" "}
                {formatDay(resume.trend[resume.trend.length - 1].day)}
              </p>
            </Panel>
          )}
          {resume.by_channel.length > 0 && (
            <Panel title="By channel" subtitle="Which share links convert to downloads">
              <div className="space-y-2">
                {resume.by_channel.map((c) => (
                  <div
                    key={c.channel}
                    className="flex items-center justify-between rounded-2xl border border-border px-4 py-2.5 text-sm"
                  >
                    <span className="font-mono text-foreground">?ref={c.channel}</span>
                    <span className="tabular-nums text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {formatNum(c.downloads)}
                      </span>{" "}
                      · {formatNum(c.sessions)} sessions
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      )}
      {status === "ready" && rows.length === 0 && (
        <EmptyState
          title="No content engagement in this range"
          body="Scroll project and case-study cards into view — views fire at 50% visibility — then refresh this page."
        />
      )}
      {status === "ready" && rows.length > 0 && (
        <Panel title={`${rows.length} items`} subtitle="Sorted by views">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Item</th>
                  <th className="px-2 py-2 text-right font-medium">Views</th>
                  <th className="px-2 py-2 text-right font-medium">Expands</th>
                  <th className="px-2 py-2 text-right font-medium">Video plays</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.kind}:${r.slug}`} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 pr-4">
                      <span
                        className={cn(
                          "mr-2 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                          r.kind === "case-study"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {r.kind ?? "?"}
                      </span>
                      <span className="font-mono font-medium text-foreground">
                        {r.slug}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-right font-semibold tabular-nums text-foreground">
                      {formatNum(r.views)}
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums">
                      {r.kind === "case-study" ? (
                        formatNum(r.expands)
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums">
                      {r.kind === "project" ? (
                        formatNum(r.video_plays)
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}
