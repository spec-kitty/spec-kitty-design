#!/usr/bin/env node
/**
 * scripts/check-ci-quality-trigger-parity.mjs — M6 (pre-merge squad, PR #429): the contracted
 * NFR-002/SC-003 static check ("the job key set and every job's if:/needs: unchanged except
 * the named exceptions") never shipped as code — it was left as prose plus a diff pasted into
 * the WP report, "explicitly not something a reviewer verifies by eye." This ships it.
 *
 * Compares the live `.github/workflows/ci-quality.yml` against a hardcoded BASELINE captured
 * from the pre-mission tree (commit 907b2bbd, the last commit before REL1/#362 touched this
 * file) plus the two named classes of change REL1 is allowed to have made:
 *
 *   1. Exactly two NEW jobs (`promote-develop`, `develop-ruleset-parity`) — present in the live
 *      file, absent from BASELINE.
 *   2. Five EXISTING jobs (`storybook-build`, `a11y`, `visual-regression`, `playwright`,
 *      `lighthouse`) whose `if:` gains the `promote/*`-into-`develop` skip conjunct (B3) — their
 *      `needs:` is unchanged, and their new `if:` must equal the exact expected value, not
 *      merely differ from the baseline (so a THIRD, uncontrolled edit to one of these five is
 *      still caught).
 *
 * Every other job's `if:`/`needs:` (and the job key set otherwise) must be BYTE-IDENTICAL to
 * the baseline. A hardcoded baseline, not a live `git show <merge-base>` lookup, on purpose —
 * this survives a rebase/squash of REL1's own history without needing to know which commit is
 * "before" at run time, and is exactly what the WP's own DoD item 8 asked to see run and pasted.
 *
 * CLI: node scripts/check-ci-quality-trigger-parity.mjs [--selftest]
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKFLOW = resolve(__dirname, '..', '.github', 'workflows', 'ci-quality.yml');

/** Captured from `git show 907b2bbd:.github/workflows/ci-quality.yml` — the tree immediately
 *  before REL1 (#362) touched this file. `null` means the field was absent. */
export const BASELINE = {
  changes: { if: null, needs: null },
  security: { if: "github.event_name != 'schedule' || github.ref == 'refs/heads/main'", needs: null },
  'workflow-pin-check': { if: null, needs: null },
  'lint-code': { if: null, needs: null },
  'storybook-build': {
    if: "needs.changes.outputs.tokens == 'true' || needs.changes.outputs.components == 'true'",
    needs: ['changes'],
  },
  a11y: { if: "needs.storybook-build.result == 'success'", needs: ['storybook-build'] },
  'visual-regression': { if: "needs.storybook-build.result == 'success'", needs: ['storybook-build'] },
  playwright: { if: "needs.storybook-build.result == 'success'", needs: ['storybook-build'] },
  test: { if: null, needs: null },
  lighthouse: { if: "needs.storybook-build.result == 'success'", needs: ['storybook-build'] },
  'release-gate': { if: null, needs: null },
  gate: {
    if: 'always()',
    needs: [
      'changes', 'security', 'workflow-pin-check', 'lint-code', 'storybook-build',
      'a11y', 'visual-regression', 'playwright', 'test', 'release-gate',
    ],
  },
  'lint-feedback': {
    if:
      "always() && github.event_name == 'pull_request' && " +
      'github.event.pull_request.head.repo.full_name == github.repository && ' +
      "(needs.lint-code.outputs.eslint_failures == 'true' || needs.lint-code.outputs.stylelint_failures == 'true')",
    needs: 'lint-code',
  },
};

/** The five jobs allowed to gain the `promote/*`-into-`develop` skip conjunct (B3), and the
 *  EXACT expected new `if:` for each — not merely "different from baseline". */
export const EXPECTED_CHANGED_IF = {
  'storybook-build':
    "(needs.changes.outputs.tokens == 'true' || needs.changes.outputs.components == 'true') && " +
    "!(startsWith(github.head_ref, 'promote/') && github.base_ref == 'develop')",
  a11y: "needs.storybook-build.result == 'success' && !(startsWith(github.head_ref, 'promote/') && github.base_ref == 'develop')",
  'visual-regression': "needs.storybook-build.result == 'success' && !(startsWith(github.head_ref, 'promote/') && github.base_ref == 'develop')",
  playwright: "needs.storybook-build.result == 'success' && !(startsWith(github.head_ref, 'promote/') && github.base_ref == 'develop')",
  lighthouse: "needs.storybook-build.result == 'success' && !(startsWith(github.head_ref, 'promote/') && github.base_ref == 'develop')",
};

export const EXPECTED_NEW_JOBS = new Set(['promote-develop', 'develop-ruleset-parity']);

function needsEqual(a, b) {
  const na = a == null ? null : Array.isArray(a) ? a : [a];
  const nb = b == null ? null : Array.isArray(b) ? b : [b];
  if (na === null || nb === null) return na === nb;
  return na.length === nb.length && na.every((v, i) => v === nb[i]);
}

/** Pure. Compares a parsed workflow's `jobs` map against BASELINE + the named exceptions.
 *  Returns an array of problem strings ([] means parity holds). */
