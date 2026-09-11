# Contract: `scripts/promote-develop.mjs`

Follows this repository's established `scripts/*.mjs` shape (research.md R8): pure functions,
exported for direct import by the self-test, plus a thin CLI. No new npm dependency — only
`node:child_process`, `node:fs`, `node:os`, `node:path`, plus `@commitlint/lint` /
`@commitlint/load` (already present, used the same way `scripts/check-commitlint-config.mjs`
already uses them) for the message-format probe.

## Exported pure functions

```js
// Pure — no I/O. The decision algorithm's entire branching logic lives here so it can be
// unit-tested exhaustively without touching git or the network.
export function decidePromotion({ trainSha, trainTree, developSha, developTree, existingPr }) {
  // developSha === null                                        -> 'no-op-missing-develop'
  // developTree === trainTree                                  -> 'no-op-in-sync'
  // existingPr && existingPr.headTree === trainTree             -> 'reuse-existing-pr'
  // existingPr && existingPr.headTree !== trainTree             -> 'supersede-and-open'
  // !existingPr && developTree !== trainTree                    -> 'open-new'
  // Returns a PromotionDecision (data-model.md). Order matters: missing-develop is checked
  // before anything else touches trainTree/developTree.
}

// Pure string builder. `sha` is a full 40-hex train commit SHA.
export function buildCommitMessage(sha) {
  // header: `chore(release): promote ${sha.slice(0, 7)} to develop`
  // body:   `Promotes train/elements-first@${sha} to develop via tree-sync promotion.`
}

// Shells out to git in `cwd` (a real checkout in production, a scratch repo in tests).
// Returns the new commit SHA. Never touches the network or a remote.
export function createTreeSyncCommit(cwd, { tree, parentSha, message }) { /* git commit-tree */ }

// Reads `ref`'s tip { sha, tree } via git rev-parse in `cwd`, or null if the ref does not resolve
// (the `develop`-does-not-exist-yet case, Edge Cases in spec.md).
export function readRefTip(cwd, ref) { /* … */ }
```

