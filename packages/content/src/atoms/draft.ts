/**
 * LLM drafting of meaning atoms. One request = up to 20 keys, structured output via zodOutputFormat
 * (same approach as packages/ai-composer/src/compose.ts). Drafts are written with status 'draft',
 * author 'llm-draft'; a human reviewer promotes them later. Idempotent: existing key@locale are skipped.
 */
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { describeKey, type KeyBrief } from './describe.js';
import { loadGlossaryRows } from './glossary.js';
import { keysForTradition } from './keys.js';
import { atomId, type Atom, type Tradition } from './schema.js';
import { CONTENT_ROOT, atomsFile, readAtomsFile, upsertAtoms } from './store.js';

export const DRAFT_MODEL = 'claude-opus-5-5';
/** USD per million tokens for the draft model (input / output). */
export const DRAFT_PRICE = { input: 4, output: 20 } as const;
export const DRAFT_BATCH_SIZE = 20;
/** Rough planning numbers used before a request is sent (chars per token, expected output per atom). */
const CHARS_PER_TOKEN = 3.2;
const OUTPUT_TOKENS_PER_ATOM = 260;

export const DraftBatchSchema = z.object({
  atoms: z.array(
    z.object({
      key: z.string(),
      title: z.string().min(1).max(120),
      body_md: z.string().min(1),
    }),
  ),
});
export type DraftBatch = z.infer<typeof DraftBatchSchema>;

export interface Usage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

/** Minimal client surface so tests can inject a fake. */
export interface DraftClient {
  messages: { create: (params: Anthropic.MessageCreateParamsNonStreaming) => Promise<unknown> };
}

export interface DraftOptions {
  tradition: Tradition;
  locale: string;
  /** subset of keys; defaults to the full manifest for the tradition */
  keys?: string[];
  /** hard budget; drafting stops before a batch whose estimated cost would exceed it */
  maxUsd: number;
  client?: DraftClient;
  model?: string;
  batchSize?: number;
  /** content root (atoms/, tone/, glossary.csv). Tests use a temp dir. */
  root?: string;
  /** build prompts and plan batches but do not call the model or write files */
  dryRun?: boolean;
  log?: (line: string) => void;
  now?: () => Date;
}

export interface DraftSummary {
  tradition: Tradition;
  locale: string;
  model: string;
  requested: number;
  skippedExisting: number;
  batches: number;
  drafted: number;
  rejected: Array<{ key: string; reason: string }>;
  usage: Usage;
  costUsd: number;
  stoppedForBudget: boolean;
  files: string[];
}

export function estimateDraftCostUsd(usage: Usage, price = DRAFT_PRICE): number {
  return (Math.max(0, usage.input_tokens) * price.input + Math.max(0, usage.output_tokens) * price.output) / 1_000_000;
}

export function loadToneGuide(locale: string, root = CONTENT_ROOT): string {
  const own = join(root, 'tone', `${locale}.md`);
  const path = existsSync(own) ? own : join(root, 'tone', 'en.md');
  return existsSync(path) ? readFileSync(path, 'utf8').trim() : '';
}

const LANGUAGE: Record<string, string> = { vi: 'Vietnamese', en: 'English', ja: 'Japanese', ko: 'Korean', 'zh-TW': 'Traditional Chinese' };

/** Glossary rows whose term_key is used by the briefs (plus a few always-on basics), rendered as `han → locale`. */
export function glossarySubset(briefs: KeyBrief[], locale: string, root = CONTENT_ROOT): string {
  const wanted = new Set(briefs.flatMap((b) => b.terms));
  const rows = loadGlossaryRows(root).filter((r) => wanted.has(r.term_key));
  const col = (['vi', 'en', 'zh-TW', 'ja', 'ko'] as const).includes(locale as never) ? (locale as 'vi' | 'en' | 'zh-TW' | 'ja' | 'ko') : 'en';
  return rows.map((r) => `- ${r.term_key}: ${r[col]}${r.han && r.han !== r[col] ? ` (${r.han})` : ''}${col !== 'en' ? ` [en: ${r.en}]` : ''}`).join('\n');
}

