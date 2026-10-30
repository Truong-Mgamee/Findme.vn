import { notFound } from 'next/navigation';
import { getAtom, getPreviousVersion } from '@/lib/admin-api';
import { adminT } from '@/lib/admin-i18n';
import { requireAdmin } from '@/lib/admin-require';
import { AtomEditor } from '@/components/admin/AtomEditor';

export default async function AdminAtomEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const t = await adminT('web.admin.editor');
  const ts = await adminT('web.admin.status');
  const r = await getAtom(decodeURIComponent(id));
  if (r.status === 404) notFound();
  if (!r.ok || !r.data) return <p className="rounded-xl border border-vermilion/40 bg-vermilion/10 px-4 py-3 text-sm" role="alert">{r.message}</p>;
  const previous = await getPreviousVersion(r.data);
  return (
    <AtomEditor
      atom={r.data}
      previous={previous}
      labels={{
        title: t('title'), fieldTitle: t('fieldTitle'), body: t('body'), preview: t('preview'), diff: previous ? t('diff', { version: previous.version }) : t('noPrevious'), save: t('save'), saving: t('saving'), approve: t('approve'), publish: t('publish'), status: t('status'), reviewer: t('reviewer'), saved: t('saved'), failed: t('failed', { message: '{message}' }), createVersion: t('createVersion'), meta: t('meta'), tone: t('tone'),
        statuses: { draft: ts('draft'), reviewed: ts('reviewed'), published: ts('published'), archived: ts('archived') },
      }}
    />
  );
}
