import { describe, expect, it } from 'vitest';
import { createT, defaultCalendarStandard, defaultTraditionPack, flattenKeys, getCatalog, resolveLocale } from '../src/index.js';

describe('createT', () => {
  it('formats ICU plurals per locale and falls back to en', () => {
    const tEn = createT('en');
    const tVi = createT('vi');
    expect(tEn('today.streak', { count: 1 })).toBe('1 day streak');
    expect(tEn('today.streak', { count: 5 })).toBe('5 day streak');
    expect(tVi('today.streak', { count: 5 })).toBe('Chuỗi 5 ngày');
    expect(createT('ja')('common.continue')).toBe('Continue');
    expect(tEn('nope.key')).toBe('nope.key');
  });
  it('vi and en catalogs have identical key sets', () => {
    expect(flattenKeys(getCatalog('vi')!).sort()).toEqual(flattenKeys(getCatalog('en')!).sort());
  });
});

describe('locale config', () => {
  it('maps countries to calendar standards and packs', () => {
    expect(defaultCalendarStandard('VN')).toBe('vn');
    expect(defaultCalendarStandard('TW')).toBe('cn');
    expect(defaultCalendarStandard('KR')).toBe('kr');
    expect(defaultTraditionPack('VN', 'en')).toBe('eastAsia');
    expect(defaultTraditionPack('US', 'en')).toBe('western');
    expect(defaultTraditionPack(undefined, 'vi')).toBe('eastAsia');
  });
  it('resolves device tags', () => {
    expect(resolveLocale('vi-VN')).toBe('vi');
    expect(resolveLocale('zh-Hant-HK')).toBe('zh-TW');
    expect(resolveLocale('pt-PT')).toBe('pt-BR');
    expect(resolveLocale('xx')).toBe('en');
  });
});
