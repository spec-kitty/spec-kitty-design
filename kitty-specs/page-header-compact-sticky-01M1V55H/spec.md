# Mission Specification: page header compact sticky

**Mission Branch**: `mission/page-header-compact-sticky`
**Created**: 2026-09-06
**Status**: Draft
**Input**: GitHub issue #182 — "[elements] sk-page-header compact sticky variant — refresh metadata and trailing action, after #145"

## Context

`sk-page-header` already exists on `train/elements-first`, landed by #145 (merged). It declares five
slots — `eyebrow`, `title`, `supporting`, `sync`, `actions` — eight `::part()`s, and **no reactive
property at all**. Its authored CSS at `packages/styles/src/page-header/sk-page-header.css` contains
no `compact`, no `sticky` and no `position` declaration.

This mission adds two orthogonal reflected axes to that same element and that same authored CSS. It
creates no new element and does not change the default header's rendering.

### One premise in #182 is stale and is not carried forward

#182 records, against `spec-kitty-design@fc3f9bc`, that reduced-motion and forced-colors baselines
"do not appear anywhere in the packages or demo apps" and asks this mission to consume the baseline
a styles-primitives issue would establish. That baseline **landed in #176** and is on the train
today. Measured on `train/elements-first@65a92f6`:

| baseline | files on the train |
|---|---|
| `@media (forced-colors: active)` | `packages/styles/src/data-table/sk-data-table.css`, `.../disclosure/sk-disclosure.css`, `.../skip-link/sk-skip-link.css` |
| `@media (prefers-reduced-motion: reduce)` | `.../disclosure/sk-disclosure.css`, `.../skip-link/sk-skip-link.css`, `.../transition-matrix/sk-transition-matrix.css` (the last guards `scroll-behavior` and is documented in the recipe as disabling nothing) |

`docs/contributing/adding-a-component.md` is the canonical owner of both conventions. This mission
therefore **matches the established shape** and records no missing baseline.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — the page keeps its identity on a long list (Priority: P1)

An operator scrolls a 200-row run list. The page header is authored once, with `compact` and
`sticky` set. As the list scrolls, the header stays at the top of the scroll region carrying the
page title, the consumer-supplied freshness string, the consumer-supplied live/paused indicator and
the trailing refresh control. Nothing about the header is authored twice.

**Why this priority**: it is the defect the mission exists to remove — at
`factory-dashboard@1fb95bc` a sticky toolbar is a *second* block of markup beside the full header,
and the two drift.

**Independent Test**: mount one `sk-page-header` with the five slots filled, set `density="compact"`
and `sticky`, and assert every slot still resolves to the same assigned nodes and the trailing
action still has a non-zero box and takes focus.

**Acceptance Scenarios**:

1. **Given** a header with all five slots filled, **When** `density="compact"` and `sticky` are set,
   **Then** all five slots resolve to exactly the same assigned nodes as at the default density.
2. **Given** a compact sticky header, **When** the actions slot holds a control, **Then** that
   control has a non-zero bounding box and receives focus on `focus()`.

---

### User Story 2 — two axes, chosen independently (Priority: P1)

A consumer wants a compact header that does not stick (a dense page that fits), and elsewhere a
default-density header that does stick. Neither choice implies the other.

**Why this priority**: #182's public contract states the axes are orthogonal; a single `variant`
enum would make three of the four combinations unreachable.

**Independent Test**: drive all four combinations and assert each axis's observable effect is
present or absent independently of the other.

**Acceptance Scenarios**:

1. **Given** `density="compact"` with no `sticky`, **When** the element updates, **Then** the header
   box carries the compact modifier and the host is not a sticky box.
2. **Given** `sticky` with no `density`, **When** the element updates, **Then** the host is the
   sticky box and the header box carries no compact modifier.
3. **Given** either axis set by property, **When** the element updates, **Then** the matching
   attribute is present; and setting the attribute directly sets the property.

---

### User Story 3 — a keyboard user is never trapped behind the header (Priority: P1)

A keyboard user tabs down a page under a sticky header. The browser scrolls each focused control
into view; without a scroll margin the sticky header covers it (WCAG 2.4.11).

**Why this priority**: an accessibility failure, and the one the issue names by number.

**Independent Test**: assert the header publishes a documented `scroll-margin` value derived from
its own sticky offset and compact block size, so a consumer applies a named value rather than
guessing an offset; and assert the derivation in the token source.

**Acceptance Scenarios**:

1. **Given** the sticky header, **When** a consumer applies the documented scroll-margin token to
   their content's focusable elements, **Then** a focused element scrolled into view clears the
   header's sticky footprint.
