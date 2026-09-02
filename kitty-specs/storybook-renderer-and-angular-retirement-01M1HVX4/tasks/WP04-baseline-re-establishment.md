---
work_package_id: WP04
title: Re-establish the visual baseline set
dependencies:
- WP03
requirement_refs:
- FR-009
- C-004
planning_base_branch: mission/storybook-renderer-and-angular-retirement
merge_target_branch: mission/storybook-renderer-and-angular-retirement
branch_strategy: Planning artifacts for this mission were generated on mission/storybook-renderer-and-angular-retirement. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/storybook-renderer-and-angular-retirement unless the human explicitly redirects the landing branch.
subtasks:
- T011
- T012
- T013
phase: Phase 4 - Baselines
history:
- timestamp: '2026-09-02T20:20:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: apps/storybook/src/tests/
create_intent: []
execution_mode: code_change
owned_files:
- apps/storybook/src/tests/**
tags: []
tracker_refs: []
---

# Work Package Prompt: WP04 – Re-establish the visual baseline set

Implements IC-04.

## Context

`apps/storybook/src/tests/visual.spec.ts-snapshots/` holds **7** baselines; **4** are Angular-keyed and die with the Angular stories. ADR-13 is explicit that the remaining 3 should be **re-shot rather than assumed stable**, because Vite and webpack can differ on CSS injection order.

## Subtasks

- **T011** — Remove the 4 Angular-keyed baselines (FR-009).
- **T012** — Re-shoot the remaining 3 under the new builder. For each, state whether it changed and, if so, why. An unexplained diff is a finding, not a new baseline.
- **T013** — Apply C-004 to any `LightMode`-keyed baseline: see below.

## The `LightMode` constraint (C-004)

**Scope note, verified in this checkout: there is no `LightMode` baseline.** The 7 files are `sk-feature-card-{angular,html}-default`, `sk-ribbon-card-angular-default`, `sk-ribbon-card-{angular,html}-with-ribbon`, and `sk-stub-{angular,html}-default`. The 4 to retire are the `-angular-` ones; the 3 survivors are `sk-feature-card-html-default`, `sk-ribbon-card-html-with-ribbon`, `sk-stub-html-default`.

So C-004 does **not** bite on the baseline set. It bites on the mission's **exit criterion** — #69 requires "`LightMode` variants intact", and that is what must not be certified while #93 is open. If a `LightMode` baseline is ever added, the rule below applies to it.

**Do not re-shoot a `LightMode` baseline while #93 is open, and do not certify "LightMode intact" on the strength of a green visual suite that contains no LightMode baseline at all.**

ADR-13's confirmation #3 requires `LightMode` variants to "render correctly with `data-theme="light"` reaching the component". #93 reports that every `LightMode` story renders **dark**, because the selector is `:root[data-theme="light"]` and `:root` only matches `<html>`, while the stories set the attribute on a wrapping `<div>`. ADR-13's own spike saw a `color-contrast` violation on `LightMode` and called it pre-existing.

Re-shooting would freeze that defect into the reference set — the opposite of what FR-009 is for. The recommendation raised on #69 is to scope `LightMode` out of this mission's exit criteria and let #93 own it. **Proceed on that basis unless the operator directs otherwise, and state the decision in the PR.**

## Definition of Done

- [ ] No baseline exists without a live story (FR-009).
- [ ] Every retained baseline was re-shot under the new builder, not carried across — say so per baseline.
- [ ] Every diff is explained; none silently accepted.
- [ ] `LightMode` handled per C-004, with the disposition stated explicitly in the PR rather than implied by a green suite.
