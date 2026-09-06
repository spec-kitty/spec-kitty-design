# Implementation Plan: page header compact sticky

**Branch**: `mission/page-header-compact-sticky` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `kitty-specs/page-header-compact-sticky-01M1V55H/spec.md`

## Summary

Add two orthogonal reflected axes — `density` and `sticky` — to the existing `sk-page-header`, on
its existing element, its existing template and its one authored stylesheet. Sticky positioning goes
on the **host**, not on an inner box; the compact form is the same five slots at reduced padding and
gap on a single row, with the trailing action pinned and the text truncating first. Stickiness is
dropped by two viewport media blocks. Four tokens carry the sticky geometry, one of them derived so
the consumer's `scroll-margin` cannot drift from the header's own footprint.

## Technical Context

**Language/Version**: TypeScript 5.x, Lit 3.x custom elements (ADR-8), CSS with `--sk-*` tokens
**Primary Dependencies**: `lit`, `@spec-kitty/tokens`, `@spec-kitty/styles`; vitest browser lane
(chromium locally, chromium + webkit in CI) via `@vitest/browser-playwright`
**Storage**: N/A
**Testing**: `fixtures/elements-behaviour/src/sk-page-header.test.ts` (browser lane),
`scripts/suite-selftest.mjs` mutation harness, Storybook + axe, Playwright cross-browser
**Target Platform**: evergreen browsers; WebKit is a first-class lane (ADR-11)
**Project Type**: Nx monorepo, four packages, `tokens → styles → elements → react`
**Performance Goals**: `selftestCeilingSeconds` (881.9s) not breached; storybook build under 3 min
**Constraints**: token-only CSS; no selector may leave the shadow root; no new element; no timer,
clock read, polling, scroll listener or liveness state in the element
**Scale/Scope**: one element, one stylesheet, one token block, one test file, one story file, five
ratchet/registry files, plus regenerated artefacts

## Measurements taken before planning

Each of these was run against this checkout at `train/elements-first@65a92f6`, not recalled.

1. **`sk-page-header` exists and has no property.** `packages/elements/src/page-header/sk-page-header.ts`
   declares `static styles` and `render()` only — no `static properties`. Its stylesheet has no
   `compact`, no `sticky` and no `position:` declaration.
2. **An inner shadow box cannot stick.** Probed in chromium with a 300px scroller: an inner
   `position: sticky` box inside a `display: block` host scrolled from `top: 0` to `top: -500`
   after a 500px scroll — it did not stick, because its containing block is the host and there is
   no room to move inside it. The same markup with `position: sticky` on the **host** stayed at
   `top: 0`. This is why FR-002 puts the declaration on `:host([sticky])`.
3. **The forced-colors and reduced-motion baselines already exist**, contrary to #182's own text —
   see the spec's "one premise is stale" table. `data-table`, `disclosure` and `skip-link` are the
   files to match.
4. **The behaviour lane runs at a 414px viewport.** Stated and relied upon in
   `fixtures/elements-behaviour/src/sk-grid.test.ts`, which asserts
   `window.matchMedia('(max-width: 720px)').matches` is `true`. So a `max-width: 720px` media block
   is *live* in this lane and its effect can be measured, not merely read out of the sheet.
5. **A container query cannot style its own container.** `container-type: inline-size` is on
   `:host`, so `@container` rules in this sheet resolve against the host and can style only its
   descendants. Dropping stickiness therefore has to be a `@media` rule, because the thing being
   made non-sticky *is* the host.
6. **Adding a behaviour id is not available to this mission.**
   `tests/node/config-contract.test.ts:48` asserts `behaviours.json`'s applicable id set equals
   ADR-11's list exactly, and `scripts/suite-selftest.mjs` guard 7 rejects any mutation whose
   `id@subject` pair is not declared there. Registered mutation coverage is therefore possible for
   the two axes (via SC-010, "property before upgrade") and **not** for the reflow threshold, which
   has no id in ADR-11's list. That gap is filed as an issue rather than papered over by
   mis-filing a layout assertion under a reflection id.
7. **`:host([attr]) .class` is an accepted selector shape.**
   `scripts/check-adopted-css-boundaries.mjs`'s own probe table records
   `[':host([open]) .sk-nav-pill__items', 'accept', 'host with an attribute']`, and
   `sk-transition-matrix.css` and `sk-nav-pill-drawer.css` already ship the shape.