/** Stable system prompt per (tradition, locale, glossary subset) — volatile keys go in the user message. */
export function buildDraftSystemPrompt(tradition: Tradition, locale: string, toneGuide: string, glossaryLines: string): string {
  const lang = LANGUAGE[locale] ?? locale;
  return [
    `You write "meaning atoms" for a metaphysics app: short, reusable explanations of one symbolic key each, in ${lang}. Tradition: ${tradition}.`,
    'RULES:',
    '1. For every key in the request, write the GENERIC meaning of that key only — not a reading for a specific person, not a combination with other factors.',
    '2. 60–140 words per body. Plain prose, at most two short paragraphs, markdown allowed but no headings, no lists longer than three items.',
    '3. No predictions of concrete events, no absolutes ("will", "never", "certainly"), no death/accident/illness talk. Describe tendencies, strengths, blind spots.',
    '4. No medical, legal or financial specifics (no diagnoses, no lawsuits, no "buy/sell"). Suggest a professional when the topic drifts there.',
    '5. End every body with ONE practical, small nudge the reader can act on this week.',
    '6. Use the GLOSSARY terms exactly as given; if a REFERENCE excerpt is provided, stay faithful to it but rewrite in your own words (never quote Waite/Legge verbatim).',
    `7. Write entirely in ${lang}. The title is 2–8 words naming the key in ${lang}.`,
    '8. Return exactly one atom per requested key, with the key copied verbatim. Never add keys.',
    toneGuide ? `TONE GUIDE:\n${toneGuide}` : '',
    glossaryLines ? `GLOSSARY:\n${glossaryLines}` : '',
    'OUTPUT: JSON matching the provided schema.',
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function buildDraftUserMessage(briefs: KeyBrief[]): string {
  return ['KEYS (write one atom per key, in this order):', ...briefs.map((b, i) => `${i + 1}. key: ${b.key}\n   suggested title: ${b.title}\n   reference: ${b.reference}`)].join('\n');
}

type MessageLike = { content: Array<{ type: string; text?: string }>; usage: Usage; stop_reason: string | null };
const textOf = (m: MessageLike) => m.content.filter((b) => b.type === 'text').map((b) => b.text ?? '').join('');

export function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function draftAtoms(opts: DraftOptions): Promise<DraftSummary> {
  const root = opts.root ?? CONTENT_ROOT;
  const model = opts.model ?? DRAFT_MODEL;
  const batchSize = opts.batchSize ?? DRAFT_BATCH_SIZE;
  const log = opts.log ?? (() => undefined);
  const now = opts.now ?? (() => new Date());
  const all = keysForTradition(opts.tradition);
  const allSet = new Set(all);
  const requested = (opts.keys ?? all).filter((k) => {
    if (!allSet.has(k)) log(`skip ${k}: not in manifest for ${opts.tradition}`);
    return allSet.has(k);
  });
  const existing = new Set(readAtomsFile(atomsFile(opts.tradition, opts.locale, root)).map((a) => a.key));
  const todo = requested.filter((k) => !existing.has(k));
  const summary: DraftSummary = {
    tradition: opts.tradition, locale: opts.locale, model, requested: requested.length, skippedExisting: requested.length - todo.length,
    batches: 0, drafted: 0, rejected: [], usage: { input_tokens: 0, output_tokens: 0 }, costUsd: 0, stoppedForBudget: false, files: [],
  };
  if (!todo.length) {
    log(`nothing to draft for ${opts.tradition}/${opts.locale} (${summary.skippedExisting} already exist)`);
    return summary;
  }
  const client = opts.client ?? (opts.dryRun ? undefined : new Anthropic());
  const tone = loadToneGuide(opts.locale, root);
  const files = new Set<string>();

  for (const keys of chunk(todo, batchSize)) {
    const briefs = keys.map((k) => describeKey(k, opts.locale, root));
    const system = buildDraftSystemPrompt(opts.tradition, opts.locale, tone, glossarySubset(briefs, opts.locale, root));
    const user = buildDraftUserMessage(briefs);
    const estInput = Math.ceil((system.length + user.length) / CHARS_PER_TOKEN);
    // Plan with the larger of the static estimate and the observed average batch cost so far.
    const observed = summary.batches ? summary.costUsd / summary.batches : 0;
    const estCost = Math.max(observed, estimateDraftCostUsd({ input_tokens: estInput, output_tokens: keys.length * OUTPUT_TOKENS_PER_ATOM }));
    if (summary.costUsd + estCost > opts.maxUsd) {
      summary.stoppedForBudget = true;
      log(`budget stop: spent $${summary.costUsd.toFixed(4)}, next batch ≈ $${estCost.toFixed(4)} > max $${opts.maxUsd}`);
      break;
    }
    if (opts.dryRun || !client) {
      log(`[dry-run] batch of ${keys.length} keys (≈${estInput} input tokens, ≈$${estCost.toFixed(4)})`);
      summary.batches++;
      continue;
    }
    const params: Anthropic.MessageCreateParamsNonStreaming = {
      model,
      max_tokens: Math.min(16000, keys.length * 400 + 500),
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: user }],
      output_config: { format: zodOutputFormat(DraftBatchSchema), effort: 'medium' },
    };
    const msg = (await client.messages.create(params)) as MessageLike;
    summary.batches++;
    summary.usage.input_tokens += msg.usage.input_tokens;
    summary.usage.output_tokens += msg.usage.output_tokens;
    summary.costUsd = estimateDraftCostUsd(summary.usage);
    if (msg.stop_reason === 'refusal') {
      for (const k of keys) summary.rejected.push({ key: k, reason: 'refusal' });
      continue;
    }
    let parsed: DraftBatch | null = null;
    try {
      parsed = DraftBatchSchema.parse(JSON.parse(textOf(msg)));
    } catch (e) {
      for (const k of keys) summary.rejected.push({ key: k, reason: `unparseable output: ${(e as Error).message.slice(0, 80)}` });
      continue;
    }
    const wanted = new Set(keys);
    const got = new Set<string>();
    const atoms: Atom[] = [];
    const ts = now().toISOString();
    for (const a of parsed.atoms) {
      if (!wanted.has(a.key)) {
        summary.rejected.push({ key: a.key, reason: 'key not requested' });
        continue;
      }
      if (got.has(a.key)) continue;
      const words = countWords(a.body_md);
      if (words < 40 || words > 200) {
        summary.rejected.push({ key: a.key, reason: `body ${words} words (want 60–140)` });
        continue;
      }
      got.add(a.key);
      atoms.push({
        id: atomId(a.key, opts.locale, 1), tradition: opts.tradition, key: a.key, locale: opts.locale, title: a.title.trim(), body_md: a.body_md.trim(),
        tone: `tone/${opts.locale}.md`, source_ref: `llm:${model}; brief:${briefs.find((b) => b.key === a.key)?.reference.slice(0, 60) ?? ''}`,
        author: 'llm-draft', status: 'draft', version: 1, updated_at: ts,
      });
    }
    for (const k of keys) if (!got.has(k) && !summary.rejected.some((r) => r.key === k)) summary.rejected.push({ key: k, reason: 'missing from output' });
    if (atoms.length) {
      const r = upsertAtoms(atoms, { root });
      r.files.forEach((f) => files.add(f));
      summary.drafted += atoms.length;
    }
    log(`batch ${summary.batches}: ${atoms.length}/${keys.length} atoms, total $${summary.costUsd.toFixed(4)}`);
  }
  summary.files = [...files];
  return summary;
}

export function formatDraftSummary(s: DraftSummary): string {
  return [
    `draft ${s.tradition}/${s.locale} (${s.model})`,
    `  requested ${s.requested}, skipped existing ${s.skippedExisting}, batches ${s.batches}, drafted ${s.drafted}, rejected ${s.rejected.length}`,
    `  tokens in ${s.usage.input_tokens} / out ${s.usage.output_tokens}, cost $${s.costUsd.toFixed(4)}${s.stoppedForBudget ? ' (stopped: budget)' : ''}`,
    ...(s.rejected.length ? ['  rejected:', ...s.rejected.slice(0, 20).map((r) => `    - ${r.key}: ${r.reason}`)] : []),
    ...(s.files.length ? [`  files: ${s.files.join(', ')}`] : []),
  ].join('\n');
}
