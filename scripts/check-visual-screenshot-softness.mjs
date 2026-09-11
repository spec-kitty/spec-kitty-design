#!/usr/bin/env node
/**
 * A test with two or more `toHaveScreenshot` calls may not use the HARD form for any of them
 * (#367).
 *
 * `await expect(x).toHaveScreenshot(...)` is a hard assertion: on failure it throws and aborts
 * the test immediately, so every `toHaveScreenshot` call written AFTER the one that failed never
 * executes. Its baseline PNG is never produced, never appears in the run's `unexpected` count,
 * and never lands in the `visual-regression-diffs` artifact a harvester reads from — so a
 * red run's own accounting silently understates how many baselines it invalidated. On PR #339
 * this cost one missed baseline outright: `work-explorer-w4-drawer-dismissed.png` never appeared
 * on the run that broke it, because the PRECEDING screenshot in the same test failed first.
 *
 * `expect.soft(x).toHaveScreenshot(...)` records a failure but does not throw, so the rest of
 * the test — including every later screenshot — still runs. A sweep at the time this gate was
 * added found 16 tests in `visual.spec.ts` carrying two or more hard calls, placing 20 baselines
 * behind a preceding one; all 16 were converted. This gate is what stops the next multi-screenshot
 * test from reintroducing the same hazard.
 *
 * SCOPE. A test with exactly ONE `toHaveScreenshot` call is not a defect of this shape — there
 * is nothing after it in that test to lose — so a single hard call is left alone. The rule is
 * scoped to tests, because a `test.describe`-level `beforeEach` failure already aborts every
 * test in the block the same way `toHaveScreenshot`'s own retry-then-throw does, which is a
 * distinct, accepted Playwright behaviour this gate does not touch.
 *
 * NOT COVERED (documented, not silently assumed complete): a `for` loop with a single HARD
 * `toHaveScreenshot` call site that executes once per iteration has the identical abort-early
 * hazard — a failure on iteration 1 skips every later iteration's screenshot — but this gate
 * counts CALL SITES, not runtime executions, so it cannot see that shape. `visual.spec.ts` has
 * roughly two dozen such loops as of this gate's introduction; #367 scoped its sweep to literal
 * duplicate call sites, and so does this gate. A loop-aware successor is a distinct piece of
 * work, not a silent extension of this one.
 *
 * Usage: node scripts/check-visual-screenshot-softness.mjs [--selftest]
 */
import { globSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SCAN = 'apps/storybook/src/tests/*.spec.ts';

/** Index of the character matching the `(` at `openIdx`, tracking nested parens. */
function findMatchingClose(text, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    const c = text[i];
    if (c === '(') depth++;
    else if (c === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Every top-level `test('...', async (...) => { ... })` span in `source`, as `{ startLine, body }`.
 * Anchored on `test(` followed by a quote, so `test.describe(`, `test.skip(`, `test.beforeAll(`
 * etc. are not mistaken for a test body — a false span here would make the scan blind to real
 * calls inside it, or attribute another test's calls to it.
 */
function testSpans(source) {
  const spans = [];
  const re = /\btest\(\s*[`'"]/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    const openParenIdx = source.indexOf('(', m.index);
    const closeIdx = findMatchingClose(source, openParenIdx);
    if (closeIdx === -1) continue;
    spans.push({
      startLine: source.slice(0, m.index).split('\n').length,
      body: source.slice(openParenIdx, closeIdx),
    });
  }
  return spans;
}

/**
 * Offenders in one test body: HARD `toHaveScreenshot` call sites, only reported when the body
 * has two or more `toHaveScreenshot` call sites in total (soft or hard) — a lone hard call has
 * nothing after it to silently drop.
 */
function hardScreenshotsIn(body) {
  const hardSpans = [];
  let i = 0;
  while (i < body.length) {
    const idx = body.indexOf('expect(', i);
    if (idx === -1) break;
    const openParenIdx = idx + 'expect'.length;
    const closeIdx = findMatchingClose(body, openParenIdx);
    if (closeIdx === -1) break;
    const after = body.slice(closeIdx + 1, closeIdx + 1 + 20);
    if (/^\s*\.toHaveScreenshot\(/.test(after)) hardSpans.push(idx);
    i = closeIdx + 1;
  }
  return hardSpans;
}

/** `{ line, message }` offenders for one file's source. */
export function offenders(file, source) {
  const out = [];
  for (const span of testSpans(source)) {
    const totalShots = (span.body.match(/toHaveScreenshot/g) || []).length;
    if (totalShots < 2) continue;
    const hard = hardScreenshotsIn(span.body);
    if (hard.length === 0) continue;
    out.push(
      `${file}:${span.startLine}: ${hard.length} of ${totalShots} toHaveScreenshot call(s) ` +
        'are HARD in a test that takes 2+ screenshots — a failure on one drops every later ' +
        'baseline from the run. Use expect.soft(...).toHaveScreenshot(...) for all of them.',
    );
  }
  return out;
}

if (process.argv.includes('--selftest')) {
  const PROBES = [
    [
      'two hard calls, nothing soft between them — the W4 drawer shape #367 was filed over',
      "test('two', async ({ page }) => {\n" +
        "  await expect(root).toHaveScreenshot('a.png', { threshold: 0.02 });\n" +
        "  await expect(root).toHaveScreenshot('b.png', { threshold: 0.02 });\n" +
        '});\n',
      1,
    ],
    [
      'three calls, only the middle one hard',
      "test('three', async ({ page }) => {\n" +
        "  await expect.soft(root).toHaveScreenshot('a.png', {});\n" +
        "  await expect(root).toHaveScreenshot('b.png', {});\n" +
        "  await expect.soft(root).toHaveScreenshot('c.png', {});\n" +
        '});\n',
      1,
    ],
    [
      'four calls, all hard — the degenerate case, must report all four',
      "test('four', async ({ page }) => {\n" +
        "  await expect(root).toHaveScreenshot('a.png', {});\n" +
        "  await expect(root).toHaveScreenshot('b.png', {});\n" +
        "  await expect(root).toHaveScreenshot('c.png', {});\n" +
        "  await expect(root).toHaveScreenshot('d.png', {});\n" +
        '});\n',
      1,
    ],
    [
      'two calls, both already soft — the fixed shape',
      "test('fixed', async ({ page }) => {\n" +
        "  await expect.soft(root).toHaveScreenshot('a.png', {});\n" +
        "  await expect.soft(root).toHaveScreenshot('b.png', {});\n" +
        '});\n',
      0,
    ],
    [
      'exactly one hard call — nothing after it to drop, not this gate\'s shape',
      "test('one', async ({ page }) => {\n" +
        "  await expect(root).toHaveScreenshot('a.png', {});\n" +
        '});\n',
      0,
    ],
    [
      'one hard screenshot plus an unrelated hard expect() — the unrelated one must not count',
      "test('mixed', async ({ page }) => {\n" +
        "  await expect(root).toBeVisible();\n" +
        "  await expect(root).toHaveScreenshot('a.png', {});\n" +
        '});\n',
      0,
    ],
    [
      'a locator built from a nested call, still hard — the paren walk must not stop at the first )',
      "test('nested locator', async ({ page }) => {\n" +
        "  await expect(root.locator('[data-x]')).toHaveScreenshot('a.png', {});\n" +
        "  await expect(root.locator('[data-y]')).toHaveScreenshot('b.png', {});\n" +
        '});\n',
      1,
    ],
  ];

  let bad = 0;
  let mustCatch = 0;
  for (const [note, src, expectedCount] of PROBES) {
    if (expectedCount > 0) mustCatch++;
    const got = offenders('probe.spec.ts', src);
    if (got.length !== expectedCount) {
      console.error(`  ✗ ${note}: expected ${expectedCount} offender(s), got ${got.length}`);
      if (got.length) console.error(got.map((o) => `      ${o}`).join('\n'));
      bad++;
    }
  }

  // PROBE THE READER, NOT ONLY THE REGEX-SHAPED WALK. Write a real file to disk and run
  // offenders() over it read back with readFileSync, the same path the real scan uses, so a
  // broken glob, a broken file read, or a broken line-number computation cannot self-test green.
  const dir = mkdtempSync(join(tmpdir(), 'screenshot-softness-selftest-'));
  const planted = join(dir, 'planted.spec.ts');
  writeFileSync(
    planted,
    "import { test, expect } from '@playwright/test';\n\n" +
      "test('planted hard pair', async ({ page }) => {\n" +
      "  const root = page.locator('body');\n" +
      "  await expect(root).toHaveScreenshot('one.png', { threshold: 0.02 });\n" +
      "  await expect(root).toHaveScreenshot('two.png', { threshold: 0.02 });\n" +
      '});\n',
  );
  let onDiskOffenders;
  try {
    onDiskOffenders = offenders(planted, readFileSync(planted, 'utf8'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  if (onDiskOffenders.length !== 1 || !onDiskOffenders[0].includes(':3:')) {
    console.error(
      `  ✗ a planted hard pair on disk was not flagged at its test's start line — got ${JSON.stringify(onDiskOffenders)}`,
    );
    bad++;
  } else {
    console.log('✓ reader probe — a planted hard pair on disk is caught through the real file-read path');
  }

  if (mustCatch < 4) {
    console.error(`❌ degenerate probe table: only ${mustCatch} must-catch row(s).`);
    process.exit(1);
  }
  if (bad) {
    console.error(`\n❌ ${bad} probe(s) did not behave as recorded.`);
    process.exit(1);
  }
  console.log(`✅ All ${PROBES.length} shape probes plus the on-disk reader probe behaved as recorded (${mustCatch} must-catch).`);
  process.exit(0);
}

const files = globSync(SCAN, {});
// REFUSE AN EMPTY SET — a glob that stops matching would print a green line over nothing.
if (files.length === 0) {
  console.error(`❌ no spec files matched ${SCAN} — refusing to report green over nothing.`);
  process.exit(1);
}

let found = [];
for (const file of files) {
  found = found.concat(offenders(file, readFileSync(file, 'utf8')));
}

if (found.length) {
  console.error(
    `❌ ${found.length} multi-screenshot test(s) carry a HARD toHaveScreenshot call, ` +
      'which can silently drop every later baseline in the same test on a red run (#367):',
  );
  for (const f of found) console.error(`   ${f}`);
  process.exit(1);
}

console.log(
  `✅ ${files.length} spec file(s) scanned; every multi-screenshot test uses expect.soft(...).toHaveScreenshot(...) throughout.`,
);
