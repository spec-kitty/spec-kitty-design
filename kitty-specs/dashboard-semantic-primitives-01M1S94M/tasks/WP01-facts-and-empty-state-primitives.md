---
work_package_id: WP01
title: Facts and empty-state primitives
dependencies: []
requirement_refs:
- C-001
- C-002
- C-004
- C-005
- FR-001
- FR-005
- FR-007
- NFR-001
- NFR-003
planning_base_branch: mission/dashboard-semantic-primitives
merge_target_branch: mission/dashboard-semantic-primitives
branch_strategy: Planning artifacts for this mission were generated on mission/dashboard-semantic-primitives. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/dashboard-semantic-primitives unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
phase: Phase 1 - Low-risk primitives
history:
- at: '2026-09-05T18:34:59Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: packages/styles/src/facts/
create_intent:
- packages/styles/src/facts/sk-facts.css
- packages/styles/src/facts/sk-facts.html
- packages/styles/src/facts/sk-facts-two-col.html
- packages/styles/src/facts/sk-facts-compact.html
- packages/styles/src/facts/sk-facts-long-value.html
- packages/styles/src/facts/sk-facts-empty-value.html
- packages/styles/src/facts/sk-facts-html.stories.ts
- packages/styles/src/facts/index.ts
- packages/styles/src/empty-state/sk-empty-state.css
- packages/styles/src/empty-state/sk-empty-state-with-action.html
- packages/styles/src/empty-state/sk-empty-state-without-action.html
- packages/styles/src/empty-state/sk-empty-state-html.stories.ts
- packages/styles/src/empty-state/index.ts
execution_mode: code_change
model: ''
owned_files:
- packages/styles/src/facts/**
- packages/styles/src/empty-state/**
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP01 – Facts and empty-state primitives

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
- **You must address all feedback** before your work is complete. Feedback items are your
  implementation TODO list.
- **Report progress**: As you address each feedback item, update the Activity Log explaining what
  you changed.

---

## Review Feedback

*None yet — this is the initial prompt.*

---

## Markdown Formatting

Wrap HTML/XML tags in backticks: `<div>`, `<script>`
Use language identifiers in code blocks: ```python, ```bash

---

## Objectives & Success Criteria

Ship two of the mission's five styles-layer primitives — `.sk-facts` (`<dl>`/`<dt>`/`<dd>`) and
`.sk-empty-state` — as authored CSS + `.html` exemplars with a **generated** barrel and a Storybook
story file. Neither primitive introduces a transition, so neither carries a
`forced-colors`/`prefers-reduced-motion` media query (that only applies to WP02/WP03's
primitives).

Done means:

- `packages/styles/src/facts/sk-facts.css` and `packages/styles/src/empty-state/sk-empty-state.css`
  exist, token-only, BEM-named per the spec's public contract.
- Both directories have authored `.html` exemplars covering the required variants.
- Both directories' `index.ts` barrels are **generated** by
  `node scripts/build-styles-only-markup.mjs` — never hand-written.
- Both have `sk-<name>-html.stories.ts` with `Default` + documented variants + the required
  `LightMode` story wrapped in `class="sk-light"` (never `data-theme`).
- `npx stylelint "packages/styles/src/facts/**/*.css" "packages/styles/src/empty-state/**/*.css"`
  and `npx htmlhint` against both directories' `.html` are clean.

## Context & Constraints

- Mission spec: `kitty-specs/dashboard-semantic-primitives-01M1S94M/spec.md` — read FR-001,
  FR-005, FR-007, NFR-001, NFR-003, C-001, C-002, C-004, C-005.
- Mission plan: `kitty-specs/dashboard-semantic-primitives-01M1S94M/plan.md` — read IC-01, IC-04,
  and the "Public Contract" section for the exact BEM class names.
- Precedent to copy structurally (file layout only): `packages/styles/src/form-field/` (CSS
  header comment style, `.html` header-comment convention the generator strips,
  `-html.stories.ts` naming). Read `packages/styles/src/form-field/sk-form-field.css`,
  `sk-form-field.html`, and `sk-form-field-html.stories.ts` before starting.
