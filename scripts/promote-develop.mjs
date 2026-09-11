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
 *   node scripts/promote-develop.mjs assert-scope [--input <file>]
 *   node scripts/promote-develop.mjs --selftest       # red-first probe table, no network
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  defaultExec,
  listOpenPRsBaseDevelop,
  listPromotionBranches,
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

/**
 * Pure. The decision algorithm's entire branching logic, including the divergence health
 * check (B1/FR-007(d)) — a sixth outcome, `refuse-diverged`, alongside the original five.
 * Order matters: missing-develop and diverged are both checked before anything else touches
 * `trainTree`/`developTree`/`existingPr` (contract).
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

  if (developSha === null) {
    return { ...base, outcome: 'no-op-missing-develop', developHealthy: null };
  }

  if (developHealthy === false) {
    return { ...base, outcome: 'refuse-diverged', divergence: divergence ?? null, existingPr };
  }

  if (developTree === trainTree) {
    return { ...base, outcome: 'no-op-in-sync', existingPr: existingPr ?? null };
  }

  const branchName = `promote/${trainSha}`;
  const commitMessage = buildCommitMessage(trainSha);

  if (existingPr && existingPr.headTree === trainTree) {
    return { ...base, outcome: 'reuse-existing-pr', existingPr };
  }

  if (existingPr && existingPr.headTree !== trainTree) {
    return { ...base, outcome: 'supersede-and-open', existingPr, commitMessage, branchName };
  }

  return { ...base, outcome: 'open-new', existingPr: null, commitMessage, branchName };
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

/** Pure. M6 — `gh pr list --head` is an exact match, so discovery is list-then-filter. */
export function findPromotionPRs(prListJson) {
  return (prListJson ?? []).filter((pr) => String(pr.headRefName ?? '').startsWith('promote/'));
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
 * remote. `env` may carry `GIT_AUTHOR_*`/`GIT_COMMITTER_*` for a scratch-repo test identity —
 * production relies on the workflow's own `git config --global` bot identity instead.
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

function cliAssertScope(args) {
  const inputFile = getArg(args, '--input');
  let json;
  if (inputFile) {
    json = JSON.parse(readFileSync(inputFile, 'utf8'));
  } else {
    const out = defaultExec('gh', ['api', 'installation/repositories']);
    json = JSON.parse(out);
  }
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
        deleteBranch(exec, repo, decision.existingPr.branch);
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

async function pollAndMerge(exec, repo, prNumber, prHeadSha) {
  // 10-minute bound (research.md R5, explicitly a provisional estimate pending recalibration
  // against the first real cycle — plan.md's Orchestrator Actions).
  const budgetMs = 10 * 60 * 1000;
  const start = Date.now();
  let delay = 5000;
  for (;;) {
    const status = viewPRMergeStatus(exec, repo, prNumber);
    const action = assessMergeReadiness(status);
    if (action === 'attempt-merge') {
      // NOTE on --match-head-commit: plan.md's Promotion algorithm prose names this
      // argument as "<develop-tip-sha>", but `gh pr merge --help` and the GitHub REST merge
      // endpoint's own `sha` parameter (both cited in research.md R6) document it as "the
      // commit SHA the pull request HEAD must match" — the PR's own head, not the base. Using
      // develop's tip here would not match the PR's head SHA and would make every merge
      // attempt fail closed. This implementation follows the verified flag semantics (the PR's
      // own head SHA) rather than plan.md's inline example text; flagged in the WP report.
      mergePR(exec, repo, prNumber, prHeadSha);
      const finalTree = readDevelopTree(exec, repo);
      writeStepSummary(`- post-merge tree assertion: \`develop^{tree}\` = \`${finalTree}\``);
      console.log(`::notice::merged PR #${prNumber}; develop^{tree} = ${finalTree}`);
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

async function cliRun() {
  const repo = requireEnv('GITHUB_REPOSITORY');
  const sourceRef = process.env.PROMOTE_SOURCE_REF || 'train/elements-first';
  const cwd = process.cwd();
  const exec = defaultExec;

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
    await pollAndMerge(exec, repo, prNumber, prHeadSha);
  }

  // Cleanup, every run (R22) — regardless of this run's own outcome above.
  const finalPRs = findPromotionPRs(listOpenPRsBaseDevelop(exec, repo));
  const allBranches = listPromotionBranches(exec, repo);
  const sweepRows = sweepPromotionNamespace(exec, repo, { openPRs: finalPRs, allBranches });
  for (const row of sweepRows) console.log(`::notice::sweep: ${JSON.stringify(row)}`);
}

// ── --selftest (T003/IC-03): 18 probes, floor outside the table, mutation controls ───────
//
// contracts/promotion-script.contract.md is authoritative for the shape and numbering below.
// Every probe runs against a FRESH scratch git repository (`mkdtempSync`), identity set via
// `GIT_AUTHOR_*`/`GIT_COMMITTER_*` environment variables on each git call — never `git config
// --global`, which a CI runner has none of and a developer's own workstation has real ones
// that must not be touched (research.md R14).

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
    return '';
  };
  return { exec, calls };
}

async function runProbes() {
  const results = [];
  const record = (n, name, expect, ok, detail) => results.push({ n, name, expect, ok, detail });

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

  // Probe 5 — two-cycle squash DOES conflict (product probe, expect: 'fail' on purpose).
  {
    const conflicted = runSquashConflictScenario();
    record(
      5,
      "two-cycle squash conflicts — Option D's justification (expect: 'fail' on purpose)",
      'fail',
      conflicted === true,
      { conflicted },
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
  for (const [withExistingPr, label] of [
    [false, 'no existing PR'],
    [true, 'with a stale existing PR (divergence must still win)'],
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
        9,
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

  // Probe 10 — develop moves between PR-open and merge-attempt: re-check divergence, never
  // merge over it. `assessMergeReadiness`'s BEHIND handling is the general case (probe 13);
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
        10,
        'develop moves between PR-open and merge-attempt -> re-check divergence, never merge over it',
        'pass',
        stillHealthy === false && recheck.outcome === 'refuse-diverged',
        { stillHealthy, outcome: recheck.outcome },
      );
    } finally {
      s.cleanup();
    }
  }

  // Probe 11 — mutation control: broken createTreeSyncCommit. Monkey-patches the REAL,
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
    const caught = held === false;
    record(11, 'mutation control: broken createTreeSyncCommit is caught', 'fail', caught, { held });
  }

  // Probe 12 — mutation control: reordered decision branches. Monkey-patches the REAL,
  // already-loaded `impl.decidePromotion` to check `existingPr` before `developHealthy`, and
  // re-runs probe 9's own diverged scenario (with an existingPr this time, so the reordering
  // actually changes the result) — the harness MUST report the wrong outcome as caught.
  {
    const original = impl.decidePromotion;
    impl.decidePromotion = (input) => {
      const { trainSha, trainTree, developSha, developTree, existingPr, developHealthy, divergence } = input;
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
      if (developSha === null) return { ...base, outcome: 'no-op-missing-develop', developHealthy: null };
      if (developTree === trainTree) return { ...base, outcome: 'no-op-in-sync', existingPr: existingPr ?? null };
      const branchName = `promote/${trainSha}`;
      const commitMessage = buildCommitMessage(trainSha);
      // MUTATION: existingPr branches checked BEFORE developHealthy.
      if (existingPr && existingPr.headTree === trainTree) return { ...base, outcome: 'reuse-existing-pr', existingPr };
      if (existingPr && existingPr.headTree !== trainTree) {
        return { ...base, outcome: 'supersede-and-open', existingPr, commitMessage, branchName };
      }
      if (developHealthy === false) return { ...base, outcome: 'refuse-diverged', divergence: divergence ?? null, existingPr };
      return { ...base, outcome: 'open-new', existingPr: null, commitMessage, branchName };
    };
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
      impl.decidePromotion = original;
    }
    const caught = mutatedOutcome !== 'refuse-diverged';
    record(12, 'mutation control: reordered decision branches is caught', 'fail', caught, { mutatedOutcome });
  }

  // Probe 13 — assessMergeReadiness, all seven documented states + null.
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
    record(13, 'assessMergeReadiness: all documented states + null', 'pass', allMatch, outcomes);
  }

  // Probe 14 — findPromotionPRs: 0, 1, 2+.
  {
    const zero = impl.findPromotionPRs([{ headRefName: 'other' }]);
    const one = impl.findPromotionPRs([{ headRefName: 'other' }, { headRefName: 'promote/aaa' }]);
    const two = impl.findPromotionPRs([
      { headRefName: 'promote/aaa' },
      { headRefName: 'promote/bbb' },
      { headRefName: 'other' },
    ]);
    const ok = zero.length === 0 && one.length === 1 && two.length === 2;
    record(14, 'findPromotionPRs: 0, 1, 2+', 'pass', ok, { zero: zero.length, one: one.length, two: two.length });
  }

  // Probe 15 — assertSingleRepoScope: 0, 1-correct, 1-wrong, 2+.
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
    record(15, 'assertSingleRepoScope: 0, 1-correct, 1-wrong, 2+', 'pass', ok, outcomes);
  }

  // Probe 16 — promote/* sweep: two open PRs (oldest superseded, newest kept), one branch
  // with no PR (deleted), and a simulated delete failure reported as a named, non-fatal row.
  {
    const now = Date.now();
    const openPRs = [
      { number: 10, headRefName: 'promote/aaa', createdAt: new Date(now - 100000).toISOString() },
      { number: 11, headRefName: 'promote/bbb', createdAt: new Date(now).toISOString() },
    ];
    const allBranches = ['promote/aaa', 'promote/bbb', 'promote/ccc'];
    let failDelete = false;
    const calls = [];
    const exec = (file, args) => {
      calls.push([file, ...(args ?? [])]);
      if (file === 'gh' && args?.[0] === 'api' && args?.[1] === '-X' && args?.[2] === 'DELETE') {
        if (String(args[3]).includes('ccc') && failDelete) throw new Error('simulated delete failure');
      }
      return '';
    };
    const rows1 = sweepPromotionNamespace(exec, 'spec-kitty/spec-kitty-design', { openPRs, allBranches });
    const closedOldest = rows1.some((r) => r.action === 'closed' && r.number === 10);
    const keptNewest = !rows1.some((r) => r.action === 'closed' && r.number === 11);
    const deletedCcc = rows1.some((r) => r.action === 'branch-deleted' && r.branch === 'promote/ccc');
    const commentedOldestFirst = calls.some(
      (c) => c[0] === 'gh' && c[1] === 'pr' && c[2] === 'comment' && c[3] === '10',
    );
    failDelete = true;
    const rows2 = sweepPromotionNamespace(exec, 'spec-kitty/spec-kitty-design', { openPRs, allBranches });
    const failedRowNonFatal = rows2.some((r) => r.action === 'branch-delete-failed' && r.branch === 'promote/ccc');
    const ok = closedOldest && keptNewest && deletedCcc && commentedOldestFirst && failedRowNonFatal;
    record(16, 'promote/* sweep: oldest superseded, newest kept, orphan branch deleted, failure non-fatal', 'pass', ok, {
      rows1,
      rows2,
    });
  }

  // Probe 17 — dry-run / recorded invocation: for each of the six outcomes, the exact
  // gh/git argv sequence matches what that outcome should do (research.md R23).
  {
    const s = scratchRepo();
    try {
      s.git(['branch', 'develop']);
      s.commit('a.txt', 'a', 'chore: a');
      const train = tipOf(s.git, 'HEAD');
      const develop = tipOf(s.git, 'develop');
      const staleExistingPr = {
        number: 5,
        headSha: 'e'.repeat(40),
        headTree: '2'.repeat(40),
        branch: 'promote/stale',
        createdAt: new Date().toISOString(),
      };
      const freshExistingPr = { ...staleExistingPr, number: 6, headTree: train.tree };

      const outcomeChecks = [
        {
          name: 'no-op-missing-develop',
          decision: { outcome: 'no-op-missing-develop', existingPr: null },
          developSha: null,
          expectZeroCalls: true,
        },
        {
          name: 'refuse-diverged',
          decision: { outcome: 'refuse-diverged', existingPr: null, divergence: { reason: 'x' } },
          developSha: develop.sha,
          expectZeroCalls: true,
        },
        {
          name: 'no-op-in-sync (no existing PR)',
          decision: { outcome: 'no-op-in-sync', existingPr: null },
          developSha: develop.sha,
          expectZeroCalls: true,
        },
        {
          name: 'no-op-in-sync (stale existing PR closed)',
          decision: { outcome: 'no-op-in-sync', existingPr: staleExistingPr },
          developSha: develop.sha,
          expectCallShapes: [
            ['gh', 'pr', 'comment', '5'],
            ['gh', 'pr', 'close', '5'],
          ],
        },
        {
          name: 'reuse-existing-pr',
          decision: { outcome: 'reuse-existing-pr', existingPr: freshExistingPr },
          developSha: develop.sha,
          expectZeroCalls: true,
        },
        {
          name: 'open-new',
          decision: {
            outcome: 'open-new',
            existingPr: null,
            trainTree: train.tree,
            commitMessage: buildCommitMessage(train.sha),
            branchName: `promote/${train.sha}`,
          },
          developSha: develop.sha,
          expectCallShapes: [
            ['git', 'push'],
            ['gh', 'pr', 'create'],
          ],
        },
        {
          name: 'supersede-and-open',
          decision: {
            outcome: 'supersede-and-open',
            existingPr: staleExistingPr,
            trainTree: train.tree,
            commitMessage: buildCommitMessage(train.sha),
            branchName: `promote/${train.sha}`,
          },
          developSha: develop.sha,
          expectCallShapes: [
            ['gh', 'pr', 'comment', '5'],
            ['gh', 'pr', 'close', '5'],
            ['gh', 'api', '-X', 'DELETE'],
            ['git', 'push'],
            ['gh', 'pr', 'create'],
          ],
        },
      ];

      const perOutcome = {};
      for (const check of outcomeChecks) {
        const { exec, calls } = makeRecordingExec();
        applyOutcome(exec, 'spec-kitty/spec-kitty-design', s.dir, check.decision, check.developSha, train.sha);
        let ok;
        if (check.expectZeroCalls) {
          ok = calls.length === 0;
        } else {
          ok =
            calls.length === check.expectCallShapes.length &&
            check.expectCallShapes.every((shape, i) => shape.every((part, j) => calls[i][j] === part));
        }
        perOutcome[check.name] = { ok, calls };
      }
      const allOk = Object.values(perOutcome).every((r) => r.ok);
      record(17, 'dry-run/recorded invocation: exact argv per outcome (6 outcomes)', 'pass', allOk, perOutcome);
    } finally {
      s.cleanup();
    }
  }

  // Probe 18 — probe-count floor. The count alone is necessary but not sufficient (contract,
  // M8) — the degenerate-set refusal and the per-probe match assertion in `selftest()` are
  // what actually enforce the meaningful part; this probe only asserts the table itself has
  // not shrunk below its own documented size (contracts/promotion-script.contract.md's table).
  record(18, 'probe-count floor: this table has not shrunk below 18', 'pass', results.length + 1 >= 18, {
    countSoFar: results.length + 1,
  });

  return results;
}

const PROBE_FLOOR = 18;

async function selftest() {
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
  const expectedPass = results.filter((r) => r.expect === 'pass');
  const expectedFail = results.filter((r) => r.expect === 'fail');
  if (expectedPass.length === 0 || expectedFail.length === 0) {
    console.error(
      'Refusing to report green over a degenerate probe set: ' +
        `${expectedPass.length} expect-pass, ${expectedFail.length} expect-fail.`,
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
      cliAssertScope(rest);
      return;
    default:
      console.error(
        'usage: node scripts/promote-develop.mjs <run|decide|assert-scope> [...] | --selftest',
      );
      process.exitCode = 1;
  }
}

await main();
