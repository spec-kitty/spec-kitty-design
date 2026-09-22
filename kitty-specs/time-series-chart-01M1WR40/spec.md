# Mission Specification: sk-time-series-chart

**Mission Branch**: `mission/time-series-chart`
**Created**: 2026-09-07
**Status**: Draft
**Input**: GitHub issue #179 — "[elements] sk-time-series-chart — gap-aware accessible line chart, after #148". Last open child of epic #183.

## Context and measured premises

Three of #179's own premises were re-measured on `train/elements-first@5fd031d` before this spec was written. Two were false and one was stale; the spec is written against the measurements, not the issue text.

1. **"Reuses #148's chart token family"** — FALSE. `grep -oE '\-\-sk-chart-[a-z-]+' packages/tokens/src/tokens.css` returns nothing. #148 shipped **three** semantic data aliases under a different prefix: `--sk-color-data-baseline`, `--sk-color-data-grid`, `--sk-color-data-series-primary`. (#179's risk section says "one data-specific token"; there are three.) #179's own instruction covers this: *"If #148 lands without it, the gap is closed here, once, for both."*
2. **"Reduced-motion and forced-colors baselines are absent"** — STALE. Both exist. `packages/styles/src/bar-chart/sk-bar-chart.css` carries `@media (prefers-reduced-motion: reduce)` and `@media (forced-colors: active)`, as do `sk-notice`, `sk-skip-link`, `sk-disclosure` and `sk-data-table`. This mission **consumes** those patterns and records none as missing.
3. **"The `ssrSafe` structured-property delivery path is unproven"** — DISCHARGED by #148. `scripts/normalise-manifest.mjs` marks a property-only field `x-spec-kitty-property-only`, `scripts/build-react-wrappers.mjs` reads that marker plus `x-spec-kitty-property-reset`, and `fixtures/react-consumer/src/sk-bar-chart.test.tsx` proves first-render delivery of an array-of-objects property to an undefined element and a frozen empty-array reset. This mission re-proves it for its own property rather than re-deciding it.

There is also **no shared chart module**: `packages/elements/src/bar-chart/` is four self-contained files. This mission imports nothing from it and widens none of its API.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - An outage is visible as an outage (Priority: P1)

An operator reads a throughput panel across a window in which collection stopped for two hours. The line **breaks**; it neither interpolates across the outage nor drops to zero. A screen-reader user reading the same panel hears each missing interval reported as having **no observation**.

**Why this priority**: This is the defect the element exists for. A smooth interpolation across an outage is a chart telling a confident lie, and an absent bar and a zero bar being the same picture is exactly what #148's model cannot express.

**Independent Test**: Feed a series with an interior null run; assert the rendered geometry contains two disjoint line segments rather than one, that no drawn vertex sits on the baseline for a null interval, and that the published tabular representation carries a "No data" cell for each null.

**Acceptance Scenarios**:

1. **Given** a series whose points 3 and 4 are null, **When** the chart renders, **Then** two separate line segments are drawn, a gap marker spans the null interval, and no path vertex exists at either null timestamp.
2. **Given** the same series, **When** the tabular equivalent is read, **Then** the rows for points 3 and 4 read "No data" and are not empty and not "0".
3. **Given** a series whose first two and last two points are null, **When** the chart renders, **Then** the time window still spans the first and last timestamps — the axis is not shortened to the first and last observations.
4. **Given** a series in which every point is null, **When** the chart renders, **Then** the graphic draws no line, a full-width gap is shown, and every table row reads "No data".

---

### User Story 2 - Every value is readable without a pointer (Priority: P1)

A keyboard-only user, and a user reading a printed export, both need each point's value. Neither can hover.

**Why this priority**: #179's evidence pins `factory-dashboard@1fb95bc` publishing values on hover only, with no tabular equivalent anywhere. A chart whose data is reachable only by pointer is not an accessible chart.

**Independent Test**: Render a 500-point series with no pointer interaction at all and assert every supplied `displayValue` is present in the DOM text and in the paired table, in source order.

**Acceptance Scenarios**:

1. **Given** any valid series, **When** the element renders, **Then** the paired table is in the DOM with one row per point, in source order, carrying the series name, the point's supplied label, its display string verbatim (or "No data"), and its supplied resolution.
2. **Given** a 500-point non-selectable series, **When** the user tabs through the page, **Then** the chart contributes no tab stop other than the table scroller when the scroller genuinely overflows.
3. **Given** any series, **When** the graphic is inspected, **Then** the SVG is `aria-hidden="true"` and carries no accessible content of its own.

---

### User Story 3 - Two series stay apart in greyscale and in forced colors (Priority: P2)

A user with a forced-colors theme, and a user printing in greyscale, both see every series stroke collapse to the same ink.