The GitHub-facing effects — list/open/comment/close/merge a PR, push a branch, poll
`mergeable_state` — live in a separate, thin module (`scripts/lib/promote-github.mjs`) that shells
out to `gh` (`execFileSync('gh', [...], { env: { ...process.env, GH_TOKEN } })`). That module is
**not** exercised by `--selftest` (research.md R8) — it has no pure logic to probe, only argument
plumbing, and probing it would mean either mocking `gh` (testing the mock, not the behaviour) or
hitting real GitHub from CI (a network dependency this repo's test culture avoids —
`check-offline-load.mjs`'s whole thesis). The production `run` path is what exercises it, and
FR-010's PR-comment observability is itself the evidence a real run worked.

## CLI

```
node scripts/promote-develop.mjs run        # the real thing; requires GH_TOKEN, GITHUB_REPOSITORY
node scripts/promote-develop.mjs --selftest # red-first probe table; no network, no GH_TOKEN
```

## `--selftest` probe table (red-first)

Every probe is run against a **fresh scratch repository** under `mkdtempSync(join(tmpdir(), …))`,
cleaned up in a `finally`. This is the same experiment `spec.md`'s "Verifying the git mechanics"
section already ran by hand — encoded here so it is re-derived on every CI run (NFR-002's
principle, applied to this mission's own claims about its own mechanism) rather than trusted from
a one-off scratch-repo session.

| # | Probe | Setup | Expected |
|---|---|---|---|
| 1 | Missing `develop` | scratch repo with only `train` | `decidePromotion` returns `no-op-missing-develop`; `readRefTip` returns `null` for a nonexistent ref, not a thrown error. |
| 2 | Already in sync | `develop` and `train` at the same tree | `decidePromotion` returns `no-op-in-sync`. Re-running with no change: **still** `no-op-in-sync`, not a duplicate branch/commit (NFR-003). |
| 3 | Fresh promotion | `develop` behind `train` by one commit, no existing PR | `decidePromotion` returns `open-new`; `createTreeSyncCommit` produces a commit whose tree equals train's and whose sole parent is `develop`'s tip; `git rev-list --count <new-sha>` minus `git rev-list --count <develop-tip>` is exactly 1 (linear, NFR-005). |
| 4 | Two-cycle tree-sync (no conflict) | Cycle 1 as in #3; advance `train` again (including a change to a line `develop`'s promoted commit also touched — the exact shape `spec.md` reproduced); run again with `existingPr` reflecting cycle 1's now-merged state | `createTreeSyncCommit` succeeds with **zero** conflict markers and **zero** non-zero exit from `git commit-tree` — this is Option D's core claim, re-derived, not assumed. |
| 5 | Two-cycle squash **would** conflict (negative control) | Same two-cycle setup as #4, but using `git merge --squash train` for cycle 1 instead of `createTreeSyncCommit`, then a plain `git merge train` for cycle 2 | The plain merge in cycle 2 **exits non-zero with a CONFLICT**. This probe is expected to fail-as-designed — it exists to prove the withdrawn Option B's conflict claim is real and reproducible, not asserted prose. If this probe ever stops conflicting, Option D's justification (research.md R6, `spec.md`'s Options table) has silently gone stale and the self-test must fail loudly, not pass quietly. |
| 6 | Existing PR, tree still current | `existingPr.headTree === trainTree` | `decidePromotion` returns `reuse-existing-pr` — never opens a second PR (the duplicate-PR edge case). |
| 7 | Existing PR, train moved again | `existingPr.headTree !== trainTree` | `decidePromotion` returns `supersede-and-open`. |
| 8 | Message format, real commitlint | `buildCommitMessage('a'.repeat(40))` and `buildCommitMessage('0123456789abcdef0123456789abcdef01234567')` | Both headers pass `@commitlint/lint` against this repo's real, loaded config (`@commitlint/load`) with `result.valid === true` — the same API `scripts/check-commitlint-config.mjs` already uses, so this probe cannot drift from the enforced rules by reimplementing them. Header length asserted `<= 100` (config-conventional's `header-max-length`) explicitly, in addition to the real lint call, so a future edit to the message template that grows the header shows a comprehensible failure rather than only commitlint's generic message. |
| 9 | Probe-count floor | — | `PROBES.length >= 9`, this table's own size, mirroring `check-release-graph.mjs`'s `--selftest` floor pattern (`scripts/check-release-graph.mjs:743`) — a probe table that silently shrinks to zero is the same defect an empty-set gate is (memory: "gates must refuse empty sets"). |

Exit code: `0` only if every probe's actual outcome matches its expected outcome (including probe
5, whose "expected" is a conflict) — `1` otherwise, with each failing probe named on stderr.

## `scripts/check-develop-ruleset-parity.mjs`

A second, small script — the `DevelopRulesetArtifact` comparison (data-model.md).

```js
export function diffRulesetParity(live, artifact) {
  // Returns [] when every row of data-model.md's table holds; otherwise an array of
  // { field, expected, actual } mismatches.
}
```

- `--selftest`: fixtures covering (a) a correct artifact against a synthetic "live" object shaped
  like `main-is-safe`'s real JSON, expecting `[]`; (b) an artifact that silently reintroduces a
  bypass actor, expecting a non-empty diff; (c) an artifact missing the `code_scanning` rule
  entirely, expecting a non-empty diff naming it. No network.
- `--check`: fetches the live `main-is-safe` via `gh api repos/spec-kitty/spec-kitty-design/rulesets/15855418`
  and the local `.github/rulesets/develop-ruleset.json`, prints any diff, exits non-zero if
  non-empty. **Not wired into `ci-quality.yml`** (research.md R10) — run manually by the
  orchestrator immediately before applying the ruleset (Sequencing, `spec.md`; Orchestrator
  Actions, `plan.md`).
