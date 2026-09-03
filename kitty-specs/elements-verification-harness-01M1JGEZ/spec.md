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
- There is no test **runner**. There are, however, seven enforced project checks that
  #70 shipped, and an earlier draft of this survey wrongly said Playwright and axe were
  "the only executable checks". That error mattered: five of those seven scan
  `packages/elements/src`, and they are what the fixture in C-006 collides with.

Neither of those can see a broken `setFormValue`, an event that fires twice, a property
assigned before upgrade being dropped, or a renamed shadow part. Those are exactly the
failures ADR-8 moves *into* this package, and #72–#74 begin shipping them.

### The #70 mechanisms this mission must not disturb

Five scanners run over `packages/elements`. A fixture element placed inside that package
trips at least one of them, and the tempting fix in each case is to weaken a guard #70
built to close this programme's defining defect. Verified on this branch:

| Scanner | Glob | What it does to a fixture inside the package |
|---|---|---|
| `scripts/build-elements-css.mjs` | `src/**/sk-*.ts`, filtered `^sk-[a-z0-9-]+\.ts$` | Treats it as a shipped component: requires `packages/styles/src/<name>/sk-<name>.css` to exist and `exit(1)`s when the directory basename ≠ the component name |
| `scripts/check-manifest-content.mjs` | `src/**/*.ts` — **no exclusions** | Every `define('<tag>')` it finds must appear in the committed manifest, or it fails |
| `custom-elements-manifest.config.mjs` | `src/**/*.ts`, excludes `__fixtures__/**` | Keeps a fixture *out* of the manifest — which is exactly what makes the row above fire |
| `scripts/check-no-css-in-source.mjs` | `packages/elements/**/*.{ts,js,mjs}` | Forbids `` css` ``, `unsafeCSS(`, `new CSSStyleSheet(`, bare `.css` imports; and any `.css` file under the package |
| `.storybook/main.ts` | `packages/**/*.stories.@(ts|tsx)` | Any `.stories.ts` under `packages/` becomes a story, entering the axe gate and the visual set |

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
| FR-001 | Vitest is a pinned dev dependency, with a single config defining a **browser** project (Playwright provider) and a **node** project. |
| FR-002 | `npm run test` runs both projects and exits non-zero if either fails. |
| FR-003 | The enforced CI job runs the suite **unconditionally** (`npm run test`), not `nx affected --target=test`. Verified: `nx affected --target=test` prints `No tasks were run` and **exits 0** — a job wired to it is green forever if the target is misnamed, the tag is wrong, or the affected computation misses. A `test` target may exist for local convenience; it is not the gate. |
| FR-004 | The browser lane resolves `@spec-kitty/elements` **from source** via an explicit alias, and the suite passes on a clean checkout with **no `packages/elements/dist` present**. Vite does not read `tsconfig` `paths` by default, and the lint job never builds — this cost #70 two CI failures. |
| FR-015 | `useDefineForClassFields: false` is set in **`tsconfig.base.json`**, not in a lane-local override, and a node-lane test asserts the value the **build** resolves. Measured: esbuild at `target: ES2022` with the flag unset emits native class fields identical to `=true`, SC-010 fails on the first attempt with Lit's class-field-shadowing error — and `packages/elements/project.json`'s bare `esbuild … --bundle` resolves the same `tsconfig.base.json`, so **the shipped artifact carries the hazard too**, dormant only because `SkStub` declares no reactive properties. Fixing it lane-locally would produce a green lane over a broken artifact. |
| FR-005 | The browser lane runs **chromium always, and webkit in CI**. Engine difference is ADR-11's strongest driver. But webkit **cannot launch on the operator's machine** — measured on Fedora 44: `Host system is missing dependencies … libgtk-4-1 libicu74 gstreamer1.0-libav`, and Playwright's webkit build targets Ubuntu. Making webkit unconditional would make `npm run test` — FR-002's headline command — fail on a clean local checkout. So webkit is env-gated and **mandatory when `CI` is set**, with the FR-009 reporter asserting both `browser (chromium)` and `browser (webkit)` executed there. Note the resolved project name carries the instance: `browser (chromium)`, not `browser`. |
| FR-006 | The **fixture element lives outside `packages/elements`**, as its own nx project tagged `scope:fixture`. Every other location trips one of the five scanners above, and the tempting fix in each case is to weaken a #70 guard. |
| FR-007 | The ADR-11 required-behaviours list is executable against that fixture, decomposed to the **fourteen** sub-behaviours in scope. The charter's Testing Standards enumerates fifteen; the fifteenth is generation determinism, deferred to #75 by the section below. A committed `behaviours.json` registry — id, charter clause, SC id, applicability — is the single source the floor, the mutation list and the matrix all read, and tests are keyed by **id**, never by title. |
| FR-008 | `scripts/suite-selftest.mjs` carries a **committed mutation list** — one entry per required behaviour, `{id, file, from, to, expectFailingTest}` — applies each to a copy, runs the scoped test, and asserts it goes RED, plus one unmutated baseline that must be GREEN. This is the structural sibling of `scripts/gate-selftest.mjs` and it is what makes "red-first" re-derived on every run rather than pasted once. |
| FR-009 | A **per-lane, per-behaviour floor**, implemented as a **custom Vitest reporter** — not over `--reporter=json`. Measured: `passWithNoTests` is per-RUN, so an empty lane beside a populated one exits 0 and is not even named; and the JSON reporter carries **no project attribution at all** and reports a lane whose browser failed to launch as `status: "passed"`, `numFailedTests: 0`, `success: true`. A floor built on that JSON would certify absence — the defect class this mission exists to close. The reporter reads `vitest.projects` (declared, including empty ones) against `testModule.project.name` (executed), and additionally gates on `reason !== 'passed'` and `unhandledErrors.length`. |
| FR-010 | The enforced suite contains **zero skipped tests**. A not-applicable behaviour is an explicit cell in the FR-012 matrix, never a skip. An author-written reason string is a self-service exemption — the same shape as the marker-anywhere bypass #106 had to close in `check-no-css-in-source.mjs`. |
| FR-011 | **`retry`** is 0 for every project. The Vitest 4 key is `retry`, not `retries` — `retries` is silently ignored, so a config written that way sets nothing and a test asserting it reads `undefined`. And since `retry` defaults to 0, asserting the raw config object is near-vacuous: assert the **resolved** per-project value via `createVitest('test', {config}).projects[].config.retry`. `playwright.config.ts` sets 2 in CI; inheriting that by analogy would absorb the flake ADR-11 says must be diagnosed. |
| FR-012 | The conformance matrix emits a **committed machine-readable artifact** with a per-cell enum `{pass, fail, reserved, not-applicable, untested}`, plus guards that (a) refuse an all-reserved or all-not-applicable matrix, (b) assert `cells == surfaces × behaviours` so a dropped row is not silence, and (c) assert the reserved set equals a committed expected set. |
| FR-013 | The CI time budget is **asserted, not recorded**: the test job measures its own duration and fails above a committed ceiling; the ceiling file records `{budget, measured, run URL, sha}`. This is `measure-elements-sizes.mjs --check`'s pattern — as a ceiling, since wall-clock is noisy — and that script's own docstring names *this* mission as the beneficiary of not putting baselines in prose. |
| FR-014 | New CI jobs are added to `gate`'s **`if:` condition**, not merely to `needs:` and its echo lines. A job present in `needs` but absent from the condition satisfies "added to the required list" and gates nothing. |

### Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-001 | The suite's CI wall-clock time is measured, and the measurement is the input to FR-013's ceiling rather than a sentence. |
| NFR-002 | **NEGATIVE INVARIANT.** Every gate this mission adds is demonstrated failing before it is claimed to pass, and the demonstration is a **committed, CI-executed artifact that re-derives the red on every run**. A transcript, a commit message, or a checked-in log file does not satisfy this. |
| NFR-003 | No second browser **stack**. The lane uses Playwright browsers, installed in its own job as every other browser job here does — there is no cross-job browser cache in this workflow, so "already installed" was false and is withdrawn. |
| NFR-004 | The a11y, visual-regression and Playwright jobs keep their current wiring and their current results. Falsified by: their job-level `conclusion` and their reported counts (76 stories, 27 tests, 3 baselines) before and after. |

### Constraints

| ID | Constraint |
|---|---|
| C-001 | **The runner is decided.** ADR-11 selects Vitest browser mode on the Playwright provider. `@web/test-runner` is the recorded fallback only if browser mode proves unstable **in CI**, and that is an operator call. |
| C-002 | No coverage threshold. The bar is the required-behaviours list. |
| C-003 | Explicitly not wanted: "it renders" assertions, shadow-DOM snapshots, tests of Lit's reactivity, assertions on internal class names. |
| C-004 | Per-component tests beyond the fixture and `sk-stub` are out of scope. Wrapper generation is #75's. The visual baseline set is #69's. |
| C-005 | **Charter venue is an open operator question — see below.** The claim that charter changes go "through `charter interview → generate → sync`, never by hand (CLAUDE.md §7)" is inherited from ADR-11 and **does not check out**: CLAUDE.md §7 is *"Don't break the demo pages."* This mission does not act on that citation. |
| C-006 | `sk-stub` owns no behaviour — no `ElementInternals`, no `dispatchEvent`, no `part=`, no `static formAssociated`. Verified. The fixture is therefore new, and FR-006 places it. |
| C-007 | The generic `::part()` check reads the **manifest**, per ADR-11 item 6, so #72–#74 inherit it. The fixture is deliberately outside the manifest, so it cannot serve that check — hence FR-007 splits item 6 into a manifest-driven presence check (honestly vacuous today over zero declared parts, with an anti-vacuity guard that fires once #72 lands) plus the fixture's own rename regression. |

### Key Entities

- **Fixture element** — exists solely to exercise the required behaviours. Its own nx
  project outside `packages/elements`; not published, not in the manifest, not a story.
- **Conformance matrix** — behaviours × surfaces, executable, emitting FR-012's artifact.
- **Browser lane / node lane** — the two Vitest projects.
- **`scripts/suite-selftest.mjs`** — the mutation harness that makes red-first re-derivable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

Every criterion below names the mutation that must turn it red. A criterion whose red
cannot be produced on demand is not a criterion.

| ID | Criterion | Red-first mutation |
|---|---|---|
| SC-001 | `npm run test` runs both lanes, and each reports ≥1 executed test | break one lane's `include` glob |
| SC-002 | A native form submit produces the expected `FormData` entry | remove `setFormValue` |
| SC-003 | `setValidity` blocks submission and the message reaches the a11y tree | drop the message argument |
| SC-004 | Form reset restores the initial value | remove the `formResetCallback` |
| SC-005 | A disabled control is excluded from submission | remove the disabled guard |
| SC-006 | The documented event fires **exactly once**, asserted with `toHaveBeenCalledTimes(1)` | dispatch twice |
| SC-007 | The event's `detail` shape matches its documentation | change a field name |
| SC-008 | `composed` and `bubbles` are as documented | flip `composed` |
| SC-009 | `preventDefault()` demonstrably prevents, where cancelable | drop `cancelable` |
| SC-010 | A property assigned **before** the definition loads is applied on upgrade | remove the upgrade handling |
| SC-011 | Slotted content reaches the intended slot, **and fallback appears when empty** | rename the slot |
| SC-012 | Escape acts, focus returns to the invoker, `aria-expanded` tracks real state | remove the Escape handler |
| SC-013 | Every manifest-declared `::part()` is present and targetable, with the expected list **derived from `custom-elements.json`**, not hardcoded | rename the internal element carrying the part |
| SC-014 | `shadowRoot.adoptedStyleSheets[0]` **is** `Ctor.styles[0]` — object identity — and the shadow root contains zero `<style>` elements | hand-author the sheet in TypeScript |
| SC-015 | A different-constructor re-`define` warns, leaves the **original** constructor registered, and a same-constructor re-`define` is silent | replace `define` with an empty function — which must fail |
| SC-016 | `scripts/suite-selftest.mjs` runs in CI: every committed mutation produces its named failing test, and the unmutated baseline is green | delete a mutation entry — the count assertion fails |
| SC-017 | An emptied **lane**, and an uncovered required-behaviour id, each fail | empty one lane's globs |
| SC-018 | The enforced suite reports zero skipped tests | add one `it.skip` |
| SC-019 | The matrix artifact carries the full cell enum; an all-reserved matrix, a wrong cell count, and an unexpected reserved set each fail | mark every cell reserved |
| SC-020 | The suite exceeding its committed ceiling fails CI | set the ceiling to 1s |
| SC-021 | A failing test turns the **`gate`** job red, not merely the test job | add a failing test and read `gate` |
| SC-022 | The suite passes on a clean checkout with no `packages/elements/dist` | delete `dist` and run |

## Out of scope

- Wrapper generation and generator selection (#75, SP-6).
- Per-component tests for components that do not exist yet (#72–#74, #77–#79).
- The visual baseline set (#69).
- Amending the charter (C-005 — see the operator questions).
- `scripts/build-elements-css.mjs --check` reporting green over zero components. Verified,
  filed as #110; it is the sixth instance of this programme's defect class and the second
  inside a guard written to prevent it. Out of this mission's subject.
- `security:lockfile-check` — a working script wired into no workflow. Observed, recorded.

## Generation determinism — subject named

FR-007's item 9 is the one ADR-11 phrases against an artifact that does not exist: it says
"regenerating **wrappers** from an unchanged manifest is a no-op", and the wrapper
generator is deferred to #75 by ADR-11 itself and by C-004 here.

The regenerable artifacts that *do* exist are `custom-elements.json` (`cem analyze`) and
the `.css.js`/`.css.d.ts` modules — and **both already have enforced drift checks** in
`lint-code`. So a node-lane test that shells out to them would deliver a green criterion
and zero new coverage.

**Decision: item 9 is deferred to #75**, where the generator exists and the criterion has
a subject. It is not restated as a success criterion here, and this paragraph exists so a
work package is not written against a phantom.

## Operator questions

Two, both raised by the post-spec squad and both verified before being escalated. Neither
blocks the runner, the suite, or the gate wiring; I will proceed with those.

### 1. Where does a charter amendment happen — and is the charter self-contradictory?

ADR-11 says charter changes go "through `spec-kitty charter interview → generate → sync`,
never by hand (CLAUDE.md §7)". Verified, and **the citation is wrong**: CLAUDE.md §7 is
*"Don't break the demo pages."* My first draft of this spec repeated that citation without
checking it, which is the fabricated-citation class this programme has hit before.

What the tree actually shows:

- `charter.md`'s own **Amendment Process** reads *"Charter and governance amendments via
  PR with rationale comment; no special approval beyond the standard review policy."*
- **O5 itself was a hand edit.** `901244f` touches `.kittify/charter/charter.md` and two
  docs. No yaml, no interview.
- `.kittify/charter/charter.yaml` **has never heard of Vitest** — `grep -ci vitest` is 0 —
  and still reads `governance.testing = {min_coverage: 0, tdd_required: false,
  framework: '', type_checking: ''}`. `charter context --action plan` returns *"No
  activated directive set configured"* and *"Template set not selected in charter"*.

So the machine-readable charter contradicts the prose charter, and #71 depends on O5
precisely because *"a hard CI gate must not contradict the charter"*. **Question:** which
is authoritative, and should `charter sync` be run before this gate lands? Until answered,
FR-013's ceiling is recorded in ADR-11's Consequences, which already says *"a new budget
has to be set rather than assumed"* — the natural home, and one this mission may edit.

### 2. Should this be two missions?

The planning lens argues one seam, cleanly: **M5a** (runner, behaviour suite, red-first
harness, gate wiring, budget) is what #71's Intent and Exit criteria describe, and #72–#74
are blocked on it. **M5b** (the conformance matrix across surfaces) has its only consumer
in #75, two missions out, and carries the entire Svelte toolchain addition.

The Svelte cost is real and was unpriced. `fixtures/vite-consumer/` is plain Vite +
vanilla JS — Svelte appears nowhere in this repo outside ADR prose. FR-012's matrix
therefore requires `svelte` and `@sveltejs/vite-plugin-svelte` as new dependencies (each a
supply-chain review), a new nx project, and a CI build step — landing in the same PR as
the repository's first test runner.

**I am not splitting the mission on my own authority**, because scope is set by the issue.
I have instead made FR-012 a P2 work package explicitly permitted to be dropped without
failing the mission, and named the dependencies so they get reviewed rather than arriving
as an implementation detail. **Question:** split, or keep as one with FR-012 droppable?

### Provenance note

The conformance matrix is attributed to ADR-11 by #71 and by
`docs/architecture/elements-first-programme.md:193`. **ADR-11 contains no conformance
matrix and does not mention Svelte.** The four surfaces trace to ADR-8 Confirmation #1.
The attribution is inherited, not invented here, and is recorded so it stops propagating.
