import { z } from 'zod';

export const ReadingSectionSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1),
  /** atom keys this section is grounded on (must exist in the provided atoms) */
  atomRefs: z.array(z.string()),
});

export const ReadingOutputSchema = z.object({
  summary: z.string().min(1),
  sections: z.array(ReadingSectionSchema).min(1).max(12),
  actions: z.array(z.string()).max(6),
  caveats: z.array(z.string()).max(6),
  disclaimer: z.string().min(1),
});
export type ReadingOutput = z.infer<typeof ReadingOutputSchema>;

export const DailyOutputSchema = z.object({
  headline: z.string().min(1).max(80),
  body: z.string().min(1).max(400),
  focus: z.string().min(1).max(80),
  luckyHint: z.string().min(1).max(80),
});
export type DailyOutput = z.infer<typeof DailyOutputSchema>;

export const AtomSchema = z.object({
  key: z.string(),
  title: z.string().optional(),
  body: z.string(),
});
export type Atom = z.infer<typeof AtomSchema>;
