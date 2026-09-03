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
    // The floor lives HERE, not in package.json's test script.
    //
    // It was wired as `--reporter=./scripts/floor-reporter.mjs` on the npm script, and all
    // five of its arms hung off those 38 characters with nothing asserting they were
    // present. Deleting the flag left every CI step green while the floor was simply
    // absent — including the two node-lane tests that "prove" the arms, which import the
    // reporter by path and are structurally incapable of noticing it is disconnected.
    // That is the seventh instance of this programme's defect class, inside the machinery
    // built to close it, and a pre-merge lens found it by deleting the flag.
    //
    // In the config it is part of the RESOLVED config, which tests/node/config-contract
    // asserts the same way it asserts `retry` — and for the same stated reason.
    reporters: ['default', './scripts/floor-reporter.mjs'],
    // `retry`, NOT `retries`. `retries` is not in the Vitest 4 config type and is silently
    // ignored — a config written that way sets nothing, and an assertion on it reads
    // undefined. playwright.config.ts sets 2 in CI; inheriting that by analogy would
    // absorb the flake ADR-11 says must be diagnosed.
    retry: 0,
    projects: [
      {
        // A project-level `resolve` REPLACES the root one, so both entries live here.
        //
        // ARRAY form with a RegExp for the tokens stylesheet, not the object form. Vite's
        // string aliases match on `id === find` or `id.startsWith(find + '/')`, so the key
        // '@spec-kitty/tokens/tokens.css' never matched '…/tokens.css?raw' — the next
        // character is '?'. Vite then fell through to real package resolution and reported
        // `Missing "./tokens.css" specifier`, which is true: the package's exports map ships
        // dist/, and dist/ is gitignored, so a subpath export would break SC-022 (the suite
        // must pass with no dist/ present). The regexp keeps the query and reaches src/.
        resolve: {
          alias: [
            {
              // Unanchored at the end ON PURPOSE: the id carries its query (`?raw`), and
              // `String.replace` substitutes only the matched prefix, so the query survives.
              // An anchored `$` matched nothing and fell through to package resolution.
              find: /^@spec-kitty\/tokens\/tokens\.css/,
              replacement: resolve(root, 'packages/tokens/src/tokens.css'),
            },
            {
              find: /^@spec-kitty\/elements$/,
              replacement: resolve(root, 'packages/elements/src/index.ts'),
            },
            {
              // Without this, suite-selftest.mjs's tmpdir resolves @spec-kitty/react back to
              // the UNMUTATED original: it symlinks the real node_modules in, and npm-workspace
              // symlinks under it are relative. Every mutation on packages/react would read as
              // "semantically inert" and pass. Same reason the three aliases above exist.
              find: /^@spec-kitty\/react$/,
              replacement: resolve(root, 'packages/react/src/index.js'),
            },
          ],
        },
        // PRE-DECLARED, because discovering them mid-run reloads the page.
        //
        // #75 added a React fixture, and on a COLD dep cache Vite discovered react and
        // react-dom while tests were already executing, re-optimized, and reloaded:
        //   [vitest] Vite unexpectedly reloaded a test. This may cause tests to fail, lead to
        //   flaky behaviour or duplicated test runs.
        // Locally the run survived the reload and reported 83/83, so this looked harmless.
        // In CI it was not: `tests/browser/registered-elements.test.ts` and
        // `fixtures/elements-behaviour/src/sk-stub.test.ts` both died with "Vitest failed to
        // find the current suite" — the reload pulled the module graph out from under a
        // collection already in progress. A warm local cache hid it entirely; the first cold
        // run reproduced the warning.
        //
        // BOTH jsx runtimes, and the DEV one is the one that actually bit. The automatic JSX
        // transform imports a runtime no source file names, and in dev mode that is
        // `react/jsx-dev-runtime`, not `react/jsx-runtime`. Listing only the production entry
        // left the dev one to be discovered mid-run:
        //   [vite] new dependencies optimized: react/jsx-dev-runtime
        //   [vite] optimized dependencies changed. reloading
        // — arriving right after tests/browser/registered-elements.test.ts had collected,
        // which is why that file and sk-stub.test.ts were the two that died in CI.
        optimizeDeps: {
          include: [
            'react',
            'react-dom',
            'react-dom/client',
            'react/jsx-runtime',
            'react/jsx-dev-runtime',
          ],
        },
        test: {
          name: 'browser',
          // `.tsx` is NOT covered by `*.test.ts` under any glob implementation, and a file
          // that matches nothing runs nowhere and is reported by nothing — the floor reporter's
          // arm 1 only catches a DECLARED lane that executed zero tests, and this lane has
          // plenty. Widened deliberately for the React consumer fixture (#75 WP03); the
          // corresponding assertion that it actually matched is in that fixture's own test.
          include: ['tests/browser/**/*.test.ts', 'fixtures/**/src/**/*.test.{ts,tsx}'],
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
