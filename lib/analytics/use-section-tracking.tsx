/* Section dwell tracking. Client-only, zero dependencies.
   Clock accumulates only while: section ≥50% visible AND tab visible AND
   user active within the last 60s. Exits fire on un-intersect, tab hide,
   idle timeout, and pagehide. Heartbeat bounds loss every 20s. */

"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { tracker } from "./tracker";
import type { SectionSlug } from "./types";

const VISIBLE_RATIO = 0.5;
const ENTER_GRACE_MS = 1000;
const IDLE_TIMEOUT_MS = 60_000;
const HEARTBEAT_MS = 20_000;
const MAX_DWELL_MS = 6 * 60 * 60 * 1000; // 6h client-side garbage cap

export function useSectionTracking(section: SectionSlug) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;

    let inView = false;
    let entered = false;
    let counting = false;
    let accumulated = 0;
    let stamp = 0;
    let graceTimer: ReturnType<typeof setTimeout> | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let lastActive = Date.now();
    let enterId = "";
    let disposed = false;

    const idle = () => Date.now() - lastActive > IDLE_TIMEOUT_MS;
    const countable = () =>
      inView && document.visibilityState === "visible" && !idle();

    /** Fold elapsed wall-time into dwell iff the clock should be running. */
    const settle = (now: number) => {
      if (counting) {
        if (countable()) accumulated += now - stamp;
        stamp = now;
      }
    };

    const exit = (now: number) => {
      if (!entered) return;
      settle(now);
      entered = false;
      counting = false;
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
      const dwell = Math.min(Math.max(Math.round(accumulated), 0), MAX_DWELL_MS);
      accumulated = 0;
      tracker.track("section_exit", {
        section,
        dwell_ms: dwell,
        meta: { enter_id: enterId },
      });
    };

    const enter = (now: number) => {
      if (entered || disposed) return;
      entered = true;
      counting = true;
      accumulated = 0;
      stamp = now;
      lastActive = now;
      try {
        enterId =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
      } catch {
        enterId = `${Date.now()}`;
      }
      tracker.track("section_enter", { section, meta: { enter_id: enterId } });
      heartbeatTimer = setInterval(() => {
        if (disposed || !entered) return;
        settle(Date.now());
        tracker.track("heartbeat", {
          section,
          dwell_ms: Math.round(accumulated),
          meta: { enter_id: enterId },
        });
      }, HEARTBEAT_MS);
    };

    const clearGrace = () => {
      if (graceTimer) {
        clearTimeout(graceTimer);
        graceTimer = null;
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const now = Date.now();
        settle(now);
        inView =
          entries[entries.length - 1].intersectionRatio >= VISIBLE_RATIO;
        if (inView && !entered) {
          clearGrace();
          graceTimer = setTimeout(() => {
            graceTimer = null;
            if (inView && !disposed) enter(Date.now());
          }, ENTER_GRACE_MS);
        } else if (!inView) {
          clearGrace();
          exit(now);
        }
      },
      { threshold: [0, VISIBLE_RATIO, 1] },
    );
    observer.observe(el);

    const onVisibility = () => {
      const now = Date.now();
      if (document.visibilityState === "hidden") {
        // Tab hidden: close the visit. Re-enter on return if still in view.
        clearGrace();
        exit(now);
      } else if (inView && !entered) {
        lastActive = now;
        enter(now);
      } else {
        settle(now);
      }
    };

    const onActivity = () => {
      const now = Date.now();
      const wasIdle = idle();
      lastActive = now;
      if (wasIdle && entered) stamp = now; // don't credit the idle gap
      else settle(now);
    };

    const onPageHide = () => exit(Date.now());

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("scroll", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    window.addEventListener("pointerdown", onActivity);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      disposed = true;
      clearGrace();
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("pagehide", onPageHide);
      // Unmount (route change in SPA): close any open visit into the queue.
      // Provider's own pagehide flush runs after (child effects first),
      // and the 15s interval flush covers the rest.
      exit(Date.now());
    };
  }, [section]);

  return ref;
}

/** Zero-risk wiring: a plain block div around a section. Unstyled, so it
 *  introduces no containing block (no transform/filter/overflow) and never
 *  disturbs sticky descendants, full-bleed backgrounds, or anchor offsets. */
export function TrackedSection({
  slug,
  children,
}: {
  slug: SectionSlug;
  children: ReactNode;
}) {
  const ref = useSectionTracking(slug);
  return (
    <div ref={ref} data-section={slug}>
      {children}
    </div>
  );
}

/** Mount once near the root. Idempotent init; DNT/disabled-flag aware.
 *  Also observes [data-content="kind:slug"] cards (project / case-study),
 *  firing content_view once per slug per session at ≥50% visibility. */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    tracker.init();
    const seen = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio < 0.5) continue;
          const el = entry.target as HTMLElement;
          const raw = el.dataset.content ?? "";
          const [kind, slug] = raw.split(":");
          if ((kind !== "project" && kind !== "case-study") || !slug) continue;
          if (seen.has(raw)) continue;
          seen.add(raw);
          tracker.track("content_view", {
            content_slug: slug,
            meta: { kind },
          });
          io.unobserve(el);
        }
      },
      { threshold: [0, 0.5, 1] },
    );
    const els = document.querySelectorAll("[data-content]");
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return <>{children}</>;
}
