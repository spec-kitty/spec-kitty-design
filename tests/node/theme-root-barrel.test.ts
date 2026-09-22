import { expect, test } from 'vitest';

/**
 * Its own file on purpose: importing the package root loads Lit's Node build, which installs
 * DOM shims on `globalThis`. In theme-preference-contract.test.ts that import made the
 * DOM-global-absence assertions order-dependent; Vitest isolates files, so here it cannot.
 */
test('the root barrel publishes every runtime value of the DOM-free theme contract', async () => {
  // custom-elements-manifest.config.mjs rewrites every module path to ./dist/index.js, so the
  // manifest advertises each contract export from the package root. The root must agree.
  const contract = (await import(
    '../../packages/elements/src/theme-toggle/theme-preference.js'
  )) as Record<string, unknown>;
  const root = (await import('../../packages/elements/src/index.js')) as Record<string, unknown>;

  expect(Object.keys(contract).filter((name) => root[name] !== contract[name])).toEqual([]);
});
