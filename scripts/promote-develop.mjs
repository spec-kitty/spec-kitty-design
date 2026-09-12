#!/usr/bin/env node
/**
 * scripts/promote-develop.mjs — the develop-promotion mechanism (REL1, #362, FR-007/FR-008/
 * FR-010; contracts/promotion-script.contract.md, data-model.md, plan.md's Promotion algorithm).
 *
 * `run` mode's module graph is `node:*` BUILT-INS ONLY — no static `@commitlint/*` import
 * anywhere reachable from it (research.md R13). `--selftest` reaches `@commitlint/lint`/
 * `@commitlint/load` exclusively via a DYNAMIC `import()`, so the production path never
 * depends on those packages being resolvable.
 *
 * CLI:
 *   node scripts/promote-develop.mjs run              # the real thing (CI only)
 *   node scripts/promote-develop.mjs decide --cwd <p> --train <ref> --develop <ref>
 *   node scripts/promote-develop.mjs assert-scope
 *   node scripts/promote-develop.mjs --selftest       # red-first probe table, no network
 *
 * `--selftest` sets its own git identity for the process (the GIT_AUTHOR_ and GIT_COMMITTER_
 * env vars, see `selftest()`) so it never depends on ambient git config — verify it the way CI actually
 * sees it, with NEITHER config source available:
 *   GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null node scripts/promote-develop.mjs --selftest
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  defaultExec,
  listOpenPRsBaseDevelop,
  listOpenPromotionHeadPRsAnyBase,
  listPromotionBranches,
  PROMOTION_BRANCH_RE,
  pushPromotionBranch,
  openPromotionPR,
  commentOnPR,
  closePR,
  deleteBranch,
  viewPRMergeStatus,
  mergePR,
  readDevelopTree,
  sweepPromotionNamespace,
} from './lib/promote-github.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Exported pure functions (contracts/promotion-script.contract.md) ─────────────────────

/** The branch prefix this mechanism ever creates. A single, shared constant (M2, pre-merge
 *  squad) — every place that builds or recognizes a promotion branch name reads this ONE
 *  value, so a probe can prove the whole system is sensitive to it (see `--selftest` probe
 *  for the `promote/` -> `sync/` mutation) rather than each call site carrying its own
 *  independent literal that a rename could miss. */
export const PROMOTE_PREFIX = 'promote/';

/**
 * The decision algorithm's branching logic, expressed as an ORDERED LIST of small rule
 * functions rather than one large function's sequential `if`s (M2, pre-merge squad). Each
 * rule receives the same input `decidePromotion` does and returns either a partial result
 * (this rule matched) or `null` (try the next rule). `decidePromotion` below iterates this
 * list via `impl.decisionRules`, so `--selftest`'s probe 12 mutation control can REORDER the
 * REAL rule functions in place — swapping two entries of this array — rather than hand-
 * reimplementing the whole decision function's logic a second time (which the contract
 * explicitly rules out: "never a second, hand-written simulated defeat").
 *
 * Order matters: missing-develop and diverged are both checked before anything that touches
 * `trainTree`/`developTree`/`existingPr` (contract).
 */
function ruleMissingDevelop({ developSha }) {
  if (developSha !== null) return null;
  return { outcome: 'no-op-missing-develop', developHealthy: null };
}

function ruleDiverged({ developHealthy, divergence, existingPr }) {
  if (developHealthy !== false) return null;
  return { outcome: 'refuse-diverged', divergence: divergence ?? null, existingPr: existingPr ?? null };
}

function ruleInSync({ developTree, trainTree, existingPr }) {
  if (developTree !== trainTree) return null;
  return { outcome: 'no-op-in-sync', existingPr: existingPr ?? null };
}

function ruleReuse({ existingPr, trainTree }) {
  if (!existingPr || existingPr.headTree !== trainTree) return null;
  return { outcome: 'reuse-existing-pr', existingPr };
}

function ruleSupersede({ existingPr, trainTree, trainSha }) {
  if (!existingPr || existingPr.headTree === trainTree) return null;
  return {
    outcome: 'supersede-and-open',
    existingPr,
    commitMessage: buildCommitMessage(trainSha),
    branchName: `${PROMOTE_PREFIX}${trainSha}`,
  };
}

function ruleOpenNew({ trainSha }) {
  return {
    outcome: 'open-new',
    existingPr: null,
    commitMessage: buildCommitMessage(trainSha),
    branchName: `${PROMOTE_PREFIX}${trainSha}`,
  };
}

const DEFAULT_DECISION_RULES = [ruleMissingDevelop, ruleDiverged, ruleInSync, ruleReuse, ruleSupersede, ruleOpenNew];

/**
 * Pure (as long as `impl.decisionRules` is the unmutated default — see above). Runs each rule
 * in `impl.decisionRules`, in order, and returns the first non-null result merged onto the
 * common `base` shape. Throws only if every rule declines, which is unreachable with the
 * default rule list (`ruleOpenNew` never returns `null`) but not necessarily with a mutated one.
 */
export function decidePromotion({
  trainSha,
  trainTree,
  developSha,
  developTree,
  existingPr = null,
  developHealthy = null,
  divergence = null,
}) {
  const input = { trainSha, trainTree, developSha, developTree, existingPr, developHealthy, divergence };
  const base = {
    trainSha: trainSha ?? null,
    trainTree: trainTree ?? null,
    developSha: developSha ?? null,
    developTree: developTree ?? null,
    developHealthy: developHealthy ?? null,
    divergence: null,
    existingPr: null,
    commitMessage: null,
    branchName: null,
  };
  for (const rule of impl.decisionRules) {
    const partial = rule(input);
    if (partial) return { ...base, ...partial };
  }
  throw new Error('decidePromotion: no rule in impl.decisionRules matched (unreachable with the default rule list)');
}

/**
 * Pure. research.md R12 — healthy iff `developSha` is on the train's first-parent history,
 * or is a promotion commit whose Train-SHA trailer names a train commit with a matching tree.
 * `trailerLookup(sha)` returns `null` (no trailer) or `{ trainSha, matches: boolean }`.
 */
export function isDevelopHealthy(developSha, trainFirstParentShas, trailerLookup) {
  if (trainFirstParentShas.includes(developSha)) return true;
  const trailer = trailerLookup(developSha);
  return trailer != null && trailer.matches === true;
}

/**
 * Pure string builder (data-model.md PromotionCommitMessage, B2). The full SHA lives in a
 * `Train-SHA:` trailer, never inline in the body — the previous shape's body line was
 * 106 characters, over `body-max-line-length`'s 100-character ceiling.
 */
export function buildCommitMessage(sha) {
  const short = String(sha).slice(0, 7);
  return [
    `chore(release): promote ${short} to develop`,
    '',
    'Tree-sync promotion from train/elements-first.',
    '',
    `Train-SHA: ${sha}`,
  ].join('\n');
}

/**
 * Pure. B4/M4 — GitHub's documented GraphQL `MergeStateStatus` enum (data-model.md
 * MergeReadiness table), not the REST `mergeable_state` string.
 */
export function assessMergeReadiness({ mergeable, mergeStateStatus }) {
  if (mergeable === null || mergeable === undefined) return 'poll-again';
  if (mergeable === false) return 'fail-anomaly';
  switch (mergeStateStatus) {
    case 'CLEAN':
    case 'HAS_HOOKS':
    case 'UNSTABLE':
      return 'attempt-merge';
    case 'BLOCKED':
    case 'UNKNOWN':
      return 'poll-again';
    case 'BEHIND':
      return 'recheck-divergence';
    case 'DIRTY':
      return 'fail-anomaly';
    default:
      return 'fail-anomaly';
  }
}

/**
 * Pure. M6 — `gh pr list --head` is an exact match, so discovery is list-then-filter.
 *
 * **F1 (pre-merge squad, gate pass 2)**: matches the EXACT `promote/<40-hex>` shape
 * (`PROMOTION_BRANCH_RE`, `scripts/lib/promote-github.mjs`), never a loose `promote/` prefix.
 * B5 tightened the SWEEP's branch-deletion half to this shape but left this selection function
 * on the loose prefix — a human PR into `develop` headed `promote/my-feature` was adopted as
 * `existingPr` (`cliRun`), closed with a misleading "Superseded by" comment, and its branch
 * deleted by `applyOutcome`'s supersede path, none of which consult `PROMOTION_BRANCH_RE` at
 * all. Fixing selection here closes all three: `existingPr` (and therefore the supersede
 * path's `deleteBranch` call) can now only ever be populated from a PR this mechanism itself
 * could have created.
 */
export function findPromotionPRs(prListJson) {
  return (prListJson ?? []).filter((pr) => PROMOTION_BRANCH_RE.test(String(pr.headRefName ?? '')));
}

/** Pure. M5 — fails closed unless the installation covers exactly spec-kitty/spec-kitty-design. */
export function assertSingleRepoScope(installationRepositoriesJson) {
  const repos = installationRepositoriesJson?.repositories ?? [];
  const names = repos.map((r) => r?.full_name);
  if (repos.length !== 1 || names[0] !== 'spec-kitty/spec-kitty-design') {
    throw new Error(
      'assertSingleRepoScope: expected exactly one installation repository ' +
        `(spec-kitty/spec-kitty-design), got ${repos.length}: ${names.join(', ') || '(none)'}`,
    );
  }
  return true;
}

/**
 * Shells out to git in `cwd`. Returns the new commit SHA. Never touches the network or a
 * remote. `env` may carry additional overrides merged onto `process.env`; production relies
 * on the workflow's own `git config --global` bot identity, so it never needs to pass any.
 *
 * **Corrected claim (B1, pre-merge squad — CI was RED at PR #429's head on this exact defect):**
 * an earlier revision of this comment claimed callers pass `GIT_AUTHOR_*`/`GIT_COMMITTER_*`
 * here per call. None of the five call sites in this file ever did — every one relied on
 * whatever git identity happened to already be configured globally on the machine running
 * this process, which a real workstation has and a bare CI runner does not
 * (`lint-code`'s "[ENFORCED] develop-promotion mechanism self-test" step failed with `git
 * commit-tree`'s own "Author identity unknown … unable to auto-detect email address").
 * **Fixed at the actual choke point instead**: `selftest()` sets `GIT_AUTHOR_NAME`/
 * `GIT_AUTHOR_EMAIL`/`GIT_COMMITTER_NAME`/`GIT_COMMITTER_EMAIL` on `process.env` itself, once,
 * before running any probe — every `execFileSync` call in this file (this one included, via
 * its own `{ ...process.env, ...env }` merge) inherits it from there, so no call site needs
 * its own `env` override. Verify the way CI actually sees it — a runner with no ambient git
 * config at all — by unsetting both config sources first:
 * `GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null node scripts/promote-develop.mjs --selftest`.
 * A developer's own workstation, with a real global git identity already set, can otherwise be
 * strictly greener than CI on this exact defect and never notice.
 */
export function createTreeSyncCommit(cwd, { tree, parentSha, message, env = {} }) {
  return execFileSync('git', ['commit-tree', tree, '-p', parentSha, '-m', message], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  }).trim();
}

/**
 * Resolves `ref`'s tip `{ sha, tree }` via git in `cwd`. Distinguishes "confirmed absent" (a
 * prior remote check already said so — returns `null` when `confirmedAbsent` is passed) from
 * "should exist but did not resolve locally" (throws) — research.md R19's correction.
 */
