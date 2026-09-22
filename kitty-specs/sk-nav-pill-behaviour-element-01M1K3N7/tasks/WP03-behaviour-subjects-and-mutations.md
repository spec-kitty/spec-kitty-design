---
work_package_id: WP03
title: Behaviour subjects, the tests, and the mutations that make them load-bearing
dependencies:
- WP02
requirement_refs:
- FR-010
- FR-012
planning_base_branch: mission/sk-nav-pill-behaviour-element
merge_target_branch: mission/sk-nav-pill-behaviour-element
branch_strategy: Planning artifacts for this mission were generated on mission/sk-nav-pill-behaviour-element. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/sk-nav-pill-behaviour-element unless the human explicitly redirects the landing branch.
subtasks:
- T008
- T009
- T010
phase: Phase 3 - Verification
history:
- timestamp: '2026-09-03T08:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: behaviours.json
create_intent:
- fixtures/elements-behaviour/src/sk-nav-pill.test.ts
execution_mode: code_change
owned_files:
- behaviours.json
- mutations.json
- scripts/floor-reporter.mjs
- fixtures/elements-behaviour/src/sk-nav-pill.test.ts
tags: []
tracker_refs: []
---

# WP03 — Tests that cannot be deleted for free

**This is the highest-value work package in the mission, and the most fakeable.**

`scripts/floor-reporter.mjs` checks that every id in `behaviours.json` is covered. The synthetic
`sk-behaviour-fixture` already covers **every id this mission asserts** — SC-006 through SC-012.
So a `sk-nav-pill.test.ts` full of real assertions could be deleted in its entirety and the gate
would stay **green**. That is this programme's certifying-absence class, now at ten occurrences,
and it would land inside the work package written to prevent it.

## Subtasks

- **T008** — Give `behaviours.json` entries a `subjects` list, and make `floor-reporter.mjs`
  check coverage per **(id, subject)** rather than per id.

  A `subjects` field the reporter *reads but does not enforce* is worse than none, because the
  next reader believes it — the same failure ADR-9's consequences name about depConstraints, and
  the one #71 recorded about `tsconfig.base.json`'s empty `paths`. **The reporter's own change
  needs a red-first proof**, independent of the tests it guards: remove one subject's coverage
  and watch the floor fail.

  Existing entries keep the fixture as a subject. Nothing about the fourteen current mutations
  may change — that is the property the pre-merge squad should check first.

- **T009** — `fixtures/elements-behaviour/src/sk-nav-pill.test.ts`, covering, against the real
  element:
  - **SC-006** fires exactly once per change, and not at all on a non-change.
  - **SC-007** the documented `detail` shape.
  - **SC-008** `composed` and `bubbles` as documented.
  - **SC-009** `preventDefault()` demonstrably prevents. **Assert the state, not the event.**
    `expect(evt.defaultPrevented)` proves the listener called the method; it does not prove the
    element honoured it. Assert the panel did not open and `open` still reports `false`.
  - **SC-010** a property assigned before the definition loads is applied on upgrade. The own
    property shadows the accessor unless the element deletes and re-applies it.
  - **SC-012** Escape closes, focus returns to the recorded invoker, `aria-expanded` tracks state.

- **T010** — One mutation per new test in `mutations.json`, each proving its **named** test goes
  red with no collateral. `node scripts/suite-selftest.mjs` must report every mutation producing
  its named red against a green baseline, at the new larger count.

  Write the mutation that deletes `sk-nav-pill.test.ts` wholesale as well (SC-106): with T008 it
  must fail the floor, and without T008 it would not. That mutation is the proof FR-010 exists.

## Definition of Done

- `npx vitest run` green, zero skipped, both lanes non-empty.
- `node scripts/suite-selftest.mjs` green at the new count, every mutation named.
- Deleting `sk-nav-pill.test.ts` fails the floor reporter — demonstrated, not argued.
- The fourteen pre-existing mutations are unchanged.
