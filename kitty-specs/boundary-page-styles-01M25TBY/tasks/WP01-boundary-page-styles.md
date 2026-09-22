---
work_package_id: WP01
title: Add the sk-boundary-page styles-only frame (#303, composes
dependencies: []
requirement_refs:
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
- C-007
- C-008
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
- FR-007
- FR-008
- FR-009
- FR-010
- FR-011
- FR-012
- FR-013
- FR-014
- FR-015
- FR-016
- FR-017
- NFR-001
- NFR-002
- NFR-003
- NFR-004
planning_base_branch: mission/boundary-page-styles
merge_target_branch: mission/boundary-page-styles
branch_strategy: Planning artifacts for this mission were generated on mission/boundary-page-styles. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/boundary-page-styles unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
- T008
- T009
- T010
- T011
- T012
- T013
- T014
- T015
phase: Phase 1 - Implementation (only phase; C-001 bounds this mission to one WP)
history:
- at: '2026-09-10T14:19:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: packages/styles/src/boundary-page/
create_intent:
- packages/styles/src/boundary-page/sk-boundary-page.css
- packages/styles/src/boundary-page/sk-boundary-page-form-card.html
- packages/styles/src/boundary-page/sk-boundary-page-terminal-card.html
- packages/styles/src/boundary-page/sk-boundary-page-without-mark.html
- packages/styles/src/boundary-page/sk-boundary-page-without-footnote.html
- packages/styles/src/boundary-page/sk-boundary-page-with-footnote.html
- packages/styles/src/boundary-page/sk-boundary-page-several-actions.html
- packages/styles/src/boundary-page/sk-boundary-page-no-action.html
- packages/styles/src/boundary-page/sk-boundary-page-long-identifier.html
- packages/styles/src/boundary-page/sk-boundary-page-long-email.html
- packages/styles/src/boundary-page/sk-boundary-page-forced-colors.html
- packages/styles/src/boundary-page/index.ts
- packages/styles/src/boundary-page/sk-boundary-page-html.stories.ts
- apps/storybook/src/tests/sk-boundary-page-absence.spec.ts
- apps/storybook/src/tests/sk-boundary-page-responsive.spec.ts
execution_mode: code_change
model: ''
owned_files:
- packages/styles/src/boundary-page/sk-boundary-page.css
- packages/styles/src/boundary-page/sk-boundary-page-form-card.html
- packages/styles/src/boundary-page/sk-boundary-page-terminal-card.html
- packages/styles/src/boundary-page/sk-boundary-page-without-mark.html
- packages/styles/src/boundary-page/sk-boundary-page-without-footnote.html
- packages/styles/src/boundary-page/sk-boundary-page-with-footnote.html
- packages/styles/src/boundary-page/sk-boundary-page-several-actions.html
- packages/styles/src/boundary-page/sk-boundary-page-no-action.html
- packages/styles/src/boundary-page/sk-boundary-page-long-identifier.html
- packages/styles/src/boundary-page/sk-boundary-page-long-email.html
- packages/styles/src/boundary-page/sk-boundary-page-forced-colors.html
- packages/styles/src/boundary-page/index.ts
- packages/styles/src/boundary-page/sk-boundary-page-html.stories.ts
- packages/styles/src/index.ts
- apps/storybook/src/tests/visual.spec.ts
- apps/storybook/src/tests/sk-boundary-page-absence.spec.ts
- apps/storybook/src/tests/sk-boundary-page-responsive.spec.ts
- expected-stories.json
- packages/elements/SIZES.md
role: implementer
tags: []
task_type: implement
tracker_refs:
- '#303'
- '#300'
---

# Work Package Prompt: WP01 – Add the sk-boundary-page styles-only frame

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or
any user-defined profile), and behave according to its guidance before parsing the rest of this
prompt.

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: *(assign at dispatch time)*

If no profile is specified, run `spec-kitty agent profile list` and select the best match for
`task_type: implement` against `authoritative_surface: packages/styles/src/boundary-page/`.

---

## ⚠️ IMPORTANT: This mission adds a NEW styles-only family with no custom element

Unlike #302/#304 (which widened existing shadow-DOM components), `sk-boundary-page` has **no**
entry under `packages/elements/src/` and never will — it is deliberately styles-only, for the
reason research.md Decision 1b records (wrapping the frame's own `<main>`/`<h1>` in a shadow root
would sever document structure the consumer already owns). Do not create a
`packages/elements/src/boundary-page/` directory, a `.markup.ts` module, or a custom element. Do
not touch `packages/react/src/` — there is no manifest entry to regenerate from.

