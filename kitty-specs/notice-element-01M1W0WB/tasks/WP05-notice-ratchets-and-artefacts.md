---
work_package_id: WP05
title: Ratchets, generated artefacts, gates and the PR
dependencies:
- WP01
- WP02
- WP03
- WP04
requirement_refs:
- FR-021
- FR-022
- C-006
authoritative_surface: expected-parts.json
create_intent: []
execution_mode: code_change
model: ''
owned_files:
- expected-parts.json
- expected-docs.json
- expected-stories.json
- behaviours.json
- mutations.json
- packages/elements/custom-elements.json
- packages/elements/vue.d.ts
- packages/elements/SIZES.md
- packages/react/src
- packages/react/.wrapper-floor
- docs/design-system/using-components.md
planning_base_branch: mission/notice-element
merge_target_branch: mission/notice-element
branch_strategy: Planning artifacts for this mission were generated on mission/notice-element. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/notice-element unless the human explicitly redirects the landing branch.
subtasks:
- T013
- T014
- T015
phase: Phase 5 - the ratchets
history:
- at: '2026-09-06T18:00:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
tags: []
tracker_refs: []
---

# WP05 — ratchets, artefacts, gates

## T013 — the root registries

None is discoverable from the code, and each carries a `$comment` array that must gain a note in the
same commit saying what moved and why.

- `expected-parts.json` — every `@csspart`, sorted, and bump `total`. The entry must land with a
  test targeting it; the ratchet scans only `fixtures/**/src/**/*.test.ts` and `tests/**/*.test.ts`.
- `expected-docs.json` — `{attributes, properties, methods}` and bump `total`. **Exact in both
  directions**, so count from the generated manifest rather than by hand.
- `expected-stories.json` — every story id, and bump `total`. Not the `--docs` entry autodocs adds.
- `behaviours.json` — a `{name, file}` subject on each id claimed. Declaring the subject is what
  creates the obligation, and `config-contract.test.ts` now fails an element that is a subject of
  none.
- `mutations.json` — one SC-013 arm on a **non-root** part (the root part is the node other tests
  query to prove the element rendered), **two** SC-014 arms (`[]` reds the length assertion first and
  vitest aborts, so `[new CSSStyleSheet()]` is what proves the identity assertion load-bearing), and
  one arm per remaining claimed id.
- `expected-inert-theme-wrappers.json` — nothing, because the stories use `class="sk-light"`.

## T014 — regenerate, build, measure

Run the recipe's step-7 block in order. **`--skip-nx-cache` on every nx invocation before a
`--check`**: nx serves cached output and makes a `--check` compare a stale artifact against itself.
**Build before measuring**: `measure-elements-sizes.mjs` reads `dist/` and does not build it, and a
measurement taken over a stale `dist/` looks like CI non-reproducibility and is not.

Then `git add -A && git status --porcelain` must be empty.

## T015 — rebase and open the PR

Another session is merging to this train. Re-fetch and rebase before finishing. A
`kitty-ops/ops-index.jsonl` conflict is a **union** — take both sides, then verify every line parses
and every `invocation_id` is unique.

`gh pr create --base train/elements-first`. Any other base runs zero gates and still looks green.
Commit scopes come from the enum; `docs(adr)` and `docs(specs)` are invalid — use unscoped `docs:`.
Verify with `npx commitlint --from origin/train/elements-first --to HEAD`.
