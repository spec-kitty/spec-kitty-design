# Mission Specification: Team activity truth-region pattern stories

**Mission Branch**: `team-activity-truth-region-pattern-stories`
**Created**: 2026-09-11
**Status**: Specification complete — ready for planning
**Input**: Epic #381, child #382, the binding Family 1 programme handoff and approved
L1–L5/TL1/OA1/DM1 evidence, current train at
`0a232a01a17627de6f1553ad0948b8b2f6f4f286`, ADR-9/10/11, and current pattern precedents.
**Target**: One Work Package and one pull request into `train/elements-first` with
`Refs #382` and `Refs #381`.
**Squad tier**: C — independent pre-merge review; the implementer does not self-approve.

## Outcome

Give design-system consumers executable Storybook evidence for the complete Team activity
truth-region matrix. Immutable, consumer-shaped fixtures and pure projections render repository
reported-live states, mixed Team live regions, retained observed activity, and the smallest
identifier-only Decision event through public element/static/native surfaces. The mission creates
no runtime component or application state contract.

## Domain interpretation

- **Reported live** is supplied relay snapshot content labelled `Reported live · ≤90s`; every
  rendered L1 live entry separately carries the supplied `Presence · unverified` marker.
- **Observed** is retained/polled history labelled `Observed · up to 60 s behind` and a supplied
  retention window. It never inherits a live presence marker.
- **Factual/committed context** remains outside live and observed regions and is not degraded by a
  relay failure.
- **Decision** means exactly the supplied label `Decision` plus a wire-safe identifier. It does not
  entitle the library to question, answer, title, owner, source, workflow, or action fields.

## User Scenarios & Testing

### User Story 1 — Inspect repository live boundaries (Priority: P1)

As a Team Kitty frontend integrator, I can inspect populated, quiet, degraded, sequence-gap, and
unauthorized repository states and trust that each state reveals only its supplied truth.

**Why this priority**: conflating absence, relay degradation, a known sequence gap, or a 403 can
leak protected data or turn an uncertain snapshot into false history.

**Independent Test**: render L1–L5 from the frozen fixture, inspect native region/list/status/time
semantics, and assert exact inclusion and exclusion boundaries from the built Storybook stories.

**Acceptance Scenarios**:

1. **Given** L1 supplied presence, focus, and opaque-event entries, **when** the live region renders,
   **then** it names the reported-live boundary and every entry retains `Presence · unverified`.
2. **Given** L2 has no live entries, **when** it renders, **then** only the supplied ordinary quiet
   sentence replaces the list, with no warning, CTA, fallback history, or illustration.
3. **Given** L3 reports the relay unavailable, **when** it renders, **then** a notice appears inside
   the live boundary, no stale live row remains, and factual host context is unchanged.
4. **Given** L4 supplies complete sequence bounds and age text, **when** it renders, **then** that
   complete sentence precedes still-current live rows without inferred count or reconstruction.
5. **Given** L5 is unauthorized, **when** it renders, **then** the route-exact denial is the entire
   bare response and no protected host, repository, actor, branch, sequence, tier, or shell leaks.

---

### User Story 2 — Compare independently truthful Team live regions (Priority: P1)

As an operator scanning Team live activity, I can see repository sections with populated, quiet,
degraded, and gap states coexisting without a false Team-wide status or freshness claim.

**Why this priority**: an aggregate badge would erase the repository boundary where relay truth is
actually resolved.

**Independent Test**: render TL1 and assert four uniquely labelled repository regions, each with
its own supplied state and freshness treatment, with no aggregate freshness marker.

**Acceptance Scenarios**:

1. **Given** four admitted repositories in different supplied states, **when** TL1 renders, **then**
   each repository owns a separate named section and its state cannot affect a sibling section.
2. **Given** the gap repository still has current rows, **when** TL1 renders, **then** its supplied
   gap sentence remains local and precedes only those rows.

---

### User Story 3 — Read retained observed activity honestly (Priority: P1)

As a Team Kitty frontend integrator, I can inspect populated, retained-degraded, quiet, and loading
observed states under one canonical observed and retention boundary.

**Why this priority**: observed history must remain available during relay wake degradation without
being relabelled as live, while loading must preserve navigable heading semantics.

**Independent Test**: render all four OA1 projections, verify observed marker exclusions, retained
rows, supplied window copy, native headings/lists/time/status, and accessible busy/loading behavior.

**Acceptance Scenarios**:

1. **Given** populated observed moments and rollups, **when** OA1 renders, **then** they sit under
   `Observed · up to 60 s behind` and supplied retention copy with no presence marker.
2. **Given** retained data plus `relay_wake_stuck`, **when** degraded OA1 renders, **then** the
   supplied notice precedes the retained moment and recorded-activity rows.
