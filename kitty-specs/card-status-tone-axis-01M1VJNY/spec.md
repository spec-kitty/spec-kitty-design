# Mission Specification: card status tone axis

**Mission Branch**: `mission/card-status-tone-axis`
**Created**: 2026-09-06
**Status**: Draft
**Input**: GitHub issue #177 — "[elements] sk-card operational status tone axis — the surface a status card composes onto"

## Context

`sk-card` is on `train/elements-first` today and declares exactly **two** axes —
`variant: 'blue' | 'purple' | undefined` and `inset: boolean`
(`packages/elements/src/card/sk-card.ts:37-47`). `packages/styles/src/card/sk-card.css` carries
`.sk-card--blue`, `.sk-card--purple` and `.sk-card--inset` and nothing else. There is no
operational status axis.

`grep -c 'sk-status-' packages/tokens/src/tokens.css` returns **0** on the branch point
(`32fa495`). The `--sk-status-*` semantic category does not exist; this mission lands it.

This mission adds **one** reflected `status` axis to that same element and that same authored
CSS, plus the semantic token category the axis needs. It creates no new element.

### Measurements taken against `train/elements-first@32fa495`

| claim | measured |
|---|---|
| #146's tone vocabulary | `neutral \| info \| success \| attention \| danger \| recovery`, `packages/elements/src/status-indicator/sk-status-indicator.ts:5-11`, with an ordered `Object.freeze` array at `:14-20` |
| `sk-card` axes | two — `sk-card.ts:37-40` static properties |
| the extension point | `CARD_VARIANTS` at `sk-card.markup.ts:22`, `cardClasses()` at `:60`, `CARD_AXES` at `:97` |
| `--sk-status-*` | absent (0 occurrences) |
| #176's primitives | `packages/styles/src/facts/sk-facts.css` and `.../disclosure/sk-disclosure.css` both present |
| forced-colors baselines | `sk-data-table.css`, `sk-disclosure.css`, `sk-skip-link.css` |
| reduced-motion baselines | `sk-skip-link.css`, `sk-disclosure.css`, `sk-transition-matrix.css` |

### Two constraints of the existing toolchain shape this mission's design

Both were measured, and both change *how* "one vocabulary, imported not restated" is honoured.

1. **`sk-card.markup.ts` cannot import the tone vocabulary.** `scripts/build-element-markup.mjs`
   evaluates every `*.markup.ts` from a `data:` URL, which has no module base, and the generator
   fails with a named error on any relative import. The card's status→BEM map must therefore be
   declared in the leaf markup module. It is held to the canonical vocabulary by an **assertion**
   (FR-002) rather than by an import.
2. **The element's field annotation must be a literal union, not a type alias.**
   `scripts/build-vue-types.mjs` emits `'<attr>'?: <manifest type text>` verbatim into
   `packages/elements/vue.d.ts`, which imports nothing from `@spec-kitty/elements`. A
   `StatusIndicatorTone` alias in the annotation would emit an unresolved identifier and fail
   `typecheck-all`. This is exactly why #146 wrote `tone`'s union out inline at
   `sk-status-indicator.ts:53` while also holding the frozen array at `:14`. The card follows the
   same shape, and the restatement is pinned by a compile-time equality proof (FR-011).

### The token gap the mission has to close, stated rather than assumed

The status tones map onto the existing tint family exactly once each — except **danger**. The
repo has `--sk-color-red` (a hue) and uses it for `sk-status-indicator`'s danger marker, but the
`--sk-surface-tint-*` / `--sk-on-tint-*` family has **mint, butter, lilac and sky and no rose
member**. Five of six tones alias an existing surface; danger has a hue and a foreground and no
surface.

This mission completes that family with `--sk-surface-tint-rose` / `--sk-on-tint-rose`, derived
from the existing `--sk-color-red` hue by the same rule the four siblings follow (same hue angle,
dark tints at L≈0.11-0.14, light tints at L≈0.93-0.95, measured in HLS). It is **not** a new brand
hue: the hue already exists and is unchanged. Recorded here because #177 says the mission "is not
licensed to introduce new brand colours", and completing an established derived family from an
existing hue is the narrowest reading that still lets `--sk-status-danger` be an alias.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — a status card is a composition, not a component (Priority: P1)

