---
work_package_id: WP01
title: The runner, its config, the floor, and the behaviour registry
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-009
- FR-010
- FR-011
- FR-015
planning_base_branch: mission/elements-verification-harness
merge_target_branch: mission/elements-verification-harness
branch_strategy: Planning artifacts for this mission were generated on mission/elements-verification-harness. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/elements-verification-harness unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T004
- T005
phase: Phase 1 - Runner
history:
- timestamp: '2026-09-03T02:30:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: vitest.config.mts
create_intent:
- vitest.config.mts
- scripts/floor-reporter.mjs
execution_mode: code_change
owned_files:
- vitest.config.mts
- scripts/floor-reporter.mjs
- package.json
- package-lock.json
- tsconfig.base.json
tags: []
tracker_refs: []
---

# WP01 — The runner, its config, the floor, and the behaviour registry

Absorbs three concerns the first plan draft separated, because all three edited files this
package owns. Sequenced first; depends on nothing.

## The config shape is MEASURED, not guessed

The post-plan spike stood this up and ran it against a real `HeadlessChrome/151`. Use it.

```ts
// vitest.config.mts   — .mts, NOT .ts
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';   // a FUNCTION, not a string

export default defineConfig({
  test: {
    projects: [
      { test: { name: 'browser', include: [...], retry: 0,
          browser: { enabled: true, headless: true, provider: playwright(),
                     instances: [{ browser: 'chromium' }, ...webkitWhenCI] } } },
      { test: { name: 'node', environment: 'node', include: [...], retry: 0 } },
    ],
  },
});
```

Four things that will each cost a cycle if ignored:

- **`.mts`, not `.ts`.** A `.ts` config in a package without `"type": "module"` emits a
  Vite `configLoader` deprecation on *every* run.
- **`provider: playwright()`** — the v4 provider is a function you call. Every
  `provider: 'playwright'` recipe on the internet is for v2/v3 and is wrong here.
- **`retry`, not `retries`.** `retries` is not in the config type and is *silently
  ignored*.
- **The resolved project name is `browser (chromium)`**, not `browser`. Vitest appends the
  instance. Anything keyed on the literal `'browser'` matches nothing.

## Subtasks

- **T001** — Pin the dependencies: `vitest`, `@vitest/browser`, `@vitest/browser-playwright`
  (all 4.1.11), and **`playwright` directly**. That last one is not new usage — 
  `scripts/run-axe-storybook.js` already does `require('playwright')` against a transitive
  dep, which is the unpinned shape the #70 squad flagged for `vite`. Note a fresh pin
  resolves `vite 8.2.2`, not the tree's 7.3.6; pin deliberately. Each of the four gets the
  DIRECTIVE_051 pass (none ran an install script in the spike).

- **T002** — `vitest.config.mts` per the shape above. `resolve.alias` maps
  `@spec-kitty/elements` to `packages/elements/src` (FR-004) — Vite does **not** read
  tsconfig `paths`, and the lint job never builds, so a name-resolved import would hit
  `dist/` and ENOENT. webkit's instance is env-gated: mandatory when `CI` is set, absent
  otherwise, because **webkit cannot launch on the operator's Fedora machine** and
  unconditional webkit makes `npm run test` fail on a clean checkout.

*(T003 moved to WP03.)* `behaviours.json` is **owned by WP03**, which owns the behaviours
themselves. One file, one owner — and it resolves the sequencing blocker cleanly: this WP's
floor *reads* the registry if present, so the per-behaviour arm has nothing to check until
WP03 declares ids, and WP03 adds each id in the same commit as its test. Shipping fourteen
ids here would make `npm run test` red for WP02, WP03 and part of WP04 no matter what the
seed covers; deferring the arm to mission level would reintroduce the escape hatch FR-010
forbids. Neither is needed.

- **T004** — `scripts/floor-reporter.mjs`. **A custom reporter, not `--reporter=json`.**
  Measured: that JSON has no project attribution at all, and reported a run where webkit
  never launched as `success: true`, `numFailedTests: 0`, two files `status: "passed"` with
  zero assertions. Read `vitest.projects` (declared — includes empty lanes) against
  `testModule.project.name` (executed); set-difference is FR-009. Also gate on
  `reason !== 'passed'` and `unhandledErrors.length`. FR-010's zero-skip falls out of the
  same pass — but order the assertions so a load failure reports *first*, because a module
  that fails to load has its tests counted as **skipped**.

- **T005** — `useDefineForClassFields: false` in **`tsconfig.base.json`**, plus a node-lane
  assertion on the value the *build* resolves. Not a lane-local override: measured, esbuild
  at ES2022 with the flag unset emits native class fields, and
  `packages/elements/project.json`'s bare `esbuild … --bundle` resolves the same base
  config — so the shipped artifact has the hazard too, dormant only because `SkStub`
  declares no reactive properties. A test-only override gives a green lane over a broken
  artifact.

## Definition of Done

- [ ] `npm run test` runs both projects and fails if either does.
- [ ] The floor fails when a lane executes zero tests. **Demonstrated** by pointing one
      lane's `include` at a non-matching glob — measured to exit 0 without the floor.
- [ ] The floor fails when a declared behaviour id has no covering test — demonstrated
      **here**, without WP03, by pointing the reporter at a temporary two-id fixture
      registry in this WP's own node-lane test. The arm is proven at the commit that
      builds it, not at the commit that first uses it.
- [ ] The floor fails on a skipped test.
- [ ] `retry` is 0 for **every** project, asserted on the RESOLVED config
      (`createVitest('test',{config}).projects[].config.retry`) — asserting the raw object
      is near-vacuous since `retry` defaults to 0, and a per-project override would slip past.
- [ ] The suite passes with **no `packages/elements/dist` present** (SC-022).
- [ ] A node-lane test asserts the build's resolved `useDefineForClassFields` is `false`,
      and fails when it is unset.
- [ ] **One seed browser-lane test ships in this package** (`tests/browser/seed.test.ts`)
      so the browser lane is non-empty and the per-lane arm is satisfiable from this
      commit. It carries **no** registry id — the registry does not exist yet — so it does
      not collide with WP03's coverage and the mutation harness's collateral bound stays
      unambiguous. WP03 may delete it once real browser tests exist.
- [ ] The node lane has at least one owned test (`tests/node/config-contract.test.ts`),
      carrying the resolved-`retry` and resolved-`useDefineForClassFields` assertions. Both
      SC-001 and the floor require the node lane to execute ≥1 test; no other WP owns a
      node-lane file.
- [ ] **When `CI` is set, the reporter asserts BOTH `browser (chromium)` and
      `browser (webkit)` executed.** This is FR-005's clause and it belongs to the reporter,
      which this WP owns. It is the only mechanism that catches webkit silently not running
      — the exact failure the spike measured reporting `success: true`, `numFailedTests: 0`.

## Notes

`nx.json` already declares a `test` targetDefault with `cache: true` and no `inputs`. If a
`test` nx target is added for local convenience, give it `"cache": false` or explicit
inputs — otherwise it can report a stale local pass. The gate runs `npm run test`, so this
never reaches CI, but it will mislead a developer.
