import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { computeZiwei, computeZiweiHoroscope } from '@findme/engine-ziwei';
import { ThemeProvider, ZiweiChartSVG } from '../src/index.js';
import { BIRTH, BIRTH_NO_TIME } from './fixtures.js';
import { svgTexts } from './svg.js';

const chart = computeZiwei(BIRTH, { locale: 'vi' });
const horoscope = computeZiweiHoroscope(BIRTH, '2026-10-10', { locale: 'vi' });

describe('ZiweiChartSVG', () => {
  it('renders all 12 palaces with names and stem/branch, plus the centre panel', async () => {
    await render(
      <ThemeProvider>
        <ZiweiChartSVG chart={chart} testID="ziwei" />
      </ThemeProvider>,
    );
    expect(chart.palaces).toHaveLength(12);
    for (const p of chart.palaces) {
      expect(screen.getByTestId(`palace-${p.key}`)).toBeTruthy();
    }
    const texts = svgTexts();
    for (const p of chart.palaces) {
      expect(texts).toContain(p.name);
      expect(texts).toContain(`${p.stem.han}${p.branch.han}`);
    }
    expect(screen.getByTestId('ziwei-centre')).toBeTruthy();
    expect(texts).toContain(`局: ${chart.fiveElementsClass.name}`);
    expect(texts).toContain(`命主: ${chart.soul.name}`);
  });

  it('lists major stars (with brightness / mutagen) and exposes them to screen readers', async () => {
    await render(
      <ThemeProvider>
        <ZiweiChartSVG chart={chart} />
      </ThemeProvider>,
    );
    const soul = chart.palaces.find((p) => p.key === 'soulPalace')!;
    const label = screen.getByTestId('palace-soulPalace').props.accessibilityLabel as string;
    expect(label).toContain(soul.name);
    const texts = svgTexts();
    for (const s of soul.majorStars) {
      expect(label).toContain(s.name);
      expect(texts).toContain(s.name);
    }
    const withMutagen = chart.palaces.flatMap((p) => p.majorStars).find((s) => s.mutagen);
    expect(withMutagen).toBeDefined();
    expect(texts.some((x) => /^[祿權科忌]$/.test(x))).toBe(true);
    expect(texts.some((x) => /^[廟旺得利平不陷]$/.test(x))).toBe(true);
  });

  it('calls onPressPalace with the palace and marks horoscope palaces', async () => {
    const onPress = jest.fn();
    await render(
      <ThemeProvider>
        <ZiweiChartSVG chart={chart} horoscope={horoscope} onPressPalace={onPress} labels={{ decadal: 'Đại hạn', yearly: 'Lưu niên' }} />
      </ThemeProvider>,
    );
    await fireEvent.press(screen.getByTestId('palace-spousePalace'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress.mock.calls[0][0].key).toBe('spousePalace');
    expect(svgTexts()).toContain('Đại hạn');
    expect(svgTexts()).toContain('Lưu niên');
  });

  it('flags low confidence when the birth time is unknown', async () => {
    const c = computeZiwei(BIRTH_NO_TIME, { locale: 'vi' });
    expect(c.confidence).toBe('low');
    await render(
      <ThemeProvider scheme="light">
        <ZiweiChartSVG chart={c} />
      </ThemeProvider>,
    );
    expect(svgTexts()).toContain('⚠ ≈');
  });
});
