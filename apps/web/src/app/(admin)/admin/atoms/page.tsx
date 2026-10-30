import Link from 'next/link';
import { ATOM_STATUSES, listAtoms, TRADITIONS } from '@/lib/admin-api';
import { adminT } from '@/lib/admin-i18n';
import { requireAdmin } from '@/lib/admin-require';
import { StatusChip } from '@/components/admin/StatusChip';

const LOCALES = ['vi', 'en', 'es', 'pt-BR', 'ja', 'ko', 'zh-TW', 'zh-CN'];

export default async function AdminAtomsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const t = await adminT('web.admin.atoms');
  const ts = await adminT('web.admin.status');
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const q = { tradition: sp.tradition || undefined, locale: sp.locale || undefined, status: sp.status || undefined, q: sp.q || undefined, page, pageSize: 50 };
  const r = await listAtoms(q);
  const items = r.data?.items ?? [];
  const total = r.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / (r.data?.pageSize || 50)));
  const link = (over: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...over })) if (v !== undefined && v !== '') p.set(k, String(v));
    return `/admin/atoms?${p.toString()}`;
  };
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <Link href="/admin/atoms/new" className="rounded-full bg-night px-4 py-2 text-sm text-white">{t('create')}</Link>
      </div>
      <form className="mt-4 flex flex-wrap items-end gap-2 rounded-xl bg-white p-3 text-sm shadow-sm" action="/admin/atoms">
        <label>{t('tradition')}<select name="tradition" defaultValue={sp.tradition ?? ''} className="ml-1 rounded border border-black/20 px-2 py-1"><option value="">{t('any')}</option>{TRADITIONS.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label>{t('locale')}<select name="locale" defaultValue={sp.locale ?? ''} className="ml-1 rounded border border-black/20 px-2 py-1"><option value="">{t('any')}</option>{LOCALES.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label>{t('status')}<select name="status" defaultValue={sp.status ?? ''} className="ml-1 rounded border border-black/20 px-2 py-1"><option value="">{t('any')}</option>{ATOM_STATUSES.map((x) => <option key={x} value={x}>{ts(x)}</option>)}</select></label>
        <input type="search" name="q" defaultValue={sp.q ?? ''} placeholder={t('search')} className="min-w-56 rounded border border-black/20 px-2 py-1" />
        <button className="rounded-full border border-black/20 px-3 py-1 hover:bg-black/5">{t('apply')}</button>
        <span className="ml-auto text-black/60">{t('total', { count: total })}</span>
      </form>
      <div className="mt-3 flex gap-2 text-xs">
        {ATOM_STATUSES.map((s) => (
          <Link key={s} href={link({ status: sp.status === s ? '' : s, page: 1 })} aria-current={sp.status === s ? 'true' : undefined} className={sp.status === s ? 'ring-2 ring-night rounded-full' : ''}>
            <StatusChip status={s} label={ts(s)} />
          </Link>
        ))}
      </div>
      {!r.ok && <p className="mt-3 rounded-xl border border-vermilion/40 bg-vermilion/10 px-4 py-3 text-sm" role="alert">{t('error', { message: r.message ?? '' })}</p>}
      {r.ok && items.length === 0 && <p className="mt-4 text-sm text-black/60">{t('empty')}</p>}
      {items.length > 0 && (
        <table className="mt-4 w-full rounded-xl bg-white text-sm shadow-sm">
          <thead><tr className="text-left text-black/60"><th className="px-3 py-2 font-medium">{t('key')}</th><th className="px-3 py-2 font-medium">{t('tradition')}</th><th className="px-3 py-2 font-medium">{t('locale')}</th><th className="px-3 py-2 font-medium">{t('version')}</th><th className="px-3 py-2 font-medium">{t('status')}</th><th className="px-3 py-2 font-medium">{t('reviewer')}</th><th className="px-3 py-2 font-medium">{t('updated')}</th><th /></tr></thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-t border-black/5 align-top">
                <td className="px-3 py-2"><Link href={`/admin/atoms/${encodeURIComponent(a.id)}`} className="font-mono text-xs underline">{a.key}</Link><div className="text-xs text-black/60">{a.title}</div></td>
                <td className="px-3 py-2">{a.tradition}</td>
                <td className="px-3 py-2">{a.locale}</td>
                <td className="px-3 py-2">{a.version}</td>
                <td className="px-3 py-2"><StatusChip status={a.status} label={ts(a.status as 'draft')} /></td>
                <td className="px-3 py-2">{a.reviewer ?? '—'}</td>
                <td className="px-3 py-2 text-xs">{a.updatedAt.slice(0, 16).replace('T', ' ')}</td>
                <td className="px-3 py-2"><Link href={`/admin/atoms/${encodeURIComponent(a.id)}`} className="underline">{t('open')}</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {pages > 1 && (
        <nav className="mt-3 flex items-center gap-3 text-sm" aria-label="Pagination">
          {page > 1 && <Link href={link({ page: page - 1 })} className="underline">{t('prev')}</Link>}
          <span>{t('page', { page })} / {pages}</span>
          {page < pages && <Link href={link({ page: page + 1 })} className="underline">{t('next')}</Link>}
        </nav>
      )}
    </section>
  );
}