8. **`--sk-layout-*` is an existing token category**, holding
   `--sk-layout-personal-rail-width` and `--sk-layout-context-sidebar-width`, declared in **both**
   the `:root` block and the `:root[data-theme="light"], .sk-light` block as theme-invariant. New
   layout tokens follow that shape; no new category and therefore no
   `docs/contributing/adding-a-token.md` change.

## Charter Check

| Gate | Status | Note |
|---|---|---|
| SK-D01 tokens-first | Pass by construction | Four new `--sk-layout-page-header-*` tokens; `check-element-css-hygiene.mjs` refuses a `var()` naming a token the source does not define. The system-colour keywords used under forced colors are the six already in `stylelint.config.mjs`'s `ignoreValues`. |
| ADR-9 shadow boundary | Pass | Every selector's leftmost compound is `:host`, a `.sk-page-header*` class or a `slot`. No `:root`, `html`, `body` or `:host-context()`. |
| ADR-9 declared parts | Pass | No part is added or removed; `expected-parts.json` is unchanged. |
| ADR-10 one authored source | Pass | `sk-page-header` has no `.markup.ts` and gains none — #145 declined a static form and this mission does not add one, so no `.html`/`index.ts` is generated for it. |
| ADR-11 verification | Partial, stated | Two registered mutations (SC-010, one per axis). The reflow threshold gets real tests but no registered mutation — see measurement 6 and the filed issue. |
| Accessibility (absolute) | Pass | Zero axe violations required; new stories carry `a11y: { disable: false }` by inheriting the file's meta. |
| `LightMode` story | Pass | Every new story set keeps a `class="sk-light"` wrapper, never `data-theme`. |

## Project Structure

### Documentation (this mission)

```
kitty-specs/page-header-compact-sticky-01M1V55H/
├── spec.md
├── plan.md              # this file
├── tasks.md
└── tasks/
```

### Source Code (repository root)

```
packages/tokens/src/tokens.css                              # +4 tokens, both theme blocks
packages/tokens/dist/token-catalogue.json                   # regenerated
packages/styles/src/page-header/sk-page-header.css          # authored — the whole design lives here
packages/elements/src/page-header/sk-page-header.ts         # +2 reactive properties, +classes helper
packages/elements/src/page-header/sk-page-header.css.js     # generated from the .css
packages/elements/src/page-header/sk-page-header.css.d.ts   # generated
packages/elements/src/page-header/sk-page-header.stories.ts # +5 stories incl. LightMode
packages/elements/custom-elements.json                      # regenerated
packages/elements/vue.d.ts                                  # regenerated
packages/elements/SIZES.md                                  # regenerated after a real build
packages/react/src/SkPageHeader.js|.d.ts                    # regenerated
fixtures/elements-behaviour/src/sk-page-header.test.ts      # +tests
behaviours.json, mutations.json                             # SC-010 subject + 2 mutation arms
expected-docs.json, expected-stories.json                   # exact-equality ratchets
docs/design-system/using-components.md                      # the scroll-container + scroll-margin contract
```

**Structure Decision**: no new directory anywhere. Every file above already exists.

## Design

### D1 — the two axes

```ts
static properties = {
  density: { type: String, reflect: true },
  sticky:  { type: Boolean, reflect: true },
};
```

- `density` is a string, not a boolean `compact`, because #182 calls it a *density axis* and a
  string leaves room for a third density without a second boolean. `"compact"` is the only
  non-default value today; anything else renders the default density **and warns**, matching
  `gridClasses`/`cardClasses`. It never throws: the recipe records that a throwing render makes Lit
  reject `updateComplete` and paint a shadow root with no `<slot>`, silently eating the consumer's
  light-DOM children.
- `sticky` is a boolean because it has no third state.

Density drives a BEM modifier on the inner header box (`sk-page-header--compact`), which is this
repo's convention and gives the warn a natural home. Sticky is expressed as `:host([sticky])`,
because measurement 2 says the declaration has to be on the host and a host has no class the element
owns. The two mechanisms differ; orthogonality is therefore asserted directly rather than assumed
from a shared spelling.

### D2 — what "compact" changes

Padding, gap, row direction and truncation. **Not font size**: the title is the consumer's `<h2>`
and its typography is theirs — #145 sets none, and shrinking it would be the element reaching into
slotted content.

- `padding: var(--sk-space-2) var(--sk-space-4)` (from `var(--sk-space-6)`), `gap: var(--sk-space-3)`
- `align-items: center`, `min-block-size: var(--sk-layout-page-header-compact-height)`
- the text group becomes a single non-wrapping row (eyebrow, title, supporting side by side)
- eyebrow, title, supporting and sync truncate with `text-overflow: ellipsis`; the DOM text is
  untouched, so assistive technology still reads the whole string
