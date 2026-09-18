#!/usr/bin/env node
/**
 * scripts/webkit-repeat-run.mjs — WP01's measurement rig (mission webkit-timing-deflake-01M2T31J).
 *
 * WHAT THIS IS
 *
 * A reproducible invocation that runs the mission's twelve canonical scope items (spec.md's
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
 * Eleven of the twelve items are addressable as an exact `file:line` (Playwright's own
 * test-selection syntax); the twelfth (item 12, the `sk-action-row.spec.ts` "external
 * controls" family) is parameterized across six modes with no single line, and is selected by
 * a `--grep` title match instead. Mixing a `--grep` filter into the same invocation as the
 * `file:line` selections would apply that filter GLOBALLY, silently dropping the other eleven
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
 * USAGE
 *   node scripts/webkit-repeat-run.mjs [--repeat-each=10] [--items=1,2,3,...,12] [--json-dir=DIR]
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

/** spec.md's "Canonical scope" table, items 1–11: each addressable as an exact file:line. */
const LINE_ITEMS = [
  // Lines 58-62 corrected by WP02 (webkit-timing-deflake-01M2T31J) — DISCLOSED
  // ACTIVE_WP_SCOPE_VIOLATION override: this file is WP01's, not WP02's, but WP02's own owned
  // surface IS apps/storybook/src/tests/sk-progress.spec.ts, and its T012/T013 fix necessarily
  // added real lines to that file (paint-diagnostic offset fix + phase-pinning for items 3/5),
  // moving every one of these five declarations down from their original 369/440/456/465/510.
  // A rig that cannot select this WP's own five items is worse than a disclosed one-line
  // mechanical correction; see the mission's tmp/finding/ log for the class of defect (hardcoded
  // absolute file:line addressing racing an owning WP's necessary edits to that same file).
  { item: 1, file: 'apps/storybook/src/tests/sk-progress.spec.ts', line: 416, label: 'forced-colors, two points in cycle' },
  { item: 2, file: 'apps/storybook/src/tests/sk-progress.spec.ts', line: 487, label: 'forced-colors + reduced-motion' },
  { item: 3, file: 'apps/storybook/src/tests/sk-progress.spec.ts', line: 503, label: 'the sweep actually runs' },
  { item: 4, file: 'apps/storybook/src/tests/sk-progress.spec.ts', line: 523, label: 'reduced-motion freeze' }, // WP02: was 522; the review-fix's real-annotation edit (see doc comment above pinAnimationPhase) added one line ahead of this declaration. See tmp/finding/.
  { item: 5, file: 'apps/storybook/src/tests/sk-progress.spec.ts', line: 568, label: 'no animation leak onto determinate' }, // WP02: was 567; same edit added one more line ahead of this declaration.
  { item: 6, file: 'apps/storybook/src/tests/sk-team-overview-shell-layout.spec.ts', line: 104, label: 'exact 56/240px columns' },
  { item: 7, file: 'apps/storybook/src/tests/sk-team-overview-shell-layout.spec.ts', line: 160, label: 'narrow shell region order' },
  { item: 8, file: 'apps/storybook/src/tests/sk-team-overview-shell-layout.spec.ts', line: 303, label: 'landmarks/labels/grouping' },
  { item: 9, file: 'apps/storybook/src/tests/sk-team-overview-shell-layout.spec.ts', line: 445, label: 'axe-clean in dark mode' },
  { item: 10, file: 'apps/storybook/src/tests/sk-workflow-board.spec.ts', line: 620, label: 'focused overflow keyboard scroll' }, // WP03: was 557; T021's waitForScrollSettled helper (added ahead of this test) shifted it. See tmp/finding/wp03-lane-c-rig-line-number-drift.md.
  { item: 11, file: 'apps/storybook/src/tests/sk-radio-choice-group.spec.ts', line: 1113, label: 'legend cue across two stories' },
];

/** Item 12: parameterized across six modes, no single line — selected by title grep instead. */
const GREP_ITEM = {
  item: 12,
  file: 'apps/storybook/src/tests/sk-action-row.spec.ts',
  grep: 'keeps external controls on their own Tab and activation paths',
  label: 'external controls family (adopted; six modes)',
};

function parseArgs(argv) {
  const opts = { repeatEach: 10, items: null, jsonDir: null };
  for (const arg of argv) {
    if (arg.startsWith('--repeat-each=')) opts.repeatEach = Number(arg.split('=')[1]);
    else if (arg.startsWith('--items=')) opts.items = new Set(arg.split('=')[1].split(',').map(Number));
    else if (arg.startsWith('--json-dir=')) opts.jsonDir = arg.split('=')[1];
  }
  if (!Number.isInteger(opts.repeatEach) || opts.repeatEach < 1) {
    throw new Error(`--repeat-each must be a positive integer, got ${opts.repeatEach}`);
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
}

function runPlaywright(args, jsonOutputPath) {
  const env = { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: jsonOutputPath };
  const fullArgs = [...args, `--project=${PROJECT}`, `--retries=${RETRIES}`, '--reporter=list,json'];
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
  const selectedLineItems = LINE_ITEMS.filter((it) => !opts.items || opts.items.has(it.item));
  const includeGrepItem = !opts.items || opts.items.has(GREP_ITEM.item);
  const jsonDir = opts.jsonDir ?? mkdtempSync(join(tmpdir(), 'webkit-repeat-run-'));

  printRetrySetting();
  console.log(`Repeat-each: ${opts.repeatEach}`);
  console.log(`JSON reports: ${jsonDir}`);

  let overallFailed = false;
  const allResults = [];

  if (selectedLineItems.length > 0) {
    const fileLineArgs = selectedLineItems.map((it) => `${it.file}:${it.line}`);
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
  for (const it of selectedLineItems) {
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