**Why this priority**: #179 names this explicitly: series distinguished by hue *collapse* under forced colors. If hue is the only channel, the chart is unreadable for those users and the gap treatment can vanish with it.

**Independent Test**: Render four series and assert that stroke dash pattern **and** marker shape both differ between every pair, independently of colour, and that the gap treatment is still drawn under `forced-colors: active` rules.

**Acceptance Scenarios**:

1. **Given** four series, **When** the chart renders, **Then** each series' line carries a distinct `stroke-dasharray` and each series' markers are a distinct shape.
2. **Given** the authored stylesheet, **When** the `forced-colors: active` block is parsed, **Then** the gap treatment and the focus ring are both expressed with system colours on longhand properties, and no rule sets `forced-color-adjust: none`.

---

### User Story 4 - A resolution change is legible, not silent (Priority: P2)

A window widens and the back end switches a segment from raw per-event samples to hourly aggregates. The reader must not mistake an aggregate for a raw observation.

**Why this priority**: #179's evidence pins panels that switch resolution "with no marker of the transition". The element never chooses a resolution — the consumer supplies it per point — but it must make a supplied change visible.

**Independent Test**: Feed one series whose first segment is `raw` and second is `hour`; assert the two segments render with distinguishable segment treatment, that the value and time scales are computed once over the whole series, and that the table states each row's resolution.

**Acceptance Scenarios**:

1. **Given** a mixed-resolution series, **When** it renders, **Then** the raw and hour segments are visually distinguished and a visible transition marker sits at the boundary.
2. **Given** the same series, **When** the axis extents are computed, **Then** they are identical to those computed for the same points with a uniform resolution — the axis does not rescale mid-chart.
3. **Given** the same series, **When** the table is read, **Then** every row states its own resolution.

---

### User Story 5 - Selection is the application's, not the chart's (Priority: P2)

An application owns which point is selected. Activating a point asks for a change; it does not make one.

**Independent Test**: Activate a point by pointer and by keyboard; assert one typed event each time, assert the element's own `selectedId` is unchanged, and assert `preventDefault()` suppresses the element's own default action.

**Acceptance Scenarios**:

1. **Given** a selectable chart, **When** a point is activated by click, by Enter and by Space, **Then** exactly one `sk-time-series-chart-select` event is emitted per activation, carrying a frozen `{ seriesId, pointId }` detail, bubbling, composed and cancelable.
2. **Given** a selectable chart, **When** a point is activated, **Then** `selectedId` is not mutated by the element.
3. **Given** a listener that calls `preventDefault()`, **When** a point outside the visible scroll extent is activated, **Then** the element does **not** scroll it into view; without `preventDefault()` it does.
4. **Given** a non-selectable chart, **When** the user tabs, **Then** no point is focusable and no `aria-pressed` node exists.

### Edge Cases

