# Mission Specification: WebKit Timing De-flake

**Mission Branch**: `mission/webkit-deflake`
**Created**: 2026-09-18
**Status**: Draft
**Input**: Tracking issue 453 — "the webkit lane asserts on elapsed time rather than observable state", adopting issues 340 and 238.

## Problem

The `[webkit]` lane is intermittently red across this repository. One CI run of a tokens-only font
change reported `2 failed, 6 flaky, 2770 passed` — **all eight `[webkit]`**, across six specs, four
of which that change does not touch. The closest run on the untouched train reported
`2777 passed, 0 failed, 1 flaky`, and that single flaky test was also `[webkit]`, in one of the same
specs. The fragility pre-exists any one branch.

The recurring shape is that a test waits for a **duration** and then asserts on whatever the runner
happened to render by then. A capture taken after `waitForTimeout(400)` measures a different thing on
a fast runner and a slow one, so the assertion's meaning depends on machine load. Every affected test
is asserting something real; the defect is in *when* it looks, not in *what* it claims.

One adopted item is different in kind and is kept separate throughout: the behaviour suite's webkit
lane stops mid-queue with **zero test failures**, and its cause is unreadable because the job log
truncates before the error text.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The indeterminate progress assertions sample a chosen animation phase (Priority: P1)

A maintainer reads `sk-progress.spec.ts` and can tell exactly which point of the sweep animation each
capture is taken at. The four tests that compare two captures no longer depend on how fast the runner
was; they select their phases explicitly and would fail on any machine if, and only if, the component
misbehaved.

**Why this priority**: These four carry both hard failures in the observed run, so they are what
turns the aggregate gate red today. They also share one root cause and one fix, making this the
largest reduction in flakiness per unit of change. Critically, the two failing assertions were
written to close two specific defects — an indeterminate fill that could render indistinguishable
from Complete under forced colors — so they protect real behaviour and must survive the fix intact.

**Independent Test**: Run `sk-progress.spec.ts` under webkit repeatedly; all four tests pass every
run. Then reintroduce the defect each one guards and watch that same test fail.

**Acceptance Scenarios**:

1. **Given** the indeterminate fixture with its sweep animation, **When** a test captures "two distinct points in the animation cycle", **Then** those two points are explicitly selected phases, not two wall-clock reads separated by a timeout.
2. **Given** a runner under heavy load, **When** the four tests run, **Then** they produce the same verdicts they produce on an idle runner.
3. **Given** the fix is in place, **When** the indeterminate fill is altered to render full-width under forced colors, **Then** the forced-colors test fails.
4. **Given** the fix is in place, **When** `prefers-reduced-motion` handling is removed so the animation keeps running, **Then** the reduced-motion test fails.
5. **Given** the fix is in place, **When** the sweep animation is removed entirely, **Then** the "animation actually runs" test fails.

---

### User Story 2 - Keyboard and focus assertions wait on the effect they claim (Priority: P2)

Two tests press a key and then assert a consequence. They wait for the consequence itself — a
navigation, a scroll position, a focus change — rather than asserting after an interval and hoping
the handler has run.

**Why this priority**: The action-row case is already diagnosed and reproduced on two independent
trees including the untouched train, with a stated direction. It lands in unrelated missions' output,
where the first hypothesis is always "my diff broke it", so it costs other people time repeatedly.
The workflow-board case has the same press-then-assert shape.

**Independent Test**: Repeat-run each affected spec under a single worker; the sub-tests pass every
run rather than a varying subset.

**Acceptance Scenarios**:

1. **Given** an Enter-key activation whose effect is a location change, **When** the test asserts, **Then** it has awaited the location change (or the event the handler fires), not a fixed delay.
2. **Given** a scroller that must keep focus across arrow-key scrolling, **When** the test asserts scroll position and focus, **Then** it awaits the scroll settling rather than sampling immediately after the key press.
3. **Given** either fix, **When** the handler it depends on is removed, **Then** the test fails rather than timing out silently or passing.

---

### User Story 3 - The shell-layout assertions state what they actually depend on (Priority: P3)

The composed-shell tests either hold steady across runs, or their premise is corrected. One asserts
**exact** pixel column geometry; if that measurement is sensitive to body-font metrics, that is a
finding about the assertion, not a flake to be smoothed over.

