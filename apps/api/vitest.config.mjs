import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { include: ['src/**/*.test.ts', 'test/**/*.test.ts'], passWithNoTests: true, testTimeout: 60000, hookTimeout: 60000, env: { NODE_ENV: 'test' } },
});
