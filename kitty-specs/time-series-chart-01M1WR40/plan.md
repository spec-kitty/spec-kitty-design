# Implementation Plan: sk-time-series-chart

**Branch**: `mission/time-series-chart` | **Date**: 2026-09-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/kitty-specs/time-series-chart-01M1WR40/spec.md`

## Summary

Ship one new custom element, `<sk-time-series-chart>`, in the elements-first layout: authored CSS in
`packages/styles/src/time-series-chart/`, the element in `packages/elements/src/time-series-chart/`,
generated stylesheet module, manifest, React wrapper, Vue types and `SIZES.md` regenerated from it.
Land the `--sk-chart-*` token family in `packages/tokens/src/tokens.css` designed so `sk-bar-chart`
could consume it, and prove the two families agree by computed value rather than by assertion in prose.

The element is a **controlled** line chart over a time axis whose three load-bearing properties are:
nulls break the line and are drawn as gaps; every value is published persistently in a paired native
table; and series differentiation survives greyscale and forced colors because it is carried by dash
pattern and marker shape as well as hue.

## Technical Context

**Language/Version**: TypeScript 5.x, Lit 3.x, ES2022 modules
**Primary Dependencies**: `lit`, the repo's own generators (`build-elements-css.mjs`,
`build-react-wrappers.mjs`, `build-vue-types.mjs`, `measure-elements-sizes.mjs`), Vitest browser mode
(Chromium + WebKit), Storybook 10.x, axe
**Storage**: none — the element holds no state the consumer does not supply
**Testing**: `fixtures/elements-behaviour/src/sk-time-series-chart.test.ts` (browser lane),
`fixtures/react-consumer/src/sk-time-series-chart.test.tsx` (React first-render delivery),
`scripts/suite-selftest.mjs` mutation arms, `scripts/run-axe-storybook.js` over the registered stories
**Target Platform**: evergreen browsers with constructed stylesheets and shadow DOM
**Project Type**: single Nx monorepo, four packages, dependency flow `tokens → styles → elements → react`
**Performance Goals**: the mutation harness stays under the ratified `selftestCeilingSeconds` 1405.5s;
the ordinary behaviour suite stays under `ceilingSeconds` 40s
**Constraints**: no clock, no timers, no fetching, no downsampling; `sk-bar-chart` untouched; tokens first
**Scale/Scope**: one element, one stylesheet, one token family, one behaviour test file, one React test
file, one story file, six ratchet/registry files

## Charter Check

| Charter gate | Status | Note |
|---|---|---|
| Tokens first — every value a `var(--sk-*)` | PASS by construction | New `--sk-chart-*` family is added to both theme blocks and the catalogue is regenerated. |
| One-directional dependency boundary | PASS | `styles` reads tokens only; `elements` adopts the generated sheet; nothing new is added to `packages/react/src` by hand. |
| Semantic pairing | PASS | Series inks are paired against `--sk-surface-card`, and contrast is asserted in both themes. |
| BEM naming | PASS | `sk-time-series-chart__<element>--<modifier>` only. |
| Conventional commits | PASS | Scopes drawn from the enum `tokens`/`styles`/`elements`/`react`/`docs`; `docs(adr)` and `docs(specs)` are **not** in the enum and are not used. |
| `LightMode` story wrapped in `class="sk-light"` | PASS | Never `data-theme="light"` — inert on a wrapper (#93). |
| Demo pages unbroken | PASS | No demo page references the new component; `assemble-demo-dist.sh` derives its set from the demo pages, so nothing there changes. |

No violations. The Complexity Tracking table below is therefore empty.

## Project Structure

### Documentation (this mission)

```
kitty-specs/time-series-chart-01M1WR40/
├── spec.md              # the specification
├── plan.md              # this file
├── tasks.md             # work-package manifest
└── tasks/               # work-package files
```

### Source Code (repository root)

```
packages/tokens/src/tokens.css                       # + the --sk-chart-* family, BOTH theme blocks
packages/tokens/dist/token-catalogue.json            # regenerated
packages/styles/src/time-series-chart/
└── sk-time-series-chart.css                         # AUTHORED source of record
packages/elements/src/time-series-chart/
├── sk-time-series-chart.ts                          # AUTHORED element
├── sk-time-series-chart.css.js                      # GENERATED
├── sk-time-series-chart.css.d.ts                    # GENERATED
└── sk-time-series-chart.stories.ts                  # AUTHORED stories
packages/elements/src/index.ts                       # + export
packages/elements/src/elements.ts                    # + side-effect import
packages/elements/custom-elements.json               # GENERATED
packages/elements/vue.d.ts                           # GENERATED
packages/elements/SIZES.md                           # GENERATED — needs a real build first
packages/react/src/SkTimeSeriesChart.{js,d.ts}       # GENERATED
fixtures/elements-behaviour/src/sk-time-series-chart.test.ts
fixtures/react-consumer/src/sk-time-series-chart.test.tsx
behaviours.json, mutations.json                      # registry + arms
expected-parts.json, expected-docs.json,
expected-stories.json                                # ratchets
suite-budget.json                                    # measured row ONLY; ceiling unchanged
docs/contributing/adding-a-token.md                  # the new --sk-chart-* prefix
docs/design-system/using-components.md               # the element's entry
```

**Structure Decision**: the four-package elements-first layout, unchanged. There is **no markup module**
— the element has no static form. `sk-bar-chart`, `sk-notice` and `sk-transition-matrix` all decline one
for the same reason: the component is property-fed and has no server-rendered variant matrix.

## Complexity Tracking

*No Charter Check violations.*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Design decisions taken here, with the measurement behind each

### D-1 — The `.sk-data-table` primitive cannot be adopted into a shadow root, measured

#179 asks for "a real table view of the same series styled with the `.sk-data-table` primitive", and
its overlap section says "the tabular equivalent uses the light-DOM primitive". **Measured, that is not
constructible under this repo's own gates.**

- `scripts/build-elements-css.mjs` derives its work set from `packages/elements/src/**/sk-<name>.ts`
  and generates each element's module from `packages/styles/src/<name>/sk-*.css` — the component's
  **own** directory only. There is no `sk-data-table.ts` element (deliberately — `packages/styles/src/data-table/index.ts`
  says so in a comment), so no `sk-data-table.css.js` exists to adopt, and an orphan generated module
  is swept by the same script.
- `scripts/check-adopted-css-boundaries.mjs` requires the **leftmost compound** of every selector in an
  adopted sheet to be owned by the element, matched against `^sk-<name>($|__|--)`. A rule whose
  leftmost compound is `.sk-data-table` is therefore rejected in `sk-time-series-chart.css` by name.
- A light-DOM class cannot cross into a shadow root in any case: that is ADR-9's whole subject.

`sk-transition-matrix` is the standing precedent and it resolves this the same way: it renders a native
`<table>` inside its own root with `.sk-transition-matrix__*` styles and its own `scroller`/`table` parts.

**Decision**: follow that precedent — a native `<table>` in this element's own root, reproducing the
`.sk-data-table` *markup contract* verbatim (a scroller wrapper; `role="region"`/`aria-label`/`tabindex="0"`
applied **only** when the scroller genuinely overflows, per that file's measured note about dead tab stops;
`<caption>`; `<th scope="col">`; no reflow of `tr`/`td` at any breakpoint) while owning its own
declarations. **The fork is filed as an issue with this measurement attached**, per C-006 — it is an
architectural question (does the repo want a shareable adopted primitive sheet?) and this mission does
not answer it.

### D-2 — `--sk-chart-*` lands here; `sk-bar-chart` is NOT retrofitted

FR-013 requires one family. #148 shipped three aliases under `--sk-color-data-*`. Retrofitting
`sk-bar-chart` onto `--sk-chart-*` would touch: its authored CSS, its generated `.css.js`, its class
JSDoc "Token dependencies" line (which is **published API** — it is copied into `custom-elements.json`
and into the React wrapper's docs), and the `semantic data aliases exist exactly once per theme` test in
`fixtures/elements-behaviour/src/sk-bar-chart.test.ts`, which pins each `--sk-color-data-*` declaration
by **exact string, twice per theme block**. That is not "small and mechanical": it edits a
just-landed element's published API text and rewrites one of its tests.

**Decision**: define `--sk-chart-*` as the family, give the three roles it shares with #148 the *same
underlying values*, and prove the equivalence by **computed value in both themes** rather than by
comment. That discharges "one chart token family shared with #148" as far as is possible without
touching #148, and reduces the eventual retrofit to a pure rename. The retrofit is filed as an issue
with the measurement. Half-retrofitting is explicitly refused.

### D-3 — The gap is a drawn object with its own `::part()`, and that is what the mutation reds

The mission is required to ship "a mutation whose red is an interpolated gap". Guard 7 of
`scripts/suite-selftest.mjs` keys every mutation on an `(id, subject)` pair declared in
`behaviours.json`, and `tests/node/config-contract.test.ts` asserts the applicable id set equals
ADR-11's list **exactly** — so no id may be minted for "nulls break the line", and mislabelling one is
what this repo has refused four times (#140, #143, #77, #177).

The honest binding is **SC-013**, "every declared `::part()` is present and targetable". A gap is
rendered as `part="gap"`. The mutation replaces the run-splitting with a filter that drops nulls and
draws one continuous polyline — the textbook interpolation defect — and the `gap` part then **does not
exist**, so the `[SC-013]` test reds on the absence of a part. `sk-card`'s `#177` arm is the recorded
precedent for a mutation whose red is a part's absence, and its note explains why the test must mount a
fixture that *has* the part: the `[SC-013]` test therefore mounts a chart **with an interior null run**,
not only a dense one.

