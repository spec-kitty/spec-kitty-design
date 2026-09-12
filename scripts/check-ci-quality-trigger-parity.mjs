#!/usr/bin/env node
/**
 * scripts/check-ci-quality-trigger-parity.mjs — M6 (pre-merge squad, PR #429): the contracted
 * NFR-002/SC-003 static check ("the job key set and every job's if:/needs: unchanged except
 * the named exceptions") never shipped as code — it was left as prose plus a diff pasted into
 * the WP report, "explicitly not something a reviewer verifies by eye." This ships it.
 *
 * Compares the live `.github/workflows/ci-quality.yml` against a hardcoded BASELINE captured
 * from the pre-mission tree (see PRE_MISSION_SHA/PRE_MISSION_TAG below — an ancestor commit on
 * train/elements-first whose workflow file predates REL1/#362's changes) plus the named classes
 * of change REL1 is allowed to have made:
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
 * the baseline. NOTE this pins parsed `if:`/`needs:`/`on:` SHAPE, not the workflow file's raw
 * bytes — a whitespace-only, comment-only, or other-job-body edit is invisible to it by design.
 *
 * **F3 (pre-merge squad, gate pass 2)**: `BASELINE`/`ON_BASELINE` are not trusted as hardcoded
 * literals alone — `verifyBaselineAgainstHistory` re-fetches the REAL pre-mission file via
 * `git show ${PRE_MISSION_SHA}:...` on every run (not only `--selftest`) and refuses to report
 * green if the hardcoded baseline has drifted from it. This closes editing `BASELINE` to match a
 * FABRICATED history. It does NOT, by itself, close a same-commit edit that moves
 * `PRE_MISSION_SHA` to a DIFFERENT, genuinely real, older commit on the train and regenerates
 * `BASELINE`/`ON_BASELINE`/`EXPECTED_NEW_JOBS` to match THAT commit instead — the history check
 * only proves internal consistency between whatever SHA is named and the hardcoded constants,
 * never that the named SHA is the RIGHT one. A pre-merge review of an earlier version of this
 * fix demonstrated exactly that: a one-commit move to an older ancestor plus a dropped `needs:`
 * entry passed the plain check and was only caught by `--selftest` probes 3 and 8 — not a
 * property a PR reviewer should have to re-derive by eye. F2 below is what actually closes it.
 *
 * **F2: the anchor SHA is resolved through a git tag, not trusted as a literal alone.**
 * `PRE_MISSION_TAG` (`refs/tags/parity-anchor/rel1`) is fetched and peeled at run time by
 * `resolveAnchorTagSha`; `resolveAndInspect` requires the result to equal the hardcoded
 * `PRE_MISSION_SHA` (an identity check, not a second independent source of truth) AND to be an
 * ancestor of `HEAD`, before running `inspect()` against it at all. Moving the anchor now
 * requires moving a git tag on the remote — a distinct, auditable ref update outside the PR's
 * own commit — not just re-typing a string in this file: a same-commit edit to
 * `PRE_MISSION_SHA` alone is caught immediately (the resolved tag stops matching it), and a
 * same-commit edit to `BASELINE` alone is still caught by `verifyBaselineAgainstHistory` as
 * before. What this does NOT independently defend against: someone with push access moving
 * `parity-anchor/rel1` itself, in a separate operation, to a commit whose content they also
 * crafted — the residual defeat every purely in-repo pin accepts, since a git tag with no push
 * protection is not a signature. The is-ancestor-of-`HEAD` check narrows a moved tag to "a real
 * commit already in this repo's own history," which is not full closure, only a smaller target.
 *
 * **INCIDENT (the original defect this fix corrects)**: the anchor was originally the literal
 * `907b2bbd`, a commit that only ever existed on the mission branch
 * `mission/release-pipeline-develop-line`. REL1's own squash merge (train commit `b38b40e7`,
 * closing #362) deleted that branch — a team convention observed on this repo, not a GitHub
 * setting (`delete_branch_on_merge` is `false` here) — which made `907b2bbd` unreachable from
 * every remaining ref: `git branch -r --contains 907b2bbd` is empty and `git merge-base
 * --is-ancestor 907b2bbd origin/train/elements-first` fails. A fresh clone (what CI always uses)
 * can no longer read it at all, so the F3 check failed CLOSED on every PR — correct given the
 * missing object, but self-inflicted. It looked fine on any checkout that still had a LOCAL
 * branch reaching that commit (a same-host `git clone` additionally hardlinks the whole object
 * store regardless of reachability, compounding the effect) — which is exactly why this passed
 * here and failed everywhere else.
 *
 * The fix re-anchors on `9a9e284a6af97053e38c1fbd033c523423ed0779` (tag `parity-anchor/rel1`) —
 * `b38b40e7`'s own first parent on `train/elements-first`, train's own tip in the instant before
 * REL1's squash-merge commit landed. This is NOT "the last commit that touched this file before
 * REL1" — that was 12 commits earlier, at `907b2bbd` — but nothing in between touched this path,
 * so anchoring one commit later than strictly necessary lost no content. Its
 * `.github/workflows/ci-quality.yml` is blob `bab466a606c4f3a7451e5e9e7aed9a849bfa4be6` — run
 * `git rev-parse ${PRE_MISSION_SHA}:.github/workflows/ci-quality.yml` to reproduce — identical to
 * the blob at `907b2bbd` and at every commit between the two. Being an ancestor of
 * `train/elements-first`'s own history, this commit cannot be deleted the way a mission branch's
 * tip can; only a force-rewrite of the train's protected history, or the tag itself moving (see
 * F2), removes it — either fails LOUDLY (never silently green): see `inspect()`'s catch branch
 * and Probe 9 below, which calls `inspect()` directly with an unreadable SHA and asserts it
 * returns a non-empty, anchor-naming problem list, not merely that `git show` itself throws.
 *
 * **REBASELINING**: the anchor above never moves for an ordinary mission. A mission that changes
 * `ci-quality.yml` extends `EXPECTED_CHANGED_IF`/`EXPECTED_CHANGED_NEEDS`/`EXPECTED_NEW_JOBS` (or
 * `ON_EXPECTED`) to describe its own allowed delta and leaves `BASELINE`/`ON_BASELINE`/
 * `PRE_MISSION_SHA`/`PRE_MISSION_TAG` untouched — those describe the PRIOR state, not the
 * mission in flight. The anchor should legitimately move only on a deliberate operator decision
 * to fold the current state in as the new baseline (e.g. once several missions' allowed-delta
 * exceptions have accumulated); that always means, in one commit: move `parity-anchor/rel1` to
 * the new commit, update `PRE_MISSION_SHA` to match, and fully re-capture `BASELINE`/
 * `ON_BASELINE` from it — then re-run `--selftest`. `ci-quality.yml` has picked up 35 commits
 * since it was created; someone will eventually need this paragraph.
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

// F2: the anchor is resolved through this git tag at run time (`resolveAnchorTagSha`), never
// trusted as a hardcoded literal alone — a same-commit edit inside this repo cannot move what
// the tag resolves to; only a separate ref update on the remote can. `PRE_MISSION_SHA` below is
// the expected result of that resolution (an identity check, not a second source of truth).
const PRE_MISSION_TAG = 'parity-anchor/rel1';

// `b38b40e7^` on train/elements-first — train's own tip immediately before REL1 (#362, commit
// b38b40e7) touched this file. An ANCESTOR of train/elements-first, so it cannot disappear the
// way the deleted mission branch that carried the original anchor (`907b2bbd`) did. See the
// file-header INCIDENT/F2/REBASELINING notes for the full history and the identity/ancestor
// checks (`resolveAndInspect`) that hold this to real, current git state on every run.
const PRE_MISSION_SHA = '9a9e284a6af97053e38c1fbd033c523423ed0779';

/** Captured from `git show ${PRE_MISSION_SHA}:.github/workflows/ci-quality.yml` — the tree
 *  immediately before REL1 (#362) touched this file. `null` means the field was absent.
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

// F1: parameterised (default = the real anchor) rather than always reading the module-level
// PRE_MISSION_SHA — this is the seam `--selftest` Probe 9 exercises directly with an
// unresolvable SHA, without needing an actual shallow or history-stripped clone.
function loadPreMissionWorkflow(sha = PRE_MISSION_SHA) {
  const raw = execFileSync('git', ['show', `${sha}:.github/workflows/ci-quality.yml`], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  return parse(raw);
}

/** F2: resolves `PRE_MISSION_TAG` to a commit SHA via real git ref state — the piece a single
 *  commit inside this repo cannot move; only a separate `git push --tags` (or a force-move of
 *  an existing tag) changes what this returns. Throws if the tag is missing (e.g. a checkout
 *  that fetched history but not tags); callers turn that into a loud, explicit failure. */
