---
work_package_id: WP02
title: The token doctrine permits completing a family, and still refuses a new hue
dependencies: []
requirement_refs:
- FR-008
- FR-009
- FR-010
planning_base_branch: mission/notice-heading-in-region-and-tint-doctrine
merge_target_branch: mission/notice-heading-in-region-and-tint-doctrine
branch_strategy: Planning artifacts for this mission were generated on mission/notice-heading-in-region-and-tint-doctrine. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/notice-heading-in-region-and-tint-doctrine unless the human explicitly redirects the landing branch.
subtasks:
- T009
- T010
- T011
phase: Phase 2 - the doctrine
history:
- at: '2026-09-07T00:05:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: ''
authoritative_surface: docs/contributing/adding-a-token.md
create_intent: []
owned_files:
- docs/contributing/adding-a-token.md
- docs/design-system/using-tokens.md
execution_mode: planning_artifact
model: ''
tags: []
tracker_refs:
- '217'
---

# Work Package Prompt: WP02 – The doctrine permits what the palette does

Closes #217, under the operator ruling of 2026-09-06. The literals are already ratified; only the
wording moves. `packages/tokens/src/tokens.css` and `packages/tokens/dist/token-catalogue.json` stay
byte-identical.

## T009 — SC-008: measure before writing

Verify in the tree, not from the ruling's summary: that `--sk-color-blue-bg`, `--sk-color-purple-bg`
and `--sk-color-green-bg` exist and equal `--sk-surface-tint-sky`, `-lilac` and `-mint`; that
`--sk-color-red` is a foreground; and that no red or danger **surface** token exists. Also check the
claim the ruling implies rather than states — that the four siblings are all aliases of a
`--sk-color-*-bg`. Report whatever you find, including a refutation.

## T010 — FR-008, FR-009, SC-006: the amended rule, as a test

Amend the paragraph at `docs/contributing/adding-a-token.md` that reads *"If a new category needs
new colour values, that is a palette decision and belongs to whoever owns the palette, not to the
mission that happened to need it first."*

It must distinguish **completing an existing family from an existing hue** — permitted, by the
derivation rule the siblings follow — from **introducing a new hue**, which stays out of a mission's
hands. Prose alone is not enough: give it a test whose questions a future mission can answer about
its own case without asking anyone, and say what evidence a permitted addition must record.

## T011 — FR-010, SC-007: the alias claim is corrected

`docs/design-system/using-tokens.md` tells consumers every `--sk-status-*` token "resolves to a
token above". True of the `--sk-status-*` layer itself; not true one level down, where the tint
family bottoms out in literals. Say which, and keep the correction to what is measured.
