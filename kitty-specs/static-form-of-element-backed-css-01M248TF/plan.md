# Implementation Plan: Static Form of Element-Backed CSS Families (Decision, Gap G0)

**Branch**: `mission/static-form-of-element-backed-css` | **Date**: 2026-09-10 | **Spec**: `kitty-specs/static-form-of-element-backed-css-01M248TF/spec.md`
**Input**: Feature specification from `kitty-specs/static-form-of-element-backed-css-01M248TF/spec.md`

## Planning discovery note

As in specify, this plan was produced from the operator-authorized brief and the spec's own
content rather than an interactive interview (Decision Moment `01M249W65EV9YR1VHCTZXMZNV1`,
resolved `yes-skip-discovery` — see `spec-kitty agent decision verify` for the ledger). No planning
questions were left open; the spec's Assumptions and Edge Cases sections already record every
interim decision an interview would otherwise have surfaced.

## Summary

**Primary requirement**: produce a recorded, ADR-level ruling on whether the three shadow-DOM-only
CSS construct kinds — host-attribute variant axis, host-owned `container-type`, `::slotted()`
child rule — get a generated light-DOM static form or a stated shadow-only rule, backed by a real
measurement rather than an assertion (spec FR-001, FR-002, FR-008).

**Technical approach**: this plan does not perform the measurement or write the ruling — that is
the implementation Work Package's job. It designs **how** the measurement is performed so the
implementer has a concrete, reproducible method rather than having to invent one mid-WP:

1. Build the real package (`npx nx run tokens:build --skip-nx-cache && npx nx run styles:build
   --skip-nx-cache`, `rm -rf` the `dist/` first) so every comparison is against actual emitted
   artifacts, not source.
2. For each of the three construct kinds, render the **real custom element** (`sk-app-shell`,
   `sk-action-row`, `sk-entity-marker`) through the existing Storybook build and Playwright
   harness this repo already uses for cross-browser behaviour assertions (see
   `apps/storybook/src/tests/sk-app-shell-compact-navigation.spec.ts` for the established pattern:
   load a story's `iframe.html`, resize the frame, read `getBoundingClientRect()` / computed style
   / `[part]` visibility through the shadow root).
