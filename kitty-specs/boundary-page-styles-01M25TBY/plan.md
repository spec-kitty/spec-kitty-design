# Implementation Plan: sk-boundary-page styles-only frame

**Branch**: `mission/boundary-page-styles` | **Date**: 2026-09-10 | **Spec**: `kitty-specs/boundary-page-styles-01M25TBY/spec.md`
**Input**: Feature specification from `kitty-specs/boundary-page-styles-01M25TBY/spec.md`

## Planning discovery note

Produced from the dispatching mission brief, issue #303, epic #300, and ADR-15's own ruling text,
following the same no-interactive-interview precedent the two directly-composed sibling missions
(#302's `pill-tag-status-tone-axis-01M25AVP`, #304's `entity-marker-size-border-image-axis-01M25AVQ`)
recorded. The spec's Requirements and Non-Goals sections already capture every interim decision an
interview would otherwise surface; the genuine open questions (exact stage-centering mechanism,
whether the action-group needs an explicit `min-block-size`, and whether implementation surfaces a
real need for a card-shape modifier) are carried forward explicitly below rather than guessed at.

## Summary

**Primary requirement**: add one new styles-only component, `sk-boundary-page`, at
`packages/styles/src/boundary-page/`, implementing spec FR-001 through FR-017. No custom element,
no shadow root, no entry under `packages/elements/src/` — per research.md Decisions 1 and 1b, this
sits outside every construct kind ADR-15 ruled on, and it is deliberately styles-only under
ADR-10's class-level ruling for a document-structure reason ("the stage does not manufacture a
landmark the page already has").

**Technical approach**:

1. **Anatomy CSS** — author `sk-boundary-page.css` with the seven-part BEM anatomy from
   data-model.md (`__stage`, `__card`, `__mark`, `__title`, `__body`, `__action-group`,
   `__footnote`), tokens-first throughout, logical properties only, no card-shape modifier (spec
   FR-002) unless IC-02's verification surfaces a genuine need.
2. **Composition placement only** — `__mark` and the status-pill composition point get
   placement/spacing CSS (margin, alignment, gap) and nothing that sets a default size/shape/
   border/tone on `sk-entity-marker`/`sk-pill-tag`, and no `::part()` rule (spec FR-004, FR-005,
   FR-016, C-005).
3. **Footnote/mark absence contract** — no CSS gates on `[hidden]` or an attribute; ordinary
   flex/grid `gap` between `.sk-boundary-page__card`'s direct children is the entire mechanism, so
   the WP's job is authoring the layout correctly and then **proving** the absence contract with a
   computed-geometry test (spec FR-006, research.md Decision 4) rather than trusting the mechanism
   untested — the exact defect pattern #308 shipped.
4. **Long-content containment** — reuse `sk-empty-state--inline`'s established `overflow-wrap:
   anywhere` pattern for `__body`, verified (not merely copied) against this component's own
   padding/max-inline-size (spec FR-008).
5. **Responsive/forced-colors/reduced-motion baseline** — `@media` only (no `@container`, per
   research.md Decision 1); forced-colors treatment on the card's edge using a `border`
   (auto-remapped, zero extra author CSS per `docs/contributing/adding-a-component.md`'s
   forced-colors section) rather than a `background`-only distinguishing mark; a reduced-motion
   test asserting the absence of any transition/animation property, since the frame authors none
   (spec FR-009 through FR-012).
6. **Exemplar HTML, stories, and generated barrel** — author `.html` exemplar files (form-card,
   terminal-card, with/without mark, with/without footnote, one/several/no action, long identifier,
   long email, forced-colors) and `sk-boundary-page-html.stories.ts`, then run
   `node scripts/build-styles-only-markup.mjs` to generate `index.ts` — following the `sk-progress`/
   `sk-empty-state` pattern exactly, since this is a styles-only component with no `.markup.ts` to
   generate the HTML from.
7. **Ratchets** — this mission is not expected to touch `expected-parts.json` (no `@csspart`, no
   element), `behaviours.json`/`mutations.json` (no behaviour owned — purely presentational, no
   form association/events/focus/keyboard handling), or `expected-docs.json` (no manifest entry,
   no element). It is expected to touch `expected-stories.json` if that ratchet enumerates
   styles-only story files (IC-04 confirms against the real ratchet, not assumed here) and the
   styles barrel `packages/styles/src/index.ts` (`export * from './boundary-page/index'`).

This plan does not pre-select the exact stage-centering CSS mechanism or the action-group's exact
`min-block-size` value — the Work Package resolves both against the real token scale and a
measured 44px check, per the open questions research.md carries forward.

## Technical Context

**Language/Version**: CSS only (tokens-first), plus hand-authored static `.html` exemplar files —
this repo's existing styles-only-component toolchain (`scripts/build-styles-only-markup.mjs`). No
TypeScript, no Lit, no new build tool.
**Primary Dependencies**: none new. Composes the already-shipped `<sk-entity-marker>` and
`<sk-pill-tag>` custom elements as opaque children; reuses the existing Playwright
visual-regression/axe/behaviour-test harness.
**Storage**: N/A — presentational frame, no persistence, no fetch.
**Testing**: Playwright story-driven tests in `apps/storybook/src/tests/` (new
`sk-boundary-page-*.spec.ts`, following `sk-empty-state-inline.spec.ts`'s pattern for the
absence-contract assertions) plus Playwright visual-regression snapshots (research.md Decision 7's
named baselines) plus axe checks via the existing Storybook a11y addon.
**Target Platform**: Chromium and Firefox (this repo's two verified engines); WebKit remains the
repo's known, pre-existing gap, not newly introduced here.
**Project Type**: single — one new component directory under one existing package
(`packages/styles/src/boundary-page/`); no new package, no new app, no `packages/elements/` or
`packages/react/` change (no custom element exists to generate a wrapper for).
**Performance Goals**: N/A — CSS-only; no new runtime work, no new JavaScript, no timer, no fetch.
**Constraints**: styles-only, no custom element (spec C-002); no behaviour acquisition (spec
C-003); no repo-wide or component-scoped #286 gate (spec C-004); no `::part()` decision (spec
C-005); ADR-15 does not gate this mission (spec C-006); one WP, one PR (spec C-001); adoption
gated on Lynn's verdict, filing/planning is not (spec C-007); coordinate with Family 6, do not
fork the vocabulary (spec C-008).
**Scale/Scope**: one new CSS file (`sk-boundary-page.css`), roughly nine to twelve hand-authored
`.html` exemplar files, one generated `index.ts` (via the existing generator, never hand-edited),
one stories file, one or two new Playwright spec files (absence-contract assertions plus
responsive/forced-colors/RTL/reduced-motion assertions), new visual-regression snapshot entries,
one styles-barrel edit (`packages/styles/src/index.ts`), one `SIZES.md` regeneration, zero new
packages, one PR.

## Charter Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The committed charter (`.kittify/charter/charter.md`) predates the elements-first pivot and is
hand-curated, non-authoritative for elements-first specifics per this repo's own recorded pattern
(ADR-8 through ADR-15 supersede it here). This plan follows the ADRs and
`docs/architecture/README.md`'s "what a Status obliges" rule.

Checked against this plan's live governance activation:

- **`architectural_review_requirement`**: this mission does not contradict any Accepted ADR.
  ADR-15's four ruled-on construct kinds do not reach this frame (research.md Decision 1), so no
  equality-gated static/shadow comparison is invented or skipped. ADR-10's styles-only-component
  class ruling is satisfied by recording this component's specific reason (research.md Decision
  1b) rather than treated as a silent exception.
- **DIRECTIVE_003** (material decisions captured with context): satisfied — every non-obvious
  choice (no card-shape modifier, DOM-omission for mark/footnote rather than `[hidden]`, no
  `::part()` reach, no component-scoped no-literal test) is recorded in research.md with its
  rejected alternatives, not merely asserted in spec.md.
- **DIRECTIVE_031** (bounded-context awareness): satisfied — spec Non-Goals and Constraints keep
  Team Kitty's route/permission/domain-state/copy ownership explicit and unchanged; this mission
  adds no Team/membership/identity/session model (spec C-003).
- **Quality Gates / Review Policy** (adversarial squad; tiered cadence): this mission is Squad
  Tier C — pre-merge, per #303's own issue body. This plan does not shortcut that cadence.
- **Tokens-first governance**: satisfied structurally — every value this plan introduces resolves
  to an existing `--sk-*` token (spec NFR-001), enforced by stylelint's existing `--sk-*` rule,
  which already runs on every `.css` file in `packages/styles`.
- **Coordination governance (epic #300's Family 6 note)**: this plan's anatomy is written to be
  the vocabulary Family 6's account/public-front-door screens are expected to converge on (spec
  C-008); no Family-4-specific naming is baked into class names (`.sk-boundary-page__*`, never
  `.sk-invitation-*`/`.sk-denial-*`/etc.).

No Charter Check violations requiring the Complexity Tracking table below.

## Supply-Chain Security & Adversarial Evidence (Planning)

**No dependency is added, upgraded, or removed by this plan.** Every tool this plan relies on
(the existing `build-styles-only-markup.mjs` generator, Playwright, Storybook, stylelint) is an
already-pinned dependency exercised by the existing `sk-progress`/`sk-empty-state` styles-only
components this mission's file shape follows. Disposition: **not applicable** — no
security-impacting dependency decision exists in this plan to challenge.

## Project Structure

### Documentation (this mission)

```
kitty-specs/boundary-page-styles-01M25TBY/
├── plan.md              # This file
├── spec.md               # Mission specification (specify phase)
├── research.md           # Decisions 1, 1b, 2-7, evidence citations (specify phase)
├── data-model.md         # Anatomy model (specify phase)
├── research/             # evidence-log.csv, source-register.csv (specify phase)
└── tasks/                # /spec-kitty.tasks output (not yet created)
```

### Source Code (repository root)

This mission adds one new component directory; it adds no new package, app, or top-level
directory, and no `packages/elements/` or `packages/react/` change.

```
packages/styles/src/boundary-page/sk-boundary-page.css
    # NEW. The seven-part anatomy, tokens-first, logical properties only, no card-shape modifier.
    # Header comment records: (a) the ADR-10 styles-only-class reason (research.md Decision 1b),
    # (b) the ADR-15 non-applicability check (research.md Decision 1), (c) the footnote/mark
    # absence mechanism (ordinary gap, no attribute gate), (d) the forced-colors border mechanism.

packages/styles/src/boundary-page/sk-boundary-page-*.html
    # NEW, hand-authored (no .markup.ts exists to generate from — this is a styles-only component).
    # Required exemplars: form-card, terminal-card, with-mark, without-mark, with-footnote,
    # without-footnote, one-action, several-actions, no-action, long-identifier, long-email,
    # forced-colors. Some may combine (e.g. form-card doubles as "with mark, with footnote").

packages/styles/src/boundary-page/index.ts
    # GENERATED by `node scripts/build-styles-only-markup.mjs` from the .html files above.
    # Never hand-edited.

packages/styles/src/boundary-page/sk-boundary-page-html.stories.ts
    # NEW. Title `Patterns/SkBoundaryPage (HTML)` (or the closest existing taxonomy root per
    # CLAUDE.md §6). Default, per-exemplar named exports, LightMode wrapped in class="sk-light".

packages/styles/src/index.ts
    # + `export * from './boundary-page/index';` — one new line, alongside the existing 56 entries.

apps/storybook/src/tests/sk-boundary-page-absence.spec.ts (or similarly named, new file)
    # NEW. The mark/footnote DOM-absence geometry assertions (spec FR-006, research.md Decision 4),
    # following sk-empty-state-inline.spec.ts's measureAt()/openInline() pattern.

apps/storybook/src/tests/sk-boundary-page-responsive.spec.ts (or folded into the file above)
    # NEW. Narrow width/200%-zoom/RTL/forced-colors/reduced-motion-absence assertions (spec FR-009
    # through FR-013), following the existing per-component Playwright test shape in this repo.

apps/storybook/src/tests/visual.spec.ts
    # + new test() blocks for each named snapshot in research.md Decision 7's list, confirmed
    # against the exemplars actually authored.

expected-stories.json
    # Reviewed and updated if this ratchet enumerates styles-only-family story files; confirmed
    # against the real ratchet content during IC-04, not assumed here.

apps/storybook (generated)
    # SIZES.md regenerated from a real dist/ build (never rm -rf packages/tokens/dist first —
    # token-catalogue.json is tracked inside that ignored dir).
```

**Not touched, and stated explicitly so no WP invents work here**: `packages/elements/src/`
(no custom element), `packages/react/src/` (nothing to regenerate — no new element, no new
manifest entry), `expected-parts.json` (no `@csspart`), `expected-docs.json` (no manifest, no
attribute/method to document), `behaviours.json`/`mutations.json` (no owned behaviour — purely
presentational, per `docs/contributing/adding-a-component.md`'s "a purely presentational
component owns none of them" guidance), `packages/elements/vue.d.ts` (no element).

**Structure Decision**: single project, new-styles-only-component shape. No `src/`, `backend/`,
`frontend/`, `ios/`, or `android/` structure applies — this adds one new component directory under
one existing package, following the `sk-progress`/`sk-empty-state` precedent exactly.

## Complexity Tracking

*No Charter Check violations to justify.*

## Implementation Concern Map

> Implementation concerns are not work packages. Per spec C-001 this mission is bounded to
> exactly one Work Package; all concerns below are expected to land in that one WP, sequenced
> internally.

### IC-01 — Anatomy CSS and stage/card layout

- **Purpose**: Author the seven-part BEM anatomy with tokens-first, logical-property-only CSS,
  centering the stage and containing the card, with no card-shape modifier (spec FR-001, FR-002,
  FR-003).
- **Relevant requirements**: FR-001, FR-002, FR-003, FR-008 (containment), FR-010 (logical
  properties), NFR-001.
- **Affected surfaces**: `sk-boundary-page.css` (new file, most of it), the header comment's
  ADR-10/ADR-15 recorded-reason notes.
- **Sequencing/depends-on**: none — this is the foundation every other concern composes against.
- **Risks**: picking the stage-centering mechanism (`100dvh` flex-center vs. grid `place-items:
  center`, research.md's first open question) without verifying `dvh` behavior under 200% zoom and
  forced-colors could reintroduce a viewport-unit edge case; the WP must verify the chosen
  mechanism against the actual required-width/zoom matrix, not assume either is equivalent.

### IC-02 — Mark and status composition, placement-only

- **Purpose**: Add placement/spacing CSS for `.sk-boundary-page__mark` and the title-row status
  composition point, with zero default size/shape/border/tone and zero `::part()` reach into
  either composed component (spec FR-004, FR-005, FR-016).
- **Relevant requirements**: FR-004, FR-005, FR-016, C-005.
- **Affected surfaces**: `sk-boundary-page.css` (`__mark` placement rule, title-row layout for an
  optional composed pill), exemplar `.html` files demonstrating `<sk-entity-marker size="lg"
  shape="circle" border="true">` (explicit `border="true"`, never the bare attribute, per the
  mission brief) and the STYLES-LAYER `<span class="sk-pill-tag sk-pill-tag--status-danger">` —
  never `<sk-pill-tag class="sk-pill-tag--status-danger">`, the custom element with a class on its
  host: `status` is a property there, and the shipped `pillTagClasses()` applies the tone modifier
  to the shadow `<span part="tag">`, so a host-class never reaches it (WP01 review finding;
  corrected here from an earlier revision of this plan that named the inert form).
- **Sequencing/depends-on**: IC-01 (mark/status slots sit inside the anatomy IC-01 establishes).
- **Risks**: the known `sk-entity-marker` ergonomic gap (a bare `border` attribute silently
  no-ops in plain HTML) makes it easy for an exemplar to *look* bordered when authored carelessly
  and actually not be — the WP must visually confirm the bordered exemplar renders a visible
  border, not just that the attribute is present in markup.

### IC-03 — Footnote and mark DOM-absence contract, with its geometry proof

- **Purpose**: Confirm the anatomy's `gap`-based spacing produces zero leaked space when
  `__mark`/`__footnote` are omitted entirely, and add the computed-geometry test that would fail
  if a future edit reserved space unconditionally — the #308 defect pattern, guarded against
  directly (spec FR-006, research.md Decision 4).
- **Relevant requirements**: FR-006, FR-007 (action-group's distinct present-but-empty contract).
- **Affected surfaces**: no new CSS beyond IC-01's `gap` rule (the mechanism is inherent to
  flex/grid `gap`); a new Playwright spec file with the present/absent story-pair measurement
  described in data-model.md's "footnote absence contract" entity; exemplar `.html` files for
  with/without mark and with/without footnote; a no-action exemplar demonstrating the
  action-group's distinct "present but empty" state.
- **Sequencing/depends-on**: IC-01 (needs the real `gap` rule to measure against).
- **Risks**: this is the concern the dispatching brief names as the highest-risk defect pattern
  (#308's `display: flex` with no `[open]` qualifier, missed by 602 tests because everything
  exercised the present state). The WP must write the without-mark/without-footnote assertion
  **first** (or verify it fails against a deliberately-wrong CSS mutation) rather than writing it
  after the CSS already looks correct, so the test is proven capable of catching the failure mode
  it exists for — not merely a test that happens to pass.

### IC-04 — Long-content containment, responsive, forced-colors, reduced-motion

- **Purpose**: Author and verify the containment rule for long unbroken content, the `@media`
  responsive rules, the forced-colors border treatment, and the reduced-motion absence assertion
  — all authored once in this one sheet (spec FR-008 through FR-013).
- **Relevant requirements**: FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, SC-005, SC-006.
- **Affected surfaces**: `sk-boundary-page.css` (`overflow-wrap` on `__body`, `@media` rules,
  `@media (forced-colors: active)` block, no transition/animation anywhere), exemplar `.html`
  files (long-identifier, long-email, forced-colors, narrow-width via story viewport parameter),
  a Playwright spec asserting 44px targets, RTL mirroring, forced-colors border visibility, and
  reduced-motion absence.
- **Sequencing/depends-on**: IC-01 (needs the real anatomy to measure containment/targets
  against); independent of IC-02/IC-03.
- **Risks**: `docs/contributing/adding-a-component.md`'s forced-colors section warns that
  `background`-only distinguishing marks vanish under forced-colors and that `box-shadow`-based
  focus rings disappear entirely — the WP must verify the card's edge specifically uses `border`/
  `outline`, not `box-shadow`, and must use the longhand `-color` properties (not the `border`
  shorthand) so stylelint's `declaration-strict-value` actually polices the token, per that
  document's own recorded gate-blindness lesson.

### IC-05 — Exemplars, stories, generated barrel, visual baselines, and ratchet sweep

- **Purpose**: Bring the generated barrel, stories, visual-regression snapshots, and any
  applicable ratchet into agreement with the shipped anatomy, per
  `docs/contributing/adding-a-component.md` step 4 (as far as it applies to a styles-only,
  element-free component) and spec FR-017/SC-003 through SC-010.
- **Relevant requirements**: FR-017, SC-003 through SC-010.
- **Affected surfaces**: `packages/styles/src/boundary-page/index.ts` (generated, never
  hand-edited — run `node scripts/build-styles-only-markup.mjs`), `packages/styles/src/index.ts`
  (one new export line), `expected-stories.json` (reviewed; updated only if it actually
  enumerates styles-only families — confirmed against the real file, not assumed), the visual
  baseline snapshot names from research.md Decision 7 (confirmed against what was actually
  authored), `SIZES.md` (regenerated from a real `dist/` build).
- **Sequencing/depends-on**: IC-01 through IC-04 (ratchets and generated artifacts record the
  *final* surface, so this concern runs last).
- **Risks**: `scripts/build-styles-only-markup.mjs` fails closed on a duplicate export name or an
  unparseable filename (e.g. a leading digit) — the WP must name exemplar files so their derived
  `PascalCaseHTML` export names are both unique and valid, verified by actually running the
  generator rather than assuming the naming scheme is safe. Visual baselines specifically must be
  harvested from the mission PR's own CI run artifact, never a local `--update-snapshots`
  (NFR-004) — the #305/FR-015 defect pattern (a green gate asserting zero new coverage) is guarded
  against by naming the snapshots in research.md ahead of implementation, so a reviewer can check
  the named list against what actually landed in this concern.
