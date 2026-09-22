---
work_package_id: WP01
title: Team overview Storybook composition and proof
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
- FR-016
- FR-017
- FR-018
- FR-019
- FR-020
- FR-021
- FR-022
- FR-023
- FR-024
- FR-025
- FR-026
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- NFR-006
- NFR-007
- NFR-008
- NFR-009
- NFR-010
- NFR-011
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
- C-007
- C-008
- C-009
- C-010
- C-011
planning_base_branch: mission/team-overview-pattern-story
merge_target_branch: mission/team-overview-pattern-story
branch_strategy: Planning artifacts for this mission were generated on mission/team-overview-pattern-story. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/team-overview-pattern-story unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
- T008
- T009
- T010
phase: Phase 1 - pattern composition and final proof
history:
- at: '2026-09-07T01:05:00Z'
  actor: codex
  action: Prompt authored from issue
agent_profile: frontend-freddy
authoritative_surface: packages/elements/src/patterns/team-overview.stories.ts
create_intent:
- packages/elements/src/patterns/team-overview.stories.ts
- apps/storybook/src/tests/sk-team-overview-pattern.spec.ts
execution_mode: code_change
model: ''
owned_files:
- packages/elements/src/patterns/team-overview.stories.ts
- apps/storybook/src/tests/sk-team-overview-pattern.spec.ts
- apps/storybook/src/tests/visual.spec.ts
- apps/storybook/src/tests/visual.spec.ts-snapshots/team-overview-*.png
- expected-stories.json
- CHANGELOG.md
role: implementer
tags: []
task_type: implement
tracker_refs:
- '#150'
---

# Work Package Prompt: WP01 – Team overview Storybook composition and proof

## Agent and profile

Use a **Codex agent only**. Load the `frontend-freddy` profile through
`spk-doctrine-profile-load` before implementation. The profile governs frontend craft; it does not
authorize Claude transport. Do not start another agent harness.

## Read first

Read this prompt, then all of:

- `spec.md`
- `plan.md`
- `research.md`
- `data-model.md`
- `quickstart.md`
- root `AGENTS.md` and `CLAUDE.md`
- ADR-9, ADR-10, ADR-11
- `docs/contributing/adding-a-component.md`
- issue #150's complete body

Treat the spec as product authority and the plan as implementation authority. If they conflict, stop
and report the exact conflict instead of silently choosing.

## Objective

Build a Storybook-only Team overview pattern that proves the approved page can be assembled from
the public elements delivered by #79 and #145–#149. Use one deeply readonly fixture and pure
selectors, preserve exact content arithmetic and flow-unit separation, demonstrate controlled
row/bar/route intent, and add semantic/layout/axe/visual evidence. Do not publish a page element or
move Team Kitty responsibilities into the design library.

## Binding implementation shape

1. Create `packages/elements/src/patterns/team-overview.stories.ts`.
2. Keep fixture records, selector functions, story-local token styles, render helper, spies, and
   story exports in that excluded story module. Export pure values/functions only when tests need
   direct assertions.
3. Export `Default` with visible Storybook name `ApprovedDark`, plus `LightMode`, `Narrow`,
   `Scale50WPs`, `ControlledInteractions`, and `EmptyPartialData`.
4. Use `320, 410, 340, 604` for the full-coverage bar series: exactly €1,674. Do not reuse the
   #148 component-story series totalling €1,874.
5. Assign evidence stages, bar series, matrix columns/routes, and controlled IDs as DOM properties.
   Never serialize structured data into attributes.
6. Compose only existing public custom elements and native semantic section/list/heading elements.
   Do not call `customElements.define`, export the pattern from package barrels, or create an
   ordinary domain fixture module that enters `dist`.
7. Style through existing `--sk-*` tokens and public child surfaces. Do not query or inject into
   child shadow roots and do not add a token or modify child sources.
8. Wire `sk-action-row-activate`, `sk-bar-chart-select`, and
   `sk-transition-matrix-select` to distinct `storybook/test` spies. Their shipped events are
   bubbling, composed, and non-cancelable. Intent must not update a child-selected value unless the
   consumer harness explicitly supplies one.

## Content invariants

- €1,840 total; €166 unattributed; derived €1,674 attributed; rounded 91%.
- Evidence path €1,840 → 42 WPs → 6 missions → 2 verified.
- Quiet `34 first pass` and `4 awaiting evidence` remain subordinate.
- Matrix cells reduce to 62 moves; status counts `12 + 21 + 13 + 4` independently reduce to 50
  open WPs.
- Literal columns: `Tue 1`, `Wed 2`, `Thu 3`, `Today · Fri 4`.
- Legend contains only route tones present in the fixture.
- Route labels use `A → B`; recovery and backward stay explicit/distinct.
- Exactly one account identity anchor occupies the rail account group above logout.
- Operational order is marker → name → lowercase monospace reference → pills → time.
- No accidental byte-identical first Recent activity row copied from In flight. Intentional shared
  event identity requires consistent pills and a documented repeat reason.
- Attention amber has at most two documented meanings. A warning without a target is not a link.

## Tests and visual proof

- Add `apps/storybook/src/tests/sk-team-overview-pattern.spec.ts` and load the real built stories.
  Never duplicate the composition markup in the test.
- Cover selector arithmetic/determinism, rendered semantics, exact content, event detail/flags/count,
  controlled non-retention, dark/light parity, 390×844 document order/page overflow, and
  Scale50WPs ownership/readability.
- Add every emitted story ID to `expected-stories.json`; confirm IDs from built `index.json`.
- Add seven full-story and four focused cases to `visual.spec.ts` as specified in `plan.md`.
  Baselines are CI-authoritative. Do not bless local-font screenshots. Record the supplied approved
  capture's hash and compare Flow health honestly against the page crop and #149 baseline; do not
  claim an unavailable authenticated clean-v4 export.
- Every new story must be within the axe ratchet and report zero WCAG 2.1 AA violations.

## Prohibited scope

- No `sk-team-overview` tag/class/registration/export.
- No Team Kitty import, fetch, router, store, timer, runtime date, relative-time calculation,
  product selector, application action function, or domain persistence.
- No child element/source change, token addition, private BEM/shadow styling, new wrapper, or
  generated public artifact change.
- No merge to `main`, train-to-main merge, publish, release, or deployment.

## Verification

Run targeted checks while implementing, then the complete ordered recipe from
`docs/contributing/adding-a-component.md`. Explicitly require:

- typecheck and quality gates;
- Storybook budget below 180 seconds;
- six story IDs present and ratcheted;
- axe zero across every pattern story;
- dedicated Playwright spec in Chromium/Firefox locally and WebKit in CI;
- all eleven visual cases after CI-authoritative baseline acquisition;
- generated CSS/markup/CEM/React/Vue/SIZES/parts/docs/behavior/mutation outputs unchanged;
- clean worktree and `git diff --check`.

Immediately before final review, fetch/rebase onto current `origin/train/elements-first`, preserve
append-only unions, regenerate, and rerun. Set the #150 issue-matrix verdict to terminal `fixed`
with exact candidate evidence before moving the WP to done. Three independent Codex lenses must
pass the same exact SHA.

## Review feedback

Check the canonical event-log review result before each implementation cycle. On rejection, address
every actionable item and return the WP to review through the supported Spec Kitty command; do not
hand-edit a review artifact.
