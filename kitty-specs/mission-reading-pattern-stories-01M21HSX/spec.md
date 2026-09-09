# Mission Specification: Mission Reading pattern stories

**Mission**: `mission-reading-pattern-stories-01M21HSX`
**Target Branch**: `train/elements-first`
**Created**: 2026-09-09
**Status**: Draft
**Input**: GitHub issue #265, child of epic #263, plus the approved Team Kitty Mission Reading M1–M8 design/review corpus.

## User Scenarios & Testing

### User Story 1 - Read one exact committed Mission document (Priority: P1)

As a design-system consumer, I can assemble the populated Specify reader and its loading, unavailable-page, and snapshot-behind states from public surfaces while preserving one exact planning commit and honest native navigation.

**Why this priority**: This is the core Mission Reading job and the truth boundary every other route state depends on.

**Independent Test**: Render M1–M5 from one fixture, then verify exact SHA/branch reuse, native link/non-link/current semantics, stable loading behavior, and the same-SHA snapshot annotation in Storybook and a real browser.

**Acceptance Scenarios**:

1. **Given** the populated Specify fixture, **When** M1 renders at 1440×1024, **Then** it shows one H1, Mission identity, a deep breadcrumb, one exact SHA/branch record, a truthful fixed catalogue, and readable factual prose/table content.
2. **Given** the same fixture, **When** M2 renders at 390×844, **Then** the compact header and controlled drawer preserve equal 16px content gutters, native focus order, Escape dismissal/focus return, local table overflow, and zero page overflow.
3. **Given** a pending fragment, **When** M3 renders, **Then** shell and document geometry remain stable, a polite status names the busy region, and no document fact, action, timestamp, or recovery control is invented.
4. **Given** Plan is unavailable, **When** M4 renders Specify, **Then** Plan remains a visible non-link and Specify remains the only current available link.
5. **Given** the snapshot-behind flag, **When** M5 renders, **Then** one attention explanation refers to the same SHA without a second source version or upgraded freshness claim.

---

### User Story 2 - Browse bounded artifact and Ops catalogues (Priority: P1)

As a design-system consumer, I can render supplied Other-artifact and Ops collections honestly in both present and absent states without inventing recursion, actions, or fields.

**Why this priority**: These route pairs prove that catalogue presence, current state, nested links, and committed empty states stay mutually consistent.

**Independent Test**: Render M6a/M6b and M7a/M7b, then assert exact child/row counts, hrefs, current-link rules, passive semantics, and the absence of fabricated children/actions.

**Acceptance Scenarios**:

1. **Given** four supplied Other artifacts, **When** M6a renders, **Then** all four appear as real bounded sidebar children and real main-content anchors from the same values.
2. **Given** no Other artifacts, **When** M6b renders through a direct stale route, **Then** the parent is unavailable with no children/current link and the main region states that artifacts are absent in this commit.
3. **Given** one supplied Ops row, **When** M7a renders, **Then** Ops is a terminal current link and the passive row exposes exactly Invocation, Action, and Status.
4. **Given** no Ops rows, **When** M7b renders, **Then** Ops is unavailable with no current link, children, row, execution control, or recovery action.

---

### User Story 3 - Distinguish factual, observed, and reported-live truth (Priority: P1)

As a reader, I can distinguish the committed factual document from observed activity and reported-live presence because each is a separate labelled semantic region with its own freshness claim.

**Why this priority**: Merging these tiers would create a materially false operational claim, especially an inferred live person-to-Work-Package association.

**Independent Test**: Render M8 and assert three distinct labelled regions, independent freshness text, the approved observed and live values, passive rows, and no shared relationship or page-wide sync label.

**Acceptance Scenarios**:

1. **Given** factual overview content, one observed WP02 transition, and one reported-live presence, **When** M8 renders, **Then** the regions retain separate labels and only the observed region associates Lynn with WP02.
2. **Given** the reported-live row, **When** its accessible content is inspected, **Then** it contains only actor, repository, branch, age, and reported-live/unverified wording—never a Work Package join.

---

