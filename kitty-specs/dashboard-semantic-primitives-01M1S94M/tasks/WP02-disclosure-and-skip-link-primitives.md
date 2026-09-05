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
- packages/styles/src/skip-link/sk-skip-link-focused.html
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

*None yet — this is the initial prompt.*

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
third, table borders, is WP03's).

Done means:

- Both CSS files exist, token-only, with the BEM names from the spec's public contract.
- Both carry a `@media (prefers-reduced-motion: reduce)` guard on their own transition, in the
  **same shape** as the existing precedent at
  `packages/styles/src/transition-matrix/sk-transition-matrix.css:237` — not a new convention.
- Both carry a `@media (forced-colors: active)` treatment for their respective affordance
  (skip-link focus outline/background; disclosure marker).
- Both directories have authored `.html` exemplars and a **generated** `index.ts` (never
  hand-written).
- Both have `sk-<name>-html.stories.ts` with the required variants plus `LightMode`.

## Context & Constraints

- Mission spec: `kitty-specs/dashboard-semantic-primitives-01M1S94M/spec.md` — read FR-002,
  FR-006, FR-007, FR-009, FR-010, NFR-001, NFR-002, NFR-003, C-001, C-004, C-005.
- Mission plan: `kitty-specs/dashboard-semantic-primitives-01M1S94M/plan.md` — read IC-02, IC-05,
  IC-06, and the "Public Contract" and "Cross-cutting: forced-colors and reduced-motion" sections.
- **Read the existing reduced-motion precedent before writing anything**:
  `packages/styles/src/transition-matrix/sk-transition-matrix.css` around line 237 —
  ```css
  @media (prefers-reduced-motion: reduce) {
    .sk-transition-matrix,
    .sk-transition-matrix * { scroll-behavior: auto; }
  }
  ```
  Your guards target the specific transitioning property each primitive actually animates (not
  `scroll-behavior` — that precedent's property doesn't apply here), but the **shape** — a scoped
  media query disabling a named property, not a blanket `* { transition: none !important }` — is
  what you copy. The mission spec explicitly says: generalise this, do not invent a second
  convention. The issue text claiming this baseline is entirely absent is stale — it isn't, for
  reduced-motion; `forced-colors` genuinely is absent and this WP is part of establishing it.