2. **Given** the token source, **When** the sticky offset or the compact block size changes,
   **Then** the scroll-margin token changes with it because it is defined in terms of both.

---

### User Story 4 — a short or narrow viewport gets no sticky header (Priority: P2)

On a narrow viewport, or one too short to spare the room, the header stops sticking and reflows to a
stacked layout. Title, metadata and the trailing action are all still present and reachable.

**Why this priority**: a sticky header eating a third of a short viewport is worse than none, and
dropping the action to make room is the failure this explicitly forbids.

**Independent Test**: at the behaviour lane's own viewport (414px wide — measured, not assumed, and
already relied on by `fixtures/elements-behaviour/src/sk-grid.test.ts`), assert the host computes
`position: static` even with `sticky` set, and that the text group, the metadata group and the
action are all laid out with non-zero boxes.

**Acceptance Scenarios**:

1. **Given** `sticky` is set and the viewport is 720px wide or narrower, **When** styles compute,
   **Then** the host's computed `position` is `static`.
2. **Given** the same, **When** the header reflows, **Then** the metadata group follows the text
   group, and the slotted action still has a non-zero box.
3. **Given** a viewport 480px high or shorter, **When** styles compute, **Then** stickiness is
   dropped by the same mechanism.

---

### User Story 5 — freshness is the consumer's, always (Priority: P1)

The `sync` slot carries "updated 12s ago" and a slotted status indicator. The element renders both
verbatim and never learns what they mean.

**Why this priority**: #145 bound this and #182 restates it because a sticky live header is exactly
where a timer gets added by reflex. Several `factory-dashboard` pages each run their own.

**Independent Test**: a static scan of the element's own source, with comments stripped, for any
scheduling, clock, observer or scroll-listener API; plus a runtime spy proving none is called.

**Acceptance Scenarios**:

1. **Given** the element source with comments removed, **When** it is scanned, **Then** it contains
   no `setInterval`, `setTimeout`, `requestAnimationFrame`, `Date` read, `performance.now`,
   `IntersectionObserver` or scroll listener.
2. **Given** a mounted compact sticky header, **When** time advances and the element re-renders,
   **Then** the sync text is byte-identical and no clock or scheduling API was called.

---

### Edge Cases

- **An unknown `density` value.** Renders the default density and warns, matching `sk-grid`'s
  documented degrade-don't-throw behaviour. It never throws: a throwing `render()` makes Lit reject
  `updateComplete` and paints a shadow root with no `<slot>`, silently eating the consumer's
  light-DOM children.
- **A long title and a long sync string in compact.** Both truncate visually and stay complete in
  the DOM, so assistive technology reads the whole string.
- **Pressure on the compact row.** The trailing action never shrinks; the sync text truncates first.
  Nothing is dropped.
- **Forced colors with a sticky header.** `box-shadow` computes away entirely under
  `forced-colors: active`, so a shadow-only separator disappears. A reserved border band carries it.
- **`prefers-reduced-motion: reduce`.** The density transition is suppressed and the compact form is
  fully readable without it.
