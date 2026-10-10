import 'server-only';
import { adminToken, apiUrl } from './env';

/**
 * Admin CMS client — the only place that knows the /v1/admin/* contract.
 *
 *   GET  /v1/admin/atoms?tradition=&locale=&status=&q=&page=   → { atoms: AdminAtom[], page, pageSize?, total? }
 *   GET  /v1/admin/atoms/:id                                    → AdminAtom
 *   PUT  /v1/admin/atoms/:id   body {title?, body_md?, status?, reviewer?}  → AdminAtom
 *   POST /v1/admin/atoms       body {key, locale, tradition, title, body_md, tone?, status?} → AdminAtom (new version)
 *   GET  /v1/admin/coverage                                     → Coverage[]
 *
 * Every call sends `X-Admin-Token: $ADMIN_TOKEN`. Responses are tolerated loosely (snake/camel case) because the
 * routes are being added in parallel; see README "API gaps".
 */
export type AtomStatus = 'draft' | 'reviewed' | 'published' | 'archived' | (string & {});

export interface AdminAtom {
  id: string;
  key: string;
  locale: string;
  tradition: string;
  title: string;
  body_md: string;
  tone: string | null;
  status: AtomStatus;
  version: number;
  reviewer: string | null;
  author: string | null;
  source_ref: string | null;
  updated_at: string | null;
}

export interface AtomListQuery {
  tradition?: string;
  locale?: string;
  status?: string;
  q?: string;
  page?: number;
}

export interface AtomList {
  atoms: AdminAtom[];
  page: number;
  pageSize: number;
  total: number | null;
}

export interface Coverage {
  tradition: string;
  locale: string;
  total: number;
  draft: number;
  reviewed: number;
  published: number;
}

export interface AdminResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  message: string | null;
}

function normalizeAtom(raw: Record<string, unknown>): AdminAtom {
  const s = (k: string, alt?: string) => {
    const v = raw[k] ?? (alt ? raw[alt] : undefined);
    return v === undefined || v === null ? null : String(v);
  };
  return {
    id: String(raw.id ?? ''),
    key: String(raw.key ?? ''),
    locale: String(raw.locale ?? ''),
    tradition: String(raw.tradition ?? ''),
    title: String(raw.title ?? ''),
    body_md: String(raw.body_md ?? raw.bodyMd ?? ''),
    tone: s('tone'),
    status: String(raw.status ?? 'draft'),
    version: Number(raw.version ?? 1),
    reviewer: s('reviewer'),
    author: s('author'),
    source_ref: s('source_ref', 'sourceRef'),
    updated_at: s('updated_at', 'updatedAt'),
  };
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
      signal: AbortSignal.timeout(15000),
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
  const r = await call<Record<string, unknown>>('GET', `/atoms?${params.toString()}`);
  if (!r.ok || !r.data) return { ...r, data: null };
  const rawList = (Array.isArray(r.data) ? r.data : (r.data.atoms ?? r.data.items ?? [])) as Record<string, unknown>[];
  const meta = Array.isArray(r.data) ? {} : r.data;
  return {
    ...r,
    data: {
      atoms: rawList.map(normalizeAtom),
      page: Number(meta.page ?? q.page ?? 1),
      pageSize: Number(meta.pageSize ?? meta.page_size ?? meta.limit ?? rawList.length ?? 50),
      total: meta.total === undefined ? null : Number(meta.total),
    },
  };
}

export async function getAtom(id: string): Promise<AdminResult<AdminAtom>> {
  const r = await call<Record<string, unknown>>('GET', `/atoms/${encodeURIComponent(id)}`);
  return { ...r, data: r.data ? normalizeAtom((r.data.atom as Record<string, unknown>) ?? r.data) : null };
}

/** Previous version of the same key+locale (for the editor diff). Uses the list endpoint filtered by key. */
export async function getPreviousVersion(atom: AdminAtom): Promise<AdminAtom | null> {
  const r = await listAtoms({ q: atom.key, locale: atom.locale, page: 1 });
  if (!r.ok || !r.data) return null;
  const older = r.data.atoms.filter((a) => a.key === atom.key && a.locale === atom.locale && a.version < atom.version).sort((a, b) => b.version - a.version);
  return older[0] ?? null;
}

export interface AtomPatch {
  title?: string;
  body_md?: string;
  status?: AtomStatus;
  reviewer?: string;
}

export async function updateAtom(id: string, patch: AtomPatch): Promise<AdminResult<AdminAtom>> {
  const r = await call<Record<string, unknown>>('PUT', `/atoms/${encodeURIComponent(id)}`, patch);
  return { ...r, data: r.data ? normalizeAtom((r.data.atom as Record<string, unknown>) ?? r.data) : null };
}

export interface AtomCreate {
  key: string;
  locale: string;
  tradition: string;
  title: string;
  body_md: string;
  tone?: string;
  status?: AtomStatus;
  reviewer?: string;
}

/** POST creates a new version of `key`/`locale` (version = max + 1 on the API side). */
export async function createAtom(input: AtomCreate): Promise<AdminResult<AdminAtom>> {
  const r = await call<Record<string, unknown>>('POST', '/atoms', input);
  return { ...r, data: r.data ? normalizeAtom((r.data.atom as Record<string, unknown>) ?? r.data) : null };
}

export async function getCoverage(): Promise<AdminResult<Coverage[]>> {
  const r = await call<unknown>('GET', '/coverage');
  if (!r.ok) return { ...r, data: null };
  const list = (Array.isArray(r.data) ? r.data : ((r.data as { coverage?: unknown[]; rows?: unknown[] })?.coverage ?? (r.data as { rows?: unknown[] })?.rows ?? [])) as Record<string, unknown>[];
  return {
    ...r,
    data: list.map((c) => ({
      tradition: String(c.tradition ?? ''),
      locale: String(c.locale ?? ''),
      total: Number(c.total ?? 0),
      draft: Number(c.draft ?? 0),
      reviewed: Number(c.reviewed ?? 0),
      published: Number(c.published ?? 0),
    })),
  };
}

export const TRADITIONS = ['ziwei', 'bazi', 'almanac', 'numerology', 'astro', 'tarot', 'iching', 'compat'] as const;
export const ATOM_STATUSES = ['draft', 'reviewed', 'published'] as const;
