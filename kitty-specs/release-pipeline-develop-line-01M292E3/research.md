# Research: Release pipeline develop-line governance (REL1, #362)

Phase 0 output, **revised** after the post-plan adversarial squad (architect, debugger, reviewer,
planner — three NOT-READY, one READY-WITH-FOLDS) reported four blockers (B1-B4) and twenty majors
(M1-M20), all adjudicated as fold-ins by the coordinator. Every item below is either a fact
verified against a live source (GitHub API, GitHub docs/schema, or this repository's own files) or
an explicit design decision, labelled as such, with **superseded** entries kept and marked rather
than silently deleted — the first revision of this mission's Options table was itself corrected
the same way (spec.md's "orchestrator review" note), and erasing the trail would repeat exactly
the failure mode that correction called out.

## R1 — `actions/create-github-app-token`: which SHA to pin

**Unchanged from the first revision.** Pin `v3.2.0` at `bcd2ba49218906704ab6c1aa796996da409d3eb1`,
not the org's existing `v1.9.3` pin (`7bfa3a4717ef143a604ee0a99d859b8886a96d00`, used in
`spec-kitty-events`'s `ci.yml`). Verified 2026-09-11 via `gh api
repos/actions/create-github-app-token/releases` and `/tags`; see the first revision's note for the
full breaking-change analysis (proxy handling and a runner-version bump, neither applicable to a
GitHub-hosted `ubuntu-latest` job with no proxy).

## R2 — GitHub App permission set: derivation (unchanged, reconfirmed)

Contents (R&W), Pull requests (R&W), Workflows (R&W), Metadata (R, automatic). The `workflows`
permission requirement is re-verified in R14 below with a primary-source citation (a GitHub
community discussion of the exact rejection message), not just general recollection. Not
requested: Administration, Checks, Code scanning alerts, Actions — Actions is now touched by M14
below (a `workflow_dispatch` call needs `actions: write` on the *job's* `GITHUB_TOKEN`, not this
App, so the App's own permission set is still unaffected — see R26).

## R3 — Polling mergeability: **superseded by a stronger, authoritative source**

The first revision proposed polling the REST `mergeable_state` string field, noting it is "not
part of GitHub's stable public contract." **That hedge is no longer necessary.** Verified
2026-09-11 via a live GraphQL schema introspection query against `api.github.com/graphql`
(`{__type(name:"MergeStateStatus"){enumValues{name description}}}`), which is a real, documented,
versioned part of the public GraphQL schema:

| Value | GitHub's own description | This mechanism's response |
|---|---|---|
| `CLEAN` | "Mergeable and passing commit status." | Merge. |
| `HAS_HOOKS` | "Mergeable with passing commit status and pre-receive hooks." | Merge (equivalent to `CLEAN`; pre-receive hooks are a GHES concept, essentially unreachable on github.com, kept for completeness). |
| `UNSTABLE` | "Mergeable with non-passing commit status." | **Merge** — justified in R15 below; this is expected to be the redundant `ci-quality.yml` run's status, which the ruleset does not require. |
| `BLOCKED` | "The merge is blocked." | Keep polling (within budget). This is what a still-pending or failing `code_scanning` rule produces. |
| `UNKNOWN` | "The state cannot currently be determined." | Keep polling. GitHub is still computing mergeability in the background. |
| `BEHIND` | "The head ref is out of date." | **Do not keep naively polling** — re-run the divergence check (R12/FR-007(d)). In this mechanism's shape, the PR's head cannot itself go "behind" its own content; `BEHIND` here signals the *base* (`develop`) moved since the PR was computed, which is exactly the divergence case. |
| `DIRTY` | "The merge commit cannot be cleanly created." | Should be unreachable by construction (the commit's parent is `develop`'s tip at creation time) — if seen, treat as an anomaly: do not merge, exit non-zero with the raw state logged, do not retry blindly. |

`mergeable` (a separate boolean/null field) is checked first: `null` means GitHub has not finished
computing it yet (equivalent to `UNKNOWN`, keep polling); `false` is unexpected for the same
by-construction reason `DIRTY` is and is treated the same way.

Fetched via `gh pr view <n> --json mergeable,mergeStateStatus` (confirmed valid `--json` fields,
2026-09-11: `gh pr view --json` lists both). This uses the **documented GraphQL enum**, not the
REST API's informally-documented `mergeable_state` string — a strictly better citation than the
first revision had.

## R4 — Which identity polls checks: the App token, not `GITHUB_TOKEN` (unchanged)

Every PR-facing read and write happens on the App token; `GITHUB_TOKEN` is used only for
`actions/checkout`'s initial clone step. See R14 for the *ordering* correction (mint before
checkout) the squad's B3 raised, which changes *when* the App token is obtained but not *which*
token does the polling.

## R5 — Bounded polling window: **re-derived, not measured, and said so plainly**

The first revision set a flat 15-minute cap "well under the App token's ~1h lifetime," reasoning
from the token's lifetime rather than from what the wait is actually for. **Squad correction (B4):
`ci-quality.yml`'s own run time (26-34 minutes, measured below) makes a 15-minute wait for
`mergeStateStatus: CLEAN` unreachable if the wait were for that workflow** — it isn't, once R15's
redesign gates the promotion job's *start* on the train's own `ci-quality.yml` `gate` job already
having succeeded. What remains to wait for, after that point, is a **fresh `code_scanning` (CodeQL
default-setup) analysis of the promotion PR's own head** (`refs/pull/N/head` is a ref GitHub's
default setup has never scanned before that PR exists), because a ruleset's `code_scanning` rule
evaluates that specific ref, not whatever passed on `train`.

**What I could and could not verify**: this repository has no visible Actions workflow run for
CodeQL default-setup (spec.md's own Key Entities section already established this: "no CodeQL
workflow file in `.github/workflows/`" — it is a GitHub-managed background job with no run I can
time via `gh run list`). I could not independently measure how long a default-setup CodeQL pass
takes on a PR into this repository. General knowledge (JavaScript/TypeScript-only, no compiled
language, small diff per promotion cycle) suggests low single-digit minutes, but I am not
presenting that as a verified figure.

**Decision**: bound the poll to **10 minutes** (20 attempts, 5s→30s capped backoff) — generous
headroom over the low-single-digit-minute estimate, comfortably under the App token's ~1h
lifetime, and explicitly **flagged for recalibration against the first real promotion cycle's
observed timing** (`plan.md`'s Orchestrator Actions gains a step for this). This is a deliberate,
labelled estimate, not a claim of measurement I do not have.

**Disagreement with the adjudication, stated plainly**: B4 asks to "re-derive the bounded budget
from CodeQL timing (about 1-2 minutes)" as if that figure were established. I could not verify it
independently and am not willing to present an unverified precision (1-2 minutes) as if it were
measured. I adopted the *spirit* of the correction (stop deriving the budget from the token
lifetime; derive it from what CodeQL actually takes) with a wider, explicitly-provisional number
and a concrete recalibration step instead of asserting a specific minute count I cannot back with
evidence.

## R6 — Merge method: `rebase`, and a corrected claim about what it produces

**Unchanged decision** (`rebase`, not `squash` — main-is-safe's `pull_request` rule permits both;
`develop`'s ruleset narrows to `rebase` only). **Squad correction (M20)**: the first revision
called a rebase-merge of an already-current single commit "the identity operation," implying the
resulting commit is unchanged. **That is wrong and is corrected here.** GitHub's rebase-merge
always constructs new commit objects via its own git service — same author, same tree, same
message, but a **new committer identity, a new commit timestamp, and therefore a new SHA**, even
when the parent chain does not change. Every comparison this mechanism makes after a merge — the
divergence health check (R12), the ruleset-parity check (R25), the two-cycle self-test probe — is
written to compare **trees and trailers, never SHAs**, which was already the actual design; only
the prose describing *why* was wrong and is fixed here. `gh pr merge <n> --rebase
--match-head-commit <sha>` (R12) is the exact call; `--match-head-commit` is a real, documented
`gh` flag (`gh pr merge --help`, verified 2026-09-11: "Commit SHA that the pull request head must
match to allow merge" — GitHub's REST merge endpoint's `sha` parameter, exposed directly).

## R7 — Secrets cannot be tested directly in `if:` conditionals (unchanged)

Still correct and still used — see R19 for where in the check *order* this now sits (last, per M4).

## R8 — Test convention for `scripts/*.mjs`: pure functions + `--selftest`/`--check` (unchanged premise, upgraded design)

The shape (pure functions, a repo-native `--selftest` probe table, no vitest file) is unchanged.
**Squad corrections (M8) upgrade what "a probe table" means here**, modelled on two patterns
already in this repository rather than invented fresh:

1. **The floor sits outside the table and requires both polarities**
   (`scripts/gate-selftest.mjs:150-166`, cited directly): that file computes
   `passShapes`/`failShapes` by filtering its `SHAPES` array *after* the array is defined, and
   refuses to run at all if either filtered set is empty — "an all-reject set is satisfied by an
   assertion that rejects everything." The first revision's floor (`PROBES.length >= 9`, a bare
   count) does not catch that shape: a table of nine probes that are all "expect success" would
   satisfy the floor while proving nothing about the negative cases this mechanism specifically
   needs (probe 5's deliberate conflict, the diverged-develop refusal). **Revised**: after running
   every probe, assert `executedAndMatched.length === PROBES.length` (every probe actually ran and
   its outcome matched its declared expectation — not just that the array is non-empty) **and**
   that both an `expect: 'pass'` and an `expect: 'fail'` probe exist and were both satisfied.
2. **Mutation controls, modelled on `scripts/check-gate-wiring-defeats.mjs`** (cited directly,
   header comment): that file mutates a *parsed copy* of the real workflow (never literal text)
   and runs the *unmodified* checker against the mutated copy, asserting the checker still catches
   it — plus a control case (the *unmodified* input must still pass) and its own count floor,
   because "deleting seven of eight cases still printed a tick" once, on this exact class of
   table. `scripts/promote-develop.mjs --selftest` adds the same shape: mutate the *actual,
   already-loaded* `createTreeSyncCommit`/`decidePromotion` functions in-process (monkey-patch a
   deliberately-wrong tree, or a deliberately-reordered branch check) and assert the surrounding
   test harness still reports the mutation as wrong — never a second, hand-written "simulated
   defeat," which would test the simulation, not the code (`contracts/promotion-script.contract.md`
   probes 10-11).

## R9 — Where the self-test is wired, and its own gate-wiring registration (expanded — M9)

`scripts/promote-develop.mjs --selftest` and `scripts/check-develop-ruleset-parity.mjs --selftest`
are `[ENFORCED]` steps in `lint-code` (unchanged rationale — that job runs unconditionally on every
push/PR, `ci-quality.yml`'s `ci` filter already globs `scripts/**`).

**Squad addition (M9), verified against the actual file**: `scripts/check-gate-wiring.mjs`
maintains a `REQUIRED_LINT` array (`scripts/check-gate-wiring.mjs:636` onward, read directly,
2026-09-11) of `[pattern, description, label]` tuples that assert a given `[ENFORCED]` step's
*invocation* actually appears in `lint-code`'s steps — its own header comment records why: a gate
shipped with no entry here twice (spec-kitty/spec-kitty-design#74, spec-kitty/spec-kitty-design#129)
and a lens deleted its CI line with the checker still
green. **Both new self-test steps need entries in this array** — without one, this mission's own
promotion-mechanism tests could be deleted from `ci-quality.yml` with `check-gate-wiring.mjs`
still reporting green, which is precisely the defect class that array exists to close.

**Separately, verified in the same file** (`scripts/check-gate-wiring.mjs`, the "BRANCH COVERAGE"
block, confirmed at the loop `for (const ref of ['main', 'train/elements-first'])`, currently
around line 433): `check-gate-wiring.mjs` independently asserts that `ci-quality.yml`'s
`pull_request.branches` filter covers both `main` and `train/elements-first` — a check this
mission's own FR-003 filter edit does not currently have a corresponding assertion for. **`develop`
must be added to that same coverage list**, with a matching defeat-table row in
`check-gate-wiring-defeats.mjs` (a mutated copy of the workflow that narrows the filter back to
`[main, 'train/**']`, asserting the *unmodified* checker still catches the omission) — this ties
FR-003's own verification directly to an existing, load-bearing check rather than leaving it proven
only by inspection (M17).

## R10 — superseded by R25 (ruleset parity is now wired into live CI)

The first revision's decision to keep `check-develop-ruleset-parity.mjs --check` manual-only is
**reversed** by the squad's M10 finding that the earlier deferral "had no owner." See R25.

## R11 — superseded by R27 (GitHub Packages ruling record moves entirely to `branch-model.md`)

The first revision proposed correcting `docs/design-system/using-components.md`'s stale
`npm install` instructions in the same edit that recorded the GitHub Packages ruling. **The squad
(M15) identified this as a scope boundary violation**: `using-components.md`'s registry-routing
prose is REL3's (#364) surface to own, and touching it here pre-empts that ownership. See R27 for
the corrected placement (the ruling moves entirely into `branch-model.md`, and REL1's diff no
longer touches `using-components.md` at all).

## R12 — Divergence detection (B1): what "healthy" means, and how the merge itself refuses on it

**The gap the first revision left**: FR-007(d) *stated* the requirement ("never overwrite a
`develop` that has diverged") but the algorithm never actually checked it — a `develop` tip
produced by anything other than this mechanism would have been silently treated as just another
tip to promote from.

**Design**: a `develop` tip is **healthy** only if it is one of:

- (a) a commit reachable on `train/elements-first`'s first-parent history (the branch-cut commit
  itself, or — should the orchestrator ever re-cut `develop` — a later cut point); or
- (b) a prior promotion commit, identified by a `Train-SHA: <40-hex>` trailer (R13) naming a train
  commit whose tree equals the `develop` tip's own tree.

Anything else is **diverged**, and the sixth `PromotionDecision` outcome, `refuse-diverged`
(data-model.md), is returned: the run does not merge, does not push, and prints the specific
reason (which of (a)/(b) failed, and how) to `GITHUB_STEP_SUMMARY` — visible without opening a PR,
per FR-010.

**Two places this check runs, not one** — a health check taken only once, before opening a PR,
cannot see a merge that happens between the check and the poll loop's own merge attempt (the exact
race the squad's B1 is about):

1. **Before opening/reusing a PR** — as part of `decidePromotion`'s normal branching (a diverged
   `develop` refuses before any git-mutating call happens).
2. **Immediately before the merge call** — `develop`'s live tip is re-read; if it no longer equals
   the tip the PR's commit was parented on, the run does **not** attempt to merge over it. Instead
   it **supersedes**: comment + close the stale PR, and let the *next* invocation (either this same
   run looping once, or the next triggered run — implementation's choice, stated in `plan.md`)
   recompute from the new tip. The merge call itself additionally passes `--match-head-commit
   <sha>` (verified real flag, R6) as defense in depth — GitHub itself refuses the merge
   server-side if the head has moved since that SHA was read, so even a race between this script's
   own re-read and its `gh pr merge` call cannot silently merge stale content.
3. **After a successful merge**: `develop^{tree}` is asserted to equal the promoted train tree
   (`git ls-remote` + `git cat-file -p`, or `gh api .../git/trees/develop^{tree}` — a read-only
   confirmation, not a second write) — proving the merge did what it claimed, not just that the API
   call returned success.

## R13 — Commit message: trailer, not an inline SHA in the body (B2)

**Verified defect**: the first revision's body line — `` Promotes
train/elements-first@<sha-40hex> to develop via tree-sync promotion.`` — is **106 characters**,
over `commitlint.config.cjs`'s (via `@commitlint/config-conventional`) `body-max-line-length` of
100 (confirmed 2026-09-11: `node -e "const c=require('@commitlint/config-conventional'); ..."`
lists `body-max-line-length` at the same default `[2, 'always', 100]` as `header-max-length`).

**Fix**: move the full SHA to its own trailer line, `Train-SHA: <40-hex>`, which is what R12's
health check (b) also reads. Revised message shape (data-model.md `PromotionCommitMessage`):

```
chore(release): promote a1b2c3d to develop

Tree-sync promotion from train/elements-first.

Train-SHA: a1b2c3d4e5f6...  (full 40 hex)
```

Header unchanged (43 chars, well under 100); the body line is now a short, fixed sentence with no
variable-length data in it, so it cannot regress past 100 characters as SHAs are always 40 hex
regardless — the trailer line's own length (`Train-SHA: ` + 40 chars = 51) is also comfortably
under 100 and is a trailer, which `body-max-line-length` still applies to, so it is *checked*, not
assumed exempt.

**Dynamic import, `--selftest`-only (squad addition)**: `promote-develop.mjs`'s `run` path has no
use for commitlint at all — it only *builds* the message string. The probe that lints the built
message against the repo's real config (probe 8, unchanged intent, `@commitlint/lint` +
`@commitlint/load`, the same API `scripts/check-commitlint-config.mjs` already uses) must reach
those packages via `await import('@commitlint/lint')` **inside the `--selftest` code path only**,
not a static top-level `import` — so that `node scripts/promote-develop.mjs run` (the production
path, invoked from CI after `npm ci` has already run, but conceptually independent of it) never
depends on `@commitlint/*` being resolvable. **A dedicated probe proves this**: `--selftest`
additionally asserts (via `node --experimental-policy`-free static analysis of the file's own
top-level `import` statements, or more simply: spawning `node scripts/promote-develop.mjs run
--dry-run` in a child process with `NODE_PATH` cleared and `@commitlint/*` hidden from resolution,
asserting it does not crash on a missing-module error before reaching its own, unrelated
"secrets/develop missing" no-op path) that the `run` path's own module graph never pulls in
`@commitlint/*`.

## R14 — Identity ordering, checkout, and the bot commit identity (B3)

**Verified via the action's own README** (`actions/create-github-app-token`, fetched 2026-09-11):

- **Mint first, checkout second.** `actions/checkout`'s `token:` input, combined with its default
  `persist-credentials: true`, configures the git credential helper (`.git/config`'s
  `http.<url>.extraheader`) to use whatever token is passed — so minting the App token *before*
  `actions/checkout` and passing it as `with: { token: <minted-token> }` means every subsequent
  `git` command in the job (including `git push`) is already authenticated as the App with no
  further credential wiring. This is the opposite order from the *other* common pattern (checkout
  first with `persist-credentials: false`, mint after, wire credentials manually) — both are
  legitimate; this mission uses the mint-first order because it is simpler for a job whose sole
  purpose is git-writing as the App, with nothing that needs the default `GITHUB_TOKEN`'s identity
  at all once the App is available.
- **Bot committer identity**, quoted from the README's own example:
  ```
  - run: echo "user-id=$(gh api "/users/${{ steps.mint.outputs.app-slug }}[bot]" --jq .id)" >> "$GITHUB_OUTPUT"
    env: { GH_TOKEN: ${{ steps.mint.outputs.token }} }
  - run: |
      git config --global user.name '${{ steps.mint.outputs.app-slug }}[bot]'
      git config --global user.email '${{ steps.get-user-id.outputs.user-id }}+${{ steps.mint.outputs.app-slug }}[bot]@users.noreply.github.com'
  ```
  `create-github-app-token`'s outputs include `app-slug` (confirmed via the README's Outputs
  section, alongside `token` and `installation-id`) — the App's slug, resolved at runtime, not
  hardcoded, so a future App rename does not silently mis-attribute commits.
- **Scratch-repo self-tests set `GIT_AUTHOR_NAME`/`GIT_AUTHOR_EMAIL`/`GIT_COMMITTER_NAME`/
  `GIT_COMMITTER_EMAIL`** as environment variables on the `execFileSync('git', ...)` calls, rather
  than `git config --global` (which a CI runner has none of, and a developer's own workstation has
  real ones that must not be clobbered by a test run). **Why this over calling GitHub's REST git
  API directly from the self-test** (an alternative the squad's own framing raised): the production
  `run` path shells out to real `git`/`gh` binaries against a real checkout; if the self-test
  instead called the REST Git Data API (`POST .../git/commits`, `POST .../git/refs`) to simulate
  the same operations, it would be testing a *second, parallel implementation* of the git
  mechanics that production never executes — exactly the "testing the mock, not the behaviour"
  trap R8's mutation-control note already names for a different reason. Shelling out to real `git`
  in both places, with only the identity source differing (`GIT_*` env vars in tests, the
  `git config --global` calls above in production), keeps one implementation under test.

## R15 — CI gating and the redundant-run problem (B4)

**Verified**: `ci-quality.yml` runs take **26-34 minutes** wall-clock (`gh run list -R
spec-kitty/spec-kitty-design --workflow ci-quality.yml --json startedAt,updatedAt`, 2026-09-11 —
five recent completed runs measured: 29.5, 26.3, 31.0, 33.2, and 28.5 minutes). There are no
required status checks configured anywhere on this repository (`main-is-safe` has no
`required_status_checks` rule; `develop`'s planned ruleset, matching it, has none either) — so an
`UNSTABLE` `mergeStateStatus` (R3) blocks nothing at the API level regardless of what produced it,
and a design that *waits* for `ci-quality.yml` to finish via polling (the first revision's implicit
assumption) would wait up to 34 minutes for a signal the ruleset was never going to require anyway.

**Decision: gate the promotion job's start on the train's own CI, using the job graph, not a
poll.** The promotion job is added **inside `ci-quality.yml` itself** (not a second, separate
workflow file) as a new job, `needs: [gate]` (the real, verified name of the aggregate
merge-gate job — `ci-quality.yml`'s `gate:` job id, "All hard gates must pass (FR-026)"), guarded
by `if: github.event_name == 'push' && github.ref == 'refs/heads/train/elements-first'`. Chosen
over the two options the squad offered (a `needs:`-gated job in the same workflow, or a reusable
workflow call) because: one workflow run, one token mint, no second file's own versioning/pin
surface, and GitHub's own job-dependency graph *is* the gate — no polling needed for "has CI
passed," only for "has code_scanning passed on the promotion PR itself" (R5). `workflow_run` was
considered and rejected per the squad's own instruction and independently confirmed: it requires
the *triggering* workflow's `workflow_run`-consuming file to already exist on the default branch,
which `promote-develop`'s job (living inside `ci-quality.yml`, landing via a PR into
`train/elements-first`) does not yet, for the same reason `workflow_dispatch` does not (R18).

**The redundant-run problem, and its bounded fix.** Once `develop` is in `ci-quality.yml`'s
`pull_request.branches` (FR-003), the promotion PR itself (`base: develop`) triggers a *second*,
full `pull_request` run of the same ~30-minute suite over content already proven on `train` — and
the subsequent `push` to `develop` triggers a *third* run. At an estimated 15 train merges/day
(the epic's own stated cadence context), that is roughly 15 hours of redundant CI wall-clock per
day for zero new signal, since the tree is byte-identical to an already-fully-gated train commit.

**Decision, bounded and conservative rather than touching the hardened `gate` logic wholesale**:
- Add `if: "!startsWith(github.head_ref, 'promote/')"` to the four already-conditionally-skippable,
  browser-heavy jobs only — `storybook-build`, `a11y`, `visual-regression`, `playwright`,
  `lighthouse` — never to `changes`, `security`, `workflow-pin-check`, `lint-code`, `test`, or
  `release-gate`, which stay unconditional on every ref including `promote/*` (cheap-relative
  defense in depth: if the tree-sync script ever produced a tree that was *not* byte-identical to
  a real train commit, these would still catch it).
- `on.pull_request.branches` filters the **base** ref only — verified 2026-09-11 (GitHub Actions
  documentation and community discussion): there is no head-branch filter in the trigger itself,
  so head-branch scoping has to be a job-level `if:` reading `github.head_ref`, which is exactly
  what the line above does.
- `gate`'s own skip-tolerance shell logic (the `relevant`/`sb_ok` block, `ci-quality.yml`) needs a
  **new, explicit** branch: currently, `storybook-build`/`a11y`/`visual-regression`/`playwright`
  reporting `skipped` while `changes.outputs.tokens`/`components` is `true` is treated as a
  failure (correctly, for a normal PR — a real content change skipping the visual suite is a real
  gap). A promotion PR's tree *will* set `tokens`/`components` true (it is real, already-gated
  content), so without a new, named exception this redesign would make `gate` fail every
  promotion PR outright — the opposite of the goal. The exception must be scoped precisely to
  "this ref is `promote/*`," not loosened generally, and is called out here as exactly the kind of
  edit `scripts/check-gate-wiring-defeats.mjs`'s own history (R9) warns is easy to get subtly
  wrong — the implementer should add a defeat-table row for it (a mutated `gate` shell body that
  drops the `promote/*` condition entirely, asserting the unmodified checker still flags the
  resulting unconditional accept as wrong).
- `pr-preview.yml` gets the same `if: "!startsWith(github.head_ref, 'promote/')"` guard at its one
  deploy-triggering job — a promotion PR has no reason to spin up a Storybook preview deployment
  for content the train's own preview (if any) already covered.

## R16 — Bootstrap re-sequence: the direct push doesn't work (M1)

**Verified defect in the original Sequencing plan**: once `develop`'s ruleset (`pull_request` rule,
zero bypass actors) is `active`, a **direct push** to `develop` — the original quickstart's
"push one plain commit to seed a CodeQL baseline" step — is rejected outright; only a PR can land
anything. Separately, an **empty commit** (`--allow-empty`) landed through a PR and merged via
`rebase` risks being **dropped**: an empty diff relative to the base is not guaranteed to survive a
rebase-merge (GitHub's rebase operation reapplies each commit's *changes*; a commit with no changes
relative to its new base has nothing to reapply). Both defects point at the same root cause: the
original plan tried to seed a CodeQL baseline with a **content-free** act, which is exactly the
kind of act both a real ruleset and a rebase-merge are least hospitable to.

**Revised order** (replaces `spec.md`'s Sequencing and this plan's original Orchestrator Actions):

1. Orchestrator cuts `develop` from `train/elements-first`'s new head (unchanged).
2. Orchestrator applies `develop-ruleset.json` **with `enforcement: "evaluate"`** (a real,
   documented ruleset enforcement state — GitHub rulesets support `disabled` / `active` /
   `evaluate`; `evaluate` records rule outcomes without blocking anything) — **or**, as a named
   alternative if the operator prefers an active-but-narrower ruleset over a wholly-non-blocking
   one, `active` with the `code_scanning` rule omitted from the `rules` array entirely. Either
   choice lets the PR-based `pull_request` rule (0 required reviews) still gate normally while the
   one rule that needs a baseline analysis to exist is not yet asked to block anything.
3. The operator flips the enable switch (M2, `vars.PROMOTE_DEVELOP_ENABLED = 'true'`).
4. The **first real promotion PR** (not a separate seed commit) is what generates the first
   push-triggered CodeQL analysis of a `develop`-bound ref (`refs/pull/N/head`) — confirmed via
   `gh api repos/.../code-scanning/analyses?ref=refs/pull/N/head` before proceeding.
5. Once step 4 is confirmed, the orchestrator re-applies the ruleset artifact **as committed**
   (`enforcement: "active"`, the full five-rule set including `code_scanning`) — a second `gh api
   -X POST .../rulesets` call is not additive; re-POSTing creates a *second* ruleset object, so
   this step is a **PATCH** (`gh api -X PATCH repos/.../rulesets/<id>`) against the ruleset id
   recorded from step 2, not a second POST — named explicitly here because getting this wrong
   leaves two rulesets both targeting `develop`, which M10's post-apply verification (R25) is
   designed to catch.
6. **Plan B, if no analysis appears** after a reasonable wait (the orchestrator's judgment, since
   this is a one-time, human-supervised bootstrap, not the automated poll loop): trigger CodeQL
   default setup manually via `gh api -X PUT repos/.../code-scanning/default-setup` with an
   explicit `query_suite`, or fall back to waiting for the weekly default-setup schedule GitHub
   documents — named as a real fallback, not assumed away.

`quickstart.md` is rewritten to this order.

## R17 — Enable switch and promotion source as repo variables (M2)

`vars.PROMOTE_DEVELOP_ENABLED` (repository variable, not a secret — it carries no credential) is
read first, before any other check (R19). Anything other than the literal string `'true'` is
treated as disabled: the job/script exits 0 with a `::notice::` and does nothing else — no secrets
read, no token minted, no git command run. This doubles as R16's bootstrap gate *and* a standing,
documented emergency freeze switch a maintainer can flip without touching workflow YAML.

`vars.PROMOTE_DEVELOP_SOURCE_BRANCH`, defaulting to `train/elements-first` when unset, is passed
into the script as `PROMOTE_SOURCE_REF` and used for the script's *internal* notion of "what is
the train tip" (R18's `git ls-remote`, not `github.sha`). **Named limitation, stated rather than
glossed over**: GitHub Actions trigger blocks (`on:`) cannot reference `vars.*`/`secrets.*` — they
are evaluated before any context is available — so the workflow's own `on.push.branches:
['train/elements-first']` stays a literal string regardless of this variable. Changing the actual
source branch (the epic's own stated future: "the operator picks the next source when this train
lands on `main`") requires **both** updating this variable **and** editing the workflow's trigger
in a follow-up mission — the variable alone is not a complete cutover mechanism, and `branch-model.md`
says so explicitly rather than implying a one-variable flip suffices.

## R18 — Live train tip, not `github.sha` (M3)

**Decision**: resolve the train tip at run time via `git ls-remote origin
refs/heads/$PROMOTE_SOURCE_REF` (or the equivalent `gh api repos/.../git/ref/heads/<ref>`), never
`github.sha` (the SHA that triggered the run). **Rationale, verified**: `github.sha` is frozen at
trigger time; a manually re-run job (or a `workflow_dispatch` invocation, once that becomes usable
— below) executing well after the triggering push, or after the train has moved again, would act
on a stale value. Resolving live makes "re-run the failed job" a safe, general recovery path
instead of one that silently reasons about an outdated tip.

**`workflow_dispatch`'s real activation condition, verified and corrected (M3)**: GitHub Actions
documentation confirms `workflow_dispatch` can only be triggered for a workflow file that already
exists, with that trigger declared, **on the repository's default branch**. `ci-quality.yml`
today declares no `workflow_dispatch` trigger at all (confirmed by reading the live file). Adding
`workflow_dispatch: {}` to it in this mission's PR (which merges into `train/elements-first`, not
`main`) means the trigger is **not actually invocable** until this exact version of the file
reaches `main` — which only happens at the operator's own, later train→main landing. **The first
revision's "workflow_dispatch enables a manual re-run" claim is corrected**: the trigger is added
now (harmless, and it activates automatically once main gets it), but until then, manual recovery
from a stuck or failed promotion run is (a) push a trivial commit to `train/elements-first` to
produce a fresh, real `push` event (the `push` trigger *is* live immediately once this PR merges),
or (b) the orchestrator running the equivalent commands by hand per `quickstart.md`.

## R19 — Order of checks (M4)

Revised order, cheapest and most information-bearing first, each one able to short-circuit without
needing anything the later ones require:

1. **Enable switch** (`vars.PROMOTE_DEVELOP_ENABLED`) — no I/O at all.
2. **`develop` exists, checked against the remote, not a local ref** — `git ls-remote
   https://github.com/spec-kitty/spec-kitty-design.git refs/heads/develop`. **Verified**: this
   repository is public (`spec-kitty/spec-kitty-design`), so `git ls-remote` against it needs no
   authentication — meaning this check runs *before* any secret is read or any token minted. If
   the command's own output has no matching line, `develop` genuinely does not exist yet: no-op,
   exit 0, matching FR-007(c) exactly, and — the point of ordering this before secrets — **without
   ever needing the App credentials**, so a missing `develop` can never be misreported as a missing
   secret.
   **Squad correction, distinct from the ordering point**: if `ls-remote` says `develop` *does*
   exist, but a later step's local resolution of `origin/develop` (after checkout/fetch) still
   comes back empty, that is **not** the same "missing" signal — it means the local fetch failed
   or was incomplete, and must be a hard **error** (non-zero exit, clear message), never silently
   folded into the no-op path. `readRefTip`'s contract (data-model.md) is revised to distinguish
   "confirmed absent" (returns `null`, only reachable when the prior remote check already said
   absent) from "should exist but did not resolve" (throws).
3. **The two App secrets** (R7's fail-fast pattern) — checked last of the "can this run at all"
   gates, since by this point we know the run is enabled and has real work to do.
4. **Mint the token, then checkout with it** (R14).
5. **The App-scope runtime guard** (R20) — the very first thing done *with* the minted token,
   before it is used for anything else.

## R20 — App-scope runtime guard (M5)

**Verified**: `GET /installation/repositories`, authenticated with an installation access token,
is a standard, long-standing GitHub Apps REST endpoint — "List repositories accessible to the app
installation" — returning exactly the repositories that installation's token can act on.

**Decision**: immediately after minting, call this endpoint and assert its `repositories` array
has **exactly one** entry, with `full_name === 'spec-kitty/spec-kitty-design'`. Any other
observation (zero repos — token invalid or mis-scoped; more than one — the App's installation was
widened beyond the operator's 2026-09-11 ruling, whether by accident or a later, uncoordinated
change) **fails the run closed**, immediately, before any git or PR operation. This is a
**pure function** over the API response (`assertSingleRepoScope(installationRepositoriesJson)`),
tested in `--selftest` with fixtures for 0, 1-correct, 1-wrong, and 2+ repos — a governance
invariant (the App's install boundary) enforced at every run, not only trusted from how the App was
created once.

## R21 — PR discovery: `gh pr list` is not `gh pr list --head` (M6)

**Verified**: `gh pr list --head <branch>` performs an **exact match** (`gh pr list --help`'s own
usage example, `gh pr list --head "typo"`, and its flag description give no glob/prefix
semantics) — it cannot be used to find "any PR whose head starts with `promote/`." **Decision**:
`gh pr list --base develop --state open --limit 50 --json number,headRefName,headRefOid`, then a
**pure function**, `findPromotionPRs(prListJson)`, filters client-side on `headRefName.startsWith('promote/')`
and returns the matches. Probed with 0, 1, and 2+ synthetic matches (M6) — the 2+ case is not
hypothetical once M7's sweep (R22) is added; it is the exact anomaly that sweep exists to correct.
**The in-sync check must not leave a stale promotion PR open**: if `decidePromotion` determines
`no-op-in-sync` (develop's tree already equals the train's) *and* an open promotion PR still
exists, that PR is now stale by definition (its own purpose — landing a tree that is not yet on
develop — no longer applies) and is closed with a comment explaining why, rather than left open
indefinitely.

## R22 — `promote/*` is a scratch namespace (M7)

**Decision**: `promote/*` branches are treated as disposable — force-updatable, safe to delete —
never as a branch anyone develops on. Each run, after its own decision logic, **sweeps**: closes
every open `promote/*`-headed PR except the newest (by `createdAt`) with a comment naming its
superseder, and deletes every `promote/*` branch that has no open PR pointing at it. A failed
branch **delete** (e.g., a permissions hiccup, or a branch protection interaction) is logged as a
named, non-fatal row in the run's output — cluttering `promote/*` with a dead branch is a nuisance,
not a promotion failure, and must not be conflated with one in the exit code.

## R23 — Dry-run / recorded-invocation probe (M8)

**Decision**: `scripts/lib/promote-github.mjs` (the `gh`-shelling layer) accepts an injectable
`exec` function (defaulting to `execFileSync`), and `--selftest` provides a **recording shim** that
captures every `gh`/`git` invocation's argv instead of running it, asserting the exact command
sequence for each of the six `PromotionDecision` outcomes (data-model.md) — e.g., `no-op-in-sync`
records *zero* mutating calls; `supersede-and-open` records close-comment, close, branch-delete,
then create-PR, in that order. This is the "dry-run mode" the squad asked for, implemented as a
seam already implied by R8's mutation-control design (an injectable function is also what lets a
mutation control patch one call's behavior without touching the others) rather than a second,
separate flag.

## R24 — Gate-wiring registration, concretely (M9)

Restated from R9 with the concrete artifact list: `REQUIRED_LINT` gains two entries (one per
`--selftest` invocation), the branch-coverage loop gains `'develop'`, and
`check-gate-wiring-defeats.mjs` gains one new case (a mutated `ci-quality.yml` copy narrowing
`pull_request.branches` back to `[main, 'train/**']`, asserting the unmodified `check-gate-wiring.mjs`
still flags it) plus a case for the `gate` shell's new `promote/*` tolerance branch (R15) being
removed, asserting the same.

## R25 — Ruleset parity: wired into live CI, full-parameter comparison (M10, supersedes R10)

**Reversed decision**: `check-develop-ruleset-parity.mjs --check` **is** wired into automatic CI
now — on a **schedule** and on **`push` to `develop`** (the branch the parity check is actually
about, now that FR-003 makes `develop` a real trigger-covered branch). **Token permission needed
to read rulesets, checked rather than assumed**: `gh api repos/.../rulesets/<id>` (used
throughout this mission's own research) succeeded using the operator's own `gh` session; the
default `GITHUB_TOKEN` in a scheduled/push-triggered job on a **public** repository has been
sufficient for read-only ruleset access in this repository's own prior investigation (the same
call this mission ran to read `main-is-safe` needed no elevated scope beyond an authenticated
`gh` session) — the workflow step is given `permissions: { contents: read }` (no
ruleset-specific permission exists to request) and the implementer confirms this empirically
against a real scheduled run before relying on it, named here as a residual, not glossed over as
certain.

**Corrected during WP01's implementation pass (orchestrator decision): one shared cron, not a
second one.** This section's first revision read "matching the existing nightly-CVE cadence
pattern" as licence to add a **second** `schedule` entry (`- cron: '43 3 * * *'`) alongside
FR-041's `17 2 * * *`, and the WP01 implementer built exactly that, per
`contracts/ci-quality-integration.md`'s own (now-corrected) §1. That is wrong: GitHub Actions'
`schedule:` trigger fires the **entire** workflow file for each cron entry independently: a
second entry does not scope a new job into a second, separate run — it re-triggers every job in
`ci-quality.yml` a second time per day, and every job without its own event-specific guard
(`workflow-pin-check`, `lint-code`, `storybook-build`, `test`, `release-gate`, `gate`, and even
`security`, whose own `if:` discriminates only on `github.ref`, not on which cron fired) runs
**twice daily instead of once** — an entire extra ~30-minute quality-gate run, every day,
purely to let a sub-second ruleset comparison run on its own schedule. **Corrected decision:**
`develop-ruleset-parity` reuses the single existing cron (`17 2 * * *`) via its own job-level
`if: github.event_name == 'schedule' || (github.event_name == 'push' && github.ref ==
'refs/heads/develop')` — no second trigger entry. The cost of sharing the cron is that
`develop-ruleset-parity` also (harmlessly) evaluates its `if:` on `main`'s own nightly CVE-audit
run, where it is a no-op check against a repository that is not `develop` — cheap, and far
better than doubling the whole workflow's daily run count.

**`diffRulesetParity` must compare every parameter, not only the six data-model.md table rows**
(squad correction) — the first revision's function compared a curated subset. Revised: it compares
the full rule set structurally, **ignoring only response-only fields absent from the POST/PATCH
body shape** (`id`, `node_id`, `_links`, `current_user_can_bypass`, `created_at`, `updated_at`,
`source`, `source_type`) — every other field, at every nesting level, must match between the live
ruleset and the committed artifact except the two named, intentional differences (`name`,
`conditions.ref_name.include`, and `pull_request.allowed_merge_methods` — data-model.md).

**Post-apply verification, added**: after the orchestrator applies the ruleset (R16 step 5),
confirm via `gh api repos/.../rulesets` that **exactly one** active ruleset targets `develop`, that
it equals the committed artifact under the same full-parameter comparison, and record its
numeric ruleset id in `branch-model.md` — so a future drift check (or a human) has a concrete id to
re-fetch rather than searching by name. `--selftest` for `diffRulesetParity` gets the same
floor-outside-table treatment as R8 (both a same-and-different fixture pair are required, not just
a passing one).

## R26 — The REL2 seam, and a corrected claim about `workflow_dispatch` and `GITHUB_TOKEN` (M14) — RESOLVED

**`develop`'s tree is written only by promotion** — stated as an explicit invariant, not merely
implied by the mechanism's existence. **Consequence for REL2 (#363)**: rc-publish must derive any
version bump, tag, or dist-tag state it needs **outside** `develop`'s own tree (at publish time, via
git tags, or via registry-side dist-tag metadata) — it must never commit a version bump *into*
`develop`, because that commit would not be a promotion commit (R12's health check would then
correctly refuse the *next* promotion as diverged). This is stated in `branch-model.md` and in
`plan.md`, and a fold-in comment is posted on #363 naming it (plan.md's Fold-ins).

**Corrected claim, verified**: the first revision's research (and a framing already present in
`spec.md`'s inherited "fact 3" text) treated a `workflow_dispatch` call as needing the same
non-`GITHUB_TOKEN` identity the push/merge steps need. **This is backwards.** Verified via GitHub's
own 2022-09-08 changelog entry ("Customers are now able to use the `GITHUB_TOKEN` with
`workflow_dispatch` and `repository_dispatch` events to trigger workflows... since they are
explicit calls made by the customer") and the REST API's own permission requirement
(`actions: write` on the calling token) — **an explicit `workflow_dispatch` API call made *by* a
job's own default `GITHUB_TOKEN` (with `actions: write` granted) does start a new workflow run.**
The `GITHUB_TOKEN` limitation (fact 3, `spec.md`) is specifically about *implicit* events an
actor's own git/PR activity causes (a push, a PR synchronize) not cascading into new runs — it does
not extend to an explicit, intentional dispatch call. **Consequence**: if REL2 chooses to have this
mission's promotion workflow call `workflow_dispatch` on its rc-publish workflow directly (one of
the two options `spec.md`'s Recorded Decision already leaves to REL2), that call can be made from
the **job's own `GITHUB_TOKEN`** with `permissions: { actions: write }` added to that one job — **no
change to the App's permission grant is needed for this**, because the App is not the token making
that particular call. A fold-in comment is posted on #363 naming this correction, since REL2's own
planning may have inherited the same backwards assumption from this mission's earlier draft.
**Resolved (tasks phase, 2026-09-11)**: `spec.md`'s inherited "fact 3" paragraph, and the matching
Edge Cases paragraph, both glossed `workflow_dispatch`/`repository_dispatch` together with
`pull_request` `opened`/`synchronize`/`reopened` as uniformly landing in an "approval-required"
state when the actor is `GITHUB_TOKEN`. Re-verified directly against the live page
(`https://docs.github.com/en/actions/using-workflows/triggering-a-workflow`, fetched 2026-09-11):
its exact text is "`workflow_dispatch` and `repository_dispatch` events always create workflow
runs" (a plain, unconditional exception — not approval-required) and, separately, "`pull_request`
events with the `opened`, `synchronize`, or `reopened` activity types: when a workflow using
`GITHUB_TOKEN` creates or updates a pull request, the resulting `pull_request` event creates
workflow runs in an **approval-required** state" — two exceptions with different outcomes, not one.
This is the same correction as this section's main finding above, extended to the historical fact-3
prose: both paragraphs in `spec.md` are now rewritten to separate the two exception classes rather
than conflating them. R26 is resolved; no open imprecision remains in `spec.md`.

## R27 — Scope boundary with REL3: the GitHub Packages ruling lands only in `branch-model.md` (M15, supersedes R11)

**Decision**: REL1's diff does not touch `docs/design-system/using-components.md` at all. The
2026-09-11 GitHub Packages ruling (FR-006) is recorded **only** in `docs/architecture/branch-model.md`
(FR-009's own doc) — chosen over inventing a third location because `branch-model.md` already
exists in this plan for exactly this kind of governance-ruling record, and putting the packaging
ruling beside the branch-model content keeps it out of `using-components.md`'s registry-routing
prose entirely, which is what M15 flags REL3 (#364) as owning. A fold-in comment is posted on #364
naming this boundary explicitly, so REL3 knows `using-components.md`'s stale `npm install`
instructions are still exactly as stale as they were before this mission — REL1 records the
*ruling*, REL3 updates the *doc consumers read to install the packages*, and the two are now
clearly separated rather than the first revision's single mission touching both.

## R28 — Cross-link from the run-prompt doc (M16)

`docs/architecture/elements-first-run-prompt.md` (the loop's own operating doc, DIRECTIVE_037
"Living Documentation Sync") gets one added line near its "Never PR into `main`" rule, pointing at
`docs/architecture/branch-model.md` for the full three-branch model — so a reader following the
loop's own procedure doc has an explicit path to the fuller explanation FR-009/User Story 4 adds,
rather than the two documents existing side by side with no link between them.

## R29 — Verification paths for FR-002/FR-003/NFR-002/SC-001/SC-002/SC-003 (M17)

The first revision left these provable only "by inspection." Concrete checks, tied to existing or
newly-registered mechanisms rather than restated as prose:

- **FR-003** (branch filter includes `develop`): tied to R9/R24's `check-gate-wiring.mjs`
  branch-coverage list addition — the same mechanism that already polices `main`/`train/elements-first`
  coverage.
- **NFR-002** (no regression on `main`/`train` job sets): a **static assertion**, not a live-run
  comparison — parse `ci-quality.yml` before and after the filter edit and assert only the
  `branches` arrays changed; the job **key set** (`Object.keys(wf.jobs)`) and every job's `if:`/
  `needs:` are byte-identical except for the one new `promote-develop` job (whose own `if:` is
  scoped to `push` + `train/elements-first`, so it structurally cannot fire for a `main` push,
  keeping `main`'s job set unchanged) and the four heavy jobs' new `promote/*` guard (which
  structurally cannot fire for anything but a `promote/*` head, so `train/elements-first` pushes —
  never headed `promote/*` — are unaffected by it). This is `scripts/check-gate-wiring.mjs`'s own
  shape (parse-and-assert-structure, not text-match), extended rather than duplicated.
- **FR-002** (`train/**` unaffected): the same static assertion covers it — `train/**` is a
  filter entry, not a job, and is asserted present alongside `develop`, not replaced by it.
- **SC-001/SC-002**: `SC-001` (ruleset rule-type parity) is what `diffRulesetParity` (R25) *is*;
  `SC-002` (a develop-based PR/push runs the full job set) is observable the same way NFR-002 is —
  structurally, from the parsed workflow — plus a real, first-promotion-PR observation once
  `develop` exists (Orchestrator Actions).
- **SC-003**: covered by the same static assertion as NFR-002 (they are the same claim from two
  angles — "no regression" and "the outcome is unchanged").
