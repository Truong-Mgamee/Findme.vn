import { getAtom, TRADITIONS } from '@/lib/admin-api';
import { adminT } from '@/lib/admin-i18n';
import { requireAdmin } from '@/lib/admin-require';
import { NewAtomForm } from '@/components/admin/NewAtomForm';

/** New atom version (POST /v1/admin/atoms). `?from=<id>` pre-fills from an existing atom. */
export default async function NewAtomPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  await requireAdmin();
  const { from } = await searchParams;
  const t = await adminT('web.admin.editor');
  const base = from ? (await getAtom(from)).data : null;
  return (
    <section>
      <h1 className="text-2xl font-semibold">{t('newTitle')}</h1>
      <NewAtomForm
        traditions={[...TRADITIONS]}
        initial={base ? { tradition: base.tradition, key: base.key, locale: base.locale, title: base.title, body_md: base.bodyMd, tone: base.tone ?? '' } : null}
        labels={{ key: t('key'), locale: t('locale'), tradition: t('tradition'), fieldTitle: t('fieldTitle'), body: t('body'), tone: t('tone'), save: t('createVersion'), saving: t('saving'), failed: t('failed', { message: '{message}' }) }}
      />
    </section>
  );
}
