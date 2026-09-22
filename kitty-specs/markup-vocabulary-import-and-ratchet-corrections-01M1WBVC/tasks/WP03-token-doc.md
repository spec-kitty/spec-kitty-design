---
work_package_id: WP03
title: The contributing guide describes the catalogue's real binning
dependencies: []
requirement_refs:
- FR-011
- NFR-003
planning_base_branch: mission/markup-vocabulary-import-and-ratchet-corrections
merge_target_branch: mission/markup-vocabulary-import-and-ratchet-corrections
branch_strategy: Planning artifacts for this mission were generated on mission/markup-vocabulary-import-and-ratchet-corrections. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/markup-vocabulary-import-and-ratchet-corrections unless the human explicitly redirects the landing branch.
subtasks:
- T010
phase: Phase 2 - the records
history:
- at: '2026-09-06T22:10:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: ''
authoritative_surface: docs/contributing/adding-a-token.md
create_intent: []
owned_files:
- docs/contributing/adding-a-token.md
execution_mode: planning_artifact
model: ''
tags: []
tracker_refs:
- '220'
---

# Work Package Prompt: WP03 – The guide and the catalogue agree

Closes #220. See `plan.md` §4.

## T010 — FR-011, NFR-003: the doc moves, the artifact does not

Split the single "Operational status" row so each prefix names the category the generated catalogue
actually assigns it, and add a short paragraph stating the convention: the catalogue bins by prefix,
so every `--sk-on-*` token is in `on` regardless of what it pairs with — which is why
`--sk-on-tint-*` sits away from `--sk-surface-tint-*` too — and a semantic pair therefore spans
two categories. Point at the pairing rule already at the foot of the file. Leave
`packages/tokens/dist/token-catalogue.json` byte-identical; binning by pair changes a published
artifact and is the operator's call.
