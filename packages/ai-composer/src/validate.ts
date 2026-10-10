import type { ReadingOutput, Atom } from './schema.js';

export interface ValidationProblem {
  code: 'UNKNOWN_ATOM_REF' | 'EMPTY_ATOM_REFS' | 'FORBIDDEN_TOPIC' | 'FOREIGN_TERM';
  detail: string;
}

const FORBIDDEN = [/\b(diagnos|chemotherapy|lawsuit|sue\b|buy (the )?stock|short (the )?stock|you will die|death (is|will))/i, /(chẩn đoán|kiện tụng|mua cổ phiếu|sẽ chết|tử vong)/i];

/**
 * Structural + grounding checks. `knownTerms` lets callers pass the glossary vocabulary of the
 * tradition; any term from `foreignTerms` (names not present in facts) found in bodies is flagged.
 */
export function validateReading(out: ReadingOutput, atoms: Atom[], foreignTerms: string[] = []): ValidationProblem[] {
  const problems: ValidationProblem[] = [];
  const keys = new Set(atoms.map((a) => a.key));
  for (const s of out.sections) {
    if (!s.atomRefs.length) problems.push({ code: 'EMPTY_ATOM_REFS', detail: s.title });
    for (const r of s.atomRefs) if (!keys.has(r)) problems.push({ code: 'UNKNOWN_ATOM_REF', detail: `${s.title}: ${r}` });
  }
  const text = [out.summary, ...out.sections.map((s) => s.body), ...out.actions].join('\n');
  for (const re of FORBIDDEN) if (re.test(text)) problems.push({ code: 'FORBIDDEN_TOPIC', detail: re.source });
  for (const t of foreignTerms) if (t && text.includes(t)) problems.push({ code: 'FOREIGN_TERM', detail: t });
  return problems;
}
