# Mission Specification: Release pipeline develop-line governance

**Mission Branch**: `mission/release-pipeline-develop-line`
**Created**: 2026-09-11
**Status**: Draft
**Input**: Issue #362 (REL1, part of epic #361 — release pipeline), "develop branch and RC-line governance"

## Summary

Decision A (epic #361) keeps `train/elements-first` as the integration line and `main` as prod, and
adds a long-lived `develop` branch as the RC line. Today only one ruleset exists
(`main-is-safe`, id `15855418`), it targets `~DEFAULT_BRANCH` only, and `develop` does not exist.
Nothing yet says how `develop` would receive commits once it is cut, and REL2's rc-publish
workflow (#363) — which fires on pushes to `develop` — only ever reaches that branch through
whatever mechanism this mission defines.

This mission specifies: the ruleset `develop` needs, the CI coverage it needs, the packaging
ruling item 4 asks this mission to record, and — as an operator-ruled open decision — the
requirements a train→develop promotion mechanism must satisfy, the viable options, and a
recommendation. It does not create `develop`, does not create its ruleset, and does not implement
REL2's rc-publish workflow or any registry/`.npmrc` change (REL2/REL3, #363/#364).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - `develop` is gated the same way `main` is (Priority: P1)

As a repo maintainer, I want `develop` covered by its own branch ruleset with the same rule set as
`main-is-safe`, so that the RC line cannot be deleted, force-pushed, or given a non-linear history
by accident — the same protection `main` already has.

**Why this priority**: this is the acceptance essential named directly in #362 ("`develop` exists
and is gated by its own active ruleset"). Without it, `develop` is a completely unprotected branch
carrying release-candidate code, which is a worse posture than having no RC line at all.

**Independent Test**: after the orchestrator applies the ruleset this spec defines, `gh api
repos/spec-kitty/spec-kitty-design/rulesets` lists a second active ruleset targeting `develop`
whose `rules` array matches `main-is-safe`'s rule *types* (`deletion`, `non_fast_forward`,
`required_linear_history`, `pull_request`, `code_scanning`).

**Acceptance Scenarios**:

1. **Given** the new ruleset is active on `develop`, **When** anyone attempts `git push --force`
   to `develop`, **Then** the push is rejected the same way it is on `main` today.
2. **Given** the new ruleset is active, **When** a PR targeting `develop` has an unresolved
   `high_or_higher` CodeQL alert, **Then** the ruleset's `code_scanning` rule blocks it, matching
   `main-is-safe`'s existing `security_alerts_threshold`.

---

### User Story 2 - CI runs on `develop` the same way it runs on `train/**` (Priority: P1)

As a contributor or an automated promotion mechanism, I want `ci-quality.yml` to run its full
quality gate on pushes and pull requests touching `develop`, so that code landing on the RC line
gets the same lint, test, security and release-graph checks the train and main already get —
never a silently unchecked branch.

**Why this priority**: named directly in #362 ("CI runs on `develop` pushes") and structurally
required — REL2's rc-publish workflow assumes `develop` is already a quality-gated branch; if
`ci-quality.yml` does not cover it, every commit that reaches `develop` is unchecked by the time
rc-publish fires on it.

**Independent Test**: open (or simulate, via `act` or a scratch branch) a PR whose base is
`develop`; `ci-quality.yml`'s jobs (`changes`, `security`, `lint-code`, `storybook-build` when
applicable, `test`, `release-gate`, `gate`) run, exactly as they do for a PR into `train/**` today.

**Acceptance Scenarios**:

1. **Given** `ci-quality.yml`'s `pull_request.branches` and `push.branches` filters include
   `develop`, **When** a commit is pushed to `develop`, **Then** the workflow runs (it does not
   silently skip because the branch is unlisted).
2. **Given** the filter change, **When** a commit is pushed to `main` or `train/elements-first`,
   **Then** the workflow still runs exactly as before — the change is additive, not a
   replacement.

---

### User Story 3 - The promotion mechanism is decided, not discovered live (Priority: P1)

As the operator, I want this mission's PR to name the requirements any train→develop promotion
mechanism must satisfy, lay out the viable options with their trade-offs against the `develop`
ruleset and against rc-publish cadence, and carry one clearly-marked recommendation — so that I
approve a considered choice before it runs against a real branch, instead of finding out how
`develop` gets updated only after REL2 ships and something silently never reaches it.

**Why this priority**: operator ruling, 2026-09-11 — this mission decides the mechanism, the
review squad examines it, and the operator approves it before this mission's PR merges. Without
this, REL2's rc-publish workflow has a trigger with nothing upstream of it that reliably fires
that trigger.

**Independent Test**: this spec's Open Decision section is readable on its own and lets a
reviewer answer, for each option, "does this need a ruleset exception?" and "how does publish
cadence change?" without reading any other document.

**Acceptance Scenarios**:

1. **Given** the options table below, **When** the review squad examines it, **Then** it can
   raise a finding against a specific option/trade-off rather than against an undocumented
   mechanism.
2. **Given** the operator has not yet approved a specific option, **When** this mission's PR is
   reviewed, **Then** the recommended option is implemented behind requirements that any of the
   viable options would also satisfy, so an operator override does not require re-authoring the
   spec.

---

### User Story 4 - A contributor can name the three branches without reading an ADR (Priority: P2)

