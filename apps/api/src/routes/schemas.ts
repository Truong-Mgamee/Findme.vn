import { z } from 'zod';
import { BirthInputSchema, CalendarStandardSchema, GenderSchema, LocaleSchema, TraditionPackSchema } from '@findme/engine-core';

export const ErrorSchema = z.object({ error: z.string(), message: z.string().optional() }).passthrough().describe('Error envelope');
export const PaywallSchema = z.object({ error: z.string(), reason: z.string(), paywall: z.literal(true), message: z.string().optional() }).passthrough().describe('402 paywall');
export const JsonObject = z.record(z.unknown()).describe('Engine output (see @findme/engine-* types)');

export const UserSchema = z.object({
  id: z.string().uuid(),
  authUid: z.string().nullable(),
  locale: LocaleSchema,
  country: z.string().nullable(),
  traditionPack: TraditionPackSchema,
  calendarStandard: CalendarStandardSchema,
  tz: z.string(),
  dailyHour: z.number().int(),
  pushEnabled: z.boolean(),
  createdAt: z.string(),
});

export const UserPatchSchema = z
  .object({
    locale: LocaleSchema,
    country: z.string().length(2),
    traditionPack: TraditionPackSchema,
    calendarStandard: CalendarStandardSchema,
    tz: z.string().min(1),
    dailyHour: z.number().int().min(0).max(23),
    pushEnabled: z.boolean(),
  })
  .partial();

export const GuestBodySchema = z
  .object({
    locale: LocaleSchema.optional(),
    country: z.string().length(2).optional(),
    traditionPack: TraditionPackSchema.optional(),
    calendarStandard: CalendarStandardSchema.optional(),
    tz: z.string().optional(),
  })
  .optional();

export const TokenResponseSchema = z.object({ token: z.string(), tokenType: z.literal('Bearer'), expiresInDays: z.number(), user: UserSchema });

/** BirthInput with calendarStandard optional (defaults from place.country, then the user). */
export const ProfileBirthSchema = BirthInputSchema.innerType()
  .extend({ calendarStandard: CalendarStandardSchema.optional() })
  .refine((v) => v.timeUnknown || !!v.time, { message: 'time is required unless timeUnknown', path: ['time'] });

export const CreateProfileSchema = z.object({
  birth: ProfileBirthSchema,
  label: z.string().min(1).max(60).optional(),
  isSelf: z.boolean().default(false),
  /** used for numerology name numbers; stored encrypted with the birth data */
  fullName: z.string().min(1).max(120).optional(),
});

export const InsightSchema = z.object({ key: z.string(), title: z.string(), body: z.string().optional() });

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  label: z.string(),
  isSelf: z.boolean(),
  createdAt: z.string(),
  /** derived facts only — never the raw birth date */
  core: JsonObject,
  insights: z.array(InsightSchema),
  birthSummary: z.object({ gender: GenderSchema, timeUnknown: z.boolean(), placeName: z.string(), calendarStandard: CalendarStandardSchema, hasName: z.boolean() }),
  /** only with ?includeBirth=true (owner) */
  birth: z.record(z.unknown()).optional(),
});

export const IdParams = z.object({ id: z.string().uuid() });
export const DateQuery = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD');
export const ZiweiSchoolSchema = z.enum(['default', 'zhongzhou', 'quanshu', 'khamThienTuHoa']);
export const HouseSystemSchema = z.enum(['placidus', 'whole']);
export const TaskSchema = z.enum(['wedding', 'opening', 'moving', 'contract', 'travel', 'groundbreaking', 'haircut', 'pray', 'burial', 'study']);

export const ReadingKindSchema = z.enum(['ziwei_full', 'bazi_luck', 'numerology_full', 'compatibility', 'almanac_pick', 'tarot_spread', 'iching']);
export const CreateReadingSchema = z.object({
  kind: ReadingKindSchema,
  profileId: z.string().uuid(),
  partnerProfileId: z.string().uuid().optional(),
  params: z.record(z.unknown()).default({}),
  payWith: z.enum(['credit']).optional(),
});
export const ReadingSchema = z.object({
  id: z.string().uuid(),
  kind: z.string(),
  locale: z.string(),
  profileId: z.string().uuid().nullable(),
  partnerProfileId: z.string().uuid().nullable(),
  paidBy: z.string(),
  createdAt: z.string(),
  input: JsonObject,
  engine: JsonObject.nullable(),
  ai: JsonObject.nullable(),
});

export const EntitlementSummarySchema = z.object({
  subscriptions: z.array(z.object({ product: z.string(), status: z.string(), source: z.string(), expiresAt: z.string().nullable(), trial: z.boolean() })),
  credits: z.number().int(),
  features: z.array(z.string()),
  freeFirstReadingAvailable: z.boolean(),
});

export const AtomSchema = z.object({ id: z.string(), key: z.string(), locale: z.string(), tradition: z.string(), title: z.string(), bodyMd: z.string(), tone: z.string().nullable(), version: z.number().int(), fallback: z.boolean() });
