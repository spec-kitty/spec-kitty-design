# Mission Specification: Compact Work-Item Extensions

**Mission Branch**: `mission/compact-work-item-extensions`  
**Created**: 2026-09-07  
**Status**: Draft  
**Input**: GitHub issue [#212](https://github.com/spec-kitty/spec-kitty-design/issues/212), part of epic [#208](https://github.com/spec-kitty/spec-kitty-design/issues/208)

## Purpose and Scope

Extend four existing public surfaces so consumers can reproduce the compact work items and empty
lanes in the approved T10 Work Package overview without creating Work Package-specific components:

1. `sk-action-row`: a reflected `layout="card"` presentation and an optional `supporting` slot;
2. `sk-entity-marker`: independent compact-size and circular-shape axes plus predictable slotted
   image presentation;
3. `sk-status-indicator`: an optional reflected `pulsing` presentation on its marker only; and
4. `.sk-empty-state`: an `--inline` modifier for short, passive empty-lane copy.

The extensions are presentation-only and backward compatible. Existing application-state,
activation, controlled-selection, native-semantics, status-tone, and notice ownership boundaries do
not move.

## Source Traceability

| Source | Authority carried into this specification | Requirement coverage |
|---|---|---|
| GitHub #212 | Binding outcome, four public extensions, required states, tests, generated artifacts, dependencies, and non-goals | FR-001–FR-031, NFR-001–NFR-009, C-001–C-017 |
| Epic #208 | T10 (`ac34a994f4eb4c058d0744bf757713ab`) supplies visual intent; T11 (`cd2b2a22c0cc43d6b53c69a76dd6df7d`) confirms programme composition boundaries but does not widen this child | FR-028, C-002–C-006, SC-009 |
| GitHub #146 | Existing `sk-action-row`, `sk-entity-marker`, and `sk-status-indicator` public contracts and the six-tone vocabulary | FR-001–FR-023, C-007, C-012 |
| GitHub #154 | Known generated-wrapper host `tabindex` defect that this mission must not worsen | NFR-006, C-013 |
| GitHub #176 | `.sk-empty-state` is a passive styles-only primitive over consumer-authored light-DOM content | FR-024–FR-027, C-005, C-009 |
| GitHub #177 | `sk-card[status]` and semantic card surfaces/tones have a sole owner outside this mission | FR-003, C-003–C-004 |
| GitHub #178 | `sk-notice` owns announced block-level messages; empty-state content remains passive | FR-026, C-005 |
| ADR-9 | Tokens, declared `::part()`, and documented per-component properties are the styling API; no selector crosses a shadow boundary | FR-006, NFR-007, C-007–C-008 |
| ADR-10 | Element markup is authored once and derived artifacts are generated; native-semantic styles-only components remain in light DOM | FR-024–FR-029, C-008–C-010 |
| ADR-11 | Applicable behavior, property-before-upgrade, styling API, style adoption, generated-wrapper, and mutation evidence is mandatory | FR-029, NFR-001, NFR-005–NFR-006 |
| `docs/contributing/adding-a-component.md` | Current story, documentation, ratchet, generation, forced-colors, reduced-motion, and quality-gate procedure | FR-027–FR-029, NFR-001–NFR-009 |
| Current train sources | Existing default rendering and behavior in the three elements and `.sk-empty-state` are the compatibility baseline | FR-002, FR-008–FR-010, FR-024, NFR-004 |
| Independently reproduced `scripts/run-axe-storybook.js` conflict | The render-evidence predicate excludes `img[alt=""]` and therefore rejects the required meaningful `sk-entity-marker[label]` image composition even though the upgraded host supplies the accessible name; its fail-closed blank-render protection must remain intact | FR-030–FR-031, C-016, NI-013, SC-011 |

Issue #212 is the implementation and acceptance authority. The approved Stitch references guide
visual intent only and cannot add behavior, data, or component ownership that the issue excludes.

## User Scenarios and Testing

### User Story 1 - Compose a Compact Work Item (Priority: P1)

As a consuming application, I can present an existing action row as a compact vertical card and
optionally add a full-width supporting line, while retaining the exact established selection and
activation contract.

**Why this priority**: The compact work item is the central repeated unit in T10, and every other
extension in this mission is composed inside or beside it.

**Independent Test**: Render `sk-action-row` with and without `layout="card"`, exercise static,
selectable, selected, long-content, missing-content, supporting-line, and nested-control states, and
verify the existing activation event and controlled selection are unchanged.

**Acceptance Scenarios**:

1. **Given** an action row with no `layout`, **when** it renders, **then** it retains the current row
   presentation and public behavior.
2. **Given** the same projected marker, title, reference, tags, metadata, and controls, **when**
   `layout="card"` is supplied, **then** the content reflows into a compact vertical summary without
   changing its meaning or interaction contract.
3. **Given** consumer content in the `supporting` slot, **when** either layout renders, **then** the
   supporting line occupies the available width as a secondary line and remains in the same
   accessible reading sequence as its visible position.
4. **Given** no marker, tags, or supporting content, **when** the card renders, **then** those absent
   channels create no false content and the remaining title, reference, metadata, and controls stay
   readable.
5. **Given** `layout="stacked"` or another unsupported value, **when** the row renders, **then** it
   warns and fails open to the existing row presentation without losing projected content.
6. **Given** a selectable row with a non-blank `rowId`, **when** a user activates it by pointer,
   Enter, or Space, **then** each action emits exactly one existing
   `sk-action-row-activate` event with exact `{ id }` detail.
7. **Given** a trailing native or custom control, **when** the user activates that control, **then**
   the control remains independently operable and emits no row activation.

---

### User Story 2 - Present a Compact Actor or Image Marker (Priority: P2)

As a consuming application, I can independently choose a compact size and circular shape for an
existing entity marker, and can slot an image without delegating identity work to the library.

**Why this priority**: T10 repeatedly uses a small circular actor marker, but the marker must remain
generic and keep its existing initials/icon use cases.

**Independent Test**: Render initials, icons, and consumer-supplied images across default/compact and
square/circle combinations, then inspect dimensions, crop behavior, and accessible names.

**Acceptance Scenarios**:

1. **Given** neither `size` nor `shape`, **when** the marker renders, **then** its current default
   size and shape remain unchanged.
2. **Given** `size="sm"`, **when** the marker renders, **then** only its size axis becomes compact.
3. **Given** `shape="circle"`, **when** the marker renders, **then** only its shape axis becomes
   circular.
4. **Given** `size="sm" shape="circle"`, **when** the marker renders, **then** both independent axes
   apply together without changing the supplied content.
5. **Given** a consumer-slotted image, **when** its intrinsic aspect ratio differs from the marker,
   **then** it predictably fills the marker boundary with cover/crop presentation and does not
   distort the marker layout.
6. **Given** a meaningful image marker, **when** the consumer supplies the host `label` and an image
   with `alt=""`, **then** the host label is the single accessible name and the image contributes no
   duplicate name.
7. **Given** a decorative marker, **when** no non-blank host label is supplied, **then** the existing
   decorative behavior is preserved.

---

### User Story 3 - Indicate Supplied Live Activity Without Owning Liveness (Priority: P2)

As a consuming application, I can opt a status marker into a pulse when I have already determined
that activity is live, while the supplied visible text continues to carry the meaning.

**Why this priority**: A live claim is visually recurrent in T10, but claim liveness is consumer
data and must not become library state.

**Independent Test**: Render pulse on/off, no-marker, every tone, multiple simultaneous indicators,
reduced-motion, and forced-colors cases; verify reflection, scope, independence, and a static
perceivable fallback.

**Acceptance Scenarios**:

1. **Given** `pulsing` is absent, **when** the indicator renders, **then** its current static marker
   and text presentation remain unchanged.
2. **Given** `pulsing` is present, **when** the indicator renders, **then** the reflected state affects
   only the marker wrapper; the visible text does not animate.
3. **Given** pulsing is requested without marker content, **when** the indicator renders, **then** no
   placeholder marker, timer, or replacement meaning is invented and the supplied text remains
   readable.
4. **Given** several pulsing indicators, **when** they render together, **then** each reflects only
   its own supplied state with no shared lifecycle or synchronization.
5. **Given** reduced motion is requested by the user, **when** a pulsing indicator renders, **then**
   animation stops and the marker retains a static perceivable emphasis.
6. **Given** forced colors, **when** pulse is on or off for any existing tone, **then** the marker
   remains distinguishable and visible text remains the meaning carrier.

---

### User Story 4 - Show a Passive Inline Empty Lane (Priority: P3)

As a consuming application, I can place a compact one-line empty-state treatment in an already
labelled lane while retaining ownership of its copy and semantics.

**Why this priority**: It removes repeated lane-specific CSS without confusing an empty placeholder
with an announced notice.

In this specification, “one-line” means **one compact structural message** rather than the existing
heading/body/action stack. It does not mean CSS `nowrap`: supplied copy may wrap at narrow widths and
must not be truncated merely to keep it on one physical line.

**Independent Test**: Render the inline modifier with short and long supplied copy at compact lane
widths in both themes and forced colors, then verify it adds no announcement, action, or invented
content.

**Acceptance Scenarios**:

1. **Given** an already-labelled empty lane, **when** a block uses
   `.sk-empty-state.sk-empty-state--inline` with “Nothing here”, **then** it renders as a compact
   passive line without requiring a heading, body, or action.
2. **Given** longer supplied copy at 220–360px, **when** the inline state renders, **then** all copy
   remains available and reflows without clipping or horizontal page overflow.
3. **Given** the existing non-inline empty-state examples, **when** the new modifier ships, **then**
   their current heading/body/action presentation remains unchanged.
4. **Given** dark, light, or forced-colors presentation, **when** the inline state renders, **then**
   its supplied copy remains readable and it acquires no live-region behavior.

### Acceptance-State Matrix

| Surface | Required states |
|---|---|
| Compact work item | Static, selectable, selected, long title/reference, no marker, no tags, no supporting line, live supplied supporting line, stale supplied supporting line, nested trailing control |
| Entity marker | Initials, icon, image, default size, compact size, square, circle, meaningful, decorative, long label |
| Status indicator | Pulse off, pulse on, no marker, all six existing tones, several simultaneous indicators, reduced motion, forced colors |
| Inline empty state | “Nothing here”, long supplied copy, compact lane width, default dark, required light mode, forced colors |

### Edge Cases

- `layout` is omitted, empty, or unsupported; only an unsupported non-empty value warns, and all
  cases render content rather than blanking the shadow root.
- `layout="card"` is combined with `selectable=false`, blank `rowId`, `selected=true`, or nested
  controls; none creates an extra tab stop or changes controlled selection.
- Card content contains an unbroken long reference and a long title at 220px; it wraps or contains
  its own overflow without clipping the focus indicator or forcing page-level horizontal scroll.
- Marker, tags, supporting content, and controls are independently absent; empty projection wrappers
  do not create misleading content or collisions.
- Marker `size` and `shape` are set independently and together; each accepted axis changes only its
  own presentation dimension.
- A portrait or landscape image has an intrinsic ratio unlike the marker; its rendering is cropped,
  not stretched, and remains contained by square and circular shapes.
- A meaningful image has a non-empty `alt`; documentation and tests identify that as a consumer
  error because it duplicates the host label, while the supported composition uses `alt=""`.
- The required upgraded `sk-entity-marker[label]` contains a directly slotted, genuinely rendered
  `img[alt=""]` and may sit beside visible text. The axe render-evidence gate must recognize the
  host's meaningful accessible output plus rendered decorative media as valid, even though the
  empty-alt image itself contributes no accessible name. A truly blank or unupgraded `sk-*` host
  must still fail the same gate.
- A host marker label is long or padded with whitespace; existing trimming and meaningful-versus-
  decorative behavior remain intact.
- `pulsing` is toggled after upgrade and assigned before upgrade; the reflected boolean state stays
  synchronized without changing tone or text.
- Pulse is enabled with an empty marker slot, with multiple indicators, under reduced motion, and
  under forced colors; none creates timers, shared state, or motion-only meaning.
- Inline empty copy is empty, short, or long; the primitive invents no fallback string, role,
  announcement, truncation, or action.

## Requirements

### Functional Requirements

| ID | Title | Requirement | Source | Priority | Status |
|---|---|---|---|---|---|
| FR-001 | Reflected card layout | `sk-action-row` MUST expose reflected `layout="card"` presentation. | #212 | High | Open |
| FR-002 | Default row compatibility | Omitting `layout` MUST retain the current default row layout and content projection. | #212, current source | High | Open |
| FR-003 | Presentation-only reflow | Card layout MUST reflow the existing marker, title, reference, tags, metadata, and controls without adding a status/tone axis or a second semantic card surface. | #212, #177 | High | Open |
| FR-004 | Supporting projection | `sk-action-row` MUST expose an optional named `supporting` slot for a full-width secondary line in either layout; absent content MUST remain optional. | #212 | High | Open |
| FR-005 | Supporting styling API | The supporting projection wrapper MUST be documented as `::part(supporting)` and be present and externally targetable whenever the row renders. | #212, ADR-9, recipe | High | Open |
| FR-006 | Reading-order integrity | In card layout, projected channels MUST occur in DOM/assistive-technology order consistent with their visible reading order; CSS reordering MUST NOT create a contradictory sequence. | #212, ADR-9 | High | Open |
| FR-007 | Layout fail-open | An unsupported non-empty layout MUST warn and render as the current row layout with all supplied content preserved. | #212 | High | Open |
| FR-008 | Activation preservation | `rowId`, `selectable`, controlled `selected`, and `sk-action-row-activate` with exact `{ id }` detail, bubbling/composed flags, and non-cancelable behavior MUST remain unchanged in both layouts. | #212, #146 | High | Open |
| FR-009 | Input parity | Pointer, Enter, and Space MUST remain equivalent and emit one activation for an actionable row in both layouts; repeated keydown suppression MUST remain effective. | #212, #146 | High | Open |
| FR-010 | Nested-control isolation | Native and custom trailing controls MUST remain outside the primary trigger and MUST NOT activate the row. | #212, #146, #154 | High | Open |
| FR-011 | Static focus behavior | A non-selectable row or a row with blank `rowId` MUST add no tab stop in either layout. | #212, #146 | High | Open |
| FR-012 | Sparse content | Card layout MUST remain coherent when marker, tags, supporting content, or controls are independently absent. | #212 | Medium | Open |
| FR-013 | Marker size axis | `sk-entity-marker` MUST expose `size="sm"` as an independent compact-size presentation; omitted `size` MUST retain the current size. | #212 | High | Open |
| FR-014 | Marker shape axis | `sk-entity-marker` MUST expose `shape="circle"` as an independent circular presentation; omitted `shape` MUST retain the current shape. | #212 | High | Open |
| FR-015 | Marker axis composition | `size="sm"` and `shape="circle"` MUST work separately and together without changing consumer content or accessible-name behavior. | #212 | High | Open |
| FR-016 | Slotted image presentation | A consumer-slotted image MUST fill the marker predictably using cover/crop presentation for differing intrinsic aspect ratios in default, compact, square, and circle states. | #212 | High | Open |
| FR-017 | Single image name | A meaningful image marker MUST use the host `label` as its one accessible name and a consumer-supplied image with `alt=""`; documentation and tests MUST state this composition rule. | #212 | High | Open |
| FR-018 | Decorative marker preservation | An absent or whitespace-only host label MUST retain the current decorative marker behavior for initials, icons, and images. | #212, #146 | High | Open |
| FR-019 | Marker content neutrality | The element MUST continue to render consumer-supplied initials, icons, and images verbatim and MUST NOT derive identity content. | #212, #146 | Medium | Open |
| FR-020 | Reflected pulse | `sk-status-indicator` MUST expose a reflected boolean `pulsing` presentation state. | #212 | High | Open |
| FR-021 | Marker-only pulse | Pulsing presentation MUST apply only to the marker wrapper and MUST NOT animate, replace, hide, or synthesize visible status text. | #212 | High | Open |
| FR-022 | Motion-independent meaning | Supplied visible text MUST remain required by the public contract; pulse MUST never be the sole carrier of “live”. | #212 | High | Open |
| FR-023 | Pulse fallbacks | Reduced motion MUST replace animation with static perceivable marker emphasis; forced colors MUST retain marker distinction; no-marker and multiple-indicator states MUST remain coherent. | #212, recipe | High | Open |
| FR-024 | Inline empty modifier | The existing styles-only `.sk-empty-state` family MUST add `.sk-empty-state--inline` for one compact structural empty-lane message rather than a heading/body/action stack; “one-line” MUST NOT impose `nowrap` or truncation. | #212, #176 | High | Open |
| FR-025 | Complete supplied copy | Inline empty-state copy MUST remain consumer supplied and complete; long copy MUST reflow at compact widths rather than be silently truncated or clipped. | #212 | High | Open |
| FR-026 | Passive empty semantics | The inline modifier MUST invent no copy, heading, announcement, live region, action, or status semantics and MUST remain distinct from `sk-notice`. | #212, #176, #178 | High | Open |
| FR-027 | Empty-state exemplar | A focused authored inline empty-state exemplar and story coverage MUST feed the existing styles-only generated barrel; generated outputs MUST NOT be hand-edited. | #212, ADR-10 | Medium | Open |
| FR-028 | Story coverage | Focused stories MUST cover every new axis and the acceptance-state matrix, including one T10 compact-item composition, default dark presentation, and required `LightMode`. | #212, #208, recipe | High | Open |
| FR-029 | Verification and distribution | Focused behavior/mutation tests, React type tests for every new element property, documentation and ratchet updates, and regeneration of CSS modules, manifest, wrappers, styles-only output, and size report MUST ship together. | #212, ADR-11, recipe | High | Open |
| FR-030 | Valid image render evidence | The axe anti-vacuity gate MUST accept the required upgraded `sk-entity-marker[label]` composition when a directly slotted, actually rendered `img[alt=""]` supplies the visual and the host supplies the meaningful accessible name. Recognition MUST use actual meaningful accessible rendered content, or equivalently precise valid evidence, rather than treating the empty-alt image or a bare attribute promise as sufficient by itself. | #212 acceptance need, reproduced gate conflict | High | Open |
| FR-031 | Render-verdict self-test | A focused gate self-test MUST prove the valid meaningful-image fixture passes and MUST prove both a truly blank component host and an unupgraded `sk-*` host still fail through the same render-verdict seam used by the wait and assertion. | ADR-11 anti-vacuity, reproduced gate conflict | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|---|---|---|---|---|---|
| NFR-001 | Accessibility gate | All affected and new Storybook stories MUST report zero axe WCAG 2.1 AA violations, with non-empty successfully loaded render roots. | Accessibility | High | Open |
| NFR-002 | Narrow-lane resilience | At 220px, 360px, and at least one intermediate lane width, every required compact-item and inline-empty state MUST show no content collision, clipped focus ring, or page-level horizontal overflow. | Responsive usability | High | Open |
| NFR-003 | Keyboard equivalence | Across both action-row layouts, focused tests MUST demonstrate one event each for pointer, Enter, and Space, zero events from nested controls, and zero tab stops for non-actionable rows. | Accessibility | High | Open |
| NFR-004 | Backward compatibility | Existing default visual and behavior baselines for all four public surfaces MUST remain green; intended baseline additions MUST be limited to new states. | Compatibility | High | Open |
| NFR-005 | Mutation evidence | Every changed behavior covered by the applicable ADR-11 registry MUST have a unique, non-inert red-first mutation arm, with zero unexplained collateral failures. | Test integrity | High | Open |
| NFR-006 | Typed wrapper fidelity | Generated React types MUST expose `layout`, `size`, `shape`, and `pulsing` with their exact public types and without `any`; this mission MUST add no host `tabindex` forwarding or duplicate focus stop beyond the known #154 baseline. | Type safety | High | Open |
| NFR-007 | Token and theme compliance | Component CSS MUST use authoritative `--sk-*` tokens for 100% of design values, use no cross-shadow theme selectors, and render the required states in both default dark and `.sk-light` themes. | Design-system consistency | High | Open |
| NFR-008 | User-preference resilience | Pulse and all interactive/action affordances MUST retain their specified meaning and visibility under `prefers-reduced-motion: reduce` and `forced-colors: active`, verified by focused assertions or documented visual evidence. | Accessibility | High | Open |
| NFR-009 | Zero-drift quality | Type checks, lint, generated-artifact checks, behavior suites, mutation self-test, Storybook build, axe, relevant Playwright/visual checks, and `npm run quality:all` MUST complete with zero failures on the final mission head. | Reliability | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|---|---|---|---|---|---|
| C-001 | Four extensions only | Scope is limited to the four backward-compatible extensions named in this specification. | Scope | High | Open |
| C-002 | No Work Package component | Do not create `sk-work-package-card`, `sk-summary-card`, a stateful Kanban component, or a full-page Work Package element. | Ownership | High | Open |
| C-003 | Card-tone ownership | Do not add status-toned action rows or entity markers and do not duplicate #177's `sk-card[status]` surface/tone ownership. | Ownership | High | Open |
| C-004 | No nested tone imitation | Do not nest an action-row card presentation inside a toned `sk-card` merely to copy T10's border; visible tags/indicators carry lane/status meaning. | Composition | High | Open |
| C-005 | Notice boundary | Inline empty state is passive and MUST NOT duplicate #178's announced, block-level `sk-notice` ownership. | Accessibility ownership | High | Open |
| C-006 | Application state excluded | Routing, fetching, lane movement, drag/drop, timers, claim/heartbeat expiry, liveness inference, status mapping, relative-time formatting, and other application state remain outside the library. | Scope | High | Open |
| C-007 | One tone vocabulary | Existing `sk-status-indicator` tones remain exactly neutral, info, success, attention, danger, and recovery; this mission adds no tone or domain mapping. | Public API | High | Open |
| C-008 | Dependency direction | Preserve `tokens → styles → elements → generated React wrappers`; no package may bypass or reverse that dependency flow. | Architecture | High | Open |
| C-009 | Native/light-DOM semantics | `.sk-empty-state--inline` remains a styles-layer class on consumer-authored light-DOM content; no wrapper element re-hosts it. | Architecture | High | Open |
| C-010 | Generated-only outputs | Generated CSS modules, static barrels, manifest, React wrappers, Vue declarations, and size report are regenerated through repository tooling, never hand-edited. | Build integrity | High | Open |
| C-011 | Consumer-supplied image | The consumer supplies image bytes and alternate-text choice; the element performs no fetching, lookup, caching, or image generation. | Data boundary | High | Open |
| C-012 | No identity derivation | The library performs no initials generation, actor lookup, or trust/liveness inference. | Data boundary | High | Open |
| C-013 | Do not worsen #154 | No new property or wrapper behavior may make the custom-element host an additional focus stop; the existing real interactive control remains the only row trigger. | Compatibility | High | Open |
| C-014 | No pulse lifecycle | `pulsing` is a supplied presentation flag only: no timer, subscription, stale threshold, heartbeat, or domain-to-tone mapping enters the component. | State boundary | High | Open |
| C-015 | Existing contracts preserved | The existing parts, slots, properties, event shape/flags, selection model, and six tones may only receive the additive changes explicitly listed here. | Backward compatibility | High | Open |
| C-016 | Bounded axe-gate correction | Gate work is limited to correcting render-evidence classification and its focused self-tests. It MUST NOT weaken the non-empty-root or per-host fail-closed guards, accept a bare `aria-label`/role on an otherwise empty host as content, change axe rules, or redesign the wider gate. | Test integrity | High | Open |
| C-017 | Token-bounded visual interpretation | Exact visual values unavailable from the approved Stitch reference MUST be chosen only from existing authoritative `--sk-*` tokens. T10 supplies qualitative visual intent; this mission MUST NOT claim pixel fidelity for values the reference does not expose. | Visual scope | High | Open |

## Public-Surface Deltas

| Surface | Existing public contract retained | Additive delta |
|---|---|---|
| `sk-action-row` | `row-id`, `selectable`, `selected`; marker/title/reference/tags/metadata/controls slots; eight parts; activation event | Reflected `layout`; `supporting` slot; `supporting` part |
| `sk-entity-marker` | Reflected `label`; default slot; marker/content parts; meaningful/decorative name behavior | Reflected `size`; reflected `shape`; documented image composition |
| `sk-status-indicator` | Reflected `tone`; marker/default slots; status/marker/text parts; six tones | Reflected boolean `pulsing` |
| `.sk-empty-state` | Styles-only heading/body/action presentation | `.sk-empty-state--inline` plus generated exemplar/barrel export |

On the current mission base, the documented-API ratchet therefore gains four element attributes
(`layout`, `size`, `shape`, `pulsing`), and the parts ratchet gains one action-row part
(`supporting`). Rebase-time changes to repository totals do not change these per-element deltas.

## Negative Invariants

| ID | Invariant |
|---|---|
| NI-001 | Omitting every new attribute/modifier MUST produce the pre-mission default presentation and behavior. |
| NI-002 | `layout="card"` MUST NOT create a new element, status axis, domain model, or semantic card contract. |
| NI-003 | Action-row activation MUST NOT mutate `selected`, navigate, fire for a non-actionable row, or fire from a nested trailing control. |
| NI-004 | The supporting slot MUST NOT become a claim model, live region, timer, or inferred liveness source. |
| NI-005 | Entity-marker size and shape MUST NOT fetch an image, derive initials, perform identity lookup, or change host-label ownership. |
| NI-006 | A meaningful slotted image MUST NOT contribute a second accessible name in the documented supported composition. |
| NI-007 | `pulsing` MUST NOT animate visible text, synthesize status text, infer tone, start a timer, subscribe to heartbeats, or expire itself. |
| NI-008 | Motion MUST NOT be the sole signal of “live”; disabling motion MUST NOT remove all perceivable marker emphasis. |
| NI-009 | `.sk-empty-state--inline` MUST NOT add copy, a heading, a role, a live region, an action, or notice semantics. |
| NI-010 | No generated file is an authored source and no generated file may be edited to make a drift gate pass. |
| NI-011 | No raw design value, cross-shadow theme selector, new tone vocabulary, or reversed package dependency may be introduced. |
| NI-012 | No Team Kitty routing, data, lane state, progress arithmetic, trust rules, claim expiry, or Markdown processing enters this mission. |
| NI-013 | Correcting the valid meaningful-image case MUST NOT allow a truly blank, unupgraded, or attribute-only empty component host to pass the axe anti-vacuity gate. |

## Assumptions

- #146 and #176 are closed prerequisites; their current contracts on the latest
  `train/elements-first` are authoritative.
- #177 and #178 are already landed boundaries: this mission consumes their concepts only to avoid
  overlap and does not change them.
- #154 remains an open known wrapper defect. This mission neither fixes it nor expands its impact.
- Consumers already decide whether activity is live or stale and supply the corresponding visible
  text, marker content, tone, image, label, and empty-state copy.
- T10 visual intent can be achieved by composing these extensions with existing public surfaces;
  T11 does not add another component requirement to this issue.
- The existing token catalogue is the authority for design values. Any need for a genuinely new
  architecture or ownership decision must be surfaced rather than decided inside implementation.
- Exact pixel values could not be recovered from the approved Stitch reference during
  specification. Presentational choices therefore stay within existing authoritative tokens and
  are evaluated for qualitative intent, accessibility, and consistency—not claimed pixel identity.

## Dependencies and Handoff

| Dependency | State at specification time | Relevance |
|---|---|---|
| #146 | Closed | Supplies the three elements and their existing contracts. |
| #176 | Closed | Supplies `.sk-empty-state` and its styles-only/passive boundary. |
| #154 | Open, read-only dependency context | Generated-wrapper double-tab-stop behavior must not worsen. |
| #177 | Closed | Sole owner of status-toned card surfaces and semantic card tones. |
| #178 | Closed | Sole owner of announced block-level notice behavior. |
| #208 | Open | Parent epic and T10/T11 programme contract. |
| #214 | Blocked by this and sibling missions | Consumes these public surfaces in final overview/detail pattern stories. |

Squad tier is **B**: post-tasks and pre-merge point-cuts. Planning and task slicing must preserve a
single coherent release of all four extensions so #214 never observes a partially documented
public contract.

## Success Criteria

### Measurable Outcomes

- **SC-001**: All four additive public extensions are present, documented, and usable together
  without adding any new Work Package-specific element.
- **SC-002**: `sk-action-row` passes the full required state matrix in default and card layouts,
  including exact one-event pointer/Enter/Space parity, zero nested-control row events, and zero
  non-actionable tab stops.
- **SC-003**: Compact action rows and inline empty states render at 220px, 360px, and at least one
  intermediate width with zero collisions, clipped focus indicators, or page-level horizontal
  overflow.
- **SC-004**: Marker tests cover initials, icon, and image across both sizes and both shapes, and
  confirm exactly one accessible name for the documented meaningful-image composition.
- **SC-005**: Pulse tests prove reflected on/off state, marker-only scope, multiple-instance
  independence, a static reduced-motion emphasis, and retained forced-colors distinction.
- **SC-006**: The inline empty-state exemplar proves short and long consumer copy, both themes, and
  forced colors while exposing zero invented announcement or action semantics.
- **SC-007**: Existing default behavior and visual baselines for action row, entity marker, status
  indicator, and non-inline empty state remain green with no unintended baseline changes.
- **SC-008**: Generated React declarations expose the four new element properties with exact types
  and no `any`; all generated-artifact drift checks report zero differences.
- **SC-009**: Storybook contains focused new-axis stories and one T10 compact-item composition in
  default dark and `LightMode`, with zero axe violations and green relevant visual regressions.
- **SC-010**: The final rebased mission head passes focused tests, type checks, lint, applicable
  mutation checks, Storybook build, axe, relevant Playwright/visual gates, and
  `npm run quality:all` without weakening or skipping a gate.
- **SC-011**: The gate self-test passes one positive fixture consisting of an upgraded,
  meaningfully labelled entity marker with actually rendered decorative `img[alt=""]`, while
  negative fixtures for a blank host and an unupgraded `sk-*` host are both rejected by the same
  render-verdict function.
