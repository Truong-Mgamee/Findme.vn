'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RunDailyJob({ date, labels }: { date: string; labels: { run: string; running: string; result: string } }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        disabled={busy}
        className="rounded-full bg-night px-3 py-1 text-white disabled:opacity-50"
        onClick={async () => {
          setBusy(true);
          setMsg(null);
          const res = await fetch('/api/admin/jobs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ date, force: true }) });
          const json = (await res.json().catch(() => ({}))) as { generated?: number; skipped?: number; costUsd?: number; message?: string };
          setMsg(res.ok ? labels.result.replace('{generated}', String(json.generated)).replace('{skipped}', String(json.skipped)).replace('{cost}', String(json.costUsd)) : json.message ?? `HTTP ${res.status}`);
          setBusy(false);
          router.refresh();
        }}
      >
        {busy ? labels.running : labels.run}
      </button>
      {msg && <span role="status" className="text-xs">{msg}</span>}
    </span>
  );
}
