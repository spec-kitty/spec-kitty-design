# Implementation Plan: sk-entity-marker size, border and image axis

**Branch**: `mission/entity-marker-size-border-image-axis` | **Date**: 2026-09-10 | **Spec**: `kitty-specs/entity-marker-size-border-image-axis-01M25AVQ/spec.md`
**Input**: Feature specification from `kitty-specs/entity-marker-size-border-image-axis-01M25AVQ/spec.md`

## Planning discovery note

Produced from the operator-authorized mission brief, issue #304, epic #300, and ADR-15's own
ruling text, following the same no-interactive-interview precedent this train's #301 plan
recorded (Decision Moment `01M249W65EV9YR1VHCTZXMZNV1`, `yes-skip-discovery`). The spec's
Requirements and Non-Goals sections already capture every interim decision an interview would
otherwise surface; the one genuine open question (the exact `--sk-space-*` token backing the new
larger size, and the precise screen-to-existing-size mapping beyond what #304's own evidence
names) is carried forward explicitly below rather than guessed at.

## Summary

**Primary requirement**: widen `sk-entity-marker` on three axes — size, border, image — per
spec FR-001 through FR-013, implementing ADR-15's direct ruling on this issue: size and border
freeze now as ordinary equality-gated root-class modifiers; the image axis freezes only as a
documented, generically-stated authoring instruction, because ADR-15 measured that no gate can
hold the shadow and static forms of `::slotted(img)` equal on cascade position.

**Technical approach**:

1. **Size** — add one new size modifier class (`.sk-entity-marker--<name>`, name TBD by the token
   chosen) alongside the existing `.sk-entity-marker--sm`, each mapped to a `--sk-space-*` pair
   and a named Family 4 screen, leaving the unmodified default and `sm` computed boxes untouched.
   Widen `EntityMarkerSize` in `sk-entity-marker.ts` and its `entityMarkerSize()` fallback
   function to accept the new value, following the exact pattern `shape` already uses for a
   second value.
2. **Border** — add one new modifier class (`.sk-entity-marker--bordered`) using the existing
   `--sk-border-*`/`--sk-border-tint-*` token family, sized so the marker's `content-box` +
   padding geometry absorbs the border without growing the outer box (border replaces padding
   width, or padding is reduced by the border width — the exact arithmetic is decided against the
   real token values in IC-02 below, not asserted here). Add a `border` reflected property to the
   element mirroring `size`/`shape`'s existing reflect-and-fallback pattern.
3. **Image axis** — no CSS or element behavior change to the existing `::slotted(img)` rule
   itself (spec FR-007 requires it to remain exactly as effective as today, at every size/shape).
   The work here is entirely in `sk-entity-marker.css`'s existing ADR-15 header-comment
   instruction: re-verify and, if the new size/border modifiers change the demonstrated rewrite's
   specificity for a *combined* selector, update the worked example and the computed tie-boundary
   figure it prints — restating the boundary rule generically in prose (spec FR-009) and
   computing the number only inside that comment, never in `spec.md`/`plan.md`/`tasks/`.
4. **Ratchets and tests** — extend `fixtures/elements-behaviour/src/sk-entity-marker.test.ts` with
   the new axis's geometry/fallback/composition assertions (mirroring the existing `size`/`shape`
   tests exactly), add the required stories, and update `expected-parts.json` (no new parts, so no
   change expected there), `expected-docs.json` (attribute count moves by one for `border`, plus
   whatever `size`'s widened enum documentation requires), `behaviours.json`/`mutations.json` (new
   mutation arms for the border axis, same subject file), and `expected-stories.json` (new
   AxisMatrix-style stories). Rebuild `dist/` and regenerate `SIZES.md` before treating any local
   gate as authoritative (`SIZES.md needs a build first` — a stale local measure looks like drift
   that is not real).

This plan does not pre-select the new size's exact `--sk-space-*` token or its literal name — the
Work Package resolves that against the real token scale (`packages/tokens/src/tokens.css`'s
`--sk-space-1`..`--sk-space-12`) and the screen-to-size mapping FR-001 requires, since #304's own
evidence names screens (T1 account-avatar, T2 personal-mark, T1/T3 entity-glyph, T6
profile-avatar) without stating pixel figures reproducible from this checkout.

## Technical Context

