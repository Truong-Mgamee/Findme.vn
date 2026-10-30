import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations('web.common');
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold">{t('notFoundTitle')}</h1>
      <p className="mt-2 text-black/70">{t('notFoundBody')}</p>
      <Link href="/" className="mt-6 inline-block rounded-full bg-night px-5 py-2 text-white">Findme</Link>
    </main>
  );
}
