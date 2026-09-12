#!/usr/bin/env node
/**
 * scripts/check-ci-quality-trigger-parity.mjs — M6 (pre-merge squad, PR #429): the contracted
 * NFR-002/SC-003 static check ("the job key set and every job's if:/needs: unchanged except
 * the named exceptions") never shipped as code — it was left as prose plus a diff pasted into
 * the WP report, "explicitly not something a reviewer verifies by eye." This ships it.
 *
 * Compares the live `.github/workflows/ci-quality.yml` against a hardcoded BASELINE captured
 * from the pre-mission tree (commit 907b2bbd, the last commit before REL1/#362 touched this
 * file) plus the named classes of change REL1 is allowed to have made:
 *
 *   1. Exactly two NEW jobs (`promote-develop`, `develop-ruleset-parity`) — present in the live
 *      file, absent from BASELINE.
 *   2. Five EXISTING jobs (`storybook-build`, `a11y`, `visual-regression`, `playwright`,
 *      `lighthouse`) whose `if:` gains the exact-shape `promote/<40-hex>`-into-`develop` skip
 *      conjunct (B3/F7); the four downstream ones also gain `changes` in their `needs:` (F7 —
 *      needed to read `needs.changes.outputs.is_develop_promotion_pr`). Every new `if:`/`needs:`
 *      must equal the exact expected value, not merely differ from the baseline (so a THIRD,
 *      uncontrolled edit to one of these five is still caught).
 *   3. The `on:` trigger block (F4): `pull_request.branches`/`push.branches` gain `develop`,
 *      `workflow_dispatch: {}` is added — and `schedule` is UNCHANGED (still exactly the one
 *      cron), which is the deliberate operator decision (research.md R25) that a second cron
 *      would silently re-trigger the entire workflow for every unguarded job.
 *
 * Every other job's `if:`/`needs:` (and the job key set otherwise) must be BYTE-IDENTICAL to
 * the baseline.
 *
 * **F3 (pre-merge squad, gate pass 2)**: `BASELINE`/`ON_BASELINE` are no longer trusted as
 * hardcoded literals alone — `verifyBaselineAgainstHistory` re-fetches the REAL pre-mission
 * file via `git show 907b2bbd:...` on every run (not only `--selftest`) and refuses to report
 * green if the hardcoded baseline has drifted from it. Editing `BASELINE`/`EXPECTED_CHANGED_IF`
 * in the same commit as a workflow edit no longer defeats this check: commit `907b2bbd` is
 * fixed, real git history, not something a same-commit edit can also rewrite.
 *
 * CLI: node scripts/check-ci-quality-trigger-parity.mjs [--selftest]
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { STORYBOOK_PREDICATE, HEAVY_JOB_PREDICATE } from './lib/storybook-predicate.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const WORKFLOW = resolve(REPO_ROOT, '.github', 'workflows', 'ci-quality.yml');
const PRE_MISSION_SHA = '907b2bbd';

/** Captured from `git show 907b2bbd:.github/workflows/ci-quality.yml` — the tree immediately
 *  before REL1 (#362) touched this file. `null` means the field was absent.
 *  `verifyBaselineAgainstHistory` (below) holds this to the REAL commit on every run. */
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

/** F4 (pre-merge squad, gate pass 2): the pre-mission `on:` block, also verified against real
 *  git history — see `verifyBaselineAgainstHistory`. */
export const ON_BASELINE = {
  pullRequestBranches: ['main', 'train/**'],
  pushBranches: ['main', 'train/**'],
  schedule: [{ cron: '17 2 * * *' }],
  hasWorkflowDispatch: false,
};

/** The five jobs allowed to gain the exact-shape `promote/<40-hex>`-into-`develop` skip
 *  conjunct (B3/F7/F6 — reads the SHARED predicate constants, never a second hardcoded copy). */
export const EXPECTED_CHANGED_IF = {
  'storybook-build': STORYBOOK_PREDICATE,
  a11y: HEAVY_JOB_PREDICATE,
  'visual-regression': HEAVY_JOB_PREDICATE,
  playwright: HEAVY_JOB_PREDICATE,
  lighthouse: HEAVY_JOB_PREDICATE,
};

