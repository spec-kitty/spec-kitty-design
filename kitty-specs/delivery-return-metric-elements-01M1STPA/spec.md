# Mission Specification: Delivery-return metric elements

**Mission Branch**: `mission/delivery-return-metric-elements`
**Created**: 2026-09-06
**Status**: Draft  
**Input**: `spec-kitty/spec-kitty-design` issue #147, governed by epic #144 and ADR-9/10/11.

## Intent and terminology

This mission adds two generic, presentational design-library elements:

- A **metric** is one consumer-supplied label paired with one opaque display value and an optional supporting annotation/status.
- An **evidence stage** is one immutable `{ id, label, displayValue, annotation?, tone? }` record.
- An **evidence chain** is the consumer-supplied ordered sequence of those stages, presented as one connected path by composing `sk-metric` for every stage.
- A **display value** is already formatted content. The design library neither parses nor recalculates it.

The Delivery return example is a required demonstration, not the public domain model. Public element names, types, defaults, documentation, and APIs remain free of Team Kitty concepts such as work packages, missions, spend attribution, or verified outcomes.

## User Scenarios & Testing

### User Story 1 - Read one supplied metric without hidden calculation (Priority: P1)

As a design-system consumer, I can present a supplied label, display value, and optional annotation/status with the approved visual hierarchy while retaining ownership of all formatting and domain calculations.

**Why this priority**: `sk-metric` is the smallest reusable contract and the composition unit for the evidence chain.

**Independent Test**: Render the element with frozen strings and each supported presentation option; verify the visible and accessible output contains those strings verbatim, omits absent optional content, and performs no numeric or domain transformation.

**Acceptance Scenarios**:

1. **Given** a label and a preformatted display value, **When** the metric renders, **Then** the label/value relationship is understandable visually and to assistive technology without surrounding layout.
2. **Given** an annotation and supported tone, **When** the metric renders, **Then** the annotation remains supporting content and the value remains the primary emphasis.
3. **Given** compact presentation, **When** the metric renders in a summary grid, **Then** it preserves the same content and semantics at the approved compact density.
4. **Given** a currency-looking, percentage-looking, or nonnumeric display value, **When** the metric renders, **Then** that exact supplied string is displayed without parsing, rounding, trend inference, or reformatting.

---

### User Story 2 - Read an ordered evidence path at any supported width (Priority: P1)

As a design-system consumer, I can supply an immutable ordered stage model and receive one accessible evidence path whose stages remain in the supplied order across horizontal and narrow vertical layouts.

**Why this priority**: The connected sequence is the mission's principal composite outcome and must remain generic beyond the four-stage reference fixture.

**Independent Test**: Assign frozen two-, four-, and six-stage arrays, including long labels and large values, and verify one `sk-metric` per stage, stable order/identity, visible connectors, an accessible ordered sequence, and vertical narrow reflow with unchanged order.

**Acceptance Scenarios**:

1. **Given** valid stages with unique stable IDs, **When** the chain renders, **Then** every stage appears exactly once and in input order through a composed `sk-metric`.
2. **Given** two, four, or six stages, **When** the chain renders, **Then** connectors visually join adjacent stages without implying a connector after the final stage.
3. **Given** a narrow viewport, **When** the chain reflows vertically, **Then** stage order and accessible sequence remain identical to the wide layout.
4. **Given** a frozen model, **When** the chain renders and rerenders, **Then** neither the array nor any stage record is sorted, rewritten, enriched, or otherwise mutated.
5. **Given** empty or invalid stage input, **When** the chain renders, **Then** it exposes a deterministic generic empty/invalid state rather than partial or fabricated evidence.

---

### User Story 3 - Consume the same public contract across supported surfaces (Priority: P2)

As an HTML or React consumer, I can use documented element APIs and generated wrappers without a Team Kitty dependency or an untyped structured property.

**Why this priority**: The component is reusable only if its contract survives the manifest and generated-consumer pipeline.

**Independent Test**: Regenerate the manifest, React wrappers, Vue declarations, CSS modules, and size report; type-check a React consumer assigning a readonly evidence-stage array and confirm no generated artifact drifts after a second generation.

**Acceptance Scenarios**:

