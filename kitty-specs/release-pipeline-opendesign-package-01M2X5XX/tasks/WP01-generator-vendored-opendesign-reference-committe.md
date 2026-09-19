---
work_package_id: "WP01"
title: "Generator, vendored OpenDesign reference, committed package"
dependencies: []
requirement_refs: ["FR-001", "FR-002", "FR-003", "FR-004", "FR-005", "FR-006", "FR-007", "FR-008", "FR-010"]
planning_base_branch: mission/release-pipeline-opendesign-package
merge_target_branch: mission/release-pipeline-opendesign-package
branch_strategy: "Planning artifacts were generated on mission/release-pipeline-opendesign-package (topology single_branch). This WP commits directly on that branch; the mission PR targets train/elements-first, never main."
subtasks: ["T001", "T002", "T003", "T004", "T005", "T006"]
phase: "Phase 1 - package"
history:
  - timestamp: "2026-09-19T15:58:18Z"
    actor: "claude"
    action: "Prompt authored during mission task finalization"
agent_profile: "node-norris"
role: "implementer"
agent: "claude"
model: ""
authoritative_surface: "scripts/"
execution_mode: "code_change"
owned_files:
  - "scripts/build-opendesign-package.mjs"
  - "scripts/vendor/open-design/**"
  - "opendesign/spec-kitty-train/**"
---

# WP01 — Generator, vendored OpenDesign reference, committed package

See `tasks.md` for the subtask list and `plan.md` for the implementation concerns this WP delivers.
