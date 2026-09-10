import { defineConfig, devices } from '@playwright/test';

const storybookPort = Number(process.env['STORYBOOK_PORT'] ?? 6006);
if (!Number.isInteger(storybookPort) || storybookPort < 1 || storybookPort > 65_535) {
  throw new Error('STORYBOOK_PORT must be an integer from 1 through 65535');
}
const storybookUrl = `http://localhost:${storybookPort}`;

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
    baseURL: storybookUrl,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npx http-server apps/storybook/storybook-static --port ${storybookPort} --silent`,
    url: storybookUrl,
    reuseExistingServer: !process.env['CI'],
    timeout: 60000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        // Linux Firefox runners can inherit a controls-only sequential-focus preference.
        // Pin the browser lane to links + controls so native Tab-order assertions exercise
        // the repository's documented keyboard contract instead of a host preference.
        launchOptions: {
          firefoxUserPrefs: { 'accessibility.tabfocus': 7 },
        },
      },
    },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
