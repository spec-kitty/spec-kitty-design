# Implementation Plan: Connector radio choice group

**Branch**: `mission/connector-radio-choice-group` (topology: `single_branch` — the mission lives on
this branch itself; no separate mission branch is cut) | **Date**: 2026-09-10 | **Spec**:
[`spec.md`](./spec.md)
**Input**: GitHub issue [#336](https://github.com/spec-kitty/spec-kitty-design/issues/336), epic
[#335](https://github.com/spec-kitty/spec-kitty-design/issues/335), the Opus-reviewed Family 3 C5
evidence, and the current `train/elements-first` baseline `7032cf7792a83ee20d9fd70ddcfb28a057c72884`
(this checkout's parent commit; spec.md landed as `063d2f948c8e88ad0b4e92fbf30913f83dce2541` on top
of it).

## Summary

Add one styles-only `sk-radio-choice-group` class family to `@spec-kitty/styles`, the exactly-one
counterpart to #277's `sk-checkbox-choice-group`. Author one token-only CSS source and native HTML
exemplars over real `fieldset`/`legend`/`label`/`input type="radio"` markup; generate the component
barrel with the existing styles-only markup generator; document and demonstrate the family in
Storybook including a required/invalid state and RTL; and add Playwright, axe, accessibility-tree,
containment, forced-colors (with a truthful-state proof when `accent-color` is customized), 44px
target-size, RTL, and visual-regression evidence. No custom element or JavaScript is added. The
complete change is one cohesive Work Package and one PR to `train/elements-first`.

## Engineering Alignment

- The native form tree is the architecture: `fieldset` -> `legend` plus a choices wrapper ->
  `label`s -> radio inputs sharing one `name`, plus visible primary/secondary text. No shadow
  boundary or ARIA replacement is introduced (ADR-9 does not apply — no custom element is
  registered).
- Browser state is authoritative. Styling reads `:checked`, `:disabled`, `:hover`, `:active`,
  `:focus-visible`, `:invalid`, and `:required`; it does not write or synchronize state. Exactly-one
  selection and constraint validation come from the shared `name` attribute and the native
  `required` attribute — the library adds no JS selection store.
- The public BEM vocabulary mirrors #277's shape where behavior matches, and stays distinct where
  radio semantics require it: `.sk-radio-choice-group`, `__legend`, `__options`, `__choice`,
  `__control`, `__label`, and an OPTIONAL secondary-value element (working name
  `__secondary-value`, finalized against #277's `__metadata` naming during implementation review
  to avoid implying "count" semantics that don't apply to radio's machine-value use case).
- C5's group-name/full-path anatomy is the reviewed evidence only; the maintained exemplars carry no
  GitLab vocabulary, IDs, or routes — only a generic primary label and an optional secondary machine
  value, matching spec.md's Terminology section.
- The plan adds no token unless implementation proves that every current semantic token is
  unsuitable. `--sk-space-9` (48px, the token `sk-confirm-dialog.css` already documents as "the
  closest token at or above the 44px NFR-001 floor") is the expected reuse for the interactive-target
  floor; no new token is anticipated.
- Reduced-motion: the primitive introduces no transition/animation of its own (matching #277 and the
  spec's NFR-010), so the reduced-motion assertion is a negative proof, not a new guard block.

## Technical Context

**Language/Version**: CSS, HTML, and TypeScript on the repository's existing Node/Nx toolchain.
**Primary Dependencies**: Existing `@spec-kitty/tokens`, `@spec-kitty/styles`, Storybook web
components renderer, Playwright, axe-playwright, `scripts/build-styles-only-markup.mjs`; no
dependency addition.
**Storage**: N/A; no runtime state or persistence.
**Testing**: Source/public-contract tests plus live browser tests in a new
`apps/storybook/src/tests/sk-radio-choice-group.spec.ts` (parallel to
`apps/storybook/src/tests/sk-checkbox-choice-group.spec.ts`, 885 lines, the closest real precedent
for the assertion shapes this file must add: accessibility tree, source/tab order, native
activation, submission/reset, containment, and forced-colors); visual baselines in the existing
`apps/storybook/src/tests/visual.spec.ts`; repository-wide lint/build/generator/axe gates.
**Target Platform**: Standards-based browser rendering; Chromium supplies forced-colors and
accessibility-tree evidence, with configured Playwright engines used for portable native behavior
and RTL layout.
**Project Type**: One styles-only component inside the existing Nx monorepo.
**Performance Goals**: No runtime work; remain within the charter's existing Storybook build budget
and add no JavaScript bytes.
**Constraints**: Token-only authored values, `.sk-light` theme wrapper, native control visible
(`accent-color` only), one-column/stacked narrow containment, no document overflow, no clipped
focus, 44px interactive-target floor, RTL mirroring, honest required/invalid state, and no
application logic.
**Scale/Scope**: One CSS family, maintained HTML exemplars (at minimum: default/two-choice,
none-selected, several-choices, required-invalid, disabled-option, disabled-group, long-content),
one generated barrel, one Storybook file, one browser spec, visual cases, story ratchet, and
consumer documentation.

## Charter Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The mission conforms to the charter:

- Storybook covers default, two-choice, many-choice, selected/unselected, required-invalid,
  disabled-option, disabled-group, long-content, narrow, RTL, forced-colors, default dark, and
  `LightMode` states (FR-012).
- Axe runs against every new story and load failures are failures (FR-017, NFR-002).
- Visual evidence is required and tied to the final reviewed SHA (FR-018).
- Token dependencies are documented; no raw authored design values are allowed (NFR-001).
- ADR-9's shadow-DOM/styling-API rules do not apply: no custom element is registered, so there is no
  shadow root, no `::part()`, and no cross-boundary selector risk to guard against.
- ADR-10's styles-only class ruling directly covers this component: its entire value is styling the
  semantics of native `fieldset`/`radio` elements it does not need to wrap, matching the class-level
  ruling ADR-10 records for #176 and reaffirmed for #277's sibling checkbox family.
- ADR-11's custom-element behavior registry (`behaviours.json`/`mutations.json`) is inapplicable
  because the library adds no behavior and no element — confirmed against #277's actual merged
  change, which touched neither file (verified: `git grep -l checkbox-choice-group -- '*.json'`
  returns only `expected-stories.json` and `packages/styles/package.json`). Native radio behavior
  (exactly-one selection, arrow-key roving, required/invalid) is still verified in Playwright
  because it is a binding issue requirement, not because the behavior registry requires it.
- Tier-C independent pre-merge review evidence must be posted to the PR before merge (issue's
  "Squad tier: C — pre-merge").
- No token namespace change is planned, so no token-specific maintainer decision is required.

No charter violation or complexity exception is present.

## Project Structure

### Documentation (this mission)

```text
kitty-specs/connector-radio-choice-group-01M2693Y/
├── spec.md
├── plan.md
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output (if the tasks phase requires one; this mission has no
│                          # data model beyond the DOM contract already stated in spec.md)
├── quickstart.md         # Phase 1 output
├── contracts/
│   └── radio-choice-group.contract.md
└── tasks/                 # one WP generated by the tasks phase
```

### Implementation surfaces

```text
packages/styles/src/radio-choice-group/
├── sk-radio-choice-group.css                    # AUTHORED
├── sk-radio-choice-group-default.html           # AUTHORED; several choices, one selected
├── sk-radio-choice-group-none.html              # AUTHORED; nothing selected
├── sk-radio-choice-group-two.html               # AUTHORED; the minimal two-choice Family 3 shape
├── sk-radio-choice-group-required-invalid.html  # AUTHORED; required, nothing checked
├── sk-radio-choice-group-disabled.html          # AUTHORED; one disabled option + selected/disabled
├── sk-radio-choice-group-disabled-group.html    # AUTHORED; every option disabled
├── sk-radio-choice-group-long.html              # AUTHORED; long label + long secondary value
├── index.ts                                      # GENERATED; never hand-edited
└── sk-radio-choice-group-html.stories.ts        # AUTHORED

apps/storybook/src/tests/
├── sk-radio-choice-group.spec.ts                 # AUTHORED browser/source contract
└── visual.spec.ts                                # AUTHORED visual cases (append)

apps/storybook/src/tests/visual.spec.ts-snapshots/
└── sk-radio-choice-group-*.png                   # GENERATED by the visual workflow

docs/design-system/using-components.md            # AUTHORED usage contract (new "Radio choice
                                                    # group" section, adjacent to the existing
                                                    # "Checkbox choice group" section at line 1538)
expected-stories.json                              # AUTHORED story-id ratchet (total 505 -> 505+N)
packages/styles/package.json                       # AUTHORED subpath export
                                                    # ("./radio-choice-group/*":
                                                    # "./dist/radio-choice-group/*", alongside the
                                                    # existing checkbox-choice-group line 21)
packages/styles/src/index.ts                       # AUTHORED directory export
                                                    # (export * from './radio-choice-group/index';
                                                    # alongside the existing line 43)
suite-budget.json                                   # AUTHORED only if measured suite growth requires
                                                    # it
docs/architecture/validation/issue-336-radio-choice-group-zoom/README.md
                                                    # AUTHORED manual 200% + RTL evidence (parallel
                                                    # to the existing
                                                    # issue-277-checkbox-choice-group-zoom/ record)
```

No token catalogue, element manifest, React/Vue wrapper, element size report (`SIZES.md`),
expected-parts/expected-docs ratchet, behavior registry, or mutation registry is expected to change.
`behaviours.json`/`mutations.json` are named in the programme BRIEF's ratchet list but are
inapplicable here for the same reason ADR-11 does not apply — confirmed against #277's real merged
diff, not assumed.

## Public Contract

The maintained markup uses this shape (secondary-value element name to be confirmed against #277's
final review naming during implementation, per the Engineering Alignment note above):

```html
<fieldset class="sk-radio-choice-group">
  <legend class="sk-radio-choice-group__legend">...</legend>
  <div class="sk-radio-choice-group__options">
    <label class="sk-radio-choice-group__choice">
      <input class="sk-radio-choice-group__control" type="radio" name="..." value="...">
      <span class="sk-radio-choice-group__label">...</span>
      <span class="sk-radio-choice-group__secondary-value">...</span>
    </label>
  </div>
</fieldset>
```

`__secondary-value` is optional. Every `input` in one group shares its `name` so the browser owns
exactly-one selection; the `required` attribute is authored on each radio (the native, portable way
to require the group) when the group must have a choice before submission. Consumers author the
legend, every visible label, and choose names/values/order/selected/required/disabled state. The
class family does not require a particular option count.

## Story Catalogue and Ratchet

Story title: `Form/SkRadioChoiceGroup (HTML)` (mirrors `Form/SkCheckboxChoiceGroup (HTML)`).
Required exports/ids (final ids are Storybook-generated; confirm by building and reading
`storybook-static/index.json` before finalizing the ratchet, per FR-012):

| Export | Evidence |
|---|---|
| `Default` | reusable several-choice group, one selected |
| `TwoChoice` | the minimal Family 3 C5 shape |
| `OneOption` | a single-radio group (edge case) |
| `ManyOptions` | several choices |
| `NoneSelected` | zero checked, not required |
| `RequiredInvalid` | `required`, nothing checked, native invalid state visible |
| `DisabledOption` | one disabled choice among enabled ones |
| `DisabledGroup` | every choice disabled |
| `LongContent` | long legend, label, and secondary value |
| `Narrow` | stacked/one-column containment at 44px floor |
| `RTL` | `dir="rtl"` mirrored layout |
| `FocusStates` | programmatic story focus for baseline only |
| `ForcedColors` | mixed state cue set, including a customized `accent-color` choice |
| `DefaultDark` | explicit dark approval surface |
| `LightMode` | `.sk-light` wrapper |

That is 15 candidate ids against #277's 12 — the three additions (`RequiredInvalid`, `RTL`, and
either `OneOption` or `ManyOptions` collapsing into `TwoChoice`/`Default`) are issue-mandated states
#277 did not carry. The tasks phase and implementer must reconcile the exact count against what
Storybook actually generates and update `expected-stories.json`'s `total` (currently 505) by the
real delta — this table is a floor on required *semantic* coverage, not a promise of exactly 15
rows.

## Implementation Concern Map

### IC-01 - Native markup and styles-only distribution

- **Purpose**: Author the native HTML exemplars, generate their barrel, add the package
  subpath/root exports, and positively assert absence from every element/wrapper surface.
- **Relevant requirements**: FR-001, FR-002, FR-003, FR-004, FR-014; C-001, C-005, C-007.
- **Affected surfaces**: `packages/styles/src/radio-choice-group/**`, `packages/styles/package.json`,
  `packages/styles/src/index.ts`.
- **Sequencing/depends-on**: none. Start with a source-contract test that fails because the
  directory/public export does not exist; author exemplars; run
  `node scripts/build-styles-only-markup.mjs`; make the same test green.
- **Risks**: Hand-editing generated `index.ts`, or reaching for `packages/elements` by habit. The
  generator's `--check` and explicit element-absence assertions catch both.

### IC-02 - Token-driven layout and state presentation

- **Purpose**: Implement the BEM family using intrinsic stacking, local text wrapping, native radio
  visibility, a 44px interactive-target floor, and non-color-only rest/hover/active/selected/
  focus-visible/required-invalid/disabled cues.
- **Relevant requirements**: FR-005, FR-007, FR-008, FR-009, FR-010, FR-011; NFR-001, NFR-004,
  NFR-005, NFR-006, NFR-009, NFR-010, NFR-011; C-006, C-008.
- **Affected surface**: `sk-radio-choice-group.css` only.
- **Sequencing/depends-on**: IC-01 (needs the exemplar structure to style against).
- **Risks**: `appearance: none`, hidden inputs, or pseudo-radios would violate C-006 even if
  screenshots look right — source/DOM tests explicitly reject those techniques (NI-004). A
  `forced-color-adjust: none` guard anywhere would violate NI-007. RTL needs logical properties
  (`inline-size`, `margin-inline-*`, `padding-inline-*`) rather than physical `left`/`right`, matching
  the pattern already used in `sk-checkbox-choice-group.css`.

### IC-03 - Storybook composition and immutable examples

- **Purpose**: Expose the required story ids from generated exemplars, including a required-invalid
  state, an RTL variant, and a forced-colors variant with a customized `accent-color`.
- **Relevant requirements**: FR-012, FR-013; C-002, C-004, C-005.
- **Affected surfaces**: component story file and `expected-stories.json`.
- **Sequencing/depends-on**: IC-01 (generate the exemplar barrel first); build Storybook and
  reconcile actual ids; then add browser/visual assertions.
- **Risks**: Story-only JavaScript that simulates selection, validation messaging, or submission
  would smuggle application behavior into the library (NI-002). Story interaction is limited to
  focusing or exercising native form behavior inside tests.

### IC-04 - Browser, accessibility, and containment proof

- **Purpose**: Verify semantic roles/names/order; exactly-one selection; arrow-key, Space, and label
  activation; native required/invalid validation; submission/reset; disabled exclusion; state style
  deltas; axe; accessibility tree; narrow/long/RTL/200% containment; forced colors including
  accent-color truthfulness; and 44px target size.
- **Relevant requirements**: FR-006, FR-015, FR-016, FR-017; NFR-002, NFR-003, NFR-004, NFR-005,
  NFR-009, NFR-011.
- **Affected surfaces**: new Playwright spec (`sk-radio-choice-group.spec.ts`) and zoom/RTL evidence
  record.
- **Sequencing/depends-on**: IC-01, IC-02 (needs real markup and final CSS to assert against);
  source-contract tests first, live tests after the first Storybook build, final accessibility and
  manual zoom/RTL evidence after final CSS.
- **Risks**: CSS zoom is not equivalent to browser zoom. Use the repository's established real
  browser-zoom evidence method (the pattern in
  `docs/architecture/validation/issue-277-checkbox-choice-group-zoom/`) and record viewport/zoom,
  scroll metrics, reviewed SHA, screenshot hashes, focus result, and 44px target measurement.
  Accent-color truthfulness needs a paired assertion (rendered appearance vs. accessibility-tree
  checked state) under `forced-colors: active` — a screenshot alone cannot prove it (NI-009).

### IC-05 - Visual regression and visual inspection

- **Purpose**: Add final-state visual cases for dark, light, narrow, RTL, long, required-invalid,
  disabled, focus, forced-colors (including customized accent-color), and 200%-zoom evidence.
- **Relevant requirements**: FR-018; NFR-006; C-010.
- **Affected surfaces**: `visual.spec.ts`, generated snapshot files, validation evidence.
- **Sequencing/depends-on**: IC-02 (author visual tests only after functional CSS is stable); obtain
  CI-authoritative baselines/diffs; inspect every required story at the final head.
- **Risks**: The C5 mockup contains raw values, GitLab vocabulary, and no real `fieldset`/`legend`.
  Match hierarchy/rhythm/state separation while using current tokens and the issue's stronger,
  generalized native structure (C-010).

### IC-06 - Documentation, gates, and clean-tree closeout

- **Purpose**: Document markup/token/application-ownership rules, the optional secondary value, the
  44px floor, and RTL support; run all affected and repository gates; verify generated no-op
  surfaces and a clean tree.
- **Relevant requirements**: FR-019, FR-020; NFR-007, NFR-008; C-007 through C-011.
- **Affected surfaces**: `using-components.md` (new section adjacent to #277's), optional measured
  budget update, validation record.
- **Sequencing/depends-on**: all prior ICs (documentation follows the final public selectors; full
  gates follow regeneration and final build; acceptance follows independent WP approval).
- **Risks**: A local generator pass followed immediately by `--check` is self-confirming. Commit
  generated files, rerun `--check`, and require `git status --porcelain` empty.

## Gate Enumeration

The single WP must run and record, as applicable:

1. Focused source-contract Playwright tests (red then green).
2. Component browser spec in every configured project; Chromium-specific a11y tree, forced colors,
   and RTL where engine support is required.
3. `node scripts/build-styles-only-markup.mjs` and `--check`.
4. Styles package build (`npx nx run styles:build`) and package export resolution.
5. `npm run quality:all` and targeted stylelint (requires
   `packages/tokens/dist/token-catalogue.json` current — run `npx nx run tokens:catalogue` first if
   `tokens.css` changed, which is not expected).
6. `npm run test` plus `node scripts/suite-selftest.mjs` (expected no new behavior-mutation arm,
   since ADR-11's registry is inapplicable to this styles-only family).
7. `npx nx run storybook:storybook:build --skip-nx-cache` and `node scripts/run-axe-storybook.js`.
8. Visual-regression suite (`npx playwright test apps/storybook/src/tests/visual.spec.ts`) with
   CI-authoritative baselines/diffs — never a local `--update-snapshots` per the programme's own
   learning; harvest from the CI run's `visual-regression-diffs` artifact.
9. Expected-story ratchet (`expected-stories.json`), story load, console-error, `.sk-light`, and
   token checks.
10. Negative scans for element/manifest/wrapper/behavior/mutation/application/GitLab-vocabulary
    additions (NI-001 through NI-011).
11. Real 200% browser-zoom evidence including document scroll metrics, focused-control bounds, and
    44px target measurement; real RTL evidence including mirrored layout and no overflow.
12. Final regeneration/no-op checks, affected builds, `git diff --exit-code` over generated paths,
    and clean tree (`git add -A && git status --porcelain` empty before opening the PR).

Both Playwright and any build/test command run under the shared-port lock
(`flock /home/jeroennouws/dev/spec-kitty-design-missions/_program-335/.playwright.lock -c '<cmd>'`)
and after checking `pgrep -af "playwright|storybook"` for a foreign run, per the programme BRIEF.
Long-running gates pass `timeout: 600000` and are blocked on to completion before ending a turn.

Token catalogue generation/check is a no-op gate unless the token file changes; element CSS,
markup, manifest, wrapper, Vue declaration, and size generators must show no diff. No release or
publication command is run.

## Delivery Contract

- Planning and implementation are based on `train/elements-first`; under this mission's
  `single_branch` topology, both planning and implementation commits land directly on
  `mission/connector-radio-choice-group` — no separate mission branch is cut, and no rebase onto a
  freshly minted branch is needed before the PR.
- `spec-kitty tasks` must produce **exactly one** Work Package (issue requirement: "one bounded Work
  Package and one PR"), covering every FR/NFR/C above — following #277's own WP01 shape exactly
  (one WP, no dependencies, one owned-files set).
- The implement-review loop uses a separate reviewer seat; the reviewer must compare the WP against
  the issue, spec, plan, tests, generated surfaces, and visual evidence, and must not self-approve.
- After WP approval, run `spec-kitty accept`, then open one PR into `train/elements-first` containing
  `Closes #336` and `Refs #335` (never `Closes #335`, per the programme BRIEF), post independent
  Tier-C pre-merge evidence tied to the final head, and merge only when all required gates pass. A
  PR whose base is not `main` or `train/**` runs zero quality gates — confirm the base and that ~13+
  checks actually ran.
- Merges to this train auto-deploy nothing to production on their own (train, not `main`) — no
  production-deploy disclosure is owed for this PR, unlike a `main`-targeting merge.
- Run post-merge mission review and retrospective before the train advances further.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| None | N/A | The existing styles-only generation and browser-test patterns (proven by #277's merged
implementation) are sufficient; no new mechanism is required. |
