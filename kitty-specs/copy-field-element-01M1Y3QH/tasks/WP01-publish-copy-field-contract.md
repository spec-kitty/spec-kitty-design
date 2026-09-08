---
work_package_id: WP01
title: Publish the exact-value copy field contract
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
- FR-022
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
planning_base_branch: mission/copy-field-element
merge_target_branch: mission/copy-field-element
branch_strategy: Planning artifacts for this mission were generated on mission/copy-field-element. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/copy-field-element unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-copy-field-element-01M1Y3QH
base_commit: ec1917143d1c6703a17bb05ee244f220a60b1f0e
created_at: '2026-09-07T15:32:37.021859+00:00'
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
phase: Phase 1 - exact-value copy field
history:
- at: '2026-09-07T14:40:00Z'
  actor: codex
  action: Prompt authored from live issue
agent_profile: frontend-freddy
authoritative_surface: packages/elements/src/copy-field/
create_intent:
- packages/elements/src/copy-field/sk-copy-field.ts
- packages/elements/src/copy-field/sk-copy-field.stories.ts
- packages/styles/src/copy-field/sk-copy-field.css
- fixtures/elements-behaviour/src/sk-copy-field.test.ts
- fixtures/react-consumer/src/sk-copy-field.test.tsx
- apps/storybook/src/tests/sk-copy-field.spec.ts
- apps/storybook/src/tests/sk-copy-field-forced-colors.spec.ts
execution_mode: code_change
model: ''
owned_files:
- packages/elements/src/copy-field/**
- packages/styles/src/copy-field/**
- packages/elements/src/index.ts
- packages/elements/src/elements.ts
- packages/elements/package.json
- packages/styles/package.json
- fixtures/elements-behaviour/src/sk-copy-field.test.ts
- fixtures/react-consumer/src/sk-copy-field.test.tsx
- apps/storybook/src/tests/sk-copy-field*.spec.ts
- apps/storybook/src/tests/visual.spec.ts
- apps/storybook/src/tests/visual.spec.ts-snapshots/sk-copy-field-*.png
- behaviours.json
- mutations.json
- mutations.selftest.json
- expected-parts.json
- expected-docs.json
- expected-stories.json
- packages/elements/custom-elements.json
- packages/react/src/SkCopyField.*
- packages/react/src/index.*
- packages/react/.wrapper-floor
- packages/elements/vue.d.ts
- packages/elements/SIZES.md
role: implementer
tags:
- custom-element
- clipboard
- accessibility
- repository-dossier
task_type: implement
tracker_refs:
- '#257'
- '#253'
- '#255'
---

# Work Package Prompt: WP01 — Publish the exact-value copy field contract

## Do This First

Load `frontend-freddy` through the Spec Kitty resolver and load action-scoped charter context for
`implement`. Read the mission `spec.md`, `research.md`, `data-model.md`, `plan.md`, `quickstart.md`,
and public contract, plus root `AGENTS.md`, `CLAUDE.md`, `.kittify` charter/config, ADR-9/10/11,
`docs/contributing/adding-a-component.md`, and the repository-local `spec-kitty-design` skill/rules.
Read the live issue #257 and referenced #79/#153/#154/#178/#213 state again. Use Codex only; never
invoke Claude, Claude Code, Hermes, `/tk`, or a legacy Team Kitty transport.

The approved Repository Dossier evidence directory is read-only. The operator-approved dark set
D1, D2, and D4-D8 plus live issue #257's D1, D3, D4, D6, D8 references authorize compact
value/Copy composition, theme parity, and long wrapping only. They do not authorize application
data, routing, command execution, discovery, polling, truth inference, progress, timestamps, or
stores.

## Definition of Done

One reviewed mission-branch head must provide all of the following:

- `value` is a single reactive source rendered by Lit text interpolation and written exactly,
  including whitespace, quotes, punctuation, line breaks, and Unicode.
- One native `type="button"` is the only sequential tab stop for a non-empty value and is absent
  from sequential navigation when empty. It uses the existing button
  stylesheet/class contract; the host has no `tabindex`, and the visible code fallback target uses
  only `tabindex="-1"`.
- A meaningful `label` names the button. Missing/blank text warns through repository precedent and
  fails open to `Copy value`; it never blanks the value/control.
- A secure-context callable async Clipboard API fulfills before `copied` is claimed. Absence,
  insecure context, sync throw, and rejection are contained and select/focus the full visible code.
  Verified selection yields `manual`; an impossible focus/selection yields `failed`. Do not use
  `execCommand`, hidden duplicate text, permission prompting, retry, timers, or queues.
- Empty exact string disables the action and emits no result. Whitespace remains valid data.
  A custom reactive accessor synchronously clears stale status and advances revision on every
  actual value change, including batched A→B→A, so a late prior promise cannot restore it.
- One stable per-instance polite atomic status node exists from first render. Consumer-overridable
  success/manual/failure messages feed only this node and blank/whitespace-only values use the
  applicable default; multiple fields remain independent. Same-revision overlapping attempts each
  complete once and the most recently completed result owns visible status.
- Exactly one typed, bubbling, composed, non-cancelable `sk-copy-field-result` fires per completed
  non-empty attempt. Frozen readonly detail has exactly one key, `outcome`, with the literal union
  `copied | manual | failed`; it never carries value text.
- `field`, `value`, `copy-control`, and `status` parts plus every property/event are documented in
  the manifest. The class registers through `define()` and has no slots/public methods/form API.
- `:host { display: block }`; the local sheet neutralizes the adopted button transition; long
  values wrap/select without clipping or page overflow at 390px
  and 200%/400% zoom. Dark, `LightMode`, forced-colors, focus, disabled, copied/manual/failed remain
  perceivable without color alone. Add no component motion; verify the local override leaves the
  adopted button with no transition in normal and reduced-motion modes.
- Default, hover, focused, active, disabled/empty, long, quotes/Unicode, copied, manual, failure,
  repeated/multiple, narrow, forced-colors, default-dark, and `LightMode` stories exist and are
  deterministic; docs list the exact authored `--sk-*` token dependencies.
- Authored behavior/browser/React tests, applicable ADR-11 claims, meaningful mutation arms, all
  ratchets, generated integrations, repository gates, visual comparison, independent Codex review,
  and exact-SHA evidence are complete.
- No static markup module, dossier/provenance/list wrapper, duplicate adjacent primitive, second
  button family, editor, secret handling, toast infrastructure, analytics, command logic, or Team
  Kitty application behavior enters the diff.

## Test-First Sequence

### T001 — Author and demonstrate the red contract

Write focused black-box tests before production behavior. Cover:

- exact Clipboard argument and one call/result for pointer, Enter, and Space;
- property assignment before upgrade for every public property;
- non-empty whitespace and empty exact-string disable/no-operation boundaries;
- label default/blank warning fail-open and default/custom/blank/whitespace-only message overrides;
- secure success plus absent/insecure/non-callable/sync-throw/rejection branches;
- full focus/selection manual fallback, selection verification failure, and no unhandled errors;
- stable status-node identity, per-instance independence, synchronous batched A→B→A invalidation,
  same-value reverse-settlement completion order, and value-change/deferred-promise reset;
- event count/name/flags/frozen exact detail shape/literal typing and absence of any text-bearing key;
- one-tab-stop focus path, browse-readable code, parts, constructable sheet identity/no injected
  `<style>`, `define()` duplicate registration, and no static markup export;
- React first-render properties and `onSkCopyFieldResult` literal narrowing;
- Chromium/Firefox accessibility tree, axe, 390px and real-browser 200%/400% geometry, full
  selection, dark/light,
  forced colors, and reduced motion.

Run the focused test before adding the element and record the expected missing-module/story red. A
runner/setup error is not valid red evidence.

Before any production write, record the read-only evidence aggregate and compare it again in T006:

```sh
find /home/jeroennouws/dev/team-kitty-missions/ux_redesign/repository-dossier -type f -print0 \
  | sort -z | xargs -0 sha256sum | sha256sum
```

The pre-implementation value is
`80b45a56bfd679b46481c9f464dbdf79ba0db28f23cd5578c3a341f0f9bcffb4`. Any differing T006 value
is a C-008 failure, not an artifact to update.

### T002 — Implement the element behavior

Follow nearby element patterns, especially `sk-button` and `sk-notice`, without copying their
unrelated responsibilities. Keep the state machine small and typed. Implement a custom reactive
`value` accessor that synchronously increments a private revision and clears feedback for every
actual change; do not rely on `willUpdate`, which misses batched A→B→A. Snapshot `value` plus the
revision per activation. Cache/call clipboard capability once inside `try`; only fulfillment is
success. On any negative clipboard result, locate the rendered visible code, focus without scroll,
replace selection with a Range spanning the node contents, then verify focus and selected string
before `manual`; otherwise `failed`. Complete one event per attempt. Gate status mutation on the
unchanged snapshot/revision so late completion cannot relabel a new value. Same-revision attempts
use completion order for status.

Use a native button with the exported shared button sheet/class helper, not a nested custom element
or new style family. Render a stable status node every time. Use JSDoc recognized by the manifest
generator, typed `CopyFieldOutcome`/detail exports, `HTMLElementTagNameMap` and event-map precedent,
and `define('sk-copy-field', SkCopyField)`.

### T003 — Implement the authored CSS and exports

Author only token-driven component CSS in `packages/styles`. Adopt the generated copy-field sheet
after the existing button sheet. Make the value cell shrinkable and use pre-preserving wrapping
that breaks long tokens safely. Keep the action operable and page-contained under narrow/zoomed
layouts. Provide readable text/status/focus/disabled state and forced-colors boundaries without
inventing tones or using raw design values. Locally neutralize the adopted button transition with
`transition: none`; add no transition/animation and do not change the shared button stylesheet.

Wire only authored root/package exports required by repository precedent; generator-owned files are
never edited manually. Do not add a markup module/static HTML form.

### T004 — Stories and consumer documentation

Create every required state as an addressable story, including separate default, hover, focused,
active, and disabled/empty states. Deterministically install scoped clipboard and
selection outcomes for result-state stories, without touching the developer clipboard or exposing
consumer value to unrelated listeners. Keep application/domain copy out. Add concise consumer docs
for inputs/event/parts, exactness, manual fallback, JavaScript requirement, non-goals, and the exact
`--sk-*` token dependencies used by the authored stylesheet.

### T005 — Conformance and mutation registries

Map only applicable ADR-11 requirements. Add mutations that genuinely change the behavior under
test and demonstrate the intended test goes red for each configured arm. Cover at minimum event
flags/detail/privacy, reactive/property-before-upgrade, native control/focus/disabled state, parts,
style adoption, and duplicate registration, plus mission-specific negative branches through
ordinary tests where no ADR ID exists. Update expected parts/docs/stories and React type coverage.
Never mint or borrow an inapplicable behavior ID.

### T006 — Generate and verify

Run current repository generators in dependency order: elements CSS, element markup, element
analysis/manifest, React wrappers, Vue types, indexes/ratchets when provided, and size measurement.
Inspect the generated delta and ensure `SkCopyField` wrapper/type outputs preserve all properties
and the literal event union. Run every corresponding freshness/selftest plus focused/full build,
lint, format/type, unit/browser/axe/Storybook/visual/quality/release graph gate required by current
instructions. Record commands, results, environment limitations, and exact SHA honestly.

## Required Verification Record

The runtime reviewer must be able to map every command to the exact lane SHA. The following block is
the single canonical command matrix; record the focused test names/results, browser and visual
states, theme/zoom/forced-color/motion measurements, mutation arms, and any unavailable environment
beside those literal commands. Do not maintain a second command list elsewhere in this WP.

- focused element behavior and React consumer tests;
- changed-scope mutation run and mutation selftests;
- Chromium and Firefox dedicated browser specs;
- Storybook build/render, axe, and required visual run/status;
- dark/`LightMode`, 390px, actual browser-UI 200%/400% zoom, forced-colors, reduced-motion,
  fallback/failure, and no-page-overflow evidence;
- all generator commands and `--check` variants;
- manifest content/freshness, no-CSS-source, entry/adopted-sheet/CSS-hygiene, expected part/doc/story,
  theme wrapper/selftest, wrapper/Vue type/selftests, size report/check, suite selftest;
- Nx builds, lint, format/typecheck, full `npm run test`, quality/security/release gates required by
  the live repository;
- clean git status and exact approved runtime-lane SHA.

Run the repository recipe literally, plus focused package/browser commands discovered while
implementing:

```sh
node scripts/build-elements-css.mjs
node scripts/build-element-markup.mjs
node scripts/build-styles-only-markup.mjs
npx nx run elements:analyze
node scripts/build-react-wrappers.mjs
node scripts/build-vue-types.mjs
npx nx run-many --target=build --projects=tokens,styles,elements
node scripts/measure-elements-sizes.mjs
node scripts/build-elements-css.mjs --check
node scripts/build-element-markup.mjs --check
node scripts/build-styles-only-markup.mjs --check
node scripts/build-react-wrappers.mjs --check
node scripts/build-vue-types.mjs --check
git diff --exit-code -- packages/elements/custom-elements.json
node scripts/measure-elements-sizes.mjs --check
node scripts/check-manifest-content.mjs
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
node scripts/typecheck-all.mjs
npm run quality:all
node scripts/build-react-wrappers.mjs --selftest
node scripts/check-manifest-content.mjs --selftest
node scripts/check-vue-template-types.mjs
node scripts/check-gate-wiring.mjs
node scripts/check-gate-wiring.mjs --selftest
node scripts/check-gate-wiring-defeats.mjs
npx vitest run --project browser fixtures/elements-behaviour/src/sk-copy-field.test.ts fixtures/react-consumer/src/sk-copy-field.test.tsx --reporter=default
npm run test
node scripts/suite-selftest.mjs
node scripts/suite-selftest.mjs --selftest
node scripts/build-storybook-with-budget.mjs
node scripts/run-axe-storybook.js
npx playwright test apps/storybook/src/tests/sk-copy-field.spec.ts apps/storybook/src/tests/sk-copy-field-forced-colors.spec.ts --project=chromium --project=firefox
npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium
npx playwright test
bash scripts/npm-audit-gate.sh
npm run security:lockfile-check
bash scripts/check-action-pins.sh
node scripts/check-release-graph.mjs --selftest
node scripts/check-release-graph.mjs
node scripts/check-vue-packed-types.mjs
node scripts/check-offline-load.mjs --selftest
node scripts/check-offline-load.mjs
find /home/jeroennouws/dev/team-kitty-missions/ux_redesign/repository-dossier -type f -print0 | sort -z | xargs -0 sha256sum | sha256sum
```

For zoom, use a fixed physical window, reset browser UI zoom and zoom to each named level, record
CSS viewport, `devicePixelRatio`, and document scroll/client widths, and do not substitute CSS
zoom, viewport resize, CDP emulation, or pinch/page-scale emulation.

The mission orchestrator owns the later fresh-train rebase, regeneration, accept, PR, and exact-head
review. Those operations must not be performed in or added to this runtime WP lane.

If Safari/WebKit is additionally required only for a release tag, record it separately; the live
issue's acceptance gate explicitly requires Chromium and Firefox. Do not claim a tool/browser ran
unless it completed on the recorded SHA.

## Activity Log

- 2026-09-07T15:21:00Z — codex:planner-priti:planner — Post-tasks findings folded; one six-subtask
  WP retained and validated before implementation claim.
