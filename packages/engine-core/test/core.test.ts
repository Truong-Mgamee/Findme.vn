import { describe, expect, it } from 'vitest';
import { BirthInputSchema, ganzhiFromHan, ganzhiOfYear, hashSeed, mulberry32, shuffleWithSeed } from '../src/index.js';

describe('ganzhi', () => {
  it('1984 is 甲子, 1997 is 丁丑, 2026 is 丙午', () => {
    expect(ganzhiOfYear(1984).han).toBe('甲子');
    expect(ganzhiOfYear(1997).han).toBe('丁丑');
    expect(ganzhiOfYear(2026).han).toBe('丙午');
  });
  it('parses han back to index', () => {
    expect(ganzhiFromHan('丁丑').index).toBe(13);
  });
});

describe('schema', () => {
  it('requires time unless timeUnknown', () => {
    const base = { date: '1997-12-24', timeUnknown: false, gender: 'female', place: { name: 'Hà Nội', lat: 21.03, lng: 105.85 }, calendarStandard: 'vn' };
    expect(BirthInputSchema.safeParse(base).success).toBe(false);
    expect(BirthInputSchema.safeParse({ ...base, time: '12:00' }).success).toBe(true);
    expect(BirthInputSchema.safeParse({ ...base, timeUnknown: true }).success).toBe(true);
  });
});

describe('rng', () => {
  it('is deterministic', () => {
    const a = mulberry32(hashSeed('2026-10-10:w:common'));
    const b = mulberry32(hashSeed('2026-10-10:w:common'));
    expect(a()).toBe(b());
    expect(shuffleWithSeed([1, 2, 3, 4, 5], 42)).toEqual(shuffleWithSeed([1, 2, 3, 4, 5], 42));
  });
});