- Precedent to copy structurally for file layout: `packages/styles/src/form-field/`.
- Generator: `scripts/build-styles-only-markup.mjs` — no changes to this script.
- Token catalogue: `packages/tokens/src/tokens.css` — token-only CSS, no new
  `--sk-status-*`/`--sk-chart-*` (none exists yet; epic #183 ruling).
- `LightMode` stories use `class="sk-light"`, never `data-theme="light"` (#93).

## Branch Strategy

- **Strategy**: single_branch — this mission's target branch IS `mission/dashboard-semantic-primitives`.
- **Planning base branch**: `mission/dashboard-semantic-primitives`
- **Merge target branch**: `mission/dashboard-semantic-primitives`

> These fields are populated automatically by `spec-kitty agent mission tasks`.
> Do NOT change them manually unless you are certain the branch topology has changed.

## Subtasks & Detailed Guidance

### Subtask T008 – Author `sk-disclosure` CSS incl. reduced-motion + forced-colors marker

- **Purpose**: Style `<details>`/`<summary>` with a marker treatment that is never the sole
  affordance, a visible `:focus-visible` ring, and the two cross-cutting baselines.
- **Steps**:
  1. Create `packages/styles/src/disclosure/sk-disclosure.css`.
  2. `.sk-disclosure` (on `<details>`); `.sk-disclosure__summary` (on `<summary>`);
     `.sk-disclosure__body` (wraps the revealed content, itself inside `<details>`).
  3. Style the native marker (via `::marker` or a custom `::before`/`::after` indicator on the
     summary, replacing `list-style` if you suppress the default marker with
     `list-style: none` — remember `summary { list-style: none }` also needs
     `summary::-webkit-details-marker { display: none }` for Chromium/Safari, or use `::marker`
     directly which is now broadly supported). Pair any icon change with something else (a text
     label, a color/weight change on the summary text) — the marker rotation/swap alone is not a
     sufficient affordance if it is the *only* signal (color/shape alone fails a
     non-color-dependent-meaning check).
  4. Add a visible `:focus-visible` ring on `.sk-disclosure__summary` using
     `--sk-border-focus`/`--sk-shadow-focus` tokens (the pattern in `sk-form-field.css`'s
     `.sk-input:focus` is a reasonable model, adapted).
  5. Add `@media (prefers-reduced-motion: reduce)` disabling the marker's transition — the exact
     property you animate (e.g. `transform` on a custom marker icon), following the shape
     described above.
  6. Add `@media (forced-colors: active)` ensuring the marker remains perceivable — typically by
     forcing a `forced-color-adjust: none` icon fill/border, or relying on
     `Highlight`/`CanvasText`/`ButtonText` system colors rather than a token, since forced-colors
     mode does not honor arbitrary custom-property colors and instead maps to a small system
     palette. Test conceptually against what Windows High Contrast actually preserves: borders and
     system-color text, not arbitrary background fills.
  7. Do not touch the `open` attribute in CSS logic beyond `[open]` selectors for styling — no JS,
     no re-implementation of `aria-expanded` (the browser owns that).
  8. Token-only values throughout, except where `forced-colors` mode requires a system color
     keyword (e.g. `CanvasText`) — the stylelint config's `ignoreValues` already allows
     `currentColor`; if a system color keyword trips `declaration-strict-value`, check whether it
     needs a **new**, deliberate, minimal exception, and if so say so explicitly rather than
     silently adding it — but prefer keeping the forced-colors block scoped to properties
     `declaration-strict-value` doesn't police (e.g. `border-style`) if possible.
- **Files**: `packages/styles/src/disclosure/sk-disclosure.css` (new).
- **Parallel?**: Yes, with T009.

### Subtask T009 – Author `sk-disclosure` HTML exemplars

- **Purpose**: Real markup for every required variant.
- **Steps**:
  1. `sk-disclosure-closed.html` — a `<details>` without `open`, real summary text, real body
     content inside.
  2. `sk-disclosure-open.html` — the same content with the `open` attribute present.
  3. `sk-disclosure-long-body.html` — a body long enough to prove the layout doesn't break.
  4. `sk-disclosure-nested.html` — a `<details>` inside another `<details>`'s body, proving the
     styling composes without a shadow boundary in the way (this mission's own light-DOM point).
  5. Leading comment headers per file. All must use real `<details>`/`<summary>` tags (SC-002).
- **Files**: four new `.html` files under `packages/styles/src/disclosure/`.
- **Parallel?**: Yes, with T008.

### Subtask T010 – Regenerate `disclosure/index.ts` and author its stories

- **Purpose**: Generated barrel + Storybook demonstration.
- **Steps**:
  1. `node scripts/build-styles-only-markup.mjs`.
  2. `packages/styles/src/disclosure/sk-disclosure-html.stories.ts`: `Closed` (default), `Open`,
     `LongBody`, `Nested`, and `LightMode`. Add a documented forced-colors note/story per SC-005 —
     either a dedicated story demonstrating the marker under emulated `forced-colors: active`
     (Storybook can emulate this via a wrapping class/media-emulation parameter if configured; if
     not configured, add a code-comment describing exactly how to manually verify: Windows High
     Contrast, or Chromium devtools' "Emulate CSS media feature forced-colors" — do not silently
     skip SC-005's requirement for a "documented visual baseline").
- **Files**: `packages/styles/src/disclosure/index.ts` (generated),
  `sk-disclosure-html.stories.ts` (new).
- **Parallel?**: No — depends on T008/T009.

### Subtask T011 – Author `sk-skip-link` CSS incl. reduced-motion + forced-colors focus

- **Purpose**: A real `<a href="#main">`, off-screen until focused, then visible above all
  content at AA contrast.
- **Steps**:
  1. Create `packages/styles/src/skip-link/sk-skip-link.css`.
  2. `.sk-skip-link` on the anchor. Off-screen technique: an off-canvas transform (e.g.
     `transform: translateY(-100%)` or positioning far off-viewport) or `clip-path`/clip-rect —
     **never** `display: none` (removes it from the accessibility tree and the tab order) and
     **never** `visibility: hidden` (same defect). It must remain in the tab order and reachable
     by keyboard at all times.
  3. `:focus-visible` state: bring it fully on-screen, above all content (a high but sane
     `z-index` token if one exists, otherwise a literal integer is acceptable for `z-index` since
     it isn't a strict-value-policed property — check `stylelint.config.mjs`'s policed property
     list; `z-index` is not in it), background/foreground at AA contrast using `--sk-*` tokens,
     and a visible outline or box-shadow. **Never** `outline: none` on this element in any state.
  4. `@media (prefers-reduced-motion: reduce)`: disable the off-screen → visible transition
     (e.g. the `transform`/`opacity` transition property), same shape as the transition-matrix
     precedent.
  5. `@media (forced-colors: active)`: ensure the focused state's outline/border remains
     perceivable — typically `outline-color: Highlight` or similar system-color reliance, since
     forced-colors mode overrides most background/foreground colors but respects `outline` and
     border styles more predictably.
- **Files**: `packages/styles/src/skip-link/sk-skip-link.css` (new).
- **Parallel?**: Yes, with T012.

### Subtask T012 – Author `sk-skip-link` HTML exemplars

- **Purpose**: Real markup for the unfocused and focused-demonstration states, with a genuine
  `id="main"` target.
- **Steps**:
  1. `sk-skip-link-unfocused.html` — the bare `<a href="#main" class="sk-skip-link">Skip to main
     content</a>` plus a minimal `<main id="main">...</main>` sibling so the target actually
     exists and the link is a real, resolvable in-page anchor.
  2. `sk-skip-link-focused.html` — the same structure, with a class or attribute demonstrating the
     focused visual state for the story (e.g. an `is-focused` demo class mirroring the
     `sk-form-input-focus.html` precedent's pattern for showing a focus state without requiring
     actual browser focus in a static exemplar) — **or**, if your CSS keys purely off
     `:focus-visible` with no simulatable class, note in the file's header comment that the
     Storybook story demonstrates this by focusing the live element instead of relying on a static
     class, and keep this exemplar identical to the unfocused one (in which case, only create one
     `.html` file and demonstrate the focused state entirely via story-level `play`/interaction or
     documentation — pick whichever approach keeps the exemplar honest and say which you chose in
     the CSS file's header comment).
- **Files**: `packages/styles/src/skip-link/sk-skip-link-unfocused.html` (new), and
  `sk-skip-link-focused.html` if you choose the simulated-class approach.
- **Parallel?**: Yes, with T011.
- **Notes**: Whichever approach you pick, SC-002 still requires the authored `.html` to contain a
  real `<a>` tag — grepping for story titles does not satisfy it.

### Subtask T013 – Regenerate `skip-link/index.ts` and author its stories

- **Purpose**: Generated barrel + Storybook demonstration proving the focus behavior.
- **Steps**:
  1. `node scripts/build-styles-only-markup.mjs`.
  2. `packages/styles/src/skip-link/sk-skip-link-html.stories.ts`: an `Unfocused` story and a
     `Focused` story that **proves** the link becomes visible and its `href` resolves to `#main`
     in the rendered fixture (if Storybook's web-components renderer supports a `play` function
     for interaction-driven focus, use it; otherwise render the simulated-focus exemplar and note
     in a comment that real keyboard-focus behavior is additionally verified manually/in the
     browser). Include the required `LightMode` story and a forced-colors documentation note per
     SC-005.
- **Files**: `packages/styles/src/skip-link/index.ts` (generated),
  `sk-skip-link-html.stories.ts` (new).
- **Parallel?**: No — depends on T011/T012.

### Subtask T014 – Stylelint + htmlhint scoped to this WP's two directories; verify motion/forced-colors shape

- **Purpose**: Local verification before handoff.
- **Steps**:
  1. `npx stylelint "packages/styles/src/disclosure/**/*.css" "packages/styles/src/skip-link/**/*.css"`
  2. `npx htmlhint "packages/styles/src/disclosure/**/*.html" "packages/styles/src/skip-link/**/*.html"`
  3. Re-read both CSS files' `@media (prefers-reduced-motion: reduce)` blocks side by side with
     `sk-transition-matrix.css:237` and confirm the shape matches (scoped media query, named
     property, no blanket rule).
  4. Confirm `@media (forced-colors: active)` appears in both files and covers exactly the
     skip-link focus state and the disclosure marker — not table borders (that's WP03).
- **Files**: N/A (verification only).
- **Parallel?**: No — run last.

## Test Strategy

No behaviour tests apply. Verification is stylelint, htmlhint, a clean Storybook render, and axe
(run mission-wide in WP04). If your harness supports it, manually tab to the skip link and toggle
the disclosure in a real browser before marking this WP done — native keyboard behavior for both
elements should need zero extra code to work correctly; if it doesn't, something in your CSS is
interfering (e.g. `pointer-events: none` leaking onto the wrong element, or a `tabindex`
accidentally added to something that shouldn't need one).

## Risks & Mitigations

- **Risk**: inventing a second reduced-motion convention instead of copying
  `sk-transition-matrix.css:237`'s shape. **Mitigation**: read that file before writing either
  guard; diff your media blocks against it conceptually.
- **Risk**: `display: none` or `visibility: hidden` sneaking into the skip-link's off-screen
  technique (both remove it from the a11y tree). **Mitigation**: FR-006 is explicit — re-read it;
  use an off-canvas transform or clip technique instead.
- **Risk**: the disclosure marker relies on color alone to signal state. **Mitigation**: pair any
  color change with a shape/rotation change, and don't make either the *only* signal — text or an
  icon change should also be available.
- **Risk**: forced-colors treatment invents a location beyond skip-link focus / disclosure marker
  (e.g. adding it to the summary background) — SC-005 names exactly three locations mission-wide,
  and table borders belong to WP03. **Mitigation**: scope your forced-colors blocks to exactly the
  two affordances this WP owns.

## Review Guidance

- Confirm both CSS files pass `declaration-strict-value` with no new exceptions (or, if a system
  color keyword was genuinely required for forced-colors, that it's flagged explicitly rather than
  silently added).
- Confirm the reduced-motion guard shape matches the transition-matrix precedent.
- Confirm the skip-link never uses `display: none` or `outline: none` in any state.
- Confirm the disclosure's `open` attribute is never touched by anything but `[open]` CSS
  selectors — no JS anywhere in this WP.
- Confirm `LightMode` uses `class="sk-light"` in both story files.

## Activity Log

> **CRITICAL**: Activity log entries MUST be in chronological order (oldest first, newest last).

- 2026-09-05T18:34:59Z – system – Prompt created.