Additional unmarked assertions (two disjoint polylines, no vertex at a null timestamp, "No data" in the
table) ride along free: `isBehaviourTest` keys on the `[SC-NNN]` marker, so an unmarked test is invisible
to the harness's collateral bound.

### D-4 — SC-009 is claimed, and the preventable default action is the element's own scroll-into-view

#179 requires a **cancelable** event. SC-009 is "preventDefault demonstrably prevents where cancelable",
and `sk-action-row` correctly *declined* it because it owned no preventable default. This element does
own one: the plot and the table are horizontally scrollable for a dense series, and activation scrolls
the activated point into view **within the element's own scroller**. `preventDefault()` suppresses
exactly that and nothing else; selection remains the application's.

The test activates via `element.click()` rather than `userEvent.click()`, deliberately: `userEvent`
focuses the button first and the browser's own focus-scroll would make the assertion pass for the wrong
reason. This is recorded because it is the same class of defect `sk-notice`'s note records
(`document.activeElement === element` holding whether or not focus moved).

### D-5 — Structured-property delivery is re-proven, not re-decided

#179 lists the `ssrSafe` array-of-objects delivery path as an unsolved risk. It was solved in #148:
`normalise-manifest.mjs` classifies a property-only field from the source and stamps
`x-spec-kitty-property-only`, `build-react-wrappers.mjs` reads it plus `x-spec-kitty-property-reset`, and
the React wrapper assigns the property before definition. This mission declares `series: { attribute: false }`
the same way and carries its own react-consumer test, so the contract is enforced for this element rather
than inherited on trust.

