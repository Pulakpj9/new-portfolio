/* Dwell-triggered nudge engine. Client-only, zero dependencies.
   Observes [data-section] wrappers + [data-content] cards with its own
   lightweight clock (visibility-aware; analytics-grade idle gating lives in
   useSectionTracking and isn't needed for a teaser). Fires once per rule per
   tab session via window CustomEvent; ChatAssistant owns policy + UI. */

"use client";

export interface NudgeRule {
  id: string;
  section: string;
  content_slug: string | null;
  threshold_ms: number;
  teaser: string;
  opener: string;
}

export const NUDGE_EVENT = "pulak-mini:nudge";

interface Target {
  el: Element;
  section: string;
  slug: string | null; // null = whole-section target
  accum: number;
  stamp: number;
  inView: boolean;
}

function countable(): boolean {
  try {
    return document.visibilityState === "visible";
  } catch {
    return true;
  }
}

let started = false;

export function initNudgeEngine(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  (async () => {
    let config: {
      proactive_enabled?: boolean;
      rules?: NudgeRule[];
    } | null = null;
    try {
      const res = await fetch("/api/bot/config");
      if (!res.ok) return;
      config = await res.json();
    } catch {
      return;
    }
    if (!config || config.proactive_enabled === false) return;
    const rules = (config.rules ?? []).filter(
      (r) => r && typeof r.threshold_ms === "number",
    );
    if (rules.length === 0) return;
    runEngine(rules);
  })().catch(() => {
    /* never break the page */
  });
}

function runEngine(rules: NudgeRule[]): void {
  const fired = new Set<string>();
  const targets: Target[] = [];

  const sectionEls = document.querySelectorAll("[data-section]");
  sectionEls.forEach((el) => {
    const section = (el as HTMLElement).dataset.section;
    if (section) targets.push({ el, section, slug: null, accum: 0, stamp: 0, inView: false });
  });
  const contentEls = document.querySelectorAll("[data-content]");
  contentEls.forEach((el) => {
    const raw = (el as HTMLElement).dataset.content ?? "";
    const [kind, slug] = raw.split(":");
    if ((kind !== "project" && kind !== "case-study") || !slug) return;
    const host = (el as HTMLElement).closest("[data-section]");
    const section = (host as HTMLElement | null)?.dataset.section ?? "";
    if (!section) return;
    targets.push({ el, section, slug, accum: 0, stamp: 0, inView: false });
  });
  if (targets.length === 0) return;

  const settle = (t: Target, now: number) => {
    if (t.inView && countable()) t.accum += now - t.stamp;
    t.stamp = now;
  };

  const check = (t: Target) => {
    for (const r of rules) {
      if (fired.has(r.id)) continue;
      if (r.section !== t.section) continue;
      if ((r.content_slug ?? null) !== t.slug) continue;
      if (t.accum >= r.threshold_ms) {
        fired.add(r.id);
        try {
          window.dispatchEvent(new CustomEvent(NUDGE_EVENT, { detail: r }));
        } catch {
          /* ignore */
        }
      }
    }
  };

  const io = new IntersectionObserver(
    (entries) => {
      const now = Date.now();
      for (const entry of entries) {
        const t = targets.find((x) => x.el === entry.target);
        if (!t) continue;
        settle(t, now);
        t.inView = entry.intersectionRatio >= 0.5;
        t.stamp = now;
        if (t.inView) check(t);
      }
    },
    { threshold: [0, 0.5, 1] },
  );
  targets.forEach((t) => io.observe(t.el));

  document.addEventListener("visibilitychange", () => {
    const now = Date.now();
    for (const t of targets) {
      settle(t, now);
      if (document.visibilityState === "visible" && t.inView) check(t);
    }
  });
}
