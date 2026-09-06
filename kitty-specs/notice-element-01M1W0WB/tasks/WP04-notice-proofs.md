---
work_package_id: WP04
title: Proofs — behaviour tests, the forced-colors measurement, and the React type contract
dependencies:
- WP02
- WP03
requirement_refs:
- FR-019
- FR-020
- NFR-005
authoritative_surface: fixtures/elements-behaviour/src/sk-notice.test.ts
create_intent:
- fixtures/elements-behaviour/src/sk-notice.test.ts
- apps/storybook/src/tests/sk-notice-forced-colors.spec.ts
execution_mode: code_change
model: ''
owned_files:
- fixtures/elements-behaviour/src/sk-notice.test.ts
- apps/storybook/src/tests/sk-notice-forced-colors.spec.ts
- packages/react/type-tests/wrappers.type-test.tsx
planning_base_branch: mission/notice-element
merge_target_branch: mission/notice-element
branch_strategy: Planning artifacts for this mission were generated on mission/notice-element. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/notice-element unless the human explicitly redirects the landing branch.
subtasks:
- T010
- T011
- T012
phase: Phase 4 - the proofs
history:
- at: '2026-09-06T18:00:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
tags: []
tracker_refs: []
---

# WP04 — the proofs

## T010 — behaviour tests

`fixtures/elements-behaviour/src/sk-notice.test.ts`. Marked tests for every id the element claims:
SC-006, SC-007, SC-008, SC-009, SC-010, SC-011, SC-012, SC-013, SC-014. Guard 4 requires the
`[SC-NNN]` marker on the test a mutation must red.

**Unmarked, and deliberately so** — the announcement tests. ADR-11 has no id for "a live region
re-announces a changed message", `config-contract.test.ts` asserts the applicable id set equals
ADR-11's list exactly, and minting one would extend the behaviour set #67 owns. This is the fifth
time the programme has reached that boundary (#140, #143, #77, #177) and the answer is the same: the
coverage is real and held by an ordinary test. Record it in `mutations.json`'s `$comment`.

The tests that matter most:

- the live-region node carrying the role exists **before** any message is assigned;
- `announce="off"` renders no `role="alert"`/`role="status"` node at all;
- **a changed message with no tone change reaches the live region** — the red is a stale message;
- the live-region node is the **same node object** across a message change, a tone change, and both
  together — identity, not structure;
- keyboard dismissal, the typed detail, cancelation abandoning the focus move, and the focus
  destination.

## T011 — the forced-colors measurement

A Playwright spec under `apps/storybook/src/tests/` using `page.emulateMedia({ forcedColors: 'active' })`
that compares the computed `border-inline-start-width` against the normal-mode value and requires
them to **differ**. This is what distinguishes a load-bearing forced-colors block from the
present-but-inert one a sibling mission shipped. Do not assert only the colour: `border` colours are
remapped automatically, so a colour-only assertion passes with the block deleted.

## T012 — the React type contract

Extend `packages/react/type-tests/wrappers.type-test.tsx` with the three-part pattern #177
established: a positive JSX use, two `@ts-expect-error` negatives (a wrong literal and an
`as string` widening), and **mutual assignability in both directions** against `StatusIndicatorTone`.
`any` would satisfy the assignability half but would make the `@ts-expect-error` directives unused,
which tsc reports as an error in its own right — neither half proves it alone.

The dismiss event detail gets the same treatment: a typed handler, and an `@ts-expect-error` on a
wrong field of the detail, proving it is not a bare `CustomEvent`.
