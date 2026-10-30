import 'server-only';
import { adminToken, apiUrl } from './env';

/**
 * Admin CMS client — the only place that knows the /v1/admin/* contract (apps/api/src/routes/admin.ts).
 *
 *   GET  /v1/admin/atoms?tradition=&locale=&status=&q=&page=&pageSize=  → { items: Atom[], total, page, pageSize }
 *   GET  /v1/admin/atoms/:id                                             → Atom
 *   PUT  /v1/admin/atoms/:id   body {title?, bodyMd?, status?, reviewer?, tone?}            → Atom
 *   POST /v1/admin/atoms       body {tradition, key, locale, title, body_md, tone?, status?} → Atom (new version)
 *   GET  /v1/admin/coverage                                              → { rows: Coverage[] }
 *   GET  /v1/admin/daily-content?date=&locale=                           → { rows: DailyRow[] }
 *   POST /v1/admin/jobs/daily-oracle  body {date, locales?, force?}      → JobResult
 *
 * Every call sends `X-Admin-Token: $ADMIN_TOKEN` (server env; never exposed to the browser).
 */
export const TRADITIONS = ['ziwei', 'bazi', 'almanac', 'tarot', 'iching', 'numerology', 'astro'] as const;
export const ATOM_STATUSES = ['draft', 'reviewed', 'published', 'archived'] as const;
export type AtomStatus = (typeof ATOM_STATUSES)[number];
export type Tradition = (typeof TRADITIONS)[number];

export interface AdminAtom {
  id: string;
  tradition: string;
  key: string;
  locale: string;
  title: string;
  bodyMd: string;
  tone: string | null;
  sourceRef: string | null;
  author: string | null;
  reviewer: string | null;
  status: AtomStatus | string;
  version: number;
  updatedAt: string;
}

export interface AtomListQuery {
  tradition?: string;
  locale?: string;
  status?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface AtomList {
  items: AdminAtom[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Coverage {
  tradition: string;
  locale: string;
  total: number;
  draft: number;
  reviewed: number;
  published: number;
}

export interface DailyRow {
  date: string;
  locale: string;
  segmentKey: string;
  payload: Record<string, unknown>;
}

export interface DailyJobResult {
  date: string;
  generated: number;
  skipped: number;
  costUsd: number;
  ai: boolean;
}

export interface AdminResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  message: string | null;
}

async function call<T>(method: string, path: string, body?: unknown): Promise<AdminResult<T>> {
  const base = apiUrl();
  const token = adminToken();
  if (!base) return { ok: false, status: 0, data: null, message: 'API_URL is not configured' };
  if (!token) return { ok: false, status: 0, data: null, message: 'ADMIN_TOKEN is not configured' };
  try {
    const res = await fetch(`${base}/v1/admin${path}`, {
      method,
      headers: { accept: 'application/json', 'x-admin-token': token, ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(60000),
    });
    const text = await res.text();
    const json = text ? (JSON.parse(text) as unknown) : null;
    if (!res.ok) {
      const msg = json && typeof json === 'object' && 'message' in json ? String((json as { message: unknown }).message) : res.statusText;
      return { ok: false, status: res.status, data: null, message: msg || `HTTP ${res.status}` };
    }
    return { ok: true, status: res.status, data: json as T, message: null };
  } catch (e) {
    return { ok: false, status: 599, data: null, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function listAtoms(q: AtomListQuery): Promise<AdminResult<AtomList>> {
  const params = new URLSearchParams();
  if (q.tradition) params.set('tradition', q.tradition);
  if (q.locale) params.set('locale', q.locale);
  if (q.status) params.set('status', q.status);
  if (q.q) params.set('q', q.q);
  params.set('page', String(q.page ?? 1));
  params.set('pageSize', String(q.pageSize ?? 50));
  return call<AtomList>('GET', `/atoms?${params.toString()}`);
}

export function getAtom(id: string): Promise<AdminResult<AdminAtom>> {
  return call<AdminAtom>('GET', `/atoms/${encodeURIComponent(id)}`);
}

/** Previous version of the same key+locale (for the editor diff): list filtered by key, pick the highest lower version. */
export async function getPreviousVersion(atom: AdminAtom): Promise<AdminAtom | null> {
  const r = await listAtoms({ q: atom.key, locale: atom.locale, page: 1, pageSize: 200 });
  if (!r.ok || !r.data) return null;
  const older = r.data.items.filter((a) => a.key === atom.key && a.locale === atom.locale && a.version < atom.version).sort((a, b) => b.version - a.version);
  return older[0] ?? null;
}

export interface AtomPatch {
  title?: string;
  bodyMd?: string;
  status?: AtomStatus;
  reviewer?: string;
  tone?: string;
}

export function updateAtom(id: string, patch: AtomPatch): Promise<AdminResult<AdminAtom>> {
  const clean: AtomPatch = {};
  if (patch.title !== undefined) clean.title = patch.title;
  if (patch.bodyMd !== undefined) clean.bodyMd = patch.bodyMd;
  if (patch.status !== undefined) clean.status = patch.status;
  if (patch.reviewer !== undefined && patch.reviewer !== '') clean.reviewer = patch.reviewer;
  if (patch.tone !== undefined && patch.tone !== '') clean.tone = patch.tone;
  return call<AdminAtom>('PUT', `/atoms/${encodeURIComponent(id)}`, clean);
}

export interface AtomCreate {
  tradition: Tradition | string;
  key: string;
  locale: string;
  title: string;
  body_md: string;
  tone?: string | null;
  source_ref?: string | null;
  author?: string | null;
  reviewer?: string | null;
  status?: AtomStatus;
}

/** POST creates a new version of `key`/`locale` (id = key@locale@vN, version = max + 1 on the API side). */
export function createAtom(input: AtomCreate): Promise<AdminResult<AdminAtom>> {
  return call<AdminAtom>('POST', '/atoms', input);
}

export async function getCoverage(): Promise<AdminResult<Coverage[]>> {
  const r = await call<{ rows: Coverage[] }>('GET', '/coverage');
  return { ...r, data: r.data?.rows ?? null };
}

export async function getDailyContent(date: string, locale?: string): Promise<AdminResult<DailyRow[]>> {
  const params = new URLSearchParams({ date });
  if (locale) params.set('locale', locale);
  const r = await call<{ rows: DailyRow[] }>('GET', `/daily-content?${params.toString()}`);
  return { ...r, data: r.data?.rows ?? null };
}

export function runDailyOracleJob(date: string, locales?: string[], force = false): Promise<AdminResult<DailyJobResult>> {
  return call<DailyJobResult>('POST', '/jobs/daily-oracle', { date, ...(locales ? { locales } : {}), force });
}
