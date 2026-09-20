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
      })
      .then(({ error }) => {
        if (error) console.error("[chat] conversation log failed:", error);
      });
  } catch (err) {
    console.error("[chat] conversation log threw:", err);
  }
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
  const config = providerConfig();

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
