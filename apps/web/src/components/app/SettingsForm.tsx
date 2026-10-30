'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { MeUser } from '@/lib/app-page';
import { clientApi } from '@/lib/client-api';
import { btn, btnGhost, input, Panel } from './ui';

type Labels = Record<'locale' | 'calendarStandard' | 'dailyHour' | 'save' | 'saving' | 'saved' | 'deleteTitle' | 'deleteBody' | 'deleteButton' | 'deleteConfirm' | 'deleted' | 'logout' | 'tz' | 'error', string>;

/** PUT /me (locale, calendarStandard, dailyHour, tz) and DELETE /me (hard delete) + cookie logout. */
export function SettingsForm({ locale, me, locales, standards, labels }: { locale: string; me: MeUser; locales: Array<{ value: string; label: string }>; standards: Array<{ value: string; label: string }>; labels: Labels }) {
  const router = useRouter();
  const [form, setForm] = useState({ locale: me.locale, calendarStandard: me.calendarStandard, dailyHour: me.dailyHour, tz: me.tz });
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push(`/${locale}/app/welcome`);
    router.refresh();
  };
  return (
    <div className="space-y-4">
      <form
        className="grid gap-3 rounded-2xl bg-night-2 p-4 text-sm"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setStatus(null);
          try {
            await clientApi('/me', { method: 'PUT', json: form });
            setStatus(labels.saved);
            if (form.locale !== locale && locales.some((l) => l.value === form.locale)) router.push(`/${form.locale}/app/settings`);
            router.refresh();
          } catch {
            setStatus(labels.error);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>{labels.locale}<select value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value })} className={`${input} mt-1`}>{locales.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}</select></label>
        <label>{labels.calendarStandard}<select value={form.calendarStandard} onChange={(e) => setForm({ ...form, calendarStandard: e.target.value as MeUser['calendarStandard'] })} className={`${input} mt-1`}>{standards.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
        <label>{labels.dailyHour}<input type="number" min={0} max={23} value={form.dailyHour} onChange={(e) => setForm({ ...form, dailyHour: Number(e.target.value) })} className={`${input} mt-1`} /></label>
        <label>{labels.tz}<input type="text" value={form.tz} onChange={(e) => setForm({ ...form, tz: e.target.value })} className={`${input} mt-1`} /></label>
        <div className="flex items-center gap-3"><button className={btn} disabled={busy}>{busy ? labels.saving : labels.save}</button>{status && <span className="text-xs text-white/70" role="status">{status}</span>}</div>
      </form>
      <Panel title={labels.deleteTitle}>
        <p className="text-sm text-white/70">{labels.deleteBody}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="rounded-full bg-vermilion px-4 py-2 text-sm font-semibold text-white"
            onClick={async () => {
              if (!window.confirm(labels.deleteConfirm)) return;
              try {
                await clientApi('/me', { method: 'DELETE' });
              } catch {
                /* already gone */
              }
              window.alert(labels.deleted);
              await logout();
            }}
          >
            {labels.deleteButton}
          </button>
          <button className={btnGhost} onClick={logout}>{labels.logout}</button>
        </div>
      </Panel>
    </div>
  );
}
