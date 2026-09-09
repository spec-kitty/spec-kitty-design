# Mission Specification: Mission Kanban K1–K6 pattern stories

**Mission Branch**: `kitty/mission-kanban-pattern-stories-01M22F6C`  
**Created**: 2026-09-09  
**Status**: Draft  
**Input**: [Issue #278](https://github.com/spec-kitty/spec-kitty-design/issues/278), child of
[epic #276](https://github.com/spec-kitty/spec-kitty-design/issues/276), with the approved Mission
Kanban UX evidence and completed mission research as supporting authority.

## Intent and boundaries

Provide an exact, durable Storybook demonstration of the approved Mission Kanban K1–K6 family by
composing the design system's existing public surfaces. The mission proves that one immutable
display fixture can present the same committed Work Package truth as a five-stage board, a compact
horizontally contained board, a ten-lane filter view, a snapshot warning, an observed-activity
overlay, and a stable empty board.

This is a pattern-story mission, not a new component mission. It must not publish or register an
`sk-mission-kanban` element, package export, framework wrapper, or application API. Team Kitty
continues to own checked state, counts, filtering, Apply/Clear behavior, persistence, query
parameters, lane vocabulary and reduction, routes, snapshot comparison, observations, reported
activity, and every data claim. The story fixture demonstrates supplied values without making
them design-system contracts.

Work Package Detail #279–#281 and Repository Ops Timeline #282–#284 are explicitly outside this
mission. No requirement, artifact, or implementation from those programmes is absorbed here.

## Terminology

- **Detailed lane**: One of the ten consumer-supplied Mission Kanban states: Genesis, Planned,
  Claimed, In progress, For review, In review, Approved, Done, Blocked, or Canceled.
- **Rendered stage**: One of the five scan columns: Planned, Doing, For review, Approved, or Done.
- **Committed state**: The exact saved detailed lane shown on a Work Package card and used by the
  supplied five-stage reduction.
- **Snapshot behind log**: Supplied notice content stating that a saved status summary and mission
  history disagree at the same commit. It is not a second revision or a calculated freshness
  result.
- **Observed activity**: A supplied, not-yet-pushed observation shown separately from committed
  state and never used to move a card.
- **Reported live activity**: A separately labelled consumer-supplied presence record; it is not
  committed state or an observed lane transition.
- **Immutable fixture**: The one deeply readonly root display-data source used by all K1–K6
  projections and evidence variants.
- **Overflowing board region**: A board whose rendered content genuinely exceeds its local
  viewport and therefore receives the accessible region/name/tab-stop triad.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - K1 populated five-stage desktop board (Priority: P1)

As a mission operator, I can scan all fifteen committed Work Packages across five ordered stages
while retaining each card's exact detailed lane, supplied agent profile, native Work Package route,
and optional tracker reference.

**Why this priority**: K1 establishes the common fixture, reduction, native structure, and truth
model on which every other approved state depends.

**Independent Test**: Render K1 alone and verify five named native lane sections in the order
Planned, Doing, For review, Approved, Done; direct ordered-list/list-item relationships; stage
counts `3/4/3/1/4`; fifteen unique cards; the exact detailed lane on every card; and functional
native route links with independent tracker links.

**Acceptance Scenarios**:

1. **Given** the approved fifteen-record fixture, **When** K1 renders, **Then** the five stages
   contain exactly 3, 4, 3, 1, and 4 Work Packages and total 15.
2. **Given** any K1 Work Package, **When** its card is inspected, **Then** its primary action is a
   native route named by its WP id, its exact committed detailed lane and supplied profile remain
   visible, and any supplied tracker reference is a separate control.
3. **Given** the fitting desktop board, **When** keyboard order is inspected, **Then** no redundant
   board-region tab stop is present and every actionable card or tracker route has visible focus.

---

### User Story 2 - K2 narrow horizontally contained board (Priority: P1)

As a mission operator using a narrow viewport or zoomed layout, I can move horizontally through
the same five-stage board inside the board itself without causing document-level horizontal
scrolling or clipping focused content.

**Why this priority**: The five-stage information architecture is useful only if compact and
zoomed layouts remain operable without collapsing the stages or hiding keyboard focus.

**Independent Test**: Render the K1 fixture in the approved compact shell at 390 CSS pixels and
verify that the board scroller alone owns horizontal overflow, is a named focusable region because
it genuinely overflows, initially shows one full lane plus a glimpse of the next, and keeps focus
visible while the document has no horizontal overflow.

**Acceptance Scenarios**:

1. **Given** a 390 CSS-pixel viewport, **When** K2 renders, **Then** the compact shell and all five
   ordered stages remain present and the board—not the document—owns horizontal scrolling.
2. **Given** keyboard navigation through K2, **When** focus enters the overflowing board, **Then**
   the named region is reachable and focused links are scrolled into view without clipping.
3. **Given** K2 at calibrated 200% zoom, **When** the page and board are exercised, **Then** the
   same local-containment and focus-visibility guarantees hold.

---

### User Story 3 - K3 ten detailed lane filters (Priority: P1)

As a mission operator, I can understand the approved filter composition: all ten detailed lanes
and their counts are exposed through native disclosure and checkbox semantics, with In review and
Blocked visibly selected and a fixed two-of-fifteen board projection.

**Why this priority**: K3 proves how the five-stage view can disclose consumer-supplied detailed
lane choices without turning the library into a filtering or query-state owner.

**Independent Test**: Render K3 alone and verify an open native disclosure containing one real
fieldset and legend, ten labelled native checkbox inputs in the approved order, exactly
`in_review` and `blocked` checked, separate Apply and Clear controls, and only WP10 and WP05 in the
fixed two-of-fifteen projection.

**Acceptance Scenarios**:

1. **Given** the ten detailed lanes, **When** K3 renders, **Then** the labels and derived counts are
   Genesis 0, Planned 2, Claimed 1, In progress 3, For review 2, In review 1, Approved 1, Done 4,
   Blocked 1, and Canceled 0.
2. **Given** the controlled K3 state, **When** its inputs are inspected, **Then** only In review and
   Blocked are checked and the board shows WP10 under For review and WP05 under Planned.
3. **Given** keyboard interaction with the disclosure and checkboxes, **When** a native checkbox
   is toggled, **Then** its browser-owned checked state responds normally but the fixed story board
   does not invent filtering, Apply/Clear, persistence, or query behavior.

---

### User Story 4 - K4 snapshot behind mission history (Priority: P1)

As a mission operator, I can see a supplied warning that the saved status snapshot is behind
mission history without mistaking that warning for another commit, a calculated comparison, or a
change to the committed board.

**Why this priority**: K4 preserves the approved distinction between a board's committed facts and
the evidence that its saved summary disagrees with mission history.

**Independent Test**: Render K4 alone and verify one attention notice beside the same commit
context and populated board as K1, with no second SHA, no computed age, and no changed card lane or
stage.

**Acceptance Scenarios**:

1. **Given** the K1 commit context, **When** K4 renders, **Then** exactly one snapshot-behind-log
   notice appears and the commit identifier is unchanged.
2. **Given** the snapshot notice, **When** the board is compared with K1, **Then** all fifteen
   committed records, detailed lane labels, stage placements, and counts remain identical.

---

### User Story 5 - K5 observed not-yet-pushed overlay (Priority: P1)

As a mission operator, I can distinguish WP03's committed `in_progress` state from the supplied
observation `lynn → for_review, not yet pushed` and from separately reported live activity.

**Why this priority**: K5 prevents uncommitted observations from being presented as authoritative
board state.

**Independent Test**: Render K5 alone and verify that WP03 remains in Doing with exact committed
lane `in_progress`, the observed record appears as explicitly labelled supporting content, and the
reported-live panel remains a separate labelled region.

**Acceptance Scenarios**:

1. **Given** WP03's observed record, **When** K5 renders, **Then** the card remains in Doing and
   retains `in_progress` as its committed lane.
2. **Given** the observed and reported-live records, **When** their accessibility structure and
   copy are inspected, **Then** each truth tier is separately labelled and neither overwrites or
   derives the other.
3. **Given** reduced-motion preferences, **When** K5 renders, **Then** all committed, observed, and
   reported-live information remains present without requiring animation, polling, or timers.

---

### User Story 6 - K6 stable empty five-stage board (Priority: P1)

As a mission operator, I can distinguish a valid mission with no Work Packages from a missing or
loading board because all five stages remain stable, named, and honestly empty.

**Why this priority**: Empty state is part of the approved family and must preserve the board's
information architecture without suggesting unsupported mutation actions.

**Independent Test**: Render K6 alone and verify five ordered named stage sections, each with a
zero count, an empty ordered list, adjacent inline empty-state copy, and no CTA; separately verify
the approved empty reported-live message.

**Acceptance Scenarios**:

1. **Given** the root fixture with an explicitly empty Work Package projection, **When** K6
   renders, **Then** all five stages remain in order with count zero and an empty native list.
2. **Given** any empty stage, **When** its structure is inspected, **Then** “No work packages in
   this stage.” is a sibling of its empty list rather than a fake list item.
3. **Given** no reported-live rows, **When** that region renders, **Then** it says “No live activity
   reported.” and offers no action or invented explanation.

### Edge Cases

- Genesis and Canceled are valid zero-count filter choices in the approved fixture. Genesis has no
  supplied stage mapping because it has no card; any non-empty unmapped detailed lane must fail a
  fixture guard rather than be placed by inference.
- Work Packages without tracker references retain a complete named native route and do not render
  an empty or placeholder tracker control.
- Long WP ids, agent-profile labels, repository/branch context, filter labels, and routes wrap or
  remain locally scrollable without document overflow, overlap, truncation of meaning, or clipped
  focus.
- A board receives region naming and a tab stop only when the rendered composition genuinely
  overflows. A fitting desktop board must not create a dead keyboard stop.
- Native checkbox interaction may alter the input's immediate checked state, but the K3 story does
  not recalculate its fixed projection until a hypothetical consumer supplies a new render.
- Snapshot-behind-log, observed activity, reported-live activity, and committed lane stay separate
  when more than one appears in the same composition.
- Forced-colors mode must retain perceivable boundaries, native controls, truth-tier labels,
  notices, and focus indicators without depending on hue alone.
- Reduced-motion mode must preserve all content and controls; the pattern introduces no required
  motion.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Exactly six approved states | The pattern family shall provide exactly the K1–K6 product states described in this specification; evidence variants may exercise themes and stress conditions without creating additional product states. | High | Open |
| FR-002 | One immutable source | All K1–K6 states shall derive from one deeply immutable root fixture; rendering or projection shall not mutate that fixture or a prior projection. | High | Open |
| FR-003 | Fixed five-stage model | The rendered stages shall be Planned, Doing, For review, Approved, and Done in that order. | High | Open |
| FR-004 | Detailed lane model | The fixture shall expose Genesis, Planned, Claimed, In progress, For review, In review, Approved, Done, Blocked, and Canceled in that order with the exact K1 counts `0/2/1/3/2/1/1/4/1/0`. | High | Open |
| FR-005 | Supplied reduction only | The fixture shall reduce Planned and Blocked to Planned; Claimed and In progress to Doing; For review and In review to For review; Approved to Approved; and Done and Canceled to Done. Genesis remains unmapped while empty. | High | Open |
| FR-006 | Exact K1 projection | K1 shall render exactly fifteen unique Work Packages with stage counts `3/4/3/1/4`, preserving supplied order, exact committed lane, agent profile, route, and optional tracker reference. | High | Open |
| FR-007 | Native card routes | Each Work Package primary action shall be a real native link using the consumer-supplied route and WP id; tracker links shall remain independent controls. | High | Open |
| FR-008 | Native board structure | Each stage shall be a named native section containing a heading, a direct ordered list, and direct list items; inline empty-state content shall be outside the list. | High | Open |
| FR-009 | Conditional overflow semantics | Only a genuinely overflowing board shall expose the accessible region/name/tab-stop triad; a fitting board shall omit the redundant tab stop. | High | Open |
| FR-010 | K2 compact containment | K2 shall show the K1 records in the current compact app-shell presentation at 390 CSS pixels, with horizontal overflow contained by the board rather than the document. | High | Open |
| FR-011 | K3 native filters | K3 shall use the public disclosure and checkbox-choice surfaces over native `details`, `fieldset`, `legend`, `label`, and `input type="checkbox"` semantics. | High | Open |
| FR-012 | K3 fixed selection | K3 shall mark exactly In review and Blocked checked and show a fixed two-of-fifteen projection containing only WP10 under For review and WP05 under Planned. | High | Open |
| FR-013 | Consumer-owned filter actions | K3 shall present separate Apply and Clear controls as inert or observable story actions only; the library shall not implement checked-state ownership, filtering, persistence, or query behavior. | High | Open |
| FR-014 | K4 same-commit warning | K4 shall add exactly one supplied snapshot-behind-log notice beside K1's unchanged commit and board, without adding a second SHA or computing freshness. | High | Open |
| FR-015 | K5 separate observation | K5 shall keep WP03 committed to `in_progress` and Doing while presenting `lynn → for_review, not yet pushed` as explicitly observed supporting content. | High | Open |
| FR-016 | Reported-live separation | Reported-live activity shall remain a separately named consumer-supplied region and shall not be combined with committed or observed Work Package state. | High | Open |
| FR-017 | K6 stable empty board | K6 shall retain all five ordered stage sections with zero counts, empty ordered lists, approved sibling empty copy, an honest empty reported-live message, and no CTA. | High | Open |
| FR-018 | Public composition | Every pattern shall compose only current public workflow-board/lane, disclosure, checkbox-choice, notice, empty-state, navigation, status, action-row route, and app-shell surfaces plus native HTML. | High | Open |
| FR-019 | Theme and stress evidence | The story family shall include separately addressable dark-first K1–K6 evidence plus required `LightMode`, long-content, forced-colors, and reduced-motion evidence. | High | Open |
| FR-020 | Direct verification seams | The Storybook-only module shall expose any immutable fixture and pure projection/render seams needed for focused tests while excluding those exports from the CSF story list and all public package surfaces. | Medium | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Accessibility conformance | Every added story shall report zero axe violations, and K1–K6 shall have reviewed accessibility-tree evidence covering names, roles, native section/list relationships, disclosure/fieldset/checkbox structure, link destinations, status labels, notices, and empty content. | Accessibility | High | Open |
| NFR-002 | Keyboard and focus | K1–K6 and stress evidence shall be operable by keyboard with visible focus; K2 and any other measured overflow state shall keep the focused item visible within its local scroller with no clipped focus. | Accessibility | High | Open |
| NFR-003 | Narrow and zoom containment | At 390 CSS pixels and at calibrated 200% browser zoom, document-level horizontal overflow shall be zero; any necessary horizontal overflow shall remain inside the named board scroller. | Responsive layout | High | Open |
| NFR-004 | Browser coverage | Required board, navigation, route, disclosure, checkbox, focus, and overflow assertions shall pass in the repository's Chromium, Firefox, and WebKit browser matrix. | Compatibility | High | Open |
| NFR-005 | Forced colors | Forced-colors evidence shall preserve all information, control boundaries, native checked state, route focus, notice prominence, and committed/observed/reported-live distinctions without color-only meaning. | Accessibility | High | Open |
| NFR-006 | Reduced motion | Reduced-motion evidence shall expose the complete state with no pattern-owned animation or transition required to understand or operate it. | Accessibility | Medium | Open |
| NFR-007 | Visual regression | Every K1–K6 story and each required theme/stress variant shall have a promoted visual baseline after direct inspection against the approved UX evidence; existing baselines shall remain unchanged unless an independently justified repository-wide update is required. | Visual quality | High | Open |
| NFR-008 | Determinism | Repeated projection and render of the same frozen input shall produce identical stage membership, order, counts, route values, truth-tier content, and snapshots. | Reliability | High | Open |
| NFR-009 | Repository quality gates | Targeted unit/behavior/accessibility/browser tests, lint, stylelint, affected builds, generated-surface ratchets, Storybook build, pattern-composition checks, and visual regression shall all pass with no hand-edited generated output. | Maintainability | High | Open |
| NFR-010 | Visual inspection | Every added Storybook story shall be rendered and visually inspected before acceptance; dark-mode K1–K6 are the product-approval views and LightMode shall satisfy repository theme convention. | Visual quality | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | Storybook-only distribution | The mission shall add pattern stories and fixture/test evidence only; it shall not publish or register `sk-mission-kanban`, add a package export, element manifest entry, framework wrapper, or public application API. | Architecture | High | Open |
| C-002 | Existing contracts only | The pattern shall reuse current public train components and documented native/CSS surfaces without private shadow-root access, copied component-owned classes, or duplicated component behavior. | Architecture | High | Open |
| C-003 | Consumer ownership | Team Kitty retains lane vocabulary and reduction, checked state, counts, filtering, Apply/Clear behavior, persistence, query parameters, route construction, snapshot comparison, observations, reported activity, and all data claims. | Ownership | High | Open |
| C-004 | No application machinery | No filtering engine, router, polling, timer, drag-and-drop, state store, backend adapter, mutation workflow, or application import may be introduced. | Scope | High | Open |
| C-005 | No inferred facts | The fixture shall not add titles, descriptions, blocked reasons, owners, dates, estimates, priorities, progress percentages, freshness claims, or any other unsupported data. | Data integrity | High | Open |
| C-006 | Native controls | The filter group shall use real native checkbox semantics and the route cards shall use the landed public action-row route mode; neither contract may be recreated locally. | Accessibility | High | Open |
| C-007 | Token authority | Pattern placement shall use existing authoritative `--sk-*` tokens for color, dimensions, spacing, motion, shadows, and typography; no raw design values may substitute for available tokens. | Design system | High | Open |
| C-008 | Generated surfaces | Generated CSS/module/barrel/manifest/wrapper artifacts shall not be edited by hand and shall remain unchanged unless repository generators produce a justified delta. | Tooling | High | Open |
| C-009 | One bounded delivery | The mission shall be sliced into exactly one Work Package and delivered through exactly one PR targeting `train/elements-first`. | Delivery | High | Open |
| C-010 | Adjacent programme exclusion | No Work Package Detail #279–#281 or Repository Ops Timeline #282–#284 implementation, artifact, component, or public API is in scope. | Scope | High | Open |

### Key Entities *(include if feature involves data)*

- **Mission Kanban fixture**: The single deeply immutable Storybook-only root record containing
  navigation/context labels, five stages, ten detailed lane choices, fifteen Work Packages,
  consumer-supplied routes, snapshot content, one observed overlay, reported-live records, and
  approved empty-state copy.
- **Rendered stage**: One ordered scan column that groups supplied committed detailed lanes without
  changing the exact lane shown on any card.
- **Work Package display record**: A supplied WP id and native route, exact committed lane, agent
  profile, optional tracker references, and at most one separately classified observation. It has
  no inferred title or planning metadata.
- **Snapshot record**: Opaque supplied same-commit notice content. It does not carry a comparison
  algorithm or alternate revision.
- **Observed activity record**: Opaque supplied not-yet-pushed content attached to one card but
  independent from its committed lane and stage placement.
- **Reported-live record**: Opaque supplied presence content in a separate labelled region.
- **Kanban projection**: A deterministic, deeply readonly story view derived from the root fixture;
  it is a test/render seam, not a filtering engine, state store, or public API.

## Negative Invariants

| ID | Forbidden outcome |
|----|-------------------|
| NI-001 | A public `sk-mission-kanban` element, package export, wrapper, manifest entry, or application-facing API exists after this mission. |
| NI-002 | A render, story interaction, or projection mutates the root fixture or a previously returned projection. |
| NI-003 | A Work Package route is rendered as a button, depends on a custom activation event, or loses native link behavior. |
| NI-004 | Committed state, snapshot mismatch, observed activity, and reported-live activity are merged into one status or allowed to overwrite one another. |
| NI-005 | The pattern invents a human title, blocked reason, owner, date, estimate, priority, percentage, route, freshness result, or backend capability. |
| NI-006 | The document scrolls horizontally, focus is clipped, or a fitting board receives a dead overflow-region tab stop. |
| NI-007 | Native section/list, details, fieldset/legend, label/checkbox, link, heading, or empty-state relationships are replaced with simulated semantics. |
| NI-008 | Pattern CSS reaches private component internals, copies owned component selectors, injects runtime CSS, or adds raw design values where authoritative tokens exist. |
| NI-009 | Any implementation or mission artifact for #279–#284 is created or modified. |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Exactly six product-state stories reproduce K1–K6 from one immutable fixture: K1 has
  15 cards and `3/4/3/1/4` stage counts; K3 has ten choices, exactly two selected, and WP05/WP10
  only; K4 retains the K1 commit; K5 retains WP03 in Doing/`in_progress`; and K6 retains five
  zero-count stages.
- **SC-002**: Every Work Package appears once, preserves its exact committed lane, uses its supplied
  native route, and contains no unsupported title, owner, reason, estimate, priority, or progress
  claim.
- **SC-003**: All added stories pass axe with zero violations, and reviewed accessibility trees
  prove the required section/list, disclosure, fieldset/checkbox, native link, truth-tier, notice,
  focus, and empty-state relationships.
- **SC-004**: K2, long-content evidence, and calibrated 200% zoom produce no document-level
  horizontal overflow or clipped focus; genuine board overflow remains locally contained,
  keyboard reachable, and named.
- **SC-005**: Dark-first K1–K6, `LightMode`, forced-colors, reduced-motion, and long-content evidence
  are separately addressable, rendered, visually inspected, and covered by promoted visual
  baselines.
- **SC-006**: Targeted unit, behavior, accessibility, three-browser, and visual tests pass together
  with lint, stylelint, affected builds, Storybook build, generated-surface ratchets, and pattern
  composition checks.
- **SC-007**: Public-surface comparison shows no new custom element, export, manifest registration,
  framework wrapper, public token, or Team Kitty behavior; legacy component behavior and generated
  surfaces remain intact.
- **SC-008**: Exactly one bounded Work Package and one PR deliver #278 against the refreshed
  `train/elements-first`, and no file or contract belonging to #279–#284 is touched.