export function readRefTip(cwd, ref, { confirmedAbsent = false } = {}) {
  let sha;
  try {
    sha = execFileSync('git', ['rev-parse', '--verify', '--quiet', ref], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch (err) {
    if (confirmedAbsent) return null;
    throw new Error(
      `readRefTip: ${ref} did not resolve locally in ${cwd} and was not confirmed absent by a ` +
        `prior remote check — this is an error, not a missing-branch signal (research.md R19). ${err.message}`,
    );
  }
  const tree = execFileSync('git', ['rev-parse', `${sha}^{tree}`], { cwd, encoding: 'utf8' }).trim();
  return { sha, tree };
}

/**
 * A mutable indirection layer over the pure functions above, used by every OTHER internal
 * call site in this file (the CLI modes AND the selftest). This is what lets `--selftest`'s
 * mutation controls (probes 11/12, contracts/promotion-script.contract.md) monkey-patch the
 * REAL, already-loaded `createTreeSyncCommit`/`decidePromotion` in-process — ES module named
 * exports are read-only live bindings and cannot be reassigned from outside the module, so
 * this object is the one thing that can be swapped, restored, and observed by every other
 * caller in this same process. Production code (`cliRun`, `applyOutcome`) reads through
 * `impl.*` for the same reason: a mutation control that only fooled a test-only call path
 * would be testing a second implementation, not the code that actually runs (research.md R8).
 */
export const impl = {
  decidePromotion,
  isDevelopHealthy,
  buildCommitMessage,
  assessMergeReadiness,
  findPromotionPRs,
  assertSingleRepoScope,
  createTreeSyncCommit,
  readRefTip,
  // M2: the ORDERED rule list `decidePromotion` iterates. A mutation control reorders this
  // real array in place rather than hand-reimplementing the decision function.
  decisionRules: [...DEFAULT_DECISION_RULES],
};

// ── Internal helpers used by the `decide`/`run` CLI modes only ───────────────────────────

function listFirstParentShas(cwd, ref) {
  const out = execFileSync('git', ['rev-list', '--first-parent', ref], { cwd, encoding: 'utf8' });
  return out.trim().split('\n').filter(Boolean);
}

/** `trailerLookup` factory for a real (or scratch) git checkout at `cwd`. */
function makeTrailerLookup(cwd) {
  return (sha) => {
    let message;
    try {
      message = execFileSync('git', ['log', '-1', '--format=%B', sha], { cwd, encoding: 'utf8' });
    } catch {
      return null;
    }
    const match = message.match(/^Train-SHA:\s*([0-9a-f]{40})\s*$/m);
    if (!match) return null;
    const trainSha = match[1];
    try {
      const trainTree = execFileSync('git', ['rev-parse', `${trainSha}^{tree}`], {
        cwd,
        encoding: 'utf8',
      }).trim();
      const developTree = execFileSync('git', ['rev-parse', `${sha}^{tree}`], {
        cwd,
        encoding: 'utf8',
      }).trim();
      return { trainSha, matches: trainTree === developTree };
    } catch {
      return { trainSha, matches: false };
    }
  };
}

function computeDivergenceReason(developSha, trailerLookup) {
  const trailer = trailerLookup(developSha);
  if (trailer) {
    return {
      reason:
        `develop's tip ${developSha} carries a Train-SHA trailer (${trailer.trainSha}) but its ` +
        'tree does not match that train commit\'s tree',
      developSha,
      checkedAgainst: 'promotion-trailer',
    };
  }
  return {
    reason:
      `develop's tip ${developSha} is neither on train's first-parent history nor a promotion ` +
      'commit carrying a Train-SHA trailer that resolves to a matching tree',
    developSha,
    checkedAgainst: 'train-first-parent',
  };
}

function refExistsLocally(cwd, ref) {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', ref], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return true;
  } catch {
    return false;
  }
}

function resolveTreeForSha(cwd, sha, exec, repo) {
  try {
    return execFileSync('git', ['rev-parse', `${sha}^{tree}`], { cwd, encoding: 'utf8' }).trim();
  } catch {
    const out = exec('gh', ['api', `repos/${repo}/git/commits/${sha}`]);
    return JSON.parse(out).tree.sha;
  }
}

function liveRemoteTip(exec, remote, ref, cwd) {
  const out = exec('git', ['ls-remote', '--exit-code', remote, `refs/heads/${ref}`], { cwd });
  const line = String(out).split('\n').find(Boolean);
  if (!line) throw new Error(`${remote} has no ref refs/heads/${ref}`);
  return line.split(/\s+/)[0];
}

/** Shared by `decide` (no GitHub calls, `existingPr` always null) and `run` (real GitHub calls
 *  supply `existingPr`). Both compute the same `PromotionDecision` shape from the same inputs. */
function computeLocalDecisionInputs({ cwd, trainRef, developRef }) {
  const train = impl.readRefTip(cwd, trainRef);
  const developExists = refExistsLocally(cwd, developRef);
  const develop = developExists
    ? impl.readRefTip(cwd, developRef)
    : impl.readRefTip(cwd, developRef, { confirmedAbsent: true });

  let developHealthy = null;
  let divergence = null;
  if (develop) {
    const trainFirstParentShas = listFirstParentShas(cwd, trainRef);
    const trailerLookup = makeTrailerLookup(cwd);
    developHealthy = impl.isDevelopHealthy(develop.sha, trainFirstParentShas, trailerLookup);
    if (!developHealthy) divergence = computeDivergenceReason(develop.sha, trailerLookup);
  }

  return { train, develop, developHealthy, divergence };
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`::error::${name} is not set — cannot proceed.`);
    process.exitCode = 1;
    throw new Error(`missing required environment variable ${name}`);
  }
  return value;
}

function writeStepSummary(text) {
  const path = process.env.GITHUB_STEP_SUMMARY;
  if (!path) return;
  try {
    appendFileSync(path, `${text}\n`);
  } catch {
    // Best-effort only — never let a summary-write failure mask the real outcome.
  }
}

