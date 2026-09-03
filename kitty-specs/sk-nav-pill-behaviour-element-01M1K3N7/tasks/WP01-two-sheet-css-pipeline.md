---
work_package_id: WP01
title: One adopted sheet from a component with two stylesheets
dependencies: []
requirement_refs:
- FR-011
planning_base_branch: mission/sk-nav-pill-behaviour-element
merge_target_branch: mission/sk-nav-pill-behaviour-element
branch_strategy: Planning artifacts for this mission were generated on mission/sk-nav-pill-behaviour-element. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/sk-nav-pill-behaviour-element unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
phase: Phase 1 - Pipeline
history:
- timestamp: '2026-09-03T08:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: scripts/build-elements-css.mjs
create_intent: []
execution_mode: code_change
owned_files:
- scripts/build-elements-css.mjs
- packages/styles/src/nav-pill/sk-nav-pill-drawer.css
tags: []
tracker_refs: []
---

# WP01 — One adopted sheet from a component with two stylesheets

Sequenced first: the element cannot adopt a sheet the pipeline does not produce.

`packages/styles/src/nav-pill/` ships **two** stylesheets by design —
`sk-nav-pill.css` (base pill layout) and `sk-nav-pill-drawer.css` (hamburger + collapsible
panel), and its own header says "import this file IN ADDITION TO". Static consumers link both.
`scripts/build-elements-css.mjs` maps one component to exactly one source:

```js
return { name, dir: dirname(f), css: `packages/styles/src/${name}/sk-${name}.css` };
```

## Subtasks

- **T001** — Generalise the mapping to **every** `sk-*.css` in the component's styles
  directory, sorted deterministically, concatenated into one constructed stylesheet with
  per-file provenance in the generated header.

  Three things that will each cost a cycle:

  - **`sk-card.css.js` must come out byte-identical.** The current header hardcodes a single
    `// Source of record: <path>` line, so the naive change rewrites every existing generated
    module. `git diff --exit-code packages/elements/src/card/sk-card.css.js` after regenerating
    is the check (SC-107), and it belongs in this WP's own verification, not the mission's.
  - **The orphan sweep is keyed on `expected`**, built from the component list. It must keep
    working when one component maps to several sources — the sweep is per generated *module*,
    not per source, so the set does not change shape. Re-derive it rather than assume.
  - **A missing sheet stays a hard exit.** Today `!existsSync(css)` exits 1 with the path.
    A glob that matches nothing must not degrade to an empty concatenation: an empty adopted
    stylesheet is silent, and "no CSS" reads exactly like "CSS with no rules". Refuse a
    component whose styles directory yields **zero** sheets.

- **T002** — Add the single-container reflow block to `sk-nav-pill-drawer.css`. The element
  slots its items **once** and presents them as a row on desktop and as a panel below the
  breakpoint, which is what makes FR-006 possible — two slots cannot hold the same nodes.

  **ADD, do not substitute.** The existing `.sk-nav-pill__drawer` / `.is-open` rules stay:
  static consumers still use the two-container arrangement until #77–#79 migrate them, and
  breaking them here is collateral this mission has no mandate for. The new rules key off an
  attribute the element sets on its own shadow `<nav>`, so they cannot match the static markup.

- **T003** — Confirm NFR-002 on both sheets: no `:root`, `html`, `body` or `:host-context()`.
  ADR-9's cross-boundary rule, and the exact defect #72 repaired for `sk-card` — a selector
  that reaches outside the shadow root is inert with **no error and no warning**.

## Definition of Done

- `node scripts/build-elements-css.mjs --check` green.
- `git diff --exit-code packages/elements/src/card/sk-card.css.js` clean after regeneration.
- A component directory with zero `sk-*.css` exits non-zero, demonstrated.
- Both nav-pill sheets appear in the generated nav-pill module, each with its provenance line.