- `.sk-page-header--compact .sk-page-header__actions { flex: 0 0 auto }` — under pressure the sync
  text truncates and the action never shrinks. This is FR-005's "nothing is dropped" guarantee, and
  it is what makes `--sk-layout-page-header-compact-height` an honest single-row figure.

### D3 — sticky, and dropping it

```css
:host([sticky]) {
  position: sticky;
  inset-block-start: var(--sk-layout-page-header-sticky-offset);
  z-index: var(--sk-layout-page-header-sticky-layer);
}
:host([sticky]) .sk-page-header {
  box-shadow: var(--sk-shadow-elev);
  border-block-end: var(--sk-border-width-1) solid transparent;   /* reserved band */
}
@media (max-width: 720px)  { :host([sticky]) { position: static } … }
@media (max-height: 480px) { :host([sticky]) { position: static } … }
```

Two **separate** media blocks rather than one comma list, so each threshold can be read out of the
adopted sheet independently by the `declarationIn` helper `sk-grid.test.ts` already establishes —
one comma list would make the height arm unfalsifiable on its own. Each block also sets
`box-shadow: none` on the header box: a floating elevation under a header that no longer sticks
reads as a bug.

`@media`, not `@container`, for the reason in measurement 5.

### D4 — focus is not obscured (WCAG 2.4.11)

The header cannot style the consumer's content, so it publishes the value instead of an offset the
consumer computes:

```css
--sk-layout-page-header-sticky-offset: 0rem;
--sk-layout-page-header-compact-height: 3rem;
--sk-layout-page-header-sticky-layer: 10;
--sk-layout-page-header-sticky-scroll-margin:
  calc(var(--sk-layout-page-header-sticky-offset) + var(--sk-layout-page-header-compact-height) + var(--sk-space-4));
```

The consumer writes
`.page-content :is(a, button, [tabindex]) { scroll-margin-block-start: var(--sk-layout-page-header-sticky-scroll-margin); }`.
Because the scroll-margin token is **defined in terms of** the offset and the compact block size, it
cannot drift from the header's own footprint when either is retuned.

**Residual, stated rather than hidden**: the derivation covers a single-row compact header. A
consumer whose slotted title wraps to two lines has a taller header, and must raise
`--sk-layout-page-header-compact-height` (which the header's own `min-block-size` also reads, so the
two move together). This is a documented contract, not a guessed offset — but it is not a
measurement of the live box, and this mission does not measure the live box, because doing so would
mean the element observing layout, which is the class of behaviour #182 forbids it from owning.

### D5 — reduced motion and forced colors

Matched to `sk-skip-link.css` and `sk-disclosure.css`, not re-derived:

- one transition, on one property, on one selector: `transition: padding …` on `.sk-page-header`;
  `@media (prefers-reduced-motion: reduce) { .sk-page-header { transition: none } }`. Scoped to the
  exact selector and property this component owns — never a wildcard over its subtree.
- `box-shadow` computes away entirely under `forced-colors: active` (recorded in
  `sk-disclosure.css` and `sk-data-table.css`), so a sticky header separated only by an elevation
  becomes indistinguishable from the content scrolling beneath it. The reserved
  `border-block-end` band carries the separation instead, and the forced-colors block overrides only
  the **longhand** `border-block-end-color: CanvasText` — the shorthand is invisible to stylelint's
  `declaration-strict-value`, so a longhand is what the gate positively certifies. `CanvasText` is
  already an `ignoreValues` entry.

### D6 — the no-timer boundary, enforced twice

1. **Static.** A test imports the element's own source with `?raw`, strips block and line comments,
   and asserts the remainder matches none of `setInterval`, `setTimeout`, `requestAnimationFrame`,
   `Date`, `performance.now`, `IntersectionObserver`, `ResizeObserver`, `MutationObserver` or a
   scroll listener. The stripped source is separately asserted to still contain `class SkPageHeader`,
   so an over-eager strip cannot make the scan pass vacuously — the same anti-vacuity shape
   `expected-parts.json` and `expected-docs.json` exist for, and the reason the recipe records a
   grep that once matched the comment explaining its own exclusion.
2. **Dynamic.** The existing spy test is extended to the compact sticky configuration: `Date.now`,
   `setTimeout` and `setInterval` are spied, time is advanced, and the sync text must be
   byte-identical with none of them called.

A comment cannot red a build; both of these can.

### D7 — verification map

