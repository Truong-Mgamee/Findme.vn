import type { Locale, ReadingKind } from '@findme/engine-core';
import type { Atom } from './schema.js';

export const LANGUAGE_NAMES: Record<Locale, string> = {
  vi: 'Vietnamese', en: 'English', es: 'Spanish', 'pt-BR': 'Brazilian Portuguese', ja: 'Japanese', ko: 'Korean', 'zh-TW': 'Traditional Chinese', 'zh-CN': 'Simplified Chinese', hi: 'Hindi', th: 'Thai', id: 'Indonesian', fr: 'French', de: 'German',
};

const TONE: Partial<Record<Locale, string>> = {
  vi: 'Xưng "bạn", giọng ấm áp, cụ thể, không phán tuyệt đối, không doạ nạt; mỗi phần kết bằng một gợi ý hành động nhỏ. Dùng đúng thuật ngữ trong GLOSSARY (ví dụ Cung Mệnh, Chính Quan, Đại vận).',
  en: 'Warm, specific, grounded. Avoid "fortune", "guarantee", "will definitely". Each section ends with one small, concrete action. Use GLOSSARY terms as given.',
  ja: '丁寧で温かい語り口。断定や脅しを避け、各セクションの最後に小さな行動提案を一つ添える。GLOSSARYの用語をそのまま使う。',
  ko: '따뜻하고 구체적인 존댓말. 단정적 예언이나 겁주기를 피하고 각 섹션 끝에 작은 실천 제안 하나를 덧붙인다. GLOSSARY 용어를 그대로 사용한다.',
};

const KIND_BRIEF: Record<ReadingKind, string> = {
  daily: 'A short daily guidance note.',
  ziwei_full: 'A full Zi Wei Dou Shu (Tử Vi) chart reading: overview of 命宮/身宮, key palaces (spouse, wealth, career, health), notable patterns, current 大限 and 流年.',
  bazi_luck: 'A Four Pillars (Bát Tự) reading: day master and strength, useful elements, key ten gods, the current and next luck periods, this year.',
  tarot_spread: 'A tarot spread interpretation, position by position, then a synthesis for the question.',
  numerology_full: 'A numerology profile: life path, expression, soul urge, personality, maturity, personal year/month/day.',
  iching: 'An I Ching reading: primary hexagram judgment and image, changing lines, relating hexagram, applied to the question.',
  compatibility: 'A compatibility reading between two profiles: harmony points, friction points, how to work together.',
  almanac_pick: 'Explain why the recommended dates suit the task and what to avoid on them.',
};

/**
 * Stable system prompt per (locale, kind) — keep it byte-identical across requests so prompt caching works.
 * Volatile data (facts, atoms, question) goes in the user message.
 */
export function buildSystemPrompt(locale: Locale, kind: ReadingKind, glossary: Record<string, string> = {}): string {
  const lang = LANGUAGE_NAMES[locale];
  const tone = TONE[locale] ?? TONE.en!;
  const glossaryLines = Object.entries(glossary)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');
  return [
    `You are the editor of a metaphysics app. You turn computed chart FACTS and curated MEANING ATOMS into a coherent reading in ${lang}.`,
    `TASK: ${KIND_BRIEF[kind]}`,
    'HARD RULES:',
    '1. Use ONLY the information in FACTS and ATOMS. Never invent stars, palaces, cards, numbers, dates or relationships that are not there.',
    '2. Every section must list the atom keys it is grounded on in atomRefs (at least one), chosen from the provided ATOMS keys only.',
    '3. No medical, legal, or financial advice with specifics (diagnoses, lawsuits, which stock to buy). Suggest consulting professionals when such topics appear.',
    '4. Never predict death, accidents, or absolute outcomes. Frame tendencies and choices.',
    '5. If FACTS.confidence is "low" (e.g. unknown birth time), say so plainly in caveats and soften palace/hour-based statements.',
    `6. Write entirely in ${lang}. Keep section bodies to 2–5 sentences. Do not output markdown headings inside bodies.`,
    `TONE: ${tone}`,
    glossaryLines ? `GLOSSARY (use these exact terms):\n${glossaryLines}` : '',
    'OUTPUT: JSON matching the provided schema. "disclaimer" is one sentence stating this is for reflection, not professional advice.',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildUserMessage(facts: unknown, atoms: Atom[], question?: string, profileLabels?: string[]): string {
  const atomText = atoms.map((a) => `[${a.key}]${a.title ? ` ${a.title}` : ''}\n${a.body}`).join('\n\n');
  return [
    profileLabels?.length ? `PROFILES: ${profileLabels.join(' & ')}` : '',
    question ? `QUESTION: ${question}` : '',
    `FACTS (JSON):\n${JSON.stringify(facts)}`,
    `ATOMS:\n${atomText || '(none)'}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function buildDailySystemPrompt(locale: Locale): string {
  const lang = LANGUAGE_NAMES[locale];
  return [
    `You write the one-screen "Daily Oracle" of a metaphysics app in ${lang}.`,
    'Use ONLY the FACTS given (almanac, card, numbers, sky). No invented events. No absolute predictions, no fear.',
    'headline ≤ 60 characters, body ≤ 2 sentences, focus = one theme word/phrase, luckyHint = one short phrase (number/colour/direction already present in FACTS).',
    `Write in ${lang}. Output JSON matching the schema.`,
  ].join('\n');
}

export function buildAskSystemPrompt(locale: Locale): string {
  const lang = LANGUAGE_NAMES[locale];
  return [
    `You are the in-app guide of a metaphysics app, answering follow-up questions in ${lang}.`,
    'Ground every answer in the CONTEXT (profile core facts, latest reading). If the context does not contain what is needed, say so and suggest which reading would answer it.',
    'Decline medical, legal, financial specifics and anything about death or harm; redirect kindly to professionals.',
    'Be concise (≤ 160 words), warm, concrete. End with one optional follow-up question suggestion.',
  ].join('\n');
}
