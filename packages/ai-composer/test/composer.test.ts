import { describe, expect, it } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, composeDaily, composeReading, estimateCostUsd, templateReading, validateReading, type Atom } from '../src/index.js';

const atoms: Atom[] = [
  { key: 'ziwei.soulstar.pojunMaj', title: 'Mệnh chủ Phá Quân', body: 'Người có mệnh chủ Phá Quân ưa thay đổi, dám phá bỏ cái cũ.' },
  { key: 'ziwei.star.jumenMaj.palace.soulPalace', title: 'Cự Môn thủ Mệnh', body: 'Cự Môn tại Mệnh: giỏi biện luận, cần tiết chế lời nói.' },
];
const usage = { input_tokens: 1200, output_tokens: 600, cache_read_input_tokens: 900, cache_creation_input_tokens: 0 };

function fakeClient(outputs: string[], stop: string = 'end_turn'): Anthropic {
  let i = 0;
  const create = async () => ({ content: [{ type: 'text', text: outputs[Math.min(i++, outputs.length - 1)] }], usage, stop_reason: stop });
  return { messages: { create } } as unknown as Anthropic;
}

const good = JSON.stringify({ summary: 'Tổng quan.', sections: [{ title: 'Mệnh', body: 'Bạn ưa thay đổi.', atomRefs: ['ziwei.soulstar.pojunMaj'] }], actions: ['Viết ra 1 điều muốn đổi'], caveats: [], disclaimer: 'Mang tính chiêm nghiệm.' });
const badRef = JSON.stringify({ summary: 'x', sections: [{ title: 'Mệnh', body: 'Sao Thiên Phủ chiếu mệnh.', atomRefs: ['ziwei.star.tianfuMaj.palace.soulPalace'] }], actions: [], caveats: [], disclaimer: 'd' });

describe('composeReading', () => {
  it('returns validated reading on first attempt with cost accounting', async () => {
    const r = await composeReading({ kind: 'ziwei_full', locale: 'vi', facts: { confidence: 'high' }, atoms }, { client: fakeClient([good]) });
    expect(r.attempts).toBe(1);
    expect(r.usedFallbackTemplate).toBe(false);
    expect(r.reading.sections[0]!.atomRefs).toEqual(['ziwei.soulstar.pojunMaj']);
    expect(r.model).toBe('claude-opus-5-5');
    expect(r.costUsd).toBeCloseTo(estimateCostUsd('claude-opus-5-5', usage), 8);
  });
  it('regenerates once on unknown atomRef, then succeeds', async () => {
    const r = await composeReading({ kind: 'ziwei_full', locale: 'vi', facts: {}, atoms }, { client: fakeClient([badRef, good]) });
    expect(r.attempts).toBe(2);
    expect(r.usedFallbackTemplate).toBe(false);
    expect(r.usage.input_tokens).toBe(2400);
  });
  it('falls back to template after two invalid outputs', async () => {
    const r = await composeReading({ kind: 'ziwei_full', locale: 'vi', facts: {}, atoms }, { client: fakeClient([badRef, badRef]) });
    expect(r.usedFallbackTemplate).toBe(true);
    expect(r.reading.sections[0]!.atomRefs).toEqual(['ziwei.soulstar.pojunMaj']);
    expect(r.problems[0]!.code).toBe('UNKNOWN_ATOM_REF');
  });
  it('falls back on refusal without retry', async () => {
    const r = await composeReading({ kind: 'ziwei_full', locale: 'en', facts: {}, atoms }, { client: fakeClient(['{}'], 'refusal') });
    expect(r.usedFallbackTemplate).toBe(true);
    expect(r.stopReason).toBe('refusal');
    expect(r.usage.input_tokens).toBe(1200);
  });
});

describe('validateReading', () => {
  it('flags forbidden topics and foreign terms', () => {
    const out = JSON.parse(good);
    out.sections[0].body = 'Bạn nên mua cổ phiếu X. Thiên Phủ chiếu.';
    const p = validateReading(out, atoms, ['Thiên Phủ']);
    expect(p.map((x) => x.code)).toEqual(expect.arrayContaining(['FORBIDDEN_TOPIC', 'FOREIGN_TERM']));
  });
});

describe('prompts', () => {
  it('system prompt is stable (cache-friendly) and locale-aware', () => {
    const a = buildSystemPrompt('vi', 'bazi_luck', { 'Chính Quan': '正官' });
    const b = buildSystemPrompt('vi', 'bazi_luck', { 'Chính Quan': '正官' });
    expect(a).toBe(b);
    expect(a).toContain('Vietnamese');
    expect(a).toContain('Chính Quan');
    expect(buildSystemPrompt('ja', 'tarot_spread')).toContain('Japanese');
  });
  it('template reading has disclaimer per locale', () => {
    expect(templateReading(atoms, 'vi').disclaimer).toMatch(/chiêm nghiệm/);
    expect(templateReading([], 'en').sections[0]!.body).toMatch(/Not enough/);
  });
});

describe('composeDaily', () => {
  it('parses daily schema from haiku', async () => {
    const out = JSON.stringify({ headline: 'Ngày hợp khởi sự', body: 'Hoàng đạo, giờ Thìn tốt.', focus: 'khởi đầu', luckyHint: 'số 4, màu đỏ' });
    const r = await composeDaily({ locale: 'vi', segmentKey: 'ea:13', facts: {} }, { client: fakeClient([out]) });
    expect(r.model).toBe('claude-haiku-5-5');
    expect(r.daily.headline).toBe('Ngày hợp khởi sự');
    expect(r.costUsd).toBeLessThan(0.001);
  });
});
