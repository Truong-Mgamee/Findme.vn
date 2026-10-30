'use client';

import { useState } from 'react';
import { btn, btnGhost } from './ui';

interface PlanView { id: string; name: string; price: string; period: string; trial: string | null; best: boolean }
interface CreditView { id: string; name: string; price: string }

export function PaywallPlans({ locale, plans, credits, labels }: { locale: string; plans: PlanView[]; credits: CreditView[]; labels: Record<'plans' | 'credits' | 'checkout' | 'stub' | 'best' | 'terms' | 'restore' | 'freeFirst', string> }) {
  const [selected, setSelected] = useState(plans.find((p) => p.best)?.id ?? plans[0]?.id ?? '');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const checkout = async (product: string) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ product, locale }) });
      const json = (await res.json().catch(() => ({}))) as { url?: string; message?: string };
      if (res.ok && json.url) {
        window.location.href = json.url;
        return;
      }
      setMsg(res.status === 501 ? labels.stub : json.message ?? `HTTP ${res.status}`);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-5">
      <section>
        <h2 className="mb-2 font-semibold text-gold-2">{labels.plans}</h2>
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
          {plans.map((p) => (
            <button key={p.id} type="button" role="radio" aria-checked={selected === p.id} onClick={() => setSelected(p.id)} className={`rounded-2xl border p-4 text-left ${selected === p.id ? 'border-gold bg-gold/10' : 'border-white/15 bg-night-2'}`} data-testid={`plan-${p.id}`}>
              {p.best && <span className="mb-1 inline-block rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-night">{labels.best}</span>}
              <p className="font-medium">{p.name}</p>
              <p className="text-xl font-semibold">{p.price} <span className="text-xs font-normal text-white/60">{p.period}</span></p>
              {p.trial && <p className="text-xs text-jade">{p.trial}</p>}
            </button>
          ))}
        </div>
        <button className={`${btn} mt-3`} disabled={busy || !selected} onClick={() => checkout(selected)} data-testid="checkout">{labels.checkout}</button>
        <p className="mt-2 text-xs text-white/60">{labels.terms}</p>
      </section>
      <section>
        <h2 className="mb-2 font-semibold text-gold-2">{labels.credits}</h2>
        <div className="flex flex-wrap gap-2">
          {credits.map((c) => (
            <button key={c.id} type="button" className={btnGhost} disabled={busy} onClick={() => checkout(c.id)}>{c.name} · {c.price}</button>
          ))}
        </div>
        <p className="mt-2 text-xs text-white/60">{labels.freeFirst}</p>
      </section>
      {msg && <p className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm" role="status">{msg}</p>}
    </div>
  );
}
