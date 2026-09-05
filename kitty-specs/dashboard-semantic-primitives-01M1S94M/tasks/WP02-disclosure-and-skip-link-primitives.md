---
work_package_id: WP02
title: Disclosure and skip-link primitives
dependencies: []
requirement_refs:
- C-001
- C-004
- C-005
- FR-002
- FR-006
- FR-007
- FR-009
- FR-010
- NFR-001
- NFR-002
- NFR-003
planning_base_branch: mission/dashboard-semantic-primitives
merge_target_branch: mission/dashboard-semantic-primitives
branch_strategy: Planning artifacts for this mission were generated on mission/dashboard-semantic-primitives. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/dashboard-semantic-primitives unless the human explicitly redirects the landing branch.
subtasks:
- T008
- T009
- T010
- T011
- T012
- T013
- T014
phase: Phase 1 - Motion and forced-colors baseline primitives
history:
- at: '2026-09-05T18:34:59Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
- at: '2026-09-05T20:50:00Z'
  actor: system
  action: Post-tasks adversarial squad findings folded (BLOCK verdict) — see plan.md "Corrected premises" and "Pre-mortem and Risks"
agent_profile: implementer-ivan
authoritative_surface: packages/styles/src/disclosure/
create_intent:
- packages/styles/src/disclosure/sk-disclosure.css
- packages/styles/src/disclosure/sk-disclosure-closed.html
- packages/styles/src/disclosure/sk-disclosure-open.html
- packages/styles/src/disclosure/sk-disclosure-long-body.html
- packages/styles/src/disclosure/sk-disclosure-nested.html
- packages/styles/src/disclosure/sk-disclosure-html.stories.ts
- packages/styles/src/disclosure/index.ts
- packages/styles/src/skip-link/sk-skip-link.css
- packages/styles/src/skip-link/sk-skip-link-unfocused.html
- packages/styles/src/skip-link/sk-skip-link-html.stories.ts
- packages/styles/src/skip-link/index.ts
execution_mode: code_change
model: ''
owned_files:
- packages/styles/src/disclosure/**
- packages/styles/src/skip-link/**
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP02 – Disclosure and skip-link primitives

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

*A post-tasks adversarial squad reviewed this mission's plan/tasks before any WP was implemented
and returned a BLOCK verdict, since folded into this prompt. Nothing in this WP had been
implemented at that point, so there is no in-progress work to reconcile — the corrections below
are already applied to the prompt itself.*

---

## Markdown Formatting

Wrap HTML/XML tags in backticks: `<details>`, `<summary>`, `<a>`
Use language identifiers in code blocks: ```python, ```bash

---

## Objectives & Success Criteria

Ship `.sk-disclosure` (`<details>`/`<summary>`) and `.sk-skip-link` (a real
`<a href="#main">`) — the two primitives in this mission that (a) introduce a transition and
therefore need the `prefers-reduced-motion` guard, and (b) own two of the mission's three
required `forced-colors` locations (the disclosure marker and the skip-link's focused state — the
third, **data-table zebra/hover row distinction**, is WP03's; the issue's original guess of "table
borders" was measured and found wrong — see plan.md's "Corrected premises").

Done means:

- Both CSS files exist, token-only, with the BEM names from the spec's public contract.
- Both carry a `@media (prefers-reduced-motion: reduce)` guard on their own transition. **There is
  no working precedent to copy the effect of** — `sk-transition-matrix.css:237` guards
  `scroll-behavior`, which is set nowhere in `packages/styles`, so it disables nothing. This WP
  establishes the first real guard of this kind. Each guard targets the exact transitioning
  declaration on the exact element that carries it — no wildcard selector.
- Both carry a `@media (forced-colors: active)` treatment for their respective affordance
  (skip-link focus outline; disclosure marker), using the one sanctioned CSS pattern below.
- Both directories have authored `.html` exemplars and a **generated** `index.ts` (never
  hand-written).
- Both have `sk-<name>-html.stories.ts` with the required variants plus `LightMode`, titled under
  the existing `Primitives/` Storybook section.

## Context & Constraints

- Mission spec: `kitty-specs/dashboard-semantic-primitives-01M1S94M/spec.md` — read FR-002,
  FR-006, FR-007, FR-009, FR-010, NFR-001, NFR-002, NFR-003, C-001, C-004, C-005.
- Mission plan: `kitty-specs/dashboard-semantic-primitives-01M1S94M/plan.md` — read IC-02, IC-05,
  IC-06, "Corrected premises", the "Public Contract" section (including the new "Forced-colors
  marker technique" and skip-link stacking-contract subsections), "Cross-cutting: forced-colors
  and reduced-motion", and "Sanctioned forced-colors CSS pattern".
- **The reduced-motion precedent at `sk-transition-matrix.css:237` is dead code — do not describe
  it as a working convention to generalise.** It reads:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .sk-transition-matrix,
    .sk-transition-matrix * { scroll-behavior: auto; }
  }
  ```
  Measured: no `.sk-transition-matrix` (or anything else in `packages/styles`) sets
  `scroll-behavior: smooth`, so this guard disables nothing, and it is also a wildcard over the
  component's own subtree (`.sk-transition-matrix *`), not a scoped, single-property guard as an
  earlier draft of this prompt claimed. **Do not copy this shape.** Your guards target only the
  exact transitioning declaration on the exact element that carries it (e.g.
  `.sk-disclosure__summary::before { transition: transform ...; }` guarded by disabling that same
  `transform` transition under `prefers-reduced-motion: reduce` — nothing wider).
- Precedent to copy structurally for file layout: `packages/styles/src/form-field/`. **Its
  `LightMode` story is NOT a precedent to copy** — see the `LightMode` guidance under T010/T013
  below.
- Generator: `scripts/build-styles-only-markup.mjs` — no changes to this script. **It throws (not
  a clean failure) if a directory has a `.css` but zero `.html` files, failing generation for
  every directory, not just the incomplete one.** Land your `.css` and at least one `.html` for
  each of `disclosure/` and `skip-link/` in the same commit.
- Token catalogue: `packages/tokens/src/tokens.css` — token-only CSS, no new
  `--sk-status-*`/`--sk-chart-*` (none exists yet; epic #183 ruling).
- **Sanctioned forced-colors CSS pattern**: `stylelint`'s `declaration-strict-value` policed list
  is `['/color/', 'background', 'background-color', 'font-family', 'padding', 'margin',
  'border-radius']`. `/color/` is a substring match, so it catches `border-color` and
  `outline-color`, and system-color keywords (`Highlight`, `CanvasText`) are not in
  `ignoreValues`. **Use the unpoliced shorthand instead**: `outline: 2px solid Highlight;` /
  `border: 1px solid CanvasText;` — plain `border`/`outline` (not the `-color` longhand) is not in
  the policed list, so this satisfies NFR-001 with **zero** new stylelint exceptions. This is the
  one sanctioned pattern for every forced-colors declaration in this WP (and WP03's, which shares
  the same `parallel_group: 0` — do not diverge from it).
- `LightMode` stories use `class="sk-light"`, never `data-theme="light"` (#93).
- **Storybook section**: use the existing `Primitives/` section (matching `check-bullet`,
  `pill-tag`, `section-banner`, `stub`) — `Primitives/SkDisclosure (HTML)` and
  `Primitives/SkSkipLink (HTML)`. There is no `Dashboard/` section in this repo; do not invent one.

## Branch Strategy

- **Strategy**: single_branch — this mission's target branch IS `mission/dashboard-semantic-primitives`.
- **Planning base branch**: `mission/dashboard-semantic-primitives`
- **Merge target branch**: `mission/dashboard-semantic-primitives`
- **A caution, not a redirect**: `lanes.json`'s `mission_branch` field names
  `kitty/mission-dashboard-semantic-primitives-01M1S94M`, a branch that does not exist. The real
  branch is the one named above. If a dispatch step tries to resolve this WP's base from
  `lanes.json` instead of this frontmatter, use `mission/dashboard-semantic-primitives`.

> These fields are populated automatically by `spec-kitty agent mission tasks`.
> Do NOT change them manually unless you are certain the branch topology has changed.

## Subtasks & Detailed Guidance

### Subtask T008 – Author `sk-disclosure` CSS incl. reduced-motion + forced-colors marker

- **Purpose**: Style `<details>`/`<summary>` with a marker treatment that is never the sole
  affordance, a visible `:focus-visible` ring, and the two cross-cutting baselines — correctly
  this time.
- **Steps**:
  1. Create `packages/styles/src/disclosure/sk-disclosure.css`.
  2. `.sk-disclosure` (on `<details>`); `.sk-disclosure__summary` (on `<summary>`);
     `.sk-disclosure__body` (wraps the revealed content, itself inside `<details>`).
  3. **Never `display: flex`/`display: grid` on `.sk-disclosure__summary` unless a replacement
     marker ships in the same rule.** Measured: `display: flex` silently removes Chromium's
     native triangle (text shifts from `x=15` to `x=0`) while
     `getComputedStyle(el).listStyleType` still reports `disclosure-closed` — the loss is
     invisible to computed-style inspection and only shows up visually. If you need flex/grid
     layout inside the summary (e.g. to place a custom marker and text side by side), the custom
     marker must be the thing providing the affordance, not an assumption that the native
     triangle survives.
  4. **Marker technique: `content`-drawn or `border`-drawn only — never a `background`-drawn icon
     with `forced-color-adjust: none`.** Measured in both Windows High Contrast schemes: a
     background-drawn triangle with `forced-color-adjust: none` stays its authored color
     (`rgb(51,51,51)` in the probe) and is near-invisible against the dark-HC background (the
     majority configuration); without that property it computes to `Canvas` and is equally
     invisible. A `content: "▸"` (or similar) text marker, or a `border`-drawn triangle, survives
     because forced-colors maps text/border colors to `CanvasText`, not backgrounds. Use one of
     those two, closed/open state via `.sk-disclosure[open] > .sk-disclosure__summary::before`
     (rotate, or swap the character/border direction).
  5. **Every `[open]`-scoped marker rule uses a child combinator, never a descendant combinator.**
     `.sk-disclosure[open] > .sk-disclosure__summary::before`, not
     `.sk-disclosure[open] .sk-disclosure__summary::before`. Measured: with a descendant
     combinator, an **open outer** disclosure also flips the marker of a **closed nested inner**
     disclosure, because `[open] .foo` matches any `.foo` anywhere inside an open ancestor. The
     nested exemplar (T009) exists specifically to catch this — a wrong selector here makes that
     exemplar demonstrate the bug instead of proving its absence.
  6. Pair any marker change with something else (a text label, a color/weight change on the
     summary text) — the marker alone is not sufficient if color/shape is the *only* signal.
  7. Add a visible `:focus-visible` ring on `.sk-disclosure__summary` using
     `--sk-border-focus`/`--sk-shadow-focus` tokens (the pattern in `sk-form-field.css`'s
     `.sk-input:focus` is a reasonable model, adapted).
  8. Add `@media (prefers-reduced-motion: reduce)` disabling exactly the marker's own transition
     property (e.g. `transform` on the `::before` marker) — scoped to that selector, not a
     wildcard. There is no precedent whose *effect* you are copying (see Context above); the
     *shape* is: name the property, name the selector, disable it.
  9. Add `@media (forced-colors: active)` using the sanctioned shorthand pattern from Context
     above (`border: 1px solid CanvasText;` if border-drawn, or ensure `content`-drawn text
     inherits `color: CanvasText` via the unpoliced `color` shorthand path — check whether plain
     `color` is policed; it is not in the listed properties either, so a bare `color: CanvasText`
     under this media query is also safe).
  10. Do not touch the `open` attribute in CSS logic beyond `[open]` selectors for styling — no
      JS, no re-implementation of `aria-expanded` (the browser owns that).
  11. Token-only values throughout, except the forced-colors block's system-color keywords, which
      use the sanctioned shorthand pattern and need **no** stylelint exception.
- **Files**: `packages/styles/src/disclosure/sk-disclosure.css` (new).
- **Parallel?**: Yes, with T009, but land both in the same commit (generator delivery rule).

### Subtask T009 – Author `sk-disclosure` HTML exemplars

- **Purpose**: Real markup for every required variant, including one that exercises the
  child-combinator fix from T008.
- **Steps**:
  1. `sk-disclosure-closed.html` — a `<details>` without `open`, real summary text, real body
     content inside.
  2. `sk-disclosure-open.html` — the same content with the `open` attribute present.
  3. `sk-disclosure-long-body.html` — a body long enough to prove the layout doesn't break.
  4. `sk-disclosure-nested.html` — an **open outer** `<details>` containing a **closed inner**
     `<details>` in its body. This exemplar's entire purpose is to prove the outer's open marker
     does not bleed onto the inner's closed marker (T008's child-combinator fix). If both markers
     show as "open", the CSS regressed to a descendant combinator.
  5. Leading comment headers per file. All must use real `<details>`/`<summary>` tags (SC-002).
- **Files**: four new `.html` files under `packages/styles/src/disclosure/`.
- **Parallel?**: Yes, with T008, same commit.

### Subtask T010 – Regenerate `disclosure/index.ts` and author its stories

- **Purpose**: Generated barrel + Storybook demonstration.
- **Steps**:
  1. `node scripts/build-styles-only-markup.mjs`.
  2. `packages/styles/src/disclosure/sk-disclosure-html.stories.ts`: `title:
     'Primitives/SkDisclosure (HTML)'` (not `Dashboard/` — see Context above). Stories: `Closed`
     (default), `Open`, `LongBody`, `Nested` (must visibly show the inner marker as closed while
     the outer is open — see T009), and `LightMode`.
  3. **`LightMode` precedent is `check-bullet`, not `form-field`.** Read
     `packages/styles/src/check-bullet/sk-check-bullet-html.stories.ts`'s `LightMode` export —
     `<div class="sk-light" style="background: var(--sk-surface-page); ...">`. Measured:
     `form-field`'s own `LightMode` story has **no** `class="sk-light"` at all (only a Storybook
     `backgrounds` parameter) and is recorded in `expected-inert-theme-wrappers.json` as a known,
     deliberate offender — copying it would ship an inert `LightMode` story that
     `check-story-theme-wrapper.mjs` cannot catch (it checks for `data-theme`, not a missing
     class). Verify your `LightMode` actually renders differently from dark mode by inspecting a
     computed style value under both, not by assuming the class does something.
  4. Add a documented forced-colors note/story per SC-005 — either a dedicated story demonstrating
     the marker under emulated `forced-colors: active`, or a code-comment describing exactly how
     to manually verify (Windows High Contrast, or Chromium devtools' "Emulate CSS media feature
     forced-colors"). Do not silently skip this.
- **Files**: `packages/styles/src/disclosure/index.ts` (generated),
  `sk-disclosure-html.stories.ts` (new).
- **Parallel?**: No — depends on T008/T009.

### Subtask T011 – Author `sk-skip-link` CSS incl. reduced-motion + forced-colors focus

- **Purpose**: A real `<a href="#main">`, off-screen until focused, then visible above all
  content at AA contrast — using a technique that actually works on an inline element.
- **Steps**:
  1. Create `packages/styles/src/skip-link/sk-skip-link.css`.
  2. `.sk-skip-link` on the anchor. **Off-screen technique: `clip-path` (or the classic
     clip-rect/absolute-position "visually hidden" recipe), never a bare `transform`.** Measured:
     `transform` does not apply to non-replaced inline elements, and `<a>` is inline by default —
     `transform: translateY(-100%)` on an unstyled `<a>` **does not move it**.
     `document.elementFromPoint()` at the link's visual center still returns the anchor, meaning
     it sits as a permanently visible, click-swallowing element at the top-left of every
     consuming page, while stylelint/htmlhint/axe all stay green (none evaluates layout).
     `clip-path` (e.g. `clip-path: inset(50%)` combined with fixed positioning and a small
     width/height) was probed and does move the content out of paint while it remains in the
     accessibility tree and tab order. **Never** `display: none` (removes it from the a11y tree
     and tab order) and **never** `visibility: hidden` (same defect).
  3. `:focus-visible` state: bring it fully on-screen (`clip-path: none` or equivalent), above all
     content, background/foreground at AA contrast using `--sk-*` tokens, and a visible outline
     or box-shadow. **Never** `outline: none` on this element in any state.
  4. **Stacking contract**: give the focused state an explicit high `z-index` (a literal integer
     is fine — `z-index` is not in stylelint's policed-property list) and `position: fixed` (or
     `sticky`). Two measured silent failures to avoid: (a) too low a `z-index` paints the link
     underneath common fixed page chrome (e.g. a `z-index: 10` header) while it still computes as
     "visible"; (b) `position: fixed` is trapped by any ancestor with `transform`/`filter`/
     `will-change` set, which establishes a new containing block. Document in the CSS file's
     header comment: consumers must not place `.sk-skip-link` inside a transformed/filtered
     ancestor.
  5. `@media (prefers-reduced-motion: reduce)`: disable exactly the off-screen → visible
     transition property (e.g. `clip-path` or `opacity`) — scoped to `.sk-skip-link`, not a
     wildcard. There is no working precedent to copy the *effect* of (see Context above); copy
     only the *shape* (name the property, disable it).
  6. `@media (forced-colors: active)`: use the sanctioned shorthand pattern
     (`outline: 2px solid Highlight;`) for the focused state — see Context above. Do not write
     `outline-color: Highlight` (the longhand trips `declaration-strict-value`).
- **Files**: `packages/styles/src/skip-link/sk-skip-link.css` (new).
- **Parallel?**: Yes, with T012, same commit.

### Subtask T012 – Author `sk-skip-link` HTML exemplars

- **Purpose**: Real markup for the unfocused state, with a genuine `id="main"` target. The
  focused state is demonstrated in the story (T013), not a second static file.
- **Steps**:
  1. `sk-skip-link-unfocused.html` — the bare `<a href="#main" class="sk-skip-link">Skip to main
     content</a>` plus a minimal `<main id="main">...</main>` sibling so the target actually
     exists and the link is a real, resolvable in-page anchor.
  2. **Do not create a second `is-focused`-class exemplar.** `sk-form-input.css` already records,
     in this repo's own words, that `.sk-input.is-focused` "fakes a state the browser owns" and
     was deliberately dropped from the elements-layer sheet — an element with real
     `:focus-visible` has no business shipping a simulated version of it, and it tells the
     accessibility tree something untrue. `:focus-visible` also has no simulatable class form in
     the first place. The `Focused` story (T013) demonstrates this via a real `play()`-driven
     focus instead.
- **Files**: `packages/styles/src/skip-link/sk-skip-link-unfocused.html` (new — this is the
  **only** `.html` file for this primitive; do not add a `-focused.html` sibling).
- **Parallel?**: Yes, with T011, same commit.
- **Notes**: SC-002 requires the authored `.html` to contain a real `<a>` tag — grepping for
  story titles does not satisfy it.

### Subtask T013 – Regenerate `skip-link/index.ts` and author its stories

- **Purpose**: Generated barrel + Storybook demonstration proving the focus behavior for real,
  including a check axe can actually see.
- **Steps**:
  1. `node scripts/build-styles-only-markup.mjs`.
  2. `packages/styles/src/skip-link/sk-skip-link-html.stories.ts`: `title:
     'Primitives/SkSkipLink (HTML)'`.
  3. `Unfocused` story: renders `SkSkipLinkUnfocusedHTML` as-is.
  4. `Focused` story: renders the same markup, then a `play()` function that calls
     `.focus()` on the rendered `.sk-skip-link` element (using `@storybook/test`'s `within`/
     `userEvent`, or a direct DOM query — whichever this Storybook version supports; check
     existing stories in this repo for the established `play()` pattern before inventing one).
     **This is not optional and has no simulated-class fallback** (see T012). Storybook runs
     `play()` as part of normal story rendering, before the canvas is considered settled — so
     `run-axe-storybook.js`, which loads each story's iframe and waits for rendering to finish,
     scans the **actually-focused** DOM. This is what makes FR-006's AA-contrast requirement
     independently verifiable: plain axe never calls `.focus()` itself, so a deliberately-failing
     low-contrast link (e.g. ≈1.2:1) reports **zero** `color-contrast` violations at rest and only
     fails once something focuses it. Confirm this story's `play()` genuinely leaves the link
     focused when the story settles (e.g. log/verify `document.activeElement` during development),
     not just that the function runs without throwing.
  5. Also assert `href="#main"` resolves to the real `id="main"` element rendered alongside it —
     inspect the DOM structure, not just the attribute string.
  6. Include the required `LightMode` story — **`check-bullet`'s shape, not form-field's** (see
     T010 for the measured reason).
  7. Include a forced-colors documentation note per SC-005 (see T010's pattern).
- **Files**: `packages/styles/src/skip-link/index.ts` (generated),
  `sk-skip-link-html.stories.ts` (new).
- **Parallel?**: No — depends on T011/T012.

### Subtask T014 – Stylelint + htmlhint scoped to this WP's two directories; verify motion/forced-colors shape

- **Purpose**: Local verification before handoff.
- **Steps**:
  1. `npx stylelint "packages/styles/src/disclosure/**/*.css" "packages/styles/src/skip-link/**/*.css"`
     — confirm the forced-colors declarations use the sanctioned shorthand (`border:`/`outline:`),
     not the `-color` longhand, and pass with zero new exceptions.
  2. `npx htmlhint "packages/styles/src/disclosure/**/*.html" "packages/styles/src/skip-link/**/*.html"`
  3. Re-read both CSS files' `@media (prefers-reduced-motion: reduce)` blocks and confirm each is
     scoped to the exact transitioning property on the exact selector — no wildcard, no reference
     to a "precedent shape" that doesn't actually guard anything.
  4. Confirm `@media (forced-colors: active)` appears in both files and covers exactly the
     skip-link focus state and the disclosure marker — not data-table row distinction (that's
     WP03) and not table borders (that location was wrong and is gone from the spec).
  5. Confirm no `display: flex`/`grid` on `.sk-disclosure__summary` without a replacement marker
     in the same rule, and confirm the `[open]` marker rules use `>` (child combinator).
  6. Confirm `sk-skip-link.css` uses `clip-path` (or the clip/absolute-position recipe), not a
     bare `transform`, for its off-screen technique.
