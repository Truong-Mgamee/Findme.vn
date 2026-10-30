import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { routing, type AppLocale } from '@/i18n/routing';
import { monthGrid } from '@/lib/almanac';
import { localDate, parseYm, shiftMonth, TZ_BY_LOCALE } from '@/lib/dates';
import { absoluteUrl, articleJsonLd, buildMetadata } from '@/lib/seo';
import { AppCta } from '@/components/site/AppCta';
import { JsonLd } from '@/components/site/JsonLd';
import { MonthGrid } from '@/components/site/MonthGrid';

export const revalidate = 3600;
export const dynamicParams = true;

/** Pre-render previous, current and next month per locale; other months render on demand and are cached. */
export function generateStaticParams() {
  const now = localDate('Asia/Ho_Chi_Minh');
  const y = Number(now.slice(0, 4));
  const m = Number(now.slice(5, 7));
  const months = [-1, 0, 1].map((d) => shiftMonth(y, m, d));
  return routing.locales.flatMap((locale) => months.map((month) => ({ locale, month })));
}

function monthLabel(y: number, m: number, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, 1)));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: AppLocale; month: string }> }): Promise<Metadata> {
  const { locale, month } = await params;
  const ym = parseYm(month);
  if (!ym) return {};
  const t = await getTranslations({ locale, namespace: 'web.almanac' });
  const label = monthLabel(ym.y, ym.m, locale);
  return buildMetadata({ locale, pathname: '/almanac/[month]', params: { month }, title: t('monthTitle', { month: label }), description: t('monthDescription', { month: label }), type: 'article' });
}

export default async function AlmanacMonthPage({ params }: { params: Promise<{ locale: AppLocale; month: string }> }) {
  const { locale, month } = await params;
  const ym = parseYm(month);
  if (!ym) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'web.almanac' });
  const { cells, firstWeekday } = monthGrid(ym.y, ym.m, 'vn', locale);
  const label = monthLabel(ym.y, ym.m, locale);
  const today = localDate(TZ_BY_LOCALE[locale]);
  const prev = shiftMonth(ym.y, ym.m, -1);
  const next = shiftMonth(ym.y, ym.m, 1);
  return (
    <article>
      <JsonLd data={articleJsonLd({ url: absoluteUrl(locale, '/almanac/[month]', { month }), headline: t('monthTitle', { month: label }), description: t('monthDescription', { month: label }), locale, datePublished: `${month}-01T00:00:00+07:00` })} />
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="title">{t('monthTitle', { month: label })}</h1>
          <p className="mt-2 text-black/70">{t('monthIntro')}</p>
        </div>
        <nav className="flex gap-2 text-sm" aria-label="Months">
          <Link href={{ pathname: '/almanac/[month]', params: { month: prev } }} rel="prev" className="rounded-full border border-black/15 px-3 py-1 hover:bg-white">← {prev}</Link>
          <Link href="/almanac-today" className="rounded-full border border-black/15 px-3 py-1 hover:bg-white">{t('todayTitle', { date: '' }).replace(/\s*—\s*$/, '')}</Link>
          <Link href={{ pathname: '/almanac/[month]', params: { month: next } }} rel="next" className="rounded-full border border-black/15 px-3 py-1 hover:bg-white">{next} →</Link>
        </nav>
      </header>
      <MonthGrid cells={cells} firstWeekday={firstWeekday} weekdays={t('weekdays').split(',')} legendHuangdao={t('legendHuangdao')} legendLunarStart={t('legendLunarStart')} today={today} />
      <AppCta />
    </article>
  );
}
