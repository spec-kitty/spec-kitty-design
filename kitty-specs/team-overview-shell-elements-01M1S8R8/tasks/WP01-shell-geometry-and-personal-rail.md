---
work_package_id: WP01
title: Shell geometry and personal rail
dependencies: []
requirement_refs:
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
- FR-011
- FR-015
- NFR-002
- NFR-003
- NFR-004
- NFR-005
planning_base_branch: mission/team-overview-shell-elements
merge_target_branch: mission/team-overview-shell-elements
branch_strategy: Planning artifacts for this mission were generated on mission/team-overview-shell-elements. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/team-overview-shell-elements unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
phase: Phase 1 - Foundation shell
history:
- timestamp: '2026-09-05T00:00:00Z'
  agent: codex
  action: Prompt generated via spec-kitty tasks
authoritative_surface: packages/tokens/src/
create_intent:
- packages/styles/src/app-shell/**
- packages/styles/src/personal-rail/**
- packages/elements/src/app-shell/**
- packages/elements/src/personal-rail/**
- fixtures/elements-behaviour/src/sk-app-shell.test.ts
- fixtures/elements-behaviour/src/sk-personal-rail.test.ts
execution_mode: code_change
owned_files:
- packages/tokens/src/tokens.css
- packages/tokens/dist/token-catalogue.json
- packages/styles/src/app-shell/**
- packages/styles/src/personal-rail/**
- packages/elements/src/app-shell/**
- packages/elements/src/personal-rail/**
- fixtures/elements-behaviour/src/sk-app-shell.test.ts
- fixtures/elements-behaviour/src/sk-personal-rail.test.ts
tags: []
tracker_refs:
- '#145'
- '#144'
---

# Work Package Prompt: WP01 – Shell geometry and personal rail

## Objective

Implement `sk-app-shell` and `sk-personal-rail` as controlled, presentational Lit elements. Add the
two semantic layout tokens that express the approved 56px personal rail and 240px context column.
Keep all application data, visibility, routing, icons and actions outside the design system.

Before editing, load the assigned implementation profile through the canonical
`spk-doctrine-profile-load` surface and read `../spec.md`, `../plan.md`, `../research.md`, ADR-9,
ADR-10, ADR-11 and the component-authoring recipe. Work only on the owned paths below.

## Owned paths

- `packages/tokens/src/tokens.css`
- `packages/tokens/dist/token-catalogue.json` (generator output only)
- `packages/styles/src/app-shell/**`
- `packages/styles/src/personal-rail/**`
- `packages/elements/src/app-shell/**`
- `packages/elements/src/personal-rail/**`
- `fixtures/elements-behaviour/src/sk-app-shell.test.ts`
- `fixtures/elements-behaviour/src/sk-personal-rail.test.ts`

Do not edit entries, package exports, ratchets, behavior/mutation registries, aggregate manifest,
React/Vue wrappers, SIZES, shared browser/visual specs or docs; WP04 owns them. Do not add shell
`.markup.ts`, static `.html` or styles `index.ts` files: a slot-only shell has no honest static form.

## Subtasks

### T001 — Start with non-inert focused probes

Create behavior fixtures for both tags before implementation. Prove slot assignment/empty output,
document order, exact parts and external `::part()` targetability, stylesheet identity with zero
shadow `<style>` tags, and native descendant event pass-through without redispatch. For the shell,
measure token-backed columns at 1280px/1440px and prove width-safe narrow reflow without internal
visibility state. For the rail, prove its named `<nav>`, blank-label fallback, group order, account
above logout and no synthesized identity. Add an SC-010 late-definition case that assigns a
deliberate whitespace-bearing `label` property before defining a subclass, then proves exact
property/attribute preservation and unchanged projection to the real landmark. Keep SC-013/SC-014
test annotations exact, but leave all registry/mutation entries to WP04; slot/pass-through probes
are direct tests, not invented SC ids.

### T002 — Add token authority

Add `--sk-layout-personal-rail-width: 3.5rem` and
`--sk-layout-context-sidebar-width: 15rem` to both theme blocks in `tokens.css`. Do not introduce
any other design value. Run `npx nx run tokens:catalogue`; never hand-edit the catalogue.

### T003 — Implement `sk-app-shell`

Use an open shadow root, generated stylesheet import, `static styles = [sheet]`, `define()` helper
and the exact slot/part contract in `plan.md`. Desktop must use the two layout tokens plus a
`minmax(0, 1fr)`-equivalent content column. At the established 720px structural boundary, reflow in
DOM order while keeping every supplied region present. Add `Default`, `DesktopComposition`,
`Narrow`, `EmptyRegions` and `LightMode` stories with generic, semantic fixture content. Include
public JSDoc needed by later CEM/wrapper generation.

### T004 — Implement `sk-personal-rail`

Render one internal `<nav>` with reflected `label` and exact fallback `Personal navigation` for
missing/blank values. Use trimming only to detect a blank value; project a valid supplied label
unchanged. Lay out `primary`, then a bottom group containing `utilities`, divider,
`account`, `logout`; account must remain above logout. Preserve native descendants and add no click,
keyboard, route, selected or identity logic. Add `Default`, `LongLabels`, `EmptyGroups` and
`LightMode` stories. Include public JSDoc.

### T005 — Focused generation and handoff

Generate only the component-local CSS JS/declaration files and generate/commit the timestamped
token catalogue once for this changed token-source state. Immediately run the exact read-only
source/catalogue comparator from `plan.md`; it must match every field except `generated_at`. Run
focused Vitest files, CSS hygiene, adopted-style boundary checks, typecheck,
stylelint and the relevant story theme check. Record exact commands, results, head SHA and any
intentionally deferred aggregate failure in the WP review evidence.

## Definition of done

- Every asserted probe was observed failing for the intended reason before its implementation.
- Desktop columns resolve to 56px and 240px; narrow layout neither hides nor opens navigation.
- The personal landmark is named and account content has only its consumer-supplied bottom slot.
- A `label` property assigned before late definition survives, reflects exactly and names the real
  landmark without trimming a valid supplied value.
- All 13 documented parts across these elements exist and are externally targetable.
- CSS contains no raw design literal, ancestor-theme selector or inline style injection.
- No application state/event/icon vocabulary and no out-of-scope/shared file appears in the diff.
- Focused checks pass and the tree is ready for an independent WP review.
