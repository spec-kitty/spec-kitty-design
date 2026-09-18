# Mission Specification: WebKit Timing De-flake

**Mission Branch**: `mission/webkit-deflake`
**Created**: 2026-09-18
**Revised**: 2026-09-18 (after the cross-artifact analysis returned `blocked`: 7 high, 7 medium)
**Status**: Draft
**Input**: Tracking issue 453 — "the webkit lane asserts on elapsed time rather than observable state", adopting issues 340 and 238.

## Problem

The `[webkit]` lane is intermittently red across this repository. Two CI runs bracket the evidence:

| run | context | result |
|---|---|---|
| pre-mission, at the train tip | untouched train | 2777 passed, 0 failed, **1 flaky** |
| the font-change PR | tokens-only diff | 2770 passed, **2 failed, 6 flaky** |
| the same change, merged, on the train | push run | 2773 passed, **3 failed, 2 flaky** |

Every failure and flake in all three is `[webkit]`. The change involved touches `packages/tokens` and
one Storybook config path; it does not touch four of the five specs affected. The fragility pre-exists
any one branch — the pre-mission flaky test is in the same spec as three of the others.

The recurring shape is that a test waits for a **duration** and then asserts on whatever the runner
happened to render by then. Every affected test asserts something real; the defect is in *when* it
looks, not in *what* it claims.

One adopted item is different in kind and is kept separate throughout: the behaviour suite's webkit
lane stops mid-queue with **zero test failures**, and its cause is unreadable because the job log
truncates before the error text.

## Canonical scope

This table is the single source of truth for what is in scope. Any count stated elsewhere must agree
with it: **twelve items across five specs** (item 12 is itself the adopted action-row family).
Separately in scope, and NOT one of the twelve because it is not a test, is the behaviour-suite lane
stop and its log truncation (WP06).

Observed states are quoted exactly as the runs reported them. Note that under `retries: 2` a CI
`flaky` line means the test **did fail at least once** and passed on retry — it is a failure that was
retried into a pass, not a clean result.

| # | Test | Observed | Owner |
|---|---|---|---|
| 1 | `sk-progress.spec.ts:369` forced-colors, two points in cycle | **failed** (PR run and train run) | WP02 |
| 2 | `sk-progress.spec.ts:440` forced-colors **＋** reduced-motion | same shape; no failure observed yet | WP02 |
| 3 | `sk-progress.spec.ts:456` the sweep actually runs | flaky (PR), **failed** (train) | WP02 |
| 4 | `sk-progress.spec.ts:465` reduced-motion freeze | **failed** (PR run and train run) | WP02 |
| 5 | `sk-progress.spec.ts:510` no animation leak onto determinate | flaky (PR) | WP02 |
| 6 | `sk-team-overview-shell-layout.spec.ts:104` exact 56/240px columns | flaky (PR) | WP04 |
| 7 | `sk-team-overview-shell-layout.spec.ts:160` narrow shell region order | flaky (train) | WP04 |
| 8 | `sk-team-overview-shell-layout.spec.ts:303` landmarks/labels/grouping | flaky (pre-mission train) | WP04 |
| 9 | `sk-team-overview-shell-layout.spec.ts:445` axe-clean in dark mode | flaky (PR) | WP04 |
| 10 | `sk-workflow-board.spec.ts:557` focused overflow keyboard scroll | flaky (PR), flaky (train) | WP03 |
| 11 | `sk-radio-choice-group.spec.ts:1113` legend cue across two stories | flaky (PR) | WP05 |
| 12 | `sk-action-row.spec.ts` "external controls" family (adopted; parameterized, no single line) | reproduced on two independent trees | WP03 |

Item 2 is included because it has the identical capture-wait-capture shape as its failing siblings and
sits between them in the same file; excluding it would leave a known-fragile assertion behind.
Items 7 and 8 were added after the analysis: 7 flaked on the train after the font change landed, 8 was
the single flaky test on the pre-mission train.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The sk-progress assertions measure a settled, chosen state (Priority: P1)

