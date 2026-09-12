# Implementation Plan: Release pipeline develop-line governance

**Branch**: `mission/release-pipeline-develop-line` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `kitty-specs/release-pipeline-develop-line-01M292E3/spec.md`

**Revision note**: this plan was revised after a post-plan adversarial squad (architect, debugger,
reviewer, planner — three NOT-READY, one READY-WITH-FOLDS) reported four blockers and twenty
majors, all adjudicated as fold-ins. Every section below reflects the folded-in state; `research.md`
carries the verification trail and the one adjudication I flagged rather than silently accepted
(the CodeQL timing estimate, R5).

## Branch contract (stated per `/spec-kitty.plan`'s protocol)

`spec-kitty agent mission setup-plan` resolves this mission's internal bookkeeping branch —
where `kitty-specs/**` commits land — as follows, and it is **the same branch at every stage**
here because this mission runs under `single_branch` topology (spec.md, Notes: this is the
prevailing convention on this train, not an anomaly):

- **Current branch at plan start**: `mission/release-pipeline-develop-line`
- **Intended planning/base branch**: `mission/release-pipeline-develop-line`
- **Final merge target for `kitty-specs/**` commits**: `mission/release-pipeline-develop-line`
  (`branch_matches_target: true`)

**This is not the GitHub PR base.** Per C-001 (`spec.md`) and the operator standing order in
`docs/architecture/elements-first-run-prompt.md`, the actual pull request this mission opens
targets **`train/elements-first`**, never `main` and never `develop` directly. `target_branch`
above is `spec-kitty`'s own artifact-commit bookkeeping, not a GitHub PR base — restated here a
second time, as the plan workflow requires.

## Summary

