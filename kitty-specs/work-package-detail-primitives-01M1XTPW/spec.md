# Mission Specification: Work Package Detail Primitives

**Mission Branch**: `mission/work-package-detail-primitives`  
**Created**: 2026-09-07  
**Status**: Confirmed  
**Input**: GitHub issue #213, part of epic #208; approved T11 Work Package detail reference with T9/T12 recurrence checks.

## Intent Summary

Design-system consumers need the missing presentation surfaces for a Work Package detail route without importing Team Kitty application state into the library. A consumer supplies repository, mission, Work Package, prompt, subtask, and transition data; the library styles that content with native light-DOM semantics and extends the existing `sk-check-bullet` with a read-only complete/pending state. The issue contract is authoritative. The T11 Stitch reference guides visual intent where accessible; its unauthenticated page currently exposes only the account shell, so no pixel-level claim is made from that unavailable view.

The invariant is that the library owns token-driven presentation, accessibility mechanics, and typed element state, while the consumer owns content, order, parsing, trust, time, routing, and progress. The main exception paths are absent prompts and unavailable retained history, which compose existing `.sk-empty-state` or `sk-notice` surfaces rather than acquiring new stateful behavior.

## User Scenarios & Testing

### User Story 1 - Read Work Package Orientation and Prompt (Priority: P1)

As a Work Package viewer, I can follow repository/mission/WP breadcrumbs and read long prompt content, including code and structured data, without losing native navigation, heading, list, link, code, or table semantics.

**Why this priority**: Orientation and prompt comprehension are the primary T11 detail-route jobs.

**Independent Test**: Render breadcrumbs and prose over consumer-authored native markup at wide and narrow widths, then verify accessible names, current-link semantics, keyboard focus, contained overflow, and no page-level horizontal scroll.

**Acceptance Scenarios**:

1. **Given** a one-, three-, or six-level native breadcrumb list, **When** it renders in dark, light, forced-colors, narrow, and zoomed states, **Then** the terminal crumb remains `aria-current="page"`, separators remain decorative, long labels expose their complete accessible names, and focus remains visible.
2. **Given** consumer-rendered headings, paragraphs, lists, links, inline code, a long code block, and a wide `.sk-data-table`, **When** prompt prose renders, **Then** content retains native semantics, readable measure, and local overflow containment without the primitive parsing or sanitizing Markdown or HTML.
3. **Given** no prompt content, **When** the route renders its absence, **Then** the consumer composes `.sk-empty-state`; `.sk-prose` does not invent copy or loading state.

---

### User Story 2 - Read Ordered Transition History (Priority: P1)

As a Work Package viewer, I can read a supplied transition chronology with its summary, actor/time metadata, optional detail, and optional supplied trust/status marker in the exact order authored by the consumer.

**Why this priority**: Ordered transition history is a primary T11 surface and must not be confused with T12's dense operations table.

**Independent Test**: Render one, two, and twenty native ordered-list events, including long text, supplied verified marker, unavailable retention, and narrow stacking; verify list order/count, decorative connectors, metadata attachment, and overflow behavior.

**Acceptance Scenarios**:

1. **Given** a native `<ol>` whose `<li>` entries contain transition, actor, time, and optional supporting content, **When** `.sk-event-timeline` styles it, **Then** list semantics and consumer order are intact and connector/dot decoration is absent from accessible names.
2. **Given** long transition and metadata values at narrow width and zoom, **When** the timeline reflows, **Then** each entry's metadata remains visually attached to its event and the page does not scroll sideways.
3. **Given** retention-unavailable history, **When** the consumer renders the route, **Then** it composes `.sk-empty-state`, or `sk-notice` only when announcement semantics are genuinely required; the timeline does not fetch, sort, verify, paginate, infer trust, or format time.
4. **Given** dense multi-column operations data, **When** the consumer chooses a primitive, **Then** it uses `.sk-data-table`, not `.sk-event-timeline`.

---

### User Story 3 - Distinguish Read-Only Subtask State (Priority: P1)

As a Work Package viewer, I can distinguish complete and pending subtasks in a native list, with state announced in text and without receiving a false interactive-checkbox contract.

**Why this priority**: Complete/pending state is required for T11 and extends an existing public element contract.

**Independent Test**: Exercise `sk-check-bullet` with omitted, complete, pending, mixed, long, no-subtask, and fifty-item scenarios, including property assignment before upgrade and generated React typing.

**Acceptance Scenarios**:

