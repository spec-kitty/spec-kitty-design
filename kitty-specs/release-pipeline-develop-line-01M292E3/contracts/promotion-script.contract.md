# Contract: `scripts/promote-develop.mjs`

**Revised** after the post-plan squad's B1/B2/B3/M6/M8/M9 findings. Follows this repository's
`scripts/*.mjs` shape (research.md R8): pure functions, exported for direct import by the
self-test, plus a thin CLI. `run` mode's module graph is `node:*` only — `@commitlint/*` is
reached exclusively via a dynamic `import()` inside `--selftest` (research.md R13).

## Exported pure functions

```js
// Pure. The decision algorithm's entire branching logic, including the divergence health check
// (B1/FR-007(d)) — a sixth outcome, refuse-diverged, alongside the original five.
export function decidePromotion({ trainSha, trainTree, developSha, developTree, existingPr,
                                    developHealthy, divergence }) {
  // developSha === null                                          -> 'no-op-missing-develop'
  // developHealthy === false                                     -> 'refuse-diverged'
  // developTree === trainTree                                    -> 'no-op-in-sync'
  //   (and: if existingPr is non-null here, it is now STALE — the caller closes it; R21)
  // existingPr && existingPr.headTree === trainTree               -> 'reuse-existing-pr'
  // existingPr && existingPr.headTree !== trainTree               -> 'supersede-and-open'
  // !existingPr && developTree !== trainTree                      -> 'open-new'
  // Order matters: missing-develop and diverged are both checked before anything else touches
  // trainTree/developTree/existingPr.
}

// Pure. research.md R12 — healthy iff developSha is on the train's first-parent history, or is a
// promotion commit whose Train-SHA trailer names a train commit with a matching tree.
export function isDevelopHealthy(developSha, trainFirstParentShas, trailerLookup) { /* … */ }

// Pure string builder. Revised message shape (B2, data-model.md PromotionCommitMessage): the
// full SHA moves to a `Train-SHA:` trailer; the body is now a fixed, short sentence.
export function buildCommitMessage(sha) { /* … */ }

// Pure. B4/M4 — GitHub's documented GraphQL MergeStateStatus enum, not the REST mergeable_state
// string. Returns 'attempt-merge' | 'poll-again' | 'recheck-divergence' | 'fail-anomaly'.
export function assessMergeReadiness({ mergeable, mergeStateStatus }) { /* data-model.md table */ }

// Pure. M6 — `gh pr list --head` is an exact match (verified), so discovery is list-then-filter.
export function findPromotionPRs(prListJson) { /* filters headRefName.startsWith('promote/') */ }

// Pure. M5 — fails closed unless the installation covers exactly spec-kitty/spec-kitty-design.
export function assertSingleRepoScope(installationRepositoriesJson) { /* … */ }

// Shells out to git in `cwd` (a real checkout in production, a scratch repo in tests). Returns
// the new commit SHA. Never touches the network or a remote.
export function createTreeSyncCommit(cwd, { tree, parentSha, message }) { /* git commit-tree */ }

// Resolves `ref`'s tip { sha, tree } via git in `cwd`. Distinguishes "confirmed absent" (a prior
// remote ls-remote already said so — returns null) from "should exist but did not resolve
// locally" (throws) — research.md R19's squad correction; these are NOT the same signal.
export function readRefTip(cwd, ref, { confirmedAbsent = false } = {}) { /* … */ }
```

The GitHub-facing effects — list/open/comment/close/merge a PR, push a branch, mint-then-checkout
ordering, the bot-identity `git config` calls, `--match-head-commit`, the post-merge tree
assertion, the `promote/*` sweep — live in `scripts/lib/promote-github.mjs`, which takes an
injectable `exec` function (default `execFileSync`) so `--selftest` can substitute a **recording
shim** (research.md R23) instead of either calling real GitHub or hand-writing a second, parallel
simulation of the same calls.

## CLI

```
node scripts/promote-develop.mjs run          # the real thing; requires GH_TOKEN, GITHUB_REPOSITORY
node scripts/promote-develop.mjs decide ...    # prints one PromotionDecision as JSON; quickstart.md
node scripts/promote-develop.mjs --selftest   # red-first probe table; no network, no GH_TOKEN
```

## The floor sits OUTSIDE the probe table (M8, modelled on `scripts/gate-selftest.mjs:150-166`)

