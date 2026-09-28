---
work_package_id: WP01
title: Source contract and evidence for 22 Desktop primitive families
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-007
- FR-009
- NFR-003
- NFR-004
- NFR-005
- C-001
- C-002
- C-003
planning_base_branch: develop
merge_target_branch: develop
branch_strategy: Planning artifacts for this mission were generated on develop. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into develop unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
phase: Phase 1 - Contract and evidence
history:
- timestamp: '2026-09-28T01:27:00Z'
  agent: planner-priti
  action: Authored for issue 470 replacement on develop
agent_profile: frontend-freddy
authoritative_surface: contracts/desktop-v2/
create_intent:
- contracts/desktop-v2/
- scripts/check-desktop-v2-contract.mjs
execution_mode: code_change
owned_files:
- contracts/desktop-v2/**
- scripts/check-desktop-v2-contract.mjs
- packages/styles/src/**
- packages/elements/src/**
- packages/tokens/src/**
- apps/storybook/src/tests/visual.spec.ts
- apps/storybook/src/tests/visual.spec.ts-snapshots/**
role: implementer
tags: []
task_type: implement
tracker_refs:
- '#470'
---

# WP01 — Source contract and evidence

Inventory the exact 22 families in [spec.md](../spec.md) against the current `develop` checkout. Each entry must identify its actual styles/element form, public consumer entry, repository-relative source paths, state/theme/responsive story IDs, accessibility evidence, visual evidence, token dependencies, transitive assets and redistribution basis. An entry that lacks a required story, axe result, visual reference or rights evidence is an explicit gap to close, not a green result. Keep the current repository code as truth; use the old D1 lane and approved prototype only as reference when deciding whether a narrow source edit is needed.

Implement T001–T004. Close source/story gaps through existing repo conventions and generators; do not hand-edit generated React wrappers or markup. Neutral selected navigation remains a Desktop composition using existing tokens. Do not add a generic artifact tree, Desktop route/data, or Tauri behavior. Assess font closure carefully: Inter has an OFL file; the brand guide flags Swansea rights as unresolved. If exported CSS requires an unresolved font asset, fail the contract or produce a justified source-preserving scoped closure that does not reference it.

Add a machine check that rejects a missing/extra family, absent source/public path, stale story/evidence ID, and unresolved license. Demonstrate a red case for each meaningful rule. Run lint, tests, package build, Storybook, axe and visual checks affected by the changes; document commands, results and evidence paths. Submit this WP for independent Spec Kitty review. WP02 follows its approval within the same mission; both WPs consolidate into one reviewed PR to `develop`.