- **`LightMode` story precedent is `check-bullet`, NOT `form-field`.** Measured: form-field's own
  `LightMode` story has no `class="sk-light"` at all — only a Storybook `backgrounds` parameter —
  and `expected-inert-theme-wrappers.json` records it as a known, deliberate offender. Copying it
  would ship two more inert `LightMode` stories that `check-story-theme-wrapper.mjs` cannot catch
  (it matches for `data-theme`, not a missing `class`). Read
  `packages/styles/src/check-bullet/sk-check-bullet-html.stories.ts`'s `LightMode` export instead
  — it wraps in `<div class="sk-light" style="...">` — and copy that shape.
- Generator: `scripts/build-styles-only-markup.mjs` — read its docstring. It picks up any
  directory under `packages/styles/src/` that has a `.css` and **no** matching directory under
  `packages/elements/src`; you make **no changes to this script**.
- Token catalogue: `packages/tokens/src/tokens.css` — every color/space/radius/border value in
  your new CSS must be a `var(--sk-*)` reference. `stylelint`'s `declaration-strict-value` rule
  enforces this with **no new exceptions**.
- **No `--sk-status-*`/`--sk-chart-*` token exists yet** (epic #183 ruling) — ship tone-free; do
  not invent one even for the empty-state block.
- `LightMode` stories use `class="sk-light"`, never `data-theme="light"` (#93 — the attribute form
  activates nothing on a wrapper).

## Branch Strategy

- **Strategy**: single_branch — this mission's target branch IS `mission/dashboard-semantic-primitives`; there is no separate mission-lane branch.
- **Planning base branch**: `mission/dashboard-semantic-primitives`
- **Merge target branch**: `mission/dashboard-semantic-primitives`

> These fields are populated automatically by `spec-kitty agent mission tasks`.
> Do NOT change them manually unless you are certain the branch topology has changed.

## Subtasks & Detailed Guidance

### Subtask T001 – Author `sk-facts` CSS

- **Purpose**: The primary `.sk-facts` styling surface — stacked (default), two-column, and
  compact-density arrangements over real `<dl>`/`<dt>`/`<dd>` markup.
- **Steps**:
  1. Create `packages/styles/src/facts/sk-facts.css` with a header comment matching the
     form-field precedent's file-layout style (`/* @spec-kitty/styles — sk-facts shared styles */` etc.).
  2. `.sk-facts` (on `<dl>`): default stacked layout — each `.sk-facts__term`/`.sk-facts__value`
     pair on its own row, term above value (or inline, whichever reads better — pick one and be
     consistent; do not invent a second stacked shape).
  3. `.sk-facts--two-col`: a two-column grid arrangement, term and value side by side.
  4. `.sk-facts--compact`: a density modifier that reduces `--sk-space-*` gaps versus the default.
  5. `.sk-facts__term` styling: label-weight treatment (e.g. `--sk-weight-medium`,
     `--sk-fg-muted`). `.sk-facts__value`: `--sk-fg-default`, rendered verbatim — no
     `text-overflow: ellipsis`, no `-webkit-line-clamp`, nothing that truncates by default
     (FR-001 is explicit: values render verbatim).
  6. Use only `var(--sk-*)` tokens for every color/space/radius/border/font value.
- **Files**: `packages/styles/src/facts/sk-facts.css` (new).
- **Parallel?**: Yes, with T002 (different concern, same directory — fine to interleave, but CSS
  classes must exist before writing exemplar HTML that references them).
- **Notes**: Do not add a count/summary derivation of any kind — the spec explicitly forbids it.

### Subtask T002 – Author `sk-facts` HTML exemplars

- **Purpose**: Real, authored markup demonstrating every required variant, which the generator
  turns into the barrel's string exports.
- **Steps**:
  1. `sk-facts.html` — the bare wrapper form (mirrors `sk-form-field.html`'s role: shows the
     `.sk-facts` shape with 2-3 term/value pairs, stacked/default).
  2. `sk-facts-two-col.html` — same content with `.sk-facts--two-col` applied.
  3. `sk-facts-compact.html` — same content with `.sk-facts--compact` applied.
  4. `sk-facts-long-value.html` — a pair whose value is a long sentence/paragraph, to prove no
     truncation happens.
  5. `sk-facts-empty-value.html` — a pair whose value is empty/blank, to prove the layout does
     not collapse or look broken.
  6. Each file needs a leading HTML comment header (the generator strips **leading** comment
     blocks only — see its docstring on why this must not be a trailing or greedy match) noting
     `@spec-kitty/styles — sk-facts (variant)`.
  7. All five files must use the real `<dl>`/`<dt>`/`<dd>` tags — SC-002 is verified by grepping
     the `.html` for the native tag, not by reading story titles.
- **Files**: `packages/styles/src/facts/sk-facts.html`,
  `sk-facts-two-col.html`, `sk-facts-compact.html`, `sk-facts-long-value.html`,
  `sk-facts-empty-value.html` (all new).
- **Parallel?**: Yes, with T001.
- **Notes**: Filenames become export names via the generator's `kebab-case -> PascalCase + HTML`
  rule (e.g. `sk-facts-two-col.html` → `SkFactsTwoColHTML`). Avoid any filename segment that would
  produce an invalid JS identifier (the generator fails closed on this — see its docstring's
  `2col.html` example).

### Subtask T003 – Regenerate `facts/index.ts` and author its stories

- **Purpose**: Produce the generated barrel and the Storybook demonstration.
- **Steps**:
  1. Run `node scripts/build-styles-only-markup.mjs` (regenerates every styles-only barrel,
     including `facts/index.ts` and any other directory that already has a `.css` + `.html`, e.g.
     `form-field/index.ts` unchanged).
  2. Create `packages/styles/src/facts/sk-facts-html.stories.ts` mirroring
     `sk-form-field-html.stories.ts`'s shape: import `./sk-facts.css` for side effects, import the
     generated named exports from `./index`, define `meta` with
     `title: 'Primitives/SkFacts (HTML)'` (existing sections are `Components/`, `Elements/`,
     `Primitives/`, `Form/`, `Navigation/` — there is no `Dashboard/` section; inventing one is
     both new taxonomy and in tension with C-004), `tags: ['autodocs']`,
     `parameters: { a11y: { disable: false } }`.
  3. Stories: `Default` (stacked), `TwoColumn`, `Compact`, `LongValue`, `EmptyValue`, and the
     required `LightMode` (wrapped in `class="sk-light"`, matching `check-bullet`'s `LightMode`
     story shape — NOT form-field's, which is missing the class entirely).
  4. Verify `LightMode` actually renders differently from dark mode — inspect a computed style
     value (e.g. background) under both, don't just assume the class does something.
- **Files**: `packages/styles/src/facts/index.ts` (generated — do not hand-edit),
  `packages/styles/src/facts/sk-facts-html.stories.ts` (new).
- **Parallel?**: No — depends on T001/T002 existing.
- **Notes**: If `build-styles-only-markup.mjs` throws (e.g. "no .html to generate from"), you are
  missing an `.html` file from T002 — fix that before retrying.

### Subtask T004 – Author `sk-empty-state` CSS

- **Purpose**: A shared "nothing here yet" treatment: heading, supporting copy, one optional
  action slot position.
- **Steps**:
  1. Create `packages/styles/src/empty-state/sk-empty-state.css`.
  2. `.sk-empty-state` — a plain block container (centered content is reasonable, but do not
     assume a specific parent context).
  3. `.sk-empty-state__heading`, `.sk-empty-state__body`, `.sk-empty-state__action` — the action
     is **one optional slot position**, not a required element; the CSS must not break if it is
     absent.
  4. The primitive supplies **no copy** — do not hardcode "Nothing here yet" or similar text into
     the CSS (obviously) or lean on it in a way that makes the exemplar look wrong without it.
  5. No status/tone colouring (C-002) — no success/warning/error variant.
  6. Token-only values throughout.
- **Files**: `packages/styles/src/empty-state/sk-empty-state.css` (new).
- **Parallel?**: Yes, with T005.

### Subtask T005 – Author `sk-empty-state` HTML exemplars

- **Purpose**: Demonstrate the primitive with and without the optional action.
- **Steps**:
  1. `sk-empty-state-with-action.html` — heading + body + one action element (e.g. a `<button>`
     or `<a>` — plain markup, no `sk-button` dependency required, though using it is fine if it
     keeps the exemplar realistic).
  2. `sk-empty-state-without-action.html` — heading + body only.
  3. Leading comment headers per file, consistent with the facts primitive's convention.
- **Files**: `packages/styles/src/empty-state/sk-empty-state-with-action.html`,
  `sk-empty-state-without-action.html` (both new).
- **Parallel?**: Yes, with T004.

### Subtask T006 – Regenerate `empty-state/index.ts` and author its stories

- **Purpose**: Produce the generated barrel and the Storybook demonstration.
- **Steps**:
  1. Run `node scripts/build-styles-only-markup.mjs` again (idempotent — safe to re-run after
     T003 already ran it).
  2. Create `packages/styles/src/empty-state/sk-empty-state-html.stories.ts` — `WithAction`,
     `WithoutAction`, and the required `LightMode` story (again, `check-bullet`'s shape, not
     form-field's). Use `title: 'Primitives/SkEmptyState (HTML)'`.
- **Files**: `packages/styles/src/empty-state/index.ts` (generated),
  `packages/styles/src/empty-state/sk-empty-state-html.stories.ts` (new).
- **Parallel?**: No — depends on T004/T005.

### Subtask T007 – Stylelint + htmlhint scoped to this WP's two directories

- **Purpose**: Catch token violations and HTML issues before handoff, without waiting for the
  mission-wide gate run in WP04.
- **Steps**:
  1. `npx stylelint "packages/styles/src/facts/**/*.css" "packages/styles/src/empty-state/**/*.css"`
  2. `npx htmlhint "packages/styles/src/facts/**/*.html" "packages/styles/src/empty-state/**/*.html"`
  3. Fix any violation. Do not add a stylelint `ignoreValues` exception — if a value genuinely
     cannot be tokenized, stop and report rather than adding an exception.
- **Files**: N/A (verification only).
- **Parallel?**: No — run last, after T001–T006.

## Test Strategy

No behaviour tests apply — these primitives own no interactive behaviour (ADR-11's
required-behaviours list is inapplicable end-to-end). Verification is: stylelint, htmlhint, a
clean Storybook render, and axe zero-violations (axe is run mission-wide in WP04 once all
directories exist, but you may build Storybook locally and spot-check these two stories sooner if
useful).

## Risks & Mitigations

- **Risk**: reaching for a count/summary derivation on `.sk-facts` (e.g. "3 fields set") that the
  spec explicitly forbids. **Mitigation**: re-read FR-001 before writing the CSS; values render
  verbatim, nothing computed.
- **Risk**: `.sk-empty-state` grows a status/tone variant under implementation pressure.
  **Mitigation**: C-002 and epic #183 forbid it outright — if a real need surfaces, stop and
  report rather than deciding.
- **Risk**: a `LightMode` story copies form-field's shape (no `class="sk-light"` at all) instead
  of `check-bullet`'s (which has it). **Mitigation**: copy `check-bullet`'s `LightMode` story
  structure exactly, not form-field's; verify a computed value differs between themes.

## Review Guidance

- Confirm both CSS files pass `declaration-strict-value` with zero new exceptions.
- Confirm both `index.ts` files are byte-identical to what
  `node scripts/build-styles-only-markup.mjs --check` expects (i.e. run `--check` and see it
  report these two directories current).
- Grep both `.html` sets for `<dl>` and confirm no cell/row markup leaked in from the wrong
  primitive.
- Confirm `LightMode` uses `class="sk-light"` in both story files.

## Activity Log

> **CRITICAL**: Activity log entries MUST be in chronological order (oldest first, newest last).

- 2026-09-05T18:34:59Z – system – Prompt created.
