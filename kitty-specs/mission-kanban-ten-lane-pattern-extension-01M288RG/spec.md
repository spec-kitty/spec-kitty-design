# Mission Specification: Mission Kanban ten-lane pattern extension

**Mission Branch**: `mission/mission-kanban-ten-lane-pattern-extension`  
**Created**: 2026-09-11  
**Status**: Draft  
**Input**: [Issue #395](https://github.com/spec-kitty/spec-kitty-design/issues/395) (TKK3), child of the
reopened [epic #276](https://github.com/spec-kitty/spec-kitty-design/issues/276), with the Family 2
"Repository and Mission dossier" corpus (`ux_redesign/families/02-repository-mission`, screens K1–K6,
`COPY-CATALOG.md`, `IMPLEMENTATION-HANDOFF.md`, `DESIGN-LIBRARY-PROGRAMME-HANDOFF.md`) as the
approved-candidate authority. Planning base: `origin/train/elements-first@0a232a01`.

## Intent and boundaries

Closed #278 proved a **five-stage reduction** of the Mission Kanban: its immutable fixture already
carries the ten canonical detailed lanes, the fifteen committed Work Packages, and their exact lane
counts, but `deriveMissionKanban()` groups them into Planned, Doing, For review, Approved, and Done
before rendering. Family 2 instead renders **all ten canonical lanes in source order** and makes the
supplied `Presence · unverified` overlay tier visibly legible on the affected Work Package.

This mission adds that ten-lane projection as an **additive** Storybook-only pattern family. It
reads the #278 fixture as its single source of committed truth and renders it through already
published surfaces. It changes nothing about #278: the ten five-stage stories, their story ids,
their focused tests, and their ten visual baselines remain byte-identical.

It is not a component mission. No Kanban, page, lane, card, badge, overlay, filter, or overflow
element, export, wrapper, token, hook, observer, or helper API is published. Team Kitty keeps lane
vocabulary and order, grouping choice, counts, GET/query parsing, filtering, snapshot comparison,
overlay selection, truth classification, reported-live acquisition, routes, polling, clocks,
relative time, application copy/i18n, and every mutation. The fixture demonstrates supplied values;
it does not make any of them a design-system contract.

Work Package Detail and Repository Ops Timeline programmes run in parallel and are out of scope.

## Terminology

- **Canonical detailed lane**: one of the ten consumer-supplied lanes, in supplied order: Genesis,
  Planned, Claimed, In progress, For review, In review, Approved, Done, Blocked, Canceled.
- **Base fixture**: #278's exported, deeply frozen `MISSION_KANBAN_FIXTURE`. It is the only source
  of lanes, Work Packages, routes, profiles, tracker references, commit context, snapshot content,
  and reported-live records for this mission.
- **Ten-lane extension fixture**: a new deeply frozen, Storybook-only record that supplies only
  what the base fixture does not: the ten-lane composition copy (plain strings and consumer-owned
  formatter functions), the unverified overlay claim, and long-content stress strings. It restates
  no lane, count, Work Package, route, or commit.
- **Ten-lane projection**: a pure, deterministic, deeply frozen view derived from the base and
  extension fixtures. It performs no stage reduction.
- **Committed state**: the exact saved detailed lane of a Work Package. It alone decides which lane
  section a card renders in.
- **Snapshot behind log**: the base fixture's supplied same-commit disagreement notice. It is not a
  second revision, a freshness result, or a recovery prompt.
- **Unverified overlay**: a supplied, not-yet-pushed claim attached to one Work Package, classified
  `unverified`, presented subordinate to its card with the visible tier `Presence · unverified`, an
  actor, and a destination lane. It never moves the card or changes its committed lane.
- **Observed activity**: #278's separate `Observed · up to 60 s behind` classification on the base
  fixture. The ten-lane family never reads or renders it.
- **Reported-live panel**: the separately labelled region of the base fixture's reported presence
  records, with its own freshness and truth labels.
- **Board region triad**: `role="region"`, exactly one consumer-supplied accessible name, and
  `tabindex="0"` on the board scroller — present only while the scroller genuinely overflows
  (#209's contract).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - K1 populated ten-lane board (Priority: P1)

As a mission operator, I can scan all fifteen committed Work Packages in ten separate, ordered
canonical lanes, each card keeping its exact detailed lane, agent profile, native Work Package route,
and any tracker reference, without a five-stage reduction hiding which lane a package is in.

**Why this priority**: K1 establishes the ten-lane projection every other state reuses.

**Independent Test**: Render K1 alone at 1440 CSS px and verify ten named native lane sections in
canonical order, lane counts `0/2/1/3/2/1/1/4/1/0`, fifteen unique cards under their committed lane,
native route links named by WP id, independent tracker links, and — because ten lanes genuinely
overflow at this width — the board region triad on the scroller with no document overflow.

**Acceptance Scenarios**:

1. **Given** the base fixture, **When** K1 renders, **Then** the lanes are Genesis, Planned,
   Claimed, In progress, For review, In review, Approved, Done, Blocked, Canceled with counts
   0, 2, 1, 3, 2, 1, 1, 4, 1, 0 and fifteen cards in total.
2. **Given** any K1 card, **When** it is inspected, **Then** its primary action is a native link to
   the supplied route named by its WP id, it shows `Detailed lane · <committed lane>` and the
   supplied profile, and each supplied tracker reference is a separate link.
3. **Given** the K1 board at 1440 px, **When** its geometry is measured, **Then** the scroller
   overflows, carries the complete triad, and the document does not scroll horizontally.

---

### User Story 2 - K2 narrow contained board (Priority: P1)

As a mission operator on a 390 px viewport, I can move horizontally through the same ten lanes
inside one local scroller with equal page gutters, one readable lane and a glimpse of the next.

**Why this priority**: ten lanes are only usable if narrow and zoomed layouts stay contained.

**Independent Test**: Render K2 at 390×844 and verify the compact shell, the same ten lanes and
counts as K1, the triad on the overflowing scroller, a fully visible first lane plus a partially
visible second lane, equal inline gutters, and no document overflow.

**Acceptance Scenarios**:

1. **Given** 390 CSS px, **When** K2 renders, **Then** the compact shell presents and the board —
   not the document — owns horizontal overflow.
2. **Given** keyboard traversal to the last lane's route, **When** focus lands there, **Then** the
   scroller reveals it and its focus ring is neither clipped nor outside the viewport.

---

### User Story 3 - K3 filtered detailed lanes (Priority: P1)

As a mission operator, I can see the supplied `in_review` + `blocked` filter result: all ten native
detailed-lane choices remain available with their counts, exactly two are checked, and only the In
review and Blocked result lanes render, in canonical order.

**Why this priority**: K3 proves the filter composition without the library owning filtering.

**Independent Test**: Render K3 and verify an open native disclosure, one fieldset with a legend,
ten labelled checkboxes in canonical order with counts `0/2/1/3/2/1/1/4/1/0`, exactly `in_review`
and `blocked` checked, separate Apply and Clear controls, and exactly two lane sections — In review
(WP10) then Blocked (WP05).

**Acceptance Scenarios**:

1. **Given** the supplied selection, **When** K3 renders, **Then** only In review then Blocked lane
   sections exist, each with count 1.
2. **Given** a native checkbox is toggled or Apply/Clear is activated, **When** the board is
   re-inspected, **Then** the rendered lanes are unchanged — the story owns no filtering, query,
   persistence, or re-render.
3. **Given** K3 at 1440 px, the two result lanes fit, **Then** the scroller carries no triad and is
   not a tab stop; **Given** the same story at 390 px, the lanes overflow, **Then** the triad is
   present.

---

### User Story 4 - K4 same-commit snapshot disagreement (Priority: P1)

As a mission operator, I see the supplied notice that the saved status summary and Mission history
disagree at this same commit, beside an unchanged committed board.

**Why this priority**: the warning must not read as another revision or change committed facts.

**Independent Test**: Render K4 and verify exactly one attention notice carrying the base fixture's
heading and message, the same commit and branch as K1, and lanes/counts/cards identical to K1.

**Acceptance Scenarios**:

1. **Given** K1 and K4, **When** their commit, lane counts, and Work Package ids are compared,
   **Then** they are identical and K4 adds exactly one notice.
2. **Given** the notice, **When** it is read, **Then** it offers no second SHA, age, newer-source
   claim, or recovery action.

---

### User Story 5 - K5 visibly unverified overlay (Priority: P1)

As a mission operator, I can see that WP03 is committed `in_progress`, and — subordinate to its card
— a supplied not-yet-pushed claim visibly labelled `Presence · unverified`, with actor `lynn` and
destination `→ for_review, not yet pushed`.

**Why this priority**: an unverified claim must be legible without freshening committed truth.

**Independent Test**: Render K5 and verify WP03 remains in the In progress lane with
`Detailed lane · in_progress`, its card carries exactly one overlay with the visible tier, actor and
destination, the page shows the supplied `live overlays shown` label once, no other card has an
overlay, and the #278 `Observed · up to 60 s behind` text appears nowhere.

**Acceptance Scenarios**:

1. **Given** the overlay claim, **When** K5 renders, **Then** WP03's lane, count, and position are
   identical to K1's.
2. **Given** the overlay and the reported-live panel, **When** the accessibility tree is inspected,
   **Then** the overlay sits inside WP03's list item and outside the reported-live region.

---

### User Story 6 - K6 empty ten-lane board (Priority: P1)

As a mission operator, I can tell a valid mission with no committed Work Packages from a missing
board: all ten lanes remain, each empty with the one supplied per-lane sentence.

**Why this priority**: the empty state must keep the information architecture honestly.

**Independent Test**: Render K6 and verify ten ordered lane sections with count 0, an empty native
list, the sibling sentence `No work packages in this lane.`, no card, no CTA, no global empty-state
message, and the reported-live panel's own supplied empty sentence.

**Acceptance Scenarios**:

1. **Given** an empty committed projection, **When** K6 renders, **Then** all ten lanes remain in
   canonical order with count zero.
2. **Given** any K6 lane, **When** its structure is inspected, **Then** the empty sentence is a
   sibling of the empty list, not a list item, and no action control exists in the board.

### Edge Cases

- Genesis and Canceled are zero-count lanes in the populated board; they render as ordinary empty
  lanes with the supplied sentence, not hidden or merged.
- Work Packages without tracker references render no placeholder control.
- Long localized lane labels, long repository/branch/mission values, and opaque ids wrap or stay
  inside the local scroller without document overflow, overlap, or clipped focus.
- The board gains the triad only while it genuinely overflows. A fitting board (K3 at desktop)
  must not create a dead tab stop; the triad appears and disappears on resize and on content change
  of the same mounted board, and observers are released on remount.
- A native checkbox may change its own checked state; the story does not recompute the board.
- Snapshot, unverified overlay, and reported-live claims stay separate when they co-occur (the
  ForcedColors composition carries all three).
- In RTL the lanes run from the inline start on the right; the same containment and focus rules
  hold.
- Forced colors keep lane boundaries, the overlay boundary, checkbox checked cues, notice, and focus
  perceivable without hue; reduced motion changes nothing because the pattern has no motion.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Additive ten-lane family | The mission shall add exactly eleven stories under the sibling title `Patterns/Mission Kanban Ten-Lane` — six product states K1–K6 plus LightMode, LongContent, ForcedColors, ReducedMotion, and RTL evidence — while every #278 `Patterns/Mission Kanban` story, story id, story source, focused test, and visual baseline stays byte-identical. | High | Open |
| FR-002 | One source of committed truth | Every lane, lane label, count, Work Package, route, agent profile, tracker reference, commit, snapshot record, and reported-live record shall be read from #278's exported deeply frozen base fixture; the extension fixture shall restate none of them and supply only ten-lane copy, the unverified overlay claim, and stress strings, and shall itself be deeply frozen. | High | Open |
| FR-003 | Pure fail-closed projection | The ten-lane projection shall be deterministic, return a deeply frozen result, never mutate either fixture or a prior projection, and fail closed on duplicate lanes, duplicate Work Packages, blank or duplicate routes, unknown committed lanes, invalid or duplicate tracker controls, overlays naming an unknown Work Package or lane or duplicating a Work Package, unknown or duplicate selections, and unknown included Work Packages. It shall not encode any lane vocabulary, order, or count of its own. | High | Open |
| FR-004 | K1 ten ordered lanes | K1 shall render the ten canonical lanes as separate named sections in supplied order with counts derived from committed lanes (`0/2/1/3/2/1/1/4/1/0`), each of the fifteen Work Packages once under its committed lane with its native route named by WP id, `Detailed lane · <lane>`, supplied profile, and independent tracker links, and no five-stage reduction. | High | Open |
| FR-005 | K2 narrow containment | K2 shall render the K1 projection in the compact shell at 390 CSS px with one local horizontal scroller, the first lane fully visible, a glimpse of the second, equal inline page gutters, and no document-level horizontal overflow. | High | Open |
| FR-006 | K3 filtered result | K3 shall render an open native disclosure containing one fieldset/legend and all ten native checkbox choices with derived counts, exactly `in_review` and `blocked` checked from the base fixture's supplied selection, separate inert Apply and Clear controls, and only the In review and Blocked result lanes in canonical order. | High | Open |
| FR-007 | K4 same-commit notice | K4 shall render the K1 projection plus exactly one attention notice carrying the base fixture's snapshot heading and message, with the same commit context and no second SHA, freshness claim, or recovery action. | High | Open |
| FR-008 | K5 visible unverified overlay | K5 shall keep WP03 in its committed In progress lane and render the extension fixture's overlay claim subordinate to WP03's card with a visible `Presence · unverified` tier, actor, and destination lane, plus the supplied page-level `live overlays shown` label once; the base fixture's observed-activity classification shall never render in the ten-lane family. | High | Open |
| FR-009 | K6 empty ten lanes | K6 shall retain all ten lanes with zero counts, empty native lists, one supplied per-lane empty sentence as a sibling of each list, no card, and no global empty state, CTA, setup, or recovery affordance. | High | Open |
| FR-010 | Separate reported-live panel | The reported-live panel shall remain its own labelled region built from the base fixture's reported records and its own freshness and truth labels, with no board-level timestamp and no inferred join between a reported actor and a Work Package. | High | Open |
| FR-011 | Measured overflow triad | The pattern shall add the board region triad — `role="region"`, exactly one fixture-supplied accessible name, `tabindex="0"` — only while the scroller's `scrollWidth` exceeds its `clientWidth`, remove all three when it fits, re-evaluate on resize and on content change of the mounted board, and release its observers on teardown/remount; the mechanism shall be local to the pattern module and not exported as a helper. | High | Open |
| FR-012 | Public composition only | The composition shall use only published surfaces — `sk-app-shell`, `sk-personal-rail`, `sk-context-sidebar`, `.sk-context-nav`, `sk-page-header`, `.sk-breadcrumbs`, `sk-pill-tag`, `sk-status-indicator`, `sk-notice`, `.sk-disclosure`, `.sk-checkbox-choice-group`, `sk-button`, `.sk-workflow-board`/`.sk-workflow-lane`, `sk-action-row[layout="card"][href]`, `.sk-empty-state--inline` — plus native HTML and token-only pattern-local layout. | High | Open |
| FR-013 | Consumer-supplied copy | Every visible and accessible string rendered by the ten-lane module shall come from the base or extension fixture, either as a plain string or through a consumer-owned formatter function in the fixture; render code shall contain no user-visible literal. | High | Open |
| FR-014 | Evidence variants | LightMode shall wrap the same projection in `.sk-light`; LongContent shall use supplied long localized lane labels and the base fixture's long opaque stress values; ForcedColors shall compose the snapshot notice, unverified overlay, and reported-live panel together; ReducedMotion shall render K5; RTL shall render K1 with `dir="rtl"`. | High | Open |
| FR-015 | Story-only seams | Any fixture, projection, guard, or render export needed by tests shall live in the excluded `*.stories.ts` module, be listed in `excludeStories`, and reach no package entry, manifest, or wrapper. | Medium | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Axe conformance | All eleven new stories are ratcheted in `expected-stories.json` and report 0 WCAG 2.1 AA axe violations in `run-axe-storybook.js`. | Accessibility | High | Open |
| NFR-002 | Keyboard and focus | Filter disclosure, checkboxes, Apply/Clear, Work Package routes, tracker links, and the overflowing scroller are reachable by Tab with a visible, unclipped focus ring inside the viewport; a fitting board adds 0 extra tab stops; DOM order equals visual and focus order. | Accessibility | High | Open |
| NFR-003 | Containment at every tested geometry | `document.documentElement.scrollWidth` ≤ `clientWidth` + 1 at 1440 px, 390 px, the shell threshold (860/861 px), the board-fit threshold (±1 px of the measured fit width), short viewports (1440×600, 390×480), 200% zoom (layout-equivalent 720×512 at device scale 2, plus CSS `zoom: 2` stress), long content, and RTL. | Responsive layout | High | Open |
| NFR-004 | Browser matrix | The focused suite passes in the repository's Chromium, Firefox, and WebKit projects. | Compatibility | High | Open |
| NFR-005 | Forced colors | Under forced-colors emulation, lane and overlay boundaries, checkbox checked-versus-unchecked cues, the notice, and focus indicators remain perceivable, and every truth-tier label remains present as text. | Accessibility | High | Open |
| NFR-006 | Reduced motion | The pattern declares no animation, transition, or scroll-behavior; under reduced-motion emulation the K5 content is complete. | Accessibility | Medium | Open |
| NFR-007 | Visual regression | Twelve Chromium baselines — eleven stories plus K3 under forced-colors emulation — are CI-authoritative (harvested from the CI artifact) and directly inspected; 0 existing baselines change. | Visual quality | High | Open |
| NFR-008 | Determinism | Repeated projection of the same frozen inputs yields structurally identical results for 100% of lanes, counts, ids, routes, and claims. | Reliability | High | Open |
| NFR-009 | Repository gates | Lint, stylelint, typecheck, pattern-composition gate and self-test, Storybook build, story ratchet, axe, focused and full Playwright suites, visual regression, and every generated-surface `--check` pass, with 0 bytes of change to generated or public surfaces. | Maintainability | High | Open |
| NFR-010 | Accessibility-tree evidence | Each K story's accessibility tree has exactly one level-1 heading, a level-2 board heading, level-3 lane headings matching the rendered lanes, named lane sections, native lists, and the truth-tier text in its own region. | Accessibility | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | Storybook-only distribution | No custom element, package export, manifest entry, framework wrapper, token, or application API is added. | Architecture | High | Open |
| C-002 | #278 history preserved | `packages/elements/src/patterns/mission-kanban.stories.ts`, `apps/storybook/src/tests/sk-mission-kanban-pattern.spec.ts`, the ten `mission-kanban-*` visual cases and PNGs, and the existing `mission-kanban-pattern` ratchet entry are not modified. | Scope | High | Open |
| C-003 | Consumer ownership | Team Kitty retains lane vocabulary/order, grouping, counts, query parsing, filtering, snapshot comparison, overlay selection, truth classification, reported-live acquisition, routes, polling, clocks, relative time, copy/i18n, and all mutation. | Ownership | High | Open |
| C-004 | No application machinery | No filtering engine, router, fetch, timer, polling, storage, history mutation, event handler, drag/drop, or state store is introduced. | Scope | High | Open |
| C-005 | No inferred facts | No title, description, blocked reason, owner, priority, date, estimate, progress, verification, freshness, or recovery content is invented. | Data integrity | High | Open |
| C-006 | No generic overflow API | The overflow measurement stays a module-local implementation of #209's contract; no public or shared observer, helper, controller, hook, or wrapper element is created, and no workflow-board CSS is duplicated. | Architecture | High | Open |
| C-007 | Token and logical-property authority | Pattern-local CSS uses existing `--sk-*` tokens only and logical properties only; it targets only its own `sk-mission-kanban-ten-lane-pattern*` namespace. | Design system | High | Open |
| C-008 | Generated surfaces | No generated artifact is hand-edited; every generator's committed output stays byte-identical. | Tooling | High | Open |
| C-009 | One bounded delivery | Exactly one Work Package and one PR into `train/elements-first`; the PR body carries `Refs #395` and `Refs #276` and no closing keyword for the epic. | Delivery | High | Open |
| C-010 | Adjacent programme exclusion | No Work Package Detail or Repository Ops Timeline artifact, fixture field, import, or contract is created or changed. | Scope | High | Open |

### Key Entities *(include if feature involves data)*

- **Base fixture** (existing, #278): ten detailed lanes, fifteen Work Packages with committed lane,
  route, profile, tone, and tracker references, commit context, snapshot record, K3 selection,
  reported-live records, and stress values. Read-only for this mission.
- **Ten-lane extension fixture** (new): composition copy as strings and formatter functions
  (lane-count label, detailed-lane label, overlay destination phrase, eyebrow, subtitle, brand,
  unavailable annotation), the unverified overlay claim (Work Package id, classification, tier label,
  tier tone, actor, destination lane), and long localized lane labels for stress.
- **Ten-lane projection** (derived): ordered lane records with derived counts and their Work Package
  cards; per-lane counts for the filter choices; selected lanes; optional snapshot; overlays; and
  reported-live records. A render seam, not a filtering engine or store.

## Negative Invariants

| ID | Forbidden outcome |
|----|-------------------|
| NI-001 | A published Kanban/lane/card/overlay/filter/overflow element, export, wrapper, manifest entry, token, or helper API exists after this mission. |
| NI-002 | Any #278 story, story id, focused test, visual case, or baseline changes. |
| NI-003 | A render or projection mutates either fixture or a previously returned projection. |
| NI-004 | A lane count, lane, or Work Package list is restated in the extension fixture instead of derived from the base fixture. |
| NI-005 | An unverified overlay moves a card, changes its committed lane or count, or renders as `Observed`. |
| NI-006 | The document scrolls horizontally, focus is clipped, or a fitting board keeps any part of the triad. |
| NI-007 | Native section/list, details, fieldset/legend, label/checkbox, link, or heading semantics are simulated with ARIA roles. |
| NI-008 | Pattern CSS reaches into component internals, copies library-owned selectors, uses physical directional properties, or uses raw design values. |
| NI-009 | A user-visible or accessible literal appears in ten-lane render code rather than in a fixture. |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The built index lists exactly the eleven planned `patterns-mission-kanban-ten-lane--*`
  stories and still lists exactly the ten #278 `patterns-mission-kanban--*` stories.
- **SC-002**: K1 renders 10 lanes, 15 cards, and counts `0/2/1/3/2/1/1/4/1/0`; K3 renders 2 lanes
  (In review, Blocked) and 2 checked of 10 choices; K4 matches K1's commit and counts with 1
  notice; K5 keeps WP03 in In progress with 1 visible unverified overlay; K6 renders 10 empty lanes.
- **SC-003**: All eleven stories report 0 axe violations, and accessibility-tree evidence proves
  one H1, logical headings, named lanes, native lists, and separated truth tiers.
- **SC-004**: At every geometry named in NFR-003 the document has 0 px of horizontal overflow, and
  the triad is present exactly when the scroller overflows — including both directions of a live
  resize and a content change on one mounted board, with observers balanced after remount.
- **SC-005**: Twelve new CI-authoritative baselines exist and were inspected; the ten #278 baselines
  are byte-identical.
- **SC-006**: `git diff origin/train/elements-first --stat` shows 0 changes to generated or public
  surfaces and to any #278 file, and every repository gate is green on the PR head.
- **SC-007**: One Work Package and one PR deliver the mission, with `Refs #395` and `Refs #276` and
  epic #276 left open.