A maintainer reads `sk-progress.spec.ts` and can tell, for each capture, what state the fixture was in
when it was taken. Captures happen after the thing being measured has painted; where two points of an
animation are compared, those points are explicitly selected rather than separated by a timeout.

**Why this priority**: Items 1 and 4 are hard failures on both the PR and the train, so they are what
turns the aggregate gate red — and a red gate on the train skips the `promote-develop` job. That makes
this mission **necessary but not sufficient** for release promotion, which also needs
`vars.PROMOTE_DEVELOP_ENABLED`; SC-007 is scoped accordingly and the promotion itself is post-merge
follow-up. These assertions were also written to close two recorded
defects (an indeterminate fill rendering indistinguishable from Complete under forced colors), so they
protect real behaviour and must survive intact.

**Independent Test**: Run the five `sk-progress` items under webkit repeatedly with retries disabled;
all pass every repeat. Then reintroduce the defect each one guards and watch that same test fail.

**Acceptance Scenarios**:

1. **Given** the forced-colors indeterminate fixture, **When** item 1 samples the fill's left edge (which its own comment places *inside the clipped region*), **Then** the fixture under test has been awaited to a painted state before the sample is taken. *(This test asserts its two samples are IDENTICAL — under forced colors the fill is static — so it needs paint-settling, NOT phase selection.)*
2. **Given** items 3 and 5, which compare two captures **over time** to prove an animation does or does not run, **When** they sample, **Then** the two points are explicitly selected phases rather than two wall-clock reads separated by a timeout.
3. **Given** item 4's reduced-motion frame, **When** it is compared against the Complete and Zero fixtures, **Then** those comparison fixtures have themselves been awaited to a painted state before being sampled.
4. **Given** any of the five, **When** run on a loaded runner, **Then** the verdict matches the verdict on an idle runner.
5. **Given** the fixes, **When** the indeterminate fill is made full-width under forced colors, **Then** item 1 fails.
6. **Given** the fixes, **When** the reduced-motion rule is removed, **Then** item 4 fails.
7. **Given** the fixes, **When** the sweep animation is removed, **Then** item 3 fails.

---

### User Story 2 - Keyboard and focus assertions wait on the effect they claim (Priority: P2)

Items 10 and 12 press a key and assert a consequence. They wait for the consequence itself — a
navigation, a scroll position, a focus change — rather than asserting after an interval.

**Why this priority**: Item 12 is already diagnosed and reproduced on two independent trees including
the untouched train, with a stated direction. It lands in unrelated missions' output, where the first
hypothesis is always "my diff broke it", so it costs other people time repeatedly. Item 10 has the
same press-then-assert shape and flaked on the train (i.e. failed, then passed on retry).

**Independent Test**: Repeat-run each affected spec with retries disabled; the sub-tests pass every
repeat rather than a varying subset.

**Acceptance Scenarios**:

1. **Given** an Enter-key activation whose effect is a location change, **When** the test asserts, **Then** it has awaited the location change (or the event the handler fires), not a fixed delay.
2. **Given** a scroller that must keep focus across arrow-key scrolling, **When** the test asserts scroll position and focus, **Then** it awaits the scroll settling rather than sampling immediately.
3. **Given** either fix, **When** the handler it depends on is removed, **Then** the test fails — rather than hanging until timeout, or passing.

---

### User Story 3 - The shell-layout composition is present before anything measures it (Priority: P2)

All four affected tests in `sk-team-overview-shell-layout.spec.ts` (items 6–9) obtain their subject
through the same helper, `loadComposition`. On the train, item 7's failing attempt reported
`expect(getByTestId('overview-shell')).toBeVisible()` timing out at 5000ms — *element(s) not found*.
The composition never appeared. (It was reported `flaky`, meaning it then passed on retry — the
failure is real, the retry merely hid it.) That is one shared suspect, not four coincidences.

