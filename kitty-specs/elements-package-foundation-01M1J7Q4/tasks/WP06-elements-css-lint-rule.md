---
work_package_id: WP06
title: Elements CSS lint rule — BLOCKED on an operator decision
dependencies:
- WP03
requirement_refs:
- FR-010
planning_base_branch: mission/elements-package-foundation
merge_target_branch: mission/elements-package-foundation
branch_strategy: Planning artifacts for this mission were generated on mission/elements-package-foundation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/elements-package-foundation unless the human explicitly redirects the landing branch.
subtasks:
- T018
phase: Phase 6 - Lint rule
history:
- timestamp: '2026-09-03T00:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: stylelint.config.mjs
create_intent: []
execution_mode: code_change
owned_files:
- stylelint.config.mjs
tags: []
tracker_refs: []
---

# Work Package Prompt: WP06 – Elements CSS lint rule (ADR-9 confirmation #1)

Implements IC-07. **Do not start this WP until the operator rules on scope.** It is the only WP in the mission blocked on a decision, and both post-plan lenses independently reached the same conclusion.

## Why it cannot simply be written

ADR-9 confirmation #1 wants a rule rejecting `:root`, `html`, `body` and `:host-context()` *"in `packages/elements` CSS"*. Three candidate scopes, and they are not equivalent:

| scope | result |
|---|---|
| `packages/elements/**/*.css` | **vacuous** — the Structure Decision puts component CSS in `packages/styles`; there is no `.css` under `packages/elements` |
| `packages/styles/**/*.css` | **4 immediate failures** — `sk-card.css:57,61,66,70`, all `:root[data-theme="light"] .sk-card--…`. This is the exact "1 of 14" ADR-9 §3 measured, and repairing it is out of scope under C-003 |
| per-component allowlist (today `packages/styles/src/stub/*.css`) | passes now, non-vacuous, extends with each migration batch |

`quality:stylelint` globs `packages/**/*.css`, so the middle option is a hard `lint-code` failure and a blocked merge. `stylelint.config.mjs` is also a flat config with **no `overrides` block**, so any scoping is itself new structure.

The spec's original justification — *"this mission creates the CSS surface it applies to"* — **is false**, and has been corrected.

## The decision needed

1. **Defer to #72** (the first migration mission), recording ADR-9's confirmation criterion as explicitly unmet with an owner. *(Cheapest; keeps this mission's scope honest.)*
2. **Land now over a per-component allowlist**, naming `sk-card.css`'s four occurrences as a known violation tied to its migration issue.

## Subtasks

- **T018** — Implement whichever option the operator chooses, with a red-first test proving the rule fires. If option 1, this WP closes as deferred and the disposition is recorded on #70 and in the spec.

## Definition of Done

- [ ] The operator's ruling is recorded as a Decision Moment, not inferred.
- [ ] If implemented: the rule fires red-first on a deliberately-bad selector, and `quality:stylelint` stays green on the repository as it stands.
- [ ] If deferred: ADR-9 confirmation #1 is recorded as unmet, with the owning issue named — not silently dropped.
