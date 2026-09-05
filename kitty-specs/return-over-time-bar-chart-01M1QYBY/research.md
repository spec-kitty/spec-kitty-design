# Research: Return-over-time bar chart

**Mission:** `return-over-time-bar-chart-01M1QYBY`

**Issue:** [#148](https://github.com/spec-kitty/spec-kitty-design/issues/148), child of
[#144](https://github.com/spec-kitty/spec-kitty-design/issues/144)

**Research date:** 2026-09-05

**Train revision inspected:** `64ec1c72134343070582a7c6af232df1b4bed5d5`

**Decision status:** complete enough for planning; no product/API decision remains open.

## Question and boundary

The research question is how to turn the approved Return over time treatment into one reusable,
single-series `<sk-bar-chart>` without moving spend arithmetic, date-window logic, formatting,
fetching, or selected application state into the design library. The answer must also satisfy the
elements-first distribution pipeline, expose every datum to assistive technology, and preserve
label ownership at narrow widths. The evidence set is registered in
[`research/source-register.csv`](./research/source-register.csv), with findings cross-referenced
by `E-*` identifiers in [`research/evidence-log.csv`](./research/evidence-log.csv).

## Executive conclusion

Implement one controlled `<sk-bar-chart>` whose consumer assigns an immutable ordered `series` of
stable-id data. Each datum contains `id`, `label`, numeric `value`, and already-formatted
`displayValue`. The element validates the whole replacement value, derives only a zero-anchored
visual scale, renders `label` and `displayValue` verbatim, and never derives currency, dates,
totals, windows, or deployment annotations. [E-001, E-002, E-004]

Use a native list in source order. In presentational mode each list item contains persistent text
and an `aria-hidden` bar. In selectable mode the item contains a real `type="button"` activation
surface so pointer, Enter, and Space follow the platform's one-click path; `selectedId` is only a
consumer-controlled projection. Empty input is a deliberate labelled state, while malformed input
fails closed to an unavailable state with no partial chart or activation targets. [E-003, E-007,
E-009]

The component has no truthful data-independent static form, so it has one Lit render source and no
`.markup.ts` or generated static HTML. Its structured `series` must reach React as a property, not
as JSON in an attribute. The generic property-only manifest/wrapper seam needed for that contract
is implemented by #149's open PR #171 but is not in the inspected train revision. Do not duplicate
that pipeline in #148: implement authored bar-chart work now, then rebase after #171 lands and
regenerate all shared artifacts. [E-006, E-011, E-012]

## Authority and conflict resolution

Evidence applies in this order:

1. #148 for the component outcome, controlled data, stories, accessibility, and exit criteria.
2. #144 for the application/library boundary, component ownership, and serial integration rule.
3. ADRs 9–11 and the maintained authoring recipe for styling, distribution, and verification.
4. The operator-supplied approved screen for visual facts that do not contradict #148's generic
   single-series contract.
5. Current repository source and gates for implementation mechanics.

The approved screen contains green deployment markers and a two-entry legend beside the spend
bars. Those facts do not expand this component: #148 expressly defines a generic **single-series**
datum with no annotation or second-series field, and #144 leaves deployment/domain calculations
with Team Kitty. The bar silhouette, spacing, baseline/grid restraint, persistent values, and
category ownership are visual evidence; the deployment dots/counts and application legend remain
composition data outside `<sk-bar-chart>`. [E-001, E-004]

One source conflict is resolved by a later operator decision. #148 says `sk-bar-chart-select` is
cancelable, while the same paragraph makes `selectedId` consumer-controlled. ADR-11 requires
`preventDefault()` to demonstrably prevent an element-owned default action whenever an event is
declared cancelable. There is no such action here: inventing local selection would violate
controlled state, and inventing a focus/scroll side effect solely to justify cancellation would be
surprising. The operator therefore confirmed `cancelable: false` on 2026-09-05. [E-005, E-008]

## Approved visual facts

The directly inspected operator capture is a 1123 × 1600 PNG with SHA-256
`ca08a0cbe1120233a1619d6b58da1bc2b84e3b9edeea41aff24a151321dbef04`. Its Return over time
region shows four equal-width vertical bars on a dark card, a visible zero baseline, two restrained
horizontal guides, value text above each bar, and category/date text below each bar. The approved
values are `€320`, `€510`, `€440`, and `€604`, labelled `Aug 11`, `Aug 18`, `Aug 25`, and `Sep 1`.
The bar heights visibly follow the numeric magnitudes and use a cool blue treatment rather than the
gold action accent. [E-004]

The screen's green `1/2 deployed` markers are a second measure. They are composition evidence only
and are excluded by the single-series public contract. A separate required story will use unequal
close values such as 510 and 570 to make a weak “all bars look alike” scale implementation fail.
[E-002, E-004]

## Decisions and rationale

### R-01 — Immutable ordered series, replaced by identity

**Decision.** Expose `series: ReadonlyArray<BarDatum>` as a public property-only field with a
frozen empty-array default. A valid datum has a non-empty unique `id`, string `label`, finite
non-negative numeric `value`, and string `displayValue`. Match selection by `id`, never by array
position. Deep mutation is unsupported; consumers assign a new immutable array/object graph.

**Why.** Stable IDs keep selection attached across reorder; readonly input prevents component
mutation; identity replacement is Lit's honest reactivity boundary. Negative or non-finite values
are not magnitudes and cannot be represented by this zero-based chart without inventing a policy.
[E-002, E-010]

### R-02 — Whole-series fail-closed validation

**Decision.** `undefined`/property removal resets to the frozen empty series. An empty series
renders a generic “No data available.” state. Any malformed datum or duplicate/blank ID invalidates
the full series and renders a labelled unavailable state with zero bars and zero activation
targets. Empty labels and display strings are allowed only when they are actual strings; the
accessibility requirement will make them observable failures, so the conservative implementation
should reject empty/whitespace-only label and display strings as malformed.

**Why.** Partial rendering would silently shift labels, selection, and scaling. A fail-closed state
is deliberate, testable, and never turns malformed data into fabricated zeroes. [E-002, E-009]

### R-03 — Zero-anchored proportional scale

**Decision.** Derive `maximum = max(value)` and each ratio as `maximum === 0 ? 0 : value / maximum`.
The baseline is always zero; equal values produce byte-equivalent heights, a zero produces zero
height, and reassignment recomputes every ratio. Express data geometry through numeric SVG
attributes in an `aria-hidden` graphic, not a dynamic inline style; token-only CSS owns the visual
paint. The numeric value remains available as data in tests, but `displayValue` is the only visible
formatted value.

**Why.** This is the smallest pure render-time derivation permitted by #144. A truncated or
data-dependent non-zero baseline exaggerates close differences and breaks proportionality. A CSS
minimum bar height would make zero/nonzero magnitudes visually dishonest. [E-001, E-002, E-004]

### R-04 — Persistent text and source-order semantics

**Decision.** Render a labelled figure/group containing one native list item per datum in input
order. Each item keeps the consumer's label and display value visible regardless of hover or
selection; the geometric bar is `aria-hidden`. The chart has consumer-owned `label` and optional
`description` strings connected with same-shadow-root IDs. In selectable mode the native button's
accessible name contains both datum label and display value, and controlled selection is exposed
with a valid state such as `aria-pressed`.

**Why.** Screen readers recover the same ordered pairs a visual user sees without interpreting CSS
height. Same-root relationships follow ADR-9's measured accessibility boundary. No tooltip is
required to recover meaning. [E-003, E-006, E-007]

### R-05 — Controlled selection and one native activation path

**Decision.** `selectable` is an affirmative reflected boolean defaulting false. When false, the
chart has no button/tab stops, interactive hover/pressed/focus treatment, or selection event.
When true, real buttons make pointer, Enter, and Space converge on `click`; one activation emits
exactly one typed, bubbling, composed `sk-bar-chart-select` with `{ id }`. Dispatch never mutates
`selectedId`; an unknown selected ID selects nothing. The emitted intent is explicitly
non-cancelable because the element performs no default action after dispatch.

**Why.** Native activation avoids a hand-built keyboard imitation and repeat-key duplicates.
Selection remains application state, while focus visibility is local accessibility mechanics.
[E-001, E-005, E-007, E-008]

### R-06 — Narrow widths scroll; labels stay with bars

**Decision.** Give every item a bounded token-derived inline size and place the list in a labelled
horizontal scroller when intrinsic width exceeds the host. Each label/value lives inside the same
item as its bar. Long labels wrap within the item; they are not globally floated, reordered,
ellipsized into changed meaning, or overlaid on adjacent bars.

**Why.** Scrolling is explicitly permitted by #148. Keeping one DOM owner per bar/label/value
pair makes narrow behavior mechanically inspectable with bounding boxes and hit testing. [E-003,
E-009]

### R-07 — Semantic data-visualization tokens

**Decision.** Add a small semantic token family for primary data fill/ink and chart grid/baseline,
defined as aliases to existing themed sky/foreground/border roles so dark and light themes resolve
appropriately and the primary graphical mark reaches the required contrast in both. Gold remains
limited to the focus ring through the existing focus token. Component CSS uses only tokens, has no
ancestor/theme selector, and declares an explicit block host.

**Why.** #148 explicitly calls for semantic data-visualization tokens, while the current token
source exposes only palette/tint and generic border names. Aliases name reusable chart roles
without adding unreviewed raw colors or a component-specific token. [E-003, E-006, E-013]

### R-08 — One CSS source and one structured render source

**Decision.** Author CSS only at `packages/styles/src/bar-chart/sk-bar-chart.css`, generate and
adopt the corresponding constructed sheet, and inject zero shadow `<style>` elements. Author
structured markup only in `packages/elements/src/bar-chart/sk-bar-chart.ts`. Do not create a
`.markup.ts`, static `.html`, or styles-layer `index.ts` because no data-independent static form
exists.

**Why.** This is ADR-10's canonical-source contract and the recipe's explicit exception for
components without a static form. Serializing structured data into authored HTML or attributes
would create a second API and a drift surface. [E-006, E-011]

### R-09 — Public surface stays generic and narrow

**Decision.** The intended public properties are property-only `series`; string `label`,
`description`, and `selectedId`; and reflected boolean `selectable`. There are no slots, methods,
formatter callbacks, clock/window inputs, currency fields, secondary series, annotations, totals,
or application imports. Document a small structural part surface for chart, plot/scroller, item,
bar, value, label, and empty state; finalize exact part names during specification review rather
than exposing internal gridline nodes by default.

**Why.** This is enough to satisfy the issue without freezing every decorative node as API.
Formatted output and date language remain consumer-owned. [E-001, E-002, E-006]

### R-10 — Property-only React delivery comes from #149

**Decision.** Do not modify `scripts/normalise-manifest.mjs`,
`scripts/build-react-wrappers.mjs`, `scripts/check-manifest-content.mjs`, or generic React runtime
support on #148's authored implementation pass. PR #171 owns the generic, AST-derived
`attribute: false` marker and frozen-empty-array removal reset. After #171 merges, rebase #148,
regenerate the manifest/wrapper, and add bar-chart-specific type/runtime evidence against that
shared seam.

**Why.** The inspected train drops intentional unattributed fields from generated wrapper props.
Duplicating #171's generic change would violate the serial shared-artifact plan and create a large
conflict in precisely the files #149 owns. [E-010, E-012]

### R-11 — Non-vacuous verification

**Decision.** Add a distinct bar-chart behavior subject and named mutations for applicable ADR-11
items: event count/detail/composed boundary, property-before-upgrade, focus/keyboard via native
activation, every declared part, and generated-sheet identity. Add element tests for validation,
controlled selection, property replacement/removal, zero/equal/close/wide data, source order, and
exact ratios. Add real-browser tests for pointer/keyboard parity, no presentational tab stops,
narrow label ownership, computed dark/light semantic tokens, reduced motion, accessible states,
and visual baselines. Add generated React type/runtime tests proving `series`, `selectedId`, and
typed event detail reach the wrapper without `any` after #171 lands.

**Why.** Render-only assertions and shadow snapshots are explicitly insufficient under ADR-11.
Every important branch needs a source-break proof or a gate-owned invariant. [E-007, E-014]

The issue also asks for a conformance-matrix entry, but the repository has no such artifact:
[#112](https://github.com/spec-kitty/spec-kitty-design/issues/112), which creates it, remains open.
Until that mission lands, the active `behaviours.json`/`mutations.json` subject registry plus the
parts/docs/stories ratchets are the truthful current conformance record. #148 must document the
missing future matrix row rather than fabricate a one-off substitute. [E-016]

### R-12 — Serial integration and exact-head gate

**Decision.** Implementation may proceed on the current mission branch, but final wrapper/manifest
generation, full gates, CI-authoritative baseline harvesting, pre-merge Tier B squad, and exact-SHA
evidence wait until #149/PR #171 lands. Rebase only onto the latest `train/elements-first`; do not
merge or cherry-pick #149's branch. The final PR targets the train with `Refs #148` and no
train-to-main, release, publish, or deployment action.

**Why.** Component-authored directories are disjoint, but generated CSS modules, manifest,
wrappers, registries, token catalogue, and size report are shared committed outputs. [E-001,
E-012, E-015]

## Resolved operator decision

### RD-001 — `sk-bar-chart-select` is non-cancelable

**Conflict.** #148 required `cancelable: true`; controlled selection gives the element no selected
state transition or navigation to cancel, while ADR-11 requires prevention to have observable
effect.

**Operator resolution, 2026-09-05.** Make the notification **non-cancelable**, matching the
semantics of a pure controlled intent event and the independently reviewed resolution already used
by #149. Record the deviation explicitly in the spec and issue/PR evidence.

**Consequence.** SC-009 is inapplicable to this subject. Do not invent hidden selection, focus,
scrolling, fake state, or a cosmetic pulse merely to create a cancellable action.

## Risks and follow-up

- **#149 is an integration dependency despite #148's implementation independence.** Authored
  bar-chart work can proceed, but the structured React contract and exact final gate cannot close
  until PR #171 is on the train.
- **Token semantics need review.** New names should describe reusable data roles and alias existing
  pairs; raw new colors or `bar-chart`-named tokens would exceed the issue.
- **Visual evidence is a full-screen capture.** Component baselines must crop the rendered element
  and are CI-authoritative; local font rasterization is not final evidence.
- **Responsive tests must be geometric.** A screenshot alone can miss a label that visually drifts
  to the neighboring bar; assert ownership/overlap and scrolling before relying on the baseline.
- **Malformed data must not leave stale pressed/focus/selection projections.** Replacement while
  interactive is a lifecycle regression surface and needs a named test.
- **The formal conformance matrix does not yet exist.** #112 remains open. #148 will register in
  the current behavior and API ratchets and disclose the deferred matrix row rather than create a
  competing artifact.
