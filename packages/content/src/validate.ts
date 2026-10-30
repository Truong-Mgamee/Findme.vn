import { HexagramSetSchema, TarotDeckSchema } from './schemas.js';

export interface ValidationResult {
  ok: boolean;
  issues: string[];
}

function format(name: string, result: { success: boolean; error?: { issues: Array<{ path: PropertyKey[]; message: string }> } }): string[] {
  if (result.success) return [];
  return (result.error?.issues ?? []).map((i) => `${name}: ${i.path.join('.') || '<root>'}: ${i.message}`);
}

/** Validate both datasets; pure function so it can run in tests or scripts. */
export function validateDatasets(input: { tarot: unknown; iching: unknown }): ValidationResult {
  const issues = [...format('tarot', TarotDeckSchema.safeParse(input.tarot)), ...format('iching', HexagramSetSchema.safeParse(input.iching))];
  return { ok: issues.length === 0, issues };
}
