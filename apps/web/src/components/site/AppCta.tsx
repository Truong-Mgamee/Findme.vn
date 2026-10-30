import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { DEEP_LINK } from '@/lib/seo';

/** Deep-link CTA (findme://) with the web app as fallback. Store badges appear when the ids are configured. */
export function AppCta({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('web.common');
  return (
    <aside className={`rounded-2xl bg-night p-5 text-white ${compact ? '' : 'mt-10'}`} aria-label="Findme app">
      <p className="font-medium">{t('getTheApp')}</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <a href={DEEP_LINK} className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-night hover:bg-gold-2" rel="noopener">
          {t('openInApp')}
        </a>
        <Link href="/app" className="rounded-full border border-white/30 px-4 py-2 text-sm hover:bg-white/10">
          Web app
        </Link>
      </div>
    </aside>
  );
}