### User Story 4 - Verify resilient presentations (Priority: P2)

As a design-system maintainer, I can review the family in the required light theme and under narrow, threshold-edge, zoom, forced-colors, reduced-motion, and long-content conditions without semantic or layout regressions.

**Why this priority**: The family cannot be adopted safely if it only matches one dark desktop screenshot.

**Independent Test**: Run focused browser layout/interaction/axe coverage, the composition gate, registered visual cases, and the full repository gate on the rebased exact final head.

**Acceptance Scenarios**:

1. **Given** the populated fixture in `.sk-light`, **When** LightMode renders, **Then** authoritative light tokens produce a valid readable composition distinct from dark mode.
2. **Given** 861px, 860px, 859px, 900px, 390px, and 200% zoom presentations, **When** the family renders with long paths and branches, **Then** public shell thresholds, wrapping, 72ch prose measure, local table overflow, and zero document overflow remain intact.
3. **Given** forced colors or reduced motion, **When** affected stories render, **Then** states remain visible without color alone and no pattern-owned motion is required for meaning.

### Edge Cases

- An all-unavailable catalogue has no false current item and remains understandable from visible text and native structure.
- An unavailable parent renders no implied or hidden child list.
- Long Mission, repository, branch, destination, annotation, and artifact values wrap without clipping at 240px and 390px.
- A completed-render fixture without a matching pushed marker omits pushed time; a matching marker displays only its supplied time.
- A table that genuinely overflows remains intact inside one named keyboard-reachable scroller; the document itself does not scroll sideways.
- Drawer focus cannot enter the closed compact-navigation region, and accepted Escape dismissal returns focus only to the valid controlling trigger.
- Direct visits to absent Other artifacts or Ops truthfully have no current navigation link.
- Loading placeholders remain assistive-hidden and meaningful without animation.

