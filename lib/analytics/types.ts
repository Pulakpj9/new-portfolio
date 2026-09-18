/* Shared analytics vocabulary. Client-safe: no zod, no server imports. */

export const SECTIONS = [
  "hero",
  "about",
  "experience",
  "projects",
  "case-studies",
  "contact",
] as const;

export type SectionSlug = (typeof SECTIONS)[number];

export const EVENT_TYPES = [
  "session_start",
  "section_enter",
  "section_exit",
  "heartbeat",
  "content_view",
  "video_play",
  "cta_click",
  "social_click",
  "chat_open",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export type DeviceClass = "desktop" | "mobile" | "tablet";

/** One event as emitted by the SDK. `t` = client timestamp (ordering fallback). */
export interface ClientEvent {
  type: EventType;
  section?: SectionSlug;
  content_slug?: string;
  dwell_ms?: number;
  meta?: Record<string, string | number | boolean>;
  t: string;
}

/** Session attribution, sent once with the first batch per tab session. */
export interface SessionInfo {
  id: string;
  channel: string;
  landing_path: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  device: DeviceClass;
  user_agent?: string;
}

export interface IngestPayload {
  /** Full attribution, sent once with the first batch per tab session. */
  session?: SessionInfo;
  /** Always present: FK target for every event in the batch. */
  session_id: string;
  events: ClientEvent[];
}
