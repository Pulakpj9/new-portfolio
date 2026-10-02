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
// Premium RPD is 20/day: evals run on the cheap model unless --full.
// Never compare pass rates across models.
// Pacing: free-tier RPM (15 on Lite) rate-limits bursts — space cases out.
// EVAL_DELAY_MS (default 5000), --fast to skip the delay.
const LITE = !process.argv.includes("--full");
const DELAY_MS = process.argv.includes("--fast")
  ? 0
  : Number(process.env.EVAL_DELAY_MS ?? 5000);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const cases = JSON.parse(readFileSync("evals/chat-evals.json", "utf8"));

function matchesAction(stepActions, expected) {
  // Array = any-of (navigation is a bonus for factual Q&A; null = no action OK).
  if (Array.isArray(expected)) return expected.some((o) => matchesAction(stepActions, o));
  if (expected === null) return stepActions.length === 0;
  return stepActions.some((a) => {
    if (!a || a.type !== expected.type) return false;
    if (expected.target && a.target !== expected.target) return false;
    if (expected.slug && a.slug !== expected.slug) return false;
    return true;
  });
}

async function runCase(c) {
  const started = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CASE_TIMEOUT_MS);
  const finish = (result) => ({ ...result, ms: Date.now() - started });
  try {
    const res = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lite: LITE,
        messages: [{ role: "user", content: c.q }],
      }),
      signal: ctrl.signal,
    });
    if (!res.ok || !res.body) return finish({ pass: false, reason: `http_${res.status}` });
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
    if (!doneLine) return finish({ pass: false, reason: "no_done_event" });
    const { steps, fallback, fallback_reason } = doneLine.done;
    const joined = steps.map((s) => s.text).join("\n").toLowerCase();
    const preview = steps
      .map((s) => s.text)
      .join(" / ")
      .slice(0, 300);
    // String = must contain; array = any-of variants (e.g. "1M" vs "1 million").
    const hit = (s) =>
      Array.isArray(s)
        ? s.some((v) => joined.includes(String(v).toLowerCase()))
        : joined.includes(String(s).toLowerCase());
    const missing = (c.expect_contains ?? []).filter((s) => !hit(s));
    const actions = steps.map((s) => s.action).filter(Boolean);
    const actionOk = matchesAction(actions, c.expect_action ?? null);
    if (missing.length === 0 && actionOk)
      return finish({ pass: true, fallback: fallback ?? false });
    const reasons = [];
    if (fallback) reasons.push(`fallback:${fallback_reason ?? "?"}`);
    if (missing.length > 0) reasons.push(`missing: ${missing.join(", ")}`);
    if (!actionOk)
      reasons.push(`action: got ${JSON.stringify(actions)} want ${JSON.stringify(c.expect_action)}`);
    reasons.push(`said: "${preview}"`);
    return finish({
      pass: false,
      reason: reasons.join(" | "),
      steps,
      fallback: fallback ?? false,
      fallback_reason: fallback_reason ?? null,
    });
  } catch (e) {
    return finish({
      pass: false,
      reason: e?.name === "AbortError" ? "timeout" : String(e),
    });
  } finally {
    clearTimeout(timer);
  }
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
}

let passed = 0;
const results = [];
console.log(`eval model: ${LITE ? "lite (cheap quota)" : "FULL (premium quota)"}`);
for (const [i, c] of cases.entries()) {
  if (i > 0 && DELAY_MS > 0) await sleep(DELAY_MS);
  const r = await runCase(c);
  results.push(r);
  if (r.pass) {
    passed++;
    console.log(`PASS  ${c.q} (${r.ms}ms)`);
  } else {
    console.log(`FAIL  ${c.q}\n      ${r.reason}`);
  }
}
console.log(`\n${passed}/${cases.length} passed`);

const times = results.map((r) => r.ms).sort((a, b) => a - b);
const timeouts = results.filter((r) => /timeout/.test(r.reason ?? "")).length;
const fallbacks = results.filter((r) => r.fallback).length;
const quotas = results.filter((r) => /fallback:quota/.test(r.reason ?? "")).length;
console.log(
  `timing: p50=${percentile(times, 0.5)}ms p95=${percentile(times, 0.95)}ms | ` +
    `timeouts=${timeouts}/${results.length} fallbacks=${fallbacks}/${results.length} quota=${quotas}/${results.length}`,
);
if (timeouts / results.length > 0.3) {
  console.log(
    "NOTE: timeout share >30% — throttling dominates. Fix latency (tier/cache) before prompt work.",
  );
}
process.exit(passed === cases.length ? 0 : 1);