function renderDecisionSummary(decision) {
  const lines = [`### Promotion decision: \`${decision.outcome}\``];
  if (decision.trainSha) lines.push(`- train tip: \`${decision.trainSha}\``);
  if (decision.developSha) lines.push(`- develop tip: \`${decision.developSha}\``);
  if (decision.existingPr) lines.push(`- existing promotion PR: #${decision.existingPr.number}`);
  if (decision.divergence) lines.push(`- divergence: ${decision.divergence.reason}`);
  return lines.join('\n');
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// ── CLI: decide ────────────────────────────────────────────────────────────────────────

function getArg(args, flag) {
  const idx = args.indexOf(flag);
  return idx === -1 ? undefined : args[idx + 1];
}

function cliDecide(args) {
  const cwd = getArg(args, '--cwd') ?? process.cwd();
  const trainRef = getArg(args, '--train') ?? 'HEAD';
  const developRef = getArg(args, '--develop') ?? 'develop';
  const { train, develop, developHealthy, divergence } = computeLocalDecisionInputs({
    cwd,
    trainRef,
    developRef,
  });
  const decision = impl.decidePromotion({
    trainSha: train.sha,
    trainTree: train.tree,
    developSha: develop ? develop.sha : null,
    developTree: develop ? develop.tree : null,
    existingPr: null,
    developHealthy,
    divergence,
  });
  console.log(JSON.stringify(decision, null, 2));
}

// ── CLI: assert-scope ─────────────────────────────────────────────────────────────────

function cliAssertScope() {
  // M9 (pre-merge squad): no `--input` fixture seam here. It was reachable from production
  // (`node scripts/promote-develop.mjs assert-scope --input <file>`) but nothing in
  // `--selftest` used it — probe 16 calls `impl.assertSingleRepoScope` directly, in-process,
  // against synthetic fixtures. A production-reachable seam nothing exercises is exactly the
  // defect class `check-gate-wiring-defeats.mjs`'s own header comment describes closing: a
  // flag that lets a real invocation bypass the real check it exists to enforce. Manual
  // verification against a fixture (WP report) now calls `impl.assertSingleRepoScope` from a
  // one-off `node -e`, not through this CLI.
  const out = defaultExec('gh', ['api', 'installation/repositories']);
  const json = JSON.parse(out);
  try {
    impl.assertSingleRepoScope(json);
  } catch (err) {
    console.error(`::error::${err.message}`);
    process.exitCode = 1;
    return;
  }
  console.log(
    `✅ App installation scope verified: exactly one repository (${json.repositories[0].full_name}).`,
  );
}

// ── CLI: run (the real thing — requires GH_TOKEN via `gh`, GITHUB_REPOSITORY) ────────────

/**
 * Maps a `PromotionDecision` to the exact `gh`/`git` argv sequence that outcome performs
 * (research.md R23) — shared by `cliRun` and `--selftest`'s probe 17 (dry-run/recorded
 * invocation), which passes a recording `exec` instead of `defaultExec` and asserts the
 * resulting `calls` sequence. `no-op-missing-develop` and `refuse-diverged` perform none of
 * these calls by construction (they return before this function is even reached, in
 * `cliRun` — probe 17 asserts that directly). `no-op-in-sync` performs at most a
 * comment+close of a now-stale PR. `reuse-existing-pr` performs none here — merging (if
 * ready) happens later, in `pollAndMerge`. `supersede-and-open` closes the stale PR (with a
 * comment and a branch delete, R23) before doing what `open-new` does: push the tree-sync
 * commit's branch, then open the PR.
 */
export function applyOutcome(exec, repo, cwd, decision, developSha, trainSha) {
  switch (decision.outcome) {
    case 'no-op-missing-develop':
    case 'refuse-diverged':
      return { prNumber: null, prHeadSha: null };

    case 'no-op-in-sync':
      if (decision.existingPr) {
        commentOnPR(
          exec,
          repo,
          decision.existingPr.number,
          'develop already carries this tree — closing this now-stale promotion PR.',
        );
        closePR(exec, repo, decision.existingPr.number);
      }
      return { prNumber: null, prHeadSha: null };

    case 'reuse-existing-pr':
      return { prNumber: decision.existingPr.number, prHeadSha: decision.existingPr.headSha };

    case 'supersede-and-open':
    case 'open-new': {
      if (decision.outcome === 'supersede-and-open') {
        commentOnPR(
          exec,
          repo,
          decision.existingPr.number,
          `Superseded by a fresh tree-sync commit for ${trainSha} — the train moved again before ` +
            'this PR merged.',
        );
        closePR(exec, repo, decision.existingPr.number);
        // F1 (pre-merge squad, gate pass 2): defense in depth at the deletion call site
        // itself, on top of `findPromotionPRs`'s selection-time filter — a branch reaching
        // here that does NOT match the mechanism's own exact shape is never deleted,
        // whatever upstream code populated `existingPr`.
        if (PROMOTION_BRANCH_RE.test(decision.existingPr.branch)) {
          deleteBranch(exec, repo, decision.existingPr.branch);
        }
      }
      const newSha = impl.createTreeSyncCommit(cwd, {
        tree: decision.trainTree,
        parentSha: developSha,
        message: decision.commitMessage,
      });
      pushPromotionBranch(exec, cwd, decision.branchName, newSha);
      const prNumber = openPromotionPR(exec, repo, {
        branchName: decision.branchName,
        title: decision.commitMessage.split('\n')[0],
        body: decision.commitMessage,
      });
      return { prNumber, prHeadSha: newSha };
    }

    default:
      throw new Error(`unreachable PromotionDecision outcome: ${decision.outcome}`);
  }
}

/**
 * B2 (pre-merge squad, PR #429): re-reads `develop`'s LIVE tip immediately before merging —
 * `expectedParentSha` is `develop`'s tip AT DECISION TIME (the commit the promotion tree-sync
 * commit was parented on, or the tip an existing/reused PR was computed against). If it no
 * longer matches, this run refuses to merge over it (the next run recomputes and supersedes)
 * rather than trusting that nothing changed since the decision was made. `--match-head-commit`
 * (in `mergePR`) is a SEPARATE, narrower defense against the PR's own head branch changing —
 * see `scripts/lib/promote-github.mjs`'s corrected comment (B2) — neither one alone covers
 * `develop` moving underneath this run, which is what this explicit re-read closes.
 *
 * After a successful merge, `readDevelopTree` is compared against `trainTree` (passed in,
 * previously computed but never used for this) — a mismatch means the merge reported success
 * without producing the promised content, and exits non-zero rather than only printing a
 * notice nobody reads.
 */
async function pollAndMerge(exec, repo, cwd, prNumber, prHeadSha, expectedParentSha, trainTree) {
  // 10-minute bound (research.md R5, explicitly a provisional estimate pending recalibration
  // against the first real cycle — plan.md's Orchestrator Actions).
  const budgetMs = 10 * 60 * 1000;
  const start = Date.now();
  let delay = 5000;
  for (;;) {
    const status = viewPRMergeStatus(exec, repo, prNumber);
    const action = assessMergeReadiness(status);
    if (action === 'attempt-merge') {
      let liveDevelopSha;
      try {
        liveDevelopSha = liveRemoteTip(exec, 'origin', 'develop', cwd);
      } catch (err) {
        console.error(`::error::could not re-read develop's live tip before merging: ${err.message}`);
        process.exitCode = 1;
        return;
      }
      if (liveDevelopSha !== expectedParentSha) {
        console.error(
          `::error::develop's live tip (${liveDevelopSha}) no longer matches the parent this ` +
            `promotion commit was built on (${expectedParentSha}) — refusing to merge over it. ` +
            'The sweep/next run will recompute and supersede rather than lose whatever landed ' +
            'on develop in between (B2).',
        );
        process.exitCode = 1;
        return;
      }
      mergePR(exec, repo, prNumber, prHeadSha);
      const finalTree = readDevelopTree(exec, repo);
      if (finalTree !== trainTree) {
        console.error(
          `::error::post-merge tree assertion FAILED — develop^{tree} is ${finalTree}, expected ` +
            `${trainTree} (the promoted train tip's own tree). The merge reported success but ` +
            'did not produce the promised content (B2).',
        );
        process.exitCode = 1;
        return;
      }
      writeStepSummary(`- post-merge tree assertion: \`develop^{tree}\` = \`${finalTree}\` (matches train, verified)`);
      console.log(`::notice::merged PR #${prNumber}; develop^{tree} = ${finalTree} (verified against train)`);
      return;
    }
    if (action === 'recheck-divergence') {
      console.log(
        `::notice::PR #${prNumber} reports BEHIND — develop moved since this PR was opened. ` +
          'Leaving it for the sweep/next run to supersede rather than merging over it.',
      );
      return;
    }
    if (action === 'fail-anomaly') {
      throw new Error(
        `assessMergeReadiness reported fail-anomaly for PR #${prNumber}: ${JSON.stringify(status)}`,
      );
    }
    if (Date.now() - start >= budgetMs) {
      console.error(`::error::PR #${prNumber} did not become mergeable within the 10-minute budget.`);
      process.exitCode = 1;
      return;
    }
    await sleep(delay);
    delay = Math.min(delay * 2, 30000);
  }
}

/**
 * The per-cycle body `cliRun` drives, extracted so `--selftest` can probe it directly with a
 * recording `exec` and a real scratch `cwd` (never real `gh`/network calls) instead of only
 * exercising the pure `decidePromotion` function — M1 (pre-merge squad): the sweep must run
 * on EVERY outcome, "every run" (R22) meant literally, not only the ones that reach a PR. The
 * `finally` below is what makes that true regardless of which branch above it returns from.
 */
async function runCycle({ exec, repo, cwd, decision, developSha, trainSha, trainTree }) {
  try {
    writeStepSummary(renderDecisionSummary(decision));
    console.log(JSON.stringify(decision, null, 2));

    if (decision.outcome === 'no-op-missing-develop') {
      console.log('::notice::develop does not exist yet — no-op (FR-007(c)).');
      return;
    }
    if (decision.outcome === 'refuse-diverged') {
      console.error(`::error::refuse-diverged — ${decision.divergence?.reason}`);
      process.exitCode = 1;
      return;
    }
    if (decision.outcome === 'no-op-in-sync') {
      console.log('::notice::develop already matches the train tip — nothing to promote.');
    }
    if (decision.outcome === 'reuse-existing-pr') {
      console.log(`::notice::reusing existing, current promotion PR #${decision.existingPr.number}.`);
    }

    const { prNumber, prHeadSha } = applyOutcome(exec, repo, cwd, decision, developSha, trainSha);

    if (prNumber != null) {
      await pollAndMerge(exec, repo, cwd, prNumber, prHeadSha, developSha, trainTree);
    }
  } finally {
    // R22, M1: every run, including no-op-missing-develop and refuse-diverged above — a
    // stranded promote/* branch or a stale open PR does not care which outcome produced it.
    // B5: `openPRs` is base-develop only (closing/commenting is only ever this mechanism's
    // own PRs); `protectedBranches` covers a `promote/<40-hex>`-shaped branch with an open PR
    // to ANY OTHER base, which must never be deleted even though it matches the exact shape.
    const finalPRs = findPromotionPRs(listOpenPRsBaseDevelop(exec, repo));
    const anyBasePromotionPRs = listOpenPromotionHeadPRsAnyBase(exec, repo);
    const allBranches = listPromotionBranches(exec, repo);
    const protectedBranches = new Set(
      anyBasePromotionPRs.filter((pr) => pr.baseRefName !== 'develop').map((pr) => pr.headRefName),
    );
    const sweepRows = sweepPromotionNamespace(exec, repo, { openPRs: finalPRs, allBranches, protectedBranches });
    for (const row of sweepRows) console.log(`::notice::sweep: ${JSON.stringify(row)}`);
  }
}

async function cliRun() {
  const repo = requireEnv('GITHUB_REPOSITORY');
  const sourceRef = process.env.PROMOTE_SOURCE_REF || 'train/elements-first';
  const cwd = process.cwd();
  const exec = defaultExec;

  // M8 (pre-merge squad): the workflow's own `if:` hardcodes a push to `train/elements-first`
  // as the ONLY thing that triggers this job — `PROMOTE_DEVELOP_SOURCE_BRANCH` is honoured
  // only for this script's INTERNAL notion of "what is the train tip" (research.md R17), never
  // as a way to widen which push is allowed to promote. If the variable and the ref that
  // actually triggered this run ever disagree, promoting from the variable's content would
  // promote a branch this job's own trigger was never scoped to gate. Fail closed rather than
  // silently trusting the variable over the trigger.
  // F11 (pre-merge squad, gate pass 2): required, like GITHUB_REPOSITORY already is — the
  // earlier `if (triggeringRef && ...)` failed OPEN when GITHUB_REF_NAME was unset (skipping
  // the whole guard silently) instead of failing closed on a run mode that cannot tell what
  // triggered it. GitHub Actions sets this automatically for every push-triggered run; its
  // absence means something is genuinely wrong with the invocation, not a legitimate case to
  // let through.
  const triggeringRef = requireEnv('GITHUB_REF_NAME');
  if (triggeringRef !== sourceRef) {
    console.error(
      `::error::PROMOTE_SOURCE_REF ("${sourceRef}") does not match GITHUB_REF_NAME ` +
        `("${triggeringRef}", the ref that actually triggered this run) — refusing to promote ` +
        "from a branch this job's own push trigger is not scoped to. Changing the source " +
        'requires updating BOTH the variable and the workflow trigger together ' +
        "(branch-model.md's source-branch cutover caveat), never the variable alone.",
    );
    process.exitCode = 1;
    return;
  }

  // M7 (pre-merge squad): fetch the source ref (and develop, best-effort) before any LOCAL git
  // operation assumes their tip commit is already present — a race where either branch moved
  // again between the triggering push and this checkout would otherwise crash
  // `listFirstParentShas`/`git commit-tree` with an opaque "bad object" error instead of
  // either fetching what is needed or failing with a clear message.
  try {
    execFileSync('git', ['fetch', '--quiet', 'origin', sourceRef], { cwd, encoding: 'utf8' });
  } catch (err) {
    console.error(`::error::could not fetch ${sourceRef} from origin: ${err.message}`);
    process.exitCode = 1;
    return;
  }
  try {
    execFileSync('git', ['fetch', '--quiet', 'origin', 'develop'], { cwd, encoding: 'utf8' });
  } catch {
    // develop may genuinely not exist yet — the ls-remote-based absence check below is what
    // actually decides that; a fetch failure here is not itself the signal.
  }

  const trainSha = liveRemoteTip(exec, 'origin', sourceRef, cwd);
  const trainTree = resolveTreeForSha(cwd, trainSha, exec, repo);

  let developSha = null;
  let developTree = null;
  try {
    developSha = liveRemoteTip(exec, 'origin', 'develop', cwd);
    developTree = resolveTreeForSha(cwd, developSha, exec, repo);
  } catch {
    developSha = null;
    developTree = null;
  }

  const promotionPRs = findPromotionPRs(listOpenPRsBaseDevelop(exec, repo));
  const sortedPRs = [...promotionPRs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const newestRaw = sortedPRs[0] ?? null;
  const existingPr = newestRaw
    ? {
        number: newestRaw.number,
        headSha: newestRaw.headRefOid,
        headTree: resolveTreeForSha(cwd, newestRaw.headRefOid, exec, repo),
        branch: newestRaw.headRefName,
        createdAt: newestRaw.createdAt,
      }
    : null;

  let developHealthy = null;
  let divergence = null;
  if (developSha) {
    const trainFirstParentShas = listFirstParentShas(cwd, trainSha);
    const trailerLookup = makeTrailerLookup(cwd);
    developHealthy = impl.isDevelopHealthy(developSha, trainFirstParentShas, trailerLookup);
    if (!developHealthy) divergence = computeDivergenceReason(developSha, trailerLookup);
  }

  const decision = impl.decidePromotion({
    trainSha,
    trainTree,
    developSha,
    developTree,
    existingPr,
    developHealthy,
    divergence,
  });

  await runCycle({ exec, repo, cwd, decision, developSha, trainSha, trainTree });
}

// ── --selftest (T003/IC-03): the probe table, floor outside the table, mutation controls ──
//
// F9 (pre-merge squad, gate pass 2): this banner used to restate a probe count ("18 probes")
// that drifted from the shipped table more than once. `PROBE_FLOOR` below and `selftest()`'s
// own summary line derive and print the real count at run time — see those, not a number
// re-typed here, for how many probes actually exist right now.
//
// contracts/promotion-script.contract.md is authoritative for the shape and numbering below.
// Every probe runs against a FRESH scratch git repository (`mkdtempSync`), identity set via
// `GIT_AUTHOR_*`/`GIT_COMMITTER_*` environment variables — never `git config --global`, which
// a CI runner has none of and a developer's own workstation has real ones that must not be
// touched (research.md R14). **Corrected (B1, pre-merge squad)**: this used to claim every
// git call carried those vars individually; `scratchRepo()`'s own `git()` wrapper does, but
// `createTreeSyncCommit`/`impl.createTreeSyncCommit` (called directly, not through that
// wrapper, at every `promote/*`-branch-building call site) did not, and inherited whatever
// git identity happened to be configured globally on the machine running this process — real
// on a workstation, absent on a bare CI runner, which is exactly how this shipped green
// locally and red in CI at PR #429's head. Fixed at the one choke point that actually reaches
// every git call in this file: `selftest()` sets all four vars on `process.env` itself before
// running any probe.

function scratchRepo() {
  const dir = mkdtempSync(join(tmpdir(), 'promote-develop-selftest-'));
  const identEnv = {
    GIT_AUTHOR_NAME: 'selftest',
    GIT_AUTHOR_EMAIL: 'selftest@example.invalid',
    GIT_COMMITTER_NAME: 'selftest',
    GIT_COMMITTER_EMAIL: 'selftest@example.invalid',
  };
  const git = (args) =>
    execFileSync('git', args, { cwd: dir, encoding: 'utf8', env: { ...process.env, ...identEnv } });
  git(['init', '-q']);
  git(['commit', '-q', '--allow-empty', '-m', 'chore: seed']);
  const commit = (file, content, message) => {
    writeFileSync(join(dir, file), content);
    git(['add', file]);
    git(['commit', '-q', '-m', message]);
    return git(['rev-parse', 'HEAD']).trim();
  };
  const cleanup = () => rmSync(dir, { recursive: true, force: true });
  return { dir, git, commit, cleanup };
}

function tipOf(git, ref) {
  return { sha: git(['rev-parse', ref]).trim(), tree: git(['rev-parse', `${ref}^{tree}`]).trim() };
}

/** Fresh in-process, non-monkey-patched divergence scenario, shared by probes 9 and 12 so
 *  probe 12's mutation control exercises the SAME scenario probe 9 proves the real code
 *  handles correctly. */
function buildDivergedScenario({ withExistingPr }) {
  const { dir, git, commit, cleanup } = scratchRepo();
  const seed = tipOf(git, 'HEAD');
  commit('a.txt', 'a', 'chore: a');
  const train = tipOf(git, 'HEAD');
  const trainFirstParentShas = git(['rev-list', '--first-parent', 'HEAD']).trim().split('\n');
  // develop branches from the SEED (a legitimate cut point) and then gets an unrelated,
  // out-of-band commit — never on train's first-parent history, no Train-SHA trailer.
  git(['checkout', '-q', '-b', 'develop', seed.sha]);
  const developSha = commit('b.txt', 'unrelated', 'an out-of-band direct commit');
  const developTree = tipOf(git, 'develop').tree;
  const trailerLookup = makeTrailerLookup(dir);
  const existingPr = withExistingPr
    ? {
        number: 42,
        headSha: 'f'.repeat(40),
        headTree: '0'.repeat(40), // deliberately not trainTree — a stale existing PR
        branch: 'promote/stale',
        createdAt: new Date().toISOString(),
      }
    : null;
  return {
    cleanup,
    trainSha: train.sha,
    trainTree: train.tree,
    developSha,
    developTree,
    trainFirstParentShas,
    trailerLookup,
    existingPr,
  };
}

/** Runs a real two-cycle tree-sync promotion end to end through `impl.createTreeSyncCommit`
 *  (so probe 11's mutation control, which patches that same slot, is exercised by this exact
 *  code path — never a second, hand-written simulation). Returns whether every postcondition
 *  named in probe 4 held: `develop^{tree}` matches the current train tree, each promoted
 *  commit has exactly one parent, and each carries a correctly-resolving `Train-SHA:` trailer. */
function runTwoCyclePostcondition() {
  const { dir, git, commit, cleanup } = scratchRepo();
  try {
    // Cycle 1.
    commit('a.txt', 'a', 'chore: a');
    const train1 = tipOf(git, 'HEAD');
    let developTip = tipOf(git, 'HEAD~1'); // the seed commit is develop's cut point
    const msg1 = buildCommitMessage(train1.sha);
    const promo1 = impl.createTreeSyncCommit(dir, {
      tree: train1.tree,
      parentSha: developTip.sha,
      message: msg1,
    });
    git(['update-ref', 'refs/heads/develop', promo1]);

    // Cycle 2 — train advances again, including a change to the SAME line the promoted
    // commit also touched (contract's own scenario framing).
    commit('a.txt', 'a2', 'chore: a again');
    const train2 = tipOf(git, 'HEAD');
    const msg2 = buildCommitMessage(train2.sha);
    const promo2 = impl.createTreeSyncCommit(dir, { tree: train2.tree, parentSha: promo1, message: msg2 });
    git(['update-ref', 'refs/heads/develop', promo2]);

    const finalTree = git(['rev-parse', 'develop^{tree}']).trim();
    const treeMatches = finalTree === train2.tree;

    const parentsOf = (sha) => git(['log', '-1', '--format=%P', sha]).trim();
    const onlyOneParentEach =
      parentsOf(promo1).split(/\s+/).filter(Boolean).length === 1 &&
      parentsOf(promo2).split(/\s+/).filter(Boolean).length === 1;

    const trailerLookup = makeTrailerLookup(dir);
    const t1 = trailerLookup(promo1);
    const t2 = trailerLookup(promo2);
    const trailersCorrect =
      !!t1 && t1.trainSha === train1.sha && t1.matches === true &&
      !!t2 && t2.trainSha === train2.sha && t2.matches === true;

    return treeMatches && onlyOneParentEach && trailersCorrect;
  } finally {
    cleanup();
  }
}

/** Probe 5's scenario: the withdrawn squash approach really does conflict from the second
 *  promotion cycle on (spec.md's Decision item 5, "Verifying the git mechanics"). Returns
 *  `true` only if the SECOND merge both exits non-zero AND leaves the merge unresolved —
 *  both conditions checked, not just the exit code (contract's own tightening). */
function runSquashConflictScenario() {
  const { dir, git, commit, cleanup } = scratchRepo();
  try {
    commit('file.txt', 'a', 'chore: a');
    git(['branch', 'train']);
    git(['checkout', '-q', '-b', 'develop']);
    git(['checkout', '-q', 'train']);
    commit('file.txt', 'b', 'chore: b (train advances)');
    // Cycle 1: squash-merge train into develop.
    git(['checkout', '-q', 'develop']);
    git(['merge', '--squash', 'train']);
    git(['commit', '-q', '-m', 'chore: squash promotion 1']);
    // Train advances again, touching the SAME line.
    git(['checkout', '-q', 'train']);
    commit('file.txt', 'c', 'chore: c (train advances again)');
    git(['checkout', '-q', 'develop']);
    let exitCode = 0;
    try {
      git(['merge', 'train']);
    } catch (err) {
      exitCode = err.status ?? 1;
    }
    let unresolved = false;
    try {
      const unmerged = git(['ls-files', '-u']).trim();
      unresolved = unmerged.length > 0;
    } catch {
      unresolved = false;
    }
    if (exitCode !== 0) {
      try {
        git(['merge', '--abort']);
      } catch {
        // best-effort cleanup only
      }
    }
    return exitCode !== 0 && unresolved;
  } finally {
    cleanup();
  }
}

function makeRecordingExec({ prNumber = 101 } = {}) {
  const calls = [];
  let created = 0;
  const exec = (file, args) => {
    calls.push([file, ...(args ?? [])]);
    if (file === 'gh' && args?.[0] === 'pr' && args?.[1] === 'create') {
      created += 1;
      return `https://github.com/spec-kitty/spec-kitty-design/pull/${prNumber + created - 1}\n`;
    }
    // Every list-shaped read (`gh pr list`, `gh api .../matching-refs/...`) defaults to an
    // empty JSON array — callers that need a non-empty list build their OWN exec (as probe
    // 17/20 do) rather than this shared default having to anticipate every scenario.
    if (file === 'gh' && args?.[0] === 'pr' && args?.[1] === 'list') return '[]';
    if (file === 'gh' && args?.[0] === 'api' && String(args?.[1] ?? '').includes('matching-refs')) return '[]';
    return '';
  };
  return { exec, calls };
}

async function runProbes() {
  const results = [];
  /**
   * M4 (pre-merge squad): `ok` is DERIVED from `expect` and `succeeded` here — never passed in
   * pre-computed — so relabelling a probe's `expect` without changing what it measures
   * actually flips its `ok`, instead of leaving a `record()` call that got the polarity
   * label wrong but still reports green. `succeeded` always means "the thing under test
   * behaved as it would with NOTHING mutated / nothing wrong" — for a normal `expect: 'pass'`
   * probe that IS the assertion; for an `expect: 'fail'` mutation control or product-defect
   * probe, `succeeded` still means "behaved as if unmutated" (bad — the point is proving it
   * does NOT), so `ok = succeeded === false` there. `justification: true` (probe 5 only)
   * excludes a probe from the degenerate-set polarity count below without exempting it from
   * the per-probe match requirement — it tests `git`'s own merge behaviour, not this
   * mechanism's product code, so it does not count as evidence that a REAL negative case in
   * THIS product is exercised.
   */
  const record = (n, name, expect, succeeded, detail, { justification = false } = {}) => {
    const ok = expect === 'pass' ? succeeded === true : succeeded === false;
    results.push({ n, name, expect, ok, succeeded, detail, justification });
  };

  // Probe 1 — missing develop.
  {
    const s = scratchRepo();
    try {
      const decision = impl.decidePromotion({
        trainSha: tipOf(s.git, 'HEAD').sha,
        trainTree: tipOf(s.git, 'HEAD').tree,
        developSha: null,
        developTree: null,
        existingPr: null,
        developHealthy: null,
        divergence: null,
      });
      let throwsWithoutFlag = false;
      try {
        impl.readRefTip(s.dir, 'develop');
      } catch {
        throwsWithoutFlag = true;
      }
      const nullWithFlag = impl.readRefTip(s.dir, 'develop', { confirmedAbsent: true }) === null;
      record(
        1,
        'missing develop',
        'pass',
        decision.outcome === 'no-op-missing-develop' && throwsWithoutFlag && nullWithFlag,
        { outcome: decision.outcome, throwsWithoutFlag, nullWithFlag },
      );
    } finally {
      s.cleanup();
    }
  }

  // Probe 2 — already in sync, no PR; re-run with no change still in sync (NFR-003).
  {
    const s = scratchRepo();
    try {
      s.git(['branch', 'develop']);
      const train = tipOf(s.git, 'HEAD');
      const develop = tipOf(s.git, 'develop');
      const inputs = {
        trainSha: train.sha,
        trainTree: train.tree,
        developSha: develop.sha,
        developTree: develop.tree,
        existingPr: null,
        developHealthy: true,
        divergence: null,
      };
      const first = impl.decidePromotion(inputs);
      const second = impl.decidePromotion(inputs);
      record(
        2,
        'already in sync, no PR (re-run stays in sync)',
        'pass',
        first.outcome === 'no-op-in-sync' && second.outcome === 'no-op-in-sync',
        { first: first.outcome, second: second.outcome },
      );
    } finally {
      s.cleanup();
    }
  }

  // Probe 3 — fresh promotion, parent is exact.
  {
    const s = scratchRepo();
    try {
      const seed = tipOf(s.git, 'HEAD');
      s.git(['branch', 'develop']);
      s.commit('a.txt', 'a', 'chore: a');
      const train = tipOf(s.git, 'HEAD');
      const decision = impl.decidePromotion({
        trainSha: train.sha,
        trainTree: train.tree,
        developSha: seed.sha,
        developTree: seed.tree,
        existingPr: null,
        developHealthy: true,
        divergence: null,
      });
      const newSha = impl.createTreeSyncCommit(s.dir, {
        tree: decision.trainTree,
        parentSha: seed.sha,
        message: decision.commitMessage,
      });
      const newTree = s.git(['rev-parse', `${newSha}^{tree}`]).trim();
      const parents = s.git(['log', '-1', '--format=%P', newSha]).trim();
      record(
        3,
        'fresh promotion, parent is exact',
        'pass',
        decision.outcome === 'open-new' && newTree === train.tree && parents === seed.sha,
        { outcome: decision.outcome, newTree, trainTree: train.tree, parents, seedSha: seed.sha },
      );
    } finally {
      s.cleanup();
    }
  }

  // Probe 4 — two-cycle tree-sync, full postcondition.
  {
    const held = runTwoCyclePostcondition();
    record(4, 'two-cycle tree-sync, full postcondition', 'pass', held === true, { held });
  }

  // Probe 5 — two-cycle squash DOES conflict (JUSTIFICATION probe, expect: 'fail' on purpose —
  // M4: this tests git's own merge behaviour, not this mechanism's product code, so it is
  // excluded from the degenerate-set polarity count in selftest() even though it must still
  // match its own declared expectation like every other probe).
  {
    const conflicted = runSquashConflictScenario();
    // succeeded = "the squash approach behaved fine, no conflict" — we WANT this false.
    record(
      5,
      "two-cycle squash conflicts — Option D's justification (expect: 'fail' on purpose)",
      'fail',
      conflicted === false,
      { conflicted },
      { justification: true },
    );
  }

  // Probe 6 — existing PR, tree still current.
  {
    const s = scratchRepo();
    try {
      s.git(['branch', 'develop']);
      s.commit('a.txt', 'a', 'chore: a');
      const train = tipOf(s.git, 'HEAD');
      const develop = tipOf(s.git, 'develop');
      const existingPr = {
        number: 7,
        headSha: 'a'.repeat(40),
        headTree: train.tree,
        branch: `promote/${train.sha}`,
        createdAt: new Date().toISOString(),
      };
      const decision = impl.decidePromotion({
        trainSha: train.sha,
        trainTree: train.tree,
        developSha: develop.sha,
        developTree: develop.tree,
        existingPr,
        developHealthy: true,
        divergence: null,
      });
      record(6, 'existing PR, tree still current -> reuse', 'pass', decision.outcome === 'reuse-existing-pr', {
        outcome: decision.outcome,
      });
    } finally {
      s.cleanup();
    }
  }

  // Probe 7 — existing PR, train moved again.
  {
    const s = scratchRepo();
    try {
      s.git(['branch', 'develop']);
      s.commit('a.txt', 'a', 'chore: a');
      const train = tipOf(s.git, 'HEAD');
      const develop = tipOf(s.git, 'develop');
      const existingPr = {
        number: 8,
        headSha: 'b'.repeat(40),
        headTree: '1'.repeat(40),
        branch: 'promote/stale',
        createdAt: new Date().toISOString(),
      };
      const decision = impl.decidePromotion({
        trainSha: train.sha,
        trainTree: train.tree,
        developSha: develop.sha,
        developTree: develop.tree,
        existingPr,
        developHealthy: true,
        divergence: null,
      });
      record(
        7,
        'existing PR, train moved again -> supersede',
        'pass',
        decision.outcome === 'supersede-and-open',
        { outcome: decision.outcome },
      );
    } finally {
      s.cleanup();
    }
  }

  // Probe 8 — message format via real commitlint (dynamic import only) + the companion
  // child-process assertion that `run` mode's module graph never depends on @commitlint/*.
  {
    const sha = '0123456789abcdef0123456789abcdef01234567';
    const message = buildCommitMessage(sha);
    const lines = message.split('\n');
    const allUnder100 = lines.every((l) => l.length <= 100);

    const { default: lint } = await import('@commitlint/lint');
    const { default: load } = await import('@commitlint/load');
    const config = await load({}, { cwd: process.cwd() });
    const result = await lint(message, config.rules, {
      defaultIgnores: config.defaultIgnores,
      helpUrl: config.helpUrl,
      ignores: config.ignores,
      parserOpts: config.parserPreset?.parserOpts,
      plugins: config.plugins,
    });

    // Companion: copy JUST this file and its one local import into an isolated temp
    // directory with NO node_modules of its own. Node's module resolution walks up the
    // directory tree from the importing file's own location looking for node_modules — a
    // copy living outside this repository's tree therefore cannot resolve `@commitlint/*`
    // even though the real repo's node_modules has it. If `run` mode's module graph
    // statically imported `@commitlint/*` anywhere, loading the file there would throw
    // ERR_MODULE_NOT_FOUND before `run` even reached its own "GITHUB_REPOSITORY is not set"
    // error — which is exactly the failure this asserts does NOT happen.
    const isolated = mkdtempSync(join(tmpdir(), 'promote-develop-dryrun-'));
    let companionOk = false;
    let companionDetail = '';
    try {
      mkdirSync(join(isolated, 'scripts', 'lib'), { recursive: true });
      writeFileSync(join(isolated, 'scripts', 'promote-develop.mjs'), readFileSync(__filename, 'utf8'));
      writeFileSync(
        join(isolated, 'scripts', 'lib', 'promote-github.mjs'),
        readFileSync(join(__dirname, 'lib', 'promote-github.mjs'), 'utf8'),
      );
      try {
        execFileSync(process.execPath, [join(isolated, 'scripts', 'promote-develop.mjs'), 'run'], {
          encoding: 'utf8',
          env: { ...process.env, GITHUB_REPOSITORY: '' },
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        companionDetail = 'run mode exited 0 unexpectedly with GITHUB_REPOSITORY unset';
      } catch (err) {
        const stderr = String(err.stderr ?? '');
        companionDetail = stderr.slice(0, 300);
        companionOk =
          stderr.includes('GITHUB_REPOSITORY is not set') &&
          !/cannot find (package|module) '@commitlint/i.test(stderr) &&
          !/ERR_MODULE_NOT_FOUND/.test(stderr.replace(/promote-develop\.mjs|promote-github\.mjs/g, ''));
      }
    } finally {
      rmSync(isolated, { recursive: true, force: true });
    }

    record(
      8,
      'commit message format, real commitlint, dynamic-import-only, run has no @commitlint dependency',
      'pass',
      result.valid === true && allUnder100 && companionOk,
      { valid: result.valid, errors: result.errors, allUnder100, companionOk, companionDetail },
    );
  }

  // Probe 9 — diverged develop: unrelated direct commit. Checked BOTH with no existing PR
  // and with one present (headTree != trainTree, which by itself would otherwise select
  // supersede-and-open) — divergence must win regardless, which is exactly the branch-ORDER
  // property a real (not probe-local) reordering of `decidePromotion` would break, so this is
  // also the probe a manual "temporarily reorder the real function" check reds on.
  for (const [n, withExistingPr, label] of [
    [9, false, 'no existing PR'],
    [10, true, 'with a stale existing PR (divergence must still win)'],
  ]) {
    const scenario = buildDivergedScenario({ withExistingPr });
    try {
      const healthy = impl.isDevelopHealthy(
        scenario.developSha,
        scenario.trainFirstParentShas,
        scenario.trailerLookup,
      );
      const divergence = healthy ? null : computeDivergenceReason(scenario.developSha, scenario.trailerLookup);
      const decision = impl.decidePromotion({
        trainSha: scenario.trainSha,
        trainTree: scenario.trainTree,
        developSha: scenario.developSha,
        developTree: scenario.developTree,
        existingPr: scenario.existingPr,
        developHealthy: healthy,
        divergence,
      });
      record(
        n,
        `diverged develop: unrelated direct commit -> refuse-diverged (${label})`,
        'pass',
        healthy === false &&
          decision.outcome === 'refuse-diverged' &&
          !!decision.divergence?.reason?.includes(scenario.developSha),
        { healthy, outcome: decision.outcome, divergence: decision.divergence },
      );
    } finally {
      scenario.cleanup();
    }
  }

  // Probe 11 — develop moves between PR-open and merge-attempt: re-check divergence, never
  // merge over it. `assessMergeReadiness`'s BEHIND handling is the general case (probe 14);
  // this probe demonstrates the end-to-end consequence against a real, mutated git state: an
  // `open-new` decision's premise (develop's tip at PR-open time) is invalidated by a
  // concurrent write, and re-deciding against the NEW tip never reuses/merges blindly.
  {
    const s = scratchRepo();
    try {
      const seed = tipOf(s.git, 'HEAD');
      s.git(['branch', 'develop']);
      s.commit('a.txt', 'a', 'chore: a');
      const train = tipOf(s.git, 'HEAD');
      // open-new computed against develop's tip AT OPEN TIME (the seed).
      const openDecision = impl.decidePromotion({
        trainSha: train.sha,
        trainTree: train.tree,
        developSha: seed.sha,
        developTree: seed.tree,
        existingPr: null,
        developHealthy: true,
        divergence: null,
      });
      const promoSha = impl.createTreeSyncCommit(s.dir, {
        tree: openDecision.trainTree,
        parentSha: seed.sha,
        message: openDecision.commitMessage,
      });
      // Simulate a concurrent write: develop moves to an unrelated commit before the merge
      // attempt runs, WITHOUT going through this mechanism (no Train-SHA trailer).
      s.git(['checkout', '-q', 'develop']);
      const concurrentSha = s.commit('z.txt', 'concurrent', 'an out-of-band write while the PR was open');
      const trailerLookup = makeTrailerLookup(s.dir);
      const stillHealthy = impl.isDevelopHealthy(concurrentSha, [seed.sha, train.sha], trailerLookup);
      const divergence = stillHealthy ? null : computeDivergenceReason(concurrentSha, trailerLookup);
      const recheck = impl.decidePromotion({
        trainSha: train.sha,
        trainTree: train.tree,
        developSha: concurrentSha,
        developTree: s.git(['rev-parse', 'develop^{tree}']).trim(),
        existingPr: { number: 9, headSha: promoSha, headTree: train.tree, branch: openDecision.branchName, createdAt: new Date().toISOString() },
        developHealthy: stillHealthy,
        divergence,
      });
      record(
        11,
        'develop moves between PR-open and merge-attempt -> re-check divergence, never merge over it',
        'pass',
        stillHealthy === false && recheck.outcome === 'refuse-diverged',
        { stillHealthy, outcome: recheck.outcome },
      );
    } finally {
      s.cleanup();
    }
  }

  // Probe 12 — mutation control: broken createTreeSyncCommit. Monkey-patches the REAL,
  // already-loaded `impl.createTreeSyncCommit` and re-runs probe 4's own postcondition
  // helper (never a second, hand-written simulation) — the postcondition MUST now fail.
  {
    const original = impl.createTreeSyncCommit;
    impl.createTreeSyncCommit = (cwd, opts) => {
      // Deliberately build the WRONG tree — the empty tree, never the one requested.
      const emptyTree = execFileSync('git', ['hash-object', '-t', 'tree', '--stdin'], {
        cwd,
        input: '',
        encoding: 'utf8',
      }).trim();
      return original(cwd, { ...opts, tree: emptyTree });
    };
    let held;
    try {
      held = runTwoCyclePostcondition();
    } finally {
      impl.createTreeSyncCommit = original;
    }
    // succeeded = "the postcondition held despite the mutation" — we WANT this false (caught).
    record(12, 'mutation control: broken createTreeSyncCommit is caught', 'fail', held === true, { held });
  }

  // Probe 13 — mutation control: reordered decision RULES (M2, pre-merge squad — REWORKED).
  // The earlier version of this probe hand-reimplemented `decidePromotion`'s entire body with
  // the reorder baked in — precisely the "second, hand-written simulated defeat" the contract
  // rules out, and it tested the REIMPLEMENTATION, not the product. This version instead
  // reorders `impl.decisionRules` itself — the REAL, already-loaded rule functions
  // `decidePromotion` iterates (see the DEFAULT_DECISION_RULES definition above) — by moving
  // `ruleDiverged` to run AFTER `ruleReuse`/`ruleSupersede`, then re-runs probe 10's own
  // diverged-with-existing-PR scenario through the REAL `impl.decidePromotion`.
  {
    const original = impl.decisionRules;
    const reordered = [...original];
    const divergedIndex = reordered.indexOf(ruleDiverged);
    const supersedeIndex = reordered.indexOf(ruleSupersede);
    if (divergedIndex === -1 || supersedeIndex === -1) {
      throw new Error('probe 13: could not locate ruleDiverged/ruleSupersede in impl.decisionRules — the array shape changed');
    }
    const [divergedRule] = reordered.splice(divergedIndex, 1);
    reordered.splice(reordered.indexOf(ruleSupersede) + 1, 0, divergedRule);
    impl.decisionRules = reordered;

    let mutatedOutcome;
    const scenario = buildDivergedScenario({ withExistingPr: true });
    try {
      const healthy = impl.isDevelopHealthy(
        scenario.developSha,
        scenario.trainFirstParentShas,
        scenario.trailerLookup,
      );
      mutatedOutcome = impl.decidePromotion({
        trainSha: scenario.trainSha,
        trainTree: scenario.trainTree,
        developSha: scenario.developSha,
        developTree: scenario.developTree,
        existingPr: scenario.existingPr,
        developHealthy: healthy,
        divergence: healthy ? null : computeDivergenceReason(scenario.developSha, scenario.trailerLookup),
      }).outcome;
    } finally {
      scenario.cleanup();
      impl.decisionRules = original;
    }
    // succeeded = "still correctly refused despite the reorder" — we WANT this false (caught).
    record(13, 'mutation control: reordered decision rules is caught', 'fail', mutatedOutcome === 'refuse-diverged', {
      mutatedOutcome,
    });
  }

  // Probe 14 — assessMergeReadiness, all seven documented states + null.
  {
    const cases = [
      [{ mergeable: null, mergeStateStatus: null }, 'poll-again'],
      [{ mergeable: true, mergeStateStatus: 'CLEAN' }, 'attempt-merge'],
      [{ mergeable: true, mergeStateStatus: 'HAS_HOOKS' }, 'attempt-merge'],
      [{ mergeable: true, mergeStateStatus: 'UNSTABLE' }, 'attempt-merge'],
      [{ mergeable: true, mergeStateStatus: 'BLOCKED' }, 'poll-again'],
      [{ mergeable: true, mergeStateStatus: 'UNKNOWN' }, 'poll-again'],
      [{ mergeable: true, mergeStateStatus: 'BEHIND' }, 'recheck-divergence'],
      [{ mergeable: false, mergeStateStatus: 'DIRTY' }, 'fail-anomaly'],
    ];
    const outcomes = cases.map(([input, expected]) => ({
      input,
      expected,
      actual: impl.assessMergeReadiness(input),
    }));
    const allMatch = outcomes.every((o) => o.actual === o.expected);
    record(14, 'assessMergeReadiness: all documented states + null', 'pass', allMatch, outcomes);
  }

  // Probe 15 — findPromotionPRs: 0, 1, 2+, AND (F1, pre-merge squad gate pass 2) a
  // loosely-`promote/`-prefixed human branch is never adopted even when it is the only entry.
  {
    const shaped = (n) => `promote/${String(n).repeat(40).slice(0, 40)}`;
    const zero = impl.findPromotionPRs([{ headRefName: 'other' }]);
    const one = impl.findPromotionPRs([{ headRefName: 'other' }, { headRefName: shaped('a') }]);
    const two = impl.findPromotionPRs([
      { headRefName: shaped('a') },
      { headRefName: shaped('b') },
      { headRefName: 'other' },
    ]);
    // F1: `promote/my-feature` (a real, human-plausible branch name) does NOT match the exact
    // `promote/<40-hex>` shape and must never be adopted, whatever else is in the list.
    const humanBranchExcluded = impl.findPromotionPRs([{ headRefName: 'promote/my-feature' }]).length === 0;
    const humanBranchExcludedAlongsideReal = impl
      .findPromotionPRs([{ headRefName: 'promote/my-feature' }, { headRefName: shaped('c') }])
      .every((pr) => pr.headRefName === shaped('c'));
    const ok =
      zero.length === 0 &&
      one.length === 1 &&
      two.length === 2 &&
      humanBranchExcluded &&
      humanBranchExcludedAlongsideReal;
    record(15, 'findPromotionPRs: 0, 1, 2+, and a loosely-prefixed human branch is never adopted (F1)', 'pass', ok, {
      zero: zero.length,
      one: one.length,
      two: two.length,
      humanBranchExcluded,
      humanBranchExcludedAlongsideReal,
    });
  }

  // Probe 16 — assertSingleRepoScope: 0, 1-correct, 1-wrong, 2+.
  {
    const fixtures = {
      zero: { repositories: [] },
      oneCorrect: { repositories: [{ full_name: 'spec-kitty/spec-kitty-design' }] },
      oneWrong: { repositories: [{ full_name: 'spec-kitty/other-repo' }] },
      twoPlus: {
        repositories: [
          { full_name: 'spec-kitty/spec-kitty-design' },
          { full_name: 'spec-kitty/other-repo' },
        ],
      },
    };
    const outcomes = {};
    for (const [name, fixture] of Object.entries(fixtures)) {
      try {
        impl.assertSingleRepoScope(fixture);
        outcomes[name] = 'accepted';
      } catch {
        outcomes[name] = 'rejected';
      }
    }
    const ok =
      outcomes.zero === 'rejected' &&
      outcomes.oneCorrect === 'accepted' &&
      outcomes.oneWrong === 'rejected' &&
      outcomes.twoPlus === 'rejected';
    record(16, 'assertSingleRepoScope: 0, 1-correct, 1-wrong, 2+', 'pass', ok, outcomes);
  }

  // Probe 17 — promote/* sweep: two open PRs (oldest superseded, newest kept), one branch
  // with no PR (deleted), a simulated delete failure reported as a named, non-fatal row, and
  // (B5, pre-merge squad) a branch with an open PR to a DIFFERENT base — protected, never
  // deleted, plus the exact-shape regex itself (`promote/<40-hex>`, never a loose prefix).
  {
    // V4 (pre-merge squad, gate pass 4): boundary assertions — a loosened regex like
    // `promote/[0-9a-f]{7,40}` (still "looks right", still passes a casual read) left this
    // suite green before this. 39-hex (one short) and 41-hex (one long) must BOTH be
    // rejected, not just the exact 40-hex shape accepted and an unrelated human name refused.
    const shapeOk =
      PROMOTION_BRANCH_RE.test(`promote/${'0'.repeat(40)}`) &&
      !PROMOTION_BRANCH_RE.test('promote/my-feature') &&
      !PROMOTION_BRANCH_RE.test(`promote/${'0'.repeat(39)}`) &&
      !PROMOTION_BRANCH_RE.test(`promote/${'0'.repeat(41)}`);

    const now = Date.now();
    const openPRs = [
      { number: 10, headRefName: 'promote/aaa', createdAt: new Date(now - 100000).toISOString() },
      { number: 11, headRefName: 'promote/bbb', createdAt: new Date(now).toISOString() },
    ];
    const allBranches = ['promote/aaa', 'promote/bbb', 'promote/ccc', 'promote/ddd'];
    // B5: promote/ddd has no open base-develop PR (absent from `openPRs`) but DOES have an
    // open PR to a different base (a human's own branch that happens to match the shape) —
    // it must survive the sweep untouched.
    const protectedBranches = new Set(['promote/ddd']);
    let failDelete = false;
    const calls = [];
    const exec = (file, args) => {
      calls.push([file, ...(args ?? [])]);
      if (file === 'gh' && args?.[0] === 'api' && args?.[1] === '-X' && args?.[2] === 'DELETE') {
        if (String(args[3]).includes('ccc') && failDelete) throw new Error('simulated delete failure');
      }
      return '';
    };
    const rows1 = sweepPromotionNamespace(exec, 'spec-kitty/spec-kitty-design', { openPRs, allBranches, protectedBranches });
    const closedOldest = rows1.some((r) => r.action === 'closed' && r.number === 10);
    const keptNewest = !rows1.some((r) => r.action === 'closed' && r.number === 11);
    const deletedCcc = rows1.some((r) => r.action === 'branch-deleted' && r.branch === 'promote/ccc');
    const protectedDddSurvived =
      rows1.some((r) => r.action === 'branch-protected' && r.branch === 'promote/ddd') &&
      !calls.some((c) => c[0] === 'gh' && c[1] === 'api' && c[2] === '-X' && c[3] === 'DELETE' && String(c[4] ?? '').includes('ddd'));
    const commentedOldestFirst = calls.some(
      (c) => c[0] === 'gh' && c[1] === 'pr' && c[2] === 'comment' && c[3] === '10',
    );
    failDelete = true;
    const rows2 = sweepPromotionNamespace(exec, 'spec-kitty/spec-kitty-design', { openPRs, allBranches, protectedBranches });
    const failedRowNonFatal = rows2.some((r) => r.action === 'branch-delete-failed' && r.branch === 'promote/ccc');
    const ok =
      shapeOk && closedOldest && keptNewest && deletedCcc && protectedDddSurvived && commentedOldestFirst && failedRowNonFatal;
    record(
      17,
      'promote/* sweep: oldest superseded, newest kept, orphan deleted, other-base PR protected, failure non-fatal, exact-shape regex',
      'pass',
      ok,
      { shapeOk, rows1, rows2 },
    );
  }

  // Probe 18 — dry-run / recorded invocation (M2, pre-merge squad — REWORKED). The earlier
  // version hand-built each `decision` object as a literal and asserted only argv PREFIXES,
  // so a mutant that changed the `promote/` branch-name prefix to `sync/` (or anything else)
  // left this probe green — the hand-built literals still said `promote/${train.sha}` even
  // though the REAL `impl.decidePromotion` would have produced something else. Every decision
  // below is now produced by calling the REAL `impl.decidePromotion` against real scratch-repo
  // state, and every assertion is FULL deep-argv equality (including the exact branch name),
  // never a prefix/shape check — so a prefix mutation shows up here as a mismatched command,
  // not as a still-passing "starts with the right thing".
  {
    const s = scratchRepo();
    try {
      const seed = tipOf(s.git, 'HEAD');
      s.git(['branch', 'develop']);
      s.commit('a.txt', 'a', 'chore: a');
      const train = tipOf(s.git, 'HEAD');
      const develop = tipOf(s.git, 'develop'); // still at `seed` — healthy, behind train

      const staleExistingPr = {
        number: 5,
        headSha: 'e'.repeat(40),
        headTree: '2'.repeat(40),
        branch: `${PROMOTE_PREFIX}${'e'.repeat(40)}`,
        createdAt: new Date().toISOString(),
      };
      const freshExistingPr = { ...staleExistingPr, number: 6, headTree: train.tree };

      const baseInput = { trainSha: train.sha, trainTree: train.tree, developSha: develop.sha, developTree: develop.tree };

      const outcomeChecks = [
        {
          name: 'no-op-missing-develop',
          decision: impl.decidePromotion({ ...baseInput, developSha: null, developTree: null, existingPr: null, developHealthy: null }),
          developSha: null,
          expectedArgv: [],
        },
        {
          name: 'refuse-diverged',
          decision: impl.decidePromotion({ ...baseInput, existingPr: null, developHealthy: false, divergence: { reason: 'x' } }),
          developSha: develop.sha,
          expectedArgv: [],
        },
        {
          name: 'no-op-in-sync (no existing PR)',
          decision: impl.decidePromotion({ ...baseInput, developTree: train.tree, existingPr: null, developHealthy: true }),
          developSha: develop.sha,
          expectedArgv: [],
        },
        {
          name: 'no-op-in-sync (stale existing PR closed)',
          decision: impl.decidePromotion({ ...baseInput, developTree: train.tree, existingPr: staleExistingPr, developHealthy: true }),
          developSha: develop.sha,
          expectedArgv: [
            ['gh', 'pr', 'comment', '5', '--repo', 'spec-kitty/spec-kitty-design', '--body', 'develop already carries this tree — closing this now-stale promotion PR.'],
            ['gh', 'pr', 'close', '5', '--repo', 'spec-kitty/spec-kitty-design'],
          ],
        },
        {
          name: 'reuse-existing-pr',
          decision: impl.decidePromotion({ ...baseInput, existingPr: freshExistingPr, developHealthy: true }),
          developSha: develop.sha,
          expectedArgv: [],
        },
        {
          name: 'open-new',
          decision: impl.decidePromotion({ ...baseInput, existingPr: null, developHealthy: true }),
          developSha: develop.sha,
          expectedArgv: (decision) => [
            ['git', 'push', 'origin', `PLACEHOLDER_SHA:refs/heads/${decision.branchName}`],
            ['gh', 'pr', 'create', '--repo', 'spec-kitty/spec-kitty-design', '--base', 'develop', '--head', decision.branchName, '--title', decision.commitMessage.split('\n')[0], '--body', decision.commitMessage],
          ],
        },
        {
          name: 'supersede-and-open',
          decision: impl.decidePromotion({ ...baseInput, existingPr: staleExistingPr, developHealthy: true }),
          developSha: develop.sha,
          expectedArgv: (decision) => [
            ['gh', 'pr', 'comment', '5', '--repo', 'spec-kitty/spec-kitty-design', '--body', `Superseded by a fresh tree-sync commit for ${train.sha} — the train moved again before this PR merged.`],
            ['gh', 'pr', 'close', '5', '--repo', 'spec-kitty/spec-kitty-design'],
            ['gh', 'api', '-X', 'DELETE', `repos/spec-kitty/spec-kitty-design/git/refs/heads/${staleExistingPr.branch}`],
            ['git', 'push', 'origin', `PLACEHOLDER_SHA:refs/heads/${decision.branchName}`],
            ['gh', 'pr', 'create', '--repo', 'spec-kitty/spec-kitty-design', '--base', 'develop', '--head', decision.branchName, '--title', decision.commitMessage.split('\n')[0], '--body', decision.commitMessage],
          ],
        },
      ];

      const perOutcome = {};
      for (const check of outcomeChecks) {
        const { exec, calls } = makeRecordingExec();
        applyOutcome(exec, 'spec-kitty/spec-kitty-design', s.dir, check.decision, check.developSha, train.sha);
        const expected =
          typeof check.expectedArgv === 'function' ? check.expectedArgv(check.decision) : check.expectedArgv;
        // The pushed tree-sync commit's SHA is generated fresh each run — replace the
        // placeholder in the expected argv with whatever `git push` actually recorded, so the
        // comparison is still a FULL deep-equality check on everything else (crucially, the
        // exact branch name, which is what a prefix mutation would change).
        const actualPushArg = calls.find((c) => c[0] === 'git' && c[1] === 'push')?.[3];
        const resolvedExpected = expected.map((argv) =>
          argv.map((part) => (actualPushArg && part.startsWith('PLACEHOLDER_SHA:') ? actualPushArg : part)),
        );
        const ok =
          calls.length === resolvedExpected.length &&
          resolvedExpected.every((argv, i) => argv.length === calls[i].length && argv.every((part, j) => calls[i][j] === part));
        perOutcome[check.name] = { ok, calls, expected: resolvedExpected };
      }
      const allOk = Object.values(perOutcome).every((r) => r.ok);
      record(18, 'dry-run/recorded invocation: FULL argv (incl. exact branch name) per outcome, derived via impl.decidePromotion', 'pass', allOk, perOutcome);
    } finally {
      s.cleanup();
    }
  }

  // Probe 19 — B2 (pre-merge squad): pollAndMerge re-reads develop's LIVE tip immediately
  // before merging and refuses if it moved since the decision was made; and the post-merge
  // tree assertion actually COMPARES against the promoted train tree rather than only
  // printing it. Exercised with a recording exec (never real gh/git network calls) so all
  // three sub-cases run in-process.
  {
    const makePollExec = ({ mergeStatus, developLiveSha, postMergeTree }) => {
      const calls = [];
      const exec = (file, args) => {
        calls.push([file, ...(args ?? [])]);
        if (file === 'gh' && args?.[0] === 'pr' && args?.[1] === 'view') {
          return JSON.stringify(mergeStatus);
        }
        if (file === 'git' && args?.[0] === 'ls-remote') {
          return `${developLiveSha}\trefs/heads/develop\n`;
        }
        if (file === 'gh' && args?.[0] === 'api' && String(args?.[1] ?? '').includes('git/refs/heads/develop')) {
          return JSON.stringify({ object: { sha: 'post-merge-commit-sha' } });
        }
        if (file === 'gh' && args?.[0] === 'api' && String(args?.[1] ?? '').includes('git/commits/')) {
          return JSON.stringify({ tree: { sha: postMergeTree } });
        }
        return '';
      };
      return { exec, calls };
    };

    const savedExitCode = process.exitCode;
    const outcomes = {};

    // (a) develop's live tip moved since the decision — must refuse, never call `gh pr merge`.
    process.exitCode = undefined;
    {
      const { exec, calls } = makePollExec({
        mergeStatus: { mergeable: true, mergeStateStatus: 'CLEAN' },
        developLiveSha: 'MOVED_AWAY_SHA',
        postMergeTree: 'irrelevant',
      });
      await pollAndMerge(exec, 'spec-kitty/spec-kitty-design', '/tmp', 1, 'headsha', 'EXPECTED_PARENT_SHA', 'TRAIN_TREE');
      outcomes.refusesOnMovedParent =
        process.exitCode === 1 && !calls.some((c) => c[0] === 'gh' && c[1] === 'pr' && c[2] === 'merge');
    }

    // (b) parent matches, but the post-merge tree does NOT match the promoted train tree —
    // must exit non-zero even though the merge call itself "succeeded".
    process.exitCode = undefined;
    {
      const { exec, calls } = makePollExec({
        mergeStatus: { mergeable: true, mergeStateStatus: 'CLEAN' },
        developLiveSha: 'EXPECTED_PARENT_SHA',
        postMergeTree: 'WRONG_TREE',
      });
      await pollAndMerge(exec, 'spec-kitty/spec-kitty-design', '/tmp', 1, 'headsha', 'EXPECTED_PARENT_SHA', 'TRAIN_TREE');
      outcomes.catchesPostMergeMismatch =
        process.exitCode === 1 && calls.some((c) => c[0] === 'gh' && c[1] === 'pr' && c[2] === 'merge');
    }

    // (c) happy path — parent matches, post-merge tree matches — merges cleanly, no error.
    // F2 (pre-merge squad, gate pass 2): also asserts the recorded merge argv itself, not just
    // that SOME "gh pr merge" call happened — deleting --match-head-commit entirely left this
    // probe green before, because nothing checked the argv contents. The exact expected argv
    // is asserted (deep equality), so a dropped or reordered flag is caught, not just a
    // dropped subcommand.
    process.exitCode = undefined;
    {
      const { exec, calls } = makePollExec({
        mergeStatus: { mergeable: true, mergeStateStatus: 'CLEAN' },
        developLiveSha: 'EXPECTED_PARENT_SHA',
        postMergeTree: 'TRAIN_TREE',
      });
      await pollAndMerge(exec, 'spec-kitty/spec-kitty-design', '/tmp', 1, 'headsha', 'EXPECTED_PARENT_SHA', 'TRAIN_TREE');
      const mergeCall = calls.find((c) => c[0] === 'gh' && c[1] === 'pr' && c[2] === 'merge');
      const expectedMergeArgv = [
        'gh', 'pr', 'merge', '1',
        '--repo', 'spec-kitty/spec-kitty-design',
        '--rebase',
        '--match-head-commit', 'headsha',
      ];
      const mergeArgvOk =
        !!mergeCall &&
        mergeCall.length === expectedMergeArgv.length &&
        expectedMergeArgv.every((part, i) => mergeCall[i] === part);
      outcomes.happyPathMerges = process.exitCode !== 1 && mergeArgvOk;
      outcomes.happyPathMergeArgv = mergeCall;
    }

    process.exitCode = savedExitCode;
    const ok = outcomes.refusesOnMovedParent && outcomes.catchesPostMergeMismatch && outcomes.happyPathMerges;
    record(
      19,
      "pollAndMerge re-reads develop's live tip before merging and verifies the post-merge tree (B2)",
      'pass',
      ok,
      outcomes,
    );
  }

  // Probe 20 — M1 (pre-merge squad): the sweep runs on EVERY outcome via `runCycle`'s
  // `finally`, including `no-op-missing-develop` and `refuse-diverged` — the two outcomes
  // that returned early, before the sweep, in the version that shipped with PR #429 despite
  // its own comment claiming "every run".
  {
    const savedExitCode = process.exitCode;
    const cases = {};
    for (const decision of [
      { outcome: 'no-op-missing-develop', existingPr: null, divergence: null },
      { outcome: 'refuse-diverged', existingPr: null, divergence: { reason: 'x' } },
    ]) {
      process.exitCode = undefined;
      const { exec, calls } = makeRecordingExec();
      await runCycle({
        exec,
        repo: 'spec-kitty/spec-kitty-design',
        cwd: '/tmp',
        decision,
        developSha: decision.outcome === 'refuse-diverged' ? 'somesha' : null,
        trainSha: 'trainsha',
        trainTree: 'traintree',
      });
      // The sweep's own read calls (list open PRs, list any-base promotion PRs, list
      // branches) must have run regardless of the outcome above having returned early.
      cases[decision.outcome] = calls.some((c) => c[0] === 'gh' && c[1] === 'pr' && c[2] === 'list');
    }
    process.exitCode = savedExitCode;
    const ok = cases['no-op-missing-develop'] === true && cases['refuse-diverged'] === true;
    record(20, 'the sweep runs on every outcome, including no-op-missing-develop and refuse-diverged (M1)', 'pass', ok, cases);
  }

  // Probe 21 — M2 (pre-merge squad): a mutation control for the `promote/` prefix ITSELF. The
  // reducer/reviewer lens demonstrated that changing the prefix to `sync/` left the previous
  // 19/19 suite green while defeating every guard in the PR — the missing catch was that
  // nothing joined branch-name CONSTRUCTION to branch-name RECOGNITION. This monkey-patches
  // the REAL `ruleOpenNew`/`ruleSupersede` (via `impl.decisionRules`) to build a `sync/<sha>`
  // branch name instead, then asserts the REAL, unmutated `findPromotionPRs` no longer
  // recognizes a PR headed that way — the concrete, product-level consequence of a prefix
  // drift (every subsequent run would open a DUPLICATE promotion PR forever, never finding
  // the one it already opened).
  {
    const original = impl.decisionRules;
    const mutatedOpenNew = (input) => {
      const partial = ruleOpenNew(input);
      return partial ? { ...partial, branchName: `sync/${input.trainSha}` } : null;
    };
    const mutatedSupersede = (input) => {
      const partial = ruleSupersede(input);
      return partial ? { ...partial, branchName: `sync/${input.trainSha}` } : null;
    };
    impl.decisionRules = original.map((rule) => {
      if (rule === ruleOpenNew) return mutatedOpenNew;
      if (rule === ruleSupersede) return mutatedSupersede;
      return rule;
    });

    let mutatedBranchName;
    try {
      const decision = impl.decidePromotion({
        trainSha: 'a'.repeat(40),
        trainTree: 'tree-a',
        developSha: 'b'.repeat(40),
        developTree: 'tree-b',
        existingPr: null,
        developHealthy: true,
        divergence: null,
      });
      mutatedBranchName = decision.branchName;
    } finally {
      impl.decisionRules = original;
    }

    // The REAL, unmutated findPromotionPRs — does it still recognize the mutated branch name?
    const foundUnderMutatedPrefix = impl.findPromotionPRs([{ headRefName: mutatedBranchName }]).length > 0;
    // succeeded = "still found despite the prefix drift" — we WANT this false (caught).
    record(
      21,
      'mutation control: a promote/ -> sync/ prefix drift breaks PR re-discovery (M2)',
      'fail',
      foundUnderMutatedPrefix,
      { mutatedBranchName, foundUnderMutatedPrefix },
    );
  }

  // Probe 22 — F1 (pre-merge squad, gate pass 2): a human PR into `develop` headed
  // `promote/my-feature` is neither adopted (probe 15 covers `findPromotionPRs`'s selection
  // half directly), nor closed, nor deleted, across a full `runCycle` — the sweep's own reads
  // (`listOpenPRsBaseDevelop`, `listOpenPromotionHeadPRsAnyBase`, `listPromotionBranches`, all
  // real, unmutated production code) return the human PR/branch, and neither the closing half
  // nor the deletion half of the sweep may ever reference it.
  {
    const HUMAN_PR_NUMBER = 999;
    const HUMAN_BRANCH = 'promote/my-feature';
    const calls = [];
    const exec = (file, args) => {
      calls.push([file, ...(args ?? [])]);
      if (file === 'gh' && args?.[0] === 'pr' && args?.[1] === 'list') {
        return JSON.stringify([
          {
            number: HUMAN_PR_NUMBER,
            headRefName: HUMAN_BRANCH,
            headRefOid: 'deadbeef',
            baseRefName: 'develop',
            createdAt: new Date().toISOString(),
          },
        ]);
      }
      if (file === 'gh' && args?.[0] === 'api' && String(args?.[1] ?? '').includes('matching-refs')) {
        return JSON.stringify([{ ref: `refs/heads/${HUMAN_BRANCH}` }]);
      }
      return '';
    };
    const decision = { outcome: 'no-op-missing-develop', existingPr: null, divergence: null };
    await runCycle({
      exec,
      repo: 'spec-kitty/spec-kitty-design',
      cwd: '/tmp',
      decision,
      developSha: null,
      trainSha: 'trainsha',
      trainTree: 'traintree',
    });
    const touchedHumanPr = calls.some(
      (c) =>
        (c[0] === 'gh' && c[1] === 'pr' && (c[2] === 'comment' || c[2] === 'close') && c[3] === String(HUMAN_PR_NUMBER)) ||
        (c[0] === 'gh' && c[1] === 'api' && c[2] === '-X' && c[3] === 'DELETE' && String(c[4] ?? '').includes(HUMAN_BRANCH)),
    );
    record(
      22,
      'F1: a human promote/my-feature PR into develop is neither closed nor deleted by the sweep',
      'pass',
      !touchedHumanPr,
      { calls },
    );
  }

  // Probe 23 — V5 (pre-merge squad, gate pass 4): a discriminating test for `applyOutcome`'s
  // OWN delete-site defense-in-depth guard, independent of `findPromotionPRs`'s selection-time
  // filter (probe 15) or the sweep's branch-listing filter (probe 17) — both of which this
  // probe deliberately bypasses by handing `applyOutcome` an `existingPr` object DIRECTLY,
  // the way a hypothetical future upstream bug might. Reverting the `PROMOTION_BRANCH_RE.test
  // (...)` guard immediately around `deleteBranch` in `applyOutcome`'s supersede path (so it
  // deletes unconditionally) leaves every OTHER probe green, since none of them exercise this
  // exact call site with a malformed `existingPr.branch`.
  {
    const s = scratchRepo();
    try {
      s.git(['branch', 'develop']);
      s.commit('a.txt', 'a', 'chore: a');
      const train = tipOf(s.git, 'HEAD');
      const develop = tipOf(s.git, 'develop');
      const malformedExistingPr = {
        number: 42,
        headSha: 'e'.repeat(40),
        headTree: '2'.repeat(40),
        branch: 'promote/my-feature', // NOT the exact promote/<40-hex> shape
        createdAt: new Date().toISOString(),
      };
      const decision = impl.decidePromotion({
        trainSha: train.sha,
        trainTree: train.tree,
        developSha: develop.sha,
        developTree: develop.tree,
        existingPr: malformedExistingPr,
        developHealthy: true,
        divergence: null,
      });
      const { exec, calls } = makeRecordingExec();
      applyOutcome(exec, 'spec-kitty/spec-kitty-design', s.dir, decision, develop.sha, train.sha);
      const deletedMalformedBranch = calls.some(
        (c) => c[0] === 'gh' && c[1] === 'api' && c[2] === '-X' && c[3] === 'DELETE' && String(c[4] ?? '').includes('promote/my-feature'),
      );
      // The REST of the supersede flow (comment, close, push, create) must still happen —
      // this probe is about the ONE deletion call, not a general refusal to supersede.
      const restOfFlowRan =
        calls.some((c) => c[0] === 'gh' && c[1] === 'pr' && c[2] === 'comment' && c[3] === '42') &&
        calls.some((c) => c[0] === 'gh' && c[1] === 'pr' && c[2] === 'close' && c[3] === '42') &&
        calls.some((c) => c[0] === 'gh' && c[1] === 'pr' && c[2] === 'create');
      record(
        23,
        "V5: applyOutcome's own delete-site guard refuses to delete a malformed existingPr.branch, even bypassing findPromotionPRs entirely",
        'pass',
        !deletedMalformedBranch && restOfFlowRan,
        { deletedMalformedBranch, restOfFlowRan, calls },
      );
    } finally {
      s.cleanup();
    }
  }

  return results;
}

// M3 (pre-merge squad): DISTINCT probe numbers, no duplicates (the two divergence scenarios
// that both used to be numbered "9" are 9 and 10), and no second, self-referential floor
// living INSIDE the table (the contract's own words: "the floor sits OUTSIDE the probe
// table") — the code-level checks below are the only floor. Raise this deliberately when a
// probe is added (F1/F2 added probes 22 and extended 19, gate pass 2); lowering it is a
// deliberate edit in the same commit that removes a probe, never a silent side effect of a
// duplicate label masking a shrink.
const PROBE_FLOOR = 23;

async function selftest() {
  // B1 (pre-merge squad, PR #429): the ONE choke point every git call in this file's
  // `execFileSync(..., { env: { ...process.env, ... } })` merges reach. Setting these here,
  // once, means `createTreeSyncCommit`'s five call sites (and any future one) never depend on
  // whatever git identity happens to be configured globally on the machine running this
  // process — real on a workstation, absent on a bare CI runner. Verify this is really what
  // closes the gap by running with NEITHER config source available, the way CI's runner
  // actually looks:
  //   GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null node scripts/promote-develop.mjs --selftest
  process.env.GIT_AUTHOR_NAME = 'selftest';
  process.env.GIT_AUTHOR_EMAIL = 'selftest@example.invalid';
  process.env.GIT_COMMITTER_NAME = 'selftest';
  process.env.GIT_COMMITTER_EMAIL = 'selftest@example.invalid';

  const results = await runProbes();

  if (results.length < PROBE_FLOOR) {
    console.error(
      `❌ the probe table has shrunk: ${results.length} probe(s) against a floor of ${PROBE_FLOOR}. ` +
        'Removing a probe is a deliberate edit to PROBE_FLOOR in the same commit, not a deletion ' +
        'whose only trace is a digit in a green line.',
    );
    process.exitCode = 1;
    return;
  }

  // THE FLOOR SITS OUTSIDE THE TABLE (contract). A bare count is not this: it does not verify
  // every probe actually ran and matched its declared expectation, only that the array was
  // not shrunk. Both checks run — this one, and the per-probe match assertion below.
  //
  // M4 (pre-merge squad): JUSTIFICATION probes (probe 5 — it tests git's own merge behaviour,
  // not this mechanism's product code) are excluded from the polarity count. Counting them
  // would let a probe that measures nothing about THIS product's negative-case coverage
  // satisfy the "at least one expect-fail exists" requirement on the product's behalf.
  const polarityCandidates = results.filter((r) => !r.justification);
  const expectedPass = polarityCandidates.filter((r) => r.expect === 'pass');
  const expectedFail = polarityCandidates.filter((r) => r.expect === 'fail');
  if (expectedPass.length === 0 || expectedFail.length === 0) {
    console.error(
      'Refusing to report green over a degenerate probe set: ' +
        `${expectedPass.length} expect-pass, ${expectedFail.length} expect-fail ` +
        `(of ${polarityCandidates.length} non-justification probes).`,
    );
    process.exitCode = 1;
    return;
  }

  const matched = results.filter((r) => r.ok);
  for (const r of results) {
    console.log(`${r.ok ? '✅' : '❌'} probe ${r.n} (expect: ${r.expect}): ${r.name}`);
  }
  if (matched.length !== results.length) {
    console.error(`\n❌ ${results.length - matched.length} of ${results.length} probes did not match their declared expectation:`);
    for (const r of results) {
      if (!r.ok) console.error(`   probe ${r.n}: ${r.name} — ${JSON.stringify(r.detail)}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `\n✅ ${results.length}/${results.length} probes matched (${expectedPass.length} expect-pass, ` +
      `${expectedFail.length} expect-fail).`,
  );
}

// ── Entry point ────────────────────────────────────────────────────────────────────────

async function main() {
  const [, , mode, ...rest] = process.argv;
  if (process.argv.includes('--selftest')) {
    await selftest();
    return;
  }
  switch (mode) {
    case 'run':
      await cliRun();
      return;
    case 'decide':
      cliDecide(rest);
      return;
    case 'assert-scope':
      cliAssertScope();
      return;
    default:
      console.error(
        'usage: node scripts/promote-develop.mjs <run|decide|assert-scope> [...] | --selftest',
      );
      process.exitCode = 1;
  }
}

await main();
