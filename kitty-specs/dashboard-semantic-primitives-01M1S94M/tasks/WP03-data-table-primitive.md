---
work_package_id: WP03
title: Data-table primitive and the narrow-width region
dependencies: []
requirement_refs:
- C-001
- C-003
- C-004
- C-005
- FR-003
- FR-004
- FR-007
- FR-009
- NFR-001
- NFR-003
planning_base_branch: mission/dashboard-semantic-primitives
merge_target_branch: mission/dashboard-semantic-primitives
branch_strategy: Planning artifacts for this mission were generated on mission/dashboard-semantic-primitives. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/dashboard-semantic-primitives unless the human explicitly redirects the landing branch.
subtasks:
- T015
- T016
- T017
- T018
- T019
- T020
phase: Phase 1 - Highest-risk primitive
history:
- at: '2026-09-05T18:34:59Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: packages/styles/src/data-table/
create_intent:
- packages/styles/src/data-table/sk-data-table.css
- packages/styles/src/data-table/sk-data-table-default.html
- packages/styles/src/data-table/sk-data-table-sticky-header.html
- packages/styles/src/data-table/sk-data-table-narrow-scrollable.html
- packages/styles/src/data-table/sk-data-table-html.stories.ts
- packages/styles/src/data-table/index.ts
execution_mode: code_change
model: ''
owned_files:
- packages/styles/src/data-table/**
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP03 – Data-table primitive and the narrow-width region

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and
behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `implementer-ivan`
- **Role**: `implementer`
- **Agent/tool**: `claude`

If no profile is specified, run `spec-kitty agent profile list` and select the best match for
`implement` work against `packages/styles/src/`.

---

## ⚠️ IMPORTANT: Review Feedback

**Read this first if you are implementing this task!**

- **Has review feedback?**: Check the `review_ref` field in the event log (via
  `spec-kitty agent tasks status` or the Activity Log below).
- **You must address all feedback** before your work is complete.
- **Report progress**: As you address each feedback item, update the Activity Log.

---

## Review Feedback

*None yet — this is the initial prompt.*

---

## Markdown Formatting

Wrap HTML/XML tags in backticks: `<table>`, `<caption>`, `<th scope="col">`
Use language identifiers in code blocks: ```python, ```bash

---

## Objectives & Success Criteria

Ship `.sk-data-table` — the highest-risk primitive in this mission. It styles a real
`<table>`/`<caption>`/`<th scope>`, and its narrow-width treatment is **one specific, documented
approach**: a labelled, keyboard-scrollable container (`role="region"` + accessible name +
`tabindex="0"`) wrapping an **intact** table. **Block-reflow of cells to a stacked/card layout at
narrow widths is explicitly rejected** — it is the exact defect this mission exists to fix in the
Factory Dashboard source, because it severs header→cell association.

Done means:

- `packages/styles/src/data-table/sk-data-table.css` exists, token-only, with zebra/hover/
  numeric-alignment/sticky-header treatments and the `.sk-data-table__scroller` wrapper styling.
- A `@media (forced-colors: active)` block covers the table's borders (the third of this
  mission's three required forced-colors locations — skip-link focus and the disclosure marker
  are WP02's).
- Authored `.html` exemplars: a default table with `<caption>` and proper `<th scope>`, a
  sticky-header variant, and a narrow-width variant demonstrating the scroller wrapping an
  **intact** table.
- A **generated** `index.ts` barrel and `sk-data-table-html.stories.ts`.
- SC-002 and SC-003 both independently verified (see T018/T019).

## Context & Constraints

- Mission spec: `kitty-specs/dashboard-semantic-primitives-01M1S94M/spec.md` — read FR-003,
  FR-004 (the non-negotiable one), FR-007, FR-009, NFR-001, NFR-003, C-001, C-003, C-004, C-005,
  and SC-002/SC-003 exactly.
- Mission plan: `kitty-specs/dashboard-semantic-primitives-01M1S94M/plan.md` — read IC-03, IC-06
  (your share of it), and the "Public Contract" section.
- **FR-004 is the single hardest constraint in this mission.** The issue's own evidence names the
  defect being fixed: "a narrow-width treatment that reflows cells to blocks and drops header
  association" in the Factory Dashboard source. Do not reproduce any variant of that pattern —
  no `display: block` on `tr`/`td` at a breakpoint, no `data-label` pseudo-header trick, no
  card-per-row transformation. The *only* accepted narrow-width technique is a scrollable
  container around the untouched table.
- ADR-9 §4 (read it: `docs/architecture/decisions/2026-09-02-9-shadow-dom-and-styling-api.md`) is
  about a different mechanism (ID scoping across shadow roots) but the underlying principle —
  `<th id>`/`<td headers>` association requires the DOM to stay structurally intact — is exactly
  why FR-004 is worded the way it is, even though this primitive has no shadow root at all.
- Precedent for a scrollable/sticky table region (different component, same platform mechanism):
  skim `packages/styles/src/transition-matrix/sk-transition-matrix.css` for its scroller/sticky
  patterns — it is a custom element, not a precedent to copy structurally, but its CSS technique
  for a labelled scrollable region is instructive.
- Generator: `scripts/build-styles-only-markup.mjs` — no changes to this script.
- Token catalogue: `packages/tokens/src/tokens.css` — token-only CSS. No `--sk-status-*`/
  `--sk-chart-*` (C-002, epic #183 ruling) — no row/cell tone colouring.
- No sorting, filtering, pagination, virtualization, row-selection, column-resizing, or sticky
  *columns* (C-003) — sticky **header row** is explicitly in scope (FR-003); sticky columns are
  not.
- `LightMode` stories use `class="sk-light"`, never `data-theme="light"` (#93).

## Branch Strategy

- **Strategy**: single_branch — this mission's target branch IS `mission/dashboard-semantic-primitives`.
- **Planning base branch**: `mission/dashboard-semantic-primitives`
- **Merge target branch**: `mission/dashboard-semantic-primitives`

> These fields are populated automatically by `spec-kitty agent mission tasks`.
> Do NOT change them manually unless you are certain the branch topology has changed.

## Subtasks & Detailed Guidance

### Subtask T015 – Author `sk-data-table` CSS

- **Purpose**: The full styling surface: base table treatment, zebra/hover, numeric alignment,
  sticky header modifier, the scroller wrapper, and the forced-colors border treatment.
- **Steps**:
  1. Create `packages/styles/src/data-table/sk-data-table.css`.
  2. `.sk-data-table` (on `<table>`): `border-collapse: collapse` (or `separate` with
     `border-spacing: 0` — pick one and be consistent), zebra striping on alternate `<tbody>` rows
     using a token background (e.g. `--sk-surface-muted` at low emphasis or an existing tint
     token), a hover-row highlight (`--sk-surface-pill` or similar), and header-row styling
     (`--sk-fg-muted`/`--sk-weight-medium` text, a bottom border using `--sk-border-default`).
  3. `.sk-data-table__cell--numeric`: `text-align: right`, `font-variant-numeric: tabular-nums`.
  4. `.sk-data-table--sticky-header` (modifier on `.sk-data-table` or its wrapper — pick whichever
     makes `position: sticky` actually work given your markup structure; sticky positioning
     requires the scrolling ancestor to be the `__scroller`, and `<thead>`/`<th>` need
     `position: sticky; top: 0` plus a solid token background so content doesn't show through).
  5. `.sk-data-table__scroller`: `overflow-x: auto`, and when focused (it carries `tabindex="0"`
     in the markup — see T016) a visible `:focus-visible` outline using token values, so a
     keyboard user can tell they've tabbed onto the scrollable region itself.
  6. `@media (forced-colors: active)`: ensure table borders remain visible — typically forcing
     `border-color: CanvasText` or a similar system-color reliance on `border` declarations,
     since forced-colors mode strips custom background/foreground colors but respects explicit
     borders when their color resolves to a system keyword.
  7. Token-only values throughout (same caveat as WP02 T008 about system-color keywords inside the
     forced-colors block — flag explicitly if `declaration-strict-value` needs a new, minimal,
     deliberate exception rather than silently adding one).
- **Files**: `packages/styles/src/data-table/sk-data-table.css` (new).
- **Parallel?**: No — the exemplar HTML in T016 depends on knowing the exact class names/markup
  shape this CSS expects (e.g. whether the scroller is a `<div>` around the `<table>` or the
  `<table>` itself scrolls). Decide the markup contract here, note it in the CSS file's header
  comment, then hand off to T016.

### Subtask T016 – Author `sk-data-table` HTML exemplars

- **Purpose**: Real markup for the default, sticky-header, and narrow-scrollable variants — all
  built on an intact `<table>`.
- **Steps**:
  1. `sk-data-table-default.html` — a realistic multi-row, multi-column table (e.g. 4-5 columns,
     4-6 rows) with a real `<caption>`, `<thead><tr><th scope="col">...</th></tr></thead>`, and a
     `<tbody>` with real cells. Include at least one numeric column using
     `.sk-data-table__cell--numeric`.
  2. `sk-data-table-sticky-header.html` — same shape with `.sk-data-table--sticky-header` applied,
     and enough rows that scrolling is meaningful (so the sticky behavior is actually
     demonstrable in the story, not just theoretical).
  3. `sk-data-table-narrow-scrollable.html` — the **load-bearing exemplar**:
     ```html
     <div class="sk-data-table__scroller" role="region" aria-label="<accessible name>" tabindex="0">
       <table class="sk-data-table">
         <caption>...</caption>
         <thead><tr><th scope="col">...</th>...</tr></thead>
         <tbody>...</tbody>
       </table>
     </div>
     ```
     The `<table>` inside must be **byte-for-byte structurally identical in kind** to the default
     variant — same `<th scope>` usage, same cell structure, nothing reflowed to `display: block`
     or turned into a card. Only the wrapper changes.
  4. Leading comment headers per file, noting the real tags used (SC-002 verification target).
- **Files**: three new `.html` files under `packages/styles/src/data-table/`.
- **Parallel?**: No — depends on T015's markup contract.

### Subtask T017 – Regenerate `data-table/index.ts` and author its stories

- **Purpose**: Generated barrel + Storybook demonstration, including a constrained-width
  presentation so the scroller is actually exercised.
- **Steps**:
  1. `node scripts/build-styles-only-markup.mjs`.
  2. `packages/styles/src/data-table/sk-data-table-html.stories.ts`: `Default`, `StickyHeader`,
     and `NarrowScrollable` (use a Storybook `decorators`/inline wrapper `style="max-width: ...;"`
     or the `viewport` parameter/addon if configured, to force the narrow condition so the
     scroller visibly activates — check `.storybook/preview.ts` or `main.ts` for what's already
     wired before assuming an addon is available). Include the required `LightMode` story, and a
     forced-colors documentation note/story per SC-005 for the table borders.
- **Files**: `packages/styles/src/data-table/index.ts` (generated),
  `sk-data-table-html.stories.ts` (new).
- **Parallel?**: No — depends on T015/T016.

### Subtask T018 – Verify SC-003: scroller focusable, named, header association intact

- **Purpose**: Independently prove the narrow-width treatment satisfies the mission's
  non-negotiable constraint, not just eyeball it.
- **Steps**:
  1. Open `sk-data-table-narrow-scrollable.html`'s rendered story (or the raw HTML file in a
     browser) and confirm via devtools/accessibility inspector:
     - The `.sk-data-table__scroller` element has `role="region"`, a non-empty accessible name
       (from `aria-label` or `aria-labelledby`), and `tabindex="0"` — Tab reaches it as a
       standalone stop.
     - Every `<th scope="col">`/`<th scope="row">` inside still associates correctly with its
       column/row — nothing about the wrapper changes the table's internal structure.
  2. Record what you checked (tool used, what you saw) in this WP's Activity Log or a short note
     for the reviewer — "I looked at it and it seemed fine" is not sufficient; name the concrete
     signal (e.g. "Chromium accessibility tree shows role=region, name='<name>', focusable=true").
- **Files**: N/A (verification only; note evidence in Activity Log).
- **Parallel?**: No — depends on T016/T017 existing.

### Subtask T019 – Verify SC-002 for this primitive: real table markup, no reflow

- **Purpose**: Confirm the authored `.html` genuinely uses native table semantics and that no CSS
  in this WP reflows cells at any breakpoint.
- **Steps**:
  1. `grep -n '<table\|<caption\|<th scope' packages/styles/src/data-table/*.html` — confirm all
     three exemplars contain real instances (SC-002's verification method: grep the `.html`, not
     the story titles).
  2. Read back through `sk-data-table.css` and confirm no rule sets `display: block`,
     `display: grid` (as a row-reflow technique), or similar on `tr`/`td`/`th` at any media query
     — the scroller is the only narrow-width mechanism, and it changes zero table-internal CSS.
- **Files**: N/A (verification only).
- **Parallel?**: No — depends on T015/T016.

### Subtask T020 – Stylelint + htmlhint scoped to `data-table/`; confirm forced-colors covers borders only

- **Purpose**: Local verification before handoff.
- **Steps**:
  1. `npx stylelint "packages/styles/src/data-table/**/*.css"`
  2. `npx htmlhint "packages/styles/src/data-table/**/*.html"`
  3. Confirm the `@media (forced-colors: active)` block in `sk-data-table.css` touches border
     treatment only — no duplicate handling of skip-link focus or the disclosure marker (those
     are WP02's).
- **Files**: N/A (verification only).
- **Parallel?**: No — run last.

## Test Strategy

No behaviour tests apply. Verification is stylelint, htmlhint, the SC-002/SC-003 checks above, a
clean Storybook render, and axe zero-violations (axe run mission-wide in WP04). If Playwright or a
similar tool is easy to reach for a quick manual accessibility-tree check for T018, use it; a
devtools inspection is also acceptable evidence as long as it's concretely described.

## Risks & Mitigations

- **Risk (highest in the mission)**: reaching for a familiar "responsive table" pattern that
  reflows rows to cards/blocks at narrow widths. **Mitigation**: FR-004 forbids this outright —
  re-read it and the issue's own evidence before writing any narrow-width CSS; the scroller
  wrapper is the *only* accepted mechanism.
- **Risk**: sticky header positioning silently fails because `position: sticky`'s containing
  block isn't the scroller (a common CSS pitfall — an intervening `overflow` or `transform` on an
  ancestor breaks stickiness). **Mitigation**: verify visually in the `StickyHeader` story that
  the header actually stays pinned while scrolling.
- **Risk**: the scroller's `tabindex="0"` is present but nothing communicates *why* it's
  focusable to a keyboard user (no visible focus ring). **Mitigation**: the `:focus-visible`
  outline on `.sk-data-table__scroller` in T015 is required, not optional.
- **Risk**: a status/tone color creeps into zebra striping or a "highlighted row" concept.
  **Mitigation**: C-002 forbids it; use neutral surface tokens only.

## Review Guidance

- This is the WP a reviewer should spend the most time on. Re-derive SC-003 independently rather
  than trusting the Activity Log note — open the narrow story yourself and check the accessibility
  tree.
- Confirm no `<td>`/`<tr>` gains `display: block` at any breakpoint anywhere in the CSS.
- Confirm the forced-colors block is scoped to borders only.
- Confirm `LightMode` uses `class="sk-light"`.

## Activity Log

> **CRITICAL**: Activity log entries MUST be in chronological order (oldest first, newest last).

- 2026-09-05T18:34:59Z – system – Prompt created.
