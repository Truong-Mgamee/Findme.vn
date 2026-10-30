import { getDailyContent } from '@/lib/admin-api';
import { adminT } from '@/lib/admin-i18n';
import { requireAdmin } from '@/lib/admin-require';
import { localDate } from '@/lib/dates';
import { RunDailyJob } from '@/components/admin/RunDailyJob';

/** daily_content preview — GET /v1/admin/daily-content?date=&locale= + trigger POST /v1/admin/jobs/daily-oracle. */
export default async function AdminDailyPage({ searchParams }: { searchParams: Promise<{ date?: string; locale?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const t = await adminT('web.admin.daily');
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : localDate('Asia/Ho_Chi_Minh');
  const locale = sp.locale || undefined;
  const r = await getDailyContent(date, locale);
  const rows = r.data ?? [];
  return (
    <section>
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <p className="mt-1 text-sm text-black/60">{t('body')}</p>
      <form className="mt-4 flex flex-wrap items-end gap-2 rounded-xl bg-white p-3 text-sm shadow-sm" action="/admin/daily">
        <label>{t('date')}<input type="date" name="date" defaultValue={date} className="ml-1 rounded border border-black/20 px-2 py-1" /></label>
        <label>{t('locale')}<select name="locale" defaultValue={locale ?? ''} className="ml-1 rounded border border-black/20 px-2 py-1"><option value="">*</option><option>vi</option><option>en</option></select></label>
        <button className="rounded-full border border-black/20 px-3 py-1 hover:bg-black/5">{t('load')}</button>
        <span className="flex-1" />
        <RunDailyJob date={date} labels={{ run: t('run'), running: t('running'), result: t('jobResult', { generated: '{generated}', skipped: '{skipped}', cost: '{cost}' }) }} />
      </form>
      {!r.ok && <p className="mt-3 rounded-xl border border-vermilion/40 bg-vermilion/10 px-4 py-3 text-sm" role="alert">{r.message}</p>}
      {r.ok && rows.length === 0 && <p className="mt-4 text-sm text-black/60">{t('empty')}</p>}
      {rows.length > 0 && (
        <table className="mt-4 w-full rounded-xl bg-white text-sm shadow-sm">
          <thead><tr className="text-left text-black/60"><th className="px-3 py-2 font-medium">{t('locale')}</th><th className="px-3 py-2 font-medium">{t('segment')}</th><th className="px-3 py-2 font-medium">{t('payload')}</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.locale}-${row.segmentKey}`} className="border-t border-black/5 align-top">
                <td className="px-3 py-2">{row.locale}</td>
                <td className="px-3 py-2 font-mono text-xs">{row.segmentKey}</td>
                <td className="px-3 py-2"><pre className="max-w-2xl whitespace-pre-wrap break-words text-xs">{JSON.stringify(row.payload, null, 1)}</pre></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
