/* Analytics tracker singleton. Client-only, zero dependencies.
   - Session id lives in memory only (reload = new session, by design).
   - Batches events, flushes on interval/count, sendBeacon on pagehide.
   - Every public method is failure-silent: tracking never throws into the UI. */

import type {
  ClientEvent,
  DeviceClass,
  EventType,
  IngestPayload,
  SessionInfo,
} from "./types";

const ENDPOINT = "/api/e/events";
const FLUSH_INTERVAL_MS = 15_000;
const FLUSH_MAX_BATCH = 20;
const SPILL_KEY = "pa_spill_v1";
const CHANNEL_RE = /^[a-z0-9-]{2,32}$/;

function newId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function deviceClass(): DeviceClass {
  try {
    const coarse =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches;
    if (!coarse) return "desktop";
    return window.innerWidth < 768 ? "mobile" : "tablet";
  } catch {
    return "desktop";
  }
}

function attribution(): Pick<
  SessionInfo,
  "channel" | "landing_path" | "referrer" | "utm_source" | "utm_medium"
> {
  const fallback = { channel: "direct", landing_path: "/" } as const;
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = (params.get("ref") ?? "").toLowerCase();
    return {
      channel: CHANNEL_RE.test(ref) ? ref : "direct",
      landing_path: window.location.pathname.slice(0, 500) || "/",
      referrer: document.referrer.slice(0, 500) || undefined,
      utm_source: params.get("utm_source")?.slice(0, 100) || undefined,
      utm_medium: params.get("utm_medium")?.slice(0, 100) || undefined,
    };
  } catch {
    return { ...fallback };
  }
}

class Tracker {
  private enabled = false;
  private sessionId: string | null = null;
  private sessionSent = false;
  private queue: ClientEvent[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private flushing = false;

  /** Idempotent. Safe to call from multiple components. */
  init(): void {
    if (this.enabled || typeof window === "undefined") return;
    try {
      if (process.env.NEXT_PUBLIC_ANALYTICS_DISABLED === "true") return;
      if (typeof navigator !== "undefined" && navigator.doNotTrack === "1") {
        return;
      }
      this.enabled = true;
      this.sessionId = newId();
      this.resendSpill();
      this.timer = setInterval(() => void this.flush(), FLUSH_INTERVAL_MS);
      window.addEventListener("pagehide", this.handlePageHide);
    } catch {
      this.enabled = false;
    }
  }

  track(
    type: EventType,
    fields?: Omit<ClientEvent, "type" | "t">,
  ): void {
    if (!this.enabled) return;
    try {
      this.queue.push({ type, ...fields, t: new Date().toISOString() });
      if (this.queue.length >= FLUSH_MAX_BATCH) void this.flush();
    } catch {
      /* swallow */
    }
  }

  private sessionPayload(): SessionInfo | undefined {
    if (this.sessionSent || !this.sessionId) return undefined;
    try {
      return {
        id: this.sessionId,
        device: deviceClass(),
        user_agent: navigator.userAgent.slice(0, 300),
        ...attribution(),
      };
    } catch {
      return undefined;
    }
  }

  private takeBatch(): ClientEvent[] {
    const batch = this.queue;
    this.queue = [];
    return batch;
  }

  private async post(payload: IngestPayload, keepalive: boolean): Promise<boolean> {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive,
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async flush(): Promise<void> {
    if (!this.enabled || this.flushing || !this.sessionId) return;
    const batch = this.takeBatch();
    if (batch.length === 0) return;
    this.flushing = true;
    try {
      const session = this.sessionPayload();
      const ok = await this.post(
        { session, session_id: this.sessionId, events: batch },
        false,
      );
      if (ok) {
        this.sessionSent = true;
      } else {
        // Requeue at the front; spill to sessionStorage if it keeps failing.
        this.queue = [...batch, ...this.queue].slice(0, 200);
        this.spill();
      }
    } finally {
      this.flushing = false;
    }
  }

  private handlePageHide = (): void => {
    if (!this.enabled || !this.sessionId) return;
    const batch = this.takeBatch();
    if (batch.length === 0) return;
    try {
      const session = this.sessionPayload();
      const payload: IngestPayload = {
        session,
        session_id: this.sessionId,
        events: batch,
      };
      const blob = new Blob([JSON.stringify(payload)], {
        type: "application/json",
      });
      const sent =
        typeof navigator.sendBeacon === "function" &&
        navigator.sendBeacon(ENDPOINT, blob);
      if (!sent) {
        // Fallback path: keepalive fetch (async, best-effort).
        void this.post(payload, true);
      } else {
        this.sessionSent = true;
      }
    } catch {
      /* last resort: drop — never break unload */
    }
  };

  private spill(): void {
    try {
      if (this.queue.length === 0) return;
      window.sessionStorage.setItem(SPILL_KEY, JSON.stringify(this.queue.slice(0, 200)));
    } catch {
      /* private mode etc. — drop */
    }
  }

  private resendSpill(): void {
    try {
      const raw = window.sessionStorage.getItem(SPILL_KEY);
      window.sessionStorage.removeItem(SPILL_KEY);
      if (!raw) return;
      const spilled = JSON.parse(raw) as ClientEvent[];
      if (Array.isArray(spilled) && spilled.length > 0) {
        // Attribute spilled events to the new session; note the join in meta.
        for (const e of spilled.slice(0, 200)) {
          this.queue.push({
            ...e,
            t: new Date().toISOString(),
            meta: { ...(e.meta ?? {}), respilled: true },
          });
        }
      }
    } catch {
      /* corrupt spill — drop */
    }
  }
}

export const tracker = new Tracker();
