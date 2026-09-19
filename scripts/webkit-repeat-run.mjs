#!/usr/bin/env node
/**
 * scripts/webkit-repeat-run.mjs — WP01's measurement rig (mission webkit-timing-deflake-01M2T31J).
 *
 * WHAT THIS IS
 *
 * A reproducible invocation that runs the canonical scope items (spec.md's
 * "Canonical scope" table) under the **webkit** project with `--repeat-each=N` (default 10)
 * and **`retries: 0`**, reporting a per-item pass/fail count. Four other work packages (WP02–
 * WP05) state their acceptance as "10/10 under the WP01 rig" — this file, and the
 * `webkit-repeat-run.yml` workflow that calls it, ARE that rig.
 *
 * WHY `retries: 0` IS NOT INHERITED (NFR-002, C-001, plan.md Correction 4)
 *
 * `playwright.config.ts:19` sets `retries: process.env['CI'] ? 2 : 0`. A repeat rig that
 * relies on that default would report a genuinely failing test as `flaky` at exit 0 under CI
 * — a retry-wrapped green arriving by inheritance rather than by choice. This script passes
 * `--retries=0` as an explicit CLI flag on every invocation, which overrides the config
 * regardless of `CI`, and prints the setting it ran under (see `printRetrySetting` below) so
 * a reviewer never has to trust that this held — it is stated, every run.
 *
 * WHY TWO PLAYWRIGHT INVOCATIONS, NOT ONE
 *
 * Most items are selected by an exact `file:line` — Playwright's own
 * test-selection syntax — whose line is RESOLVED from each item's titleAnchor at run time
 * and never stored. The twelfth (item 12, the `sk-action-row.spec.ts` "external
 * controls" family) is parameterized across six modes with no single line, and is selected by
 * a `--grep` title match instead. Mixing a `--grep` filter into the same invocation as the
 * `file:line` selections would apply that filter GLOBALLY, silently dropping the other line-addressed
 * items (their titles do not match item 12's grep pattern) — so item 12 runs as its own,
 * separate invocation against the whole file.
 *
 * WHAT THIS DOES NOT DO
 *
 * It does not alter `.github/workflows/ci-quality.yml`'s `playwright` job (C-009) — this is a
 * free-standing script invoked by its own `workflow_dispatch` workflow
 * (`.github/workflows/webkit-repeat-run.yml`). It does not build Storybook itself — the caller
 * (the workflow, or a developer with `apps/storybook/storybook-static` already built) is
 * responsible for that, the same separation the ordinary `playwright` job already has from
 * `storybook-build`.
 *
 *
 * A KNOWN ENVIRONMENTAL FAULT, SO IT IS NOT CHASED AS A TEST DEFECT
 *
 *   Error: page.goto: WebKit encountered an internal error
 *
 * This is a browser-level crash during navigation, not an assertion failure, and it lands on
 * whichever test happens to be running when it occurs. FOUR sightings, none reproducing on an
 * immediate re-measurement. Three landed on different tests; the fourth repeated on item 13,
 * which is the first evidence that it is not uniformly distributed:
 *
 *   #453  run 35375265259 attempt 1  sk-progress item 4        item 4 was 9/10, 10/10 on
 *                                                              attempt 2 (the run total was
 *                                                              199/200; the other rows quote
 *                                                              ITEM counts, so this one now does)
 *   #456  run 35396510928            sk-notice item 13         29/30,  60/60 and 40/40 after
 *   #456  PR #457 CI 35401059899     sk-public-header item 17  1 failure, 40/40 after
 *   #456  run 35408745117            sk-notice item 13 AGAIN   59/60, and the only failure in
 *                                                              420 executions of the reworked fix
 *
 * FAILURE KINDS SEEN IN THIS MISSION -- kinds, deliberately, not a total. An earlier revision of
 * this note gave a single arithmetic ("38 + 3 + 17 ... ~1,270 executions ... Nothing else") that
 * the evidence lens showed was wrong in three ways at once: the per-run counts do not sum to it,
 * the execution total was short, and it omitted kinds it documents elsewhere in this same file.
 * Counts change every time a run is added, so they are not restated here; read them from the runs.
 *
 *   1. sk-page-header sticky / WCAG 2.4.11 -- real, fixed. Runs 35396510928, 35397298731,
 *      35398052148, 35398759713, 35399537534.
 *   2. The environmental `page.goto: WebKit encountered an internal error` above -- 4 sightings,
 *      never reproducing.
 *   3. `TimeoutError: locator.waitFor ... .sk-empty-state--inline` (run 35403525734, item 18) --
 *      one sighting, did not reproduce at 40 repeats, cause NOT established.
 *   4. `sk-section-nav.spec.ts:402` on CHROMIUM (PR #457 runs 35401059899, 35403525734) -- a real
 *      regression introduced BY this mission and fixed in 1125f06b, not a flake. It is listed
 *      because an accounting that silently omits the author's own regression is worthless.
 *
 * WHY THIS MATTERS FOR READING A COUNT: a single occurrence turns an otherwise clean item into
 * "29/30" and invites a de-flaking change to a test that has nothing wrong with it. Before
 * treating any one-off as a test defect, read the error. If it is this one, re-measure instead.
 * Two of the five specs #456 originally named were flagged on exactly this basis.
 * USAGE
 *   node scripts/webkit-repeat-run.mjs [--repeat-each=10] [--items=1,2,3,...,18] [--json-dir=DIR]
 *                                      [--workers=N]
 *
 * WHY `--workers` EXISTS (mission 453, shared-cause investigation)
 *
 *   playwright.config.ts sets `fullyParallel: true` and `workers: process.env['CI'] ? 2 : 0-or-2`,
 *   so under CI the repeats of a single test run CONCURRENTLY in two webkit contexts on a
 *   two-core runner. Four samples of this rig showed the shell-layout and workflow-board
 *   geometry items (6-10) failing in a ROTATING pattern -- every one of them both green and
 *   red across runs, none consistently broken -- while the colour and computed-style items
 *   (1-5, 11, 12) stayed stable. `--workers=N` exists to test whether that rotation is CPU
 *   contention between co-scheduled heavy layout tests rather than a defect in any one test.
 *   It is a MEASUREMENT control, not a fix: pinning workers=1 here would not change what the
 *   ordinary `playwright` job does, and must never be used to manufacture a green count.
 *
 * Exit code is non-zero if any selected item shows a failure — this is a measurement tool, not
 * a merge gate, so a non-zero exit on the pre-fix baseline run is the CORRECT and EXPECTED
 * result (items 1 and 4 are known hard failures), not a defect in this script.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

const RETRIES = 0; // NFR-002 — never read from CI env, never inherited from playwright.config.ts.
const PROJECT = 'webkit'; // C-005 — the only engine this mission's affected tests run under.
/** Scheduling condition for this process's runs. `null` = inherit playwright.config.ts
 *  (`fullyParallel: true`, `workers: 2` under CI). Recorded, not defaulted, so no count can
 *  ever be read without knowing whether its repeats were co-scheduled. */