| Requirement | Where it is verified |
|---|---|
| FR-001, FR-002 | `[SC-010]` test: pre-upgrade property assignment survives and reflects, both axes |
| FR-003 | a four-combination test asserting each axis's observable is unchanged by the other |
| FR-004 | slot-identity assertion across both densities; no new file under `packages/styles/src` |
| FR-005 | narrow-width test: action box non-zero, action focusable, sync truncated not dropped |
| FR-006 | live `position: static` at the 414px lane + `declarationIn` reads of both media blocks |
| FR-007 | token-source assertion that the scroll-margin token is derived from the other two |
| FR-008 | `check-element-css-hygiene.mjs` + stylelint + the token catalogue |
| FR-009, FR-010 | `declarationIn` reads of the reduced-motion and forced-colors blocks |
| FR-011 | the two halves of D6 |
| FR-012 | the repo's own drift gates |

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Two styling mechanisms for two axes (`--compact` class, `:host([sticky])`) | Measurement 2: an inner box physically cannot stick, so the sticky declaration must be on the host, which the element cannot put a class on | Putting both on `:host([…])` would abandon the BEM modifier convention and leave the unknown-density warn no natural home; putting both on the inner class would ship a sticky axis that does nothing |
| A derived token (`…-sticky-scroll-margin` as a `calc()` over two others) | FR-007 requires a named value that cannot drift from the header's footprint | A plain number would be exactly the offset the consumer has to guess that #182 rules out; measuring the live box would make the element observe layout |

## Implementation Concern Map

### IC-01 — Tokens

- **Purpose**: add the four `--sk-layout-page-header-*` tokens and regenerate the catalogue.
- **Relevant requirements**: FR-008, FR-007
- **Affected surfaces**: `packages/tokens/src/tokens.css`, `packages/tokens/dist/token-catalogue.json`
- **Sequencing/depends-on**: none — must land before the stylesheet references them, or stylelint
  and `check-element-css-hygiene.mjs` both fail
- **Risks**: forgetting the light block; the layout tokens there are theme-invariant duplicates

### IC-02 — The stylesheet

- **Purpose**: the compact modifier, the sticky host rules, the two drop blocks, the reduced-motion
  block and the forced-colors block.
- **Relevant requirements**: FR-001, FR-002, FR-005, FR-006, FR-009, FR-010
- **Affected surfaces**: `packages/styles/src/page-header/sk-page-header.css` and its two generated
  siblings under `packages/elements/src/page-header/`
- **Sequencing/depends-on**: IC-01
- **Risks**: a duplicate declaration for the same (selector, media) pair makes `declarationIn`
  throw — deliberately, because a later duplicate silently wins in a browser

### IC-03 — The element

- **Purpose**: the two reactive properties, the classes helper with its warn-and-degrade, the JSDoc
  that becomes published API, and the untouched part/slot tree.
- **Relevant requirements**: FR-001, FR-002, FR-003, FR-004, FR-011
- **Affected surfaces**: `packages/elements/src/page-header/sk-page-header.ts`
- **Sequencing/depends-on**: IC-02
- **Risks**: the existing `mutations.json` entry for SC-013 matches an exact indented line of the
  template — reformatting the template silently turns that mutation into a `pattern` rejection

### IC-04 — Verification

- **Purpose**: the behaviour tests, the SC-010 registry subject and its two mutation arms.
- **Relevant requirements**: every FR
- **Affected surfaces**: `fixtures/elements-behaviour/src/sk-page-header.test.ts`,
  `behaviours.json`, `mutations.json`
- **Sequencing/depends-on**: IC-03
- **Risks**: guard 5's collateral bound — a mutation may only red `[SC-…]` tests in its own subject
  file; the mutation budget is `selftestCeilingSeconds`

### IC-05 — Stories, docs and generated artefacts

- **Purpose**: the stories the issue names, the scroll-container/scroll-margin contract documented
  once, and every committed generated artefact regenerated cache-free.
- **Relevant requirements**: FR-012, FR-007, C-002
- **Affected surfaces**: stories, `expected-stories.json`, `expected-docs.json`,
  `docs/design-system/using-components.md`, `custom-elements.json`, `packages/react/src`,
  `vue.d.ts`, `SIZES.md`
- **Sequencing/depends-on**: IC-03
- **Risks**: `measure-elements-sizes.mjs` reads `dist/` and never builds it; nx serves `analyze` and
  `build` from cache, so every `--check` must run with `--skip-nx-cache` or it compares a stale
  artefact with itself
