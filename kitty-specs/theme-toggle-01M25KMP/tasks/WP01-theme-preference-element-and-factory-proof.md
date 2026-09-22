---
work_package_id: WP01
title: Theme preference element, pre-paint contract, and Factory proof
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
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
planning_base_branch: mission/theme-toggle
merge_target_branch: mission/theme-toggle
branch_strategy: Planning artifacts for this mission were generated on mission/theme-toggle. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/theme-toggle unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
- T008
phase: Phase 1 - bounded delivery
history:
- at: '2026-09-10T12:45:00Z'
  actor: system
  action: Prompt generated via the runtime tasks step
agent_profile: frontend-freddy
authoritative_surface: packages/elements/src/theme-toggle/theme-preference.ts
create_intent:
- packages/elements/src/theme-toggle/
- packages/elements/src/theme-toggle/theme-preference.ts
- packages/styles/src/theme-toggle/
- fixtures/elements-behaviour/src/sk-theme-toggle.test.ts
- apps/storybook/src/tests/sk-theme-toggle.spec.ts
- scripts/build-theme-bootstrap.mjs
- packages/elements/theme-bootstrap.js
execution_mode: planning_artifact
model: ''
owned_files:
- packages/elements/src/theme-toggle/theme-preference.ts
- packages/elements/src/theme-toggle/
- packages/styles/src/theme-toggle/
- packages/elements/src/patterns/operational-status.ts
- packages/elements/src/patterns/operational-status.stories.ts
- packages/elements/src/index.ts
- packages/elements/src/elements.ts
- packages/elements/package.json
- packages/elements/theme-bootstrap.js
- packages/elements/custom-elements.json
- packages/elements/vue.d.ts
- packages/react/src/
- packages/react/type-tests/
- fixtures/elements-behaviour/src/sk-theme-toggle.test.ts
- fixtures/elements-behaviour/src/pattern-operational-status.test.ts
- apps/storybook/src/tests/sk-theme-toggle.spec.ts
- apps/storybook/src/tests/visual.spec.ts
- scripts/build-theme-bootstrap.mjs
- behaviours.json
- mutations.json
- expected-docs.json
- expected-parts.json
- expected-stories.json
- packages/elements/SIZES.md
- docs/design-system/using-components.md
- docs/architecture/validation/issue-323-theme-toggle/
role: implementer
tags:
- elements
- accessibility
- theme
- storybook
task_type: feature
tracker_refs:
- spec-kitty/spec-kitty-design#323
- spec-kitty/spec-kitty-design#183
- spec-kitty/spec-kitty-design#93
- spec-kitty/factory-dashboard#14
---

# Work Package Prompt: WP01 — Theme preference element and Factory proof

## Goal

Deliver the complete `sk-theme-toggle` public contract as one reusable elements-first component: native three-state semantics, shared persistent resolver, generated pre-paint bootstrap, root theme application, safe lifecycle, generated distribution surfaces, and a mechanically truthful Factory-pattern composition. This is the mission's only WP because none of those surfaces is independently releasable without the others.

## T001 — Establish red-first, discriminating tests

Before production implementation:

- add contract and browser tests for every scenario in spec User Stories 1–4;
- add ADR-11 behavior entries and one red-first mutation for each new behavior subject;
- cover exact preference values, invalid/missing/throwing storage, system light/dark, opposing manual overrides, return to System, live OS change, manual-mode immunity, reload/reattach persistence, root `data-theme`, root `color-scheme`, listener counts/cleanup, SSR import, labels/radio semantics/keyboard operation, textual state, forced colors, no-JS degradation, bootstrap ordering/parity, luminance, AA contrast, responsive/zoom, story isolation, composition boundaries, manifest content, and wrapper typing;
- run the narrow new tests before production files exist and record command, failing assertions, starting SHA, and why the failure is behavioral (not syntax/setup) in `kitty-specs/theme-toggle-01M25KMP/implementation-evidence.md`.

No tautological presence-only assertion is accepted. A light/dark proof must fail if the same palette renders twice.

## T002 — Implement one DOM-free resolver contract

Create the plan's AD-02 contract as the sole authority for:

- `system | light | dark` and `light | dark` types;
- the documented key `spec-kitty-theme`;
- stored-value validation and System fallback;
- safe read/write behavior;
- system resolution;
- root `data-theme` and matching `color-scheme` application through supplied capabilities.

No import-time DOM global is allowed. The bootstrap and element must import this module rather than copy constants or branching rules.

## T003 — Implement accessible markup, styles, and element lifecycle