ADR-15 (`docs/architecture/decisions/2026-09-10-15-static-form-of-element-backed-css.md`) rules on
four construct kinds, all of them properties of a shadow-DOM sheet being translated to a static
form. **None of the four reach this frame** (research.md Decision 1) — it introduces no `:host`,
no `container-type`, no `::slotted()`, and must not write any `::part()` rule reaching into
`sk-entity-marker` or `sk-pill-tag`'s shadow internals (that is #314's undecided territory, not
this WP's to resolve). If, mid-implementation, you find yourself wanting to write any of those
four constructs, STOP — that is a sign the design has drifted from a styles-only frame, and it
must be reported rather than resolved unilaterally.

**Read, in this order, before writing anything**: `spec.md` (all FRs, Non-Goals), `plan.md`
(Implementation Concern Map IC-01..IC-05), `research.md` (Decisions 1 through 7, each quoting the
shipped source or the issue text directly), `data-model.md`, `docs/contributing/adding-a-component.md`
(the `:host`/container-type/`::slotted()` table — confirms none of it applies here — and the
forced-colors/reduced-motion section), `packages/styles/src/entity-marker/sk-entity-marker.css`
and `packages/styles/src/pill-tag/sk-pill-tag.css` **in full, including their header comments**
(what you compose), `packages/styles/src/empty-state/` (the closest precedent for an
optional-content, styles-only anatomy) and `packages/styles/src/progress/` (the file-shape
precedent: `.css`, hand-authored `.html` exemplars, generated `index.ts`, `*-html.stories.ts`).
Then read the live issue — `gh issue view 303 --repo spec-kitty/spec-kitty-design` — do not trust
this prompt's paraphrase over the live text.

---

## Markdown Formatting

Wrap HTML/XML tags in backticks: `` `<div>` ``, `` `<script>` ``
Use language identifiers in code blocks: ````css`, ````html`, ````typescript`, ````bash`

---

## Objectives & Success Criteria

- Every one of spec.md's FR-001 through FR-017 is satisfied, checkably, in the resulting PR.
- One anatomy serves both the form-card and the terminal-card — no card-shape modifier exists in
  the shipped CSS unless implementation surfaces a genuine, named need (FR-002), in which case the
  PR names the modifier and the two screens requiring it rather than adding it silently.
- The consumer's own `<main>`/`<h1>` is unaffected — the frame manufactures no landmark and no
  heading level (FR-003).
- The mark and footnote are true DOM-absence optionals: the without-mark and without-footnote
  stories render **no** `.sk-boundary-page__mark` / `.sk-boundary-page__footnote` node at all, and
  a computed-geometry test — not a visual inspection — proves no space leaks when either is
  omitted (FR-006, the mission's highest-risk defect pattern per #308's precedent).
- The action-group is a required container that is a **distinct, supported present-but-empty**
  state from the mark/footnote's full-omission contract (FR-007).
- `sk-entity-marker` and `sk-pill-tag` are composed unmodified: the frame sets no default
  size/shape/border/tone, contributes no role/accessible-name logic derived from either, and
  writes no `::part()` rule into either (FR-004, FR-005, FR-016).
- Long unbroken content (opaque identifier, email, URL) contains locally at every required width
  with zero document-level horizontal scroll (FR-008).
- Responsive, RTL/logical-layout, forced-colors, and reduced-motion behaviour are authored once,
  here, using `@media` (not a component-owned `@container` — research.md Decision 1) and logical
  properties throughout (FR-009, FR-010, FR-011).
- The reduced-motion claim ("the frame introduces no motion") is **asserted by a test**, not
  assumed (FR-012).
- Interactive targets in `.sk-boundary-page__action-group` measure ≥ 44px at both narrow and
  default widths, measured in-run (FR-013).
- No user-visible literal is introduced anywhere in this mission's deliverable — there is no
  `render()` and no code path that emits markup, so this is structurally true rather than merely
  tested (FR-014); no component-scoped no-literal test is added (per C-004/research.md Decision
  5 — do not add one "to be safe").
- Nothing this WP ships imposes a schema/enum on `__title`/`__body`/`__footnote` content — SaaS
  #1281's non-enumerating copy stays expressible because the frame validates nothing about copy
  shape (FR-015).
- Named visual-regression baselines (research.md Decision 7's list, confirmed against the
  exemplars actually authored) are added to `apps/storybook/src/tests/visual.spec.ts` and will be
  harvested from this PR's own CI run — never generated locally (NFR-004).
- `expected-stories.json` is reviewed and updated only if it actually enumerates styles-only
  families; `expected-parts.json`, `expected-docs.json`, `behaviours.json`/`mutations.json`,
  `packages/elements/src/`, and `packages/react/src/` are confirmed untouched (there is no
  element).
- `SIZES.md` is regenerated from a **real** `dist/` build, never a stale local measure.

