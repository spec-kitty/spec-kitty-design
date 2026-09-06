---
work_package_id: WP02
title: sk-card's forced-colors claim becomes an assertion, and the inert CSS block goes
dependencies: []
requirement_refs:
- FR-004
- FR-005
- NFR-003
planning_base_branch: mission/gate-wiring-shell-shape
merge_target_branch: mission/gate-wiring-shell-shape
branch_strategy: Planning artifacts for this mission were generated on mission/gate-wiring-shell-shape. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/gate-wiring-shell-shape unless the human explicitly redirects the landing branch.
subtasks:
- T005
- T006
- T007
phase: Phase 2 - the card
history:
- at: '2026-09-06T19:45:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: ''
authoritative_surface: packages/styles/src/card/sk-card.css
create_intent: []
owned_files:
- packages/styles/src/card/sk-card.css
- packages/elements/src/card/sk-card.css.js
- packages/elements/src/card/sk-card.stories.ts
- apps/storybook/src/tests/elements-load.spec.ts
execution_mode: planning_artifact
model: ''
tags: []
tracker_refs: []
---

# Work Package Prompt: WP02 – sk-card forced colors

Closes #218. See `plan.md` §3.

## T005 — FR-005: remove the inert `@media (forced-colors: active)` block

Both declarations are no-ops. Rewrite the comment in place so it states the real mechanism — the
4px inline-start step set outside any media query, on a property forced colors never touches.
Regenerate the adopted CSS module cache-free (`--skip-nx-cache`).

## T006 — the story stops being a duplicate render

`ForcedColors` keeps its id (`elements-skcard--forced-colors`); its render gains the base card the
claim is a comparison against. `expected-stories.json` is NOT touched (NFR-003).

## T007 — FR-004: the assertion

A Playwright case in `apps/storybook/src/tests/elements-load.spec.ts`, beside the `sk-action-row`
precedent: `emulateMedia({ forcedColors: 'active', colorScheme })` for both schemes; assert the
status card's inline-start border is strictly wider than the base card's, unconditionally; assert
the tone collapse only where the feature engaged, with a Chromium floor so the assertion is never
vacuous.

## Definition of done

- The test fails if the widened edge stops being wider.
- No file under `packages/*/src/notice/**`, `expected-stories.json` or the token catalogue changes.