**Why this priority**: raised from P3 after the analysis. This spec is the repository's most
persistent webkit offender — four of the twelve items, spanning the pre-mission train, the PR run and
the train run.

**Independent Test**: Establish whether `loadComposition` can return before the shell is present or
settled; repeat-run all four items and report counts.

**Acceptance Scenarios**:

1. **Given** `loadComposition`, **When** it returns, **Then** the composition is present and settled, or the helper fails with a message naming what was missing.
2. **Given** item 6's exact 56px/240px column assertion, **When** the body font is varied, **Then** the mission reports whether the measured columns move, with the measurements shown.
3. **Given** a demonstrated cause, **When** the fix lands, **Then** all four pass repeatedly and still fail if the layout contract is broken.
4. **Given** no cause can be demonstrated for an item, **Then** the mission reports the evidence and does not alter that assertion.

---

### User Story 4 - The cross-story comparison compares two settled states (Priority: P3)

Item 11 loads two separate stories and compares a legend cue between them. Both states are fully
settled before either is measured.

**Why this priority**: a single flaky test with no evidence of wider impact.

**Independent Test**: Repeat-run the spec; the comparison holds every repeat.

**Acceptance Scenarios**:

1. **Given** two stories loaded in sequence, **When** their cues are compared, **Then** each has been awaited to a settled state before being read.
2. **Given** the fix, **When** the required and ordinary legends are made identical, **Then** the test fails.

---

### User Story 5 - The webkit lane's failure becomes readable (Priority: P3)

When the behaviour suite's webkit lane stops mid-queue, a maintainer can read the error that caused
it. Today the job log truncates mid-line before the unhandled-errors section.

**Why this priority**: an **observability** deliverable, not a fix. The lane-stop's root cause is
unknown and cannot be diagnosed until its error text is readable.

**Independent Test**: Compare the job log's size and final line before and after; confirm the
unhandled-errors section and the reporter's verdict line are both present.

**Acceptance Scenarios**:

1. **Given** a behaviour-suite run, **When** its job log is fetched, **Then** the log terminates with the reporter's verdict rather than truncating mid-line.
2. **Given** the warn volume is reduced, **When** the warn-and-degrade tests run, **Then** they still assert the degradation behaviour they asserted before.
3. **Given** the enforced mutation harness reads these same files as its subjects, **When** their output is changed, **Then** the harness still re-derives red-first for every subject it covers.

### Edge Cases

