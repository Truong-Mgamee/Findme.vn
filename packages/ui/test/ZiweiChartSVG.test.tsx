import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { computeZiwei, computeZiweiHoroscope } from '@findme/engine-ziwei';
import { ThemeProvider, ZiweiChartSVG } from '../src/index.js';
import { BIRTH, BIRTH_NO_TIME } from './fixtures.js';

const chart = computeZiwei(BIRTH, { locale: 'vi' });
const horoscope = computeZiweiHoroscope(BIRTH, '2026-10-10', { locale: 'vi' });

describe('ZiweiChartSVG', () => {
  it('renders all 12 palaces with names and stem/branch, plus the centre panel', () => {
    render(
      <ThemeProvider>
        <ZiweiChartSVG chart={chart} testID="ziwei" />
      </ThemeProvider>,
    );
    expect(chart.palaces).toHaveLength(12);
    for (const p of chart.palaces) {
      expect(screen.getByTestId(`palace-${p.key}`)).toBeTruthy();
      expect(screen.getAllByText(p.name).length).toBeGreaterThan(0);
      expect(screen.getAllByText(`${p.stem.han}${p.branch.han}`).length).toBeGreaterThan(0);
    }
    expect(screen.getByTestId('ziwei-centre')).toBeTruthy();
    expect(screen.getByText(`局: ${chart.fiveElementsClass.name}`)).toBeTruthy();
    expect(screen.getByText(`命主: ${chart.soul.name}`)).toBeTruthy();
  });

  it('lists major stars (with brightness / mutagen) and exposes them to screen readers', () => {
    render(
      <ThemeProvider>
        <ZiweiChartSVG chart={chart} />
      </ThemeProvider>,
    );
    const soul = chart.palaces.find((p) => p.key === 'soulPalace')!;
    const label = screen.getByTestId('palace-soulPalace').props.accessibilityLabel as string;
    expect(label).toContain(soul.name);
    for (const s of soul.majorStars) {
      expect(label).toContain(s.name);
      expect(screen.getAllByText(s.name).length).toBeGreaterThan(0);
    }
    const withMutagen = chart.palaces.flatMap((p) => p.majorStars).find((s) => s.mutagen);
    expect(withMutagen).toBeDefined();
    expect(screen.getAllByText(/[祿權科忌]/).length).toBeGreaterThan(0);
  });

  it('calls onPressPalace with the palace and marks horoscope palaces', () => {
    const onPress = jest.fn();
    render(
      <ThemeProvider>
        <ZiweiChartSVG chart={chart} horoscope={horoscope} onPressPalace={onPress} labels={{ decadal: 'Đại hạn', yearly: 'Lưu niên' }} />
      </ThemeProvider>,
    );
    fireEvent.press(screen.getByTestId('palace-spousePalace'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress.mock.calls[0][0].key).toBe('spousePalace');
    expect(screen.getByText('Đại hạn')).toBeTruthy();
    expect(screen.getByText('Lưu niên')).toBeTruthy();
  });

  it('flags low confidence when the birth time is unknown', () => {
    const c = computeZiwei(BIRTH_NO_TIME, { locale: 'vi' });
    expect(c.confidence).toBe('low');
    render(
      <ThemeProvider scheme="light">
        <ZiweiChartSVG chart={c} />
      </ThemeProvider>,
    );
    expect(screen.getByText('⚠ ≈')).toBeTruthy();
  });
});
