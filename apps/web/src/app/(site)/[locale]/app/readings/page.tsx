import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { appFetch } from '@/lib/app-page';
import { Notice } from '@/components/app/ui';

export interface Reading {
  id: string;
  kind: string;
  locale: string;
  profileId: string | null;
  paidBy: string;
  createdAt: string;
  input: Record<string, unknown>;
  engine: Record<string, unknown> | null;
  ai: Record<string, unknown> | null;
}

export default async function ReadingsPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'web.app.readings' });
  const tc = await getTranslations({ locale, namespace: 'web.common' });
  const r = await appFetch<{ readings: Reading[] }>(locale, '/readings?limit=50');
  if (r.unconfigured) return <Notice tone="warn">{tc('apiNotConfigured')}</Notice>;
  const list = r.data?.readings ?? [];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <Link href="/app/readings/new" className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-night">{t('new')}</Link>
      </div>
      {list.length === 0 ? (
        <Notice>{t('empty')}</Notice>
      ) : (
        <ul className="space-y-2">
          {list.map((x) => (
            <li key={x.id}>
              <Link href={{ pathname: '/app/readings/[id]', params: { id: x.id } }} className="block rounded-xl bg-night-2 p-3 hover:bg-white/10">
                <p className="font-medium">{t(`kinds.${x.kind}` as never)}</p>
                <p className="text-xs text-white/60">{new Date(x.createdAt).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US')} · {t('paidBy')}: {x.paidBy} · {x.ai ? t('aiReady') : t('engineSummary')}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
