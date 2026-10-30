'use client';

import { useEffect, useState } from 'react';
import { Panel } from './ui';

interface Section {
  title: string;
  body: string;
}
interface Ai {
  summary?: string;
  sections?: Section[];
  actions?: string[];
  caveats?: string[];
}
interface EngineSummary {
  readingId: string;
  kind: string;
  engine: string | null;
  atomKeys: string[];
  confidence: string | null;
  warnings: Array<{ code: string; message: string }>;
}

/**
 * SSE consumer for GET /readings/:id/stream via the cookie-authenticated proxy (EventSource cannot set headers).
 * Events: `engine_summary` → `section` (+ optional `delta`) → `done` | `error`.
 */
export function ReadingStream({ readingId, initialAi, labels }: { readingId: string; initialAi: Ai | null; labels: Record<'stream' | 'engineSummary' | 'done' | 'error' | 'aiPending' | 'connecting' | 'atomKeys' | 'warnings', string> }) {
  const [summary, setSummary] = useState<EngineSummary | null>(null);
  const [sections, setSections] = useState<Section[]>(initialAi?.sections ?? []);
  const [aiSummary, setAiSummary] = useState<string | null>(initialAi?.summary ?? null);
  const [state, setState] = useState<'connecting' | 'open' | 'done' | 'error'>(initialAi ? 'done' : 'connecting');
  const [doneInfo, setDoneInfo] = useState<{ ai?: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialAi) return;
    const es = new EventSource(`/api/proxy/readings/${readingId}/stream`);
    const parse = <T,>(e: MessageEvent): T | null => {
      try {
        return JSON.parse(e.data as string) as T;
      } catch {
        return null;
      }
    };
    es.onopen = () => setState('open');
    es.addEventListener('engine_summary', (e) => setSummary(parse<EngineSummary>(e as MessageEvent)));
    es.addEventListener('section', (e) => {
      const s = parse<Section & { index?: number; summary?: string }>(e as MessageEvent);
      if (!s) return;
      if (s.summary) setAiSummary(s.summary);
      if (s.title || s.body) setSections((prev) => (s.index !== undefined ? Object.assign([...prev], { [s.index]: { title: s.title, body: s.body } }) : [...prev, { title: s.title, body: s.body }]));
    });
    es.addEventListener('delta', (e) => {
      const d = parse<{ index?: number; text?: string }>(e as MessageEvent);
      if (!d?.text) return;
      setSections((prev) => {
        const i = d.index ?? prev.length - 1;
        const next = [...prev];
        const cur = next[i] ?? { title: '', body: '' };
        next[i] = { ...cur, body: cur.body + d.text };
        return next;
      });
    });
    es.addEventListener('done', (e) => {
      setDoneInfo(parse<{ ai?: string }>(e as MessageEvent));
      setState('done');
      es.close();
    });
    es.addEventListener('error', (e) => {
      const d = parse<{ message?: string }>(e as MessageEvent);
      if (d?.message) setErrorMsg(d.message);
    });
    es.onerror = () => {
      setState((s) => (s === 'done' ? s : 'error'));
      es.close();
    };
    return () => es.close();
  }, [readingId, initialAi]);

  return (
    <div className="space-y-3">
      <Panel title={labels.engineSummary}>
        {summary ? (
          <div className="text-sm">
            <p>{summary.engine ?? summary.kind} · {summary.confidence}</p>
            {summary.warnings.length > 0 && <p className="mt-1 text-gold-2">{labels.warnings}: {summary.warnings.map((w) => w.message).join('; ')}</p>}
            <p className="mt-1 text-xs text-white/50">{labels.atomKeys}: {summary.atomKeys.slice(0, 12).join(', ')}{summary.atomKeys.length > 12 ? '…' : ''}</p>
          </div>
        ) : (
          <p className="text-sm text-white/60">{state === 'connecting' ? labels.connecting : '—'}</p>
        )}
      </Panel>
      <Panel title={labels.stream}>
        {aiSummary && <p className="mb-3 text-white/90">{aiSummary}</p>}
        {sections.length > 0 ? (
          <div className="space-y-3" data-testid="sections">
            {sections.map((s, i) => (
              <section key={i}>
                <h3 className="font-semibold text-gold-2">{s.title}</h3>
                <p className="whitespace-pre-wrap text-sm text-white/90">{s.body}</p>
              </section>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/60">{state === 'done' && doneInfo?.ai !== 'ready' ? labels.aiPending : state === 'error' ? `${labels.error}${errorMsg ? `: ${errorMsg}` : ''}` : labels.connecting}</p>
        )}
        {state === 'done' && <p className="mt-2 text-xs text-white/40">{labels.done}</p>}
      </Panel>
    </div>
  );
}
