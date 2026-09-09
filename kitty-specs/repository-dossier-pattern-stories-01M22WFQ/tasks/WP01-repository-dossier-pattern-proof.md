---
work_package_id: WP01
title: Prove the complete Repository Dossier family from public surfaces
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
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- NFR-006
- NFR-007
- NFR-008
- NFR-009
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
- C-012
planning_base_branch: train/elements-first
merge_target_branch: train/elements-first
branch_strategy: Planning artifacts for this mission were generated on train/elements-first. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into train/elements-first unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-repository-dossier-pattern-stories-01M22WFQ
base_commit: 597c054bba2a36f33450493608fb1ec3b99175f6
created_at: '2026-09-09T11:00:00Z'
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
- T008
- T009
- T010
- T011
phase: Phase 1 - Repository Dossier pattern proof
history:
- at: '2026-09-09T11:00:00Z'
  actor: codex
  action: Prompt authored during mission task finalization
agent_profile: frontend-freddy
authoritative_surface: packages/elements/src/patterns/repository-dossier.stories.ts
create_intent:
- packages/elements/src/patterns/repository-dossier.fixture.ts
- packages/elements/src/patterns/repository-dossier.stories.ts
- fixtures/elements-behaviour/src/pattern-repository-dossier.test.ts
- apps/storybook/src/tests/sk-repository-dossier-pattern.spec.ts
- apps/storybook/src/tests/sk-checkbox-choice-group.spec.ts
execution_mode: code_change
model: ''
owned_files:
- packages/elements/src/patterns/repository-dossier.fixture.ts
- packages/elements/tsconfig.lib.json
- packages/elements/src/patterns/repository-dossier.stories.ts
- fixtures/elements-behaviour/src/pattern-repository-dossier.test.ts
- apps/storybook/src/tests/sk-repository-dossier-pattern.spec.ts
- apps/storybook/src/tests/sk-checkbox-choice-group.spec.ts
- apps/storybook/src/tests/visual.spec.ts
- apps/storybook/src/tests/visual.spec.ts-snapshots/sk-repository-dossier-*.png
- expected-stories.json
- docs/design-system/using-components.md
role: implementer
tags:
- pattern
- storybook
- accessibility
- repository-dossier
task_type: implement
tracker_refs:
- '#255'
---

# Work Package Prompt: WP01 — Repository Dossier Pattern Proof

## Do This First: Load Governed Context

Use the Codex agent surface only. Load `frontend-freddy` through the Spec Kitty resolver, then load the action-scoped doctrine context and runtime prompt before editing. Read the checkout's `AGENTS.md`, `CLAUDE.md`, charter, ADRs, component-authoring recipe, and this mission's `spec.md`, `research.md`, `data-model.md`, and `plan.md`. Read the complete approved Repository Dossier evidence pack named in `research.md`, including D1, D2, and D4-D8. Never invoke Claude, Claude Code, Hermes workers, or `/tk`; never hand-edit mission event logs or generator-owned artifacts.

Recheck issue #255 and its comments/linked PRs, epic #253, dependencies #212/#252 and #213, sibling issues #254/#256/#257, open PRs, and the current `origin/train/elements-first` head before implementation and immediately before final verification.

## Outcome and Definition of Done

Ship one Storybook pattern family demonstrating the approved Repository Dossier composition through public surfaces only. The implementation is done when:

- D1 populated desktop dark; D2 narrow closed and open drawer at 390 px; D4 cross-branch; D5 not-Spec-Kitty terminal; D6 one affected mission; D7 indexing; and D8 completed-empty are individually discoverable and non-empty.
- A valid `LightMode` system proof exists, together with long-data, 860/861 px layout-threshold, tracker resilience, forced-colors, reduced-motion, 200%/400% zoom, and 390 px evidence.
- Deeply frozen story fixtures and pure projections own every repeated repository, branch, path, SHA, mission, progress, status, notice, and action-display fact.
- D4's merged fact is supplied, not inferred; D5 has no commit/completed action; D6 uses one identical SHA; D7 has stable busy/live meaning but no unavailable facts/timer/polling; D8 has a real commit and no fabricated zero count/row/progress.
- The D2 drawer uses the public controlled shell seam with correct trigger state, focus entry, Escape dismissal, inert background, and focus return.
- Exact value copying is delegated to `sk-copy-field`, including truthful accessible success/failure feedback.
- Native navigation, lists, links, buttons, code, time, progress, headings, and landmarks remain native where required.
- Focused browser, fixture-consistency, axe, visual, composition, generated, mutation, quality, type, build, Storybook, package, size, and security gates pass after the final train rebase.

## Scope Boundaries

Compose the merged public surfaces: `sk-app-shell` compact navigation; native `.sk-context-nav`; `sk-copy-field`; `sk-action-row` supporting region; breadcrumbs, prose, timeline, check-bullet and detail primitives; `sk-card`; `sk-notice`; `sk-status-indicator`; native `.sk-facts`, `.sk-data-table`, `.sk-empty-state`, `.sk-progress`; and other already-exported components needed by the approved hierarchy.

