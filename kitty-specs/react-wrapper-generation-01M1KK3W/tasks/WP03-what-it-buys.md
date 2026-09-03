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
- behaviours.json
- package.json
- package-lock.json
- fixtures/react-consumer/package.json
- fixtures/react-consumer/tsconfig.json
- fixtures/react-consumer/project.json
- vitest.config.mts
tags: []
tracker_refs: []
---

# WP03 — SC-305 is the point of this mission, and it may come back negative

The issue is explicit: **"no package needed — the manifest sufficed" is a legitimate outcome and
must be allowed to be the finding.** React 19 scores 16/16 on Custom Elements Everywhere for
basic *and* advanced interop — a lens re-fetched the site on 2026-09-03 and confirmed it, so the
one load-bearing external claim in this mission is sound.

## What the spike established, corrected by the squad

| claim | measured |
|---|---|
| typed refs | yes — `ref?: React.Ref<SkFormInputElement>` — but **asserted by nothing** until WP02 T009 |
| typed props | yes for properties |
| typed events | **NO** off the shelf — **but the cause is our JSDoc, and WP01 T004 fixes it in one line** |
| protected members filtered | yes, exactly |
| SSR / RSC | **now decided in WP02 T008**, no longer "untested" |

**The event gap moved, and that changes SC-305's answer.** The first draft called the untyped
`onSkNavPillToggle` the sharpest argument for a wrapper. A lens then showed the analyzer honours
`@fires {Type}` and the generator honours `events[].type.text` — so the gap was a missing type
annotation in `sk-nav-pill.ts:42`, not a generator limitation. Write the SC-305 answer against
the *fixed* state, not the draft's.

## Subtasks

- **T007** — `fixtures/react-consumer/`, React as a devDependency **of the fixture only**.

  Two mechanical traps, both found by lenses:
  * `package.json`'s `workspaces` is `["packages/*","apps/*"]` — `fixtures/*` is not a
    workspace. Root `package.json`/`package-lock.json` are now owned by this WP so the install
    does not require editing a file it does not own.
  * `vitest.config.mts:96` includes `fixtures/**/src/**/*.test.ts` — **`.ts`, not `.tsx`**.
    A `.test.tsx` matches nothing, runs nowhere, and nothing reports it. Widen the include to
    `*.test.{ts,tsx}` deliberately, and probe that widening.

- **T008** — Two real renders: **SC-306** (`sk-nav-pill`'s event reaches a React handler) and
  **SC-307** (a form-associated wrapper submits inside a React `<form>`).

- **T009 (EXPANDED) — protect them from deletion, and own the budget they consume.**

  The first draft claimed these land "in a lane the floor reporter asserts executed". That
  misreads the mechanism: `floor-reporter.mjs:70` asserts each **lane** is non-empty, and these
  tests join the existing `browser` lane which already has tests. The only per-file protection
  is arm 5's `(id, subject file)` check, and `:123`'s `?? [null]` makes an id-only entry legal.
  **`git rm fixtures/react-consumer/src/wrappers.test.tsx` and the whole suite stays green.**
  `behaviours.json`'s own `$comment` describes this exact failure. Add subject entries for the
  React fixture under the existing event-contract and form-association ids — hence
  `behaviours.json` in this WP's owned files.

  **And measure the budget here, because this is the WP that spends it.** These tests run inside
  `suite-selftest.mjs`'s per-mutation loop — **42 times** — and again under `ceilingSeconds: 25`
  across both browsers in CI. At a realistic 200–400ms per React mount that is +17s to +34s
  against 38.4s of headroom. If either ceiling moves, it moves in this WP's PR, from that PR's
  own CI run.

- **T010 (RENUMBERED) — answer SC-305 in writing, in a durable place**, PR body *and*
  `docs/design-system/`. State what the wrapper buys, what it does not, and — new, and material —
  **evaluate `@wc-toolkit/jsx-types`**. The generator's own README says *"If you are using React
  v19+, you can now use custom elements directly without needing wrappers"* and points at that
  package. On the mission's central question, the same maintainer's non-wrapper alternative
  cannot go unmentioned. A negative or partial answer is a valid outcome and must not be
  dressed up.

## Definition of Done

- Both renders green in CI, in a file the include glob actually matches.
- Deleting the fixture test file turns something red — demonstrated, not asserted.
- SC-305 answered with evidence in a durable location, including what is NOT bought, and
  including `@wc-toolkit/jsx-types`.
- React in no `dependencies` of `@spec-kitty/elements` (NFR-003). Note this is green today and
  after — React is not in the repo at all — so it is a regression guard, not an achievement.
- Both `suite-budget.json` ceilings re-checked against this WP's CI run if the test set grew.
