---
work_package_id: WP02
title: Context sidebar and page header
dependencies:
- WP01
requirement_refs:
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
- C-007
- FR-007
- FR-008
- FR-009
- FR-010
- FR-011
- FR-015
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
planning_base_branch: mission/team-overview-shell-elements
merge_target_branch: mission/team-overview-shell-elements
branch_strategy: Planning artifacts for this mission were generated on mission/team-overview-shell-elements. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/team-overview-shell-elements unless the human explicitly redirects the landing branch.
subtasks:
- T006
- T007
- T008
- T009
phase: Phase 2 - Context and orientation
history:
- timestamp: '2026-09-05T00:00:00Z'
  agent: codex
  action: Prompt generated via spec-kitty tasks
authoritative_surface: packages/styles/src/context-sidebar/
create_intent:
- packages/styles/src/context-sidebar/**
- packages/styles/src/page-header/**
- packages/elements/src/context-sidebar/**
- packages/elements/src/page-header/**
- fixtures/elements-behaviour/src/sk-context-sidebar.test.ts
- fixtures/elements-behaviour/src/sk-page-header.test.ts
execution_mode: code_change
owned_files:
- packages/styles/src/context-sidebar/**
- packages/styles/src/page-header/**
- packages/elements/src/context-sidebar/**
- packages/elements/src/page-header/**
- fixtures/elements-behaviour/src/sk-context-sidebar.test.ts
- fixtures/elements-behaviour/src/sk-page-header.test.ts
tags: []
tracker_refs:
- '#145'
- '#144'
---

# Work Package Prompt: WP02 – Context sidebar and page header

## Objective

Implement the two remaining slot-only elements on WP01's controlled composition contract:
`sk-context-sidebar` for selected-context content and `sk-page-header` for page orientation. They
lay out consumer content; they do not know a team, route, current time, selection or action.

Before editing, load the assigned implementation profile through the canonical profile surface and
read the mission artifacts plus ADR-9/10/11 and the component recipe. Start only from approved
WP01 through the canonical dependency-specific base.

## Owned paths

- `packages/styles/src/context-sidebar/**`
- `packages/styles/src/page-header/**`
- `packages/elements/src/context-sidebar/**`
- `packages/elements/src/page-header/**`
- `fixtures/elements-behaviour/src/sk-context-sidebar.test.ts`
- `fixtures/elements-behaviour/src/sk-page-header.test.ts`

WP04 owns entries/exports, registries, ratchets, aggregate generated files, browser/visual specs and
docs. Do not create `.markup.ts`, static `.html` or styles `index.ts` files.

## Subtasks

### T006 — Start with focused semantic and no-time probes

Create tests before implementation. For the context sidebar, cover named/default slots, exact four
parts, a labelled `<aside>` with fallback `Context`, full source/accessibility text under visual
ellipsis, adopted stylesheet identity and native event pass-through. For the page header, cover all
five slots, exact eight parts, consumer heading-level preservation, byte-for-byte sync text after a
controlled elapsed-time probe, zero timer/clock calls, narrow DOM order and reachable actions.
Add an SC-010 late-definition context-sidebar case that assigns a deliberate whitespace-bearing
`label` property before definition, then proves exact property/attribute preservation and unchanged
projection to the real `<aside>`. Keep SC-013/SC-014 annotations exact and defer all
mutations/registry entries to WP04.

### T007 — Implement `sk-context-sidebar`

Render a reflected-label `<aside>` with `header`, default and `footer` slots. Use trimming only to
detect a blank label; project a valid supplied string unchanged. Do not wrap generic content in a
false `<nav>`. Apply `min-width: 0`/max-width constraints and CSS-only ellipsis to
direct supplied labels without rewriting accessible text. Add no team selection/switch behavior.
Add `Default`, `LongLabels`, `Empty` and `LightMode` stories and complete public JSDoc.

### T008 — Implement `sk-page-header`

Render a `<header>` with text group (`eyebrow`, `title`, `supporting`) and metadata group (`sync`,
`actions`) using the exact eight parts from the plan. Never synthesize a heading or freshness copy;
never read a clock or start a timer. Reflow metadata below text without overlap or lost actions.
Add `Default`, `LongTitle`, `WithoutMetadata` and `LightMode` stories and complete public JSDoc.

### T009 — Focused generation and handoff

Generate local CSS JS/declaration files. Run the two focused fixtures, CSS hygiene, adopted-style
checks, typecheck, stylelint and relevant story theme checks. Record the exact failing-before and
passing-after evidence, head SHA and intentionally deferred shared integration work.

## Definition of done

- Every focused probe was observed failing for its intended reason before implementation.
- Context labels can visually truncate while their complete supplied accessible text remains.
- A context `label` assigned before late definition survives, reflects exactly and names the real
  complementary landmark without trimming a valid value.
- Consumer heading semantics and sync text are untouched; no clock/timer call exists.
- Every one of the 12 documented parts is present and externally targetable.
- Dark/default and light stories are real, non-empty, generic compositions.
- No Team Kitty vocabulary, state, handler, raw design value or shared-file edit appears.
- Focused checks pass and the tree is ready for independent WP review.
