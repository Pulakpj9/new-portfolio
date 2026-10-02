import { NextResponse } from "next/server";
import {
  CHAT_TOOLS,
  KNOWN_CASE_STUDY_SLUGS,
  KNOWN_PROJECT_SLUGS,
  SCROLL_TARGETS,
  buildSystemPrompt,
  splitSteps,
} from "@/content/chat-kb";
import { caseStudies } from "@/content/case-studies";
import { experiences } from "@/content/experience";
import { projects } from "@/content/projects";
import { profile } from "@/content/contact";
import { botReply, FALLBACK_FOLLOWUPS } from "@/lib/chat/fallback";
import { deterministicAction } from "@/lib/chat/deterministic";
import { estimateCostUsd } from "@/lib/chat/cost";
import type { BotAction, BotStep, ChatDonePayload } from "@/lib/chat/protocol";
import {
  providerConfig,
  streamCompletion,
  type ProviderToolCall,
} from "@/lib/chat/provider";
import { getServiceClient } from "@/lib/supabase/server";
import { chatSchema } from "./schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* Per-attempt time budgets. A stalled primary (free-tier queueing) fails
   over to Lite on a FRESH budget instead of dying with a shared clock:
   typical bad case is now ~20s + a fast Lite answer, not 30s + fallback.
   TTFT_LIMIT_MS cuts over much earlier: a healthy stream always emits its
   first token fast, so silence means queueing and the full budget is waste. */
const PRIMARY_BUDGET_MS = 20_000;
const FAILOVER_BUDGET_MS = 20_000;
const TTFT_LIMIT_MS = 8_000;

/* Debug logging: on in dev, or anywhere with CHAT_DEBUG=true. Shows model,
   latency, token usage, tools, and a reply preview per request — the fastest
   way to tell "provider slow" apart from "model ignoring the KB". */
const DEBUG =
  process.env.CHAT_DEBUG === "true" || process.env.NODE_ENV !== "production";

/* Always responds 200 + SSE (validation failures excepted): the client has
   one code path, and the fallback flag tells it which mode we're in. */

