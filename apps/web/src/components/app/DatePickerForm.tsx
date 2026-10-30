'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, clientApi, PaywallError, paywallHref } from '@/lib/client-api';
import { btn, input } from './ui';

interface Ranked {
  date: string;
  score: number;
  reasons: Array<{ key: string; weight: number; detail?: string }>;
  lunar: { day: number; month: number };
  dayGanzhi: { han: string };
  huangdao: boolean;
}

type Labels = Record<'task' | 'from' | 'to' | 'limit' | 'submit' | 'submitting' | 'results' | 'useCredit' | 'score' | 'lunar' | 'huangdao' | 'heidao' | 'error', string>;

/** POST /almanac/pick — 402 → paywall. */
export function DatePickerForm({ locale, profiles, tasks, defaults, labels }: { locale: string; profiles: Array<{ id: string; label: string }>; tasks: Array<{ key: string; label: string }>; defaults: { from: string; to: string }; labels: Labels }) {
  const router = useRouter();
  const [task, setTask] = useState(tasks[0]?.key ?? 'wedding');
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [limit, setLimit] = useState(10);
  const [selected, setSelected] = useState<string[]>(profiles.slice(0, 1).map((p) => p.id));
  const [credit, setCredit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ranked, setRanked] = useState<Ranked[] | null>(null);
  return (
    <div className="space-y-4">
      <form
        className="grid gap-3 rounded-2xl bg-night-2 p-4 text-sm sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            const res = await clientApi<{ ranked: Ranked[] }>('/almanac/pick', { method: 'POST', headers: { 'x-locale': locale }, json: { task, from, to, profileIds: selected, limit, ...(credit ? { payWith: 'credit' } : {}) } });
            setRanked(res.ranked);
          } catch (err) {
            if (err instanceof PaywallError) return router.push(paywallHref(locale, err.body));
            setError(err instanceof ApiError ? err.message : labels.error);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>{labels.task}<select value={task} onChange={(e) => setTask(e.target.value)} className={`${input} mt-1`}>{tasks.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}</select></label>
        <label>{labels.limit}<input type="number" min={1} max={31} value={limit} onChange={(e) => setLimit(Number(e.target.value))} className={`${input} mt-1`} /></label>
        <label>{labels.from}<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={`${input} mt-1`} required /></label>
        <label>{labels.to}<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={`${input} mt-1`} required /></label>
        <fieldset className="sm:col-span-2">
          <div className="flex flex-wrap gap-3">
            {profiles.map((p) => (
              <label key={p.id} className="flex items-center gap-1">
                <input type="checkbox" checked={selected.includes(p.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, p.id].slice(0, 4) : selected.filter((x) => x !== p.id))} /> {p.label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex items-center gap-2 sm:col-span-2"><input type="checkbox" checked={credit} onChange={(e) => setCredit(e.target.checked)} /> {labels.useCredit}</label>
        <div className="sm:col-span-2"><button className={btn} disabled={busy}>{busy ? labels.submitting : labels.submit}</button></div>
        {error && <p className="text-vermilion sm:col-span-2">{error}</p>}
      </form>
      {ranked && (
        <section>
          <h2 className="mb-2 font-semibold text-gold-2">{labels.results}</h2>
          <ol className="space-y-2">
            {ranked.map((r, i) => (
              <li key={r.date} className="rounded-xl bg-night-2 p-3 text-sm">
                <p className="font-medium">#{i + 1} {r.date} · {labels.score} {r.score}</p>
                <p className="text-white/70">{labels.lunar}: {r.lunar.day}/{r.lunar.month} · {r.dayGanzhi.han} · {r.huangdao ? labels.huangdao : labels.heidao}</p>
                <p className="text-xs text-white/50">{r.reasons.map((x) => `${x.key}${x.detail ? ` (${x.detail})` : ''} ${x.weight > 0 ? '+' : ''}${x.weight}`).join(' · ')}</p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
