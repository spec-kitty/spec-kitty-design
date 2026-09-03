/**
 * A real downstream consumer of the ESM artifact (FR-003, SC-008).
 *
 * Without this fixture nothing in the repo ever *consumes* dist/index.js, and
 * "lit is external" is only checkable by grepping the artifact — which proves the
 * import exists, not that any bundler can resolve it. This builds the artifact
 * into an app and the Playwright spec then loads that app and checks the element
 * actually upgraded.
 *
 * The alias is what a published package would resolve by its `exports` map; the
 * package is `"private": true` for this mission (#80 publishes), so the fixture
 * points at the built artifact directly rather than pretending npm resolution.
 */
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');

export default defineConfig({
  root: import.meta.dirname,
  resolve: {
    alias: {
      '@spec-kitty/elements': resolve(root, 'packages/elements/dist/index.js'),
    },
  },
  // Relative asset URLs. The built app is served from a SUBPATH
  // (storybook-static/vite-consumer/), so Vite's default root-absolute `/assets/...`
  // would 404 and the element would silently never upgrade — which reads exactly
  // like "the ESM artifact is not consumable".
  base: './',
  build: { outDir: 'dist', emptyOutDir: true },
});
