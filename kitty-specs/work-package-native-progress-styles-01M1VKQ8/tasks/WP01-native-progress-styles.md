---
work_package_id: WP01
title: 'sk-progress: accessible completion over a native <progress>, styles-only'
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
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
- C-007
planning_base_branch: mission/work-package-native-progress-styles
merge_target_branch: mission/work-package-native-progress-styles
branch_strategy: Planning artifacts for this mission were generated on mission/work-package-native-progress-styles. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/work-package-native-progress-styles unless the human explicitly redirects the landing branch.
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
phase: Phase 1 - sk-progress styles-only component
history:
- at: '2026-09-06T15:22:48Z'
  actor: system
  action: 'Prompt authored during mission planning for #210'
agent_profile: frontend-freddy
authoritative_surface: packages/styles/src/progress/
create_intent:
- packages/styles/src/progress/sk-progress.css
- packages/styles/src/progress/sk-progress-zero.html
- packages/styles/src/progress/sk-progress-t10.html
- packages/styles/src/progress/sk-progress-complete.html
- packages/styles/src/progress/sk-progress-large-total.html
- packages/styles/src/progress/sk-progress-long-label.html
- packages/styles/src/progress/sk-progress-compact.html
- packages/styles/src/progress/sk-progress-narrow.html
- packages/styles/src/progress/sk-progress-forced-colors.html
- packages/styles/src/progress/sk-progress-html.stories.ts
- packages/styles/src/progress/index.ts
- apps/storybook/src/tests/sk-progress.spec.ts
execution_mode: code_change
model: ''
owned_files:
- packages/styles/src/progress/**
- packages/styles/src/index.ts
- packages/styles/package.json
- apps/storybook/src/tests/sk-progress.spec.ts
- apps/storybook/src/tests/visual.spec.ts
- docs/design-system/using-components.md
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP01 – sk-progress: accessible completion over a native `<progress>`, styles-only

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and
behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `claude`

If no profile is specified, run `spec-kitty agent profile list` and select the best match for
`implement` work against `packages/styles/src/` involving CSS, accessibility, and a design-system
component.

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

Wrap HTML/XML tags in backticks: `<progress>`, `<label>`, `<span>`
Use language identifiers in code blocks: ```css, ```ts, ```bash

---

## Objectives & Success Criteria

Ship `.sk-progress` as this repository's sixth **styles-only** primitive: one authored
`sk-progress.css`, eight authored `.html` fixtures, a **generated** `index.ts` barrel, a Storybook
story file, a documentation section, and a dedicated Playwright spec — because this component's
accessibility-tree/overflow/forced-colors/meta-consistency assertions are not covered by the
mission-wide axe/stylelint gates the way a purely presentational primitive's are. `spec.md`'s
Context section states the motivating gap directly: the Factory Dashboard's
`.dash-progress-group`/`.dash-progress-bar`/`.dash-progress-fill`/`.dash-progress-label` in
`apps/demo/dashboard-demo.html` (lines 100–127, 520–525) is three `div`s and a `span` with the
fraction expressed only as an inline `style="width: 67%"` and a `title` attribute — no role, no
exposed value, no label association. This WP does **not** touch that file (C-005, SC-012); it adds
the reusable, accessible replacement family that a later mission (#214/TKW6) migrates the demo to.

**Read `plan.md` and `research.md` in full before starting.** Both are already authored for this
mission and are unusually complete — `plan.md`'s "CSS strategy", "Accessibility and overflow
observables" table, and "Gate Matrix" sections, and `research.md`'s R-01 through R-09, answer nearly
every implementation question this prompt would otherwise have to restate. This prompt sequences
and scopes that material into ten subtasks; it does not repeat all of it verbatim.

Done means:

- `packages/styles/src/progress/sk-progress.css` exists, token-only (NFR-001), styling a real
  `<progress>` via `appearance: none` plus its vendor pseudo-elements, with layout modifiers,
  a forced-colors fill override, and (if a transition is authored) a scoped reduced-motion guard.
- Eight authored `.html` fixtures exist, each the exact three-part structure spec.md's Context
  section shows verbatim:
  ```html
  <div class="sk-progress">
    <label class="sk-progress__label" for="mission-progress">5 of 8 Work Packages done</label>
    <progress class="sk-progress__bar" id="mission-progress" value="5" max="8">63%</progress>
    <span class="sk-progress__meta">63%</span>
  </div>
  ```
- `packages/styles/src/progress/index.ts` is **generated** by `build-styles-only-markup.mjs` —
  never hand-written — and `packages/elements/src/progress/` does not exist.
- `packages/styles/src/index.ts` and `packages/styles/package.json` export the new component.
- `sk-progress-html.stories.ts` presents `Default`, `Zero`, `Complete`, `LargeTotal`, `LongLabel`,
  `Compact`, `Narrow`, `ForcedColors`, and the required `LightMode` (wrapped `class="sk-light"`).
- `docs/design-system/using-components.md` gains a `sk-progress` section.
- `apps/storybook/src/tests/sk-progress.spec.ts` asserts every observable in plan.md's
  "Accessibility and overflow observables" table, and `visual.spec.ts` gains a baseline set.
- The full gate matrix from `plan.md` passes, every generated artifact is committed, and
  `apps/demo/dashboard-demo.html` has no diff.

## Context & Constraints

- **Mission spec**: `kitty-specs/work-package-native-progress-styles-01M1VKQ8/spec.md` — read all
  five user stories, all fourteen FRs, all four NFRs, all seven constraints, and the Edge Cases
  section before starting. Every ID above in this WP's `requirement_refs` traces to a concrete
  subtask below.
- **Mission plan**: `kitty-specs/work-package-native-progress-styles-01M1VKQ8/plan.md` — the
  authoritative source for file layout (Project Structure), the CSS technique
  (CSS strategy), the exact verification technique per observable (Accessibility and overflow
  observables), and the full local gate command list (Gate Matrix). This WP's subtasks below map
  1:1 onto that plan's IC-01 through IC-04 concern map.
- **Mission research**: `kitty-specs/work-package-native-progress-styles-01M1VKQ8/research.md` —
  R-01 (styles-only, no element), R-04 (fallback text vs. visible `__meta` are two distinct,
  both-required strings), R-05 (forced-colors technique), R-06 (reduced-motion technique), R-07
  (layout modifiers), R-08 (no new token). Two carried-forward execution risks (not open product
  decisions): the forced-colors fill override is pattern-following, not yet measured against a
  real `<progress>`'s vendor pseudo-elements; WebKit coverage of
  `::-webkit-progress-bar`/`::-webkit-progress-value` is locally unverified in this environment.
  Both are resolved by this WP's own cross-browser gate run (T009/T010), not by inventing a new
  measurement step.
- **Data model**: `kitty-specs/work-package-native-progress-styles-01M1VKQ8/data-model.md` — the
  fixture matrix and the markup/attribute contract table are the literal spec for T001.
- **Generator**: `scripts/build-styles-only-markup.mjs` — no changes to this script. It
  auto-discovers `packages/styles/src/progress/` once the directory has a `.css` and **no**
  matching `packages/elements/src/progress/` — there is no allowlist to edit. It throws if a
  directory has a `.css` but zero `.html` files; land T001 and T003 before running it.
- **Token catalogue**: `packages/tokens/src/tokens.css` — every colour/spacing/radius/border value
  in `sk-progress.css` must be a `var(--sk-*)` reference. Confirmed by measurement (this prompt,
  not an assumption): the current `.dash-progress-*` CSS in `apps/demo/dashboard-demo.html` already
  draws its equivalent visual from `--sk-surface-input` (track), `--sk-color-yellow` (fill),
  `--sk-radius-pill`, `--sk-space-2`, `--sk-text-xs`, `--sk-fg-muted`, `--sk-font-mono` — reuse this
  same family rather than inventing anything. `--sk-border-default`/`--sk-border-strong` exist for
  the track's boundary. **No new token is authorized by this WP** (C-004) — if implementation finds
  a genuine gap, stop and report rather than adding one.
- **Sanctioned forced-colors patterns, both already live in this repo — read both files before
  writing yours**:
  - `packages/styles/src/skip-link/sk-skip-link.css:61–78` — the reduced-motion guard
    (`@media (prefers-reduced-motion: reduce) { .sk-skip-link { transition: none; } }`) and the
    forced-colors override on the **longhand** `outline-color: Highlight;` (not the `outline`
    shorthand — the file's own comment explains why the longhand is what actually gets
    `stylelint`'s `declaration-strict-value` to positively certify the value, since
    `stylelint.config.mjs`'s `ignoreValues` already lists `Highlight`/`Canvas`/`CanvasText`/etc.).
  - `packages/styles/src/data-table/sk-data-table.css:247–255` — a `@media (forced-colors: active)`
    block overriding a **background-drawn** affordance's colour, because `background`/
    `background-color` do **not** survive forced-colors (they flatten to `Canvas`) the way `border`
    does automatically. This is the closer precedent for your fill pseudo-element, which is also
    background-drawn: `plan.md`'s CSS strategy section gives the exact rule —
    `.sk-progress__bar::-webkit-progress-value, .sk-progress__bar::-moz-progress-bar { background-color: Highlight; }`
    inside `@media (forced-colors: active)`. `background-color` is a **policed** property
    (`stylelint.config.mjs`'s policed list includes it literally, and `/color/` matches it too),
    but `Highlight` is already in `ignoreValues` — **no stylelint config change is needed**.
  - `packages/styles/src/disclosure/sk-disclosure.css:76–85` — `outline`, never `box-shadow`, for a
    focus ring that must survive forced-colors (`box-shadow` computes away entirely under
    `forced-colors: active`). Not directly needed here (this component's only interactive control
    is the native `<progress>`, which is not itself focusable — a screen-reader/keyboard user
    perceives it via the associated `<label>` and page flow), but keep the rule in mind if you add
    any focus-visible styling to the root or label.
- **Track**: a plain `border` on `.sk-progress__bar` (or its `::-webkit-progress-bar`/
  `::-moz-progress-bar`) survives `forced-colors: active` automatically — **zero** author override
  needed for the track boundary, per `adding-a-component.md`'s forced-colors section and this
  repo's own two measurements. Do not add a forced-colors override for the track; only the fill
  needs one.
- **`LightMode` stories use `class="sk-light"`, never `data-theme="light"`** (C-006, CLAUDE.md §6,
  #93 — the attribute form activates nothing on a wrapper). Copy
  `packages/styles/src/check-bullet/sk-check-bullet-html.stories.ts`'s `LightMode` export shape
  (`<div class="sk-light" style="...">`), **not** `form-field`'s (recorded in
  `expected-inert-theme-wrappers.json` as a known, deliberate non-conformer — do not use it as a
  model). Verify a computed style value genuinely differs between the two themes; do not assume the
  class does something.
- **Storybook section**: `title: 'Primitives/SkProgress (HTML)'` — the existing sections are
  `Components/`, `Elements/`, `Primitives/`, `Form/`, `Navigation/`, `Tags/`, `Tokens/`; there is no
  `Dashboard/` section and inventing one is unnecessary new taxonomy. `a11y: { disable: false }` at
  the meta level.
- **No custom element, no shadow root, no `::part()`, no ratchet entry** (C-001). Do not create
  `packages/elements/src/progress/` or touch `expected-parts.json`, `expected-docs.json`,
  `behaviours.json`, or `mutations.json` for this component.
- **No arithmetic, no JavaScript, no state, no timer** (C-002). Every `value`/`max`/label/meta text
  in every fixture is a literal you author by hand — never derived by a CSS `content`/`counter()`
  expression or a script.
- **No indeterminate state, stepper, task data, completion animation, or status-tone colouring**
  (C-003) — all explicitly out of scope.
- **`apps/demo/dashboard-demo.html` is not touched by this WP** (C-005, SC-012) — confirmed by a
  final `git diff --exit-code` check in T009.
- **This mission is independent of every other `#208` child** (C-007) — no composition target, no
  cross-component dependency to check for.

## Branch Strategy

- **Strategy**: single_branch — this mission's target branch IS
  `mission/work-package-native-progress-styles`; there is no separate mission-lane branch.
- **Planning base branch**: `mission/work-package-native-progress-styles`
- **Merge target branch**: `mission/work-package-native-progress-styles`
- The mission branch is later opened as a PR into `train/elements-first` per
  `docs/architecture/elements-first-run-prompt.md` §5–7 (claim, drive, PR, adversarial gate, merge
  into the train) — that sequence runs after this WP is done and is not this WP's own action to
  take.

> These fields are populated automatically by `spec-kitty agent mission tasks`.
> Do NOT change them manually unless you are certain the branch topology has changed.

## Subtasks & Detailed Guidance

### Subtask T001 – Author the eight fixture `.html` files

- **Purpose**: Real, authored markup for every required determinate state and layout modifier —
  the sole source the generator turns into the barrel's string exports, and the sole source every
  later subtask (CSS, story, test) renders against.
- **Steps**:
  1. `sk-progress-zero.html` — `value="0"`, any `max` (`data-model.md`'s fixture matrix suggests a
     small round number). Track visible, fill visually absent.
  2. `sk-progress-t10.html` — `value="5" max="8"`, label text `"5 of 8 Work Packages done"`, meta
     text `"63%"`, fallback text `"63%"` between the `<progress>` tags — spec.md's own worked
     example, verbatim.
  3. `sk-progress-complete.html` — `value` equal to `max` (any real numbers, e.g. `value="8"
     max="8"`), fill visually reaches full width.
  4. `sk-progress-large-total.html` — large `value`/`max` numerals (e.g. thousands) in both the
     label and meta text, proving the layout does not break with wide numeral text.
  5. `sk-progress-long-label.html` — a label string long enough to exercise wrapping/truncation at
     normal and narrow widths (T008 asserts no horizontal overflow against this fixture).
  6. `sk-progress-compact.html` — the T10 content with `sk-progress--compact` added to the root
     `div`'s class list.
  7. `sk-progress-narrow.html` — the T10 content with `sk-progress--narrow` added.
  8. `sk-progress-forced-colors.html` — a determinate, non-zero, non-complete value (T10's content
     is fine to reuse verbatim in a new file, or author a distinct one) for the `ForcedColors`
     story. **plan.md's "Markup and generation flow" step 5 offers an alternative**: if the T10
     fixture already reads clearly under forced-colors emulation, drop this ninth file and render
     the T10 export in the `ForcedColors` story instead — either way, nine required states
     (zero/T10/complete/large-total/long-label/compact/narrow/forced-colors/LightMode) must be
     demonstrated per SC-002; this is an implementation-time economy, not a scope reduction. Record
     which choice you made in the Activity Log.
  9. Every fixture is the exact structure from data-model.md:
     `div.sk-progress[--modifier] > label.sk-progress__label[for] + progress.sk-progress__bar[id][value][max] + span.sk-progress__meta`
     — same three children, same order, in every fixture including the two modifier variants (only
     the root's class list differs for those two).
  10. Every fixture needs a leading HTML comment header the generator strips (its lazy, joined-text
      regex matches a **leading** comment block only — not trailing, not per-line) — e.g.
      `<!-- @spec-kitty/styles — sk-progress (zero) -->`.
  11. `id` values must be unique per fixture (multiple fixtures render on one Storybook page) — use
      a descriptive id per state (e.g. `progress-zero`, `mission-progress` for T10 per spec.md's
      own worked example, `progress-large-total`, etc.), not a fixed literal repeated across files.
  12. Zero `aria-*` attributes and zero `role` attribute anywhere in any fixture (FR-003, SC-003) —
      the `for`/`id` pair is the sole association mechanism.
- **Files**: eight new `.html` files under `packages/styles/src/progress/` (nine if you keep the
  dedicated forced-colors fixture; see step 8).
- **Parallel?**: No dependents can start meaningfully before this lands — T003 needs these to
  render against while authoring CSS.
- **Notes**: filenames become export names via the generator's kebab-case → PascalCase + `HTML`
  rule (`sk-progress-large-total.html` → `SkProgressLargeTotalHTML`). Avoid any filename segment
  that would produce an invalid JS identifier.

### Subtask T002 – Generate the barrel and wire the package

- **Purpose**: Produce the generated barrel from T001's fixtures and make the new directory
  reachable from the package's public surface — FR-012/FR-013/SC-001/SC-008/SC-010.
- **Steps**:
  1. Run `node scripts/build-styles-only-markup.mjs`. Confirm it picks up `progress/` with **no**
     code change to the script itself — its directory-shape auto-discovery (a `.css` file, no
     matching `packages/elements/src/progress/`) is what makes this component eligible.
     (`sk-progress.css` from T003 must exist by the time you run this — if you do T002 before T003,
     the generator throws on a `.css`-less directory; sequence T003 first if that happens, or land
     a placeholder-free real `sk-progress.css` before running the generator.)
  2. Add `export * from './progress/index';` to `packages/styles/src/index.ts`, in alphabetical
     position (between `pill-tag` and `ribbon-card`, per `plan.md`'s "Markup and generation flow"
     step 4).
  3. Add `"./progress/*": "./dist/progress/*"` to `packages/styles/package.json`'s `exports` map,
     in alphabetical position (between `./pill-tag/*` and `./ribbon-card/*`).
  4. Confirm `git ls-files packages/elements/src` shows no `progress` directory (SC-001) and that
     no ratchet file (`expected-parts.json`, `expected-docs.json`, `behaviours.json`,
     `mutations.json`) is touched (SC-010).
  5. Run `node scripts/build-styles-only-markup.mjs --check` — must report the barrel current.
- **Files**: `packages/styles/src/progress/index.ts` (generated), `packages/styles/src/index.ts`
  (edit), `packages/styles/package.json` (edit).
- **Parallel?**: No — depends on T001 (and T003 for the `.css` file to exist before generation).

### Subtask T003 – Author `sk-progress.css` base rules

- **Purpose**: Style the native `<progress>` element via its only standardised styling surface —
  the `appearance: none` reset plus its three vendor pseudo-elements — with a track and fill drawn
  from existing tokens.
- **Steps**:
  1. Create `packages/styles/src/progress/sk-progress.css` with a header comment matching the
     repo's convention (e.g. `/* @spec-kitty/styles — sk-progress shared styles */`), and a
     one-line note that this component has no shadow root (no `:host` rule applies) and that its
     forced-colors/token exceptions are documented at `docs/contributing/adding-a-component.md`'s
     "Forced-colors and reduced-motion baselines" section, per the same convention
     `sk-data-table.css:1–5` already uses.
  2. `.sk-progress` — the root `div`, a plain layout container (flex column by default, matching
     the base/default arrangement — see T004 for the two modifiers).
  3. `.sk-progress__label` — typography from `--sk-fg-default`/`--sk-fg-muted` and `--sk-text-*`
     tokens; consumer-owned text, no truncation by default (nothing here forbids wrapping — this is
     what keeps the long-label fixture from overflowing, verified in T008).
  4. `.sk-progress__bar` — `appearance: none;` (required before any pseudo-element paints a custom
     fill), a track drawn with `border` (from `--sk-border-default`/`--sk-border-strong`) and
     `background: var(--sk-surface-input)`, `border-radius: var(--sk-radius-pill)` (matching the
     existing `.dash-progress-bar` visual this component replaces), and an explicit `width`/`height`
     appropriate to a thin bar (the existing dashboard implementation uses `120px` × `4px` — reuse
     that scale or a token-driven equivalent, but do not hardcode a non-token colour).
  5. Fill pseudo-elements: `.sk-progress__bar::-webkit-progress-bar` (Blink/WebKit track — set to
     `background: transparent;` or match the track styling set on the host, since Chromium paints
     its own track pseudo-element over the reset host by default) and
     `.sk-progress__bar::-webkit-progress-value` / `.sk-progress__bar::-moz-progress-bar`
     (the fill itself) — `background-color: var(--sk-color-yellow);` (matching the existing
     `.dash-progress-fill` token) and `border-radius: var(--sk-radius-pill);`.
  6. `.sk-progress__meta` — `--sk-fg-muted`, `--sk-text-xs`, `--sk-font-mono` (matching the existing
     `.dash-progress-label` treatment this component replaces).
  7. Token-only throughout — no raw hex/rgba/px-literal color, spacing, or radius value.
- **Files**: `packages/styles/src/progress/sk-progress.css` (new).
- **Parallel?**: No — depends on T001 (fixtures to render against while authoring; also the
  generator in T002 needs this file to exist before it produces a non-empty barrel).

### Subtask T004 – Extend `sk-progress.css`: layout modifiers, forced-colors, reduced-motion

- **Purpose**: The two CSS-only layout arrangements (FR-007), the forced-colors fill override
  (FR-009), hue-independence (FR-008), and the conditional reduced-motion guard (FR-010) — all in
  the same file T003 started.
- **Steps**:
  1. `.sk-progress--compact` — an inline/flex-row arrangement of the same three children
     (`label`/`progress`/`span`), no markup change (R-07). Do not assume a fixed numeral width —
     the large-total fixture must not visually break this modifier (verified in T009/T010's visual
     baseline).
  2. `.sk-progress--narrow` — a stacked arrangement for narrow viewports, same three children, same
     order.
  3. `@media (forced-colors: active) { .sk-progress__bar::-webkit-progress-value,
     .sk-progress__bar::-moz-progress-bar { background-color: Highlight; } }` — the sanctioned
     pattern from Context above. The track's plain `border` needs **no** override (it survives
     automatically); do not add one.
  4. **Hue-independence (FR-008)**: the track's `border` already gives a shape/boundary cue
     independent of the fill's colour. If, once rendered, this reads as insufficient, the
     already-required `sk-progress__meta` text is the second, non-colour channel — do not invent a
     new visual affordance beyond what the markup contract already carries (research.md's own
     conclusion on this point).
  5. **Reduced motion, conditional**: only if you author a `width`/`transform`/similar transition on
     the fill pseudo-element (for the out-of-mission-fixtures case of a consumer mutating `value`
     live), add `@media (prefers-reduced-motion: reduce)` scoped to **that exact selector and
     property** — copy the shape at `sk-skip-link.css:61–65`, never a wildcard. **If you author no
     transition at all, add no reduced-motion block** — `adding-a-component.md`'s own warning
     against `sk-transition-matrix.css:237`'s dead `scroll-behavior` guard (which disables a
     property nothing sets) is exactly the shape to avoid; FR-010/AC-2 explicitly allows "satisfied
     vacuously." Record which branch you took in the Activity Log — T008 asserts whichever is true.
  6. Confirm zero new stylelint exceptions: `background-color: Highlight` needs none (`Highlight`
     is already in `stylelint.config.mjs`'s `ignoreValues`); do not add a new `ignoreValues` entry.
- **Files**: `packages/styles/src/progress/sk-progress.css` (edit, continuing T003).
- **Parallel?**: No — same file as T003, additive rules.

### Subtask T005 – Author `sk-progress-html.stories.ts`

- **Purpose**: The Storybook demonstration of every required state, driven entirely from the
  generated barrel — no hand-written markup in the story.
- **Steps**:
  1. Import `./sk-progress.css` for side effects and the generated named exports from `./index`.
  2. `meta`: `title: 'Primitives/SkProgress (HTML)'`, `tags: ['autodocs']`,
     `parameters: { a11y: { disable: false } }`.
  3. Stories: `Default` (renders `SkProgressT10HTML`), `Zero`, `Complete`, `LargeTotal`,
     `LongLabel`, `Compact`, `Narrow`, `ForcedColors` (per T001 step 8's choice), and `LightMode`
     (T10 content wrapped `<div class="sk-light" style="...">`, matching `check-bullet`'s shape —
     see Context above).
  4. Verify `LightMode` actually renders different computed styling from the default story — check
     a computed value (e.g. the fill's `background-color`) under both, don't assume the class does
     something.
- **Files**: `packages/styles/src/progress/sk-progress-html.stories.ts` (new).
- **Parallel?**: No — depends on T002 (generated barrel) and T004 (finished CSS).

### Subtask T006 – Document `sk-progress` in `using-components.md`

- **Purpose**: FR-014 — a consumer-facing description of the native structure, what the consumer
  owns, and the supported state/modifier set, without restating ADR-10's reasoning.
- **Steps**:
  1. Add a `sk-progress` section to `docs/design-system/using-components.md`, matching the existing
     per-component section shape (e.g. `sk-data-table`'s, `sk-disclosure`'s).
  2. State the exact three-part native structure, quoting the markup contract from `data-model.md`.
  3. State plainly that the consumer supplies `value`, `max`, label text, and visible metadata text,
     and performs all arithmetic — the library performs none.
  4. List the full supported set: five determinate states (zero, T10 example, complete, large
     total, long label) and the two layout modifiers (`sk-progress--compact`,
     `sk-progress--narrow`), noting explicitly that markup shape is invariant across modifiers —
     only CSS layout differs.
  5. Add a pointer (not a restatement) to
     `docs/architecture/decisions/2026-09-02-10-distribution-and-canonical-markup.md`'s styles-only
     class ruling, so a reader understands why no element exists for this component.
  6. State the invalid-data non-goal: negative/over-max values are consumer validation, not a
     library concern.
- **Files**: `docs/design-system/using-components.md` (edit).
- **Parallel?**: Can start once T004's CSS contract is stable; does not block or depend on T005/T007/T008.

### Subtask T007 – `sk-progress.spec.ts` part 1: accessibility tree, markup contract, modifier shape, meta/value consistency

- **Purpose**: The assertions no axe/stylelint gate makes on its own — this component's own new
  behaviour surface, run first per the charter's test-pyramid-progression tactic.
- **Steps**:
  1. Build Storybook first (`npx nx run storybook:storybook:build`) so the spec has a real static
     build to load against.
  2. Navigate to each story via its iframe URL (`/iframe.html?id=<storyId>&viewMode=story` — derive
     the real story id from `storybook-static/index.json` after the build rather than guessing the
     `toId()` transform of the title).
  3. **Accessibility tree (FR-003, FR-004; SC-003)**: for the T10 (`Default`) story, assert the
     rendered `<progress>` element's accessible role, name, and value/min/max match
     `label`'s text and the `progress` element's own `value`/`max` attributes (`5`/`0`/`8`). Use
     `page.accessibility.snapshot()` scoped to the `.sk-progress` host, or `axe-playwright`'s
     accessible-tree query if this repo's version exposes one — check existing specs
     (`sk-transition-matrix.spec.ts`'s `axeIsClean` helper is a reasonable pattern to adapt for the
     "clean" half; the role/name/value assertion itself needs the accessibility-snapshot API, which
     that helper does not use).
  4. **Zero `aria-*` (FR-003; SC-003)**: for every fixture, grep the rendered HTML (or the source
     `.html` file directly via `readFileSync`) for `aria-` and assert zero matches, and for `role=`
     and assert zero matches (the `for`/`id` pair is the sole association mechanism).
  5. **No CSS-generated arithmetic (FR-002; C-002)**: a static-source assertion —
     `readFileSync('packages/styles/src/progress/sk-progress.css', 'utf8')` must not match a
     `content` declaration referencing `value`/`max`/`counter(`. Mirror
     `sk-transition-matrix.spec.ts:495`'s pattern of asserting a *negative* CSS property from
     source text.
  6. **Layout-modifier structural preservation (FR-007; AC US3)**: for the `Compact` and `Narrow`
     stories, assert the host's direct children are exactly `[label, progress, span]` in that
     order, with identical `for`/`id`/`value`/`max` attributes to the unmodified `Default` (T10)
     fixture — only computed layout (e.g. `flex-direction`) may differ.
  7. **Meta/value consistency across every maintained fixture (NFR-004; SC-007)**: iterate every
     exported fixture constant from the generated barrel, parse each fixture's `progress[value]`/
     `progress[max]` and its `.sk-progress__meta` text, and assert they encode the same underlying
     numerator/denominator or percentage (e.g. "5 of 8" / "63%" both derive from `5`/`8`). This is a
     **test-authored** consistency check across the fixture set (research.md R-02/R-04) — it does
     not imply any runtime guarantee the component itself enforces.
- **Files**: `apps/storybook/src/tests/sk-progress.spec.ts` (new).
- **Parallel?**: No — depends on T005 (a built Storybook with every story to test against).

### Subtask T008 – `sk-progress.spec.ts` part 2: overflow, forced-colors, reduced-motion; visual baseline

- **Purpose**: The zoom/narrow-viewport, forced-colors, and reduced-motion observables plan.md
  names, plus registering this component's visual-regression baseline.
- **Steps**:
  1. **No horizontal overflow (NFR-003; SC-005)**: for the `LongLabel` and `LargeTotal` stories, set
     a narrow viewport (`page.setViewportSize` **before** `goto`, matching
     `sk-page-header-sticky.spec.ts`'s established pattern of sizing before layout rather than
     resizing after), then assert `document.documentElement.scrollWidth ===
     document.documentElement.clientWidth` — the exact equality
     `sk-team-overview-shell-layout.spec.ts` (around lines 127–155) already establishes as this
     repo's convention for "no horizontal overflow," rather than inventing a CSS-zoom probe this
     codebase has never used (confirmed: no `zoom`-emulation precedent exists anywhere in
     `apps/storybook/src/tests/` or `packages/styles/src/`). A narrow viewport is the accepted
     stand-in for "high zoom" here — both are reflow conditions for this layout.
  2. **Forced-colors legibility (FR-009; SC-006)**: `page.emulateMedia({ forcedColors: 'active' })`
     over the `ForcedColors` story, then assert the track's computed border colour and the fill
     pseudo-element's resolved paint each differ from the page background and from each other
     (sample computed colours the way `sk-transition-matrix.spec.ts` samples them elsewhere in this
     repo — `getComputedStyle`/`borderColor`/`backgroundColor` reads). This is a fast local
     approximation; the **CI-authoritative** visual baseline (step 4 below) is what actually settles
     this, since local font/rendering metrics differ from CI.
  3. **Reduced-motion static assertion (FR-010)**: read `sk-progress.css`'s source text. If a
     `@media (prefers-reduced-motion: reduce)` block exists, assert it is scoped to exactly the
     transitioning selector/property T004 authored — no wildcard, no unrelated selector affected.
     If T004 authored no transition at all, assert this vacuously (e.g. assert the source contains
     no `transition:` declaration on the fill selector, and skip the reduced-motion-block
     assertion) — do not fail the test for a guard that correctly does not exist.
  4. **Visual baseline**: add the `sk-progress` baseline set to
     `apps/storybook/src/tests/visual.spec.ts` — default (dark), `LightMode`, and `ForcedColors`
     presentations, matching the existing per-component baseline pattern (see
     `sk-transition-matrix`'s six snapshot files under `visual.spec.ts-snapshots/` for the naming
     convention). Do not attempt to hand-craft the `.png` baseline yourself — running
     `PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts
     --update-snapshots` locally produces a first-pass baseline, but the baseline that matters is
     CI's (see T010) — local font metrics differ.
- **Files**: `apps/storybook/src/tests/sk-progress.spec.ts` (edit, continuing T007),
  `apps/storybook/src/tests/visual.spec.ts` (edit) plus its snapshots directory.
- **Parallel?**: No — depends on T005; same spec file as T007, additive test cases.

### Subtask T009 – Run the full regeneration + gate matrix; confirm clean tree and demo-page isolation

- **Purpose**: `plan.md`'s Gate Matrix, run in full, as this WP's own evidence before requesting the
  pre-merge adversarial gate.
- **Steps**: run each of the following, in order, fixing any failure before proceeding:
  1. `node scripts/build-styles-only-markup.mjs` then `node scripts/build-styles-only-markup.mjs --check`.
  2. `node scripts/typecheck-all.mjs`.
  3. `npm run quality:all` (ESLint, Stylelint, HTMLHint).
  4. `node scripts/check-story-theme-wrapper.mjs` then `--selftest` — confirm no new inert
     `data-theme="light"` wrapper (C-006); `LightMode` uses `class="sk-light"`.
  5. `node scripts/check-release-graph.mjs` — confirms the `package.json` subpath-export
     requirement from T002.
  6. `npx nx run storybook:storybook:build` then `node scripts/run-axe-storybook.js` — zero
     violations across every story this WP adds, in both default and `LightMode` (NFR-002/SC-004).
  7. `npx playwright test apps/storybook/src/tests/sk-progress.spec.ts` (focused spec from
     T007/T008) — run first among the Playwright gates per the charter's test-pyramid-progression
     tactic, then `npx playwright test` (full cross-browser suite, all three configured engines) to
     confirm nothing else regressed and to surface research.md's WebKit coverage risk if it exists.
  8. `PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts`.
  9. `node scripts/check-gate-wiring.mjs`.
  10. `bash scripts/npm-audit-gate.sh`, `npm run security:lockfile-check`,
      `bash scripts/check-action-pins.sh` — incidental (no dependency/workflow change), run as
      standing gates.
  11. `git add -A && git status --porcelain` — must be empty. Confirms T002's generated `index.ts`,
      the `packages/styles/src/index.ts` edit, and the `package.json` export-map edit are all
      committed.
  12. `git diff --exit-code -- apps/demo/dashboard-demo.html` — must be empty (C-005; SC-012).
  13. Confirm no ratchet file changed: `git diff --exit-code -- expected-parts.json
      expected-docs.json behaviours.json mutations.json` — must be empty (SC-010).
  14. Confirm no new token: `git diff --exit-code -- packages/tokens/src/tokens.css` — must be
      empty absent a recorded, sign-off-backed exception (SC-011; C-004).
- **Files**: N/A (verification only, plus whatever fixes step failures require).
- **Parallel?**: No — depends on T001–T008 (everything must exist to regenerate/verify against).

### Subtask T010 – Final rebase, regenerate, rerun before the pre-merge adversarial gate

- **Purpose**: `plan.md`'s "Rebase / regenerate / rerun requirements before final review" section,
  run as the last action before this WP is handed to the pre-merge squad — a stale gate run is not
  evidence.
- **Steps**:
  1. Rebase onto the current tip of `mission/work-package-native-progress-styles` (and, once this
     mission is opened as a PR into `train/elements-first`, onto that branch's current head) — a
     stale base can silently reintroduce a generated-artifact conflict in
     `packages/styles/src/index.ts` or `package.json`'s `exports` map if a concurrent mission added
     an adjacent entry.
  2. Regenerate in dependency order after the rebase: `build-styles-only-markup.mjs` (no flag),
     then its own `--check`, before re-running typecheck/lint/story-theme gates. Never hand-patch a
     generated file to resolve a rebase conflict.
  3. Rerun the full gate matrix (T009) against the new head — not only the gates touching files the
     rebase changed. `npm run quality:all` plus the clean-tree check are the cheapest way to confirm
     nothing else drifted.
  4. Reconcile the CI-authoritative visual baseline: if T008's local capture and CI's first run
     disagree, take the baseline from CI's `visual-regression-diffs` artifact, never from a local
     screenshot.
  5. Re-confirm `apps/demo/dashboard-demo.html` has no diff (T009 step 12, repeated against the new
     head) as the final check before this WP is considered done.
  6. **Do not request or run the pre-merge adversarial gate yourself from this WP** — that is the
     mission's own next step, per `docs/architecture/elements-first-run-prompt.md` §6, once this WP
     reports done. This subtask's job is to leave the branch in a state where that gate's evidence,
     once run, is trustworthy against the real head SHA.
- **Files**: N/A (verification/regeneration only).
- **Parallel?**: No — the final subtask; depends on everything before it.

## Test Strategy

This WP's own verification **is** its Playwright spec (T007/T008) plus the standing repo-wide
gates (axe, stylelint, htmlhint, visual regression) that every Storybook story already receives
unconditionally. There is no Vitest/`fixtures/elements-behaviour/` test to add: that fixture's
mutation contract (`mutations.json`) is scoped to `behaviours.json` subjects, and this component
registers none — ADR-11's required-behaviours list does not apply to a component that owns no
element, no property, no event, and no focus/keyboard handling beyond the browser's own native
`<progress>`/`<label>` semantics.

## Risks & Mitigations

- **Risk**: the forced-colors fill override is authored on the wrong property (e.g. the `-color`
  longhand is skipped in favour of a shorthand that `stylelint` cannot police, or the override
  targets `background` instead of `background-color`/the vendor pseudo-elements specifically).
  **Mitigation**: copy the exact selector/property from `plan.md`'s CSS strategy section and
  `sk-data-table.css:247–255`'s pattern; verify `Highlight` is already in `stylelint.config.mjs`'s
  `ignoreValues` before assuming you need a config change (you don't).
- **Risk**: a reduced-motion guard is authored in the dead `sk-transition-matrix.css:237` shape — a
  block that looks real but disables a property nothing sets. **Mitigation**: T004 makes this
  conditional on actually authoring a transition; if you do, scope the guard to that exact
  selector/property only, copying `sk-skip-link.css:61–65`'s shape.
  **Confirmed genuinely conditional, not a trap to fall into either way**: FR-010/AC-2 explicitly
  allows "satisfied vacuously" if no transition exists.
- **Risk**: `LightMode` copies `form-field`'s inert wrapper shape (no `class="sk-light"` at all).
  **Mitigation**: copy `check-bullet`'s `LightMode` story shape exactly (see Context above); verify
  a computed value differs between themes, don't assume it.
- **Risk**: a fixture's visible `sk-progress__meta` text silently drifts from its own
  `progress[value]`/`progress[max]` pair (the Edge Cases section names this explicitly).
  **Mitigation**: T007's meta/value consistency check iterates every maintained fixture and would
  fail on this — author each fixture's numbers and text together, and let the test confirm it.
- **Risk**: cross-browser WebKit coverage of `::-webkit-progress-bar`/`::-webkit-progress-value`
  regresses silently because it was authored and eyeballed only in Chromium.
  **Mitigation**: T009/T010's full Playwright suite runs all three configured engines
  (`playwright.config.ts`) — this is the mechanism that surfaces the gap, not a manual check.
- **Risk**: a new `--sk-*` token is added under implementation pressure because the exact existing
  accent tint "doesn't look quite right." **Mitigation**: C-004 forbids it absent a demonstrated
  gap and the charter's required maintainer sign-off; stop and report rather than deciding this
  unilaterally. `research.md` R-08 already confirms the existing tokens are sufficient.
- **Risk**: `apps/demo/dashboard-demo.html` gets touched incidentally (e.g. "just fixing an
  adjacent typo while I'm in the file"). **Mitigation**: this file is entirely out of this WP's
  scope (C-005) — T009/T010 both assert `git diff --exit-code` against it as a hard gate.

## Review Guidance

- Confirm `sk-progress.css` passes `declaration-strict-value` with zero new stylelint exceptions,
  and that the forced-colors override uses `background-color: Highlight` on the vendor
  pseudo-elements specifically, not the track.
- Confirm every fixture has zero `aria-*`/`role` attributes, and that the three-part structure
  (`label[for]` + `progress[id][value][max]` + `span`) is identical across every fixture including
  the two modifier variants.
- Confirm `index.ts` is byte-identical to what `build-styles-only-markup.mjs --check` expects.
- Confirm `LightMode` uses `class="sk-light"` and genuinely renders different computed styling from
  the default story.
- Confirm the reduced-motion guard, if present, is scoped to exactly one selector/property — or
  confirm none exists if no transition was authored, and that this is treated as satisfying
  FR-010 rather than a gap.
- Confirm `sk-progress.spec.ts` actually asserts the accessibility tree's role/name/value/min/max
  (not just "renders without error") and that the meta/value consistency check iterates every
  fixture, not just the T10 example.
- Confirm `git diff --exit-code -- apps/demo/dashboard-demo.html` is genuinely empty, and that no
  ratchet file (`expected-parts.json`, `expected-docs.json`, `behaviours.json`, `mutations.json`)
  or `packages/tokens/src/tokens.css` changed.
- Ask for the actual axe/stylelint/htmlhint/release-graph/Playwright output rather than accepting
  "all gates pass" as a claim.

## Activity Log

> **CRITICAL**: Activity log entries MUST be in chronological order (oldest first, newest last).

- 2026-09-06T15:22:48Z – system – Prompt created.
