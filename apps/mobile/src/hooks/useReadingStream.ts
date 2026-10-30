/**
 * Consumes GET /v1/readings/:id/stream. Today the API emits `engine_summary` then `done`;
 * when the AI composer lands (P8) it will add `section` (and optionally `delta`) events, which are
 * rendered incrementally here without further changes.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiUrl, authHeaders } from '../lib/api';
import { consumeSse, type DoneEvent, type EngineSummaryEvent, type SectionEvent } from '../lib/sse';
import { track } from '../lib/analytics';

export interface StreamSection {
  title: string;
  body: string;
  atomRefs?: string[];
}

export interface ReadingStreamState {
  status: 'idle' | 'connecting' | 'streaming' | 'done' | 'error';
  engine: EngineSummaryEvent | null;
  sections: StreamSection[];
  summary: string | null;
  actions: string[];
  caveats: string[];
  disclaimer: string | null;
  aiStatus: 'ready' | 'pending' | null;
  error: string | null;
  firstTokenMs: number | null;
  totalMs: number | null;
}

const initial: ReadingStreamState = { status: 'idle', engine: null, sections: [], summary: null, actions: [], caveats: [], disclaimer: null, aiStatus: null, error: null, firstTokenMs: null, totalMs: null };

export function useReadingStream(readingId: string | null | undefined, opts: { kind?: string; isFirst?: boolean } = {}) {
  const [state, setState] = useState<ReadingStreamState>(initial);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(() => {
    if (!readingId) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    const t0 = Date.now();
    let firstToken: number | null = null;
    setState({ ...initial, status: 'connecting' });
    void consumeSse(
      apiUrl(`/v1/readings/${readingId}/stream`),
      authHeaders(),
      {
        onEngineSummary: (e) => {
          firstToken ??= Date.now() - t0;
          setState((s) => ({ ...s, status: 'streaming', engine: e, firstTokenMs: firstToken }));
        },
        onSection: (e: SectionEvent) => {
          firstToken ??= Date.now() - t0;
          setState((s) => {
            const sections = [...s.sections];
            const idx = typeof e.index === 'number' ? e.index : sections.length;
            sections[idx] = { title: e.title, body: e.body, atomRefs: e.atomRefs };
            return { ...s, status: 'streaming', sections, firstTokenMs: firstToken };
          });
        },
        onDelta: (e) => {
          setState((s) => {
            const sections = [...s.sections];
            const idx = typeof e.index === 'number' ? e.index : Math.max(0, sections.length - 1);
            const cur = sections[idx] ?? { title: '', body: '' };
            sections[idx] = { ...cur, body: cur.body + e.text };
            return { ...s, status: 'streaming', sections };
          });
        },
        onDone: (e: DoneEvent) => {
          const totalMs = Date.now() - t0;
          setState((s) => ({ ...s, status: 'done', aiStatus: e.ai === 'ready' ? 'ready' : 'pending', summary: e.summary ?? s.summary, actions: e.actions ?? s.actions, caveats: e.caveats ?? s.caveats, disclaimer: e.disclaimer ?? s.disclaimer, totalMs }));
          if (opts.kind) {
            track({ name: 'reading_finished', kind: opts.kind, attempts: 1, used_fallback_template: !!e.usedFallbackTemplate, cost_usd: e.costUsd, sections: 0 });
            if (opts.isFirst) track({ name: 'first_reading_done', kind: opts.kind, first_token_ms: firstToken ?? totalMs, total_ms: totalMs, used_fallback_template: !!e.usedFallbackTemplate });
          }
        },
        onError: (e) => setState((s) => ({ ...s, status: 'error', error: e.code })),
      },
      ac.signal,
    ).catch((err: unknown) => {
      if (ac.signal.aborted) return;
      setState((s) => ({ ...s, status: 'error', error: err instanceof Error ? err.message : 'stream_failed' }));
    });
  }, [readingId, opts.kind, opts.isFirst]);

  useEffect(() => {
    start();
    return () => abortRef.current?.abort();
  }, [start]);

  return { ...state, restart: start };
}
