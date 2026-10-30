import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { getDayAlmanac, personalizeAlmanac } from '@findme/engine-almanac';
import { AlmanacDayCard, ThemeProvider } from '../src/index.js';

const day = getDayAlmanac('2026-02-17', 'vn', 'vi'); // Tết Bính Ngọ 2026 (VN standard)

describe('AlmanacDayCard', () => {
  it('shows the lunar date per standard, 黄道/黑道 badge, yi/ji chips and good hours', async () => {
    await render(
      <ThemeProvider>
        <AlmanacDayCard almanac={day} dateLabel="17/02/2026" labels={{ huangdao: 'Hoàng đạo', heidao: 'Hắc đạo', goodHours: 'Giờ tốt' }} />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('lunar-date').props.children).toBe(`${day.lunar.day}/${day.lunar.month}`);
    expect(day.lunar.day).toBe(1);
    expect(day.lunar.month).toBe(1);
    expect(screen.getByText('VN')).toBeTruthy();
    expect(screen.getByText(day.huangdao ? 'Hoàng đạo' : 'Hắc đạo')).toBeTruthy();
    for (const i of day.yi.slice(0, 6)) expect(screen.getAllByText(i.label).length).toBeGreaterThan(0);
    for (const i of day.ji.slice(0, 6)) expect(screen.getAllByText(i.label).length).toBeGreaterThan(0);
    const good = day.hours.filter((h) => h.auspicious);
    expect(good.length).toBeGreaterThan(0);
    for (const h of good) expect(screen.getByTestId(`hour-${h.branch}`)).toBeTruthy();
    expect(screen.getByText('Giờ tốt')).toBeTruthy();
  });

  it('warns when the day clashes with the profile year branch and shows lucky number/colour', async () => {
    // profile born in the branch opposite to the day branch → clash
    const clashBranch = (day.dayGanzhi.branch + 6) % 12;
    const personalized = personalizeAlmanac(day, { yearBranch: clashBranch, usefulElements: [0], dayMasterElement: 1 });
    expect(personalized.personal.clashesWithUser).toBe(true);
    const onHour = jest.fn();
    await render(
      <ThemeProvider>
        <AlmanacDayCard almanac={personalized} onPressHour={onHour} labels={{ clashesWithUser: 'Ngày xung tuổi' }} />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('clash-warning')).toBeTruthy();
    expect(screen.getByText('Ngày xung tuổi')).toBeTruthy();
    expect(screen.getByText(personalized.personal.luckyNumbers.join(', '))).toBeTruthy();
    expect(screen.getByText(personalized.personal.luckyColor.label)).toBeTruthy();
    const first = day.hours.find((h) => h.auspicious)!;
    await fireEvent.press(screen.getByTestId(`hour-${first.branch}`));
    expect(onHour).toHaveBeenCalledWith(first.branch);
  });

  it('renders no clash warning for a harmonious profile and supports compact mode', async () => {
    const harmony = personalizeAlmanac(day, { yearBranch: day.dayGanzhi.branch });
    await render(
      <ThemeProvider>
        <AlmanacDayCard almanac={harmony} compact />
      </ThemeProvider>,
    );
    expect(screen.queryByTestId('clash-warning')).toBeNull();
    expect(screen.queryByText('Good hours')).toBeNull();
  });
});
