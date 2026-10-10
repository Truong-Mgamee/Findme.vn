import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { Locale, ReadingKind } from '@findme/engine-core';
import { DailyOutputSchema, ReadingOutputSchema, type Atom, type DailyOutput, type ReadingOutput } from './schema.js';
import { buildAskSystemPrompt, buildDailySystemPrompt, buildSystemPrompt, buildUserMessage } from './prompt.js';
import { validateReading, type ValidationProblem } from './validate.js';
import { templateReading } from './fallback.js';
import { estimateCostUsd, type Usage } from './cost.js';

/** Deep readings default to the current Opus; daily/short copy uses the cheaper Haiku. */
export const MODELS = { reading: 'claude-opus-5-5', daily: 'claude-haiku-5-5', ask: 'claude-opus-5-5' } as const;

export interface ComposeInput {
  kind: ReadingKind;
  locale: Locale;
  facts: unknown;
  atoms: Atom[];
  question?: string;
  profileLabels?: string[];
  glossary?: Record<string, string>;
  /** names that must NOT appear (e.g. stars absent from this chart) */
  foreignTerms?: string[];
}

export interface ComposeDeps {
  client?: Anthropic;
  model?: string;
  effort?: 'low' | 'medium' | 'high';
  maxTokens?: number;
  /** called with each text delta while streaming (raw JSON text) */
  onDelta?: (text: string) => void;
  /** disable server-side refusal fallbacks (on by default for Opus/Fable) */
  noFallbacks?: boolean;
}

export interface ComposeResult {
  reading: ReadingOutput;
  model: string;
  attempts: number;
  usedFallbackTemplate: boolean;
  problems: ValidationProblem[];
  usage: Usage;
  costUsd: number;
  stopReason: string | null;
}

type MessageLike = { content: Array<{ type: string; text?: string }>; usage: Usage; stop_reason: string | null };

function textOf(msg: MessageLike): string {
  return msg.content.filter((b) => b.type === 'text').map((b) => b.text ?? '').join('');
}

function sumUsage(a: Usage, b: Usage): Usage {
  return {
    input_tokens: a.input_tokens + b.input_tokens,
    output_tokens: a.output_tokens + b.output_tokens,
    cache_read_input_tokens: (a.cache_read_input_tokens ?? 0) + (b.cache_read_input_tokens ?? 0),
    cache_creation_input_tokens: (a.cache_creation_input_tokens ?? 0) + (b.cache_creation_input_tokens ?? 0),
  };
}

async function callModel(client: Anthropic, params: Anthropic.MessageCreateParamsNonStreaming, deps: ComposeDeps): Promise<MessageLike> {
  if (deps.onDelta) {
    const stream = client.messages.stream({ ...params });
    stream.on('text', (t) => deps.onDelta?.(t));
    return (await stream.finalMessage()) as MessageLike;
  }
  return (await client.messages.create(params)) as MessageLike;
}

/**
 * Compute-then-explain: the model only narrates FACTS + ATOMS. Output is schema-constrained,
 * validated for grounding, regenerated once with feedback, then falls back to a template.
 */
export async function composeReading(input: ComposeInput, deps: ComposeDeps = {}): Promise<ComposeResult> {
  const client = deps.client ?? new Anthropic();
  const model = deps.model ?? MODELS.reading;
  const system = buildSystemPrompt(input.locale, input.kind, input.glossary);
  const user = buildUserMessage(input.facts, input.atoms, input.question, input.profileLabels);
  let usage: Usage = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };
  let problems: ValidationProblem[] = [];
  let stopReason: string | null = null;
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: user }];

  for (let attempt = 1; attempt <= 2; attempt++) {
    const params: Anthropic.MessageCreateParamsNonStreaming = {
      model,
      max_tokens: deps.maxTokens ?? 8000,
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages,
      output_config: { format: zodOutputFormat(ReadingOutputSchema), effort: deps.effort ?? 'medium' },
    };
    const msg = await callModel(client, params, deps);
    usage = sumUsage(usage, msg.usage);
    stopReason = msg.stop_reason;
    if (msg.stop_reason === 'refusal') break;
    let parsed: ReadingOutput | null = null;
    try {
      parsed = ReadingOutputSchema.parse(JSON.parse(textOf(msg)));
    } catch {
      parsed = null;
    }
    if (!parsed) {
      problems = [{ code: 'UNKNOWN_ATOM_REF', detail: 'unparseable output' }];
    } else {
      problems = validateReading(parsed, input.atoms, input.foreignTerms);
      if (!problems.length) return { reading: parsed, model, attempts: attempt, usedFallbackTemplate: false, problems, usage, costUsd: estimateCostUsd(model, usage), stopReason };
    }
    messages.push({ role: 'assistant', content: textOf(msg) || '{}' });
    messages.push({ role: 'user', content: `Your previous output failed validation: ${problems.map((p) => `${p.code} (${p.detail})`).join('; ')}. Fix it: only reference provided atom keys, remove forbidden content, keep everything else.` });
  }
  const reading = templateReading(input.atoms, input.locale);
  return { reading, model, attempts: 2, usedFallbackTemplate: true, problems, usage, costUsd: estimateCostUsd(model, usage), stopReason };
}

export interface DailyInput {
  locale: Locale;
  segmentKey: string;
  facts: unknown;
}

export async function composeDaily(input: DailyInput, deps: ComposeDeps = {}): Promise<{ daily: DailyOutput; usage: Usage; costUsd: number; model: string }> {
  const client = deps.client ?? new Anthropic();
  const model = deps.model ?? MODELS.daily;
  const msg = (await client.messages.create({
    model,
    max_tokens: deps.maxTokens ?? 600,
    system: [{ type: 'text', text: buildDailySystemPrompt(input.locale), cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: `SEGMENT: ${input.segmentKey}\nFACTS (JSON):\n${JSON.stringify(input.facts)}` }],
    output_config: { format: zodOutputFormat(DailyOutputSchema), effort: deps.effort ?? 'low' },
  })) as MessageLike;
  const daily = DailyOutputSchema.parse(JSON.parse(textOf(msg)));
  return { daily, usage: msg.usage, costUsd: estimateCostUsd(model, msg.usage), model };
}

export interface AskInput {
  locale: Locale;
  context: unknown;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  question: string;
}

export async function answerQuestion(input: AskInput, deps: ComposeDeps = {}): Promise<{ text: string; usage: Usage; costUsd: number; model: string; stopReason: string | null }> {
  const client = deps.client ?? new Anthropic();
  const model = deps.model ?? MODELS.ask;
  const params: Anthropic.MessageCreateParamsNonStreaming = {
    model,
    max_tokens: deps.maxTokens ?? 1200,
    system: [
      { type: 'text', text: buildAskSystemPrompt(input.locale), cache_control: { type: 'ephemeral' } },
      { type: 'text', text: `CONTEXT (JSON):\n${JSON.stringify(input.context)}`, cache_control: { type: 'ephemeral' } },
    ],
    messages: [...input.history.slice(-10).map((m) => ({ role: m.role, content: m.content })), { role: 'user', content: input.question }],
    output_config: { effort: deps.effort ?? 'low' },
  };
  const msg = await callModel(client, params, deps);
  return { text: textOf(msg), usage: msg.usage, costUsd: estimateCostUsd(model, msg.usage), model, stopReason: msg.stop_reason };
}
