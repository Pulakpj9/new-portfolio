import { z } from "zod";
import { EVENT_TYPES, SECTIONS } from "@/lib/analytics/types";

/* Server-side validation for POST /api/e/events.
   Unknown event types are rejected loudly (fail fast in dev, visible in logs). */

const MAX_DWELL_MS = 24 * 60 * 60 * 1000; // 24h sanity cap
const MAX_BATCH = 100;

const clientEventSchema = z
  .object({
    type: z.enum(EVENT_TYPES),
    section: z.enum(SECTIONS).optional(),
    content_slug: z
      .string()
      .regex(/^[a-z0-9-]{1,80}$/)
      .optional(),
    dwell_ms: z.number().int().min(0).max(MAX_DWELL_MS).optional(),
    meta: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
    t: z.string().datetime({ offset: true }),
  })
  .superRefine((e, ctx) => {
    if ((e.type === "section_enter" || e.type === "section_exit") && !e.section) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "section required" });
    }
    if (e.type === "section_exit" && e.dwell_ms === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "dwell_ms required" });
    }
    if (e.type === "content_view" && !e.content_slug) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "content_slug required" });
    }
  });

const uuidSchema = z.string().uuid();

export const sessionSchema = z.object({
  id: uuidSchema,
  channel: z
    .string()
    .regex(/^[a-z0-9-]{2,32}$/)
    .max(32),
  landing_path: z.string().max(500).default("/"),
  referrer: z.string().max(500).optional(),
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  device: z.enum(["desktop", "mobile", "tablet"]).default("desktop"),
  user_agent: z.string().max(300).optional(),
});

export const ingestSchema = z.object({
  session: sessionSchema.optional(),
  session_id: uuidSchema,
  events: z.array(clientEventSchema).min(1).max(MAX_BATCH),
});

export type IngestInput = z.infer<typeof ingestSchema>;