## Context & Constraints

- **C-001**: one Work Package, one PR. If mid-implementation the work genuinely does not fit,
  STOP and report rather than splitting silently.
- **C-002**: styles-only, no custom element. The deliverable lives entirely in
  `packages/styles/src/boundary-page/`.
- **C-003**: no behaviour acquisition — no auth, routing, HTTP-status, or marketing-shell logic;
  the epic's non-goals are binding (see spec.md Non-Goals).
- **C-004**: no repo-wide and no component-scoped #286 no-literal gate. This frame has no
  `render()`; the risk the #308 precedent guards against does not exist here. Do not add a test
  "just in case" — a test with no real failure mode to guard against is closer to the
  gate-green-over-an-empty-set defect pattern than to a real guard.
- **C-005**: do not write any `::part()` selector reaching `sk-entity-marker` or `sk-pill-tag`'s
  shadow internals. That question is #314's, not this WP's.
- **C-006**: ADR-15 does not gate this mission's static form — there is no shadow form being
  translated. Do not build an equality-gated shadow-vs-static comparison; there is nothing to
  compare.
- **C-007**: this mission may be implemented at ready-for-Lynn status per #300/#303. Never cite a
  Lynn product verdict anywhere in code comments, tests, stories, or the PR — none is recorded.
- **C-008**: this mission's anatomy is the vocabulary Family 6's account/public-front-door screens
  are expected to converge on. Use `.sk-boundary-page__*` class names throughout — never a
  Family-4-specific prefix (`.sk-invitation-*`, `.sk-denial-*`, etc.), which would reproduce the
  exact fragmentation this mission exists to retire.
- **`.kittify/charter/charter.md`** is stale on Angular/SCSS framing (predates the elements-first
  pivot) — follow the ADRs and `docs/architecture/README.md` over it, per `plan.md`'s Charter
  Check section.
- Never hand-edit `kitty-specs/` or `.kittify/` artifacts outside the normal CLI/skill flow; this
  WP's own status transitions go through `spec-kitty agent tasks mark-status` / `move-task`, not
  manual file edits.
- Environment: `--skip-nx-cache` on anything used as a check; `timeout >= 400000` on any
  long-running build/test/gate invocation; never `rm -rf packages/tokens/dist`
  (`token-catalogue.json` is tracked inside that ignored dir) — only `rm -rf
  packages/styles/dist` if a clean styles rebuild is needed. Check `pgrep -af "storybook dev"`
  before trusting any Playwright result against port 6006 — a concurrent checkout's Storybook may
  silently be what Playwright attached to; prefer `storybook-static`.

## Branch Strategy

- **Strategy**: single_branch topology — planning artifacts were generated directly on
  `mission/boundary-page-styles`; completed changes commit to and merge from that same branch.
  There is no separate mission branch to cut and no worktree lane split for this WP (it is the
  only one). The known `spec-kitty next` runtime bug that points at
  `.worktrees/<slug>-lane-a` must be ignored — never create or use that path; advance lane state
  with `spec-kitty agent tasks move-task` / `mark-status` against this checkout directly.
- **Planning base branch**: `mission/boundary-page-styles`
- **Merge target branch**: `mission/boundary-page-styles`

> These fields are populated automatically by `spec-kitty agent mission tasks`. Do NOT change
> them manually.

## Subtasks & Detailed Guidance

### Subtask T001 – Base anatomy CSS: stage, card, title, body, action-group

- **Purpose**: Satisfy FR-001/FR-002/FR-003: the shared anatomy, no card-shape modifier, no
  manufactured landmark.
- **Steps**:
  1. Create `packages/styles/src/boundary-page/sk-boundary-page.css`. Author `.sk-boundary-page__stage`
     (centering: pick and justify either a `100dvh` flex-center or a grid `place-items: center`
     approach — verify the chosen one under 200% zoom and forced-colors before committing, per
     plan.md IC-01's risk note), `.sk-boundary-page__card` (padding, `max-inline-size`, a
     surface/foreground token pair), `.sk-boundary-page__title` (typography only — applied to the
     consumer's own `<h1>`, never a class the frame's CSS uses to generate a heading element),
     `.sk-boundary-page__body`, and `.sk-boundary-page__action-group` (row layout, wrap).
  2. Use logical properties throughout (`inline-size`, `padding-inline`, `margin-block`, etc.) —
     no `left`/`right`/physical `width` reliant on LTR assumptions (FR-010).
  3. Deliberately do **not** add any `.sk-boundary-page__card--form`/`--terminal` (or similarly
     named) modifier. Per research.md Decision 3, this is a verification obligation, not a closed
     question — T007's exemplars must prove the same anatomy actually works for both card
     contents before this subtask is considered complete.
  4. Write the header comment recording: (a) the ADR-10 styles-only-class reason (research.md
     Decision 1b — cite it by section name), (b) the ADR-15 non-applicability check (research.md
     Decision 1 — state plainly that no construct kind reaches this frame and why), (c) that the
     frame manufactures no landmark, (d) tokens-first / no raw values.
