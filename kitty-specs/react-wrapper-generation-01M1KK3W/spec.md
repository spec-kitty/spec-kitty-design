# Mission Specification: React Wrapper Generation

**Mission:** `react-wrapper-generation-01M1KK3W` · **Issue:** #75 · part of epic #66
**Branch:** `mission/react-wrapper-generation` off `train/elements-first`
**Squad tier:** B — post-tasks, pre-merge · 3 lenses
**Governing decisions:** ADR-11 (verification stack and wrapper generation), ADR-8 confirmation #2

## Why this mission exists, and what it is NOT

ADR-8's confirmation criterion #2 is a framework wrapper generated from the manifest with no hand
edits. React leads because it has the one identified consumer waiting: the Team Kitty SaaS design
surface, 22 hand-written `.tsx` components rendered only in that repo's Storybook.

**It is ergonomics, not interop, and the issue says so.** React 19 scores **16/16** on Custom
Elements Everywhere for both basic and advanced interop — properties, attributes and
`onFooEvent` listeners all work natively, exactly as in Angular. A wrapper buys JSX-level
TypeScript types, typed refs and SSR attribute handling. Real value; much smaller than
"unblocks a consumer", and this spec is sized to that.

> **"No package needed — the manifest sufficed" is a legitimate outcome and must be allowed to
> be the finding.** The issue states this explicitly. It is carried into SC-305 as a real branch
> rather than a formality: if the generated wrapper adds nothing a consumer cannot get from
> `custom-elements.json` plus React 19's native support, that is the answer and the mission
> records it instead of shipping a package to have shipped one.

## SETTLED — not re-litigated

- **Generator: `@wc-toolkit/react-wrappers`** (1.2.7 — confirmed live on the registry at claim
  time). Maintained successor to `custom-element-react-wrappers`; same maintainer, moved from
  `break-stuff/cem-tools` to `wc-toolkit/react-wrappers`.
- **`@lit/react` is not a generator.** ADR-11 records the correction: it is a runtime
  `createComponent()` helper called once per component by hand and cannot satisfy the drift
  criterion on its own. A generator may *emit* calls to it; that is a different thing.
- **Angular is deferred** to #79. The full catalogue and publishing are out of scope.

## What the manifest actually contains today — measured, not assumed

The generator's only input is `packages/elements/custom-elements.json`. Its current state,
read at claim time:

| element | public members | of which inherited | events | parts | slots | attributes |
|---|---:|---:|---:|---:|---:|---:|
| `sk-stub` | 0 | 0 | 0 | 0 | 0 | 0 |
| `sk-card` | 2 | 0 | 0 | 1 | **0** | 2 |
| `sk-nav-pill` | 5 | 0 | 1 | 3 | 1 | 2 |
| `sk-form-input` | 19 | **15** | 0 | 5 | 0 | 10 |
| `sk-form-textarea` | 19 | **15** | 0 | 5 | 0 | 10 |

Three facts in that table decide the mission's shape:

1. **`sk-card` renders a `<slot>` and declares none.** `grep -c '<slot' sk-card.ts` → 1;
   `grep -c '@slot'` → 0. So the manifest reports zero slots.

   **Corrected after measurement.** This paragraph previously claimed a generator "would give
   `<SkCard>` no children". A lens injected `slots: [{name: "", …}]` into the manifest and
   regenerated: the only diff is six lines of class-level JSDoc. `children` arrives from
   `Pick<React.AllHTMLAttributes<HTMLElement>, "children" | …>`, and `SkNavPill` — which *does*
   declare `@slot` — carries the identical `Pick<>`. **Zero type consequence.** The cost is
   documentation only, and FR-007 is worth doing on that basis alone. Left visible rather than
   overwritten: the mission's opening premise about its own input was wrong, and the manifest
   still had to be measured rather than read.
2. **15 of the form elements' 18 public members are inherited** from `FormControlBase`. The
   analyzer *does* record `privacy: protected` and `inheritedFrom` correctly — verified — so a
   generator **can** filter. Whether it **does** is a thing to check, not assume: emitting
   `internals`, `validate` or `upgradeProperty` as React props would publish the base class's
   internals into a consumer-facing API.
