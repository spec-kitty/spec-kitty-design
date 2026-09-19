---
work_package_id: "WP02"
title: "Gates and the release path"
dependencies: ["WP01"]
requirement_refs: ["FR-002", "FR-005", "FR-006", "FR-007", "FR-009", "FR-011"]
planning_base_branch: mission/release-pipeline-opendesign-package
merge_target_branch: mission/release-pipeline-opendesign-package
branch_strategy: "Planning artifacts were generated on mission/release-pipeline-opendesign-package (topology single_branch). This WP commits directly on that branch; the mission PR targets train/elements-first, never main."
subtasks: ["T007", "T008", "T009", "T010"]
phase: "Phase 2 - gates"
history:
  - timestamp: "2026-09-19T15:58:18Z"
    actor: "claude"
    action: "Prompt authored during mission task finalization"
agent_profile: "node-norris"
role: "implementer"
agent: "claude"
model: ""
authoritative_surface: ".github/workflows/"
execution_mode: "code_change"
owned_files:
  - ".github/workflows/ci-quality.yml"
  - ".github/workflows/publish-packages.yml"
  - ".github/workflows/release.yml"
  - "scripts/check-gate-wiring.mjs"
  - "scripts/check-gate-wiring-defeats.mjs"
  - "scripts/check-release-graph.mjs"
---

# WP02 — Gates and the release path

See `tasks.md` for the subtask list and `plan.md` for the implementation concerns this WP delivers.
