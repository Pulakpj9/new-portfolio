"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Granularity } from "@/lib/admin/params";

const PRESETS = [7, 30, 90];

interface Channel {
  slug: string;
  label: string;
  is_active: boolean;
}

/* Global filters. URL is the state (?days=30&channel=linkedin&gran=week) so
   views are shareable and back-button safe. Pages read the same params. */
export function FiltersBar({
  showGranularity = false,
  showChannel = true,
}: {
  showGranularity?: boolean;
  showChannel?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const days = params.get("days") ?? "30";
  const channel = params.get("channel") ?? "all";
  const gran = params.get("gran") ?? "day";
  const [channels, setChannels] = useState<Channel[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/channels");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setChannels(data.channels ?? []);
      } catch {
        /* filter still works with "all" */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const set = (next: Record<string, string>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) sp.set(k, v);
    router.replace(`${pathname}?${sp.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
        {PRESETS.map((d) => (
          <button
            key={d}
            onClick={() => set({ days: String(d) })}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              days === String(d)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {d}d
          </button>
        ))}
      </div>
      {showChannel && (
        <select
          aria-label="Channel"
          value={channel}
          onChange={(e) => set({ channel: e.target.value })}
          className="h-9 rounded-full border border-border bg-card px-3 text-xs font-medium text-foreground outline-none focus:border-primary/60"
        >
          <option value="all">All channels</option>
          {channels
            .filter((c) => c.is_active)
            .map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
        </select>
      )}
      {showGranularity && (
        <div
          role="group"
          aria-label="Group by"
          className="flex items-center gap-1 rounded-full border border-border bg-card p-1"
        >
          {(
            [
              ["day", "Daily"],
              ["week", "Weekly"],
              ["month", "Monthly"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => set({ gran: value })}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                gran === value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Shared helpers for dashboard pages reading the same URL state. */
export function useFilters() {
  const params = useSearchParams();
  const daysRaw = Number(params.get("days") ?? 30);
  const days = [7, 30, 90].includes(daysRaw) ? daysRaw : 30;
  const channel = params.get("channel") ?? "all";
  const granRaw = params.get("gran") ?? "day";
  const gran: Granularity = ["day", "week", "month"].includes(granRaw)
    ? (granRaw as Granularity)
    : "day";
  return { days, channel: channel === "all" ? null : channel, gran };
}
