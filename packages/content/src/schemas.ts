import { z } from 'zod';

/* ----------------------------- Tarot ----------------------------- */

export const TAROT_SUITS = ['wands', 'cups', 'swords', 'pentacles'] as const;
export type TarotSuit = (typeof TAROT_SUITS)[number];

const keywordList = z.array(z.string().min(1)).min(3).max(5);

export const TarotCardSchema = z
  .object({
    id: z.string().regex(/^(major-(0\d|1\d|2[01])|(wands|cups|swords|pentacles)-(0[1-9]|1[0-4]))$/),
    arcana: z.enum(['major', 'minor']),
    suit: z.enum(TAROT_SUITS).nullable(),
    number: z.number().int().min(0).max(21),
    name_en: z.string().min(1),
    keywords_upright: keywordList,
    keywords_reversed: keywordList,
    element: z.enum(['fire', 'water', 'air', 'earth', 'spirit']),
    astrology: z.string().min(1),
    image: z.string().regex(/^classic-1909\/[a-z]+-\d{2}\.webp$/),
    waite_pd_excerpt: z.string().min(20).max(400),
  })
  .superRefine((c, ctx) => {
    if (c.arcana === 'major' && c.suit !== null) ctx.addIssue({ code: 'custom', message: 'major arcana has no suit' });
    if (c.arcana === 'minor' && c.suit === null) ctx.addIssue({ code: 'custom', message: 'minor arcana needs a suit' });
    if (c.arcana === 'minor' && (c.number < 1 || c.number > 14))
      ctx.addIssue({ code: 'custom', message: 'minor number must be 1..14' });
    const expectedId = c.arcana === 'major' ? `major-${String(c.number).padStart(2, '0')}` : `${c.suit}-${String(c.number).padStart(2, '0')}`;
    if (c.id !== expectedId) ctx.addIssue({ code: 'custom', message: `id ${c.id} does not match ${expectedId}` });
    if (c.image !== `classic-1909/${c.id}.webp`) ctx.addIssue({ code: 'custom', message: 'image path must follow classic-1909/<id>.webp' });
  });

export const TarotDeckSchema = z
  .object({
    deck: z.literal('classic-1909'),
    cards: z.array(TarotCardSchema).length(78),
  })
  .superRefine((d, ctx) => {
    const ids = new Set(d.cards.map((c) => c.id));
    if (ids.size !== 78) ctx.addIssue({ code: 'custom', message: 'card ids must be unique' });
    const majors = d.cards.filter((c) => c.arcana === 'major').length;
    if (majors !== 22) ctx.addIssue({ code: 'custom', message: `expected 22 majors, got ${majors}` });
    for (const s of TAROT_SUITS) {
      const n = d.cards.filter((c) => c.suit === s).length;
      if (n !== 14) ctx.addIssue({ code: 'custom', message: `expected 14 ${s}, got ${n}` });
    }
  });

export type TarotCard = z.infer<typeof TarotCardSchema>;
export type TarotDeck = z.infer<typeof TarotDeckSchema>;

/* ----------------------------- I Ching ----------------------------- */

export const TRIGRAM_NAMES = ['qian', 'dui', 'li', 'zhen', 'xun', 'kan', 'gen', 'kun'] as const;
export type TrigramName = (typeof TRIGRAM_NAMES)[number];

/** Trigram binary written bottom→top, 1 = yang, 0 = yin. */
export const TRIGRAM_BINARY: Record<TrigramName, string> = {
  qian: '111',
  dui: '110',
  li: '101',
  zhen: '100',
  xun: '011',
  kan: '010',
  gen: '001',
  kun: '000',
};

export const HexagramLineSchema = z.object({
  position: z.number().int().min(1).max(6),
  text_en: z.string().min(10),
});

export const HexagramSchema = z
  .object({
    number: z.number().int().min(1).max(64),
    name_zh: z.string().min(1),
    name_pinyin: z.string().min(1),
    name_en: z.string().min(1),
    name_en_modern: z.string().min(1),
    lines_binary: z.string().regex(/^[01]{6}$/),
    upper_trigram: z.enum(TRIGRAM_NAMES),
    lower_trigram: z.enum(TRIGRAM_NAMES),
    judgment_en: z.string().min(10),
    image_en: z.string().min(10),
    lines: z.array(HexagramLineSchema).length(6),
    name_vi: z.string(),
    text_vi: z.string(),
  })
  .superRefine((h, ctx) => {
    const expected = TRIGRAM_BINARY[h.lower_trigram] + TRIGRAM_BINARY[h.upper_trigram];
    if (h.lines_binary !== expected)
      ctx.addIssue({ code: 'custom', message: `hexagram ${h.number}: lines_binary ${h.lines_binary} != trigrams ${expected}` });
    h.lines.forEach((l, i) => {
      if (l.position !== i + 1) ctx.addIssue({ code: 'custom', message: `hexagram ${h.number}: line positions must be 1..6 in order` });
    });
  });

export const HexagramSetSchema = z
  .object({
    source: z.string().min(1),
    hexagrams: z.array(HexagramSchema).length(64),
  })
  .superRefine((s, ctx) => {
    const nums = new Set(s.hexagrams.map((h) => h.number));
    if (nums.size !== 64) ctx.addIssue({ code: 'custom', message: 'hexagram numbers must be unique 1..64' });
    const bins = new Set(s.hexagrams.map((h) => h.lines_binary));
    if (bins.size !== 64) ctx.addIssue({ code: 'custom', message: 'hexagram binaries must be unique' });
    s.hexagrams.forEach((h, i) => {
      if (h.number !== i + 1) ctx.addIssue({ code: 'custom', message: 'hexagrams must be in King Wen order 1..64' });
    });
  });

export type Hexagram = z.infer<typeof HexagramSchema>;
export type HexagramLine = z.infer<typeof HexagramLineSchema>;
export type HexagramSet = z.infer<typeof HexagramSetSchema>;