export function checkTriggerParity(jobs) {
  const problems = [];
  const liveKeys = new Set(Object.keys(jobs ?? {}));

  for (const [name, expected] of Object.entries(BASELINE)) {
    if (!liveKeys.has(name)) {
      problems.push(`baseline job \`${name}\` is missing from the live workflow`);
      continue;
    }
    const live = jobs[name];
    const expectedIf = name in EXPECTED_CHANGED_IF ? EXPECTED_CHANGED_IF[name] : expected.if;
    const liveIf = live.if ?? null;
    if (liveIf !== expectedIf) {
      problems.push(
        `job \`${name}\`'s \`if:\` is ${JSON.stringify(liveIf)}, expected ${JSON.stringify(expectedIf)} ` +
          (name in EXPECTED_CHANGED_IF ? '(the one REL1-allowed change)' : '(unchanged from baseline)'),
      );
    }
    if (!needsEqual(live.needs ?? null, expected.needs)) {
      problems.push(`job \`${name}\`'s \`needs:\` is ${JSON.stringify(live.needs ?? null)}, expected ${JSON.stringify(expected.needs)} (unchanged from baseline)`);
    }
  }

  const baselineKeys = new Set(Object.keys(BASELINE));
  for (const name of liveKeys) {
    if (baselineKeys.has(name)) continue;
    if (!EXPECTED_NEW_JOBS.has(name)) {
      problems.push(`\`${name}\` is a new job not in the two REL1-expected new jobs (${[...EXPECTED_NEW_JOBS].join(', ')})`);
    }
  }
  for (const name of EXPECTED_NEW_JOBS) {
    if (!liveKeys.has(name)) problems.push(`expected new job \`${name}\` is missing`);
  }

  return problems;
}

function inspect() {
  const wf = parse(readFileSync(WORKFLOW, 'utf8'));
  return checkTriggerParity(wf.jobs ?? {});
}

// ── --selftest: floor-outside-table shape ────────────────────────────────────────────────

function cloneJobsFromLiveFile() {
  const wf = parse(readFileSync(WORKFLOW, 'utf8'));
  return structuredClone(wf.jobs);
}

function runProbes() {
  const results = [];
  const record = (n, name, expect, succeeded, detail) => {
    const ok = expect === 'pass' ? succeeded === true : succeeded === false;
    results.push({ n, name, expect, ok, detail });
  };

  // Probe 1 — the REAL, current live file matches (same fixture -> []).
  {
    const problems = inspect();
    record(1, 'the live ci-quality.yml matches BASELINE + the two named exception classes', 'pass', problems.length === 0, problems);
  }

  // Probe 2 — an extra, unexpected new job is caught.
  {
    const jobs = cloneJobsFromLiveFile();
    jobs['some-new-job'] = { 'runs-on': 'ubuntu-latest', steps: [] };
    const problems = checkTriggerParity(jobs);
    record(2, 'an unexpected new job is caught', 'fail', !problems.some((p) => p.includes('some-new-job')));
  }

  // Probe 3 — a baseline job's `needs:` silently regressed is caught.
  {
    const jobs = cloneJobsFromLiveFile();
    jobs.gate.needs = jobs.gate.needs.filter((n) => n !== 'test');
    const problems = checkTriggerParity(jobs);
    record(3, "gate's needs: silently dropping `test` is caught", 'fail', !problems.some((p) => p.includes('`gate`') && p.includes('needs')));
  }

  // Probe 4 — one of the five allowed-to-change jobs reverted to its OLD `if:` (the conjunct
  // silently removed) is caught — this is the exact NFR-002 regression class this check exists
  // for.
  {
    const jobs = cloneJobsFromLiveFile();
    jobs.a11y.if = BASELINE.a11y.if;
    const problems = checkTriggerParity(jobs);
    record(4, "a11y's if: silently reverting to the pre-REL1 value is caught", 'fail', !problems.some((p) => p.includes('`a11y`')));
  }

  // Probe 5 — a baseline job's `if:` changed to something OTHER than the one expected new
  // value is caught (not merely "differs from baseline" — the exact expected value is asserted).
  {
    const jobs = cloneJobsFromLiveFile();
    jobs.playwright.if = "needs.storybook-build.result == 'success' && true";
    const problems = checkTriggerParity(jobs);
    record(5, "playwright's if: changed to a THIRD, uncontrolled value is caught", 'fail', !problems.some((p) => p.includes('`playwright`')));
  }

  return results;
}

const PROBE_FLOOR = 5;

function selftest() {
  const results = runProbes();
  if (results.length < PROBE_FLOOR) {
    console.error(`❌ the probe table has shrunk: ${results.length} against a floor of ${PROBE_FLOOR}.`);
    process.exitCode = 1;
    return;
  }
  const expectedPass = results.filter((r) => r.expect === 'pass');
  const expectedFail = results.filter((r) => r.expect === 'fail');
  if (expectedPass.length === 0 || expectedFail.length === 0) {
    console.error(`Refusing to report green over a degenerate probe set: ${expectedPass.length} expect-pass, ${expectedFail.length} expect-fail.`);
    process.exitCode = 1;
    return;
  }
  const matched = results.filter((r) => r.ok);
  for (const r of results) console.log(`${r.ok ? '✅' : '❌'} probe ${r.n} (expect: ${r.expect}): ${r.name}`);
  if (matched.length !== results.length) {
    console.error(`\n❌ ${results.length - matched.length} of ${results.length} probes did not match:`);
    for (const r of results) if (!r.ok) console.error(`   probe ${r.n}: ${JSON.stringify(r.detail)}`);
    process.exitCode = 1;
    return;
  }
  console.log(`\n✅ ${results.length}/${results.length} probes matched (${expectedPass.length} expect-pass, ${expectedFail.length} expect-fail).`);
}

function main() {
  if (process.argv.includes('--selftest')) {
    selftest();
    return;
  }
  const problems = inspect();
  if (problems.length) {
    console.error('❌ ci-quality.yml has drifted from NFR-002/SC-003 trigger parity:');
    for (const p of problems) console.error(`   ${p}`);
    process.exitCode = 1;
    return;
  }
  console.log('✅ ci-quality.yml: job key set and every job\'s if:/needs: match baseline except the two named REL1 exception classes (NFR-002/SC-003).');
}

main();
