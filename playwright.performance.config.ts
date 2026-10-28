import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/performance',
  testMatch: '*.perf.ts',
  workers: 1,
  retries: 0,
  timeout: 420_000,
  reporter: [['list']],
  outputDir: 'test-results/performance',
  use: {
    baseURL: 'http://localhost:4174',
    ignoreHTTPSErrors: true,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: 'pnpm exec vite preview --port 4174 --strictPort',
    url: 'http://localhost:4174',
    reuseExistingServer: false,
  },
});
