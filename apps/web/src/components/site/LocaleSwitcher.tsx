'use client';

import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { LOCALE_CONFIGS } from '@findme/i18n';
import { routing } from '@/i18n/routing';
import { Link, usePathname } from '@/i18n/navigation';

/** Switches locale keeping the current internal route (next-intl maps it to the localized slug). */
export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams();
  return (
    <nav aria-label="Language" className="flex items-center gap-2 text-sm">
      {routing.locales.map((l) => (
        <Link
          key={l}
          // @ts-expect-error -- dynamic params are forwarded for whichever route is active
          href={{ pathname, params }}
          locale={l}
          aria-current={l === locale ? 'true' : undefined}
          className={l === locale ? 'font-semibold text-gold underline' : 'text-white/80 hover:text-white'}
        >
          {LOCALE_CONFIGS[l].nativeName}
        </Link>
      ))}
    </nav>
  );
}