A dashboard author needs a panel that says a run failed. They write one `sk-card` with
`status="danger"`, slot an `sk-status-indicator tone="danger"` reading "Failed", a
`<dl class="sk-facts">` of run facts and a `<details class="sk-disclosure">` holding the log —
the `<dl>` and `<details>` staying in light DOM. No new element is written, imported or defined.

**Why this priority**: it is the mission's stated proof. `factory-dashboard@1fb95bc` has six
variations of this panel with six colour scales; the outcome that removes them is one card plus
existing primitives.

**Independent Test**: mount that exact composition; assert the `<dl>` and `<details>` are assigned
to the card's default slot (so they are in light DOM, with their parent/child chains intact), that
the `<details>` still toggles under UA ownership, and that the card carries the danger surface.

**Acceptance Scenarios**:

1. **Given** the composition above, **When** it is mounted, **Then** the `<dl>` and `<details>`
   resolve as assigned nodes of the card's default slot and `document.querySelector('dl')` finds
   them in the light DOM.
2. **Given** the composition above, **When** the `<summary>` is clicked, **Then** `details.open`
   toggles with no author code.

---

### User Story 2 — two axes, chosen independently (Priority: P1)

A consumer wants a purple architecture card that is also flagged as needing attention. `variant`
stays the brand/decorative axis; `status` is the operational one; a card carries both.

**Why this priority**: #177 makes the separation binding. Folding status into `variant` would make
every brand×status combination unreachable and would fork the tone vocabulary into the variant
enum.

**Independent Test**: set `variant="purple" status="attention"` and assert both BEM modifiers are
present on the same internal node, and that neither axis's computed effect is cancelled.

**Acceptance Scenarios**:

1. **Given** `variant="purple"` and `status="attention"`, **When** the card renders, **Then** the
   internal node carries `sk-card--purple` and `sk-card--status-attention` together.
2. **Given** the same card, **When** `status` is removed, **Then** `sk-card--purple` remains and
   the purple surface is restored.

---

### User Story 3 — an unknown status never eats the page (Priority: P1)

A CMS field, a server template or a typo supplies `status="failed"`. The card renders as the base
card, still paints, still slots its children, and warns exactly once.

**Why this priority**: `sk-card.markup.ts:44-58` already records the measured consequence of the
alternative — a throw inside `render()` makes Lit reject `updateComplete`, paints an empty shadow
root with no `<slot>`, and the element silently eats its own light-DOM children. The mission must
match that policy, not re-derive it.

**Independent Test**: mount `<sk-card status="failed">` with a child; assert `[part="card"]`
exists, `className.trim() === 'sk-card'`, the `<slot>` has one assigned node, and exactly one
`console.warn` fired naming the offending value.

**Acceptance Scenarios**:

1. **Given** `status="definitely-not-a-status"`, **When** the card renders, **Then** the card part
   is present, the slot survives with its assigned node, and exactly one warning names the value.
2. **Given** a prototype-chain key (`constructor`, `__proto__`, `toString`, `hasOwnProperty`) as
   the status, **When** `cardClasses` runs, **Then** it degrades to `sk-card` — `Object.hasOwn`,
   never `in`.
3. **Given** the same value on the **authoring** path, **When** `cardStaticHtml` is called,
   **Then** it throws, because a bad status must not reach generated output.

---

### User Story 4 — the tone is never the only carrier of meaning (Priority: P1)

A viewer with a monochrome display, a colour-vision deficiency, or `forced-colors: active` reads
the card. The surface and the edge carry no information the text does not already carry.

**Why this priority**: #177 records the defect it exists to remove — at `1fb95bc` "the border hue
is the sole carrier of 'this run failed'".

**Independent Test**: a desaturated story renders the full tone set under
`filter: grayscale(1) contrast(1.1)`; every card is still readable and still labelled by its
slotted `sk-status-indicator` text. A forced-colors story documents the collapse.

**Acceptance Scenarios**:

1. **Given** the greyscale story, **When** it renders, **Then** each card's status is still
   identifiable from the slotted indicator's text alone.
2. **Given** `forced-colors: active`, **When** the card renders, **Then** its status edge is drawn
   with a system colour on a LONGHAND `-color` property and the card does not depend on
   `background-color` to be distinguishable.

---

### User Story 5 — the tone survives into React and Vue without a cast (Priority: P2)

A React consumer writes `<SkCard status="danger" />` and gets completion for the six tones and a
compile error on a seventh. Nothing is `any`.

