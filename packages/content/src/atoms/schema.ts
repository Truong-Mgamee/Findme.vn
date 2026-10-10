import { z } from 'zod';

export const TRADITIONS = ['ziwei', 'bazi', 'almanac', 'tarot', 'iching', 'numerology', 'astro'] as const;
export type Tradition = (typeof TRADITIONS)[number];

export const ATOM_STATUSES = ['draft', 'reviewed', 'published'] as const;
export type AtomStatus = (typeof ATOM_STATUSES)[number];

/** Locales we currently author atoms in. Other engine locales fall back at runtime. */
export const ATOM_LOCALES = ['vi', 'en', 'zh-TW', 'ja', 'ko'] as const;
export type AtomLocale = (typeof ATOM_LOCALES)[number];

const KEY_RE = /^(ziwei|bazi|almanac|tarot|iching|numerology|astro)\.[^\s@]+$/;

export const atomId = (key: string, locale: string, version: number) => `${key}@${locale}@v${version}`;

export const AtomSchema = z
  .object({
    /** `${key}@${locale}@v${version}` */
    id: z.string().min(1),
    tradition: z.enum(TRADITIONS),
    /** dotted key as emitted by the engines' atomKeysFor* helpers, e.g. ziwei.star.ziweiMaj.palace.soulPalace */
    key: z.string().regex(KEY_RE, 'key must be <tradition>.<parts> with no spaces'),
    locale: z.string().min(2).max(5),
    title: z.string().min(1).max(120),
    body_md: z.string().min(1),
    tone: z.string().optional(),
    /** where the meaning comes from: PD text (Waite 1911 / Legge 1882), classic, or editor note */
    source_ref: z.string().optional(),
    /** 'llm-draft' | 'human' | any editor handle */
    author: z.union([z.literal('llm-draft'), z.literal('human'), z.string().min(1)]),
    reviewer: z.string().optional(),
    status: z.enum(ATOM_STATUSES),
    version: z.number().int().min(1),
    updated_at: z.string().datetime({ offset: true }),
  })
  .superRefine((a, ctx) => {
    if (a.id !== atomId(a.key, a.locale, a.version)) ctx.addIssue({ code: 'custom', message: `id ${a.id} must equal ${atomId(a.key, a.locale, a.version)}` });
    if (!a.key.startsWith(`${a.tradition}.`)) ctx.addIssue({ code: 'custom', message: `key ${a.key} must start with tradition ${a.tradition}.` });
    if (a.status !== 'draft' && !a.reviewer && a.author === 'llm-draft') ctx.addIssue({ code: 'custom', message: 'llm-draft atoms need a reviewer before leaving draft' });
  });
export type Atom = z.infer<typeof AtomSchema>;

export const GLOSSARY_LOCALES = ['vi', 'en', 'zh-TW', 'ja', 'ko'] as const;
export type GlossaryLocale = (typeof GLOSSARY_LOCALES)[number];

export const GlossaryRowSchema = z.object({
  /** stable id, e.g. star.ziweiMaj, palace.soulPalace, stem.0, tarot.major-00, sign.aries */
  term_key: z.string().regex(/^[a-z]+\.[^\s,]+$/),
  han: z.string(),
  vi: z.string().min(1),
  en: z.string().min(1),
  'zh-TW': z.string().min(1),
  ja: z.string().min(1),
  ko: z.string().min(1),
});
export type GlossaryRow = z.infer<typeof GlossaryRowSchema>;

/** Build a well-formed atom from the free parts (id is derived). */
export function makeAtom(parts: Omit<Atom, 'id' | 'tradition'> & { tradition?: Tradition }): Atom {
  const tradition = (parts.tradition ?? parts.key.split('.')[0]) as Tradition;
  return AtomSchema.parse({ ...parts, tradition, id: atomId(parts.key, parts.locale, parts.version) });
}

export function traditionOfKey(key: string): Tradition {
  const t = key.split('.')[0] as Tradition;
  if (!TRADITIONS.includes(t)) throw new Error(`unknown tradition in key ${key}`);
  return t;
}
