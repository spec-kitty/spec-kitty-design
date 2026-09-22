---
work_package_id: WP01
title: Native checkbox-choice-group styles and conformance evidence
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
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- NFR-006
- NFR-007
- NFR-008
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
planning_base_branch: train/elements-first
merge_target_branch: train/elements-first
branch_strategy: Planning artifacts for this mission were generated on train/elements-first. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into train/elements-first unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-mission-kanban-checkbox-choice-group-01M21K7F
base_commit: 658ba89cd3c103a1fb18f38fbd5a6d56badcc943
created_at: '2026-09-08T23:20:24.563653+00:00'
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
authoritative_surface: packages/styles/src/checkbox-choice-group/
create_intent:
- packages/styles/src/checkbox-choice-group/sk-checkbox-choice-group.css
- packages/styles/src/checkbox-choice-group/sk-checkbox-choice-group-default.html
- packages/styles/src/checkbox-choice-group/sk-checkbox-choice-group-none.html
- packages/styles/src/checkbox-choice-group/sk-checkbox-choice-group-zero-counts.html
- packages/styles/src/checkbox-choice-group/sk-checkbox-choice-group-disabled.html
- packages/styles/src/checkbox-choice-group/sk-checkbox-choice-group-long.html
- packages/styles/src/checkbox-choice-group/index.ts
- packages/styles/src/checkbox-choice-group/sk-checkbox-choice-group-html.stories.ts
- apps/storybook/src/tests/sk-checkbox-choice-group.spec.ts
- docs/architecture/validation/issue-277-checkbox-choice-group-zoom/README.md
execution_mode: code_change
model: ''
owned_files:
- packages/styles/src/checkbox-choice-group/**
- packages/styles/package.json
- packages/styles/src/index.ts
- apps/storybook/src/tests/sk-checkbox-choice-group.spec.ts
- apps/storybook/src/tests/visual.spec.ts
- apps/storybook/src/tests/visual.spec.ts-snapshots/sk-checkbox-choice-group-*.png
- docs/design-system/using-components.md
- docs/architecture/validation/issue-277-checkbox-choice-group-zoom/**
- expected-stories.json
- suite-budget.json
role: implementer
tags: []
tracker_refs: []
---

# Work Package Prompt: WP01 - Native checkbox-choice-group styles and conformance evidence

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and
behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `codex`

This seat is Codex. Do not invoke Claude or another external coding agent.

---

## Objective

Deliver issue #277 as one styles-only native checkbox-choice-group family, one Work Package, and
one PR into `train/elements-first`. Preserve fieldset/legend/label/input semantics and browser-owned
form behavior while adding token-only presentation, required Storybook states, browser and
accessibility evidence, visual baselines, generated exports, ratchets, and consumer documentation.

## Context

Read `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, and
`contracts/checkbox-choice-group.contract.md` before editing. Also read current
`packages/styles/src/form-select`, `segmented-choice`, and `disclosure` plus their Storybook and
Playwright tests. The approved K3 artifact is visual evidence only; it lacks the binding
fieldset/legend semantics and uses raw values that must not be copied.

The public selector set is exact:

- `.sk-checkbox-choice-group`
- `.sk-checkbox-choice-group__legend`
- `.sk-checkbox-choice-group__options`
- `.sk-checkbox-choice-group__choice`
- `.sk-checkbox-choice-group__control`
- `.sk-checkbox-choice-group__label`
- `.sk-checkbox-choice-group__metadata`

No state classes, custom element, JavaScript, custom checkbox glyph, data API, lane vocabulary,
filtering, persistence, query state, validation, disclosure behavior, or Apply/Clear behavior may
be added. The native checkbox remains visible. Generated files are produced only by repository
tools. Stay within `owned_files`.

Start the lane with:

```sh
spec-kitty agent action implement WP01 --agent codex
```

## Subtask T001: Write red-first source and public-contract assertions

**Purpose**: Make architecture and absence requirements executable before component files exist.

**Steps**:

1. Create `apps/storybook/src/tests/sk-checkbox-choice-group.spec.ts` following the source/live
   split used by `sk-segmented-choice.spec.ts`.
2. In a Chromium-only source block, assert the component directory/CSS/generated barrel, styles
   package subpath, root export, docs section, and expected-story entry must exist.
3. Parse authored selectors and require the exact seven-class inventory above. Qualifying native
   pseudo-classes/relational selectors are allowed; additional public classes are not.
4. Assert no matching element directory, custom-element tag, manifest declaration, wrapper,
   expected-parts/docs row, behavior subject, mutation subject, or component JavaScript exists.
5. Reject `appearance: none`, invisible/off-screen checkbox techniques, state modifier classes,
   `forced-color-adjust: none`, theme selectors, Team Kitty lane words in CSS/public exports, and
   raw authored design values.
6. Run only this source block and record the expected red because the new component is absent.

**Files**: `apps/storybook/src/tests/sk-checkbox-choice-group.spec.ts`.

**Validation**: Failure names the missing styles directory/public surface, not an unrelated setup
error. Do not make it green by weakening an assertion.

## Subtask T002: Author native fixtures and generate distribution surfaces

**Purpose**: Establish one semantic source per maintained state and the generated public barrel.

**Steps**:

1. Add the directory and five planned HTML fixtures: default/several-selected, none-selected,
   zero-counts, disabled, and long-content.
2. Every fixture uses one native `fieldset`, one native `legend`, an options container, and nested
   labels containing visible native checkbox inputs, label spans, and optional metadata spans.
3. The K3/default data has ten choices in order: Genesis, Planned, Claimed, In progress, For
   review, In review, Approved, Done, Blocked, Canceled. The K3 story checks In review and Blocked.
4. Keep counts/labels as fixture text only. Zero does not imply disabled. Include one checked and
   disabled choice in the disabled fixture.
5. Run `node scripts/build-styles-only-markup.mjs`; do not edit generated `index.ts`.
6. Add the explicit `./checkbox-choice-group/*` styles package export and the directory export in
   `packages/styles/src/index.ts`.
7. Run the generator `--check`, styles build, and the source-contract block until the distribution
   assertions are green while CSS/state assertions remain red as intended.

**Files**: `packages/styles/src/checkbox-choice-group/*.html`, generated `index.ts`,
`packages/styles/package.json`, `packages/styles/src/index.ts`.

**Validation**:

```sh
node scripts/build-styles-only-markup.mjs
node scripts/build-styles-only-markup.mjs --check
npx nx run styles:build
```

## Subtask T003: Implement token-only responsive and state CSS

**Purpose**: Add the reusable presentation without hiding or reimplementing the native control.

**Steps**:

1. First add only fieldset reset, legend treatment, intrinsic options grid, three-column choice
   layout, local wrapping, and min/max containment using authoritative tokens.
2. Add live computed-style tests for checked versus unchecked, hover, active, focus-visible, and
   disabled; observe them red against the structural-only pass.
3. Add state declarations until those tests pass. Each state must have a non-color cue such as
   border style/width or weight; focus uses an outline and may not be clipped.
4. Keep the native input visible and use a token for `accent-color` if set. Never paint a fake box
   or glyph.
5. Implement the options grid with intrinsic sizing and `min(100%, ...)`/token-based calculations
   so narrow containers reach one column without a copied raw 520px breakpoint.
6. Add forced-colors overrides only where measurement shows they are needed; use permitted system
   colors on longhand `-color` properties and preserve native control rendering.
7. Run targeted stylelint and browser state tests after each red/green step.

**Files**: `packages/styles/src/checkbox-choice-group/sk-checkbox-choice-group.css` and the
dedicated browser spec.

**Validation**: Exact selector inventory; no raw color/spacing/size/type/motion/shadow value; no
native-control hiding; checked/hover/active/focus/disabled deltas green.

## Subtask T004: Add the 12-story Storybook catalogue

**Purpose**: Make every contract state independently addressable and axe/visual-testable.

**Steps**:

1. Add the HTML story file with title `Form/SkCheckboxChoiceGroup (HTML)`, autodocs, and a11y
   enabled.
2. Export `Default`, `K3DetailedLaneFilters`, `NoneSelected`, `SeveralSelected`, `ZeroCounts`,
   `DisabledChoices`, `LongContent`, `Narrow`, `FocusStates`, `ForcedColors`, `DefaultDark`, and
   `LightMode`.
3. Render from generated fixture exports. Reuse fixtures for different frames instead of copying
   native markup into TypeScript.
4. `LightMode` uses a `.sk-light` wrapper. `FocusStates` may focus a control for evidence but must
   not add application behavior.
5. K3 composes the existing disclosure and action/button CSS around the fieldset. Apply/Clear have
   truthful non-submitting/static behavior only; no filter handler is attached.
6. Build Storybook, inspect `index.json`, and reconcile the exact ids with the plan/ratchet.

**Files**: component story file.

**Validation**:

```sh
npx nx run storybook:storybook:build
node scripts/check-story-theme-wrapper.mjs
```

## Subtask T005: Complete native behavior, AX-tree, axe, and theme browser proof

**Purpose**: Prove the real platform contract in a real browser rather than infer it from markup.

**Steps**:

1. Load all 12 story ids with a non-empty root and no console/page errors.
2. Assert every maintained fixture has the fieldset/legend/options/label/native-checkbox tree and
   correct source order.
3. Capture Chromium accessibility snapshots and require one named group plus exact checkbox names,
   checked/disabled states, and order for the K3 fixture.
4. Tab through enabled controls; prove disabled controls are skipped; press Space; activate a
   nested label; ensure each toggles exactly one native checkbox.
5. Exercise native FormData and reset/defaultChecked restoration in a fixture form; prove disabled
   values are excluded and unrelated K3 Apply/Clear composition does not mutate state.
6. Run axe against every story with zero WCAG 2.1 AA violations.
7. Compare at least one token-dependent dark/light computed value and require a real difference.
8. Emulate forced colors in Chromium and verify native glyph, checked, disabled, and focus cues.

**Files**: dedicated browser spec.

**Validation**:

```sh
npx playwright test apps/storybook/src/tests/sk-checkbox-choice-group.spec.ts
node scripts/run-axe-storybook.js
```

## Subtask T006: Prove narrow, long-content, zoom, focus containment, and visuals

**Purpose**: Close the issue's responsive and visual evidence requirements at the final CSS state.

**Steps**:

1. Add geometry assertions for every story: document scroll width never exceeds client width;
   labels/metadata remain within choices; focused outlines remain within local clipping bounds.
2. In `Narrow`, require one options-grid column and stable DOM/tab order.
3. Add final visual cases for dark, light, K3, narrow, long content, disabled, focus, and forced
   colors. Keep visual test names prefixed so their snapshot files match WP ownership.
4. Run visual regression with `PW_INCLUDE_VISUAL=1`; use CI's Linux Chromium
   `visual-regression-diffs` artifact as authoritative baseline evidence and inspect every image.
5. Follow the existing issue-270 real-Chrome/X11 procedure for genuine 200% browser zoom. Record
   final SHA, viewport, zoom, document scroll metrics, each focused input's bounds, screenshot
   names, and SHA-256 hashes under the owned validation directory.
6. Compare K3 hierarchy/rhythm to the approved evidence without copying its raw values or missing
   semantics.

**Files**: visual spec/snapshots, dedicated browser spec, zoom validation directory.

**Validation**:

```sh
PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium
```

## Subtask T007: Document usage and update ratchets

**Purpose**: Publish an exact consumer contract and make story/public-surface drift fail closed.

**Steps**:

1. Add a checkbox choice group section to `using-components.md` with native markup, the exact
   seven selectors, token dependencies, optional metadata, responsive behavior, and consumer-owned
   state/action/filter/persistence responsibilities.
2. Add the 12 actual Storybook ids to `expected-stories.json` and increase the pre-mission total
   347 by exactly 12 to 359.
3. Assert all expected no-op surfaces remain unchanged: tokens/catalogue, element CSS/markup,
   manifest, React/Vue wrappers, parts/docs ratchets, behavior registry, mutations, size report,
   demo pages, and unrelated pattern files.
4. Change `suite-budget.json` only if the measured relevant test suite exceeds its current valid
   ceiling; record the measurement/rationale if changed.
5. Rerun generator, story-ratchet, docs, and package-export checks.

**Files**: consumer docs, expected stories, optional measured suite budget.

**Validation**: Docs match shipped markup byte-for-concept; 12/12 story ids exist; expected total
is 359; negative scans are clean.

## Subtask T008: Run full gates and prepare independent review handoff

**Purpose**: Produce a clean, reproducible implementation head ready for a separate Codex reviewer.

**Steps**:

1. Regenerate the styles-only barrel and build affected packages. Run all generated-surface checks
   and confirm unrelated generated files have no diff.
2. Run quality, type, package, suite, Storybook, axe, browser, and visual gates below. Wait for each
   long-running command; do not duplicate or kill it because it is quiet.
3. Run `git diff --check`, inspect the complete baseline diff, and scan negative invariants.
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
npx nx run storybook:storybook:build
node scripts/run-axe-storybook.js
npx playwright test apps/storybook/src/tests/sk-checkbox-choice-group.spec.ts
PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium
git diff --check
git status --short
```

## Definition of Done

- [ ] Exact seven-selector styles-only family ships from the styles package.
- [ ] Native fieldset/legend/label/checkbox structure and browser behavior are proven.
- [ ] Native checkbox remains visible; no custom element, wrapper, JS, or application logic exists.
- [ ] All 12 stories render; `LightMode` is real; every story is axe-clean.
- [ ] Accessibility-tree, forced-colors, narrow, long-content, 200%-zoom, focus, and page
  containment evidence is complete and tied to the final head.
- [ ] CI-authoritative visual baselines are reviewed for every required state.
- [ ] Docs, exports, generated barrel, and expected-story ratchet are current and deterministic.
- [ ] Full affected/repository gates pass and unrelated generated/public surfaces are unchanged.
- [ ] `git status --short` is clean before review handoff.
- [ ] A separate Codex reviewer records approve/reject through the Spec Kitty event-log seam.

## Risks

- The mockup's missing fieldset/legend can tempt literal markup copying; issue semantics win.
- `:has()` presentation must not hide the native input or create a second state source.
- Zero metadata is not disabled state; fixtures/tests keep those independent.
- Forced-colors backgrounds and shadows can disappear; rely on native glyphs, borders, outlines,
  and measured system-color longhands.
- Viewport resize is not 200% zoom; record genuine browser-zoom evidence.
- A generator pass immediately followed by `--check` is self-confirming; require committed output
  and a clean-tree rerun.

## Reviewer Guidance

Review against issue #277, epic #276 boundaries, spec/plan/contract, and the final baseline diff.
Prioritize semantic authenticity, exact selector/public exports, absence of element/application
logic, native form behavior, long/narrow/zoom containment, forced-colors focus/disabled/checked
cues, axe/AX fidelity, and visual evidence provenance. Re-run focused tests and at least one full
gate. Reject with concrete files/commands through Spec Kitty if any binding requirement or evidence
is missing; do not approve based only on green screenshots.
