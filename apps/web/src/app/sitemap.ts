import type { MetadataRoute } from 'next';
import { routing, type AppLocale, type Pathname } from '@/i18n/routing';
import { SEO_TASKS } from '@/lib/almanac';
import { localDate, shiftMonth } from '@/lib/dates';
import { LIFE_PATH_NUMBERS } from '@/lib/lifepath';
import { absoluteUrl } from '@/lib/seo';
import { ALL_CARD_SLUGS } from '@/lib/tarot';
import { slugFor } from '@/lib/zodiac';

type Entry = { pathname: Pathname; params?: Record<string, string>; byLocale?: (l: AppLocale) => Record<string, string>; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] };

/** One entry per locale with hreflang alternates for the sibling locales. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = localDate('Asia/Ho_Chi_Minh');
  const y = Number(now.slice(0, 4));
  const m = Number(now.slice(5, 7));
  const entries: Entry[] = [
    { pathname: '/', priority: 1, changeFrequency: 'weekly' },
    { pathname: '/almanac-today', priority: 0.9, changeFrequency: 'daily' },
    { pathname: '/tarot-card-of-the-day', priority: 0.9, changeFrequency: 'daily' },
    { pathname: '/moon-today', priority: 0.8, changeFrequency: 'daily' },
    ...[-1, 0, 1, 2].map((d): Entry => ({ pathname: '/almanac/[month]', params: { month: shiftMonth(y, m, d) }, priority: 0.7, changeFrequency: 'weekly' })),
    ...SEO_TASKS.map((task): Entry => ({ pathname: '/good-days/[task]', params: { task }, priority: 0.8, changeFrequency: 'daily' })),
    ...Array.from({ length: 12 }, (_, b): Entry => ({ pathname: '/zodiac/[chi]', byLocale: (l) => ({ chi: slugFor(b, l) }), priority: 0.6, changeFrequency: 'monthly' })),
    ...ALL_CARD_SLUGS.map((card): Entry => ({ pathname: '/tarot/[card]', params: { card }, priority: 0.5, changeFrequency: 'monthly' })),
    ...LIFE_PATH_NUMBERS.map((n): Entry => ({ pathname: '/life-path-number/[n]', params: { n: String(n) }, priority: 0.6, changeFrequency: 'monthly' })),
  ];
  const out: MetadataRoute.Sitemap = [];
  for (const e of entries) {
    const urlFor = (l: AppLocale) => absoluteUrl(l, e.pathname, e.byLocale ? e.byLocale(l) : e.params);
    const languages: Record<string, string> = {};
    for (const l of routing.locales) languages[l] = urlFor(l);
    for (const l of routing.locales) out.push({ url: urlFor(l), lastModified: new Date(), changeFrequency: e.changeFrequency, priority: e.priority, alternates: { languages } });
  }
  return out;
}
