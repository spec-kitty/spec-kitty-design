---
work_package_id: WP01
title: Current Team Overview pattern and proof
dependencies: []
requirement_refs:
  - FR-001
  - FR-002
  - FR-003
  - FR-004
  - FR-005
  - FR-006
  - FR-007
  - FR-008
  - FR-009
  - FR-010
  - FR-011
  - FR-012
  - FR-013
  - FR-014
  - FR-015
  - NFR-001
  - NFR-002
  - NFR-003
  - NFR-004
  - NFR-005
  - NFR-006
  - NFR-007
  - NFR-008
  - C-001
  - C-002
  - C-003
  - C-004
  - C-005
  - C-006
  - C-007
  - C-008
planning_base_branch: team-overview-current-main-pattern-refresh
merge_target_branch: team-overview-current-main-pattern-refresh
branch_strategy: Planning artifacts for this mission were generated on team-overview-current-main-pattern-refresh. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into team-overview-current-main-pattern-refresh unless the human explicitly redirects the landing branch.
subtasks:
  - T001
  - T002
  - T003
  - T004
  - T005
  - T006
  - T007
  - T008
phase: Phase 1 - current evidence cutover
history:
  - at: "2026-09-11T12:30:00Z"
    actor: codex
    action: Prompt authored from issue and programme handoff
agent_profile: frontend-freddy
authoritative_surface: packages/elements/src/patterns/team-overview.stories.ts
create_intent:
  - packages/elements/src/patterns/team-overview.fixture.ts
  - packages/elements/src/patterns/team-overview.route.fixture.ts
  - fixtures/elements-behaviour/src/pattern-team-overview.test.ts
  - docs/architecture/validation/issue-383-team-overview/README.md
  - docs/architecture/validation/issue-383-team-overview/visual-inspection.md
  - kitty-specs/team-overview-current-main-pattern-refresh-01M286R0/mission-events.jsonl
execution_mode: code_change
model: ""
owned_files:
  - packages/elements/src/patterns/team-overview.fixture.ts
  - packages/elements/src/patterns/team-overview.route.fixture.ts
  - packages/elements/src/patterns/team-overview.stories.ts
  - fixtures/elements-behaviour/src/pattern-team-overview.test.ts
  - apps/storybook/src/tests/sk-team-overview-pattern.spec.ts
  - apps/storybook/src/tests/visual.spec.ts
  - apps/storybook/src/tests/visual.spec.ts-snapshots/team-overview-current-*.png
  - expected-stories.json
  - docs/architecture/validation/issue-383-team-overview/README.md
  - docs/architecture/validation/issue-383-team-overview/visual-inspection.md
  - kitty-specs/team-overview-current-main-pattern-refresh-01M286R0/mission-events.jsonl
role: implementer
tags: []
task_type: implement
tracker_refs:
  - "#383"
  - "#381"
---

# Work Package Prompt: WP01 – Current Team Overview pattern and proof

## Agent and authority

Use the `frontend-freddy` profile. Read this prompt, the complete mission artifacts, root repository
instructions, ADR-9/10/11, issue #381/#383, and Family 1 authority before editing. The issue/handoff
own product truth; the plan owns the implementation cutover.

## Objective

Replace the historical #150 Storybook composition with current TO1/TO2 reviewed evidence. Supply
one immutable populated fixture and exactly six immutable first-run response fixtures, project only
their supplied facts/copy/routes, compose public element/static/native surfaces, and replace every
focused discovery/test/visual claim that presents Delivery/Flow as the current Team root.

## Binding shape

1. Add a story-only fixture/projection module and direct elements-behaviour fixture tests.
2. Replace `team-overview.stories.ts`; define no component, public export, generic helper, product
   state machine, clipboard behavior, router behavior, polling, clock, permission, or mutation.
3. Export exactly `Default`, `AlternateRetention`, `FirstRun`, `LightMode`, `LongContent`, and
   `CopyOutcomes`.
4. TO1 derives supplied retention cells/total, stable distinct in-flight Missions capped at two,
   admitted repositories, and passive recent activity capped at six. A non-72-hour fixture proves
   retention is parameterized. Freshness applies only to TeamMoment regions.
5. TO2 preserves exactly six supplied role/privacy/canManage/current/completed response states.
   Admission and Members routes render only when authorized. The native fixture switcher must say
   that it is review scaffolding outside the product contract.
6. Commands use public `sk-copy-field` with supplied copied/manual/failed messages and safe focus.
7. All visible/a11y copy and every route comes from a fixture. Pattern CSS uses tokens/logical
   properties and never reaches through private child roots or copies a child stylesheet.
8. Compose the current public compact app-shell as a consumer-controlled drawer with focus return.

## Required evidence

- Deep immutability, deterministic projections, caps/totals/retention, six exact TO2 states, and
  role/route authorization guards.
- One H1, landmarks/native lists/headings/labels, keyboard and accessibility-tree checks, axe.
- Default dark and same-fixture LightMode; 1440/intermediate/390/short viewport/long localized
  content/RTL/forced colors/reduced motion; real 200% browser zoom uses a fresh DPR-2 context at
  the 720x512 CSS viewport derived from 1440x1024, proves the compact-shell exposure change, and
  keeps CSS `zoom` explicitly supplemental.
- Zero document overflow or clipped focus and narrow actionable targets at least 44px.
- Public copy result outcomes and focus safety; passive activity; controlled drawer focus return.
- Six replacement discovered IDs and fully replaced Team Overview visual cases/PNGs, each inspected.
- A durable migration note naming #150 Delivery/Flow/dashboard evidence historical/deprecated.

## Verification and handoff

Run every command in `quickstart.md` plus relevant generated/size checks. Repeat the focused subset
immediately before push. Use `spec-kitty safe-commit` for owned changes and supported CLI lane/status
commands only. Stop at `for_review`; do not approve, merge, or open a PR.