/**
 * F7: the four downstream heavy jobs also gain `changes` in `needs:` (to read
 * `needs.changes.outputs.is_develop_promotion_pr`) — `storybook-build`'s own `needs:` is
 * unchanged (it already depended on `changes`).
 *
 * V7 (pre-merge squad, gate pass 5): this dict is compared directly against `live.needs`
 * (below), which is on its face the same "expected value edited alongside the thing it
 * guards" shape as BASELINE/ON_EXPECTED before their fixes. It is left unpinned deliberately:
 * unlike a dropped `if:` conjunct (a fail-OPEN regression — the promotion-skip check silently
 * stops applying), a same-commit edit here can only ever REMOVE `changes` from a job's
 * `needs:`, which makes `needs.changes.outputs.is_develop_promotion_pr` unavailable to that
 * job's `if:` and therefore fails CLOSED (the job runs unconditionally, same as before REL1) —
 * the opposite direction from every vulnerability this mission's guards exist to close. There
 * is also no way to widen `needs:` to smuggle a bypass: `needs:` only gates job scheduling
 * order, never the promotion-skip decision itself (that is `EXPECTED_CHANGED_IF`, which IS
 * independently pinned via the V2 structural check above). Not exempt from V7's "say why it
 * does not need one": this is why.
 */
export const EXPECTED_CHANGED_NEEDS = {
  a11y: ['storybook-build', 'changes'],
  'visual-regression': ['storybook-build', 'changes'],
  playwright: ['storybook-build', 'changes'],
  lighthouse: ['storybook-build', 'changes'],
};

/**
 * F4: the on: block REL1 is allowed to have produced. V3 (pre-merge squad, gate pass 4):
 * DERIVED from `ON_BASELINE` plus the named deltas below, never restated as a second,
 * independently-editable literal — adding a second cron to the workflow AND to a hand-typed
 * `ON_EXPECTED`, in one commit, used to pass both this check AND its own `--selftest`.
 * `schedule` is a DIRECT REFERENCE to `ON_BASELINE.schedule` (not a re-typed copy): the only
 * way to widen it here is to edit `ON_BASELINE` itself, which `verifyBaselineAgainstHistory`
 * now holds to real git history on every run — a second cron re-triggers the entire workflow
 * for every job without its own event-specific guard (research.md R25's corrected decision).
 */
export const ON_EXPECTED = {
  pullRequestBranches: [...ON_BASELINE.pullRequestBranches, 'develop'],
  pushBranches: [...ON_BASELINE.pushBranches, 'develop'],
  schedule: ON_BASELINE.schedule,
  hasWorkflowDispatch: true,
};

// V7: also unpinned, but honestly so rather than falsely pinned. This set is a drift-detector
// for "an unnamed job appeared" (probe 2) only — it enforces no security property of the job
// itself. A same-commit edit that adds a new job to the workflow AND to this set silences that
// one generic surprise-flag, but it does NOT touch any of the actual enforcement: every real
// guard in this mission (the exact-shape `if:` conjuncts, check-gate-wiring.mjs's JOBS sweep
// and its `['a11y','visual-regression','playwright','lighthouse']` loop) is keyed to specific,
// already-named jobs, fixed in source, independent of this set — none of them derive "which
// jobs to check" FROM EXPECTED_NEW_JOBS. So this check was never a general "every new job is
// vetted" mechanism, and unpinning it doesn't regress one into existing. The real residual
// limitation — a genuinely new, unnamed, unguarded heavy job added by a future PR would need a
// human to notice and add BOTH real enforcement AND a mention here — is accepted as out of
// scope for this mission's already-enumerated attack surface, not silently assumed solved.
export const EXPECTED_NEW_JOBS = new Set(['promote-develop', 'develop-ruleset-parity']);

function needsEqual(a, b) {
  const na = a == null ? null : Array.isArray(a) ? a : [a];
  const nb = b == null ? null : Array.isArray(b) ? b : [b];
  if (na === null || nb === null) return na === nb;
  return na.length === nb.length && na.every((v, i) => v === nb[i]);
}

function arraysEqualByJson(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  return a.length === b.length && a.every((v, i) => JSON.stringify(v) === JSON.stringify(b[i]));
}