```js
const results = PROBES.map(runProbe);                      // { probe, ok, ... } per entry
const matched = results.filter(r => r.ok);
const expectedPass = PROBES.filter(p => p.expect === 'pass');
const expectedFail = PROBES.filter(p => p.expect === 'fail');
if (expectedPass.length === 0 || expectedFail.length === 0) {
  console.error('Refusing to report green over a degenerate probe set: '
    + `${expectedPass.length} expect-pass, ${expectedFail.length} expect-fail.`);
  process.exit(1);
}
if (matched.length !== PROBES.length) { /* report each mismatch by name; exit 1 */ }
```

A bare `PROBES.length >= N` count (the first revision's floor) is **not** this — it does not verify
every probe actually executed and matched its declared expectation, only that the array wasn't
shrunk. Both checks now run: the degenerate-set refusal above, plus the per-probe match assertion.

## Probe table (red-first, each entry carries `expect: 'pass' | 'fail'`)

Every probe runs against a **fresh scratch git repository** (`mkdtempSync`), identity set via
`GIT_AUTHOR_NAME`/`GIT_AUTHOR_EMAIL`/`GIT_COMMITTER_NAME`/`GIT_COMMITTER_EMAIL` environment
variables on each `execFileSync('git', ...)` call — **not** `git config --global`, which a CI
runner has none of and a developer's real workstation has ones that must not be touched
(research.md R14). Cleaned up in a `finally`.

| # | Probe | expect | Setup | Assertion |
|---|---|---|---|---|
| 1 | Missing `develop` | pass | scratch repo with only `train`, no prior remote check | `decidePromotion` returns `no-op-missing-develop`; `readRefTip(cwd, ref)` (no `confirmedAbsent`) throws if called on a nonexistent ref without that flag — only the caller who already ran the remote check may pass `confirmedAbsent: true` to get `null` back (R19). |
| 2 | Already in sync, no PR | pass | `develop`/`train` same tree | `no-op-in-sync`. Re-run with no change: still `no-op-in-sync` (NFR-003). |
| 3 | Fresh promotion, parent is exact | pass | `develop` behind `train` by one commit | `open-new`; `createTreeSyncCommit`'s result has tree = train's tree, and **`git rev-list --parents -1 <new-sha>` (`%P`)** is exactly `develop`'s previous tip — not merely "one parent," the *specific* SHA (M8's tightened assertion). |
| 4 | Two-cycle tree-sync, full postcondition | pass | cycle 1 as in probe 3 (merged); `train` advances again, including a change to a line the promoted commit also touched | After cycle 2: `develop^{tree}` equals the current train tree, **each** promoted commit has exactly one parent, and **each** carries a `Train-SHA:` trailer naming the train commit it promoted (M8: the previous version only asserted "no conflict" — this asserts the full postcondition). |
| 5 | Two-cycle squash **does** conflict — product probe, not a self-proof | fail | same two-cycle setup, but cycle 1 via `git merge --squash train` instead of `createTreeSyncCommit`; cycle 2 via a plain `git merge train` | The plain merge in cycle 2 exits **non-zero**, **and** `develop` is left with the merge unresolved (no commit landed) — both conditions checked (M8: asserting only the exit code would make this a self-proving tautology about squash, not a check that anything downstream actually stays unmerged). If this probe's setup ever stops reproducing the conflict, Option D's justification has gone stale and the suite must fail loudly here, not pass quietly — hence `expect: 'fail'` is itself asserted by the floor check above, not just documented in prose. |
| 6 | Existing PR, tree still current | pass | `existingPr.headTree === trainTree` | `reuse-existing-pr` — no duplicate opened. |
| 7 | Existing PR, train moved again | pass | `existingPr.headTree !== trainTree` | `supersede-and-open`. |
| 8 | Message format, real commitlint, dynamic import only | pass | `buildCommitMessage('0123456789abcdef0123456789abcdef01234567')` | Header and body and trailer each pass `@commitlint/lint` against this repo's real, loaded config (dynamic `import()`, not a static top-level one — a companion assertion spawns `node scripts/promote-develop.mjs run` in a child process with `@commitlint/*` hidden from module resolution and asserts it does **not** fail on a missing-module error). Header ≤ 100, body line ≤ 100, trailer line ≤ 100 — all three checked, not assumed. |
| 9 | Diverged `develop`: unrelated direct commit | pass (expect `refuse-diverged`) | a commit landed on `develop` with no `Train-SHA:` trailer and not on `train`'s first-parent history | `isDevelopHealthy` returns `false`; `decidePromotion` returns `refuse-diverged` with a `divergence.reason` naming the commit. |
| 10 | `develop` moves between PR-open and merge-attempt | pass (expect `recheck-divergence` / supersede, not a merge) | after `open-new` computes and opens a PR, mutate `develop`'s tip locally (simulating a concurrent write) before the merge step runs | The merge step re-reads `develop`'s live tip, finds it no longer matches the PR's parent, and does **not** call merge — it supersedes instead (R12); the `--match-head-commit` argument recorded by the dry-run shim (probe 12) additionally proves the merge call itself, had it been attempted, would have carried the now-stale SHA and been rejected server-side as defense in depth. |
| 11 | Mutation control: broken `createTreeSyncCommit` | fail (as a defeat, i.e. the harness must catch it) | monkey-patch the real, already-loaded `createTreeSyncCommit` to build the wrong tree | The surrounding probe-4-style postcondition check **fails** — proving the postcondition assertion actually discriminates, modelled on `scripts/check-gate-wiring-defeats.mjs`'s mutate-the-real-thing shape (research.md R8), never a hand-written second simulation. |
| 12 | Mutation control: reordered decision branches | fail (as a defeat) | monkey-patch `decidePromotion` to check `existingPr` before `developHealthy` | Probe 9's diverged case now wrongly returns `reuse-existing-pr`/`open-new` instead of `refuse-diverged` when both conditions hold simultaneously — the harness must report this as caught, proving branch **order**, not just branch presence, is under test. |
| 13 | `assessMergeReadiness`, all seven states + null | pass (7) / see table | `{mergeable: null}`, then all seven documented `mergeStateStatus` values with `mergeable: true` (plus `DIRTY` with `mergeable: false`) | Matches data-model.md's `MergeReadiness` table exactly, one probe per row. |
| 14 | `findPromotionPRs`: 0, 1, 2+ | pass (3) | synthetic `gh pr list` JSON with 0, 1, and 2 `promote/*`-headed entries among non-matching ones | Returns the right subset each time; the 2+ case is what R22's sweep (probe 16) then acts on. |
| 15 | `assertSingleRepoScope`: 0, 1-correct, 1-wrong, 2+ | pass (4) | synthetic `GET /installation/repositories` bodies | Fails closed on every shape except exactly-one-correct. |
| 16 | `promote/*` sweep | pass | two open promotion PRs (oldest superseded, newest kept) plus one branch with no PR | Oldest PR closed with a comment naming the newest; branch-with-no-PR deleted; a simulated delete failure is reported as a named, non-fatal row (research.md R22), not a suite failure. |
| 17 | Dry-run / recorded invocation | pass (6, one per outcome) | the recording shim from `scripts/lib/promote-github.mjs` | For each of the six `PromotionDecision` outcomes, the exact `gh`/`git` argv sequence matches what that outcome should do — `no-op-*` and `refuse-diverged` record zero mutating calls. |
| 18 | Probe-count floor | pass | — | `PROBES.length >= 18` (this table's own size) **and** the degenerate-set / per-probe-match checks above — the count alone is necessary but the floor code block earlier in this file is what actually enforces the meaningful part (M8). |

Exit code: `0` only if the floor-outside-table checks both pass; `1` otherwise, with every
mismatched probe named on stderr.

## `scripts/check-develop-ruleset-parity.mjs`

```js
// Compares EVERY parameter, at every nesting level (M10) — not a curated subset. Ignores only
// response-only fields (id, node_id, _links, current_user_can_bypass, created_at, updated_at,
// source, source_type).
export function diffRulesetParity(live, artifact) {
  // Returns [] only when the full structures match except the two named, documented differences
  // (name, conditions.ref_name.include, pull_request.allowed_merge_methods).
}
```

- `--selftest`: same floor-outside-table shape as above — a same-shaped fixture (expect `[]`) and
  a different-shaped fixture (expect a non-empty diff naming the field) are both required; a
  fixture that silently reintroduces a bypass actor, and one missing `code_scanning` entirely, are
  both included.
- `--check`: **now wired into CI** (research.md R25) — a scheduled job and a `push`-to-`develop`
  job in `ci-quality.yml`, not a manual-only orchestrator step. Fetches the live ruleset via `gh
  api repos/spec-kitty/spec-kitty-design/rulesets/<id>` (the id recorded in `branch-model.md` after
  the orchestrator's post-apply verification, R25) and the local `.github/rulesets/develop-ruleset.json`.
