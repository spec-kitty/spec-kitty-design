#!/usr/bin/env node
/**
 * scripts/lib/promote-github.mjs — GitHub-facing effects for the develop-promotion
 * mechanism (REL1, #362, FR-007/FR-010; contracts/promotion-script.contract.md).
 *
 * Every effect below is a thin, single-purpose wrapper around exactly one `git`/`gh`
 * invocation, called through an INJECTABLE `exec` function (default `defaultExec`,
 * `execFileSync` underneath) rather than calling `execFileSync` directly. That seam is
 * what lets `scripts/promote-develop.mjs --selftest` substitute a recording shim that
 * captures every argv instead of either calling real GitHub or hand-writing a second,
 * parallel simulation of the same calls (research.md R23) — the shim and production
 * share this one implementation, so a self-test failure here is a real defect, not a
 * divergence between two copies of the same logic.
 *
 * `exec(file, args, options)` mirrors `node:child_process.execFileSync`'s signature and
 * must return a string (stdout, utf8 — `defaultExec` sets `encoding: 'utf8'`).
 */
import { execFileSync } from 'node:child_process';

/** The real thing. Every production call flows through this unless a caller injects
 *  a different `exec` (only `--selftest` does). */
export function defaultExec(file, args, options = {}) {
  return execFileSync(file, args, { encoding: 'utf8', ...options });
}

/** List open PRs whose base is `develop` — client-side `promote/*` filtering happens in
 *  `findPromotionPRs` (M6/R21); `gh pr list --head` is an exact match and cannot do this. */
export function listOpenPRsBaseDevelop(exec, repo) {
  const out = exec('gh', [
    'pr', 'list',
    '--repo', repo,
    '--base', 'develop',
    '--state', 'open',
    '--limit', '50',
    '--json', 'number,headRefName,headRefOid,createdAt',
  ]);
  return JSON.parse(out);
}

/** List every `promote/*` branch on the remote, for the sweep's branch-deletion half
 *  (R22) — a branch can outlive its PR (e.g. a PR closed by hand). */
export function listPromotionBranches(exec, repo) {
  const out = exec('gh', ['api', `repos/${repo}/git/matching-refs/heads/promote/`]);
  const refs = JSON.parse(out);
  return refs.map((r) => String(r.ref).replace(/^refs\/heads\//, ''));
}

/** Push the tree-sync commit to a fresh `promote/<sha>` branch. */
export function pushPromotionBranch(exec, cwd, branchName, sha) {
  exec('git', ['push', 'origin', `${sha}:refs/heads/${branchName}`], { cwd });
}

/** Open the single-commit promotion PR. Returns the PR number. */
export function openPromotionPR(exec, repo, { branchName, title, body }) {
  const out = exec('gh', [
    'pr', 'create',
    '--repo', repo,
    '--base', 'develop',
    '--head', branchName,
    '--title', title,
    '--body', body,
  ]);
  const match = String(out).match(/\/pull\/(\d+)/);
  if (!match) throw new Error(`could not parse a PR number out of \`gh pr create\`'s output: ${out}`);
  return Number(match[1]);
}

/** Comment on a PR — used to name the superseder before closing a stale one (R21/R22). */
export function commentOnPR(exec, repo, number, body) {
  exec('gh', ['pr', 'comment', String(number), '--repo', repo, '--body', body]);
}

/** Close a PR. Its branch is left for the sweep's branch-deletion half to consider. */
export function closePR(exec, repo, number) {
  exec('gh', ['pr', 'close', String(number), '--repo', repo]);
}

/** Delete a remote branch. A failure here is the CALLER's to log as a named, non-fatal
 *  row (R22) — this function itself just lets the error propagate. */
export function deleteBranch(exec, repo, branchName) {
  exec('gh', ['api', '-X', 'DELETE', `repos/${repo}/git/refs/heads/${branchName}`]);
}

/** Read a PR's live mergeability for `assessMergeReadiness`. */
export function viewPRMergeStatus(exec, repo, number) {
  const out = exec('gh', [
    'pr', 'view', String(number),
    '--repo', repo,
    '--json', 'mergeable,mergeStateStatus',
  ]);
  return JSON.parse(out);
}

/** The merge call itself. `--match-head-commit` is real, documented defense in depth
 *  (research.md R6/R12): GitHub refuses the merge server-side if `develop` moved since
 *  that SHA was read, independent of this script's own re-read. */
export function mergePR(exec, repo, number, matchHeadCommitSha) {
  exec('gh', [
    'pr', 'merge', String(number),
    '--repo', repo,
    '--rebase',
    '--match-head-commit', matchHeadCommitSha,
  ]);
}

/** Post-merge, READ-ONLY confirmation that `develop^{tree}` is what was promoted (R12) —
 *  proves the merge did what it claimed, not just that the API call returned success. */
export function readDevelopTree(exec, repo) {
  const refOut = exec('gh', ['api', `repos/${repo}/git/refs/heads/develop`]);
  const sha = JSON.parse(refOut).object.sha;
  const commitOut = exec('gh', ['api', `repos/${repo}/git/commits/${sha}`]);
  return JSON.parse(commitOut).tree.sha;
}

/**
 * Sweep the `promote/*` scratch namespace (R22): every open promotion PR except the
 * newest (by `createdAt`) is closed with a comment naming its superseder; every
 * `promote/*` branch with no surviving open PR is deleted. A branch-delete failure is
 * caught here and reported as a named, non-fatal row — never thrown, because a stray
 * dead branch is a nuisance, not a promotion failure (R22).
 *
 * `openPRs` and `allBranches` are what the caller already fetched (`listOpenPRsBaseDevelop`
 * filtered to `promote/*` via `findPromotionPRs`, and `listPromotionBranches`) — this
 * function performs no reads of its own, only the mutating sweep.
 */
export function sweepPromotionNamespace(exec, repo, { openPRs, allBranches }) {
  const rows = [];
  const sorted = [...openPRs].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const newest = sorted.length ? sorted[sorted.length - 1] : null;
  const survivingBranches = new Set();
  if (newest) survivingBranches.add(newest.branch ?? newest.headRefName);

  for (const pr of sorted) {
    if (newest && pr.number === newest.number) continue;
    commentOnPR(
      exec,
      repo,
      pr.number,
      `Superseded by #${newest.number} — a newer train commit was promoted before this one merged.`,
    );
    closePR(exec, repo, pr.number);
    rows.push({ action: 'closed', number: pr.number, branch: pr.headRefName ?? pr.branch });
  }

  for (const branch of allBranches ?? []) {
    if (survivingBranches.has(branch)) continue;
    try {
      deleteBranch(exec, repo, branch);
      rows.push({ action: 'branch-deleted', branch });
    } catch (err) {
      rows.push({ action: 'branch-delete-failed', branch, error: String(err?.message ?? err) });
    }
  }
  return rows;
}
