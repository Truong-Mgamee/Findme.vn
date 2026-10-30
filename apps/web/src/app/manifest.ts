import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Findme',
    short_name: 'Findme',
    description: 'Lunar almanac, Zi Wei, Bazi, tarot, numerology and astrology — computed, then explained.',
    id: '/vi/app',
    start_url: '/vi/app',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0b1020',
    theme_color: '#0b1020',
    lang: 'vi',
    categories: ['lifestyle'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Today', url: '/vi/app', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Lịch âm hôm nay', url: '/vi/lich-am-hom-nay' },
    ],
  };
}
