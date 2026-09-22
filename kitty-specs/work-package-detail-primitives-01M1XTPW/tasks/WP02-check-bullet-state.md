---
work_package_id: WP02
title: Read-only check-bullet state
dependencies:
- WP01
requirement_refs:
- C-001
- C-003
- C-004
- C-005
- C-006
- C-007
- C-008
- FR-008
- FR-009
- FR-010
- FR-011
- FR-012
- NFR-001
- NFR-003
- NFR-004
- NFR-005
- NFR-006
- NFR-007
- NFR-008
planning_base_branch: mission/work-package-detail-primitives
merge_target_branch: mission/work-package-detail-primitives
branch_strategy: Planning artifacts for this mission were generated on mission/work-package-detail-primitives. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/work-package-detail-primitives unless the human explicitly redirects the landing branch.
subtasks:
- T007
- T008
- T009
- T010
- T011
- T012
phase: Phase 2 - Element state extension
history:
- at: '2026-09-07T11:53:49Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: packages/elements/src/check-bullet/
create_intent: []
execution_mode: code_change
model: ''
owned_files:
- packages/styles/src/check-bullet/sk-check-bullet.css
- packages/styles/src/check-bullet/sk-check-bullet.html
- packages/styles/src/check-bullet/sk-check-bullet-html.stories.ts
- packages/styles/src/check-bullet/index.ts
- packages/elements/src/check-bullet/**
- fixtures/elements-behaviour/src/sk-check-bullet.test.ts
- behaviours.json
- mutations.json
- expected-docs.json
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP02 – Read-only check-bullet state

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `codex`

If no profile is specified, run `spec-kitty agent profile list` and select the best match for this work package's `task_type` and `authoritative_surface`.

---

## Objective

Extend `sk-check-bullet` with a backward-compatible reflected complete/pending state whose distinction is available in the accessibility tree and remains non-interactive. Preserve the current omitted-state check presentation, custom icon override, listitem compatibility, canonical markup, and generated-output rules.

## Context

Read the mission spec/plan/research/data model/public contract, ADR-9/10/11, #79, #92, and the current component recipe. The existing element is a `role="listitem"` host containing a shadow wrapper and slotted text. It must not become a checkbox or own application state.

WP01 must be approved before this package begins. Work in the same isolated primary clone; do not call a Spec Kitty action that allocates a worktree. Transition with `spec-kitty agent tasks move-task WP02 --to doing --mission 01M1XTPW`, load the resolved profile/context, and keep changes inside `owned_files`.

## Branch Strategy

- **Strategy**: serial single mission branch in a primary checkout; no worktree
- **Planning base branch**: `mission/work-package-detail-primitives`
- **Merge target branch**: `mission/work-package-detail-primitives`
- **External integration target**: `train/elements-first`

WP01's committed result is this WP's base. Global manifest/wrapper/Vue/size outputs belong to WP03 so they can be regenerated once after concurrent train movement.

## Subtasks & Detailed Guidance

### Subtask T007 – Add red-first state and accessibility behavior

- **Purpose**: Make the new runtime contract falsifiable before changing the element.
- **Steps**:
  1. Extend `fixtures/elements-behaviour/src/sk-check-bullet.test.ts` before production code.
  2. Cover omitted state, explicit complete, pending, an unsupported runtime attribute/property, and a subsequent state change.
  3. Assert exact reflection only when explicitly supplied; omission must not acquire a serialized `state` attribute merely because complete is the behavior default.
  4. Assert the default glyph differs by state, custom `icon` overrides either glyph, and the icon remains `aria-hidden="true"`.
  5. Assert accessible state text is present and combined with the slotted item text; it must not be `aria-hidden`. Assert host role stays listitem and `aria-checked`, checkbox role, click/key behavior, and toggle events are absent.
  6. Add an SC-010 late-definition subclass test: assign `state = 'pending'` before `customElements.define`, upgrade, await render, and assert property, reflected attribute, pending glyph, and accessible text survive.
  7. Run the focused browser test and record named failures caused by the missing production state support.
- **Files**: check-bullet behavior fixture.
- **Validation**: tests collect and fail on state/icon/text/reflection, not setup; all legacy assertions still run.
- **Parallel?**: No; test-first contract.

### Subtask T008 – Extend canonical markup and runtime state contract

- **Purpose**: Define one state vocabulary for both generated static markup and the element.
- **Steps**:
  1. In `sk-check-bullet.markup.ts`, export `CheckBulletState = 'complete' | 'pending'`, a closed state list/map, default icons, and a runtime normalization/classes helper.
  2. Keep omission and every unsupported runtime value on the base/complete class and check glyph. A development warning is acceptable only if it follows existing fail-open conventions and tests do not depend on console silence for unsupported inputs.
  3. Add `state?: CheckBulletState` to static options. Static HTML must throw for an explicitly unsupported authored state, consistent with ADR-10 build-time strictness.
  4. Generate a pending modifier only for pending; explicit/implicit complete must retain the original base class and appearance.
  5. Add the state label to static HTML before consumer text and keep the glyph decorative.
  6. In `sk-check-bullet.ts`, add documented `state` to `static properties` with `{ type: String, reflect: true }` and declare the exact public union plus undefined.
  7. Normalize only for rendering; do not overwrite a consumer value during render, dispatch an event, or throw.
- **Files**: canonical markup module and element source.
- **Validation**: TypeScript compile plus focused tests for static/runtime policies and omission serialization.
- **Parallel?**: No; follows T007.

### Subtask T009 – Add accessible state presentation

- **Purpose**: Make complete/pending visible and announced without changing the element's passive semantics.
- **Steps**:
  1. Update the authored check-bullet CSS only; regenerate its element sheet later.
  2. Preserve the current complete icon color and layout for the omitted/default path.
  3. Give `.sk-check-bullet--pending` and its icon a token-driven distinguishable treatment that does not rely on color alone because the glyph changes too.
  4. Add `.sk-check-bullet__state` as visually clipped but accessibility-tree-present text. Prefer the established `clip-path` technique; use tokenized design values and do not use `display:none`, `visibility:hidden`, `aria-hidden`, or zero font size.
  5. Render the hidden state span plus decorative icon and slot from the element, using canonical label/icon helpers rather than duplicating strings.
  6. Preserve `part="bullet"` and `part="icon"`; do not expose the internal state label as a part unless a concrete consumer need exists. `expected-parts.json` should remain unchanged.
  7. Under active Chromium forced-colors emulation, measure that complete and pending retain distinct rendered glyph text plus a visible nonzero system-resolved icon color; a media-query match or plausible source rule is not sufficient. Add forced-colors CSS only if those observables fail. Add a reduced-motion block only if this WP introduces a real transition.
- **Files**: authored CSS, element render, markup helper.
- **Validation**: stylelint, part tests, accessible-name/state assertions, forced-colors observation.
- **Parallel?**: No; coupled to the helpers in T008.

### Subtask T010 – Expand checklist stories

- **Purpose**: Make every required state/scale/absence scenario independently visible and axe-assessable.
- **Steps**:
  1. Extend `packages/elements/src/check-bullet/sk-check-bullet.stories.ts` with explicit complete, pending, mixed, long-items, no-subtasks composition, fifty-item scale, custom-icon, and required `LightMode` stories while retaining existing exports.
  2. No-subtasks must compose `.sk-empty-state`; do not add a checklist wrapper or invent empty copy in the element.
  3. Render mixed/fifty scenarios inside the documented `<ul role="list">` composition. State strings are consumer data; no progress count is derived.
  4. Update the styles-layer static story to demonstrate backward-compatible complete and pending/mixed generated HTML without hand-writing the component markup.
  5. Keep every Storybook meta's a11y enabled and LightMode under a real `.sk-light` wrapper.
  6. Long and fifty-item content must remain supplied text and must not introduce Team Kitty-specific behavior.
- **Files**: element and existing static story files; generated HTML constant is produced from markup.
- **Validation**: Storybook index has every named story; axe assesses each; narrow screenshots/measurements show wrapping.
- **Parallel?**: Yes after T008; can proceed while CSS polish finishes.

### Subtask T011 – Register ratchet and mutation changes

- **Purpose**: Bind the new public state to exact docs and mutation-backed behavior coverage.
- **Steps**:
  1. Add `sk-check-bullet` as an SC-010 subject in `behaviours.json`; do not mint a new behavior ID or relabel fail-open as an unrelated contract.
  2. Add a unique, exact `mutations.json` arm for the state property's reflected/pre-upgrade behavior and, if attribution remains surgical, an arm for pending normalization/default icon/state text. Every `from` anchor must occur once.
  3. Name new behavior tests `[SC-010]` only where they genuinely prove property-before-upgrade/state application. Keep plain state/fail-open tests unlabelled if an SC label would misrepresent them; the issue still requires their mutation red, so choose an arm whose named target includes the full state contract without collateral.
  4. Update `expected-docs.json`: `sk-check-bullet` gains exactly one documented attribute and the total rises by one. Add an explanatory comment with the exact arithmetic.
  5. Leave `expected-parts.json` unchanged unless implementation actually adds a public part; adding a part only to satisfy a count is forbidden.
  6. Run mutation registry/self-test preflight and demonstrate each new arm's intended red with no unrelated failing test.
- **Files**: behavior/mutation registries and expected docs.
- **Validation**: config contract, manifest content after WP03 generation, mutation arm exact-anchor/preflight, surgical named red.
- **Parallel?**: No; follows stable implementation.

### Subtask T012 – Generate component outputs and focused gate

- **Purpose**: Leave check-bullet internally consistent and independently reviewable without taking ownership of global generated artifacts.
- **Steps**:
  1. Run `node scripts/build-elements-css.mjs` and `node scripts/build-element-markup.mjs`; commit only check-bullet outputs owned here. If those commands touch unrelated files, confirm whether they are pre-existing train drift and do not absorb them.
  2. Run `--check` forms of both generators and `node scripts/check-no-css-in-source.mjs`, adopted CSS boundary/hygiene, parts ratchet, story-theme wrapper/selftest, and focused element typecheck/lint.
  3. Run the focused check-bullet Vitest file, all directly affected node tests, Storybook build, and axe over every check-bullet story.
  4. Compare the check-bullet icon's named token-derived computed color between the default-dark and actual `.sk-light` story, require a difference, and assert the LightMode wrapper is present so an inert theme fails.
  5. Run targeted mutation arms plus full mutation guard self-tests; retain exact outputs for WP03.
  6. Verify the static path and element path share normalized class/icon/state text from the markup module, with only the #92-required outer structure difference.
  7. Safe-commit owned files, mark T007–T012 done, change the WP profile to reviewer-renata through a committed artifact update, move WP02 to `for_review`, and wait for the synchronous pre-review gate.
- **Files**: no new ownership; generated component-local outputs are under the existing owned directories.
- **Validation**: all focused checks exit zero on committed head and no global generated file remains staged/dirty.
- **Parallel?**: No.

## Test Strategy

- Red-first production behavior in `fixtures/elements-behaviour/src/sk-check-bullet.test.ts`.
- Late-definition subclass proves SC-010 rather than merely setting an attribute after registration.
- Mutation arms must produce named red and no collateral; full guard self-test remains green.
- Static/element markup assertions prove both paths derive from canonical helpers.
- Storybook/axe confirms state is textual to AT and no story is silently omitted.
- Type union generation is completed in WP03 after the manifest/wrapper regeneration.

## Definition of Done

- T007–T012 are CLI-recorded done.
- Public reflected state is documented and limited to complete/pending in TypeScript.
- Omitted and unsupported runtime input retain the original complete presentation without throwing.
- Pending changes both decorative glyph and announced hidden text; icon overrides do not override semantics.
- Host stays passive listitem-compatible, with no `aria-checked`, checkbox role, event, timer, or progress calculation.
- Static HTML and element rendering share canonical helpers; component-local generated files are clean.
- Exact docs/behavior/mutation ratchets are updated, and new arms have real red-first evidence.
- Focused type/lint/build/Storybook/axe/tests pass and independent review approves.

## Risks & Mitigations

- **Default serialization break**: do not initialize the property to `complete`; normalize at render.
- **Invalid runtime crash**: no render-time throw; strictness stays only in static build helper.
- **AT loses state**: state text is real DOM not `aria-hidden`; icon alone never carries meaning.
- **Wrong semantic role**: preserve existing listitem host and explicitly test absence of checkbox/toggle affordances.
- **Mutation mislabeled**: use SC-010 only for actual pre-upgrade behavior and require exact subject attribution.
- **Generated global collision**: leave manifest/wrappers/Vue/SIZES to WP03 after final train coordination.

## Reviewer Guidance

- Load reviewer-renata and inspect the omission path before the new states; backward compatibility is the sharpest risk.
- Apply deletion tests to reflection, normalization, accessible text, icon override, and mutation anchors.
- Reject `aria-checked`, checkbox role, events, click/keyboard handlers, progress derivation, hidden-from-AT state, manually edited generated output, or a new token family without evidence.
- Confirm expected-docs arithmetic and SC-010 subject/arms exactly match current files.
- Record verdict via the Spec Kitty event-log seam only.

## Activity Log

- 2026-09-07T11:53:49Z – system – Prompt created.
