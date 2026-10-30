import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { pickDates } from '@findme/engine-almanac';
import { ganzhiLabel } from '@findme/engine-core';
import { Link } from '@/i18n/navigation';
import { routing, type AppLocale } from '@/i18n/routing';
import { isTask, SEO_TASKS } from '@/lib/almanac';
import { fetchAtoms } from '@/lib/atoms';
import { addDays, formatDate, localDate } from '@/lib/dates';
import { absoluteUrl, articleJsonLd, buildMetadata } from '@/lib/seo';
import { AppCta } from '@/components/site/AppCta';
import { JsonLd } from '@/components/site/JsonLd';
import { AtomBlock } from '@/components/site/Prose';

export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => SEO_TASKS.map((task) => ({ locale, task })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: AppLocale; task: string }> }): Promise<Metadata> {
  const { locale, task } = await params;
  if (!isTask(task)) return {};
  const t = await getTranslations({ locale, namespace: 'web.almanac' });
  const tt = await getTranslations({ locale, namespace: 'web.tasks' });
  return buildMetadata({ locale, pathname: '/good-days/[task]', params: { task }, title: t('pickTitle', { task: tt(task) }), description: t('pickDescription', { task: tt(task) }), type: 'article' });
}

export default async function GoodDaysPage({ params }: { params: Promise<{ locale: AppLocale; task: string }> }) {
  const { locale, task } = await params;
  if (!isTask(task)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'web.almanac' });
  const tt = await getTranslations({ locale, namespace: 'web.tasks' });
  const from = localDate('Asia/Ho_Chi_Minh');
  const to = addDays(from, 59);
  /** No profile here: the public ranking is almanac-only (宜/忌, hoàng đạo, 建除, 28 宿). */
  const ranked = pickDates({ task, from, to, profiles: [], standard: 'vn', locale, limit: 15 });
  const atoms = await fetchAtoms([`almanac.task.${task}`], locale);
  const title = t('pickTitle', { task: tt(task) });
  return (
    <article>
      <JsonLd data={articleJsonLd({ url: absoluteUrl(locale, '/good-days/[task]', { task }), headline: title, description: t('pickDescription', { task: tt(task) }), locale, datePublished: `${from}T00:00:00+07:00` })} />
      <header className="mb-6">
        <h1 className="text-3xl font-semibold" data-testid="title">{title}</h1>
        <p className="mt-2 text-black/70">{t('pickIntro')}</p>
        <p className="mt-1 text-xs text-black/50">{formatDate(from, locale, { day: 'numeric', month: 'short' })} → {formatDate(to, locale, { day: 'numeric', month: 'short', year: 'numeric' })} · {t('standard')}: {t('standards.vn')}</p>
      </header>
      <AtomBlock atom={atoms[`almanac.task.${task}`]} />
      {ranked.length === 0 && <p>{t('noDays')}</p>}
      <ol className="mt-4 space-y-3" data-testid="ranked">
        {ranked.map((r, i) => (
          <li key={r.date} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">
                <span className="mr-2 text-gold">{t('rank', { n: i + 1 })}</span>
                {formatDate(r.date, locale)}
              </h2>
              <span className="text-sm text-black/60">{t('score')}: {r.score}</span>
            </div>
            <p className="mt-1 text-sm text-black/70">
              {t('lunarDay', { day: r.almanac.lunar.day, month: r.almanac.lunar.month })} · {ganzhiLabel(r.almanac.dayGanzhi, locale)} ({r.almanac.dayGanzhi.han}) · {r.almanac.huangdao ? t('huangdao') : t('heidao')}
            </p>
            <ul className="mt-2 flex flex-wrap gap-2 text-xs">
              {r.reasons.map((re) => (
                <li key={re.key + (re.detail ?? '')} className={`rounded-full px-2 py-0.5 ${re.weight > 0 ? 'bg-jade/10 text-jade' : 'bg-vermilion/10 text-vermilion'}`}>
                  {t(`reasonLabels.${re.key}` as never)}
                  {re.detail ? `: ${re.detail}` : ''} ({re.weight > 0 ? '+' : ''}{re.weight})
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-black/60">{t('goodHours')}: {r.almanac.hours.filter((h) => h.auspicious).map((h) => `${h.label} ${h.from}–${h.to}`).join(' · ')}</p>
          </li>
        ))}
      </ol>
      <nav className="mt-8" aria-label={t('otherTasks')}>
        <h2 className="mb-2 text-sm font-medium text-black/60">{t('otherTasks')}</h2>
        <ul className="flex flex-wrap gap-2 text-sm">
          {SEO_TASKS.filter((x) => x !== task).map((x) => (
            <li key={x}><Link href={{ pathname: '/good-days/[task]', params: { task: x } }} className="rounded-full border border-black/15 px-3 py-1 hover:bg-white">{tt(x)}</Link></li>
          ))}
        </ul>
      </nav>
      <AppCta />
    </article>
  );
}
