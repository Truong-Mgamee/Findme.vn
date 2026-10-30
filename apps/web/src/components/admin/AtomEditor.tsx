'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { diffWordsWithSpace } from 'diff';
import type { AdminAtom } from '@/lib/admin-api';
import { renderMarkdown } from '@/lib/markdown';
import { StatusChip } from './StatusChip';

interface Labels {
  title: string; fieldTitle: string; body: string; preview: string; diff: string; save: string; saving: string; approve: string; publish: string; status: string; reviewer: string; saved: string; failed: string; createVersion: string; meta: string; tone: string;
  statuses: Record<'draft' | 'reviewed' | 'published' | 'archived', string>;
}

/** Markdown editor + live preview + word diff against the previous version; Save / Approve / Publish → PUT /api/admin/atoms/:id. */
export function AtomEditor({ atom, previous, labels }: { atom: AdminAtom; previous: AdminAtom | null; labels: Labels }) {
  const [title, setTitle] = useState(atom.title);
  const [body, setBody] = useState(atom.bodyMd);
  const [reviewer, setReviewer] = useState(atom.reviewer ?? '');
  const [status, setStatus] = useState(atom.status);
  const [tab, setTab] = useState<'preview' | 'diff'>('preview');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const html = useMemo(() => renderMarkdown(body), [body]);
  const diff = useMemo(() => (previous ? diffWordsWithSpace(previous.bodyMd, body) : null), [previous, body]);

  const save = async (patch: { status?: string } = {}) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/atoms/${encodeURIComponent(atom.id)}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, bodyMd: body, ...(reviewer ? { reviewer } : {}), ...patch }),
      });
      const json = (await res.json().catch(() => ({}))) as { status?: string; message?: string };
      if (!res.ok) throw new Error(json.message ?? `HTTP ${res.status}`);
      if (json.status) setStatus(json.status);
      setMsg(labels.saved);
    } catch (e) {
      setMsg(labels.failed.replace('{message}', e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{labels.title}</h1>
        <code className="rounded bg-black/5 px-2 py-0.5 text-xs">{atom.key}</code>
        <StatusChip status={status} label={labels.statuses[status as 'draft'] ?? status} />
        <span className="text-xs text-black/60">{atom.locale} · {atom.tradition} · v{atom.version}</span>
        <span className="flex-1" />
        <Link href={`/admin/atoms/new?from=${encodeURIComponent(atom.id)}`} className="text-sm underline">{labels.createVersion}</Link>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
          <label className="block text-sm">{labels.fieldTitle}<input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded border border-black/20 px-3 py-2" /></label>
          <label className="block text-sm">{labels.body}<textarea value={body} onChange={(e) => setBody(e.target.value)} rows={22} className="mt-1 w-full rounded border border-black/20 px-3 py-2 font-mono text-sm" data-testid="atom-body" /></label>
          <label className="block text-sm">{labels.reviewer}<input value={reviewer} onChange={(e) => setReviewer(e.target.value)} className="mt-1 w-full rounded border border-black/20 px-3 py-2" placeholder="name@findme.vn" /></label>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={busy} onClick={() => save()} className="rounded-full border border-black/20 px-4 py-2 text-sm hover:bg-black/5 disabled:opacity-50">{busy ? labels.saving : labels.save}</button>
            <button type="button" disabled={busy} onClick={() => save({ status: 'reviewed' })} className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-night hover:bg-gold-2 disabled:opacity-50">{labels.approve}</button>
            <button type="button" disabled={busy} onClick={() => save({ status: 'published' })} className="rounded-full bg-jade px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{labels.publish}</button>
            {msg && <span className="text-sm" role="status">{msg}</span>}
          </div>
          <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-0.5 text-xs text-black/60">
            <dt>{labels.meta}</dt><dd>{atom.id}</dd>
            <dt>{labels.tone}</dt><dd>{atom.tone ?? '—'}</dd>
            <dt>author</dt><dd>{atom.author ?? '—'}</dd>
            <dt>source</dt><dd>{atom.sourceRef ?? '—'}</dd>
            <dt>updated</dt><dd>{atom.updatedAt}</dd>
          </dl>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex gap-2 text-sm">
            <button type="button" onClick={() => setTab('preview')} className={`rounded-full px-3 py-1 ${tab === 'preview' ? 'bg-night text-white' : 'border border-black/20'}`}>{labels.preview}</button>
            <button type="button" onClick={() => setTab('diff')} className={`rounded-full px-3 py-1 ${tab === 'diff' ? 'bg-night text-white' : 'border border-black/20'}`}>{labels.diff}</button>
          </div>
          {tab === 'preview' ? (
            <article className="prose-md"><h2 className="!mt-0">{title}</h2><div dangerouslySetInnerHTML={{ __html: html }} /></article>
          ) : diff ? (
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed" data-testid="atom-diff">
              {diff.map((part, i) => (
                <span key={i} className={part.added ? 'diff-add' : part.removed ? 'diff-del' : ''}>{part.value}</span>
              ))}
            </pre>
          ) : (
            <p className="text-sm text-black/60">{labels.diff}</p>
          )}
        </div>
      </div>
    </section>
  );
}
