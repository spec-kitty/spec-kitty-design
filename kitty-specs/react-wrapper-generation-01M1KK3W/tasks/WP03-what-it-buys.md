---
work_package_id: WP03
title: What the wrapper actually buys, proven in a real render
dependencies:
- WP02
requirement_refs:
- FR-005
- FR-006
- NFR-003
planning_base_branch: mission/react-wrapper-generation
merge_target_branch: mission/react-wrapper-generation
branch_strategy: Planning artifacts for this mission were generated on mission/react-wrapper-generation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/react-wrapper-generation unless the human explicitly redirects the landing branch.
subtasks:
- T007
- T008
- T009
phase: Phase 3 - Evidence
history:
- timestamp: '2026-09-03T13:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: fixtures/react-consumer/src/wrappers.test.tsx
create_intent:
- fixtures/react-consumer/src/wrappers.test.tsx
- fixtures/react-consumer/package.json
- fixtures/react-consumer/tsconfig.json
- fixtures/react-consumer/project.json
execution_mode: code_change
owned_files:
- fixtures/react-consumer/src/wrappers.test.tsx
- fixtures/react-consumer/package.json
- fixtures/react-consumer/tsconfig.json
- fixtures/react-consumer/project.json
- vitest.config.mts
tags: []
tracker_refs: []
---

# WP03 — SC-305 is the point of this mission, and it may come back negative

The issue is explicit: **"no package needed — the manifest sufficed" is a legitimate outcome and
must be allowed to be the finding.** React 19 already scores 16/16 on Custom Elements Everywhere
for basic AND advanced interop. This WP produces the evidence for a defensible answer, not for a
predetermined one.

## What the spike already established

| claim | measured |
|---|---|
| typed refs | **yes** — `ref?: React.Ref<SkFormInputElement>`, so `ref.current.setCustomError(…)` typechecks |
| typed props | **yes** for properties — `description?: SkFormInputElement["description"]` etc. |
| **typed events** | **NO** — `onSkNavPillToggle?: (event: CustomEvent) => void`, with no detail generic |
| protected members filtered | **yes** — `internals`, `validate`, `upgradeProperty` do not surface |
| SSR / RSC | untested; a custom element has no server rendering |

**The event gap is the sharp one.** JSX-level typing is the wrapper's entire value proposition,
`sk-nav-pill`'s `@fires` documents `detail: { open: boolean }`, and the generated handler
receives an untyped `CustomEvent`. That is precisely the ergonomics a wrapper exists to provide.

## Subtasks

- **T007** — `fixtures/react-consumer/`, a node/browser fixture with React as a **devDependency
  of the fixture only** (NFR-003 — it must not reach `@spec-kitty/elements`). Wired into
  `vitest.config.mts`; the floor reporter will require the lane to execute.

- **T008** — Two real renders, because typechecking is not evidence of behaviour:
  - **SC-306** — `sk-nav-pill`'s event reaches a React handler. The ONE element that exercises
    the event path at all.
  - **SC-307** — a form-associated wrapper submits inside a React `<form>`.

- **T009** — **Answer SC-305 in writing, with the table above plus whatever T008 adds**, and put
  it somewhere a reader will find it — the PR body and `docs/design-system/`, not only a commit
  message. State what the wrapper buys, what it does not, and whether the event-detail gap is
  worth closing here (post-process the output), upstream (an issue on the generator), or not at
  all. **A negative or partial answer is a valid outcome and must not be dressed up.**

## Definition of Done

- Both renders green in CI, in a lane the floor reporter asserts executed.
- SC-305 answered with evidence, in a durable location, including what is NOT bought.
- React appears in no `dependencies` of `@spec-kitty/elements` — asserted, not assumed.
