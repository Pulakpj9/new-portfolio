"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "bot";
  text: string;
}

const QUICK_REPLIES = ["About Pulak", "Skills", "Projects", "Contact"];

const BANNER_TEXT =
  "Looking for work? Ask me anything about Pulak — I know him best! 🤖";

function botReply(input: string): string {
  const q = input.toLowerCase();
  if (/(skill|stack|tech|language|tools?)/.test(q)) {
    return "Pulak is a full-stack developer working with TypeScript, Next.js, React, Node.js, Express, MySQL, MongoDB, WebSockets, Docker and AWS. Backend is his playground!";
  }
  if (/(project|portfoli|built|work)/.test(q)) {
    return "Head to the Projects section — he has selected work with detailed case studies covering design, architecture and tricky problems. It's worth a scroll!";
  }
  if (/(experien|career|jobs?|roles?)/.test(q)) {
    return "Pulak is a backend-focused full-stack developer with hands-on experience in solution design and implementation. The Experience section has his full journey.";
  }
  if (/(contact|email|mail|reach|hire)/.test(q)) {
    return "Easy — drop him a line at pulakpj9@gmail.com, or use the Contact section at the bottom. He usually replies fast!";
  }
  if (/(about|who|pulak)/.test(q)) {
    return "Pulak Jain is a software developer who loves turning complex problems into clean, scalable products. He thinks like a backend engineer and ships like a product owner.";
  }
  if (/(hire|available|job|work)/.test(q)) {
    return "Yes — Pulak is actively looking for work! Check the Contact section or email pulakpj9@gmail.com to get the ball rolling. 🚀";
  }
  return "Hmm, I'm still a demo-bot so I may not have that answer yet. Try asking about his skills, experience, projects, or contact details — or just scroll the page!";
}

export function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "Hey! I'm Pulak's assistant 🤖 Ask me anything about him — skills, experience, projects, how to get in touch...",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
  }, [messages, typing, open]);

  const dismissBanner = () => {
    setShowBanner(false);
  };

  const handleToggle = () => {
    dismissBanner();
    setOpen((o) => !o);
  };

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "bot", text: botReply(trimmed) }]);
      setTyping(false);
    }, 650);
  };

  return (
    <div className="fixed bottom-5 right-4 z-50 flex flex-col items-end gap-3 sm:right-6">
      {/* First-visit label */}
      <div
        className={cn(
          "pointer-events-auto relative max-w-[260px] rounded-2xl border border-border bg-card/90 p-3.5 pr-8 text-sm leading-relaxed text-card-foreground shadow-lg backdrop-blur transition-all duration-500",
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
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              Pulak&apos;s Assistant
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

        {/* Quick replies */}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 px-4 pb-2">
            {QUICK_REPLIES.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                {q}
              </button>
            ))}
          </div>
        )}

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

      {/* Launcher button */}
      <button
        onClick={handleToggle}
        aria-label={open ? "Close assistant" : "Open assistant"}
        aria-expanded={open}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30"
      >
        <Bot className="h-7 w-7 transition-transform duration-300 group-hover:rotate-12" />
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