- **Files**: `packages/styles/src/boundary-page/sk-boundary-page.css` (new).
- **Parallel?**: No — everything else composes against this base.
- **Notes**: If, while authoring, you find a genuine layout difference between the form-card and
  terminal-card content that the shared anatomy cannot express without a modifier, STOP here and
  report the specific two screens requiring it rather than inventing a modifier unilaterally —
  this is a scope decision the issue reserves for the PR to name explicitly, not a default the WP
  should make silently.

### Subtask T002 – Mark and status composition placement (no inferred axis)

- **Purpose**: Satisfy FR-004/FR-005/FR-016: place `sk-entity-marker`/`sk-pill-tag` without
  setting any default or reaching into their shadow internals.
- **Steps**:
  1. Add `.sk-boundary-page__mark` — spacing/alignment CSS only (e.g. `margin-block-end`,
     `display: flex`/`justify-content` for centering within the card). No `inline-size`/
     `block-size` rule that would override `sk-entity-marker`'s own size axis; no `border-radius`
     that would override its shape axis.
  2. Do not add a wrapper class that sets a default `size`/`shape`/`border` on the composed
     `<sk-entity-marker>` — the consumer's own attributes are the only source of those values
     (research.md Decision 2).
  3. For the status composition point (inside `__title`'s row or `__body`, per what the exemplars
     in T007 demonstrate), add layout-only CSS (gap/alignment) — no `background`/`color` rule
     targeting `.sk-pill-tag` or any `.sk-pill-tag--status-*` class, and no `role`/`aria-*`
     attribute set by this frame's CSS or exemplar markup on the pill itself.
  4. Grep your own diff for `::part(` before considering this subtask done — there must be zero
     occurrences anywhere in `sk-boundary-page.css`.
- **Files**: `packages/styles/src/boundary-page/sk-boundary-page.css` (modified).
- **Parallel?**: No — depends on T001's base anatomy.
- **Notes**: Any exemplar demonstrating a bordered mark **must** write `border="true"` explicitly
  on `<sk-entity-marker>` — never the bare `border` attribute, which silently no-ops for
  plain-HTML authors (the known, recorded ergonomic gap named in spec.md's Edge Cases).

### Subtask T003 – Footnote CSS and the mark/footnote DOM-absence contract

- **Purpose**: Satisfy FR-006: the footnote's (and mark's) absence is a supported, tested state —
  not a collapsed empty box.
- **Steps**:
  1. Add `.sk-boundary-page__footnote` — typography only. Do not add any `[hidden]`, `:empty`, or
     attribute-based gating rule — the entire absence mechanism is that the consumer omits the
     element from the DOM, and ordinary flex/grid `gap` between `.sk-boundary-page__card`'s direct
     children contributes zero space to an absent child (research.md Decision 4).
  2. Verify this is actually true for whatever layout mechanism T001 chose (flex with `gap` vs.
     grid with `gap`) — do not assume; render both the with- and without-footnote exemplars (T007)
     locally and inspect the computed distance from the action-group's bottom edge to the card's
     bottom edge before moving on.
  3. Do the same check for the mark: render with- and without-mark exemplars and confirm no
     leftover space at the top of the card when the mark is omitted.
  4. Leave the actual proof (the Playwright computed-geometry assertion) to T010 — this subtask's
     job is the CSS and a manual sanity check, not the automated test.
- **Files**: `packages/styles/src/boundary-page/sk-boundary-page.css` (modified).
- **Parallel?**: No — depends on T001; T010 depends on this.
- **Notes**: This is the mission's highest-risk defect pattern (#308 shipped `display: flex` with
  no `[open]` qualifier, missed by 602 tests because everything exercised the present state). Do
  not treat "it looks right when I omit the element" as sufficient — T010's automated,
  failure-provable test is what actually discharges FR-006.

### Subtask T004 – Long-content containment [P]

- **Purpose**: Satisfy FR-008: long unbroken content contains locally, no document-level
  horizontal scroll.
- **Steps**:
  1. Add `overflow-wrap: anywhere` (and any needed `min-inline-size: 0` on flex/grid ancestors —
     `sk-empty-state--inline`'s pattern is the precedent, but verify it against this component's
     own nesting, which is deeper) to `.sk-boundary-page__body`.
  2. Verify with a manual render of a long opaque identifier (80+ characters, no spaces) at
     320px, 200% zoom, and default desktop width — check `document.documentElement.scrollWidth`
     does not exceed the viewport width at any of the three.
