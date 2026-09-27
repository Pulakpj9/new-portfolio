/* Chat spend math. Rates are documented assumptions for the default
   speed-tier model — verify current provider pricing periodically; the
   admin Usage tab shows the assumption next to every estimate. */

export const USD_PER_M_INPUT = 0.3;
export const USD_PER_M_OUTPUT = 2.5;

export function estimateCostUsd(inputTokens: number, outputTokens: number): number {
  return (inputTokens * USD_PER_M_INPUT + outputTokens * USD_PER_M_OUTPUT) / 1_000_000;
}

export function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n < 0.01) return "<$0.01";
  return `$${n.toFixed(2)}`;
}
