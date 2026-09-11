---
work_package_id: WP01
title: '.sk-public-header: styles-only native public-header family over consumer-owned identity and route actions'
dependencies: []
requirement_refs:
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
- FR-018
- FR-019
- FR-020
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- NFR-006
- NFR-007
- NFR-008
- NFR-009
- NFR-010
- NFR-011
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
- C-007
- C-008
- C-009
- C-010
planning_base_branch: mission/public-header-styles
merge_target_branch: mission/public-header-styles
branch_strategy: Planning artifacts for this mission were generated on mission/public-header-styles. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/public-header-styles unless the human explicitly redirects the landing branch.
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
- T016
phase: Phase 1 - sk-public-header
history:
- at: '2026-09-10T20:45:00Z'
  actor: system
  action: 'Prompt authored during mission planning for #353'
agent_profile: frontend-freddy
authoritative_surface: packages/styles/src/public-header/
create_intent:
- packages/styles/src/public-header/sk-public-header.css
- packages/styles/src/public-header/sk-public-header-brand-only.html
- packages/styles/src/public-header/sk-public-header-one-action.html
- packages/styles/src/public-header/sk-public-header-two-actions.html
- packages/styles/src/public-header/sk-public-header-many-actions.html
- packages/styles/src/public-header/sk-public-header-long-labels.html
- packages/styles/src/public-header/sk-public-header-current-action.html
- packages/styles/src/public-header/sk-public-header-mixed-controls.html
- packages/styles/src/public-header/sk-public-header-theme-slot.html
- packages/styles/src/public-header/sk-public-header-html.stories.ts
- packages/styles/src/public-header/index.ts
- apps/storybook/src/tests/sk-public-header.spec.ts
execution_mode: code_change
model: ''
owned_files:
- packages/styles/src/public-header/**
- packages/styles/src/index.ts
- packages/styles/package.json
- scripts/build-styles-only-markup.mjs
- apps/storybook/src/tests/sk-public-header.spec.ts
- apps/storybook/src/tests/visual.spec.ts
- apps/storybook/src/tests/visual.spec.ts-snapshots/**
- expected-stories.json
- docs/design-system/using-components.md
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP01 – `.sk-public-header`: styles-only native public-header family over consumer-owned identity and route actions

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and
behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `claude`

If no profile is specified, run `spec-kitty agent profile list` and select the best match for
`implement` work against `packages/styles/src/` involving a new styles-only CSS family, accessible
composition contracts, and cross-mission generator/ratchet wiring.

---

## ⚠️ IMPORTANT: Review Feedback

**Read this first if you are implementing this task!**

- **Has review feedback?**: Check the `review_ref` field in the event log (via
  `spec-kitty agent tasks status` or the Activity Log below).
- **You must address all feedback** before your work is complete.
- **Report progress**: as you address each feedback item, update the Activity Log.

---

## Review Feedback

*None yet — this is the initial prompt.*

---

## Markdown Formatting

Wrap HTML/XML tags in backticks: `<header>`, `<nav>`, `<a>`, `<button>`
Use language identifiers in code blocks: ```css, ```html, ```ts, ```bash

---

## Objectives & Success Criteria

Add a brand-new **styles-only** family, `.sk-public-header`, at `packages/styles/src/public-header/`
— the layout, wrapping, focus-safety, and forced-colours presentation over a real, consumer-authored
`<header>`/`<nav>`/`<a>` tree that 23 of Family 6's 24 canonical account/public-front-door screens
currently hand-author, one screen at a time. **No custom element is registered.** Every route,
label, action, brand string, authentication/route state, and theme-state mechanism stays owned by
Team Kitty.

**Read `plan.md`, `research.md`, and `data-model.md` in full before starting — they are already
authored and settled for this mission.** `plan.md`'s §§1–9 (file inventory, the generator change,
the anatomy, the responsive/wrap strategy, forced colours and reduced motion, the #323 dependency
block, and the verification plan) and `research.md`'s R-1 through R-15 answer nearly every
implementation question this prompt would otherwise restate. This prompt sequences and scopes that
material into sixteen subtasks. **Also read `docs/contributing/adding-a-component.md` in full and
`packages/styles/src/context-nav/` as the worked example** — `sk-context-nav` (#256) is the closest
existing family in kind (styles-only, no element, native `<nav>`, consumer-owned links/labels/
`aria-current`, logical properties, forced-colours block, its own Playwright spec, its own usage-doc
section, its own ratchet entry). Every place this prompt says "the context-nav shape," that is the
file to open.

Done means:

- `packages/styles/src/public-header/sk-public-header.css` exists, authored, token-only, with exactly
  the six BEM classes in "The anatomy" below, no reach-through into any composed control's internals,
  and no theme selector.
- Eight authored `.html` fixtures exist, one per structural shape, none copying the Family 6 corpus's
  class names (`topnav`, `logo`, `nav-actions`, `brand-context`, `theme-picker`, …) or its
  `data-od-id` review scaffolding verbatim.
- `packages/styles/src/public-header/index.ts` is **generated**, never hand-edited, and
  `node scripts/build-styles-only-markup.mjs --check` exits 0 against it.
- `scripts/build-styles-only-markup.mjs` carries a `public-header` branch in its `adrNote` ternary
  citing `#353`, added **before** the barrel was generated.
- The family is importable: `packages/styles/src/index.ts` re-exports it and
  `packages/styles/package.json` exposes it via `exports`.
- `sk-public-header-html.stories.ts` exports all thirteen required stories, including a
  `ThemeToggleComposition` story that is explicitly documented as blocked on #323.
- `expected-stories.json` carries a new `byElement["sk-public-header"]` entry (13 ids, read off the
  **built** Storybook index) and `total` moves 505 → 518.
- `apps/storybook/src/tests/sk-public-header.spec.ts` exists and asserts everything in "Verification"
  below.
- `apps/storybook/src/tests/visual.spec.ts` gains two new tests, and their PNG baselines are
  **harvested from CI**, never generated locally.
- `docs/design-system/using-components.md` gains a `## Public header` section.
- No `packages/elements/src/public-header/` directory, `.markup.ts`, `custom-elements.json` entry,
  React wrapper, or `expected-docs.json` row exists anywhere in the diff.
- The full local gate matrix passes, the working tree is clean (`git status --porcelain` empty after
  `git add -A`), and CI is green on the pushed head — not an earlier one.

## Context & Constraints

- **Mission spec**: `kitty-specs/public-header-styles-01M268NK/spec.md` — read all six user stories,
  all twenty FRs, all eleven NFRs, all ten constraints, the Edge Cases section, the "Styles-only
  rationale" and "Theme-selector reasoning" sections, the "Resolved decision — target-size mechanism"
  section, and "Cross-mission / dependency" before starting.
- **Mission plan**: `kitty-specs/public-header-styles-01M268NK/plan.md` — the authoritative source
  for the exact file inventory (§1), the generator change (§2), the `ci-quality.yml` filter finding
  (§3), the anatomy (§4), the wrap strategy (§5), forced-colours/reduced-motion (§6), the #323
  dependency block (§7), the work-package shape argument (§8), and the full verification plan (§9).
  This WP's subtasks map onto that plan's IC-01 through IC-05 concern map.
- **Mission research**: `kitty-specs/public-header-styles-01M268NK/research.md` — R-1 (the
  target-size precedent), R-2 (`.sk-button--sm` is 32px in this library, not 44px), R-3 (the
  evidenced anatomy and action-count distribution), R-4 through R-6 (why no `ci-quality.yml`/ADR-15/
  media-query change is needed), R-7/R-8 (reduced-motion and forced-colours rules), R-9 (the
  generator citation finding), R-10 (the two shared files with no gate), R-11 (the correct test
  command), R-12 (story ratchet mechanics), R-13 (registries this family stays out of), R-14
  (environment hazards), R-15 (the tokens this family draws on — no new token is needed).
- **Data model**: `kitty-specs/public-header-styles-01M268NK/data-model.md` — this mission has no
  data model; the composition contract table there is the literal anatomy this WP authors.
- **The nearest sibling family, worked in full**: `packages/styles/src/context-nav/sk-context-nav.css`
  and `apps/storybook/src/tests/sk-context-nav.spec.ts`. Every idiom this prompt references by line
  number lives in one of these two files. Read both before writing your own CSS or spec file.

### The anatomy — exactly six classes, no modifiers

| Class | Element the consumer authors it on | Required? |
|---|---|---|
| `sk-public-header` | `<header>` | **required** — root; a real `<header>` so the implicit `banner` landmark is native |
| `sk-public-header__inner` | a `<div>` inside the header | **required** — the flex row; owns gap, wrap, padding-block, and the minimum inline gutter |
| `sk-public-header__brand` | `<a href="…">` | **required** — always a real anchor, never a `<div>`/`<span>` stand-in |
| `sk-public-header__brand-context` | `<span>` inside the brand anchor | optional — the evidenced secondary identity label |
| `sk-public-header__actions` | `<nav aria-label="…">` | **optional as a whole; absent, never empty** — zero actions means no `<nav>` element at all |
| `sk-public-header__action` | each `<a>`/`<button>`/composed element inside the action region | **required whenever an action exists** — the documented composition slot carrying the 44px floor |

No `--compact`, no `--bordered`, no `--sticky` modifier in this mission (C-009). Do not invent one.

### The authored-vs-generated split — do not blur it

**AUTHORED** (you write it, review reads it): `sk-public-header.css`, all eight `.html` fixtures,
`sk-public-header-html.stories.ts`, `sk-public-header.spec.ts`, the `index.ts`/`package.json`/
generator/`visual.spec.ts`/`expected-stories.json`/`using-components.md` edits.

**GENERATED** (a script writes it, `--check` compares it, hand-editing it is a defect):
`packages/styles/src/public-header/index.ts`, produced only by
`node scripts/build-styles-only-markup.mjs`. **Never hand-edit it.** If `--check` reports it stale,
the fix is to re-run the generator against your fixtures, never to patch the file directly.

### Hard rules — each is machine-checkable and each is a real defect if violated

- **Tokens-only.** Zero raw hex/`rgba()`/`px`/unitless-radius/shadow/motion-duration/z-index literal
  in `sk-public-header.css`. Every value resolves through `var(--sk-*)`. `--sk-space-9` (3rem/48px)
  is the target-size token; no literal `44px` anywhere (checked by
  `node scripts/check-component-token-literals.mjs packages/styles/src/public-header/sk-public-header.css`
  and `npm run quality:stylelint`'s `declaration-strict-value`).
- **BEM, `sk-` prefix.** Only the six classes above, or a `--modifier` on one of them (none exist in
  this mission). No class borrowed verbatim from the Family 6 evidence's local names (`topnav`,
  `topnav-inner`, `logo`, `nav-actions`, `brand-context`, `theme-picker`, `theme-toggle`,
  `theme-options`).
- **No reach-through into composed controls.** The action region accepts real anchors, buttons, and
  (once #323 ships) `sk-theme-toggle` — the sheet must never write a rule against `.sk-button`,
  `.sk-button--sm`, `sk-theme-toggle`, any `::part(`, `:host`, or any shadow-root internal. The 44px
  floor is pinned on `.sk-public-header__action` — **this family's own class** — never on the
  composed control's. This is the "Resolved decision" in `spec.md`; you apply the mechanism, you do
  not choose one. See `packages/styles/src/confirm-dialog/sk-confirm-dialog.css:165-174` and
  `packages/styles/src/context-nav/sk-context-nav.css:44-56` for the precedent shape
  (`display: inline-flex; align-items: center; justify-content: center; min-block-size:
  var(--sk-space-9); min-inline-size: var(--sk-space-9)`).
- **`class="sk-light"` never `data-theme="light"`.** The `LightMode` story renders inside a real
  `.sk-light` ancestor. No `.sk-light .sk-public-header {…}` rule and no `:root[data-theme="light"]
  .sk-public-header {…}` rule may appear in the sheet (C-004) — light-mode variance is expressed
  **only** through `--sk-*` tokens (reuse `--sk-surface-page`, `--sk-fg-default`,
  `--sk-border-default`, or the `-tint-*` family for a tinted state; do not invent a new token).
- **No theme selector in component CSS.** Same rule, restated: this component has no shadow root, so
  a `.sk-light` selector would technically *work* here — author it anyway and you fork the theming
  contract for one component alone. Tokens are the single channel every other styles-only family
  already uses.
- **No `transition`/`animation`, therefore no `prefers-reduced-motion` block.** The header's states
  (hover underline, focus outline, current-item weight/border) are instant by nature. A reduced-
  motion guard over a property the sheet never declares is the exact inert-block trap
  `adding-a-component.md:152-158` documents at `sk-transition-matrix.css:237`. Declare no motion, and
  therefore write no guard. Your Playwright assertion for NFR-008 must be scoped to the header/inner-
  row/brand boxes only — **never** `.sk-public-header__action`, which may carry a composed
  `.sk-button`'s own transition; asserting `0s` there is the trap that would push you toward writing
  `.sk-button { transition: none }` in this sheet, which is the exact reach-through C-007 forbids.
- **Generated output is never hand-edited.** `index.ts` comes only from
  `node scripts/build-styles-only-markup.mjs`. If it looks wrong, fix the fixture or the generator's
  `adrNote` branch and regenerate — never edit the generated file's text directly.
- **Logical properties only, no physical left/right.** No `[dir="rtl"]` rule anywhere in the sheet
  (FR-010) — RTL correctness comes from logical properties mirroring automatically.
- **No `order` or `flex-direction: *-reverse`.** `flex-wrap: wrap` alone must do the reflow; DOM order,
  reading order, and focus order must stay identical at every width (FR-007).
- **No `display:none`/`visibility:hidden`/clip on action text at any width** (FR-016) — icon-only
  presentation is a consumer content decision, never a family default.
- **No `position: sticky|fixed`** (C-009) — explicitly out of scope.

### The #323 dependency block

`sk-theme-toggle` (#323) is **confirmed OPEN** as of 2026-09-10. Per the issue's own instruction:
*"if #323 is still in flight, record that single story as dependency-blocked rather than copying the
control."*

- Author one fixture, `sk-public-header-theme-slot.html`, whose action region holds two real anchors
  and a **neutral, non-theme placeholder** — an ordinary
  `<button type="button" class="sk-public-header__action">` with a plain text label (e.g.
  `Appearance`). This is a *slot occupancy* proof only: it demonstrates a `<button>` composes beside
  anchors, aligns on the same baseline, and meets the 44px floor. It demonstrates nothing about theme
  state.
- Author one story, `ThemeToggleComposition`, rendering that fixture, whose
  `parameters.docs.description.story` states plainly: **blocked on #323**; what the story will do
  once #323 merges into `train/elements-first` and ships a stable `sk-theme-toggle` public contract
  (replace the placeholder button with a real `<sk-theme-toggle class="sk-public-header__action">`);
  and that this family owns no theme state either way.
- **No theme presentation of any kind.** No `.theme-picker`, `.theme-toggle`, `.theme-options`, no
  `<details>`/`<summary>` disclosure imitation, no moon/sun glyph, no `aria-pressed` triad — nothing
  copied from the Family 6 screens' local control.
- **What T008's spec assertion checks (SC-011):**
  `git grep -in "theme" -- packages/styles/src/public-header` must return only the docs-string
  reference and the placeholder's own neutral label — no `.theme-picker`, `.theme-toggle`, or
  `.theme-options` class name, and no `data-theme-choice` attribute.
- **This does not block your merge.** Every other required story and every FR/NFR/C in the spec is
  independent of #323. If #323 lands mid-mission, upgrading the placeholder is a fast-follow commit,
  not a re-plan — do not assume it and do not attempt it inside this WP.

### Environment constraints — read before running anything

- **Port 6006 is shared across sibling mission checkouts.** `playwright.config.ts` hardcodes
  `baseURL: 'http://localhost:6006'` and `webServer.reuseExistingServer: !process.env['CI']`. Sibling
  checkouts under `/home/jeroennouws/dev/spec-kitty-design-missions/` (e.g. `354`, `355`) may already
  be serving their own Storybook on that port. **Before any Playwright run**, confirm what is on the
  port: `ss -ltnp | grep :6006` (or `lsof -i :6006`). If something is already listening, confirm its
  CWD is **this** checkout — e.g. confirm `apps/storybook/storybook-static/index.json` in this
  checkout contains the `sk-public-header` story ids and that the served page serves them too. Do not
  "fix" a mysterious pass or failure by rebuilding; check the port first. Setting `CI=1` for a local
  run forces a fresh server and is the blunt remedy. **Never accept a Playwright pass obtained against
  a foreign Storybook** — that is not evidence for this mission.
- **Visual baselines are CI-authoritative.** Never run `--update-snapshots` locally. Local font
  rasterization differs and the screenshots are clipped to the component, so box dimensions are part
  of the assertion and a locally-shot baseline fails CI on dimensions alone. Push with no PNG, let CI
  fail once, download the `visual-regression-diffs` artifact from that run, commit the PNGs it
  contains, push again.
- **Nx may serve a cached artifact to a `--check` comparison.** Pass `--skip-nx-cache` on any `nx`
  invocation whose output feeds a drift check or a gate (e.g.
  `npx nx run storybook:storybook:build --skip-nx-cache`). A cached build compared against itself
  reports green when it should not.
- **`scripts/measure-elements-sizes.mjs` reads `dist/` and does not build it.** This family ships
  nothing into `packages/elements/dist`, so its `--check` should be unaffected. If it reports drift,
  that is a stale local `dist/` or a sign this WP touched the elements package (which it must not) —
  never a signal to regenerate `SIZES.md`.

### Commit scopes — read before your first commit

This mission's product commits use `feat(styles): …` / `fix(styles): …` for the family, and
`chore(ci): …` if the generator-script edit is committed separately from the family (both `styles`
and `ci` are in `commitlint.config.cjs`'s scope enum). Unscoped `docs: …` for documentation-only
commits, and `test(styles): …` for test-only commits, are also valid against this repository's
enum. **`docs(specs)`, `docs(spec)`, and `chore(spec-kitty)` with a non-exact message are NOT valid**
and will red `lint-code` — check `commitlint.config.cjs`'s actual `scope-enum` array yourself before
choosing a scope; do not guess from another mission's commit history. Mission-artifact commits (this
`tasks.md`/WP file, `decisions/`, `status.events.jsonl`) go through `spec-kitty spec-commit` with a
`chore(spec): …` message — that is not this WP's concern; the planning phase already handled it.

## Branch Strategy

- **Strategy**: single_branch — this mission's target branch IS `mission/public-header-styles`;
  there is no separate mission-lane branch.
- **Planning base branch**: `mission/public-header-styles`
- **Merge target branch**: `mission/public-header-styles`
- The mission branch is later opened as a PR into `train/elements-first` per
  `docs/architecture/elements-first-run-prompt.md` — that sequence runs after this WP is done and is
  not this WP's own action to take. **Never `main`.**

> These fields are populated automatically by `spec-kitty agent mission tasks`.
> Do NOT change them manually unless you are certain the branch topology has changed.

## Subtasks & Detailed Guidance

### Subtask T001 – Author `sk-public-header.css`

- **Purpose**: the core visual/layout contract — the six-class anatomy, the flex-wrap row, the
  logical-properties-only mirroring, the focus and current-item cues, the resolved target-size floor,
  and the forced-colours block.
- **Steps**:
  1. `.sk-public-header` — `box-sizing`, `inline-size: 100%`, colour/`background` from the page
     surface pair, and a bottom boundary authored as **longhands**
     (`border-block-end-style`/`-width`/`-color`), never the `border` shorthand — the longhand form
     is what `declaration-strict-value` can police and what the forced-colours block can override.
  2. `.sk-public-header__inner` — `display: flex; flex-wrap: wrap; align-items: center;
     justify-content: space-between; gap; padding-block; padding-inline; min-block-size;
     min-inline-size: 0`. No media query, no container query, no breakpoint anywhere (plan.md §5 —
     `flex-wrap` alone needs no threshold and cannot reorder).
  3. `.sk-public-header__brand` — `display: inline-flex; align-items: center; gap; min-block-size:
     var(--sk-space-9); min-inline-size: 0; overflow-wrap: anywhere; text-decoration: none`, with
     `:link`/`:visited` paired so visited history stays presentation-neutral.
  4. `.sk-public-header__brand-context` — muted foreground plus a logical
     `border-inline-start-*` separator (the corpus's `border-left` in logical form).
  5. `.sk-public-header__actions` — `display: flex; flex-wrap: wrap; align-items: center; gap;
     min-inline-size: 0`. It reserves nothing when absent because it is absent.
  6. `.sk-public-header__action` — `display: inline-flex; align-items: center; justify-content:
     center; min-block-size: var(--sk-space-9); min-inline-size: var(--sk-space-9); box-sizing:
     border-box`. This is the resolved target-size decision — apply it exactly, do not re-derive it.
  7. `:focus-visible` on brand and action — `outline-style`/`-width`/`-color` longhands with an
     `outline-offset`. **Never `box-shadow`** — it computes away entirely under forced colours.
  8. `[aria-current]:not([aria-current="false"])` on `.sk-public-header__action` — a non-colour cue
     (weight **and** a logical border or underline), matching `sk-context-nav.css:94-101`. The
     `:not([aria-current="false"])` guard matters: a consumer may legitimately write
     `aria-current="false"` on a non-current item, and styling it as current is a real defect.
  9. Resolve the `justify-content: space-between` + wrap interaction (plan.md §5): on a wrapped row,
     `space-between` distributes each line independently, so decide between `margin-inline-end: auto`
     on the brand or `flex: 0 0 auto` on the action region plus `flex: 1 1 auto` on the brand — let
     the fixtures and the T010 Playwright assertions (brand at start edge, actions at end edge at
     1440px; no overflow at 390px) decide which.
  10. Forced-colours block, small, in the shape of `sk-context-nav.css:195-213`: re-colour the header
      boundary, the current-action cue, and the focus outline to system keywords already present in
      `stylelint.config.mjs`'s `ignoreValues` (`Canvas`, `CanvasText`, `Highlight`, `HighlightText`,
      `ButtonText`, `LinkText`, `GrayText`) — confine yourself to that set; adding an eighth keyword
      requires a config edit this mission does not make.
- **Files**: `packages/styles/src/public-header/sk-public-header.css` (new).
- **Parallel?**: No — first subtask; everything else renders against this sheet.

### Subtask T002 – Edit the generator's `adrNote` branch **before** running it

- **Purpose**: `scripts/build-styles-only-markup.mjs:112-119` writes a per-component ADR-10 citation
  into the generated barrel. Left unmodified, `public-header`'s barrel would carry the *wrong*
  citation — `spec.md`'s "Styles-only rationale" section establishes this family follows the
  `form-field`-shaped reasoning (an explicitly recorded scope decision), not ADR-10's "class" ruling,
  because none of that ruling's four structural reasons applies to `<header>`/`<nav>`/`<a>`.
- **Steps**:
  1. Open `scripts/build-styles-only-markup.mjs` and find the `adrNote` ternary (lines ~112–119).
  2. Add a branch identical in shape to the existing `segmented-choice` branch:
     ```js
           : name === 'public-header'
             ? 'See #353.'
     ```
  3. Do **not** run the generator yet — that is T004.
- **Files**: `scripts/build-styles-only-markup.mjs` (edit).
- **Parallel?**: No — this subtask's entire purpose is to land **before** T004. Running the generator
  first and fixing the citation after produces a barrel `--check` reports as "stale" against a file
  you wrote correctly by hand — the exact confusion the generator's own DO-NOT-EDIT header exists to
  prevent (plan.md §2, R-10).

### Subtask T003 – Author the eight `.html` fixtures

- **Purpose**: real, authored markup for every required structural shape — the sole input the
  generator turns into barrel exports.
- **Steps**:
  1. `sk-public-header-brand-only.html` — header + inner + brand only. **No `<nav>` element at all**
     — not an empty one (FR-004, NFR-006).
  2. `sk-public-header-one-action.html` — brand + a `<nav aria-label="…">` with exactly one action.
  3. `sk-public-header-two-actions.html` — the Family 6 two-action shape: brand +
     `<nav aria-label="Account">` with two anchors (`Sign in`, `Start free`), each carrying
     `sk-public-header__action` alongside whatever `sk-button*` classes it also has.
  4. `sk-public-header-many-actions.html` — more than two actions, exercising wrap.
  5. `sk-public-header-long-labels.html` — an unbroken long brand string and/or long action labels
     that must wrap without producing root-level horizontal scroll.
  6. `sk-public-header-current-action.html` — one action carrying a consumer-supplied
     `aria-current="page"` (or similar), for the non-colour-cue and RTL/forced-colours assertions.
  7. `sk-public-header-mixed-controls.html` — a real `<a>` and a real `<button type="button">` in the
     same action region, both carrying `sk-public-header__action`.
  8. `sk-public-header-theme-slot.html` — per "The #323 dependency block" above.
  9. Every fixture: a real `<header class="sk-public-header">` root; no `role=`/`tabindex=` authored
     anywhere; no `<sk-public-header>` custom tag; no `data-od-id` copied from the corpus; every
     action-bearing fixture applies `.sk-public-header__action` to **every** direct child of
     `.sk-public-header__actions` (this is what makes T010's target-size assertion non-vacuous —
     do not skip it on any fixture).
  10. None of the six class names, and none of the corpus's local names (`topnav`, `logo`,
      `nav-actions`, `brand-context`, `theme-picker`), appear anywhere except the six this family
      defines.
- **Files**: eight new `.html` files under `packages/styles/src/public-header/`.
- **Parallel?**: No — depends on T001 existing in a renderable form; must exist before T004.

### Subtask T004 – Regenerate the barrel and verify clean

- **Purpose**: produce `index.ts` from T003's fixtures with no hand-editing, using T002's corrected
  generator.
- **Steps**:
  1. Run `node scripts/build-styles-only-markup.mjs`.
  2. Run `node scripts/build-styles-only-markup.mjs --check` — must exit 0.
  3. Open the generated `index.ts` and confirm its `public-header` rationale comment reads
     `See #353.`, not the ADR-10 class-ruling sentence.
  4. Confirm `git ls-files packages/elements/src/public-header` returns empty.
  5. Confirm none of `expected-parts.json`, `expected-docs.json`, `behaviours.json`,
     `mutations.json` gained an entry.
- **Files**: `packages/styles/src/public-header/index.ts` (generated).
- **Parallel?**: No — depends on T002 and T003.

### Subtask T005 – Wire the distribution surface

- **Purpose**: make the family importable. **No repository gate catches an omission here** — both
  files' relevant sections are hand-maintained by design (plan.md §1.4, R-10).
- **Steps**:
  1. Add one line to `packages/styles/src/index.ts`: `export * from './public-header/index';` —
     alongside the file's existing per-directory export lines, in the same style.
  2. Add one `exports` entry to `packages/styles/package.json`:
     `"./public-header/*": "./dist/public-header/*"`.
  3. No build-config change is needed — `nx run styles:build` already copies `**/*.{html,css}` from
     `src` to `dist`.
- **Files**: `packages/styles/src/index.ts` (edit), `packages/styles/package.json` (edit).
- **Parallel?**: No — depends on T004 (the barrel must exist to be re-exported).

### Subtask T006 – Author `sk-public-header-html.stories.ts`

- **Purpose**: Storybook demonstration of every required evidence axis, rendered from the generated
  barrel only.
- **Steps**:
  1. Proposed CSF title: `Navigation/SkPublicHeader (HTML)` — matching `sk-context-nav`'s
     `Navigation/SkContextNav (HTML)` (CLAUDE.md §6's "pick the closest existing root").
  2. Import fixture constants from `./index` only — **never** hand-write HTML in the story file.
  3. Export exactly these thirteen named stories, each rendering the fixture and frame listed:

     | Export | Fixture rendered | Frame |
     |---|---|---|
     | `Default` | two-actions | default (dark) |
     | `BrandOnly` | brand-only | default |
     | `OneAction` | one-action | default |
     | `ManyActions` | many-actions | default |
     | `LongLabels` | long-labels | narrow |
     | `CurrentAction` | current-action | default |
     | `MixedControls` | mixed-controls | default |
     | `ThemeToggleComposition` | theme-slot | default — description states #323-blocked |
     | `Narrow` | two-actions | 390px viewport |
     | `ShortViewport` | two-actions | short viewport |
     | `Rtl` | two-actions | `dir="rtl"` ancestor |
     | `ForcedColors` | current-action | default (browser test emulates the media feature) |
     | `LightMode` | two-actions | `class="sk-light"` ancestor |

  4. `Default` **is** the dark-default story — do not add a separate `DefaultDark` export (R-12: #176's
     gate already deleted byte-identical decoy stories once; do not reintroduce the pattern).
  5. `ThemeToggleComposition`'s `parameters.docs.description.story` must state plainly it is blocked
     on #323, what unblocks it, and that this family owns no theme state.
- **Files**: `packages/styles/src/public-header/sk-public-header-html.stories.ts` (new).
- **Parallel?**: No — depends on T005 (the family must be importable) and, practically, T004 (the
  generated barrel must contain the fixtures).

### Subtask T007 – `expected-stories.json` ratchet entry

- **Purpose**: NFR-011 — every required story id is registered so a future removal is a deliberate,
  reviewed edit, not a silent regression.
- **Steps**:
  1. Build Storybook (`npx nx run storybook:storybook:build --skip-nx-cache`) and read the actual ids
     off `apps/storybook/storybook-static/index.json`. **Do not hand-derive the ids** — a mismatch
     fails the axe gate by name (R-05).
  2. Add a new `byElement["sk-public-header"]` array with all thirteen built ids.
  3. Move `total` from 505 to 518 in the same change — `run-axe-storybook.js` requires `total` to
     equal the flattened `byElement` length, so editing one without the other fails loudly (R-06).
  4. Add a `$comment` line recording what was opted in and why, matching the file's existing
     convention.
- **Files**: `expected-stories.json` (edit).
- **Parallel?**: No — depends on T006 (a built Storybook containing the real story ids).

### Subtask T008 – `sk-public-header.spec.ts` part 1: source/distribution contract

- **Purpose**: the chromium-only, no-page-needed `describe` block that pins the sheet's exact
  selector inventory and every forbidden pattern, in the `sk-context-nav.spec.ts:89-98` idiom (postcss
  + postcss-selector-parser).
- **Steps**:
  1. Parse `sk-public-header.css` and assert its exact public class inventory equals the six classes
     in "The anatomy" above — no more, no fewer.
  2. Assert the sheet contains **no**: `.sk-button` selector, `sk-theme-toggle` selector, `::part(`,
     `:host`, `.sk-light`/`data-theme`/`:root`/`:host-context` selector, `[dir="rtl"]` rule, physical
     `left`/`right`/`margin-left`-family property, `order`/`*-reverse` value, `position:
     sticky|fixed`, literal `44px`, and no `transition`/`animation` declaration.
  3. Assert every system-colour keyword (`Canvas`, `CanvasText`, `Highlight`, `HighlightText`,
     `ButtonText`, `LinkText`, `GrayText`) that appears in the sheet appears **only** inside
     `@media (forced-colors: active)` — this converts `stylelint.config.mjs`'s documented reviewer
     obligation into a machine check for this one sheet.
  4. Assert `min-block-size`/`min-inline-size` on `.sk-public-header__action` resolve through a
     `--sk-space-*` token, not a literal.
  5. Run `check-component-token-literals.mjs` via `execFileSync` (as at
     `sk-context-nav.spec.ts:320`) and assert it exits clean.
  6. Assert the eight fixtures generate exactly eight expected barrel exports, each carrying a real
     `<header class="sk-public-header">`, no `role=`, no `tabindex=`, no `<sk-public-header>` tag, no
     `data-od-id`.
  7. Assert `packages/styles/src/index.ts` exports `./public-header/index` and
     `packages/styles/package.json` exposes `./public-header/*`.
  8. Assert absence from `packages/elements/src`, `packages/react/src`, `custom-elements.json`,
     `vue.d.ts`, `expected-parts.json`, `expected-docs.json`, `behaviours.json`, `mutations.json`
     (SC-008, SC-009).
  9. Assert `expected-stories.json`'s `byElement["sk-public-header"]` equals the story-id list
     exactly.
  10. Assert the `## Public header` section of `using-components.md` exists and names the anatomy
      classes, the three consumer obligations, `aria-current`, the #323 deferral, ADR-10, and the
      four near-neighbours (`sk-app-shell`, `sk-page-header`, `sk-nav-pill`, `sk-skip-link` — FR-020);
      and assert its documented token list equals the sheet's actual `var(--sk-*)` set, in the
      `sk-context-nav.spec.ts:444-448` equality-check shape.
- **Files**: `apps/storybook/src/tests/sk-public-header.spec.ts` (new — start the file here).
- **Parallel?**: No — depends on T006/T007 for the story-id and doc-content assertions to have real
  data to compare against.

### Subtask T009 – `sk-public-header.spec.ts` part 2: accessibility tree

- **Purpose**: NFR-006 — the platform's own accessibility tree confirms the landmark contract.
- **Steps**:
  1. Via a Chromium CDP `Accessibility.getPartialAXTree` snapshot (the shape at
     `sk-context-nav.spec.ts:524-549`), assert exactly one `banner` role per rendered story.
  2. Assert a `navigation` role is present **if and only if** an action region exists in that story,
     and always carries a non-empty accessible name.
  3. Assert the `BrandOnly` story exposes **zero** `navigation` roles.
  4. Assert source DOM order equals Tab focus order (the sentinel-button technique at
     `sk-context-nav.spec.ts:524-549`).
- **Files**: `apps/storybook/src/tests/sk-public-header.spec.ts` (edit, continuing T008).
- **Parallel?**: No — same file.

### Subtask T010 – `sk-public-header.spec.ts` part 3: target size, overflow, clipped focus

- **Purpose**: NFR-003, NFR-004, NFR-005 — the geometric contract, guarded against the vacuous-
  assertion failure mode (R-01).
- **Steps**:
  1. For every `.sk-public-header__action` in every action-bearing fixture, assert
     `getBoundingClientRect().width >= 44` and `.height >= 44` at both 390px and 1440px.
  2. **Add the non-vacuous guard**: assert the count of `.sk-public-header__actions > *` equals the
     count of `.sk-public-header__action` in every such fixture, and that the count is non-zero.
     Without this, a fixture that forgot to apply the class would make the size assertion pass over
     an empty selector — this is the single most important guard in this subtask.
  3. Assert `document.scrollingElement.scrollWidth <= clientWidth` at 390×720, 1440×900, a 200%-zoom
     emulation (halved-viewport approximation), and a short-viewport pass.
  4. Using the `focusVisibility()` helper shape at `sk-context-nav.spec.ts:181-220`, assert every
     focused control's outline is non-`none`, has positive width, and its box+outline stay within the
     viewport at 390px and 1440px, uncropped by any `overflow: hidden` ancestor.
- **Files**: `apps/storybook/src/tests/sk-public-header.spec.ts` (edit, continuing T009).
- **Parallel?**: No — same file.

### Subtask T011 – `sk-public-header.spec.ts` part 4: forced colours, no-colour-alone, reduced motion

- **Purpose**: NFR-007, NFR-008, and the "no colour alone" rule.
- **Steps**:
  1. Under `page.emulateMedia({ forcedColors: 'active' })`, assert the header's
     `borderBlockEndStyle` is non-`none`, its `borderBlockEndColor` differs from its background, and a
     focused action's `outlineStyle`/`outlineWidth` survive.
  2. Assert rest / hover / active / focus-visible / `aria-current` produce **five distinct non-colour
     cue signatures** (the `nonColourCue` set-size assertion shape at `sk-context-nav.spec.ts:839`),
     and that `aria-current="false"` styles identically to no attribute at all.
  3. Under `page.emulateMedia({ reducedMotion: 'reduce' })`, assert `transitionDuration === '0s'` and
     `animationName === 'none'` on the header, the inner row, and the brand boxes **only** — never on
     `.sk-public-header__action`, per "Hard rules" above.
- **Files**: `apps/storybook/src/tests/sk-public-header.spec.ts` (edit, continuing T010).
- **Parallel?**: No — same file.

### Subtask T012 – `sk-public-header.spec.ts` part 5: RTL, LightMode, zero actions

- **Purpose**: FR-010/User Story 5, and the required light-theme story.
- **Steps**:
  1. With `dir="rtl"` set on an ancestor, assert computed `direction` is `rtl`, the brand's box sits
     at the inline start (visually right under LTR-default reading), and no layout property changed —
     i.e. confirm (again, from the live page this time, not just the source scan) that no
     `[dir="rtl"]` rule fired.
  2. For `LightMode`, assert a real `.sk-light` ancestor exists and **at least one computed value
     differs** from the `Default` (dark) story — do not assume; assert the difference (CLAUDE.md §9).
  3. For `BrandOnly`, assert no `<nav>` element exists in the DOM at all and no empty `navigation`
     landmark is reported.
- **Files**: `apps/storybook/src/tests/sk-public-header.spec.ts` (edit, continuing T011 — this
  completes the file).
- **Parallel?**: No — same file.

### Subtask T013 – Usage documentation

- **Purpose**: FR-018 — a reader adopting this family should not have to read the mission spec.
- **Steps**:
  1. Add a `## Public header` section to `docs/design-system/using-components.md`, naming: the six
     anatomy classes and the element each belongs on; the three consumer obligations (non-empty
     `<nav>` `aria-label` when actions are present; exactly one `sk-public-header` per document; apply
     `.sk-public-header__action` to every action); `aria-current` usage and the "no colour alone" cue;
     the #323 deferral (what ships now, what changes when #323 lands); which ADR-10 rationale governs
     this family (the `form-field`-shaped recorded-decision reasoning, not the "class" ruling) and
     why; and the four near-neighbours this family restates none of (`sk-app-shell`, `sk-page-header`,
     `sk-nav-pill`, `sk-skip-link`) and what each of those actually owns instead.
  2. List the sheet's **actual** `var(--sk-*)` token set — this must equal what T008's equality check
     asserts, so write the doc section after T001's CSS is final, or update it if the CSS changes.
- **Files**: `docs/design-system/using-components.md` (edit).
- **Parallel?**: Can start once T001–T003 are stable in substance; sequenced here after the Storybook/
  test subtasks so the token list is checked against final CSS, not a moving target.

### Subtask T014 – Visual regression baselines

- **Purpose**: NFR-009/SC-005 — CI-authoritative visual coverage for the dark-default and `LightMode`
  stories.
- **Steps**:
  1. Add two `toHaveScreenshot` tests to `apps/storybook/src/tests/visual.spec.ts`, in the
     `contextNavVisuals` shape (lines ~1078–1113 there), for `Default` (dark) and `LightMode`.
  2. Run `PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts
     --project=chromium` locally only to confirm the tests execute and fail (no baseline exists yet)
     — **do not** pass `--update-snapshots`.
  3. Push. Let CI's `visual-regression` job run and fail once (no baseline).
  4. Download the `visual-regression-diffs` artifact from that CI run and commit the two PNGs it
     contains into `apps/storybook/src/tests/visual.spec.ts-snapshots/`.
  5. Push again and confirm the job now passes against the harvested baseline.
- **Files**: `apps/storybook/src/tests/visual.spec.ts` (edit),
  `apps/storybook/src/tests/visual.spec.ts-snapshots/*.png` (new, CI-harvested).
- **Parallel?**: No — depends on T006 (the stories being screenshotted must be final).

### Subtask T015 – Local gate matrix and hygiene sweep

- **Purpose**: confirm the whole WP is internally consistent before pushing, using every gate this
  host can run.
- **Steps**:
  1. `npm ci --ignore-scripts`
  2. `npx nx run tokens:build && npx nx run tokens:catalogue` (one-time — stylelint reads the built
     token catalogue).
  3. `node scripts/build-styles-only-markup.mjs --check`
  4. `npm run quality:all` (eslint + stylelint + htmlhint)
  5. `node scripts/check-component-token-literals.mjs packages/styles/src/public-header/sk-public-header.css`
  6. `node scripts/typecheck-all.mjs`
  7. `npx nx run storybook:storybook:build --skip-nx-cache`
  8. `node scripts/run-axe-storybook.js` (also enforces the `expected-stories.json` ratchet)
  9. `npx playwright test apps/storybook/src/tests/sk-public-header.spec.ts` while iterating, then
     `npx playwright test` (the whole `testDir`, as CI does) — confirm against **this checkout's own**
     Storybook build per the port-6006 constraint above.
  10. `node scripts/check-gate-wiring.mjs --selftest && node scripts/check-gate-wiring.mjs`
  11. `node scripts/check-story-theme-wrapper.mjs --selftest && node scripts/check-story-theme-wrapper.mjs`
  12. `git add -A && git status --porcelain` — must be **empty**. This is the real signal: the
      `--check` steps above are self-confirming locally (they compare against what the generator just
      wrote), so an unstaged generated file is the only thing distinguishing "green locally" from
      "green in CI."
- **Files**: none new — verification and staging only.
- **Parallel?**: No — depends on everything before it.

### Subtask T016 – Rebase, push, confirm CI green on all required jobs, re-run the pre-merge squad

- **Purpose**: SC-005 and the mission's own squad-tier obligation — CI and the pre-merge squad are
  the two things this WP is not "done" without.
- **Steps**:
  1. Re-confirm the port-6006 ownership check from "Environment constraints" one more time before this
     final run.
  2. Rebase onto the current `mission/public-header-styles` tip and, if `train/elements-first`'s head
     has moved since this mission's dispatch, onto that head too (R-08 — a Wave-1 sibling merging
     first is likely, per the epic).
  3. Rerun the full gate matrix (T015) against the new head.
  4. Push and confirm, on the opened PR/branch, that `storybook-build`, `a11y`, `playwright`, and
     `visual-regression` all report **run**, not **skipped** — this is the empirical check for
     plan.md §3's path-filter finding (no `ci-quality.yml` edit was needed; confirm that holds).
  5. Confirm the `playwright` job is green across every engine CI runs, and that the
     `visual-regression` job accepts exactly the two baselines harvested in T014 (never a locally-shot
     substitute).
  6. Re-run the pre-merge adversarial squad against the final head SHA — issue #353 states squad tier
     **C, pre-merge**, and this is never skipped regardless of tier. Evidence is pinned to the head
     SHA it was taken against; if anything pushes after the squad reports, re-run the affected lenses
     against the new tip before presenting the mission as review-ready.
- **Files**: none new — verification and push only.
- **Parallel?**: No — depends on T015.
