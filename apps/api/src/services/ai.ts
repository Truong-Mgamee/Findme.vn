/**
 * AI integration (P8): compute-then-explain. Engines produced `engine_json` + atomKeys; here we
 * load the matching published atoms, hand FACTS + ATOMS to @findme/ai-composer and persist the
 * structured narrative. When AI is disabled or budget is exhausted we still return a deterministic
 * template reading so the product never shows an empty screen.
 */
import { and, eq, inArray } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import type { Locale, ReadingKind } from '@findme/engine-core';
import { answerQuestion, composeReading, templateReading, type Atom, type ComposeResult, type ReadingOutput } from '@findme/ai-composer';
import type { Db } from '../db/client.js';
import { aiMessages, contentAtoms, glossary, readings, type Reading } from '../db/schema.js';
import type { KvStore } from '../lib/store.js';

export async function loadAtoms(db: Db, keys: string[], locale: Locale): Promise<Atom[]> {
  if (!keys.length) return [];
  const locales = locale === 'en' ? ['en'] : [locale, 'en'];
  const rows = await db
    .select()
    .from(contentAtoms)
    .where(and(inArray(contentAtoms.key, keys.slice(0, 60)), inArray(contentAtoms.locale, locales), eq(contentAtoms.status, 'published')));
  const out: Atom[] = [];
  for (const key of keys) {
    const pick = rows.filter((r) => r.key === key).sort((a, b) => (a.locale === locale ? -1 : 1) - (b.locale === locale ? -1 : 1) || b.version - a.version)[0];
    if (pick) out.push({ key, title: pick.title, body: pick.bodyMd });
  }
  return out;
}

export async function loadGlossary(db: Db, locale: Locale): Promise<Record<string, string>> {
  const rows = await db.select().from(glossary).where(eq(glossary.locale, locale)).limit(400);
  return Object.fromEntries(rows.map((r) => [r.term, r.note ?? r.termKey]));
}

export function aiAvailable(app: FastifyInstance): boolean {
  return app.config.AI_ENABLED && !!app.config.ANTHROPIC_API_KEY;
}

async function budgetAllows(store: KvStore, userId: string, day: string, limitUsd: number, addUsd: number): Promise<boolean> {
  const key = `ai:budget:${userId}:${day}`;
  const spent = Number((await store.get(key)) ?? '0');
  if (spent >= limitUsd) return false;
  await store.set(key, String(spent + addUsd), 86400 * 2);
  return true;
}

export interface ComposeForReadingResult {
  reading: ReadingOutput;
  model: string | null;
  usedFallbackTemplate: boolean;
  costUsd: number;
  tokens: number;
  atomCount: number;
}

/** Compose (or template) the narrative for a stored reading and persist it on the row. */
export async function composeForReading(app: FastifyInstance, row: Reading, opts: { day: string; onDelta?: (t: string) => void }): Promise<ComposeForReadingResult> {
  const locale = row.locale as Locale;
  const engine = (row.engineJson ?? {}) as { atomKeys?: string[]; facts?: unknown; confidence?: string; warnings?: unknown[] };
  const atomKeys = engine.atomKeys ?? [];
  const atoms = await loadAtoms(app.db, atomKeys, locale);
  const facts = { kind: row.kind, confidence: engine.confidence ?? 'high', warnings: engine.warnings ?? [], facts: engine.facts ?? row.engineJson };

  let result: ComposeForReadingResult;
  const canAi = aiAvailable(app) && (await budgetAllows(app.store, row.userId, opts.day, app.config.AI_USER_DAILY_BUDGET_USD, 0.03));
  if (canAi) {
    process.env.ANTHROPIC_API_KEY = app.config.ANTHROPIC_API_KEY;
    const glossaryMap = await loadGlossary(app.db, locale);
    const r: ComposeResult = await composeReading(
      { kind: row.kind as ReadingKind, locale, facts, atoms, glossary: glossaryMap },
      { model: app.config.AI_MODEL_READING, onDelta: opts.onDelta },
    );
    result = { reading: r.reading, model: r.model, usedFallbackTemplate: r.usedFallbackTemplate, costUsd: r.costUsd, tokens: r.usage.input_tokens + r.usage.output_tokens, atomCount: atoms.length };
    app.metrics.inc('ai_readings_total', { kind: row.kind, fallback: String(r.usedFallbackTemplate) });
  } else {
    result = { reading: templateReading(atoms, locale), model: null, usedFallbackTemplate: true, costUsd: 0, tokens: 0, atomCount: atoms.length };
  }
  await app.db
    .update(readings)
    .set({ aiJson: { ...result.reading, meta: { model: result.model, usedFallbackTemplate: result.usedFallbackTemplate, atomCount: result.atomCount } } as unknown as Record<string, unknown>, aiModel: result.model, tokens: result.tokens, costUsd: result.costUsd.toFixed(5) })
    .where(eq(readings.id, row.id));
  return result;
}

export interface AskResult {
  text: string;
  model: string | null;
  costUsd: number;
}

/** Ask-AI follow-up grounded on the user's core facts + latest reading. */
export async function askAi(app: FastifyInstance, args: { userId: string; locale: Locale; question: string; context: unknown; readingId: string | null; day: string }): Promise<AskResult> {
  const history = await app.db
    .select()
    .from(aiMessages)
    .where(and(eq(aiMessages.userId, args.userId), args.readingId ? eq(aiMessages.readingId, args.readingId) : eq(aiMessages.userId, args.userId)))
    .orderBy(aiMessages.createdAt)
    .limit(10);
  let text: string;
  let model: string | null = null;
  let costUsd = 0;
  const canAi = aiAvailable(app) && (await budgetAllows(app.store, args.userId, args.day, app.config.AI_USER_DAILY_BUDGET_USD, 0.005));
  if (canAi) {
    process.env.ANTHROPIC_API_KEY = app.config.ANTHROPIC_API_KEY;
    const r = await answerQuestion(
      { locale: args.locale, context: args.context, history: history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })), question: args.question },
      { model: app.config.AI_MODEL_READING },
    );
    text = r.stopReason === 'refusal' || !r.text ? fallbackAnswer(args.locale) : r.text;
    model = r.model;
    costUsd = r.costUsd;
  } else text = fallbackAnswer(args.locale);
  await app.db.insert(aiMessages).values([
    { userId: args.userId, readingId: args.readingId, role: 'user', content: args.question, locale: args.locale },
    { userId: args.userId, readingId: args.readingId, role: 'assistant', content: text, locale: args.locale },
  ]);
  return { text, model, costUsd };
}

function fallbackAnswer(locale: Locale): string {
  return locale === 'vi'
    ? 'Trợ lý AI tạm thời không khả dụng. Bạn có thể xem lại phần luận giải đã có hoặc thử lại sau ít phút.'
    : 'The AI guide is temporarily unavailable. Please revisit your reading or try again in a few minutes.';
}
