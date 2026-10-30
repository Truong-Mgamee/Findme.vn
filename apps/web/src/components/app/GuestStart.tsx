'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { btn } from './ui';

export function GuestStart({ locale, labels }: { locale: string; labels: { start: string; starting: string; failed: string } }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div className="mt-5">
      <button
        className={btn}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            const res = await fetch('/api/auth/guest', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ locale, tz: Intl.DateTimeFormat().resolvedOptions().timeZone }) });
            if (!res.ok) throw new Error(String(res.status));
            router.push(`/${locale}/app/onboarding`);
            router.refresh();
          } catch {
            setError(labels.failed);
            setBusy(false);
          }
        }}
      >
        {busy ? labels.starting : labels.start}
      </button>
      {error && <p className="mt-2 text-sm text-vermilion">{error}</p>}
    </div>
  );
}
