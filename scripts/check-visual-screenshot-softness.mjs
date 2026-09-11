#!/usr/bin/env node
/**
 * Every `toHaveScreenshot` call site must be soft (#367).
 *
 * `await expect(x).toHaveScreenshot(...)` is a hard assertion: on failure it throws and aborts
 * whatever was going to run next in the same test — including any LATER `toHaveScreenshot` call
 * written after it, or a later iteration of a `for` loop the call sits inside. That failed
 * screenshot's baseline PNG is never produced, never appears in the run's `unexpected` count,
 * and never lands in the `visual-regression-diffs` artifact a harvester reads from — so a red
 * run's own accounting silently understates how many baselines it invalidated. On PR #339 this
 * cost one missed baseline outright: `work-explorer-w4-drawer-dismissed.png` never appeared on
 * the run that broke it, because the PRECEDING screenshot in the same test failed first.
 *
 * `expect.soft(x).toHaveScreenshot(...)` records a failure but does not throw, so the rest of
 * the test — including every later screenshot, and every later loop iteration — still runs.
 *
 * WHY FLAT, NOT "2+ CALLS PER TEST". The first version of this gate only flagged a test with
 * TWO OR MORE literal `toHaveScreenshot` call sites, matching #367's own sweep (16 tests, 20
 * baselines). That missed the loop shape entirely: `visual.spec.ts` had roughly two dozen `for`
 * loops with a SINGLE hard call site executed once per iteration — textually one call, but
 * multiple runtime executions with the identical abort-on-first-failure hazard, invisible to a
 * gate that counts call sites rather than executions. Rather than teach the gate to understand
 * loop control flow (which a `while`, a `.forEach`, a recursive helper, or a loop body split
 * across a helper function would all defeat in a different way), the rule is now flat: no
 * `toHaveScreenshot` call site anywhere in the scanned files may be hard, full stop. A flat
 * invariant needs no control-flow reasoning and cannot be defeated by a new loop shape.
 *
 * WHY THIS IS SAFE — CHECKED, NOT ASSUMED. Going soft only changes behaviour if some LATER
 * statement in the same test depended on an earlier screenshot's hard abort to avoid running
 * against a known-bad state (for example, a mutating action gated on "we only get here if the
 * page matched its baseline"). Every `toHaveScreenshot` call site in `visual.spec.ts` was
 * checked for a statement following it in the same test/loop body: the only sites with anything
 * after them are later setup for the NEXT screenshot in the same already-multi-screenshot test
 * (navigate to a new story, change viewport, hover/focus/press a key) — never a mutation whose
 * safety depends on the prior screenshot having passed. No exemption was needed. `EXEMPTIONS`
 * below stays empty as a named escape hatch for the future: if a test is ever written that
 * deliberately relies on a hard screenshot abort, add it there with a reason, rather than
 * weakening this rule.
 *
 * Usage: node scripts/check-visual-screenshot-softness.mjs [--selftest]
 */
import { globSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SCAN = 'apps/storybook/src/tests/*.spec.ts';

/**
 * Named exceptions to the flat rule, as `"path/to/file.spec.ts:<line>"`, each requiring a
 * reason alongside it. Checked and found empty when this gate was written (see the file-level
 * comment above) — add an entry here, with a reason, rather than loosening the rule below.
 */
const EXEMPTIONS = new Map([
  // Example shape, none active:
  // ['apps/storybook/src/tests/example.spec.ts:42', 'reason the hard abort is load-bearing here'],
]);

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
 * `{ line, message }` offenders for one file's source: every HARD `toHaveScreenshot` call site
 * (`expect(...).toHaveScreenshot(...)`, not `expect.soft(...).toHaveScreenshot(...)`), anywhere
 * in the file — inside a test body, inside a `for`/`while` loop, inside a helper function, it
 * does not matter. This is deliberately NOT scoped to "tests with 2+ screenshot calls" — see
 * the file-level comment for why a flat rule is what closes the loop-execution gap.
 *
 * The scan walks every `expect(` in the file (not `expect.soft(`, since that substring cannot
 * match the literal text `expect(` followed immediately by `(`), finds its balanced closing
 * paren via `findMatchingClose` (so a locator argument with its own nested parens, e.g.
 * `root.locator('[data-x]')`, does not break the walk), and checks whether the very next thing
 * after that close is `.toHaveScreenshot(`.
 */
export function offenders(file, source) {
  const out = [];
  let i = 0;
  while (i < source.length) {
    const idx = source.indexOf('expect(', i);
    if (idx === -1) break;
    const openParenIdx = idx + 'expect'.length;
    const closeIdx = findMatchingClose(source, openParenIdx);
    if (closeIdx === -1) break;
    const after = source.slice(closeIdx + 1, closeIdx + 1 + 20);
    if (/^\s*\.toHaveScreenshot\(/.test(after)) {
      const line = source.slice(0, idx).split('\n').length;
      const key = `${file}:${line}`;
      if (!EXEMPTIONS.has(key)) {
        out.push(
          `${key}: a HARD toHaveScreenshot call — a failure here throws and skips every ` +
            'later screenshot in this test or loop for the rest of the run. Use ' +
            'expect.soft(...).toHaveScreenshot(...) instead.',
        );
      }
    }
    i = closeIdx + 1;
  }
  return out;
}

if (process.argv.includes('--selftest')) {
  const PROBES = [
    [
      'two hard calls in one test, nothing soft between them — the W4 drawer shape #367 was filed over',
      "test('two', async ({ page }) => {\n" +
        "  await expect(root).toHaveScreenshot('a.png', { threshold: 0.02 });\n" +
        "  await expect(root).toHaveScreenshot('b.png', { threshold: 0.02 });\n" +
        '});\n',
      2,
    ],
    [
      'a single hard call site inside a for loop — the shape the old 2+-per-test rule could not see',
      "test('loop', async ({ page }) => {\n" +
        "  for (const visual of cases) {\n" +
        "    await expect(root).toHaveScreenshot(visual.name, { threshold: 0.02 });\n" +
        '  }\n' +
        '});\n',
      1,
    ],
    [
      'a single hard call, nowhere near a loop or another screenshot — flat rule still catches it',
      "test('one', async ({ page }) => {\n" +
        "  await expect(root).toHaveScreenshot('a.png', {});\n" +
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
      4,
    ],
    [
      'everything already soft, including inside a loop — the fixed shape',
      "test('fixed', async ({ page }) => {\n" +
        "  for (const visual of cases) {\n" +
        "    await expect.soft(root).toHaveScreenshot(visual.name, {});\n" +
        '  }\n' +
        "  await expect.soft(root).toHaveScreenshot('b.png', {});\n" +
        '});\n',
      0,
    ],
    [
      'a hard screenshot plus an unrelated hard expect() — the unrelated one must not count',
      "test('mixed', async ({ page }) => {\n" +
        "  await expect(root).toBeVisible();\n" +
        "  await expect(root).toHaveScreenshot('a.png', {});\n" +
        '});\n',
      1,
    ],
    [
      'a locator built from a nested call, still hard — the paren walk must not stop at the first )',
      "test('nested locator', async ({ page }) => {\n" +
        "  await expect(root.locator('[data-x]')).toHaveScreenshot('a.png', {});\n" +
        "  await expect(root.locator('[data-y]')).toHaveScreenshot('b.png', {});\n" +
        '});\n',
      2,
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

  // EXEMPTIONS must actually suppress — otherwise the escape hatch the file comment promises
  // does not work, and the first person who needs it will discover that by being blocked.
  {
    const src =
      "test('exempted', async ({ page }) => {\n" +
      "  await expect(root).toHaveScreenshot('a.png', {});\n" +
      '});\n';
    const line = src.slice(0, src.indexOf('expect(')).split('\n').length;
    const key = `exempt-probe.spec.ts:${line}`;
    EXEMPTIONS.set(key, 'selftest probe only');
    const got = offenders('exempt-probe.spec.ts', src);
    EXEMPTIONS.delete(key);
    if (got.length !== 0) {
      console.error(`  ✗ an EXEMPTIONS entry did not suppress its offender — got ${JSON.stringify(got)}`);
      bad++;
    } else {
      console.log('✓ EXEMPTIONS probe — a listed file:line is suppressed');
    }
  }

  // PROBE THE READER, NOT ONLY THE REGEX-SHAPED WALK. Write a real file to disk and run
  // offenders() over it read back with readFileSync, the same path the real scan uses, so a
  // broken glob, a broken file read, or a broken line-number computation cannot self-test green.
  // This probe specifically plants the LOOP shape, since that is the shape the flat rule exists
  // to catch that the previous per-test-count rule could not.
  const dir = mkdtempSync(join(tmpdir(), 'screenshot-softness-selftest-'));
  const planted = join(dir, 'planted.spec.ts');
  writeFileSync(
    planted,
    "import { test, expect } from '@playwright/test';\n\n" +
      "test('planted loop with a single hard call site', async ({ page }) => {\n" +
      '  for (const visual of cases) {\n' +
      "    await expect(root).toHaveScreenshot(visual.name, { threshold: 0.02 });\n" +
      '  }\n' +
      '});\n',
  );
  let onDiskOffenders;
  try {
    onDiskOffenders = offenders(planted, readFileSync(planted, 'utf8'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  if (onDiskOffenders.length !== 1 || !onDiskOffenders[0].includes(':5:')) {
    console.error(
      `  ✗ a planted loop-hosted hard call on disk was not flagged at its call-site line — got ${JSON.stringify(onDiskOffenders)}`,
    );
    bad++;
  } else {
    console.log('✓ reader probe — a planted loop-hosted hard call on disk is caught through the real file-read path');
  }

  if (mustCatch < 4) {
    console.error(`❌ degenerate probe table: only ${mustCatch} must-catch row(s).`);
    process.exit(1);
  }
  if (bad) {
    console.error(`\n❌ ${bad} probe(s) did not behave as recorded.`);
    process.exit(1);
  }
  console.log(`✅ All ${PROBES.length} shape probes plus the EXEMPTIONS and on-disk reader probes behaved as recorded (${mustCatch} must-catch).`);
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
    `❌ ${found.length} HARD toHaveScreenshot call site(s) found — each can silently drop ` +
      'every screenshot after it in the same test or loop iteration on a red run (#367):',
  );
  for (const f of found) console.error(`   ${f}`);
  process.exit(1);
}

console.log(
  `✅ ${files.length} spec file(s) scanned; every toHaveScreenshot call site uses expect.soft(...).`,
);
