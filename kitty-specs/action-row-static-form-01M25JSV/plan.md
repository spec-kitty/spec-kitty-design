# Implementation Plan: action-row-static-form

**Branch**: `mission/action-row-static-form` | **Date**: 2026-09-10 | **Spec**: `kitty-specs/action-row-static-form-01M25JSV/spec.md`
**Input**: Feature specification from `kitty-specs/action-row-static-form-01M25JSV/spec.md`

## Summary

Author the ONE missing authored source for `sk-action-row`'s static form —
`packages/elements/src/action-row/sk-action-row.markup.ts` — producing the ADR-15-ruled
two-element wrapper (`.sk-action-row-host` > `.sk-action-row`), regenerate the static
`sk-action-row.html` and `packages/styles/src/action-row/index.ts` from it (ADR-10 §3), and add
the tests, stories, docs and ratchet entries that prove the static form is a real parity match for
the shadow form rather than a visual approximation. `sk-action-row.css` itself is **not** edited —
its header comment and `@container` rule already ship (via #301/#312) and this mission's job is to
give a consumer real markup to hang them on. No `.sk-action-row-host` CSS rule is added to any
shipped stylesheet; that is #309's scope.

## Technical Context

**Language/Version**: TypeScript (strict), compiled through the existing `packages/elements`
toolchain; the markup module is evaluated in a bare Node process by
`scripts/build-element-markup.mjs`, so it must stay a leaf or import only a leaf module.
**Primary Dependencies**: Lit (existing, for the element — untouched), no new dependency. The
markup module itself imports nothing beyond, at most, a shared leaf vocabulary module (none is
needed here — action-row has no shared tone/status vocabulary to import).
**Storage**: N/A.
**Testing**: Vitest in browser mode on the Playwright provider (per charter), extending the
existing `fixtures/elements-behaviour/src/sk-action-row.test.ts` (852 lines today) with new
`test()`/`test.each()` blocks. Storybook stories for the visual/axe/interaction surface, following
the existing `sk-action-row.stories.ts` plus a new styles-layer story file for the static form
(the repo's established pattern for components with a static form, e.g. `sk-card`, `sk-grid`).
**Target Platform**: Browser (Chromium primary per repo convention; WebKit is a known,
already-recorded gap per ADR-10, not newly introduced here).
**Project Type**: Single library package addition (no new package; touches `packages/elements` and
generated output under `packages/styles/src/action-row`).
**Performance Goals**: N/A beyond the existing `SIZES.md` budget — this mission adds one markup
module and generated HTML/index.ts; no runtime JS ships to the static path at all (that is the
point of a static form).
**Constraints**: One Work Package, one PR (C-001). No `.sk-action-row-host` CSS shipped (C-002).
`sk-action-row.css` unmodified (C-003). No repo-wide #286 gate (C-004). `.sk-record-list` untouched
(C-005).
**Scale/Scope**: One component's static-form addition. Bounded to `packages/elements/src/action-row/`,
generated `packages/styles/src/action-row/{sk-action-row.html,index.ts}`, one new or extended
stories file, `fixtures/elements-behaviour/src/sk-action-row.test.ts`, the four ratchet files at
repo root (`expected-docs.json`, `expected-parts.json`, `behaviours.json`, `mutations.json` — only
if a new subject is declared), `docs/design-system/using-components.md` (consumer-facing static-form
usage note), and `packages/elements/SIZES.md` (regenerated, not hand-edited).

## Charter Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Testing Standards** (charter): "Every component requires a Storybook story covering at
  minimum: default state, all interactive states… and responsive breakpoints." — satisfied by the
  static-form story matrix in IC-05 below, which is broader than the minimum (it also covers the
  ADR-15 reflow boundary explicitly).
- **Quality Gates** (charter): axe-core zero violations, token-only CSS, conventional commits. No
  new CSS is authored by this mission (C-003), so the token-only requirement is inherited rather
  than newly at risk. Axe coverage is IC-05.
- **Review Policy** (charter): squad tier for this mission is **C — pre-merge**, per the issue
  header. No post-spec/post-plan/post-tasks squad is required by the charter's tiering (that is
  reserved for mechanism-setting and high-blast-radius missions); this mission is routine within
  an already-ruled mechanism (ADR-15 set the mechanism; this mission applies it to one component).
- **No violation requiring Complexity Tracking.** This plan introduces one new authored module in
  the existing three-package shape (`packages/elements` source, generated `packages/styles`
  output) — the shape the recipe already prescribes for every component with a static form.

## Project Structure

### Documentation (this mission)

```
kitty-specs/action-row-static-form-01M25JSV/
├── plan.md              # this file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── research/             # evidence-log.csv, source-register.csv
└── tasks/                # Phase 2 output (/spec-kitty.tasks — not created by plan)
```

### Source code (repository)

```
packages/elements/src/action-row/
├── sk-action-row.ts                 # UNCHANGED — the shadow element, already correct
├── sk-action-row.markup.ts          # NEW — the one authored static-form source (ADR-10 §3)
├── sk-action-row.stories.ts         # UNCHANGED (shadow-element stories)
└── sk-action-row-html.stories.ts    # NEW — styles-layer story file (mirrors sk-button's split:
                                      #   sk-button.stories.ts is the element, a sibling *-html
                                      #   file exercises the static exports; verify the exact
                                      #   sibling-file naming convention against the nearest
                                      #   existing static-form component before authoring — task-
                                      #   level detail, not re-litigated here)

packages/styles/src/action-row/
├── sk-action-row.css                # UNCHANGED — header comment + @container rule already ship
├── sk-action-row.html                # GENERATED by build-element-markup.mjs — do not hand-edit
└── index.ts                          # GENERATED — the template-literal export of the static HTML

fixtures/elements-behaviour/src/
└── sk-action-row.test.ts             # EXTENDED — new test()/test.each() blocks (IC-03, IC-04)

docs/design-system/using-components.md  # EXTENDED — static-form consumer note, incl. the
                                          #   "author .sk-action-row-host yourself until #309" block

expected-docs.json, expected-parts.json, behaviours.json, mutations.json  # repo root — checked,
                                          #   updated only if the markup module changes the
                                          #   element's manifest (it should not — see IC-06) or if
                                          #   a new mutation-testing subject is declared

packages/elements/SIZES.md              # regenerated (build first, never hand-edited)
```

**Structure Decision**: Single project structure (this is a component-library addition, not an
app). No new package, no new directory beyond the standard per-component layout the recipe
already defines. The only genuinely new authored file is `sk-action-row.markup.ts`; everything
else is either generated, an extension of an existing file, or a ratchet/doc update.

## Implementation Concern Map

### IC-01 — Markup module: `sk-action-row.markup.ts`

- **Purpose**: Author the one static-form source the generator (`build-element-markup.mjs`)
  evaluates, producing the two-element wrapper markup and the light-DOM anatomy classes.
- **Relevant requirements**: FR-001, FR-002, FR-004, FR-008, FR-009, FR-010, FR-013, FR-014,
  FR-019, FR-020.
- **Affected surfaces**: `packages/elements/src/action-row/sk-action-row.markup.ts` (new).
- **Sequencing/depends-on**: none — this is the root of the mission's dependency graph.
- **Design, resolving research.md's two open questions**:
  - `ACTION_ROW_VARIANTS`: `{}` (empty object; the generator requires the export even when empty,
    per the recipe and `sk-grid.markup.ts`'s comment on exactly this). Action-row has no
    mutually-exclusive variant enum comparable to `sk-card`'s `blue`/`purple` — `layout` and
    `presentation` are independent booleans, not a choice of one among several.
  - `ACTION_ROW_AXES`: a map deriving at minimum a `Card` entry (`{ layout: 'card' }`), a `Flush`
    entry (`{ presentation: 'flush' }`), and a `Link` entry (`{ href: '#' }`, mirroring
    `BUTTON_AXES.Link` in `sk-button.markup.ts` — the anchor branch is the one every real Team
    Kitty consumer uses, per that file's own precedent comment) — each producing a distinct
    generated export the way `BUTTON_AXES`/`GRID_AXES` do.
  - `actionRowStaticHtml(opts: ActionRowStaticOptions = {}, content?)`: an options object (never
    positionals, per the recipe's `<name>StaticHtml(opts, content?)` contract), covering `layout`,
    `presentation`, `current` (drives `aria-current`; named distinctly from the element's own
    `selected` property because the static form has no activation concept to select *from* — it is
    a purely presentational flag, and the name should say so rather than implying a control that
    does not exist statically), and `href` (drives the route-anchor vs. static-div trigger shape,
    mirroring `buttonStaticHtml`'s `href`-driven branch in `sk-button.markup.ts`). It throws on an
    invalid `layout`/`presentation` value (authoring-time contract, matching `cardStaticHtml`/
    `gridStaticHtml`); there is no "unknown value" case for `href`/`current` since they are not
    enums.
  - `actionRowClasses(layout?, presentation?)`: the render-path sibling, warns and degrades
    (matching `cardClasses`/`buttonClasses`), used by the element's own `render()` today only
    implicitly (the element currently inlines its class-list ternary — whether to refactor
    `sk-action-row.ts` to call this helper is a task-level decision; the recipe does not require
    it, and ADR-10 §3's "no markup authored twice" is about markup, not about the class-list
    expression specifically. Default: leave `sk-action-row.ts` untouched unless doing so would
    create the exact restatement ADR-10 §3 exists to prevent — measure at task time).
  - **Escaping**: `href` reaches attribute position in the static form exactly as it does in
    `buttonStaticHtml`; reuse the same `attr()` escaping approach (HTML-entity-escape `&"'<>`),
    verified by a parsing-based test (not substring matching), per `sk-button.markup.ts`'s own
    documented rationale.
  - **Trigger shape decision** (FR-008/009/010): `actionRowStaticHtml` renders `<a
    class="sk-action-row__trigger" href="…">` when `href` is a non-blank string, else `<div
    class="sk-action-row__trigger sk-action-row__trigger--static">`. It NEVER renders a `<button>`
    trigger — there is no listener without the custom element, and promising one would be a
    contract the static form cannot keep. This is stated as an explicit non-goal in spec.md.
  - **Controls placement** (FR-006): the generated markup places `<div
    class="sk-action-row__controls">…</div>` (when the caller supplies controls content) as a
    sibling of the trigger element, both children of the outer `.sk-action-row` div — reproducing
    `sk-action-row.ts`'s own DOM shape exactly. When no controls content is supplied, the element
    is omitted entirely (FR-014) — no `hidden` attribute, because there is no script to remove it.
  - **Optional-part omission** (FR-013): each of mark/reference/tags/metadata/supporting renders
    its wrapper `<span>` only when non-blank content is supplied for it; absent content omits the
    element, matching the data-model.md "Absence rule".

### IC-02 — Generated artifacts

- **Purpose**: Regenerate `packages/styles/src/action-row/sk-action-row.html` and `index.ts` from
  the new markup module, and confirm `--check` drift detection is clean.
- **Relevant requirements**: FR-020, NFR-005.
- **Affected surfaces**: `packages/styles/src/action-row/sk-action-row.html` (generated),
  `packages/styles/src/action-row/index.ts` (generated), `packages/elements/SIZES.md` (regenerated
  after a real build).
- **Sequencing/depends-on**: IC-01.
- **Notes**: `node scripts/build-elements-css.mjs`, `node scripts/build-element-markup.mjs`,
  `npx nx run elements:analyze`, `node scripts/build-react-wrappers.mjs`, `node
  scripts/build-vue-types.mjs`, then the matching `--check` passes, exactly as the recipe's step 7
  lists. Build `tokens,styles,elements` before `measure-elements-sizes.mjs` (it reads `dist/`,
  never builds it).

### IC-03 — Reflow parity test (static vs. shadow)

- **Purpose**: A real, falsifiable comparison — not a visual approximation — proving the static
  form's computed layout matches the shadow form's at the same widths, specifically at the
  400px/401px boundary ADR-15's own measurement used to catch the collapsed-form defect.
- **Relevant requirements**: FR-003, NFR-001.
- **Affected surfaces**: `fixtures/elements-behaviour/src/sk-action-row.test.ts` (new test block).
- **Sequencing/depends-on**: IC-01, IC-02.
- **Design**: Follow the existing in-repo pattern from `fixtures/elements-behaviour/src/sk-app-shell.test.ts`
  (a sized `frame` element whose `style.width` is set, then `getComputedStyle`/
  `getBoundingClientRect` read back). Concretely:
  1. Mount the real `<sk-action-row>` (with representative slotted content) inside a sized frame
     at 360px, 400px and 401px; record `flex-wrap` on the row and `grid-template-columns`/
     `grid-template-areas` on the trigger.
  2. Build the static two-element markup via `actionRowStaticHtml()` with equivalent content,
     append it to a **second** sized frame at the same widths, with `.sk-action-row-host`'s CSS
     block authored locally in the test (the same four declarations documented in
     `sk-action-row.css`'s header comment and in spec.md's FR-005/Decision 2) plus the real
     built `sk-action-row.css` linked/adopted — reproducing exactly what a real consumer does.
  3. Assert the two frames' computed values are equal at each width, and specifically that 400px
     reads `wrap`/`nowrap` correctly relative to 401px (the boundary ADR-15 measured).
  4. Add one more assertion pinning the local test's `.sk-action-row-host` CSS block textually
     equal (order-insensitive) to the block in `sk-action-row.css`'s header comment, so the two
     copies cannot silently diverge before #309 replaces the hand-authored one.
- **Risk**: Chromium-only is acceptable per ADR-15's own precedent (WebKit unverified, Firefox
  agrees on verdicts not exact sub-pixel values — do not hardcode a literal grid-track string from
  ADR-15's own tables; compute and compare within this test's own run).

### IC-04 — Structural and absent-state tests

- **Purpose**: Encode the #272 sibling-not-descendant rule and every present/absent axis (the
  #308 defect-pattern lesson) as assertions that would actually fail on regression.
- **Relevant requirements**: FR-007, FR-011, FR-012, FR-013, FR-014, FR-017, NFR-002, NFR-003.
- **Affected surfaces**: `fixtures/elements-behaviour/src/sk-action-row.test.ts` (new test blocks).
- **Sequencing/depends-on**: IC-01.
- **Design**:
  - Sibling-not-descendant: for every generated exemplar that includes controls, assert
    `container.querySelector('.sk-action-row__trigger .sk-action-row__controls') === null` AND
    that `.sk-action-row__controls` **does** exist as a direct sibling of the trigger under
    `.sk-action-row`.
  - `aria-current` present/absent: assert `hasAttribute('aria-current')` is `false` (not
    `getAttribute(...) === 'false'`) in the non-current case, for both the row (`presentation`
    absent) and the anchor case (`aria-current="page"` present only when current AND routed).
  - Flush present/absent: read `getComputedStyle` for `background-color`/`border-width` in both
    states rather than trusting class-list membership alone (mirrors the plan's own reasoning
    about #308's `display:flex` defect — a class name leak and a declaration leak are the same
    risk class).
  - Optional-part / controls absence: assert `querySelector('.sk-action-row__marker')` etc. is
    `null` when no content was supplied — not merely invisible.
  - Keyboard/target-size: iterate the trigger and each control, assert distinct `tabIndex`-reachable
    nodes in DOM order and `getBoundingClientRect()` height/width ≥ 44px at both a narrow (≤400px)
    and a desktop frame width.

### IC-05 — Stories

- **Purpose**: Cover the issue's full required story/state matrix for the static form, defaulting
  dark with a required `LightMode` variant, plus the accessibility/motion/forced-colors/RTL/zoom
  states named in the issue.
- **Relevant requirements**: FR-021, FR-022, FR-023, FR-024, SC-003, SC-006.
- **Affected surfaces**: new styles-layer story file under `packages/elements/src/action-row/`
  (naming convention confirmed against the nearest static-form precedent at task time).
- **Sequencing/depends-on**: IC-01, IC-02.
- **Coverage list** (from the issue's "Required stories and tests," mapped onto the static form
  specifically — the shadow form's existing stories already cover the shadow-only states):
  one row and a collection; with/without a mark; with/without metadata, tags and supporting
  content; one trailing control and several; no trailing control; route mode with trailing
  controls beside it; `aria-current`; long identifiers and long email addresses; narrow (≤400px)
  and desktop widths with the reflow visible in both forms side by side; `LightMode`; reduced
  motion (assert no animation, inherited from the unmodified sheet); forced colors; RTL/logical
  layout; 200% zoom; a single-row fragment rendered alone (FR-015 proof).
- **Axe/visual**: run through the existing `run-axe-storybook.js` pipeline; visual baselines taken
  from CI per the repo-wide rule, never a local snapshot.

### IC-06 — Ratchets and docs

- **Purpose**: Keep the four ratchet files and the consumer-facing docs synchronized with the new
  surface, per the recipe and DIRECTIVE_037 (behavior-describing artifacts evolve together).
- **Relevant requirements**: FR-018, FR-025.
- **Affected surfaces**: `expected-docs.json`, `expected-parts.json`, `behaviours.json`,
  `mutations.json` (repo root); `docs/design-system/using-components.md`.
- **Sequencing/depends-on**: IC-01 through IC-05.
- **Expectation, stated so it is checked rather than assumed**: `sk-action-row` already has rows in
  `expected-docs.json` (line 44) and `expected-parts.json` (line 45) from prior missions (#146,
  #212, #272). This mission's markup module does **not** add a new custom-element attribute,
  method or `@csspart` — it is a separate authored source, not a change to `sk-action-row.ts`'s
  manifest — so those two ratchets' `total` counts are expected to be **unchanged**. Confirm this
  at task time by running `check-manifest-content.mjs` and `check-part-ratchet.mjs`; if either
  ratchet needs a change, that is a signal the design has drifted from this plan and should be
  re-examined, not silently accommodated.
- **`behaviours.json`/`mutations.json`**: only touched if the new tests in IC-03/IC-04 are wired as
  formal mutation-testing subjects (declaring a new behaviour id) rather than as ordinary
  assertions in the existing `sk-action-row.test.ts`. Default: they are ordinary assertions (the
  parity/structural/absent-state properties are not part of ADR-11's required-behaviours list —
  they are this mission's own acceptance bar), so no new `behaviours.json` entry is expected;
  confirm at task time rather than assume.
- **Docs**: add the static-form usage note to `docs/design-system/using-components.md`, including
  the literal `.sk-action-row-host` CSS block and the explicit sentence that it does not ship as
  package CSS until #309 lands — consistent, word-for-word compatible, with `sk-action-row.css`'s
  own header comment and with FR-005/Decision 2 above.
- **PR body**: states the `#283` boundary using the prose already committed in spec.md's "Boundary
  with #283" section (FR-018).

## Complexity Tracking

*No charter violations.* Nothing here needs justification beyond the Charter Check section above.