- **Files**: N/A (verification only).
- **Parallel?**: No — run last.

## Test Strategy

No behaviour tests apply. Verification is stylelint, htmlhint, a clean Storybook render, and axe
(run mission-wide in WP04, and per-story via the `Focused` story's `play()` function for the
skip-link's contrast requirement specifically). If your harness supports it, manually tab to the
skip link and toggle the disclosure in a real browser before marking this WP done — native
keyboard behavior for both elements should need zero extra code to work correctly; if it doesn't,
something in your CSS is interfering (e.g. `pointer-events: none` leaking onto the wrong element,
or a `tabindex` accidentally added to something that shouldn't need one). Also manually verify (or
describe verification of) the stacking contract: place the rendered skip link under a mock fixed
header with a competing `z-index` and confirm it still paints on top when focused.

## Risks & Mitigations

- **Risk**: writing a reduced-motion guard that copies `sk-transition-matrix.css:237`'s wildcard
  shape or claims to "generalise" a working precedent. **Mitigation**: there is no working
  precedent — re-read Context above; scope every guard to the exact declaration it disables.
- **Risk**: `display: none` or `visibility: hidden` sneaking into the skip-link's off-screen
  technique (both remove it from the a11y tree); or a bare `transform` that silently does nothing
  because `<a>` is inline. **Mitigation**: FR-006 is explicit — re-read it; use `clip-path` (or
  the clip/absolute-position recipe), verified against `elementFromPoint()` behavior conceptually.
- **Risk**: the disclosure marker relies on color alone, or on `forced-color-adjust: none` on a
  background-drawn icon (which reproduces the FR-009 failure it exists to prevent).
  **Mitigation**: content- or border-drawn marker only; pair any color change with a shape/text
  change.
- **Risk**: forced-colors treatment invents a location beyond skip-link focus / disclosure marker,
  or lands on data-table borders (wrong location, not this WP's surface anyway).
  **Mitigation**: scope your forced-colors blocks to exactly the two affordances this WP owns.
- **Risk**: `display: flex` on `<summary>` silently drops the native marker with no reliable
  computed-style signal. **Mitigation**: never flex/grid the summary without a replacement marker
  in the same rule; check visually.
- **Risk**: a descendant-combinator `[open]` selector makes a nested exemplar demonstrate the bug
  it should catch. **Mitigation**: child combinators only; the `Nested` story is the check.
- **Risk**: a simulated `is-focused` class ships for the skip link, demonstrating a state the CSS
  never enters. **Mitigation**: no such file/class in this WP; use `play()`-driven real focus.
- **Risk**: forced-colors declarations trip `declaration-strict-value` because the `-color`
  longhand was used. **Mitigation**: sanctioned shorthand pattern only, recorded once in plan.md
  and referenced here — do not improvise a stylelint exception.

## Review Guidance

- Confirm both CSS files pass `declaration-strict-value` with no new exceptions, using the
  sanctioned shorthand pattern for forced-colors.
- Confirm neither reduced-motion guard uses a wildcard selector or claims to copy a "working"
  precedent.
- Confirm the skip-link never uses `display: none`, `visibility: hidden`, or `outline: none` in
  any state, and does not rely on a bare `transform` for its off-screen technique.
- Confirm the disclosure's `[open]` marker rules use child combinators, and the `Nested` story
  actually shows the inner marker's independent state.
- Confirm the disclosure's `open` attribute is never touched by anything but `[open]` CSS
  selectors — no JS anywhere in this WP.
- Confirm the skip link's `Focused` story uses a real `play()`-driven `.focus()` call, with no
  `is-focused` simulated-class alternative anywhere in the directory.
- Confirm `LightMode` uses `class="sk-light"` in both story files, matching `check-bullet`'s
  shape, and confirm a computed style genuinely differs between light and dark.
- Confirm both story files use `Primitives/` titles, not `Dashboard/`.

## Activity Log

> **CRITICAL**: Activity log entries MUST be in chronological order (oldest first, newest last).

- 2026-09-05T18:34:59Z – system – Prompt created.
- 2026-09-05T20:50:00Z – system – Folded post-tasks adversarial squad findings (BLOCK verdict): corrected the reduced-motion precedent description, the forced-colors marker technique, the skip-link off-screen technique and stacking contract, the sanctioned forced-colors CSS pattern, the child-combinator requirement, the LightMode precedent citation, and the Storybook section title.
