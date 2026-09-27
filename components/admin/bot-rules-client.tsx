"use client";

import { useCallback, useEffect, useState } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingGrid,
  Panel,
} from "@/components/admin/ui";
import { formatNum } from "@/components/admin/format";
import { cn } from "@/lib/utils";

const SECTIONS = ["hero", "about", "experience", "projects", "case-studies", "contact"];

interface Rule {
  id: string;
  section: string;
  content_slug: string | null;
  threshold_ms: number;
  teaser: string;
  opener: string;
  is_active: boolean;
}

const EMPTY_FORM = {
  section: "experience",
  content_slug: "",
  threshold_s: "45",
  teaser: "",
  opener: "",
};

export function BotRulesClient() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [detail, setDetail] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editThreshold, setEditThreshold] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    setDetail(null);
    try {
      const res = await fetch("/api/admin/nudge-rules");
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
      setRules(body.rules ?? []);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 4000);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const threshold_ms = Math.round(Number(form.threshold_s) * 1000);
    if (!Number.isFinite(threshold_ms) || threshold_ms < 5000 || threshold_ms > 600000) {
      flash("Threshold must be 5–600 seconds.");
      return;
    }
    if (!form.teaser.trim() || !form.opener.trim()) {
      flash("Teaser and opener can't be empty.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/nudge-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: form.section,
          content_slug: form.content_slug.trim() || null,
          threshold_ms,
          teaser: form.teaser.trim(),
          opener: form.opener.trim(),
        }),
      });
      if (!res.ok) {
        flash(res.status === 400 ? "Check all fields (slug: lowercase, dashes)." : `Create failed (${res.status}).`);
      } else {
        flash("Rule created — live within ~5 minutes (config cache).");
        setForm(EMPTY_FORM);
        await load();
      }
    } catch {
      flash("Network error. Try again.");
    } finally {
      setCreating(false);
    }
  };

  const patch = async (id: string, body: Record<string, unknown>, okMsg: string) => {
    try {
      const res = await fetch(`/api/admin/nudge-rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        flash(`Update failed (${res.status}).`);
        return;
      }
      flash(okMsg);
      await load();
    } catch {
      flash("Network error. Try again.");
    }
  };

  const remove = (id: string) => {
    if (!window.confirm("Delete this nudge rule?")) return;
    void (async () => {
      try {
        const res = await fetch(`/api/admin/nudge-rules/${id}`, { method: "DELETE" });
        if (!res.ok) flash(`Delete failed (${res.status}).`);
        else {
          flash("Rule deleted.");
          await load();
        }
      } catch {
        flash("Network error. Try again.");
      }
    })();
  };

  const saveThreshold = (id: string) => {
    const ms = Math.round(Number(editThreshold) * 1000);
    if (!Number.isFinite(ms) || ms < 5000 || ms > 600000) {
      flash("Threshold must be 5–600 seconds.");
      return;
    }
    setEditing(null);
    void patch(id, { threshold_ms: ms }, "Threshold updated.");
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Dwell-triggered teasers. Fire once per rule per visit; the chat panel
        enforces max 2 per session + 90s cooldown.
      </p>

      {notice && (
        <p role="status" className="rounded-2xl border border-border bg-card px-4 py-3 font-mono text-xs text-foreground">
          {notice}
        </p>
      )}

      <Panel title="New rule" subtitle="Content slug optional — blank means the whole section">
        <form onSubmit={create} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-xs font-medium text-muted-foreground">
            Section
            <select
              value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}
              className="mt-1.5 block h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/60"
            >
              {SECTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-muted-foreground">
            Content slug <span className="opacity-60">(optional)</span>
            <input
              value={form.content_slug}
              onChange={(e) => setForm({ ...form, content_slug: e.target.value })}
              placeholder="whatsapp-crm"
              className="mt-1.5 block h-10 w-full rounded-xl border border-border bg-background px-3 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary/60"
            />
          </label>
          <label className="block text-xs font-medium text-muted-foreground">
            Dwell threshold (seconds)
            <input
              value={form.threshold_s}
              onChange={(e) => setForm({ ...form, threshold_s: e.target.value })}
              placeholder="45"
              inputMode="numeric"
              className="mt-1.5 block h-10 w-full rounded-xl border border-border bg-background px-3 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary/60"
            />
          </label>
          <label className="block text-xs font-medium text-muted-foreground sm:col-span-2 lg:col-span-1">
            Teaser <span className="opacity-60">(bubble above the launcher)</span>
            <input
              value={form.teaser}
              onChange={(e) => setForm({ ...form, teaser: e.target.value })}
              placeholder="Spent some time here — want the 2-minute story?"
              maxLength={300}
              className="mt-1.5 block h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary/60"
            />
          </label>
          <label className="block text-xs font-medium text-muted-foreground sm:col-span-2">
            Opener <span className="opacity-60">(auto-sent user message on click)</span>
            <input
              value={form.opener}
              onChange={(e) => setForm({ ...form, opener: e.target.value })}
              placeholder="Give me the 2-minute tour"
              maxLength={300}
              className="mt-1.5 block h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary/60"
            />
          </label>
          <div className="flex items-end sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={creating}
              className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create rule"}
            </button>
          </div>
        </form>
      </Panel>

      {status === "loading" && <LoadingGrid rows={2} />}
      {status === "error" && <ErrorState onRetry={load} detail={detail} />}
      {status === "ready" && rules.length === 0 && (
        <EmptyState
          title="No nudge rules"
          body="Run the Phase B migration for starter rules, or create one above."
        />
      )}
      {status === "ready" && rules.length > 0 && (
        <Panel title={`${formatNum(rules.length)} rules`} subtitle="Toggles apply within ~5 minutes via the config cache">
          <div className="space-y-3">
            {rules.map((r) => (
              <div
                key={r.id}
                className={cn("rounded-2xl border border-border px-4 py-3", !r.is_active && "opacity-60")}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-semibold text-foreground">
                      {r.section}
                      {r.content_slug ? ` · ${r.content_slug}` : ""}
                      <span className="ml-2 font-sans text-xs font-normal tabular-nums text-muted-foreground">
                        {editing === r.id ? (
                          <span className="inline-flex items-center gap-1.5">
                            <input
                              value={editThreshold}
                              onChange={(e) => setEditThreshold(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveThreshold(r.id);
                                if (e.key === "Escape") setEditing(null);
                              }}
                              autoFocus
                              className="h-7 w-20 rounded-lg border border-border bg-background px-2 font-mono text-xs text-foreground outline-none focus:border-primary/60"
                            />
                            s
                            <button onClick={() => saveThreshold(r.id)} className="rounded-lg bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground">Save</button>
                            <button onClick={() => setEditing(null)} className="rounded-lg px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted">Cancel</button>
                          </span>
                        ) : (
                          <span>
                            {Math.round(r.threshold_ms / 1000)}s{" "}
                            <button
                              onClick={() => {
                                setEditing(r.id);
                                setEditThreshold(String(Math.round(r.threshold_ms / 1000)));
                              }}
                              className="text-primary hover:underline"
                            >
                              edit
                            </button>
                          </span>
                        )}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">“{r.teaser}”</p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground/70">→ {r.opener}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => void patch(r.id, { is_active: !r.is_active }, r.is_active ? "Rule paused." : "Rule activated.")}
                      className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                    >
                      {r.is_active ? "Active" : "Off"}
                    </button>
                    <button
                      onClick={() => remove(r.id)}
                      className="rounded-full border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10"
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