function sseEncode(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function fallbackDone(
  lastUserText: string,
  reason: NonNullable<ChatDonePayload["fallback_reason"]> = "provider_error",
): ChatDonePayload {
  return {
    steps: [{ text: botReply(lastUserText) }],
    followups: [...FALLBACK_FOLLOWUPS],
    fallback: true,
    fallback_reason: reason,
  };
}

/** Provider tool call → validated client action, or null (dropped). */
function toAction(call: ProviderToolCall): BotAction | null {
  const a = call.args;
  switch (call.name) {
    case "scroll_to": {
      if (
        typeof a.target === "string" &&
        (SCROLL_TARGETS as readonly string[]).includes(a.target)
      ) {
        return { type: "scroll", target: a.target };
      }
      return null;
    }
    case "expand_content": {
      if (
        typeof a.slug === "string" &&
        (KNOWN_CASE_STUDY_SLUGS as readonly string[]).includes(a.slug)
      ) {
        return { type: "expand", kind: "case-study", slug: a.slug };
      }
      return null;
    }
    case "highlight": {
      if (a.kind !== "project" && a.kind !== "case-study") return null;
      const known =
        a.kind === "project" ? KNOWN_PROJECT_SLUGS : KNOWN_CASE_STUDY_SLUGS;
      if (
        typeof a.slug === "string" &&
        (known as readonly string[]).includes(a.slug)
      ) {
        return { type: "highlight", kind: a.kind, slug: a.slug };
      }
      return null;
    }
    case "suggest_contact": {
      if (a.method === "email" || a.method === "call") {
        return { type: "suggest_contact", method: a.method };
      }
      return null;
    }
    default:
      return null;
  }
}

function intentFor(actions: (BotAction | null)[], text: string): string {
  const first = actions.find((a): a is BotAction => a !== null);
  if (first) {
    if (first.type === "scroll") {
      if (first.target.includes("project")) return "project";
      if (first.target.includes("experience")) return "experience";
      if (first.target.includes("contact")) return "contact";
      if (first.target.includes("case")) return "case-study";
      if (first.target.includes("about")) return "about";
    }
    if (first.type === "expand") return "case-study";
    if (first.type === "highlight") return first.kind;
    if (first.type === "suggest_contact") return "contact";
  }
  const q = text.toLowerCase();
  if (/(skill|stack|tech)/.test(q)) return "stack";
  if (/project/.test(q)) return "project";
  if (/experien|career|role|job/.test(q)) return "experience";
  if (/contact|email|hire|call/.test(q)) return "contact";
  if (/about|who/.test(q)) return "about";
  return "other";
}

function followupsFor(actions: (BotAction | null)[]): string[] {
  const kinds = new Set(
    actions.filter((a): a is BotAction => a !== null).map((a) => a.type),
  );
  if (kinds.has("expand") || kinds.has("highlight")) {
    return [
      "What was the tech stack?",
      "What were the results?",
      "How do I contact him?",
    ];
  }
  if (kinds.has("suggest_contact")) {
    return [
      "What is he looking for?",
      "Tell me about his experience",
      "What projects has he built?",
    ];
  }
  return [
    "Tell me about his experience",
    "What projects has he built?",
    "How do I contact him?",
  ];
}

/* Deterministic backstop: when the model emits a tool call with no text
   (observed on Flash-tier models), describe the target from the KB instead
   of showing an empty bubble. Grounded by construction — never hallucinated. */
const SCROLL_LINES: Record<string, string> = {
  "#about":
    "Backend-focused full-stack developer — Node.js, TypeScript, React, MySQL and MongoDB, 1.5+ years full-time. Details below. 👇",
  "#experience":
    "Backend-focused Node.js Developer at Infoware India (Jul 2024–Present); previously intern there and Analyst Intern at Capgemini. Full timeline below. 👇",
  "#projects":
    "Three shipped backends: Activity Tracker (~1M records/week), WhatsApp CRM (12+ no-code elements), SalesApp (30+ field staff). Below. 👇",
  "#case-studies": "Deep dives with metrics for all three projects below. 👇",
  "#contact": `Fastest path is email: ${profile.email}. Contact section below. 👇`,
  top: "Scrolled you to the top — take a look around. 👇",
};

function describeAction(action: BotAction): string | null {
  try {
    switch (action.type) {
      case "expand":
      case "highlight": {
        const pool = action.kind === "project" ? projects : caseStudies;
        const item = pool.find((x) => x.id === action.slug);
        if (!item) return null;
        if (action.kind === "project") {
          const p = item as (typeof projects)[number];
          const metric = p.metrics[0];
          return `${p.title} — ${p.tagline} Key number: ${metric.label} ${metric.value}. I've highlighted it on the page. 👇`;
        }
        const c = item as (typeof caseStudies)[number];
        const firstResult = c.results[0];
        return `${c.title}. ${c.overview.split(". ")[0]}. Standout result: ${firstResult.metric} ${firstResult.value}. I've opened the full story below. 👇`;
      }
      case "scroll": {
        const roleMatch = /^#experience-(\d+)$/.exec(action.target);
        if (roleMatch) {
          const exp = experiences[Number(roleMatch[1])];
          if (exp) {
            return `${exp.role} at ${exp.company} (${exp.period}) — details on the timeline below. 👇`;
          }
          return "Here's that role on the timeline below. 👇";
        }
        return (
          SCROLL_LINES[action.target] ?? "Scrolled you there — take a look. 👇"
        );
      }
      case "suggest_contact": {
        return `You can reach him at ${profile.email} — I've scrolled to the contact section below. 👇`;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

const stripEmail = (s: string) =>
  s.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]").slice(0, 2000);

function logConversation(input: {
  sessionId?: string;
  question: string;
  intent: string;
  tools: string[];
  usage?: { input: number; output: number };
  latencyMs?: number;
}): void {
  try {
    const sb = getServiceClient();
    if (!sb) return;
    // Fire-and-forget: chat must never fail because logging did.
    void sb
      .from("bot_conversations")
      .insert({
        session_id: input.sessionId ?? null,
        question: stripEmail(input.question),
        intent: input.intent,
        tools_used: input.tools,
        input_tokens: input.usage?.input ?? null,
        output_tokens: input.usage?.output ?? null,
        latency_ms: input.latencyMs ?? null,
      })
      .then(({ error }) => {
        if (error) console.error("[chat] conversation log failed:", error);
      });
  } catch (err) {
    console.error("[chat] conversation log threw:", err);
  }
}

/* Abuse guards (Phase C). Kill-switch + per-session cap + monthly budget.
   All fail-open except an explicit disable: a broken guard must not mute
   the bot, but an explicit off must. */

const SESSION_CHAT_CAP = 15;

interface GuardCache {
  at: number;
  enabled: boolean;
}
let guardCache: GuardCache | null = null;
const GUARD_TTL_MS = 60_000;

async function botEnabled(): Promise<boolean> {
  const now = Date.now();
  if (guardCache && now - guardCache.at < GUARD_TTL_MS) {
    return guardCache.enabled;
  }
  let enabled = true;
  try {
    const sb = getServiceClient();
    if (sb) {
      const { data } = await sb
        .from("bot_settings")
        .select("value")
        .eq("key", "bot_enabled")
        .single();
      if (data) enabled = data.value === true;
    }
  } catch {
    /* fail open */
  }
  guardCache = { at: now, enabled };
  return enabled;
}

async function sessionChatCount(sessionId: string): Promise<number | null> {
  try {
    const sb = getServiceClient();
    if (!sb) return null;
    const { count, error } = await sb
      .from("bot_conversations")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId);
    if (error) throw error;
    return count ?? 0;
  } catch {
    return null; // fail open
  }
}

async function monthSpendUsd(): Promise<number | null> {
  try {
    const sb = getServiceClient();
    if (!sb) return null;
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    const { data, error } = await sb
      .from("bot_conversations")
      .select("input_tokens, output_tokens")
      .gte("time", start.toISOString())
      .limit(10000);
    if (error) throw error;
    return (data ?? []).reduce(
      (sum, r) =>
        sum + estimateCostUsd(r.input_tokens ?? 0, r.output_tokens ?? 0),
      0,
    );
  } catch {
    return null; // fail open
  }
}

function cappedResponse(text: string): Response {
  const payload: ChatDonePayload = {
    steps: [{ text }],
    followups: [...FALLBACK_FOLLOWUPS],
    fallback: true,
    fallback_reason: "capped",
  };
  const stream = new ReadableStream<string>({
    start(controller) {
      controller.enqueue(sseEncode({ done: payload }));
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

/* Exact-match answer cache (per model, 1h TTL, 50 entries). Portfolio
   questions repeat constantly; a hit skips tokens, latency, and quota.
   Only successful LLM answers are cached — never fallbacks. Logging still
   records the exchange (latency null, excluded from medians). */

interface CacheEntry {
  at: number;
  steps: BotStep[];
  followups: string[];
  tools: string[];
  intent: string;
}

const ANSWER_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 3_600_000;
const CACHE_MAX = 50;

function cacheKey(model: string, question: string): string {
  return `${model}::${question.trim().toLowerCase().replace(/\s+/g, " ")}`;
}

function cacheGet(model: string, question: string): CacheEntry | undefined {
  const entry = ANSWER_CACHE.get(cacheKey(model, question));
  if (!entry) return undefined;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    ANSWER_CACHE.delete(cacheKey(model, question));
    return undefined;
  }
  return entry;
}

function cacheSet(
  model: string,
  question: string,
  entry: Omit<CacheEntry, "at">,
): void {
  if (ANSWER_CACHE.size >= CACHE_MAX) {
    const oldest = ANSWER_CACHE.keys().next();
    if (!oldest.done) ANSWER_CACHE.delete(oldest.value);
  }
  ANSWER_CACHE.set(cacheKey(model, question), { ...entry, at: Date.now() });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  }

  const { messages, session_id, lite } = parsed.data;
  const lastUser =
    [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  // Pre-provider guards run in PARALLEL: each is a DB round-trip and they must
  // all resolve before the first token, so sequential awaits would stack
  // straight onto TTFT. Fail-open semantics preserved per guard.
  const monthlyCap = Number(process.env.CHAT_MONTHLY_CAP_USD);
  const capSet = Number.isFinite(monthlyCap) && monthlyCap > 0;
  const [enabled, sessCount, spent] = await Promise.all([
    botEnabled(),
    session_id ? sessionChatCount(session_id) : Promise.resolve(null),
    capSet ? monthSpendUsd() : Promise.resolve(null),
  ]);

  // Explicit kill-switch wins over everything (503 → client offline note).
  if (!enabled) {
    return NextResponse.json({ error: "bot_disabled" }, { status: 503 });
  }

  // Per-session cap: 15 chats per anonymous session, then a polite stop.
  if (sessCount !== null && sessCount >= SESSION_CHAT_CAP) {
    return cappedResponse(
      "Easy on the questions — you've hit the chat limit for this visit. Email pulakpj9@gmail.com and he'll pick it up directly.",
    );
  }

  // Monthly budget cap (env, USD). Unset = uncapped.
  if (capSet && spent !== null && spent >= monthlyCap) {
    console.error(
      `[chat] monthly budget reached: $${spent.toFixed(2)} >= $${monthlyCap}`,
    );
    return cappedResponse(
      "Chat is paused for now — email pulakpj9@gmail.com and he'll reply directly.",
    );
  }

  const config = providerConfig(lite);

  // Generation clock: validation + caps excluded, LLM-or-fallback duration only.
  const chatStart = Date.now();

  const stream = new ReadableStream<string>({
    async start(controller) {
      const send = (payload: unknown) => controller.enqueue(sseEncode(payload));

      // Degraded mode: no key configured → regex brain, same wire format.
      if (!config) {
        if (DEBUG) console.log(`[chat] no_key q="${lastUser.slice(0, 80)}"`);
        send({ done: fallbackDone(lastUser, "no_key") });
        controller.close();
        return;
      }
      if (DEBUG) {
        console.log(
          `[chat] req model=${config.model} system_chars=${buildSystemPrompt().length} q="${lastUser.slice(0, 80)}"`,
        );
      }

      // Exact-match cache: repeat questions skip tokens, latency, quota.
      const hit = cacheGet(config.model, lastUser);
      if (hit) {
        if (DEBUG) console.log(`[chat] cache_hit model=${config.model}`);
        logConversation({
          sessionId: session_id,
          question: lastUser,
          intent: hit.intent,
          tools: hit.tools,
        });
        send({
          done: {
            steps: hit.steps,
            followups: hit.followups,
            fallback: false,
            model: config.model,
          } satisfies ChatDonePayload,
        });
        controller.close();
        return;
      }

      const started = Date.now();

      // One full provider attempt with its OWN time budget: stream → build
      // steps → log → cache → send. Separate budgets mean a timed-out primary
      // can still fail over instead of dying with the shared clock.
      // TTFT cutover: if no token arrives within TTFT_LIMIT_MS, abort early
      // and let the caller fail over — a healthy stream always talks fast,
      // so silence means queueing, and waiting the full budget is pure waste.
      const attempt = async (cfg: typeof config, budgetMs: number): Promise<void> => {
        const c = new AbortController();
        const t = setTimeout(() => c.abort(), budgetMs);
        let serverTtft: number | null = null;
        const ttftTimer = setTimeout(() => c.abort(), TTFT_LIMIT_MS);
        try {
          const attemptStart = Date.now();
          const result = await streamCompletion(
            cfg,
            buildSystemPrompt(),
            messages,
            CHAT_TOOLS,
            {
              onToken: (token) => {
                if (serverTtft === null) {
                  serverTtft = Date.now() - attemptStart;
                  clearTimeout(ttftTimer);
                }
                send({ token });
              },
            },
            c.signal,
          );

        const texts = splitSteps(result.text);
        const modelActions = result.tools.map(toAction);
        // Model navigated nowhere but the request is explicitly navigational:
        // deterministic backstop (reproducible; the model keeps everything else).
        // New array (not mutation): every() narrows in place to null[].
        const det =
          modelActions.every((a) => a === null)
            ? deterministicAction(lastUser)
            : null;
        const actions: (BotAction | null)[] = det
          ? [det, ...modelActions.slice(1)]
          : modelActions;
        const steps: BotStep[] = (texts.length > 0 ? texts : [""]).map(
          (text, i) => {
            const action = actions[i];
            // Empty text + valid action → deterministic KB backstop (never blank).
            const resolved =
              text.trim() || (action ? describeAction(action) : null) || "";
            const step: BotStep = {
              text: resolved || "Here's what I found on the page. 👇",
            };
            if (action) step.action = action;
            return step;
          },
        );
        const payload: ChatDonePayload = {
          steps,
          followups: followupsFor(actions),
          fallback: false,
          model: cfg.model,
          usage: result.usage,
        };
        const intent = intentFor(actions, result.text);
        const toolNames = result.tools.map((t) => t.name);
        logConversation({
          sessionId: session_id,
          question: lastUser,
          intent,
          tools: toolNames,
          usage: result.usage,
          latencyMs: Date.now() - chatStart,
        });
        cacheSet(cfg.model, lastUser, {
          steps,
          followups: payload.followups,
          tools: toolNames,
          intent,
        });
        if (DEBUG) {
          console.log(
            `[chat] ok ${Date.now() - started}ms model=${cfg.model} ttft=${serverTtft ?? "none"}ms in=${result.usage.input} out=${result.usage.output} finish=${result.finishReason ?? "?"} tools=[${toolNames.join(",")}] preview="${result.text.slice(0, 200).replace(/\n/g, " ")}"`,
          );
        }
        send({ done: payload });
        } finally {
          clearTimeout(t);
          clearTimeout(ttftTimer);
        }
      };

      const failoverReason = (
        err: unknown,
      ): NonNullable<ChatDonePayload["fallback_reason"]> => {
        const msg = err instanceof Error ? err.message : "";
        if (/provider_http_429/.test(msg)) return "quota";
        if (err instanceof Error && err.name === "AbortError") return "timeout";
        return "provider_error";
      };

      try {
        await attempt(config, PRIMARY_BUDGET_MS);
      } catch (err) {
        // Fail over to the cheap model once: different capacity pool, and
        // 500 RPD of headroom — including on timeouts, which get a FRESH
        // budget (the stall was the other model's, not ours). Skipped when
        // already on Lite, or for non-retryable failures.
        const msg = err instanceof Error ? err.message : "";
        const timedOut = err instanceof Error && err.name === "AbortError";
        const retryable =
          /provider_http_(429|502|503|504)/.test(msg) || timedOut;
        const liteModel =
          process.env.CHAT_MODEL_LITE ?? "gemini-3.5-flash-lite";
        if (!lite && retryable && liteModel !== config.model) {
          if (DEBUG) {
            console.log(
              `[chat] primary failed (${timedOut ? "timeout" : msg}), failing over to ${liteModel}`,
            );
          }
          try {
            await attempt({ ...config, model: liteModel }, FAILOVER_BUDGET_MS);
            return;
          } catch (err2) {
            console.error("[chat] failover failed:", err2);
            send({ done: fallbackDone(lastUser, failoverReason(err2)) });
            return;
          }
        }
        console.error("[chat] provider failed:", err);
        send({ done: fallbackDone(lastUser, failoverReason(err)) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