**Language/Version**: TypeScript (Lit custom elements) + CSS, this repo's existing elements-first
toolchain — no new language, no new build tool.
**Primary Dependencies**: none new. Reuses Lit (already a dependency of `packages/elements`), the
existing Vitest browser-mode behaviour-test harness (`fixtures/elements-behaviour/`), and the
existing Playwright visual-regression suite (`apps/storybook/src/tests/visual.spec.ts`).
**Storage**: N/A — presentational component, no persistence.
**Testing**: Vitest browser-mode behaviour tests (geometry, fallback-and-warn, naming contract,
image cover/clip — extending `sk-entity-marker.test.ts`'s existing patterns) plus Playwright
visual-regression snapshots (new size/border/circle combinations) plus axe accessibility checks
already wired into the Storybook a11y addon (`a11y: { disable: false }` in the existing stories
file).
**Target Platform**: Chromium and Firefox (this repo's two verified engines per ADR-9/ADR-10/
ADR-15's own measurement scope); WebKit remains the repo's known, pre-existing gap, not newly
introduced here.
**Project Type**: single — an extension to one existing component across its three authored
packages (`packages/styles`, `packages/elements`, generated `packages/react`); no new package, no
new app.
**Performance Goals**: N/A — CSS-class and one-boolean-attribute additions; no new runtime work,
no new DOM node, no timer, no fetch.
**Constraints**: tokens-first (spec C-002); no image-axis equality gate (spec C-005); no repo-wide
#286 gate (spec C-004); does not re-litigate #311's six-sheet scope (spec C-006); one WP, one PR
(spec C-001); binding non-goals including no `sk-avatar` (spec C-007); filing/planning is
authorized at ready-for-Lynn, adoption gate is Lynn's alone (spec C-008).
**Scale/Scope**: one CSS file edit (`packages/styles/src/entity-marker/sk-entity-marker.css`: two
new modifier rules plus a header-comment update), one element file edit
(`packages/elements/src/entity-marker/sk-entity-marker.ts`: widened `size` union, new `border`
property), one stories file edit, one behaviour-test file edit, up to four ratchet-file edits
(`expected-parts.json` unchanged in content but reviewed, `expected-docs.json`, `behaviours.json`
+ `mutations.json`, `expected-stories.json`), one `SIZES.md` regeneration, zero new packages, one
PR.

## Charter Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The committed charter (`.kittify/charter/charter.md`) predates the elements-first pivot and is
hand-curated, non-authoritative for elements-first specifics per this repo's own recorded pattern
(ADR-8 through ADR-15 supersede it here). This plan follows the ADRs and
`docs/architecture/README.md`'s "what a Status obliges" rule.

Checked against this plan's live governance activation:

- **`architectural_review_requirement`**: this mission does not contradict any Accepted ADR — it
  implements ADR-15's own explicit ruling on #304 rather than opening a new architectural
  question, so no ADR amendment is required.
- **DIRECTIVE_003** (material decisions captured with context): satisfied — the split between
  size/border (equality-gated) and image (documented instruction only) is recorded in spec.md's
  FR-008/FR-009 and research.md's Decision 1/2, each quoting ADR-15 directly rather than
  paraphrasing it.
- **DIRECTIVE_031** (bounded-context awareness): satisfied — spec Non-Goals and Constraints keep
  Team Kitty's route/permission/domain-state/copy ownership explicit and unchanged; this mission
  adds no Team/membership/identity model (C-007).
- **Quality Gates / Review Policy** (adversarial squad; tiered cadence): this mission is Squad
  Tier C — pre-merge, per #304's own issue body. This plan does not shortcut that cadence.
- **Tokens-first governance**: satisfied structurally — every new value this plan introduces
  (size, border) is required to resolve to an existing `--sk-space-*` / `--sk-border-*` token,
  never a raw hex/rgba/px (spec C-002), enforced by `stylelint`'s existing `--sk-*` rule which
  already runs on every `.css` file in `packages/styles`.

No Charter Check violations requiring the Complexity Tracking table below.

## Supply-Chain Security & Adversarial Evidence (Planning)

**No dependency is added, upgraded, or removed by this plan.** Every tool this plan relies on
(Lit, Vitest, Playwright, Storybook, the existing generator scripts under `scripts/`) is an
already-pinned dependency exercised by the existing `sk-entity-marker` test/story suite this
mission extends. Disposition: **not applicable** — no security-impacting dependency decision
exists in this plan to challenge.

## Project Structure

### Documentation (this mission)

```
kitty-specs/entity-marker-size-border-image-axis-01M25AVQ/
├── plan.md              # This file
├── research.md           # Decisions 1-5, evidence citations (specify phase)
├── data-model.md         # Presentation-attribute model (specify phase)
├── research/             # evidence-log.csv, source-register.csv (specify phase)
└── tasks/                # /spec-kitty.tasks output (not yet created)
```

### Source Code (repository root)

This mission extends one existing component; it adds no new package, app, or top-level directory.

```
packages/styles/src/entity-marker/sk-entity-marker.css
    # + .sk-entity-marker--<new-size> and .sk-entity-marker--bordered modifier rules,
    # token-driven only; header comment re-verified/updated for the image-axis instruction
    # if the combined size+image selector changes the documented specificity figure.

packages/elements/src/entity-marker/sk-entity-marker.ts
    # widened `size` union (EntityMarkerSize) and its entityMarkerSize() fallback function;
    # new `border` reflected property and its own fallback function, same pattern as size/shape;
    # render() gains the new modifier class(es), still no user-visible literal (spec FR-012).

packages/elements/src/entity-marker/sk-entity-marker.stories.ts
    # extend AxisMatrix (or add a new story) to cover the new size and the border modifier
    # at every size/shape combination; extend ImageNaming to demonstrate the image axis at
    # the new size; the required LightMode/dark baselines already exist and are re-verified.

fixtures/elements-behaviour/src/sk-entity-marker.test.ts
    # extend geometry/fallback/composition tests for the new size and border axes, mirroring
    # the existing size/shape test shapes exactly; no new behaviour ids are introduced (this
    # remains a presentational-axis extension, not new interaction behavior).

expected-docs.json, behaviours.json, mutations.json, expected-stories.json
    # ratchet updates per docs/contributing/adding-a-component.md step 4; expected-parts.json
    # reviewed for no change (no new @csspart is added by this mission).

apps/storybook (generated)
    # SIZES.md regenerated from a real dist/ build (never rm -rf packages/tokens/dist first —
    # token-catalogue.json is tracked inside that ignored dir).

packages/react/src (generated, never hand-edited)
    # regenerated by build-react-wrappers.mjs from the updated custom-elements.json manifest
    # once size/border property JSDoc lands; --check must stay green.
```

**Structure Decision**: single project, component-extension shape. No `src/`, `backend/`,
`frontend/`, `ios/`, or `android/` structure applies — this widens one existing custom element
across its three authored packages.

## Complexity Tracking

*No Charter Check violations to justify.*

## Implementation Concern Map

> Implementation concerns are not work packages. Per spec C-001 this mission is bounded to
> exactly one Work Package; all concerns below are expected to land in that one WP, sequenced
> internally.

### IC-01 — Named size scale

- **Purpose**: Add exactly one new named size beyond the existing default/`sm`, backed by a
  `--sk-space-*` token and justified by a Family 4 screen (T6's membership-detail profile
  picture, per research.md's Decision on the size scale), while leaving the default and `sm`
  computed boxes byte-identical to today.
- **Relevant requirements**: FR-001, FR-002, NFR-001.
- **Affected surfaces**: `sk-entity-marker.css` (`.sk-entity-marker--<name>` rule),
  `sk-entity-marker.ts` (`EntityMarkerSize` union, `entityMarkerSize()` fallback),
  `sk-entity-marker.test.ts` (geometry assertions for the new size, extending the existing "size
  and shape compose as two independent presentation axes" test), `expected-docs.json` (attribute
  enum documentation).
- **Sequencing/depends-on**: none — this can start first; IC-02 and IC-03 both compose against
  its output (a marker that can be sized before it is bordered or imaged).
- **Risks**: the exact token/name choice is this WP's decision, not this plan's — resolving it to
  a *speculative* size not evidenced by a named Family 4 screen would violate spec FR-001's "no
  speculative sizes are added" language. The WP must cite the specific screen by name in the CSS
  comment and the story, not just pick a token that "looks right."

### IC-02 — Optional border modifier with unchanged outer box

- **Purpose**: Add a bordered presentation that does not change the marker's outer
  `inline-size`/`block-size`, proven with a visual-regression snapshot comparing bordered vs.
  unbordered at the same size/shape.
- **Relevant requirements**: FR-004, FR-005, FR-006, NFR-001.
- **Affected surfaces**: `sk-entity-marker.css` (`.sk-entity-marker--bordered` rule, consuming
  `--sk-border-*`/`--sk-border-tint-*`), `sk-entity-marker.ts` (`border` reflected property and
  fallback function), `sk-entity-marker.test.ts` (outer-box-unchanged assertion), stories (a
  bordered variant in the axis matrix), `apps/storybook/src/tests/visual.spec.ts-snapshots/` (new
  snapshots).
- **Sequencing/depends-on**: IC-01 (the border must be proven unchanged at every size, so the
  size axis needs to exist first, even though the two are independent CSS rules).
- **Risks**: `box-sizing: content-box` means a border added naively (as a `border` shorthand
  property) enlarges the box unless the geometry is compensated — the WP must state, in the CSS
  comment, the exact padding/border arithmetic used (e.g., reducing padding by the border width,
  or using `outline` instead of `border` if that proves simpler and equally forced-colors-safe —
  `docs/contributing/adding-a-component.md`'s forced-colors section already prefers `outline` for
  focus rings for exactly this "add a ring without an outer-box change" reason, though outline
  does not participate in border-radius clipping the same way border does, so the WP must verify
  the chosen mechanism against the circle shape specifically before committing to it).

### IC-03 — Image axis instruction re-verification and update

- **Purpose**: Confirm the existing `::slotted(img)` behavior is unaffected by the new axes
  (FR-007), and update the CSS header comment's worked example and tie-boundary figure only if
  the combined size/border-modifier-plus-image selector this mission's own docs demonstrate
  changes the specificity ADR-15's comment currently documents for the bare rewrite.
- **Relevant requirements**: FR-008, FR-009, C-005, C-006.
- **Affected surfaces**: `sk-entity-marker.css`'s header comment only — no selector or
  declaration change to `::slotted(img)` itself (ADR-15's own PR already shipped that rule and
  its instruction; this mission must not re-litigate #311's scope by rewriting sheets it does not
  own).
- **Sequencing/depends-on**: IC-01 and IC-02 (the comment's worked example must reflect whatever
  size/border modifier classes actually ship, so it is written last).
- **Risks**: this is the concern ADR-15 flags by name as "easy to get wrong" — the WP must state
  the tie boundary generically in the comment's prose ("strictly higher specificity than the
  shipped rewrite; a tie resolves to last-stylesheet-wins; the shadow form yields
  unconditionally") and compute any specific tuple only from the selector actually shipped, never
  transcribe `(0,1,1)`/`(0,2,1)` from ADR-15 or from this plan. A lens in the pre-merge squad
  should specifically check this file for a transcribed literal that does not match the shipped
  selector's own computed specificity.

### IC-04 — Ratchets, stories, and generated-artifact sweep

- **Purpose**: Bring every ratchet file, story, and generated artifact into agreement with the
  new surface, per `docs/contributing/adding-a-component.md` step 4 and this issue's "Required
  stories and tests" section.
- **Relevant requirements**: FR-013, SC-002 through SC-007.
- **Affected surfaces**: `expected-parts.json` (reviewed, no new part expected),
  `expected-docs.json`, `behaviours.json` + `mutations.json` (new mutation arms for the border
  axis, same `sk-entity-marker.test.ts` subject file — no new behaviour *id* since this remains
  presentational, per `docs/contributing/adding-a-component.md`'s "purely presentational component
  owns none of them" guidance, unless the WP determines the border axis needs its own SC-### id,
  which it must justify explicitly if so), `expected-stories.json`, `SIZES.md` (regenerated from
  a real `dist/` build, never a stale local measure), `packages/react/src` (regenerated, never
  hand-edited), `packages/elements/vue.d.ts` (regenerated).
- **Sequencing/depends-on**: IC-01, IC-02, IC-03 (ratchets record the *final* surface, so this
  concern runs last).
- **Risks**: `expected-docs.json`'s equality check is exact in both directions — an
  under-counted or over-counted attribute total fails CI regardless of which direction is wrong;
  the WP must count the `border` property plus the widened `size` enum's own documentation
  carefully against `check-manifest-content.mjs`'s actual comparison, not estimate it.
