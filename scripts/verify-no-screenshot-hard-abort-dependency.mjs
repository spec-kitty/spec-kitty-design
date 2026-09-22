#!/usr/bin/env node
/**
 * NI-002 (visual-evidence-gate-integrity, WP01): no statement following a `toHaveScreenshot`
 * call, in the same test/loop body, depends on that screenshot's prior success.
 *
 * WP01 converted every hard `toHaveScreenshot` call in `visual.spec.ts` to `expect.soft`. That
 * is only safe if no test relies on the OLD hard-abort behaviour as a safety mechanism — a
 * mutating action deliberately placed AFTER a screenshot so it would never run against a
 * known-bad visual state. Before converting, every call site with a statement following it in
 * the same block was inspected by hand (and independently by a reviewer) and none were found.
 * This formalizes that one-off inspection into a script that can fail on a FUTURE addition,
 * rather than leaving the guarantee as something only ever checked once, by eye, at conversion
 * time.
 *
 * METHOD. `maskNonCode()` (shared with `check-visual-screenshot-softness.mjs`, so both scripts
 * agree on what counts as real code) blanks comments and string/template bodies. Every
 * `.toHaveScreenshot(` call site is located; the statement it belongs to is walked to its
 * closing `;`. Whatever comes next in the same block, after skipping whitespace, is either:
 *   - a `}` closing the test/loop — nothing follows, always safe;
 *   - another `toHaveScreenshot` call (soft or hard — softness itself is `check-visual-screenshot-softness.mjs`'s job, not this script's) — safe by definition, it is peer evidence collection, not a gated mutation;
 *   - a statement matching the ALLOWLIST below — recognized, safe "set up the next screenshot" shapes (navigate, resize, emulate, hover/focus/press/click, or reassign a locator variable from an awaited helper);
 *   - anything else — flagged. A flagged statement is not automatically wrong, but it is
 *     UNRECOGNIZED, and this script refuses to pass silently over unrecognized follow-up
 *     behaviour next to a screenshot assertion. Extend the ALLOWLIST with a comment explaining
 *     why the new shape is safe, the same way `EXEMPTIONS` works in the softness gate — do not
 *     loosen the catch-all silently.
 *
 * Usage: node scripts/verify-no-screenshot-hard-abort-dependency.mjs [--selftest]
 * Exit 0 — invariant holds (every follow-up is `}` or an allowlisted shape).
 * Exit 1 — invariant VIOLATED (or a shape needs review) — an unrecognized follow-up was found.
 */
import { globSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { maskNonCode } from './check-visual-screenshot-softness.mjs';

const SCAN = 'apps/storybook/src/tests/*.spec.ts';

/**
 * Statements safe to find directly after a `toHaveScreenshot` call, in the same block, because
 * none of them can observe or depend on whether the PRECEDING screenshot passed — they only set
 * up page/DOM state for whatever runs next (frequently the next screenshot in the same test).
 */
const ALLOWLIST = [
  /^await\s+.+\.evaluate\(/, // e.g. target.evaluate((node) => ...)
  /^await\s+page\.goto\(/,
  /^await\s+page\.emulateMedia\(/,
  /^await\s+page\.setViewportSize\(/,
  /^await\s+page\.keyboard\.(down|up|press)\(/,
  /^await\s+page\.mouse\.(move|up|down)\(/,
  // .hover(/.focus(/.click( on an arbitrary chain, e.g. `planned.locator("...").click()` —
  // the base identifier may itself be reached through intermediate method calls.
  /^await\s+.+\.(hover|focus|click|waitFor)\(/,
  /^\w+\s*=\s*(await\s+)?[\w.]+\(/, // e.g. host = await actionRowStory(...), or the synchronous target = page.locator('...').first()
  /^await\s+\w+\(/, // a bare awaited helper call with no assignment, e.g. await evidenceChainStory(page, 'six-stages') — loads the next story in place
];
// A statement containing `.toHaveScreenshot(` is handled inline in offenders() below (it stops
// the walk rather than being matched here), since it also needs to stop the SEARCH, not just be
// treated as one more safe statement to walk past.

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

function skipWhitespace(text, idx) {
  let i = idx;
  while (i < text.length && /\s/.test(text[i])) i++;
  return i;
}

/** The index of the top-level `;` (or `}`) ending the statement that starts at `idx`. */
function statementBoundary(text, idx) {
  let depth = 0;
  for (let i = idx; i < text.length; i++) {
    const c = text[i];
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) {
      if (depth === 0) return i; // an unbalanced close — the enclosing block's own `}`
      depth--;
    } else if (c === ';' && depth === 0) {
      return i;
    }
  }
  return text.length;
}

/**
 * `{ line, followUp }[]` — every flagged (unrecognized) follow-up in one file's source.
 *
 * Walks EVERY statement after a screenshot call, not just the first — an allowlisted statement
 * (e.g. `await page.evaluate(...)`) followed by an unrecognized one (e.g.
 * `await target.dangerousDelete()`) must still be caught. The walk stops at the block's closing
 * `}` (safe — nothing follows) or at the next `toHaveScreenshot` call (safe — evidence
 * collection, governed by the softness gate instead), and flags the first unrecognized
 * statement it meets in between.
 */
export function offenders(file, source) {
  const masked = maskNonCode(source);
  const out = [];
  const CALL = /\.toHaveScreenshot\(/g;
  let m;
  while ((m = CALL.exec(masked)) !== null) {
    const openParenIdx = m.index + '.toHaveScreenshot'.length;
    const closeIdx = findMatchingClose(masked, openParenIdx);
    if (closeIdx === -1) continue;
    // Skip past this call's own statement terminator (`;`), if present.
    let cursor = skipWhitespace(masked, closeIdx + 1);
    if (masked[cursor] === ';') cursor++;

    for (;;) {
      const afterTrivia = skipWhitespace(masked, cursor);
      if (afterTrivia >= masked.length || masked[afterTrivia] === '}') break; // block ends — safe
      const end = statementBoundary(masked, afterTrivia);
      // Match against the masked text (so a string/comment can't forge a match), but DISPLAY
      // the real source slice — masking blanks string bodies to spaces, which is unreadable in
      // a report (e.g. a real `.click()` on a masked selector string would print as blanks).
      // The two slices agree everywhere outside a string/comment, which is exactly where a real
      // ALLOWLIST match can occur, so using `source` for display never changes the verdict.
      const followUpMasked = masked.slice(afterTrivia, end).trim();
      if (!followUpMasked) { cursor = end + 1; continue; }
      if (/\.toHaveScreenshot\(/.test(followUpMasked)) break; // the next screenshot — stop, safe
      if (!ALLOWLIST.some((re) => re.test(followUpMasked))) {
        const followUpDisplay = source.slice(afterTrivia, end).trim();
        const line = masked.slice(0, m.index).split('\n').length;
        out.push({
          line,
          followUp: followUpDisplay.length > 80 ? `${followUpDisplay.slice(0, 80)}…` : followUpDisplay,
        });
        break; // one report per screenshot call site is enough to require a look
      }
      cursor = end + 1; // this statement was recognized as safe — keep walking the block
    }
  }
  return out.map(
    ({ line, followUp }) =>
      `${file}:${line}: unrecognized statement follows a toHaveScreenshot call in the same ` +
      `block: \`${followUp}\` — not in ALLOWLIST. Either this is a safe shape that needs adding ` +
      'to ALLOWLIST with a reason, or it is a real dependency on the screenshot having passed ' +
      'and must not be soft-converted without changing this test.',
  );
}

// Run-as-CLI guard (same convention as check-adr-index.mjs / check-visual-screenshot-softness.mjs) — without it, importing this module's exports would also run --selftest/scan logic and call process.exit as a side effect of the import.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) {
    const PROBES = [
      [
        'a screenshot with nothing after it (test ends) — safe',
        "test('one', async ({ page }) => {\n" +
          "  await expect.soft(root).toHaveScreenshot('a.png', {});\n" +
          '});\n',
        0,
      ],
      [
        'a screenshot followed by another screenshot — safe, governed elsewhere',
        "test('two', async ({ page }) => {\n" +
          "  await expect.soft(root).toHaveScreenshot('a.png', {});\n" +
          "  await expect.soft(root).toHaveScreenshot('b.png', {});\n" +
          '});\n',
        0,
      ],
      [
        'a screenshot followed by page.goto — safe (next-screenshot setup)',
        "test('goto', async ({ page }) => {\n" +
          "  await expect.soft(root).toHaveScreenshot('a.png', {});\n" +
          "  await page.goto('/iframe.html?id=x');\n" +
          '});\n',
        0,
      ],
      [
        'a screenshot followed by a locator-variable reassignment — safe',
        "test('reassign', async ({ page }) => {\n" +
          "  await expect.soft(host).toHaveScreenshot('a.png', {});\n" +
          "  host = await actionRowStory(page, 'light-mode');\n" +
          '});\n',
        0,
      ],
      [
        'a screenshot inside a for loop with nothing after it — safe',
        "test('loop', async ({ page }) => {\n" +
          '  for (const visual of cases) {\n' +
          "    await expect.soft(root).toHaveScreenshot(visual.name, {});\n" +
          '  }\n' +
          '});\n',
        0,
      ],
      [
        'FLAG: a screenshot followed by an unrecognized mutating call — the shape this script exists to catch',
        "test('mutation', async ({ page }) => {\n" +
          "  await expect.soft(root).toHaveScreenshot('a.png', {});\n" +
          "  await page.deleteEverything();\n" +
          '});\n',
        1,
      ],
      [
        'FLAG: a screenshot followed by a plain expect() on unrelated state — unrecognized, must be reviewed',
        "test('assert-after', async ({ page }) => {\n" +
          "  await expect.soft(root).toHaveScreenshot('a.png', {});\n" +
          "  expect(somethingElse).toBe(true);\n" +
          '});\n',
        1,
      ],
      [
        'FLAG: an ALLOWLISTED statement followed by an unrecognized one — the walk must not stop at the first safe statement',
        "test('safe-then-dangerous', async ({ page }) => {\n" +
          "  await expect.soft(root).toHaveScreenshot('a.png', {});\n" +
          '  await page.evaluate(() => localStorage.clear());\n' +
          '  await target.dangerousDelete();\n' +
          '});\n',
        1,
      ],
      [
        'a screenshot followed by TWO allowlisted statements then the block ends — both safe, no flag',
        "test('two-safe', async ({ page }) => {\n" +
          "  await expect.soft(root).toHaveScreenshot('a.png', {});\n" +
          '  await page.emulateMedia({ forcedColors: "active" });\n' +
          "  await page.goto('/iframe.html?id=y');\n" +
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
    if (mustCatch < 2) {
      console.error(`❌ degenerate probe table: only ${mustCatch} must-catch row(s).`);
      process.exit(1);
    }
    if (bad) {
      console.error(`\n❌ ${bad} probe(s) did not behave as recorded.`);
      process.exit(1);
    }
    console.log(`✅ All ${PROBES.length} NI-002 probes behaved as recorded (${mustCatch} must-catch).`);
    process.exit(0);
  }

  const files = globSync(SCAN, {});
  if (files.length === 0) {
    console.error(`verification_error: no spec files matched ${SCAN}`);
    process.exit(2);
  }

  let found = [];
  for (const file of files) {
    found = found.concat(offenders(file, readFileSync(file, 'utf8')));
  }

  if (found.length) {
    console.error(
      `❌ NI-002 needs review: ${found.length} unrecognized follow-up statement(s) after a ` +
        'toHaveScreenshot call:',
    );
    for (const f of found) console.error(`   ${f}`);
    process.exit(1);
  }

  console.log(
    `✅ NI-002 holds: every statement following a toHaveScreenshot call, across ${files.length} ` +
      'spec file(s), is either the end of its block or a recognized safe shape.',
  );
  process.exit(0);
}
