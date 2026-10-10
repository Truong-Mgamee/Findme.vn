'use client';

/** Thrown on 402 so screens can route to the paywall with the API's reason. */
export class PaywallError extends Error {
  constructor(public readonly body: { reason?: string; feature?: string; message?: string; credits?: number }) {
    super(body.message ?? 'paywall');
    this.name = 'PaywallError';
  }
}

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly body: Record<string, unknown> | null) {
    super(typeof body?.message === 'string' ? (body.message as string) : `HTTP ${status}`);
    this.name = 'ApiError';
  }
}

/**
 * Browser fetch through the same-origin proxy (`/api/proxy/*`), which attaches the guest token from the
 * httpOnly cookie. Resolves with the parsed JSON body; throws PaywallError (402) / ApiError (other 4xx/5xx).
 */
export async function clientApi<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set('accept', 'application/json');
  headers.set('x-tz', Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC');
  let body = rest.body;
  if (json !== undefined) {
    headers.set('content-type', 'application/json');
    body = JSON.stringify(json);
  }
  const res = await fetch(`/api/proxy/${path.replace(/^\/+/, '')}`, { ...rest, headers, body, credentials: 'same-origin' });
  const text = await res.text();
  const parsed = text ? (JSON.parse(text) as unknown) : null;
  if (res.status === 402) throw new PaywallError((parsed ?? {}) as PaywallError['body']);
  if (!res.ok) throw new ApiError(res.status, parsed as Record<string, unknown> | null);
  return parsed as T;
}

export function paywallHref(locale: string, body: PaywallError['body']): string {
  const q = new URLSearchParams();
  if (body.reason) q.set('reason', body.reason);
  if (body.feature) q.set('feature', body.feature);
  const qs = q.toString();
  return `/${locale}/app/paywall${qs ? `?${qs}` : ''}`;
}