## Requirements

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Public composition only | As a maintainer, I want the Mission Reading family authored as Storybook pattern composition so no page component or application contract enters the library. | High | Open |
| FR-002 | Immutable fixture and projections | As a reviewer, I want one deeply immutable fixture and pure selectors to own every repeated identity, git, catalogue, document, artifact, Ops, observed, and live value. | High | Open |
| FR-003 | M1/M2 populated Specify | As a consumer, I want desktop and 390px views of the same populated Specify source, including a controlled compact drawer. | High | Open |
| FR-004 | M3 loading honesty | As a reader, I want stable labelled busy geometry without fabricated document facts, values, or actions. | High | Open |
| FR-005 | M4 unavailable canonical page | As a reader, I want absent Plan to remain visible as a native non-link while the real Specify link stays current. | High | Open |
| FR-006 | M5 same-SHA warning | As a reader, I want one bounded snapshot-behind explanation that preserves the one supplied SHA. | High | Open |
| FR-007 | M6 artifact pair | As a reader, I want supplied bounded artifact links in the present state and no children/current/action in the absent state. | High | Open |
| FR-008 | M7 Ops pair | As a reader, I want passive Ops rows limited to Invocation, Action, and Status, plus an honest action-free absent state. | High | Open |
| FR-009 | M8 truth separation | As a reader, I want factual, observed, and reported-live regions independently labelled with no inferred live actor-to-WP join. | High | Open |
| FR-010 | Truthful catalogue | As a consumer, I want the twelve canonical destinations in order, real anchors for available entries, landed unavailable anatomy for absent entries, bounded children only where supplied, and terminal Ops. | High | Open |
| FR-011 | Exact git integrity | As a reader, I want one planning SHA/branch, pushed time only from a matching marker, and no second SHA in snapshot-behind. | High | Open |
| FR-012 | Native content semantics | As an assistive-technology user, I want real landmarks, headings, lists, links, code, article/section markup, and an intact native table inside a named scroller. | High | Open |
| FR-013 | Proof and documentation | As an adopter, I want story IDs, focused tests, exact-head visual cases, and ownership documentation that make the full composition reproducible and reviewable. | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Accessibility | Every story has one H1, logical headings, correct native semantics, zero axe violations, truthful current/unavailable state, and no unavailable tab stop. | Accessibility | High | Open |
| NFR-002 | Responsive containment | At 1440×1024, 900px, 861/860/859px threshold edges, 390×844, and 200% zoom, the document has zero horizontal overflow; narrow content keeps 16px inline gutters and tables scroll only in their labelled region. | Responsive | High | Open |
| NFR-003 | Theme and media resilience | Default dark, valid `.sk-light`, forced-colors, and reduced-motion presentations preserve visible meaning and focus without color or motion alone. | Accessibility | High | Open |
| NFR-004 | Composition boundary | `check-pattern-composition.mjs` and its selftest pass with no private-root reach-through, duplicated component CSS, runtime CSS injection, or undeclared part access. | Architecture | High | Open |
| NFR-005 | Repository gates | Focused tests plus every required quality, type, build, Storybook, axe, browser, visual, mutation, generated-artifact, package, and composition gate pass. | Reliability | High | Open |
| NFR-006 | Exact-head evidence | The final train rebase is followed by regeneration and complete verification; every acceptance, visual, and adversarial review cites the exact reviewed head SHA. | Traceability | High | Open |
| NFR-007 | Storybook budget | The repository's Storybook build remains within its committed three-minute charter budget. | Performance | Medium | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | No new published component | Do not create a Mission reader, tier badge, skeleton/spinner, artifact/Ops/Mission row, link-list, truth-band, or document-tree component. | Scope | High | Open |
| C-002 | No application behavior | Do not add routing, fetching, HTMX, polling, timers, truth verification, comparison, persistence, search, filtering, sorting, pagination, editing, review, approval, comments, export, download, retry, refresh, share, or copy behavior. | Scope | High | Open |
| C-003 | Tokens and BEM | Pattern-owned CSS uses approved `--sk-*` tokens, semantic surface/foreground pairings, and `sk-mission-reading-pattern__*` BEM names only. | Technical | High | Open |
| C-004 | Loading is presentation only | Placeholder geometry and status remain pattern-owned; no document facts, action, published loader component, or application completion state is introduced. | Scope | High | Open |
| C-005 | Truth tiers do not join | Factual, observed, and reported-live data remain separate; live presence is never joined to a Work Package. | Integrity | High | Open |
| C-006 | Generated artifacts | Never hand-edit generated outputs; run repository generators and commit only their deterministic changes. | Technical | High | Open |
| C-007 | Train-only coordination | Rebase/regenerate against current `train/elements-first`, coordinate with #255 only through landed public code, target the PR and merge exclusively to the train, never `main`. | Process | High | Open |

### Key Entities

- **Mission Reading fixture**: immutable source for identity, git record, canonical catalogue, content, artifacts, Ops, observed moments, and reported-live presence.
- **Catalogue projection**: validates presence/current/children rules and produces native link or unavailable-entry render data without inferring routes.
- **Route-state projection**: selects M1–M8 content from supplied fixture values while preserving exact-commit and presence/absence invariants.
- **Truth region**: factual, observed, or reported-live semantic section with its own visible label and freshness scope.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Storybook exposes all required M1, M2, M3, M4, M5, M6a, M6b, M7a, M7b, M8, and LightMode stories from one pattern module.
- **SC-002**: Fixture tests prove deep immutability, exact catalogue order, at-most-one truthful current link, conditional pushed time, same-SHA snapshot behavior, artifact/Ops exclusivity, three-field Ops rows, and truth-tier separation.
- **SC-003**: Every registered Mission Reading story completes with zero axe violations and every unavailable entry is absent from link/button roles and sequential focus.
- **SC-004**: Browser tests pass at desktop, intermediate, 390px, threshold edges, zoom, forced colors, and reduced motion with zero page-level horizontal overflow.
- **SC-005**: The final reviewed head passes focused and full repository gates, and CI-authoritative full-composition plus targeted visual baselines are captured from that exact head.
- **SC-006**: The accepted mission merges only into `train/elements-first`, receives a passing post-merge mission review, and then closes #265 and epic #263 with both child missions verified.