- **A green obtained by inherited retries.** `playwright.config.ts` sets `retries: 2` under CI. A repeat rig that inherits it converts a genuine failure into a `flaky` line at exit 0 — a retry-wrapped green arriving by default rather than by choice. Any measurement in this mission must disable retries explicitly.
- **A fix that cannot fail.** Every rewritten assertion must be shown to still fail when its subject breaks.
- **A fix that passes by waiting longer.** Raising a timeout converts a fast failure into a slow one and leaves the dependence on machine speed intact.
- **A flake that is a real race.** "It fails on the train too" establishes that it is not this branch's fault; it does not establish that the product is correct. Genuine non-determinism in a component is a component finding and must be reported as one.
- **A single green run.** One pass does not clear an intermittent failure.
- **WebKit cannot be launched on the development workstation.** Measured, with a chromium positive control. Verification depends on CI, and any claim of local reproduction must state which engine actually ran.
- **A phase-pinning API that changes what is under test.** Pausing or seeking an animation must not itself alter the rendering being asserted.
- **Touching a mutation-harness subject.** The warn-and-degrade fixtures are subjects of the repository's enforced mutation harness. Changing their output can disarm a gate silently.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Settle before sampling | As a maintainer, I want every capture taken after the thing it measures has painted, so a verdict does not depend on runner speed. | High | Open |
| FR-002 | Preserve the forced-colors distinction | As a maintainer, I want item 1 to still prove the indeterminate fill is distinguishable from both Complete and Zero. | High | Open |
| FR-003 | Preserve the reduced-motion assertion | As a maintainer, I want item 4 to still prove the animation stops and the frozen frame is neither Complete nor Zero. | High | Open |
| FR-004 | Select animation phases explicitly | As a maintainer, I want items 3 and 5 to compare two chosen phases rather than two timed reads. | High | Open |
| FR-005 | Await navigation effects | As a maintainer, I want key-activation tests to await their observable effect. | High | Open |
| FR-006 | Await scroll and focus settling | As a maintainer, I want the scroller test to await scroll settling while asserting focus is retained. | Medium | Open |
| FR-007 | Guarantee the composition is present | As a maintainer, I want `loadComposition` to return only once the shell is present and settled, or to fail naming what was missing. | High | Open |
| FR-008 | Establish the geometry assertion's premise | As a maintainer, I want to know whether the exact-column assertion depends on body-font metrics. | Medium | Open |
| FR-009 | Settle both states before cross-story comparison | As a maintainer, I want the legend-cue comparison to read two settled states. | Low | Open |
| FR-010 | Bring the behaviour-suite log under the cap | As a maintainer, I want the job log to contain the unhandled-errors section and the reporter verdict. | Medium | Open |
| FR-011 | Preserve warn-and-degrade coverage | As a maintainer, I want the degradation tests to assert the same behaviour after their output volume is reduced. | High | Open |
| FR-012 | Keep the mutation harness armed | As a maintainer, I want the enforced mutation harness to still re-derive red-first for every subject whose file this mission edits. | High | Open |
| FR-013 | Report what is not fixed | As a maintainer, I want any unresolved item reported with its evidence rather than closed or quietly dropped. | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Repeat-run stability | Each test item 1–11 passes **10 of 10 repeats** under the measurement rig, reported as a per-test count. Item 12 is reported per sub-test. | Reliability | High | Open |
| NFR-002 | Measurement must not retry | Every measurement in this mission runs with **`retries: 0`**. A `flaky` line in a measurement run counts as a **failure**, not a pass. The rig must state the retry setting it ran under. | Reliability | High | Open |
| NFR-003 | Red-first proof per fix | Every rewritten assertion is demonstrated to fail when the behaviour it guards is reintroduced as broken, with the failure output recorded. Proof count must equal rewritten-assertion count. | Reliability | High | Open |
| NFR-004 | No added wall-clock | Total `playwright` job duration stays within 5% of the pre-mission figure of **25.6 min**. Measured from the reported suite time on the mission's final CI run. | Performance | Medium | Open |
| NFR-005 | Assertion strength preserved | For every rewritten assertion, the mission records what it asserted before and after; the after-form must cover at least the before-form. Zero assertions removed. | Maintainability | High | Open |
| NFR-006 | Log completeness | The behaviour-suite job log ends with the reporter's verdict line; size reported before and after. | Observability | Medium | Open |
| NFR-007 | Engine disclosure | Every verification claim names the engine that produced it. Chromium results are never presented as evidence about webkit. | Reliability | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | No suppression | No test in scope may be skipped, `fixme`-ed, quarantined, retry-wrapped, or have its tolerance widened to obtain green. **This includes inheriting `retries: 2` from the CI config in a measurement run.** | Technical | High | Open |
| C-002 | No assertion deletion | No assertion in scope may be removed. Rewrites only. | Technical | High | Open |
| C-003 | No timeout inflation | Flakiness may not be addressed by increasing a wait duration. | Technical | High | Open |
| C-004 | No unproven cause claims | No root cause may be asserted for the lane stop before its error text has been read. | Technical | High | Open |
| C-005 | CI is the authority | Verification of webkit behaviour comes from CI; the workstation cannot launch webkit. | Technical | High | Open |
| C-006 | Train-only merge | The mission PR targets `train/elements-first`. Merging the train into `main` is out of scope and not delegated. | Process | High | Open |
| C-007 | Component changes are findings | Changes to component source (as opposed to test source) are permitted only where a genuine component defect is demonstrated, and must be reported as such. | Technical | High | Open |
| C-008 | Do not disarm the mutation harness | `mutations.json`, `behaviours.json` and `suite-budget.json` govern an enforced gate over the same fixture files this mission edits. Any edit there must keep every subject's red-first derivation working. | Technical | High | Open |
| C-009 | Do not change the ordinary suite | The measurement rig must not alter what the ordinary `playwright` job runs. Gate-wiring parity checks are enforced and will reject ad-hoc step shapes. | Technical | High | Open |
| C-010 | Findings log is shared across lanes | Charter, Findings Log Practice: a lane worktree's `tmp/finding/` **must be symlinked to the repository root's**, never created as an isolated directory. Every reasoning-loop failure, recovery or `spec-kitty` skill error is logged there with what was attempted, the verbatim error, the workaround, a root-cause hypothesis and a proposed remediation. | Process | Medium | Open |
| C-011 | Component changes need a visual diff and maintainer approval | Charter, Review Policy and Quality Gates: a PR touching component files requires a screenshot or visual diff, and **one maintainer approval**. Any C-007 change under `packages/styles/**` therefore cannot self-merge, and the mission must surface it rather than folding it in silently. Note the safety net is engine-mismatched: `visual-regression` runs chromium-only while every test in scope is webkit. | Process | High | Open |
| C-012 | Red-first is the charter's own bar | Charter, Quality Gate (5): every applicable ADR-11 required-behaviour has a test demonstrated to fail before it passes. The mission's red-first requirement is this clause, not an invention of it — prefer the existing harness derivation over a parallel hand-rolled proof. | Technical | High | Open |

