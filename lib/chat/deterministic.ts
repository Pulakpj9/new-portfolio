/* Deterministic navigation for explicit requests. The model is unreliable at
   emitting tool calls for "show/tell me about X" phrasings even when its text
   is perfect — so explicit navigation verbs resolve here, reproducibly, while
   the model keeps everything else. Model-emitted actions always win; this is
   the backstop, used only when the model navigates nowhere. */

import type { BotAction } from "./protocol";

const PROJECT_SLUGS = ["activity-tracker", "whatsapp-crm", "salesapp"];
const NAV_VERB = /(show|take me|open|go to|scroll|deep dive|tour|walk me through|explore|tell me about|what about)/i;

// Natural language rarely uses slugs verbatim ("activity tracker",
// "WhatsApp project"), so match aliases too. Exact slugs win.
const SLUG_ALIASES: Array<[string, string[]]> = [
  ["activity-tracker", ["activity tracker", "activitytracker", "webtracker", "web tracker"]],
  ["whatsapp-crm", ["whatsapp crm", "whatsappcrm", "whatsapp"]],
  ["salesapp", ["sales app", "salesapp"]],
];

function slugIn(text: string): string | null {
  const q = text.toLowerCase();
  const exact = PROJECT_SLUGS.find((s) => q.includes(s));
  if (exact) return exact;
  for (const [slug, aliases] of SLUG_ALIASES) {
    if (aliases.some((a) => q.includes(a))) return slug;
  }
  return null;
}

export function deterministicAction(userText: string): BotAction | null {
  const q = userText.toLowerCase();

  // Deep dives and stories open the case study.
  if (/deep dive|case stud|story behind|full story/.test(q)) {
    const slug = slugIn(q);
    if (slug) return { type: "expand", kind: "case-study", slug };
  }

  // Contact intent with a navigation verb goes to Contact.
  if (/(contact|email|hire|call|reach him|get in touch)/.test(q) && NAV_VERB.test(q)) {
    return { type: "suggest_contact", method: "email" };
  }

  // Implicit contact requests ("how do I…?", "where do I…?").
  if (/how do i|where (can|do) i/.test(q) && /(contact|email|reach|apply|resume)/.test(q)) {
    return { type: "suggest_contact", method: "email" };
  }

  // "Tell me about X" on a known piece of work highlights its card.
  if (/tell me about|what about/.test(q)) {
    const slug = slugIn(q);
    if (slug) return { type: "highlight", kind: "project", slug };
  }

  // "What did he build?" shows the work; "where does he work" shows the roles.
  if (/what did (he|you) build|what has he built|show.*(built|made)/.test(q)) {
    return { type: "scroll", target: "#projects" };
  }
  if (/where does (he|pulak) work|current (job|role|employer|company)/.test(q)) {
    return { type: "scroll", target: "#experience" };
  }

  // Section-level navigation requests.
  if (NAV_VERB.test(q)) {
    if (/project|work|built|portfolio/.test(q)) return { type: "scroll", target: "#projects" };
    if (/experience|career|role|job|work history/.test(q)) {
      // "work" overlaps with projects — prefer projects unless career words present.
      if (/experience|career|role|job|intern|company/.test(q)) {
        return { type: "scroll", target: "#experience" };
      }
      return { type: "scroll", target: "#projects" };
    }
    if (/skill|stack|tech/.test(q)) return { type: "scroll", target: "#about" };
    if (/contact|email|hire|touch/.test(q)) {
      return { type: "suggest_contact", method: "email" };
    }
  }

  return null;
}
