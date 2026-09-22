---
work_package_id: WP02
title: The behaviour fixture element
dependencies:
- WP01
requirement_refs:
- FR-006
planning_base_branch: mission/elements-verification-harness
merge_target_branch: mission/elements-verification-harness
branch_strategy: Planning artifacts for this mission were generated on mission/elements-verification-harness. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/elements-verification-harness unless the human explicitly redirects the landing branch.
subtasks:
- T006
- T007
phase: Phase 1 - Runner
history:
- timestamp: '2026-09-03T02:30:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: fixtures/elements-behaviour/
create_intent:
- fixtures/elements-behaviour/project.json
- fixtures/elements-behaviour/package.json
- fixtures/elements-behaviour/tsconfig.json
- fixtures/elements-behaviour/src/sk-behaviour-fixture.ts
execution_mode: code_change
owned_files:
- fixtures/elements-behaviour/project.json
- fixtures/elements-behaviour/package.json
- fixtures/elements-behaviour/tsconfig.json
- fixtures/elements-behaviour/src/sk-behaviour-fixture.ts
tags: []
tracker_refs: []
---

# WP02 — The behaviour fixture element

Runs in parallel with WP01. `sk-stub` owns **no** behaviour — no `ElementInternals`, no
`dispatchEvent`, no `part=`, no `static formAssociated` (verified) — so the element that
exercises the required-behaviours list has to be new.

## Where it lives, and why not the obvious place

`fixtures/elements-behaviour/`. **Not** `packages/elements/`, and **not** a sibling
`packages/elements-fixtures/`.

Five #70 scanners run over `packages/elements`, and four are anchored on that literal path
segment. The fifth is not:

| Scanner | Reaches a sibling `packages/*`? |
|---|---|
| `build-elements-css.mjs` (`packages/elements/src/**/sk-*.ts`) | no |
| `check-manifest-content.mjs` (`packages/elements/src/**/*.ts`, **no exclusions**) | no |
| `custom-elements-manifest.config.mjs` | no |
| `check-no-css-in-source.mjs` (`ROOT = packages/elements`) | no |
| **`.storybook/main.ts` (`packages/**/*.stories.@(ts\|tsx)`)** | **YES** |

A sibling package is free of the fifth only by the author remembering not to add a
`.stories.ts`. FR-006's whole point is that placement be structural, not disciplinary.
`fixtures/` is free by construction, and is already better on four more axes verified in
the tree: `fixtures/vite-consumer/project.json` already carries `tags: ["scope:fixture"]`;
`eslint.config.mjs` already globs `fixtures/**`; `ci-quality.yml`'s `components` filter
already lists `fixtures/**`; and `fixtures/` is not an npm-workspace glob match, so it
cannot silently join the published workspace set.

## Subtasks

- **T006** — The element. Owns, in one place, everything the fourteen behaviours need:
  form association via `ElementInternals` (`static formAssociated`, `setFormValue`,
  `setValidity`, `formResetCallback`, disabled handling), one documented **cancelable**
  event with a declared `detail` shape and declared `composed`/`bubbles`, at least two
  `::part()`s, a named slot with fallback content, and Escape-closes-and-returns-focus
  with `aria-expanded` tracking. It must be recognisably a fixture — no catalogue entry,
  no story, not published.

- **T007** — `project.json` with `lint` **and `typecheck`** targets, and a `tsconfig.json`
  that **includes `*.test.ts`**. The typecheck target is not optional: `elements:typecheck`
  cannot reach `fixtures/`, and Vitest's esbuild transform strips types without checking
  them — so without it the fixture's TypeScript is checked by nothing. That is exactly the
  hole `ci-quality.yml`'s own comment records closing for `packages/elements` three
  missions ago. Note `packages/elements/tsconfig.lib.json` *excludes* `*.test.ts`; this one
  must not copy that.

## Definition of Done

- [ ] The element owns every behaviour listed in WP03's table of fourteen — enumerated
      there, so this WP does not depend on the registry being complete.
- [ ] **Every applicable behaviour is breakable by exactly ONE single-occurrence string
      replacement in this file, and the fixture OWNS the behaviour rather than delegating
      it to the UA.** WP05's guards 1–3 require a unique, single-occurrence, non-no-op
      mutation per behaviour, and WP05 cannot edit this file. Two collisions to design
      around, both already visible: `setFormValue` appears in both the value path (SC-002)
      and `formResetCallback` (SC-004) — two occurrences trips guard 2; and if disabled
      exclusion (SC-005) is left to the UA rather than owned by a `formDisabledCallback`,
      it has no source-owned mutation subject at all and guard 1 fires. Review WP05's draft
      mutation list against this file before approving.
- [ ] The fixture's `package.json` declares `@spec-kitty/elements`, so an nx graph edge
      exists. Without the edge the `scope:fixture` depConstraint binds nothing —
      `eslint.config.mjs` argues at length that a constraint binding nothing is worse than
      none, because the next reader believes it.
- [ ] `lint` and `typecheck` both run against it, and the tsconfig `include` is a **glob**
      that will pick up `src/*.test.ts` when WP03 lands them (they do not exist yet, so
      "covers the test files" is not checkable here).
- [ ] **No #70 gate changes behaviour because this fixture exists.** Evidence is
      `lint-code` green on this WP's PR — it runs all five scanners and is unconditional —
      plus `storybook-build`'s story count unchanged at 76. Not a hand-run before/after
      comparison, which leaves no artifact.
- [ ] The fixture appears in no published surface: not in `custom-elements.json`, not in
      `packages/elements/dist`, not in the IIFE bundle, not in the Storybook story list.