export function resolveAnchorTagSha() {
  return execFileSync('git', ['rev-parse', `refs/tags/${PRE_MISSION_TAG}^{commit}`], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  }).trim();
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

/** F1: runs the full BASELINE-against-history-against-live comparison anchored at `sha`.
 *  Exported and parameterised (rather than always reading the module-level `PRE_MISSION_SHA`)
 *  so `--selftest` can exercise the "anchor is unreadable" seam directly — see Probe 9 — by
 *  calling `inspect(<unresolvable sha>)`, without needing an actual shallow or history-stripped
 *  clone. Real invocations go through `resolveAndInspect` below, which resolves and validates
 *  the anchor via the tag (F2) before ever calling this. */
export function inspect(sha = PRE_MISSION_SHA) {
  let preMission;
  try {
    preMission = loadPreMissionWorkflow(sha);
  } catch (err) {
    return [
      `could not read ${sha}:.github/workflows/ci-quality.yml from git history (${err.message}) — ` +
        'refusing to trust the hardcoded BASELINE unverified. A shallow clone (missing history) is the usual ' +
        "cause; this job's checkout must fetch full history.",
    ];
  }
  const historyProblems = verifyBaselineAgainstHistory(preMission.jobs ?? {}, preMission.on ?? {});
  if (historyProblems.length) {
    return [
      `BASELINE/ON_BASELINE have drifted from the real ${sha} — refusing to trust them:`,
      ...historyProblems,
    ];
  }
  const wf = parse(readFileSync(WORKFLOW, 'utf8'));
  return checkTriggerParity(wf.jobs ?? {}, wf.on ?? {});
}