let workersSetting = null;

/** Line-addressable items. Items 1-11 are #453's canonical scope; 13-18 were added by #456, the
 *  last two found by this mission's own CI rather than named by the issue. Each carries a unique
 *  titleAnchor and its line is resolved at run time. */
const LINE_ITEMS = [
  { item: 1, file: 'apps/storybook/src/tests/sk-progress.spec.ts', label: 'forced-colors, two points in cycle', titleAnchor: 'legible' },
  { item: 2, file: 'apps/storybook/src/tests/sk-progress.spec.ts', label: 'forced-colors + reduced-motion', titleAnchor: 'together' },
  { item: 3, file: 'apps/storybook/src/tests/sk-progress.spec.ts', label: 'the sweep actually runs', titleAnchor: 'sweep' },
  { item: 4, file: 'apps/storybook/src/tests/sk-progress.spec.ts', label: 'reduced-motion freeze', titleAnchor: 'stops' },
  { item: 5, file: 'apps/storybook/src/tests/sk-progress.spec.ts', label: 'no animation leak onto determinate', titleAnchor: 'teeth' },
  { item: 6, file: 'apps/storybook/src/tests/sk-team-overview-shell-layout.spec.ts', label: 'exact 56/240px columns', titleAnchor: 'preserves exact' },
  { item: 7, file: 'apps/storybook/src/tests/sk-team-overview-shell-layout.spec.ts', label: 'narrow shell region order', titleAnchor: 'reachable' },
  { item: 8, file: 'apps/storybook/src/tests/sk-team-overview-shell-layout.spec.ts', label: 'landmarks/labels/grouping', titleAnchor: 'landmarks' },
  { item: 9, file: 'apps/storybook/src/tests/sk-team-overview-shell-layout.spec.ts', label: 'axe-clean in dark mode', titleAnchor: 'axe-clean' },
  { item: 10, file: 'apps/storybook/src/tests/sk-workflow-board.spec.ts', label: 'focused overflow keyboard scroll', titleAnchor: 'outline' }, // WP03: was 557; T021's waitForScrollSettled helper (added ahead of this test) shifted it. See tmp/finding/wp03-lane-c-rig-line-number-drift.md.
  { item: 11, file: 'apps/storybook/src/tests/sk-radio-choice-group.spec.ts', label: 'legend cue across two stories', titleAnchor: 'non-required legend' },
  // ---------------------------------------------------------------------------------------
  // Items 13-16 (#456). The webkit lane flakes BEYOND mission #453's twelve items. These four
  // were observed flaky in pre-mission CI runs on the train, with run ids recorded in #456:
  // 35375268744 (sk-notice), 34637284298 (sk-page-header-sticky), 34673156155
  // (sk-work-explorer-pattern and sk-workflow-board:650 -- a DIFFERENT test from item 10).
  //
  // They are added here rather than investigated by reading, deliberately. None of them carries
  // the shapes this programme has been fixing -- no waitForTimeout, no innerHTML injection over
  // the story root, no elapsed-time wait -- so they are not variants of the render race, and
  // reading them produced plausible mechanisms that did not survive checking. #456's own stated
  // method is to measure first at --retries=0 and find the mechanism from the failure, which is
  // what items 1-12 established works and what guessing did not.
  //
  // The fifth spec named in #456, sk-action-row.spec.ts:110, is NOT added: it is the same
  // parameterized family already measured as item 12, which has been 10/10 under webkit in every
  // sample. Its only sighting was chromium (run 34673156155), so if it is real it is an
  // engine-specific issue this webkit rig cannot see, and it needs its own measurement.
  { item: 13, file: 'apps/storybook/src/tests/sk-notice-forced-colors.spec.ts', label: 'reduced-motion entrance suppressed, message survives', titleAnchor: 'entrance animation is suppressed' },
  { item: 14, file: 'apps/storybook/src/tests/sk-page-header-sticky.spec.ts', label: 'focused row lifted clear of sticky header', titleAnchor: 'lifted clear' },
  { item: 15, file: 'apps/storybook/src/tests/sk-work-explorer-pattern.spec.ts', label: 'W4 rail/context/overflow at shell edges', titleAnchor: 'W4 retains' },
  { item: 16, file: 'apps/storybook/src/tests/sk-workflow-board.spec.ts', label: '220px smallest qualifying candidate in sweep', titleAnchor: '220px is the smallest' },
  // Item 17 (#456, found BY this mission rather than named by it). Surfaced in PR #457's own CI
  // run 35401059899 -- a webkit failure in a spec this branch never touched, absent from the four
  // pre-mission runs checked (34820757579, 34673156155, 34637284298, 34606532461) and sharing no
  // story file or helper with anything changed here. So it is an independent member of the
  // population #456 describes, not a consequence of this work.
  //
  // Added rather than filed: the operator ruled that anything this mission's own measurement turns
  // up is handled in-mission, and a rig that finds a flake and then writes an issue about it is
  // doing half its job.
  { item: 17, file: 'apps/storybook/src/tests/sk-public-header.spec.ts', label: 'focus outlines unclipped at narrow and wide widths', titleAnchor: 'focus outlines remain visible' },
  // Item 18 (#456, found by this mission's own CI, second of two). PR #457 run 35403525734:
  // `TimeoutError: locator.waitFor: Timeout 20000ms exceeded — waiting for
  // locator('.sk-empty-state--inline').first() to be visible`, i.e. the story element never became
  // visible at all. Flaky, not failed: it passed on retry. Absent from the three pre-mission runs
  // checked, in a spec this branch never touched, and NOT the environmental WebKit-internal-error
  // signature documented in this file's header -- so it is measured rather than assumed to be
  // either a defect or noise.
  { item: 18, file: 'apps/storybook/src/tests/sk-empty-state-inline.spec.ts', label: 'long supplied copy wraps in the inline empty state', titleAnchor: 'long supplied copy wraps' },
];

