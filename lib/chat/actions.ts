/* Client-side executor for bot actions (see lib/chat/protocol.ts).
   Server emits descriptors; this validates against the live DOM and runs them.
   Everything is failure-silent — a failed scroll must never break the chat. */

"use client";

import type { BotAction } from "./protocol";

type Expander = (slug: string) => void;

let expander: Expander | null = null;

/** Page root registers how case studies open; the bot only ever opens. */
export function registerCaseStudyExpander(fn: Expander | null): void {
  expander = fn;
}

function smoothScrollTo(el: Element): void {
  try {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch {
    try {
      el.scrollIntoView();
    } catch {
      /* ignore */
    }
  }
}

export function executeBotAction(action: BotAction): void {
  try {
    switch (action.type) {
      case "scroll": {
        if (action.target === "top") {
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        if (!/^#[a-z0-9-]+$/i.test(action.target)) return;
        const el = document.querySelector(action.target);
        if (el) smoothScrollTo(el);
        return;
      }
      case "expand": {
        if (action.kind !== "case-study" || !action.slug) return;
        expander?.(action.slug);
        // Let the accordion paint before scrolling it into view.
        window.setTimeout(() => {
          document
            .getElementById("case-studies")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 220);
        return;
      }
      case "highlight": {
        if (!action.slug) return;
        const el = document.querySelector(
          `[data-content="${action.kind}:${action.slug}"]`,
        );
        if (!(el instanceof HTMLElement)) return;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("bot-highlight");
        window.setTimeout(() => el.classList.remove("bot-highlight"), 2600);
        return;
      }
      case "suggest_contact": {
        document
          .getElementById("contact")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      default:
        return;
    }
  } catch {
    /* never break the chat */
  }
}
