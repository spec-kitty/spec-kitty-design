import { expect, test } from 'vitest';

/**
 * Seed browser-lane test (WP01).
 *
 * It exists so the browser lane is non-empty from the commit that builds the floor —
 * without it, `npm run test` is red for every subsequent work package and WP01 is
 * un-mergeable on its own.
 *
 * It deliberately carries NO behaviour id. The registry is WP03's, and a seed that
 * claimed an id would give that behaviour two tests, which makes the mutation harness's
 * collateral bound ambiguous about whether the duplicate counts as "other".
 *
 * WP03 may delete this file once real browser tests exist.
 */
test('the browser lane runs in a real engine with shadow DOM and constructed stylesheets', () => {
  // Not an "it renders" assertion about a component — this asserts the LANE is a real
  // browser, which is the thing ADR-11 chose the runner for. A simulated DOM passes the
  // first two and fails the third.
  expect(typeof customElements.define).toBe('function');
  expect(document.createElement('div').attachShadow({ mode: 'open' })).toBeTruthy();
  expect(typeof CSSStyleSheet.prototype.replaceSync).toBe('function');
});
