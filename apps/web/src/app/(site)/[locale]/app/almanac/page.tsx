import { getTranslations } from 'next-intl/server';
import { ganzhiLabel } from '@findme/engine-core';
import { Link } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { almanacFor } from '@/lib/almanac';
import { getToken } from '@/lib/auth';
import { addDays, isValidYmd, localDate } from '@/lib/dates';
import { serverApi } from '@/lib/server-api';
import type { MeUser } from '@/lib/app-page';
import { Notice, Panel } from '@/components/app/ui';

/** Almanac (S12) — computed locally by engine-almanac; the standard comes from the user's settings when available. */
export default async function AppAlmanacPage({ params, searchParams }: { params: Promise<{ locale: AppLocale }>; searchParams: Promise<{ date?: string; std?: string }> }) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: 'web.app.almanac' });
  const ta = await getTranslations({ locale, namespace: 'web.almanac' });
  const me = (await getToken()) ? await serverApi<MeUser>('/me', { locale }) : null;
  const tz = me?.data?.tz ?? (locale === 'vi' ? 'Asia/Ho_Chi_Minh' : 'UTC');
  const std = (['vn', 'cn', 'kr', 'jp'].includes(sp.std ?? '') ? sp.std : me?.data?.calendarStandard) ?? (locale === 'vi' ? 'vn' : 'cn');
  const date = sp.date && isValidYmd(sp.date) ? sp.date : localDate(tz);
  const a = almanacFor(date, std as 'vn' | 'cn' | 'kr' | 'jp', locale);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <form className="flex flex-wrap items-end gap-2 text-sm" action="">
        <label>
          {t('pickDate')}
          <input type="date" name="date" defaultValue={date} className="ml-2 rounded-lg border border-white/20 bg-night px-2 py-1" />
        </label>
        <select name="std" defaultValue={std} className="rounded-lg border border-white/20 bg-night px-2 py-1" aria-label={ta('standard')}>
          {(['vn', 'cn', 'kr', 'jp'] as const).map((s) => <option key={s} value={s}>{ta(`standards.${s}`)}</option>)}
        </select>
        <button className="rounded-full bg-gold px-3 py-1 font-medium text-night">OK</button>
        <Link href={{ pathname: '/app/almanac', query: { date: addDays(date, -1), std } }} className="rounded-full border border-white/25 px-3 py-1">←</Link>
        <Link href={{ pathname: '/app/almanac', query: { date: addDays(date, 1), std } }} className="rounded-full border border-white/25 px-3 py-1">→</Link>
      </form>
      <Notice>{t('standardHint', { standard: ta(`standards.${std as 'vn'}`) })}</Notice>
      <Panel title={`${date} · ${ta('lunarDay', { day: a.lunar.day, month: a.lunar.month })}${a.lunar.isLeapMonth ? ` (${ta('leapMonth')})` : ''}`}>
        <p>{ta('dayGanzhi')}: {ganzhiLabel(a.dayGanzhi, locale)} ({a.dayGanzhi.han}) · {ta('yearGanzhi')}: {ganzhiLabel(a.lunar.yearGanzhi, locale)}</p>
        <p className={a.huangdao ? 'text-jade' : 'text-vermilion'}>{a.huangdao ? ta('huangdao') : ta('heidao')} · {a.tianshen.label} · {ta('zhixing')}: {a.zhixing.label} · {ta('xiu')}: {a.xiu.label}</p>
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div><p className="text-white/60">{ta('yi')}</p><p>{a.yi.map((i) => i.label).join(', ')}</p></div>
          <div><p className="text-white/60">{ta('ji')}</p><p>{a.ji.map((i) => i.label).join(', ')}</p></div>
          <div><p className="text-white/60">{ta('goodHours')}</p><p>{a.hours.filter((h) => h.auspicious).map((h) => `${h.label} ${h.from}–${h.to}`).join(' · ')}</p></div>
          <div><p className="text-white/60">{ta('clash')}</p><p>{a.clash.zodiacLabel} ({a.clash.ganzhiHan}) · {ta('shaDirection')}: {a.clash.shaDirection.label}</p></div>
          <div><p className="text-white/60">{ta('solarTerm')}</p><p>{a.solarTerm.current} → {a.solarTerm.next} ({a.solarTerm.nextDate})</p></div>
          <div><p className="text-white/60">{ta('joyDirection')}</p><p>{a.positions.joy.label} · {ta('wealthDirection')}: {a.positions.wealth.label}</p></div>
        </div>
      </Panel>
      <Link href="/app/almanac/pick" className="inline-flex rounded-full bg-gold px-4 py-2 text-sm font-semibold text-night">{t('openPicker')}</Link>
    </div>
  );
}
