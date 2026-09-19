---
work_package_id: WP01
title: Pack, publish tarballs, verify integrity
dependencies: []
requirement_refs:
- FR-001
- FR-003
- FR-004
- FR-006
planning_base_branch: mission/release-pipeline-attestations
merge_target_branch: mission/release-pipeline-attestations
branch_strategy: Planning artifacts for this mission were generated on mission/release-pipeline-attestations. Completed changes merge back into mission/release-pipeline-attestations unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
phase: Phase 1 - scripts
history:
- timestamp: '2026-09-19T19:17:19Z'
  actor: claude
  action: Prompt authored during mission task finalization
agent_profile: node-norris
authoritative_surface: scripts/
create_intent:
- scripts/pack-derived-set.mjs
- scripts/verify-published-integrity.mjs
execution_mode: code_change
model: ''
owned_files:
- scripts/pack-derived-set.mjs
- scripts/verify-published-integrity.mjs
- scripts/publish-derived-set.mjs
role: implementer
tags: []
tracker_refs: []
---

# WP01 — Pack, publish tarballs, verify integrity

See `tasks.md` for the subtask list and `plan.md` for the design this WP delivers.
