import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { buildMetadata } from '@/lib/seo';
import { AppCta } from '@/components/site/AppCta';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: AppLocale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'web.landing' });
  return buildMetadata({ locale, pathname: '/', title: `Findme — ${t('hero')}`, description: t('sub') });
}

export default async function Landing({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'web.landing' });
  const features = ['almanac', 'charts', 'daily'] as const;
  return (
    <>
      <section className="rounded-3xl bg-night px-6 py-14 text-center text-white">
        <h1 className="font-serif text-4xl font-semibold text-gold-2 sm:text-5xl">{t('hero')}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-white/80">{t('sub')}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/app" className="rounded-full bg-gold px-5 py-2.5 font-semibold text-night hover:bg-gold-2">{t('ctaApp')}</Link>
          <Link href="/almanac-today" className="rounded-full border border-white/30 px-5 py-2.5 hover:bg-white/10">{t('ctaAlmanac')}</Link>
          <Link href="/tarot-card-of-the-day" className="rounded-full border border-white/30 px-5 py-2.5 hover:bg-white/10">{t('ctaTarot')}</Link>
        </div>
      </section>
      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        {features.map((f) => (
          <article key={f} className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">{t(`features.${f}.title`)}</h2>
            <p className="mt-2 text-sm text-black/70">{t(`features.${f}.body`)}</p>
          </article>
        ))}
      </section>
      <AppCta />
    </>
  );
}