3. **Given** no observed rows, **when** quiet OA1 renders, **then** it uses the supplied factual empty
   copy without a live claim.
4. **Given** OA1 is loading, **when** it renders, **then** the region is busy, its heading remains a
   heading, a separate polite status supplies loading text, and static skeleton geometry is hidden.

---

### User Story 4 — Recognize identifier-only Decisions (Priority: P1)

As an integrator, I can see a Decision event inside the canonical observed boundary without the
library inventing protected or unsupported Decision content.

**Why this priority**: the supplied identifier is the complete current wire contract; friendly
prose or workflow would falsely widen product capability.

**Independent Test**: render DM1 and assert its event row exposes exactly two text nodes—supplied
`Decision` and supplied wire-safe ID—while the fixture/story documentation records the Dossier
Mission `is_decision` branch as an application prerequisite only.

**Acceptance Scenarios**:

1. **Given** decision ID `dp-42`, **when** DM1 renders, **then** the row contains exactly `Decision`
   plus `dp-42` under the same observed boundary as OA1.
2. **Given** the Dossier Mission strip does not branch on `is_decision`, **when** the story is read,
   **then** that limitation is documented without presenting an additional shipped UI state.

---

### User Story 5 — Verify resilient presentation evidence (Priority: P2)

As a reviewer, I can verify the same supplied facts in dark, light, narrow, intermediate, long,
zoomed, RTL, forced-colors, and reduced-motion conditions without clipping or semantic drift.

**Why this priority**: a truth region that loses its label, relationship, or focus visibility under
stress ceases to communicate its boundary.

**Independent Test**: exercise built stories at required viewports and media preferences, run axe,
inspect the accessibility tree and keyboard order, assert zero root overflow, and compare reviewed
Chromium/Linux baselines.

**Acceptance Scenarios**:

1. **Given** default-dark and LightMode, **when** the same fixture renders, **then** ordered semantic
   content is identical and computed theme surfaces differ.
2. **Given** 390px, an intermediate width, a short viewport, 200% zoom, long localized copy, or RTL,
   **when** each evidence story renders, **then** logical layout contains all content with zero root
   horizontal overflow.
3. **Given** forced colors or reduced motion, **when** the corresponding story renders, **then**
   boundaries remain perceivable without hue alone and all pattern-owned motion is absent.
4. **Given** the pattern contains no application control, **when** keyboard order is inspected,
   **then** no passive row or fake destination introduces a tab stop.

### Edge Cases

- Duplicate repository IDs, entries, or truth-region IDs fail fixture validation.
- An L4 gap missing from/to sequence or supplied sentence fails closed; no count is derived.
- L3 with retained live rows fails; OA1 degraded without retained rows fails.
- L5 with any protected field beyond denial copy fails before render.
- Any observed entry carrying a presence marker, or any live entry missing it, fails validation.
- A Decision ID outside the supplied wire-safe identifier grammar fails validation.
- Loading text is not placed on the heading role and skeleton content never enters the accessibility
  tree.
- Long unbroken repository/branch/host values wrap locally and never widen the document root.

## Requirements

### Functional Requirements

