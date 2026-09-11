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
 * across a helper function would all defeat in a different way), the rule is flat: no
 * `toHaveScreenshot` call site anywhere in the scanned files may be hard, full stop.
 *
 * WHAT THIS GATE ACTUALLY GUARANTEES (tightened after a live pre-merge review defeated the
 * first hardened attempt three ways — see below). The scan operates on a COPY of the source
 * with every `//` line comment, `/* block *\/` comment, and single/double-quoted or template
 * string BODY blanked out to spaces (newlines kept, so line numbers stay true; `${...}`
 * template-interpolation code is kept live, since it is real code, not literal text) before it
 * ever looks for `expect(`. That closes three classes at once: a comment sitting between the
 * closing paren and `.toHaveScreenshot(`; a string or template literal that merely CONTAINS the
 * text `expect(x).toHaveScreenshot(` (which must not be read as a call); and unbounded
 * whitespace/indentation between the two, because the forward scan after the closing paren now
 * skips arbitrary trivia to the next real token rather than trusting a fixed-width lookahead.
 * Both `.toHaveScreenshot(` and `?.toHaveScreenshot(` (optional chaining) are matched.
 *
 * DEFEATED THREE WAYS BEFORE THIS HARDENING, ALL NOW PROBED IN --selftest:
 *   1. `expect(root) /* eslint-disable-next-line *\/.toHaveScreenshot(...)` — a comment between
 *      the close-paren and the dot. The old scan's 20-character lookahead window read the
 *      comment text, not `.toHaveScreenshot(`, and reported nothing.
 *   2. A hard call reformatted with more than 20 characters of intervening whitespace (deeper
 *      indentation, or the closing paren and the property access on separate lines with a
 *      comment or blank line between) slipped past the same fixed window.
 *   3. `expect(root)?.toHaveScreenshot(...)` — optional chaining. The old scan matched a literal
 *      `.` only.
 *
 * KNOWN REMAINING LIMIT — NOT CLOSED, STATED RATHER THAN LEFT SILENT. This gate matches the
 * literal token `expect`. It has no type or binding information, so `expect` SHADOWED or
 * ALIASED — `const check = expect; await check(root).toHaveScreenshot(...);`, or
 * `import { expect as ex } from '@playwright/test'` used as `ex(root).toHaveScreenshot(...)` —
 * passes through undetected. Closing this needs a real AST/scope analysis (e.g. via
 * `@typescript-eslint` or TypeScript's own checker), which is a materially different tool than
 * a text scan; it is out of scope for this gate. No such aliasing currently exists in the
 * scanned files (checked by hand at the time this note was written) and `--selftest` below
 * carries a live probe recording that this specific shape is NOT caught, so a future fix to
 * this limit — or a regression that makes it matter — is visible rather than silently assumed
 * away.
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

/**
 * A copy of `source`, same length and same newline positions (so line numbers computed from
 * either string agree), with every comment and every plain string/template-literal BODY
 * character replaced by a space. `${...}` interpolation inside a template literal is left as
 * live code (recursively — an interpolation can itself contain a nested template literal),
 * because it can legitimately contain a real `expect(...)` call; nothing else inside a string
 * or comment can.
 *
 * A regex over raw text cannot do this correctly: a `//` inside a string, or a `*\/` inside a
 * template literal, each defeat it in a different direction (see check-story-theme-wrapper.mjs
 * and check-behaviour-fixture-imports.mjs's own `stripComments` for the same reasoning applied
 * to a different rule). This is a small state walk instead, extended with a depth-tracked stack
 * so template-literal interpolation nests correctly.
 */
export function maskNonCode(source) {
  let out = '';
  let i = 0;
  const n = source.length;
  // Stack entries: 'code' | 'line' | 'block' | 'sq' | 'dq' | 'tpl'.
  // 'tpl-interp:<braceDepth>' tracks a ${...} interpolation's own brace depth so a nested
  // object literal like `${ {a: 1} }` does not end the interpolation on its inner `}`.
  const stack = ['code'];
  const interpDepth = [];

  const top = () => stack[stack.length - 1];

  while (i < n) {
    const c = source[i];
    const next = source[i + 1];
    const state = top();

    if (state === 'code') {
      if (c === '/' && next === '/') { stack.push('line'); out += '  '; i += 2; continue; }
      if (c === '/' && next === '*') { stack.push('block'); out += '  '; i += 2; continue; }
      if (c === "'") { stack.push('sq'); out += c; i++; continue; }
      if (c === '"') { stack.push('dq'); out += c; i++; continue; }
      if (c === '`') { stack.push('tpl'); out += c; i++; continue; }
      if (interpDepth.length) {
        if (c === '{') interpDepth[interpDepth.length - 1]++;
        else if (c === '}') {
          interpDepth[interpDepth.length - 1]--;
          if (interpDepth[interpDepth.length - 1] === 0) {
            interpDepth.pop();
            stack.pop(); // leave the 'code' state pushed for this interpolation
            out += c;
            i++;
            continue;
          }
        }
      }
      out += c;
      i++;
      continue;
    }

    if (state === 'line') {
      if (c === '\n') { stack.pop(); out += '\n'; i++; continue; }
      out += ' ';
      i++;
      continue;
    }

    if (state === 'block') {
      if (c === '*' && next === '/') { stack.pop(); out += '  '; i += 2; continue; }
      out += c === '\n' ? '\n' : ' ';
      i++;
      continue;
    }

    if (state === 'sq' || state === 'dq') {
      const quote = state === 'sq' ? "'" : '"';
      if (c === '\\') { out += '  '; i += 2; continue; }
      if (c === quote) { stack.pop(); out += c; i++; continue; }
      out += c === '\n' ? '\n' : ' ';
      i++;
      continue;
    }

    // state === 'tpl'
    if (c === '\\') { out += '  '; i += 2; continue; }
    if (c === '`') { stack.pop(); out += c; i++; continue; }
    if (c === '$' && next === '{') {
      stack.push('code');
      interpDepth.push(1); // the '{' just consumed counts as depth 1
      out += '${';
      i += 2;
      continue;
    }
    out += c === '\n' ? '\n' : ' ';
    i++;
  }
  return out;
}

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

/** First index at or after `idx` that is not ASCII whitespace. */
function skipWhitespace(text, idx) {
  let i = idx;
  while (i < text.length && /\s/.test(text[i])) i++;
  return i;
}

/**
 * `{ line, message }` offenders for one file's source: every HARD `toHaveScreenshot` call site
 * (`expect(...).toHaveScreenshot(...)` or `expect(...)?.toHaveScreenshot(...)`, never
 * `expect.soft(...)`), anywhere in the file — inside a test body, inside a `for`/`while` loop,
 * inside a helper function, it does not matter. Deliberately NOT scoped to "tests with 2+
 * screenshot calls" — see the file-level comment for why a flat rule is what closes the
 * loop-execution gap, and for what this scan does and does not guarantee.
 *
 * Matching happens against `maskNonCode(source)`, not the raw text, so a comment or a string
 * containing the literal text `expect(x).toHaveScreenshot(` is never mistaken for a real call,
 * and the trivia between the closing paren and the property access is skipped to the next real
 * token rather than trusted to fit inside a fixed-width window. `EXPECT_CALL` allows (but does
 * not require) whitespace between `expect` and its `(` — `expect (root)` is unusual but legal
 * JS a plain `indexOf('expect(')` would silently miss.
 */
const EXPECT_CALL = /\bexpect\s*\(/g;

export function offenders(file, source) {
  const masked = maskNonCode(source);
  const out = [];
  EXPECT_CALL.lastIndex = 0;
  let m;
  while ((m = EXPECT_CALL.exec(masked)) !== null) {
    const idx = m.index;
    const openParenIdx = m.index + m[0].length - 1; // the '(' EXPECT_CALL just matched
    const closeIdx = findMatchingClose(masked, openParenIdx);
    if (closeIdx === -1) break;
    const afterTrivia = skipWhitespace(masked, closeIdx + 1);
    const rest = masked.slice(afterTrivia, afterTrivia + '?.toHaveScreenshot('.length);
    if (rest.startsWith('.toHaveScreenshot(') || rest.startsWith('?.toHaveScreenshot(')) {
      const line = masked.slice(0, idx).split('\n').length;
      const key = `${file}:${line}`;
      if (!EXEMPTIONS.has(key)) {
        out.push(
          `${key}: a HARD toHaveScreenshot call — a failure here throws and skips every ` +
            'later screenshot in this test or loop for the rest of the run. Use ' +
            'expect.soft(...).toHaveScreenshot(...) instead.',
        );
      }
    }
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
    // ── The three live bypasses a pre-merge review defeated this gate with, each now a probe ──
    [
      'DEFEAT 1: a block comment between the close-paren and the dot',
      "test('bypass-1', async ({ page }) => {\n" +
        "  await expect(root) /* eslint-disable-next-line */.toHaveScreenshot('a.png', {});\n" +
        '});\n',
      1,
    ],
    [
      'DEFEAT 1b: a line comment on its own line between the close-paren and the dot',
      "test('bypass-1b', async ({ page }) => {\n" +
        '  await expect(root) // why this locator\n' +
        "    .toHaveScreenshot('a.png', {});\n" +
        '});\n',
      1,
    ],
    [
      'DEFEAT 2: far more than 20 characters of whitespace/indentation before the dot',
      "test('bypass-2', async ({ page }) => {\n" +
        '  await expect(root)\n' +
        '                                                                              \n' +
        "    .toHaveScreenshot('a.png', {});\n" +
        '});\n',
      1,
    ],
    [
      'DEFEAT 3: optional chaining — expect(root)?.toHaveScreenshot(...)',
      "test('bypass-3', async ({ page }) => {\n" +
        "  await expect(root)?.toHaveScreenshot('a.png', {});\n" +
        '});\n',
      1,
    ],
    // ── Hunted past the three reported findings, per the follow-up instruction ──────────────
    [
      'a LINE COMMENT containing the exact literal text of a hard call — must not be a false positive',
      "test('comment-text', async ({ page }) => {\n" +
        "  // old code used to read: await expect(root).toHaveScreenshot('a.png', {});\n" +
        "  await expect.soft(root).toHaveScreenshot('a.png', {});\n" +
        '});\n',
      0,
    ],
    [
      'a BLOCK COMMENT containing the exact literal text of a hard call — must not be a false positive',
      "test('comment-text-block', async ({ page }) => {\n" +
        "  /* await expect(root).toHaveScreenshot('a.png', {}); -- the old hard form */\n" +
        "  await expect.soft(root).toHaveScreenshot('a.png', {});\n" +
        '});\n',
      0,
    ],
    [
      'a STRING LITERAL containing the exact literal text of a hard call — must not be a false positive',
      "test('string-text', async ({ page }) => {\n" +
        "  const note = 'the old code said expect(root).toHaveScreenshot(\\'a.png\\', {})';\n" +
        "  await expect.soft(root).toHaveScreenshot('a.png', {});\n" +
        '});\n',
      0,
    ],
    [
      'a TEMPLATE LITERAL containing the exact literal text of a hard call — must not be a false positive',
      "test('template-text', async ({ page }) => {\n" +
        '  const note = `see also: expect(root).toHaveScreenshot(${name}, {})`;\n' +
        "  await expect.soft(root).toHaveScreenshot('a.png', {});\n" +
        '});\n',
      0,
    ],
    [
      'a TEMPLATE LITERAL whose ${...} interpolation contains a REAL hard call — must still be caught',
      "test('template-interp', async ({ page }) => {\n" +
        "  const label = `prefix-${(await expect(root).toHaveScreenshot('a.png', {}), 'x')}-suffix`;\n" +
        '});\n',
      1,
    ],
    [
      'a call split across several lines mid-expression, including a blank line — must still be caught',
      "test('split', async ({ page }) => {\n" +
        '  await expect(\n' +
        '    root\n' +
        '  )\n' +
        '\n' +
        "    .toHaveScreenshot(\n" +
        "      'a.png',\n" +
        '      {},\n' +
        '    );\n' +
        '});\n',
      1,
    ],
    [
      'space between expect and its opening paren — unusual but legal JS, found while hunting past the reported findings',
      "test('spaced-paren', async ({ page }) => {\n" +
        "  await expect (root).toHaveScreenshot('a.png', {});\n" +
        '});\n',
      1,
    ],
    [
      'KNOWN GAP, documented not closed: expect ALIASED to another name is not detected — this probe records that fact, it does not assert the gate is safe against it',
      "test('aliased', async ({ page }) => {\n" +
        '  const check = expect;\n' +
        "  await check(root).toHaveScreenshot('a.png', {});\n" +
        '});\n',
      0,
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

  // PROBE THE READER, NOT ONLY THE MATCHER. Write a real file to disk and run offenders() over
  // it read back with readFileSync, the same path the real scan uses, so a broken glob, a
  // broken file read, or a broken line-number computation cannot self-test green. This probe
  // specifically plants the LOOP shape, since that is the shape the flat rule exists to catch
  // that the previous per-test-count rule could not.
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