**Why this priority**: These two are flaky in the observed run and a third test in the same file was
the single flaky test on the untouched train, so this spec is the repository's most persistent webkit
offender. It is ranked below the first two because no diagnosis exists yet and the work is
investigation before it is repair.

**Independent Test**: Determine experimentally whether the geometry assertion's result moves with the
body font; repeat-run both tests and report the rate.

**Acceptance Scenarios**:

1. **Given** the exact-column-geometry assertion, **When** the body font is varied, **Then** the mission reports whether the measured columns move, with the measurements shown.
2. **Given** a demonstrated cause, **When** the fix lands, **Then** the test passes repeatedly and still fails if the column contract is broken.
3. **Given** no cause can be demonstrated, **Then** the mission reports the evidence and does not alter the assertion.

---

### User Story 4 - The cross-story comparison compares two settled states (Priority: P4)

The legend-cue test loads two separate stories and compares a visual cue between them. Both states
are fully settled before either is measured.

**Why this priority**: A single flaky test with no evidence of wider impact, and the least
consequential of the set. Included because it shares the "measure before settled" shape.

**Independent Test**: Repeat-run the spec; the comparison holds every run.

**Acceptance Scenarios**:

1. **Given** two stories loaded in sequence, **When** their cues are compared, **Then** each has been awaited to a settled state before being read.
2. **Given** the fix, **When** the required and ordinary legends are made identical, **Then** the test fails.

---

### User Story 5 - The webkit lane's failure becomes readable (Priority: P5)

When the behaviour suite's webkit lane stops mid-queue, a maintainer can read the error that caused
it. Today the job log truncates mid-line before the unhandled-errors section, so the one piece of
information that would name the cause is exactly what is lost.

**Why this priority**: Ranked last deliberately. This is an **observability** deliverable, not a
fix: the lane-stop's root cause is unknown and cannot be diagnosed until its error text is readable.
The volume driver is already identified — a set of warn-and-degrade tests emit four `console.warn`
lines per key, replayed under both engines. Reducing that replay is achievable and verifiable; fixing
the stop itself may not be possible from the test layer at all.

**Independent Test**: Compare the job log's size before and after; confirm the unhandled-errors
section and the reporter's verdict line are both present in a captured log.

**Acceptance Scenarios**:

1. **Given** a behaviour-suite run, **When** its job log is fetched, **Then** the log terminates with the reporter's verdict rather than truncating mid-line.
2. **Given** the warn volume is reduced, **When** the warn-and-degrade tests run, **Then** they still assert the degradation behaviour they asserted before.
3. **Given** a future lane stop, **When** its log is read, **Then** the error text is present.

### Edge Cases

