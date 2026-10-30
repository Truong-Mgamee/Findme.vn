import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin-guard';
import { adminT } from '@/lib/admin-i18n';

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdmin()) redirect('/admin');
  const { error } = await searchParams;
  const t = await adminT('web.admin.login');
  return (
    <form action="/api/admin/login" method="post" className="mx-auto mt-16 max-w-sm space-y-3 rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">{t('title')}</h1>
      <label className="block text-sm">
        {t('token')}
        <input type="password" name="token" required autoComplete="current-password" className="mt-1 w-full rounded border border-black/20 px-3 py-2" data-testid="admin-token" />
      </label>
      {error === 'invalid' && <p className="text-sm text-vermilion" role="alert">{t('invalid')}</p>}
      {error === 'unconfigured' && <p className="text-sm text-vermilion" role="alert">{t('unconfigured')}</p>}
      <button className="rounded-full bg-night px-4 py-2 text-sm text-white">{t('submit')}</button>
    </form>
  );
}