3. **The form elements declare no events.** `sk-nav-pill` declares one (`@fires`). So the
   generator's event-mapping path is exercised by exactly one element, and that is worth knowing
   before claiming the path works.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A React consumer gets typed JSX for an element (Priority: P1)

**Acceptance**

1. `<SkFormInput name="email" label="Email address" />` typechecks, and a wrong prop type is a
   compile error.
2. A `ref` is typed as the element, not as `HTMLElement` — so `ref.current.setCustomError(…)`
   typechecks.
3. Only the element's **own public API** appears. `internals`, `validate`, `upgradeProperty`,
   `errorId`, `customError` and `initialValue` are `protected` and must not surface.

### User Story 2 - Regenerating from an unchanged manifest changes nothing (Priority: P1)

This is ADR-11's required behaviour 9 and the mission's hardest criterion.

**Acceptance**

1. Running the generator twice on an unchanged manifest produces byte-identical output.
2. CI fails when committed wrapper output drifts from what the manifest generates.
3. CI fails when generated output is hand-edited.

### User Story 3 - The wrapper is proven, not assumed (Priority: P1)

**Acceptance**

1. The wrapper is exercised against a real React render, not only typechecked.
2. `sk-nav-pill`'s event reaches a React `onSkNavPillToggle`-style prop — the one element that
   tests the event path at all.
3. A form-associated element inside a React `<form>` still submits.

### Edge Cases

* **An element with no public API** (`sk-stub`) — the generator must emit something valid.
* **An element whose slot is undeclared** (`sk-card` today) — decide whether the mission fixes
  the JSDoc or the generator tolerates it, and record which.
* **A property whose name collides with a React reserved prop** (`key`, `ref`, `children`).
* **A boolean attribute that is not reflected** (`disabled` on the form elements, deliberately).
* **SSR / RSC**: a custom element has no server rendering. What the wrapper emits there is a
  decision, not a default.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Wrappers are **generated** from `custom-elements.json` by a committed script, for
  every element that exists at that point — no hand-written `.tsx`.
- **FR-002**: Generated output is committed, and CI asserts it is current. This is *nearly* the
  contract `build-elements-css.mjs` and `build-element-markup.mjs` use — but those two do **not
  agree with each other**, and the difference is the whole ballgame: run both from an empty
  directory and the markup gate exits 1 ("refusing to report green over nothing") while the CSS
  gate prints `✅ … (0 component(s))` and exits 0. Filed as #123. **This mission takes the
  markup gate's half of the contract and the CSS gate's orphan sweep, which is the union
  neither script currently has.**
- **FR-003**: Regenerating from an unchanged manifest is a **no-op**, asserted — ADR-11's
  behaviour 9, which `behaviours.json` deliberately omitted until a subject existed.
- **FR-004**: Only public API surfaces, and only *deliverable* ones. **`privacy: protected` and
  `private` members do not become props. `inheritedFrom` is irrelevant to that question** — a
  public inherited field is public API and must be a prop. **A public field with no observed
  attribute is also not a prop**, because `ssrSafe` (FR-009) defers element registration and
  React therefore delivers first-render props as attributes; a field with no attribute would be
  dropped in silence. The set of such fields is committed and asserted, not discovered.

  *Amended at the pre-merge gate.* The requirement previously enumerated `errorMessage` among
  the inherited fields that MUST be props. It is Lit `state: true` — the element observes no
  attribute for it — so it could never arrive on a first render, and the manifest's claim that
  it had an attribute was an analyzer defect (now corrected at source by
  `normalise-manifest.mjs`). Recording the amendment rather than letting the implementation
  quietly diverge from the requirement.

  *Corrected at implementation, after the generator was actually run.* Every earlier draft of
  this requirement said "`protected` **and `inheritedFrom`-base** members do not become props",
  and all three review lenses passed over it — one of them recording SC-304 as "already true".
  It is not merely already-true, it is **wrong**: `value`, `label`, `name`, `required`,
  `disabled`, `description`, `errorMessage` and `invalid` are all `inheritedFrom:
  FormControlBase` with `privacy: public`, and all eight correctly become props. Implemented
  literally, FR-004 would have produced a form wrapper with **no `value` prop** — 8 of
  `sk-form-input`'s 10 stripped. The `protected` half is the real requirement and it holds.