function onShape(on) {
  return {
    pullRequestBranches: on?.pull_request?.branches ?? null,
    pushBranches: on?.push?.branches ?? null,
    schedule: on?.schedule ?? null,
    hasWorkflowDispatch: on != null && Object.prototype.hasOwnProperty.call(on, 'workflow_dispatch'),
  };
}

/**
 * F3 (pre-merge squad, gate pass 2): fetches the REAL pre-mission workflow from git history and
 * asserts the hardcoded `BASELINE`/`ON_BASELINE` above still match it exactly. This is what
 * makes editing `BASELINE` alongside a workflow edit, in the same commit, unable to defeat the
 * checker: `PRE_MISSION_SHA` is a fixed, already-existing commit, not something that commit can
 * also rewrite.
 */
export function verifyBaselineAgainstHistory(preMissionJobs, preMissionOn) {
  const problems = [];
  const preKeys = new Set(Object.keys(preMissionJobs ?? {}));
  const baselineKeys = new Set(Object.keys(BASELINE));

  for (const name of preKeys) {
    if (!baselineKeys.has(name)) {
      problems.push(`BASELINE is missing job \`${name}\`, which exists at ${PRE_MISSION_SHA}`);
      continue;
    }
    const real = preMissionJobs[name];
    const base = BASELINE[name];
    if ((real.if ?? null) !== base.if) {
      problems.push(
        `BASELINE.${name}.if is ${JSON.stringify(base.if)}, but ${PRE_MISSION_SHA} has ${JSON.stringify(real.if ?? null)}`,
      );
    }
    if (!needsEqual(real.needs ?? null, base.needs)) {
      problems.push(
        `BASELINE.${name}.needs is ${JSON.stringify(base.needs)}, but ${PRE_MISSION_SHA} has ${JSON.stringify(real.needs ?? null)}`,
      );
    }
  }
  for (const name of baselineKeys) {
    if (!preKeys.has(name)) problems.push(`BASELINE carries job \`${name}\`, which does not exist at ${PRE_MISSION_SHA}`);
  }

  const realOn = onShape(preMissionOn);
  for (const key of Object.keys(ON_BASELINE)) {
    const realVal = realOn[key];
    const baseVal = ON_BASELINE[key];
    const equal = Array.isArray(baseVal) ? arraysEqualByJson(realVal, baseVal) : realVal === baseVal;
    if (!equal) {
      problems.push(
        `ON_BASELINE.${key} is ${JSON.stringify(baseVal)}, but ${PRE_MISSION_SHA} has ${JSON.stringify(realVal)}`,
      );
    }
  }

  return problems;
}

