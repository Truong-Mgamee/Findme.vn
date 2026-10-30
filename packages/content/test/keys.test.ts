import { describe, expect, it } from 'vitest';
import type { BirthInput } from '@findme/engine-core';
import { atomKeysForZiwei, computeZiwei, computeZiweiHoroscope } from '@findme/engine-ziwei';
import { atomKeysForBazi, computeBazi } from '@findme/engine-bazi';
import { atomKeysForNumerology, computeNumerologyFromBirth } from '@findme/engine-numerology';
import { atomKeysForAlmanac, getDayAlmanac, YIJI_TERMS } from '@findme/engine-almanac';
import { atomKeysForDailySky, dailySky } from '@findme/engine-astro';
import { generateKeyManifest, keysForTradition, TRADITIONS, ZIWEI_PATTERNS } from '../src/atoms/index.js';
import manifestOnDisk from '../keys-manifest.json' with { type: 'json' };

const HANOI = { name: 'Hà Nội', lat: 21.0285, lng: 105.8542, tz: 'Asia/Ho_Chi_Minh', country: 'VN' };
const profile: BirthInput = { date: '1997-12-24', time: '12:00', timeUnknown: false, gender: 'female', place: HANOI, calendarStandard: 'vn' };

describe('generateKeyManifest', () => {
  const m = generateKeyManifest();
  const yiji = Object.keys(YIJI_TERMS).length;

  it('enumerates the expected key counts per tradition', () => {
    expect(m.traditions.ziwei.count).toBe(14 * 13 + 14 + 9 + 5 + ZIWEI_PATTERNS.length + 13 + 13 + 14 * 4 * 4 + 12 + 18);
    expect(m.traditions.bazi.count).toBe(10 + 30 + 30 + 30 + 10 + 5 + 10 + 5);
    expect(m.traditions.almanac.count).toBe(2 + 12 + 28 + 9 + yiji * 2 + 2);
    expect(m.traditions.tarot.count).toBe(78 * 2 + 1 + 3 + 5 + 10);
    expect(m.traditions.iching.count).toBe(64 + 384 + 64);
    expect(m.traditions.numerology.count).toBe(6 * 12 + 3 * 9 + 4 + 3);
    expect(m.traditions.astro.count).toBe(3 * 12 + 5 * 12 + 8 + 8 + 8);
    expect(m.total).toBe(Object.values(m.traditions).reduce((n, t) => n + t.count, 0));
  });

  it('has unique keys, each prefixed with its tradition', () => {
    for (const t of TRADITIONS) {
      const keys = m.traditions[t].keys;
      expect(new Set(keys).size).toBe(keys.length);
      expect(keys.every((k) => k.startsWith(`${t}.`) && !/\s/.test(k))).toBe(true);
    }
  });

  it('matches the committed keys-manifest.json (run `pnpm keys:manifest` after changing key grammar)', () => {
    for (const t of TRADITIONS) expect((manifestOnDisk as typeof m).traditions[t].keys).toEqual(m.traditions[t].keys);
  });

  it('covers every key the engines emit for the 1997-12-24 12:00 Hanoi female profile', () => {
    const all = new Set(TRADITIONS.flatMap((t) => keysForTradition(t)));
    // The manifest deliberately limits `ziwei.mutagen.*` to the 4 key palaces (soul/spouse/wealth/career);
    // the engine also emits them for the other focus palaces, which have no atom by design.
    const keyPalaceMutagen = /^ziwei\.mutagen\.[^.]+\.[^.]+\.palace\.(?!soulPalace|spousePalace|wealthPalace|careerPalace)/;
    const missing = (keys: string[]) => keys.filter((k) => !all.has(k) && !keyPalaceMutagen.test(k));
    const chart = computeZiwei(profile, { locale: 'vi' });
    expect(missing(atomKeysForZiwei(chart, computeZiweiHoroscope(profile, '2026-10-10', { locale: 'vi' })))).toEqual([]);
    expect(missing(atomKeysForBazi(computeBazi(profile, { locale: 'vi' })))).toEqual([]);
    expect(missing(atomKeysForNumerology(computeNumerologyFromBirth(profile, { fullName: 'Nguyen Thi Mai', refDate: '2026-10-10' })))).toEqual([]);
    expect(missing(atomKeysForAlmanac(getDayAlmanac('2026-10-10', 'vn', 'vi')))).toEqual([]);
    expect(missing(atomKeysForDailySky(dailySky(new Date('2026-10-10T00:00:00Z'))))).toEqual([]);
    // sanity: the sample really exercises mutagen / pattern / empty-palace grammar
    const zk = atomKeysForZiwei(chart);
    expect(zk).toContain('ziwei.soulstar.pojunMaj');
    expect(zk.some((k) => k.startsWith('ziwei.mutagen.'))).toBe(true);
    expect(zk.some((k) => k.startsWith('ziwei.pattern.'))).toBe(true);
    expect(zk.some((k) => k.endsWith('.empty'))).toBe(true);
  });
});
