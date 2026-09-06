---
work_package_id: WP01
title: Correct the React wrapper contract (delta) section
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
planning_base_branch: mission/form-input-contract-doc-refresh
merge_target_branch: mission/form-input-contract-doc-refresh
branch_strategy: Planning artifacts for this mission were generated on mission/form-input-contract-doc-refresh. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/form-input-contract-doc-refresh unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
phase: Phase 1 - Correction
history:
- timestamp: '2026-09-06T00:00:00Z'
  agent: system
  action: Prompt generated via /spec-kitty.tasks
authoritative_surface: kitty-specs/form-input-constraints-and-datalist-01M1S94Y/contracts/
create_intent: []
execution_mode: planning_artifact
owned_files:
- kitty-specs/form-input-constraints-and-datalist-01M1S94Y/contracts/sk-form-input.contract.md
tags: []
tracker_refs: []
---

# Work Package Prompt: WP01 – Correct the React wrapper contract (delta) section

## Context

Issue #191 (spec-kitty/spec-kitty-design): `sk-form-input.contract.md`'s "React wrapper contract
(delta)" section is stale in two independent ways.

1. It describes the gate `scripts/build-react-wrappers.mjs` implemented for #180 (folding both the
   expected and emitted prop-NAME SETS to lower-case before comparing). #187 replaced that gate
   with an exact comparison: `loadReactPropRenameMap()` reads the real, un-exported `MAPPED_PROPS`
   table out of the installed `@wc-toolkit/react-wrappers` bundle and the per-element check
   asserts EXACT casing against it — a fold no longer happens anywhere in the gate.
2. It asserts "every rename in the generator's own (un-exported) table is CASE-ONLY." This is
   false: `for`→`htmlFor` and `class`→`className` are word substitutions, not case changes.

## What to do

Edit ONLY the "React wrapper contract (delta)" section of
`kitty-specs/form-input-constraints-and-datalist-01M1S94Y/contracts/sk-form-input.contract.md`:

- Replace the stale gate description with the current one (#187's exact comparison against the
  real `MAPPED_PROPS` table), citing `scripts/build-react-wrappers.mjs`'s `loadReactPropRenameMap()`
  and the per-element comparison it feeds.
- Replace the false CASE-ONLY claim with the verified truth: `for`/`class` are non-case-only
  renames; this element's own three renames (`readonly`/`autocomplete`/`inputmode`) remain
  case-only.
- Point to ADR-11's "wrapper prop-name invariant" section
  (`docs/architecture/decisions/2026-09-02-11-verification-stack-and-wrapper-generation.md`) as the
  canonical statement of the `for`/`class` mechanics — do not restate it in full (one owner per
  fact).
- Do not assert a parallel between the `for` and `class` rows beyond what is verified (ADR-11
  itself notes its own trace of the `class` row's `originalName`/`attributeMapping` path is
  incomplete — mirror that hedge rather than resolving it here).

## Out of scope

- `scripts/`, `packages/`, and any work-package task page (frozen by standing operator ruling).
- Any change to `sk-form-input`'s shipped behaviour or its generated React wrapper output.

## Verification

- `node scripts/build-react-wrappers.mjs --check` passes, unchanged, before and after this edit.
- The corrected section's claims are each backed by reading the script source and/or the installed
  `@wc-toolkit/react-wrappers` bundle at this head — not by trusting the issue's own description or
  a prior contract-doc draft.
