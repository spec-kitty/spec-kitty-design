/**
 * Vitest config — two lanes, one file (ADR-11, FR-001/FR-002).
 *
 * `.mts`, not `.ts`: a `.ts` config in a package without `"type": "module"` makes Vite
 * emit a `configLoader: 'native'` deprecation on EVERY run, which pollutes CI logs.
 *
 * Do NOT rename this to `vite.config.ts`. It would be picked up by Vite's own config
 * discovery and merged into every Storybook build — this is the repository's first
 * root-level vite-family config, and that filename is one character from a repo-wide
 * regression.
 */
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));

/**
 * webkit in CI, chromium everywhere.
 *
 * Engine difference is ADR-11's strongest driver — kitty-desktop runs WebKitGTK, and
 * `adoptedStyleSheets` support decides whether Lit injects a `<style>` element a consumer
 * CSP then strips. But Playwright's webkit build targets Ubuntu and **cannot launch on
 * this project's Fedora workstation** (measured: missing libgtk-4-1, libicu74,
 * gstreamer1.0-libav). Making it unconditional would mean `npm run test` — FR-002's
 * headline command — fails on a clean local checkout.
 *
 * So it is env-gated, and `scripts/floor-reporter.mjs` asserts webkit actually executed
 * whenever CI is set. Gating without that assertion would just be a quieter way of not
 * running it.
 */
const instances = process.env['CI']
  ? [{ browser: 'chromium' as const }, { browser: 'webkit' as const }]
  : [{ browser: 'chromium' as const }];

export default defineConfig({
  resolve: {
    alias: {
      // Vite does NOT read tsconfig `paths`. Without this the browser lane resolves
      // @spec-kitty/elements through package.json `main` to ./dist/index.js, which does
      // not exist in any job that has not built — dist/ is gitignored. That cost #70 two
      // CI failures; SC-022 asserts the suite passes with no dist/ present.
      '@spec-kitty/elements': resolve(root, 'packages/elements/src/index.ts'),
      '@spec-kitty/styles': resolve(root, 'packages/styles/src/index.ts'),
      '@spec-kitty/tokens': resolve(root, 'packages/tokens/src/index.ts'),
    },
  },
  test: {
    // `retry`, NOT `retries`. `retries` is not in the Vitest 4 config type and is silently
    // ignored — a config written that way sets nothing, and an assertion on it reads
    // undefined. playwright.config.ts sets 2 in CI; inheriting that by analogy would
    // absorb the flake ADR-11 says must be diagnosed.
    retry: 0,
    projects: [
      {
        resolve: { alias: { '@spec-kitty/elements': resolve(root, 'packages/elements/src/index.ts') } },
        test: {
          name: 'browser',
          include: ['tests/browser/**/*.test.ts', 'fixtures/**/src/**/*.test.ts'],
          retry: 0,
          browser: {
            enabled: true,
            headless: true,
            // The v4 provider is a FUNCTION you call. `provider: 'playwright'` is the
            // v2/v3 shape and is silently wrong here.
            provider: playwright(),
            instances,
          },
        },
      },
      {
        test: {
          name: 'node',
          environment: 'node',
          include: ['tests/node/**/*.test.ts'],
          retry: 0,
        },
      },
    ],
  },
});
