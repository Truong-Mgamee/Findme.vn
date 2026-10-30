import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function SiteFooter() {
  const t = useTranslations('web');
  return (
    <footer className="mt-12 border-t border-black/10 bg-white/60">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 text-sm sm:grid-cols-3">
        <div>
          <p className="font-serif text-lg text-night">Findme</p>
          <p className="mt-1 text-black/70">{t('common.disclaimerShort')}</p>
        </div>
        <ul className="space-y-1">
          <li><Link href="/almanac-today" className="hover:underline">{t('nav.almanacToday')}</Link></li>
          <li><Link href={{ pathname: '/good-days/[task]', params: { task: 'wedding' } }} className="hover:underline">{t('nav.goodDays')}</Link></li>
          <li><Link href={{ pathname: '/zodiac/[chi]', params: { chi: 'rat' } }} className="hover:underline">{t('nav.zodiac')}</Link></li>
        </ul>
        <ul className="space-y-1">
          <li><Link href="/tarot-card-of-the-day" className="hover:underline">{t('nav.tarotToday')}</Link></li>
          <li><Link href={{ pathname: '/life-path-number/[n]', params: { n: '1' } }} className="hover:underline">{t('nav.lifePath')}</Link></li>
          <li><Link href="/moon-today" className="hover:underline">{t('nav.moonToday')}</Link></li>
        </ul>
      </div>
    </footer>
  );
}
