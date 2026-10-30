'use client';

import { useState } from 'react';
import { lifePath, parseDate } from '@findme/engine-numerology';
import { useRouter } from '@/i18n/navigation';

/** Client-side life path calculator (engine-numerology runs in the browser; no API call). */
export function LifePathCalculator({ locale, labels }: { locale: string; labels: { date: string; button: string; result: string; master: string } }) {
  const [date, setDate] = useState('');
  const [result, setResult] = useState<{ value: number; isMaster: boolean } | null>(null);
  const router = useRouter();
  void locale;
  return (
    <form
      className="mt-3 flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
        const lp = lifePath(parseDate(date));
        setResult({ value: lp.value, isMaster: lp.isMaster });
      }}
    >
      <label className="flex flex-col text-sm">
        {labels.date}
        <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 rounded border border-black/20 px-2 py-1" data-testid="lp-date" />
      </label>
      <button type="submit" className="rounded-full bg-night px-4 py-1.5 text-sm text-white" data-testid="lp-submit">{labels.button}</button>
      {result && (
        <output className="basis-full text-base" data-testid="lp-result">
          <strong>{labels.result.replace('{n}', String(result.value))}</strong>
          {result.isMaster && <span className="ml-2 text-sm text-black/60">{labels.master.replace('{base}', String(result.value === 11 ? 2 : result.value === 22 ? 4 : 6))}</span>}
          <button type="button" className="ml-3 text-sm underline" onClick={() => router.push({ pathname: '/life-path-number/[n]', params: { n: String(result.value) } })}>→ {result.value}</button>
        </output>
      )}
    </form>
  );
}
