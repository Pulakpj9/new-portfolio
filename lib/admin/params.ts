import { z } from "zod";

/* Shared ?from & ?to & ?channel validation for admin analytics routes.
   Dates are calendar days (yyyy-mm-dd); range is [from, to + 1 day).
   Defaults: last 30 days. Hard cap: 366 days. */

const paramsSchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  channel: z
    .string()
    .regex(/^[a-z0-9-]{2,32}$/)
    .optional(),
  gran: z.enum(["day", "week", "month"]).optional(),
});

export type Granularity = "day" | "week" | "month";

export interface DateRange {
  from: string; // ISO timestamp, range start (inclusive)
  to: string; // ISO timestamp, range end (exclusive)
  channel: string | null;
  gran: Granularity;
}

export function parseRange(search: URLSearchParams): DateRange {
  const parsed = paramsSchema.safeParse({
    from: search.get("from") ?? undefined,
    to: search.get("to") ?? undefined,
    channel: search.get("channel") ?? undefined,
    gran: search.get("gran") ?? undefined,
  });
  if (!parsed.success) throw new Error("invalid_params");

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const toDate = parsed.data.to ? new Date(`${parsed.data.to}T00:00:00Z`) : today;
  const fromDate = parsed.data.from
    ? new Date(`${parsed.data.from}T00:00:00Z`)
    : new Date(toDate.getTime() - 29 * 86_400_000);

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw new Error("invalid_params");
  }
  // Clamp: from <= to, max 366-day window.
  const to = new Date(toDate.getTime() + 86_400_000);
  let from = fromDate <= toDate ? fromDate : toDate;
  if (to.getTime() - from.getTime() > 366 * 86_400_000) {
    from = new Date(to.getTime() - 366 * 86_400_000);
  }

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    channel: parsed.data.channel ?? null,
    gran: parsed.data.gran ?? "day",
  };
}
