import { mkdtempSync, rmSync, mkdirSync, writeFileSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { CONTENT_ROOT, atomsFile, buildDraftSystemPrompt, draftAtoms, estimateDraftCostUsd, keysForTradition, makeAtom, readAtomsFile, upsertAtoms, type DraftClient } from '../src/atoms/index.js';

let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'findme-draft-'));
  mkdirSync(join(root, 'tone'), { recursive: true });
  writeFileSync(join(root, 'tone', 'en.md'), '# en voice\nWarm, specific.');
  cpSync(join(CONTENT_ROOT, 'glossary.csv'), join(root, 'glossary.csv'));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

const words = (n: number) => Array.from({ length: n }, (_, i) => `w${i}`).join(' ');

/** Fake client: answers each request with one atom per requested key (parsed out of the user message). */
function fakeClient(opts: { bodyWords?: number; dropKeys?: string[]; usage?: { input_tokens: number; output_tokens: number }; refuse?: boolean } = {}) {
  const calls: Anthropic.MessageCreateParamsNonStreaming[] = [];
  const client: DraftClient = {
    messages: {
      create: async (params) => {
        calls.push(params);
        const user = String((params.messages[0] as { content: string }).content);
        const keys = [...user.matchAll(/key: (\S+)/g)].map((m) => m[1]!).filter((k) => !(opts.dropKeys ?? []).includes(k));
        const atoms = keys.map((k) => ({ key: k, title: `Title ${k}`, body_md: `Meaning of ${k}. ${words(opts.bodyWords ?? 80)} Nudge: try it.` }));
        return { content: [{ type: 'text', text: JSON.stringify({ atoms }) }], usage: opts.usage ?? { input_tokens: 3000, output_tokens: 2500 }, stop_reason: opts.refuse ? 'refusal' : 'end_turn' };
      },
    },
  };
  return { client, calls };
}

describe('draftAtoms', () => {
  it('batches 20 keys per request, writes drafts, and reports cost from usage', async () => {
    const keys = keysForTradition('numerology').slice(0, 45);
    const { client, calls } = fakeClient();
    const s = await draftAtoms({ tradition: 'numerology', locale: 'en', keys, maxUsd: 5, client, root, now: () => new Date('2026-10-10T00:00:00Z') });
    expect(calls).toHaveLength(3);
    expect(calls.map((c) => [...String((c.messages[0] as { content: string }).content).matchAll(/key: /g)].length)).toEqual([20, 20, 5]);
    expect(calls[0]!.model).toBe('claude-opus-5-5');
    expect(calls[0]!.output_config?.format?.type).toBe('json_schema');
    expect(String((calls[0]!.system as Array<{ text: string }>)[0]!.text)).toContain('60–140 words');
    expect(String((calls[0]!.system as Array<{ text: string }>)[0]!.text)).toContain('Life Path number');
    expect(s).toMatchObject({ requested: 45, skippedExisting: 0, batches: 3, drafted: 45, stoppedForBudget: false });
    expect(s.rejected).toEqual([]);
    expect(s.costUsd).toBeCloseTo(estimateDraftCostUsd({ input_tokens: 9000, output_tokens: 7500 }), 8);
    expect(s.costUsd).toBeCloseTo((9000 * 4 + 7500 * 20) / 1e6, 8);
    const onDisk = readAtomsFile(atomsFile('numerology', 'en', root));
    expect(onDisk).toHaveLength(45);
    expect(onDisk[0]).toMatchObject({ status: 'draft', author: 'llm-draft', version: 1, locale: 'en', updated_at: '2026-10-10T00:00:00.000Z' });
    expect(onDisk[0]!.id).toBe(`${onDisk[0]!.key}@en@v1`);
  });

  it('is idempotent: existing key@locale are skipped, only missing keys are requested', async () => {
    const keys = keysForTradition('numerology').slice(0, 10);
    upsertAtoms(keys.slice(0, 7).map((k) => makeAtom({ key: k, locale: 'en', title: 't', body_md: words(70), author: 'human', status: 'reviewed', version: 3, updated_at: '2026-01-01T00:00:00Z' })), { root });
    const { client, calls } = fakeClient();
    const s = await draftAtoms({ tradition: 'numerology', locale: 'en', keys, maxUsd: 5, client, root });
    expect(s).toMatchObject({ requested: 10, skippedExisting: 7, drafted: 3, batches: 1 });
    expect([...String((calls[0]!.messages[0] as { content: string }).content).matchAll(/key: (\S+)/g)].map((m) => m[1])).toEqual(keys.slice(7));
    const onDisk = readAtomsFile(atomsFile('numerology', 'en', root));
    expect(onDisk).toHaveLength(10);
    expect(onDisk.filter((a) => a.version === 3 && a.status === 'reviewed')).toHaveLength(7); // human atoms untouched
    const again = await draftAtoms({ tradition: 'numerology', locale: 'en', keys, maxUsd: 5, client, root });
    expect(again).toMatchObject({ skippedExisting: 10, batches: 0, drafted: 0 });
    expect(calls).toHaveLength(1);
  });

  it('stops before exceeding maxUsd', async () => {
    const keys = keysForTradition('tarot').slice(0, 60);
    const { client, calls } = fakeClient({ usage: { input_tokens: 10_000, output_tokens: 10_000 } }); // $0.24 per batch
    const s = await draftAtoms({ tradition: 'tarot', locale: 'en', keys, maxUsd: 0.4, client, root });
    expect(calls).toHaveLength(1);
    expect(s.stoppedForBudget).toBe(true);
    expect(s.drafted).toBe(20);
    expect(s.costUsd).toBeLessThanOrEqual(0.4);
  });

  it('rejects out-of-range bodies, missing keys and refusals without writing them', async () => {
    const keys = keysForTradition('iching').slice(0, 3);
    const { client } = fakeClient({ bodyWords: 10, dropKeys: [keys[2]!] });
    const s = await draftAtoms({ tradition: 'iching', locale: 'en', keys, maxUsd: 5, client, root });
    expect(s.drafted).toBe(0);
    expect(s.rejected.map((r) => r.key).sort()).toEqual([...keys].sort());
    expect(s.rejected.find((r) => r.key === keys[2])!.reason).toBe('missing from output');
    const refused = await draftAtoms({ tradition: 'iching', locale: 'en', keys, maxUsd: 5, client: fakeClient({ refuse: true }).client, root });
    expect(refused.rejected.every((r) => r.reason === 'refusal')).toBe(true);
    expect(readAtomsFile(atomsFile('iching', 'en', root))).toHaveLength(0);
  });

  it('ignores keys outside the manifest and dry-runs without a client', async () => {
    const s = await draftAtoms({ tradition: 'astro', locale: 'vi', keys: ['astro.sun.aries', 'astro.bogus'], maxUsd: 1, dryRun: true, root });
    expect(s).toMatchObject({ requested: 1, batches: 1, drafted: 0 });
  });

  it('system prompt is stable for identical inputs (prompt-cache friendly)', () => {
    const a = buildDraftSystemPrompt('tarot', 'en', 'tone', '- x: y');
    expect(a).toBe(buildDraftSystemPrompt('tarot', 'en', 'tone', '- x: y'));
    expect(a).toContain('no predictions'.replace('no predictions', 'No predictions'));
  });
});