/** Item 12: parameterized across six modes, no single line — selected by title grep instead. */
const GREP_ITEM = {
  item: 12,
  file: 'apps/storybook/src/tests/sk-action-row.spec.ts',
  grep: 'keeps external controls on their own Tab and activation paths',
  label: 'external controls family (adopted; six modes)',
};

/**
 * Refuse to measure through a stale selector.
 *
 * Playwright SILENTLY DROPS a `file:line` argument that matches no test when it is mixed with
 * arguments that do match -- no warning, no non-zero exit. The rig then prints a per-item table
 * that is missing rows, or prints counts for fewer items than were asked for, and every number
 * in it still looks correct. This mission corrected these line numbers six times as owning work
 * packages legitimately edited their own spec files; the last drift (item 10, 620 -> 654) came
 * from the very commit that fixed item 10.
 *
 * So the selectors are verified against the files before any run: every selected line must
 * actually begin a `test(` declaration. A count over the wrong set of tests is worse than no
 * count, because it is indistinguishable from a good one.
 */
function resolveLineItems(lineItems) {
  const problems = [];
  const resolved = [];
  for (const it of lineItems) {
    const lines = readFileSync(it.file, 'utf8').split('\n');
    const anchor = (it.titleAnchor ?? '').toLowerCase();
    if (!anchor) {
      problems.push(`  item ${it.item}: no titleAnchor declared — one is required to resolve a line.`);
      continue;
    }
    // Every `test(` declaration containing this item's anchor. Exactly one must match: zero means
    // the test was renamed or removed, more than one means the anchor cannot identify a single
    // test and would silently select a neighbour.
    const hits = [];
    for (let i = 0; i < lines.length; i += 1) {
      if (/^\s*test\(/.test(lines[i]) && lines[i].toLowerCase().includes(anchor)) {
        hits.push({ line: i + 1, text: lines[i].trim() });
      }
    }
    if (hits.length !== 1) {
      problems.push(
        `  item ${it.item}: titleAnchor "${it.titleAnchor}" matches ${hits.length} test( ` +
          `declarations in ${it.file} — it must identify exactly one` +
          (hits.length > 1 ? `: lines ${hits.map((h) => h.line).join(', ')}` : ''),
      );
      continue;
    }
    resolved.push({ ...it, line: hits[0].line });
  }
  if (problems.length > 0) {
    throw new Error(
      `${problems.length} of ${lineItems.length} line-items could not be resolved:\n` +
        `${problems.join('\n')}\n\n` +
        'Playwright silently drops a file:line that matches no test and still exits 0, so this ' +
        'refuses rather than measuring a smaller set than you asked for.',
    );
  }
  console.log(
    `Selectors: all ${resolved.length} line-items resolved from their titleAnchors — ` +
      `${resolved.map((r) => `${r.item}:${r.line}`).join(' ')}`,
  );
  return resolved;
}

function parseArgs(argv) {
  const opts = { repeatEach: 10, items: null, jsonDir: null, workers: null };
  for (const arg of argv) {
    if (arg.startsWith('--repeat-each=')) opts.repeatEach = Number(arg.split('=')[1]);
    else if (arg.startsWith('--items=')) opts.items = new Set(arg.split('=')[1].split(',').map(Number));
    else if (arg.startsWith('--json-dir=')) opts.jsonDir = arg.split('=')[1];
    else if (arg.startsWith('--workers=')) opts.workers = Number(arg.split('=')[1]);
  }
  if (!Number.isInteger(opts.repeatEach) || opts.repeatEach < 1) {
    throw new Error(`--repeat-each must be a positive integer, got ${opts.repeatEach}`);
  }
  if (opts.workers !== null && (!Number.isInteger(opts.workers) || opts.workers < 1)) {
    throw new Error(`--workers must be a positive integer when given, got ${opts.workers}`);
  }
  // `--items` was the one option with no validation. `--items=13` or `--items=abc` (which maps
  // to Set{NaN}) selected NOTHING, Playwright was never invoked, and the script still printed
  // "every selected item passed every repeat" and exited 0 -- a green over an empty set, which
  // is the defect class this repository has written down twice, here in the tool whose whole
  // job is to be believed. Found by the pre-merge squad.
  if (opts.items !== null) {
    const known = new Set([...LINE_ITEMS.map((it) => it.item), GREP_ITEM.item]);
    const unknown = [...opts.items].filter((n) => !known.has(n));
    if (unknown.length > 0) {
      throw new Error(
        `--items names ${unknown.length} item(s) this rig does not define: ` +
          `${unknown.map((n) => (Number.isNaN(n) ? 'NaN' : n)).join(', ')}. ` +
          `Known items are ${[...known].sort((a, b) => a - b).join(', ')}. ` +
          'Refusing rather than measuring a smaller set than you asked for.',
      );
    }
  }
  return opts;
}

/** Prints the retry setting this run actually used — NFR-002's "the rig must state the retry
 *  setting it ran under", every run, unconditionally. */
function printRetrySetting() {
  console.log(
    `\nRetries: ${RETRIES} (explicit --retries=${RETRIES} CLI flag on every invocation below — ` +
      `this overrides playwright.config.ts:19's \`process.env['CI'] ? 2 : 0\` regardless of ` +
      `whether CI is set, so a flaky-at-exit-0 result cannot arrive by inheritance).`,
  );
  console.log(`Engine: ${PROJECT} (NFR-007 — every count below is a webkit result, nothing else).`);
  console.log(
    workersSetting === null
      ? 'Workers: inherited from playwright.config.ts (fullyParallel: true; 2 under CI) — ' +
          'repeats of one test may run CONCURRENTLY in separate webkit contexts.'
      : `Workers: ${workersSetting} (explicit --workers=${workersSetting} CLI flag on every ` +
          `invocation below, overriding playwright.config.ts). This is a MEASUREMENT CONTROL: ` +
          `a count taken at workers=1 does NOT describe the ordinary playwright job, which ` +
          `runs at 2.`,
  );
}

function runPlaywright(args, jsonOutputPath) {
  const env = { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: jsonOutputPath };
  const fullArgs = [...args, `--project=${PROJECT}`, `--retries=${RETRIES}`, '--reporter=list,json'];
  if (workersSetting !== null) fullArgs.push(`--workers=${workersSetting}`);
  console.log(`\n$ npx playwright test ${fullArgs.join(' ')}`);
  try {
    execFileSync('npx', ['playwright', 'test', ...fullArgs], { env, stdio: 'inherit' });
    return { failed: false };
  } catch (err) {
    // A non-zero exit from playwright test means at least one selected test failed — expected
    // and correct for a pre-fix baseline run. The JSON report was still written; keep going so
    // the counts get reported rather than losing them to an uncaught throw.
    return { failed: true, error: err };
  }
}

/** Recursively flattens a Playwright JSON reporter suite tree into leaf test results, each
 *  carrying its own source file/line (the `spec` node's own location, shared by every repeat
 *  and project variant of that spec) and per-attempt status. */
function flattenResults(node, file, acc) {
  const nodeFile = node.file ?? file;
  for (const suite of node.suites ?? []) flattenResults(suite, nodeFile, acc);
  for (const spec of node.specs ?? []) {
    for (const test of spec.tests ?? []) {
      for (const result of test.results ?? []) {
        acc.push({
          file: spec.file ?? nodeFile,
          line: spec.line,
          title: spec.title,
          projectName: test.projectName,
          status: result.status,
          retry: result.retry,
        });
      }
    }
  }
}

function loadResults(jsonPath) {
  if (!existsSync(jsonPath)) {
    throw new Error(
      `expected a Playwright JSON report at ${jsonPath} but found none — the run did not ` +
        'produce a report at all, which is a measurement failure, not a zero count.',
    );
  }
  const parsed = JSON.parse(readFileSync(jsonPath, 'utf8'));
  const acc = [];
  flattenResults(parsed, null, acc);
  return acc;
}

/** Groups flattened results by (file, line, title) — line alone is not unique for item 12's
 *  six parameterized modes, which all share one source line but distinct titles. */
function summarize(results, matcher) {
  const matched = results.filter(matcher);
  const byKey = new Map();
  for (const r of matched) {
    const key = `${r.file}:${r.line}:${r.title}`;
    if (!byKey.has(key)) byKey.set(key, { file: r.file, line: r.line, title: r.title, statuses: [] });
    byKey.get(key).statuses.push(r.status);
  }
  return [...byKey.values()].map((entry) => {
    const passed = entry.statuses.filter((s) => s === 'passed').length;
    const failed = entry.statuses.length - passed;
    return { ...entry, total: entry.statuses.length, passed, failed, statuses: entry.statuses };
  });
}

function printReport(itemLabel, subTests) {
  console.log(`\n  Item ${itemLabel}:`);
  if (subTests.length === 0) {
    console.log('    ⚠️  NO MATCHING RESULTS — the item did not run at all (not a zero count).');
    return false;
  }
  let anyFailure = false;
  for (const st of subTests) {
    const marker = st.failed > 0 ? '❌' : '✅';
    if (st.failed > 0) anyFailure = true;
    console.log(
      `    ${marker} ${st.title} — ${st.passed}/${st.total} passed` +
        (st.failed > 0 ? ` (${st.failed} failed: ${st.statuses.filter((s) => s !== 'passed').join(', ')})` : ''),
    );
  }
  return anyFailure;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  workersSetting = opts.workers; // bound BEFORE printRetrySetting() so the banner cannot
                                 // report a scheduling condition the runs did not use.
  const selectedLineItems = LINE_ITEMS.filter((it) => !opts.items || opts.items.has(it.item));
  const includeGrepItem = !opts.items || opts.items.has(GREP_ITEM.item);
  const jsonDir = opts.jsonDir ?? mkdtempSync(join(tmpdir(), 'webkit-repeat-run-'));

  printRetrySetting();
  const resolvedLineItems = resolveLineItems(selectedLineItems);
  console.log(`Repeat-each: ${opts.repeatEach}`);
  console.log(`JSON reports: ${jsonDir}`);

  let overallFailed = false;
  const allResults = [];

  if (selectedLineItems.length > 0) {
    const fileLineArgs = resolvedLineItems.map((it) => `${it.file}:${it.line}`);
    const jsonPath = join(jsonDir, 'line-items.json');
    const { failed } = runPlaywright([...fileLineArgs, `--repeat-each=${opts.repeatEach}`], jsonPath);
    overallFailed = overallFailed || failed;
    allResults.push({ kind: 'line', jsonPath });
  }

  if (includeGrepItem) {
    const jsonPath = join(jsonDir, 'grep-item.json');
    const { failed } = runPlaywright(
      [GREP_ITEM.file, `--repeat-each=${opts.repeatEach}`, '-g', GREP_ITEM.grep],
      jsonPath,
    );
    overallFailed = overallFailed || failed;
    allResults.push({ kind: 'grep', jsonPath });
  }

  console.log('\n══════════════════════════════════════════════════════════════════');
  console.log(`  Per-item report — webkit, retries=${RETRIES}, repeat-each=${opts.repeatEach}`);
  console.log('══════════════════════════════════════════════════════════════════');

  let anyFailureReported = false;
  let anyEmptyReported = false;

  // BUG FIXED HERE (found against a real CI run, not reasoned about): Playwright's JSON
  // reporter reports `spec.file` as the BARE FILENAME (`sk-progress.spec.ts`), never the full
  // relative path this script's own item table uses to select tests on the CLI. The original
  // `r.file.endsWith(it.file)` compared a SHORT string against a LONGER one and could never
  // match — every item printed "NO MATCHING RESULTS" against a run whose own list reporter, in
  // the same log, showed real ✓/✘ per-test lines. Comparing basenames is what the two actually
  // share.
  const lineJsonPath = allResults.find((r) => r.kind === 'line')?.jsonPath;
  const lineResults = lineJsonPath ? loadResults(lineJsonPath) : [];
  for (const it of resolvedLineItems) {
    const wantBase = basename(it.file);
    const subTests = summarize(lineResults, (r) => basename(r.file) === wantBase && r.line === it.line);
    const hadFailure = printReport(`${it.item} (${it.label})`, subTests);
    anyFailureReported = anyFailureReported || hadFailure;
    if (subTests.length === 0) anyEmptyReported = true;
  }

  if (includeGrepItem) {
    const grepJsonPath = allResults.find((r) => r.kind === 'grep')?.jsonPath;
    const results = loadResults(grepJsonPath);
    const wantBase = basename(GREP_ITEM.file);
    const subTests = summarize(results, (r) => basename(r.file) === wantBase);
    const hadFailure = printReport(`${GREP_ITEM.item} (${GREP_ITEM.label})`, subTests);
    anyFailureReported = anyFailureReported || hadFailure;
    if (subTests.length === 0) anyEmptyReported = true;
  }

  console.log('══════════════════════════════════════════════════════════════════');

  if (anyEmptyReported) {
    console.error(
      '\n❌ at least one item produced NO results at all — refusing to treat that as a clean ' +
        'pass. Check the invocation/selector above against the live spec files.',
    );
    process.exitCode = 1;
    return;
  }
  if (anyFailureReported || overallFailed) {
    console.error(
      '\n❌ at least one item failed at least one repeat under retries=0. For a pre-fix ' +
        'baseline run (T003) this is the EXPECTED result for items 1 and 4 — record the counts ' +
        'above as the before-figure, do not treat this exit code as a script defect.',
    );
    process.exitCode = 1;
    return;
  }
  console.log('\n✅ every selected item passed every repeat under webkit, retries=0.');
}

main().catch((err) => {
  console.error(`\n❌ ${err.message}`);
  process.exitCode = 1;
});
