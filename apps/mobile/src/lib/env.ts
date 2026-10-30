/** Public runtime config (EXPO_PUBLIC_* is inlined by Metro at build time). */
export const env = {
  apiUrl: (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
  posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '',
  posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
  tarotCdn: (process.env.EXPO_PUBLIC_TAROT_CDN ?? '').replace(/\/$/, ''),
  isDev: typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production',
} as const;

/** Image for a card id when a CDN is configured (docs/05: webp, 2 sizes); undefined → placeholder */
export function cardImageUri(id: string, size: 'sm' | 'lg' = 'lg'): string | undefined {
  if (!env.tarotCdn) return undefined;
  return `${env.tarotCdn}/classic-1909/${id}${size === 'sm' ? '@1x' : ''}.webp`;
}
