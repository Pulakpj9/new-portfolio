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

interface RecentItem {
  time: string;
  question: string;
  intent: string | null;
  tools: string[];
  low_confidence: boolean;
}

export function BotConversationsClient() {
  const { days } = useFilters();
  const [intents, setIntents] = useState<{ intent: string; chats: number }[]>([]);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [detail, setDetail] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setDetail(null);
    try {
      const { from, to } = daysToRange(days);
      const qs = new URLSearchParams({ from, to });
      const res = await fetch(`/api/admin/bot/overview?${qs.toString()}`);
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
      setIntents(body.overview?.by_intent ?? []);
      setRecent(body.overview?.recent ?? []);
      setTotal(body.overview?.chats ?? 0);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  const maxIntent = Math.max(1, ...intents.map((i) => i.chats));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          What visitors ask — your content-gap detector. Unanswered clusters
          are writing prompts.
        </p>
        <FiltersBar showChannel={false} />
      </div>

      {status === "loading" && <LoadingGrid rows={2} />}
      {status === "error" && <ErrorState onRetry={load} detail={detail} />}
      {status === "ready" && total === 0 && (
        <EmptyState
          title="No conversations yet"
          body="Ask the bot something on the portfolio — exchanges land here within seconds."
        />
      )}
      {status === "ready" && total > 0 && (
        <>
          <Panel title="Top intents" subtitle={`${formatNum(total)} chats in range`}>
            <div className="space-y-3">
              {intents.map((i) => (
                <div key={i.intent}>
                  <div className="mb-1 flex items-baseline justify-between text-xs">
                    <span className="rounded-full bg-muted px-2 py-0.5 font-mono font-medium text-foreground">
                      {i.intent}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatNum(i.chats)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(i.chats / maxIntent) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Recent questions" subtitle="Latest 50 · emails stripped before storage">
            <div className="space-y-2">
              {recent.map((r, idx) => (
                <div
                  key={`${r.time}-${idx}`}
                  className={cn(
                    "rounded-2xl border border-border px-4 py-3",
                    r.low_confidence && "border-amber-500/40",
                  )}
                >
                  <p className="text-sm text-foreground">“{r.question}”</p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
                    <span>
                      {new Date(r.time).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </span>
                    {r.intent && (
                      <span className="rounded-full bg-muted px-2 py-0.5">
                        {r.intent}
                      </span>
                    )}
                    {r.tools.map((t) => (
                      <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                        {t}
                      </span>
                    ))}
                    {r.low_confidence && (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-500">
                        unanswered?
                      </span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
