"use client";

import { useCallback, useEffect, useState } from "react";
import { FiltersBar, useFilters } from "@/components/admin/filters-bar";
import {
  EmptyState,
  ErrorState,
  LoadingGrid,
  Panel,
} from "@/components/admin/ui";
import { daysToRange, formatNum } from "@/components/admin/format";
import { cn } from "@/lib/utils";

interface ContentRow {
  slug: string;
  kind: string | null;
  views: number;
  expands: number;
  video_plays: number;
}

export function ContentClient() {
  const { days, channel } = useFilters();
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [detail, setDetail] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setDetail(null);
    try {
      const { from, to } = daysToRange(days);
      const qs = new URLSearchParams({ from, to });
      if (channel) qs.set("channel", channel);
      const res = await fetch(`/api/admin/content?${qs.toString()}`);
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
      setRows(body.rows ?? []);
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
