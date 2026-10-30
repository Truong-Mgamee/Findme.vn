import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LocaleSwitcher } from './LocaleSwitcher';

export function SiteHeader() {
  const t = useTranslations('web.nav');
  return (
    <header className="bg-night text-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="font-serif text-xl font-semibold tracking-wide text-gold-2">
          Findme
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <Link href="/almanac-today" className="hover:text-gold-2">{t('almanacToday')}</Link>
          <Link href="/tarot-card-of-the-day" className="hover:text-gold-2">{t('tarotToday')}</Link>
          <Link href="/moon-today" className="hover:text-gold-2">{t('moonToday')}</Link>
          <Link href="/app" className="rounded-full bg-gold px-3 py-0.5 font-medium text-night hover:bg-gold-2">{t('app')}</Link>
        </nav>
        <LocaleSwitcher />
      </div>
    </header>
  );
}