1. **Given** an omitted `state` or `state="complete"`, **When** `sk-check-bullet` renders, **Then** it preserves the existing complete/check presentation and announces complete through hidden accessible text.
2. **Given** `state="pending"`, **When** it renders, **Then** the default icon and hidden accessible state text communicate pending without `aria-checked`, a toggle event, or interactivity.
3. **Given** a consumer-supplied icon, **When** either state renders, **Then** the override remains decorative while state is still announced independently.
4. **Given** an invalid state value, **When** the element renders, **Then** it fails open to the backward-compatible complete presentation rather than throwing or consuming its text.
5. **Given** a native list containing mixed and long subtasks, **When** it renders at fifty-item scale and narrow width, **Then** native list compatibility, readable wrapping, and non-interactivity remain intact; an empty list is represented with `.sk-empty-state`.

## Edge Cases

- Breadcrumb labels may be long, duplicated visually, or six levels deep; truncation must not shorten the accessible name.
- Prose may include long unbroken code, nested lists, links, and a wide structured table; overflow belongs to the code/table region, never the page.
- Timelines may contain exactly one event, twenty events, long metadata, no optional detail, or a supplied verified marker; none changes consumer ordering or trust.
- Check-bullet state may be omitted, set before custom-element upgrade, supplied as an unsupported value, combined with a custom icon, or repeated fifty times.
- Forced-colors must preserve boundaries and focus; reduced-motion must remove only transitions actually introduced by these primitives.

## Requirements

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Native breadcrumbs | As a viewer, I want `.sk-breadcrumbs` over `<nav aria-label="Breadcrumb"><ol><li><a>` so that orientation remains natively navigable and the terminal link retains `aria-current="page"`. | High | Confirmed |
| FR-002 | Accessible breadcrumb overflow | As a keyboard and screen-reader user, I want decorative separators, full accessible labels, contained narrow overflow, and visible focus so that long breadcrumb paths remain usable. | High | Confirmed |
| FR-003 | Native prose typography | As a reader, I want `.sk-prose` to style consumer-authored headings, paragraphs, lists, links, inline code, and `<pre><code>` at a readable measure without changing heading levels. | High | Confirmed |
| FR-004 | Prose composition boundaries | As a consumer, I want wide structured data to compose `.sk-data-table` and absent prompts to compose `.sk-empty-state`, while Markdown parsing, sanitization, syntax highlighting, and copy behavior remain outside the library. | High | Confirmed |
| FR-005 | Native event chronology | As a viewer, I want `.sk-event-timeline` over native `<ol>/<li>` entries with consumer-authored summary, actor/time metadata, optional support content, and supplied markers so that chronology remains accessible. | High | Confirmed |
| FR-006 | Timeline data neutrality | As a consumer, I want event order, transition text, trust tier, and time rendered verbatim with no sorting, fetching, pagination, verification, tone inference, or clock reads. | High | Confirmed |
| FR-007 | Timeline/table distinction | As a consumer, I want chronological entries to use the timeline and dense multi-column operations to remain `.sk-data-table` so that two distinct information structures are not conflated. | High | Confirmed |
| FR-008 | Reflected check state | As a viewer, I want `sk-check-bullet` to expose reflected `state?: 'complete' | 'pending'`, with omission preserving the existing complete presentation. | High | Confirmed |
| FR-009 | Read-only state announcement | As a screen-reader user, I want complete/pending announced through hidden text while icons remain decorative, with no invalid `aria-checked`, toggle event, or interactive behavior. | High | Confirmed |
| FR-010 | State-derived default icon | As a viewer, I want the default icon to derive from state while an existing consumer icon override remains decorative and backward compatible. | Medium | Confirmed |
| FR-011 | Required catalogue evidence | As a maintainer, I want styles-only and element stories covering every required state, plus browser behavior, accessibility-tree, mutation, wrapper-typing, and visual evidence so regressions are caught. | High | Confirmed |
| FR-012 | Documentation | As a consumer, I want native structures, timeline-versus-table use, sanitizer/heading/event-order ownership, token dependencies, and check state documented so the public boundary is explicit. | Medium | Confirmed |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Accessibility | Every shipped story reports zero WCAG 2.1 AA axe violations; accessibility-tree tests assert current breadcrumb, ordered-list count/order, decorative connectors, check-state text, and focusable links. | Accessibility | High | Confirmed |
| NFR-002 | Responsive containment | At the repository's narrow and zoom test viewports, no scenario introduces page-level horizontal overflow; only documented breadcrumb, code, and table regions may scroll locally. | Usability | High | Confirmed |
| NFR-003 | Theme coverage | Each new story set and changed element story set has default dark and functional `LightMode`; computed-style assertions prove at least one relevant value differs between themes. | Visual | High | Confirmed |
| NFR-004 | Forced colors and motion | Forced-colors evidence preserves visible boundaries/focus and decorative distinctions; any introduced transition has a targeted `prefers-reduced-motion: reduce` rule, with zero inert motion guards. | Accessibility | High | Confirmed |
| NFR-005 | Scale | Timeline stories render twenty ordered events and checklist stories render fifty items without semantic loss, metadata detachment, console errors, or page overflow. | Reliability | Medium | Confirmed |
| NFR-006 | Build integrity | Regeneration and drift gates pass for styles barrels, CSS modules, manifest, React wrappers, Vue declarations, ratchets, and element size report with no unstaged generated output. | Reliability | High | Confirmed |
| NFR-007 | Cross-browser behavior | Applicable Chromium, Firefox, and WebKit Playwright checks pass for native semantics, focus, overflow, and check-bullet state behavior. | Compatibility | High | Confirmed |
| NFR-008 | Repository quality | Focused tests, full `npm run test`, mutation self-test, type checks, lint, Storybook build, axe scan, visual regression, and `npm run quality:all` all pass without skipped or weakened gates. | Quality | High | Confirmed |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | Layer direction | Preserve tokens → styles → elements → generated React wrappers; all design values come from authoritative `--sk-*` tokens. | Architecture | High | Confirmed |
| C-002 | Light-DOM semantics | Breadcrumbs, prose, prompt markup, structured tables, and timeline stay consumer-authored light DOM; no shadow wrapper may sever native relationships. | Architecture | High | Confirmed |
| C-003 | Canonical generation | Generated files are regenerated, never manually edited; `sk-check-bullet` keeps one authored markup and one CSS source. | Architecture | High | Confirmed |
| C-004 | App-state exclusion | Routing, fetching, timers, retention, event order, trust inference, progress arithmetic, claim expiry, Markdown parsing, sanitization, and Team Kitty vocabulary remain outside the library. | Scope | High | Confirmed |
| C-005 | No aggregate components | Do not add `sk-work-package-card`, a stateful Kanban/checklist, an execution panel, metadata panel, or a full-page Work Package element. | Scope | High | Confirmed |
| C-006 | Existing ownership | Do not duplicate #177 card-tone ownership or #178 notice ownership; compose `sk-card`, `.sk-facts`, `.sk-data-table`, `.sk-empty-state`, and `sk-notice` as specified. | Scope | High | Confirmed |
| C-007 | Backward compatibility | Omitted check-bullet state remains visually and semantically complete; existing icon overrides continue to work and remain decorative. | Compatibility | High | Confirmed |
| C-008 | No unrelated repair | Changes stay within #213 and its necessary generated/test/doc surfaces; unrelated issues are not absorbed. | Scope | High | Confirmed |

