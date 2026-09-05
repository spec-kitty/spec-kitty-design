---
work_package_id: WP03
title: Accessible icon-size button extension
dependencies:
- WP02
requirement_refs:
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
- FR-012
- FR-013
- FR-014
- FR-016
- FR-017
- NFR-001
- NFR-002
- NFR-004
planning_base_branch: mission/team-overview-shell-elements
merge_target_branch: mission/team-overview-shell-elements
branch_strategy: Planning artifacts for this mission were generated on mission/team-overview-shell-elements. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/team-overview-shell-elements unless the human explicitly redirects the landing branch.
subtasks:
- T010
- T011
- T012
phase: Phase 3 - Existing button extension
history:
- timestamp: '2026-09-05T00:00:00Z'
  agent: codex
  action: Prompt generated via spec-kitty tasks
authoritative_surface: packages/elements/src/button/
create_intent: []
execution_mode: code_change
owned_files:
- packages/elements/src/button/sk-button.ts
- packages/elements/src/button/sk-button.markup.ts
- packages/elements/src/button/sk-button.stories.ts
- packages/elements/src/button/sk-button.css.js
- packages/elements/src/button/sk-button.css.d.ts
- packages/styles/src/button/sk-button.css
- fixtures/elements-behaviour/src/sk-button.test.ts
tags: []
tracker_refs:
- '#145'
- '#153'
- '#79'
---

# Work Package Prompt: WP03 – Accessible icon-size button extension

## Objective

Extend the single landed #79 `sk-button` with `size="icon"`, a real-control accessible name and
focus delegation. Preserve the existing declared static axes, tone/size validation, native
button/link branching, disabled behavior and consumer-owned glyph slot. Do not create another
button or icon abstraction and do not absorb #154's wrapper `tabIndex` policy.

Before editing, load the assigned implementation profile and read the mission artifacts, issue
#153, landed #79 implementation/tests, ADR-9/10/11 and the component recipe.

## Owned files

- `packages/elements/src/button/sk-button.ts`
- `packages/elements/src/button/sk-button.markup.ts`
- `packages/elements/src/button/sk-button.stories.ts`
- `packages/styles/src/button/sk-button.css`
- generated `packages/elements/src/button/sk-button.css.{js,d.ts}`
- `fixtures/elements-behaviour/src/sk-button.test.ts`

Do not edit `BUTTON_AXES` merely because `BUTTON_SIZES` grows; the size-only static form paints no
consumer glyph. Do not add an `Icon` static export, icon SVG, route/action meaning, shared ratchet,
manifest or wrapper by hand. WP04 owns aggregate generation and shared records.

## Subtasks

### T010 — Write direct red-first contract probes

Before source changes, add focused tests that fail for the intended missing behavior and later pass:

- inner `BUTTON` and inner `A` both have `toHaveAccessibleName()` equal to the supplied label;
- missing and whitespace-only icon labels follow the documented forgiving-render and strict-static
  policy, while a valid strict static form escapes but otherwise preserves the supplied label;
- an SC-010 late-definition case assigns a non-empty whitespace-bearing `label` property before
  defining a subclass and proves exact property/attribute/inner-`aria-label` preservation, plus the
  platform-normalized computed accessible name;
- `host.focus()` reaches the inner native control with no extra host tab stop;
- the real button and link are exactly 40px square and expose a non-zero token-driven
  `:focus-visible` indicator in dark and light contexts;
- distinct consumer glyphs render without component-selected icon content;
- tone + icon size compose, and all landed #79 text/sm/link/disabled/unknown/static paths remain.

These are direct regression probes, not new or mislabelled ADR-11 behavior IDs. Record at least one
intentional source reversal per accessible-name, focus and geometry contract with the exact named
assertion it kills.

### T011 — Implement only the required extension

Add `icon: 'sk-button--icon'` to `BUTTON_SIZES` while leaving `BUTTON_AXES` an explicit independent
declaration. Extend the public Lit size union and add a documented reflected `label` property.
Use trimming only to reject a blank value; forward every valid supplied string unchanged to
`aria-label` on both real native branches. Warn once per invalid value transition for a forgiving
`size="icon"` render; reject missing/blank label in the strict static helper and escape but do not
trim a valid value. Set
`shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true }`.

Style the real control to `var(--sk-space-8)` square with no inline padding and add an explicit
token-only focus-visible outline for every size/theme. Add `Icon`, `IconLink`, `IconFocus` and icon
examples inside `LightMode`; every conformance story must be named and consumer supplies glyphs.
Regenerate only the local CSS outputs.

### T012 — Prove compatibility and hand off

Run the complete `sk-button` fixture, static markup generation/check, local CSS generation/check,
typecheck, stylelint, adopted-style checks and relevant Storybook/axe probes. Verify button remains
four existing documented attributes plus the additive fifth `label` in authored source; WP04 will
update the ratchet and generated declarations. Record exact red/green evidence and head SHA.

## Definition of done

- Both real native branches compute the exact supplied accessible name and stay native.
- A whitespace-bearing `label` assigned before late definition survives and is reflected/projected
  byte-for-byte; only the platform's accessible-name computation may normalize whitespace.
- Missing/blank icon labels are diagnosed/rejected per the two-path policy.
- Programmatic host focus reaches the inner control; no duplicate tab stop is introduced.
- The inner control is 40px square and focus-visible in dark and light contexts.
- `BUTTON_AXES` and all existing #79 paths remain unchanged except the intentional additive API.
- No icon catalogue, generated aggregate hand edit, #154 change or shared-file edit appears.
- Focused checks pass and the tree is ready for independent WP review.
