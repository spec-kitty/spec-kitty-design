# Mission Specification: Team overview feed elements

**Mission Branch**: `mission/team-overview-feed-elements`
**Created**: 2026-09-05
**Status**: Draft
**Input**: GitHub issue #146, part of epic #144 and the approved Team overview reference

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Compose an accessible operational feed (Priority: P1)

As an application author, I can compose section headings and operational rows from four reusable
elements while native `ul` and `li` remain in my light DOM, so list semantics survive the shadow
boundary and the library does not learn Team Kitty domain concepts.

**Why this priority**: This is the mission's core value and closes the semantic failure documented
by issue #92 without introducing a new list abstraction.

**Independent Test**: Render in-flight and recent-activity fixtures inside consumer-authored
`ul > li` markup and verify the browser accessibility tree exposes a list and list items while the
four components preserve the approved marker/name/reference/pills/metadata scan grammar.

**Acceptance Scenarios**:

1. **Given** a native list containing action rows, **When** the composition is inspected by axe and
   through browser roles, **Then** the list and list-item relationships remain intact.
2. **Given** consumer-supplied headings, labels, references, tags, markers and times, **When** the
   feed renders, **Then** the elements preserve that content and do not derive, reorder, suppress or
   rename it.

---

### User Story 2 - Request activation without owning selection (Priority: P1)

As a keyboard, pointer or React consumer, I can activate a selectable action row and receive one
typed request containing its stable ID, while the selected value remains controlled by my
application and nested controls keep their own behavior.

**Why this priority**: A row that looks actionable but has inconsistent keyboard behavior, mutates
selection itself, or double-fires from a nested link is not a reusable action primitive.

**Independent Test**: Activate one row separately by pointer, Enter and Space, observe its event,
activate nested links/buttons, and exercise the generated React callback. Assert the exact event
shape and flags, exactly-once delivery, nested-control isolation and unchanged selected input.

**Acceptance Scenarios**:

1. **Given** a selectable row with a stable ID, **When** its primary trigger is activated by pointer,
   Enter or Space, **Then** exactly one bubbling, composed, non-cancelable
   `sk-action-row-activate` event carries exactly `{ id }`.
2. **Given** a consumer receives that event, **When** dispatch completes, **Then** no component-owned
   default application action or selected-value mutation has occurred.
3. **Given** a link or button in the trailing-controls area, **When** it is activated, **Then** it
   remains independently operable and emits no row-activation event.

---

### User Story 3 - Communicate status and identity accessibly (Priority: P2)

As a feed reader, I can scan a compact entity marker and a visible status label whose tone supports
but never replaces its meaning; meaningful markers have names and decorative markers stay hidden
from assistive technology.

**Why this priority**: The visual grammar relies on compact colored leads, but color-only status and
unnamed meaningful marks would exclude assistive-technology and color-vision users.

**Independent Test**: Exercise all status tones and both marker modes. Assert visible status text,
distinct recovery/info/danger treatments, zero axe violations, meaningful marker naming and
decorative marker hiding.

**Acceptance Scenarios**:

1. **Given** neutral, info, success, attention, danger and recovery status instances, **When** they
   render, **Then** each includes consumer-visible text and the element assigns no domain label.
2. **Given** a meaningful entity marker, **When** it renders with its consumer label, **Then** the
   marker exposes that accessible name; without a label it is decorative and hidden.

---

### User Story 4 - Preserve the approved layout in both themes (Priority: P2)

As a user on a narrow or wide viewport, I can scan long repository paths, several pills and supplied
timestamps without overlaps or color-dependent meaning in either theme.

**Why this priority**: The approved feed is dense and its primary failure mode is metadata collision
or unreadable truncation at the widths used by the Team Kitty sidebar layout.

**Independent Test**: Render the approved dark fixture and required `LightMode` fixture at desktop
and 320 CSS-pixel content widths; assert no content overlap, clipped focus indicator or viewport
overflow, and verify WCAG AA contrast.

**Acceptance Scenarios**:

