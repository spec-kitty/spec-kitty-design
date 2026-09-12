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

## The ruleset-parity job's cron is inert until this file reaches `main` (M10)

Same candour as the `workflow_dispatch` note above, for the same underlying reason: a
`schedule:` trigger always runs the workflow file as it exists on the repository's **default
branch** (`main`), never as it exists on the branch a PR is merging into. `develop-ruleset-parity`
shares FR-041's existing nightly cron (`ci-quality.yml`'s `on.schedule`) rather than adding a
second one (see "The ruleset-parity job's cron" note in that file) — but until this exact version
of `ci-quality.yml` reaches `main` at the operator's later train→main landing, that scheduled arm
never actually runs *this* job; only the `push`-to-`develop` arm of its `if:` can fire before
then, and that one is itself dormant until `develop` exists and the orchestrator's bootstrap
sequence has flipped things on. Stated here rather than left for a reader to discover the same
way the `workflow_dispatch` trigger's own inertness is stated above.

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

## `parity-anchor-tags-are-immutable` ruleset (F-E)

Specified in `.github/rulesets/parity-anchor-tags.json` — target `tag`, condition
`refs/tags/parity-anchor/*`, rules `creation`, `deletion`, `update`, `non_fast_forward`, zero
bypass actors. This is what `check-ci-quality-trigger-parity.mjs`'s anchor-tamper defense (its
own F2) actually rests on: the tag `parity-anchor/rel1` that script resolves at run time cannot
be created, moved or deleted by anyone — admins included — without first disabling or editing
this ruleset, a visible, logged administrative act rather than a plain push. It protects the
WHOLE `parity-anchor/*` prefix, not just `rel1`, so a future re-baseline's replacement tag (e.g.
`parity-anchor/rel2`, see that script's own REBASELINING note) is covered automatically, and
also blocked from being minted without the same deliberate step.

**Live ruleset id**: `22997584` — already applied and active (verified via
`gh api repos/spec-kitty/spec-kitty-design/rulesets/22997584`, 2026-09-12). Unlike `develop`'s
ruleset above, this one is not mid-bootstrap: `scripts/check-develop-ruleset-parity.mjs
--check-parity-anchor-tags` reads this id as a plain constant, with no dated floor and no
unset-id notice path, since the ruleset already exists.

**What PR-time CI can and cannot verify (F-E, incident 3)**: `--check-parity-anchor-tags` runs
in `lint-code` on every PR and checks the ruleset's shape, target, conditions, and every rule
(`creation`/`deletion`/`update`/`non_fast_forward`) — but NOT `bypass_actors`. GitHub's REST docs
for "Get a repository ruleset" state: *"To prevent leaking sensitive information, the
bypass_actors property is only returned if the user making the API request has write access to
the ruleset."* The PR-time workflow token does not have write access to the ruleset (granting
`administration: write` so a read-only drift check could see one field would let any step on
any PR modify repository settings — the wrong trade, not made), so the field is silently absent
from that token's response. The script does not read absence as agreement: it prints a named
`::warning::` and exits 0 rather than reporting drift or false confidence. `bypass_actors: []`
(the entire "nobody can move this tag, admins included" claim) is therefore verified only by an
admin-authenticated read — `gh api repos/spec-kitty/spec-kitty-design/rulesets/22997584 --jq
.bypass_actors` should print `[]` — which is an OPERATOR step, not something CI can close; see
`docs/release-runbook.md`'s landing/maintenance section for where that step lives.

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
