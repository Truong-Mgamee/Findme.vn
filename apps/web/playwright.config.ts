import { defineConfig, devices } from '@playwright/test';

/**
 * E2E against `next start` with NO API URL: every SEO page must render from the engines alone.
 * Browsers: set PLAYWRIGHT_BROWSERS_PATH (CI image: /opt/pw-browsers) or run `playwright install chromium`.
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm exec next start -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}/vi/lich-am-hom-nay`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { NEXT_PUBLIC_API_URL: '', API_URL: '', NEXT_PUBLIC_SITE_URL: `http://127.0.0.1:${PORT}` },
  },
});
