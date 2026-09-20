/* Chat eval harness. Requires the dev server running with CHAT_API_KEY set:
 *   npm run dev  (in one terminal)
 *   npm run eval:chat
 * Checks answer substrings (case-insensitive) + expected navigation actions.
 * Advisory, not a gate: language models vary — investigate failures, and
 * update expectations when the model is right and the eval is wrong.
 */

import { readFileSync } from "node:fs";

const URL = process.env.CHAT_EVAL_URL ?? "http://localhost:3000/api/chat";
const CASE_TIMEOUT_MS = 45_000;

const cases = JSON.parse(readFileSync("evals/chat-evals.json", "utf8"));

function matchesAction(stepActions, expected) {
  if (expected === null) return stepActions.length === 0;
  return stepActions.some((a) => {
    if (!a || a.type !== expected.type) return false;
    if (expected.target && a.target !== expected.target) return false;
    if (expected.slug && a.slug !== expected.slug) return false;
    return true;
  });
}

async function runCase(c) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CASE_TIMEOUT_MS);
  try {
    const res = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: c.q }],
      }),
      signal: ctrl.signal,
    });
    if (!res.ok || !res.body) return { pass: false, reason: `http_${res.status}` };
    const text = await res.text();
    const doneLine = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.startsWith("data:"))
      .map((l) => {
        try {
          return JSON.parse(l.slice(5));
        } catch {
          return null;
        }
      })
      .find((j) => j && j.done);
    if (!doneLine) return { pass: false, reason: "no_done_event" };
    const { steps, fallback, fallback_reason } = doneLine.done;
    const joined = steps.map((s) => s.text).join("\n").toLowerCase();
    const preview = steps
      .map((s) => s.text)
      .join(" / ")
      .slice(0, 300);
    const missing = (c.expect_contains ?? []).filter(
      (s) => !joined.includes(String(s).toLowerCase()),
    );
    const actions = steps.map((s) => s.action).filter(Boolean);
    const actionOk = matchesAction(actions, c.expect_action ?? null);
    if (missing.length === 0 && actionOk) return { pass: true };
    const reasons = [];
    if (fallback) reasons.push(`fallback:${fallback_reason ?? "?"}`);
    if (missing.length > 0) reasons.push(`missing: ${missing.join(", ")}`);
    if (!actionOk)
      reasons.push(`action: got ${JSON.stringify(actions)} want ${JSON.stringify(c.expect_action)}`);
    reasons.push(`said: "${preview}"`);
    return { pass: false, reason: reasons.join(" | "), steps };
  } catch (e) {
    return { pass: false, reason: e?.name === "AbortError" ? "timeout" : String(e) };
  } finally {
    clearTimeout(timer);
  }
}

let passed = 0;
for (const c of cases) {
  const r = await runCase(c);
  if (r.pass) {
    passed++;
    console.log(`PASS  ${c.q}`);
  } else {
    console.log(`FAIL  ${c.q}\n      ${r.reason}`);
  }
}
console.log(`\n${passed}/${cases.length} passed`);
process.exit(passed === cases.length ? 0 : 1);
