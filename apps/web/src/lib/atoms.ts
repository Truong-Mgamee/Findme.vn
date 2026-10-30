import 'server-only';
import { apiUrl } from './env';

/** Shape of GET /v1/content/atoms items (see apps/api/src/routes/schemas.ts AtomSchema). */
export interface Atom {
  id: string;
  key: string;
  locale: string;
  tradition: string;
  title: string;
  bodyMd: string;
  tone: string | null;
  version: number;
  fallback: boolean;
}

export type AtomMap = Record<string, Atom>;

/**
 * Published atoms by key, fetched at build / ISR time (revalidate 1h). Never throws: with no API configured
 * or any failure the page simply renders without editorial copy. Never calls an LLM.
 */
export async function fetchAtoms(keys: string[], locale: string): Promise<AtomMap> {
  const base = apiUrl();
  const uniq = [...new Set(keys)].filter(Boolean).slice(0, 50);
  if (!base || uniq.length === 0) return {};
  try {
    const res = await fetch(`${base}/v1/content/atoms?keys=${encodeURIComponent(uniq.join(','))}&locale=${encodeURIComponent(locale)}`, {
      next: { revalidate: 3600 },
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return {};
    const body = (await res.json()) as { atoms?: Atom[] };
    const out: AtomMap = {};
    for (const a of body.atoms ?? []) out[a.key] = a;
    return out;
  } catch {
    return {};
  }
}