- **A fix that cannot fail.** Every rewritten assertion must be shown to still fail when its subject breaks. An assertion that passes because it no longer measures anything is a worse outcome than the flake.
- **A fix that passes by waiting longer.** Raising a timeout converts a fast failure into a slow one and leaves the dependence on machine speed intact. Not an acceptable remedy.
- **A flake that is a real race.** "It fails on the train too" establishes that it is not this branch's fault; it does not establish that the product is correct. Where a test's intermittent failure reflects genuine non-determinism in the component, that is a component finding and must be reported as one.
- **A single green run.** One pass does not clear an intermittent failure. The reproduction methodology from the adopted action-row issue applies: repeated runs, and where feasible on more than one tree.
- **WebKit cannot be launched on the development workstation.** Every affected test is webkit-only, and the repository records that its webkit build does not launch here. Verification therefore depends on CI, and any claim of local reproduction must state which engine actually ran.
- **A phase-pinning API that changes what is under test.** Pausing or seeking an animation must not itself alter the rendering being asserted; if it does, the test measures the harness rather than the component.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Pin the sampled animation phase | As a maintainer, I want the progress tests to capture explicitly chosen animation phases so that their verdicts do not depend on runner speed. | High | Open |
| FR-002 | Preserve the forced-colors distinction | As a maintainer, I want the forced-colors assertion to still prove the indeterminate fill is distinguishable from both Complete and Zero so that the defect it closed cannot return. | High | Open |
| FR-003 | Preserve the reduced-motion assertion | As a maintainer, I want the reduced-motion test to still prove the animation stops and the frozen frame is neither Complete nor Zero. | High | Open |
| FR-004 | Await navigation effects | As a maintainer, I want key-activation tests to await their observable effect so that they do not race the handler. | High | Open |
| FR-005 | Await scroll and focus settling | As a maintainer, I want the scroller test to await scroll settling while asserting focus is retained. | Medium | Open |
| FR-006 | Establish the geometry assertion's premise | As a maintainer, I want to know whether the exact-column assertion depends on body-font metrics so that its intermittency is explained rather than suppressed. | Medium | Open |
| FR-007 | Settle both states before cross-story comparison | As a maintainer, I want the legend-cue comparison to read two settled states. | Low | Open |
| FR-008 | Bring the behaviour-suite log under the cap | As a maintainer, I want the job log to contain the unhandled-errors section and the reporter verdict so that a lane stop can be diagnosed at all. | Medium | Open |
| FR-009 | Preserve warn-and-degrade coverage | As a maintainer, I want the degradation tests to assert the same behaviour after their output volume is reduced. | High | Open |
| FR-010 | Report what is not fixed | As a maintainer, I want any unresolved item reported with its evidence rather than closed or quietly dropped. | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Repeat-run stability | Each test addressed under User Stories 1, 2 and 4 passes in **10 consecutive webkit runs** of its spec, reported as a count, not as a narrative. | Reliability | High | Open |
| NFR-002 | Red-first proof per fix | Every rewritten assertion is demonstrated to fail when the behaviour it guards is reintroduced as broken, with the failure output recorded. Count of proofs must equal count of rewritten assertions. | Reliability | High | Open |
| NFR-003 | No added wall-clock | The mission does not increase total `playwright` job duration by more than 5% against the pre-mission run, measured from the reported suite time. | Performance | Medium | Open |
| NFR-004 | Assertion strength preserved | For every rewritten assertion, the mission records what it asserted before and after; the after-form must cover at least the before-form. Zero assertions removed. | Maintainability | High | Open |
| NFR-005 | Log completeness | The behaviour-suite job log ends with the reporter's verdict line, and its size is reported before and after. | Observability | Medium | Open |
| NFR-006 | Engine disclosure | Every verification claim names the engine that produced it. Claims from chromium are not presented as evidence about webkit. | Reliability | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | No suppression | No test in scope may be skipped, `fixme`-ed, quarantined, retry-wrapped, or have its tolerance widened to obtain green. | Technical | High | Open |
| C-002 | No assertion deletion | No assertion listed in the tracking issue may be removed. Rewrites only. | Technical | High | Open |
| C-003 | No timeout inflation | Flakiness may not be addressed by increasing a wait duration. | Technical | High | Open |
| C-004 | No unproven cause claims | No root cause may be asserted for the lane-stop item before its error text has been read. | Technical | High | Open |
| C-005 | CI is the authority | Verification of webkit behaviour comes from CI, because the workstation cannot launch webkit. | Technical | High | Open |
| C-006 | Train-only merge | The mission PR targets `train/elements-first`. Merging the train into `main` is not in scope and is not delegated. | Process | High | Open |
| C-007 | Component changes are findings | Changes to component source (as opposed to test source) are permitted only where a genuine component defect is demonstrated, and must be reported as such rather than made silently to turn a test green. | Technical | High | Open |

### Key Entities

- **Affected test**: a named spec file and line, its browser project, its observed state (failed or flaky), and the assertion that moved.
- **Phase-pinning mechanism**: the means by which an animation is brought to a known, chosen point before capture.
- **Red-first proof**: a recorded demonstration that a rewritten assertion fails when its subject is broken.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The eight tests named in the tracking issue report zero failures and zero flakes across 10 consecutive webkit runs of their specs.
- **SC-002**: The number of recorded red-first proofs equals the number of rewritten assertions; neither is zero.
- **SC-003**: Zero assertions are deleted, skipped, `fixme`-ed, quarantined or retry-wrapped; zero tolerances widened; zero wait durations increased. Verified by reading the diff, and reported as explicit counts.
- **SC-004**: The behaviour-suite job log ends with the reporter's verdict line; before and after log sizes are reported.
- **SC-005**: The `playwright` job's reported duration is within 5% of the pre-mission run's.
- **SC-006**: Every item in scope is either fixed with a demonstrated cause, or reported unfixed with its evidence. No item is silently dropped, and the two counts sum to the scope.
