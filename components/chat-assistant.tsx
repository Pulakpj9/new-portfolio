"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { tracker } from "@/lib/analytics/tracker";
import { executeBotAction } from "@/lib/chat/actions";
import { NUDGE_EVENT, type NudgeRule } from "@/lib/chat/nudges";
import type { BotStep, ChatDonePayload } from "@/lib/chat/protocol";

interface Message {
  role: "user" | "bot";
  text: string;
  pending?: boolean;
}

const QUICK_REPLIES = ["About Pulak", "Skills", "Projects", "Contact"];

const BANNER_TEXT =
  "Looking for work? Ask me anything about Pulak — I know him best! 🤖";

export function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "Hey! I'm Pulak Mini 🤖 Ask me anything about him — skills, experience, projects, how to get in touch...",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [followups, setFollowups] = useState<string[]>([]);
  const [teaser, setTeaser] = useState<NudgeRule | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const runId = useRef(0);
  /* Reply clock: armed when bot text lands (or panel opens), consumed on the
     next send. Measures user think-time; capped so abandoned tabs don't
     pollute the average. */
  const replyClock = useRef<number | null>(null);
  const REPLY_CAP_MS = 300_000;
  /* Nudge policy: max 2 per session, 90s cooldown after a shown teaser,
     never while open/typing. Engine fires once per rule; skips are final. */
  const nudgesShown = useRef(0);
  const lastNudgeAt = useRef(0);

  /* Proactive teasers from the dwell engine. */
  useEffect(() => {
    const onNudge = (e: Event) => {
      const rule = (e as CustomEvent<NudgeRule>).detail;
      if (!rule || open || typing) return;
      if (nudgesShown.current >= 2) return;
      if (Date.now() - lastNudgeAt.current < 90_000) return;
      nudgesShown.current += 1;
      lastNudgeAt.current = Date.now();
      dismissBanner();
      setTeaser(rule);
    };
    window.addEventListener(NUDGE_EVENT, onNudge);
    return () => window.removeEventListener(NUDGE_EVENT, onNudge);
  }, [open, typing]);

  useEffect(() => {
    setMounted(true);
    const showTimer = setTimeout(() => setShowBanner(true), 1400);
    return () => clearTimeout(showTimer);
  }, []);

  /* Auto-dismiss the label after a while */
  useEffect(() => {
    if (!showBanner) return;
    const autoTimer = setTimeout(() => setShowBanner(false), 7000);
    return () => clearTimeout(autoTimer);
  }, [showBanner]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing, followups, open]);

  const dismissBanner = () => {
    setShowBanner(false);
  };

  const handleToggle = () => {
    dismissBanner();
    if (!open) {
      tracker.track("chat_open");
      replyClock.current = Date.now();
    }
    setOpen((o) => !o);
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    // Consume the reply clock: think-time since the last bot text landed.
    if (replyClock.current !== null) {
      const delta = Date.now() - replyClock.current;
      replyClock.current = null;
      tracker.track("chat_user_reply", {
        dwell_ms: Math.min(Math.max(Math.round(delta), 0), REPLY_CAP_MS),
        meta: delta > REPLY_CAP_MS ? { capped: true } : undefined,
      });
    }
    const run = ++runId.current;
    const alive = () => runId.current === run;
    // TTFT clock: send → first streamed token (rendering vs provider split).
    const ttftStart = performance.now();
    const history = [...messages, { role: "user" as const, text: trimmed }].slice(-6);
    setMessages([
      ...messages,
      { role: "user", text: trimmed },
      { role: "bot", text: "", pending: true },
    ]);
    setFollowups([]);
    setInput("");
    setTyping(true);

    const finishTyping = () => {
      if (alive()) setTyping(false);
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Server speaks OpenAI roles: our "bot" === "assistant".
          messages: history.map((m) => ({
            role: m.role === "bot" ? "assistant" : "user",
            content: m.text,
          })),
        }),
      });
      if (!res.ok || !res.body) throw new Error(`http_${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let streamed = "";
      let firstToken = false;
      // Array (not a let binding): TS control-flow can't see closure
      // assignments, so a plain `let` would narrow to its initializer.
      const doneBox: ChatDonePayload[] = [];

      const appendToken = (token: string) => {
        if (!alive()) return;
        streamed += token;
        if (!firstToken) {
          firstToken = true;
          finishTyping();
          const ttft = Math.max(0, Math.round(performance.now() - ttftStart));
          tracker.track("chat_ttft", { dwell_ms: ttft });
        }
        const snapshot = streamed;
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last && last.role === "bot" && last.pending) {
            copy[copy.length - 1] = { ...last, text: snapshot };
          }
          return copy;
        });
      };

      const handleLine = (line: string) => {
        const t = line.trim();
        if (!t.startsWith("data:")) return;
        let json: { token?: string; done?: ChatDonePayload };
        try {
          json = JSON.parse(t.slice(5));
        } catch {
          return;
        }
        if (typeof json.token === "string") appendToken(json.token);
        if (json.done) doneBox.push(json.done);
      };

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) handleLine(line);
        if (!alive()) {
          try {
            await reader.cancel();
          } catch {
            /* already closed */
          }
          break;
        }
      }
      if (buf.trim()) handleLine(buf.trim());
      if (!alive()) return;
      finishTyping();
      const donePayload = doneBox[doneBox.length - 1] ?? null;
      if (!donePayload) throw new Error("no_done");

      // Replace the pending bubble with staged steps.
      const rawSteps: BotStep[] =
        donePayload.steps.length > 0
          ? donePayload.steps
          : [{ text: streamed || "Hmm, that came back empty — try again?" }];
      setMessages((m) => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        if (last && last.role === "bot" && last.pending) {
          copy[copy.length - 1] = { role: "bot", text: rawSteps[0].text };
        } else {
          copy.push({ role: "bot", text: rawSteps[0].text });
        }
        return copy;
      });
      replyClock.current = Date.now();
      const firstAction = rawSteps[0].action;
      if (firstAction) {
        window.setTimeout(() => {
          if (alive()) executeBotAction(firstAction);
        }, 350);
      }
      for (let i = 1; i < rawSteps.length; i++) {
        await new Promise((r) => setTimeout(r, 900));
        if (!alive()) return;
        const step = rawSteps[i];
        setMessages((m) => [...m, { role: "bot", text: step.text }]);
        replyClock.current = Date.now();
        if (step.action) {
          await new Promise((r) => setTimeout(r, 350));
          if (!alive()) return;
          executeBotAction(step.action);
        }
      }
      if (alive()) setFollowups(donePayload.followups ?? []);
    } catch {
      if (!alive()) return;
      finishTyping();
      const offline =
        "I'm offline right now — try the links above, or email pulakpj9@gmail.com and he'll reply fast.";
      setMessages((m) => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        if (last && last.role === "bot" && last.pending) {
          copy[copy.length - 1] = { role: "bot", text: offline };
        } else {
          copy.push({ role: "bot", text: offline });
        }
        return copy;
      });
      replyClock.current = Date.now();
    }
  };

  return (
    <div className="fixed bottom-5 right-4 z-50 flex flex-col items-end gap-3 sm:right-6">
      {/* First-visit label */}
      <div
        className={cn(
          "pointer-events-auto relative max-w-[260px] rounded-2xl border border-border bg-card p-3.5 pr-8 text-sm leading-relaxed text-card-foreground shadow-lg transition-all duration-500",
          mounted && showBanner
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0",
        )}
      >
        <Sparkles className="mb-1 h-4 w-4 text-primary" />
        <p>{BANNER_TEXT}</p>
        <button
          onClick={dismissBanner}
          aria-label="Dismiss"
          className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        {/* Arrow pointing at the robot */}
        <div className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 border-b border-r border-border bg-card/90" />
      </div>

      {/* Chat panel */}
      <div
        className={cn(
          "pointer-events-auto flex w-[min(calc(100vw-2rem),22rem)] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl transition-all duration-300",
          open
            ? "h-[26rem] translate-y-0 opacity-100 sm:h-[28rem]"
            : "pointer-events-none h-0 border-0 opacity-0",
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-primary/10 to-transparent px-4 py-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xl">
            <span className="leading-none">🤖</span>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              Pulak Mini
            </p>
            <p className="text-xs text-muted-foreground">Online · replies instantly</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4"
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[82%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                msg.role === "user"
                  ? "self-end rounded-br-md bg-primary text-primary-foreground"
                  : "self-start rounded-bl-md border border-border bg-muted text-foreground",
              )}
            >
              {msg.text}
            </div>
          ))}
          {typing && (
            <div className="flex items-center gap-1 self-start rounded-2xl rounded-bl-md border border-border bg-muted px-4 py-3">
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground"
                  style={{ animationDelay: `${dot * 150}ms` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Follow-up replies: server-suggested after each answer,
            static quick replies at conversation start */}
        {(() => {
          const chips =
            followups.length > 0
              ? followups
              : messages.length <= 1
                ? QUICK_REPLIES
                : [];
          if (chips.length === 0) return null;
          return (
            <div className="flex flex-wrap gap-2 px-4 pb-2">
              {chips.map((q) => (
                <button
                  key={q}
                  onClick={() => void send(q)}
                  disabled={typing}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          );
        })()}

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-border p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about Pulak…"
            aria-label="Message"
            className="h-10 flex-1 rounded-full border border-border bg-muted/50 px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={!input.trim() || typing}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:shadow-md disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Proactive teaser: dwell-triggered, one click starts the tour */}
      {teaser && !open && (
        <div className="pointer-events-auto relative max-w-[260px] rounded-2xl border border-primary/30 bg-card p-3.5 pr-8 text-sm leading-relaxed text-card-foreground shadow-xl shadow-primary/10 transition-all duration-500">
          <Sparkles className="mb-1 h-4 w-4 text-primary" />
          <p>{teaser.teaser}</p>
          <button
            onClick={() => {
              const opener = teaser.opener;
              setTeaser(null);
              setOpen(true);
              tracker.track("chat_open");
              replyClock.current = Date.now();
              void send(opener);
            }}
            className="mt-2.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:shadow-md hover:shadow-primary/25"
          >
            Show me →
          </button>
          <button
            onClick={() => setTeaser(null)}
            aria-label="Dismiss suggestion"
            className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 border-b border-r border-primary/30 bg-card" />
        </div>
      )}

      {/* Launcher button */}
      <button
        onClick={handleToggle}
        aria-label={open ? "Close Pulak Mini" : "Open Pulak Mini"}
        aria-expanded={open}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30"
      >
        <span className="text-2xl leading-none transition-transform duration-300 group-hover:scale-110">🤖</span>
        {!open && (
          <span className="absolute right-0 top-0 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-500" />
          </span>
        )}
      </button>
    </div>
  );
}