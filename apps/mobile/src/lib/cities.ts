/**
 * Offline place search over the bundled mini gazetteer (data/cities.json, ~380 major cities with
 * lat/lng/IANA tz/country). The API has no /v1/places yet; profiles are created with
 * `place{name,lat,lng,tz,country}` straight from this list (docs/06 P3 planned GeoNames).
 */
import cities from '../../data/cities.json';

export interface City {
  name: string;
  country: string;
  lat: number;
  lng: number;
  tz: string;
}

export const CITIES: City[] = cities as City[];

/** Strip diacritics + lower-case so "ha noi" matches "Hà Nội" and "sao paulo" matches "São Paulo". */
export function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export function searchCities(query: string, opts: { limit?: number; country?: string } = {}): City[] {
  const q = fold(query);
  const limit = opts.limit ?? 8;
  if (!q) {
    const home = opts.country ? CITIES.filter((c) => c.country === opts.country.toUpperCase()) : [];
    return [...home, ...CITIES.filter((c) => !home.includes(c))].slice(0, limit);
  }
  const scored = CITIES.map((c) => {
    const n = fold(c.name);
    let score = 0;
    if (n === q) score = 100;
    else if (n.startsWith(q)) score = 80;
    else if (n.split(/\s+/).some((w) => w.startsWith(q))) score = 60;
    else if (n.includes(q)) score = 40;
    if (score && opts.country && c.country === opts.country.toUpperCase()) score += 5;
    return { c, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name));
  return scored.slice(0, limit).map((x) => x.c);
}

export function cityKey(c: City): string {
  return `${c.name}|${c.country}`;
}
