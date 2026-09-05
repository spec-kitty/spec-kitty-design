# Mission Specification: Return-over-time bar chart

**Mission Branch**: `mission/return-over-time-bar-chart`
**Created**: 2026-09-05
**Status**: Specification complete — ready for planning
**Input**: GitHub issue #148 under epic #144, the required ADR/authoring corpus, and the
operator-provided “Team overview — final review v4 approved” capture
**Target**: Pull request into `train/elements-first` with `Refs #148`
**Squad tier**: B — three independent Codex lenses post-tasks and pre-merge

## Outcome

Deliver a reusable `<sk-bar-chart>` for one ordered numeric series. It renders a proportional,
zero-anchored vertical bar chart in dark and light themes, preserves a persistent visible and
accessible label/value for every datum, handles narrow widths without losing ownership, and may
emit controlled selection intent. It is not a spend widget and owns no currency, date, time-window,
deployment, total, application-store, router, or action logic.

## Resolved decisions

- **RD-001 — Structured input:** `series` is a readonly property-only array of stable-id data;
  objects are replaced by identity and never serialized to an attribute.
- **RD-002 — Validation:** blank/duplicate IDs, blank label/display text, negative/non-finite
  values, non-arrays, and malformed records fail the full chart closed to a generic unavailable
  state. An absent or empty series is a deliberate empty state.
- **RD-003 — Scale:** geometry is zero-anchored and proportional to the current maximum; equal
  values have equal heights and zero has zero height.
- **RD-004 — Semantics:** input order is visual/DOM/assistive order; text carries meaning and bar
  geometry is supplementary.
- **RD-005 — Visual scope:** the four blue spend-like bars from the approved capture inform the
  generic fixture. The green deployment dots/counts and two-series legend are not part of this
  single-series element.
- **RD-006 — Tokens:** add reusable semantic data-visualization aliases over existing themed
  token pairs; gold is used only for focus, not the default series.
- **RD-007 — Distribution:** no static form exists. There is one Lit render source and one real
  token-only CSS source compiled to a constructed stylesheet; no `.markup.ts` or static HTML.
- **RD-008 — Shared pipeline:** #149 PR #171, merged as `8e654e8`, owns the generic property-only
  manifest/React/Vue seam. #148 is rebased onto train `dcf7af2`, reuses that mechanism without
  duplication, and regenerates its shared public outputs in the final integration slice.
- **RD-009 — Interaction:** `selectable=false` is genuinely presentational. When enabled, native
  buttons provide pointer/Enter/Space equivalence; `selectedId` remains consumer-controlled.
- **RD-010 — Event semantics:** the operator resolved `sk-bar-chart-select` as a non-cancelable
  notification on 2026-09-05. A controlled element has no internal selection/navigation default
  action for `preventDefault()` to stop; claiming cancellation would be inert.

## Resolved operator decision

### RD-010 — Selection-event cancelability

#148 originally called `sk-bar-chart-select` cancelable, but controlled selection leaves the
element no default selection/navigation action for `preventDefault()` to stop. ADR-11 requires
cancellation to demonstrably prevent a real default action. The operator confirmed the event is
**non-cancelable** on 2026-09-05. Implementation must set `cancelable: false`, omit SC-009 for this
subject, and never invent hidden selection, navigation, focus, scrolling, or cosmetic state merely
to make a cancellation test pass.

This later operator decision supersedes only the issue's `cancelable` word; every other event and
controlled-state requirement remains binding.

## User Scenarios & Testing

### User Story 1 — Compare an ordered series (Priority: P1)

As a dashboard reader, I can compare magnitudes visually while still reading the exact formatted
value and category for every bar.

**Why this priority**: Proportional comparison is the component's core value; numerals alone are
explicitly insufficient.

**Independent Test**: Assign the approved four-datum series and a close-value series. Verify exact
input order/text, a visible zero baseline and restrained guidance, ratios equal `value / maximum`,
510 and 570 differ visibly, and changing only `displayValue` never changes geometry.

**Acceptance Scenarios**:

1. **Given** values 320, 510, 440, and 604 with four supplied labels/display strings, **when** the
   chart renders, **then** all four labels and display values appear verbatim in source order and
   their heights are exactly proportional to 604.
