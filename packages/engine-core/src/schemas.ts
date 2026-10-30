import { z } from 'zod';
import { CALENDAR_STANDARDS, LOCALES, TRADITION_PACKS } from './types.js';

export const LocaleSchema = z.enum(LOCALES);
export const TraditionPackSchema = z.enum(TRADITION_PACKS);
export const CalendarStandardSchema = z.enum(CALENDAR_STANDARDS);
export const GenderSchema = z.enum(['male', 'female', 'other']);

export const BirthPlaceSchema = z.object({
  name: z.string().min(1).max(120),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  tz: z.string().min(1).optional(),
  country: z.string().length(2).optional(),
});

export const BirthInputSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD'),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:mm').optional(),
    timeUnknown: z.boolean(),
    gender: GenderSchema,
    place: BirthPlaceSchema,
    useTrueSolarTime: z.boolean().optional(),
    calendarStandard: CalendarStandardSchema,
  })
  .refine((v) => v.timeUnknown || !!v.time, { message: 'time is required unless timeUnknown', path: ['time'] });

export const ReadingKindSchema = z.enum([
  'daily',
  'ziwei_full',
  'bazi_luck',
  'tarot_spread',
  'numerology_full',
  'iching',
  'compatibility',
  'almanac_pick',
]);

export const ReadingInputSchema = z.object({
  kind: ReadingKindSchema,
  locale: LocaleSchema,
  profile: BirthInputSchema,
  partner: BirthInputSchema.optional(),
  params: z.record(z.unknown()).optional(),
});

export type BirthInputParsed = z.infer<typeof BirthInputSchema>;
