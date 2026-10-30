import Link from 'next/link';
import { getCoverage } from '@/lib/admin-api';
import { adminT } from '@/lib/admin-i18n';
import { requireAdmin } from '@/lib/admin-require';

/** Coverage dashboard: table per tradition × locale (GET /v1/admin/coverage). */
export default async function AdminHome() {
  await requireAdmin();
  const t = await adminT('web.admin.coverage');
  const r = await getCoverage();
  const rows = r.data ?? [];
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—');
  return (
    <section>
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      {!r.ok && <p className="mt-3 rounded-xl border border-vermilion/40 bg-vermilion/10 px-4 py-3 text-sm" role="alert">{t('error', { message: r.message ?? '' })}</p>}
      {r.ok && rows.length === 0 && <p className="mt-3 text-sm text-black/60">{t('empty')}</p>}
      {rows.length > 0 && (
        <table className="mt-4 w-full rounded-xl bg-white text-sm shadow-sm">
          <thead>
            <tr className="text-left text-black/60">
              {[t('tradition'), t('locale'), t('total'), t('draft'), t('reviewed'), t('published'), t('pct')].map((h) => (
                <th key={h} className="px-3 py-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={`${c.tradition}-${c.locale}`} className="border-t border-black/5">
                <td className="px-3 py-2"><Link href={`/admin/atoms?tradition=${c.tradition}&locale=${c.locale}`} className="underline">{c.tradition}</Link></td>
                <td className="px-3 py-2">{c.locale}</td>
                <td className="px-3 py-2">{c.total}</td>
                <td className="px-3 py-2">{c.draft}</td>
                <td className="px-3 py-2">{c.reviewed}</td>
                <td className="px-3 py-2">{c.published}</td>
                <td className="px-3 py-2">
                  <span className="mr-2 inline-block h-2 w-24 overflow-hidden rounded bg-black/10 align-middle"><span className="block h-full bg-jade" style={{ width: pct(c.published, c.total) === '—' ? 0 : pct(c.published, c.total) }} /></span>
                  {pct(c.published, c.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
