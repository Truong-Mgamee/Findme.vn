/**
 * Drizzle schema (Postgres dialect) — mirrors docs/04-backend-design.md §5.
 *
 * Privacy: birth data lives ONLY in `profiles.birth_enc` (AES-256-GCM, app-level key).
 * `birth_hash` is an HMAC-SHA256 of the canonical birth JSON used for engine caching / dedup.
 * `core_json` holds derived engine facts and never the raw Gregorian birth date.
 */
import { sql } from 'drizzle-orm';
import {
  bigserial,
  boolean,
  customType,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type { CoreJson } from '../services/core-types.js';

/** bytea column. pg returns Buffer, PGlite returns Uint8Array — normalise to Buffer on read. */
export const bytea = customType<{ data: Buffer; driverData: Buffer | Uint8Array }>({
  dataType() {
    return 'bytea';
  },
  toDriver(value: Buffer) {
    return value;
  },
  fromDriver(value: Buffer | Uint8Array) {
    return Buffer.isBuffer(value) ? value : Buffer.from(value);
  },
});

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  authUid: text('auth_uid').unique(),
  locale: text('locale').notNull().default('en'),
  country: text('country'),
  traditionPack: text('tradition_pack').notNull().default('western'),
  calendarStandard: text('calendar_standard').notNull().default('cn'),
  tz: text('tz').notNull().default('UTC'),
  dailyHour: smallint('daily_hour').notNull().default(7),
  pushEnabled: boolean('push_enabled').notNull().default(false),
  createdAt: createdAt(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    isSelf: boolean('is_self').notNull().default(false),
    /** AES-256-GCM: version(1) | iv(12) | tag(16) | ciphertext — JSON {date,time?,timeUnknown,gender,place,calendarStandard,fullName?} */
    birthEnc: bytea('birth_enc').notNull(),
    birthHash: text('birth_hash').notNull(),
    coreJson: jsonb('core_json').$type<CoreJson>().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('profiles_user_idx').on(t.userId), index('profiles_hash_idx').on(t.birthHash)],
);

export const readings = pgTable(
  'readings',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'cascade' }),
    partnerProfileId: uuid('partner_profile_id').references(() => profiles.id, { onDelete: 'set null' }),
    /** ziwei_full | bazi_luck | tarot_spread | numerology_full | iching | compatibility | almanac_pick | daily */
    kind: text('kind').notNull(),
    locale: text('locale').notNull(),
    inputJson: jsonb('input_json').$type<Record<string, unknown>>().notNull().default({}),
    engineJson: jsonb('engine_json').$type<Record<string, unknown>>(),
    aiJson: jsonb('ai_json').$type<Record<string, unknown>>(),
    aiModel: text('ai_model'),
    tokens: integer('tokens'),
    costUsd: numeric('cost_usd', { precision: 10, scale: 5 }),
    /** free_first | subscription | credit | none */
    paidBy: text('paid_by').notNull().default('none'),
    createdAt: createdAt(),
  },
  (t) => [index('readings_user_idx').on(t.userId, t.createdAt)],
);

export const aiMessages = pgTable(
  'ai_messages',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    readingId: uuid('reading_id').references(() => readings.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    content: text('content').notNull(),
    locale: text('locale').notNull(),
    tokens: integer('tokens'),
    createdAt: createdAt(),
  },
  (t) => [index('ai_messages_user_idx').on(t.userId, t.createdAt)],
);

export const contentAtoms = pgTable(
  'content_atoms',
  {
    id: text('id').primaryKey(),
    tradition: text('tradition').notNull(),
    key: text('key').notNull(),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
    bodyMd: text('body_md').notNull(),
    tone: text('tone'),
    sourceRef: text('source_ref'),
    author: text('author'),
    reviewer: text('reviewer'),
    /** draft | review | published | archived */
    status: text('status').notNull().default('draft'),
    version: integer('version').notNull().default(1),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('content_atoms_key_locale_version').on(t.key, t.locale, t.version), index('content_atoms_key_idx').on(t.key, t.status)],
);

export const glossary = pgTable(
  'glossary',
  {
    termKey: text('term_key').notNull(),
    locale: text('locale').notNull(),
    term: text('term').notNull(),
    note: text('note'),
  },
  (t) => [primaryKey({ columns: [t.termKey, t.locale] })],
);

export const dailyContent = pgTable(
  'daily_content',
  {
    date: date('date').notNull(),
    locale: text('locale').notNull(),
    segmentKey: text('segment_key').notNull(),
    payloadJson: jsonb('payload_json').$type<Record<string, unknown>>().notNull(),
  },
  (t) => [primaryKey({ columns: [t.date, t.locale, t.segmentKey] })],
);

export const entitlements = pgTable(
  'entitlements',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** plus | pro | ... */
    product: text('product').notNull(),
    /** active | trialing | cancelled | expired | refunded */
    status: text('status').notNull(),
    /** revenuecat | stripe | admin */
    source: text('source').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    trial: boolean('trial').notNull().default(false),
    rawJson: jsonb('raw_json').$type<Record<string, unknown>>(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.product] })],
);

export const creditsLedger = pgTable(
  'credits_ledger',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    delta: integer('delta').notNull(),
    /** purchase | reading | almanac_pick | refund | admin */
    reason: text('reason').notNull(),
    /** idempotency key: webhook event id or reading id */
    refId: text('ref_id'),
    createdAt: createdAt(),
  },
  (t) => [index('credits_ledger_user_idx').on(t.userId), uniqueIndex('credits_ledger_ref_idx').on(t.refId)],
);

export const streaks = pgTable('streaks', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  current: integer('current').notNull().default(0),
  longest: integer('longest').notNull().default(0),
  lastDate: date('last_date'),
});

export const pushTokens = pgTable(
  'push_tokens',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    platform: text('platform').notNull(),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.token] })],
);

export const experiments = pgTable(
  'experiments',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    variant: text('variant').notNull(),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.key] })],
);

/** Idempotency log for payment webhooks (not in docs §5; added so replays are no-ops). */
export const webhookEvents = pgTable('webhook_events', {
  /** `${source}:${providerEventId}` */
  id: text('id').primaryKey(),
  source: text('source').notNull(),
  type: text('type').notNull(),
  userId: uuid('user_id'),
  rawJson: jsonb('raw_json').$type<Record<string, unknown>>().notNull(),
  receivedAt: createdAt(),
});

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Reading = typeof readings.$inferSelect;
export type Entitlement = typeof entitlements.$inferSelect;
