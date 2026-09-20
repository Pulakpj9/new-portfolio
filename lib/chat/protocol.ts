/* Bot↔client action protocol (v1). Server emits descriptors only — the client
   validates against an allowlist and executes (see lib/chat/actions.ts).
   Unknown action types are ignored, never thrown into chat UI. */

export type BotAction =
  | { type: "scroll"; target: string }
  | { type: "expand"; kind: "case-study"; slug: string }
  | { type: "highlight"; kind: "project" | "case-study"; slug: string }
  | { type: "suggest_contact"; method: "email" | "call" };

export interface BotStep {
  text: string;
  action?: BotAction;
}

export interface ChatDonePayload {
  steps: BotStep[];
  followups: string[];
  fallback: boolean;
  fallback_reason?: "no_key" | "provider_error" | "timeout";
  usage?: { input: number; output: number };
}