- Use a labelled native radio group/fieldset for three mutually exclusive values; never `role="switch"`.
- Make visible group/option labels consumer-supplied and localizable; render no unauthorized consumer-visible fallback literal.
- Apply token-only CSS, visible text/programmatic selection, preserved outline/border affordances, forced-colors-safe behavior, narrow-width reflow, 200% zoom, and reduced-motion handling only if a transition is introduced.
- Implement safe connect/disconnect, initial resolve, persistence of all three values, exactly one System listener, cleanup on manual mode/disconnect, and legacy/absent matchMedia fallback.
- Keep the public element free of Factory vocabulary/state and document any event with typed `@fires` metadata.

Follow the current component recipe for authored markup and safe static/no-JS form. If the generator cannot emit a non-misleading static representation from one authored source, record the exact limitation instead of hand-authoring output or shipping inert controls.

## T004 — Generate the pre-paint bootstrap from the contract

Author a tiny entry importing T002 and a generator that emits the classic-script bootstrap asset with normal, `--check`, and `--selftest` behavior. Export/package the generated artifact and document copying its generated contents inline into `<head>` before stylesheets. Tests must show parity with T002 for every input/failure case and assert ordering. There must be no second storage key or resolver algorithm.

## T005 — Extend the generic Factory composition

Extend the #259 operational-status lineage using only public APIs/tokens:

- include `sk-theme-toggle`, operationally toned `sk-card` examples, and `.sk-facts`;
- introduce no Factory-specific public type, label, route, auth, refresh, queue, job, or agent state;
- preserve existing #259 coverage;
- add Default/dark, LightMode, System-light, System-dark, manual-light, manual-dark, grayscale, forced-colors, narrow, and 200%-zoom evidence;
- snapshot and restore root attributes/styles, the storage entry, and mounted listeners/elements around every story.

Assert root `data-theme`, mutually exclusive computed luminance, and AA foreground/background contrast for both themes. A nested `.sk-light` or `<div data-theme>` is not root-resolution evidence.

## T006 — Generate all distribution artifacts

Run repository generators from authored sources for:

- adopted CSS modules;
- element static markup and styles barrel when applicable;
- Custom Elements Manifest;
- React wrappers/barrels and type tests;
- Vue declarations;
- public elements entries;
- Storybook ratchets;
- package exports/release graph;
- size records and bootstrap asset.

Never hand-edit a generated wrapper, manifest, barrel, static file, or size report. Regenerate again after the final train rebase.

## T007 — Document and verify the public contract

Update current component usage documentation with:

- exact values and `spec-kitty-theme` key;
- consumer-supplied labels and three-choice semantics;
- head-before-stylesheet bootstrap installation;
- JavaScript, localStorage, and matchMedia degradation;
- forced-colors behavior;
- Factory Dashboard #14 remaining consumer integration;
- explicit #93 overlap boundary.

Keep the operator log and red-first/gate evidence current.

## T008 — Focused then complete gates

Run focused new Vitest, ADR-11 behavior, and Storybook Playwright tests first. Then run every applicable exact-HEAD command listed in `plan.md#gate-inventory`, including quality/type, all generator drift/self-tests, manifest/entry/public-contract/ratchet/composition checks, Storybook build, axe, full Playwright, Chromium visual regression with inspected diffs, Chromium+WebKit behavior/mutation self-tests, release/offline/size/demo gates, security/lockfile/action pins, and commitlint.

Do not hide skips or flakes. Reproduce suspected base failures against `origin/train/elements-first` when feasible. Do not use snapshot updates as visual acceptance.

## Constraints

- No new color token, palette, dependency, arbitrary theme, server/account/cross-tab sync, or Factory application feature.
- Do not edit or close the two remaining #93 wrappers unless a direct #323 requirement proves the smallest shared change necessary.
- Generated artifacts come only from repository generators.
- Keep one WP and one PR into `train/elements-first`.
- Implementation cannot approve itself; reviewers are read-only and review the exact HEAD.

## Definition of done

- Every FR, NFR, and constraint in `spec.md` maps to an implementation/test/document artifact with no silent deviation.
- Red-first evidence is durable and ADR-11 mutations re-derive each new behavior claim.
- The element, pre-paint artifact, and Factory proof meet the exact semantic, lifecycle, accessibility, no-JS, forced-colors, isolation, luminance, and contrast contracts.
- Generated artifacts regenerate byte-identically and package/type/export/size checks pass.
- Focused and full repository gates pass on a branch rebased onto latest `origin/train/elements-first`.
- The synchronous `for_review` transition gate finishes successfully.
- A fresh independent Codex reviewer approves WP01 through the deterministic event-log seam; no unresolved Medium or High finding remains.