**Why this priority**: `packages/react/src` is generated and committed; a widened union that
degrades to `any` or `string` is invisible to every runtime gate.

**Independent Test**: `packages/react/type-tests/wrappers.type-test.tsx` compiles the good case and
carries a `@ts-expect-error` on the bad one — red-first by construction, since an unused directive
is itself an error.

**Acceptance Scenarios**:

1. **Given** the generated `SkCard.d.ts`, **When** `tsc --noEmit` runs, **Then**
   `<SkCard status="danger" />` compiles and `<SkCard status="failed" />` errors.
2. **Given** the same file, **When** the union widens to `any` or `string`, **Then** the
   `@ts-expect-error` becomes unused and the typecheck fails.

---

### Edge Cases

- `status=""` (empty attribute) — treated as absent, no warning, base card. Matches
  `statusTone()`'s existing `value !== '' ` guard in `sk-status-indicator.ts:27`.
- `status` set as a **property before upgrade** — must survive and reflect to the attribute.
- `status` and `inset` together — inset swaps the surface token; status must not silently lose to
  it or silently win. The ordering is declared once, in the authored CSS, and asserted.
- A tone added to #146 later — FR-002's assertion fails until the card's map is extended, which is
  the intended failure.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | One reflected `status` axis | As a consumer, I want a single reflected `status` attribute on `sk-card`, orthogonal to `variant`, so a card can carry both a brand tone and an operational one. | High | Open |
| FR-002 | One vocabulary, held by assertion | As a maintainer, I want the card's status keys proven equal — in membership and order — to `sk-status-indicator`'s exported frozen tone array, so the vocabulary cannot fork. | High | Open |
| FR-003 | Fail open, never throw | As a consumer, I want an unknown `status` to warn once and degrade to the base card with its children intact, matching `cardClasses`'s existing `Object.hasOwn` policy. | High | Open |
| FR-004 | Throw on the authoring path | As a maintainer, I want `cardStaticHtml` to throw on an unknown `status`, so a bad value never reaches generated output. | High | Open |
| FR-005 | Extend through the sibling map | As a maintainer, I want the static forms and the styles barrel derived from a `CARD_STATUSES` map beside `CARD_VARIANTS`, so `sk-card.html` and `packages/styles/src/card/index.ts` regenerate and no generated output is hand-edited (ADR-10 §3). | High | Open |
| FR-006 | The `--sk-status-*` token category | As a designer, I want a `--sk-status-<tone>` / `--sk-on-status-<tone>` pair per tone, in **both** theme blocks in the same commit, as aliases over existing hue/surface tokens. | High | Open |
| FR-007 | Complete the tint family for danger | As a designer, I want `--sk-surface-tint-rose` / `--sk-on-tint-rose` derived from the existing `--sk-color-red` hue, so `--sk-status-danger` can be an alias rather than a literal. | High | Open |
| FR-008 | Forced-colors baseline | As a viewer in forced-colors mode, I want the card's status edge drawn with a system colour on a LONGHAND `-color` property, and no reliance on `background-color`. | High | Open |
| FR-009 | Reduced-motion baseline | As a motion-sensitive viewer, I want any transition the status axis adds guarded by `prefers-reduced-motion: reduce`, scoped to the exact property. | Medium | Open |
| FR-010 | Stories | As a reviewer, I want a story per tone, a base story, an orthogonality story, the composition story, an unknown-status story, a greyscale story, a forced-colors story, and a `LightMode` variant covering every tone in `class="sk-light"`. | High | Open |
| FR-011 | Type reach | As a React consumer, I want the widened union to reach `SkCard.d.ts` with no `any`, proved by a compiled type test. | High | Open |
| FR-012 | Registry and mutation entries | As a maintainer, I want the fail-open path and the reflected property carried by ADR-11 ids with matching red-first `mutations.json` arms. | High | Open |
| FR-013 | Regenerated artifacts | As CI, I want `custom-elements.json`, the generated `sk-*.css.js`, `sk-card.html`, `packages/styles/src/card/index.ts`, `packages/react/src`, `packages/elements/vue.d.ts`, the token catalogue and `SIZES.md` regenerated and committed. | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | AA against the card's own foreground | `--sk-fg-body` on every `--sk-status-<tone>` is ≥ 4.5:1 in **both** themes. Measured minimum: 9.69:1 (dark, neutral). | Accessibility | High | Open |
| NFR-002 | AA within the semantic pair | `--sk-on-status-<tone>` on `--sk-status-<tone>` is ≥ 4.5:1 in both themes. Measured minimum: 5.22:1 (light, neutral); dark minimum 5.87:1 (danger). | Accessibility | High | Open |
| NFR-003 | Non-text contrast for the edge | The status edge is ≥ 3:1 against the page ground in both themes (WCAG 1.4.11). Measured minimum: 6.20:1 (light, neutral). | Accessibility | High | Open |
| NFR-004 | Zero axe violations | `run-axe-storybook.js` reports zero WCAG 2.1 AA violations across every new story. | Accessibility | High | Open |
| NFR-005 | No size regression beyond the axis | `SIZES.md` regenerates; the elements bundle grows only by the card's added branch and CSS. | Performance | Medium | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | No `sk-status-card` element | Binding (#177). A missing tone or a missing primitive gets filed, not wrapped. | Technical | High | Open |
| C-002 | No domain mapping | The card holds no run/job/agent vocabulary and never infers a tone from a string. Tone is supplied by the consumer. | Technical | High | Open |
| C-003 | Existing contracts frozen | `variant` and `inset` are unchanged in name, type and behaviour. | Technical | High | Open |
| C-004 | No new brand hues | Only aliases over existing hue tokens, plus the rose tint derived from the existing `--sk-color-red` (FR-007). | Technical | High | Open |
| C-005 | #176's primitives are consumed, not modified | `.sk-facts` / `.sk-disclosure` are used by the composition story and not edited. | Technical | High | Open |
| C-006 | No hand-edited generated output | ADR-10 §3. Every generated artifact regenerates from its authored source. | Technical | High | Open |
| C-007 | The markup module stays a leaf | No relative imports in `sk-card.markup.ts` — the generator evaluates it from a `data:` URL. | Technical | High | Open |
| C-008 | No new architecture | A genuine fork is filed as an issue with the measurement attached, not decided here. | Process | High | Open |