2. **Given** unequal close values 510 and 570, **when** a visual user compares them, **then** their
   heights are measurably different and neither gold nor formatted-text parsing determines scale.
3. **Given** two equal non-zero values, **when** rendered, **then** their heights are equal.
4. **Given** a display string that contains a currency symbol and punctuation, **when** rendered,
   **then** it is preserved verbatim and the numeric `value` alone determines height.

---

### User Story 2 — Recover every datum without seeing geometry (Priority: P1)

As a screen-reader user or a reader who cannot distinguish bar shapes/colors, I can recover the
chart name/description and every label/value pair in the same order as a visual reader.

**Why this priority**: Geometry and color cannot be the sole information channel, and inaccessible
charts fail the repository's absolute accessibility gate.

**Independent Test**: Inspect the accessibility tree and source DOM for the approved, zero, empty,
long-label, selectable, and light stories; verify a named/described chart, one ordered list item per
datum, persistent text, no duplicated geometric announcement, and zero axe violations.

**Acceptance Scenarios**:

1. **Given** a named chart with a description and four data, **when** read in source order, **then**
   the chart name/description and all four label/display-value pairs are available.
2. **Given** presentational mode, **when** navigating by keyboard, **then** the chart adds no tab
   stops or interactive roles.
3. **Given** a zero value, **when** the geometric bar has zero height, **then** its label and exact
   display value remain visible and audible.

---

### User Story 3 — Emit controlled selection intent (Priority: P2)

As an application integrator, I can opt into datum activation, receive one typed intent for
pointer or keyboard input, and keep the selected value in my own state.

**Why this priority**: Selection is useful to Team Kitty but must not turn the design element into
an application state owner.

**Independent Test**: In the controlled story activate the same datum by pointer, Enter, and Space;
verify identical `{ id }` detail, exact event count and boundary flags, no key-repeat duplicate,
unchanged `selectedId` until the story consumer assigns it, matching visible/programmatic selected
state after assignment, and `cancelable === false`.

**Acceptance Scenarios**:

1. **Given** `selectable=true`, **when** a datum is activated by pointer, Enter, or Space, **then**
   exactly one `sk-bar-chart-select` reaches an ancestor outside the shadow boundary with the same
   `{ id }` detail.
2. **Given** a selected ID A, **when** datum B emits intent, **then** the element still projects A
   until the consumer assigns B.
3. **Given** `selectable=false` even with a matching `selectedId`, **when** pointer/keyboard input is
   attempted, **then** there is no tab stop, hover/pressed/focus interaction treatment, or event.
4. **Given** an unknown `selectedId`, **when** valid data renders, **then** no datum is selected and
   all data remain available.

---

### User Story 4 — Keep labels owned at narrow widths (Priority: P2)

As a reader on a narrow viewport or with long category labels, I can scroll/inspect the chart
without labels overlapping, truncating into changed meaning, or becoming detached from bars.

**Why this priority**: A visually attractive chart is incorrect if a value can be attributed to
the neighboring category.

**Independent Test**: Render long/date-stamped labels at 390 × 844, assert horizontal overflow is
available when needed, then inspect every item's label/value/bar bounding boxes before and after
scrolling to prove the three remain descendants of and geometrically owned by one item.

**Acceptance Scenarios**:

1. **Given** more intrinsic chart width than the host, **when** rendered narrowly, **then** the plot
   scrolls horizontally and the page does not acquire unintended horizontal overflow.
2. **Given** long labels, **when** wrapped at narrow width, **then** no label overlaps or is painted
   under another item's bar/value.
3. **Given** scrolling to the final bar, **when** the reader inspects it, **then** its own label and
   value remain with it and are not replaced by a compacted meaning.

---

### User Story 5 — Consume the typed design-system output (Priority: P3)

As a TypeScript/React/Vue consumer, I can pass the immutable series and selection props and receive
typed public declarations without `any`, while no-build consumers receive the same registered
element and constructed CSS.

**Why this priority**: The repository treats manifest and generated wrapper fidelity as public API,
not incidental build output.

