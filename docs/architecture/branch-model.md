# Branch model: `main`, `train/elements-first`, `develop`

Three long-lived branches carry this repository's code, once REL1 (#362, epic #361) lands and
the orchestrator cuts `develop`. This doc answers, without opening #361 or #362: what each
branch is for, which branch a given kind of change targets, and how code moves between them.

## The three branches

| Branch | What it is | Who writes to it | How |
|---|---|---|---|
| `main` | Production. The default branch. | The operator, only. | The train lands on `main` once, at the end, by an operator act — never a mission PR, never an automated push. |
| `train/elements-first` | The integration line (ADR-8). Where mission work lands. | Mission and contributor PRs. | A mission branches off `train/elements-first`, PRs back into it (`base: train/elements-first`), and the loop or a maintainer merges it once CI is green and review evidence is posted. See `docs/architecture/elements-first-run-prompt.md` for the full procedure — that doc's own standing order is "never branch from `main`, and never PR into `main`." |
| `develop` | The release-candidate (RC) line (epic #361 Decision A). Feeds REL2's (#363) rc-publish workflow. | The promotion mechanism only (below). | Nothing is ever PR'd or pushed to `develop` directly. |

**Which branch does my mission PR target?** `train/elements-first`, always. This does not change
because `develop` exists — `develop` is downstream of the train, not a second place mission work
lands.

**My fix needs to reach an already-cut RC.** It still lands on `train/elements-first` first, like
everything else. `develop`'s tree is written only by the promotion mechanism (below); a fix
that skips the train and lands directly on `develop` would make the *next* promotion cycle
incorrectly refuse `develop` as diverged (see "The develop-tree-is-promotion-only invariant"
below) — there is no shortcut.

## How `develop` receives commits: the promotion mechanism

Ruled by the operator 2026-09-11 (issue #362): **Option D, tree-sync promotion.** On every push
to `train/elements-first`, a job inside `.github/workflows/ci-quality.yml`
(`promote-develop`, gated on that workflow's own `gate` job) computes whether `develop`'s tree
already matches the train's tip. If not, it creates one new commit whose tree equals the train
tip's tree and whose parent is `develop`'s current tip, and lands it via a single-commit PR
(`base: develop`). See `scripts/promote-develop.mjs` for the decision algorithm
(`decidePromotion`, six outcomes: `no-op-missing-develop`, `no-op-in-sync`, `refuse-diverged`,
`reuse-existing-pr`, `supersede-and-open`, `open-new`) and
`kitty-specs/release-pipeline-develop-line-01M292E3/{spec.md,plan.md,research.md}` for the full
rationale, the options considered, and the verification trail.

The mechanism runs as a new GitHub App (`spec-kitty-design-release`, installed on
`spec-kitty/spec-kitty-design` only — the org-wide `spec-kitty-factory-ci` App is not widened),
because a `GITHUB_TOKEN`-authenticated push does not trigger the workflow runs REL2's
rc-publish workflow depends on (see "GITHUB_TOKEN and workflow_dispatch" below).

### The develop-tree-is-promotion-only invariant

**`develop`'s tree is written only by the promotion mechanism.** No commit — a version bump, a
hotfix, a doc typo fix, anything — may land directly on `develop` by any means other than a
tree-sync promotion PR. The mechanism's own divergence health check
(`isDevelopHealthy`, `refuse-diverged` outcome) enforces this at runtime: a `develop` tip that
is neither on `train/elements-first`'s first-parent history nor a prior promotion commit (a
`Train-SHA:` trailer naming a train commit with a matching tree) is refused, not merged over.
If you need something on `develop`, it goes through `train/elements-first` first, always — see
"My fix needs to reach an already-cut RC," above.

**Consequence for REL2 (#363):** rc-publish must derive any version bump, tag, or dist-tag state
it needs *outside* `develop`'s own tree (via git tags, or registry-side dist-tag metadata at
publish time) — never by committing a version bump *into* `develop`, which would break the next
promotion cycle exactly as described above.

## `GITHUB_TOKEN` and `workflow_dispatch` (the corrected reasoning, research.md R26)

A common misconception: that an explicit `workflow_dispatch` (or `repository_dispatch`) API call
made by a job's own default `GITHUB_TOKEN` is subject to the same "does not trigger new workflow
runs" limitation that applies to a `GITHUB_TOKEN`-authored `push` or `pull_request` event.
**It is not.** Verified against GitHub's own documentation
(<https://docs.github.com/en/actions/using-workflows/triggering-a-workflow>, fetched
2026-09-11): "`workflow_dispatch` and `repository_dispatch` events always create workflow runs"
— an unconditional exception, distinct from the *separate* rule that `pull_request`
`opened`/`synchronize`/`reopened` events land in an **approval-required** state specifically
when `GITHUB_TOKEN` itself created or updated that PR. An explicit `workflow_dispatch` call from
a job's own `GITHUB_TOKEN` (with `permissions: { actions: write }` on that one job) works
normally and needs no App identity. This is why the promotion mechanism's own merge still needs
a non-`GITHUB_TOKEN` identity (a `push` to `develop` from `GITHUB_TOKEN` would not fire
anything), but REL2's rc-publish workflow, if it chooses to be triggered by an explicit
`workflow_dispatch` call from the promotion job rather than by the `push` event itself, does not
need any change to the App's permission grant to make that call — that decision belongs to REL2
(#363), not to this document.

## GitHub Packages visibility (FR-006, operator ruling 2026-09-11)

Recorded here, even though publishing itself is REL2/REL3's (#363/#364) scope, so the next
mission does not have to re-derive it from epic #361's comment thread:

One **public** `@spec-kitty/{elements,styles,tokens}` package per name — created **private**
initially and flipped to **public on first publish** — with the rc and prod streams separated
**only by dist-tag** (e.g. `next`/`latest`), never by a second package name or a second
registry. No package currently exists under any of these three names (confirmed 404 on npmjs
and "no such package" on npm.pkg.github.com as of the ruling date).

This document records the ruling; it does not implement it. The `.npmrc` flip, registry
configuration, and actual publish code are REL2/REL3's (#363/#364) surface — including
`docs/design-system/using-components.md`'s stale `npm install` instructions, which this mission
does not touch.

## Post-merge observation queries (SC-004/SC-005 — REL2's, #363, to actually run)

No promotion cycle can run before `develop` exists, so these cannot be exercised inside REL1's
own PR. Once real promotion cycles exist, REL2 (#363) is the one to run them:

- **Zero duplicate PRs across a reuse-then-supersede sequence**: after several train pushes in
  quick succession, confirm at most one open `promote/*`-headed PR exists at any time —
  `gh pr list --repo spec-kitty/spec-kitty-design --base develop --state open --json
  number,headRefName` should never show more than one `promote/*` entry.
- **Two-cycle tree/parent/trailer postcondition**: after at least two real promotion cycles,
  confirm `develop^{tree}` equals `train/elements-first^{tree}` at the time of the last
  promotion, that every commit reachable by walking `develop`'s history back to the cut point
  has exactly one parent, and that each carries a `Train-SHA:` trailer whose named commit's
  tree matches (`git log develop --format='%H %P' ` plus `git log -1 --format=%B <sha>` per
  commit).

## Source-branch cutover caveat (research.md R17)

Changing `vars.PROMOTE_DEVELOP_SOURCE_BRANCH` alone is **not** a complete cutover if the
promotion source ever changes (for example, when this train eventually lands on `main` and a
new train begins). GitHub Actions trigger blocks (`on:`) cannot reference `vars.*`/`secrets.*` —
they are evaluated before any context is available — so `ci-quality.yml`'s own
`on.push.branches` entry and the `promote-develop` job's `if:` guard are both literal strings
that must be edited in a follow-up PR alongside the variable change. Flipping the variable by
itself changes only the script's internal notion of "what is the train tip"; it does not move
the workflow's own trigger.

## `develop`'s ruleset

Specified in `.github/rulesets/develop-ruleset.json` (FR-001) — main-is-safe parity (`deletion`,
`non_fast_forward`, `required_linear_history`, `pull_request`, `code_scanning`), with one
deliberate, narrower deviation: `allowed_merge_methods: ["rebase"]` (main-is-safe permits
`["squash", "rebase"]`). Zero bypass actors, matching `main-is-safe`.

**Live ruleset id**: not yet applied. Recorded here by the orchestrator after applying the
ruleset (`docs/architecture/branch-model.md`'s own Post-apply record, data-model.md) — until
then, `scripts/check-develop-ruleset-parity.mjs --check` no-ops with a notice rather than
failing, because `vars.DEVELOP_RULESET_ID` is unset.

## Operator and orchestrator actions

See `kitty-specs/release-pipeline-develop-line-01M292E3/quickstart.md` for the full, exact
command sequence. Summarized:

**Operator, before this mission's PR can do anything beyond fail fast**: create the
`spec-kitty-design-release` GitHub App, install it on `spec-kitty/spec-kitty-design` only, add
its two repository secrets, approve the implemented PR, and leave `PROMOTE_DEVELOP_ENABLED`
unset until the orchestrator's bootstrap sequence reaches it.

**Orchestrator, after this mission's PR merges** (never before): cut `develop` from
`train/elements-first`'s new head; apply the ruleset with `enforcement: "evaluate"` first (a
CodeQL-baseline bootstrap gap — quickstart.md's Plan B if no analysis appears); flip
`PROMOTE_DEVELOP_ENABLED` to `true`; confirm the first real promotion PR produced a CodeQL
analysis of its own head; PATCH the ruleset back to the committed artifact (`enforcement:
"active"`); record the ruleset's numeric id above; and, after several real promotion cycles,
recalibrate the mechanism's 10-minute poll budget against observed CodeQL timing.
