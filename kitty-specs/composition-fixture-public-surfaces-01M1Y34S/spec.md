# Mission Specification: Composition fixture, and a gate that can red on both its claims

**Mission Branch**: `mission/composition-fixture-public-surfaces`
**Created**: 2026-09-07
**Status**: Draft
**Issue**: #259 — closes the last open exit criterion of epic #183
**Base**: `train/elements-first@753bbf2`

## Problem

Epic #183's sixth and last programme exit criterion is open:

> A composition fixture demonstrates that the Factory patterns can be assembled from public
> surfaces without private shadow-root reach-through or duplicated component CSS.

The other five verify against the train. This one contains **two falsifiable claims**, not a
demonstration. A story that merely renders *asserts* them and cannot fail when they stop holding.

### Measured before starting: both claims are ungated

`scripts/check-adopted-css-boundaries.mjs` was assumed to cover the reach-through half. It does
not reach a pattern fixture. Four cross-root selectors and two duplicated-component-CSS rules
planted into the inline `<style>` of `packages/elements/src/patterns/team-overview.stories.ts`:

```
BASELINE   ✅ No cross-root selectors: 28 of 28 element(s) checked, 30 adopted stylesheet(s), 451 rule(s).
PLANTED    ✅ No cross-root selectors: 28 of 28 element(s) checked, 30 adopted stylesheet(s), 451 rule(s).  EXIT=0
```

Identical counts. Its scope is `globSync('packages/elements/src/**/sk-*.ts')` filtered by
`/^sk-[a-z0-9-]+\.ts$/`, then the sheets each element *adopts* through its own `./sk-*.css.js`
imports. A `.stories.ts` matches neither.

`check-element-css-hygiene.mjs`, `check-no-css-in-source.mjs`, `check-part-ratchet.mjs` and
`check-story-theme-wrapper.mjs` were all green with the plant in place, and `quality:stylelint`
globs `packages/**/*.css` so it never parses an inline `<style>` inside a `.ts` at all.

The two directions differ besides. `check-adopted-css-boundaries.mjs` asks whether an element's
own adopted sheet reaches OUT of its root. The criterion asks whether a consumer reaches IN to a
component's private root. Even in scope it would not be the same assertion.

## User Scenarios & Testing

### User Story 1 — the composition exists and works (Priority: P1)

A consumer assembles an operational status page from the epic's own surfaces — `sk-page-header`
(compact + sticky), `sk-notice`, `sk-card[status]`, `sk-time-series-chart`, `sk-status-indicator`,
and #176's `.sk-facts` / `.sk-disclosure` primitives — using slots, parts, attributes and tokens
only, with the `<dl>` and `<details>` in light DOM as #177's composition story establishes.

**Independent Test**: the composition module renders into a real browser and the behaviour suite
exercises it.

**Acceptance Scenarios**:

1. **Given** the composition mounted, **When** the card's default slot is read, **Then** the
   light-DOM `<dl class="sk-facts">` and `<details class="sk-disclosure">` are among its
   assigned elements.
2. **Given** the mounted composition, **When** the `<dl>`'s children are read, **Then** every
   `<dt>` and `<dd>` is still a direct child — the list semantics survive the slot boundary
   (the #92 / ADR-9 failure mode).
3. **Given** the mounted composition, **When** the disclosure summary is activated, **Then** the
   `<details>` toggles, through native semantics the library never wrapped.
4. **Given** a series carrying an interval with no observation, **When** the chart publishes its
   paired table, **Then** that interval reads the published no-observation literal and is never
   interpolated (#179's contract, exercised from a composition rather than from its own story).

### User Story 2 — the two claims can red (Priority: P1)

**Independent Test**: a gate with its own probe table, plus an end-to-end plant-and-detect arm
that copies the repository, plants a violation in a real pattern fixture, runs the repository
pass, and asserts it goes red.

**Acceptance Scenarios**:

1. **Given** a pattern fixture, **When** it reads `.shadowRoot`, calls `attachShadow(`, or uses
   `::shadow`, `/deep/` or `>>>`, **Then** the gate names the file and the construct and exits
   non-zero.
2. **Given** a pattern fixture styling `sk-x::part(y)`, **When** `y` is not recorded for `sk-x`
   in `expected-parts.json`, **Then** the gate rejects it — a part outside the shrink-only
   public ratchet is not a public surface.
3. **Given** a pattern fixture's inline `<style>`, **When** any selector declares rules against a
   class a library stylesheet under `packages/styles/src/**/sk-*.css` owns, **Then** the gate
   rejects it as duplicated or overridden component CSS. Using such a class in *markup* is
   composition and stays legal; writing CSS *for* it is not.
4. **Given** zero pattern fixtures, zero library-owned classes, zero recorded parts, or a fixture
   composing fewer than two distinct `sk-` element tags, **Then** the gate refuses to report
   green over the empty set.

### User Story 3 — the gate cannot be silently deleted (Priority: P2)

**Acceptance Scenarios**:

1. **Given** `ci-quality.yml`, **When** either `[ENFORCED]` step for the new gate is removed,
   **Then** `check-gate-wiring.mjs` fails — both entries registered in `REQUIRED_LINT` with the
   gate itself, per the standing pattern in that list.

## Functional Requirements

- **FR-001** A composition fixture under `packages/elements/src/patterns/` composes
  `sk-page-header`, `sk-notice`, `sk-card[status]`, `sk-status-indicator`,
  `sk-time-series-chart`, `.sk-facts` and `.sk-disclosure` through public surfaces only.
- **FR-002** The composition's markup is an authored module, imported by BOTH the story file and
  the behaviour test, so one artefact carries the visual, the accessibility and the behavioural
  evidence and cannot drift into three.
- **FR-003** `scripts/check-pattern-composition.mjs` enforces both halves of the criterion over
  `packages/elements/src/patterns/**`, with `--selftest` carrying a red-first probe table and an
  end-to-end plant-and-detect arm.
- **FR-004** Two `[ENFORCED]` steps in `lint-code`, two `REQUIRED_LINT` entries.
- **FR-005** A behaviour test with a registered behaviour id and a red-first mutation against the
  composition module itself. Story ids alone are not accepted as proof.
- **FR-006** No Factory-specific role, failure, queue, signal, authentication or refresh
  vocabulary anywhere in the fixture, its module, its stories or the gate — #183 criterion 4.
- **FR-007** No budget ceiling is raised. `selftestCeilingSeconds` stays 1059.7, `ceilingSeconds`
  stays 40, and the harness is re-measured and recorded.

## Out of Scope

- Closing #183, or merging to the train. Both are the operator's.
- Any change to the six children's contracts or to `team-overview.stories.ts`.
- A Factory Dashboard app, or Factory Dashboard adoption — #183 puts it out of scope explicitly.

## Resolving the vocabulary tension

#183 requires the Factory patterns to be shown assembling, and separately forbids Factory
vocabulary in public contracts and puts Factory adoption out of scope. The resolution is that the
criterion names **patterns**, not a product: what must be demonstrated is that the SHAPES compose
— an operational page header, a live status/alert region, toned status cards carrying fact blocks
and collapsible detail, and a gap-aware time series. Those shapes are stated in generic
operational terms, in a domain deliberately unrelated to Factory, and no forbidden term appears.
The fixture is evidence about the library's surfaces; naming a consumer would make it evidence
about that consumer instead, which is the thing #183 declared out of scope.
