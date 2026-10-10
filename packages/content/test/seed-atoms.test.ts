import { describe, expect, it } from 'vitest';
import { countWords, generateKeyManifest, loadAtoms, TRADITIONS } from '../src/atoms/index.js';

const manifest = generateKeyManifest();
const all = new Set(TRADITIONS.flatMap((t) => manifest.traditions[t].keys));
const atoms = loadAtoms();

const SEED_KEYS = [
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33].map((n) => `numerology.lifepath.${n}`),
  ...Array.from({ length: 22 }, (_, i) => `tarot.major-${String(i).padStart(2, '0')}.upright`),
  ...Array.from({ length: 10 }, (_, i) => `bazi.daymaster.${i}`),
  ...['ziweiMaj', 'tianjiMaj', 'taiyangMaj', 'wuquMaj', 'tiantongMaj', 'lianzhenMaj', 'tianfuMaj', 'taiyinMaj', 'tanlangMaj', 'jumenMaj', 'tianxiangMaj', 'tianliangMaj', 'qishaMaj', 'pojunMaj'].map((s) => `ziwei.soulstar.${s}`),
  'almanac.tianshen.huangdao', 'almanac.tianshen.heidao',
  ...['建', '除', '满', '平', '定', '执', '破', '危', '成', '收', '开', '闭'].map((z) => `almanac.zhixing.${z}`),
  ...Array.from({ length: 8 }, (_, i) => `iching.hex.${i + 1}`),
];

describe('seed atoms on disk', () => {
  it('every atom validates, points at a manifest key, and is unique per key+locale', () => {
    expect(atoms.length).toBeGreaterThan(0);
    const seen = new Set<string>();
    for (const a of atoms) {
      expect(all.has(a.key), a.key).toBe(true);
      const id = `${a.key}@${a.locale}`;
      expect(seen.has(id), `duplicate ${id}`).toBe(false);
      seen.add(id);
    }
  });
  it('day-one seed keys exist in vi and en as human-reviewed atoms', () => {
    const byId = new Map(atoms.map((a) => [`${a.key}@${a.locale}`, a]));
    for (const k of SEED_KEYS) for (const l of ['vi', 'en']) {
      const a = byId.get(`${k}@${l}`);
      expect(a, `${k}@${l}`).toBeDefined();
      expect(a!.author).toBe('human');
      expect(['reviewed', 'published']).toContain(a!.status);
    }
    expect(SEED_KEYS.length).toBe(80);
  });
  it('bodies are 60–140 words, end with a nudge, and avoid absolutes / fear words', () => {
    const banned: Record<string, RegExp> = {
      en: /\b(will definitely|guarantee|guaranteed|certainly|never fail|(?<!Wheel of )fortune|doomed|you will die|accident)\b/i,
      vi: /(chắc chắn sẽ|đảm bảo|không bao giờ|số bạn là|tai nạn|(?<!Cái )chết)/i,
    };
    for (const a of atoms.filter((x) => x.author === 'human')) {
      const n = countWords(a.body_md);
      expect(n, `${a.id} has ${n} words`).toBeGreaterThanOrEqual(60);
      expect(n, `${a.id} has ${n} words`).toBeLessThanOrEqual(140);
      expect(a.body_md.trim()).toMatch(/[.!?…]$/);
      const re = banned[a.locale];
      if (re) expect(a.body_md, `${a.id} contains a banned phrase`).not.toMatch(re);
      if (a.locale === 'vi') expect(a.body_md, `${a.id} should address "bạn"`).toMatch(/\bbạn\b/);
      if (a.locale === 'en') expect(a.body_md, `${a.id} should address "you"`).toMatch(/\byou\b/i);
    }
  });
});