**Independent Test**: From the rebased current-train seam, regenerate the manifest, React wrapper,
and Vue declaration; typecheck positive and negative React cases and real Vue SFC/property-only
usage, compile the packed Vue declaration with path aliases disabled, render/replace/remove the
property in the browser fixtures, and verify ESM/IIFE registration plus generated-sheet identity.

**Acceptance Scenarios**:

1. **Given** a typed React series, **when** passed to the wrapper, **then** its full readonly datum
   shape reaches the element as a property and invalid shapes fail typecheck.
2. **Given** the React `series` prop is removed, **when** the wrapper updates, **then** the element
   receives a fresh frozen empty array and renders no stale bars.
3. **Given** a wrapper selection callback, **when** intent fires, **then** `event.detail.id` is a
   typed string and a nonexistent detail field fails typecheck.
4. **Given** a Vue consumer using the published declaration, **when** it passes the readonly series
   through a real SFC or packed-package typecheck, **then** the property-only field retains its exact
   datum type and malformed shapes fail typecheck. The packed proof consumes the real tarball with
   workspace path aliases disabled and retains #149's transition-matrix coverage.

### Edge Cases

- Absent series and explicit empty series render the same deliberate empty state.
- A valid all-zero series retains every text pair, a baseline, and zero-height geometry.
- Equal values render equal heights; widely varying values stay zero-anchored and retain text even
  when the smallest geometry is hard to see.
- Reordering a replacement series follows new source order while controlled selection follows the
  same stable ID, not its former index.
- Changing the maximum recomputes every ratio; changing only formatted text does not.
- Duplicate/blank IDs, negative/`NaN`/infinite values, blank required text, non-array input, or a
  malformed record fail the full chart closed with zero interactive targets.
- An unknown selected ID selects nothing; removing the selected datum clears its projection.
- Disabling selection or invalidating/replacing data during active input cannot resurrect stale
  pressed state if the datum later returns.
- Long labels wrap inside their own items and preserve full text; they are not ellipsized into a
  changed meaning.
- Reduced-motion mode contains no required animation and removes any incidental transition.

## Requirements

### Functional Requirements

