---
work_package_id: WP01
title: Make the dependency-derived filter bite, and guard what it selects
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- C-001
- C-002
- C-003
- C-004
planning_base_branch: mission/filtered-mutation-suite
merge_target_branch: mission/filtered-mutation-suite
branch_strategy: Planning artifacts for this mission were generated on mission/filtered-mutation-suite. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/filtered-mutation-suite unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
phase: Phase 1 - filtered mutation suite
history: []
agent_profile: backend-benny
authoritative_surface: scripts/suite-selftest.mjs
create_intent: []
execution_mode: code_change
model: ''
owned_files:
- fixtures/elements-behaviour/src/*.test.ts
- scripts/suite-selftest.mjs
- suite-budget.json
role: implementer
tags:
- ci
- mutation-harness
- performance
task_type: implement
tracker_refs:
- '#225'
- '#241'
---

# Work Package Prompt: WP01 — Make the dependency-derived filter bite

## Outcome and Definition of Done

1. Every `fixtures/elements-behaviour/src/*.test.ts` imports the element modules it exercises
   rather than the `@spec-kitty/elements` barrel, so `getRelevantTestSpecifications()` resolves an
   element source to the files that can actually observe it.
2. `scripts/suite-selftest.mjs` carries guard 9: a mutation whose declared `subject` is absent from
   its source's selection is rejected by name, before any arm runs, rather than surfacing later as
   guard 4's `absent`.
3. `suite-budget.json` carries a ceiling re-derived from CI measurements of the new cost model,
   with its basis, arm count, test count and absorbed runner spread stated.

## Evidence Required

- BEFORE and AFTER impact-graph resolutions for all 36 mutated sources.
- BEFORE and AFTER complete 157-arm harness runs, compared verdict by verdict.
- BEFORE and AFTER browser-suite assertion multisets, compared per file and per test name.
- Filtered-vs-full agreement for a sample spanning all three selection classes.
- A demonstration that guard 9 rejects a mis-declared subject and names itself.
- A CI run of the `test` job at the final head.

## Boundaries

- Do not edit any selection logic. `getRelevantTestSpecifications()` stays the sole authority and
  its fallbacks stay pessimistic (C-001).
- Do not edit guards 1–8 (C-002).
- Do not edit `behaviours.json` or the id set in `tests/node/config-contract.test.ts` (C-003).
- Do not set the ceiling from a local timing (C-004).
- Do not merge, and do not close #225.
