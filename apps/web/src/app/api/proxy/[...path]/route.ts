import { NextResponse, type NextRequest } from 'next/server';
import { apiUrl } from '@/lib/env';
import { TOKEN_COOKIE } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Only these prefixes are reachable through the proxy (never /admin, /webhooks). */
const ALLOW = ['me', 'profiles', 'today', 'readings', 'almanac', 'entitlements', 'content', 'ai', 'billing'];

/**
 * Same-origin proxy: /api/proxy/<path> → ${API_URL}/v1/<path>, attaching `Authorization: Bearer` from the httpOnly
 * cookie plus X-Locale / X-Tz. Streams the body through, so SSE (`/readings/:id/stream`) works with EventSource.
 */
async function handle(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const base = apiUrl();
  if (!base) return NextResponse.json({ error: 'api_not_configured', message: 'NEXT_PUBLIC_API_URL is not set' }, { status: 503 });
  const { path } = await ctx.params;
  if (!path.length || !ALLOW.includes(path[0]!)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  const url = new URL(`${base}/v1/${path.map(encodeURIComponent).join('/')}`);
  url.search = req.nextUrl.search;
  const headers = new Headers();
  for (const h of ['content-type', 'accept', 'x-locale', 'x-tz', 'accept-language', 'last-event-id']) {
    const v = req.headers.get(h);
    if (v) headers.set(h, v);
  }
  if (token) headers.set('authorization', `Bearer ${token}`);
  if (!headers.has('x-locale')) {
    const seg = req.headers.get('referer')?.match(/\/\/[^/]+\/([a-z]{2}(?:-[A-Z]{2})?)(?:\/|$)/)?.[1];
    if (seg) headers.set('x-locale', seg);
  }
  const hasBody = !['GET', 'HEAD'].includes(req.method);
  let upstream: Response;
  try {
    upstream = await fetch(url, { method: req.method, headers, body: hasBody ? req.body : undefined, // @ts-expect-error -- Node fetch needs duplex for streamed request bodies
      duplex: hasBody ? 'half' : undefined, cache: 'no-store', redirect: 'manual' });
  } catch (e) {
    return NextResponse.json({ error: 'upstream_unreachable', message: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
  const out = new Headers();
  for (const h of ['content-type', 'cache-control', 'x-ratelimit-limit', 'x-ratelimit-remaining']) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }
  if (upstream.headers.get('content-type')?.includes('text/event-stream')) out.set('x-accel-buffering', 'no');
  return new Response(upstream.status === 204 ? null : upstream.body, { status: upstream.status, headers: out });
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
