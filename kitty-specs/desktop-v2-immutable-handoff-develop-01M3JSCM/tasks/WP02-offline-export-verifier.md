---
work_package_id: WP02
title: Deterministic offline exporter and contract verifier
dependencies:
- WP01
requirement_refs:
- FR-003
- FR-004
- FR-005
- FR-006
- FR-007
- FR-008
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- C-001
- C-004
planning_base_branch: develop
merge_target_branch: develop
branch_strategy: Planning artifacts for this mission were generated on develop. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into develop unless the human explicitly redirects the landing branch.
subtasks:
- T005
- T006
- T007
- T008
phase: Phase 2 - Export and verification
history:
- timestamp: '2026-09-28T01:27:00Z'
  agent: planner-priti
  action: Authored for issue 470 replacement on develop
agent_profile: node-norris
authoritative_surface: scripts/export-desktop-v2-handoff.mjs
create_intent:
- scripts/export-desktop-v2-handoff.mjs
- scripts/verify-desktop-v2-handoff.mjs
- tests/node/desktop-v2-handoff.test.ts
execution_mode: code_change
owned_files:
- scripts/export-desktop-v2-handoff.mjs
- scripts/verify-desktop-v2-handoff.mjs
- tests/node/desktop-v2-handoff.test.ts
- .github/workflows/ci-quality.yml
role: implementer
tags: []
task_type: implement
tracker_refs:
- '#470'
---

# WP02 — Deterministic offline exporter and verifier

Start after WP01's contract and evidence are approved through Spec Kitty review in the same mission. Consume that checked contract and its actual source/asset closure. Export a portable directory under a caller-selected output path with a schema-versioned manifest, normalized relative paths, per-file byte sizes and SHA-256 digests, license and evidence references, and a canonical digest over a sorted payload/contract list. The manifest must not hash itself. Identical committed source revision and contract inputs must produce byte-identical output without host timestamps, checkout paths, registry access or runtime network requests.

Implement T005–T008. The verifier must work on a copy outside a Git checkout and reject changed/missing/extra files, path traversal, symlinks, duplicate/case-colliding paths, contract-field drift, stale source/evidence bindings, and an asset with no resolved license. A failure should name the affected path or field. Add focused tests that change each contract property and show a meaningful nonzero failure; verify two same-S exports produce the same bytes. Wire the check through existing repository quality commands/workflow rather than a new harness.

Run lint, tests, builds and the Storybook/axe/visual gates relevant to affected files, plus explicit offline copied-artifact verification. Submit this WP for independent Spec Kitty review. After both WPs are approved, consolidate one mission PR to `develop`. A later focused mission freezes stable post-merge S and produces the final handoff artifact.
