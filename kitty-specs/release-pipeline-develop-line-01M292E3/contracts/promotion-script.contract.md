# Contract: `scripts/promote-develop.mjs`

**Revised** after the post-plan squad's B1/B2/B3/M6/M8/M9 findings, and again after the WP01
pre-merge squad's two gate passes (PR #429 — B1-B5/M1-M11, then F1-F11). Follows this
repository's `scripts/*.mjs` shape (research.md R8): pure functions, exported for direct import
by the self-test, plus a thin CLI. `run` mode's module graph is `node:*` only — `@commitlint/*`
is reached exclusively via a dynamic `import()` inside `--selftest` (research.md R13).

**F8 (gate pass 2)**: this file had drifted from the shipped code across all nineteen prior fold
commits — it still named 18 probes with the original numbering and still prescribed a
self-referential in-table floor row that fold M3 deleted from the actual `--selftest`. Both are
corrected below to match the shipped probe table exactly (`scripts/promote-develop.mjs`
itself is authoritative for the literal assertions; this table is authoritative for the *shape*
and *numbering* a reader should expect to find there). **V5 (gate pass 3)** added probe 23
below; keep this table's row count and `PROBE_FLOOR` in sync on every future fold rather than
letting either drift again.

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
// F1 (gate pass 2): filters on the EXACT `promote/<40-hex>` shape (`PROMOTION_BRANCH_RE`,
// scripts/lib/promote-github.mjs), never a loose `startsWith('promote/')` — a human's own
// `promote/my-feature` PR into `develop` must never be adopted as `existingPr`.
export function findPromotionPRs(prListJson) { /* filters headRefName against PROMOTION_BRANCH_RE */ }

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
| 5 | Two-cycle squash **does** conflict — JUSTIFICATION probe (it tests git's own merge behaviour, not this product's code, and is excluded from the degenerate-set polarity count for that reason — M4), not a self-proof | fail | same two-cycle setup, but cycle 1 via `git merge --squash train` instead of `createTreeSyncCommit`; cycle 2 via a plain `git merge train` | The plain merge in cycle 2 exits **non-zero**, **and** `develop` is left with the merge unresolved (no commit landed) — both conditions checked (M8: asserting only the exit code would make this a self-proving tautology about squash, not a check that anything downstream actually stays unmerged). If this probe's setup ever stops reproducing the conflict, Option D's justification has gone stale and the suite must fail loudly here, not pass quietly — hence `expect: 'fail'` is itself asserted by the floor check above, not just documented in prose. |
| 6 | Existing PR, tree still current | pass | `existingPr.headTree === trainTree` | `reuse-existing-pr` — no duplicate opened. |
| 7 | Existing PR, train moved again | pass | `existingPr.headTree !== trainTree` | `supersede-and-open`. |
| 8 | Message format, real commitlint, dynamic import only | pass | `buildCommitMessage('0123456789abcdef0123456789abcdef01234567')` | Header and body and trailer each pass `@commitlint/lint` against this repo's real, loaded config (dynamic `import()`, not a static top-level one — a companion assertion spawns `node scripts/promote-develop.mjs run` in a child process with `@commitlint/*` hidden from module resolution and asserts it does **not** fail on a missing-module error). Header ≤ 100, body line ≤ 100, trailer line ≤ 100 — all three checked, not assumed. |
| 9 | Diverged `develop`: unrelated direct commit, no existing PR | pass (expect `refuse-diverged`) | a commit landed on `develop` with no `Train-SHA:` trailer and not on `train`'s first-parent history | `isDevelopHealthy` returns `false`; `decidePromotion` returns `refuse-diverged` with a `divergence.reason` naming the commit. |
| 10 | Diverged `develop`, WITH a stale existing PR | pass (expect `refuse-diverged`) | same divergence as probe 9, plus an `existingPr` whose `headTree !== trainTree` (which alone would select `supersede-and-open`) | Divergence must win regardless of `existingPr` — this is the branch-**order** property probe 13's mutation control (below) breaks on purpose. |
| 11 | `develop` moves between PR-open and merge-attempt (decision-level) | pass (expect `refuse-diverged` on re-decide, never a blind merge) | after `open-new` computes and opens a PR, mutate `develop`'s tip locally (simulating a concurrent write, no `Train-SHA:` trailer) before re-deciding | Re-deciding against the new tip returns `refuse-diverged`, never `reuse-existing-pr`/`open-new` — probe 19 (below) covers the SEPARATE, `pollAndMerge`-level re-read that runs immediately before the actual merge call. |
| 12 | Mutation control: broken `createTreeSyncCommit` | fail (as a defeat, i.e. the harness must catch it) | monkey-patch the real, already-loaded `impl.createTreeSyncCommit` to build the wrong tree | The surrounding probe-4-style postcondition check **fails** — proving the postcondition assertion actually discriminates, modelled on `scripts/check-gate-wiring-defeats.mjs`'s mutate-the-real-thing shape (research.md R8), never a hand-written second simulation. |
| 13 | Mutation control: reordered decision RULES | fail (as a defeat) | `decidePromotion`'s branching lives as an ORDERED ARRAY of small rule functions on `impl.decisionRules` (M2, gate pass 2) — this probe reorders the array itself (moves the real `ruleDiverged` past `ruleReuse`/`ruleSupersede`), never a hand-reimplementation of the decision function | Probe 10's diverged-with-existing-PR scenario, re-run through the REAL, reordered `impl.decidePromotion`, now wrongly returns `reuse-existing-pr`/`supersede-and-open` instead of `refuse-diverged` — the harness must report this as caught, proving branch **order**, not just branch presence, is under test. |
| 14 | `assessMergeReadiness`, all seven states + null | pass (7) / see table | `{mergeable: null}`, then all seven documented `mergeStateStatus` values with `mergeable: true` (plus `DIRTY` with `mergeable: false`) | Matches data-model.md's `MergeReadiness` table exactly, one probe per row. |
| 15 | `findPromotionPRs`: 0, 1, 2+, and a loosely-prefixed human branch | pass (5) | synthetic `gh pr list` JSON with 0, 1, and 2 exact-shape `promote/<40-hex>`-headed entries among non-matching ones, plus one entry headed `promote/my-feature` (a real, human-plausible branch name) | Returns the right exact-shape subset every time; `promote/my-feature` is NEVER adopted, alone or alongside a real entry (F1, gate pass 2 — a human PR into `develop` must not be mistaken for this mechanism's own). |
| 16 | `assertSingleRepoScope`: 0, 1-correct, 1-wrong, 2+ | pass (4) | synthetic `GET /installation/repositories` bodies | Fails closed on every shape except exactly-one-correct. |
| 17 | `promote/*` sweep | pass | two open promotion PRs (oldest superseded, newest kept), one branch with no PR, and (B5) one branch with an open PR to a DIFFERENT base | Oldest PR closed with a comment naming the newest; branch-with-no-PR deleted; the other-base-PR branch is PROTECTED and never deleted even with no base-`develop` PR of its own; a simulated delete failure is reported as a named, non-fatal row (research.md R22), not a suite failure; the exact-shape `PROMOTION_BRANCH_RE` itself is also asserted directly, including (V4, gate pass 3) that a 39-hex and a 41-hex branch name are BOTH rejected — a boundary a loosened `{7,40}`-style regex would pass. |
| 18 | Dry-run / recorded invocation, FULL argv | pass (6, one per outcome) | every `decision` is produced by calling the REAL `impl.decidePromotion` against real scratch-repo state (M2, gate pass 2 — never a hand-built literal, so a branch-name-prefix mutation shows up as a mismatched command instead of still passing a prefix check) | For each of the six `PromotionDecision` outcomes, the exact, FULL `gh`/`git` argv sequence (including the literal branch name) matches what that outcome should do — `no-op-*` and `refuse-diverged` record zero mutating calls. |
| 19 | `pollAndMerge`: live-tip re-read, post-merge tree verification, and the merge argv itself | pass (3 sub-cases) | a recording `exec`; (a) `develop`'s live tip has moved since the decision, (b) the live tip matches but the post-merge tree does not equal the promoted train tree, (c) the happy path | (a) refuses, never calls `gh pr merge`; (b) the merge is attempted but the mismatch is caught, exit non-zero; (c) merges, and the recorded `gh pr merge` argv is asserted in FULL — `--rebase --match-head-commit <prHeadSha>` — not merely that some `gh pr merge` call happened (F2, gate pass 2: deleting `--match-head-commit` entirely left this probe green before this fix, because nothing checked the argv contents). `--match-head-commit` pins the PR's own HEAD, never `develop`'s tip (corrected comment, `scripts/lib/promote-github.mjs`, B2) — the live-tip re-read in (a)/(b) is the SEPARATE defense against `develop` moving. |
| 20 | The sweep runs on every outcome | pass (2 sub-cases) | `runCycle` invoked with `no-op-missing-develop` and with `refuse-diverged` — both outcomes that returned early, before the sweep, in the version that first shipped (M1) | The sweep's own reads (`gh pr list`) are observed in the recorded calls for BOTH outcomes — "every run" (R22) now means every run, via a `finally`. |
| 21 | Mutation control: `promote/` → `sync/` prefix drift | fail (as a defeat) | monkey-patch the real `ruleOpenNew`/`ruleSupersede` (via `impl.decisionRules`) to build a `sync/<sha>` branch name instead of `promote/<sha>` | The REAL, unmutated `findPromotionPRs` no longer recognizes a PR headed that way — proving construction and recognition are joined at the hip, and a prefix drift is a real, product-level regression (duplicate PRs forever), not something the previous 19/19 suite could see (the "surviving mutant" a pre-merge lens demonstrated against it — M2, gate pass 2). |
| 22 | A human `promote/my-feature` PR is neither closed nor deleted by the sweep | pass | a recording `exec` returns a human-headed PR/branch from `listOpenPRsBaseDevelop`/`listOpenPromotionHeadPRsAnyBase`/`listPromotionBranches`; `runCycle` invoked end to end | None of the recorded calls comment on, close, or delete the human PR/branch (F1, gate pass 2 — complements probe 15's selection-only coverage with the sweep's closing/deletion halves). |
| 23 | `applyOutcome`'s own delete-site guard, bypassing `findPromotionPRs` entirely | pass | a `decision.existingPr` constructed directly with `branch: 'promote/my-feature'` (a malformed, non-exact-shape branch a caller could in principle hand `applyOutcome` without going through `findPromotionPRs` at all) | `deleteBranch` is never called for that branch, even though `applyOutcome` still comments, closes, and pushes/creates as normal (V5, gate pass 3 — probe 15/22 only prove selection-time filtering; this probe proves the deletion call site's OWN guard, `scripts/promote-develop.mjs`'s `applyOutcome`, independently refuses too). |

Exit code: `0` only if the floor-outside-table checks both pass; `1` otherwise, with every
mismatched probe named on stderr. `PROBE_FLOOR` in `scripts/promote-develop.mjs` is `23`,
matching this table's own row count exactly — there is no second, in-table floor row (M3, gate
pass 1: the original revision of this table carried an 18th row asserting `PROBES.length >= 18`
INSIDE the table, which fold M3 deleted from the shipped code as "a second floor the contract
itself forbids" one section above; that row is not restored here).

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
