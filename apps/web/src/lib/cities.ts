import raw from '../../data/cities.json' with { type: 'json' };

export interface City {
  name: string;
  country: string;
  lat: number;
  lng: number;
  tz: string;
}

/** ~300 cities: all 63 Vietnamese provinces/cities + major world cities. Rows: [name, ISO country, lat, lng, IANA tz]. */
export const CITIES: City[] = (raw as Array<[string, string, number, number, string]>).map(([name, country, lat, lng, tz]) => ({ name, country, lat, lng, tz }));

const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');

export function searchCities(query: string, limit = 8): City[] {
  const q = fold(query.trim());
  if (!q) return [];
  const starts: City[] = [];
  const contains: City[] = [];
  for (const c of CITIES) {
    const n = fold(c.name);
    if (n.startsWith(q)) starts.push(c);
    else if (n.includes(q)) contains.push(c);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}
