---
work_package_id: WP03
title: Parts, behaviour tests, mutations and ratchets
dependencies:
- WP01
- WP02
requirement_refs:
- FR-007
planning_base_branch: mission/component-migration-batch-layout
merge_target_branch: mission/component-migration-batch-layout
branch_strategy: Planning artifacts for this mission were generated on mission/component-migration-batch-layout. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/component-migration-batch-layout unless the human explicitly redirects the landing branch.
subtasks: []
phase: Phase 3 - Verification
history:
- timestamp: '2026-09-04T18:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: fixtures/elements-behaviour/src/sk-site-footer.test.ts
create_intent:
- fixtures/elements-behaviour/src/sk-site-footer.test.ts
execution_mode: code_change
owned_files:
- fixtures/elements-behaviour/src/sk-site-footer.test.ts
- expected-parts.json
- expected-docs.json
- expected-stories.json
- expected-inert-theme-wrappers.json
- behaviours.json
- mutations.json
- packages/react/.wrapper-floor
tags: []
tracker_refs:
- '#77'
---

# WP03 — Verification

## Parts (FR-007)

Every declared `::part()` must be present, targetable from outside, and recorded in
`expected-parts.json` with a test that targets it. Pick the part whose absence the test would
NOTICE — #79's check-bullet arm drops the icon's part rather than the row's, because the row is
also the node other tests query to prove the element rendered at all.

**Interpolate the part name in failure messages.** `check-part-ratchet.mjs` greps the concatenated
test sources for the literal `::part(<name>)`; a copy in a message is a second, non-selector
occurrence that would keep the arm green if the real rule were deleted (#140).

## Assertions that could actually fail

- **A computed style off a SLOTTED node.** Nothing else proves `::slotted()` reaches slotted
  content. #143 had no such assertion and shipped an invalid selector because of it.
- **Both themes, and prove they DIFFERED.** Use `fixtures/elements-behaviour/src/contrast.ts` —
  `contrast()` plus `assertThemesDiffered()`. A light arm silently rendering the dark palette
  passes every ratio check, which is the failure mode that hid all of this.
- **The year does not come from the clock.** Assert the default is fixed, and that generating
  twice is byte-identical (SC-005).
- Do NOT write an assertion that cannot fail. `expect(getComputedStyle(x).color).not.toBe('')`
  is the shape this repo has shipped before.

## Ratchets

`expected-parts.json`, `expected-docs.json`, `expected-stories.json`, `.wrapper-floor`, and
`expected-inert-theme-wrappers.json` **4 → 3**. Each note must match its own data — three separate
gates have caught a note claiming one number while the data said another.

## Mutations

One entry per ADR-11 REQUIRED behaviour, keyed on a declared `(id, subject)` pair, and the red test
must carry its `[SC-NNN]` marker. A regression test that is not a charter behaviour does NOT get a
mutation — #140 and #143 both tried and both correctly reported "semantically inert".
