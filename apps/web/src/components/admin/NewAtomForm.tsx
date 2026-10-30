'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Initial { tradition: string; key: string; locale: string; title: string; body_md: string; tone: string }

export function NewAtomForm({ traditions, initial, labels }: { traditions: string[]; initial: Initial | null; labels: Record<'key' | 'locale' | 'tradition' | 'fieldTitle' | 'body' | 'tone' | 'save' | 'saving' | 'failed', string> }) {
  const router = useRouter();
  const [form, setForm] = useState<Initial>(initial ?? { tradition: traditions[0] ?? 'almanac', key: '', locale: 'vi', title: '', body_md: '', tone: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const set = (k: keyof Initial) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });
  return (
    <form
      className="mt-4 grid max-w-3xl gap-3 rounded-xl bg-white p-4 text-sm shadow-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg(null);
        try {
          const res = await fetch('/api/admin/atoms', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...form, tone: form.tone || null }) });
          const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
          if (!res.ok || !json.id) throw new Error(json.message ?? `HTTP ${res.status}`);
          router.push(`/admin/atoms/${encodeURIComponent(json.id)}`);
        } catch (err) {
          setMsg(labels.failed.replace('{message}', err instanceof Error ? err.message : String(err)));
          setBusy(false);
        }
      }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <label>{labels.tradition}<select value={form.tradition} onChange={set('tradition')} className="mt-1 w-full rounded border border-black/20 px-2 py-1">{traditions.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label>{labels.locale}<input value={form.locale} onChange={set('locale')} className="mt-1 w-full rounded border border-black/20 px-2 py-1" required /></label>
        <label>{labels.tone}<input value={form.tone} onChange={set('tone')} className="mt-1 w-full rounded border border-black/20 px-2 py-1" /></label>
      </div>
      <label>{labels.key}<input value={form.key} onChange={set('key')} className="mt-1 w-full rounded border border-black/20 px-2 py-1 font-mono" required minLength={3} placeholder="almanac.zhixing.建" /></label>
      <label>{labels.fieldTitle}<input value={form.title} onChange={set('title')} className="mt-1 w-full rounded border border-black/20 px-2 py-1" required /></label>
      <label>{labels.body}<textarea value={form.body_md} onChange={set('body_md')} rows={14} className="mt-1 w-full rounded border border-black/20 px-2 py-1 font-mono" required /></label>
      <div className="flex items-center gap-3">
        <button className="rounded-full bg-night px-4 py-2 text-white disabled:opacity-50" disabled={busy}>{busy ? labels.saving : labels.save}</button>
        {msg && <span role="status">{msg}</span>}
      </div>
    </form>
  );
}
