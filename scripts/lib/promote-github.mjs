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

/** The EXACT shape this mechanism ever creates — never a loose `promote/` prefix match
 *  (B5, pre-merge squad). A human's own `promote/my-feature` branch is a real, reachable
 *  namespace collision, not a hypothetical: nothing on GitHub reserves `promote/*` for this
 *  script, and the sweep (below) is a DELETING operation. */
export const PROMOTION_BRANCH_RE = /^promote\/[0-9a-f]{40}$/;

/** List every branch on the remote matching the mechanism's exact `promote/<40-hex>` shape,
 *  for the sweep's branch-deletion half (R22) — a branch can outlive its PR (e.g. a PR closed
 *  by hand). Anything merely PREFIXED with `promote/` (a human's own branch) is excluded. */
export function listPromotionBranches(exec, repo) {
  const out = exec('gh', ['api', `repos/${repo}/git/matching-refs/heads/promote/`]);
  const refs = JSON.parse(out);
  return refs
    .map((r) => String(r.ref).replace(/^refs\/heads\//, ''))
    .filter((branch) => PROMOTION_BRANCH_RE.test(branch));
}

/**
 * List every OPEN pull request repo-wide whose head matches the mechanism's exact
 * `promote/<40-hex>` shape, regardless of base (B5). This is deliberately NOT scoped to
 * `--base develop`: the sweep must never delete a branch that has an open PR into some OTHER
 * base (a human's own `promote/<40-hex>`-named branch — vanishingly unlikely to collide by
 * name, but not impossible, and the mechanism has no way to tell "mine" from "not mine" other
 * than checking whether ANY open PR still references the branch).
 */
export function listOpenPromotionHeadPRsAnyBase(exec, repo) {
  const out = exec('gh', [
    'pr', 'list',
    '--repo', repo,
    '--state', 'open',
    '--limit', '100',
    '--json', 'number,headRefName,headRefOid,baseRefName,createdAt',
  ]);
  return JSON.parse(out).filter((pr) => PROMOTION_BRANCH_RE.test(String(pr.headRefName ?? '')));
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

/**
 * The merge call itself. `--match-head-commit` pins the PR's own HEAD, never the base
 * (`gh pr merge --help`: "Commit SHA that pull request head must match to allow merge" — the
 * GitHub REST merge endpoint's `sha` parameter, exposed directly; verified 2026-09-11,
 * research.md R6). **Corrected comment** (pre-merge squad, B2): an earlier revision of this
 * comment inverted that — it claimed this argument pins `develop`'s tip and that GitHub
 * "refuses the merge server-side if `develop` moved," which is not what this flag does. The
 * real defense against `develop` having moved since this run last read it is
 * `pollAndMerge`'s own explicit re-read of `develop`'s live tip immediately before calling
 * this function (`scripts/promote-develop.mjs`, B2) — this flag is a SEPARATE, narrower
 * defense: it protects against the promotion PR's own head branch changing underneath this
 * run between deciding to merge and the merge call itself (e.g. a force-push to the
 * `promote/*` branch), which `--match-head-commit` catches server-side.
 */
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
 * Sweep the `promote/*` scratch namespace (R22): every open, base-`develop` promotion PR
 * except the newest (by `createdAt`) is closed with a comment naming its superseder; every
 * `promote/<40-hex>`-shaped branch with no surviving open PR **to any base** is deleted. A
 * branch-delete failure is caught here and reported as a named, non-fatal row — never thrown,
 * because a stray dead branch is a nuisance, not a promotion failure (R22).
 *
 * `openPRs` is the base-`develop` subset only (`listOpenPRsBaseDevelop` filtered via
 * `findPromotionPRs`) — closing/commenting only ever touches PRs this mechanism itself would
 * have opened. `allBranches` is `listPromotionBranches`'s exact-shape list. `protectedBranches`
 * (B5, pre-merge squad) is the set of `promote/<40-hex>` branch names that have an open PR
 * **to any base** (`listOpenPromotionHeadPRsAnyBase`, unscoped by base) — a branch in this set
 * is never deleted, even if it has no base-`develop` PR, because a human's own branch that
 * happens to match the mechanism's exact name shape must not be destroyed out from under an
 * unrelated PR. This function performs no reads of its own, only the mutating sweep.
 */
export function sweepPromotionNamespace(exec, repo, { openPRs, allBranches, protectedBranches }) {
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

  const protectedSet = protectedBranches instanceof Set ? protectedBranches : new Set(protectedBranches ?? []);
  for (const branch of allBranches ?? []) {
    if (survivingBranches.has(branch)) continue;
    if (protectedSet.has(branch)) {
      rows.push({ action: 'branch-protected', branch, reason: 'has an open PR to a base this mechanism did not create it for' });
      continue;
    }
    try {
      deleteBranch(exec, repo, branch);
      rows.push({ action: 'branch-deleted', branch });
    } catch (err) {
      rows.push({ action: 'branch-delete-failed', branch, error: String(err?.message ?? err) });
    }
  }
  return rows;
}
