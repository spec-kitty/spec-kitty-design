# Research: Flow-health transition matrix

**Mission:** `flow-health-transition-matrix-01M1PGNJ`

**Issue:** [#149](https://github.com/spec-kitty/spec-kitty-design/issues/149), child of
[#144](https://github.com/spec-kitty/spec-kitty-design/issues/144)

**Research date:** 2026-09-04

**Repository revision inspected:** `4b173c5d81d4a011eb0004bc914adab42bac7d8e`

**Decision status:** complete enough for implementation; no product/API decision remains open

## Question and boundary

The research question is how to deliver the approved Flow health treatment as a reusable
design-system element while preserving four binding constraints: the display must remain legible
at fifty-work-package scale, application state must remain in Team Kitty, the element must satisfy
ADRs 9–11, and its structured inputs and typed intent must survive generated React delivery.

This is decision support for the already completed specification, plan, and tasks. It does not
reopen their settled product choices. The evidence set is registered in
[`research/source-register.csv`](./research/source-register.csv), and individual findings are
cross-referenced by `E-*` ids in [`research/evidence-log.csv`](./research/evidence-log.csv).

## Executive conclusion

Implement one controlled `<sk-transition-matrix>` whose consumer supplies readonly route and
time-bucket data. The element renders one native table row per aggregate route and one magnitude
per route/column intersection, derives all totals and the global bar scale from those cells, and
never accepts or infers current/open-WP inventory. This keeps visual complexity bounded by
`routes × columns`, not by the number of work packages. [E-001, E-003, E-006]

Interaction is an affirmative opt-in through reflected boolean `selectable`. Pointer, Enter, and
Space share one dispatch path and emit a bubbling, composed, **non-cancelable**
`sk-transition-matrix-select` carrying only `{ routeId }`. Selection is controlled: dispatch does
not change `selectedRouteId`. The original #149 prose called the event cancelable, but the
operator's later decision and the reconciled governing spec deliberately supersede that draft;
ADR-11's cancellation proof applies only where an event is declared cancelable. [E-004, E-005,
E-017]

ADRs 9 and 10 require an open shadow root, documented tokens/parts as the styling API, one real
token-only CSS source compiled to a constructed stylesheet, and no injected `<style>` node. This
structured-data component has no honest data-independent static form, so Lit `render()` is its
only authored markup source and no `.markup.ts`, static `.html`, or styles-layer `index.ts` is
created. [E-011, E-012, E-018]

The current manifest/wrapper pipeline cannot distinguish intentional public `attribute: false`
fields from internal Lit state. The smallest generic fix is an AST-derived property-only marker,
an empty-array reset marker only when both type and initializer prove that default, exact docs
ratcheting, and generated `useProperties` delivery. It must be generic and fail closed—never a
`transition-matrix` name allowlist or JSON attribute serialization. [E-019, E-020, E-021]

## Authority and conflict resolution

Evidence is applied in this order:

1. Operator decisions recorded in the reconciled mission spec, including the supplied clean-v4
   export, `selectable`, non-cancelable intent, consumer-owned copy, and the blocked-red exception.
2. The binding application/library ownership contract in #144 and component outcome in #149.
3. Accepted ADR-10 plus ADR-9/ADR-11 architectural obligations and the repository's maintained
   component-authoring recipe.
4. The completed mission spec, plan, tasks, acceptance matrix, and current source code at the
   inspected revision.

This ordering resolves two source mismatches without inventing a new choice:

- #149 says “five-route” and its first event draft says `cancelable`; the approved export contains
  **six route rows using five tones**, and the operator subsequently selected non-cancelable
  controlled intent. The reconciled spec and plan already encode both corrections. [E-004, E-005,
  E-007]
- The general visual-identity rule reserves red for validation errors; the operator explicitly
  approved danger red for the blocked route in this component only. Recovery remains purple and
  backward remains neutral. [E-008, E-015]

## Approved visual facts

The supplied 1240 × 1600 clean-v4 export was inspected directly. Its Flow health region shows a
dark card/table treatment with the title and derived total in the header, a five-entry tone legend,
four time columns, six route rows, proportional horizontal magnitude bars, an “Exceptions &
recovery” separator, totals at the right edge, and a separate Current/open-WPs panel beside the
matrix. The latter is composition evidence only and is excluded from this component. [E-006,
E-007]

| Route | Tone | Tue 1 | Wed 2 | Thu 3 | Today · Fri 4 | Derived total |
|---|---|---:|---:|---:|---:|---:|
| Planned → In progress | `forward` | 3 | 6 | 7 | 5 | 21 |
| In progress → For review | `forward` | 2 | 5 | 6 | 4 | 17 |
| For review → Done | `completed` | 1 | 3 | 4 | 3 | 11 |
| Any lane → Blocked | `blocked` | 1 | 3 | 2 | 0 | 6 |
| Blocked → In progress | `recovery` | 0 | 1 | 1 | 2 | 4 |
| Any lane → Any lane (backward) | `backward` | 0 | 1 | 1 | 1 | 3 |

The fixture has four columns, twenty-four cells, route totals `21/17/11/6/4/3`, and overall total
`62`. Zero values render as a dash but remain numeric zero. The approved story supplies
`windowLabel="last 72 hours"`, `description="Moves grouped by route and day."`, and
`selectionHint="Select any row to inspect its WPs."`; these strings are not defaults or embedded
domain claims. [E-007, E-009]

## Decisions and rationale

### R-01 — Aggregate routes, never work-package traces

**Decision.** The public input is an ordered set of stable-id columns and aggregate routes. Render
one cell for each route/column pair. Do not accept WPs, WP identifiers, supplied route totals,
supplied overall totals, or the adjacent open-WP inventory.

**Why.** #144 assigns domain aggregation and inventory to Team Kitty. #149 exists to replace a
one-line-per-WP trace whose labels and crossings scale with inventory. Pure totals derived from the
same cells cannot drift from their display. [E-001, E-003]

**Consequences.** Rendering and derivation are `O(routes × columns)` with bounded route labels and
selection targets. A fifty-WP source scenario changes magnitudes only. The reusable element cannot
claim that moves over a window equal currently open WPs. [E-006, E-010]

### R-02 — Immutable id-keyed input with fail-closed validation

**Decision.** Preserve the specified readonly shapes for `TransitionColumn`, `TransitionRoute`,
the five-value `TransitionTone`, and their stable ids. Match values by column id, not array
position. Require non-empty unique route/column ids, an exact value-key set, and finite,
non-negative integer counts. Invalid input renders a labelled, non-interactive unavailable/empty
state rather than fabricating cells or zeros. Deep mutation after assignment is unsupported; a
consumer supplies a new object graph.

**Why.** Reordering must not detach a value from its column, and move counts cannot be negative,
fractional, missing, `NaN`, or infinite. Readonly types prevent component mutation but do not make
deep object mutation reactive, so reference replacement is the honest update boundary. [E-009,
E-010]

### R-03 — Derive totals, scale, tones, groups, and selected projection

**Decision.** For valid input, derive each route total from its current cells, derive the overall
total from all cells, and derive every bar ratio from `value / currentGlobalMaximum`; when the
maximum is zero, every ratio is exactly zero. Derive the legend from tones present in the routes,
ordered `forward`, `completed`, `blocked`, `recovery`, `backward`. Derive contiguous group runs
from opaque `group` strings. Project selected state only when a route id equals the consumer's
`selectedRouteId`; an unknown id selects nothing.

**Why.** These are pure render-time facts owned by the design element under #144. They prevent
redundant inputs, stale totals, ghost legend entries, positional reorder bugs, and invented
selection. [E-002, E-009, E-010]

### R-04 — Controlled, opt-in, non-cancelable intent

**Decision.** `selectable` is an affirmative reflected boolean, defaults false, and is independent
of `selectedRouteId`. When false, rows have no tab stops, activation listeners, hover/focus/active
selection affordances, pressed state, hint, or event; this is the component's disabled-interaction
analogue and does not add a public `disabled` property. When true, pointer, Enter, and Space
converge on one dispatch path and real pointer-down/keyboard-down input exposes transient pressed
treatment which clears on release/cancel/blur; Space prevents page scrolling and key repeat does
not duplicate intent. The emitted event is typed with `bubbles: true`, `composed: true`, and
`cancelable: false`.

**Why.** Team Kitty owns selected state and may ignore an intent. Since the element has no default
action after dispatch, cancellation would imply an action that does not exist. The `selectable`
gate also prevents a selected projection from accidentally becoming an interaction contract.
[E-001, E-004, E-005, E-017]

### R-05 — Native table and redundant tone semantics

**Decision.** Render a real table with scoped column headers, row headers, explicit `headers`
relationships for magnitudes and totals, and accessible group separators. Selected state is
programmatic. Tone is conveyed by visible text plus coloured dots/bars and distinct decorative
prohibition/directional icons where needed; colour is never the only signal.

**Why.** Route ownership is the core information problem. Native table relationships let a screen
reader recover route, time bucket, value, and total while redundant icons/text serve users who
cannot distinguish the five tones by colour. [E-003, E-006, E-009]

### R-06 — Horizontal overflow with sticky route ownership

**Decision.** Preserve intrinsic table width in a labelled horizontal scroller and keep the first
route column sticky on an opaque token surface. Long consumer labels wrap within bounded cells.
Prefer no bar animation; reduced-motion removes any incidental transition.

**Why.** Collapsing or floating labels at narrow widths would recreate the ambiguity this
component replaces. Horizontal exploration is acceptable only when every visible count retains an
explicit owner. [E-003, E-010]

### R-07 — Visual grammar is fixed; domain copy remains consumer-owned

**Decision.** Reproduce the clean-v4 facts and existing token grammar in dark and `.sk-light`
themes. Component-owned generic copy is limited to `Flow health`, `<total> moves`, `Route`, `Total`,
five tone labels, and `bar length ∝ moves`. Route/column/group labels and optional
`windowLabel`/`description`/`selectionHint` are rendered verbatim from the consumer. The hint is
shown only in selectable mode.

**Why.** #144 assigns dates, timezones, and application wording to Team Kitty. Hard-coding “last 72
hours”, “day”, or “WPs” would make a reusable element issue false domain claims. [E-001, E-007,
E-009]

### R-08 — Existing tokens only, with one blocked-red exception

**Decision.** Use the current paired surface/foreground, border, spacing, typography, focus,
blue, green, purple, red, and neutral tokens. Add no token or theme selector. The approved blocked
route may use `--sk-color-red`; this one semantic exception does not authorize red for recovery,
backward, or unrelated components.

**Why.** The token inventory already contains the five-tone palette and light-theme overrides.
ADR-9 proves tokens cross shadow boundaries while ancestor theme selectors do not. The visual
identity rule's normal validation-only red guidance is superseded only by the issue-specific
operator decision. [E-008, E-011, E-015, E-016]

### R-09 — Open shadow root and explicit public styling API

**Decision.** Internal BEM classes remain private. The public styling surface is documented token
dependencies and exactly ten parts: `header`, `legend`, `scroller`, `table`, `group`, `row`,
`route`, `bar`, `total`, and `empty-state`. There are no slots or component-specific custom
properties. The host gets an explicit block display.

**Why.** ADR-9 limits styling to tokens, declared parts, and documented component custom
properties; the recipe warns that the custom-element default `display: inline` makes consumer
layout constraints inert. Ten stable structural seams expose useful composition without freezing
internal cell/tone class names. [E-011, E-014, E-018]

### R-10 — One CSS source, generated constructed sheet, no static form

**Decision.** Author CSS only at
`packages/styles/src/transition-matrix/sk-transition-matrix.css`, generate the named
`skTransitionMatrixSheet`, adopt that object by identity, and inject zero shadow `<style>` nodes.
Author the structured table only in the element's Lit render path. Do not create a markup module,
static HTML, or styles index for this component.

**Why.** ADR-10 makes real CSS the stylelint-visible canonical source and constructed stylesheets
the CSP-compatible distribution. Static generated markup is appropriate only when a component has
a data-independent static form; this matrix cannot honestly render without JavaScript properties.
[E-012, E-018]

### R-11 — Generic property-only manifest and React delivery

**Decision.** Extend the existing TypeScript AST normalization so only a public, settable field
explicitly declared `attribute: false` receives `x-spec-kitty-property-only: true`. Add
`x-spec-kitty-property-reset: empty-array` only when the declared type and source initializer prove
the frozen empty-array default. Include those fields in exact documentation counts and generated
React props, and deliver/reset them through `useProperties` without attributes. Reject unsupported
AST/reset shapes and preserve the internal-state exclusion.

**Why.** At the inspected revision, the normalizer understands `state: true`, the docs gate counts
only attributes/methods, and the wrapper generator narrows props to observed attributes while
maintaining an explicit internal non-prop set. Therefore `columns` and `routes` would otherwise
disappear. A generic AST marker solves the architectural gap without a component allowlist or
array serialization. [E-019, E-020, E-021]

### R-12 — Generated distribution remains authoritative

**Decision.** Export the element and all public types from the elements package, side-effect
register it through the guarded `define()` path, and regenerate the CSS module/declaration,
manifest, React wrapper/index/runtime as deterministically required, and `SIZES.md`. Never
hand-edit `packages/react/src`.

**Why.** ADR-10 requires first-class ESM/IIFE delivery and safe registration. The recipe and ADR-11
make drift checks—not manual parity—the contract for generated wrappers and build artifacts.
[E-012, E-013, E-014]

### R-13 — Behavior evidence must be non-vacuous and mutation-backed

**Decision.** Register the element only for applicable ADR-11 behavior ids: SC-006, SC-007,
SC-008, SC-010, SC-013, and SC-014. Register the distinct React subject only for SC-006 and
SC-010. Do not register SC-009 (event cancellation), SC-011 (slots), SC-012
(Escape-close/focus-return), or per-element SC-015 (definition guard). Every registered pair gets
a unique production-source mutation; acceptance-only behaviors record their own named source
break and red output without inventing ADR ids.

**Why.** ADR-11 explicitly rejects render-only and shadow-snapshot evidence. The existing registry
shows ids are behavior meanings, not mission success-criterion numbers. The planned split prevents
an element test from falsely proving generated React delivery. [E-013, E-017, E-022]

### R-14 — Nine inspectable stories and CI-authoritative visual evidence

**Decision.** Publish exactly `Default`, `ApprovedExample`, `FiftyActiveWPs`, `SparseData`,
`EqualTotalsDifferentDistribution`, `Empty`, `ControlledSelection`, `SelectableStates`, and
`LightMode`. All must load a non-empty component root and pass axe. `LightMode` uses `.sk-light`.
Within the same `SelectableStates` story, real input proves and axe-scans rest, hover,
focus-visible, pointer-active, keyboard-pressed, and the non-selectable disabled-interaction
analogue; no tenth story or simulated-state class is added. After WP03 approval and final train
consolidation, the one draft PR generates all nine CI-authoritative Chromium actual PNGs. Those
exact bytes are compared against the operator image, committed to the same PR as baselines, and
must pass its final exact-head visual rerun. Local captures are diagnostic only and are never
committed or blessed.

**Why.** Separately addressable states prevent one showcase story from hiding empty, scale,
interaction, theme, or narrow-layout defects. The repository recipe documents why wrapper-level
`data-theme="light"` is inert and why story-load failure must not count as axe success. [E-007,
E-013, E-014]

### R-15 — Serial shared-artifact integration, no architecture expansion

**Decision.** Execute the existing three serial work packages: generic property pipeline,
complete element, then dedicated React/final verification. WP02 records a truthful evidence
handoff rather than claiming an upstream rebase that the one shared lane cannot safely perform
before WP03. After WP03 approval and integration, mission wrap-up rebases the whole branch on
current `train/elements-first`, regenerates shared artifacts, and reruns runnable local gates with
functional Playwright qualified to Chromium and Firefox. Use one draft PR with `Refs #149` to
harvest the nine CI-authoritative visual actuals, commit those approved bytes as baselines to the
same PR, and run the final exact-head CI. That CI must pass the exact guard selftest, unqualified
Playwright including WebKit, visual regression and the mutation budget. At the same final head,
record a successful Storybook CI build step strictly below 180 seconds, the full SHA-pinned squad,
and one maintainer approval whose review targets the current head; a later push invalidates those
records. Only the operator may merge the train into `main`. Add no dependency, token, lockfile
change, ADR, sibling component source, Team Kitty code, or Current/open-WPs composition.

**Why.** Child missions have disjoint authored component directories but share generated
manifests, wrappers, ratchets, and sizes. Serialization protects those artifacts without widening
the component boundary. Any newly discovered architecture or token requirement is a stop condition,
not implied scope. [E-002, E-010, E-023]

## Rejected or deliberately absent approaches

| Approach | Reason not selected | Evidence |
|---|---|---|
| One line/edge per WP | Scales labels and crossings with inventory and obscures route ownership | E-003, E-006 |
| Put Current/open WPs in the element | Mixes a point-in-time inventory with windowed moves and violates Team Kitty ownership | E-001, E-003 |
| Accept supplied totals | Redundant values can drift from rendered cells | E-003, E-009 |
| Component-owned selected state | Conflicts with #144's controlled-state contract | E-001, E-005 |
| Cancelable intent | There is no component default action to cancel; operator selected non-cancelable | E-004, E-005, E-017 |
| Enable interaction from `selectedRouteId` | A projection must not silently opt rows into focus/events | E-005, E-009 |
| JSON attributes for arrays | Loses identity, creates serialization ambiguity, and bypasses the approved property path | E-010, E-020 |
| Component allowlist in generator | Solves one name, not the manifest distinction; broadens maintenance risk | E-010, E-019 |
| Static HTML/markup module | No data-independent form can represent the matrix honestly | E-010, E-012 |
| Cross-shadow theme selectors | Inert by ADR-9 evidence and unsupported by the CSS boundary gate | E-011, E-014 |
| Dynamic/tone-specific parts or public classes | Over-freezes internals beyond the ten structural styling seams | E-009, E-011 |
| Animation-dependent bars | Information and operation must survive reduced motion | E-003, E-010 |
| Local screenshot as approval authority | CI font metrics are authoritative; local images are diagnostic | E-014 |

## Evidence-to-implementation handoff

- [`data-model.md`](./data-model.md) captures exact types, relationships, validation, derivation,
  state transitions, accessibility mapping, and React property behavior.
- [`plan.md`](./plan.md) owns file/write scope, generated-artifact order, commands, and risk controls.
- [`tasks.md`](./tasks.md) and `tasks/WP01`–`WP03` own the serial execution and review boundaries.
- [`acceptance-matrix.json`](./acceptance-matrix.json) contains 49 positive criteria and 11 negative
  invariants. It is the formal observable checklist; this research does not replace it.

## Open questions and risks

No product, visual, event, ownership, or API decision remains open. The following are execution
risks already assigned to the plan/tasks and must not be resolved by changing scope:

1. **Property-only false positive/negative.** The current analyzer does not encode the needed
   distinction. AST classification and fail-closed selftests must prove public fields are included
   without publishing `state: true` internals. [E-019, E-020]
2. **React removal semantics.** An omitted array prop can leave stale element data unless the
   wrapper assigns a fresh frozen empty array. Pre-upgrade, identity swap, removal, and
   attribute-absence need runtime evidence. [E-010, E-020]
3. **Consumer mutation after assignment.** The contract is readonly/reference-based; deep
   mutation detection is unsupported. Documentation and type tests must not imply otherwise.
   [E-009]
4. **Sticky-column paint and long labels.** Narrow scrolling can still obscure cells if the sticky
   surface, stacking, and bounded wrapping are wrong. The narrow-scrolled Playwright and visual
   evidence remain mandatory. [E-006, E-010]
5. **Semantic colour exception leakage.** Blocked red is intentionally narrow. Token/docs tests
   and visual review must keep recovery purple and backward neutral and avoid generalizing the
   exception. [E-008, E-015]
6. **Shared generated-artifact drift.** Concurrent train PRs can alter manifest/wrapper/size
   output. After WP03 approval, rebase the whole mission, preserve authored sibling work,
   regenerate, and rerun the final exact-SHA gate. [E-002, E-023]
7. **Mutation-suite budget.** Local timing proves execution only. Any ceiling change requires the
   single draft PR's CI evidence and returns through WP03 review; do not pre-emptively widen it.
   [E-010, E-023]
8. **Visual approval provenance.** The attachment is binding for the recorded Flow-health facts,
   but final visual approval still depends on the nine actual PNGs generated by the one draft PR.
   Only those compared bytes may be committed as baselines before the final rerun. The adjacent
   panel must stay out even if a full-page comparison includes it. [E-006, E-007]
9. **Local environment gaps are not waivers.** Fedora lacks the libraries needed to launch WebKit,
   and the guard selftest reproducibly hangs at guard 4 locally. Do not install system packages or
   claim either gate green. Chromium and Firefox are the local functional evidence; final exact-head
   CI must pass WebKit through the unqualified Playwright suite and the exact
   `node scripts/suite-selftest.mjs --selftest` command. [E-010, E-023]