/** F2: the real entry point. Resolves `PRE_MISSION_TAG`, checks the result agrees with the
 *  hardcoded `PRE_MISSION_SHA` and is real history (an ancestor of `HEAD`), and only then runs
 *  `inspect()` against it. Any failure here is a loud, explicit problem — never a silent pass —
 *  because an anchor this function can't vouch for is exactly the failure mode `907b2bbd`
 *  produced once its owning branch was deleted. */
export function resolveAndInspect() {
  let tagSha;
  try {
    tagSha = resolveAnchorTagSha();
  } catch (err) {
    return [
      `could not resolve anchor tag \`${PRE_MISSION_TAG}\` (${err.message}) — refusing to trust ` +
        "PRE_MISSION_SHA unverified. This job's checkout must fetch full history AND tags " +
        '(actions/checkout with fetch-depth: 0); a shallow or blob-filtered clone is the usual cause.',
    ];
  }
  if (tagSha !== PRE_MISSION_SHA) {
    return [
      `anchor tag \`${PRE_MISSION_TAG}\` resolves to ${tagSha}, but the hardcoded PRE_MISSION_SHA ` +
        `is ${PRE_MISSION_SHA} — refusing to trust either until a human reconciles them (the tag ` +
        'may have moved, or PRE_MISSION_SHA may have been edited without moving it).',
    ];
  }
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', tagSha, 'HEAD'], { cwd: REPO_ROOT });
  } catch {
    return [
      `anchor ${tagSha} (tag \`${PRE_MISSION_TAG}\`) is not an ancestor of HEAD — refusing to ` +
        "trust a tag that points outside this branch's own history.",
    ];
  }
  return inspect(tagSha);
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

  // Probe 1 — the REAL, current live file matches (same fixture -> []); the anchor tag resolves
  // and agrees with PRE_MISSION_SHA and is an ancestor of HEAD (F2); and BASELINE itself matches
  // real git history (F3). Goes through `resolveAndInspect`, the exact path `main()` uses.
  {
    const problems = resolveAndInspect();
    record(1, 'the live ci-quality.yml matches BASELINE/ON_BASELINE + the named exception classes, the anchor tag resolves and agrees with PRE_MISSION_SHA, and BASELINE matches real git history', 'pass', problems.length === 0, problems);
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
  //
  // F5: `loadPreMissionWorkflow()` here is UNGUARDED on purpose (the real anchor should always
  // be readable in this checkout), but "should always be" is not "is" — if it throws anyway
  // (e.g. this probe table itself is ever run against a history-stripped clone), that must be a
  // recorded probe FAILURE with a clear message, not a raw Node stack trace that takes the rest
  // of the table down with it.
  {
    let succeeded;
    let detail;
    try {
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
      succeeded = problems.length === 0;
      detail = problems;
    } catch (err) {
      // expect: 'fail' requires succeeded === false to pass; forcing succeeded = true here
      // makes THIS crash surface as a normal, named probe failure instead of an uncaught throw.
      succeeded = true;
      detail = [`loadPreMissionWorkflow() threw while preparing probe 8 — is the real anchor (${PRE_MISSION_SHA}) readable in this checkout? ${err.message}`];
    }
    record(8, 'a tampered in-memory BASELINE disagreeing with real git history is detectable', 'fail', succeeded, detail);
  }

  // Probe 9 — F1: `inspect()` ITSELF must fail loudly on an unreadable anchor, not merely "git
  // show throws in isolation" (which proved nothing about whether `inspect()`'s own catch branch
  // actually turns that into a problem). Concretely: mutating `inspect()`'s catch branch to
  // `return []` makes the plain check print a false ✅ over a shallow/history-stripped clone —
  // reproduced against the pre-F1 version of this file — and the OLD probe 9 (bare `git show`)
  // did not catch it. This probe calls `inspect()` directly with a SHA no repository can ever
  // contain, exercising exactly that seam without needing a real shallow clone.
  {
    const badSha = '0000000000000000000000000000000000000000';
    const problems = inspect(badSha);
    const namesAnchor = problems.some((p) => p.includes(badSha));
    record(
      9,
      "inspect() with an unresolvable anchor SHA returns a non-empty, anchor-naming problem list — never silently []",
      'pass',
      problems.length > 0 && namesAnchor,
      problems,
    );
  }

  return results;
}

const PROBE_FLOOR = 9;

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
  const problems = resolveAndInspect();
  if (problems.length) {
    console.error('❌ ci-quality.yml has drifted from NFR-002/SC-003 trigger parity:');
    for (const p of problems) console.error(`   ${p}`);
    process.exitCode = 1;
    return;
  }
  console.log('✅ ci-quality.yml: job key set, every job\'s if:/needs:, and the on: block match baseline except the named REL1 exception classes (NFR-002/SC-003).');
}

main();
