"use client";

import { useCallback, useEffect, useState } from "react";
import { FiltersBar, useFilters } from "@/components/admin/filters-bar";
import {
  EmptyState,
  ErrorState,
  LoadingGrid,
  Panel,
} from "@/components/admin/ui";
import { daysToRange, formatMs, formatNum } from "@/components/admin/format";
import { cn } from "@/lib/utils";

interface ChannelStat {
  slug: string;
  label: string;
  is_active: boolean;
  sessions: number;
  median_session_ms: number;
  top_section: string | null;
}

export function ChannelsClient() {
  const { days } = useFilters();
  const [stats, setStats] = useState<ChannelStat[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [detail, setDetail] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [newSlug, setNewSlug] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setDetail(null);
    try {
      const { from, to } = daysToRange(days);
      const qs = new URLSearchParams({ from, to });
      const res = await fetch(`/api/admin/channels?${qs.toString()}`);
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
      setStats(body.stats ?? []);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 4000);
  };

  const mutate = async (
    slug: string,
    init: RequestInit,
    okMsg: string,
    conflictMsg?: (body: Record<string, unknown>) => string,
  ) => {
    try {
      const res = await fetch(
        `/api/admin/channels/${encodeURIComponent(slug)}`,
        init,
      );
      if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
          const body = await res.json();
          if (res.status === 409 && body.error === "has_sessions" && conflictMsg) {
            msg = conflictMsg(body);
          } else if (body.error === "slug_exists") {
            msg = `Slug "${slug}" already exists.`;
          } else if (body.error === "direct_locked") {
            msg = `The "direct" channel is locked.`;
          }
        } catch {
          /* keep default */
        }
        flash(msg);
        return;
      }
      flash(okMsg);
      await load();
    } catch {
      flash("Network error. Try again.");
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = newSlug.trim().toLowerCase();
    if (!/^[a-z0-9-]{2,32}$/.test(slug) || !newLabel.trim()) {
      flash("Slug: 2–32 chars, lowercase letters, digits, dashes.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, label: newLabel.trim() }),
      });
      if (res.status === 409) {
        flash(`Slug "${slug}" already exists.`);
      } else if (!res.ok) {
        flash(`Create failed (${res.status}).`);
      } else {
        flash(`Channel "${slug}" created. Share link ready below.`);
        setNewSlug("");
        setNewLabel("");
        await load();
      }
    } catch {
      flash("Network error. Try again.");
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async (slug: string) => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/?ref=${slug}`,
      );
      setCopied(slug);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      flash("Clipboard blocked — copy the link manually.");
    }
  };

  const saveLabel = (slug: string) => {
    if (!editLabel.trim()) {
      flash("Label can't be empty.");
      return;
    }
    setEditing(null);
    void mutate(
      slug,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: editLabel.trim() }),
      },
      `Renamed "${slug}".`,
    );
  };

  const remove = (slug: string, sessions: number) => {
    const msg =
      sessions > 0
        ? `"${slug}" has attributed sessions and can't be deleted (history stays honest). Deactivate it instead.`
        : `Delete channel "${slug}"? This can't be undone.`;
    if (!window.confirm(msg)) return;
    if (sessions > 0) return;
    void mutate(slug, { method: "DELETE" }, `Deleted "${slug}".`, (body) =>
      `"${slug}" has ${String(body.sessions ?? "?")} sessions — deactivate instead.`,
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Channels</h1>
          <p className="text-sm text-muted-foreground">
            Share links, attribution stats, and lifecycle. Stats follow the date
            range.
          </p>
        </div>
        <FiltersBar showChannel={false} />
      </div>

      {notice && (
        <p
          role="status"
          className="rounded-2xl border border-border bg-card px-4 py-3 font-mono text-xs text-foreground"
        >
          {notice}
        </p>
      )}

      <Panel title="New channel" subtitle="Slug becomes ?ref=slug on every share link">
        <form onSubmit={create} className="flex flex-wrap items-end gap-3">
          <label className="block text-xs font-medium text-muted-foreground">
            Slug
            <input
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="newsletter"
              className="mt-1.5 block h-10 w-44 rounded-xl border border-border bg-background px-3 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary/60"
            />
          </label>
          <label className="block text-xs font-medium text-muted-foreground">
            Label
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Newsletter"
              className="mt-1.5 block h-10 w-52 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary/60"
            />
          </label>
          <button
            type="submit"
            disabled={creating}
            className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </form>
      </Panel>

      {status === "loading" && <LoadingGrid rows={2} />}
      {status === "error" && <ErrorState onRetry={load} detail={detail} />}
      {status === "ready" && stats.length === 0 && (
        <EmptyState
          title="No channels yet"
          body="The seed channels appear after running the Phase 1 migration."
        />
      )}
      {status === "ready" && stats.length > 0 && (
        <Panel title="All channels" subtitle="Toggle active to stop attributing without losing history">
          <div className="space-y-3">
            {stats.map((c) => (
              <div
                key={c.slug}
                className={cn(
                  "rounded-2xl border border-border px-4 py-3",
                  !c.is_active && "opacity-60",
                )}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    {editing === c.slug ? (
                      <span className="flex items-center gap-2">
                        <input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveLabel(c.slug);
                            if (e.key === "Escape") setEditing(null);
                          }}
                          autoFocus
                          className="h-8 w-48 rounded-lg border border-border bg-background px-2 font-mono text-sm text-foreground outline-none focus:border-primary/60"
                        />
                        <button
                          onClick={() => saveLabel(c.slug)}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <span className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-mono text-sm font-semibold text-foreground">
                          ?ref={c.slug}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {c.label}
                        </span>
                        <button
                          onClick={() => {
                            setEditing(c.slug);
                            setEditLabel(c.label);
                          }}
                          className="text-xs text-primary hover:underline"
                        >
                          rename
                        </button>
                      </span>
                    )}
                    <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                      {formatNum(c.sessions)} sessions · median{" "}
                      {formatMs(Number(c.median_session_ms))}
                      {c.top_section
                        ? ` · top section: ${c.top_section.replace("-", " ")}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyLink(c.slug)}
                      className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                    >
                      {copied === c.slug ? "Copied ✓" : "Copy link"}
                    </button>
                    <button
                      disabled={c.slug === "direct"}
                      title={
                        c.slug === "direct"
                          ? "The direct channel is locked"
                          : c.is_active
                            ? "Deactivate (keeps history)"
                            : "Reactivate"
                      }
                      onClick={() =>
                        mutate(
                          c.slug,
                          {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ is_active: !c.is_active }),
                          },
                          c.is_active
                            ? `Deactivated "${c.slug}".`
                            : `Reactivated "${c.slug}".`,
                        )
                      }
                      className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {c.is_active ? "Active" : "Off"}
                    </button>
                    <button
                      disabled={c.slug === "direct"}
                      title={
                        c.slug === "direct"
                          ? "The direct channel is locked"
                          : "Delete (only when zero sessions)"
                      }
                      onClick={() => remove(c.slug, c.sessions)}
                      className="rounded-full border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