1. **Given** a long repository path, several pill tags and a supplied age string, **When** the row is
   constrained to 320 CSS pixels, **Then** content wraps or reflows without colliding with controls
   or metadata.
2. **Given** dark and light theme wrappers, **When** each required story renders, **Then** theme
   surfaces resolve differently and all text, focus and interactive-state contrast remains valid.

### Edge Cases

- A selectable action row without a non-empty stable ID fails closed as non-activatable rather than
  emitting an ambiguous request.
- A consumer-supplied selected value is rendered as supplied even when the row is not activatable;
  activation never rewrites it. Selection is exposed only as `aria-current="true"` on the stable
  row/root surface; the component never claims `aria-selected`, `aria-pressed`, checkbox or switch
  semantics.
- Key-repeat and the browser's Space scrolling behavior do not create duplicate activation.
- Controls in the trailing-controls slot, including the landed `sk-button`, remain independent of
  the row's primary trigger.
- Identical event content in two list items produces two visible rows; no component deduplicates or
  suppresses consumer data.
- Long unbroken references, multiple pills, absent optional metadata and narrow containers reflow
  without obscuring the title or focus indicator.
- Status meaning remains present as visible text when color perception is unavailable.
- A meaningful entity mark without a non-empty label is treated as decorative and does not expose
  an unnamed image role.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED:
  1) Keep requirement types separated (Functional / Non-Functional / Constraints)
  2) Use unique IDs per type (FR-###, NFR-###, C-###)
  3) Keep Status populated for every row
  4) Non-functional requirements must include measurable thresholds