- **FR-005**: The event path is exercised by `sk-nav-pill`'s declared event, in a real render.
- **FR-006**: A form-associated wrapper submits inside a React `<form>`.
- **FR-007**: `sk-card`'s undeclared `@slot` is resolved — either the JSDoc is added or the
  omission is recorded with a reason. The manifest is the generator's only input and it is
  currently wrong about this element.
- **FR-008**: The new behaviour gets a `behaviours.json` id, a subject, and a mutation, per the
  machinery #71–#74 established. **See the fork on #75** — the mutation harness is browser-only
  and this behaviour is node-lane work; that contradiction is not this spec's to settle.
- **FR-009**: **The SSR/RSC boundary is decided and the decision is in the emitted output** —
  a `'use client'` directive, or a recorded refusal to emit one. Issue #75 lists this in scope;
  the first draft of this spec called it "a decision, not a default" and then made no decision,
  which is the same as defaulting.
- **FR-010**: **The wrapper package is typechecked.** `scripts/typecheck-all.mjs` derives its
  project set from `nx show projects --with-target typecheck`, which returns exactly
  `["elements-behaviour-fixture","elements"]` today. A wrapper package without a `typecheck`
  target is compiled by nothing, and the mission's entire stated value — typed JSX, typed refs —
  ships unverified. A deliberately-wrong prop and a `ref.current.setCustomError(…)` call are
  both proven red-first.
- **FR-011**: **The prop set is asserted positively, per element, against the manifest.** FR-001
  and FR-004 are both satisfied by a generator that emits an empty props object. `sk-form-input`
  could drop from 10 attributes to 2 and every gate in this mission stays green. The floor is
  per-element and non-empty for every element with ≥1 public field; `sk-stub` (0 members) is the
  named exemption, not the reason to drop the floor.

### Non-Functional Requirements

- **NFR-001**: No hand edits to generated output — asserted, not asked for.
- **NFR-002**: The generator runs in the **node** lane. ADR-11 §"a second, browserless subject"
  names manifest analysis, wrapper generation and its drift check as node-lane work.
- **NFR-003**: React must not become a dependency of `@spec-kitty/elements`, in any dependency
  map — asserted. The wrapper package declares React as a **peer**; the only devDependency on it
  is the consumer fixture that actually renders. (The original wording said "a devDependency of
  the wrapper package only", which the shipped shape improves on rather than meets: a peer is
  the correct declaration for a package whose consumer supplies React. Amended to what is true
  and asserted.)
- **NFR-004**: `suite-budget.json`'s **two** ceilings are re-measured if the mutation set or the
  test set grows. `selftestCeilingSeconds` (180) covers `suite-selftest.mjs`; `ceilingSeconds`
  (25) covers `npm run test` across both lanes and both browsers, and no draft of this spec had
  mentioned the second one.

  **The slope is corrected.** The "≈10s per mutation" figure #74 recorded bundles two variables.
  The harness runs one full suite per mutation, so from the two committed CI points
  (39 mut/62 tests → 121.7s; 41/80 → 141.6s) the fit is `per-run ≈ 1.90s + 0.0183s × tests`.
  A mutation with **no new tests costs ≈3.4s**, not 10s; the 10s was a mutation *plus nine
  tests*. So one added mutation does not threaten the ceiling — **the React render tests do**,
  because they run 42 times, and at a realistic 200–400ms per React mount that is +17s to +34s
  against 38.4s of headroom. Whichever WP first adds those tests owns the measurement.

  The earlier draft's "102.7s local" figure is **withdrawn**: it appears nowhere in the repo,
  and `suite-budget.json` warns twice, in its own `$comment`, against exactly that — quoting a
  workstation number as though it were binding.

### Constraints

