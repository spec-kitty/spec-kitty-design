#!/usr/bin/env node
/**
 * scripts/scan-mission-suppressions.mjs — WP01's T007 (SC-002, SC-003, mission
 * webkit-timing-deflake-01M2T31J).
 *
 * WHAT THIS IS
 *
 * SC-003 requires zero assertions deleted/skipped/`fixme`-ed/quarantined/retry-wrapped, zero
 * tolerances widened, zero wait durations increased — "verified mechanically... not by
 * self-report alone." SC-002 requires the rewritten-assertion count to equal the red-first-proof
 * count, and neither to be zero — again "not left to per-WP self-report." This script scans the
 * MISSION DIFF (every WP's changes together, base..target) for both, and is meant to be run
 * once, by whoever prepares the mission PR, "before the PR is marked ready" (plan.md, IC-08).
 *
 * THE SUPPRESSION SCAN (mechanical, the part with real teeth)
 *
 * Over every ADDED line in the diff:
 *   - `test.skip(` / `.skip(` on a `test`/`describe` call
 *   - `test.fixme(` / `.fixme(`
 *   - `.only(` on a `test`/`describe` call
 *   - a NEWLY ADDED `retries:` (or `test.describe.configure({ retries: ... })`) that was not
 *     present in the corresponding removed lines of the same hunk — C-001 explicitly names
 *     "inheriting retries: 2" as exactly this class.
 *   - a numeric timeout-like literal (`timeout:`, `waitForTimeout(`, `setTimeout(`) whose ADDED
 *     value is strictly greater than a REMOVED value for the same call-shape within the same
 *     hunk — C-003's "no timeout inflation".
 *
 * PROVEN TO DETECT A PLANTED VIOLATION: `--selftest` below plants one of each class into a
 * synthetic diff and asserts this scan catches it, AND asserts a genuinely clean rewrite
 * (assertion body changes with no suppression) is NOT flagged — a scan that flags everything is
 * exactly as useless as one that flags nothing, and only testing the "catches a violation"
 * direction would miss that.
 *
 * REWRITTEN-ASSERTION / RED-FIRST-PROOF COUNTS (mechanical proxies, documented as such)
 *
 * "Rewritten assertion" is counted as: a diff hunk containing at least one REMOVED `expect(`
 * line and at least one ADDED `expect(` line — the assertion's call itself changed shape, not
 * merely its surrounding code. This is a proxy for NFR-005's semantic claim (which plan.md
 * itself says "stays a reviewer judgement") — it counts SITES where an assertion was rewritten,
 * not whether the rewrite preserved strength.
 *
 * "Red-first proof" is counted as occurrences of the marker comment `RED-FIRST-PROOF` added
 * anywhere in the diff (one WP's convention for recording "reverted the fix, watched this fail,
 * here is the output" inline, since NFR-003 requires the failure output recorded and nothing in
 * this repository already provides a machine-checkable place to put it). THIS MARKER DOES NOT
 * YET EXIST IN ANY WP'S OUTPUT AS OF WP01 LANDING — WP01 is the first work package implemented,
 * and it defines the convention rather than inheriting one. A zero count here is therefore
 * EXPECTED and CORRECT until WP02–WP05 adopt the marker; it is reported honestly rather than
 * synthesized, precisely so SC-002's "equal and non-zero" check has real teeth instead of a
 * fabricated pass.
 *
 * LIMITATION, CONFIRMED AT MISSION CLOSEOUT (pre-merge squad F1, PR #454): these two counts are
 * NOT counting the same population, and their equality is not evidence that every rewritten
 * assertion has a red-first proof. "Rewritten assertion" (above) is a per-HUNK count over the
 * whole mission diff; at closeout it landed almost entirely on WP06's `console.warn`-wrap
 * hunks in `fixtures/elements-behaviour/src/*.test.ts`, where every `expect()` is byte-identical
 * and only re-indented (FR-011) — a rewritten SITE by this script's hunk-shape heuristic, but not
 * an assertion whose behaviour changed. "Red-first proof" (above) landed almost entirely in
 * `apps/storybook/src/tests/*.spec.ts`'s `RED-FIRST-PROOF` marker comments, which is a near-
 * disjoint file set from the WP06 hunks. Nothing in this script binds a specific marker to a
 * specific rewritten assertion; it can only report that both totals are non-zero and equal,
 * which is a much weaker claim than "every rewrite has a proof" and MUST NOT be read as that
 * claim. Treat SC-002's per-assertion correspondence as established only where a specific
 * marker names a run id, mutation commit and revert commit that were independently verified —
 * see `acceptance-matrix.json`'s SC-002/NFR-003 rows and `evidence/PRE-MERGE-GATES.md` for the
 * mission's real, marker-by-marker accounting.
 *
 *
 * LIFECYCLE / OWNERSHIP (pre-merge squad, architecture lens). This script has NO automated
 * caller by design: it is not in package.json scripts, not in any workflow, and deliberately not
 * registered in check-gate-wiring.mjs -- wiring it as a gate would make it fail the repository
 * on any honest new precondition wait. It is an OPERATOR instrument, run by hand at a mission's
 * closeout and quoted verbatim into that mission's report. That means nothing will exercise its
 * `--selftest` unless a human does, so run `--selftest` before trusting any figure it prints;
 * it is written to fail loudly when its own rules are neutered. If a future maintainer finds no
 * mission is using it, deleting it is the right call -- leaving it unowned and unrun is not.
 * Tracked alongside the mission-tooling follow-ups in issue #456.
 * USAGE
 *   node scripts/scan-mission-suppressions.mjs --base=<ref> [--target=<ref>]
 *   node scripts/scan-mission-suppressions.mjs --selftest
 */
