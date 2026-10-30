import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { atomKeysForAlmanac } from '@findme/engine-almanac';
import { Link } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { almanacFor, SEO_TASKS } from '@/lib/almanac';
import { fetchAtoms } from '@/lib/atoms';
import { formatDate, localDate, TZ_BY_LOCALE } from '@/lib/dates';
import { absoluteUrl, articleJsonLd, buildMetadata } from '@/lib/seo';
import { AlmanacDayCard } from '@/components/site/AlmanacDayCard';
import { AppCta } from '@/components/site/AppCta';
import { JsonLd } from '@/components/site/JsonLd';
import { AtomBlock } from '@/components/site/Prose';

/** ISR: today's almanac, Vietnam standard (vn), recomputed hourly so the date rolls over at midnight ICT. */
export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: AppLocale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'web.almanac' });
  const date = localDate(TZ_BY_LOCALE[locale]);
  return buildMetadata({ locale, pathname: '/almanac-today', title: t('todayTitle', { date: formatDate(date, locale) }), description: t('todayDescription'), type: 'article' });
}

export default async function AlmanacTodayPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'web.almanac' });
  const tt = await getTranslations({ locale, namespace: 'web.tasks' });
  const tc = await getTranslations({ locale, namespace: 'web.common' });
  const date = localDate(TZ_BY_LOCALE[locale]);
  const a = almanacFor(date, 'vn', locale);
  const atoms = await fetchAtoms(atomKeysForAlmanac(a), locale);
  const month = date.slice(0, 7);
  const url = absoluteUrl(locale, '/almanac-today');
  return (
    <article>
      <JsonLd data={articleJsonLd({ url, headline: t('todayTitle', { date: formatDate(date, locale) }), description: t('todayDescription'), locale, datePublished: `${date}T00:00:00+07:00` })} />
      <header className="mb-6">
        <h1 className="text-3xl font-semibold" data-testid="title">{t('todayTitle', { date: formatDate(date, locale) })}</h1>
        <p className="mt-2 text-black/70">{t('todayIntro')}</p>
        <p className="mt-1 text-xs text-black/50">{tc('updatedHourly')} · {t('standard')}: {t('standards.vn')}</p>
      </header>
      <AlmanacDayCard a={a} locale={locale} />
      <AtomBlock atom={atoms[`almanac.tianshen.${a.huangdao ? 'huangdao' : 'heidao'}`]} />
      <AtomBlock atom={atoms[`almanac.zhixing.${a.zhixing.code}`]} />
      <AtomBlock atom={atoms[`almanac.xiu.${a.xiu.code}`]} />
      <nav className="mt-8 flex flex-wrap gap-3 text-sm" aria-label="Related">
        <Link href={{ pathname: '/almanac/[month]', params: { month } }} className="rounded-full border border-black/15 px-3 py-1 hover:bg-white">{t('monthTitle', { month })}</Link>
        {SEO_TASKS.map((task) => (
          <Link key={task} href={{ pathname: '/good-days/[task]', params: { task } }} className="rounded-full border border-black/15 px-3 py-1 hover:bg-white">{tt(task)}</Link>
        ))}
      </nav>
      <AppCta />
    </article>
  );
}
