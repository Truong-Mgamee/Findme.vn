/** USD per million tokens (Anthropic first-party API, 2026-10). */
export const PRICES: Record<string, { input: number; output: number; cacheRead: number }> = {
  'claude-opus-5-5': { input: 4, output: 20, cacheRead: 0.2 },
  'claude-sonnet-5-5': { input: 2, output: 10, cacheRead: 0.2 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5, cacheRead: 0.01 },
};

export interface Usage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

export function estimateCostUsd(model: string, usage: Usage): number {
  const p = PRICES[model] ?? PRICES['claude-opus-5-5']!;
  const cached = usage.cache_read_input_tokens ?? 0;
  const created = usage.cache_creation_input_tokens ?? 0;
  const fresh = Math.max(0, usage.input_tokens);
  return (fresh * p.input + created * p.input * 1.25 + cached * p.cacheRead + usage.output_tokens * p.output) / 1_000_000;
}