import { execFileSync } from 'node:child_process';

/** Splits a unified diff into per-file hunks: `{ file, hunkLines: string[] }[]`, where
 *  `hunkLines` are the raw lines of one `@@ ... @@` hunk (context/added/removed, no headers). */
export function parseDiffHunks(diffText) {
  const hunks = [];
  let currentFile = null;
  let currentHunk = null;
  const flush = () => {
    if (currentHunk) hunks.push(currentHunk);
    currentHunk = null;
  };
  for (const line of diffText.split('\n')) {
    if (line.startsWith('diff --git ')) {
      flush();
      const m = line.match(/^diff --git a\/(\S+) b\/(\S+)$/);
      currentFile = m ? m[2] : null;
    } else if (line.startsWith('@@ ')) {
      flush();
      currentHunk = { file: currentFile, lines: [] };
    } else if (currentHunk && (line.startsWith('+') || line.startsWith('-') || line.startsWith(' '))) {
      currentHunk.lines.push(line);
    }
  }
  flush();
  return hunks;
}

const addedOf = (hunk) => hunk.lines.filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1));
const removedOf = (hunk) => hunk.lines.filter((l) => l.startsWith('-') && !l.startsWith('---')).map((l) => l.slice(1));

/**
 * SCOPE, deliberately narrow: only Playwright spec files and playwright.config.ts can carry a
 * real suppression of THESE tests — `test.skip(`, `retries:`, a timeout literal. Without this
 * filter, the scan false-positives on every mission markdown artifact that merely QUOTES these
 * patterns in prose (spec.md/plan.md/tasks.md all discuss `test.skip`, `retries: 2`, etc. at
 * length — reproduced: running this scan unfiltered over this mission's own planning artifacts
 * reports dozens of "violations" that are sentences, not code) and on this script's OWN source
 * (its pattern definitions and --selftest fixtures literally contain the strings it looks for).
 * A scan that cries wolf on prose is exactly as untrustworthy as one that misses real code — the
 * "does not cry wolf" selftest case below is what holds this filter to that.
 */
const SCANNABLE_FILE_RE = /(\.spec\.tsx?$)|(\.test\.tsx?$)|(^|\/)playwright\.config\.ts$/;
const isScannable = (file) => typeof file === 'string' && SCANNABLE_FILE_RE.test(file);

