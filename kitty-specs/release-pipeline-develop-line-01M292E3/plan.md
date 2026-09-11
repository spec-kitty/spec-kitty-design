# Implementation Plan: Release pipeline develop-line governance

**Branch**: `mission/release-pipeline-develop-line` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `kitty-specs/release-pipeline-develop-line-01M292E3/spec.md`

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
second time, as the plan workflow requires, precisely because the two are easy to conflate and
`spec.md`'s own Notes section records that a prior reading of this mission's `meta.json` almost
did.

## Summary

REL1 (#362) makes `develop` (the RC line, epic #361) governable and reachable before REL2 (#363)
needs it: a ruleset artifact giving `develop` main-is-safe parity (minus a narrower, stricter
merge-method set), `ci-quality.yml` coverage extended to `develop`, and the operator-ruled
promotion mechanism (Option D, tree-sync, spec.md Recorded Decisions) implemented as a
`workflow_dispatch`-and-push-triggered GitHub Actions workflow backed by a new, repo-scoped
GitHub App. It also records the GitHub Packages ruling (FR-006) and adds a three-branch model doc
(FR-009). It does not create `develop`, does not apply the ruleset, and does not implement REL2's
rc-publish workflow or any `.npmrc`/registry change (C-004) — those stay REL2/REL3 (#363/#364)
and the orchestrator (Sequencing, `spec.md`).

## Technical Context

**Language/Version**: Node.js 22 (matches `ci-quality.yml`'s pinned `setup-node` version
everywhere else in this repo), plain `.mjs` with only `node:*` built-ins — no new npm dependency.
**Primary Dependencies**: `@commitlint/lint` + `@commitlint/load` (already a transitive
dependency of `@commitlint/cli`, already used the same way by `scripts/check-commitlint-config.mjs`
— verified resolvable, research.md R8) for the message-format self-test; `git` and `gh` CLIs
(both preinstalled on `ubuntu-latest` GitHub-hosted runners) for the production `run` path;
`actions/create-github-app-token@bcd2ba49218906704ab6c1aa796996da409d3eb1` (v3.2.0, research.md
R1) to mint the App token.
**Storage**: N/A — no persisted data; the `develop` ruleset artifact is a committed JSON file
(`contracts/develop-ruleset.json` here, landing at `.github/rulesets/develop-ruleset.json`), not a
database.
**Testing**: this repository's own `scripts/*.mjs` convention (research.md R8) — pure functions
plus a `--selftest` probe table run against scratch git repositories under `os.tmpdir()`, wired as
an unconditional `[ENFORCED]` step in `ci-quality.yml`'s `lint-code` job (research.md R9). No
vitest file is added; vitest in this repo covers component behaviour, not `scripts/` CLIs.
**Target Platform**: GitHub Actions (`ubuntu-latest`), triggered by pushes to
`train/elements-first` and by `workflow_dispatch`.
**Project Type**: Single project — this is CI/governance tooling inside the existing monorepo, not
a new package; no `packages/*` boundary is touched (ADR-8's `tokens → styles → elements → react`
dependency chain is unaffected).
**Performance Goals**: N/A in the ADR-8 sense (no runtime/browser performance surface). The
workflow's own job timeout (20 minutes, of which the poll loop is capped at 15 — research.md R5)
is the only "performance" figure this mission sets, and it is a ceiling against a hang, in the
same spirit as the ceilings `ci-quality.yml`'s own header comment documents for every other job.
**Constraints**: no ruleset bypass actor (C-005; confirmed unnecessary for Option D); no merge
commits on `develop` (NFR-005); zero unpinned actions in any workflow file touched or added
(NFR-001) — verified automatically by `scripts/check-action-pins.sh`, which globs
`.github/workflows/*.yml` directory-wide and needs no edit to also cover the new file.
**Scale/Scope**: one new workflow file, two new `scripts/*.mjs` files (plus a small
`scripts/lib/promote-github.mjs` helper), one JSON ruleset artifact, one `ci-quality.yml` filter
edit, one new doc (`docs/architecture/branch-model.md`), one doc correction
(`docs/design-system/using-components.md`'s `## Installation` section). Single bounded work
package (see WP Shape, below).

## Charter Check

*GATE: must pass before Phase 0 research; re-checked after Phase 1 design (below).*

`spec-kitty charter context --action plan --json` was run and its "Action Doctrine (plan)"
reference set and `all_directives` list were read. **The Policy Summary section of
`.kittify/charter/charter.md` is stale and was not applied where it conflicts with this
repository's real state**: it describes an Angular component library, SCSS token sources, and
npm-only publishing — none of which match `CLAUDE.md`'s Four-package Lit/custom-elements
architecture (ADR-8), the CSS-custom-property token source (`packages/tokens/src/tokens.css`), or
the operator's 2026-09-11 GitHub-Packages-only ruling this very mission records (FR-006). This is
consistent with the standing memory finding that `charter.md` is hand-curated and can drift from
actual project policy; it is noted here rather than silently followed or silently ignored.

**Directives applied** (from `all_directives`, matched against what this plan actually does):

- **DIRECTIVE_025 (Boy Scout Rule)** — its "adjacent gap folding" clause is the same fold-in
  standing order already stated in this mission's brief; applied throughout (see Fold-ins, below).
- **DIRECTIVE_045 (PRs-only, read-intent-first)** — this plan never proposes a direct push to
  `develop` or `main`; every state change to a governed branch goes through a PR (the promotion
  PR) or an explicit, out-of-band orchestrator act (ruleset application, branch cut).
- **DIRECTIVE_050 (Credential Handling Discipline)** — the App private key and minted token are
  read only into `env:` for the steps that need them and never echoed; the workflow contract
  (`contracts/promote-develop.workflow.yml`) does not `run: echo`, print, or log either.
- **DIRECTIVE_034 / DIRECTIVE_041 (Test-First / Tests as Scaffold)** — the promotion script's
  test plan (`contracts/promotion-script.contract.md`) is red-first by construction: probe 5
  is expected to fail (proving the withdrawn Option B's conflict claim), and probe 4 re-derives
  Option D's no-conflict claim rather than assuming spec.md's one-off scratch-repo session still
  holds.
- **DIRECTIVE_003 (Decision Documentation)** — every design decision this plan makes beyond the
  operator's six rulings (merge method, App permission set, secret names, polling identity, where
  the parity check lives) is stated with its rationale in `research.md`, not just asserted.
- Not applied: the SPDD/REASONS directive (DIRECTIVE_038) — this mission has not opted into that
  paradigm; the bulk-edit directive (DIRECTIVE_035) — this is not a rename/bulk-edit mission.

**Result**: PASS. No unresolved Charter Check violation; Complexity Tracking (below) is empty.

## Project Structure

### Documentation (this mission)

```
kitty-specs/release-pipeline-develop-line-01M292E3/
├── spec.md                                    # already exists; Recorded Decisions added this phase
├── plan.md                                    # this file
├── research.md                                # Phase 0 output
├── data-model.md                              # Phase 1 output
├── contracts/
│   ├── promote-develop.workflow.yml           # drop-in draft for .github/workflows/promote-develop.yml
│   ├── develop-ruleset.json                   # drop-in draft for .github/rulesets/develop-ruleset.json
│   └── promotion-script.contract.md           # scripts/promote-develop.mjs's function/CLI/probe contract
└── quickstart.md                              # Phase 1 output — operator/orchestrator walk-through
```

### Source code (repository root)

```
.github/
├── workflows/
│   ├── ci-quality.yml            # EDIT: pull_request/push branch filters gain `develop` (FR-003)
│   └── promote-develop.yml       # NEW: from contracts/promote-develop.workflow.yml
└── rulesets/
    └── develop-ruleset.json      # NEW: from contracts/develop-ruleset.json (FR-001); applied by
                                   #      the orchestrator, not by any workflow in this PR (C-003)

scripts/
├── promote-develop.mjs                # NEW: decidePromotion / buildCommitMessage / createTreeSyncCommit
│                                       #      / readRefTip, plus the `run` CLI entry (FR-007)
├── check-develop-ruleset-parity.mjs   # NEW: diffRulesetParity + --selftest / --check (FR-001, NFR-004)
└── lib/
    └── promote-github.mjs             # NEW: gh-CLI-backed PR effects (open/reuse/supersede/merge/comment)

docs/
├── architecture/
│   └── branch-model.md                        # NEW (FR-009): what main/train/develop are each for
└── design-system/
    └── using-components.md                    # EDIT: `## Installation` corrected to GitHub Packages
                                                 #       (research.md R11), cross-referencing FR-006's
                                                 #       ruling recorded in this same section
```

**Structure Decision**: single project, no new `packages/*` or `apps/*` directory — this is CI
tooling living beside the repository's existing `scripts/` and `.github/workflows/` conventions.
The "Option 1/2/3" placeholders in the template above do not apply and are omitted.

## Charter Check (post-design)

Re-checked after Phase 1 (research.md, data-model.md, contracts/): no new gap. The `develop`
ruleset artifact's one intentional deviation from literal `main-is-safe` parity
(`allowed_merge_methods: ["rebase"]`, narrower — data-model.md `DevelopRulesetArtifact`) is named
and justified (research.md R6); C-005 does not require operator approval for it because it is not
a bypass actor, not a `required_linear_history` drop, and not a `code_scanning` weakening — the
three named triggers C-005 itself lists. Recorded here rather than left implicit.

## Complexity Tracking

*Empty — no Charter Check violation requires justification.*

## Implementation Concern Map

> Concerns, not work packages (see WP Shape below for why this mission stays one WP regardless).

### IC-01 — `develop` CI coverage

- **Purpose**: make `ci-quality.yml` run its full gate on `develop`, additively.
- **Relevant requirements**: FR-002, FR-003, FR-004, NFR-002, SC-002, SC-003.
- **Affected surfaces**: `.github/workflows/ci-quality.yml` — `on.pull_request.branches` and
  `on.push.branches` each gain `develop`. No job body changes: FR-004 already records that the
  only branch-scoped `if:` in the file (`security`'s nightly-CVE `github.ref == 'refs/heads/main'`
  guard) is unaffected by adding a third branch to the top-level trigger filters.
- **Sequencing/depends-on**: none — this edit is safe to land whether or not `develop` exists yet
  (an unmatched branch filter is simply inert until the branch is created).
- **Risks**: none identified. This is the smallest, least risky concern in the mission.

### IC-02 — Promotion mechanism (workflow + script)

- **Purpose**: implement Option D exactly as `contracts/promote-develop.workflow.yml` and
  `contracts/promotion-script.contract.md` specify.
- **Relevant requirements**: FR-007 (a–h), FR-008, FR-010, NFR-003, NFR-005, C-001, C-005.
- **Affected surfaces**: `.github/workflows/promote-develop.yml`, `scripts/promote-develop.mjs`,
  `scripts/lib/promote-github.mjs`.
- **Sequencing/depends-on**: none for landing the code (the workflow safely no-ops until
  `develop` exists — Edge Cases, `spec.md`). Its first real, non-no-op run cannot happen until
  the orchestrator's post-merge Sequencing steps (below) complete — that is expected and stated,
  not a defect to fix in this WP.
- **Risks**: the App does not exist until the org owner creates it (Operator Actions, below); the
  workflow will fail fast and clearly (not silently) on every push until the two secrets are set
  — this is the intended behaviour (FR-007's fail-fast requirement), not a bug to route around
  with a feature flag.

### IC-03 — Promotion script test suite

- **Purpose**: the red-first `--selftest` probe table (`contracts/promotion-script.contract.md`),
  proving both Option D's no-conflict claim and Option B's withdrawn conflict claim are real.
- **Relevant requirements**: NFR-003, NFR-005 (the "verified for the recommended mechanism in a
  scratch repository" clause), the memory rule that a gate over an empty set must fail (probe 9,
  the floor assertion).
- **Affected surfaces**: same files as IC-02 (the pure functions and the probe table live beside
  each other, per this repo's convention — research.md R8).
- **Sequencing/depends-on**: IC-02 (the functions under test must exist first, though in practice
  a red-first suite is written test-first against the not-yet-implemented functions — DIRECTIVE_034).
- **Risks**: none beyond ordinary implementation risk.

### IC-04 — `develop` ruleset artifact and parity check

- **Purpose**: the JSON artifact (`contracts/develop-ruleset.json`) and its parity checker
  (`scripts/check-develop-ruleset-parity.mjs`).
- **Relevant requirements**: FR-001, NFR-004 (resolved as "no ruleset for `train/elements-first`
  in this mission" — spec.md Recorded Decision #6), SC-001.
- **Affected surfaces**: `.github/rulesets/develop-ruleset.json`,
  `scripts/check-develop-ruleset-parity.mjs`.
- **Sequencing/depends-on**: none to land; its `--check` mode is an Orchestrator Action (below),
  not part of this PR's own CI (research.md R10).
- **Risks**: none identified.

### IC-05 — Branch-model doc and the GitHub Packages ruling record

- **Purpose**: FR-009's three-branch doc, and FR-006's packages ruling recorded in
  `docs/design-system/using-components.md` (correcting its stale `npm install` instructions in
  the same edit — research.md R11).
- **Relevant requirements**: FR-006, FR-009, SC-006, SC-007.
- **Affected surfaces**: `docs/architecture/branch-model.md` (new),
  `docs/design-system/using-components.md` (`## Installation` section).
- **Sequencing/depends-on**: none.
- **Risks**: none identified.

## Promotion algorithm (FR-007, spec.md Option D)

1. Read `train/elements-first`'s tip (`github.sha` in CI) → `{trainSha, trainTree}`.
2. `readRefTip(cwd, 'origin/develop')` → `{developSha, developTree}` or `null`.
3. List open PRs with `head` matching `promote/*` and `base: develop` (`gh pr list --base develop
   --head promote/... --state open`, via the App token) → `existingPr` or `null`.
4. `decidePromotion({...})` (data-model.md `PromotionDecision`) returns one of five outcomes:
   - **`no-op-missing-develop`** — exit 0, print a `::notice::` naming the missing branch. Matches
     the Edge Case requiring a clean no-op that neither fails the run nor creates `develop` itself.
   - **`no-op-in-sync`** — exit 0, print a `::notice::`. Idempotency (NFR-003), re-derived by
     probe 2.
   - **`reuse-existing-pr`** — exit 0, print the existing PR's number and its current
     `mergeable_state`; do not open a duplicate (the named edge case).
   - **`supersede-and-open`** — comment on the stale PR ("superseded by #<new>, train advanced to
     `<sha>` before this PR merged"), close it, delete its branch, then proceed as `open-new`.
   - **`open-new`** — `createTreeSyncCommit`, push `promote/<trainSha>`, `gh pr create --base
     develop --head promote/<trainSha> --title "<header>" --body "<body>"` (data-model.md
     `PromotionCommitMessage`), then poll.
5. **Polling** (only for `supersede-and-open` / `open-new` / a freshly-`reuse`d PR not yet
   mergeable): `GET .../pulls/{n}` every 5s, backing off to 30s, for at most 15 minutes
   (research.md R5). On `mergeable_state: 'clean'` (or the merge attempt itself succeeds — R3),
   `gh pr merge <n> --rebase` (research.md R6). On a poll-budget timeout, leave the PR open, post
   a comment naming the last observed `mergeable_state`, print a `GITHUB_STEP_SUMMARY` line for
   the same reason (FR-010's "run output, not just the PR"), and exit 1 — surfaced as a failed
   Actions run, which is the correct signal for "this needs a human," not a silent hang.
6. On successful merge: no branch-delete call needed for `develop`-side cleanup beyond the
   promotion branch itself; `delete_branch_on_merge` being `false` repo-wide (Key Entities,
   `spec.md`) means the script explicitly deletes `promote/<trainSha>` after merge
   (`gh api -X DELETE .../git/refs/heads/promote/<trainSha>`) — otherwise every promotion cycle
   leaves a dead branch behind indefinitely, an accumulation this mission's own FR-010
   observability goal would otherwise have to explain away forever.

## Failure modes and what each run leaves behind

| Failure | What the run does | What it leaves behind |
|---|---|---|
| `develop` doesn't exist yet | No-op, exit 0 | Nothing. Safe to run on every push before the orchestrator cuts `develop`. |
| Nothing new to promote | No-op, exit 0 | Nothing new; an already-merged `develop` stays as-is. |
| A promotion PR is already open and current | Reuse, exit 0 | The existing open PR, untouched. |
| `train` moved again before the open PR merged | Supersede: close old PR + delete old branch, open new PR | Exactly one open promotion PR at any time (never zero *or* two, once a promotion is due) — verified by probes 6/7. |
| CodeQL (or any ruleset rule) blocks the PR | Poll exhausts its 15-minute budget, comment + step-summary naming the last `mergeable_state`, exit 1 | The PR stays open and blocked — a human must resolve the underlying finding or override; the workflow never bypasses `code_scanning` (C-005; this is the one failure mode this mechanism must never route around). |
| The App token's ~1h lifetime is approached | Does not occur in practice — the poll budget (15m) is well under it (research.md R5) | N/A; no re-mint logic needed, unlike `spec-kitty-events`'s longer-running job. |
| The two secrets are missing | The fail-fast step exits 1 immediately, before minting anything | A clear `::error::` in the run log naming both secrets and pointing at `docs/architecture/branch-model.md`; no token minted, no branch touched, no PR opened — the workflow never "pretends" the promotion happened (FR-007's fail-fast requirement, verbatim). |

## App permissions and secrets (research.md R2)

**App name**: `spec-kitty-design-release` (proposal; changed only with a stated reason — none
found during this plan).

| Permission | Level |
|---|---|
| Contents | Read & write |
| Pull requests | Read & write |
| Workflows | Read & write |
| Metadata | Read (automatic) |

**Not requested**: Administration, Checks, Code scanning alerts, Actions (research.md R2, R3).

**Secrets** (repository-level, on `spec-kitty/spec-kitty-design` only): `SK_DESIGN_RELEASE_APP_ID`,
`SK_DESIGN_RELEASE_APP_PRIVATE_KEY` (proposal, as named in this mission's brief; changed only with
a stated reason — none found). Distinct from the org-wide `SK_CI_APP_ID` /
`SK_CI_APP_PRIVATE_KEY` pair (`spec-kitty-factory-ci`), which this ruling explicitly does not
reuse or widen (spec.md Recorded Decision #2).

**Identity for check/status polling**: the App token, not `GITHUB_TOKEN` — research.md R4.

## WP shape

**One work package, one PR** — matching #362's own stated shape. IC-01 through IC-05 are tightly
coupled (the workflow depends on the script; the script's test suite is inseparable from the
script; the ruleset artifact and its parity checker are two small files; the docs are two short
edits) and none is independently mergeable in a way that would reduce risk or review burden —
splitting them would only add cross-PR coordination for a deliverable epic #361 and issue #362
already scoped as one bounded unit. No hard reason to split was found.

## Fold-ins (operator's standing fold-in order)

Per the fold-in standing order (adjacent gap → this mission's scope, named here rather than
deferred), this plan folds in:

1. **Correcting `docs/design-system/using-components.md`'s stale `npm install` instructions**
   (research.md R11) while recording FR-006's ruling in the same section — leaving the doc's own
   worked example contradicting the ruling it sits beside would defeat FR-006's purpose.
2. **Recommending `actions/create-github-app-token` v3.2.0** over blindly copying the org's
   existing (15-releases-stale) v1.9.3 pin (research.md R1) — this mission adds a brand-new
   workflow, so there is no "existing pin to match" pressure the way an edit to an existing
   workflow would have, and using a materially newer, verified-compatible release costs nothing.
3. **`GITHUB_STEP_SUMMARY` output**, not just a PR comment, for FR-010 — a maintainer looking at a
   failed Actions run gets the outcome without opening the PR.

**Named exclusions** (adjacent gaps that belong to a named sibling issue or need an operator
decision, per the brief — not silently folded):

- REL2's rc-publish workflow and its own trigger choice (`push` vs. `workflow_dispatch`) — owned
  by #363, per spec.md Recorded Decision #3 ("this mission does not decide REL2's trigger").
- The `.npmrc` flip, GitHub Packages registry configuration, and any actual publish code — owned
  by #363/#364 (C-004).
- A ruleset for `train/elements-first` itself — spec.md Recorded Decision #6 rules this out for
  *this* mission by name; it is not silently reopened here. A future mission or operator decision
  owns it if it is ever taken up.
- Wiring `check-develop-ruleset-parity.mjs --check` into automatic CI once `develop` exists
  (research.md R10) — named as future scope, not started here, because no code path in this PR
  can exercise it before `develop`'s ruleset exists to compare against.

## Sequencing: operator and orchestrator actions

Restated from `spec.md`'s Sequencing section, with owners made explicit per this mission's brief.

**Operator** (before this mission's PR can do anything beyond fail fast):

1. Create the GitHub App `spec-kitty-design-release` with exactly the permission set above.
2. Install it on `spec-kitty/spec-kitty-design` **only** — no other repository.
3. Add the two repository secrets (`SK_DESIGN_RELEASE_APP_ID`, `SK_DESIGN_RELEASE_APP_PRIVATE_KEY`)
   to `spec-kitty/spec-kitty-design`.
4. Approve this mission's implemented PR (FR-008) before it merges into `train/elements-first` —
   the mechanism is already ruled; the concrete workflow, the App's actual grant, and the ruleset
   artifact still need this review.

**Orchestrator** (after this mission's PR merges into `train/elements-first` — C-003, Sequencing):

1. Cut `develop` from `train/elements-first`'s new head.
2. Apply `contracts/develop-ruleset.json` (as landed at `.github/rulesets/develop-ruleset.json`):
   `gh api -X POST repos/spec-kitty/spec-kitty-design/rulesets --input
   .github/rulesets/develop-ruleset.json` — immediately preceded by
   `node scripts/check-develop-ruleset-parity.mjs --check` (research.md R10) so the artifact
   applied is confirmed still in parity with the live `main-is-safe` at apply time, not merely at
   this plan's write time.
3. Push one plain commit to `develop` (the code-scanning bootstrap mitigation, `spec.md`
   Sequencing) *before* the promotion workflow's first non-no-op cycle, then confirm
   `gh api repos/.../branches/develop --jq .protected` reads `true` and at least one
   push-triggered CodeQL analysis exists for `refs/heads/develop`
   (`gh api repos/.../code-scanning/analyses?ref=refs/heads/develop`).
4. Only after step 3 is confirmed: let (or manually trigger via `workflow_dispatch`) the first real
   promotion cycle run.

## Next steps

`/spec-kitty.tasks` translates the Implementation Concern Map above into work packages. Given the
WP Shape finding, expect it to produce one work package covering IC-01 through IC-05, or to
explain in its own output why it split further — this plan does not pre-empt that judgment, it
only records that no split was found necessary here.