1. **Given** the generated React wrapper, **When** a consumer assigns a readonly evidence-stage array, **Then** TypeScript preserves the exported stage shape without `any`.
2. **Given** default-dark and `LightMode` stories, **When** each is rendered, **Then** both meet WCAG 2.1 AA and use token-driven theming with no cross-shadow theme selector.
3. **Given** the required Delivery return demonstration, **When** it is composed with existing `sk-card`, `sk-grid`, and `sk-pill-tag` capabilities, **Then** no duplicate card, grid, tag, or Team-overview component is introduced.
4. **Given** a fresh regeneration at the same commit, **When** all generators run again, **Then** committed public artifacts are byte-stable.

## Edge Cases

- Missing optional annotation/status content produces no empty supporting chrome.
- Empty strings, malformed stage records, duplicate/blank IDs, and unsupported tones fail to a generic non-misleading state; the element never guesses corrected domain data.
- Long localized labels and large preformatted values wrap or remain readable without clipping or changing the supplied text.
- Two stages have one connector; six stages remain legible and do not assume the reference fixture's four-stage count.
- A stage model update that preserves an ID preserves that stage's rendered identity while updating supplied content; the component does not select or animate stages.
- Decorative connectors contribute no spoken characters or false list items to the accessibility tree.
- Forced-colors rendering retains stage/connector distinction without `forced-color-adjust: none`; reduced-motion adds no obligation because these elements own no animation.

## Requirements

### Functional Requirements

| ID | Title | Requirement | Priority | Status |
|----|-------|-------------|----------|--------|
| FR-001 | Supplied metric content | `sk-metric` MUST display a supplied label and supplied display value verbatim. | High | Open |
| FR-002 | Optional support | `sk-metric` MUST support an optional annotation/status and MUST omit its visual container when absent. | High | Open |
| FR-003 | Metric presentations | `sk-metric` MUST provide the approved eyebrow/strong-value hierarchy and a compact summary-grid presentation. | High | Open |
| FR-004 | Opaque display values | Neither element may parse currency, calculate percentages, infer trends, or otherwise derive domain meaning from a display value. | High | Open |
| FR-005 | Isolated semantics | A metric's label/value relationship MUST remain understandable to assistive technology when removed from its visual layout; surrounding headings and descriptions remain consumer-owned. | High | Open |
| FR-006 | Readonly stage contract | `sk-evidence-chain` MUST accept a property-only readonly ordered array structurally equivalent to `ReadonlyArray<Readonly<{ id: string; label: string; displayValue: string; annotation?: string; tone?: 'neutral' | 'info' | 'success' | 'attention' }>>`. | High | Open |
| FR-007 | Stable order and identity | Valid stage IDs MUST be non-empty and unique; the chain MUST preserve supplied stage order and use stable IDs without mutating consumer data. | High | Open |
| FR-008 | Metric composition | `sk-evidence-chain` MUST render stages by composing `sk-metric`, not by maintaining a second metric implementation. | High | Open |
| FR-009 | Connected path | The chain MUST render visible, decorative connectors only between adjacent stages so the set reads as one evidence path. | High | Open |
| FR-010 | Accessible sequence | The stages MUST be exposed as one ordered sequence, with connectors excluded from accessible names and item counts. | High | Open |
| FR-011 | Responsive reflow | The chain MUST support two, four, and six stages and reflow vertically at the narrow breakpoint without changing order. | High | Open |
| FR-012 | Safe invalid state | Empty or structurally invalid input MUST produce a deterministic generic empty/invalid presentation and MUST NOT render a partially trusted chain. | Medium | Open |
| FR-013 | Generic tones | Tone names and rendering MUST remain generic (`neutral`, `info`, `success`, `attention`) and MUST NOT encode Team Kitty state names. | High | Open |
| FR-014 | Generated consumers | The manifest-derived React wrapper and Vue declaration MUST expose the complete public contract; the React stage property MUST retain its readonly type without `any`. | High | Open |
| FR-015 | Required demonstrations | Stories MUST cover the approved-density four-stage Delivery return example, honest supporting annotations, long labels/large values, two/four/six stages, narrow vertical reflow, default dark, and `LightMode`. | High | Open |
| FR-016 | Public documentation | Every public property and declared `::part()` MUST be documented and recorded in the repository's exact/shrink-only ratchets with a targeting test for every part. | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Accessibility | Every new/changed Storybook scenario MUST report zero WCAG 2.1 AA violations under the repository axe gate; keyboard reading order and forced-colors distinction MUST remain valid. | Accessibility | High | Open |
| NFR-002 | Visual fidelity | Dark and `LightMode` stories MUST match the approved Team overview visual grammar, including hierarchy, density, tabular values, connectors, and narrow reflow, through the repository's visual review process. | Visual | High | Open |
| NFR-003 | Token fidelity | All component CSS values MUST resolve through existing or explicitly reviewed `--sk-*` tokens; no raw color, spacing, typography, radius, shadow, motion, or z-index values may ship in component CSS. | Maintainability | High | Open |
| NFR-004 | Deterministic artifacts | CSS modules, static output where applicable, `custom-elements.json`, React wrappers, Vue declarations, and `SIZES.md` MUST regenerate byte-identically at the final commit. | Reliability | High | Open |
| NFR-005 | Repository gates | The complete recipe-prescribed quality, type, build, manifest/wrapper drift, unit/browser, Storybook, axe, and visual-regression gates MUST pass after rebasing onto the latest `train/elements-first`. | Quality | High | Open |
| NFR-006 | Review evidence | Tier C pre-merge review MUST record three independent lens verdicts against the exact PR head, plus the required maintainer approval for component changes. | Governance | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | Presentational boundary | Elements own rendering and local accessibility only; they MUST NOT own fetching, stores, routing, timers, selection, application actions, or Team Kitty domain calculations. | Architecture | High | Open |
| C-002 | No Team Kitty dependency | Authored or generated package code MUST NOT import Team Kitty or expose Team Kitty-specific public names/defaults. Representative story copy is allowed only as fixture data. | Architecture | High | Open |
| C-003 | No overview aggregate | The mission MUST NOT introduce a public `sk-team-overview` element. | Scope | High | Open |
| C-004 | Reuse existing elements | The mission MUST reuse `sk-metric` within the chain and existing `sk-card`, `sk-grid`, and `sk-pill-tag` capabilities; it MUST NOT create stat-grid, card, grid, button, or tag substitutes. | Architecture | High | Open |
| C-005 | Canonical sources | CSS has one authored source in `packages/styles`; markup has one authored source in `packages/elements` only when a genuine static form exists. Generated outputs MUST NOT be hand-edited. | Architecture | High | Open |
| C-006 | Shadow styling API | Public styling is limited to inherited tokens, documented `::part()` surfaces, and documented per-component properties; no selector may cross a shadow boundary. | Architecture | High | Open |
| C-007 | Mission ownership | Authored component sources are limited to `metric` and `evidence-chain`; shared generated registries may change only as derived consequences of those sources. | Scope | High | Open |
| C-008 | Integration target | The eventual single mission PR targets only `train/elements-first`, uses `Refs #147`, and never merges or pushes `main`, publishes, or deploys. | Delivery | High | Open |