### D-6 — Mutation-arm budget

`suite-budget.json`'s last row is 155 arms / 1286.0s at `7a56e7e` against a 1405.5s ceiling —
**119.5s of headroom, 8.30s per arm**. The brief this mission was given quoted 1338.8s / 66.7s; the
committed file says otherwise and the file is the record. The arm set is therefore held to **eight**
element arms and **zero** React arms:

| id | arm | why |
|---|---|---|
| SC-006 | duplicate dispatch | one event per activation |
| SC-007 | wrong detail shape | exact frozen `{ seriesId, pointId }` |
| SC-008 | `bubbles: false` | crosses the shadow boundary |
| SC-009 | `cancelable: false` | `preventDefault` suppresses the scroll |
| SC-010 | `series` de-registered from `static properties` | property-before-upgrade |
| SC-013 | nulls filtered → interpolated line, `gap` part absent | **the mission's required red-first gap arm** |
| SC-014 | `static styles = []` | the length assertion |
| SC-014 | fresh `new CSSStyleSheet()` | the identity assertion — #77's finding that the empty-array arm reds length first and never exercises identity |

`react-time-series-chart` is **not** declared as a behaviours subject. The React contract is covered by
a real test file; declaring the subject would add two more arms (~17s) against 119.5s of headroom that
this element's own eight arms (~66s) already consume most of. This is recorded as a stated gap rather
than a silent one, with the arithmetic, so the next mission can reverse it if the ceiling moves.
Under no circumstances is `selftestCeilingSeconds` raised by this mission.