- **C-001**: The generator choice is settled (issue + ADR-11). Not re-opened.
- **C-002**: No ADR written or amended. ADRs are written only in #67.
- **C-003**: `kitty-specs/**` outside this mission, `docs/architecture/validation/**` and
  `docs/learnings/**` are frozen.
- **C-004**: `@spec-kitty/styles` is published publicly at 1.0.0; nothing here may change its
  surface. `@spec-kitty/elements` is `"private": true` and unpublished (#80).
- **C-005**: Published prose is short — the analyzer copies class and `@csspart` descriptions
  verbatim, and **if the generator emits JSDoc into the `.tsx`, that prose becomes React
  consumers' documentation too.** What the manifest carries is now load-bearing in two places.
- **C-006**: The manifest is normalised after every analyze (`scripts/normalise-manifest.mjs`,
  #74). It was nondeterministic before that — two runs swapped two declarations — which would
  have made FR-003's no-op criterion flaky by construction. Do not remove the normalisation.

### Key Entities

- **The generator script** — CEM in, `.tsx` out, committed, `--check`able.
- **`packages/react`** (name TBD in the plan) — the generated wrapper package, if one is built.
- **`custom-elements.json`** — the sole input, and now a normalised artifact.

## Success Criteria *(mandatory)*

- **SC-301**: The generator produces wrappers for all five elements with **zero hand edits**,
  and `--check` is green in CI.
- **SC-302**: Running the generator twice on an unchanged manifest is byte-identical —
  asserted in the node lane, not by eye.
- **SC-303**: Hand-editing a generated file fails CI, demonstrated.
- **SC-304**: No `protected` or `private` member appears in any wrapper's public props, asserted
  against the manifest so it cannot rot as the base class grows. Public **inherited** members
  are expected to appear and their absence is a failure — see FR-004's correction.
- **SC-305**: **The mission states, with evidence, what the wrapper buys over React 19's native
  support.** If the answer is "nothing that matters", that is recorded as the finding and the
  package is not shipped. This criterion is satisfied by a defensible answer, not by a
  particular one.
- **SC-306**: `sk-nav-pill`'s event reaches a React handler in a real render.
- **SC-307**: A form-associated wrapper submits inside a React `<form>`.
- **SC-308**: `sk-card`'s slot situation is resolved and the manifest agrees with the element.
- **SC-309**: The SSR/RSC decision is asserted by grep over the generated output, not by prose.
- **SC-310**: `packages/react` has a `typecheck` target and `typecheck-all.mjs` picks it up —
  asserted by MEMBERSHIP (`elements`, `elements-behaviour-fixture`, `react`,
  `react-consumer-fixture` are each named), not by a count. A count rots on the next project
  added, and three drafts of this criterion disagreed about whether it was 3 or 4. A wrong prop
  and a wrong ref type are both red in an expect-error fixture.
- **SC-311**: For every element, the emitted prop set **equals** its **public and attributed**
  manifest field set — inherited included, `protected`/`private`/`readonly` excluded, and fields
  with no observed attribute excluded per FR-004 — compared as sets, with a non-empty floor for
  every element that has one. The excluded-but-public set is itself asserted against a committed
  record, so a field losing its attribute fails rather than disappearing. (This criterion said "non-inherited" when first written,
  which would have demanded dropping the eight inherited props. Same error as FR-004's, made
  while folding the review that failed to catch it.)
- **SC-312**: The expected file set is derived from a source the generator does not consult.
  Two readings of one predicate cannot disagree; three independent counts can —
  elements on disk (`packages/elements/src/*/sk-*.ts`) → manifest `tagName`s → emitted files,
  all three equal. `tests/node/config-contract.test.ts:236-252` already ties the first two.

## Out of scope

- The full catalogue, Angular (#79), publishing (#80).
- The conformance matrix's remaining framework columns (#112).
- Fixing #117, #118, #122, or the open a11y issues.

## Decisions this mission does NOT make

1. **Which generator** — settled by the issue and ADR-11.
2. **Whether React leads** — the operator's decision, recorded in ADR-8.
3. **Whether `@lit/react` is a generator** — ADR-11 says it is not.

If a fork appears that none of these covers, work on that thread stops and it is raised on #75.
