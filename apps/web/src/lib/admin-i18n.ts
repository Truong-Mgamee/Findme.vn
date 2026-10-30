import 'server-only';
import { getTranslations } from 'next-intl/server';

/** /admin lives outside the [locale] tree; it is rendered in English (editors' shared language). */
export const adminT = (namespace: 'web.admin' | 'web.admin.atoms' | 'web.admin.editor' | 'web.admin.coverage' | 'web.admin.daily' | 'web.admin.login' | 'web.admin.nav' | 'web.admin.status') => getTranslations({ locale: 'en', namespace });