| ID | Title | Requirement / User Story | Priority | Status |
|---|---|---|---|---|
| FR-001 | Generic element | Publish one `sk-bar-chart` element for one ordered numeric series. (US1) | High | Open |
| FR-002 | Immutable datum contract | Export readonly `BarDatum`/series types with `id`, `label`, `value`, and `displayValue`. (US1/US5) | High | Open |
| FR-003 | Property-only series | Accept structured `series` only as a public property with a frozen empty default/removal reset; never as JSON attribute text. (US5) | High | Open |
| FR-004 | Verbatim text | Render label and displayValue verbatim and never parse formatted text. (US1/US2) | High | Open |
| FR-005 | Proportional scale | Derive every height as zero-anchored `value / current maximum`, with an all-zero guard, expressed through numeric SVG geometry rather than dynamic inline style. (US1) | High | Open |
| FR-006 | Visible guidance | Render a subtle zero baseline and restrained scale/grid guidance. (US1) | High | Open |
| FR-007 | Persistent information | Keep each label and display value visibly present; no meaning depends on hover. (US1/US2) | High | Open |
| FR-008 | Ordered semantics | Expose the chart name/description and every label/value pair to assistive technology in exact input order. (US2) | High | Open |
| FR-009 | Deliberate empty state | Render a labelled empty state for absent/empty series with zero bars and targets. (US2) | High | Open |
| FR-010 | Fail-closed invalid state | Reject the whole runtime series for malformed records, duplicate/blank IDs, blank required text, or negative/non-finite values; render no partial chart. (US1/US2) | High | Open |
| FR-011 | Selectable opt-in | Default `selectable` false; only true creates activation surfaces, tab stops, interaction states, and events. (US3) | High | Open |
| FR-012 | Controlled selected projection | Project `selectedId` only when it matches a current datum; activation never mutates it. (US3) | High | Open |
| FR-013 | Native input equivalence | Use one native click path so pointer, Enter, and Space each produce one equivalent activation without key-repeat duplication. (US3) | High | Open |
| FR-014 | Typed intent | Export/document `sk-bar-chart-select` with exact readonly `{ id: string }` detail, `bubbles: true`, `composed: true`, and `cancelable: false`. (US3/US5) | High | Open |
| FR-015 | Visible focus/selection | Expose focus and selected states with shape/border plus a valid programmatic state, never color alone. (US3) | High | Open |
| FR-016 | Narrow ownership | Use bounded items and horizontal scrolling/compact treatment that keeps every label/value/bar owned without overlap or meaning-changing truncation. (US4) | High | Open |
| FR-017 | Dark and light | Render equivalent content and semantics in default dark and `.sk-light` themes with visibly different themed values. (US1/US2) | High | Open |
| FR-018 | Semantic data tokens | Add and consume reusable data-series/grid/baseline semantic tokens; do not use gold as the default series. (US1) | High | Open |
| FR-019 | Styling API | Document exact token dependencies and a minimal structural `::part()` surface; every declared part is rendered and externally targetable. (US5) | High | Open |
| FR-020 | Elements distribution | Register through guarded `define()`, export from both element entries, adopt the generated sheet by identity, and inject zero style elements. (US5) | High | Open |
| FR-021 | Required stories | Provide approved four-bucket, close unequal, zero, empty, long/date-stamped, controlled selectable, interaction-state, and LightMode stories. | High | Open |
| FR-022 | Generated public surface | Regenerate CSS module, token catalogue, CEM, React wrapper, wrapper floor, Vue declaration, and SIZES; update parts/docs/stories/behavior/mutation ratchets and pass the Vue generation check and real-SFC source check. Extend the post-build packed-consumer gate without removing #149 coverage so its real-tarball/no-workspace-path program indexes the built `sk-bar-chart` `$props.series`, accepts the readonly datum shape, and requires malformed negative cases to fail. Record that the future formal conformance-matrix row is deferred to open #112 because no matrix artifact exists. (US5) | High | Open |
| FR-023 | React typing/runtime | Prove series, selectedId, selectable, and event detail reach the generated wrapper without any; prove replacement/removal against the production hook. (US5) | High | Open |
| FR-024 | Source-break evidence | Record named red-first mutations sufficient to break every applicable behavior invariant—including separate SC-014 sheet-length and sheet-identity arms—and direct source-break proof for proportional scale, validation, controlled selection, theming, and narrow ownership. | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|---|---|---|---|---|---|
| NFR-001 | Accessibility | Every required rendered story reports zero WCAG 2.1 AA axe violations; a failed/empty load is a failure. | Accessibility | High | Open |
| NFR-002 | Input parity | Pointer, Enter, and Space each emit exactly one byte-equivalent `{id}` record with bubbling/composed true and cancelable false for the same datum; repeat emits zero extra events. | Reliability | High | Open |
| NFR-003 | Proportional precision | For every finite valid value, rendered ratio data equals `value / maximum` exactly; equal and zero cases are exact. | Correctness | High | Open |
| NFR-004 | Responsive ownership | At 390 × 844, zero label/value/bar ownership overlaps or cross-item hit targets occur before or after horizontal scrolling. | Usability | High | Open |
| NFR-005 | Theme parity | Dark and LightMode render identical text/structure while every semantic data surface/ink resolves to its documented themed token and at least one key computed color differs. | Visual | High | Open |
| NFR-006 | Cross-browser | Required real-input behavior passes Chromium, Firefox, and WebKit in the repository Playwright gate. | Compatibility | High | Open |
| NFR-007 | Generated drift | Every generated-artifact `--check`, manifest diff, Vue source-SFC check, and post-build packed-consumer check is clean after regeneration from the final integrated source; the packed check must compile the real tarball with path aliases disabled and prove both positive readonly and malformed-negative `sk-bar-chart` series cases. | Maintainability | High | Open |
| NFR-008 | Mutation quality | Every declared `(behavior id, subject)` mutation turns the named assertion red; 100% of registered mutations are killed within the repository budget. | Test quality | High | Open |
| NFR-009 | Build budget | Storybook build completes under the charter's 180-second threshold in CI at final PR head. | Performance | Medium | Open |
| NFR-010 | Visual fidelity | CI-authoritative cropped baselines for approved dark, LightMode, narrow, zero/empty, and selectable states receive explicit visual-review disposition against the approved capture. | Visual | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|---|---|---|---|---|---|
| C-001 | Presentational boundary | No fetching, store, router, timer, time-window, currency/spend total, deployment arithmetic, selected application object, or action callback lives in the element. | Architecture | High | Binding |
| C-002 | Single series | No second series, deployment annotation, tooltip-only meaning, or public Team Kitty overview element is introduced. | Scope | High | Binding |
| C-003 | Owned sources | Do not modify components owned by #145–#147/#149 or create replacements for card/grid/button/pill/nav components. | Scope | High | Binding |
| C-004 | One source | One authored CSS source and one authored structured render source; no hand-authored duplicate markup/static form. | Architecture | High | Binding |
| C-005 | Token-only CSS | All component CSS design values use `--sk-*` tokens; data-derived proportions use numeric SVG geometry, with no dynamic inline style, raw design values, or cross-shadow theme selectors. | Styling | High | Binding |
| C-006 | Public styling boundary | Only inherited tokens, declared parts, and documented component custom properties are public; internal BEM classes are private. | Architecture | High | Binding |
| C-007 | Generated files | Never hand-edit generated CSS modules, static outputs, custom-elements.json, React wrappers, Vue declarations, token catalogue, or SIZES. | Build | High | Binding |
| C-008 | Serial integration | #149/PR #171 is landed as `8e654e8` and the planning target `mission/return-over-time-bar-chart` records train `dcf7af2`. Before WP01 is first claimed, the orchestrator must fetch, rebase the clean planning target onto latest `origin/train/elements-first`, normalize the human-authored planning range to repository-valid conventional history, and rerun task finalization so `lanes.json.planning_commit_sha` follows the final pre-execution lineage. WP01–WP03 then reuse one `lane-a` workspace/branch with no inter-WP consolidation or mid-execution rebase: Spec Kitty 3.2.6rc4 freezes the recorded planning commit after execution starts. After supported lane→mission→target consolidation, the orchestrator rebases the clean target onto latest train, regenerates all shared outputs, and runs the complete mandatory gates on the exact target/PR head before final evidence. If train advances again, repeat the final-target rebase, regeneration, and gates. | Delivery | High | Binding |
| C-009 | One design-mission PR | The operator's design-programme instruction requires one #148 mission branch and one PR into `train/elements-first`, with `Refs #148`; this specific instruction supersedes the Team Kitty SaaS workspace's general WP-per-PR convention for this explicitly scoped `spec-kitty-design` checkout. | Delivery | High | Binding |
| C-010 | No release/deploy | Do not merge train to main, publish packages, deploy Team Kitty, or broaden component scope. | Authorization | High | Binding |
| C-011 | Review tier | Run three independent profile-loaded Codex lenses after tasks and again pre-merge, at most two passes per point-cut, with exact-SHA evidence. | Governance | High | Binding |

