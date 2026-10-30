import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { isAdmin } from '@/lib/admin-guard';
import { adminT } from '@/lib/admin-i18n';
import '../../globals.css';

export const metadata: Metadata = { title: 'Findme admin', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const authed = await isAdmin();
  const t = await adminT('web.admin.nav');
  const tt = await adminT('web.admin');
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink">
        <header className="border-b border-black/10 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3 text-sm">
            <Link href="/admin" className="font-serif text-lg font-semibold">{tt('title')}</Link>
            {authed && (
              <nav className="flex gap-4" aria-label="Admin">
                <Link href="/admin/atoms" className="hover:underline">{t('atoms')}</Link>
                <Link href="/admin" className="hover:underline">{t('coverage')}</Link>
                <Link href="/admin/daily" className="hover:underline">{t('daily')}</Link>
              </nav>
            )}
            <span className="flex-1" />
            <Link href="/vi" className="text-black/60 hover:underline">{t('site')}</Link>
            {authed && (
              <form action="/api/admin/logout" method="post">
                <button className="rounded-full border border-black/15 px-3 py-1 hover:bg-black/5">{t('logout')}</button>
              </form>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
