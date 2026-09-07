---
work_package_id: WP01
title: Work Package view patterns and proof
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
planning_base_branch: mission/work-package-view-pattern-stories
merge_target_branch: mission/work-package-view-pattern-stories
branch_strategy: Planning artifacts for this mission were generated on mission/work-package-view-pattern-stories. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/work-package-view-pattern-stories unless the human explicitly redirects the landing branch.
base_branch: train/elements-first
base_commit: f026d6939e0a6037b8b5ad04cc97d53e3e7eecec
created_at: '2026-09-07T19:55:00Z'
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
- T011
- T012
phase: Phase 1 - complete Storybook pattern and evidence
history:
- at: '2026-09-07T19:55:00Z'
  actor: codex
  action: Prompt authored for issue
agent_profile: frontend-freddy
authoritative_surface: packages/elements/src/patterns/work-package-views.stories.ts
create_intent:
- packages/elements/src/patterns/work-package-views.stories.ts
- apps/storybook/src/tests/sk-work-package-view-patterns.spec.ts
execution_mode: code_change
owned_files:
- packages/elements/src/patterns/work-package-views.stories.ts
- apps/storybook/.storybook/preview.ts
- apps/storybook/src/tests/sk-work-package-view-patterns.spec.ts
- expected-stories.json
- apps/storybook/src/tests/visual.spec.ts
- apps/storybook/src/tests/visual.spec.ts-snapshots/*.png
- docs/design-system/using-components.md
priority: P1
role: implementer
tags:
- elements-first
- pattern
- accessibility
- storybook
task_type: implement
tracker_refs:
- '#214'
- '#208'
---

# Work Package Prompt: WP01 — Work Package view patterns and proof

## Do this first: governed Codex context

Load `frontend-freddy` through the installed Spec Kitty resolver and load implementation-scoped
charter context. Read repository instructions, issue #214, `spec.md`, `plan.md`, ADR-9/10/11, and
the current component-authoring recipe. Use the installed Spec Kitty runtime CLI for action,
status, and verdict state. Never hand-edit mission status/meta/artifacts or generated files.

Run this seat on a Codex subagent only; never use Claude, a review-driver script, or a git
worktree. Stay inside the designated fresh primary clone and exact mission branch. Do not write to
GitHub, push, merge, or touch a long-lived branch.

## Outcome and boundary

Deliver the complete T10 overview and T11 detail as Storybook-only public-surface composition:
one deeply immutable fixture graph, deterministic projections, fifteen required route states,
controlled intent logging, native light-DOM relationships, accessibility/keyboard/responsive/
visual evidence, and focused usage documentation.

Do not register/export a Work Package page, card, Kanban, execution panel, metadata panel,
checklist, or route. Do not add application state, routing, fetch/storage, timers, claim expiry,
lane mutation, drag/drop, progress constants outside pure selectors, Markdown parsing/sanitizing,
relative-time formatting, event sorting/verification, trust inference, or domain-to-tone mapping.
Do not duplicate predecessor element/style ownership. Every design value uses an existing
authoritative `--sk-*` token. Consume public classes, slots, properties, events, parts, and native
semantics only; never inspect a private shadow root or copy a component's authored CSS.

## T001–T003 — Baseline, red-first contract, data

Run the focused predecessor and Storybook baselines before edits. Record the actual current story
ratchet/visual IDs and generated-artifact status. Preserve the named Stitch provenance limitation:
the approved T10/T11 URLs expose no authenticated screen payload, so the issue contract and
accepted predecessor baselines govern and no unseen pixel measurement is claimed.

Before implementation, add failing executable contract cases for deep immutability of all fifty fixture-owned records, duplicate and
unknown identifiers, 5-of-8 from the supplied `completedLaneId`, visible empty 0/0 with valid DOM
`value=0,max=1`, scale derivation without fabricated records, lane/list/progress reconciliation,
direct-child checklist semantics and subtask totals,
verbatim event order, and dark/light content parity. Then implement one exported recursively frozen
fixture containing all fifty scale records and a consumer-supplied `completedLaneId`, plus typed,
deterministic `deriveOverview` and `deriveDetail` in the excluded story module.
All repeated displayed totals and percentages must originate in those selectors. Read no clock,
randomness, network, storage, route, parser, sorter, or trust classifier.

## T004–T006 — Overview composition and states

At the sanctioned Storybook preview seam, import the missing predecessor CSS modules identified in
the plan. Author only token-backed composition layout. Render a labelled native `progress` (with DOM `value=0,max=1` for visible empty 0/0), five
named native lane sections and ordered lists, compact `sk-action-row` items, public markers/pills/
statuses, and public inline empty state. Add the overflow region/name/tabindex triad only where the
board demonstrably overflows. The narrow story uses a labelled native select with real options and
consumer-supplied visible lane.

Provide `Default`, `LightMode`, `AllLanesEmpty`, `Scale50WorkPackages`, `LiveClaim`, `StaleClaim`,
`SnapshotBehindLog`, and `NarrowOverview`. Log the documented action-row event and native select
change with typed spies. Pointer, Enter, and Space each emit exactly once; activation never mutates
the controlled selected ID, and lane change never becomes routing. Live/stale classification and
copy are supplied fixture values. Only live uses the existing pulsing presentation; snapshot uses
the public `sk-notice`.

## T007–T008 — Detail composition and states

Render breadcrumb `nav > ol` with native links and one terminal current crumb, public page header,
a native `ul` with direct passive `sk-check-bullet[role=listitem]` children and no wrapper `li`,
checkbox role, control, or host tabindex; consumer-authored Lit prompt HTML under
`.sk-prose`, a base `sk-card` with native facts, and a native ordered event timeline. Keep subtask
state, prompt, fact values, event ordering, actor/time, and trust text verbatim.

Provide `DetailPopulated`, `DetailLightMode`, `DetailNoSubtasks`, `DetailAbsentPrompt`,
`DetailHistoryUnavailable`, `DetailLongContent`, and `DetailNarrow`. Ordinary absence uses the
public empty-state class; unavailable retained history uses `sk-notice` only because its fixture
explicitly requests announcement. Keep code overflow within `pre` and history metadata within the
event at narrow widths.

## T009–T011 — Documentation and executable proof

Update the usage guide with the public composition seam and all Team Kitty-owned responsibilities.
Declare every exported helper in `meta.excludeStories`. Build Storybook, prove exactly fifteen
story entries, take their exact built IDs from the index, and update the authored story ratchet
from the latest train total by exactly +15, and never hand-edit generated distribution files.

Add a dedicated focused Playwright suite over Chromium, Firefox, and WebKit. Prove direct-child checklist semantics and every other native
relationship, exact counts/progress DOM properties, fixture-owned scale data, unique IDs, notice/empty distinction, pointer/Enter/Space
intent and unchanged selection, native lane selection, keyboard/focus order, dark/light data
signature equality plus a real token delta, 50-item scale, mobile/narrow/200%-zoom document
containment, and reachable board/code overflow. Ratchet every new story into the existing non-empty
axe scan.

Add only #214 visual cases/baselines: complete T10/T11 dark/light/narrow, board/progress/claim,
checklist/timeline, and long-code risk. CI Ubuntu output is authoritative. Do not accept or rewrite
any unrelated legacy baseline.

## T012 — Final current-train evidence

Fetch and rebase the latest `train/elements-first`, regenerate applicable shared artifacts with
repository tools, and rerun affected tests. Then run focused tests; type and lint; generation drift;
behavior and mutation checks where applicable; Storybook build; axe; relevant Playwright and
visual checks; `npm run quality:all`; and every additional repo/CI gate required by instructions.
Do not weaken or skip a gate.

Audit the final diff for every forbidden surface and prepare exact-head evidence. Any later push or
rebase invalidates CI and all adversarial reviews. Return a clean, reviewable working tree and a
concise evidence ledger to the mission orchestrator; do not merge or close the issue yourself.

## Definition of done

- All FR-001–FR-020, NFR-001–NFR-011, C-001–C-011, and SC-001–SC-011 have executable or reviewable
  evidence against one coherent fixture and exact branch head.
- Fifteen required stories are independently discoverable, non-empty, axe-clean, and limited to
  Storybook; no new public element/token/generated API exists.
- Cross-browser semantics, controlled intent, theme parity, scale, narrow/zoom containment, and
  focused/full visual evidence are green without legacy-baseline churn.
- Documentation states the application/library boundary; generated outputs are regenerated only.
- Full repository gates pass after the final train rebase and the diff is ready for independent
  read-only Codex review.