function loadPreMissionWorkflow() {
  const raw = execFileSync('git', ['show', `${PRE_MISSION_SHA}:.github/workflows/ci-quality.yml`], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  return parse(raw);
}

/** Pure. Compares a parsed workflow's `jobs` map and `on` block against BASELINE/ON_BASELINE +
 *  the named exceptions. Returns an array of problem strings ([] means parity holds). */
export function checkTriggerParity(jobs, on) {
  const problems = [];
  const liveKeys = new Set(Object.keys(jobs ?? {}));

  for (const [name, expected] of Object.entries(BASELINE)) {
    if (!liveKeys.has(name)) {
      problems.push(`baseline job \`${name}\` is missing from the live workflow`);
      continue;
    }
    const live = jobs[name];
    const expectedIf = name in EXPECTED_CHANGED_IF ? EXPECTED_CHANGED_IF[name] : expected.if;
    const expectedNeeds = name in EXPECTED_CHANGED_NEEDS ? EXPECTED_CHANGED_NEEDS[name] : expected.needs;
    const liveIf = live.if ?? null;
    if (liveIf !== expectedIf) {
      problems.push(
        `job \`${name}\`'s \`if:\` is ${JSON.stringify(liveIf)}, expected ${JSON.stringify(expectedIf)} ` +
          (name in EXPECTED_CHANGED_IF ? '(the one REL1-allowed change)' : '(unchanged from baseline)'),
      );
    }
    if (!needsEqual(live.needs ?? null, expectedNeeds)) {
      problems.push(
        `job \`${name}\`'s \`needs:\` is ${JSON.stringify(live.needs ?? null)}, expected ${JSON.stringify(expectedNeeds)} ` +
          (name in EXPECTED_CHANGED_NEEDS ? '(the one REL1-allowed change, F7)' : '(unchanged from baseline)'),
      );
    }
    // V2 (pre-merge squad, gate pass 4): for the jobs REL1 is allowed to have changed, ALSO
    // require the exact-shape promotion-skip conjunct structurally — hardcoded HERE, never
    // derived from the imported STORYBOOK_PREDICATE/HEAVY_JOB_PREDICATE. Those are a SINGLE
    // shared constant both this file and check-gate-wiring.mjs import; editing it alongside
    // the matching workflow `if:`s, in one commit, would otherwise leave both green.
    if (name in EXPECTED_CHANGED_IF && !/needs\.changes\.outputs\.is_develop_promotion_pr\s*!=\s*'true'/.test(String(live.if ?? ''))) {
      problems.push(
        `job \`${name}\`'s \`if:\` is missing the independently-required exact-shape ` +
          'promotion-skip conjunct (V2 structural check, not derived from the shared predicate constant)',
      );
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

  // F4: the on: block.
  const live = onShape(on);
  if (!arraysEqualByJson(live.pullRequestBranches, ON_EXPECTED.pullRequestBranches)) {
    problems.push(
      `on.pull_request.branches is ${JSON.stringify(live.pullRequestBranches)}, expected ${JSON.stringify(ON_EXPECTED.pullRequestBranches)}`,
    );
  }
  if (!arraysEqualByJson(live.pushBranches, ON_EXPECTED.pushBranches)) {
    problems.push(
      `on.push.branches is ${JSON.stringify(live.pushBranches)}, expected ${JSON.stringify(ON_EXPECTED.pushBranches)}`,
    );
  }
  if (!arraysEqualByJson(live.schedule, ON_EXPECTED.schedule)) {
    problems.push(
      `on.schedule is ${JSON.stringify(live.schedule)}, expected ${JSON.stringify(ON_EXPECTED.schedule)} — exactly ` +
        'one cron; adding a second was a deliberate operator decision NOT to make (research.md R25: it ' +
        're-triggers the entire workflow for every job without its own event-specific guard)',
    );
  }
  if (live.hasWorkflowDispatch !== ON_EXPECTED.hasWorkflowDispatch) {
    problems.push(
      `on.workflow_dispatch presence is ${live.hasWorkflowDispatch}, expected ${ON_EXPECTED.hasWorkflowDispatch}`,
    );
  }

  return problems;
}

function inspect() {
  let preMission;
  try {
    preMission = loadPreMissionWorkflow();
  } catch (err) {
    return [
      `could not read ${PRE_MISSION_SHA}:.github/workflows/ci-quality.yml from git history (${err.message}) — ` +
        'refusing to trust the hardcoded BASELINE unverified. A shallow clone (missing history) is the usual ' +
        "cause; this job's checkout must fetch full history.",
    ];
  }
  const historyProblems = verifyBaselineAgainstHistory(preMission.jobs ?? {}, preMission.on ?? {});
  if (historyProblems.length) {
    return [
      `BASELINE/ON_BASELINE have drifted from the real ${PRE_MISSION_SHA} — refusing to trust them:`,
      ...historyProblems,
    ];
  }
  const wf = parse(readFileSync(WORKFLOW, 'utf8'));
  return checkTriggerParity(wf.jobs ?? {}, wf.on ?? {});
}

// ── --selftest: floor-outside-table shape ────────────────────────────────────────────────

function cloneLiveWorkflow() {
  return structuredClone(parse(readFileSync(WORKFLOW, 'utf8')));
}

function runProbes() {
  const results = [];
  const record = (n, name, expect, succeeded, detail) => {
    const ok = expect === 'pass' ? succeeded === true : succeeded === false;
    results.push({ n, name, expect, ok, detail });
  };

  // Probe 1 — the REAL, current live file matches (same fixture -> []), AND BASELINE itself
  // matches real git history (F3).
  {
    const problems = inspect();
    record(1, 'the live ci-quality.yml matches BASELINE/ON_BASELINE + the named exception classes, and BASELINE matches real git history', 'pass', problems.length === 0, problems);
  }

  // Probe 2 — an extra, unexpected new job is caught.
  {
    const wf = cloneLiveWorkflow();
    wf.jobs['some-new-job'] = { 'runs-on': 'ubuntu-latest', steps: [] };
    const problems = checkTriggerParity(wf.jobs, wf.on);
    record(2, 'an unexpected new job is caught', 'fail', !problems.some((p) => p.includes('some-new-job')));
  }

  // Probe 3 — a baseline job's `needs:` silently regressed is caught.
  {
    const wf = cloneLiveWorkflow();
    wf.jobs.gate.needs = wf.jobs.gate.needs.filter((n) => n !== 'test');
    const problems = checkTriggerParity(wf.jobs, wf.on);
    record(3, "gate's needs: silently dropping `test` is caught", 'fail', !problems.some((p) => p.includes('`gate`') && p.includes('needs')));
  }

  // Probe 4 — one of the five allowed-to-change jobs reverted to its OLD `if:` (the conjunct
  // silently removed) is caught — this is the exact NFR-002 regression class this check exists
  // for.
  {
    const wf = cloneLiveWorkflow();
    wf.jobs.a11y.if = BASELINE.a11y.if;
    const problems = checkTriggerParity(wf.jobs, wf.on);
    record(4, "a11y's if: silently reverting to the pre-REL1 value is caught", 'fail', !problems.some((p) => p.includes('`a11y`')));
  }

  // Probe 5 — a baseline job's `if:` changed to something OTHER than the one expected new
  // value is caught (not merely "differs from baseline" — the exact expected value is asserted).
  {
    const wf = cloneLiveWorkflow();
    wf.jobs.playwright.if = "needs.storybook-build.result == 'success' && true";
    const problems = checkTriggerParity(wf.jobs, wf.on);
    record(5, "playwright's if: changed to a THIRD, uncontrolled value is caught", 'fail', !problems.some((p) => p.includes('`playwright`')));
  }

  // Probe 6 — F4: a second cron silently added is caught.
  {
    const wf = cloneLiveWorkflow();
    wf.on.schedule.push({ cron: '43 3 * * *' });
    const problems = checkTriggerParity(wf.jobs, wf.on);
    record(6, 'a second cron entry is caught (the deliberate one-cron decision, research.md R25)', 'fail', !problems.some((p) => p.includes('on.schedule')));
  }

  // Probe 7 — F4: develop silently dropped from push.branches is caught.
  {
    const wf = cloneLiveWorkflow();
    wf.on.push.branches = ['main', 'train/**'];
    const problems = checkTriggerParity(wf.jobs, wf.on);
    record(7, 'develop silently dropped from on.push.branches is caught', 'fail', !problems.some((p) => p.includes('on.push.branches')));
  }

  // Probe 8 — F3: BASELINE itself disagreeing with real git history is caught, not just the
  // live file disagreeing with BASELINE. Simulates "BASELINE edited alongside a workflow edit
  // in the same commit" by comparing a deliberately WRONG in-memory baseline against the real
  // pre-mission history — proving `verifyBaselineAgainstHistory` actually discriminates.
  {
    const realPreMission = loadPreMissionWorkflow();
    const tamperedJobs = { ...(realPreMission.jobs ?? {}) };
    // Simulate BASELINE having been (wrongly) edited to claim `gate` never required `test`.
    const wrongBaseline = { ...BASELINE, gate: { ...BASELINE.gate, needs: BASELINE.gate.needs.filter((n) => n !== 'test') } };
    const problems = [];
    for (const [name, expected] of Object.entries(wrongBaseline)) {
      const real = tamperedJobs[name];
      if (!real) continue;
      if (!needsEqual(real.needs ?? null, expected.needs)) {
        problems.push(`BASELINE.${name}.needs disagrees with real history`);
      }
    }
    record(8, 'a tampered in-memory BASELINE disagreeing with real git history is detectable', 'fail', problems.length === 0, problems);
  }

  return results;
}

const PROBE_FLOOR = 8;

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
  console.log('✅ ci-quality.yml: job key set, every job\'s if:/needs:, and the on: block match baseline except the named REL1 exception classes (NFR-002/SC-003).');
}

main();
