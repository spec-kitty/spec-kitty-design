---
work_package_id: WP04
title: ADR-11 behaviour 9 gets a subject at last, and the ceiling gets raised on purpose
dependencies:
- WP03
requirement_refs:
- FR-008
- NFR-004
planning_base_branch: mission/react-wrapper-generation
merge_target_branch: mission/react-wrapper-generation
branch_strategy: Planning artifacts for this mission were generated on mission/react-wrapper-generation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/react-wrapper-generation unless the human explicitly redirects the landing branch.
subtasks:
- T010
- T011
phase: Phase 4 - Verification
history:
- timestamp: '2026-09-03T13:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: behaviours.json
create_intent: []
execution_mode: code_change
owned_files:
- behaviours.json
- mutations.json
- suite-budget.json
- tests/node/config-contract.test.ts
tags: []
tracker_refs: []
---

# WP04 — The fifteenth behaviour finally has a subject

`behaviours.json` carries FOURTEEN ids and says why in its own `$comment`:

> *"The fifteenth is generation determinism, and it is deferred to #75: ADR-11 phrases it as
> 'regenerating WRAPPERS from an unchanged manifest', the wrapper generator does not exist yet,
> and the artifacts that DO regenerate today already have enforced drift checks. A test here
> would be a green criterion with zero new coverage."*

This is #75. The subject now exists.

## Subtasks

- **T010** — Add the id with the generator as its subject, a test, and a mutation. The behaviour
  is *regenerating from an unchanged manifest is a no-op* — already measured true in the spike
  (`diff -rq` byte-identical across two runs), so this asserts a property that holds rather
  than fixing one that does not.

  Note it depends on the manifest being deterministic, which it only became in #74 —
  `scripts/normalise-manifest.mjs`. Without that this behaviour would be flaky by construction,
  and the flake would look like a generator defect. Worth a sentence in the test.

- **T011** — **Raise `selftestCeilingSeconds` deliberately, with the run that justifies it.**
  #74 measured the slope: 39 mutations / 62 tests = 121.7s CI; 41 / 80 = 141.6s CI — about **10s
  per added mutation**, because `suite-selftest.mjs` runs the whole suite once per mutation, so
  adding tests and adding mutations compound. Roughly four more breach the 180s ceiling.

  So this mission is very likely the one that raises it. Raise it from a CI number, not a
  workstation's — #74 recorded a local figure as though it were binding and a lens caught it.

## Definition of Done

- `behaviours.json` carries fifteen ids, the fifteenth with a real subject and a mutation.
- `suite-selftest.mjs` green at the new count; `--selftest` 8/8.
- Any ceiling change cites the CI run that justifies it.