-->

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Exact element set | Publish `sk-section-header`, `sk-action-row`, `sk-status-indicator` and `sk-entity-marker`, and no `sk-section-list`. | High | Open |
| FR-002 | Section header content | `sk-section-header` exposes named slots for eyebrow/title, description, count or metadata, and one trailing action. | High | Open |
| FR-003 | Consumer heading level | The title slot accepts a native consumer-authored heading; the element never fixes or guesses its heading level. | High | Open |
| FR-004 | Section header boundary | The section header derives no count, loading state or action behavior. | High | Open |
| FR-005 | Action-row grammar | `sk-action-row` preserves marker → primary title → monospace reference → semantic tags → right-aligned metadata and controls. | High | Open |
| FR-006 | Action-row projection | The row exposes documented content slots for marker, title, reference, tags, metadata and trailing controls without naming a Work Package, mission or repository. | High | Open |
| FR-007 | Controlled selection | A selectable row accepts a non-empty stable consumer row ID and a consumer-controlled selected boolean; it never changes selected itself, and the stable row/root surface exposes `aria-current="true"` only while selected in both selectable and non-selectable render branches. | High | Open |
| FR-008 | Activation event | Primary activation emits `sk-action-row-activate` as `CustomEvent<{ id: string }>` with `bubbles: true`, `composed: true` and `cancelable: false`; a listener calling `preventDefault()` leaves `defaultPrevented` false, dispatch returns true, and the element performs no default application action. | High | Open |
| FR-009 | Activation parity | Pointer click, Enter and Space each produce one equivalent activation request; a repeat-only Enter/Space `keydown` guard calls `preventDefault()` and suppresses duplicate native activation without canceling non-repeat keyboard input. | High | Open |
| FR-010 | Nested-control isolation | Links, buttons and `sk-button` instances in trailing controls remain independently operable and never cause or double-fire row activation. | High | Open |
| FR-011 | Interaction affordance | Selectable rows expose distinct rest, hover, focus-visible, pressed and selected treatment; non-selectable rows expose no false affordance. | High | Open |
| FR-012 | Status tones | `sk-status-indicator` accepts only neutral, info, success, attention, danger or recovery as consumer-supplied presentation tones. | High | Open |
| FR-013 | Status semantics | A status indicator pairs a visual marker with visible consumer text; color never carries the status alone and the element invents no label. | High | Open |
| FR-014 | Entity marker content | `sk-entity-marker` presents a compact consumer-supplied icon, initials or short mark without fetching identity or generating initials. | Medium | Open |
| FR-015 | Entity marker accessibility | A non-empty consumer label makes the marker meaningful and named; an absent/empty label makes it decorative and hidden. | High | Open |
| FR-016 | Consumer-owned list | Consumers wrap action rows in native `ul` and `li`; none of the four elements asserts list or list-item ownership. | High | Open |
| FR-017 | Consumer-owned data | The elements do not own feed arrays, ordering, freshness, timers, active row, navigation, route changes or domain calculations. | High | Open |
| FR-018 | Stable rendering | Equal supplied event content renders equally and remains one row per consumer-authored list item. | Medium | Open |
| FR-019 | Generated consumers | All four elements appear in the manifest, generated React wrappers and Vue declarations; the React row callback preserves typed `{ id }` detail. | High | Open |
| FR-020 | Theme and layout | Every component supplies dark/default and `LightMode` stories plus narrow and long-content evidence where applicable. | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | WCAG conformance | Axe reports zero WCAG 2.1 AA violations across every required component story. | Accessibility | High | Open |
| NFR-002 | Contrast and non-color meaning | Normal text reaches at least 4.5:1, large text and interactive graphics at least 3:1 where WCAG applies, and all status meaning remains visible in text. | Accessibility | High | Open |
| NFR-003 | Narrow layout | At a 320 CSS-pixel component width, the long-content fixture has zero horizontal viewport overflow, overlap or clipped focus indication. | Responsive layout | High | Open |
| NFR-004 | Exact event contract | Each pointer, Enter or Space activation yields exactly one event with no detail keys beyond `id`; document-level and React listeners each receive it once, and a composite real-browser probe observes `dispatchEvent === true`, `defaultPrevented === false`, and no component-owned default action after `preventDefault()`. | Reliability | High | Open |
| NFR-005 | No hidden state | Before and after every activation test, the row's selected value equals the last consumer-supplied value. | State integrity | High | Open |
| NFR-006 | Token-only styling | Component CSS contains zero raw color, spacing, typography, radius, shadow or motion values outside the token source. | Maintainability | High | Open |
| NFR-007 | Generated determinism | Every committed CSS module, manifest, React wrapper, Vue declaration and size report regenerates byte-identically on the final head. | Reliability | High | Open |
| NFR-008 | Behavior mutation evidence | Every declared ADR-11 subject has a unique, non-inert mutation; the suite and every mutation guard pass with zero surviving required arm. | Test quality | High | Open |
| NFR-009 | Storybook budget | The CI Storybook build completes in strictly less than the charter's 180-second ceiling. | Performance | Medium | Open |
| NFR-010 | Zero application coupling | A repository scan finds zero router, store, fetch, clock (`Date.now`), interval or timeout ownership in the four component sources. | Architecture | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | Landed prerequisite | Build on the `sk-button` and `sk-pill-tag` contracts landed by #79; do not recreate them. | Dependency | High | Open |
| C-002 | Exact authored scope | Authored component sources are limited to section-header, action-row, status-indicator and entity-marker. | Scope | High | Open |
| C-003 | No section list | Do not add `section-list`, shadow-owned `ul`/`li`, `role=list` or `role=listitem` wrappers. | Accessibility | High | Open |
| C-004 | Presentational boundary | All supplied values are controlled/presentational; the design library renders and emits intent only. | Architecture | High | Open |
| C-005 | Existing tokens first | Use existing `--sk-*` tokens. Any new token requires an explicit scope decision and maintainer approval. | Design system | High | Open |
| C-006 | Canonical sources | Keep one authored CSS source and one authored markup source only where a real static form exists; never hand-edit generated artifacts. | Architecture | High | Open |
| C-007 | Architecture authority | Follow ADR-9, ADR-10, ADR-11 and `docs/contributing/adding-a-component.md`. | Governance | High | Open |
| C-008 | No new dependency | Add no package dependency or lockfile change for these primitives. | Supply chain | High | Open |
| C-009 | Serial shared artifacts | Work Packages sharing manifest, wrappers, declarations, ratchets or size outputs execute in one serial lane. | Delivery | High | Open |
| C-010 | One mission PR | Deliver one PR with `Refs #146` from `mission/team-overview-feed-elements` into `train/elements-first`; no WP PRs. | Git | High | Open |
| C-011 | Latest-train final gate | Do not rebase the active lane after execution starts. After all WPs are approved, record and hold the fetched `origin/train/elements-first` SHA, rebase the clean planning target onto that SHA, then use Spec Kitty to merge the lane into it. Regenerate and commit shared outputs and run every gate on that exact head with no later rebase; if the train advances after consolidation, the mission is BLOCKED and must not claim a new local rebaseline or merge. | Git | High | Open |
| C-012 | Tier-C and acceptance gate | Before merge, three independent profile-loaded lenses review the exact final SHA and all findings are resolved or explicitly dispositioned. The external acceptance writer then records the same exact head without changing it, or an explicit SK-178 waiver is recorded by the operator/maintainer; any later push invalidates lens, acceptance and approval evidence. | Review | High | Open |
| C-013 | Protected production line | Never merge or push to `main`, and never publish or deploy from this mission. | Release | High | Open |

