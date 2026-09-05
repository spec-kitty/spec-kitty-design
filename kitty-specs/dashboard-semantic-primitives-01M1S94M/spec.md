# Feature Specification: dashboard-semantic-primitives

**Mission Branch**: `mission/dashboard-semantic-primitives`
**Created**: 2026-09-05
**Status**: Draft
**Issue**: #176 · epic #183 · tracks #125
**Base**: `train/elements-first@dcf7af2`

## Why this mission exists

The Factory Dashboard hand-rolls five surfaces that the platform already provides and that no
component in this catalogue covers. Each hand-rolled version loses accessible semantics that the
native element would have given for free:

- key/value facts as ad-hoc `div` pairs, so label→value association is visual only;
- collapsible panels as a button plus a `hidden` div, each re-implementing `aria-expanded`;
- run/job tables whose narrow-width treatment reflows cells to blocks and **drops header
  association**;
- repeated "nothing here yet" panels with inconsistent copy and no shared treatment;
- no skip link anywhere, so the primary rail is the first tab stop on every page.

The mission ships five **styles-layer** primitives — class families applied to real semantic HTML
the consumer authors. **No custom element ships from this mission**, and that is the load-bearing
decision rather than a stylistic preference.

## The light-DOM rule, and why it binds

1. **`<dl>`, `<table>` and `<li>` semantics need an unbroken parent/child chain.** A shadow root
   between `<dl>` and its `<dt>`/`<dd>`, or between `<table>` and `<tr>`, severs the relationship.
   #92 is this repo's own recorded instance: `sk-check-bullet` nested an `<li>` inside its host and
   the list stopped being a list.
2. **Cross-root ID references do not resolve.** ADR-9 §4 measured it — ID lookup is scoped to
   `getRootNode()`. `<th id>` ↔ `<td headers>`, `<caption>` and `<label for>` all depend on
   same-root lookup.
3. **A skip link must target an ID in the document** and be its first focusable node. `href="#main"`
   cannot cross a shadow boundary, and a wrapper element cannot guarantee first-focusable.
4. **`<details>` open/closed state is UA-owned.** Wrapping it re-implements the bookkeeping the
   platform already gets right — which is exactly the hand-wiring the Factory surface shows.

The rule this mission establishes, and which the docs must state: **the design system styles native
semantics; it does not re-host them.**

## What the issue says, and what is actually true

The issue pinned its claims at `train/elements-first@fc3f9bc`. The train is now `dcf7af2`. Verified
against the current base:

- **"No `facts`, `disclosure`, `data-table`, `empty-state` or `skip-link` source exists."** True.
- **"No `--sk-status-*` or `--sk-chart-*` semantic token category exists."** True — so the
  tone-free constraint below stands.
- **"Grep finds no `forced-colors` block anywhere in `packages/` or `apps/`."** True.
- **"Grep finds no `prefers-reduced-motion` block."** **No longer true.**
  `packages/styles/src/transition-matrix/sk-transition-matrix.css:237` carries one, added by #171
  after the issue was written. This mission therefore **generalises the existing precedent** into a
  documented baseline rather than inventing a second convention — a mission that "establishes" a
  reduced-motion baseline while one already ships would create exactly the divergence it is meant
  to remove.
- **Styles-only components are derived, not listed.** `scripts/build-styles-only-markup.mjs`
  selects directories under `packages/styles/src` that contain a `.css` and have **no** matching
  directory under `packages/elements/src`. Today that set is exactly `form-field`. The five new
  directories therefore join it automatically and get generated barrels with no script change.
