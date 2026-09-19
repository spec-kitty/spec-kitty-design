---
work_package_id: WP02
title: Attestation in both publish paths, and the gates
dependencies:
- WP01
requirement_refs:
- FR-001
- FR-002
- FR-005
- FR-007
- FR-008
planning_base_branch: mission/release-pipeline-attestations
merge_target_branch: mission/release-pipeline-attestations
branch_strategy: Planning artifacts for this mission were generated on mission/release-pipeline-attestations. Completed changes merge back into mission/release-pipeline-attestations unless the human explicitly redirects the landing branch.
subtasks:
- T004
- T005
- T006
- T007
phase: Phase 2 - workflows and gates
history:
- timestamp: '2026-09-19T19:17:19Z'
  actor: claude
  action: Prompt authored during mission task finalization
agent_profile: node-norris
authoritative_surface: .github/workflows/
create_intent: []
execution_mode: code_change
model: ''
owned_files:
- .github/workflows/publish-packages.yml
- .github/workflows/release-rc.yml
- .github/workflows/release.yml
- .github/workflows/ci-quality.yml
- scripts/check-release-graph.mjs
- scripts/check-gate-wiring.mjs
- scripts/check-gate-wiring-defeats.mjs
- .gitignore
role: implementer
tags: []
tracker_refs: []
---

# WP02 — Attestation in both publish paths, and the gates

See `tasks.md` for the subtask list and `plan.md` for the design this WP delivers.
