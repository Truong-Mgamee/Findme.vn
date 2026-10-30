import type { BirthInput } from '@findme/engine-core';

const P = {
  hanoi: { name: 'Hà Nội', lat: 21.0285, lng: 105.8542, tz: 'Asia/Ho_Chi_Minh', country: 'VN' },
  saigon: { name: 'TP.HCM', lat: 10.7769, lng: 106.7009, tz: 'Asia/Ho_Chi_Minh', country: 'VN' },
  beijing: { name: 'Beijing', lat: 39.9042, lng: 116.4074, tz: 'Asia/Shanghai', country: 'CN' },
  taipei: { name: 'Taipei', lat: 25.033, lng: 121.5654, tz: 'Asia/Taipei', country: 'TW' },
  seoul: { name: 'Seoul', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul', country: 'KR' },
  tokyo: { name: 'Tokyo', lat: 35.6762, lng: 139.6503, tz: 'Asia/Tokyo', country: 'JP' },
  nyc: { name: 'New York', lat: 40.7128, lng: -74.006, tz: 'America/New_York', country: 'US' },
  la: { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, tz: 'America/Los_Angeles', country: 'US' },
  london: { name: 'London', lat: 51.5074, lng: -0.1278, tz: 'Europe/London', country: 'GB' },
  saopaulo: { name: 'São Paulo', lat: -23.5505, lng: -46.6333, tz: 'America/Sao_Paulo', country: 'BR' },
  sydney: { name: 'Sydney', lat: -33.8688, lng: 151.2093, tz: 'Australia/Sydney', country: 'AU' },
  helsinki: { name: 'Helsinki', lat: 60.1699, lng: 24.9384, tz: 'Europe/Helsinki', country: 'FI' },
} as const;

export interface GoldenProfile {
  id: string;
  note: string;
  input: BirthInput;
}

/** Deterministic, hand-picked edge cases. Changing any engine output for these requires a reviewed snapshot update. */
export const PROFILES: GoldenProfile[] = [
  { id: 'vn-1997-ref', note: 'reference case used across docs', input: { date: '1997-12-24', time: '12:00', timeUnknown: false, gender: 'female', place: P.hanoi, calendarStandard: 'vn' } },
  { id: 'vn-tet-1985', note: 'VN Tết one month before China', input: { date: '1985-01-21', time: '10:00', timeUnknown: false, gender: 'male', place: P.saigon, calendarStandard: 'vn' } },
  { id: 'cn-tet-1985', note: 'same civil date under CN standard', input: { date: '1985-01-21', time: '10:00', timeUnknown: false, gender: 'male', place: P.beijing, calendarStandard: 'cn' } },
  { id: 'vn-2007-boundary', note: 'VN/CN differ by one day', input: { date: '2007-02-17', time: '23:30', timeUnknown: false, gender: 'female', place: P.hanoi, calendarStandard: 'vn' } },
  { id: 'vn-leap-2023', note: 'leap 2nd month 2023', input: { date: '2023-03-25', time: '06:15', timeUnknown: false, gender: 'female', place: P.hanoi, calendarStandard: 'vn' } },
  { id: 'cn-lichun-before', note: '1h before 立春 2026 (Beijing 03:30)', input: { date: '2026-02-04', time: '03:30', timeUnknown: false, gender: 'male', place: P.beijing, calendarStandard: 'cn', useTrueSolarTime: false } },
  { id: 'cn-lichun-after', note: '1h after 立春 2026', input: { date: '2026-02-04', time: '05:00', timeUnknown: false, gender: 'male', place: P.beijing, calendarStandard: 'cn', useTrueSolarTime: false } },
  { id: 'tw-late-zi', note: 'late 子 hour Taipei', input: { date: '1990-08-15', time: '23:40', timeUnknown: false, gender: 'female', place: P.taipei, calendarStandard: 'cn' } },
  { id: 'kr-saju', note: 'Korea: true solar time ≈ −32 min', input: { date: '1988-09-17', time: '00:20', timeUnknown: false, gender: 'male', place: P.seoul, calendarStandard: 'kr' } },
  { id: 'jp-shichu', note: 'Japan standard (approx flag)', input: { date: '1975-04-30', time: '14:05', timeUnknown: false, gender: 'female', place: P.tokyo, calendarStandard: 'jp' } },
  { id: 'us-dst', note: 'New York in DST', input: { date: '1990-05-15', time: '08:30', timeUnknown: false, gender: 'female', place: P.nyc, calendarStandard: 'cn' } },
  { id: 'us-dst-change-day', note: 'US DST switch day 2024-03-10 02:30 (non-existent local time)', input: { date: '2024-03-10', time: '03:30', timeUnknown: false, gender: 'male', place: P.la, calendarStandard: 'cn' } },
  { id: 'uk-winter', note: 'London winter, UTC', input: { date: '2000-01-01', time: '12:00', timeUnknown: false, gender: 'other', place: P.london, calendarStandard: 'cn' } },
  { id: 'br-southern', note: 'Southern hemisphere, Brazil', input: { date: '1995-11-02', time: '19:45', timeUnknown: false, gender: 'female', place: P.saopaulo, calendarStandard: 'cn' } },
  { id: 'au-sydney', note: 'Sydney DST (southern summer)', input: { date: '2001-12-25', time: '09:10', timeUnknown: false, gender: 'male', place: P.sydney, calendarStandard: 'cn' } },
  { id: 'fi-high-lat', note: 'high latitude (Placidus still OK at 60°)', input: { date: '1982-06-21', time: '03:00', timeUnknown: false, gender: 'female', place: P.helsinki, calendarStandard: 'cn' } },
  { id: 'vn-time-unknown', note: 'unknown birth time', input: { date: '1969-07-20', timeUnknown: true, gender: 'male', place: P.hanoi, calendarStandard: 'vn' } },
  { id: 'no-tz', note: 'tz missing → estimated from longitude', input: { date: '2010-10-10', time: '10:10', timeUnknown: false, gender: 'female', place: { name: 'Unknown', lat: 16.0, lng: 108.2 }, calendarStandard: 'vn' } },
  { id: 'vn-early-zi', note: 'early 子 00:30 Saigon', input: { date: '2004-02-29', time: '00:30', timeUnknown: false, gender: 'male', place: P.saigon, calendarStandard: 'vn' } },
  { id: 'cn-1900', note: 'early 20th century', input: { date: '1912-02-18', time: '08:00', timeUnknown: false, gender: 'male', place: P.beijing, calendarStandard: 'cn' } },
];