## Implementation Concern Map

### IC-01 — Chart token family

- **Purpose**: own data-visualisation colour, dash and geometry values once, in a family `sk-bar-chart` could also consume.
- **Relevant requirements**: FR-013, NFR-003, C-005
- **Affected surfaces**: `packages/tokens/src/tokens.css` (both theme blocks), `packages/tokens/dist/token-catalogue.json`, `docs/contributing/adding-a-token.md`
- **Sequencing/depends-on**: none — everything else consumes it
- **Risks**: stylelint fails on a stale catalogue; the light block must be edited as well as the default block, or `LightMode` silently renders dark inks.

### IC-02 — Element contract and geometry

- **Purpose**: the validated, fail-closed data model; time and value scales; run splitting; gap objects; segment boundaries; the controlled selection event.
- **Relevant requirements**: FR-001, FR-003, FR-004, FR-005, FR-008, FR-010, FR-011, FR-012, C-001, C-002
- **Affected surfaces**: `packages/elements/src/time-series-chart/sk-time-series-chart.ts`, `packages/elements/src/{index,elements}.ts`
- **Sequencing/depends-on**: IC-01
- **Risks**: degenerate extents (all timestamps equal, all values equal) divide by zero if not guarded; a `@csspart` tag whose description is not terminated swallows the rest of the docblock.

### IC-03 — Presentation, gap treatment and non-colour differentiation

- **Purpose**: the authored stylesheet, the dash/marker channels, the reduced-motion and forced-colors blocks, and the table's own styling.
- **Relevant requirements**: FR-002, FR-007, FR-009, NFR-003, C-004, C-005
- **Affected surfaces**: `packages/styles/src/time-series-chart/sk-time-series-chart.css`
- **Sequencing/depends-on**: IC-01, IC-02
- **Risks**: `check-adopted-css-boundaries.mjs` rejects any selector whose leftmost compound is not `.sk-time-series-chart…`; `background` does not survive forced-colors and `box-shadow` computes away entirely; system-colour keywords belong on longhand `-color` properties only.

### IC-04 — Published representation and paired table

- **Purpose**: the always-present structured text: series name, per-point label, display value or "No data", per-row resolution, and the gap notes.
- **Relevant requirements**: FR-006, FR-007, FR-008, NFR-002
- **Affected surfaces**: the element's render, the stylesheet's table rules
- **Sequencing/depends-on**: IC-02
- **Risks**: the scroller's `role="region"`/`tabindex="0"` triad is a dead tab stop and a duplicate landmark when the scroller does not overflow — measured in `sk-data-table.css`; it must be conditional.

### IC-05 — Verification surface

- **Purpose**: behaviour tests, React first-render test, stories, ratchets, registry entries and the eight mutation arms.
- **Relevant requirements**: every FR; NFR-001, NFR-002, NFR-004
- **Affected surfaces**: `fixtures/elements-behaviour/src/`, `fixtures/react-consumer/src/`, `behaviours.json`, `mutations.json`, `expected-parts.json`, `expected-docs.json`, `expected-stories.json`, `suite-budget.json`
- **Sequencing/depends-on**: IC-02, IC-03, IC-04
- **Risks**: `behaviours.json` and `mutations.json` are being edited by a concurrent mission — re-fetch immediately before touching them and re-apply entries programmatically rather than merging textually. `expected-docs.json` is an **exact** ratchet, so an undocumented or extra property fails it.

### IC-06 — Generated artefacts and documentation

- **Purpose**: regenerate every committed generated file cache-free, and record the element in the consumer docs.
- **Relevant requirements**: FR-014, C-003
- **Affected surfaces**: `packages/elements/custom-elements.json`, `packages/elements/vue.d.ts`, `packages/elements/SIZES.md`, `packages/react/src/**`, `docs/design-system/using-components.md`
- **Sequencing/depends-on**: IC-02, IC-03
- **Risks**: `measure-elements-sizes.mjs` reads `dist/` and does not build it — running it before a real build records stale bytes and looks like CI non-reproducibility; the nx cache can serve `analyze`/`build` from a stale artifact, so `--skip-nx-cache` is mandatory.