- **The package entry point is still hand-maintained per directory.** `packages/styles/src/index.ts`
  uses `export *` per component, which closes the per-*name* drift, but the per-*directory* list is
  hand-written and ungated (#156). Five new lines are required there and nothing will catch their
  absence.

## Requirements

### Functional

- **FR-001**: `.sk-facts` styles `<dl>`/`<dt>`/`<dd>` with `sk-facts__term` / `sk-facts__value`,
  offering stacked and two-column arrangements and a compact density modifier. Values render
  verbatim — no formatting, no truncation by default, no count derivation.
- **FR-002**: `.sk-disclosure` styles `<details>`/`<summary>` with `sk-disclosure__summary` /
  `sk-disclosure__body`. The marker treatment is never the sole affordance, `:focus-visible` on the
  summary is visible, and the `open` attribute stays the consumer's.
- **FR-003**: `.sk-data-table` styles `<table>`/`<caption>`/`<th scope>` with zebra, hover,
  alignment and numeric-tabular treatment, plus an optional sticky header-row modifier.
- **FR-004**: The narrow-width treatment is **one documented approach**: a labelled,
  keyboard-scrollable container (`role="region"` + accessible name + `tabindex="0"`) wrapping an
  **intact** table. Block-reflow of cells is rejected — it is what breaks header association in the
  Factory surface.
- **FR-005**: `.sk-empty-state` provides heading, supporting copy and one optional action slot
  position. The primitive supplies no copy.
- **FR-006**: `.sk-skip-link` styles a real `<a href="#main">`: off-screen until `:focus-visible`,
  then visible above all content at AA contrast. Never `display: none`, never `outline: none`.
- **FR-007**: Each primitive ships authored `.html` exemplars beside its CSS, and its
  `index.ts` barrel is **generated** by `scripts/build-styles-only-markup.mjs`. No hand-written
  barrel — that is the two-source defect #141/#172 removed.
- **FR-008**: `packages/styles/src/index.ts` gains one `export *` line per new directory. Absent a
  gate (#156), this is verified by an explicit success criterion rather than assumed.
- **FR-009**: A `@media (forced-colors: active)` treatment covers skip-link focus, the disclosure
  marker and table borders — the three places a Windows High Contrast user otherwise loses the
  affordance entirely.
- **FR-010**: Any transition this mission introduces is disabled under
  `@media (prefers-reduced-motion: reduce)`, following the shape already shipped at
  `sk-transition-matrix.css:237`.
- **FR-011**: Both baselines are documented in the component-authoring recipe so later components
  inherit them rather than re-deciding. Per epic #183, this concern is **owned here** and must not
  be spun out into a new ticket.

### Non-functional

- **NFR-001**: Token-only CSS. Every colour, space, radius and border value is an `--sk-*` token;
  `stylelint`'s `declaration-strict-value` must pass without new exceptions.
- **NFR-002**: axe reports zero violations on every story, in both the default and `LightMode`
  arrangements.
- **NFR-003**: A screen-reader user recovers term→value pairing, header→cell association and
  disclosure state **from platform semantics alone** — with the stylesheet removed, nothing is lost
  but appearance.

### Constraints

- **C-001**: No `sk-*` custom element ships from this mission. Any impulse to wrap one of these in
  an element is the #92 regression.
- **C-002**: Tone-free. No success/danger row or panel colouring, because no `--sk-status-*`
  category exists yet. Status colouring waits on #177's tone axis and consumes those tokens once
  they exist. Inventing a semantic status token here is out of scope by epic ruling.
- **C-003**: No sorting, filtering, pagination, virtualization, row selection, column resizing,
  sticky *columns*, or JavaScript of any kind.
- **C-004**: No Team Kitty or Factory Dashboard domain copy.
- **C-005**: `LightMode` stories wrap in `class="sk-light"`, never `data-theme="light"` — the
  attribute form activates nothing (#93).

## Success criteria

- **SC-001**: All five primitives exist as `packages/styles/src/<name>/sk-<name>.css` with
  **generated** barrels. Asserted by `node scripts/build-styles-only-markup.mjs --check` passing on
  a clean tree, and by the generated barrels containing one export per authored `.html`.
- **SC-002**: Every primitive is demonstrated over **real** `<dl>` / `<details>` / `<table>` / `<a>`
  markup in its stories — verified by grepping the authored `.html` for the native tag, not by
  reading the story titles.
- **SC-003**: The narrow-width table keeps its headers and is keyboard-reachable: at a narrow
  viewport the scroll container is focusable, has an accessible name, and `<th scope>` association
  is intact.
- **SC-004**: `packages/styles/src/index.ts` exports every new primitive. Verified by importing the
  package entry point and asserting each generated export name resolves — the drift #156 leaves
  ungated, and the one that already bit `SkGridGap4HTML`.
- **SC-005**: The forced-colors baseline is committed and demonstrated: with forced colors emulated,
  the skip link on focus, the disclosure marker and the table borders all remain perceivable.
- **SC-006**: No `--sk-status-*` or `--sk-chart-*` token is introduced. Verified by grep against
  `packages/tokens/src/tokens.css`.
- **SC-007**: Normal gates pass — stylelint, htmlhint, axe, and the generated-artifact `--check`
  scripts. Before the final gate the branch rebases on the current train and regenerates shared
  artifacts (epic #183, and #176's own exit criteria).

## Out of scope

Sorting, filtering, pagination, virtualization, row-selection state, column resizing, sticky
columns, and any JavaScript. Any `sk-*` custom element. Status or semantic tone colouring. Team
Kitty or Factory Dashboard domain copy. A generic `sk-data-table` **element** — epic #183 forbids
it; #149 remains the specialised transition matrix.

## Deferred questions

- **The per-directory drift in `packages/styles/src/index.ts` stays open.** This mission adds five
  lines to a hand-maintained list that no gate checks. Closing that hole is #156's, and SC-004
  proves only that *this* mission's exports are present, not that the next one's will be.