REL1 (#362) makes `develop` (the RC line, epic #361) governable and reachable before REL2 (#363)
needs it: a ruleset artifact giving `develop` main-is-safe parity (minus a narrower, stricter
merge-method set), `ci-quality.yml` coverage extended to `develop`, and the operator-ruled
promotion mechanism (Option D, tree-sync, spec.md Recorded Decision) implemented as a job inside
`ci-quality.yml`, gated on the train's own quality gate, backed by a new, repo-scoped GitHub App.
**Revised in this pass**: the mechanism now detects and refuses a diverged `develop` rather than
only disclaiming the risk (B1); its commit message fits `body-max-line-length` via a trailer (B2);
its identity setup mints before checkout and sets a real bot git identity (B3); it is gated on
real CI via the job graph rather than an unreachable poll target, and no longer runs the full
~30-minute suite redundantly on every promotion cycle (B4). It also records the GitHub Packages
ruling (FR-006, now entirely inside `branch-model.md` — not `using-components.md`, a scope
boundary with REL3/#364) and adds the three-branch model doc (FR-009). It does not create
`develop`, does not apply the ruleset, and does not implement REL2's rc-publish workflow or any
`.npmrc`/registry change (C-004) — those stay REL2/REL3 (#363/#364) and the orchestrator.

## Technical Context

**Language/Version**: Node.js 22, plain `.mjs` with only `node:*` built-ins in the `run` path —
`@commitlint/lint`/`@commitlint/load` are reached via a **dynamic** `import()` inside `--selftest`
only (research.md R13), so `run` mode's module graph never depends on them.
**Primary Dependencies**: `git` and `gh` CLIs (preinstalled on `ubuntu-latest`);
`actions/create-github-app-token@bcd2ba49218906704ab6c1aa796996da409d3eb1` (v3.2.0).
**Storage**: N/A — the `develop` ruleset artifact is a committed JSON file
(`.github/rulesets/develop-ruleset.json`), not a database.
**Testing**: this repository's `scripts/*.mjs` convention (research.md R8), **upgraded** in this
revision to match two existing, more rigorous patterns rather than the first draft's simpler one:
a floor computed *outside* the probe table requiring both expected-pass and expected-fail probes
(`scripts/gate-selftest.mjs`'s shape), and mutation controls that patch the real, already-loaded
functions and assert the surrounding harness still catches the mutation
(`scripts/check-gate-wiring-defeats.mjs`'s shape). No vitest file is added.
**Target Platform**: GitHub Actions (`ubuntu-latest`), as a job inside `ci-quality.yml` gated on
that workflow's own `gate` job (research.md R15) — not a separate top-level workflow file.
**Project Type**: Single project — CI/governance tooling inside the existing monorepo.
**Performance Goals**: the promotion job's own timeout (15 minutes, of which the merge-readiness
poll is capped at 10 — research.md R5, explicitly a provisional estimate) is the only ceiling this
mission sets, in the same "ceiling, not target" spirit `ci-quality.yml`'s own header comment
states for every other job.
**Constraints**: no ruleset bypass actor (C-005; unnecessary for Option D); no merge commits on
`develop` (NFR-005); zero unpinned actions (NFR-001, verified automatically —
`check-action-pins.sh` globs `.github/workflows/*.yml` directory-wide).
**Scale/Scope** (revised — larger than the first pass, per the folds below): one new job inside
`.github/workflows/ci-quality.yml` (`promote-develop`) plus edits to that same file's trigger block,
four existing jobs' `if:` guards, and the `gate` job's tolerance logic; one edit to
`.github/workflows/pr-preview.yml`; three new `scripts/*.mjs` files
(`promote-develop.mjs`, `check-develop-ruleset-parity.mjs`, `lib/promote-github.mjs`); one edit
each to `scripts/check-gate-wiring.mjs` and `scripts/check-gate-wiring-defeats.mjs`; one JSON
ruleset artifact (`.github/rulesets/develop-ruleset.json`); one new doc
(`docs/architecture/branch-model.md`, now carrying the GitHub Packages ruling too); one added
cross-link line in `docs/architecture/elements-first-run-prompt.md`. **No edit to
`docs/design-system/using-components.md`** in this revision (M15 — REL3/#364's surface).

## Charter Check

*GATE: must pass before Phase 0 research; re-checked after Phase 1 design (below).*

Unchanged from the first pass: `.kittify/charter/charter.md`'s Policy Summary is stale (describes
an Angular/SCSS stack this repository does not have) and was not applied where it conflicts;
DIRECTIVE_025 (Boy Scout / fold-in), DIRECTIVE_045 (PRs-only), DIRECTIVE_050 (credential handling),
DIRECTIVE_034/041 (test-first, tests as scaffold), and DIRECTIVE_003 (decision documentation) were
applied and are reconfirmed by this revision's own scope (every one of B1-B4/M1-M20 is documented
with its rationale in `research.md`, not just asserted; every new git-identity/credential step in
`contracts/promote-develop.workflow.yml` reads secrets into `env:` and never logs them).
**Additionally applied this pass**: DIRECTIVE_048 (Version Governance) — every GitHub-behaviour
claim in this revision is checked against a live, current source (a live GraphQL schema
introspection query for `MergeStateStatus`, a live `gh api` call for the action's own releases, the
action's own current README) rather than carried forward from memory, and R5 explicitly refuses to
present an unverifiable figure as if it were measured.

**Result**: PASS. Complexity Tracking (below) is empty.

## Project Structure

### Documentation (this mission)

```
kitty-specs/release-pipeline-develop-line-01M292E3/
├── spec.md                                    # Recorded Decision quoted+separated (M12); refuse-diverged (B1)
├── plan.md                                    # this file
├── research.md                                # R1-R29 (R10/R11 explicitly superseded, kept for the trail)
├── data-model.md                              # PromotionDecision (6 outcomes), commit message w/ trailer, MergeReadiness
├── contracts/
│   ├── promote-develop.workflow.yml           # the promote-develop JOB (for ci-quality.yml)
│   ├── ci-quality-integration.md              # NEW: the other ci-quality.yml/pr-preview.yml/gate-wiring edits
│   ├── develop-ruleset.json                   # unchanged shape; bootstrap variant is a documented jq transform, not a 2nd file
│   └── promotion-script.contract.md           # revised: 22 probes (F8, gate pass 2 — was 18 through the WP01 pre-merge squad's first pass), floor-outside-table, mutation controls
└── quickstart.md                              # revised: M1 bootstrap re-sequence
```

### Source code (repository root)

```
.github/
├── workflows/
│   ├── ci-quality.yml            # EDIT: develop in trigger filters (FR-003); NEW promote-develop
│   │                              #       job (needs: gate); 4 heavy jobs + gate gain promote/*
│   │                              #       handling (contracts/ci-quality-integration.md)
│   └── pr-preview.yml            # EDIT: skip promote/* heads
└── rulesets/
    └── develop-ruleset.json      # NEW: from contracts/develop-ruleset.json (FR-001); applied by
                                   #      the orchestrator via the revised bootstrap sequence (M1),
                                   #      not by any workflow in this PR (C-003)

scripts/
├── promote-develop.mjs                  # NEW: decidePromotion / isDevelopHealthy /
│                                         #      buildCommitMessage / assessMergeReadiness /
│                                         #      findPromotionPRs / assertSingleRepoScope /
│                                         #      createTreeSyncCommit / readRefTip, plus the CLI
├── check-develop-ruleset-parity.mjs     # NEW: diffRulesetParity (full-parameter) + --selftest / --check
├── check-gate-wiring.mjs                # EDIT: 2 new REQUIRED_LINT entries; 'develop' in branch-coverage
├── check-gate-wiring-defeats.mjs        # EDIT: 2 new defeat cases (contracts/ci-quality-integration.md §5)
└── lib/
    └── promote-github.mjs               # NEW: gh-CLI-backed PR effects, injectable exec (dry-run/recording shim)

docs/
└── architecture/
    ├── branch-model.md                        # NEW (FR-009): three-branch model, GitHub Packages
    │                                           #   ruling (FR-006, moved here per M15), the
    │                                           #   develop-tree-is-promotion-only invariant (M14),
    │                                           #   post-merge observation queries (M11), source-
    │                                           #   variable cutover caveat (research.md R17)
    └── elements-first-run-prompt.md           # EDIT (M16): one cross-link line to branch-model.md
```

**Structure Decision**: single project, no new `packages/*` or `apps/*` directory.
**No edit to `docs/design-system/using-components.md`** (M15 — see Fold-ins, Named exclusions).

## Charter Check (post-design)

Re-checked: the `develop` ruleset's one intentional deviation from literal `main-is-safe` parity
(`allowed_merge_methods: ["rebase"]`) is unchanged and still does not require operator approval
under C-005 (research.md R6). The `gate` job's new `promote/*` tolerance branch
(`contracts/ci-quality-integration.md` §3) is a new, narrowly-scoped exception to an existing
strict check — named explicitly, with its own defeat-table row, rather than a silent loosening.

## Complexity Tracking

*Empty — no Charter Check violation requires justification.*

## Implementation Concern Map

> Concerns, not work packages (see WP Shape below).

### IC-01 — `develop` CI coverage

- **Purpose**: `ci-quality.yml` runs its full gate on `develop`, additively.
- **Relevant requirements**: FR-002, FR-003, FR-004, NFR-002, SC-002, SC-003.
- **Affected surfaces**: `.github/workflows/ci-quality.yml` trigger block.
- **Sequencing/depends-on**: none.
- **Risks**: none. Verification tied to IC-06's gate-wiring registration (research.md R29).

### IC-02 — Promotion mechanism: divergence-safe, CI-gated, identity-correct

- **Purpose**: implement Option D as revised — the six-outcome decision algorithm including
  `refuse-diverged` (B1), the `promote-develop` job inside `ci-quality.yml` gated on `gate` (B4),
  mint-before-checkout identity with a real bot git identity (B3), the App-scope runtime guard
  (M5), PR discovery via list+filter (M6), and the `promote/*` scratch-namespace sweep (M7).
- **Relevant requirements**: FR-007 (a-h), FR-008, FR-010, NFR-003, NFR-005, C-001, C-005.
- **Affected surfaces**: `.github/workflows/ci-quality.yml` (new job + 4 jobs' guards + `gate`
  tolerance), `.github/workflows/pr-preview.yml`, `scripts/promote-develop.mjs`,
  `scripts/lib/promote-github.mjs`.
- **Sequencing/depends-on**: none for landing the code — the job safely no-ops until `develop`
  exists and `PROMOTE_DEVELOP_ENABLED` is `true` (Edge Cases, spec.md; research.md R16/R17).
- **Risks**: the `gate` job's tolerance-logic edit touches heavily-probed code
  (`check-gate-wiring-defeats.mjs`'s own history records two prior defeats of similar edits) —
  mitigated by scoping it as narrowly as possible and requiring its own defeat-table row
  (`contracts/ci-quality-integration.md` §3, §5) rather than a general loosening.

### IC-03 — Promotion script test suite

- **Purpose**: the red-first, floor-outside-table, mutation-controlled probe table
  (`contracts/promotion-script.contract.md`, 22 probes as shipped — F8/F9, gate pass 2).
- **Relevant requirements**: NFR-003, NFR-005, the memory rule that a gate over an empty/degenerate
  set must fail, and DIRECTIVE_034/041.
- **Affected surfaces**: same files as IC-02.
- **Sequencing/depends-on**: IC-02.
- **Risks**: none beyond ordinary implementation risk.

### IC-04 — `develop` ruleset artifact and its live-CI parity check

- **Purpose**: the JSON artifact and `check-develop-ruleset-parity.mjs`'s full-parameter
  comparison, now wired into a scheduled + `develop`-push CI job (M10), not manual-only.
- **Relevant requirements**: FR-001, NFR-004 (resolved as the operator's ruling — M19), SC-001.
- **Affected surfaces**: `.github/rulesets/develop-ruleset.json`,
  `scripts/check-develop-ruleset-parity.mjs`, `.github/workflows/ci-quality.yml` (schedule +
  `develop`-push trigger for the `--check` step).
- **Sequencing/depends-on**: none to land; its `--check` mode only produces a meaningful result
  once `develop`'s ruleset exists (a no-op/skip before then, stated explicitly rather than left to
  fail confusingly).
- **Risks**: the token-permission needed to read a live ruleset in a scheduled job is asserted, not
  independently proven in advance (research.md R25) — flagged as a residual to confirm on the
  first real scheduled run.

### IC-05 — Branch-model doc, GitHub Packages ruling, and the cross-link

- **Purpose**: FR-009's three-branch doc, now also carrying FR-006's packaging ruling (M15), the
  develop-tree-is-promotion-only invariant and REL2 seam statement (M14), the post-merge
  observation queries for SC-004/SC-005 (M11), and the source-variable cutover caveat
  (research.md R17); plus the one-line cross-link from `elements-first-run-prompt.md` (M16).
- **Relevant requirements**: FR-006, FR-009, SC-006, SC-007.
- **Affected surfaces**: `docs/architecture/branch-model.md` (new),
  `docs/architecture/elements-first-run-prompt.md` (one line).
- **Sequencing/depends-on**: none.
- **Risks**: none identified. **No longer touches** `docs/design-system/using-components.md`
  (M15 — see Fold-ins).

### IC-06 — Gate-wiring registration

- **Purpose**: register both new self-tests in `REQUIRED_LINT`, add `develop` to the
  branch-coverage list, and add the two new defeat-table cases (M9, tied to M17's verification
  requirement).
- **Relevant requirements**: NFR-001-adjacent (the same "a deletable gate is not a gate" principle
  `check-gate-wiring.mjs` exists for), M17's verification-path requirement for FR-003/NFR-002.
- **Affected surfaces**: `scripts/check-gate-wiring.mjs`, `scripts/check-gate-wiring-defeats.mjs`.
- **Sequencing/depends-on**: IC-01 (the branch-coverage addition) and IC-02/IC-03 (the
  `REQUIRED_LINT` entries need the self-test invocations to exist first).
- **Risks**: `check-gate-wiring-defeats.mjs`'s second new case (§5 of
  `ci-quality-integration.md`) requires `check-gate-wiring.mjs` itself to gain a new assertion for
  the `gate` tolerance branch's conditionality — this is real, non-trivial implementation work
  inside an already-hardened file, named explicitly here as the highest-risk single piece of this
  mission rather than glossed over as "just add a case."

## Promotion algorithm (FR-007, spec.md Option D, revised)

**Order of checks** (research.md R19, cheapest/most-decisive first):

1. **Enable switch** (`vars.PROMOTE_DEVELOP_ENABLED`) — no I/O.
2. **`develop` exists?** — `git ls-remote` against the public repo, no auth needed. Absent → no-op,
   exit 0, **never touching secrets**.
3. **Secrets present?** (research.md R7's env-var-then-shell-test pattern) — fail fast, clear
   message, if not.
4. **Mint the App token, then checkout with it** (research.md R14) — `persist-credentials: true`
   (default) means every later `git` command is already authenticated as the App.
5. **App-scope runtime guard** (`assertSingleRepoScope`, M5) — fail closed unless the installation
   covers exactly `spec-kitty/spec-kitty-design`.
6. **Set the bot git identity** from the App's own resolved slug + user id (research.md R14).

**Then, the decision** (`decidePromotion`, data-model.md `PromotionDecision`, six outcomes):

- Read `train`'s tip live (`git ls-remote` against `PROMOTE_SOURCE_REF`, **never `github.sha`** —
  research.md R18) → `{trainSha, trainTree}`.
- Read `develop`'s tip and assess its health (`isDevelopHealthy`, research.md R12).
- List open `base:develop` PRs and filter client-side on `promote/*` (research.md R21 — `gh pr list
  --head` is an exact match, unusable for a prefix search).
- `decidePromotion(...)` returns one of:
  - **`no-op-missing-develop`** / **`no-op-in-sync`** — exit 0, `::notice::`. An in-sync result
    with a still-open promotion PR additionally **closes that PR** (it is now stale — R21).
  - **`refuse-diverged`** — exit 1 (a governance anomaly, not a routine outcome), the specific
    reason in `GITHUB_STEP_SUMMARY` and in a run annotation; never merges, never force-pushes.
  - **`reuse-existing-pr`** — exit 0, prints the PR number and current `mergeStateStatus`.
  - **`supersede-and-open`** — comment + close the stale PR, delete its branch, then `open-new`.
  - **`open-new`** — `createTreeSyncCommit`, push `promote/<trainSha>`, open the PR
    (`buildCommitMessage`, data-model.md — header + fixed body + `Train-SHA:` trailer), then poll.

**Polling and merge** (`assessMergeReadiness`, data-model.md `MergeReadiness`, the documented
GraphQL `MergeStateStatus` enum — research.md R3):

- `CLEAN`/`HAS_HOOKS` → attempt merge. `UNSTABLE` → attempt merge (justified: the only checks that
  can be non-passing here are the now-skipped, non-required `ci-quality.yml` re-run — research.md
  R15). `BLOCKED`/`UNKNOWN` → poll again (bounded to 10 minutes total, research.md R5 — an
  explicitly provisional estimate, flagged for recalibration in Orchestrator Actions below).
  `BEHIND` → **re-run the divergence health check** rather than blindly re-polling — this is the
  live signal that `develop` moved. `DIRTY` → anomaly, fail loudly, do not retry.
- **The merge call itself**: `gh pr merge <n> --rebase --match-head-commit <PR-head-sha>`
  (research.md R6/R12) — **corrected here** (pre-merge squad, B2, PR #429): an earlier revision of
  this line named the argument `<develop-tip-sha>`, but `gh pr merge --help` and the GitHub REST
  merge endpoint's own `sha` parameter (both cited in research.md R6) document it as the commit SHA
  the pull request's own **HEAD** must match, never the base — GitHub refuses the merge
  server-side if the PR's head branch changed since that SHA was read (e.g. a force-push), which is
  a narrower, separate defense from `develop` having moved. The defense against `develop` moving is
  the script's own explicit re-read of `develop`'s live tip immediately before this call
  (`scripts/promote-develop.mjs`'s `pollAndMerge`), not this flag.
- **Post-merge**: assert `develop^{tree}` equals the promoted train tree, comparing the read
  against the train tree actually used for this cycle and exiting non-zero on a mismatch — not
  merely printing it (B2: the implementation shipped in PR #429 only printed the read value; two
  pre-merge lenses found nothing actually compared it, and `pollAndMerge` was not even passed the
  train tree to compare against).
- **Cleanup, every run — literally**: sweep `promote/*` (research.md R22) — close every promotion
  PR except the newest, delete every branch with no open PR, log (never fail on) a delete that
  itself fails. M1 (pre-merge squad, PR #429): "every run" means every run, including
  `no-op-missing-develop` and `refuse-diverged`, which returned before reaching the sweep in the
  implementation that first shipped; the sweep now runs from a `finally` so no outcome skips it.

## Failure modes and what each run leaves behind

| Failure | What the run does | What it leaves behind |
|---|---|---|
| Disabled (`PROMOTE_DEVELOP_ENABLED != 'true'`) | No-op, exit 0, `::notice::` | Nothing. The documented freeze switch. |
| `develop` doesn't exist yet | No-op, exit 0, no secrets touched | Nothing. |
| Nothing new to promote | No-op, exit 0; closes a now-stale open PR if one exists | An unchanged `develop`; no stray open PR. |
| A promotion PR is already open and current | Reuse, exit 0 | The existing open PR, untouched. |
| `train` moved again before the open PR merged | Supersede: close + delete old, open new | Exactly one open promotion PR at any time. |
| `develop` diverged (an unrelated direct commit, or a bypass) | `refuse-diverged`, exit 1, reason in the step summary | `develop` untouched; the anomaly is visible without opening a PR. |
| `develop` moves between PR-open and merge-attempt | Re-check divergence (via `BEHIND`); supersede rather than merge stale content; `--match-head-commit` is defense in depth | No merge over stale content, by two independent mechanisms. |
| CodeQL (or any ruleset rule) blocks the PR | Poll exhausts its 10-minute budget, comment + step-summary, exit 1 | The PR stays open and blocked — a human resolves it; `code_scanning` is never bypassed. |
| The App's installation is ever widened beyond this one repo | `assertSingleRepoScope` fails closed before any git/PR operation | Nothing touched; the governance drift is caught at runtime, not only at App-creation time. |
| The two secrets are missing | Fail-fast step exits 1 before minting anything | A clear `::error::` naming both secrets and `branch-model.md`; nothing pretended. |
| A `promote/*` branch delete fails during the sweep | Logged as a named, non-fatal row | A stray dead branch — a nuisance, not a promotion failure. |

## App permissions and secrets

**App name**: `spec-kitty-design-release`.

| Permission | Level |
|---|---|
| Contents | Read & write |
| Pull requests | Read & write |
| Workflows | Read & write |
| Metadata | Read (automatic) |

**Not requested**: Administration, Checks, Code scanning alerts, Actions (research.md R2/R3/R26 —
the one place `actions: write` matters, an optional REL2-owned `workflow_dispatch` call, uses the
*job's own* `GITHUB_TOKEN`, not this App, per the corrected reasoning in R26).

**Secrets**: `SK_DESIGN_RELEASE_APP_ID`, `SK_DESIGN_RELEASE_APP_PRIVATE_KEY`, on
`spec-kitty/spec-kitty-design` only. Distinct from the org-wide `SK_CI_APP_ID`/
`SK_CI_APP_PRIVATE_KEY` (`spec-kitty-factory-ci`), which is not reused (spec.md Recorded Decision).

**Runtime enforcement of the install boundary**: `assertSingleRepoScope` (M5) — the App's
permission grant is not only trusted from how it was created, it is checked at every run.

## WP shape — reassessed honestly after the folds

**Still one work package, one PR** — the issue's own stated shape — but this revision makes the WP
**substantially larger**: the promotion mechanism now touches an already-hardened, heavily-probed
file (`scripts/check-gate-wiring.mjs` and its defeat table) in addition to everything the first
pass scoped. I considered splitting into two WPs (e.g., "governance & CI coverage" — IC-01/04/05 —
as WP-A, "promotion mechanism" — IC-02/03/06 — as WP-B) and am **not** recommending it, for three
reasons: (1) the issue is explicit about one WP and no *hard* dependency reason (a technical
blocker, not just size) was found to override that; (2) IC-06's gate-wiring registration is not
independently valuable without IC-02/03 existing to register, so a split would not actually reduce
coupling, only add a second PR's coordination overhead for content that still has to land together
to mean anything; (3) the mechanism's pieces (workflow job, script, tests, ruleset, gate-wiring)
remain one coherent "how does code reach `develop`" concern — splitting along file boundaries
would not track a real seam. **What I do recommend**: internal commit-level separation within the
single PR (one commit per IC, in dependency order) so a reviewer can review IC-06's higher-risk
`check-gate-wiring.mjs` edit in isolation from the rest, without a second PR.

## Fold-ins (operator's standing fold-in order, and the post-plan squad's adjudicated folds)

**From the first pass** (unchanged): correcting stale doc prose alongside recording a ruling
(superseded — see Named exclusions, this doc's edit no longer touches `using-components.md`);
recommending the current `actions/create-github-app-token` release; a `GITHUB_STEP_SUMMARY` line
for FR-010.

**From the post-plan squad** (all twenty majors plus the four blockers folded; see research.md for
the verification behind each):

- B1 divergence detection and the `refuse-diverged` outcome.
- B2 the `Train-SHA:` trailer and dynamic-import-in-selftest-only.
- B3 mint-before-checkout, bot git identity, scratch-repo `GIT_*` env-var identity.
- B4 CI-gating via the job graph, the documented `MergeStateStatus` enum, the redundant-run
  mitigation for `promote/*` heads.
- M1 the bootstrap re-sequence (`enforcement: evaluate` first).
- M2 the enable switch and source-branch variable.
- M3 live train tip via `ls-remote`; the corrected `workflow_dispatch` activation condition.
- M4 the revised check order.
- M5 the App-scope runtime guard.
- M6 PR discovery via list+filter.
- M7 the `promote/*` scratch-namespace sweep.
- M8 floor-outside-the-table and mutation-control probes.
- M9/M17 gate-wiring registration and static verification paths for FR-002/FR-003/NFR-002/SC-001-003.
- M10 ruleset parity wired into scheduled/`develop`-push CI, full-parameter comparison, post-apply
  verification.
- M11 SC-004/SC-005 rewritten as in-PR-provable probes; the real, post-merge, ten-cycle
  observation moves to `branch-model.md`'s queries, named as REL2's (#363) to actually run — **a
  fold-in comment is posted on #363** naming this.
- M12 the Recorded Decision section now quotes the operator's four-item comment directly, with
  derived consequences listed separately.
- M13 stale "pending"/"recommendation" wording cleared throughout `spec.md`.
- M14 the develop-tree-is-promotion-only invariant, stated in `branch-model.md`; the corrected
  `GITHUB_TOKEN`/`workflow_dispatch` reasoning — **a fold-in comment is posted on #363** naming
  both.
- M16 the cross-link from `elements-first-run-prompt.md`.
- M18 every non-issue `#N` reworded (spec.md's Recorded Decision no longer uses "#" for ruling
  numbers at all).
- M19 "no ruleset for `train/elements-first`" recorded as the operator's ruling.
- M20 the concurrency comment, the "identity operation" claim, the error-message doc pointer, and
  the named NITs (header length, "two" vs. "three" named differences, backticks, function-name
  mismatches) all corrected — see research.md R6, R15, and the contracts files' own headers.

**Named exclusions** (adjacent gaps that belong to a named sibling issue or need an operator
decision — not silently folded):

- REL2's rc-publish workflow and its own trigger choice — owned by #363 (spec.md Recorded
  Decision). REL2 also now owns: keeping any rc version-bump state out of `develop`'s tree (M14),
  and actually running the real, ten-cycle SC-004/SC-005 observation once cycles exist (M11).
- The `.npmrc` flip, GitHub Packages registry configuration, actual publish code, **and now also
  `docs/design-system/using-components.md`'s stale `npm install` instructions** — all owned by
  #363/#364 (C-004, and M15's scope-boundary correction). **A fold-in comment is posted on #364**
  naming this explicitly, since the first revision of this plan had started to cross that boundary.
- A ruleset for `train/elements-first` itself — the operator's ruling (spec.md, M19) rules this out
  *for this mission* by name; a future mission or operator decision owns revisiting it.
- Recalibrating the 10-minute poll budget against the first real promotion cycle's observed CodeQL
  timing (research.md R5) — named as an Orchestrator Action below, not started here, because no
  real cycle can run before `develop` exists.

## Sequencing: operator and orchestrator actions (revised — M1)

**Operator** (before this mission's PR can do anything beyond fail fast):

1. Create the GitHub App `spec-kitty-design-release` with exactly the permission set above.
2. Install it on `spec-kitty/spec-kitty-design` **only**.
3. Add the two repository secrets.
4. Approve this mission's implemented PR (FR-008) before it merges into `train/elements-first`.
5. Leave `PROMOTE_DEVELOP_ENABLED` unset/`false` until orchestrator step 3, below.

**Orchestrator** (after this mission's PR merges — C-003; **revised order per M1/research.md R16**):

1. Cut `develop` from `train/elements-first`'s new head (a direct push — still possible, because
   no ruleset exists on `develop` yet at this exact moment).
2. Apply the ruleset **with `enforcement: "evaluate"`** (non-blocking) — record the returned
   ruleset id.
3. Flip `PROMOTE_DEVELOP_ENABLED` to `true`.
4. Wait for the first real promotion PR (the job's normal push-triggered run produces it on its
   own) and confirm it generated a CodeQL analysis of its own head
   (`refs/pull/N/head`, not `develop`'s push ref). If none appears: trigger CodeQL default setup
   manually, or wait for the weekly schedule (named fallback, `quickstart.md`).
5. Run `node scripts/check-develop-ruleset-parity.mjs --check`, then **PATCH** (not a second POST)
   the ruleset back to the committed artifact (`enforcement: "active"`, full five-rule set).
6. Post-apply verification (M10): exactly one active ruleset targets `develop`, it matches the
   artifact under the full-parameter comparison, and its id is recorded in `branch-model.md`.
7. After the first several real promotion cycles: recalibrate the 10-minute poll budget
   (`plan.md`'s Promotion algorithm) against observed CodeQL timing, and note the real figure in
   `research.md` R5 rather than leaving the provisional estimate standing indefinitely.

## Next steps

`/spec-kitty.tasks` translates the Implementation Concern Map above into work packages. Given the
WP Shape reassessment, expect one work package covering IC-01 through IC-06, sliced internally by
commit rather than by WP boundary.
