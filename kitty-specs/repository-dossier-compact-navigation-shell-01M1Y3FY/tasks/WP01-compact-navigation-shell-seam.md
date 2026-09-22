---
work_package_id: WP01
title: Compact navigation shell seam
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
- FR-021
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
planning_base_branch: train/elements-first
merge_target_branch: train/elements-first
branch_strategy: Planning artifacts for this mission were generated on train/elements-first. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into train/elements-first unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-repository-dossier-compact-navigation-shell-01M1Y3FY
base_commit: 9a2d77203ada19e10bf23b1a35b1bbe255ed0a42
created_at: '2026-09-07T15:26:57.802428+00:00'
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
phase: Phase 1 - Atomic authored and generated seam
history:
- timestamp: '2026-09-07T00:00:00Z'
  agent: codex
  action: Prompt authored from approved mission artifacts
agent_profile: frontend-freddy
authoritative_surface: packages/elements/src/app-shell/sk-app-shell.ts
create_intent:
- fixtures/react-consumer/src/sk-app-shell.test.tsx
- apps/storybook/src/tests/sk-app-shell-compact-navigation.spec.ts
- docs/architecture/validation/issue-254-compact-navigation/evidence.md
- docs/architecture/validation/issue-254-compact-navigation/chromium-200-percent.png
- docs/architecture/validation/issue-254-compact-navigation/chromium-400-percent.png
- docs/architecture/validation/issue-254-compact-navigation/firefox-200-percent.png
- docs/architecture/validation/issue-254-compact-navigation/firefox-400-percent.png
execution_mode: code_change
model: ''
owned_files:
- packages/elements/src/app-shell/sk-app-shell.ts
- packages/elements/src/index.ts
- packages/styles/src/app-shell/sk-app-shell.css
- packages/elements/src/app-shell/sk-app-shell.stories.ts
- fixtures/elements-behaviour/src/sk-app-shell.test.ts
- fixtures/react-consumer/src/sk-app-shell.test.tsx
- fixtures/react-consumer/src/wrappers.test.tsx
- fixtures/vue-consumer/src/types.test-d.ts
- packages/react/type-tests/wrappers.type-test.tsx
- tests/node/react-wrappers.test.ts
- apps/storybook/src/tests/sk-team-overview-shell-layout.spec.ts
- apps/storybook/src/tests/sk-app-shell-compact-navigation.spec.ts
- apps/storybook/src/tests/visual.spec.ts
- apps/storybook/src/tests/visual.spec.ts-snapshots/**
- docs/design-system/using-components.md
- packages/elements/custom-elements-manifest.config.mjs
- scripts/normalise-manifest.mjs
- scripts/build-react-wrappers.mjs
- behaviours.json
- mutations.json
- mutations.selftest.json
- suite-budget.json
- expected-parts.json
- expected-docs.json
- expected-stories.json
- packages/elements/src/app-shell/sk-app-shell.css.js
- packages/elements/src/app-shell/sk-app-shell.css.d.ts
- packages/elements/custom-elements.json
- packages/elements/SIZES.md
- packages/react/src/SkAppShell.js
- packages/react/src/SkAppShell.d.ts
- packages/react/src/index.js
- packages/react/src/index.d.ts
- packages/elements/vue.d.ts
- packages/styles/**/app-shell*/**
- docs/architecture/validation/issue-254-compact-navigation/evidence.md
- docs/architecture/validation/issue-254-compact-navigation/chromium-200-percent.png
- docs/architecture/validation/issue-254-compact-navigation/chromium-400-percent.png
- docs/architecture/validation/issue-254-compact-navigation/firefox-200-percent.png
- docs/architecture/validation/issue-254-compact-navigation/firefox-400-percent.png
role: implementer
tags: []
tracker_refs:
- '#254'
---

# Work Package Prompt: WP01 – Compact navigation shell seam

## ⚡ Do This First: Load Agent Profile

Before reading anything else in this prompt, load your assigned agent profile:

```
/ad-hoc-profile-load frontend-freddy
```

Internalize the profile's identity, specialization, and collaboration contract before touching code. If the invocation alias cannot be used from the Codex harness, read the resolved `frontend-freddy` profile directly through the current Spec Kitty profile-loading command and log any genuine gap to `tmp/finding/`. Never substitute Claude, Claude Code, Hermes, or `/tk` transport.

## Objective

Deliver one atomic, backward-compatible extension of the existing sk-app-shell. The shell
owns placement, rendered visibility, bounded drawer scrolling, and dismissal intent.
The consumer owns the value, trigger, labels, navigation nodes, routes, destination, and
dismissal acceptance. Do not add a router, application store, breakpoint service, focus
trap, new navigation product, or changes to existing shell consumers/components.

## T001 — Red-first behavior, accessibility, and layout proof

Capture the current desktop and absent-axis legacy baseline, then add failing authored
tests before implementation. Use the existing behavior fixtures and Storybook/Playwright
shell locations.

- Cover absent axis at desktop and legacy 720px: four existing slots, six existing
  parts, three-column layout, and unchanged behavior. Unknown values warn and fail open.
- Prove pre-upgrade presentation and open assignment retention and reflection.
  presentation is exactly 'compact' or undefined; open is reflected and controlled;
  compactTrigger is property-only and never serialized.
- Use consumer-authored same-root light-DOM trigger and navigation nodes. The trigger is
  required inside compact-header so it leaves presentation with its drawer above 860px.
  The consumer owns aria-expanded, aria-controls, target id, accessible name, links,
  routes, and destination. Never point IDREFs into shadow DOM, duplicate main, or add a
  navigation landmark around consumer content.
- Cover app-shell inline sizes 390, 768, 860, and 861 CSS px, plus a constrained shell in
  a wider viewport, both states, short/tall viewports, long labels, internal drawer scroll,
  and document.scrollWidth <= clientWidth. Include honest real 200% and programme-required
  400% browser UI-zoom evidence; do not call CSS scaling, device scale factor, or ordinary
  viewport resizing browser UI zoom.
- Cover pointer/keyboard activation, route close, disconnected triggers, resize both
  directions, no hidden/off-screen focus, closed accessibility-tree/focus inertness,
  open native order, dark/LightMode, forced colors, reduced motion, and axe.
- Assert exactly one effectively-open Escape event with typed detail { reason: 'escape' },
  bubbles=true, composed=true, cancelable=false; closed Escape emits none and shell
  mutation of open is zero. Also prove absent/unknown/non-compact open values emit none.
  Exactly one bounded post-dispatch microtask samples effective falsiness (`open !== true`),
  including React 19's omitted/undefined false property. After acceptance, the component
  awaits its Lit update before focusing a connected compactTrigger. The intent expires at
  that sample whether accepted or rejected, and any close after the sample, including a later
  route/state close, never inherits focus-return intent. Mark established
  ADR-11 IDs SC-006, SC-007, SC-008, SC-010, SC-012, SC-013, SC-014, and SC-017; do not
  mint a route-ownership ID.

## T002 — Element API, rendering, event, and focus state

After T001 is red, implement packages/elements/src/app-shell/sk-app-shell.ts while
retaining every existing markup contract.

- Add reflected presentation with absent default and only compact recognized; warn and
  fail open otherwise. Add reflected controlled open and never set it from Escape,
  resize, click, or route activity.
- Add property-only compactTrigger: HTMLElement | null solely for accepted-dismissal
  focus return. Require that referenced consumer control inside compact-header and in the
  same light-DOM root as the consumer navigation target. Add compact-header and
  compact-navigation slots.
- Keep consumer navigation in the light-DOM relationship required by aria-controls.
  Wrap for visuals only; never invent nav/navigation or duplicate main. Closed content
  is inert/hidden from focus and accessibility exposure; open content is native order.
- Derive effective open from recognized compact presentation, observed app-shell inline
  size <=860px, and controlled open true. Type and emit one non-cancelable, bubbling,
  composed dismissal event per effectively-open Escape and none otherwise.
- Store pending dismissal before dispatch. After exactly one bounded post-dispatch microtask,
  sample effective falsiness (`open !== true`), including React 19's omitted/undefined false
  property. Expire the intent at that sample whether accepted or rejected. After acceptance,
  await the component's Lit update, present closed before focus restoration, and focus only a
  connected valid trigger. Any close after the sample, including a later consumer route/state
  close, must not inherit focus-return intent.
- Use only a component-local ResizeObserver for the effective-open/focus threshold seam;
  use the same shell inline size as CSS, never mutate open, create a shared service, or leak
  the observer on teardown.

## T003 — Token-only CSS, slots, parts, responsive envelope, and modes

Update packages/styles/src/app-shell/sk-app-shell.css using repository --sk-* tokens,
documented parts, and documented component properties only.

- Compact applies at app-shell inline size <=860px and 861px is noncompact. Preserve
  absent-axis legacy 720px container behavior and prove a constrained shell activates
  compact presentation inside a wider viewport. Long labels wrap, the page does not
  overflow, and the drawer scrolls internally within a viewport-constrained region.
- Declare only needed new parts and preserve existing parts. Satisfy adopted-CSS and
  no-CSS-in-source boundaries; no ancestor selector may cross the open shadow boundary.
- Cover default dark, LightMode, forced-colors system-color outline/focus, and a scoped
  reduced-motion override without dependence on color, glyph, hover, or animation.

## T004 — Stories, documentation, and visual evidence

Update the current app-shell story and docs/design-system/using-components.md.

- Stories cover desktop, compact closed/open, 390/768/860/861 shell inline sizes, long labels, short/tall
  heights, dark, the required LightMode name, reduced motion, and forced colors; include
  visual comparisons for D1, D2, and D4-D8 intent. Read the immutable PNG sources at the
  exact absolute paths/checksums in research/source-register.csv; do not edit or copy them
  into a private substitute.
- Document reflected presentation='compact', reflected controlled open, property-only
  compactTrigger, slots/parts, same-root trigger/target and aria-controls obligations,
  labels, 860 threshold, absent-axis 720 compatibility, event detail/flags, accepted
  Escape focus timing, disconnected trigger, and route ownership. State that ordinary
  route close does not restore focus.
- Record visual, axe, Chromium, Firefox, viewport/container, mode, and zoom evidence
  honestly in docs/architecture/validation/issue-254-compact-navigation/evidence.md.

## T005 — Registries, mutations, and authored ratchets

Use current train versions of shared registries and re-fetch them immediately before edit.
Register the exact ADR-11 behavior IDs from the plan: event count/detail/flags,
pre-upgrade/reflection, Escape/focus return, declared parts, style adoption, and the
responsive threshold. Add changed-scope mutation subjects for controlled immutability,
Escape count/flags, accepted focus timing, threshold boundary, closed inertness, and the
light-DOM relationship. Run mutation selftest and kill surviving mutants with assertions.
Update expected-parts.json, expected-docs.json, expected-stories.json, and suite-budget.json
through established conventions without weakening gates or minting an ADR-11 id.

## T006 — Generator-driven contract and consumer artifacts

Run existing generators from authored sources; never hand-edit generated output. Include
CSS JS/d.ts and applicable styles-only output, custom-elements.json, React wrapper JS/d.ts and
indexes, Vue types, manifest metadata for property-only compactTrigger, typed event detail,
behavior/mutation reports, ratchets, and packages/elements/SIZES.md. The existing app-shell
has no authored markup module: run build-element-markup repository-wide and prove it stays
clean without adding one. Prove React/Vue types cover open, presentation, compactTrigger,
and dismissal detail, and prove generation --check/diff is clean.

## T007 — Focused/full gates, exact-SHA review, and handoff

Run the following exact matrix from repository root on the final SHA. Browser-install is a
prerequisite command, not evidence of a browser run; if it or any command is unavailable,
record its exact output and affected criterion rather than claiming success.

```bash
npm ci --ignore-scripts
npx playwright install --with-deps chromium firefox

node scripts/build-elements-css.mjs
node scripts/build-element-markup.mjs
npx nx run elements:analyze
node scripts/build-react-wrappers.mjs
node scripts/build-vue-types.mjs
npx nx run-many --target=build --projects=tokens,styles,elements
node scripts/measure-elements-sizes.mjs

node scripts/build-elements-css.mjs --check
node scripts/build-element-markup.mjs --check
node scripts/build-react-wrappers.mjs --check
node scripts/build-vue-types.mjs --check
git diff --exit-code -- packages/elements/custom-elements.json
node scripts/measure-elements-sizes.mjs --check

npx vitest run fixtures/elements-behaviour/src/sk-app-shell.test.ts fixtures/react-consumer/src/sk-app-shell.test.tsx
node scripts/build-storybook-with-budget.mjs
npx playwright test apps/storybook/src/tests/sk-app-shell-compact-navigation.spec.ts --project=chromium --project=firefox
PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium
node scripts/run-axe-storybook.js

node scripts/check-manifest-content.mjs
node scripts/check-manifest-content.mjs --selftest
node scripts/check-no-css-in-source.mjs
node scripts/check-elements-entries.mjs
node scripts/check-elements-entries.mjs --selftest
node scripts/check-adopted-css-boundaries.mjs
node scripts/check-adopted-css-boundaries.mjs --selftest
node scripts/check-element-css-hygiene.mjs
node scripts/check-part-ratchet.mjs
node scripts/check-behaviour-fixture-imports.mjs
node scripts/check-behaviour-fixture-imports.mjs --selftest
node scripts/check-story-theme-wrapper.mjs
node scripts/check-story-theme-wrapper.mjs --selftest
node scripts/check-gate-wiring.mjs
node scripts/check-gate-wiring.mjs --selftest
node scripts/build-react-wrappers.mjs --selftest
node scripts/typecheck-all.mjs
npm run quality:all

npm run test
node scripts/measure-suite-time.mjs
node scripts/suite-selftest.mjs
node scripts/suite-selftest.mjs --selftest
npx playwright test

node scripts/check-release-graph.mjs --selftest
node scripts/check-release-graph.mjs
node scripts/check-vue-packed-types.mjs
node scripts/check-offline-load.mjs --selftest
node scripts/check-offline-load.mjs
```

Before every size or release check, rebuild its named graph as the repository recipe/CI
requires. Save command, exit status, tested commit SHA, browser/project, automatic versus
manual status, and limitation text in
docs/architecture/validation/issue-254-compact-navigation/evidence.md. Store visual diff
artifacts/snapshots in the owned validation/snapshot paths and record the D1/D2/D4-D8
comparison result there.

Reconfirm 390/768/860/861 shell inline sizes and a constrained-shell/wider-viewport case, short/tall, long labels, dark/LightMode, forced colors,
reduced motion, real 200%/400% browser zoom, no page overflow, drawer internal scroll,
mutation selftest, generated drift, and legacy absent-axis 720 behavior. Rebase on the
latest train/elements-first only after reading current mission context, regenerate all
outputs, rerun the complete matrix, and attach evidence to the exact reviewed SHA.
Obtain exact-SHA independent Codex review, fold findings, and rerun affected gates.
Push the reviewed branch and create exactly this WP's PR targeting train/elements-first with
Refs #254, never Closes #254. Do not merge or close the PR or issue.

## Definition of done

All T001-T007 are complete; FR-001..FR-021, relevant NFRs, C-001..C-008, and mission success criteria SC-001..SC-006
have explicit evidence or an operator-visible limitation. Legacy absent-axis behavior is
unchanged, compact is inclusive through 860 with 861 noncompact, open is never shell
mutated, and event/ARIA/focus/overflow/mode/generated/registry/mutation/visual contracts
are verified at one exact reviewed SHA.

## Risks and reviewer guidance

Check shadow/light-DOM IDREF errors, duplicated nodes, premature focus, route-close focus
theft, stale hidden focus after resize, observer leaks, 720px drift, forced-colors focus
loss, generated drift, registry overwrites, and false browser-zoom claims. Confirm no
changes to sk-nav-pill, sk-notice, sk-personal-rail, or sk-context-sidebar and no new
application state.

## Branch strategy

Planning base and merge target are train/elements-first. Execution worktrees are allocated
per computed lane from lanes.json. After review and any rebase/regenerate/retest cycle,
prepare the PR with Refs #254, evidence, visual comparisons, and limitations; merge and
issue closure remain operator actions.
