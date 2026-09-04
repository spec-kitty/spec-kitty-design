---
work_package_id: WP01
title: The authored markup source and the element
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-004
- FR-005
planning_base_branch: mission/component-migration-batch-layout
merge_target_branch: mission/component-migration-batch-layout
branch_strategy: Planning artifacts for this mission were generated on mission/component-migration-batch-layout. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/component-migration-batch-layout unless the human explicitly redirects the landing branch.
subtasks: []
phase: Phase 1 - Element
history:
- timestamp: '2026-09-04T18:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: packages/elements/src/site-footer/sk-site-footer.markup.ts
create_intent:
- packages/elements/src/site-footer/sk-site-footer.markup.ts
- packages/elements/src/site-footer/sk-site-footer.ts
execution_mode: code_change
owned_files:
- packages/elements/src/site-footer/sk-site-footer.markup.ts
- packages/elements/src/site-footer/sk-site-footer.ts
- packages/elements/src/index.ts
- packages/elements/src/elements.ts
tags: []
tracker_refs:
- '#77'
---

# WP01 — The authored markup source and the element

`site-footer` is the last component in the catalogue apart from `form-field` (#141). Five
migrations precede it, so the shape is settled; what is not settled is where the CONTENT lives.

## What to build

A leaf `sk-site-footer.markup.ts` that is the single authored source, and an element that
renders **from it** — importing its class names rather than re-typing them. #78 shipped the
opposite and it was the gate's highest finding: the element was the only one in the repo that
imported nothing from its own markup module, so four class strings were authored twice on the
component whose whole argument was that the two paths are one shape.

Register through the guarded `define()` (ADR-10 §5) and add to **both** distribution entries —
`index.ts` and `elements.ts` (ADR-10 §2). #73 added an element to one and not the other, every
gate stayed green, and only the deployed demo went quiet.

## The year — the reason this WP is not routine (FR-004)

`packages/styles/src/site-footer/index.ts` currently does `const year = new Date().getFullYear()`
at module load, and it is the repo's ONLY hand-written styles barrel. The moment it becomes
generated output with a drift gate, **the committed artefact stops matching a fresh generation on
1 January** — CI red for everyone, no code change, ADR-11 item 9.

Make `year` a property with an explicit default; the generated forms pin a fixed value. A
consumer wanting the live year passes it. The artefact must never read a clock.

## Content ownership (FR-005)

Tagline, link labels, legal text and the brand mark are all Spec Kitty's. The component owns
layout, theming and the divider — not the words. Slot them.

The brand mark needs a deliberate decision: its `src` is `../../packages/tokens/assets/logo.webp`,
repo-relative, so any consumer copying the snippet gets a broken image. Record the call in
`decisions/`.

## Traps this repo has already paid for

- A markup module is a **LEAF** — the generator evaluates it from a `data:` URL with no module
  base, so it cannot import a helper.
- Caller-supplied values in attribute position must be escaped; in text position, neutralised
  (#163). Slot content is deliberately raw.
- `Object.hasOwn`, never `in` or truthiness, for any variant lookup.
- Render-path helpers **warn and degrade**; authoring-path helpers **throw**. A throw inside
  `render()` makes Lit reject `updateComplete` and paint an empty shadow root with no `<slot>`.
