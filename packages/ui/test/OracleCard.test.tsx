import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { getDayAlmanac, personalizeAlmanac } from '@findme/engine-almanac';
import { dailySky } from '@findme/engine-astro';
import { dailyCard } from '@findme/engine-tarot';
import { OracleCard, pickContent, ThemeProvider, type DailyPayload } from '../src/index.js';

const date = '2026-10-10';
const almanac = personalizeAlmanac(getDayAlmanac(date, 'vn', 'vi'), { yearBranch: 6, usefulElements: [0, 4], dayMasterElement: 2 });
const draw = dailyCard(date, 'w:common');
const drawn = draw.cards[0]!;

const payload: DailyPayload = {
  date,
  tz: 'Asia/Ho_Chi_Minh',
  locale: 'vi',
  traditionPack: 'both',
  profileId: 'p1',
  needsProfile: false,
  segments: ['ea:common', 'ea:6', 'w:common', 'w:lp:7'],
  content: {
    'ea:common': { headline: 'Ngày chung', body: 'Nội dung chung' },
    'ea:6': { headline: 'Hôm nay hợp với bạn', body: 'Hãy làm việc lớn buổi sáng.', focus: 'Tài chính', luckyHint: 'Mặc màu xanh' },
  },
  eastAsia: { almanac, atomKeys: [] },
  western: { personalDay: 7, sky: dailySky(new Date(`${date}T05:00:00Z`)), lifePath: 7, sunSign: 'libra', atomKeys: [] },
  streak: { current: 5, longest: 9, lastDate: date },
  tarot: { card: { id: drawn.card.id, name: drawn.card.name_en, reversed: drawn.reversed, position: { key: 'card', label: 'Lá bài' } }, keywords: drawn.reversed ? drawn.card.keywords_reversed : drawn.card.keywords_upright },
};

describe('OracleCard', () => {
  it('prefers the personal segment over the common one', async () => {
    expect(pickContent(payload)?.headline).toBe('Hôm nay hợp với bạn');
    expect(pickContent({ ...payload, content: { 'ea:common': { headline: 'Chung' } } })?.headline).toBe('Chung');
    expect(pickContent({ ...payload, content: {} })).toBeNull();
  });

  it('renders headline, streak, almanac, tarot and numbers pages', async () => {
    const onShare = jest.fn();
    const onAsk = jest.fn();
    await render(
      <ThemeProvider>
        <OracleCard payload={payload} onShare={onShare} onAsk={onAsk} labels={{ streak: (n) => `Chuỗi ${n} ngày`, share: 'Chia sẻ', ask: 'Hỏi thêm' }} />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('oracle-headline').props.children).toBe('Hôm nay hợp với bạn');
    expect(screen.getByText('Chuỗi 5 ngày')).toBeTruthy();
    expect(screen.getByTestId('oracle-page-overview')).toBeTruthy();
    expect(screen.getByTestId('oracle-page-almanac')).toBeTruthy();
    expect(screen.getByTestId('oracle-page-tarot')).toBeTruthy();
    expect(screen.getByTestId('oracle-page-numbers')).toBeTruthy();
    expect(screen.getByTestId('oracle-page-action')).toBeTruthy();
    expect(screen.getAllByText(drawn.card.name_en).length).toBeGreaterThan(0);
    expect(screen.getByTestId('oracle-lucky-number').props.children).toBe(almanac.personal.luckyNumbers.join(' · '));
    expect(screen.getByText('Personal day 7')).toBeTruthy();
    expect(screen.getByText('Tài chính')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('oracle-share'));
    await fireEvent.press(screen.getByTestId('oracle-ask'));
    expect(onShare).toHaveBeenCalled();
    expect(onAsk).toHaveBeenCalled();
    expect(screen.queryByTestId('oracle-offline')).toBeNull();
  });

  it('shows the offline badge and a placeholder when no daily copy exists (western only)', async () => {
    const west: DailyPayload = { ...payload, traditionPack: 'western', segments: ['w:common'], content: {}, eastAsia: undefined, tarot: null };
    await render(
      <ThemeProvider scheme="light">
        <OracleCard payload={west} offline labels={{ offline: 'Ngoại tuyến', noContent: 'Đang viết…' }} />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('oracle-offline')).toBeTruthy();
    expect(screen.getByText('Ngoại tuyến')).toBeTruthy();
    expect(screen.getByTestId('oracle-headline').props.children).toBe('Đang viết…');
    expect(screen.queryByTestId('oracle-page-almanac')).toBeNull();
    expect(screen.queryByTestId('oracle-page-tarot')).toBeNull();
    expect(screen.getByTestId('oracle-personal-day')).toBeTruthy();
  });
});