- **Files**: `packages/styles/src/boundary-page/sk-boundary-page.css` (modified).
- **Parallel?**: Yes, with T005/T006 — disjoint rule blocks within the same file. All three must
  complete before T011/T012.
- **Notes**: Test against a real long identifier, not a long word with natural break
  opportunities (spaces) — `overflow-wrap: anywhere` specifically matters for unbroken tokens.

### Subtask T005 – Responsive `@media` rules and RTL verification [P]

- **Purpose**: Satisfy FR-009/FR-010/FR-013: narrow width, 200% zoom, and RTL/logical-layout
  behaviour, authored once.
- **Steps**:
  1. Add `@media` rules (viewport-relative, not `@container` — research.md Decision 1) for stage
     padding, card `max-inline-size`, and action-group wrap at narrow widths.
  2. Verify (manually, ahead of T011's automated test) that `.sk-boundary-page__action-group`'s
     interactive targets measure ≥ 44px in the relevant dimension at both narrow and default
     widths — if token-driven padding alone does not reach 44px, add an explicit
     `min-block-size: var(--sk-space-*)` to the action-group's own children selector (research.md
     open question 2) rather than guessing it is already sufficient.
  3. Render the full anatomy under `dir="rtl"` and confirm mirroring is correct using only
     logical properties already authored in T001-T004 — do not add RTL-specific overrides unless
     a genuine physical-property leak is found, in which case fix the leak at its source rather
     than patching it with a `[dir="rtl"]` override.
- **Files**: `packages/styles/src/boundary-page/sk-boundary-page.css` (modified).
- **Parallel?**: Yes, with T004/T006.
- **Notes**: `dvh` unit support and its interaction with 200% zoom is the one genuine mechanism
  risk here (plan.md IC-01) — verify it did not regress if T001 chose it for the stage.

### Subtask T006 – Forced-colors and reduced-motion baseline [P]

- **Purpose**: Satisfy FR-011/FR-012: the card's edge stays visible under forced-colors via a
  border-based mechanism; the frame's "no motion" claim is true and provably so.
- **Steps**:
  1. Add `@media (forced-colors: active)` treatment for `.sk-boundary-page__card`'s edge using
     `border-style`/`border-color` (longhand `-color`, per this repo's `declaration-strict-value`
     convention — the `border` shorthand would dodge the token check entirely, per
     `docs/contributing/adding-a-component.md`'s explicit warning). Do not rely on `background` or
     `box-shadow` alone for any distinguishing mark — both are policed/vanish under forced-colors.
  2. Confirm `sk-boundary-page.css` sets no `transition`/`animation` property anywhere in the file
     — if it genuinely has none (expected), no `@media (prefers-reduced-motion: reduce)` rule is
     needed; the absence itself is what T011 must assert.
- **Files**: `packages/styles/src/boundary-page/sk-boundary-page.css` (modified).
- **Parallel?**: Yes, with T004/T005.
- **Notes**: Do not add a no-op reduced-motion media query "to be thorough" — per
  `docs/contributing/adding-a-component.md`'s own recorded example
  (`sk-transition-matrix.css:237` guarding a property nothing sets), a block guarding nothing is
  itself a defect pattern, not a safety margin.

### Subtask T007 – Author required `.html` exemplars

- **Purpose**: Produce the source-of-truth markup the generator (`build-styles-only-markup.mjs`)
  turns into `index.ts`, and the fixtures T010-T012's tests render against.
- **Steps**:
  1. Author, at minimum: `sk-boundary-page-form-card.html` (a real `<form>` with fields, a mark,
     a status pill, an action-group with a submit action, a footnote), `sk-boundary-page-terminal-card.html`
     (a message-only card, no form, no mark, one action, no footnote — deliberately exercising
     both "no mark" and "no footnote" together in one exemplar, per FR-006/FR-007),
     `sk-boundary-page-without-mark.html`, `sk-boundary-page-without-footnote.html`,
     `sk-boundary-page-with-footnote.html` (isolated variants for the absence-contract tests to
     target precisely), `sk-boundary-page-several-actions.html`, `sk-boundary-page-no-action.html`
     (an action-group present with zero children), `sk-boundary-page-long-identifier.html`,
     `sk-boundary-page-long-email.html`, `sk-boundary-page-forced-colors.html`.
  2. Every exemplar wraps its content in a real `<main>` with a single `<h1>` styled via
     `.sk-boundary-page__title` — demonstrating FR-003's contract directly in committed markup,
     not just in prose.
  3. Any exemplar demonstrating the mark composes `<sk-entity-marker>` with explicit attributes
     (e.g. `size="lg" shape="circle" border="true"` on at least one) — never the bare `border`
     attribute.
  4. Any exemplar demonstrating status composes `<sk-pill-tag class="sk-pill-tag--status-<tone>">`
     with real slotted text.
  5. Name files so their derived `PascalCaseHTML` export (per `build-styles-only-markup.mjs`'s
     `exportName()` — hyphen-split, capitalized, joined, `+HTML`) is both unique and valid — no
     leading digit, no name colliding with another exemplar's derived export.
- **Files**: `packages/styles/src/boundary-page/*.html` (new, ~10-12 files).
- **Parallel?**: No — needed by T008/T009/T010/T011/T012.
- **Notes**: SaaS #1281's non-enumerating copy style is worth demonstrating in at least one
  exemplar's body/footnote text (a deliberately vague message, not a precisely enumerated reason)
  to make FR-015 concrete rather than only asserted in prose — but do not invent Team Kitty
  product copy; keep it generic placeholder text that a reviewer will recognize as an example, not
  a shipped string.

### Subtask T008 – Generate the barrel; register the styles export

- **Purpose**: Wire the new component into the styles package per the existing styles-only
  generator, per plan.md's technical approach.
- **Steps**:
  1. Run `node scripts/build-styles-only-markup.mjs` and confirm
     `packages/styles/src/boundary-page/index.ts` is generated with the expected exports, one per
     `.html` file from T007.
  2. Add `export * from './boundary-page/index';` to `packages/styles/src/index.ts`, in
     alphabetical position alongside the existing entries.
  3. Run the generator's `--check` mode (if it has one — confirm against the script's own CLI
     flags) to prove no drift.
