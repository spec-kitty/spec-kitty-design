---
work_package_id: WP01
title: Ten-lane pattern and proof
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
- NFR-010
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
planning_base_branch: mission/mission-kanban-ten-lane-pattern-extension
merge_target_branch: mission/mission-kanban-ten-lane-pattern-extension
branch_strategy: Planning artifacts for this mission were generated on mission/mission-kanban-ten-lane-pattern-extension. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/mission-kanban-ten-lane-pattern-extension unless the human explicitly redirects the landing branch.
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
phase: Phase 1 - The mission's only Work Package
history:
- at: '2026-09-11T13:30:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: packages/elements/src/patterns/
create_intent:
- packages/elements/src/patterns/mission-kanban-ten-lane.stories.ts
- apps/storybook/src/tests/sk-mission-kanban-ten-lane-pattern.spec.ts
execution_mode: code_change
model: ''
owned_files:
- packages/elements/src/patterns/mission-kanban-ten-lane.stories.ts
- apps/storybook/src/tests/sk-mission-kanban-ten-lane-pattern.spec.ts
- apps/storybook/src/tests/visual.spec.ts
- apps/storybook/src/tests/visual.spec.ts-snapshots/mission-kanban-ten-lane-*.png
- expected-stories.json
role: implementer
tags: []
task_type: implement
tracker_refs:
- '#395'
- '#276'
---

# Work Package Prompt: WP01 – Ten-lane pattern and proof

## Objective

Extend the Mission Kanban pattern family with a Storybook-only ten-lane projection over #278's
immutable fixture, and prove it. Read `spec.md` and `plan.md` in this mission first; they are the
contract. This prompt lists the order of work and the traps.

## Boundaries (do not cross)

- Do **not** edit `packages/elements/src/patterns/mission-kanban.stories.ts`,
  `apps/storybook/src/tests/sk-mission-kanban-pattern.spec.ts`, #278's visual cases or PNGs, or the
  existing `mission-kanban-pattern` ratchet entry. Import the base fixture and freeze helpers; do not
  copy them.
- No custom element, export, wrapper, token, preview change, or generated-artifact change.
- No `addEventListener`, `@click`/`@change`, `setTimeout`, `setInterval`, `requestAnimationFrame`,
  `fetch`, storage, `history`, shadow-root reach, or exported overflow helper.
- Every visible or accessible string comes from the base or extension fixture.
- Pattern CSS: own `sk-mission-kanban-ten-lane-pattern*` classes, recorded parts only, `--sk-*`
  tokens, logical properties; system colours only inside `forced-colors: active`.
- Commit messages: scopes are limited to `tokens storybook doctrine ci docs release deps security
  styles elements react acceptance merge team-overview`; `specs`, `spec-kitty`, `test` are NOT
  scopes. Use `feat(storybook):`, `test(storybook):`, or unscoped `docs:`. Headers ≤ 100 chars.

## Subtasks

1. **T001** — Record `origin/train/elements-first` head. Build Storybook and run
   `sk-mission-kanban-pattern.spec.ts` (Chromium) green as the preservation baseline. Add the
   catalogue test first and see it fail.
2. **T002** — Extension fixture, guards, projection, guard proof (plan PD-002, PD-003).
3. **T003** — Board-region ref (plan PD-006). The `MutationObserver` must not observe `attributes`.
4. **T004** — Render composition and CSS (plan PD-004, PD-005, PD-007, PD-008).
5. **T005** — Eleven stories, `play` invariants, `excludeStories`.
6. **T006 / T007** — Focused suite (plan "Focused acceptance strategy"). Reveal focus by keyboard
   only; never pre-scroll with script. Measure the ±1 px threshold from the rendered fit width.
7. **T008** — Read ids from the built `index.json`; add the key, a `$comment` line, and the total.
8. **T009** — Append the visual block; baselines come from CI's `visual-regression-diffs` artifact,
   never a local `--update-snapshots`.
9. **T010** — Rebase, re-run gates, prove zero generated/public/#278 delta, draft the PR evidence.

## Local verification traps

- Build Storybook before any Playwright run; specs serve `storybook-static`, not the working tree.
- Run Playwright with `STORYBOOK_PORT=6395` so a sibling checkout's server on 6006 is never reused.
- WebKit cannot launch on the development host; CI is the WebKit authority.
- `nx` may serve cached builds; pass `--skip-nx-cache` before any `--check` that reads a build.

## Definition of done

Every FR/NFR/C in `spec.md` has evidence at the PR head; CI is green on that head; the twelve
baselines were harvested from CI and inspected; the ten #278 baselines and every generated surface
are byte-identical to the train.
