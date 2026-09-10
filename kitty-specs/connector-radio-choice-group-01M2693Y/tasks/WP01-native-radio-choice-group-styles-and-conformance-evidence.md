---
work_package_id: WP01
title: Native radio-choice-group styles and conformance evidence
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
- FR-007
- FR-008
- FR-009
- FR-010
- FR-011
- FR-012
- FR-013
- FR-014
- FR-015
- FR-016
- FR-017
- FR-018
- FR-019
- FR-020
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- NFR-006
- NFR-007
- NFR-008
- NFR-009
- NFR-010
- NFR-011
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
- C-007
- C-008
- C-009
- C-010
- C-011
planning_base_branch: mission/connector-radio-choice-group
merge_target_branch: mission/connector-radio-choice-group
branch_strategy: Planning artifacts for this mission were generated on mission/connector-radio-choice-group. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/connector-radio-choice-group unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
- T008
history: []
agent_profile: frontend-freddy
authoritative_surface: packages/styles/src/radio-choice-group/
create_intent:
- packages/styles/src/radio-choice-group/sk-radio-choice-group.css
- packages/styles/src/radio-choice-group/sk-radio-choice-group-default.html
- packages/styles/src/radio-choice-group/sk-radio-choice-group-two.html
- packages/styles/src/radio-choice-group/sk-radio-choice-group-none.html
- packages/styles/src/radio-choice-group/sk-radio-choice-group-required-invalid.html
- packages/styles/src/radio-choice-group/sk-radio-choice-group-disabled.html
- packages/styles/src/radio-choice-group/sk-radio-choice-group-disabled-group.html
- packages/styles/src/radio-choice-group/sk-radio-choice-group-long.html
- packages/styles/src/radio-choice-group/index.ts
- packages/styles/src/radio-choice-group/sk-radio-choice-group-html.stories.ts
- apps/storybook/src/tests/sk-radio-choice-group.spec.ts
- docs/architecture/validation/issue-336-radio-choice-group-zoom/README.md
execution_mode: code_change
model: ''
owned_files:
- packages/styles/src/radio-choice-group/**
- packages/styles/package.json
- packages/styles/src/index.ts
- apps/storybook/src/tests/sk-radio-choice-group.spec.ts
- apps/storybook/src/tests/visual.spec.ts
- apps/storybook/src/tests/visual.spec.ts-snapshots/sk-radio-choice-group-*.png
- docs/design-system/using-components.md
- docs/architecture/validation/issue-336-radio-choice-group-zoom/**
- expected-stories.json
- suite-budget.json
role: implementer
tags: []
tracker_refs: []
---

# Work Package Prompt: WP01 - Native radio-choice-group styles and conformance evidence

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and
behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `codex`

This seat is Codex. Do not invoke Claude or another external coding agent.

---

## Objective

Deliver issue #336 as one styles-only native radio-choice-group family, one Work Package, and one
PR into `train/elements-first`. Preserve `fieldset`/`legend`/`label`/`input type="radio"` semantics
and browser-owned exactly-one-selection, constraint-validation, and form behavior while adding
token-only presentation (including an honest required/invalid state and 44px interactive-target
floor), required Storybook states (including RTL and a customized-`accent-color` forced-colors
case), browser and accessibility evidence, visual baselines, generated exports, ratchets, and
consumer documentation.

## Context

Read `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, and
`contracts/radio-choice-group.contract.md` before editing. Also read the real, already-merged
`packages/styles/src/checkbox-choice-group/sk-checkbox-choice-group.css` and
`sk-checkbox-choice-group-html.stories.ts` (#277) — this is the closest sibling and the template for
CSS shape, forced-colors technique, and story structure — plus
`apps/storybook/src/tests/sk-checkbox-choice-group.spec.ts` for the assertion shapes to mirror. The
approved Family 3 C5 GitLab group-selection artifact
(`ux_redesign/families/03-connectors/screens/C5-gitlab-group-selection-dark.html`) is visual/anatomy
evidence only: it lacks a real `fieldset`/non-`sr-only` `legend`, uses GitLab vocabulary
(`group_id`, `full_path`), and its raw values must not be copied — only the reviewed anatomy shape
(fieldset > options > label > radio + primary name + secondary path) generalizes.

The public selector set is exact (final secondary-value class name confirmed against #277's
`__metadata` naming before commit — do not call it `__metadata` here, since a radio's secondary
value is a machine value, not a count):

- `.sk-radio-choice-group`
- `.sk-radio-choice-group__legend`
- `.sk-radio-choice-group__options`
- `.sk-radio-choice-group__choice`
- `.sk-radio-choice-group__control`
- `.sk-radio-choice-group__label`
- `.sk-radio-choice-group__secondary-value`

No state classes, custom element, JavaScript, custom radio glyph, data API, provider vocabulary,
filtering, persistence, query state, auto-submit, route/mutation ownership, or validation-message
copy may be added. The native radio remains visible; the only sanctioned native-appearance
customization is `accent-color`. Generated files are produced only by repository tools. Stay within
`owned_files`.

Start the lane with:

```sh
spec-kitty agent action implement WP01 --agent codex
```

## Subtask T001: Write red-first source and public-contract assertions

**Purpose**: Make architecture and absence requirements executable before component files exist.

**Steps**:

1. Create `apps/storybook/src/tests/sk-radio-choice-group.spec.ts` following the source/live split
   used by `sk-checkbox-choice-group.spec.ts`.
2. In a Chromium-only source block, assert the component directory/CSS/generated barrel, styles
   package subpath, root export, docs section, and expected-story entries must exist.
3. Parse authored selectors and require the exact seven-class inventory above. Qualifying native
   pseudo-classes/relational selectors (`:checked`, `:disabled`, `:invalid`, `:required`, `:hover`,
   `:active`, `:focus-visible`, `:has()`) are allowed; additional public classes are not.
4. Assert no matching element directory, custom-element tag, manifest declaration, wrapper,
   expected-parts/docs row, behavior subject, mutation subject, or component JavaScript exists.
5. Reject `appearance: none`, invisible/off-screen radio techniques, state modifier classes,
   `forced-color-adjust: none`, theme selectors, GitLab/provider words in CSS/public exports, and
   raw authored design values.
6. Run only this source block and record the expected red because the new component is absent.

**Files**: `apps/storybook/src/tests/sk-radio-choice-group.spec.ts`.

**Validation**: Failure names the missing styles directory/public surface, not an unrelated setup
error. Do not make it green by weakening an assertion.

## Subtask T002: Author native fixtures and generate distribution surfaces

**Purpose**: Establish one semantic source per maintained state and the generated public barrel.

**Steps**:

1. Add the directory and at least these HTML fixtures, every one a real `fieldset` +
   non-`sr-only` `legend` + options wrapper + labelled radios sharing one `name`:
   - `sk-radio-choice-group-default.html` — several choices, one selected.
   - `sk-radio-choice-group-two.html` — the minimal two-choice Family 3 shape (generalized from C5:
     primary name plus secondary machine value, no GitLab vocabulary).
   - `sk-radio-choice-group-none.html` — several choices, nothing checked, not required.
   - `sk-radio-choice-group-required-invalid.html` — `required` on every radio, nothing checked.
   - `sk-radio-choice-group-disabled.html` — one disabled choice among enabled ones, including one
     disabled-and-checked choice.
   - `sk-radio-choice-group-disabled-group.html` — every choice disabled.
   - `sk-radio-choice-group-long.html` — a long legend, a long primary label, and a long/opaque
     secondary machine value.
2. Every choice's secondary machine value is OPTIONAL — at least one fixture (e.g. `-none`) omits
   it on some choices to prove the omission is ordinary.
3. Keep labels/secondary values as fixture text only — no GitLab/provider vocabulary anywhere in
   authored markup, only generic placeholder text (e.g. "Acme" -> a neutral primary label, "acme" ->
   a neutral opaque secondary value).
4. Run `node scripts/build-styles-only-markup.mjs`; do not hand-edit generated `index.ts`.
5. Add the explicit `./radio-choice-group/*` styles package export (alongside the existing
   `./checkbox-choice-group/*` line in `packages/styles/package.json`) and the directory export in
   `packages/styles/src/index.ts` (alongside the existing `checkbox-choice-group` line).
6. Run the generator `--check`, styles build, and the source-contract block until the distribution
   assertions are green while CSS/state assertions remain red as intended.

**Files**: `packages/styles/src/radio-choice-group/*.html`, generated `index.ts`,
`packages/styles/package.json`, `packages/styles/src/index.ts`.

**Validation**:

```sh
node scripts/build-styles-only-markup.mjs
node scripts/build-styles-only-markup.mjs --check
npx nx run styles:build
```

## Subtask T003: Implement token-only responsive and state CSS

**Purpose**: Add the reusable presentation without hiding or reimplementing the native control, and
without inventing a JS-maintained selection or validity mirror.

**Steps**:

1. First add only fieldset reset, legend treatment, intrinsic options grid/stack, choice layout,
   local wrapping, and min/max containment using authoritative tokens — mirror
   `sk-checkbox-choice-group.css`'s structural pass, adapted to radio.
2. Add live computed-style tests for selected versus unselected, hover, active, focus-visible,
   required-invalid, and disabled; observe them red against the structural-only pass.
3. Add state declarations until those tests pass. Each state must have a non-color cue such as
   border style/width or weight; required-invalid needs its own distinct cue from disabled and from
   unselected; focus uses an outline and may not be clipped.
4. Keep the native input visible and use a token for `accent-color` if set. Never paint a fake box
   or glyph (NI-004).
5. Ensure every choice's pointer/touch target (the full `label`) computes at least 44px in the
   narrow-floor dimension — reuse `--sk-space-9` (48px), the token `sk-confirm-dialog.css` already
   documents as the nearest-above-44px floor token, unless measurement shows a different existing
   token is the better fit. Do not add a new token without first proving every existing one
   unsuitable (C-008).
6. Author RTL support using logical properties (`inline-size`, `margin-inline-*`,
   `padding-inline-*`, `text-align: start/end`) rather than physical `left`/`right`, matching the
   pattern already used in `sk-checkbox-choice-group.css`. Add a live RTL browser assertion (choice
   layout/text alignment mirrors, no overflow).
7. Add forced-colors overrides only where measurement shows they are needed; use permitted system
   colors on longhand `-color` properties, preserve native control rendering, and add the paired
   assertion that a customized `accent-color` still reports the correct accessible checked/unchecked
   state under `forced-colors: active` (NFR-005, NI-009) — do not rely on a screenshot alone.
8. Add a reduced-motion assertion proving `prefers-reduced-motion: reduce` changes nothing
   observable, since this primitive introduces no transition of its own (NFR-010).
9. Run targeted stylelint and browser state tests after each red/green step.

**Files**: `packages/styles/src/radio-choice-group/sk-radio-choice-group.css` and the dedicated
browser spec.

**Validation**: Exact selector inventory; no raw color/spacing/size/type/motion/shadow value; no
native-control hiding; selected/hover/active/focus/required-invalid/disabled deltas green; 44px
target measured; RTL mirrored with no overflow; accent-color/forced-colors truthfulness proven.

## Subtask T004: Add the required-state Storybook catalogue

**Purpose**: Make every contract state — including required-invalid and RTL, both new relative to
#277 — independently addressable and axe/visual-testable.

**Steps**:

1. Add the HTML story file with title `Form/SkRadioChoiceGroup (HTML)`, autodocs, and a11y enabled.
2. Export at minimum: `Default`, `TwoChoice`, `OneOption` or `ManyOptions` (whichever the generated
   fixtures actually support), `NoneSelected`, `RequiredInvalid`, `DisabledOption`, `DisabledGroup`,
   `LongContent`, `Narrow`, `RTL`, `FocusStates`, `ForcedColors`, `DefaultDark`, and `LightMode` —
   reconcile the exact final id set against `plan.md`'s Story Catalogue table and what Storybook
   actually generates; do not invent ids the plan does not describe without updating the plan's
   table to match.
3. Render from generated fixture exports. Reuse fixtures for different frames instead of copying
   native markup into TypeScript.
4. `LightMode` uses a `.sk-light` wrapper. `FocusStates` may focus a control for evidence but must
   not add application behavior. `RTL` wraps its frame with `dir="rtl"`. `ForcedColors` includes at
   least one choice with a customized `accent-color`.
5. Build Storybook, inspect `storybook-static/index.json`, and reconcile the exact ids with the plan
   and `expected-stories.json`.

**Files**: component story file.

**Validation**:

```sh
npx nx run storybook:storybook:build --skip-nx-cache
node scripts/check-story-theme-wrapper.mjs
```

## Subtask T005: Complete native behavior, AX-tree, axe, and theme browser proof

**Purpose**: Prove the real platform contract in a real browser rather than infer it from markup.

**Steps**:

1. Load every story id with a non-empty root and no console/page errors.
2. Assert every maintained fixture has the fieldset/legend/options/label/native-radio tree, one
   shared `name` per group, and correct source order.
3. Capture Chromium accessibility snapshots and require one named group plus exact radio names,
   checked/disabled/required states, and order for a multi-choice fixture.
4. Tab into and out of the group per native radio tab-stop rules; use arrow keys to move and select
   within the group; press Space; activate a nested label; prove exactly one radio in the group is
   ever checked and disabled controls are excluded/skipped.
5. Exercise native FormData (exactly one value submitted) and reset/defaultChecked restoration in a
   fixture form; prove a required group with nothing checked blocks submission via native constraint
   validation and reports the browser's own validation message.
6. Run axe against every story with zero WCAG 2.1 AA violations.
7. Compare at least one token-dependent dark/light computed value and require a real difference.
8. Emulate forced colors in Chromium and verify native glyph, selected, disabled, required-invalid,
   and focus cues remain perceivable, including the customized-`accent-color` choice's accessible
   state matching its rendered appearance.

**Files**: dedicated browser spec.

**Validation**:

```sh
npx playwright test apps/storybook/src/tests/sk-radio-choice-group.spec.ts
node scripts/run-axe-storybook.js
```

## Subtask T006: Prove narrow, long-content, RTL, zoom, focus containment, and visuals

**Purpose**: Close the issue's responsive, RTL, and visual evidence requirements at the final CSS
state.

**Steps**:

1. Add geometry assertions for every story: document scroll width never exceeds client width;
   labels/secondary values remain within choices; focused outlines remain within local clipping
   bounds; every choice's interactive target measures at least 44px.
2. In `Narrow`, require the layout to stack/reflow to one column and stable DOM/tab order.
3. In `RTL`, require mirrored layout, correct text alignment, and no horizontal overflow.
4. Add final visual cases for dark, light, two-choice, none-selected, required-invalid, disabled,
   disabled-group, long content, narrow, RTL, focus, and forced-colors (including the
   customized-`accent-color` choice). Keep visual test names prefixed so their snapshot files match
   WP ownership.
5. Run visual regression with `PW_INCLUDE_VISUAL=1`; use CI's Linux Chromium
   `visual-regression-diffs` artifact as authoritative baseline evidence and inspect every image —
   never a local `--update-snapshots` per this programme's own established practice.
6. Follow the existing issue-277/issue-270 real-Chrome/X11 procedure for genuine 200% browser zoom
   and add an equivalent real RTL rendering check. Record final SHA, viewport, zoom, document scroll
   metrics, each focused input's bounds and measured size, screenshot names, and SHA-256 hashes
   under `docs/architecture/validation/issue-336-radio-choice-group-zoom/`.
7. Compare hierarchy/rhythm to the approved C5 evidence without copying its raw values, GitLab
   vocabulary, or missing `fieldset`/`legend` semantics.

**Files**: visual spec/snapshots, dedicated browser spec, zoom/RTL validation directory.

**Validation**:

```sh
PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium
```

## Subtask T007: Document usage and update ratchets

**Purpose**: Publish an exact consumer contract and make story/public-surface drift fail closed.

**Steps**:

1. Add a "Radio choice group" section to `using-components.md`, adjacent to the existing "Checkbox
   choice group" section, with native markup, the exact seven selectors, token dependencies, the
   optional secondary machine value, the 44px target floor, RTL support, required/invalid behavior,
   and consumer-owned responsibilities (provider data, routing, validation-message copy,
   selection effects, request handling, copy/i18n per #286).
2. Add the actual Storybook ids to `expected-stories.json` and increase the pre-mission total (505
   as of this WP's base commit) by exactly the real delta measured in T004 — do not guess the count.
3. Assert all expected no-op surfaces remain unchanged: tokens/catalogue, element CSS/markup,
   manifest, React/Vue wrappers, parts/docs ratchets, behavior registry, mutations, size report,
   demo pages, and unrelated pattern files (including #277's own surfaces).
4. Change `suite-budget.json` only if the measured relevant test suite exceeds its current valid
   ceiling; record the measurement/rationale if changed.
5. Rerun generator, story-ratchet, docs, and package-export checks.

**Files**: consumer docs, expected stories, optional measured suite budget.

**Validation**: Docs match shipped markup byte-for-concept; every story id from T004 exists in
`expected-stories.json`; negative scans are clean; `.sk-checkbox-choice-group` surfaces are
byte-identical to their pre-WP state.

## Subtask T008: Run full gates and prepare independent review handoff

**Purpose**: Produce a clean, reproducible implementation head ready for a separate Codex reviewer.

**Steps**:

1. Regenerate the styles-only barrel and build affected packages. Run all generated-surface checks
   and confirm unrelated generated files have no diff.
2. Run quality, type, package, suite, Storybook, axe, browser, and visual gates below under the
   shared-port lock (`flock .../.playwright.lock -c '<cmd>'`) after checking
   `pgrep -af "playwright|storybook"` for a foreign run. Wait for each long-running command; do not
   duplicate or kill it because it is quiet — pass `timeout: 600000` where the harness supports it.
3. Run `git diff --check`, inspect the complete baseline diff, and scan negative invariants
   (NI-001 through NI-011).
4. Commit all owned authored/generated/evidence files with conventional scopes. Do not commit
   caches, reports, or unrelated working-tree changes.
5. Move WP01 to `for_review` through Spec Kitty and wait for the synchronous pre-review regression
   gate to exit. Record every command/result and the final reviewed SHA.
6. Hand off to a distinct Codex reviewer using profile `reviewer-renata`. The implementer must not
   approve its own WP.

**Validation commands**:

```sh
node scripts/build-styles-only-markup.mjs --check
npx nx run styles:build
npm run quality:all
node scripts/check-story-theme-wrapper.mjs
node scripts/check-story-theme-wrapper.mjs --selftest
node scripts/typecheck-all.mjs
npm run test
node scripts/suite-selftest.mjs
npx nx run storybook:storybook:build --skip-nx-cache
node scripts/run-axe-storybook.js
npx playwright test apps/storybook/src/tests/sk-radio-choice-group.spec.ts
PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium
git diff --check
git status --short
```

## Definition of Done

- [ ] Exact seven-selector styles-only family ships from the styles package.
- [ ] Native fieldset/legend/label/radio structure, shared `name`, and browser-owned exactly-one
  selection/constraint-validation/arrow-key/reset behavior are proven.
- [ ] Native radio remains visible (accent-color only); no custom element, wrapper, JS, or
  application logic exists.
- [ ] All required stories render, including `RequiredInvalid` and `RTL`; `LightMode` is real; every
  story is axe-clean.
- [ ] Accessibility-tree, forced-colors (including accent-color truthfulness), narrow, long-content,
  RTL, 200%-zoom, 44px-target, focus, and page-containment evidence is complete and tied to the
  final head.
- [ ] CI-authoritative visual baselines are reviewed for every required state.
- [ ] Docs, exports, generated barrel, and expected-story ratchet are current and deterministic.
- [ ] Full affected/repository gates pass and unrelated generated/public surfaces (including #277's)
  are unchanged.
- [ ] `git status --short` is clean before review handoff.
- [ ] A separate Codex reviewer records approve/reject through the Spec Kitty event-log seam.

## Risks

- The C5 mockup's `sr-only` legend and GitLab vocabulary can tempt literal markup copying; issue
  semantics (real visible-or-not legend per consumer choice, no provider words) win.
- `:has()` presentation must not hide the native input or create a second state source.
- A required group with nothing checked is a valid render state, not an error to suppress or fake
  with `aria-invalid` — the native `:invalid`/`:required` pseudo-classes are the only source of
  truth.
- Forced-colors backgrounds and shadows can disappear; rely on native glyphs, borders, outlines, and
  measured system-color longhands. `accent-color` customization specifically needs the paired
  rendered-vs-accessible-state proof, not a screenshot alone.
- Viewport resize is not 200% zoom; record genuine browser-zoom evidence, and don't conflate CSS
  logical-property RTL support with a real `dir="rtl"` rendering check.
- A generator pass immediately followed by `--check` is self-confirming; require committed output
  and a clean-tree rerun.
- `.sk-checkbox-choice-group` and `.sk-radio-choice-group` must stay non-aliased; a shared BEM shape
  is intentional, a shared selector or implied multi-select/exactly-one semantics is not.

## Reviewer Guidance

Review against issue #336, epic #335 boundaries, spec/plan/contract, and the final baseline diff.
Prioritize semantic authenticity, exact selector/public exports, absence of element/application
logic, native exactly-one-selection/arrow-key/required-invalid form behavior, long/narrow/RTL/zoom
containment, 44px target-size evidence, forced-colors focus/disabled/required-invalid/checked cues
including accent-color truthfulness, axe/AX fidelity, and visual evidence provenance. Confirm
`.sk-checkbox-choice-group` (#277) is untouched and that no selector/vocabulary overlap was
introduced. Re-run focused tests and at least one full gate. Reject with concrete files/commands
through Spec Kitty if any binding requirement or evidence is missing; do not approve based only on
green screenshots.
