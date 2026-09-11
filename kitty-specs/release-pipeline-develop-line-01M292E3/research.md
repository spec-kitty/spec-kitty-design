# Research: Release pipeline develop-line governance (REL1, #362)

Phase 0 output. Every item below is either a fact verified against a live source (GitHub API,
GitHub docs, or this repository's own files) or an explicit design decision this plan author made,
labelled as such. The operator's rulings recorded in `spec.md`'s "Recorded Decisions" section are
inputs here, not re-derived.

## R1 — `actions/create-github-app-token`: which SHA to pin

**Decision**: pin `v3.2.0` at `bcd2ba49218906704ab6c1aa796996da409d3eb1`, not the org's existing
`v1.9.3` pin (`7bfa3a4717ef143a604ee0a99d859b8886a96d00`, used in `spec-kitty-events`'s
`ci.yml`).

**Verified** (`gh api repos/actions/create-github-app-token/releases` and `/tags`, 2026-09-11):
the action has released `v3.0.0`, `v3.1.0`, `v3.1.1` and `v3.2.0` (2026-03-14 through
2026-05-12) since the org's `v1.9.3` pin. `v3.0.0`'s breaking changes are: custom HTTP(S) proxy
handling removed (opt back in via `NODE_USE_ENV_PROXY=1`, which this workflow does not need — it
makes no proxied calls) and a minimum self-hosted runner version bump (irrelevant on
GitHub-hosted `ubuntu-latest`, which this workflow uses). `v3.1.0` deprecated the `app-id` input
in favor of `client-id` **without removing `app-id`** — it still works, just superseded — and
`v3.2.0` extended `repositories` to accept full repo names and added enterprise-app support.
Nothing in the v2→v3 change log removes or renames `private-key`, `owner`, `repositories`, or the
`token` output this workflow depends on.

**Rationale**: the org's other pin is 15 releases and roughly one and a half major versions
behind. Copying it forward would mean starting a brand-new workflow already stale. `v3.2.0`'s
breaking changes do not apply to this workflow's shape (no proxy, GitHub-hosted runner), so there
is no cost to adopting the current release, and doing so avoids an immediate follow-up mission to
catch up. The `app-id` input name is kept (not moved to `client-id`) for continuity with the org's
established secret-naming convention (`*_APP_ID`) and because `app-id` remains fully supported.

## R2 — GitHub App permission set: derivation

**Verified** (GitHub community discussions and docs on the "refusing to allow ... without
`workflows` permission" error, 2026-09-11): a token — App installation token or PAT alike —
that creates or updates a git ref/commit touching any path under `.github/workflows/` is rejected
unless it carries the `workflows` (fine-grained: **Workflows**) permission, in addition to
**Contents**. This is exactly the scratch-repo-adjacent risk this mission's promotion mechanism
carries: `develop`'s tree is copied wholesale from `train/elements-first`'s tip, and the train
routinely contains workflow-file changes (this very mission's own PR touches
`.github/workflows/ci-quality.yml`). Confirmed empirically against this repo's own history: `git
log --oneline -- .github/workflows/ | wc -l` shows the train's workflow files change often enough
that "the promoted tree never touches `.github/workflows/**`" cannot be assumed for any given
promotion cycle.

**Derived permission set** for the new App (`spec-kitty-design-release`):

| Permission | Level | Why |
|---|---|---|
| Contents | Read & write | Read `develop`/`train` refs and their trees; create the tree-sync commit object; push the `promote/<sha>` branch; the merge step updates `develop`'s ref. |
| Pull requests | Read & write | Open the promotion PR; read `mergeable`/`mergeable_state` to poll; comment (observability, FR-010); close a superseded PR; merge the PR. |
| Workflows | Read & write | Required whenever the pushed tree touches `.github/workflows/**` (verified above) — which a train-tip snapshot can do on any given cycle. Without it, a promotion landing a workflow-file change 403s at the ref-update step, and that is exactly the kind of cycle this mechanism must not silently fail. |
| Metadata | Read | Mandatory baseline for every GitHub App; not requested explicitly (GitHub adds it automatically) but named here so the permission set is stated completely. |

**Explicitly not requested**: Administration (ruleset application is an orchestrator repo-setting
act outside this mission's automation — Sequencing, `spec.md` — not something the App does at
runtime), Checks / Code scanning alerts (the design below polls the Pull Requests API's
`mergeable_state`, not the code-scanning API directly — see R3), Actions (the workflow does not
dispatch or cancel other runs; REL2's own `workflow_dispatch` choice, if made, is REL2's workflow
calling out, not this one being called).

## R3 — Polling `code_scanning` without a `code_scanning`-shaped permission

**Decision**: poll `GET /repos/{owner}/{repo}/pulls/{pull_number}` and read `mergeable` /
`mergeable_state`, not the Code Scanning API.

**Rationale**: a ruleset's `code_scanning` rule is evaluated as part of the PR's overall
mergeability — GitHub surfaces a blocked-by-ruleset PR as `mergeable_state: "blocked"` (rule
still evaluating or failing) versus `"clean"` (all rules, including `code_scanning`, satisfied).
Reading this needs only `pull-requests: read`, already in the App's permission set for other
reasons (R2). Calling the Code Scanning API directly would need a `security_events` (Code
scanning alerts) permission this design does not otherwise need, so it is left out — a smaller
permission surface for the same observable outcome, per DIRECTIVE_051-adjacent least-privilege
reasoning (the charter's supply-chain directive; the same "add nothing you don't measurably need"
logic extends past dependencies to token scopes).

**Residual gap, stated plainly**: `mergeable_state` is an approximation GitHub itself does not
fully document (its possible values and exact semantics are not part of the stable public
contract). The design compensates by polling with a bound (R5) and reading the actual merge
attempt's HTTP response as the authoritative signal, not `mergeable_state` alone — a `405` on
`PUT .../merge` is unambiguous ("not mergeable yet"), whereas `mergeable_state` is used only to
decide whether to keep waiting versus attempt the merge call.

## R4 — Which identity polls checks: the App token, not `GITHUB_TOKEN`

**Decision**: the App token performs every PR-facing read (list, get, comment) and write (open,
close, merge) operation. The job's own `GITHUB_TOKEN` is used only for `actions/checkout` (which
needs no elevated permission — `contents: read` is enough to clone a public repo the workflow
already runs in).

**Rationale**: FR-007(h) requires a non-`GITHUB_TOKEN` identity for "any step whose triggering a
downstream workflow matters" — opening/updating and merging the PR are named explicitly. Using a
second identity (`GITHUB_TOKEN` for reads, the App token for writes) would mean two credentials in
one job for no benefit; one identity for every GitHub-facing call after checkout is simpler to
reason about and to test (one auth path, not two).

## R5 — Bounded polling window versus the App token's lifetime

**Verified**: `actions/create-github-app-token` installation tokens are valid for approximately
one hour (GitHub's own installation-token lifetime), consistent with the comment already in
`spec-kitty-events`'s `ci.yml`, which re-mints mid-run for exactly this reason on a
longer-running job.

**Decision**: this workflow's poll loop is bounded to at most **15 minutes** total (30 attempts,
capped exponential backoff from 5s to 30s), well under the ~60-minute token lifetime, so the
design does **not** need the re-mint dance `spec-kitty-events` uses for its longer job. If the
poll exhausts its budget, the job fails (non-zero exit) with the PR left open and a comment naming
the last observed `mergeable_state` — this is FR-010's observability requirement and one of the
explicit failure-mode leave-behinds (Plan §Failure Modes).

## R6 — Merge method: `rebase`, not `squash`

**Verified**: `main-is-safe`'s `pull_request` rule allows `["squash", "rebase"]`
(`gh api repos/.../rulesets/15855418`, live, 2026-09-11). A `develop` ruleset built for
main-is-safe parity inherits the same restriction unless narrowed (Key Entities, `spec.md`).

**Decision**: the promotion PR is merged with `rebase`, and `develop`'s ruleset narrows
`allowed_merge_methods` to `["rebase"]` only (a stricter subset of main-is-safe's two, not a
weaker one — C-005 in `spec.md` only requires named approval for a deviation that *removes*
protection, and a narrower method set removes none).

**Rationale**: the promotion branch carries exactly one commit, and that commit's parent is
already `develop`'s current tip at the moment it was created (the tree-sync algorithm, `spec.md`
Option D). A `rebase` merge on a single already-current commit is the identity operation — GitHub
replays it onto the (unchanged) base tip, and it lands with the authored commit message
unmodified. A `squash` merge would work too, but GitHub's default squash message is the PR title,
not the commit's own message — landing the intended `chore(release): promote ...` header would
require passing `commit_title`/`commit_message` explicitly on every merge call, an extra
parameter this workflow would have to get right on every cycle for a single-commit PR where squash
buys nothing over rebase. Rebase is the simpler, equally-safe choice.

## R7 — Secrets cannot be tested directly in `if:` conditionals

**Verified** (GitHub Actions documentation and community discussions, 2026-09-11): the `secrets`
context cannot be referenced directly in a job- or step-level `if:` conditional. An unset secret
resolves to an empty string like any other missing value, but `if: ${{ secrets.X == '' }}` does
not work as a documented pattern — GitHub's own guidance is to assign the secret to a job- or
step-level `env:` variable first, then test the `env` context in `if:` (or, as this workflow does,
inside the `run:` shell itself, which can read `env:` unconditionally).

**Consequence for the fail-fast requirement**: the "fail fast with a clear message when the
secrets are missing" step (Plan §Promotion Workflow) reads the two secrets into `env:` and checks
them with a shell `[ -z ... ]` test inside a `run:` step — not an `if:` guard on the mint step —
because the `if:`-on-secrets pattern a naive implementation would reach for does not work.

## R8 — Test convention for `scripts/*.mjs`: no vitest, the repo's own `--selftest`/`--check` shape

**Verified** by reading `scripts/check-release-graph.mjs`, `scripts/check-gate-wiring.mjs`, and
`vitest.config.mts`: this repository's `scripts/` CLIs are **not** exercised by vitest test files.
Vitest (`tests/browser/**`, `tests/node/**`, `fixtures/**/src/**`) covers component *behaviour*;
every `scripts/*.mjs` gate instead exports its checks as **pure functions** and ships its own
`--selftest` mode (a probe table of synthetic inputs, some expected to fail) plus, where
applicable, a `--check` mode (drift detection against the real repository state). `lint-code`
wires each script's `--selftest` (and `--check`, where present) as its own `[ENFORCED]` step,
unconditionally — no `if:`, no path filter — which is how a script like `check-adr-index.mjs`
guarantees even a docs-only PR exercises it (comment on that step, `ci-quality.yml`).

**Consequence**: `scripts/promote-develop.mjs` (the promotion algorithm) follows this exact shape
— pure functions (`decideCommit`, `buildCommitMessage`, `findExistingPromotionRef`, …) plus a thin
CLI entry that a) the real workflow calls to do the real work and b) a `--selftest` mode drives
against a disposable git repository under `os.tmpdir()`, using `execFileSync('git', …, { cwd })`
the same way `scripts/verify-visual-spec-zero-drift.mjs` already shells out to git in this
repository. This is the same code path in both places — the test suite is not a reimplementation
of the algorithm, it is the algorithm run against a scratch repo instead of the real one. See
`contracts/promotion-script.contract.md` for the exact probe table.

## R9 — Where the promotion script's self-test is wired

**Decision**: `scripts/promote-develop.mjs --selftest` is added as an `[ENFORCED]` step inside
`lint-code` (`ci-quality.yml`), unconditionally, alongside the repo's other script self-tests.

**Rationale**: `lint-code` already carries no `if:` and no `changes`-filter gate (the same
placement rationale documented in `ci-quality.yml` for `check-adr-index.mjs` and
`check-llms-adr-surface.mjs`), so this guarantees the promotion algorithm's own test suite runs on
every PR and every push to `main`/`train/**`/`develop` — not only on a PR that happens to touch
`scripts/promote-develop.mjs` itself. `ci-quality.yml`'s `ci`-category path filter already globs
`scripts/**`, so no filter edit is needed for `changes` to notice the file; that output is
informational only today (no job's `if:` reads it — verified by grep), so wiring the actual test
run to a job that never skips is what makes it a gate rather than a filter that happens to fire.

## R10 — The `develop` ruleset artifact's live-parity check is not wired into automatic CI

**Decision**: `scripts/check-develop-ruleset-parity.mjs --selftest` (pure-function comparison
against fixtures) is `[ENFORCED]` in `lint-code`, the same as R9. Its `--check` mode (live
comparison against `gh api repos/.../rulesets/15855418`) is **not** added to `ci-quality.yml`.
It is a documented **Orchestrator Action**, run once, immediately before `gh api -X POST
.../rulesets --input contracts/develop-ruleset.json` (Sequencing, `spec.md`).

**Rationale**: `develop` does not exist yet and its ruleset is applied by the orchestrator outside
this mission's PR (C-003) — there is nothing in this repository's automatic CI for a live-parity
check to protect on every push, since no code path in this PR ever calls the rulesets API. Wiring
a live `gh api` call into every PR's CI would add an external dependency (network egress, and an
as-yet-unverified read-permission requirement for classic `GITHUB_TOKEN` against the Rulesets API
on a public repo) for a check that cannot fire before `develop`'s ruleset exists to drift against.
Keeping `--check` manual, run once at apply-time, matches C-003's own framing: ruleset application
is a deliberate, singular orchestrator act, not a continuously-running gate. A future mission,
once `develop` and its ruleset both exist, can revisit wiring `--check` into a scheduled or
`develop`-triggered job if silent drift becomes a real observed problem — that is future scope,
named here rather than silently assumed away.

## R11 — GitHub Packages ruling record location (FR-006), and a doc it corrects

**Decision**: record the 2026-09-11 GitHub Packages ruling (one public package per name, rc/prod
separated by dist-tag, GitHub artifact attestations replacing npm provenance) in
`docs/design-system/using-components.md`'s existing `## Installation` section (line 837), plus a
short cross-reference from the new branch-model doc (FR-009) pointing at it — not a new standalone
file.

**Found while locating the right section**: `## Installation` currently reads `npm install
@spec-kitty/styles @spec-kitty/tokens` etc., with a note that "these packages must be published to
npm before the import paths below work." That is stale under the operator's 2026-09-11 amendment
(`npm view` 404s were the trigger for it) — the packages will never be public on npmjs.org; they
publish to GitHub Packages (`npm.pkg.github.com`) only. FR-006 asks this mission to record the
ruling "even though publishing itself is REL2/REL3" — leaving the one doc section that already
tells a consumer how to install these packages actively wrong while adding the ruling somewhere
else would be recording a fact next to a contradiction of it. This mission's PR corrects the
`Installation` section's registry references (the `npm install` command line itself, and the
publication note) to describe GitHub Packages with a scoped registry configuration and the rc/prod
dist-tag split; it does **not** implement the `.npmrc` flip or any registry config file — that
stays REL2/REL3 (C-004) — only the prose consumers read is brought in line with the ruling that
already superseded it.

**Rationale**: `docs/design-system/using-components.md` is already the canonical "how a consumer
installs and uses these packages" surface (`CLAUDE.md` §8); a REL2/REL3 mission looking for "how
are these packages distributed" will find it there without needing to know this mission's number.