### Key Entities

- **BarDatum**: immutable consumer datum with stable ID, verbatim label, numeric magnitude, and
  verbatim formatted display value.
- **BarSeries**: ordered readonly set of BarDatum objects, replaced by identity.
- **ValidatedSeries**: internal all-or-nothing empty/invalid/valid rendering result.
- **RenderedDatum**: one datum plus pure ratio and consumer-controlled selected projection.
- **BarChartSelectDetail**: readonly `{ id: string }` non-cancelable intent payload.

## Public API candidate

The plan may refine naming only to resolve analyzer/generator facts; it may not widen capability.

```ts
export type BarDatum = Readonly<{
  id: string;
  label: string;
  value: number;
  displayValue: string;
}>;

export type BarChartSelectDetail = Readonly<{ id: string }>;

class SkBarChart extends LitElement {
  series: ReadonlyArray<BarDatum> = Object.freeze([]); // attribute: false
  label: string;
  description: string;
  selectable: boolean;
  selectedId: string;
}
```

Candidate parts: `chart`, `plot`, `item`, `bar`, `value`, `label`, `empty-state`. The post-spec plan
must justify any addition/removal before the parts ratchet freezes it.

## Required stories and observable purpose

| Story | Required observable distinction |
|---|---|
| `Default` / approved four-bucket shape | 320/510/440/604 ratios, values and Aug labels; cool-blue semantic series |
| `CloseValues` | 510 and 570 have visibly/measurably different heights |
| `ZeroValues` | zero retains text and baseline; mixed zero/nonzero scale remains exact |
| `Empty` | labelled empty state, no bars/targets |
| `LongLabels` | date-stamped/long labels remain owned at narrow width with scroll |
| `ControlledSelection` | story action/log handles intent and updates selectedId externally |
| `SelectableStates` | rest/hover/focus/pressed/selected plus non-selectable analogue are independently observable |
| `LightMode` | `.sk-light` activates changed themed tokens with identical content/semantics |

