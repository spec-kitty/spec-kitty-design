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
- tests/node/desktop-v2-contract.test.ts
execution_mode: code_change
owned_files:
- contracts/desktop-v2/**
- scripts/check-desktop-v2-contract.mjs
- tests/node/desktop-v2-contract.test.ts
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

Inventory the exact 22 families in [spec.md](../spec.md) against the current `develop` checkout. Declare each family's required states/themes/responsive modes independently of existing stories, then map each required state to a resolvable story ID, visual test ID and committed snapshot. Record actual styles/element form, public entry, repository-relative source paths, token/asset closure and redistribution basis. The source contract is SHA-independent: no own commit SHA, digest, timestamp, axe result or gate result. A missing story, snapshot, per-story axe result or rights basis is a gap, never green evidence. Keep current repository code as truth; the old D1 lane and approved prototype are reference only.

Implement T001–T004. Close source/story gaps through existing repo conventions and generators; do not hand-edit generated React wrappers or markup. Neutral selected navigation remains a Desktop composition using existing tokens. Do not add a generic artifact tree, Desktop route/data, or Tauri behavior. Inter has an OFL file, Falling Sky OTF embeds SIL OFL terms, and the full `packages/tokens/src/tokens.css` contains Swansea URLs with unresolved rights. Mark an unchanged full-token export blocked until Swansea terms are proven; a scoped derivative may exclude those URLs only with checked source mapping. Do not falsely mark Falling Sky uncleared.

Add a machine check that rejects a missing/extra family, removed required state even if its story is also deleted, absent source/public path, stale story→visual-test→snapshot mapping and unresolved license. Demonstrate deletion probes for a family, a required state and a mapped story. Run affected lint, tests, package build, Storybook, axe and visual checks, using `PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium` with a positive executed-test count. Persist per-story axe results, visual mappings, command/result and tested SHA as PR evidence outside the source contract; the final S-labelled evidence belongs to the later handoff mission. Submit this WP for independent Spec Kitty review. WP02 follows its approval within the same mission; both WPs consolidate into one reviewed PR to `develop`.
