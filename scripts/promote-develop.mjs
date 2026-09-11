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
import { appendFileSync, readFileSync } from 'node:fs';

import {
  defaultExec,
  listOpenPRsBaseDevelop,
  listPromotionBranches,
  pushPromotionBranch,
  openPromotionPR,
  commentOnPR,
  closePR,
  viewPRMergeStatus,
  mergePR,
  readDevelopTree,
  sweepPromotionNamespace,
} from './lib/promote-github.mjs';

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
  const train = readRefTip(cwd, trainRef);
  const developExists = refExistsLocally(cwd, developRef);
  const develop = developExists
    ? readRefTip(cwd, developRef)
    : readRefTip(cwd, developRef, { confirmedAbsent: true });

  let developHealthy = null;
  let divergence = null;
  if (develop) {
    const trainFirstParentShas = listFirstParentShas(cwd, trainRef);
    const trailerLookup = makeTrailerLookup(cwd);
    developHealthy = isDevelopHealthy(develop.sha, trainFirstParentShas, trailerLookup);
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
  const decision = decidePromotion({
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
    assertSingleRepoScope(json);
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
    developHealthy = isDevelopHealthy(developSha, trainFirstParentShas, trailerLookup);
    if (!developHealthy) divergence = computeDivergenceReason(developSha, trailerLookup);
  }

  const decision = decidePromotion({
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

  let prNumber = null;
  let prHeadSha = null;

  switch (decision.outcome) {
    case 'no-op-missing-develop':
      console.log('::notice::develop does not exist yet — no-op (FR-007(c)).');
      return;
    case 'refuse-diverged':
      console.error(`::error::refuse-diverged — ${decision.divergence?.reason}`);
      process.exitCode = 1;
      return;
    case 'no-op-in-sync':
      console.log('::notice::develop already matches the train tip — nothing to promote.');
      if (existingPr) {
        commentOnPR(
          exec,
          repo,
          existingPr.number,
          'develop already carries this tree — closing this now-stale promotion PR.',
        );
        closePR(exec, repo, existingPr.number);
      }
      break;
    case 'reuse-existing-pr':
      prNumber = existingPr.number;
      prHeadSha = existingPr.headSha;
      console.log(`::notice::reusing existing, current promotion PR #${prNumber}.`);
      break;
    case 'supersede-and-open':
    case 'open-new': {
      if (decision.outcome === 'supersede-and-open') {
        commentOnPR(
          exec,
          repo,
          existingPr.number,
          `Superseded by a fresh tree-sync commit for ${trainSha} — the train moved again before ` +
            'this PR merged.',
        );
        closePR(exec, repo, existingPr.number);
      }
      const parentSha = developSha;
      const newSha = createTreeSyncCommit(cwd, {
        tree: decision.trainTree,
        parentSha,
        message: decision.commitMessage,
      });
      pushPromotionBranch(exec, cwd, decision.branchName, newSha);
      prNumber = openPromotionPR(exec, repo, {
        branchName: decision.branchName,
        title: decision.commitMessage.split('\n')[0],
        body: decision.commitMessage,
      });
      prHeadSha = newSha;
      break;
    }
    default:
      throw new Error(`unreachable PromotionDecision outcome: ${decision.outcome}`);
  }

  if (prNumber != null) {
    await pollAndMerge(exec, repo, prNumber, prHeadSha);
  }

  // Cleanup, every run (R22) — regardless of this run's own outcome above.
  const finalPRs = findPromotionPRs(listOpenPRsBaseDevelop(exec, repo));
  const allBranches = listPromotionBranches(exec, repo);
  const sweepRows = sweepPromotionNamespace(exec, repo, { openPRs: finalPRs, allBranches });
  for (const row of sweepRows) console.log(`::notice::sweep: ${JSON.stringify(row)}`);
}

// ── Entry point ────────────────────────────────────────────────────────────────────────

async function main() {
  const [, , mode, ...rest] = process.argv;
  if (process.argv.includes('--selftest')) {
    // T003 (IC-03) adds the 18-probe table here. Left as an explicit, loud failure rather
    // than a silent pass in the one commit where it does not exist yet — the [ENFORCED]
    // `lint-code` step that calls this is expected to fail until that commit lands.
    console.error('❌ --selftest is not implemented yet (lands with IC-03 / T003).');
    process.exitCode = 1;
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