As a contributor or agent working in this repository after `develop` exists, I want a short,
findable description of what `main`, `train/elements-first` and `develop` are each for and which
one a given kind of change PRs into, so that "which branch do I target" is answered by a doc, not
by re-deriving it from issue #361's comment thread.

**Why this priority**: named by the operator's fold-in standing order as an example of an adjacent
gap this mission should close rather than defer — nothing in the repository today describes the
three-branch model, and `docs/architecture/elements-first-run-prompt.md` already documents a
two-branch (`main`/`train`) model that becomes incomplete the moment `develop` exists.

**Independent Test**: a reader of the updated doc section can state, without opening #361 or
#362, that mission PRs still target `train/elements-first`, that `develop` receives commits only
through the approved promotion mechanism, and that `main` is only ever reached from `train` by an
operator act.

**Acceptance Scenarios**:

1. **Given** the doc update, **When** a new contributor reads it, **Then** they can correctly
   answer "which branch does my mission PR target" without being told out of band.

---

### Edge Cases

- What happens when the promotion mechanism's trigger fires before the orchestrator has cut
  `develop` (for example, this mission's own commits landing on `train/elements-first`)? It must
  detect the missing branch and no-op cleanly — it must not fail the run, and it must not attempt
  to create `develop` itself (that stays an orchestrator/operator act, per Sequencing below).
- What happens if `develop` is ever found to not be a strict ancestor-relationship match with
  `train/elements-first` (for example, a ruleset bypass or an out-of-band admin action put a
  commit on `develop` that never went through `train`)? The mechanism must refuse to force a
  promotion over that state and must surface the divergence rather than silently overwriting it.
- What happens when two train merges land before a promotion cycle completes? The mechanism must
  not open a second, duplicate promotion PR while one is already open and unmerged.
- What happens when a commit being promoted trips `develop`'s `code_scanning` rule? The mechanism
  must let the ruleset block it exactly as it would on `main` — it must never carry a bypass for
  this rule.
- What happens if `develop`'s `code_scanning` rule has **no analysis to check at all** (CodeQL
  default setup has never scanned a PR against `develop`)? Verified 2026-09-11: GitHub's own
  documentation states a ruleset `code_scanning` rule blocks a PR when "a required tool's analysis
  is still in progress, or a required tool is not configured for the repository" — a missing
  analysis is fail-closed, not a pass. See the Open Decision section for whether `develop`
  qualifies for default-setup coverage and what mitigates the gap if it does not.
