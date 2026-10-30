import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { PwaRegister } from '@/components/app/PwaRegister';

export const metadata: Metadata = { robots: { index: false, follow: false }, title: 'Findme app' };
export const dynamic = 'force-dynamic';

/**
 * PWA shell. Views are plain HTML/Tailwind for now.
 * TODO(@findme/ui): replace the simple tables/lists in /app/* with ZiweiChartSVG, BaziPillars, LuckTimeline,
 * NumerologyGrid, AlmanacDayCard, OracleCard, PaywallSheet from packages/ui (react-native-web) when it lands.
 */
export default async function AppLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'web.app.nav' });
  const items = [
    ['/app', t('today')],
    ['/app/readings', t('readings')],
    ['/app/almanac', t('almanac')],
    ['/app/settings', t('settings')],
  ] as const;
  return (
    <div className="flex min-h-screen flex-col bg-night text-white">
      <PwaRegister />
      <header className="border-b border-white/10 px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/app" className="font-serif text-lg text-gold-2">Findme</Link>
          <Link href="/" className="text-xs text-white/60 hover:text-white">findme.vn</Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-24">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-night-2/95 backdrop-blur" aria-label="App">
        <ul className="mx-auto flex max-w-3xl justify-around text-xs">
          {items.map(([href, label]) => (
            <li key={href}>
              <Link href={href} className="block px-4 py-3 hover:text-gold-2">{label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
