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
| `sk-form-input` | 18 | **15** | 0 | 5 | 0 | 10 |
| `sk-form-textarea` | 18 | **15** | 0 | 5 | 0 | 10 |

Three facts in that table decide the mission's shape:

1. **`sk-card` renders a `<slot>` and declares none.** `grep -c '<slot' sk-card.ts` → 1;
   `grep -c '@slot'` → 0. So the manifest reports zero slots, and a generator typing `children`
   from the manifest would give `<SkCard>` no children. **The manifest is only as good as the
   JSDoc, and this is the first place that has cost anything.**
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
- **FR-002**: Generated output is committed, and CI asserts it is current (the contract
  `build-elements-css.mjs` and `build-element-markup.mjs` already use).
- **FR-003**: Regenerating from an unchanged manifest is a **no-op**, asserted — ADR-11's
  behaviour 9, which `behaviours.json` deliberately omitted until a subject existed.
- **FR-004**: Only public API surfaces. `protected` and `inheritedFrom`-base members do not
  become props.
- **FR-005**: The event path is exercised by `sk-nav-pill`'s declared event, in a real render.
- **FR-006**: A form-associated wrapper submits inside a React `<form>`.
- **FR-007**: `sk-card`'s undeclared `@slot` is resolved — either the JSDoc is added or the
  omission is recorded with a reason. The manifest is the generator's only input and it is
  currently wrong about this element.
- **FR-008**: The new behaviour gets a `behaviours.json` id, a subject, and a mutation, per the
  machinery #71–#74 established.

### Non-Functional Requirements

- **NFR-001**: No hand edits to generated output — asserted, not asked for.
- **NFR-002**: The generator runs in the **node** lane. ADR-11 §"a second, browserless subject"
  names manifest analysis, wrapper generation and its drift check as node-lane work.
- **NFR-003**: React is a **devDependency of the wrapper package only**. It must not become a
  dependency of `@spec-kitty/elements`.
- **NFR-004**: `suite-budget.json`'s ceilings are re-measured if the mutation set grows. At
  41 mutations / 102.7s local and 141.6s CI against a 180s ceiling, roughly four more mutations
  breach it — #74 recorded the slope.

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
- **SC-304**: No `protected` or base-inherited member appears in any wrapper's public props.
  Asserted against the manifest, so it cannot rot as the base class grows.
- **SC-305**: **The mission states, with evidence, what the wrapper buys over React 19's native
  support.** If the answer is "nothing that matters", that is recorded as the finding and the
  package is not shipped. This criterion is satisfied by a defensible answer, not by a
  particular one.
- **SC-306**: `sk-nav-pill`'s event reaches a React handler in a real render.
- **SC-307**: A form-associated wrapper submits inside a React `<form>`.
- **SC-308**: `sk-card`'s slot situation is resolved and the manifest agrees with the element.

## Out of scope

- The full catalogue, Angular (#79), publishing (#80).
- The conformance matrix's remaining framework columns (#112).
- Fixing #117, #118, #122, or the open a11y issues.

## Decisions this mission does NOT make

1. **Which generator** — settled by the issue and ADR-11.
2. **Whether React leads** — the operator's decision, recorded in ADR-8.
3. **Whether `@lit/react` is a generator** — ADR-11 says it is not.

If a fork appears that none of these covers, work on that thread stops and it is raised on #75.
