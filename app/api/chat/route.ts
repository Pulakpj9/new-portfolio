import { NextResponse } from "next/server";
import {
  CHAT_TOOLS,
  KNOWN_CASE_STUDY_SLUGS,
  KNOWN_PROJECT_SLUGS,
  SCROLL_TARGETS,
  buildSystemPrompt,
  splitSteps,
} from "@/content/chat-kb";
import { botReply, FALLBACK_FOLLOWUPS } from "@/lib/chat/fallback";
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

const LLM_TIMEOUT_MS = 30_000;

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

function intentFor(
  actions: (BotAction | null)[],
  text: string,
): string {
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

  const { messages, session_id } = parsed.data;
  const lastUser =
    [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  // Explicit kill-switch wins over everything (503 → client offline note).
  if (!(await botEnabled())) {
    return NextResponse.json({ error: "bot_disabled" }, { status: 503 });
  }

  // Per-session cap: 15 chats per anonymous session, then a polite stop.
  if (session_id) {
    const count = await sessionChatCount(session_id);
    if (count !== null && count >= SESSION_CHAT_CAP) {
      return cappedResponse(
        "Easy on the questions — you've hit the chat limit for this visit. Email pulakpj9@gmail.com and he'll pick it up directly.",
      );
    }
  }

  // Monthly budget cap (env, USD). Unset = uncapped.
  const monthlyCap = Number(process.env.CHAT_MONTHLY_CAP_USD);
  if (Number.isFinite(monthlyCap) && monthlyCap > 0) {
    const spent = await monthSpendUsd();
    if (spent !== null && spent >= monthlyCap) {
      console.error(
        `[chat] monthly budget reached: $${spent.toFixed(2)} >= $${monthlyCap}`,
      );
      return cappedResponse(
        "Chat is paused for now — email pulakpj9@gmail.com and he'll reply directly.",
      );
    }
  }

  const config = providerConfig();

  // Generation clock: validation + caps excluded, LLM-or-fallback duration only.
  const chatStart = Date.now();

  const stream = new ReadableStream<string>({
    async start(controller) {
      const send = (payload: unknown) =>
        controller.enqueue(sseEncode(payload));

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

      const started = Date.now();
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), LLM_TIMEOUT_MS);
      try {
        const result = await streamCompletion(
          config,
          buildSystemPrompt(),
          messages,
          CHAT_TOOLS,
          { onToken: (token) => send({ token }) },
          ctrl.signal,
        );
        clearTimeout(timeout);

        const texts = splitSteps(result.text);
        const actions = result.tools.map(toAction);
        const steps: BotStep[] = (texts.length > 0 ? texts : [""]).map(
          (text, i) => {
            const step: BotStep = {
              text: text || "Here's what I found on the page. 👇",
            };
            const action = actions[i];
            if (action) step.action = action;
            return step;
          },
        );
        const payload: ChatDonePayload = {
          steps,
          followups: followupsFor(actions),
          fallback: false,
          usage: result.usage,
        };
        logConversation({
          sessionId: session_id,
          question: lastUser,
          intent: intentFor(actions, result.text),
          tools: result.tools.map((t) => t.name),
          usage: result.usage,
          latencyMs: Date.now() - chatStart,
        });
        if (DEBUG) {
          console.log(
            `[chat] ok ${Date.now() - started}ms in=${result.usage.input} out=${result.usage.output} tools=[${result.tools.map((t) => t.name).join(",")}] preview="${result.text.slice(0, 200).replace(/\n/g, " ")}"`,
          );
        }
        send({ done: payload });
      } catch (err) {
        clearTimeout(timeout);
        const timedOut =
          err instanceof Error && err.name === "AbortError";
        console.error("[chat] provider failed:", err);
        send({ done: fallbackDone(lastUser, timedOut ? "timeout" : "provider_error") });
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
