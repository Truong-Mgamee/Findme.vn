import { getTranslations } from 'next-intl/server';
import { ganzhiLabel } from '@findme/engine-core';
import type { DayAlmanac } from '@findme/engine-almanac';
import type { AppLocale } from '@/i18n/routing';
import { Card, Dl } from './Prose';

/**
 * TODO(@findme/ui): swap for the shared `AlmanacDayCard` (react-native-svg via react-native-web) once packages/ui lands.
 */
export async function AlmanacDayCard({ a, locale }: { a: DayAlmanac; locale: AppLocale }) {
  const t = await getTranslations({ locale, namespace: 'web.almanac' });
  const gz = (g: DayAlmanac['dayGanzhi']) => `${ganzhiLabel(g, locale)} (${g.han})`;
  const good = a.hours.filter((h) => h.auspicious);
  const bad = a.hours.filter((h) => !h.auspicious);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title={t('lunarDate')} className="md:col-span-2">
        <p className="text-3xl font-semibold" data-testid="lunar-date">
          {t('lunarDay', { day: a.lunar.day, month: a.lunar.month })}
          {a.lunar.isLeapMonth && <span className="ml-2 text-base font-normal text-black/60">({t('leapMonth')})</span>}
        </p>
        <p className="mt-1 text-black/70">{t('lunarYear', { ganzhi: gz(a.lunar.yearGanzhi) })}</p>
        <p className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-medium ${a.huangdao ? 'bg-jade/15 text-jade' : 'bg-vermilion/15 text-vermilion'}`} data-testid="huangdao">
          {a.huangdao ? t('huangdao') : t('heidao')} · {a.tianshen.label}
        </p>
        <div className="mt-4">
          <Dl
            rows={[
              [t('dayGanzhi'), gz(a.dayGanzhi)],
              [t('monthGanzhi'), gz(a.monthGanzhi)],
              [t('zhixing'), `${a.zhixing.label} (${a.zhixing.code}) — ${a.zhixing.good ? t('good') : t('bad')}`],
              [t('xiu'), `${a.xiu.label} (${a.xiu.code}) — ${a.xiu.auspicious ? t('good') : t('bad')}`],
              [t('clash'), `${a.clash.zodiacLabel} (${a.clash.ganzhiHan})`],
              [t('solarTerm'), `${a.solarTerm.current} · ${t('nextSolarTerm', { name: a.solarTerm.next, date: a.solarTerm.nextDate })}`],
              [t('moonPhase'), a.moonPhase],
              [t('nineStar'), `${a.nineStar.han} (${a.nineStar.number})`],
            ]}
          />
        </div>
      </Card>
      <Card title={t('yi')}>
        <ul className="flex flex-wrap gap-2" data-testid="yi">
          {a.yi.map((i) => (
            <li key={i.code} className="rounded-full bg-jade/10 px-3 py-1 text-sm text-jade" title={i.code}>{i.label}</li>
          ))}
        </ul>
      </Card>
      <Card title={t('ji')}>
        <ul className="flex flex-wrap gap-2" data-testid="ji">
          {a.ji.map((i) => (
            <li key={i.code} className="rounded-full bg-vermilion/10 px-3 py-1 text-sm text-vermilion" title={i.code}>{i.label}</li>
          ))}
        </ul>
      </Card>
      <Card title={t('goodHours')}>
        <ul className="grid grid-cols-2 gap-1 text-sm" data-testid="good-hours">
          {good.map((h) => (
            <li key={h.branch} className="rounded bg-gold/15 px-2 py-1">{h.label} ({h.ganzhi.han}) {h.from}–{h.to}</li>
          ))}
        </ul>
      </Card>
      <Card title={t('badHours')}>
        <ul className="grid grid-cols-2 gap-1 text-sm text-black/60">
          {bad.map((h) => (
            <li key={h.branch} className="rounded bg-black/5 px-2 py-1">{h.label} ({h.ganzhi.han}) {h.from}–{h.to}</li>
          ))}
        </ul>
      </Card>
      <Card title={t('joyDirection')} className="md:col-span-2">
        <Dl rows={[[t('joyDirection'), a.positions.joy.label], [t('wealthDirection'), a.positions.wealth.label], [t('blessingDirection'), a.positions.blessing.label], [t('shaDirection'), a.clash.shaDirection.label]]} />
      </Card>
    </div>
  );
}
