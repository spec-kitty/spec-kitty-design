---
work_package_id: WP01
title: Native grouped and nested context-navigation contract
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
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- NFR-006
- NFR-007
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
planning_base_branch: train/elements-first
merge_target_branch: train/elements-first
branch_strategy: Planning artifacts for this mission were generated on train/elements-first. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into train/elements-first unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
phase: Phase 1 - native context-navigation styles
history:
- at: '2026-09-07T14:52:00Z'
  actor: system
  action: Prompt authored through the Spec Kitty tasks phase for issue
agent_profile: frontend-freddy
authoritative_surface: packages/styles/src/context-nav/
create_intent:
- packages/styles/src/context-nav/sk-context-nav.css
- packages/styles/src/context-nav/sk-context-nav-default.html
- packages/styles/src/context-nav/sk-context-nav-current-nested.html
- packages/styles/src/context-nav/sk-context-nav-empty.html
- packages/styles/src/context-nav/sk-context-nav-empty-overflow.html
- packages/styles/src/context-nav/sk-context-nav-long-labels.html
- packages/styles/src/context-nav/sk-context-nav-scale.html
- packages/styles/src/context-nav/sk-context-nav-html.stories.ts
- packages/styles/src/context-nav/index.ts
- apps/storybook/src/tests/sk-context-nav.spec.ts
execution_mode: code_change
model: ''
owned_files:
- packages/styles/src/context-nav/**
- packages/styles/src/index.ts
- packages/styles/package.json
- apps/storybook/src/tests/sk-context-nav.spec.ts
- apps/storybook/src/tests/visual.spec.ts
- apps/storybook/src/tests/visual.spec.ts-snapshots/*context-nav*
- expected-stories.json
- docs/design-system/using-components.md
- packages/elements/SIZES.md
role: implementer
tags:
- styles-only
- native-semantics
- accessibility
task_type: implement
tracker_refs:
- https://github.com/spec-kitty/spec-kitty-design/issues/256
---

# Work Package Prompt: WP01 — Native grouped and nested context-navigation contract

## Required agent and profile

Use Codex only. Never invoke Claude, Claude Code, Hermes, `/tk`, or any legacy Team Kitty transport. Load the `frontend-freddy` profile through the current Spec Kitty doctrine/profile surface before implementation. Review is performed later by a separate Codex session with a reviewer profile.

## Objective

Ship one token-only `.sk-context-nav` class family directly on consumer-authored native light-DOM navigation. It complements `sk-context-sidebar`; it does not widen that element. Done means authored CSS and canonical HTML fixtures, a generated TypeScript exemplar barrel, styles-package exports, a complete Storybook catalogue, focused cross-browser accessibility/layout tests, public documentation, required ratchets/shared regeneration, and exact-SHA evidence all pass without adding a custom element, JavaScript behavior, app data, or wrapper output.

Read `spec.md`, `research.md`, `data-model.md`, `plan.md`, `quickstart.md`, `contracts/context-nav.md`, live issue #256, ADR-9/10/11, and the current component recipe before changing source. The spec is binding; the plan’s browser matrix and public CSS design are the implementation contract.

## Public surface and non-goals

The exact public class inventory is:

- `sk-context-nav`
- `sk-context-nav__group`
- `sk-context-nav__heading`
- `sk-context-nav__list`
- `sk-context-nav__item`
- `sk-context-nav__link`
- `sk-context-nav__icon`
- `sk-context-nav__label`
- `sk-context-nav__children`
- `sk-context-nav__empty-copy`
- `sk-context-nav__overflow-link`

Use `nav`, native heading, `ul`, `li`, and `a[href]` nodes. Nested links stay inside a nested native list. Current presentation must use `.sk-context-nav__link[aria-current]:not([aria-current="false"])`; never introduce `.is-current`. No `role="tree"`, `role="menu"`, roving tabindex, disclosure state, routing, URL inspection, ordering/count logic, fetched icons, badges, data arrays, custom events, timers, or Team Kitty application vocabulary may ship.

Do not create `packages/elements/src/context-nav/`, a `sk-context-nav` tag, an element CSS module, manifest row, React wrapper, Vue declaration, behavior registry subject, or mutation arm. Do not change `sk-context-sidebar` or `sk-nav-pill`.

## Subtasks

### T001 — Baseline and red contract

1. Confirm the lane is based on the newest `origin/train/elements-first`; preserve the mission planning commits and use source-based regeneration for any shared conflicts.
2. Record pre-change hashes of `packages/elements/custom-elements.json`, `packages/elements/vue.d.ts`, `packages/react/src`, `behaviours.json`, and `mutations.json` for the negative acceptance proof.
3. Add `apps/storybook/src/tests/sk-context-nav.spec.ts` first. Follow `sk-form-select.spec.ts`/`sk-workflow-board.spec.ts` patterns: parse exact class inventory with PostCSS, inspect canonical fixture/barrel source, assert styles package exports/docs/ratchet, assert absent element/wrapper/behavior surfaces, and load built stories for DOM/browser evidence.
4. Demonstrate the intended focused red before implementation because the context-nav story/style/barrel is absent; record the command and expected missing-surface failure.

### T002 — Authored stylesheet and canonical fixtures

1. Author `packages/styles/src/context-nav/sk-context-nav.css` with only existing semantic `var(--sk-*)` values. Do not add tokens unless a binding gate proves an actual gap and orchestration authorizes it.
2. Compose primary row target geometry to at least 44×44 CSS pixels with tokens only; the literal `44px` must not appear.
3. Use logical properties and `min-inline-size: 0`/`overflow-wrap: anywhere` so unbroken and natural labels fit 240px/390px and high zoom. Preserve full DOM text/accessibility names.
4. Give hover, active, focus-visible, and non-false current states distinct, non-colour-only cues. Make visited navigation presentation unconditionally neutral. Use outlines/borders that survive forced colours.
5. Preserve a visible child hierarchy through tokenized logical indentation and connector/border treatment. Prefer no transitions. If a transition is authored, add a precisely scoped reduced-motion override.
6. Author canonical HTML fixtures for grouped text/icon links, current nested/parent cases, empty copy, empty-plus-overflow link, long labels/explicit `aria-current="false"`/no current, and a twenty-child scale. Include one- and three-child variants through stories if reusing a fixture.
7. Consumer icons remain inline-owned; decorative SVG has `aria-hidden="true"` and a link name comes from text. Fixtures add no roles or tabindex values.

### T003 — Generated barrel, exports and stories

1. Run `node scripts/build-styles-only-markup.mjs`; never hand-edit the generated `context-nav/index.ts`. Run its `--check` mode after generation.
2. Export the generated constants from `packages/styles/src/index.ts` and expose `./context-nav/*` from `packages/styles/package.json` in alphabetical order.
3. Author an axe-enabled `Navigation/SkContextNav (HTML)` Storybook module that renders generated fixture constants, not duplicate inline canonical markup.
4. Publish separately addressable stories for Default grouped nav, CurrentTopLevel, CurrentNested, CurrentParent, NoCurrent, Empty, EmptyOverflow, LongLabels, OneChild, ThreeChildren, TwentyChildren, Narrow, ForcedColors, Rtl, and LightMode. Aliases may reuse canonical constants, but each route must render the claimed state. `LightMode` uses a real `.sk-light` ancestor and changes computed token-derived styles.
5. A forced-colour route is not proof by itself; focused tests must activate the media emulation.

### T004 — Focused browser contract

Prove the complete matrix in `plan.md`, including:

- a named native navigation landmark, native group heading association, nested list/listitem count/order, link names, decorative icon handling, and zero added roles/tab stops;
- sequential keyboard focus order and visible unclipped focus;
- only non-false `aria-current` links compute the current cues; explicit `aria-current="false"` equals non-current presentation;
- visited/unvisited computed presentation is neutral via deterministic source plus browser-history evidence;
- primary rows are at least 44×44 CSS pixels;
- current, hover, active, and focus-visible have distinguishable shape/weight/border/outline cues, not hue alone;
- one/three/twenty child hierarchy, long natural/unbroken labels, 240px sidebar, 390px viewport, RTL, and 200%/400% zoom have no page-level horizontal overflow or clipped accessible content;
- forced-colours preserves current/focus/hierarchy; reduced-motion either has no owned transition or disables exactly the one present;
- Default and LightMode resolve genuinely different theme styles.

Run the focused file with `--project=chromium` and `--project=firefox`. Run WebKit as part of the repository full matrix if the host supports it. Axe story coverage must report zero violations.

### T005 — Documentation and ratchets

1. Add the `sk-context-nav` section to `docs/design-system/using-components.md` with valid package imports and the canonical native structure.
2. State `aria-current`, icon accessible naming, empty/overflow, order/count/URLs, and no-behavior ownership explicitly. Explain the styles-only ADR-10 boundary and composition inside `sk-context-sidebar` without shadow-root reach-through.
3. Add every cited context-nav story ID to `expected-stories.json` with an accurate explanatory comment and total adjustment.
4. Add visual registrations/baselines only following the repository’s current CI-authoritative visual policy.

### T006 — Full exact-SHA verification

Install dependencies only with `npm ci --ignore-scripts` if absent. Regenerate and check all committed artifacts in current recipe order, including styles-only barrel, element CSS/markup, manifest, React wrappers, Vue types, builds, and `SIZES.md` after a real build. Confirm manifest/React/Vue/behavior/mutation bytes match the pre-change baseline except unrelated rebased train changes.

Run the complete component recipe and CI-wired gates: typecheck, ESLint/stylelint/HTMLHint, token literal checks, theme-wrapper check/selftest, element/manifest/CSS/part checks and selftests, generator checks/selftests, gate/release graph, offline/security checks, Vitest, mutation suite/selftest, Storybook build, axe, full Playwright, and visual regression. Record every exact command, result, browser/tool limitation, and commit SHA. Do not claim a command that did not complete.

Record separate real-browser dark/LightMode, 390px, 240px sidebar, 200%/400% browser zoom, RTL, forced-colours, and reduced-motion observations against the same committed SHA. Viewport resizing or CSS `zoom` does not substitute for browser zoom.

### T007 — Rebase, independent review, PR delivery

Immediately before review, fetch the current train. If it moved, rebase, regenerate from authored source, commit and rerun affected/full gates. Dispatch an independent Codex review seat through the Spec Kitty review surface. Fix every confirmed finding; any fix/rebase/push requires a new exact-head review and affected verification.

Complete all Tier-C charter review lenses with Codex and publish their aggregate finding/disposition evidence on the PR at the exact head SHA. Open exactly one PR targeting `train/elements-first`; its body says `Refs #256` and never `Closes #256`. Do not merge or close the issue in this WP.

## Completion evidence

The implementer returns:

- final lane/head SHA and origin train SHA used;
- authored/generated file inventory and confirmation of absent forbidden surfaces;
- red-first evidence and complete verification matrix with exact commands/results;
- actual zoom/browser versions and any unavailable-browser failure;
- review cycles, findings and remediations;
- PR URL with `Refs #256`.
