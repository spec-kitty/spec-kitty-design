---
work_package_id: WP02
title: The static story cited as acceptance evidence is ratcheted
dependencies: []
requirement_refs:
- FR-009
- FR-010
- NFR-004
planning_base_branch: mission/markup-vocabulary-import-and-ratchet-corrections
merge_target_branch: mission/markup-vocabulary-import-and-ratchet-corrections
branch_strategy: Planning artifacts for this mission were generated on mission/markup-vocabulary-import-and-ratchet-corrections. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/markup-vocabulary-import-and-ratchet-corrections unless the human explicitly redirects the landing branch.
subtasks:
- T008
- T009
phase: Phase 2 - the records
history:
- at: '2026-09-06T22:10:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: ''
authoritative_surface: expected-stories.json
create_intent: []
owned_files:
- expected-stories.json
execution_mode: planning_artifact
model: ''
tags: []
tracker_refs:
- '219'
---

# Work Package Prompt: WP02 – A cited story cannot be retired silently

Closes #219. See `plan.md` §3.

## T008 — FR-009: opt the id in

Add `components-card--statuses-greyscale` to `expected-stories.json` under its own `byElement`
key, and move `total` 160 → 161. Verify the id exists in the built Storybook index rather than
inferring it from the story export name.

## T009 — FR-010: say what the scope is now

Extend the `$comment` with what the ratchet covers today, why this id specifically (it is the
static half of #177's own stated proof that a tone is never the sole carrier of meaning, and the
static path is the no-JavaScript consumer ADR-10 §3 exists to serve), and the standing principle: a
story cited as acceptance evidence is ratcheted in the same commit that cites it. Do **not** opt in
the whole `packages/styles` catalogue — #219 raises that as an open question for the operator.