## Success Criteria

### Measurable Outcomes

- **SC-001**: Public stories demonstrate breadcrumbs at one, three, and six levels; prose prompt/long-code/table/absent/narrow states; timelines at one, two, and twenty events plus unavailable/narrow states; and checklists complete, pending, mixed, long, empty composition, and fifty-item scale.
- **SC-002**: Native semantics tests report the correct breadcrumb current link, exact ordered-list counts and order, decorative separators/connectors absent from accessible names, announced complete/pending text, and independently focusable links.
- **SC-003**: `sk-check-bullet` tests prove omitted/complete/pending/invalid state, icon override, reflected-property behavior, and property assignment before upgrade; a registered mutation makes the new behavior test fail before the implementation passes.
- **SC-004**: Generated React wrapper types accept only `'complete' | 'pending'` for `state` and reject an unsupported value without any hand edit under `packages/react/src`.
- **SC-005**: Dark, `LightMode`, forced-colors, keyboard-focus, zoom, and narrow scenarios pass with zero axe violations and no page-level horizontal overflow.
- **SC-006**: Full regeneration, focused/full tests, lint/type checks, mutation gates, Storybook, axe, relevant Playwright/visual suites, and `npm run quality:all` pass at the final rebased PR head.
- **SC-007**: Documentation states native markup recipes, timeline-versus-table selection, event/prompt ownership, check-state semantics, and exact token dependencies; no application-owned behavior or Team Kitty vocabulary appears in library code.

## Non-Goals

Breadcrumb generation, back navigation, tabs, document table of contents, scroll spy, Markdown parsing or sanitization, syntax highlighting, code-copy controls, interactive checkboxes, checklist components, progress calculation, event fetching/sorting/pagination/verification, timestamp formatting, trust inference, operations log/table replacement, or Team Kitty application behavior.
