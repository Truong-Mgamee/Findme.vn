/**
 * Typed API client (openapi-fetch) with guest-token bootstrap, X-Locale / X-Tz headers,
 * 402 → paywall modal and 401 → re-issue guest token.
 */
import { createClient, isPaywall, type ApiClient, type PaywallBody } from '@findme/api-client';
import type { CalendarStandard, Locale, TraditionPack } from '@findme/engine-core';
import { env } from './env';
import { secure } from './storage';

export const TOKEN_KEY = 'findme.token';

type PaywallListener = (body: PaywallBody) => void;
type UnauthorizedListener = () => void;
const paywallListeners = new Set<PaywallListener>();
const unauthorizedListeners = new Set<UnauthorizedListener>();

export function onPaywall(fn: PaywallListener): () => void {
  paywallListeners.add(fn);
  return () => paywallListeners.delete(fn);
}
export function onUnauthorized(fn: UnauthorizedListener): () => void {
  unauthorizedListeners.add(fn);
  return () => unauthorizedListeners.delete(fn);
}

let token: string | null = null;
let headerLocale: string | undefined;
let headerTz: string | undefined;

export function setRequestContext(ctx: { locale?: string; tz?: string }): void {
  if (ctx.locale) headerLocale = ctx.locale === 'en-XA' ? 'en' : ctx.locale;
  if (ctx.tz) headerTz = ctx.tz;
}

export async function loadToken(): Promise<string | null> {
  if (token) return token;
  token = await secure.get(TOKEN_KEY);
  return token;
}

export async function setToken(t: string | null): Promise<void> {
  token = t;
  if (t) await secure.set(TOKEN_KEY, t);
  else await secure.delete(TOKEN_KEY);
}

export function getToken(): string | null {
  return token;
}

export const api: ApiClient = createClient(env.apiUrl, () => token, {
  locale: () => headerLocale,
  tz: () => headerTz,
  onPaywall: (body) => paywallListeners.forEach((fn) => fn(body)),
  onUnauthorized: () => unauthorizedListeners.forEach((fn) => fn()),
});

export interface GuestInit {
  locale: Locale;
  country?: string;
  traditionPack?: TraditionPack;
  calendarStandard?: CalendarStandard;
  tz?: string;
}

/** POST /v1/auth/guest → store the 180-day Bearer token. */
export async function createGuest(init: GuestInit) {
  const { data, error, response } = await api.POST('/v1/auth/guest', { body: init });
  if (!data) throw new ApiError(response.status, (error as { error?: string } | undefined)?.error ?? 'guest_failed');
  await setToken(data.token);
  return data.user;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public body?: unknown,
  ) {
    super(`${status} ${code}`);
  }
  get paywall(): PaywallBody | null {
    return isPaywall(this.body) ? this.body : null;
  }
}

/** Unwrap an openapi-fetch result, throwing ApiError on non-2xx. */
export function unwrap<T>(r: { data?: T; error?: unknown; response: Response }): T {
  if (r.data !== undefined && r.response.ok) return r.data;
  const code = (r.error as { error?: string; reason?: string } | undefined)?.reason ?? (r.error as { error?: string } | undefined)?.error ?? `http_${r.response.status}`;
  throw new ApiError(r.response.status, code, r.error);
}

export function errorCode(e: unknown): string {
  if (e instanceof ApiError) return e.code;
  if (e instanceof Error) return e.name === 'TypeError' ? 'network' : e.message;
  return 'unknown';
}

/** Raw authenticated fetch (SSE, endpoints not in the OpenAPI doc yet such as /v1/ai/ask). */
export function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const h: Record<string, string> = { ...extra };
  if (token) h.authorization = `Bearer ${token}`;
  if (headerLocale) h['x-locale'] = headerLocale;
  if (headerTz) h['x-tz'] = headerTz;
  return h;
}

export function apiUrl(path: string): string {
  return `${env.apiUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}