### Key Entities

- **Affected test**: a spec file and line, its browser project, its observed state, and the assertion that moved.
- **Measurement rig**: the invocation that produces per-test pass/fail counts over N repeats with retries disabled.
- **Red-first proof**: a recorded demonstration that a rewritten assertion fails when its subject is broken.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All twelve scope items report zero failures and zero flakes across 10 repeats under the rig, with `retries: 0`.
- **SC-002**: Recorded red-first proofs equal rewritten assertions; neither is zero. **WP01's scan reports both counts**; equality is not left to per-WP self-report.
- **SC-003**: Zero assertions deleted, skipped, `fixme`-ed, quarantined or retry-wrapped; zero tolerances widened; zero wait durations increased. **Verified mechanically** by a scan of the mission diff for `test.skip`, `test.fixme`, `.only`, added `retries`, and increased numeric timeout literals — not by self-report alone.
- **SC-004**: The behaviour-suite job log ends with the reporter's verdict line; before/after sizes reported.
- **SC-005**: The final `playwright` job duration is within 5% of 25.6 min.
- **SC-006**: Every scope item is either fixed with a demonstrated cause, or reported unfixed with its evidence. The two counts sum to **thirteen** — the twelve test items **plus the lane-stop/log-truncation item**, which is in scope and must not fall outside the denominator of the one criterion whose job is to stop items being dropped.
- **SC-007**: Zero of the twelve items fail or flake in the mission's final pre-merge CI run on this PR. *(Stated as what the mission controls. The train's `gate` aggregates seven jobs this mission does not own, a train push run only exists after landing, and `promote-develop` additionally requires `vars.PROMOTE_DEVELOP_ENABLED == 'true'` — so a green gate alone would not establish that promotion runs. Whether promotion actually resumes is tracked as post-merge follow-up, not as this mission's success criterion.)*

- **SC-008**: A single mission report enumerates every scope item with its verdict, the engine each claim came from (NFR-007), and the `playwright` duration delta against 25.6 min. FR-013 and NFR-004's after-reading are delivered here.
