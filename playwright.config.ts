import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'apps/storybook/src/tests',
  // visual-regression owns visual.spec.ts: it runs chromium-only, with its own
  // baseline handling and a diff artifact. It is excluded by default so ci-quality's
  // playwright job can run the WHOLE testDir — which is what stops a newly added spec
  // from silently never executing, the hazard two comments in this repo used to warn
  // about. The visual job opts back in with PW_INCLUDE_VISUAL=1 rather than naming a
  // file, so neither job carries a hand-maintained list.
  testIgnore: process.env['PW_INCLUDE_VISUAL'] ? [] : ['**/visual.spec.ts'],
  fullyParallel: true,
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 2 : undefined,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:6006',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx http-server apps/storybook/storybook-static --port 6006 --silent',
    url: 'http://localhost:6006',
    reuseExistingServer: !process.env['CI'],
    timeout: 60000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  ],
});
