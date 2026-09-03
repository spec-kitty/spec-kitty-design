# Mission Specification: Elements Verification Harness

**Mission Branch**: `mission/elements-verification-harness`
**Created**: 2026-09-03
**Status**: Draft
**Input**: Issue #71 (M5, epic #66) · ADR-11 · charter amendment O5 (`901244f`)

## Why this mission exists

Epic #66 moves markup, behaviour, events, focus management and form participation out of
per-framework packages and into `@spec-kitty/elements`. **The repository can verify none
of it**, verified on this branch at `b99c293`:

- No `vitest`, `jest`, `karma`, `@web/test-runner` or `@testing-library/*` in
  `devDependencies`. No `test` target in any `project.json`. No `npm run test`.
- The only executable checks are Playwright (visual baselines, cross-browser smoke,
  the #70 distribution specs) and the axe gate.

Neither of those can see a broken `setFormValue`, an event that fires twice, a property
assigned before upgrade being dropped, or a renamed shadow part. Those are exactly the
failures ADR-8 moves *into* this package, and #72–#74 begin shipping them.

**The premise this mission does NOT inherit.** ADR-11 and #71 both describe eight
orphaned `*.spec.ts` files under `packages/angular/` to be "removed rather than ported".
`packages/angular` no longer exists — #102 deleted it. There is nothing to remove, and
no test to port. Recorded so a reader does not go looking.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A behaviour that silently breaks now fails CI (Priority: P1)

An element owns behaviour a screenshot cannot see. Someone breaks it — `setFormValue`
stops being called, an event fires twice, a `::part()` is renamed during a refactor. CI
goes red and names the behaviour.

**Why this priority**: This is the mission. Every other story is scaffolding for it, and
#72–#74 cannot be reviewed without it.

**Independent Test**: Break `setFormValue` in a fixture element and mis-fire an event;
both must fail before either is made to pass. ADR-11 Confirmation #1 requires precisely
this, red-first, "demonstrated, not asserted".

**Acceptance Scenarios**:

1. **Given** a fixture element that participates in a form, **When** its `setFormValue`
   call is removed, **Then** the suite fails naming the missing `FormData` entry — and
   passes once restored.
2. **Given** a fixture element that dispatches a documented event, **When** it is made
   to dispatch twice, **Then** the suite fails on the call count.
3. **Given** an element whose manifest declares a `::part()`, **When** the internal
   element carrying that part is renamed, **Then** the suite fails — this is the
   regression nothing else in the pipeline detects.

---

### User Story 2 - The runner covers both lanes from one config (Priority: P1)

`npm run test` runs element behaviour in a real browser engine and build-tooling tests in
Node, from a single configuration.

**Why this priority**: ADR-11 Confirmation #4 states it as a confirmation. It is also the
deciding factor recorded for choosing Vitest over `@web/test-runner`: WTR cannot test the
manifest analyzer or the generator, so choosing it means two runners regardless.

**Independent Test**: `npm run test` exits non-zero if either lane fails, and its output
names both.

**Acceptance Scenarios**:

1. **Given** a clean checkout, **When** `npm run test` runs, **Then** both a browser
   project and a node project execute and are distinguishable in the output.
2. **Given** a failing node-lane test, **When** `npm run test` runs, **Then** it exits
   non-zero even though the browser lane passed.

---

### User Story 3 - The suite is a merge gate, not an advisory job (Priority: P1)

The suite runs on train PRs and `gate` fails when it fails.

**Why this priority**: A test suite that runs but does not gate is the certifying-absence
shape this programme keeps finding. #70 shipped three variants of it and a fourth
(FR-012's `test.skip()`) was found in the same PR.

**Independent Test**: A deliberately failing test makes the `gate` job red, not merely
the test job.

**Acceptance Scenarios**:

1. **Given** a failing test in either lane, **When** CI runs on a PR into the train,
   **Then** the `gate` job reports failure and names the test job.
2. **Given** a PR touching only `packages/elements/**`, **When** CI runs, **Then** the
   test job runs rather than being skipped and recorded as acceptable.

---

### User Story 4 - A framework target can be judged against a fixed matrix (Priority: P2)

The ADR-11 conformance matrix exists as executable fixtures, so #75's generated React
wrapper — and any future target — is judged against the same list as the element itself.

**Why this priority**: `research/001` §163 asks for a schema for a valid framework
target. Without the matrix, "passes the conformance matrix unmodified" is unfalsifiable
when #75 needs it.

**Independent Test**: The matrix runs against `sk-stub` today and reports per-behaviour
results; adding a target adds a column, not a new test list.

**Acceptance Scenarios**:

1. **Given** the matrix, **When** it runs against the bundler-free page and the Storybook
   surface, **Then** each applicable required behaviour reports pass or fail per surface.
2. **Given** a target that is not yet implemented, **When** the matrix runs, **Then** that
   column is explicitly *reserved*, not silently absent — an unimplemented target must not
   read as a passing one.

---

### Edge Cases

- **The suite passes because it ran nothing.** An empty or mis-globbed test set must fail,
  not report green. This programme has shipped that shape five times.
- **A test is skipped rather than failed.** `test.skip()` in an enforced job is
  indistinguishable from a pass in the summary line; FR-012 hid behind one for months.
- **Browser mode is unstable in CI.** ADR-11 names `@web/test-runner` as the recorded
  fallback and states the behaviours list ports unchanged. A flake must be diagnosed, not
  absorbed by a retry count.
- **The fixture element becomes a second implementation.** Fixtures that drift from
  `sk-stub`'s real shape test something that does not ship.
- **A required behaviour has no applicable component yet.** `sk-stub` has no form
  association and no events. The matrix must distinguish *not applicable* from *untested*.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Requirement |
|---|---|
| FR-001 | Vitest is a dev dependency, pinned, with a single config defining a **browser** project (Playwright provider) and a **node** project. |
| FR-002 | `npm run test` runs both projects and exits non-zero if either fails. |
| FR-003 | A `test` target exists for the projects that own tests, so `nx affected --target=test` reaches them. |
| FR-004 | The ADR-11 required-behaviours list is expressed as executable tests against a fixture element that exercises **form association, events, upgrade order, slots, focus/keyboard, `::part()`, style adoption and the registry guard**. |
| FR-005 | The node lane tests generation determinism: regenerating from an unchanged manifest is a no-op, and drift fails. |
| FR-006 | The conformance matrix runs the applicable behaviours against each declared surface: bundler-free page, Storybook, and a Svelte app; the React column is **reserved** and reports as such until #75. |
| FR-007 | The suite refuses to report green over an empty test set. |
| FR-008 | A skipped test in the enforced suite fails CI unless the skip is explicitly declared as *not applicable* with a reason. |
| FR-009 | New CI jobs are added to `ci-quality.yml`'s `gate` required list, so a test failure blocks merge. |
| FR-010 | A CI time budget for the suite is recorded, with the measured figure it is derived from. |

### Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-001 | The suite's wall-clock time in CI is measured and recorded. The charter's three-minute figure covers the Storybook build only and does not extend to a test suite. |
| NFR-002 | **NEGATIVE INVARIANT.** Every gate this mission adds is demonstrated failing before it is claimed to pass, and the demonstration is committed, not narrated. |
| NFR-003 | The browser lane uses the Playwright browsers already installed by CI. A second browser stack is a regression against ADR-11's stated driver. |
| NFR-004 | Existing gate runtimes are not regressed: the a11y, visual and Playwright jobs keep their current wiring and their current results. |

### Constraints

| ID | Constraint |
|---|---|
| C-001 | **The runner is decided.** ADR-11 selects Vitest browser mode on the Playwright provider. Do not re-evaluate; `@web/test-runner` is the recorded fallback only if browser mode proves unstable **in CI**, and that is an operator call. |
| C-002 | No coverage threshold, then or now. The bar is the required-behaviours list. |
| C-003 | Explicitly not wanted: "it renders" assertions, shadow-DOM snapshots, tests of Lit's reactivity, assertions on internal class names. |
| C-004 | Per-component tests beyond `sk-stub` and one placeholder are out of scope. Wrapper generation is #75's. The visual baseline set is #69's. |
| C-005 | Charter changes go through `charter interview → generate → sync`, never by hand (CLAUDE.md §7). If FR-010's budget belongs in the charter, that is an operator action, not this mission's edit. |
| C-006 | `sk-stub` owns no behaviour — no form association, no events, no parts. The fixture element that exercises the list is therefore **new**, and must be recognisable as a test fixture rather than shipped as a component. |

### Key Entities

- **Fixture element** — a custom element existing solely to exercise the required
  behaviours. Not published, not in the catalogue, not a Storybook story.
- **Conformance matrix** — the required behaviours × surfaces grid, executable, with
  reserved columns for targets that do not exist yet.
- **Browser lane / node lane** — the two Vitest projects.

## Success Criteria *(mandatory)*

### Measurable Outcomes

| ID | Criterion |
|---|---|
| SC-001 | `npm run test` runs both lanes and fails if either does. |
| SC-002 | A removed `setFormValue` fails the suite; restored, it passes. Committed evidence. |
| SC-003 | An event made to fire twice fails the suite on the call count. Committed evidence. |
| SC-004 | A renamed internal element breaks a declared `::part()` and the suite catches it. |
| SC-005 | A property assigned **before** the definition loads is applied on upgrade, and removing the upgrade handling fails the test. |
| SC-006 | The element adopts a constructed sheet and injects zero `<style>` elements — asserted in the browser lane, complementing #70's assertion against the built artifacts. |
| SC-007 | A second `define` of the same tag warns and no-ops rather than throwing. |
| SC-008 | Regenerating from an unchanged manifest is a no-op; drift fails. |
| SC-009 | An emptied test set fails rather than reporting green. |
| SC-010 | A failing test turns the `gate` job red, demonstrated. |
| SC-011 | The conformance matrix reports per surface, and a reserved column cannot read as a pass. |
| SC-012 | The suite's CI wall-clock time is recorded with the run it was measured from. |

## Out of scope

- Wrapper generation and generator selection (#75, SP-6).
- Per-component tests for components that do not exist yet (#72–#74, #77–#79).
- The visual baseline set (#69).
- Amending the charter's Performance Benchmarks (C-005 — operator action).
- Fixing `security:lockfile-check`, which is a working script wired into **no** workflow.
  Observed while surveying; out of this mission's subject and recorded for the operator.

## Open question for the operator

**FR-010 / C-005 — where does the CI time budget live?** The exit criteria require it to
be written down. The charter's Performance Benchmarks say *"Storybook CI build time under
3 minutes"* and contemplate no test suite. Amending the charter is an operator action via
the interview flow. The alternatives are recording the budget in ADR-11, or in
`docs/architecture/`. I will measure first and bring the number with a recommendation
rather than choosing the venue.
