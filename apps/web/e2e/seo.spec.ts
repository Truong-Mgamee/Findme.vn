import { expect, test } from '@playwright/test';
import { getDayAlmanac } from '@findme/engine-almanac';
import { civilToLunar } from '@findme/engine-calendar';
import { dailyCard } from '@findme/engine-tarot';
import { lifePath, parseDate } from '@findme/engine-numerology';

function todayIn(tz: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

test.describe('SEO hub (engine-only, no API)', () => {
  test('/vi/lich-am-hom-nay shows today\'s lunar date per the VN standard', async ({ page }) => {
    const res = await page.goto('/vi/lich-am-hom-nay');
    expect(res?.status()).toBe(200);
    await expect(page.getByTestId('title')).toContainText('Lịch âm hôm nay');
    const [y, m, d] = todayIn('Asia/Ho_Chi_Minh').split('-').map(Number) as [number, number, number];
    const lunar = civilToLunar(y, m, d, 'vn');
    const almanac = getDayAlmanac(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, 'vn', 'vi');
    await expect(page.getByTestId('lunar-date')).toContainText(`Ngày ${lunar.day} tháng ${lunar.month}`);
    await expect(page.getByTestId('huangdao')).toContainText(almanac.huangdao ? 'hoàng đạo' : 'hắc đạo');
    // lunar-typescript yields 13 hour slots (early/late 子); compare with the engine rather than a fixed count
    await expect(page.getByTestId('good-hours').locator('li')).toHaveCount(almanac.hours.filter((h) => h.auspicious).length);
    await expect(page.getByTestId('yi').locator('li')).toHaveCount(almanac.yi.length);
    await expect(page.getByTestId('yi').locator('li').first()).toBeVisible();
    // hreflang + JSON-LD + canonical
    await expect(page.locator('link[rel="alternate"][hreflang="vi-VN"]')).toHaveAttribute('href', /\/vi\/lich-am-hom-nay$/);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', /\/en\/lunar-calendar-today$/);
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(JSON.parse(ld ?? '{}')['@type']).toBe('Article');
    expect(await page.locator('meta[name="google-play-app"]').count()).toBe(1);
  });

  test('/en/tarot-card-of-the-day equals the Daily Oracle w:common card (UTC date)', async ({ page }) => {
    await page.goto('/en/tarot-card-of-the-day');
    const meta = page.getByTestId('draw-date');
    const date = await meta.getAttribute('data-date');
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const draw = dailyCard(date!, 'w:common');
    const expected = draw.cards[0]!;
    await expect(meta).toHaveAttribute('data-card-id', expected.card.id);
    await expect(meta).toHaveAttribute('data-reversed', String(expected.reversed));
    await expect(page.getByTestId('card-name')).toContainText(expected.card.name_en);
    await expect(page.getByTestId('keywords').locator('li')).toHaveCount((expected.reversed ? expected.card.keywords_reversed : expected.card.keywords_upright).length);
  });

  test('/en/life-path-number/7 renders and the calculator computes with engine-numerology', async ({ page }) => {
    await page.goto('/en/life-path-number/7');
    await expect(page.getByTestId('title')).toContainText('Life path number 7');
    await page.getByTestId('lp-date').fill('1990-05-15');
    await page.getByTestId('lp-submit').click();
    const expected = lifePath(parseDate('1990-05-15')).value;
    await expect(page.getByTestId('lp-result')).toContainText(`Your life path number is ${expected}`);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/en\/life-path-number\/7$/);
  });

  test('/vi/lich-am/[yyyy-mm] month grid has one cell per day with correct lunar dates', async ({ page }) => {
    const ym = todayIn('Asia/Ho_Chi_Minh').slice(0, 7);
    const res = await page.goto(`/vi/lich-am/${ym}`);
    expect(res?.status()).toBe(200);
    const [y, m] = ym.split('-').map(Number) as [number, number];
    const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const cells = page.getByTestId('day-cell');
    await expect(cells).toHaveCount(days);
    for (const d of [1, 15, days]) {
      const lunar = civilToLunar(y, m, d, 'vn');
      await expect(cells.nth(d - 1)).toHaveAttribute('data-lunar', `${lunar.month}/${lunar.day}`);
    }
    await expect(page.locator('a[rel="next"]')).toHaveAttribute('href', new RegExp(`/vi/lich-am/\\d{4}-\\d{2}$`));
  });

  test('/en/moon-today, zodiac and good-days render; invalid slugs 404', async ({ page }) => {
    await page.goto('/en/moon-today');
    await expect(page.getByTestId('phase')).not.toBeEmpty();
    await page.goto('/vi/tu-vi-12-con-giap/thin');
    await expect(page.getByTestId('title')).toContainText('Rồng');
    await page.goto('/vi/xem-ngay-tot/wedding');
    await expect(page.getByTestId('ranked').locator('li').first()).toBeVisible();
    const nf = await page.goto('/vi/xem-ngay-tot/nope');
    expect(nf?.status()).toBe(404);
  });

  test('sitemap, robots and manifest are served', async ({ request }) => {
    const sm = await request.get('/sitemap.xml');
    expect(sm.status()).toBe(200);
    expect(await sm.text()).toContain('/en/tarot/the-fool');
    const rb = await request.get('/robots.txt');
    expect(await rb.text()).toContain('Disallow: /admin');
    const mf = await request.get('/manifest.webmanifest');
    expect((await mf.json()).display).toBe('standalone');
  });
});