| ID | Title | Requirement | Priority | Status |
|---|---|---|---|---|
| FR-001 | Pattern-only delivery | Add `Patterns/Team Activity` stories without registering/exporting a Team activity, live, observed, Decision, or tier component/API/helper. | High | Open |
| FR-002 | Immutable source | Export deeply frozen consumer-shaped fixture data and deeply frozen pure projections; reject invalid truth combinations before render. | High | Open |
| FR-003 | L1 populated | Render supplied presence, focus, and opaque event entries in one named reported-live region with entry-level supplied presence markers. | High | Open |
| FR-004 | L2 quiet | Render exact supplied quiet absence without warning, rows, history, illustration, or CTA. | High | Open |
| FR-005 | L3 degraded | Render the supplied relay-unavailable notice inside the live boundary, with zero live rows and unchanged factual context. | High | Open |
| FR-006 | L4 gap | Render the supplied complete gap sentence before still-current rows without inferred count, reconstruction, or observed claim. | High | Open |
| FR-007 | L5 unauthorized | Render only the route-exact denial in a bare response boundary and prevent every protected field from reaching output. | High | Open |
| FR-008 | TL1 mixed Team | Render populated, quiet, degraded, and gap repositories as independently named truth regions with no aggregate freshness/status. | High | Open |
| FR-009 | OA1 observed matrix | Render populated, retained-degraded, quiet, and loading observed projections with supplied freshness/retention copy; degraded retains rows. | High | Open |
| FR-010 | OA1 loading semantics | Keep a real heading, `aria-busy`, separate polite status, and accessibility-hidden static skeleton geometry. | High | Open |
| FR-011 | DM1 identifier-only | Render exactly supplied `Decision` plus supplied wire-safe ID inside the canonical observed boundary and record the Mission-strip prerequisite only. | High | Open |
| FR-012 | Truth separation | Mutually exclude presence markers from observed rows and observed markers/gap-history claims from live rows; add no page-wide sync claim. | High | Open |
| FR-013 | Consumer-supplied copy | Source every visible and accessible string from fixture/copy inputs under #286; introduce no element default or render-local product literal. | High | Open |
| FR-014 | Public composition | Use only public element/direct-import, generated/static, native-semantic, token and part surfaces; no private shadow access or copied component CSS. | High | Open |
| FR-015 | Required stories | Add a story for every L1–L5/TL1/OA1/DM1 boundary plus default-dark, same-fixture LightMode, narrow/intermediate, long, RTL, forced-colors, and reduced-motion evidence. | High | Open |
| FR-016 | Semantic proof | Use native landmark, section, heading, list, code, time, busy and status semantics; passive rows create no focus target. | High | Open |
| FR-017 | Fixture guard proof | Add focused guard assertions for L5 leakage, TL1 independence, OA1 retained degradation, DM1 identifier-only shape, and live/observed marker exclusion. | High | Open |
| FR-018 | Responsive/a11y proof | Prove 390/intermediate/1440, short viewport, long copy, 200% zoom, RTL, forced colors, reduced motion, axe, accessibility tree, keyboard order, and zero root overflow. | High | Open |
| FR-019 | Inventory and visuals | Update the exact story ratchet and visual inventory; commit only reviewed Chromium/Linux baselines produced through repository tooling. | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|---|---|---|---|---|---|
| NFR-001 | Determinism | Repeated projection/rendering under different clock/timezone conditions produces identical ordered labels, IDs, times, rows, and guard signatures. | Reliability | High | Open |
| NFR-002 | Accessibility | Every required built story is non-empty and has zero axe WCAG 2.1 AA violations; heading/list/time/status relationships are asserted from the accessibility surface. | Accessibility | High | Open |
| NFR-003 | Responsive containment | At 390px, intermediate width, 1440px, short viewport and calibrated 200% zoom, document `scrollWidth` does not exceed `clientWidth`. | Usability | High | Open |
| NFR-004 | Theme parity | Dark and LightMode reuse the exact fixture object and expose identical semantic signatures while computed page/card surfaces differ. | Visual | High | Open |
| NFR-005 | Cross-browser | Focused semantic/layout tests pass in Chromium, Firefox, and WebKit; pixel baselines remain Chromium/Linux only. | Compatibility | High | Open |
| NFR-006 | Gate integrity | Typecheck, lint/style/html, composition selftest/gate, unit, Storybook build, axe, Playwright, visual, artifact-size/generated, and gate-selftest commands pass on the final head. | Maintainability | High | Open |
| NFR-007 | Storybook budget | The checked Storybook build remains below the repository-enforced 180-second ceiling. | Performance | Medium | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|---|---|---|---|---|---|
| C-001 | Application ownership | Team Kitty retains routes, permissions, relay reads, polling, clocks, retention, truth/state classification, TeamMoment/onboarding, copy/i18n, clipboard, and mutations. | Architecture | High | Binding |
| C-002 | No runtime domain surface | No live/activity/Decision/tier/Team Overview component, generic helper, relay client, Topics UI, notification surface, or data model may ship. | Scope | High | Binding |
| C-003 | No state logic | No fetch, HTMX client, router, store, poller, timer, relative-time formatting, permission evaluation, gap detection/reconciliation, or truth inference enters the library. | Architecture | High | Binding |
| C-004 | No Mission-strip implementation | The Dossier Mission `is_decision` branch remains an explicitly recorded Team Kitty prerequisite, not library behavior. | Scope | High | Binding |
| C-005 | Public seams only | Do not copy component CSS, select private internals, reach through shadow roots, or widen an existing element solely for this pattern. | Architecture | High | Binding |
| C-006 | Existing tokens | Use current `--sk-*` tokens only; add no component- or pattern-specific token. | Design system | High | Binding |
| C-007 | Literal delivery branch | Work remains on `team-activity-truth-region-pattern-stories`; completed changes target `train/elements-first` and do not merge automatically. | Delivery | High | Binding |

## Definition of Done

- One bounded Work Package implements and verifies the full matrix.
- Required story and visual inventories include the new family and no unrelated entry changes.
- All required local gates pass immediately before push.
- One PR targets `train/elements-first`, references #382 and #381, and is left unmerged for an
  independent reviewer and human landing decision.
