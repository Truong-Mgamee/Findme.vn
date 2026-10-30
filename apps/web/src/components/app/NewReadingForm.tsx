'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, clientApi, PaywallError, paywallHref } from '@/lib/client-api';
import { btn, input } from './ui';

/** POST /readings → 201 → detail page (SSE); 402 → paywall. */
export function NewReadingForm({ locale, profiles, kinds, labels }: { locale: string; profiles: Array<{ id: string; label: string }>; kinds: Array<{ key: string; label: string }>; labels: Record<'kind' | 'profile' | 'create' | 'creating' | 'error' | 'useCredit', string> }) {
  const router = useRouter();
  const [kind, setKind] = useState(kinds[0]?.key ?? 'ziwei_full');
  const [profileId, setProfileId] = useState(profiles[0]?.id ?? '');
  const [partnerId, setPartnerId] = useState(profiles[1]?.id ?? '');
  const [credit, setCredit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="grid gap-3 rounded-2xl bg-night-2 p-4 text-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          const r = await clientApi<{ id: string }>('/readings', { method: 'POST', headers: { 'x-locale': locale }, json: { kind, profileId, ...(kind === 'compatibility' && partnerId ? { partnerProfileId: partnerId } : {}), params: {}, ...(credit ? { payWith: 'credit' } : {}) } });
          router.push(`/${locale}/app/readings/${r.id}`);
        } catch (err) {
          if (err instanceof PaywallError) return router.push(paywallHref(locale, err.body));
          setError(err instanceof ApiError ? err.message : labels.error);
          setBusy(false);
        }
      }}
    >
      <label>{labels.kind}<select value={kind} onChange={(e) => setKind(e.target.value)} className={`${input} mt-1`}>{kinds.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}</select></label>
      <label>{labels.profile}<select value={profileId} onChange={(e) => setProfileId(e.target.value)} className={`${input} mt-1`}>{profiles.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
      {kind === 'compatibility' && (
        <label>{labels.profile} 2<select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className={`${input} mt-1`}>{profiles.filter((p) => p.id !== profileId).map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
      )}
      <label className="flex items-center gap-2"><input type="checkbox" checked={credit} onChange={(e) => setCredit(e.target.checked)} /> {labels.useCredit}</label>
      {error && <p className="text-vermilion">{error}</p>}
      <div><button className={btn} disabled={busy || !profileId}>{busy ? labels.creating : labels.create}</button></div>
    </form>
  );
}
