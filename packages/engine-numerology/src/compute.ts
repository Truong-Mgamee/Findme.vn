import type { BirthInput, Confidence, EngineWarning, ReadingEngineOutput } from '@findme/engine-core';
import { birthday, karmicDebt, lifePath, maturity, nameNumbers } from './core.js';
import { challenges, personalDay, personalMonth, personalYear, pinnacles } from './cycles.js';
import { parseDate, todayLocal } from './date.js';
import {
  WARN_NAME_BIRTH_MISSING_USING_CURRENT,
  WARN_NAME_MISSING,
  WARN_NAME_SCRIPT_UNSUPPORTED,
  normalizeName,
} from './normalize.js';
import type { NameNumbers, NumerologyInput, NumerologyNumber, NumerologyResult } from './types.js';

export const ENGINE_ID = 'numerology';
export const ENGINE_VERSION = '1.0.0';

export function computeNumerology(input: NumerologyInput): NumerologyResult {
  const system = input.system ?? 'pythagorean';
  const nameOrder = input.nameOrder ?? 'given-first';
  const birth = parseDate(input.birthDate);
  const refDate = input.refDate ?? todayLocal();
  const ref = parseDate(refDate);
  const warnings: EngineWarning[] = [];

  const lp = lifePath(birth);
  const bd = birthday(birth);

  // --- names -------------------------------------------------------------
  let birthName: NameNumbers | null = null;
  let currentName: NameNumbers | null = null;
  let nameSupported = false;

  const tryName = (raw: string | undefined, label: string): NameNumbers | null => {
    if (raw === undefined || raw.trim() === '') return null;
    const norm = normalizeName(raw);
    for (const w of norm.warnings) warnings.push({ code: w.code, message: `${label}: ${w.message}` });
    if (norm.letters.length === 0) return null;
    return nameNumbers(raw, { system, nameOrder });
  };

  birthName = tryName(input.fullName, 'fullName');
  currentName = tryName(input.currentName, 'currentName');

  if (!birthName && currentName && input.fullName === undefined) {
    warnings.push({
      code: WARN_NAME_BIRTH_MISSING_USING_CURRENT,
      message: 'No birth name given; name numbers computed from currentName.',
    });
    birthName = currentName;
    currentName = null;
  }
  if (!birthName && input.fullName === undefined && input.currentName === undefined) {
    warnings.push({ code: WARN_NAME_MISSING, message: 'No name given; name-based numbers omitted.' });
  }
  nameSupported = birthName !== null;

  const expr = birthName?.expression ?? null;
  const mat = expr ? maturity(lp, expr) : null;

  // --- cycles ------------------------------------------------------------
  const py = personalYear(birth, ref.year);
  const pm = personalMonth(birth, ref);
  const pd = personalDay(birth, ref);

  const masters = new Set<number>();
  const collect = (n: NumerologyNumber | null | undefined) => {
    if (n?.isMaster) masters.add(n.value);
  };
  collect(lp);
  collect(bd);
  collect(expr);
  collect(birthName?.soulUrge);
  collect(birthName?.personality);
  collect(mat);

  return {
    system,
    birthDate: input.birthDate,
    refDate,
    nameOrder,
    lifePath: lp,
    birthday: bd,
    expression: expr,
    soulUrge: birthName?.soulUrge ?? null,
    personality: birthName?.personality ?? null,
    maturity: mat,
    hiddenPassion: birthName?.hiddenPassion ?? null,
    cornerstone: birthName?.cornerstone ?? null,
    capstone: birthName?.capstone ?? null,
    nameLetters: birthName?.letters ?? null,
    personalYear: py,
    personalMonth: pm,
    personalDay: pd,
    challenges: challenges(birth, lp.value),
    pinnacles: pinnacles(birth, lp.value),
    karmicDebt: karmicDebt({ lifePath: lp, expression: expr, birthday: bd }),
    masters: [...masters].sort((a, b) => a - b),
    currentName,
    nameSupported,
    warnings,
  };
}

/** Convenience: build a numerology input from the shared BirthInput. */
export function computeNumerologyFromBirth(
  birth: BirthInput,
  opts: Omit<NumerologyInput, 'birthDate'> = {},
): NumerologyResult {
  return computeNumerology({ ...opts, birthDate: birth.date });
}

/**
 * content_atoms keys in display order:
 *   numerology.lifepath.N, .expression.N, .soulurge.N, .personality.N, .birthday.N, .maturity.N,
 *   .personalyear.N, .personalmonth.N, .personalday.N, .karmic.13|14|16|19, .master.11|22|33
 */
export function atomKeysForNumerology(result: NumerologyResult): string[] {
  const keys: string[] = [];
  const push = (slug: string, n: NumerologyNumber | null | undefined) => {
    if (n) keys.push(`numerology.${slug}.${n.value}`);
  };
  push('lifepath', result.lifePath);
  push('expression', result.expression);
  push('soulurge', result.soulUrge);
  push('personality', result.personality);
  push('birthday', result.birthday);
  push('maturity', result.maturity);
  push('personalyear', result.personalYear);
  push('personalmonth', result.personalMonth);
  push('personalday', result.personalDay);
  for (const k of result.karmicDebt) keys.push(`numerology.karmic.${k.number}`);
  for (const m of result.masters) keys.push(`numerology.master.${m}`);
  return [...new Set(keys)];
}

export function toEngineOutput(result: NumerologyResult): ReadingEngineOutput<NumerologyResult> {
  const nameProblem =
    !result.nameSupported || result.warnings.some((w) => w.code === WARN_NAME_SCRIPT_UNSUPPORTED);
  const confidence: Confidence = nameProblem ? 'medium' : 'high';
  return {
    engine: ENGINE_ID,
    engineVersion: ENGINE_VERSION,
    facts: result,
    atomKeys: atomKeysForNumerology(result),
    confidence,
    warnings: result.warnings,
  };
}