- **An empty header.** All five slots render with no assigned nodes at either density, as today.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Reflected density axis | As a consumer, I want a `density` attribute/property whose `compact` value reduces the header's density from the same slots, so that I author one header. | High | Open |
| FR-002 | Reflected sticky axis | As a consumer, I want a boolean `sticky` attribute/property that makes the host itself the sticky box, so that stickiness works inside whatever scroll region the shell gives it. | High | Open |
| FR-003 | The axes are orthogonal | As a consumer, I want density and sticky to be independent, so that all four combinations are reachable and neither axis reads the other. | High | Open |
| FR-004 | One authored source | As a maintainer, I want the compact form resolved from the same five slots and the same authored CSS and template, so that no second header markup can drift. | High | Open |
| FR-005 | Trailing action placement | As a consumer, I want the actions slot placed trailing in the compact form and guaranteed not to shrink, so that the refresh control stays reachable while sticky. | High | Open |
| FR-006 | Responsive non-sticky reflow | As a user on a narrow or short viewport, I want stickiness dropped and the header stacked with title, metadata and action all present, so that the header never eats the page. | High | Open |
| FR-007 | Documented scroll-margin contract | As a consumer, I want a named scroll-margin value derived from the header's own sticky offset and compact block size, so that focused content is not obscured and I do not guess an offset. | High | Open |
| FR-008 | Token-only sticky geometry | As a maintainer, I want the sticky offset, stacking layer, compact block size and elevation to reference `--sk-*` tokens added to the token source, so that nothing is hardcoded. | High | Open |
| FR-009 | Reduced-motion suppression | As a motion-sensitive user, I want the density transition suppressed under `prefers-reduced-motion: reduce`, so that a density change is instant and still readable. | Medium | Open |
| FR-010 | Forced-colors separation | As a forced-colors user, I want the sticky header separated from the content beneath by a system-coloured border rather than a shadow, so that it stays distinguishable. | Medium | Open |
| FR-011 | No liveness in the element | As a maintainer, I want a test that reds if any scheduling, clock, observer or scroll-listener API enters the element, so that the freshness boundary is enforced rather than asserted. | High | Open |
| FR-012 | Surfaces and generated artefacts | As a maintainer, I want the ratchets, stories, manifest, React wrappers, Vue types and size report updated in the same change, so that CI's drift gates pass. | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Bounded published surface | The element's published attribute count grows by exactly two (`density`, `sticky`); `expected-docs.json` records the exact figure and no other element's counts move. | Maintainability | High | Open |
| NFR-002 | Accessibility gate | Zero axe-core WCAG 2.1 AA violations across every story this mission adds, measured by the repository's own a11y job. | Accessibility | High | Open |
| NFR-003 | Mutation-harness budget | `scripts/suite-selftest.mjs` stays under the committed `selftestCeilingSeconds`; if the added mutations breach it, the ceiling is raised only with the CI run that justifies it, recorded as a measurement row. | Performance | Medium | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | Tone-free | No `--sk-status-*` token family is invented. The live/paused indicator is a slotted element the consumer supplies; the header ships no toned surface. | Technical | High | Open |
| C-002 | No new element, no shell change | No `sk-sticky-header`, `sk-page-toolbar`, `sk-app-bar` or `sk-toolbar`. `sk-app-shell` is not modified; where the shell and the header must agree on a scroll container, the contract is documented once, on the header. | Technical | High | Open |
| C-003 | ADR records and index untouched | No ADR record's content or Status changes, and neither `docs/architecture/README.md`'s ADR table nor `scripts/check-adr-index.mjs` is touched — #193 owns them and gates them. | Technical | High | Open |
| C-004 | Registry ids are fixed | `behaviours.json`'s applicable id set is asserted equal to ADR-11's list by `tests/node/config-contract.test.ts`, and `suite-selftest.mjs` guard 7 refuses a mutation naming an undeclared behaviour. No new `SC-` id is minted here; a behaviour with no registry home is filed as an issue with the measurement. | Technical | High | Open |

### Key Entities

- **Density axis (`density`)**: a reflected string attribute/property. `"compact"` is the only
  non-default value; anything else renders the default density and warns.
- **Sticky axis (`sticky`)**: a reflected boolean attribute/property. When present, the **host** is
  the sticky box — an inner box cannot stick, because its containing block is the host and it has no
  room to move within it.
- **Sticky geometry tokens**: sticky offset, stacking layer, compact block size, and the derived
  scroll-margin the consumer applies to their own content.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: One `sk-page-header` carries both axes; `git ls-files packages/elements/src` gains no
  new element directory and `packages/styles/src` gains no new stylesheet.
- **SC-002**: All four (density × sticky) combinations are asserted, each by an observable that the
  other axis does not change.
- **SC-003**: `density` and `sticky` round-trip attribute→property and property→attribute, and a
  value assigned before upgrade survives it — with a registered mutation per axis that reds the
  named `[SC-010]` test.
- **SC-004**: At the behaviour lane's 414px viewport the host with `sticky` computes
  `position: static`, and the adopted sheet declares `position: sticky` for `:host([sticky])`
  outside the drop blocks and `position: static` inside each of the two drop blocks.
- **SC-005**: In the narrow reflow the metadata group follows the text group and the slotted action
  keeps a non-zero box and takes focus.
- **SC-006**: The element source, comments stripped, matches none of the scheduling/clock/observer/
  scroll-listener patterns, and the stripped source still contains `class SkPageHeader` so the scan
  cannot pass vacuously.
- **SC-007**: Every `--sk-*` custom property the sheet references resolves in
  `packages/tokens/src/tokens.css` — enforced by `scripts/check-element-css-hygiene.mjs`.
- **SC-008**: `expected-parts.json`, `expected-docs.json`, `expected-stories.json`, `behaviours.json`
  and `mutations.json` all record the change, and `custom-elements.json`, `packages/react/src`,
  `packages/elements/vue.d.ts` and `packages/elements/SIZES.md` are regenerated with no drift.