- What happens to REL2's rc-publish workflow before this mission's promotion mechanism has run at
  least once? It has nothing to trigger on; that is expected and is not this mission's failure —
  rc-publish itself is out of scope (#363).
- What happens if the promotion mechanism's own identity is the workflow's default `GITHUB_TOKEN`?
  Verified 2026-09-11 against GitHub's documentation on triggering workflows: "events triggered by
  the `GITHUB_TOKEN` will not create a new workflow run," with narrow exceptions
  (`workflow_dispatch`, `repository_dispatch`, and `pull_request` `opened`/`synchronize`/`reopened`
  events, which do create a run but in an **approval-required** state when the actor is
  `GITHUB_TOKEN`). A `GITHUB_TOKEN`-authenticated push to `develop` — the final step of any
  automated option — therefore fires **no** workflow at all, breaking FR-007(e) and starving
  REL2's rc-publish trigger silently. See the Open Decision section for the identities that avoid
  this.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | `develop` ruleset specification | As a repo maintainer, I want a fully-specified ruleset for `develop` (rule types, targets, bypass actors) documented so the orchestrator can apply it verbatim after cutting the branch, giving `develop` main-is-safe parity. | High | Open |
| FR-002 | `train/**` coverage unaffected | As a repo maintainer, I want confirmation recorded that `train/**` remains covered by `ci-quality.yml` and by no new ruleset conflicts, so adding `develop` governance is additive, not a regression on the existing integration line. | High | Open |
| FR-003 | `ci-quality.yml` branch filter extended to `develop` | As a contributor, I want both `pull_request.branches` and `push.branches` in `ci-quality.yml` to include `develop` alongside `main` and `train/**`, so pushes and PRs against `develop` are quality-gated. | High | Open |
| FR-004 | No unrelated job-level branch logic needed | As a maintainer, I want it recorded that no job inside `ci-quality.yml` needs a branch-conditional change beyond the top-level trigger filters — the only branch-scoped `if` in the file (the FR-041 nightly CVE audit) stays `main`-only by design and is unaffected by adding `develop` to the push filter. | Medium | Open |
| FR-005 | Action-pin compliance on touched workflow files | As a maintainer, I want every action reference in any workflow file this mission touches or adds (including a new promotion workflow) pinned to a commit SHA, verified by `scripts/check-action-pins.sh`, so this mission does not introduce a tag-pinned action. | High | Open |
| FR-006 | GitHub Packages visibility ruling recorded | As a maintainer, I want the operator's 2026-09-11 ruling — one public `@spec-kitty/{elements,styles,tokens}` package per name, created private and flipped to public on first publish, rc and prod streams separated only by dist-tag — recorded in this repository's documentation now, even though publishing itself is REL2/REL3 (#363/#364), so the next mission does not have to re-derive it from the epic's comment thread. | Medium | Open |
| FR-007 | Promotion mechanism satisfies stated requirements | As the release pipeline, I want a train→`develop` promotion mechanism that: (a) requires no ruleset bypass actor unless the operator explicitly approves one as a named deviation from main-is-safe parity; (b) is idempotent — a re-run with nothing new to promote performs no action and opens no duplicate PR; (c) no-ops safely if `develop` does not yet exist; (d) never force-pushes and never overwrites a `develop` that has diverged from `train/elements-first` in a way the mechanism did not itself produce; (e) results in a normal `push` event on `develop` when it succeeds, so REL2's rc-publish workflow has something to trigger on; (f) never pushes a merge commit onto `develop`, so `required_linear_history` holds without a bypass; (g) does not degrade into recurring merge conflicts across repeated promotion cycles; (h) uses an identity other than the workflow's default `GITHUB_TOKEN` for any step whose triggering a downstream workflow matters (opening/updating the PR, and merging it), because `GITHUB_TOKEN`-caused events do not create new workflow runs (Edge Cases, above). | High | Open |
| FR-008 | Promotion mechanism is operator-approved before merge | As the operator, I want the specific mechanism variant this mission implements marked as a recommendation pending my approval, with the viable alternatives documented, so I decide before this mission's PR merges rather than after. | High | Pending Approval |
| FR-009 | Branch-model doc added | As a contributor, I want a short section describing what `main`, `train/elements-first` and `develop` are each for, and which branch a given kind of PR targets, added to the repository's architecture documentation, so the three-branch model is discoverable without reading issue history. | Medium | Open |
| FR-010 | Promotion outcome is observable | As an operator or maintainer, I want each promotion attempt's outcome (promoted / no-op / blocked-and-why) visible in the mechanism's own run output or PR, so diagnosing "why hasn't `develop` moved" does not require reading raw workflow logs. | Low | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Zero unpinned actions | 100% of action `uses:` references in every workflow file this mission adds or edits are pinned to a full commit SHA (0 tag-only or branch-only refs), verified by `scripts/check-action-pins.sh` exiting 0. | Security | High | Open |
| NFR-002 | No regression on existing branch coverage | After the `ci-quality.yml` filter change, the set of jobs that run on a `main` push and on a `train/**` push is byte-identical to today's set (0 jobs added, removed, or newly skipped for those two branch classes). | Reliability | High | Open |
| NFR-003 | Promotion idempotency | Across any sequence of promotion-mechanism runs where `train/elements-first` has not moved since the last successful promotion, 0 duplicate PRs are opened and 0 additional pushes are made to `develop`. | Reliability | High | Open |
| NFR-004 | No silent branch-scan gaps | The ruleset covering `develop` and the `main-is-safe` ruleset covering `main` together leave 0 push-accessible long-lived branches (`main`, `train/elements-first`, `develop`) without an active ruleset of matching rule types, other than `train/elements-first`, which this mission's scope does not add a ruleset for (out of scope; tracked as an open question below). | Security | Medium | Open |
| NFR-005 | Linear, conflict-free promotion | Every commit the promotion mechanism adds to `develop` has exactly one parent (0 merge commits pushed to `develop`), and across any sequence of promotions where `train/elements-first` keeps advancing, 0 promotion attempts fail with a merge conflict. Verified for the recommended mechanism in a scratch repository (Open Decision, below); the squash/rebase-PR alternative (Option B) does **not** meet this NFR past the first promotion cycle and is documented as failing it, not silently assumed to pass. | Reliability | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | This mission's PR targets the train only | This mission's own pull request merges into `train/elements-first` and nothing else — never into `main`, never directly into `develop`. The operator standing order for this is recorded in `docs/architecture/elements-first-run-prompt.md` ("never PR into `main` — the train lands on `main` once, at the end, by the operator"); it is **not** stated in ADR-8, which is about the custom-elements component base layer and does not mention branch retargeting, PR bases, or `train`/`develop` at all (verified 2026-09-11 by reading the full ADR and grepping this repository for "retarget" — no ADR states this rule). | Technical | High | Open |
| C-002 | `main`'s ruleset is untouched | This mission makes no change, proposed or applied, to ruleset `15855418` (`main-is-safe`) or to any rule targeting `~DEFAULT_BRANCH`. | Technical | High | Open |
| C-003 | `develop` and its ruleset are repo settings, not this mission's diff | Creating the `develop` branch and applying its ruleset are GitHub repository-setting actions performed by the orchestrator, not commits in this mission's PR. This mission's diff contains the ruleset *specification* (for the orchestrator to apply) and the CI/workflow/doc changes only. See Sequencing below for when. | Technical | High | Open |
| C-004 | rc-publish, registry and `.npmrc` changes are out of scope | REL2 (#363) owns the rc-publish workflow itself; REL2/REL3 (#363/#364) own the npm registry, `.npmrc` flip, and any package-publishing code. This mission only ensures `develop` exists, is gated, and is CI-covered so #363's workflow has somewhere to land. | Technical | High | Open |
| C-005 | No ruleset deviation without a named, explicit approval | `main-is-safe` has zero bypass actors, requires linear history, and requires code-scanning results. Any option for the promotion mechanism that needs a bypass actor on `develop` (which, for a direct push, must bypass **both** the `pull_request` rule and `required_linear_history` — the train's own history is not linear, so a fast-forward push carries merge commits), that drops `required_linear_history`, or that drops/weakens the `code_scanning` rule, is a deviation from literal main-is-safe parity and must be called out by name and approved, not folded in silently. | Business | High | Open |

### Key Entities

- **`main-is-safe` (ruleset id `15855418`)**: the only ruleset in the repository today. Targets
  `~DEFAULT_BRANCH` (i.e. `main`). Rules: `deletion`, `non_fast_forward`,
  `required_linear_history`, `pull_request` (0 required approving reviews, squash/rebase merge
  only, no code-owner requirement), `code_scanning` (CodeQL, blocks on `high_or_higher`). Zero
  bypass actors; `current_user_can_bypass: never`. Unchanged by this mission.
- **`train/elements-first`**: the existing integration branch. Mission PRs land here today; no
  ruleset currently targets it (out of scope for this mission to add one — see NFR-004).
  **Its history is not linear.** Verified 2026-09-11: of the last 50 commits reachable from
  `origin/train/elements-first` by any parent, 49 have exactly one parent and 1 has two (a merge
  commit) — but walking only the **first-parent (mainline)** chain, 22 of the last 50 commits are
  merge commits (`git rev-list --parents --first-parent -50`, parent-count histogram: 28×1-parent,
  22×2-parent). Some mission PRs merge into the train via GitHub's `merge` method (producing a
  merge commit plus all of that PR's individual commits, e.g. mainline commit `9c269b3c`, a "Merge
  pull request" commit); others land via squash (a single non-merge commit directly on the
  mainline, e.g. `a679d837`). Either way, **the train's mainline contains real merge commits**,
  which is the fact that breaks a literal fast-forward of `develop` to the train's tip under
  `required_linear_history` (Open Decision, below).
- **`develop`**: the RC line this mission specifies governance for. Does not exist yet; created by
  the orchestrator from `train/elements-first`'s head, after this mission's PR merges (see
  Sequencing).
- **The new `develop` ruleset**: does not exist yet. This mission's FR-001 specifies its rules;
  the orchestrator applies it when `develop` is cut.
- **The promotion mechanism**: the open decision this mission resolves (Open Decision, below).
  Not yet built; this mission's PR contains the recommended implementation, gated on operator
  approval before merge.
- **`SK_CI_APP_ID` / `SK_CI_APP_PRIVATE_KEY`**: two secrets shared at the organization level.
  Confirmed: `gh api repos/.../actions/secrets` returns 0 repo-level secrets in
  `spec-kitty-design`, so these are org-shared, and nothing in this repository's `.github/`,
  scripts, or docs currently references either name (verified by repository-wide grep,
  2026-09-11) — no workflow in **this** repo consumes them today. `gh search code SK_CI_APP_ID
  --owner spec-kitty` (2026-09-11) found them used in `spec-kitty-planning`, `spec-kitty-events`,
  `spec-kitty-tracker` and `spec-kitty-saas`'s `.github/workflows/ci.yml`, all minting a short-lived
  (~1h) installation token of a first-party GitHub App named **`spec-kitty-factory-ci`** via
  `actions/create-github-app-token`, installed org-wide, used there to push a baseline-refresh
  commit and post CI "verdicts" cross-repo — i.e., precisely to route around the `GITHUB_TOKEN`
  workflow-triggering limitation (Edge Cases, above). Those workflows' own comments record that
  the App's permissions are granted **per repository** against an explicit matrix (one such
  workflow's own comment: "...installed org-wide and granted to spec-kitty/spec-kitty-events",
  citing a tracking issue in the org's planning repository); this mission found no evidence either
  way of a grant to `spec-kitty-design`, and could not check
  further without `admin:org` (the read-only checks attempted returned 401/403). Whether
  `spec-kitty-factory-ci` is grantable here, and with what permissions (it would need at least
  `contents: write` and `pull-requests: write` on this repo), is an operator question — see the
  numbered questions at the end of this spec.
- **CodeQL default setup, and whether `develop` would be covered.** Confirmed via
  `gh api .../code-scanning/default-setup` (`state: configured`, no CodeQL workflow file in
  `.github/workflows/`) and via `gh api .../code-scanning/analyses`: every analysis this repository
  has ever recorded is against `refs/heads/main` or against one historical pull request's head/
  merge refs, and that PR's base was confirmed to be `main` (`gh pr view`). **Zero analyses exist
  for `train/elements-first` or any PR into it**, despite hundreds of merges. This matches
  GitHub's documented default-setup scope:
  scanning runs "on each push to the repository's default branch or any protected branch, and ...
  pull requests based against the [default] branch or any protected branch." `train/elements-first`
  is neither, so it has never been scanned — consistent with the evidence. Separately confirmed:
  `main` has **no classic branch-protection object** (`gh api .../branches/main/protection` → 404
  "Branch not protected") yet `gh api .../branches/main` reports `"protected": true` — on this
  repo, "protected" is being set by the **ruleset alone** (`main-is-safe`), with no classic
  protection involved. That is evidence (not a documented guarantee) that once `develop` carries
  its own ruleset, `develop.protected` should also become `true` and default setup should extend
  its push/PR scanning to it. See the Open Decision section for the residual risk this still
  leaves (a bootstrap gap on the very first promotion PR) and the mitigation.
- **GitHub Packages (`@spec-kitty/elements`, `@spec-kitty/styles`, `@spec-kitty/tokens`)**: none
  exist yet (confirmed 404 on npmjs and "no such package" on npm.pkg.github.com, per epic #361's
  2026-09-11 amendment). This mission records the visibility ruling (FR-006) but does not publish
  anything.
- **Repo-level merge settings** (`gh api repos/spec-kitty/spec-kitty-design`, 2026-09-11):
  `allow_auto_merge: false` (so any "auto-merge" in this spec means a workflow polls checks and
  calls the merge API itself — GitHub's native auto-merge queue is not enabled on this repo);
  `allow_merge_commit`, `allow_squash_merge`, `allow_rebase_merge`: all `true` at the repo level.
  `main-is-safe`'s `pull_request` rule further restricts merges **into `main`** to
  `allowed_merge_methods: ["squash", "rebase"]` — a `develop` ruleset built for literal parity
  inherits that same restriction, which rules out a true merge-commit promotion (Option E, below)
  unless that restriction is itself named as a deviation.

## Decision: how `develop` receives commits from `train/elements-first` *(item 5, ruled 2026-09-11)*

**This is now a recorded decision, not an open one.** The operator ruled on the mechanism and
identity below on 2026-09-11, from the options this section presented. FR-007 states what the
mechanism must satisfy; the options that follow are the evaluation trail that produced the ruling,
kept in full because the review squad and the plan both cite it. The final ruling is in "Recorded
Decisions (operator ruling, 2026-09-11)" near the end of this document — read that section first;
what follows is the evidence, not a still-open menu.

**This section was revised after an orchestrator review of the first draft found three errors in
it, which are corrected below rather than silently fixed:** the first draft's Option B (a
squash/rebase promotion PR) was recommended without checking it against the train's actual,
non-linear history, where it degrades into recurring conflicts; the first draft did not consider
that `GITHUB_TOKEN` cannot trigger the very workflow runs FR-007(e) depends on; and it did not
check whether `develop` would actually receive CodeQL coverage. All three are addressed below with
verified evidence, and two new options (D, E) are added.

### Three load-bearing facts

1. **`main-is-safe`'s `pull_request` rule requires zero approving reviews**
   (`required_approving_review_count: 0`). A PR merely has to *exist* to satisfy it — no human has
   to click approve. A fully-automated PR-based promotion therefore needs no ruleset bypass **for
   this rule**, unlike a direct-push mechanism (which the rule blocks outright for any actor with
   no bypass entry).
2. **The train's history is not linear** (Key Entities, above: 22 of the last 50 mainline commits
   are merge commits). Any mechanism that lands merge commits on `develop` trips
   `required_linear_history`, independent of the `pull_request` rule.
3. **`GITHUB_TOKEN`-caused events do not trigger new workflow runs**, with narrow, documented
   exceptions (`workflow_dispatch`, `repository_dispatch`, and `pull_request`
   `opened`/`synchronize`/`reopened`, which run but in an **approval-required** state for a
   `GITHUB_TOKEN` actor). A promotion mechanism that opens and/or merges its PR as `GITHUB_TOKEN`
   therefore either queues every run for manual approval, or — for the final merge, which is a
   `push`, not one of the excepted events — fires no workflow at all. Either way FR-007(e) and
   REL2's rc-publish trigger are starved. This is orthogonal to facts 1–2: it applies to *whichever*
   git mechanism is chosen, and is solved only by using a non-`GITHUB_TOKEN` identity (an
   installation token from the `spec-kitty-factory-ci` App, or a PAT) for every step whose
   triggering something matters, or by having the promotion workflow itself call
   `workflow_dispatch`/`repository_dispatch` to kick REL2's rc-publish workflow directly — REL2
   owns that trigger, so this is presented here as an option for REL2 to accept or reject, not a
   decision this mission makes for it.

### Verifying the git mechanics (scratch repository, `rel1/promo-test/`)

Ran both scenarios in a disposable local repo to check the reasoning rather than assert it:

- **Squash-based promotion (what a literal reading of the first draft's Option B does).**
  Cut `develop` from `train` at commit A (`file.txt` = `a`). Train advances to B (`file.txt` = `b`).
  Promotion 1: `git merge --squash train` into `develop`, commit. `git merge-base train develop`
  is then re-measured **after train advances again** to C (`file.txt` = `c`): the merge-base is
  still commit A — it never advanced past the original cut point, because the squash commit on
  `develop` shares no ancestry with `train`'s own commits, only with the cut point. Promotion 2, a
  plain `git merge train` into `develop`, then hits a real conflict: `CONFLICT (content): Merge
  conflict in file.txt`, base `a`, ours `b` (already on `develop` from promotion 1), theirs `c`
  (train's latest) — git cannot tell that `b` was itself derived from `a` on the train side, because
  the squash commit erased that link. **This confirms the first draft's recommendation would
  degrade into recurring conflicts from the second promotion cycle on**, exactly as the
  orchestrator review predicted (rebase-and-merge has the same root cause: it replays commits onto
  `develop` rather than sharing ancestry with `train`, so a growing, already-promoted commit range
  gets replayed every cycle).
- **Tree-sync promotion (new Option D).** On each promotion, compute `train`'s tip tree
  (`git rev-parse train^{tree}`) and create one new commit whose tree is that value and whose sole
  parent is `develop`'s current tip (`git commit-tree <train-tree> -p <develop-tip> -m "..."`),
  then move `develop` to it. Ran two promotion cycles (`train` advancing twice in between, including
  a change to the same line the first draft's test conflicted on): **zero conflicts**, because this
  is never a merge — it is one new commit, full stop. Re-running with no train change: `develop`'s
  tree already equals `train`'s tree, correctly detected as a no-op. `develop`'s resulting history
  is trivially linear (each commit has exactly one parent) and each commit maps 1:1 to the train
  SHA it promoted (recorded in the commit message), which is useful RC provenance that squash/
  rebase both lose.

### Options

| Option | Mechanism | Ruleset deviation from main-is-safe parity? | History / conflict behavior | rc-publish trigger (needs) |
|---|---|---|---|---|
| **A — Authenticated direct fast-forward push** | Mint a non-`GITHUB_TOKEN` token and fast-forward `develop` to `train`'s tip exactly. | **Yes, two rules**: needs a bypass actor for `pull_request` (any direct push is otherwise rejected) **and** for `required_linear_history` (the train's tip carries merge commits — fact 2). "Parity" becomes nominal: the branch that was supposed to have zero bypass actors and reject non-linear history now has neither property enforced for this actor. | Identical SHAs to `train/elements-first`; verified conflict-free by construction (fast-forward, not a merge) — but only landable at all via the bypass. | A real push if done with the App/PAT token (fact 3); still needs that non-`GITHUB_TOKEN` identity. |
| **B — Squash/rebase promotion PR, auto-merged** | Open a PR `base: develop`, `head: train/elements-first`; merge via `squash` or `rebase` (the only methods main-is-safe's `pull_request` rule allows). | None needed for `pull_request` (fact 1) or `required_linear_history` (squash/rebase both produce single/individually-linear commits). | **Degrades into recurring conflicts from promotion 2 onward** — verified above. Not a viable default; would need manual conflict resolution on an indefinite cadence, which defeats automation. | Needs the App/PAT identity regardless (fact 3); irrelevant once the mechanism itself is non-viable. |
| **C — Squash/rebase promotion PR, operator-merged** | Same as B, but a human merges. | Same as B. | Same conflict problem as B — a human resolving the same recurring conflict is not a fix, just a slower failure mode. | Same as B. |
| **D — Tree-sync promotion (recommended)** | On a `train` push, if `develop^{tree} != train^{tree}`, create one commit via `git commit-tree` (tree = train's tip tree, parent = `develop`'s tip, message names the train SHA), land it on `develop` through a single-commit PR (`base: develop`, head a scratch branch holding just that commit). | **None.** The PR satisfies `pull_request` at zero required reviews (fact 1); the commit has exactly one parent, so `required_linear_history` holds without exception; `code_scanning` is unaffected (see below) — no bypass, no dropped rule. | **Verified conflict-free and idempotent across repeated cycles** (above). Each `develop` commit maps 1:1 to a train SHA — better RC provenance than squash/rebase. Not a byte-identical fast-forward (new SHA, same tree), which is an acceptable, stated trade-off, not a hidden one. | Needs the App/PAT identity to open+merge so the PR's checks run and the merge's `push` fires rc-publish (fact 3); or the workflow can call `workflow_dispatch` on REL2's rc-publish workflow directly instead of relying on the `push` event, which sidesteps fact 3 for the trigger specifically (REL2's call to make). |
| **E — Merge-commit promotion** | `develop`'s ruleset drops `required_linear_history` and allows the `merge` method (permitted at the repo level — Key Entities); promotion PRs merge with a real merge commit, so the merge-base always advances and conflicts cannot recur (git's normal 3-way merge machinery, not squash's history-erasing one). | **Yes, one rule**: drops `required_linear_history` on `develop` only (`pull_request` stays intact at zero reviews, same as D). Raises the question below of whether "linear-history parity" is even a coherent thing to ask of a branch fed entirely from a non-linear source. | No conflicts past the first (assuming normal git merge semantics — not independently scratch-tested here, unlike D, because it is standard, well-understood merge-commit behavior). Preserves full train commit history on `develop`, unlike D's single-commit-per-cycle compression. | Same identity need as D (fact 3). |

**Is "linear-history parity" coherent for `develop`, given fact 2?** Arguably not as a literal
requirement — `develop` is fed entirely from a branch that GitHub's own rule would reject if it
were pushed directly, so demanding `required_linear_history` on `develop` either (a) forces a
promotion mechanism that discards train's real history in a way that breaks conflict-freedom (B/C),
or (b) forces one that fabricates a new, synthetic linear history that doesn't literally match
train's own graph (D), or (c) requires giving up the rule entirely for the one branch whose entire
purpose is to receive that non-linear input (E). D keeps the rule at the cost of
fabricated per-promotion commits; E keeps the real history at the cost of the rule. Neither is "true" parity;
both are named, bounded deviations, and D's deviation is smaller (a cosmetic history difference,
not a dropped safety rule).

### The `code_scanning` coverage question, and its mitigation

Confirmed (Key Entities): `develop`'s `protected` flag should become `true` once its ruleset is
applied, on the same basis that `main`'s is `true` today from `main-is-safe` alone — which should
extend CodeQL default-setup's push/PR scanning to it per GitHub's documented scope ("the default
branch or any protected branch"). This is inferred from this repo's own configuration, not from an
explicit GitHub guarantee that a newly-ruleset-protected branch is picked up immediately. The
residual risk is a **bootstrap gap**: the very first promotion PR into `develop` might land before
default setup has ever run a push-triggered baseline analysis of `develop`, and a ruleset
`code_scanning` rule fails closed on "analysis not yet available" (Edge Cases, above) — which would
deadlock exactly that first PR.

**Mitigation, for whichever option is chosen:** the orchestrator's Sequencing step that cuts
`develop` and applies its ruleset (below) should be followed by one plain push to `develop` (no PR
needed — this is the branch's first-ever commit, there is nothing to promote yet) *before* the
promotion mechanism's first cycle runs, so a push-triggered baseline scan exists before the first
promotion PR is opened. This is folded into Sequencing below as an explicit step, not left as a
gap for whoever operates the mechanism to discover.

### Decision — Option D, ruled 2026-09-11

**Option D** (tree-sync promotion) is the ruled mechanism, triggered on every push to
`train/elements-first` (per-merge cadence, also ruled), landed through a single-commit PR. The
operator did **not** grant the org-wide `spec-kitty-factory-ci` App the additional permissions this
section's recommendation floated; instead the identity is **a new GitHub App, installed on
`spec-kitty-design` only**, created by the org owner. See "Recorded Decisions" below for the exact
ruling text; the plan names the new App's permissions and the two repo secrets that carry its
credentials.

**Why D over the others:** D is the only option that satisfies FR-007(f)/(g) (no merge commits, no
recurring conflicts — both verified in the scratch repo, not assumed) while adding **zero** ruleset
deviations (unlike A and E) and while actually working past the first promotion cycle (unlike B/C,
which is this spec's own withdrawn error from the first draft, not a hypothetical). It is not a
byte-identical fast-forward, but that property was never achievable without a bypass actor for
`required_linear_history` anyway, given fact 2 — so the trade-off D makes (a fabricated commit
instead of train's real graph) is the cheapest one available, not a concession specific to D.

The review squad still examines the implementation against FR-007, NFR-005, and C-005, and the
operator still approves the implemented PR itself (FR-008) before it merges into
`train/elements-first` — the mechanism choice is decided; the concrete workflow is not yet
reviewed.

## Sequencing: when the repo-setting actions happen

This mission's PR contains code and documentation only: the `ci-quality.yml` filter change
(FR-003), the `develop` ruleset specification (FR-001, as a document — not an applied ruleset),
the promotion mechanism's workflow implementation (FR-007/FR-008), the GitHub Packages ruling
record (FR-006), and the branch-model doc (FR-009). It does **not** create `develop` and does
**not** apply any ruleset — both are GitHub repository settings, made by the orchestrator, not by
a commit in this branch.

**Proposed order:**

1. This mission's PR merges into `train/elements-first` (under the normal two-condition gate: CI
   green, adversarial-gate evidence posted — plus, per the operator's ruling for item 5, explicit
   operator approval of the promotion mechanism).
2. **Only then** does the orchestrator cut `develop` from `train/elements-first`'s new head, and
   apply the ruleset FR-001 specifies.
3. Before the promotion mechanism's first cycle runs, confirm `develop`'s `protected` flag reads
   `true` (`gh api repos/.../branches/develop --jq .protected`) and that at least one push-
   triggered CodeQL analysis exists for `develop` (`gh api repos/.../code-scanning/analyses` with
   `ref=refs/heads/develop`) — the branch-cut push in step 2 should itself be enough to seed this,
   but confirm it rather than assume it, given the `code_scanning` deadlock risk described in the
   Open Decision section. If no analysis appears, wait for the weekly default-setup schedule or
   trigger one before opening the first promotion PR, not after it stalls.

**Why this order, not the reverse:** if `develop` were cut *before* this PR merges, its first
commit would predate the `ci-quality.yml` filter change that makes `develop` a covered branch —
`develop` would exist, unprotected in practice (its ruleset can be applied independently of CI
coverage, but the two are meant to land together) and every commit on it until this PR also
reaches it would run no quality gate. Cutting `develop` from the post-merge head means the very
first thing `develop` contains is a tree where `ci-quality.yml` already recognizes it, so there is
no window where the branch exists but is silently unchecked.

The promotion mechanism's workflow (FR-007) must tolerate running between these two steps: if this
mission's PR merges and its promotion workflow's trigger fires before step 2 has happened, the
workflow must detect that `develop` does not exist and no-op (Edge Cases, above) rather than fail
or attempt to create the branch itself.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Once the orchestrator applies FR-001's specification, exactly one active ruleset
  targets `develop`, and its `rules` array's `type` values are identical to `main-is-safe`'s
  (`deletion`, `non_fast_forward`, `required_linear_history`, `pull_request`, `code_scanning`).
- **SC-002**: A push or a pull request with `develop` as its ref/base runs `ci-quality.yml`'s full
  job set, with zero jobs skipped purely because the branch was unrecognized by the trigger
  filter.
- **SC-003**: A push to `main` or to any `train/**` branch continues to run exactly the job set it
  runs today — zero regression from the filter change (this is NFR-002 restated as an outcome).
- **SC-004**: Across the first ten completed promotion cycles after the mechanism is live, zero
  duplicate promotion PRs exist at any point in time, and zero force-pushes to `develop` occur.
- **SC-005**: Across the first ten completed promotion cycles, zero merge commits land on
  `develop` and zero promotion attempts fail with a merge conflict (NFR-005, restated as an
  outcome and distinguishing this mission's actual mechanism from the withdrawn squash/rebase
  approach, which does not meet this bar past cycle one).
- **SC-006**: A contributor who has read only the branch-model doc added under FR-009 can state
  correctly, for a hypothetical new mission PR, that it targets `train/elements-first`, and for a
  hypothetical RC-only fix, whether it should go through the promotion mechanism or a direct
  `develop` PR — without opening issue #361 or #362.
- **SC-007**: The GitHub Packages visibility ruling (FR-006) is findable in the repository's
  documentation by a REL2/REL3 mission without re-reading epic #361's comment thread.

## Notes for the review squad and the operator

- **Item 5 is now decided** (2026-09-11): Option D, tree-sync promotion, with a new
  repo-scoped GitHub App identity. FR-007/FR-008 and the Options table above remain the record of
  *why*, for the review squad to examine the implementation against — not a still-open menu.
- **Two things in the issue text were found to be imprecise, corrected here:**
  - The constraint "do not retarget mission PRs (ADR-8)" cites the wrong document. ADR-8 ("Custom
    Elements as the Shared Component Base Layer") is entirely about the component/framework
    package graph and never mentions branches, PRs, or retargeting. The actual rule — mission PRs
    target `train/elements-first` only, and only the operator merges the train into `main` — is
    documented as an operator standing order in
    `docs/architecture/elements-first-run-prompt.md`, not in any ADR. C-001 above records this
    correction.
  - The `spec-kitty specify` run for this mission set `topology: single_branch` with
    `target_branch: mission/release-pipeline-develop-line` (i.e., its own branch), not
    `train/elements-first`. Checked against this repository's own recent history (2026-09-11):
    this is the prevailing convention here, not an anomaly — of the ten most-recently-created
    missions in `kitty-specs/`, the ones with `single_branch` topology (e.g.
    `visual-evidence-gate-integrity-01M28PTY`, `work-package-detail-primitives-01M1XTPW`) all carry
    `target_branch` equal to their own mission branch, and are accepted via a normal PR regardless.
    `target_branch` is `spec-kitty`'s own internal artifact-commit bookkeeping (where
    `kitty-specs/**` commits land), not the GitHub PR base. The GitHub PR this mission opens still
    targets `train/elements-first`, per C-001, which is unaffected by this.
- **NFR-004 leaves an open question**, not a requirement: should `train/elements-first` itself
  ever get a ruleset? This mission does not propose one (out of scope — #362 only asks for
  `develop` parity), but it is the one long-lived, push-accessible branch that stays unruled
  after this mission, and a future mission or operator decision may want to close that gap.

## Recorded Decisions (operator ruling, 2026-09-11)

These are the operator's answers to the six numbered questions this spec originally posed,
recorded here as decisions per the fold-in standing order. They were chosen from options presented
in session; the text below states the recorded answer, not a verbatim transcript (the verbatim
session comments are on issue #362).

1. **Mechanism: Option D (tree-sync promotion).** Each promotion is one commit whose tree equals
   the train tip's tree, whose parent is `develop`'s current tip, and whose message names the
   train SHA. It lands through a single-commit PR into `develop`. Options A, B, C and E (the
   Options table above) are not used.
2. **Identity: a NEW GitHub App, installed on `spec-kitty-design` only.** The org-wide
   `spec-kitty-factory-ci` App (Key Entities, above) is **not** widened to cover this mission's
   need — this ruling supersedes that entity's speculative "is `spec-kitty-factory-ci` grantable
   here" question with a firm no; a separate, narrowly-scoped App is created instead. The org
   owner creates the App. The plan (`plan.md`) names its permissions and the two repository
   secrets that carry its credentials.
3. **REL2's (#363) trigger: the original question falls away.** With a real (non-`GITHUB_TOKEN`)
   App identity opening and merging the promotion PR, the promotion merge is an ordinary `push`
   event on `develop` (Edge Cases and fact 3, above, no longer apply to it). REL2 still owns
   deciding whether its rc-publish workflow triggers on that `push` or on a `workflow_dispatch`
   call this mission's workflow could make instead — this mission does not decide REL2's trigger,
   it only confirms REL2 receives a real, workflow-triggering event either way.
4. **Cadence: every push to `train/elements-first`.** Not a batched or scheduled alternative.
5. **`code_scanning` bootstrap: not asked separately, kept as specified.** The Sequencing
   section's mitigation (one plain push to `develop` immediately after it is cut, before the first
   promotion PR) stands as technical sequencing rather than a decision requiring separate operator
   approval.
6. **Ruleset deviations: none needed.** Because Option D was ruled (not A or E), the question of
   approving a bypass actor or dropping `required_linear_history` does not arise. **No ruleset is
   added for `train/elements-first`** in this mission — this resolves NFR-004's open question as
   "no, not in this mission," not as a still-open gap. A future mission or operator decision may
   revisit it.

The operator still approves the implemented PR itself (FR-008) — including the concrete workflow,
the App's actual permission grant, and the `develop` ruleset artifact — before it merges into
`train/elements-first`. These six rulings settle the mechanism and its identity; they do not
pre-approve the implementation.
