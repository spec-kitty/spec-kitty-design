---
work_package_id: WP01
title: Point the LLM surfaces at the ADR index and gate them
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
- FR-007
- FR-008
- FR-009
- FR-010
- FR-011
- FR-012
- FR-013
- FR-014
- FR-015
- FR-016
planning_base_branch: mission/llms-adr-index-pointer-and-gate
merge_target_branch: mission/llms-adr-index-pointer-and-gate
branch_strategy: Planning artifacts for this mission were generated on mission/llms-adr-index-pointer-and-gate. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/llms-adr-index-pointer-and-gate unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
- T008
- T009
- T010
phase: Phase 1 - surfaces and gate
history:
- timestamp: '2026-09-06T00:00:00Z'
  agent: system
  action: 'Prompt authored during mission planning for #197'
authoritative_surface: kitty-specs/llms-surfaces-point-at-the-adr-index-and-are-gated/
create_intent: []
execution_mode: planning_artifact
owned_files:
- kitty-specs/llms-surfaces-point-at-the-adr-index-and-are-gated/**
tags: []
tracker_refs: []
---

# Work Package Prompt: WP01 – Point the LLM surfaces at the ADR index and gate them

## Context

`llms.txt` and `llms-full.txt` are the repo's agent-facing context bundles: they exist for a model
that cannot browse the tree. Both restate `docs/architecture/decisions/` by hand, and both have
rotted — measured on `train/elements-first@65a92f6`, `llms.txt` references 3 of 15 records and
calls the directory "All Accepted architectural decision records" (nine are Accepted, five
Proposed, one Complete); `llms-full.txt` references 14 of 15 and carries three ADR range
expressions and a set-wide `Status … is Accepted` claim.

The operator ruled: **point at the README table instead of restating it**, and add a gate so no
hand list can exist to drift. #193 made that table authoritative and gated it with
`scripts/check-adr-index.mjs`; this WP is the same treatment one surface over.

## Deliverables

1. `llms.txt` — ADR entry becomes a pointer; the three record links go.
2. `llms-full.txt` — ranges and the set-wide status claim replaced by the pointer; per-record
   prose kept and completed with ADR-14.
3. `scripts/check-llms-adr-surface.mjs` — the gate, with `--selftest`.
4. `.github/workflows/ci-quality.yml` — two `[ENFORCED]` steps in `lint-code`.
5. `scripts/check-gate-wiring.mjs` — two `REQUIRED_LINT` entries.
6. Verbatim evidence of every deliberate failure.

## Hard boundaries

- No ADR record's content or Status is edited. Verify by tree hash, not `git diff` over a path:
  `git rev-parse HEAD:docs/architecture/decisions` must stay
  `038374d6335eefc88d849b53069bdd40d09aa406`.
- `docs/architecture/README.md` and `scripts/check-adr-index.mjs` are #193's and are gated. Do not
  touch either.
- No architectural decision. A genuine fork is filed as an issue with the measurement attached.
- Commit type/scope enum: `[tokens storybook doctrine ci docs release deps security styles
  elements react]`. `docs(adr)` and `docs(specs)` fail; use unscoped `docs:`. Headers ≤100 chars.

## Acceptance

Every SC in `spec.md` (SC-001 … SC-011), each measured rather than asserted.
