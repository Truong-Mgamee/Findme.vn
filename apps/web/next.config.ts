import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** Every @findme/* workspace package ships TypeScript source (main: ./src/index.ts), so Next must transpile them. */
const WORKSPACE_PACKAGES = [
  '@findme/api-client',
  '@findme/content',
  '@findme/engine-almanac',
  '@findme/engine-astro',
  '@findme/engine-bazi',
  '@findme/engine-calendar',
  '@findme/engine-core',
  '@findme/engine-numerology',
  '@findme/engine-tarot',
  '@findme/engine-ziwei',
  '@findme/i18n',
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: WORKSPACE_PACKAGES,
  poweredByHeader: false,
  // Engines are only evaluated on the server (SEO pages + route handlers); keep them out of the client bundle.
  serverExternalPackages: [],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }, { key: 'Service-Worker-Allowed', value: '/' }] },
    ];
  },
};

export default withNextIntl(nextConfig);