- **Files**: `packages/styles/src/boundary-page/index.ts` (generated, never hand-edited),
  `packages/styles/src/index.ts` (modified).
- **Parallel?**: No — depends on T007.

### Subtask T009 – Author the stories file

- **Purpose**: Publish every required story to Storybook, including `LightMode`.
- **Steps**:
  1. Create `packages/styles/src/boundary-page/sk-boundary-page-html.stories.ts` importing the
     generated exports from `./index`, following `sk-progress-html.stories.ts`'s shape: `meta`
     with `title: 'Patterns/SkBoundaryPage (HTML)'` (or the closest existing taxonomy root, per
     CLAUDE.md §6), `tags: ['autodocs']`, `parameters: { a11y: { disable: false } }`.
  2. Export `Default` plus one named story per exemplar from T007.
  3. Export `LightMode`, wrapped in `class="sk-light"` (never `data-theme="light"`, which is inert
     on a wrapper per CLAUDE.md §6/#93) — verify a computed value genuinely differs between it and
     `Default`, do not assume the class does something.
- **Files**: `packages/styles/src/boundary-page/sk-boundary-page-html.stories.ts` (new).
- **Parallel?**: No — depends on T008.

### Subtask T010 – The mark/footnote absence-contract Playwright spec

- **Purpose**: Satisfy FR-006 with an automated, failure-provable test — the mission's highest-risk
  defect pattern.
- **Steps**:
  1. Create `apps/storybook/src/tests/sk-boundary-page-absence.spec.ts`, following
     `sk-empty-state-inline.spec.ts`'s `measureAt()`/story-navigation pattern.
  2. Assert, for the without-mark story: `document.querySelector('.sk-boundary-page__mark')` is
     `null`.
  3. Assert, for the without-footnote story: `document.querySelector('.sk-boundary-page__footnote')`
     is `null`, and the vertical distance from `.sk-boundary-page__action-group`'s bottom edge to
     `.sk-boundary-page__card`'s bottom edge equals the card's own computed `padding-block-end` —
     read via `getComputedStyle`, never a transcribed pixel literal.
  4. Assert, for the with-footnote story, that same measured distance is strictly larger than the
     without-footnote measurement, by at least the footnote's own content height plus the
     inter-element gap token's computed pixel value (also read in-run).
  5. **Before treating this test as done, prove it can fail**: temporarily mutate
     `sk-boundary-page.css` to reserve unconditional footnote space (e.g. give
     `.sk-boundary-page__card` a fixed extra `padding-block-end`) and confirm the without-footnote
     assertion goes red. Then revert the mutation. Do not skip this step — a test that has never
     been observed to fail is not proven to catch the failure mode it exists for.
- **Files**: `apps/storybook/src/tests/sk-boundary-page-absence.spec.ts` (new).
- **Parallel?**: No — depends on T007; independent of T011.

### Subtask T011 – Responsive/forced-colors/reduced-motion/RTL/target-size Playwright spec [P]

- **Purpose**: Satisfy FR-009 through FR-013 with automated assertions, per SC-005/SC-006.
- **Steps**:
  1. Create `apps/storybook/src/tests/sk-boundary-page-responsive.spec.ts`.
  2. Assert zero `document.documentElement.scrollWidth` overflow at 320px and at simulated 200%
     zoom, for the long-identifier and long-email exemplars.
  3. Assert every interactive target inside `.sk-boundary-page__action-group` measures ≥ 44px
     (`getBoundingClientRect()`) at both narrow and default widths.
  4. Assert, under `page.emulateMedia({ forcedColors: 'active' })`, the card's border has a
     non-zero computed `border-width`.
  5. Assert, under `page.emulateMedia({ reducedMotion: 'reduce' })` (and, separately, by reading
     `getComputedStyle` for `transition`/`animation` properties on every anatomy part regardless of
     the media emulation), that no transition/animation property is set anywhere in the anatomy —
     proving the "no motion introduced" claim rather than assuming it.
  6. Render an RTL story (`dir="rtl"` on the frame's containing element) and assert the mark
     (when present) and action-group mirror to the expected side.
- **Files**: `apps/storybook/src/tests/sk-boundary-page-responsive.spec.ts` (new).
- **Parallel?**: Yes, with T010 — different files.

### Subtask T012 – Named visual-regression baselines

- **Purpose**: Satisfy NFR-004/SC-007: visual proof, harvested from CI, never generated locally.
- **Steps**:
  1. Add `test()` blocks to `apps/storybook/src/tests/visual.spec.ts` for each snapshot named in
     research.md Decision 7, confirmed against the exemplars T007 actually authored (rename any
     that drifted from the research.md list, and update research.md's list to match if a name
     changes — keep the two in sync).
  2. Follow the existing file's pattern exactly: `page.goto` the story's `iframe.html` URL,
     `waitFor({ state: 'visible' })` on `.sk-boundary-page__card` (or `__stage`), then
     `toHaveScreenshot()` with `{ threshold: 0.02, maxDiffPixelRatio: 0.02 }`.
  3. Do **not** run `--update-snapshots` locally. State explicitly in the PR description (T015)
     that these baselines must be harvested from this PR's own CI run's
     `visual-regression-diffs` artifact.
- **Files**: `apps/storybook/src/tests/visual.spec.ts` (modified).
- **Parallel?**: No — depends on T007/T009 (needs the real stories to target).

### Subtask T013 – Ratchet review

- **Purpose**: Confirm the "nothing outside `packages/styles/src/boundary-page/` needs to change"
  claim is verified, not assumed.
- **Steps**:
  1. Open `expected-parts.json` — confirm no entry is needed (no `@csspart`, no element).
  2. Open `expected-docs.json` — confirm no entry is needed (no manifest, no attribute/method to
     document).
  3. Open `behaviours.json`/`mutations.json` — confirm no subject entry is needed (purely
     presentational, owns no form association/events/focus/keyboard handling).
  4. Open `expected-stories.json` — if it enumerates styles-only-family story files, add this
     mission's entries; if it does not apply to styles-only families at all, note that explicitly
     in the PR rather than silently skipping it.
  5. Confirm `packages/elements/src/` and `packages/react/src/` have zero diff from this WP.
- **Files**: `expected-stories.json` (modified, only if applicable).
- **Parallel?**: No — needs the final surface from T001-T012.

### Subtask T014 – Regenerate artifacts and run existing gates

- **Purpose**: Prove the diff is clean against real, current generated output — never a stale
  local measure.
- **Steps**:
  1. `npx nx run tokens:build --skip-nx-cache && npx nx run tokens:catalogue`.
  2. `npx nx run styles:build --skip-nx-cache`.
  3. Regenerate `SIZES.md` from the real `dist/` build (never `rm -rf packages/tokens/dist` first
     — `token-catalogue.json` is tracked inside that ignored dir).
  4. `npm run quality:all` (eslint + stylelint + htmlhint), with `timeout >= 400000`.
  5. Run the new and existing Playwright suites (`apps/storybook/src/tests/`), with
     `timeout >= 400000`, after confirming `pgrep -af "storybook dev"` shows no stray concurrent
     server on port 6006 (prefer `storybook-static` if any doubt).
  6. Run `scripts/check-adopted-css-boundaries.mjs` (or the closest equivalent gate) to confirm
     the new sheet introduces no boundary violation.
  7. `git status --porcelain` after the full regeneration pass should show only this WP's intended
     changes plus generated-artifact updates (`SIZES.md`, `index.ts`) — nothing else.
- **Files**: `packages/elements/SIZES.md`, any generated CSS barrel under `packages/styles`.
- **Parallel?**: No — final verification pass, after T001-T013.
- **Notes**: Never end a turn with one of these long-running commands backgrounded and
  unmonitored — use `timeout >= 400000` rather than letting the harness auto-background a slow
  gate, and block on completion in the same command per this mission's environment gotchas.

### Subtask T015 – Write the PR description

- **Purpose**: Let the tier-C pre-merge squad verify every FR without re-deriving this mission's
  reasoning.
- **Steps**: Write a PR body that:
  - States plainly that this frame introduces no custom element and sits outside every ADR-15
    construct kind, quoting research.md Decision 1's reasoning in summary.
  - Lists FR-001 through FR-017 with a one-line "where satisfied" pointer (file + section/test
    name).
  - States explicitly what is composed from #302/#304, quoting the shipped CSS header comments
    (not the issue text) per research.md Decision 2.
  - States how the footnote/mark absence contract is proven (the T010 mutation-provable test),
    not merely asserted.
  - Names the visual-baseline snapshot list and states they must be harvested from this PR's own
    CI run.
  - States whether a card-shape modifier was added and, if so, names the two screens requiring it
    (per FR-002); if not, states the anatomy was verified identical for both card contents.
  - States how SaaS #1281's non-enumerating copy stays expressible (no schema/enum anywhere in
    this frame).
  - Notes: merges to `train/elements-first` in this repo do **not** auto-deploy production — this
    is the design-tooling repo, not Team Kitty's SaaS app.
  - Does not cite a Lynn product verdict anywhere (C-007).
- **Files**: none (PR body text, not a repo file).
- **Parallel?**: No — final subtask.

## Test Strategy

Playwright story-driven tests (`sk-boundary-page-absence.spec.ts`, T010; `sk-boundary-page-responsive.spec.ts`,
T011) cover the DOM-absence contract, containment, responsive/target-size, forced-colors, and
reduced-motion-absence claims with computed-geometry assertions, not visual inspection. Visual
regression (`visual.spec.ts`, T012) proves appearance across dark/`LightMode`/forced-colors and is
harvested from CI. Axe accessibility checks run automatically via the Storybook a11y addon wired
into the stories file (T009). No new permanent CI gate is added — this WP's additions extend
existing, already-enforced suites and the repo's existing styles-only generator.

## Risks & Mitigations

- **The footnote/mark absence contract looks right but isn't proven** (plan.md IC-03's named
  risk, the mission's sharpest): mitigated by T010's explicit "prove it can fail" step — a
  deliberate CSS mutation must turn the test red before it is trusted green.
- **A card-shape modifier gets added speculatively, reproducing Family 4's own fragmentation**:
  mitigated by T001's explicit instruction to stop and report rather than invent one, and by
  research.md Decision 3's verification obligation.
- **A `::part()` reach creeps in while composing #302/#304**: mitigated by T002's explicit grep
  check before considering that subtask done.
- **Visual baselines shipped as a gate over zero real coverage** (the #305/FR-015 defect pattern):
  mitigated by naming the snapshot list in research.md ahead of implementation and requiring T012
  to confirm the shipped list against the real exemplars, not silently narrow it.
- **A no-op reduced-motion guard is added "to be safe"**: mitigated by T006's explicit warning
  against exactly this, citing the `sk-transition-matrix.css:237` precedent.
- **Citing Lynn's verdict by accident**: mitigated by C-007 named in both Objectives and T015.

## Review Guidance

- Confirm the without-mark and without-footnote stories render zero trace of the omitted part in
  the DOM, and that the absence test was proven capable of failing (ask for evidence of the
  mutation-revert step, per T010).
- Confirm no `.sk-boundary-page__card--form`/`--terminal` (or similarly named) modifier exists
  unless the PR names the two screens requiring it.
- Confirm the consumer's own `<h1>`/landmark structure is genuinely unaffected — inspect the
  accessibility tree of at least one exemplar directly, not just the CSS.
- Confirm zero `::part()` selectors exist anywhere in `sk-boundary-page.css`.
- Confirm every ratchet file was actually reviewed (not silently skipped) and, where a change was
  needed, made.
- Confirm the visual-baseline snapshot names match what research.md Decision 7 declared, and that
  the PR states they are pending CI harvest, not already committed from a local run.
- Confirm "Lynn" does not appear as an approval citation anywhere in the diff.
- Confirm `git status --porcelain` after a fresh build shows only intended changes.

## Activity Log

> **CRITICAL**: Activity log entries MUST be in chronological order (oldest first, newest last).

- 2026-09-10T14:19:00Z – system – Prompt created.

---

### Updating Status

Status is managed via `status.events.jsonl`. Use `spec-kitty agent tasks move-task WP01 --to
<status>` to change WP status, and `spec-kitty agent tasks mark-status T001 T002 ... --status done`
to record subtask completion.
