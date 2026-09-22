# Mission Specification: work package workflow board styles

**Mission Branch**: `mission/work-package-workflow-board-styles`

**Created**: 2026-09-06

**Status**: Draft

**Issue**: [#209](https://github.com/spec-kitty/spec-kitty-design/issues/209) `[TKW1] native workflow-board and lane styles — semantic Work Package overview layout` · child of [#208](https://github.com/spec-kitty/spec-kitty-design/issues/208) · tracks #125

**Base**: `train/elements-first@1f587b7`

**Input**: GitHub issue #209, squad tier C (pre-merge)

## Context

The dashboard demo currently expresses its workflow overview with page-local board and lane
classes. That presentation cannot be reused by another consumer, and its generic containers do
not themselves guarantee named lane sections, native ordered-list membership, truthful empty
lanes, or locally bounded horizontal overflow.

This mission defines two styles-only families over HTML that the consumer authors in light DOM:

- `.sk-workflow-board` and `.sk-workflow-board__scroller`;
- `.sk-workflow-lane`, `.sk-workflow-lane__header`, `.sk-workflow-lane__title`,
  `.sk-workflow-lane__count`, and `.sk-workflow-lane__list`.

The board surface presents an ordered set of named native lane sections without becoming a
Kanban application. The consumer remains responsible for all lane and item data, count
derivation, ordering, labels, tone, filtering, responsive selection, and item composition. The
design system is responsible only for reusable token-driven presentation, preserving native
semantics, and containing the board's overflow.

When the rendered board genuinely overflows, the scroller is a keyboard-reachable, named region.
When it does not overflow, that same element is neither a region nor a tab stop. This conditional
contract is consumer-authored because a styles-only surface cannot measure layout and change
attributes. A lane is always a native `<section>` named by its own native heading, and its items
are always direct native `<li>` children of its `<ol>`.

The linked Stitch T10 shell is inaccessible in this environment, but this does not block the
mission: issue #209 is the binding source and transcribes the approved T10 intent, states,
ownership boundaries, and required evidence. No unobserved pixel detail from Stitch is asserted
here.

## Semantic Contract

An overflowing composition has this consumer-authored structure:

```html
<div class="sk-workflow-board">
  <h2 id="work-package-board-title">Work Packages</h2>
  <div
    class="sk-workflow-board__scroller"
    role="region"
    aria-labelledby="work-package-board-title"
    tabindex="0"
  >
    <section class="sk-workflow-lane" aria-labelledby="lane-title">
      <header class="sk-workflow-lane__header">
        <h3 class="sk-workflow-lane__title" id="lane-title">
          Consumer lane label
        </h3>
        <span class="sk-workflow-lane__count" aria-label="2 work packages"
          >2</span
        >
      </header>
      <ol class="sk-workflow-lane__list">
        <li><!-- consumer-owned item composition --></li>
        <li><!-- consumer-owned item composition --></li>
      </ol>
    </section>
  </div>
</div>
```

The complete `role`/accessible-name/`tabindex` triad is present only after the consumer has
measured genuine horizontal overflow. A fitting board uses the same structure but omits all three
attributes from the scroller. Additional lanes repeat the native section structure as siblings in
consumer order. An empty lane retains an empty `<ol>` and places supplied empty content after it as
a sibling.

## User Scenarios & Testing _(mandatory)_

### User Story 1 — a consumer presents a semantic multi-lane overview (Priority: P1)

A dashboard author composes a labelled work overview from a visible board heading and a
consumer-ordered sequence of native lane sections. Each lane has its own native heading, a
supplied visible count, and a native ordered list whose direct list items contain consumer-owned
content.

**Why this priority**: this is the mission's complete reusable outcome. All later stories protect
this same native structure under overflow, empty, scale, theme, or viewport pressure.

**Independent Test**: render the populated five-lane reference and assert the board heading, lane
section/name associations, header/title/count elements, ordered lists, direct list-item
parentage, visible order, and accessibility-tree order without relying on any application code.

**Acceptance Scenarios**:

1. **Given** a populated five-lane board, **When** its DOM is inspected, **Then** each lane is a
   native `<section class="sk-workflow-lane">` whose `aria-labelledby` resolves to its own native
   heading carrying `.sk-workflow-lane__title` in the same light-DOM root.
2. **Given** any populated lane, **When** its work items are inspected, **Then** exactly one native
   `<ol class="sk-workflow-lane__list">` contains every work item as a direct native `<li>` child,
   and DOM, visual, and accessibility order agree.
3. **Given** the same board, **When** lane headings and count badges are read, **Then** all text and
   accessible wording are the consumer-supplied values and no stylesheet-generated label,
   punctuation, status, or count is present.
4. **Given** the public surface delivered by this mission, **When** its selectors are inventoried,
   **Then** it contains only the two class families named in Context, with no third workflow block,
   item class, domain-named lane class, or custom-element tag.

---

### User Story 2 — a keyboard and assistive-technology user can navigate real overflow (Priority: P1)

When the lane set is wider than its available space, a keyboard user can focus and horizontally
scroll the board region while the document itself never scrolls sideways. A screen-reader user
gets one meaningful board region, named lane sections, and native ordered-list counts and order.

**Why this priority**: bounded, keyboard-reachable overflow and intact native structure are the
central accessibility requirements in #209. A visually correct row of columns that creates a dead
tab stop, page overflow, or forged list semantics does not satisfy the mission.

**Independent Test**: constrain the populated board until `scrollWidth > clientWidth`, focus the
scroller, send horizontal keyboard input, and inspect both page geometry and the browser
accessibility tree.

**Acceptance Scenarios**:

1. **Given** a board whose measured scroller `scrollWidth` is greater than its `clientWidth`,
   **When** its scroller markup is inspected, **Then** it has `role="region"`, exactly one
   consumer-supplied accessible naming method, and `tabindex="0"` together.
2. **Given** that genuinely overflowing board, **When** focus is placed on the scroller and the
   user sends ArrowRight followed by ArrowLeft, **Then** its horizontal scroll position changes in
   the corresponding directions and focus remains visible.
3. **Given** any required board story, including long-content and narrow stories, **When** page
   geometry is measured, **Then** the document's horizontal scroll width does not exceed its
   viewport width; any horizontal overflow belongs only to `.sk-workflow-board__scroller`.
4. **Given** the overflowing reference in the accessibility tree, **When** its structure is
   inspected, **Then** there is one named board region, every lane is exposed as a section/region
   named by its own heading, and each ordered list exposes exactly its authored list items in
   source order.
5. **Given** a composition whose measured scroller does not overflow, **When** its markup and tab
   order are inspected, **Then** `role`, accessible-name attributes, and `tabindex` are all absent
   from the scroller, so it contributes neither a redundant region nor a dead tab stop.

---

### User Story 3 — empty, large, and long-content boards remain truthful and readable (Priority: P1)

A consumer can show all lanes empty, one lane empty among populated lanes, a lane with 50 items,
and unusually long lane and work-item labels without changing the semantic shape or losing
content.

**Why this priority**: #209 explicitly requires these states because they expose failures that a
happy-path visual cannot: fake list items, count drift, clipped focus, reordering, and page-level
overflow.

**Independent Test**: render the all-empty, one-empty-lane, 50-item, and combined long-lane-label/
long-work-item fixtures; compare supplied counts with direct list-item cardinality and inspect
containment, reading order, and visible empty content.

**Acceptance Scenarios**:

1. **Given** an empty lane with a supplied count of zero, **When** its DOM and accessibility tree
   are inspected, **Then** its `<ol>` remains present with zero `<li>`/listitem children and its
   consumer-supplied empty treatment is a sibling outside the list, not a fake work item.
2. **Given** the all-empty story, **When** all five lanes are inspected, **Then** all five remain
   named sections, all five contain an empty ordered list, every visible count is zero, and every
   empty message remains visible and outside its list.
3. **Given** the one-empty-lane story, **When** list cardinalities are compared with visible
   counts, **Then** the empty lane reports zero and the populated lanes each report exactly their
   own direct `<li>` count without altering lane order.
4. **Given** the 50-item story, **When** its scale lane is inspected, **Then** it contains exactly
   50 direct `<li>` children, exposes 50 listitems in source order, and its supplied visible count
   is `50`; no filtering or virtualization removes items.
5. **Given** the combined long-label-and-item story, **When** the narrowest supported story
   viewport is used, **Then** both texts remain available in full in the DOM and accessibility
   tree, visual wrapping does not overlap adjacent content, and page-level horizontal overflow is
   still absent.

---

### User Story 4 — mobile composition remains under consumer control (Priority: P1)

On a narrow route, the application chooses one lane and renders that one lane into the reusable
board composition. The styles arrange the supplied lane but do not choose it, retain hidden lane
state, or react to a filter control.

**Why this priority**: this is the ownership seam between #209 and #211/#214. Putting active-lane
state or filtering into the styles would couple a reusable presentation surface to Team Kitty's
application model.

**Independent Test**: render exactly one consumer-selected lane at the narrow story viewport and
confirm that the library receives one lane, displays one lane, adds no hidden peers or active-state
metadata, and creates no unnecessary overflow region.

**Acceptance Scenarios**:

1. **Given** a consumer has selected one lane, **When** the narrow composition renders, **Then**
   the scroller contains exactly that one supplied named section and the styles do not hide, add,
   select, or reorder any lane.
2. **Given** the single lane fits its scroller, **When** geometry and tab order are inspected,
   **Then** `scrollWidth <= clientWidth` and the complete region/name/tabindex triad is absent.
3. **Given** the mission's source and distributed examples, **When** they are inspected, **Then**
   they contain no active-lane value, filtering logic, responsive data selection, selector event,
   route state, or consumer vocabulary.

---

### User Story 5 — the same structure remains perceivable across color modes (Priority: P2)

A default-dark, light-theme, or forced-colors user sees the same board structure and can still
distinguish lane boundaries, empty treatment, and the focused overflowing scroller without
depending on a domain color assigned from a lane name.

**Why this priority**: theme and forced-colors coverage is a binding repository gate and #209
specifically requires lane boundaries and empty treatment to survive when background tone is not
available.

**Independent Test**: render the required default dark, `.sk-light`, and forced-colors stories
from identical semantic markup; compare a theme-dependent computed value between dark and light,
then verify structural boundaries and focus indication under forced colors.

**Acceptance Scenarios**:

1. **Given** the default-dark and `LightMode` stories, **When** their computed presentation is
   compared, **Then** at least one token-dependent surface/foreground value differs while their
   DOM, accessible names, lane order, and item counts remain identical.
2. **Given** `LightMode`, **When** its wrapper is inspected, **Then** it uses `class="sk-light"`
   and not an inert `data-theme="light"` wrapper or a component-level theme selector.
3. **Given** `forced-colors: active`, **When** the forced-colors story is inspected, **Then** lane
   boundaries, zero-item empty treatment, and the scroller's focus indicator remain visually
   distinct without `forced-color-adjust: none` and without relying on background hue alone.
4. **Given** any theme, **When** lane titles are changed to unrelated words, **Then** presentation
   tone does not change unless the consumer explicitly composes a separate existing toned surface.

### Edge Cases

- **Overflow changes after resize or content changes.** The consumer re-measures and keeps the
  scroller's region/name/tabindex triad synchronized as one state. This library does not observe,
  infer, or mutate that state.
- **A scroller receives only part of the overflow triad.** This is invalid consumer markup and is
  caught in maintained fixtures/documentation; the styles do not attempt to repair it.
- **A scroller has both `aria-label` and `aria-labelledby`.** Maintained fixtures use exactly one
  meaningful naming method, preferring the visible board heading; duplicate naming is not a
  supported reference pattern.
- **A lane's supplied count disagrees with its list length.** That is consumer data drift. All
  maintained examples reject it by comparing count text with direct `<li>` cardinality, but the
  styles do not calculate or correct the value.
- **All lanes are empty.** The board still has lanes and each lane still has an empty `<ol>`; an
  empty message never substitutes for the list or becomes a list item.
- **No lane is supplied.** This is outside the reference contract: a workflow board contains at
  least one named lane. The library does not invent a board-level empty state.
- **An item contains an existing interactive element.** The `<li>` owns list membership and the
  nested public element owns its own focus/activation contract. Lane CSS does not reach into its
  internals, and a focused descendant remains visible rather than being clipped.
- **Long unbroken consumer text.** It may wrap according to the consumer element's own public
  contract, but it may not enlarge the page beyond the viewport or change DOM/reading order.
- **Reduced-motion preference.** This mission has no motion, transition, animation, or smooth
  scrolling to suppress. A media block that disables nothing would not satisfy any requirement.

## Requirements _(mandatory)_

### Functional Requirements

| ID     | Title                                       | User Story                                                                                                                                                                                                                                                                                | Priority | Status |
| ------ | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------ |
| FR-001 | Exact board class family                    | As a consumer, I want `.sk-workflow-board` and `.sk-workflow-board__scroller` as the complete board class family, so that the overview and its overflow owner have one reusable public vocabulary.                                                                                        | High     | Open   |
| FR-002 | Exact lane class family                     | As a consumer, I want `.sk-workflow-lane`, `__header`, `__title`, `__count`, and `__list` as the complete lane class family, so that no domain-specific or item component is smuggled into the primitive.                                                                                 | High     | Open   |
| FR-003 | Conditional named board region              | As an assistive-technology user, I want a genuinely overflowing scroller to carry the complete `role="region"` + exactly-one-accessible-name + `tabindex="0"` triad, and a fitting scroller to carry none of it, so that I get a useful landmark and tab stop only when scrolling exists. | High     | Open   |
| FR-004 | Named native lane sections                  | As a screen-reader user, I want every `.sk-workflow-lane` applied to a native section whose `aria-labelledby` resolves to its own native `.sk-workflow-lane__title` heading in light DOM, so that each lane has a meaningful accessible name.                                             | High     | Open   |
| FR-005 | Native ordered-list membership              | As a screen-reader user, I want every lane list to be a native `<ol>` whose work items are direct native `<li>` children in consumer order, so that list count, item role, and ordering come from the platform rather than forged ARIA.                                                   | High     | Open   |
| FR-006 | Consumer-owned content and state            | As a library consumer, I want to supply lane definitions, labels, title levels and IDs, counts, lane/item order, item markup, empty copy, tone, filtering, and selected mobile lane, so that the styles own no Team Kitty domain or application state.                                    | High     | Open   |
| FR-007 | Truthful maintained counts                  | As a maintainer, I want every maintained example's visible lane count to equal the number of direct work-item `<li>` children in that lane, so that examples cannot teach contradictory visible and native counts.                                                                        | High     | Open   |
| FR-008 | Truthful empty lanes                        | As a user, I want zero-item lanes to retain a zero-item `<ol>` and show supplied empty content as its sibling, so that empty presentation never fabricates a work item.                                                                                                                   | High     | Open   |
| FR-009 | Keyboard-reachable local overflow           | As a keyboard user, I want a genuinely overflowing board scroller to accept focus, show focus, and respond to horizontal arrow input, so that every off-screen lane is reachable without making the page scroll sideways.                                                                 | High     | Open   |
| FR-010 | Consumer-controlled single-lane composition | As a mobile consumer, I want to render one selected lane into a one-lane arrangement that only affects presentation, so that selection and route/filter state remain outside the library.                                                                                                 | High     | Open   |
| FR-011 | Long-content and scale resilience           | As a user, I want long lane labels, long work-item labels, and a 50-item lane to remain readable and ordered without clipping focused content or overflowing the page, so that real data does not break the overview.                                                                     | High     | Open   |
| FR-012 | Color-mode resilience without domain tone   | As a forced-colors or themed user, I want lane boundaries, empty treatment, and focus indication to remain perceivable without lane-name color mapping, so that structure survives independently of hue and domain vocabulary.                                                            | High     | Open   |
| FR-013 | Required story catalogue                    | As a maintainer, I want separately addressable stories for `Populated`, `AllEmpty`, `OneEmptyLane`, `FiftyItems`, `LongLabelsAndItems`, `SingleLaneNarrow`, `ForcedColors`, `DefaultDark`, and `LightMode`, so that every state required by #209 is discoverable and testable.            | High     | Open   |
| FR-014 | Styles-only distribution                    | As a no-JavaScript consumer, I want the two style families and their native HTML examples available from the styles package's generated public barrels/subpaths, with no custom element or framework wrapper, so that native semantics remain consumer-authored and directly usable.      | High     | Open   |
| FR-015 | Consumer documentation                      | As a consumer, I want documentation of the exact native markup, conditional overflow triad, named-lane/list invariants, empty-lane pattern, and consumer-owned mobile selection, so that I can use the surface without reverse-engineering a story.                                       | High     | Open   |
| FR-016 | Visual evidence                             | As a reviewer, I want CI-authoritative visual baselines for the required board states, including dark, `LightMode`, narrow, long/scale, empty, and forced-colors conditions, so that visual regressions are reviewable despite the unavailable Stitch payload.                            | Medium   | Open   |

### Non-Functional Requirements

| ID      | Title                            | Requirement                                                                                                                                                                                                                                                                                                                                                                                                         | Category        | Priority | Status |
| ------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | -------- | ------ |
| NFR-001 | Token-only design values         | Every authored color, spacing, size, radius, border, typography, and focus design value in the two style families resolves through an authoritative `--sk-*` token. Any standards-defined system color needed only under `forced-colors: active` follows the repository's established forced-colors exception and is not used as an ordinary design value. No raw numeric/color fallback disguises a missing token. | Maintainability | High     | Open   |
| NFR-002 | Accessibility gate               | Axe-core reports zero WCAG 2.1 AA violations for every story added by this mission, including default dark, `LightMode`, empty, long-content, narrow, and forced-colors stories; a story that fails to load or renders no board fails rather than contributing a false zero.                                                                                                                                        | Accessibility   | High     | Open   |
| NFR-003 | Accessibility-tree fidelity      | Browser accessibility-tree evidence identifies exactly one named board region only in genuine-overflow fixtures, one named section/region per authored lane, and native list/listitem counts and order equal to the DOM fixture; decorative separators add no accessible text or node that changes those names/counts.                                                                                              | Accessibility   | High     | Open   |
| NFR-004 | Page containment                 | In every required story at its declared viewport, `document.scrollingElement.scrollWidth <= document.scrollingElement.clientWidth`; in the genuine-overflow story, the board scroller simultaneously satisfies `scrollWidth > clientWidth`.                                                                                                                                                                         | Accessibility   | High     | Open   |
| NFR-005 | Browser-operable overflow        | The genuine-overflow focus/ArrowRight/ArrowLeft and page-containment assertions pass in all browser projects configured by the repository's Playwright suite; accessibility-tree details that are engine-specific are additionally demonstrated in at least one real browser engine.                                                                                                                                | Compatibility   | High     | Open   |
| NFR-006 | Deterministic generated surfaces | A fresh styles-only generation pass reproduces the distributed HTML-example barrels byte-for-byte, and the package root exports and component subpaths resolve without hand-edited generated output.                                                                                                                                                                                                                | Reliability     | High     | Open   |
| NFR-007 | Theme evidence is real           | The `LightMode` story is wrapped by `.sk-light`, and at least one paired token-dependent computed value differs from `DefaultDark`; story names or background parameters alone are not acceptance evidence.                                                                                                                                                                                                         | Testability     | High     | Open   |
| NFR-008 | No console errors                | Every required story loads with a non-empty board root and no browser console error in the Storybook verification surface.                                                                                                                                                                                                                                                                                          | Reliability     | Medium   | Open   |

### Constraints

| ID    | Title                                  | Constraint                                                                                                                                                                                                                                                                                          | Category        | Priority | Status |
| ----- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | -------- | ------ |
| C-001 | Styles-only native surface             | No custom element, shadow root, `::part()`, manifest entry, generated React/Vue wrapper, element ratchet, behaviour subject, or mutation subject is created for workflow board or lane.                                                                                                             | Architecture    | High     | Open   |
| C-002 | No adjacent child implementation       | This mission implements none of #211's select surface, #212's action-row/marker/pulse/inline-empty extensions, or #214's integrated overview/detail pattern. Existing public surfaces may appear only as opaque consumer composition in examples.                                                   | Scope           | High     | Open   |
| C-003 | No Kanban or work-item component       | No `sk-kanban`, `sk-work-package-card`, workflow-item class family, full-page overview element, lane array/property, or board data model is introduced.                                                                                                                                             | Scope           | High     | Open   |
| C-004 | No workflow behaviour                  | No drag/drop, keyboard reordering, lane transition, animation, smooth scrolling, filtering, virtualization, timer, polling, routing, observer, resize handler, or active-lane state is introduced.                                                                                                  | Scope           | High     | Open   |
| C-005 | No domain vocabulary or tone ownership | The styles do not parse lane names or positions, generate status text, assign domain colors, or take ownership from #177's status-tone surface.                                                                                                                                                     | Scope           | High     | Open   |
| C-006 | Native semantics remain direct         | No custom-element host or extra semantic role intervenes between an `<ol>` and its `<li>` children; no ARIA `grid`, `row`, `list`, `listitem`, `listbox`, or option roles replace the native section/heading/list structure.                                                                        | Accessibility   | High     | Open   |
| C-007 | Source independence                    | The authored source depends only on the styles/tokens foundation and is independently deliverable from #210, #211, #212, and #213; #214 remains downstream for integrated proof.                                                                                                                    | Delivery        | High     | Open   |
| C-008 | Visual details require evidence        | The inaccessible Stitch shell is not treated as authority for unobserved pixel values. Any missing lane-layout design value is introduced through the authoritative token surface and calibrated against browser evidence during planning/implementation, not copied from page-local demo literals. | Governance      | High     | Open   |
| C-009 | Generated outputs are not hand-edited  | Authored examples are the source for generated styles-only barrels and documentation references; generated barrels or other derived outputs are regenerated through the repository workflow and never edited directly.                                                                              | Maintainability | High     | Open   |

### Key Entities

- **Workflow board**: a grouping root containing a visible board heading and one board scroller. It
  owns no ARIA role or state itself.
- **Board scroller**: the only horizontal-overflow owner. Its role/name/tabindex attributes form
  one conditional state controlled by measured geometry and authored by the consumer.
- **Workflow lane**: a consumer-ordered native named section with one header, one native heading,
  one supplied count, and one ordered list.
- **Workflow item**: a direct native `<li>` whose content and behavior are opaque to these styles.
- **Empty lane presentation**: a zero-item ordered list followed by consumer-supplied empty content
  as a sibling, never as a fabricated list item.

## Negative Invariants

These absence requirements are acceptance gates, not descriptive non-goals.

| ID     | Forbidden outcome                                                                                                                                                     | Evidence that must go red if introduced                                                                       |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| NI-001 | Any workflow-board/lane custom element, element registration, wrapper, manifest/ratchet entry, behavior subject, or mutation subject                                  | Diff/source inventory asserting styles-only output and the absence of a matching element surface              |
| NI-002 | Any public workflow class outside FR-001/FR-002, including item classes or lane-name/status modifiers                                                                 | Public-selector inventory compared with the exact allowed set                                                 |
| NI-003 | Any generated label, count, separator text, status, or punctuation that changes an accessible name/count                                                              | CSS/source scan plus accessibility-tree names and counts                                                      |
| NI-004 | Any ARIA grid/listbox or forged list/listitem semantics, or any non-`li` direct child presented as a work item                                                        | DOM direct-parent assertions plus accessibility-tree role/count/order assertions                              |
| NI-005 | Any app-owned lane array, count derivation, tone map, filter, active-lane/mobile selection, timer, routing, drag/drop, transition, animation, or virtualization logic | Comment-stripped source scan over the mission delta, paired with exact public-surface inspection              |
| NI-006 | A non-overflowing scroller exposed as a region or tab stop, or an overflowing scroller missing any member of the triad                                                | Paired true-overflow/non-overflow geometry fixtures asserting all-or-none attributes and tab order            |
| NI-007 | Horizontal overflow escaping to the page in any required state                                                                                                        | Browser geometry assertion on every required story                                                            |
| NI-008 | A zero-count empty message represented as a list item, or maintained visible count/list cardinality drift                                                             | Per-lane DOM and accessibility-tree cardinality checks across empty, one-empty, populated, and 50-item states |
| NI-009 | A raw design value, unrelated token alias, component theme selector, inert light-mode wrapper, or `forced-color-adjust: none`                                         | Token/style lint, token-resolution checks, and computed dark/light/forced-colors evidence                     |
| NI-010 | Implementation of #211, #212, or #214 hidden inside examples or docs                                                                                                  | Delta review against the exact class/public surface and child-issue ownership boundaries                      |

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The distributed public selector inventory is exactly the seven selectors in
  FR-001/FR-002; the single-lane arrangement reuses that surface, and no selector names a lane
  domain value or work item.
- **SC-002**: The populated five-lane reference exposes five named native sections, five native
  ordered lists, and each list's exact authored number and order of native listitems in both DOM
  and accessibility-tree evidence.
- **SC-003**: The true-overflow reference simultaneously proves `scrollWidth > clientWidth`, the
  complete region/name/tabindex triad, visible keyboard focus, ArrowRight/ArrowLeft scroll
  movement, and page `scrollWidth <= clientWidth`.
- **SC-004**: A non-overflow control and the single-lane narrow story both prove
  `scrollWidth <= clientWidth`, absence of all three scroller semantic attributes, and absence of
  a scroller tab stop.
- **SC-005**: All-empty has five zero-item lists and one-empty has exactly one zero-item list;
  every empty message is a sibling outside its list and every visible count equals direct `<li>`
  cardinality.
- **SC-006**: The 50-item story exposes exactly 50 direct native listitems in source order with a
  supplied count of `50`, and no item is filtered, virtualized, or reordered.
- **SC-007**: The long-label-and-item and single-lane narrow stories keep all authored text in the
  DOM/accessibility tree, avoid overlap and focus clipping, and add no page-level horizontal
  overflow.
- **SC-008**: Axe reports zero WCAG 2.1 AA violations across every story in FR-013, and each story
  produces a non-empty board root with no browser console errors.
- **SC-009**: Default dark and `LightMode` share identical semantic markup while a computed paired
  token value demonstrably differs; `LightMode` uses `.sk-light`.
- **SC-010**: Under forced-colors emulation, lane boundaries, empty treatment, and the scroller's
  focus indicator remain perceivable, while accessibility names/counts and page containment remain
  unchanged.
- **SC-011**: Styles-only HTML exemplars, generated barrels, root exports, subpaths, and consumer
  documentation all describe the same exact native markup and conditional-overflow contract; a
  regeneration check reports zero drift.
- **SC-012**: All NI-001 through NI-010 checks pass against the final mission delta, proving that
  no adjacent feature, application state, raw design value, forged semantics, or custom-element
  surface entered scope.

## Traceability

| Source                              | Binding concern                                                                                                                     | Specification coverage                                 |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Issue #209 — Outcome                | Exact board/lane styles families over consumer-authored native HTML                                                                 | Context; FR-001, FR-002, FR-014; C-001; SC-001, SC-011 |
| Issue #209 — Contract and states    | Consumer ownership, named native sections/lists, conditional overflow, single-lane mobile, empty/long/50-item states, forced colors | User Stories 1–5; FR-003–FR-012; SC-002–SC-010         |
| Issue #209 — Required stories/tests | Nine required story states, axe, accessibility tree, browser containment/keyboard evidence, generated artifacts/docs                | FR-013–FR-016; NFR-002–NFR-008; SC-003–SC-011          |
| Issue #209 — Dependencies/non-goals | Foundation-only dependency; no Kanban, domain/app state, adjacent child work, or tone ownership                                     | C-002–C-007; NI-001–NI-010; SC-012                     |
| Epic #208                           | Library/application ownership seam and #214 downstream integration                                                                  | FR-006, FR-010; C-002, C-005, C-007                    |
| Research R-01/R-02                  | Styles-only architecture; native named lanes and direct lists                                                                       | FR-001, FR-002, FR-004, FR-005, FR-014; C-001, C-006   |
| Research R-03/R-04                  | Conditional scroller triad and consumer-supplied labels/counts/order                                                                | FR-003, FR-006, FR-007, FR-009; NFR-003–NFR-005        |
| Research R-05/R-06                  | Empty list truthfulness and opaque item composition                                                                                 | FR-008, FR-011; C-002, C-006; NI-004, NI-008           |
| Research R-07/R-08                  | Consumer-controlled single-lane composition and neutral presentation                                                                | FR-010, FR-012; C-004, C-005                           |
| Research R-09/R-10                  | Authoritative layout token; no motion; forced-colors/theme evidence                                                                 | NFR-001, NFR-007; C-004, C-008; NI-009; SC-009, SC-010 |
| ADR-9/10/11 and authoring recipe    | Token styling API, native-semantics styles-only class, generated-output discipline, browser/axe/visual verification                 | FR-014–FR-016; NFR-001–NFR-008; C-001, C-009           |

## Decisions and Remaining Calibration

There are **no unresolved product or architecture decisions** in this specification. Issue #209,
epic #208, ADR-9/10/11, and research R-01 through R-10 settle the styles-only boundary, semantic
structure, conditional accessibility state, ownership split, and verification obligations.

One implementation calibration remains deliberately open: the exact value and final name of the
authoritative lane minimum-inline-size token. Planning must identify the token surface, and
implementation must select its value from browser measurements of the five-lane, 220–360px item,
long-content, and single-lane narrow evidence. This is a reversible token calibration inside the
accepted architecture, not permission to copy raw dashboard demo dimensions or to introduce a
new product/architecture decision.
