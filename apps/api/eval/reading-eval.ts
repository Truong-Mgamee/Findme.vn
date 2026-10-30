/**
 * LLM-as-judge eval for the reading composer (P8 §6). Requires ANTHROPIC_API_KEY.
 *   pnpm --filter @findme/api exec tsx eval/reading-eval.ts [--locale vi,en] [--cases 10] [--out eval/report.json]
 * Each case: run the engine for a golden profile, compose with the real model, then ask a judge
 * model to score {facts_correct, no_hallucination, tone, actionable, disclaimer} 1–5 against the FACTS.
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import type { BirthInput, Locale, ReadingKind } from '@findme/engine-core';
import { composeReading, templateReading, type Atom } from '@findme/ai-composer';
import { computeBazi, toEngineOutput as baziOut } from '@findme/engine-bazi';
import { computeZiwei, toEngineOutput as ziweiOut } from '@findme/engine-ziwei';
import { computeNumerology, toEngineOutput as numOut } from '@findme/engine-numerology';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1] ?? 'true'] : [])).filter((x) => x.length));
const locales = String(args.locale ?? 'vi,en').split(',') as Locale[];
const maxCases = Number(args.cases ?? 6);
const out = String(args.out ?? 'eval/report.json');

const PLACES = [
  { name: 'Hà Nội', lat: 21.0285, lng: 105.8542, tz: 'Asia/Ho_Chi_Minh', country: 'VN' },
  { name: 'New York', lat: 40.7128, lng: -74.006, tz: 'America/New_York', country: 'US' },
  { name: 'Taipei', lat: 25.033, lng: 121.5654, tz: 'Asia/Taipei', country: 'TW' },
];
const CASES: Array<{ kind: ReadingKind; birth: BirthInput }> = [
  { kind: 'ziwei_full', birth: { date: '1997-12-24', time: '12:00', timeUnknown: false, gender: 'female', place: PLACES[0]!, calendarStandard: 'vn' } },
  { kind: 'bazi_luck', birth: { date: '1988-09-17', time: '00:20', timeUnknown: false, gender: 'male', place: PLACES[2]!, calendarStandard: 'cn' } },
  { kind: 'numerology_full', birth: { date: '1990-05-15', time: '08:30', timeUnknown: false, gender: 'female', place: PLACES[1]!, calendarStandard: 'cn' } },
  { kind: 'ziwei_full', birth: { date: '1969-07-20', timeUnknown: true, gender: 'male', place: PLACES[0]!, calendarStandard: 'vn' } },
  { kind: 'bazi_luck', birth: { date: '2001-12-25', time: '09:10', timeUnknown: false, gender: 'other', place: PLACES[1]!, calendarStandard: 'cn' } },
  { kind: 'numerology_full', birth: { date: '1985-01-21', time: '10:00', timeUnknown: false, gender: 'female', place: PLACES[0]!, calendarStandard: 'vn' } },
];

const JudgeSchema = z.object({
  facts_correct: z.number().min(1).max(5),
  no_hallucination: z.number().min(1).max(5),
  tone: z.number().min(1).max(5),
  actionable: z.number().min(1).max(5),
  disclaimer: z.number().min(1).max(5),
  notes: z.string(),
});

function engineFor(kind: ReadingKind, birth: BirthInput, locale: Locale) {
  if (kind === 'ziwei_full') return ziweiOut(computeZiwei(birth, { locale }));
  if (kind === 'bazi_luck') return baziOut(computeBazi(birth, { locale, now: new Date().toISOString().slice(0, 10) }));
  return numOut(computeNumerology({ birthDate: birth.date, fullName: 'Nguyen Van An' }));
}

/** Placeholder atoms: in production these come from content_atoms; here we synthesise titles so the judge can check grounding. */
function atomsFor(keys: string[]): Atom[] {
  return keys.slice(0, 12).map((key) => ({ key, title: key, body: `(curated meaning for ${key})` }));
}

const client = new Anthropic();
const results: unknown[] = [];
let n = 0;
for (const locale of locales) {
  for (const c of CASES.slice(0, maxCases)) {
    n++;
    const eng = engineFor(c.kind, c.birth, locale);
    const atoms = atomsFor(eng.atomKeys);
    const facts = { kind: c.kind, confidence: eng.confidence, warnings: eng.warnings, facts: eng.facts };
    const composed = await composeReading({ kind: c.kind, locale, facts, atoms }, { client });
    const reading = composed.usedFallbackTemplate ? templateReading(atoms, locale) : composed.reading;
    const judge = await client.messages.parse({
      model: 'claude-opus-5-5',
      max_tokens: 2000,
      system: 'You are a strict reviewer of metaphysics readings. Score 1–5 each criterion. facts_correct: statements match FACTS; no_hallucination: nothing beyond FACTS/ATOMS; tone: warm, non-absolute, no fear; actionable: concrete small steps; disclaimer: present and honest. Low confidence FACTS must be acknowledged.',
      messages: [{ role: 'user', content: `FACTS:\n${JSON.stringify(facts)}\n\nATOMS:\n${JSON.stringify(atoms)}\n\nREADING:\n${JSON.stringify(reading)}` }],
      output_config: { format: zodOutputFormat(JudgeSchema), effort: 'medium' },
    });
    const score = judge.parsed_output;
    results.push({ locale, kind: c.kind, timeUnknown: c.birth.timeUnknown, attempts: composed.attempts, fallback: composed.usedFallbackTemplate, costUsd: composed.costUsd, score });
    console.log(`${n}. ${locale} ${c.kind} → ${score ? Object.values(score).filter((v) => typeof v === 'number').join('/') : 'no score'} (fallback=${composed.usedFallbackTemplate}, $${composed.costUsd.toFixed(3)})`);
  }
}
const scored = results as Array<{ score: z.infer<typeof JudgeSchema> | null }>;
const avg = (k: keyof z.infer<typeof JudgeSchema>) => scored.filter((r) => r.score).reduce((a, r) => a + Number(r.score![k]), 0) / Math.max(1, scored.filter((r) => r.score).length);
const summary = { cases: results.length, avg: { facts_correct: avg('facts_correct'), no_hallucination: avg('no_hallucination'), tone: avg('tone'), actionable: avg('actionable'), disclaimer: avg('disclaimer') } };
writeFileSync(out, JSON.stringify({ summary, results }, null, 2));
console.log(JSON.stringify(summary));