### Key Entities

- **Metric**: A presentation of one `label`, one opaque `displayValue`, optional `annotation`, generic `tone`, and compact/default presentation.
- **EvidenceStage**: An immutable record with a stable unique `id` and the metric content rendered for that stage.
- **EvidenceChain**: An ordered, non-owning view of `EvidenceStage` values that composes one metric per stage and adds only sequence semantics/connectors.
- **Consumer context**: The surrounding card, grid, section heading, description, and all application-owned calculations/actions supplied outside these elements.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A frozen four-stage Delivery return fixture renders all four supplied values and annotations exactly, in order, with one composed `sk-metric` per stage and no mutation of the fixture.
- **SC-002**: Two-, four-, and six-stage fixtures render the same item count/order in wide and narrow layouts; connector count is always `stage count - 1`.
- **SC-003**: Currency-looking, percentage-looking, large, and nonnumeric display strings survive element and generated React-wrapper rendering byte-for-byte with no `any` in the structured stage prop.
- **SC-004**: Every new required story reports zero axe violations in default dark and `LightMode`, and visual review approves both themes plus narrow reflow.
- **SC-005**: Source and generated package code contain zero Team Kitty imports and expose zero Team Kitty-specific public tags, exported types, properties, events, defaults, or calculations.
- **SC-006**: All repository-prescribed generation, drift, type, quality, build, test, Storybook, axe, visual, and release-graph gates pass at the exact final head after a latest-train rebase.
- **SC-007**: Three Tier C pre-merge lenses and one maintainer approve the exact PR head before any authorized merge to `train/elements-first`.

## Explicit non-goals

- Fetching or reconciling spend, completion, deployment, verification, WP, mission, or outcome data.
- Formatting currency, dates, percentages, relative age, trends, or time windows.
- Selection, links, buttons, navigation intent, live updates, polling, timers, or animation.
- A Team Kitty view/container or a public aggregate dashboard component.
- Reworking components or authored sources owned by #145, #146, #148, #149, or #150.
- Publishing packages, deploying consumers, or merging the integration train into `main`.