### Key Entities *(include if feature involves data)*

- **Section presentation**: Consumer-supplied title hierarchy, supporting copy, metadata and one
  action, with no derived counts or state.
- **Action-row projection**: Stable row ID, controlled selected state and six consumer-owned content
  regions; produces an activation intent and owns no destination.
- **Status presentation**: One of six presentation tones plus consumer-visible status content; the
  tone never determines the domain meaning.
- **Entity marker presentation**: Consumer mark content and its accessible-name mode; no identity
  record or lookup exists in the component.
- **Consumer list item**: The native `li` surrounding an action row. Its position, ordering and list
  ownership remain outside the design library.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: An approved feed fixture composes all four elements under native `ul > li` markup and
  exposes valid list/list-item relationships with zero axe violations.
- **SC-002**: The manifest and generated React/Vue surfaces contain exactly the four new tags and
  document every public attribute, slot, event and part.
- **SC-003**: Pointer, Enter and Space each emit one `sk-action-row-activate` with exact `{ id }`,
  `bubbles: true`, `composed: true` and `cancelable: false`; two real-browser repeated keydowns still
  produce one activation because only repeat Enter/Space keydowns are prevented.
- **SC-004**: A listener calls `preventDefault()` on the non-cancelable request and observes
  `dispatchEvent === true` and `defaultPrevented === false`; no test observes a component-owned
  navigation, selected mutation or other default application action.
- **SC-005**: Activating nested direct links, native buttons and `sk-button` trailing controls emits
  zero row events while each nested control's own activation remains observable.
- **SC-006**: Every status tone renders visible text; recovery differs visually from info and danger
  in both themes without color being the sole status carrier.
- **SC-007**: Meaningful entity markers expose the supplied accessible label, while decorative ones
  expose no image role or name and are hidden from assistive technology.
- **SC-008**: The long-path/several-pill fixture at 320 CSS pixels has no overlap, clipped focus ring
  or viewport overflow and keeps supplied time text readable.
- **SC-009**: Default and `LightMode` stories resolve different theme surfaces and meet the WCAG AA
  thresholds in NFR-002.
- **SC-010**: All applicable ADR-11 behavior subjects and 19 distinct, non-inert red-first mutation
  arms pass: 17 element/React contract arms plus one status-tone arm and one entity-label arm;
  generated outputs are clean after the full local gate.
- **SC-011**: The generated React wrapper accepts `onSkActionRowActivate` with typed
  `CustomEvent<{ id: string }>` and rejects a nonexistent detail field at compile time.
- **SC-012**: The final diff contains no `section-list`, application router/store/fetch/time logic,
  dependency change, main-branch merge, publish or deploy action.

> Mission success-criterion IDs above are local traceability identifiers. They do not add to or
> redefine the ADR-11 behavior registry's existing `SC-*` IDs.