### Key Entities

- **Status tone**: one of the six values #146 owns. Presentation only; carries no meaning the
  slotted text does not.
- **`--sk-status-<tone>` / `--sk-on-status-<tone>`**: a semantic surface/foreground pair per tone,
  defined in both theme blocks, aliasing existing tokens.
- **`CARD_STATUSES`**: the status→BEM map beside `CARD_VARIANTS`, the extension point the
  generator derives the new static forms from.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `sk-card` exposes exactly one new axis, `status`, reflected, with the six #146 tones
  and no seventh anywhere in the repo (`grep` proves the vocabulary appears as a *list* in exactly
  two authored places, both pinned by FR-002's assertion and FR-011's type proof).
- **SC-002**: `--sk-status-*` and `--sk-on-status-*` exist for all six tones in both theme blocks,
  and appear in the regenerated `packages/tokens/dist/token-catalogue.json`.
- **SC-003**: every measured contrast ratio in NFR-001..003 is recorded in the mission's evidence
  and is ≥ its threshold.
- **SC-004**: the approved status-card shape renders from composition alone, with the `<dl>` and
  `<details>` asserted to be in light DOM.
- **SC-005**: the fail-open path is proved by a test that goes **red** under a declared
  `mutations.json` arm, not by a comment.
- **SC-006**: `build-element-markup.mjs --check`, `build-elements-css.mjs --check`,
  `build-react-wrappers.mjs --check`, `build-vue-types.mjs --check`,
  `measure-elements-sizes.mjs --check` and `git diff --exit-code -- packages/elements/custom-elements.json`
  all pass with `--skip-nx-cache` builds behind them.
- **SC-007**: `check-manifest-content.mjs`, `check-part-ratchet.mjs`, `check-story-theme-wrapper.mjs`,
  `typecheck-all.mjs`, `quality:all`, `npm test`, `suite-selftest.mjs` and the axe run all pass.

## Out of Scope

A status-card element. Domain→tone mapping. Run/job/agent vocabulary. Loading, polling or timers.
Selection or activation on the card. New brand hues. Any change to `variant` or `inset`. Any edit
to `.sk-facts` / `.sk-disclosure`. Tone alignment for `sk-notice` or `.sk-data-table` (this mission
blocks them; it does not do them).