3. Hand-author one throwaway static HTML+CSS exemplar per construct kind, linking the **real
   built CSS file at its actual package subpath** (e.g.
   `packages/styles/dist/action-row/sk-action-row.css`, the same file
   `@spec-kitty/styles/action-row/*` resolves to for an installed consumer — confirmed resolvable
   in `research.md`'s R-006) plus a small rewritten rule set per the candidate-(a) transform
   (`:host([presentation="x"])` → `.sk-<name>--x`; `:host { container-type }` → `.sk-<name> {
   container-type }`; `::slotted(y)` → `.sk-<name> > y`). This exemplar is evidence, not a shipped
   generator — FR-006 explicitly forbids building the generator itself in this WP.
4. Capture the same, pre-declared set of observable outcomes (see
   `contracts/measurement-contract.md`) from both renderings at the same viewport widths, and diff
   them. Zero diff on every declared outcome for a construct kind is the "static exemplar
   demonstrated equal" result; any outcome that provably cannot be reproduced outside a shadow
   root is the "negative measurement," recorded with the specific CSS/DOM mechanism that blocks it
   (not a bare assertion that it's impossible).
5. Record the raw comparison output (JSON + a short narrative per construct kind) under this
   mission's own directory as committed evidence the ruling cites, per NFR-001's reproducibility
   requirement.

This plan does **not** pre-select which candidate wins for any construct kind. Section
"Implementation Concern Map" below intentionally separates "run the measurement" from "author the
ruling" so the ruling is written from the measurement's actual output, not from this plan's
expectations.

## Technical Context

**Language/Version**: JavaScript (Node.js, this repo's existing Active LTS toolchain — no new
language). The throwaway static exemplars are plain HTML + CSS, no build step of their own.
**Primary Dependencies**: none new. Reuses `@playwright/test` 1.62.1 and `axe-playwright` (already
`devDependencies`, already used for exactly this shape of cross-browser/shadow-DOM assertion —
see `apps/storybook/src/tests/*.spec.ts`) and this repo's existing Nx build targets
(`tokens:build`, `styles:build`). No package.json change is anticipated by this plan.
**Storage**: N/A — evidence is committed Markdown/JSON files under
`kitty-specs/static-form-of-element-backed-css-01M248TF/measurement/`, not application data.
**Testing**: the discriminating measurement is a **mission-scoped, one-off** Playwright/Node probe,
committed as evidence but **not** wired into the permanent CI suite — turning it into a permanent
boundary/drift gate is exactly the generator/gate work FR-006 requires to be named and filed as
separate issues if candidate (a) wins, not built here. This mission's own PR still runs the
repo's existing unmodified gates (`npm run quality:all`, `check-adopted-css-boundaries.mjs`,
`check-adr-index.mjs`) to confirm the doc/ADR edits and the probe script introduce no regression.
**Target Platform**: Chromium and Firefox, the two engines this repo's own ADR-9/ADR-10
confirmations already used for equivalent claims. WebKit stays this repo's known,
already-recorded gap (ADR-10 §Neutral: "WebKit remains unverified locally... Playwright's WebKit
could not launch on this host") — not newly introduced by this mission.
**Project Type**: single (documentation/ADR change plus one mission-scoped evidence script; no new
package, no new app, no new component).
**Performance Goals**: N/A — decision mission, no runtime performance target.
**Constraints**: must hold for real package consumption via the `@spec-kitty/styles/<name>/*`
subpath exports (spec FR-004, confirmed resolvable by a real build); must not change any shipped
component's visual contract (spec C-004); must fit one Work Package (spec C-001); must not cite
Lynn's unrecorded product verdict (spec C-003).
**Scale/Scope**: at most 3 measurement probes (one per construct kind); documentation edits to at
most 2 ADRs (most plausibly ADR-9 and/or ADR-10) plus `docs/contributing/adding-a-component.md`
plus up to 3 components' own doc surfaces, only if candidate (b) is selected for a given construct
kind; at most 3 follow-up issues filed (naming, not building, generator/gate work), only if
candidate (a) is selected for a given construct kind.

## Charter Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The committed charter (`.kittify/charter/charter.md`, generated 2026-05-01) predates the
elements-first pivot (ADR-8 onward, 2026-09-02) and still describes Angular and SCSS as primary —
per this repo's own recorded pattern (`charter.md is hand-curated`; ADR-8/9/10/11 supersede it on
anything elements-first-specific). This plan follows the ADRs and `docs/architecture/README.md`'s
"what a Status obliges" rule over the stale charter prose, and does not treat the charter's
Angular/SCSS framing as a live constraint.

What the charter's still-live governance activation does require, checked against this plan:

- **`architectural_review_requirement`** (via `docs/architecture/README.md`): since ADR-9 and
  ADR-10 are both `Accepted`, any spec/plan position that would contradict either must carry an
  ADR amendment as a tracked work item. **This mission's entire deliverable is that ADR
  amendment** (spec FR-001) — the requirement is satisfied structurally, not worked around.
- **DIRECTIVE_003** (material decisions captured with context): satisfied by FR-001/FR-002/FR-008
  requiring the ruling to be evidence-backed and per-construct-kind, not a bare verdict.
- **DIRECTIVE_031** (bounded-context awareness; explicit translation across boundaries): satisfied
  by C-002/C-004 keeping the library/consumer (Team Kitty) boundary explicit and unchanged.
- **Quality Gates / Review Policy** (adversarial squad closes every PR; one maintainer approval
  for component-file changes): this mission's PR touches ADR/doc files and, conditionally, a small
  number of component doc surfaces — no `packages/elements` or `packages/styles` CSS/behavior
  change is anticipated, so this stays within the "documentation-only" self-merge lane's spirit,
  but the mission still goes through the tiered squad cadence this repo's charter and mission
  tier (`C — pre-merge`, per #301) specify.

No Charter Check violations requiring the Complexity Tracking table below.

## Supply-Chain Security & Adversarial Evidence (Planning)

**No dependency is added, upgraded, or removed by this plan.** `@playwright/test` and
`axe-playwright` are pinned `devDependencies` already present at the versions this plan reuses
(`1.62.1` / `^2.2.2`); this plan's measurement harness calls the same repo-standard `npx nx run
storybook:storybook:build` + Playwright invocation pattern already exercised in CI. Disposition:
**not applicable** — no security-impacting dependency decision exists in this plan to challenge.

## Project Structure

### Documentation (this mission)

```
kitty-specs/static-form-of-element-backed-css-01M248TF/
├── plan.md                      # This file
├── research.md                  # Decisions R-001..R-009, evidence verification (specify + plan)
├── data-model.md                # Construct-kind/ruling/measurement entities
├── quickstart.md                # How to reproduce the FR-008 measurement
├── contracts/
│   └── measurement-contract.md  # The pre-declared "equal" vs. "negative" outcome schema
├── measurement/                 # Implementation-phase output: raw probe results (not yet created)
└── tasks/                       # /spec-kitty.tasks output (not yet created)
```

### Source Code (repository root)

This mission is a **decision mission**: it does not add a new package, app, or component
directory. The "source" it touches is:

```
docs/architecture/decisions/            # the ADR or ADR amendment this mission produces (FR-001)
docs/contributing/adding-a-component.md # corrected only if candidate (b) wins for a construct kind (FR-007)
packages/styles/src/<component>/        # doc-comment corrections only, only if candidate (b) wins
                                         # for that component's construct kind (FR-007) — no CSS,
                                         # markup, or element behavior change (C-004)
kitty-specs/static-form-of-element-backed-css-01M248TF/measurement/
                                         # committed probe script(s) + captured JSON evidence (FR-008),
                                         # mission-scoped, not wired into the permanent CI suite
```

**Structure Decision**: single project, decision/documentation shape. No `src/`, `backend/`,
`frontend/`, `ios/`, or `android/` structure applies — this is not a web/mobile feature build.

## Complexity Tracking

*No Charter Check violations to justify.*

## Implementation Concern Map

> Implementation concerns are not work packages. `/spec-kitty.tasks` decides how these map to
> WPs; per spec C-001 this mission is bounded to exactly one Work Package, so all three concerns
> below are expected to land in that one WP, sequenced internally rather than split across WPs.

### IC-01 — Run the FR-008 measurement per construct kind

- **Purpose**: Produce the discriminating evidence (static exemplar demonstrated equal, or a
  recorded negative measurement) for each of the three construct kinds, using the real built
  package artifacts and the repo's existing Playwright/Storybook harness pattern.
- **Relevant requirements**: FR-008, FR-004, NFR-001.
- **Affected surfaces**: `kitty-specs/static-form-of-element-backed-css-01M248TF/measurement/`
  (new, mission-scoped); reads (does not modify) `packages/styles/dist/**` (built, gitignored) and
  the live Storybook build for `sk-app-shell`, `sk-action-row`, `sk-entity-marker`.
- **Sequencing/depends-on**: none — this must run first, since IC-02 depends on its output.
- **Risks**: Container-query "nearest ancestor" scoping means a static exemplar could measure
  equal in isolation but diverge from the shadow form once composed with an outer container of
  the same `container-type` (the shadow boundary gives the element-backed form free isolation a
  light-DOM class does not get). The probe must include at least one composed-nesting case per
  container-type construct kind (app-shell, action-row), not only the isolated case, or a
  "generated static form" verdict could rest on an incomplete measurement.

### IC-02 — Author the ruling from the measurement's actual output

- **Purpose**: Write the ADR or ADR amendment naming, per construct kind, which candidate the
  IC-01 evidence selects and why, plus the required cross-references (FR-002, FR-003, FR-005,
  FR-009).
- **Relevant requirements**: FR-001, FR-002, FR-003, FR-005, FR-009.
- **Affected surfaces**: `docs/architecture/decisions/` (new file, or an amendment appended to
  ADR-9 and/or ADR-10 following the precedent `docs/architecture/decisions/2026-09-02-10-...md`'s
  own "operator override" amendments already set — same file, a new dated section, not a rewrite
  of prior content).
- **Sequencing/depends-on**: IC-01 (the ruling is written from measured results, not drafted in
  parallel with them).
- **Risks**: the T3/T4 canvas evidence (FR-009) cannot be independently re-verified from this
  checkout (spec "Evidence verification"); the ruling must attribute it as reported testimony
  rather than present it as this mission's own measurement.

### IC-03 — Conditional follow-through per construct kind

- **Purpose**: For each construct kind where candidate (a) wins, name the required generator and
  boundary-gate changes and file them as separate issues with probe tables identified (FR-006).
  For each construct kind where candidate (b) wins, correct every document that currently implies
  a static equivalent exists, and add "what to author instead" guidance to that component's own
  doc surface (FR-007).
- **Relevant requirements**: FR-006, FR-007, NFR-002.
- **Affected surfaces**: conditionally, `docs/contributing/adding-a-component.md`,
  `packages/styles/src/app-shell/`, `packages/styles/src/action-row/`,
  `packages/styles/src/entity-marker/` doc comments only (no CSS/behavior change), and new
  GitHub issues (candidate a).
- **Sequencing/depends-on**: IC-02 (this concern's shape depends entirely on the ruling's
  per-construct-kind verdicts).
- **Risks**: candidate (a) work must stay bounded to *naming*, not building, the generator/gate
  changes (spec C-001); a lens should specifically check the filed issues don't contain
  implementation the WP quietly did in-line.
