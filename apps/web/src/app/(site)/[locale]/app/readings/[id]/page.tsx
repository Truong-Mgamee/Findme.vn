import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/i18n/routing';
import { appFetch } from '@/lib/app-page';
import { ReadingStream } from '@/components/app/ReadingStream';
import { Notice, Panel } from '@/components/app/ui';
import type { Reading } from '../page';

export default async function ReadingDetailPage({ params }: { params: Promise<{ locale: AppLocale; id: string }> }) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'web.app.readings' });
  const tc = await getTranslations({ locale, namespace: 'web.common' });
  const r = await appFetch<Reading>(locale, `/readings/${id}`);
  if (r.unconfigured) return <Notice tone="warn">{tc('apiNotConfigured')}</Notice>;
  if (r.status === 404) notFound();
  if (!r.data) return <Notice tone="error">{tc('error')} ({r.status})</Notice>;
  const x = r.data;
  const engine = (x.engine ?? {}) as { facts?: unknown; atomKeys?: string[]; confidence?: string; warnings?: Array<{ code: string; message: string }> };
  const ai = x.ai as { summary?: string; sections?: Array<{ title: string; body: string }>; actions?: string[]; caveats?: string[] } | null;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t(`kinds.${x.kind}` as never)}</h1>
      <p className="text-xs text-white/60">{new Date(x.createdAt).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US')} · {t('paidBy')}: {x.paidBy} · {t('confidence')}: {engine.confidence ?? '—'}</p>
      <ReadingStream readingId={x.id} initialAi={ai} labels={{ stream: t('stream'), engineSummary: t('engineSummary'), done: t('done'), error: t('error'), aiPending: t('aiPending'), connecting: t('connecting'), atomKeys: t('atomKeys'), warnings: t('warnings') }} />
      <Panel title={t('facts')}>
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-night p-3 text-xs text-white/80">{JSON.stringify(engine.facts ?? x.engine, null, 2)}</pre>
      </Panel>
    </div>
  );
}
