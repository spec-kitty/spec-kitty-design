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
- What happens to REL2's rc-publish workflow before this mission's promotion mechanism has run at
  least once? It has nothing to trigger on; that is expected and is not this mission's failure —
  rc-publish itself is out of scope (#363).

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
| FR-007 | Promotion mechanism satisfies stated requirements | As the release pipeline, I want a train→`develop` promotion mechanism that: (a) requires no ruleset bypass actor unless the operator explicitly approves one as a named deviation from main-is-safe parity; (b) is idempotent — a re-run with nothing new to promote performs no action and opens no duplicate PR; (c) no-ops safely if `develop` does not yet exist; (d) never force-pushes and never overwrites a `develop` that has diverged from `train/elements-first` in a way the mechanism did not itself produce; (e) results in a normal `push` event on `develop` when it succeeds, so REL2's rc-publish workflow has something to trigger on. | High | Open |
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

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | This mission's PR targets the train only | This mission's own pull request merges into `train/elements-first` and nothing else — never into `main`, never directly into `develop`. The operator standing order for this is recorded in `docs/architecture/elements-first-run-prompt.md` ("never PR into `main` — the train lands on `main` once, at the end, by the operator"); it is **not** stated in ADR-8, which is about the custom-elements component base layer and does not mention branch retargeting, PR bases, or `train`/`develop` at all (verified 2026-09-11 by reading the full ADR and grepping this repository for "retarget" — no ADR states this rule). | Technical | High | Open |
| C-002 | `main`'s ruleset is untouched | This mission makes no change, proposed or applied, to ruleset `15855418` (`main-is-safe`) or to any rule targeting `~DEFAULT_BRANCH`. | Technical | High | Open |
| C-003 | `develop` and its ruleset are repo settings, not this mission's diff | Creating the `develop` branch and applying its ruleset are GitHub repository-setting actions performed by the orchestrator, not commits in this mission's PR. This mission's diff contains the ruleset *specification* (for the orchestrator to apply) and the CI/workflow/doc changes only. See Sequencing below for when. | Technical | High | Open |
| C-004 | rc-publish, registry and `.npmrc` changes are out of scope | REL2 (#363) owns the rc-publish workflow itself; REL2/REL3 (#363/#364) own the npm registry, `.npmrc` flip, and any package-publishing code. This mission only ensures `develop` exists, is gated, and is CI-covered so #363's workflow has somewhere to land. | Technical | High | Open |
| C-005 | No bypass actor without a named, explicit approval | `main-is-safe` has zero bypass actors. Any option for the promotion mechanism that requires adding a bypass actor to `develop`'s ruleset is a deviation from literal main-is-safe parity and must be called out as such and approved by name, not folded in silently. | Business | High | Open |

### Key Entities

- **`main-is-safe` (ruleset id `15855418`)**: the only ruleset in the repository today. Targets
  `~DEFAULT_BRANCH` (i.e. `main`). Rules: `deletion`, `non_fast_forward`,
  `required_linear_history`, `pull_request` (0 required approving reviews, squash/rebase merge
  only, no code-owner requirement), `code_scanning` (CodeQL, blocks on `high_or_higher`). Zero
  bypass actors; `current_user_can_bypass: never`. Unchanged by this mission.
- **`train/elements-first`**: the existing integration branch. Mission PRs land here today; no
  ruleset currently targets it (out of scope for this mission to add one — see NFR-004).
- **`develop`**: the RC line this mission specifies governance for. Does not exist yet; created by
  the orchestrator from `train/elements-first`'s head, after this mission's PR merges (see
  Sequencing).
- **The new `develop` ruleset**: does not exist yet. This mission's FR-001 specifies its rules;
  the orchestrator applies it when `develop` is cut.
- **The promotion mechanism**: the open decision this mission resolves (Open Decision, below).
  Not yet built; this mission's PR contains the recommended implementation, gated on operator
  approval before merge.
- **`SK_CI_APP_ID` / `SK_CI_APP_PRIVATE_KEY`**: two secrets shared at the organization level with
  this repository (confirmed: `gh api repos/.../actions/secrets` returns 0 repo-level secrets, so
  these are org-shared). Nothing in this repository's `.github/`, scripts, or docs currently
  references either name (verified by repository-wide grep, 2026-09-11) — no workflow consumes
  them today. Their existence suggests a GitHub App exists at the org level, but this mission
  could not verify its installation or permissions on this repo without `admin:org` scope (the
  read-only checks available returned 401/403). This is relevant to the Open Decision below as a
  possible authentication path for the promotion mechanism, not a settled fact.
- **GitHub Packages (`@spec-kitty/elements`, `@spec-kitty/styles`, `@spec-kitty/tokens`)**: none
  exist yet (confirmed 404 on npmjs and "no such package" on npm.pkg.github.com, per epic #361's
  2026-09-11 amendment). This mission records the visibility ruling (FR-006) but does not publish
  anything.

## Open Decision: how `develop` receives commits from `train/elements-first` *(item 5)*

This is an open decision, not a settled requirement. Per the operator's ruling on 2026-09-11: this
mission proposes the mechanism, the review squad examines it, and the operator approves it before
this mission's PR merges. FR-007 states what any mechanism must satisfy; the options below are
evaluated against those requirements, against the `develop` ruleset (FR-001), and against how the
choice affects REL2's rc-publish cadence (#363, out of scope here but the consumer of whatever
`push` events this mechanism produces on `develop`).

The load-bearing fact driving this decision: `main-is-safe`'s `pull_request` rule requires **zero**
approving reviews (`required_approving_review_count: 0`). A PR merely has to *exist* to satisfy
that rule — it does not need a human to click approve. That means a fully-automated PR-based
promotion needs no ruleset bypass at all, which a direct-push mechanism does need (the
`pull_request` rule blocks any push that isn't part of a pull request, for every actor with no
bypass entry).

### Options

| Option | Mechanism | Needs a bypass actor on `develop`? | Effect on `develop`'s history | Effect on rc-publish cadence (#363, informational) |
|---|---|---|---|---|
| **A — Authenticated direct fast-forward push** | A workflow triggered on push to `train/elements-first` mints a token (candidate: the org's `SK_CI_APP_ID`/`SK_CI_APP_PRIVATE_KEY` GitHub App, if one is confirmed installed with the right permissions) and fast-forwards `develop` to match `train/elements-first` exactly. | **Yes** — the `pull_request` rule rejects any direct push from an actor with no bypass entry, so this actor must be added as a bypass actor scoped to `develop` only. This is a named deviation from literal main-is-safe parity (main has zero bypass actors) and needs explicit operator approval (C-005). | Identical SHAs to `train/elements-first` — true fast-forward, easiest to reason about. | One `push` per train merge; rc-publish fires immediately and at train's own cadence. |
| **B — Automated promotion PR, auto-merged (recommended)** | A workflow triggered on push to `train/elements-first` opens (or updates, if one is already open) a PR with `base: develop`, `head: train/elements-first`; once CI is green and the ruleset's `code_scanning` gate clears, the same workflow merges it automatically using `squash` or `rebase` (the only methods `main-is-safe`'s `pull_request` rule allows; `develop`'s ruleset is specified to match). | **No** — a PR that exists satisfies the rule at `required_approving_review_count: 0`; no bypass entry needed anywhere. | `squash` collapses the promoted commits into one new commit on `develop` per promotion cycle (SHAs differ from `train/elements-first`, content matches); `rebase` replays each commit individually with new SHAs. Neither is a byte-identical fast-forward, but both preserve linear history and pass `required_linear_history`. | One `push` (the merge) per completed promotion cycle. If triggered per train merge, cadence matches Option A; if batched (scheduled or manual dispatch instead of per-merge), fewer, larger rc-publish triggers. |
| **C — Promotion PR, operator-merged** | Same PR as Option B, but merge is a manual, operator-performed action rather than automatic. | No. | Same as B. | Cadence is bounded by operator availability, not by train activity — the most conservative option, and the one most likely to leave `develop` (and rc-publish) stale between train merges. |

### Recommendation — pending operator approval

**Option B**, triggered on every push to `train/elements-first` (per-merge cadence, matching
train's own activity), merged via `rebase` (preserving individual commit messages on `develop`
for rc-publish's changelog use, at the cost of new SHAs per commit — noted as a trade-off, not a
hidden cost).

Reasoning: Option B is the only option that achieves `main-is-safe` parity **exactly as specified**
— zero bypass actors, same rule types, same `required_approving_review_count: 0` — because it
uses the ruleset's own zero-review PR path rather than asking for an exception to it. Option A is
not recommended as a default because it requires a standing, named exception to the "no bypass
actors" property that is the entire point of parity, and this mission could not confirm the
`SK_CI_APP` GitHub App is installed on this repository or what permissions it holds (no
`admin:org` scope available to check). Option C is not recommended as a default because train
merges into `train/elements-first` already carry a full adversarial-gate pass and green CI before
they land (per the elements-first-run-prompt's pre-merge gate) — requiring a second, manual
human gate before that already-vetted content reaches the RC line adds latency without a
correspondingly clear safety gain, and risks `develop` going stale between operator sessions,
which directly delays rc-publish.

This recommendation is **not a decision**. The review squad should examine it against FR-007 and
against C-005 specifically, and the operator approves (this option, a variant of it, or a
different option entirely) before this mission's PR merges into `train/elements-first`.

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
- **SC-005**: A contributor who has read only the branch-model doc added under FR-009 can state
  correctly, for a hypothetical new mission PR, that it targets `train/elements-first`, and for a
  hypothetical RC-only fix, whether it should go through the promotion mechanism or a direct
  `develop` PR — without opening issue #361 or #362.
- **SC-006**: The GitHub Packages visibility ruling (FR-006) is findable in the repository's
  documentation by a REL2/REL3 mission without re-reading epic #361's comment thread.

## Notes for the review squad and the operator

- **Item 5 is genuinely open.** FR-007/FR-008 and the Options table above are the artifact meant
  to carry that decision through review; do not treat "Recommendation" as "Decided."
- **Two things in the issue text were found to be imprecise, corrected here:**
  - The constraint "do not retarget mission PRs (ADR-8)" cites the wrong document. ADR-8 ("Custom
    Elements as the Shared Component Base Layer") is entirely about the component/framework
    package graph and never mentions branches, PRs, or retargeting. The actual rule — mission PRs
    target `train/elements-first` only, and only the operator merges the train into `main` — is
    documented as an operator standing order in
    `docs/architecture/elements-first-run-prompt.md`, not in any ADR. C-001 above records this
    correction.
  - The `spec-kitty specify` run for this mission defaulted to `topology: single_branch` with
    `target_branch: mission/release-pipeline-develop-line` (i.e., its own branch), not
    `train/elements-first`. This is `spec-kitty`'s own internal artifact-commit bookkeeping
    (where `kitty-specs/**` commits land), not the GitHub PR base — the actual PR this mission
    opens will still target `train/elements-first` per C-001, and this mission's `kitty-specs/**`
    commits land on `mission/release-pipeline-develop-line`, which is itself the branch the PR is
    opened from. This is flagged to the orchestrator separately as a mission-machinery check;
    it does not change anything stated in this spec.
- **NFR-004 leaves an open question**, not a requirement: should `train/elements-first` itself
  ever get a ruleset? This mission does not propose one (out of scope — #362 only asks for
  `develop` parity), but it is the one long-lived, push-accessible branch that stays unruled
  after this mission, and a future mission or operator decision may want to close that gap.
