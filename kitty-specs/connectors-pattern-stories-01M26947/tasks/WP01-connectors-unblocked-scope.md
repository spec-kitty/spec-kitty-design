---
work_package_id: WP01
title: Connectors pattern stories - prove the unblocked C1-C4 scope, record the rest as blocked
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
- FR-023
- FR-024
- FR-025
- FR-026
- FR-027
- FR-028
- FR-029
- FR-030
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
- C-012
- C-013
- C-014
planning_base_branch: mission/connectors-pattern-stories
merge_target_branch: mission/connectors-pattern-stories
branch_strategy: Planning artifacts for this mission were generated on mission/connectors-pattern-stories. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/connectors-pattern-stories unless the human explicitly redirects the landing branch.
base_branch: mission/connectors-pattern-stories
base_commit: 54666c850e58263873acb11c9c851092280753ef
created_at: '2026-09-10T19:00:00Z'
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
phase: Phase 1 - Connectors pattern proof (unblocked scope)
history:
- timestamp: '2026-09-10T19:00:00Z'
  agent: system
  action: WP authored by hand following the repository-dossier-pattern-stories precedent, per instruction that spec-kitty tasks --json overwrites hand-authored tasks.md prose
authoritative_surface: packages/elements/src/patterns/connectors.stories.ts
create_intent:
- packages/elements/src/patterns/connectors.fixture.ts
- packages/elements/src/patterns/connectors.stories.ts
- apps/storybook/src/tests/sk-connectors-pattern.spec.ts
execution_mode: code_change
owned_files:
- packages/elements/src/patterns/connectors.fixture.ts
- packages/elements/src/patterns/connectors.stories.ts
- apps/storybook/src/tests/sk-connectors-pattern.spec.ts
- expected-stories.json
- docs/design-system/using-components.md
tags: []
tracker_refs: []
---

# Work Package Prompt: WP01 - Connectors pattern stories, unblocked scope

## Scope for this pass

Compose C1 (setup index), C2 (operating index), C3 (provider handoff), and C4 (GitHub App setup
failure) from public `@spec-kitty/elements`/`@spec-kitty/styles` surfaces already on the train, one
internally consistent immutable fixture family, and pure projections. Assert the truth boundaries
reachable from that scope. Carry T008-T011 (C5, the C6/C7/C8/C9a Installation Detail family, C9b,
and the full-family delivery/baseline step) as explicit, unstarted, blocked subtasks of this same
WP — see `tasks.md` and `research.md`'s "Dependency reconciliation" section for exactly what each is
blocked on and why.

## What "done" means for this pass

- `packages/elements/src/patterns/connectors.fixture.ts` — fixture types, one deep-frozen fixture
  instance, pure projection/selector functions for C1-C4, and fixture-consistency invariant helpers.
- `packages/elements/src/patterns/connectors.stories.ts` — Storybook `Meta`/`StoryObj` exports for
  C1-C4 only, composed from public elements/styles, with pattern-owned token-only layout CSS.
- A focused test file asserting the reachable truth boundaries (FR-011, FR-012, FR-014, FR-018) and
  fixture-consistency invariants (FR-017, FR-020-FR-023 where testable against C1-C4).
- `node scripts/check-pattern-composition.mjs --selftest` and the non-selftest form both green.
- `expected-stories.json` (or whichever story ratchet the repo's tooling names) updated for the new
  C1-C4 stories only.
- No visual baseline PNG committed. No CSS, markup, or behavior copied from #331, #341, #339, or any
  other unmerged branch or working tree.
- T008-T011 remain visibly unstarted in `tasks.md` — this WP does not close, and no PR opens, until
  they land too (#338's one-WP-one-PR rule).

## Do not

- Render, compose, or fixture-project C5, C6, C7, C8, C9a, or C9b beyond data-shape groundwork in
  the shared fixture that composes nothing missing.
- Shoot or commit any visual baseline (`apps/storybook/src/tests/visual.spec.ts-snapshots/`) this
  pass — baselines are CI-authoritative and are harvested by the orchestrator later.
- Push, open a PR, run the pre-merge adversarial squad, self-approve, write an ADR, or touch any
  other checkout.