## Out of scope

- Application composition and the `Return over time` card/section title.
- Spend attribution, currency formatting, weekly windows, date localization, and “Today”.
- Mission deployment dots/counts or any second series/legend semantics.
- Tooltips as required information, drill-down panels, axes configuration, stacked/grouped bars,
  negative/diverging values, arbitrary formatter callbacks, or analytics-workbench controls.
- Changes to #149's transition-matrix sources or its generic property-only implementation.
- A public `<sk-team-overview>` component, Team Kitty imports, release, publish, or deployment.

## Success Criteria

### Measurable Outcomes

- **MO-001**: For the approved fixture, all four input label/display pairs render in order and the
  exact ratios are `320/604`, `510/604`, `440/604`, and `1`.
- **MO-002**: A 510/570 fixture yields distinct geometry whose ratio difference equals `60/570`;
  equal inputs yield equal geometry and zero yields zero.
- **MO-003**: Every required story is non-empty and reports zero axe violations; a screen-reader
  representation exposes chart name/description plus every label/value pair in source order.
- **MO-004**: Presentational mode creates zero tab stops/events/interactive visual deltas;
  selectable pointer, Enter, and Space each produce one identical controlled intent.
- **MO-005**: At 390 × 844, the long-label fixture has zero cross-item overlap/hit-test failures
  before/after scrolling and retains full label text.
- **MO-006**: Dark and LightMode have identical semantic content and token-accurate series/grid/
  baseline values, with gold absent from default series fill.
- **MO-007**: Empty/malformed/property-removal cases render zero stale bars or targets; replacement
  recomputes scale/order/selection from only the new series.
- **MO-008**: Generated CEM, React, and Vue declarations expose the exact documented public
  properties with no `any`; CEM/React retain the typed event detail, while React runtime
  assignment/replacement/removal and real Vue SFC usage are observed through production seams. The
  packed Vue gate preserves #149 coverage and compiles a no-path-alias real-tarball consumer whose
  `sk-bar-chart` `$props.series` accepts the readonly shape while malformed negative cases remain
  errors.
- **MO-009**: All current-train enforced local/CI parity gates—security/lockfile/action pins,
  generated drift and selftests, derived publishable build, type/lint, timed behavior and mutation,
  browser, Storybook/a11y, visual, release graph, size/SRI, theme, parts, and offline—pass at the
  exact integrated PR head.
- **MO-010**: Post-tasks and pre-merge Tier B Codex reviews have complete file:line dispositions;
  one current-head maintainer approval exists before merge.

## Dependencies and delivery state

- Elements foundation and existing component/token/gate infrastructure: current mission base is
  `train/elements-first` at inspected commit `dcf7af2`.
- #149 / PR #171: merged as `8e654e8` and present in that train base; it supplies the generic
  property-only manifest/React/Vue seam required by FR-003/FR-022/FR-023.
- Spec Kitty branch roles: `mission/return-over-time-bar-chart` is the planning/landing target;
  `kitty/mission-return-over-time-bar-chart-01M1QYBY` is the internal mission branch, which does not
  receive approved lane patches until supported final consolidation; and all three serial WPs reuse
  `.worktrees/return-over-time-bar-chart-01M1QYBY-lane-a` on
  `kitty/mission-return-over-time-bar-chart-01M1QYBY-lane-a` until that consolidation.
- #112: open owner of the not-yet-existing machine-readable conformance matrix. #148 uses the
  current behavior/mutation/API/story ratchets and records the deferred future row.
- #150 composition: downstream and out of this mission.