Do not create `sk-mission-row`, `sk-repository-dossier`, a truth/provenance band, a collection wrapper, or duplicate progress, breadcrumb, prose, notice, card, empty-state, branch-chip, tracker, status, or copy components. Do not add Team Kitty routing, stores, repository discovery, polling, truth inference, timestamp/progress calculation, or command execution. Do not reach into shadow/private roots or restyle component-owned internals.

All pattern classes use the `sk-repository-dossier-pattern` BEM block and public tokens. Keep story-only rendering inside `.stories.ts`; add no manifest, wrapper, package export, or runtime page API. Viewport and media settings may be test/story inputs; they are not authored design tokens.

## Subtasks

### T001 — Establish the failing contract

Create the focused Storybook Playwright suite before the story implementation. Record a failure caused by the missing story/surface, not infrastructure. Cover exact story names, non-empty roots, the required public tags/native families, forbidden custom tags/private reach/application behavior, and the state-specific fixture/omission invariants.

### T002 — Build immutable fixtures and pure projections

Define readonly story-domain types, a recursive deep-freeze helper, and frozen fixtures for all approved and resilience states. List non-story exports in `meta.excludeStories`. Projection helpers may select/reconcile supplied display fields but must not fetch, route, poll, execute, infer merge truth, calculate timestamps, or calculate repository progress. Assert recursive freezing and all validity rules from `data-model.md`.

### T003 — Compose D1 and D2

Compose D1 using current public shell/header/navigation, cards/notices/actions/copy/status/progress/detail surfaces and native markup. For D2 use the controlled `sk-app-shell` compact presentation at 390 px. The visible trigger owns `aria-expanded`; dismiss updates story-local state; first focus enters correctly; Escape closes; the background is inert; focus returns; closed drawer content creates no tab stops. Do not introduce routing or a duplicate navigation model.

### T004 — Compose D4 and D6

D4 renders distinct inspected/default branches and the supplied merged fact with exact copyable values. D6 renders the one supplied snapshot SHA, warning, and affected mission through existing action-row supporting/status surfaces. Do not infer merge state or add a Dossier-specific status wrapper.

### T005 — Compose D5, D7, and D8

D5 is terminal not-Spec-Kitty guidance with no commit fact or completed-only action. D7 is indexing with a stable notice/live region and busy semantics, no unavailable repository facts, timers, polling, or animation-dependent meaning. D8 is completed with a real commit and setup guidance, no mission rows, and no zero count/progress surrogate.

### T006 — Add system resilience proofs

Add a valid `.sk-light` `LightMode` story without claiming D3 approval. Add dedicated stories or focused test modes for long opaque values, the 860/861 px compact-navigation seam, safe/unsafe/absent tracker destinations, 390 px containment, 200%/400% zoom equivalents, forced colors, and reduced motion. Exact copy values remain intact; local code/data overflow is allowed where appropriate, but page-level horizontal overflow is not.

### T007 — Register and document

Add every exported story ID to `expected-stories.json` in its established format and non-story exports to `meta.excludeStories`. Update `docs/design-system/using-components.md` with the pattern's public composition recipe and explicit application-owned data/routing/inference/execution boundary. Do not expose a runtime Dossier component. Use repository tooling for all generated outputs.

### T008 — Complete focused executable evidence

Test every state and invariant in repository-supported Chromium and Firefox configurations. Verify native semantics, real keyboard order/activation, one source for repeated values, drawer behavior, copy success/failure, tracker destination fallbacks, busy/live behavior, conditional omissions, the 860/861 px seam, long-data containment, zoom, theme parity, forced-colors visibility, reduced-motion behavior, and no page-level overflow. Tests may inspect public/light DOM and accessibility state, but not use private roots to implement or restyle the pattern.

### T009 — Produce and review visual evidence

Register a focused visual matrix for D1, D2 closed/open, D4-D8, LightMode, long data, 860/861 px layout thresholds, tracker resilience, forced colors, and reduced motion. Generate baselines only through Playwright. Compare D1, D2, and D4-D8 individually with their approved images, then review spacing, hierarchy, state differentiation, and responsive continuity across the complete family. Record discrepancies and fix material findings before baseline approval.

### T010 — Run full gates

Run the focused suite followed by every current repository-required lint, format, type, build, Storybook, axe, browser, visual, mutation/self-test, composition/self-test, generated-artifact, ratchet, package, size, security, and local gate. Do not weaken tests, hand-edit generated output, accept unrelated snapshot churn, or report skipped/unavailable checks as passing.

### T011 — Rebase and exact-head handoff

Fetch `origin`, recheck all dependencies and target movement, then rebase the lane onto current `origin/train/elements-first`. Resolve generated overlap from authored sources and regenerate. Rerun all applicable verification on the exact final commit. Return a clean lane, requirement evidence map, final head SHA, commands/results, and visual ledger for independent Codex review. Do not merge or close issues from the implementation seat.

## Definition of Done

- All FR/NFR/constraint and SC obligations are backed by executable or reviewable evidence on one final SHA.
- Every approved state plus required system proofs is independently discoverable, non-empty, axe-clean, and composed solely from public surfaces and native semantics.
- Fixture truth and omissions are consistent; copy/drawer behavior is real; no forbidden component or Team Kitty application behavior exists.
- Visual baselines are generated and reviewed on the exact final head after the latest-train rebase.
- The full repository gate set passes and the lane is clean for independent Codex review.