- Empty series array, a series with zero points, a single-point series, and an all-null series each render a stable state rather than a partial one.
- Duplicate point ids across series, non-finite timestamps, non-monotonic timestamps, a non-`raw`/`hour` resolution, a blank label or display string: the whole chart fails closed to one labelled unavailable state, matching `sk-bar-chart`'s fail-closed contract.
- All timestamps identical: the time extent is degenerate; positions collapse to a single x without dividing by zero.
- All values identical (including all-zero): the value extent is degenerate; the line is drawn at a stable position without dividing by zero.
- A supplied `gapThreshold` of 0 or a negative or non-finite value annotates nothing; only a positive finite threshold produces gap notes.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Null breaks the line | As a dashboard reader, I want a missing interval to break the line so that an outage is never drawn as an interpolation or as zero. | High | Open |
| FR-002 | Gap is a drawn object | As a reader who cannot hover, I want each null run to draw a visible gap marker so that absence is discoverable without colour or pointer. | High | Open |
| FR-003 | Window is not shortened by nulls | As a reader, I want leading and trailing nulls to keep their place on the time axis so that the window I asked for is the window I see. | High | Open |
| FR-004 | Supplied gap threshold only | As a consumer, I want gap annotation to fire only beyond a threshold I supply so that the element infers no policy of its own. | Medium | Open |
| FR-005 | Position derives from the timestamp | As a reader, I want unequal sample spacing to be visible so that position means time and not index. | High | Open |
| FR-006 | Persistent published values | As a keyboard or screen-reader user, I want every value present in the DOM without hover or focus so that no meaning is pointer-only. | High | Open |
| FR-007 | Paired tabular equivalent | As a reader of a dense or narrow view, I want a real table of the same series so that the data is reachable when the graphic is not. | High | Open |
| FR-008 | Supplied per-segment resolution is stated and marked | As a reader, I want a resolution change to be visible and announced so that an aggregate is not read as a raw observation. | Medium | Open |
| FR-009 | Non-colour series differentiation | As a forced-colors or greyscale reader, I want series to differ by dash pattern and marker shape so that differentiation survives hue collapse. | High | Open |
| FR-010 | Controlled selection with a typed cancelable event | As an application author, I want activation to emit a typed, bubbling, composed, cancelable request that never mutates my state. | High | Open |
| FR-011 | Keyboard and pointer equivalence | As a keyboard user, I want Enter and Space to do exactly what a click does, once each. | High | Open |
| FR-012 | Fail-closed validation | As a consumer, I want an invalid series to produce one labelled unavailable state so that no partial or stale chart is ever shown. | High | Open |
| FR-013 | `--sk-chart-*` token family | As the design system, I want one chart token family that `sk-bar-chart` could also consume so that data-visualisation colour is owned once. | High | Open |
| FR-014 | Structured property reaches the React wrapper | As a React consumer, I want the series to arrive on first render without an attribute so that `ssrSafe` does not silently drop it. | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Mutation-harness budget | The mission's added mutation arms must keep `scripts/suite-selftest.mjs` under the ratified `selftestCeilingSeconds` of 1405.5s. The last recorded point is 1286.0s at 155 arms (`7a56e7e`, run 34065216159): 119.5s of measured headroom at 8.30s per arm. If the measured figure breaches, the figure is reported and the ceiling is **not** raised — it is #225's, held by an operator ruling. | Performance | High | Open |
| NFR-002 | Dense-series usability | A 500-point series renders with the persistent representation and table intact and contributes no tab stop when non-selectable. | Usability | High | Open |
| NFR-003 | Contrast | Every series ink and the gap ink reach at least 3:1 against `--sk-surface-card` in both themes, asserted rather than asserted-by-eye. | Accessibility | High | Open |
| NFR-004 | Axe-clean stories | Every story registered in `expected-stories.json` passes `scripts/run-axe-storybook.js`. | Accessibility | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | No clock, no timers, no fetching | The element reads no runtime clock, sets no timer, polls nothing, fetches nothing, and holds no window state. | Technical | High | Open |
| C-002 | No downsampling or smoothing | The element never downsamples, smooths, interpolates, fits a trend, or computes a threshold or alert band. | Technical | High | Open |
| C-003 | `sk-bar-chart` is untouched | No file under `packages/elements/src/bar-chart/` or `packages/styles/src/bar-chart/` is modified, and `sk-bar-chart`'s API is neither widened nor narrowed. | Technical | High | Open |
| C-004 | No `sk-data-table` element | The tabular equivalent is a native table inside this element's own root. No `sk-data-table` custom element is created. | Technical | High | Open |
| C-005 | Tokens first | Every colour, spacing, radius, motion and dash value references a `var(--sk-*)` token. | Technical | High | Open |
| C-006 | No architectural decisions | A genuine fork is filed as an issue with the measurement attached rather than decided here. | Process | High | Open |

### Key Entities

- **Time point**: a stable id; an epoch-millisecond timestamp used for **position only**; a magnitude **or `null`** meaning *no observation in this interval*; a display string rendered verbatim; a supplied label rendered verbatim; a supplied resolution of `raw` or `hour`.
- **Time series**: a stable id, a supplied name, and ordered points. A **segment** is a maximal run of points sharing one resolution — the element derives segment boundaries from the supplied per-point resolution and never chooses one.
- **Gap**: a maximal run of consecutive null points bounded by observations, or by the start or end of the series. A gap is a drawn object with its own `::part()`, not the absence of one.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A series with an interior null run renders **two** disjoint line segments and a drawn gap marker; a mutation that interpolates across nulls removes the `gap` part and turns the named `[SC-013]` behaviour test red.
- **SC-002**: Every supplied `displayValue` appears in the element's DOM text with no pointer or focus interaction, and every null renders the literal text "No data".
- **SC-003**: Leading and trailing nulls leave the rendered time extent equal to the extent of all supplied timestamps, asserted numerically.
- **SC-004**: With four series rendered, the set of `stroke-dasharray` values has cardinality four and the set of marker shapes has cardinality four.
- **SC-005**: Pointer, Enter and Space each produce exactly one event carrying a frozen `{ seriesId, pointId }`; `preventDefault()` suppresses the element's own scroll-into-view and nothing else.
- **SC-006**: `--sk-chart-*` resolves, in both themes, to the same computed values as #148's `--sk-color-data-*` aliases for the three roles the two families share — proving one family serves both without editing `sk-bar-chart`.
- **SC-007**: The generated React wrapper delivers the structured `series` on first render to an as-yet-undefined element, with no `series` attribute ever set, and resets to a fresh frozen empty array on removal.
- **SC-008**: `scripts/suite-selftest.mjs` completes with every added mutation producing its named red, and the measured elapsed time is recorded in `suite-budget.json` against the unchanged 1405.5s ceiling.
