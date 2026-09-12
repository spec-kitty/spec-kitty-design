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
 * before. The remaining question — could someone with push access move `parity-anchor/rel1`
 * itself, in a separate operation, to a commit whose content they also crafted? — is now closed
 * at the platform level: the `parity-anchor-tags-are-immutable` repository ruleset (id 22997584,
 * recorded in docs/architecture/branch-model.md, artifact at
 * .github/rulesets/parity-anchor-tags.json — F-E) covers `refs/tags/parity-anchor/*` with
 * `creation`, `deletion`, `update` and `non_fast_forward` rules and NO bypass actors, so no new
 * or existing tag under this prefix can be created, moved or deleted by anyone — admins included
 * — without first deleting or editing that ruleset. That is not a cryptographic signature; it
 * makes moving OR minting a tag under this prefix a
 * visible, deliberate administrative act (deleting or editing an active ruleset, both logged),
 * never a plain push. The is-ancestor-of-`HEAD` check is what remains as defense in depth if
 * that administrative control is ever the thing that gets bypassed.
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
 * REL1's squash-merge commit landed. Its `.github/workflows/ci-quality.yml` is blob
 * `bab466a606c4f3a7451e5e9e7aed9a849bfa4be6` — run
 * `git rev-parse ${PRE_MISSION_SHA}:.github/workflows/ci-quality.yml` to reproduce. On train's OWN
 * line of history, `761fe66b` is the actual last commit that touched this file at all
 * (`git log 9a9e284a -- .github/workflows/ci-quality.yml` names it first, and carries the same
 * blob — nothing between `761fe66b` and `9a9e284a` touched this path). TWO PRIOR VERSIONS of
 * this comment got the history wrong here: one claimed `907b2bbd` was "the last commit before
 * REL1 touched this file", "12 commits earlier" — false on every count. `907b2bbd` never
 * touched `ci-quality.yml` at all (it is a `docs:` commit on the unrelated, now-deleted mission
 * branch), is NOT an ancestor of `9a9e284a` (`git rev-list --count 907b2bbd..9a9e284a` is 158,
 * and `git merge-base --is-ancestor` returns false), and "12 commits" was the true distance
 * between an entirely different pair — `907b2bbd` and the mission branch's OWN first workflow
 * edit, `f3d8ed45` — mistakenly carried over into a sentence about the train's line instead. The
 * only claim that ever needed to hold is the blob-identity one above, independently confirmed at
 * `907b2bbd`, `9a9e284a` and `761fe66b`: three different commits, on two disjoint lines of
 * history, carrying byte-identical content — which is what actually establishes that nothing was
 * lost, with no commit-distance argument required at all. Being an ancestor of
 * `train/elements-first`'s own history, this commit cannot be deleted the way a mission branch's
 * tip can; only a force-rewrite of the train's protected history, or the tag itself moving past
 * its own ruleset (see F2), removes it — every one of those fails LOUDLY (never silently green):
 * Probe 13 below calls `inspect()` directly with an unreadable SHA and asserts a non-empty,
 * anchor-naming problem list, not merely that `git show` itself throws; Probes 14 and 16 drive
 * `resolveAndInspect()` itself for a resolved tag that disagrees with `PRE_MISSION_SHA` and for
 * one that is real but not an ancestor of `HEAD`, respectively (Probes 15 and 17 cover the
 * resolver-throws branch and "the resolved sha is what actually gets inspected", F-G).
 *
 * **REBASELINING**: the anchor above never moves for an ordinary mission. Three knobs are
 * genuinely extensible — `EXPECTED_CHANGED_NEEDS` (a job's `needs:` gains an entry),
 * `EXPECTED_NEW_JOBS` (a wholly new job appears), and `ON_EXPECTED` (the `on:` block gains a
 * trigger) — a mission adds to these and leaves `BASELINE`/`ON_BASELINE`/`PRE_MISSION_SHA`/
 * `PRE_MISSION_TAG` untouched, since those describe the PRIOR state, not the mission in flight.
 * `EXPECTED_CHANGED_IF` is NOT a fourth such knob, despite its shape: the V2 structural check
 * inside `checkTriggerParity` independently forces every job named there to carry the exact
 * promotion-skip conjunct, so it cannot be repurposed to describe an unrelated `if:` change — a
 * mission needing one extends that structural check itself, not just this dict. And a job
 * REMOVAL fits none of the four knobs — there is no "expected missing job" mechanism, so
 * deleting a pre-existing job is representable only by a genuine re-baseline, never a same-shape
 * extension.
 *
 * **F-B: this is a MANDATORY step at the train-to-`main` landing**, not an optional cleanup —
 * `main-is-safe`'s `required_linear_history` rule forbids the merge commit that would carry
 * `parity-anchor/rel1`'s ancestry onto `main` (a squash or rebase is what lands there instead),
 * so the anchor stops being an ancestor of `HEAD` the moment the landing merges. The landing PR
 * ITSELF still shows green — it runs against `train/elements-first`'s own history, where the
 * anchor is still a real ancestor. The red appears on the FIRST PUSH TO `main` AFTER the
 * landing (the first run of this check against `main`'s new tip), and without this paragraph it
 * looks mysterious rather than expected. `docs/release-runbook.md`'s landing step names this
 * procedure explicitly so it is planned for before the red, not diagnosed after it.
 *
 * A genuine re-baseline — folding accumulated allowed-delta exceptions into a new prior state,
 * or the train-to-`main` landing above — does NOT move `parity-anchor/rel1`: the
 * `parity-anchor-tags-are-immutable` ruleset forbids that for everyone, no exceptions (F2). It
 * MINTS A NEW TAG NAME instead (e.g. `parity-anchor/rel2`) — and because that ruleset's
 * `creation` rule ALSO covers `refs/tags/parity-anchor/*` as a whole, minting any new tag under
 * this prefix is blocked too, until an admin deliberately disables or edits the ruleset (the
 * same visible, logged act moving `rel1` would have required), creates the new tag, and restores
 * the ruleset. Only then does one commit land that: updates `PRE_MISSION_TAG` to the new tag
 * name, updates `PRE_MISSION_SHA` to the new anchor commit, and fully re-captures `BASELINE`/
 * `ON_BASELINE` from that commit's REAL `.github/workflows/ci-quality.yml` — then `--selftest`
 * is re-run before pushing. `ci-quality.yml` has picked up 35 commits so far; someone will need
 * this.
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
 * F-F: `onShape` above only ever READS four named facets — it never flags anything ELSE being
 * present. Before this, `paths-ignore: ["**"]` under `on.pull_request` (which disables the
 * workflow for every matching PR — in the limiting case, every PR) or an added
 * `pull_request_target` trigger (which runs with the base branch's secrets/permissions against
 * the PR's own code) both passed this check with a clean bill, because nothing ever looked at
 * them. This pins the on: block's SHAPE beyond content: the top-level trigger KEY SET, and the
 * sub-key set under `pull_request`/`push` specifically (the two REL1 is allowed to touch at
 * all, per F4 above).
 */
const ON_TOP_LEVEL_KEYS = new Set(['pull_request', 'push', 'workflow_dispatch', 'schedule']);
const ON_SUBKEY_ALLOWLIST = { pull_request: new Set(['branches']), push: new Set(['branches']) };

function extraOnShapeProblems(on) {
  const problems = [];
  for (const key of Object.keys(on ?? {})) {
    if (!ON_TOP_LEVEL_KEYS.has(key)) {
      problems.push(
        `on.${key} is a trigger outside the pinned set (${[...ON_TOP_LEVEL_KEYS].join(', ')}) — ` +
          'e.g. pull_request_target runs with the base branch\'s secrets/permissions against a PR\'s own code',
      );
    }
  }
  for (const [trigger, allowed] of Object.entries(ON_SUBKEY_ALLOWLIST)) {
    const sub = (on ?? {})[trigger];
    if (sub == null || typeof sub !== 'object') continue;
    for (const subKey of Object.keys(sub)) {
      if (!allowed.has(subKey)) {
        problems.push(
          `on.${trigger}.${subKey} is present but outside the pinned shape (only ${[...allowed].join(', ')} ` +
            'is expected there) — e.g. paths-ignore: ["**"] silently disables the workflow for every matching PR',
        );
      }
    }
  }
  return problems;
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
// PRE_MISSION_SHA — this is the seam `--selftest` Probe 13 exercises directly with an
// unresolvable SHA, without needing an actual shallow or history-stripped clone.
function loadPreMissionWorkflow(sha = PRE_MISSION_SHA) {
  // F-I: default stdio inherits stderr to the parent process, so a git failure here (expected
  // and handled — an unresolvable sha is exactly what Probe 13 exercises) otherwise leaks a raw
  // `fatal: ...` line to the terminal/log on every run, passing or not. `['ignore','pipe','pipe']`
  // (not the `['ignore','pipe','ignore']` first proposed — verified below) silences that leak
  // while STILL capturing stderr into the thrown error's `.message`, which every caller already
  // interpolates into its own problem string: `['ignore','pipe','ignore']` was tested and found
  // to DISCARD that detail (`Command failed: ...` with no `fatal: ...` line at all), which would
  // quietly weaken a real CI failure's diagnostic message for a purely cosmetic selftest fix.
  const raw = execFileSync('git', ['show', `${sha}:.github/workflows/ci-quality.yml`], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
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
    stdio: ['ignore', 'pipe', 'pipe'], // F-I, same reasoning as loadPreMissionWorkflow above.
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
  // F-F: beyond the four named facets above, the on: block's SHAPE itself is pinned.
  problems.push(...extraOnShapeProblems(on));

  return problems;
}

/** F1: runs the full BASELINE-against-history-against-live comparison anchored at `sha`.
 *  Exported and parameterised (rather than always reading the module-level `PRE_MISSION_SHA`)
 *  so `--selftest` can exercise the "anchor is unreadable" seam directly — see Probe 13 — by
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
 *  produced once its owning branch was deleted.
 *
 *  `expectedSha`/`resolveTagSha` default to the real `PRE_MISSION_SHA`/`resolveAnchorTagSha` —
 *  parameterised (like `inspect`'s own `sha`) so `--selftest` Probes 14/16/17 can drive the REAL
 *  mismatch/non-ancestor branches below through this exact function, injecting only "what did
 *  resolution return", never re-implementing the comparison or the ancestor check inline. */
export function resolveAndInspect(expectedSha = PRE_MISSION_SHA, resolveTagSha = resolveAnchorTagSha) {
  let tagSha;
  try {
    tagSha = resolveTagSha();
  } catch (err) {
    return [
      `could not resolve anchor tag \`${PRE_MISSION_TAG}\` (${err.message}) — refusing to trust ` +
        "PRE_MISSION_SHA unverified. This job's checkout must fetch full history AND tags " +
        '(actions/checkout with fetch-depth: 0); a shallow or blob-filtered clone is the usual cause.',
    ];
  }
  if (tagSha !== expectedSha) {
    return [
      `anchor tag \`${PRE_MISSION_TAG}\` resolves to ${tagSha}, but the hardcoded PRE_MISSION_SHA ` +
        `is ${expectedSha} — refusing to trust either until a human reconciles them (the tag ` +
        'may have moved, or PRE_MISSION_SHA may have been edited without moving it).',
    ];
  }
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', tagSha, 'HEAD'], { cwd: REPO_ROOT });
  } catch {
    return [
      `anchor ${tagSha} (tag \`${PRE_MISSION_TAG}\`) is not an ancestor of HEAD — refusing to ` +
        "trust a tag that points outside this branch's own history. F-B: if this is the " +
        "train-to-main landing, this is EXPECTED on the first push to main (main-is-safe's " +
        'required_linear_history forbids the merge commit that would carry this tag\'s ancestry ' +
        'onto main) — mint a NEW tag under refs/tags/parity-anchor/* (an admin must first ' +
        'disable or edit the parity-anchor-tags-are-immutable ruleset, whose creation rule also ' +
        'covers new names under this prefix), point PRE_MISSION_TAG/PRE_MISSION_SHA at it, and ' +
        're-capture BASELINE/ON_BASELINE from its real content — see this file\'s REBASELINING ' +
        "note and docs/release-runbook.md's landing step. Otherwise: the tag or PRE_MISSION_SHA " +
        'may point somewhere unintended — do not simply update one to match the other.',
    ];
  }
  return inspect(tagSha);
}

// ── --selftest: floor-outside-table shape ────────────────────────────────────────────────

function cloneLiveWorkflow() {
  return structuredClone(parse(readFileSync(WORKFLOW, 'utf8')));
}

/**
 * F-C: every probe body is now a `() => ({ succeeded, detail })` thunk, and THIS loop —
 * not each probe individually — is what wraps the call in try/catch. Before this, F5's fix to
 * the BASELINE-vs-history probe (guard `loadPreMissionWorkflow()` so a real throw is a named
 * probe failure, not a crash) was applied to exactly that one probe; the non-ancestor probe's
 * own two unguarded git calls (`rev-parse …^{tree}`, `commit-tree`), added in the SAME fold,
 * reintroduced the identical class the very next probe over (now Probe 16 below). A thrown
 * probe now always becomes `{ succeeded: undefined }`,
 * which matches neither `expect: 'pass'` (`=== true`) nor `expect: 'fail'` (`=== false`) —
 * always a clean, named, non-matching result, never a table-ending stack trace.
 */
function runProbes() {
  const defs = [];
  const define = (n, name, expect, fn) => defs.push({ n, name, expect, fn });

  // Probe 1 — the REAL, current live file matches (same fixture -> []); the anchor tag resolves
  // and agrees with PRE_MISSION_SHA and is an ancestor of HEAD (F2); and BASELINE itself matches
  // real git history (F3). Goes through `resolveAndInspect`, the exact path `main()` uses.
  define(1, 'the live ci-quality.yml matches BASELINE/ON_BASELINE + the named exception classes, the anchor tag resolves and agrees with PRE_MISSION_SHA, and BASELINE matches real git history', 'pass', () => {
    const problems = resolveAndInspect();
    return { succeeded: problems.length === 0, detail: problems };
  });

  // Probe 2 — an extra, unexpected new job is caught.
  define(2, 'an unexpected new job is caught', 'fail', () => {
    const wf = cloneLiveWorkflow();
    wf.jobs['some-new-job'] = { 'runs-on': 'ubuntu-latest', steps: [] };
    const problems = checkTriggerParity(wf.jobs, wf.on);
    return { succeeded: !problems.some((p) => p.includes('some-new-job')), detail: problems };
  });

  // Probe 3 — a baseline job's `needs:` silently regressed is caught.
  define(3, "gate's needs: silently dropping `test` is caught", 'fail', () => {
    const wf = cloneLiveWorkflow();
    wf.jobs.gate.needs = wf.jobs.gate.needs.filter((n) => n !== 'test');
    const problems = checkTriggerParity(wf.jobs, wf.on);
    return { succeeded: !problems.some((p) => p.includes('`gate`') && p.includes('needs')), detail: problems };
  });

  // Probe 4 — one of the five allowed-to-change jobs reverted to its OLD `if:` (the conjunct
  // silently removed) is caught — this is the exact NFR-002 regression class this check exists
  // for.
  define(4, "a11y's if: silently reverting to the pre-REL1 value is caught", 'fail', () => {
    const wf = cloneLiveWorkflow();
    wf.jobs.a11y.if = BASELINE.a11y.if;
    const problems = checkTriggerParity(wf.jobs, wf.on);
    return { succeeded: !problems.some((p) => p.includes('`a11y`')), detail: problems };
  });

  // Probe 5 — a baseline job's `if:` changed to something OTHER than the one expected new
  // value is caught (not merely "differs from baseline" — the exact expected value is asserted).
  define(5, "playwright's if: changed to a THIRD, uncontrolled value is caught", 'fail', () => {
    const wf = cloneLiveWorkflow();
    wf.jobs.playwright.if = "needs.storybook-build.result == 'success' && true";
    const problems = checkTriggerParity(wf.jobs, wf.on);
    return { succeeded: !problems.some((p) => p.includes('`playwright`')), detail: problems };
  });

  // Probe 6 — F4: a second cron silently added is caught.
  define(6, 'a second cron entry is caught (the deliberate one-cron decision, research.md R25)', 'fail', () => {
    const wf = cloneLiveWorkflow();
    wf.on.schedule.push({ cron: '43 3 * * *' });
    const problems = checkTriggerParity(wf.jobs, wf.on);
    return { succeeded: !problems.some((p) => p.includes('on.schedule')), detail: problems };
  });

  // Probe 7 — F4: develop silently dropped from push.branches is caught.
  define(7, 'develop silently dropped from on.push.branches is caught', 'fail', () => {
    const wf = cloneLiveWorkflow();
    wf.on.push.branches = ['main', 'train/**'];
    const problems = checkTriggerParity(wf.jobs, wf.on);
    return { succeeded: !problems.some((p) => p.includes('on.push.branches')), detail: problems };
  });

  // Probe 8 — F-F: an extra top-level trigger (e.g. pull_request_target) outside the pinned
  // set is caught.
  define(8, 'on.pull_request_target (a trigger outside the pinned set) is caught', 'fail', () => {
    const wf = cloneLiveWorkflow();
    wf.on.pull_request_target = { branches: ['main'] };
    const problems = checkTriggerParity(wf.jobs, wf.on);
    return { succeeded: !problems.some((p) => p.includes('pull_request_target')), detail: problems };
  });

  // Probe 9 — F-F: an extra sub-key under a pinned trigger (e.g. paths-ignore, which can
  // silently disable the workflow for every matching PR) is caught.
  define(9, 'on.pull_request.paths-ignore (a sub-key outside the pinned shape) is caught', 'fail', () => {
    const wf = cloneLiveWorkflow();
    wf.on.pull_request['paths-ignore'] = ['**'];
    const problems = checkTriggerParity(wf.jobs, wf.on);
    return { succeeded: !problems.some((p) => p.includes('paths-ignore')), detail: problems };
  });

  // Probe 10 — F-A/S1: `verifyBaselineAgainstHistory()` ITSELF must catch a tampered
  // BASELINE.<job>.needs, called directly (not a hand-rolled inline reimplementation of a
  // needs-only subset, which is what the PREVIOUS version of this probe actually was — it
  // survived a stub of the real function returning always `[]`, because it never called that
  // function at all). `BASELINE` is mutated in place and restored in `finally`.
  define(10, 'verifyBaselineAgainstHistory() itself catches a tampered BASELINE.gate.needs disagreeing with real history (S1)', 'fail', () => {
    const realPreMission = loadPreMissionWorkflow();
    const original = BASELINE.gate.needs;
    BASELINE.gate.needs = original.filter((n) => n !== 'test');
    let problems;
    try {
      problems = verifyBaselineAgainstHistory(realPreMission.jobs ?? {}, realPreMission.on ?? {});
    } finally {
      BASELINE.gate.needs = original;
    }
    return { succeeded: !problems.some((p) => p.includes('BASELINE.gate.needs')), detail: problems };
  });

  // Probe 11 — F-A/S2: the `on:`-side of `verifyBaselineAgainstHistory()` (the
  // `for (const key of Object.keys(ON_BASELINE))` loop) must ALSO catch a tampered
  // ON_BASELINE.schedule — the exact loop a `for (const key of [])` mutant disables, which
  // would silently unlock adding a second cron to BOTH `ci-quality.yml` and `ON_BASELINE` in
  // one commit (since `ON_EXPECTED.schedule` is a direct reference to `ON_BASELINE.schedule`).
  define(11, "verifyBaselineAgainstHistory() itself catches a tampered ON_BASELINE.schedule disagreeing with real history (S2 — the one-cron decision)", 'fail', () => {
    const realPreMission = loadPreMissionWorkflow();
    const original = ON_BASELINE.schedule;
    ON_BASELINE.schedule = [...original, { cron: '43 3 * * *' }];
    let problems;
    try {
      problems = verifyBaselineAgainstHistory(realPreMission.jobs ?? {}, realPreMission.on ?? {});
    } finally {
      ON_BASELINE.schedule = original;
    }
    return { succeeded: !problems.some((p) => p.includes('ON_BASELINE.schedule')), detail: problems };
  });

  // Probe 12 — F-A/S3: `inspect()`'s OWN historyProblems gate (`if (historyProblems.length)
  // return [...]`) must be what refuses a drifted BASELINE — not an accident of
  // `checkTriggerParity` independently noticing something wrong afterwards. Distinguished by
  // asserting the SPECIFIC "have drifted from the real" message that only that gate emits;
  // checkTriggerParity's own (differently-worded) findings would not satisfy this even though
  // `problems` might still be non-empty if the gate were disabled.
  define(12, "inspect() itself refuses via its OWN historyProblems gate when BASELINE disagrees with real history at the anchor, not merely by accident through checkTriggerParity (S3)", 'pass', () => {
    const original = BASELINE.gate.needs;
    BASELINE.gate.needs = original.filter((n) => n !== 'test');
    let problems;
    try {
      problems = inspect(PRE_MISSION_SHA);
    } finally {
      BASELINE.gate.needs = original;
    }
    const tookHistoryGate = problems.some((p) => p.startsWith(`BASELINE/ON_BASELINE have drifted from the real ${PRE_MISSION_SHA}`));
    return { succeeded: problems.length > 0 && tookHistoryGate, detail: problems };
  });

  // Probe 13 — F1: `inspect()` ITSELF must fail loudly on an unreadable anchor, not merely "git
  // show throws in isolation" (which proved nothing about whether `inspect()`'s own catch branch
  // actually turns that into a problem). Concretely: mutating `inspect()`'s catch branch to
  // `return []` makes the plain check print a false ✅ over a shallow/history-stripped clone —
  // reproduced against the pre-F1 version of this file — and the OLD probe 9 (bare `git show`)
  // did not catch it. This probe calls `inspect()` directly with a SHA no repository can ever
  // contain, exercising exactly that seam without needing a real shallow clone.
  define(13, "inspect() with an unresolvable anchor SHA returns a non-empty, anchor-naming problem list — never silently []", 'pass', () => {
    const badSha = '0000000000000000000000000000000000000000';
    const problems = inspect(badSha);
    const namesAnchor = problems.some((p) => p.includes(badSha));
    return { succeeded: problems.length > 0 && namesAnchor, detail: problems };
  });

  // Probe 14 — F2: `resolveAndInspect()` ITSELF refuses when the resolved tag disagrees with
  // the hardcoded `PRE_MISSION_SHA` — the exact seam a same-commit edit to `PRE_MISSION_SHA`
  // alone (without moving the protected tag) hits. Drives the REAL function via its injectable
  // `resolveTagSha` parameter (never re-implementing the comparison inline): the resolver is
  // faked to return something else, `expectedSha` stays the real constant.
  define(14, 'resolveAndInspect() refuses when the resolved tag disagrees with the hardcoded PRE_MISSION_SHA', 'pass', () => {
    const fakeResolved = '0'.repeat(40);
    const problems = resolveAndInspect(PRE_MISSION_SHA, () => fakeResolved);
    const namesBoth = problems.some((p) => p.includes(fakeResolved) && p.includes(PRE_MISSION_SHA));
    return { succeeded: problems.length > 0 && namesBoth, detail: problems };
  });

  // Probe 15 — F-G: `resolveAndInspect()` ITSELF refuses when RESOLVING the tag throws — the
  // likeliest real failure (a checkout that fetched history but not tags) and, before this, the
  // one branch in `resolveAndInspect()` no probe drove at all.
  define(15, 'resolveAndInspect() refuses when resolveTagSha() itself throws (e.g. a checkout with no tags fetched)', 'pass', () => {
    const problems = resolveAndInspect(PRE_MISSION_SHA, () => {
      throw new Error('simulated: tag not found (no tags fetched)');
    });
    const namesTag = problems.some((p) => p.includes(PRE_MISSION_TAG));
    return { succeeded: problems.length > 0 && namesTag, detail: problems };
  });

  // Probe 16 — F2: `resolveAndInspect()` ITSELF refuses when the resolved anchor is real but is
  // NOT an ancestor of HEAD — the seam that catches a tag pointed at a genuine, but unrelated or
  // crafted, commit. Mints a fresh, PARENTLESS commit that reuses the REAL anchor's own tree
  // (`git commit-tree <PRE_MISSION_SHA's tree>`, no `-p`), so this exercises ONLY the ancestry
  // check: an earlier version of this probe used an EMPTY tree instead, which "passed" for the
  // wrong reason — `inspect()`'s own "workflow file not found in this tree" catch branch fired
  // first and happened to name the orphan SHA too, so the probe stayed green even with the
  // ancestor check deleted entirely (verified: reverting the guard did not redden it). With the
  // real tree, disabling the ancestor check makes `inspect()` proceed all the way through and
  // find genuinely matching content — a true false-green — which this probe now actually
  // catches. The commit is parentless and freshly minted, so it is unreachable from HEAD by
  // construction and this probe never depends on some OTHER branch's tip surviving in every
  // checkout that runs it.
  define(16, 'resolveAndInspect() refuses when the resolved anchor is real but not an ancestor of HEAD', 'pass', () => {
    const anchorTreeSha = execFileSync('git', ['rev-parse', `${PRE_MISSION_SHA}^{tree}`], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    const orphanSha = execFileSync(
      'git',
      ['commit-tree', anchorTreeSha, '-m', 'selftest orphan probe commit — real tree, unreachable from any branch'],
      { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    ).trim();
    const problems = resolveAndInspect(orphanSha, () => orphanSha);
    const namesAnchor = problems.some((p) => p.includes(orphanSha) && p.includes('ancestor'));
    return { succeeded: problems.length > 0 && namesAnchor, detail: problems };
  });

  // Probe 17 — F-G: `resolveAndInspect()` must inspect the RESOLVED sha, not a hardcoded
  // default — `return inspect(tagSha)` silently regressing to `return inspect()` survived
  // every probe above, because probe 1's golden path has `tagSha === PRE_MISSION_SHA` anyway
  // (indistinguishable outcomes) and probes 14-16 all return early before reaching that line.
  // `HEAD` itself is used as the "different, real, ancestor-of-HEAD" sha: it is trivially its
  // own ancestor, and (unlike an arbitrary historical commit, which risked matching BASELINE on
  // every FIELD THIS CHECKER TRACKS even while its raw bytes differed — an earlier version of
  // this probe hit exactly that with `761fe66b^`, which added two lint-code STEPS but touched
  // no job's `if:`/`needs:` or the `on:` block) HEAD's own content is guaranteed to diverge from
  // the frozen pre-REL1 `BASELINE` in tracked fields, permanently, as more commits land after
  // it. Passing identity+ancestor with THIS sha and asserting the content-drift problem names
  // it — not `PRE_MISSION_SHA` — is what distinguishes "inspected the resolved sha" from
  // "silently inspected the default".
  define(17, 'resolveAndInspect() inspects the RESOLVED sha, not a hardcoded default (a return inspect(tagSha) -> inspect() regression)', 'pass', () => {
    const headSha = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    const problems = resolveAndInspect(headSha, () => headSha);
    const namesIt = problems.some((p) => p.includes(headSha));
    return { succeeded: problems.length > 0 && namesIt, detail: problems };
  });

  return defs.map(({ n, name, expect, fn }) => {
    let succeeded;
    let detail;
    try {
      ({ succeeded, detail } = fn());
    } catch (err) {
      detail = [`probe ${n} threw instead of returning a result — ${err.message}`];
    }
    const ok = expect === 'pass' ? succeeded === true : succeeded === false;
    return { n, name, expect, ok, detail };
  });
}

const PROBE_FLOOR = 17;

function selftest() {
  // Probe 16 mints a real orphan commit via `git commit-tree`, which needs a git identity —
  // absent on a bare CI runner even though `git show`/`git rev-parse`/`git merge-base` (every
  // OTHER git call in this file) need none. Set it here, once, the same way
  // promote-develop.mjs's own `selftest()` does for its tree-sync commits, rather than depend
  // on whatever identity happens to be configured globally on the machine running this process.
  process.env.GIT_AUTHOR_NAME = 'selftest';
  process.env.GIT_AUTHOR_EMAIL = 'selftest@example.invalid';
  process.env.GIT_COMMITTER_NAME = 'selftest';
  process.env.GIT_COMMITTER_EMAIL = 'selftest@example.invalid';

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
