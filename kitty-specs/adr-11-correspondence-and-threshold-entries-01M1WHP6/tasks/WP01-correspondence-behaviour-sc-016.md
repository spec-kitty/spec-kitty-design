---
work_package_id: WP01
title: SC-016 — delegate/rendered-control correspondence
dependencies: []
requirement_refs:
- FR-001
- FR-003
- FR-004
- NFR-001
authoritative_surface: fixtures/elements-behaviour/src/sk-form-input.test.ts
execution_mode: code_change
model: ''
owned_files:
- behaviours.json
- mutations.json
- tests/node/config-contract.test.ts
- fixtures/elements-behaviour/src/sk-form-input.test.ts
planning_base_branch: mission/adr-11-correspondence-and-threshold-entries
merge_target_branch: mission/adr-11-correspondence-and-threshold-entries
branch_strategy: Planning artifacts were generated on mission/adr-11-correspondence-and-threshold-entries; completed changes must merge back into mission/adr-11-correspondence-and-threshold-entries.
subtasks:
- T001
- T002
- T003
- T004
phase: Phase 1 - the two entries
history:
- at: '2026-09-07T00:00:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
tags: []
tracker_refs: []
---

# WP01 — SC-016, delegate/rendered-control correspondence

## T001 — the test, written from the three measured bugs

Add one test to `fixtures/elements-behaviour/src/sk-form-input.test.ts`, named
`[SC-003][SC-016] …`, comparing the five delegated flags on the host against the same five on the
rendered control, across four intended states: mount-already-invalid, a post-mount change, a
same-update `type`+`value` change, and an unconstrained field. Each case also pins the shared
answer, so "both wrong" cannot pass. `badInput` is excluded and the exclusion is stated: ADR-14
records it as the one flag with two writers, and the programmatic-divergence writer sets it on the
host in states where the rendered control legitimately does not.

The `[SC-003]` half of the marker is not decoration — see T004.

## T002 — dual-mark the existing probe-ordering test

`[SC-003] a type change and a value change in the SAME update …` is ADR-14's third measured bug
asserted from the host's side. Mark it `[SC-003][SC-016]`.

## T003 — the registry and the pin

`behaviours.json`: SC-016, `applicable: true`, one subject (`sk-form-input` →
`fixtures/elements-behaviour/src/sk-form-input.test.ts`), with a note recording why the id exists
and why it is not fixture-owned. `tests/node/config-contract.test.ts`: add `SC-016` to the
expected applicable set.

## T004 — the mutation, and the collateral it forced

Re-key the existing `probe type assigned before value` arm from SC-003 to SC-016 — it is ADR-14's
own "clearest instance" of the two sources disagreeing. Re-site the SC-013 arm from
`pattern=${nothing}` to `inputmode=${nothing}`, because dropping `pattern` from the rendered
control is now a correspondence defect as well as a forwarding one. **No existing arm gains
`expectCollateral`** (NFR-001). Verify by running the affected arms and recording the verbatim red.