// `[\d_]+` not `\d+`: a JS numeric separator silently truncated the value. `timeout: 20_000`
// read as **20**, so an inflation from 5000 to 20_000 reported NO inflation -- the rule ran,
// matched, and compared the wrong number. Found by the squad's correctness lens. Separators are
// stripped before Number() below.
const NUMERIC_TIMEOUT_RE = /\b(?:timeout|waitForTimeout|setTimeout)\s*[:(]\s*([\d_]+)/g;

/**
 * A wait budget declared as a NAMED CONSTANT rather than written inline.
 *
 * `NUMERIC_TIMEOUT_RE` requires the digits to sit directly after `timeout:`/`timeout(`, so
 * `const FONT_BUDGET_MS = 1500` and `{ timeoutMs = 5000 }` were both invisible to it. The
 * pre-merge squad found this mission had added FOUR new wait budgets and the scan could see
 * exactly one of them -- while the report printed a clean zero, which is worse than printing
 * nothing.
 *
 * Deliberately conservative: it matches an identifier that ANNOUNCES itself as a duration
 * (`...MS`, `...Ms`, `timeout...`, `...Timeout`, `...Delay`, `...Budget`) assigned an integer
 * literal. It will not resolve an identifier to a value elsewhere in the file -- that needs a
 * real parser, which this script's header already declines to be.
 */
const NAMED_BUDGET_RE =
  /\b(?:const|let|var)?\s*([A-Za-z_$][\w$]*(?:_MS|Ms|Timeout|timeout|Delay|Budget|Deadline|Wait)[\w$]*)\s*=\s*([\d_]+)\b/g;

function extractTimeoutValues(text) {
  const values = [];
  const toNumber = (raw) => Number(String(raw).replace(/_/g, ''));
  for (const m of text.matchAll(NUMERIC_TIMEOUT_RE)) values.push(toNumber(m[1]));
  for (const m of text.matchAll(NAMED_BUDGET_RE)) values.push(toNumber(m[2]));
  return values;
}

/**
 * Pure. Runs every suppression/count rule over already-parsed hunks. Returns a findings object
 * so both `main()` and `--selftest` read the SAME logic — nothing here shells out or reads a
 * file, which is what lets `--selftest` plant synthetic diff text directly.
 */
export function scan(hunks) {
  const findings = {
    testSkip: [],
    testFixme: [],
    only: [],
    addedRetries: [],
    increasedTimeout: [],
    newTimeout: [],
    rewrittenAssertionSites: 0,
    redFirstProofs: 0,
  };

  for (const hunk of hunks) {
    if (!isScannable(hunk.file)) continue;
    const added = addedOf(hunk);
    const removed = removedOf(hunk);
    const addedText = added.join('\n');
    const removedText = removed.join('\n');

    for (const line of added) {
      if (/\.skip\s*\(/.test(line) || /\btest\.skip\b/.test(line)) findings.testSkip.push({ file: hunk.file, line });
      if (/\.fixme\s*\(/.test(line) || /\btest\.fixme\b/.test(line)) findings.testFixme.push({ file: hunk.file, line });
      if (/\.only\s*\(/.test(line)) findings.only.push({ file: hunk.file, line });
    }

    // Added retries: a `retries:` (or `.configure({ retries` ) key appearing in an added line
    // with no equivalent key anywhere in this hunk's removed lines — a genuinely NEW retry
    // tolerance, not an unrelated line shifting past an unchanged one.
    const retriesAddedLines = added.filter((l) => /\bretries\s*:\s*\d/.test(l));
    const retriesRemovedAny = /\bretries\s*:\s*\d/.test(removedText);
    if (retriesAddedLines.length > 0 && !retriesRemovedAny) {
      for (const line of retriesAddedLines) findings.addedRetries.push({ file: hunk.file, line });
    }

    // Increased numeric timeout literal: the largest added value exceeds the largest removed
    // value present in the SAME hunk. Comparing max-to-max (not pairing individual calls) is a
    // deliberate, documented simplification — precise call-to-call pairing would need a real
    // parser, which check-gate-wiring.mjs's own header explicitly declines to be for a
    // comparable reason (disproportionate machinery for one repo's worth of workflow shell).
    const addedTimeouts = extractTimeoutValues(addedText);
    const removedTimeouts = extractTimeoutValues(removedText);
    if (addedTimeouts.length && removedTimeouts.length) {
      const maxAdded = Math.max(...addedTimeouts);
      const maxRemoved = Math.max(...removedTimeouts);
      if (maxAdded > maxRemoved) {
        findings.increasedTimeout.push({ file: hunk.file, from: maxRemoved, to: maxAdded });
      }
    } else if (addedTimeouts.length && !removedTimeouts.length) {
      // A PURE-ADDITION hunk: a brand-new wait budget where the diff removed none. The rule
      // above compared max-added to max-removed and therefore required a removal to exist,
      // so every wholly new timeout was invisible and the report still printed
      // "increased numeric timeout literal: 0" — a green over an empty set, which is the
      // defect class this repository has written down twice (gates must refuse empty sets).
      //
      // Found by the pre-merge squad against THIS mission's own diff, which added
      // `{ timeout: 20000 }` and two new budget constants while the scan reported zero. The
      // shape below is copied from the `retries:` rule twenty lines above, which already got
      // added-with-no-removed right.
      for (const value of addedTimeouts) {
        findings.newTimeout.push({ file: hunk.file, value });
      }
    }

    const removedExpect = removed.some((l) => /\bexpect\s*\(/.test(l));
    const addedExpect = added.some((l) => /\bexpect\s*\(/.test(l));
    if (removedExpect && addedExpect) findings.rewrittenAssertionSites += 1;

    findings.redFirstProofs += (addedText.match(/RED-FIRST-PROOF/g) ?? []).length;
  }

  return findings;
}

const suppressionCount = (f) =>
  f.testSkip.length + f.testFixme.length + f.only.length + f.addedRetries.length +
  f.increasedTimeout.length;
// NOTE: `newTimeout` is deliberately NOT in that sum. A brand-new wait budget guarding a
// precondition is not a suppression, and SC-003 ("zero suppressions") / C-001 ("no wait duration
// INCREASED") do not forbid one. Counting it would make both criteria unachievable for any
// mission that legitimately adds a precondition wait, which pressures the next author to avoid
// the rule rather than disclose under it -- the opposite of what this scan is for. New budgets
// are reported in their own section below, unconditionally, and each must be accounted for in
// the mission's acceptance matrix. What the scan guarantees is that they are VISIBLE; before the
// pre-merge squad found this, four of them were invisible and the report printed a clean zero.

function printReport(findings) {
  console.log('SC-003 — mechanical suppression scan:');
  const rows = [
    ['test.skip', findings.testSkip],
    ['test.fixme', findings.testFixme],
    ['.only', findings.only],
    ['added retries', findings.addedRetries],
    ['increased numeric timeout literal', findings.increasedTimeout],
  ];
  for (const [label, list] of rows) {
    console.log(`  ${list.length === 0 ? '✅' : '❌'} ${label}: ${list.length}`);
    for (const item of list.slice(0, 20)) console.log(`      ${item.file ?? '(unknown file)'}: ${JSON.stringify(item)}`);
  }
  console.log('\nDISCLOSURE — new wait budgets (NOT suppressions; not counted above):');
  if (findings.newTimeout.length === 0) {
    console.log('  none added by this diff.');
  } else {
    console.log(
      `  ${findings.newTimeout.length} new wait budget(s). These do not fail this scan — a new` +
        ' precondition wait is not a suppression and not an increase — but every one must be',
    );
    console.log(
      '  accounted for in the mission acceptance matrix under SC-003/C-001, with its purpose and',
    );
    console.log('  its effect on the enclosing per-test timeout stated:');
    for (const item of findings.newTimeout.slice(0, 20)) {
      console.log(`      ${item.file}: ${item.value}ms`);
    }
  }

  console.log(`\nSC-002 — rewritten assertions vs red-first proofs:`);
  console.log(`  rewritten-assertion sites: ${findings.rewrittenAssertionSites}`);
  console.log(`  red-first-proof markers:   ${findings.redFirstProofs}`);
  const equalAndNonZero = findings.rewrittenAssertionSites === findings.redFirstProofs && findings.rewrittenAssertionSites > 0;
  console.log(
    equalAndNonZero
      ? '  ✅ equal and non-zero'
      : '  ❌ NOT equal-and-non-zero — SC-002 unmet (see this file\'s header for the RED-FIRST-PROOF marker convention)',
  );
}

function selftest() {
  const cases = [];
  const define = (name, diff, assertFn) => cases.push({ name, diff, assertFn });

  define(
    'plants a test.skip and catches it',
    [
      'diff --git a/apps/storybook/src/tests/x.spec.ts b/apps/storybook/src/tests/x.spec.ts',
      '@@ -1,1 +1,1 @@',
      "-test('a', async () => {});",
      "+test.skip('a', async () => {});",
    ].join('\n'),
    (f) => f.testSkip.length === 1 && suppressionCount(f) === 1,
  );

  define(
    'plants a .fixme and catches it',
    [
      'diff --git a/apps/storybook/src/tests/x.spec.ts b/apps/storybook/src/tests/x.spec.ts',
      '@@ -1,1 +1,1 @@',
      "-test('a', async () => {});",
      "+test.fixme('a', async () => {});",
    ].join('\n'),
    (f) => f.testFixme.length === 1,
  );

  define(
    'plants a .only and catches it',
    [
      'diff --git a/apps/storybook/src/tests/x.spec.ts b/apps/storybook/src/tests/x.spec.ts',
      '@@ -1,1 +1,1 @@',
      "-test('a', async () => {});",
      "+test.only('a', async () => {});",
    ].join('\n'),
    (f) => f.only.length === 1,
  );

  define(
    'plants an added retries: and catches it (C-001 — inherited retries is a suppression)',
    [
      'diff --git a/playwright.config.ts b/playwright.config.ts',
      '@@ -1,1 +1,1 @@',
      '-  use: { baseURL: url },',
      '+  use: { baseURL: url },\n+  retries: 2,',
    ].join('\n'),
    (f) => f.addedRetries.length === 1,
  );

  define(
    'plants an increased timeout literal and catches it (C-003)',
    [
      'diff --git a/apps/storybook/src/tests/x.spec.ts b/apps/storybook/src/tests/x.spec.ts',
      '@@ -1,1 +1,1 @@',
      "-  await expect(x).toBeVisible({ timeout: 5000 });",
      "+  await expect(x).toBeVisible({ timeout: 15000 });",
    ].join('\n'),
    (f) => f.increasedTimeout.length === 1 && f.increasedTimeout[0].from === 5000 && f.increasedTimeout[0].to === 15000,
  );

  define(
    'a DECREASED timeout literal is NOT flagged (only inflation is a violation)',
    [
      'diff --git a/apps/storybook/src/tests/x.spec.ts b/apps/storybook/src/tests/x.spec.ts',
      '@@ -1,1 +1,1 @@',
      "-  await expect(x).toBeVisible({ timeout: 15000 });",
      "+  await expect(x).toBeVisible({ timeout: 5000 });",
    ].join('\n'),
    (f) => f.increasedTimeout.length === 0,
  );

  define(
    'a NAMED budget constant is flagged — NAMED_BUDGET_RE had zero coverage, proved by deleting it and watching all cases still pass',
    [
      'diff --git a/apps/storybook/src/tests/x.spec.ts b/apps/storybook/src/tests/x.spec.ts',
      '@@ -1,1 +1,2 @@',
      '   const host = page.getByTestId("x");',
      '+  const FONT_BUDGET_MS = 1500;',
    ].join('\n'),
    (f) => f.newTimeout.length === 1 && f.newTimeout[0].value === 1500,
  );

  define(
    'NAMED_BUDGET_RE does NOT fire on an identifier that merely ends in a digit assignment',
    [
      'diff --git a/apps/storybook/src/tests/x.spec.ts b/apps/storybook/src/tests/x.spec.ts',
      '@@ -1,1 +1,2 @@',
      '   const host = page.getByTestId("x");',
      '+  const laneCount = 3;',
    ].join('\n'),
    // The rule matches identifiers that ANNOUNCE a duration (_MS/Ms/Timeout/Delay/Budget/Deadline/
    // Wait). A plain count must not be reported as a wait budget, or the disclosure section fills
    // with noise and stops being read -- which is how a real budget would then slip past.
    (f) => f.newTimeout.length === 0,
  );

  define(
    'a numeric separator does NOT truncate the value — `20_000` must read as 20000, not 20',
    [
      'diff --git a/apps/storybook/src/tests/x.spec.ts b/apps/storybook/src/tests/x.spec.ts',
      '@@ -1,1 +1,1 @@',
      '-  await expect(x).toBeVisible({ timeout: 5000 });',
      '+  await expect(x).toBeVisible({ timeout: 20_000 });',
    ].join('\n'),
    // Before the fix this read 20 and reported a DECREASE, i.e. no inflation, on a 4x increase.
    (f) => f.increasedTimeout.length === 1 && f.increasedTimeout[0].from === 5000 && f.increasedTimeout[0].to === 20000,
  );

  define(
    'a PURE-ADDITION wait budget is flagged — the empty-set green this scan used to print',
    [
      'diff --git a/apps/storybook/src/tests/x.spec.ts b/apps/storybook/src/tests/x.spec.ts',
      '@@ -1,2 +1,3 @@',
      '   const host = page.getByTestId("x");',
      '+  await page.waitForFunction(() => true, undefined, { timeout: 20000 });',
      '   await expect(host).toBeVisible();',
    ].join('\n'),
    // Before the fix this hunk produced increasedTimeout=[] AND newTimeout undefined, and the
    // report printed a clean "increased numeric timeout literal: 0" over it.
    (f) => f.newTimeout.length === 1 && f.newTimeout[0].value === 20000 && f.increasedTimeout.length === 0,
  );

  define(
    'a clean assertion rewrite (settle-before-sample, no suppression) is NOT flagged as a suppression, but IS counted as a rewritten-assertion site',
    [
      'diff --git a/apps/storybook/src/tests/sk-progress.spec.ts b/apps/storybook/src/tests/sk-progress.spec.ts',
      '@@ -1,2 +1,2 @@',
      '-  const sample1 = await samplePixels(page, buf1);',
      "-  expect(pixelsEqual(sample1, zeroSample)).toBe(false);",
      '+  await settleAnimation(page);',
      '+  const sample1 = await samplePixels(page, buf1);',
      "+  expect(pixelsEqual(sample1, zeroSample)).toBe(false);",
    ].join('\n'),
    (f) => suppressionCount(f) === 0 && f.rewrittenAssertionSites === 1,
  );

  define(
    'a RED-FIRST-PROOF marker in an added comment is counted',
    [
      'diff --git a/apps/storybook/src/tests/sk-progress.spec.ts b/apps/storybook/src/tests/sk-progress.spec.ts',
      '@@ -1,1 +1,2 @@',
      "-  expect(sample1.left).not.toBe(zeroSample.left);",
      '+  // RED-FIRST-PROOF: reverted the paint-settle await, this assertion failed with',
      '+  // "expected false to be true" — restored, it passes again.',
      "+  expect(sample1.left).not.toBe(zeroSample.left);",
    ].join('\n'),
    (f) => f.redFirstProofs === 1,
  );

  define(
    'a markdown file merely QUOTING test.skip( in prose is NOT flagged — the file-scope filter, ' +
      'the exact regression reproduced against this mission\'s own spec.md/plan.md/tasks.md',
    [
      'diff --git a/kitty-specs/some-mission/notes.md b/kitty-specs/some-mission/notes.md',
      '@@ -1,1 +1,2 @@',
      '-Old prose.',
      "+The scan looks for `test.skip(`, `.only(`, and `retries: 2` across the mission diff.",
    ].join('\n'),
    (f) => suppressionCount(f) === 0,
  );

  define(
    'an entirely unrelated, clean diff produces zero findings across every rule — the scan does not cry wolf',
    [
      'diff --git a/docs/design-system/using-tokens.md b/docs/design-system/using-tokens.md',
      '@@ -1,1 +1,1 @@',
      '-Old copy.',
      '+New copy, unrelated to any test.',
    ].join('\n'),
    (f) => suppressionCount(f) === 0 && f.rewrittenAssertionSites === 0 && f.redFirstProofs === 0,
  );

  let allOk = true;
  for (const c of cases) {
    let ok = false;
    let error;
    try {
      const findings = scan(parseDiffHunks(c.diff));
      ok = c.assertFn(findings);
    } catch (err) {
      error = err.message;
    }
    allOk = allOk && ok;
    console.log(`${ok ? '✅' : '❌'} ${c.name}${error ? ` (threw: ${error})` : ''}`);
  }

  const PROBE_FLOOR = 14;
  if (cases.length < PROBE_FLOOR) {
    console.error(`\n❌ the probe table has shrunk: ${cases.length} against a floor of ${PROBE_FLOOR}.`);
    process.exitCode = 1;
    return;
  }
  if (!allOk) {
    console.error('\n❌ selftest failed — this scan cannot be trusted to detect a planted violation.');
    process.exitCode = 1;
    return;
  }
  console.log(`\n✅ all ${cases.length} selftest cases matched — the scan both catches planted violations and stays quiet on clean diffs.`);
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--selftest')) {
    selftest();
    return;
  }
  const arg = (name) => argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
  const base = arg('base');
  const target = arg('target') ?? 'HEAD';
  if (!base) {
    console.error(
      'usage: node scripts/scan-mission-suppressions.mjs --base=<ref> [--target=<ref>] (or --selftest)\n' +
        "  --base should name the mission's PR base (e.g. train/elements-first) so the diff " +
        'covers every WP\'s accumulated changes, not just one lane.',
    );
    process.exitCode = 1;
    return;
  }
  let diffText;
  try {
    diffText = execFileSync('git', ['diff', `${base}...${target}`], { encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 });
  } catch (err) {
    console.error(`❌ \`git diff ${base}...${target}\` failed: ${err.message}`);
    process.exitCode = 1;
    return;
  }
  const findings = scan(parseDiffHunks(diffText));
  printReport(findings);
  const clean = suppressionCount(findings) === 0;
  const equalAndNonZero = findings.rewrittenAssertionSites === findings.redFirstProofs && findings.rewrittenAssertionSites > 0;
  process.exitCode = clean && equalAndNonZero ? 0 : 1;
}

main();
