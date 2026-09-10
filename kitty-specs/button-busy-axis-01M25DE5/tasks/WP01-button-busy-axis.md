---
work_package_id: WP01
title: .sk-button busy axis — supplied activity state without owning the request
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
- C-009
- C-010
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
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- NFR-006
planning_base_branch: mission/button-busy-axis
merge_target_branch: mission/button-busy-axis
branch_strategy: Planning artifacts for this mission were generated on mission/button-busy-axis. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/button-busy-axis unless the human explicitly redirects the landing branch.
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
phase: Phase 1 - .sk-button busy axis
history: []
authoritative_surface: packages/elements/src/button/
create_intent:
- apps/storybook/src/tests/sk-button.spec.ts
execution_mode: code_change
agent_profile: frontend-freddy
agent: claude
model: ''
owned_files:
- packages/elements/src/button/**
- packages/styles/src/button/sk-button.css
- fixtures/elements-behaviour/src/sk-button.test.ts
- apps/storybook/src/tests/sk-button.spec.ts
- expected-parts.json
- expected-docs.json
- expected-stories.json
- packages/elements/custom-elements.json
- packages/react/src/button/**
- packages/elements/vue.d.ts
- packages/elements/SIZES.md
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP01 – `.sk-button` busy axis

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and
behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `frontend-freddy` (or the closest available match — see below)
- **Role**: `implementer`
- **Agent/tool**: `claude`

If no profile is specified, run `spec-kitty agent profile list` and select the best match for
`implement` work against `packages/elements/src/button/` and `packages/styles/src/button/`
involving Lit shadow-DOM elements, CSS animation, accessibility, and a static/shadow dual
consumption path.

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

Wrap HTML/XML tags in backticks: `<button>`, `<a>`, `<span>`, `::after`
Use language identifiers in code blocks: ```css, ```ts, ```bash

---

## Objectives & Success Criteria

Add a `busy` axis to the existing shadow-DOM `sk-button` element and its
`packages/styles/src/button/sk-button.css` sheet: a reflected `busy` boolean property, a
`.sk-button--busy` root-class modifier working for every tone and size (including `--sm` and
`--icon`), and a decorative, non-flow-participating activity cue that reserves its own space with
zero measured layout shift. `spec.md`'s Context section states the motivating gap: Family 4's T2
(`.saving-spinner`) and T4 (`.sending-spinner`) each hand-rolled the same busy button from scratch,
re-deriving the disabled treatment, the spinner geometry, the label swap, the reduced-motion
fallback, and the status messaging — without the layout-stability guarantee this mission now makes
a tested requirement.

**Read `plan.md` and `research.md` in full before starting.** Both are already authored for this
mission. `plan.md`'s "Cue design," "CSS strategy," "Token inventory," "Disabling-mechanism
independence," "Static form," "Accessibility," and "Test-file strategy" sections, and
`research.md`'s R-00 through R-07, answer nearly every implementation question this prompt would
otherwise restate. This prompt sequences and scopes that material into nine subtasks.

**Read `spec.md`'s "Cross-Mission Decision: TKT5/TKT6 Activity Cue" section before starting.** It is
binding on this WP: two independently-authored activity cues, no shared primitive with
`sk-progress`/#306. Nothing in this WP reuses `sk-progress__bar`, any `<progress>`-based element, or
any DOM primitive shared with the progress family, and nothing you author here is designed to be a
general-purpose spinner usable by other components.

Done means:

- `packages/styles/src/button/sk-button.css` gains `.sk-button--busy`, a cue rule set correct for
  every tone (`primary`/`secondary`/`ghost`/unstyled base) and size (default/`--sm`/`--icon`), a
  token-driven `@keyframes` animation, a reduced-motion override that stops the animation while
  leaving a frame visibly distinguishable from idle, and a forced-colors treatment that keeps the
  cue distinguishable from the button and page.
- `packages/elements/src/button/sk-button.ts` gains a reflected `busy` Boolean property and an
  unconditionally-rendered, `aria-hidden="true"`, text-free `<span part="busy-cue">` cue node whose
  CSS-driven visibility/animation alone changes between idle and busy — its DOM presence is not
  itself a variable in the layout-shift measurement.
- `packages/elements/src/button/sk-button.markup.ts` gains a `busy` option threaded through
  `ButtonStaticOptions`, `buttonClasses`, `buttonStaticHtml`, and a new `Busy` `BUTTON_AXES` entry —
  the static path shares the class name and stylesheet, but renders no cue markup of its own (this
  is documented explicitly, not left implicit).
- `packages/elements/src/button/sk-button.stories.ts` gains busy stories per tone, `BusySmall`,
  `BusyIcon`, `BusyDisabled`, `BusyAriaDisabled`, and the required `LightMode` story is extended to
  include a busy fixture.
- `expected-parts.json` (`busy-cue` added, `total` bumped), `expected-docs.json` (`sk-button`
  attributes 5→6, `total` bumped), and `expected-stories.json` (new story ids, `total` bumped) are
  updated in the same PR as the tests that exercise the new surface.
- `fixtures/elements-behaviour/src/sk-button.test.ts` is extended in place with the geometry,
  disabling-mechanism, accessible-name, reduced-motion/forced-colors, static-module, and part-target
  assertions described below.
- `apps/storybook/src/tests/sk-button.spec.ts` is a new file covering narrow-width/200%-zoom
  containment and RTL/logical-layout rendering.
- Every generated artifact (`sk-button.css.js`/`.css.d.ts`, `custom-elements.json`,
  `packages/react/src/button/**`, `packages/elements/vue.d.ts`, `packages/elements/SIZES.md`) is
  regenerated from a real build and committed, with `--check` clean and `git status --porcelain`
  empty.
- The full gate matrix from `plan.md` passes locally (chromium+firefox) and, on CI, the `playwright`
  job is green across all three engines and the chromium `visual-regression` baseline is accepted.
- Every existing `sk-button` story, fixture, and test outcome is unchanged — verified by an explicit
  before/after comparison, not merely "the suite is green" (the #308 closed-dialog lesson: a
  two-state feature's untouched state must be re-verified, not assumed safe because the new-state
  tests pass).

## Context & Constraints

- **Mission spec**: `kitty-specs/button-busy-axis-01M25DE5/spec.md` — read all four user stories,
  all eighteen FRs, all six NFRs, all ten constraints, the Edge Cases section, the Decision section
  (no component-scoped #286 test), and the Cross-Mission Decision reference before starting.
- **Mission plan**: `kitty-specs/button-busy-axis-01M25DE5/plan.md` — the authoritative source for
  file layout, the cue-design decision (a real DOM node, not a pure-CSS pseudo-element — read "Cue
  design — DOM node vs. pure CSS" in full before choosing an implementation shape of your own), the
  CSS technique, the token inventory, the disabling-mechanism-independence argument, the static-form
  boundary, and the full gate command list. This WP's subtasks map onto that plan's IC-01 through
  IC-05 concern map.
- **Mission research**: `kitty-specs/button-busy-axis-01M25DE5/research.md` — R-00 (the cross-mission
  cue ruling — read even though it names no subtask of your own), R-01 (ADR-15 independence,
  measured), R-02 (why no component-scoped #286 test — read before you are tempted to add one "to
  be safe"), R-03 (disabling-mechanism independence, verified two ways), R-04 (the cue-geometry
  technique's carried-forward measurement risk — the exact inset/size values are yours to measure,
  not assume), R-05 (token sourcing, confirmed against the real catalogue), R-06 (ADR-11
  applicability, confirmed — `behaviours.json` needs no new subject entry), R-07 (why the
  layout-shift test measures three points, per the #308 closed-dialog lesson).
- **The component you are extending, not replacing**: `packages/styles/src/button/sk-button.css`,
  `packages/elements/src/button/sk-button.ts`, `sk-button.markup.ts`, and `sk-button.stories.ts` all
  already exist from #79. Read all four in full before editing any of them. Every existing tone,
  size, disabled, and static-form behaviour must survive this WP unchanged in outcome.
- **The cue is a real DOM node** (plan.md's "Cue design" decision), not a pure CSS `::after`. It is
  declared with `@csspart busy-cue` in `sk-button.ts`'s JSDoc (the manifest analyzer needs the
  `@csspart` line, or `check-manifest-content.mjs`/the part ratchet cannot see it). It is rendered
  **unconditionally** whenever the element renders (not `busy ? html\`<span>...\`: ''`), with
  `visibility`/`opacity`/`animation` alone keyed off `.sk-button--busy`/`:host([busy])` in CSS — its
  DOM presence must never itself change between idle and busy, or the layout-shift measurement in
  T006 would be testing the wrong thing.
- **The cue is `position: absolute`, confined to the button's existing padding box.** This is the
  mechanism that makes zero layout shift true by construction: an absolutely-positioned element does
  not participate in flex-row sizing, so its mere presence or absence under `.sk-button--busy`
  cannot change `.sk-button`'s own `getBoundingClientRect()` box. Do not reserve space by adding
  padding, margin, or a flex-basis change keyed on `busy` — that would reintroduce the exact
  mechanism T006 exists to catch failing.
- **`--icon`'s sizing needs its own measurement, not an assumed transfer from the default size.**
  `.sk-button--icon` is already a fixed `width`/`height` square with `padding: 0`. The cue's
  inset/size at this variant is very likely a different value than the default/`--sm` inset — verify
  empirically against the real built stylesheet (T001), do not copy the default-size value and
  assume it fits.
- **Busy styling is keyed exclusively on `.sk-button--busy`/`:host([busy])` — never on `:disabled`,
  `[disabled]`, or `[aria-disabled]`** (C-002, R-03). Read `plan.md`'s "Disabling-mechanism
  independence" section for the exact mechanism this must hold by construction, then verify it two
  ways in T002/T006: statically (parse the rule selectors) and dynamically (render both
  combinations and assert the expected computed styles and platform tab-order behaviour).
- **No live region, no `role="status"`, no `aria-live`, no announcement of any kind** (C-003, FR-008)
  — this component reports state; it never narrates it.
- **The static form gets the class, not the cue markup** (plan.md's "Static form" section). Document
  this boundary explicitly in both `sk-button.css`'s header comment and `sk-button.markup.ts`'s doc
  comment, so a future reader does not assume the static path renders an equivalent visual cue
  automatically — it does not, by design (no `render()`, no shadow root on that path).
- **No shared primitive with `sk-progress`/#306** (C-004, C-005; spec.md's Cross-Mission Decision).
  Nothing you author here reuses `sk-progress__bar`, any `<progress>`-based element, or any DOM
  primitive shared with the progress family, and nothing here is designed, named, or structured to
  be a general-purpose spinner. If you find yourself generalizing a class name or extracting a
  standalone "cue" concept for reuse elsewhere, stop — that is out of this WP's scope by ruling, not
  by oversight.
- **No component-scoped #286 no-literal test is added** (R-02, FR-017). This mission's diff to
  `render()` adds a boolean flag and a text-free decorative node — no new code path capable of
  emitting a literal exists. Do not add a test asserting an invariant the diff cannot violate;
  instead, record in the Activity Log (or the WP's own notes for the PR description) that this
  decision was made and why, per R-02.
- **No request, timer, mutation, or announcement ownership** (C-006). SaaS #1520 (double-submit
  prevention) is a different repository's concern; this WP must not need to know it exists beyond
  the disabling-mechanism-independence guarantee above.
- **`LightMode` uses `class="sk-light"`, never `data-theme="light"`** (C-007) — the token block
  anchors on `:root[data-theme="light"], .sk-light`, and `:root` only matches `<html>` (#93).
- **Static form freezes now, per ADR-15** (C-008, R-01) — do not wait on #309/#310/#311/#314; none
  of them apply to `sk-button` (confirmed: its only `:host` rule is `display: inline-flex`).
- **`behaviours.json` needs no new entry** (R-06) — `sk-button` is already a subject of SC-010,
  SC-013, and SC-014. `mutations.json` may gain new arms under those three ids (e.g. an SC-013 arm
  for the new `busy-cue` part) without touching `behaviours.json` at all.
- **This mission does not build a repo-wide #286 gate** (C-009) — that is open issue #286's own
  deliverable.

## Branch Strategy

- **Strategy**: single_branch — this mission's target branch IS `mission/button-busy-axis`; there is
  no separate mission-lane branch and no worktree for this WP.
- **Planning base branch**: `mission/button-busy-axis`
- **Merge target branch**: `mission/button-busy-axis`
- The mission branch is later opened as a PR into `train/elements-first` — that sequence runs after
  this WP is done and is not this WP's own action to take.

> These fields are populated automatically by `spec-kitty agent mission tasks`.
> Do NOT change them manually unless you are certain the branch topology has changed.

## Subtasks & Detailed Guidance

### Subtask T001 – CSS: `.sk-button--busy` rule set, cue geometry, motion, reduced-motion, forced-colors

- **Purpose**: The core visual/geometry/motion contract, and the mechanism (not merely the
  assertion) behind FR-006's zero-layout-shift requirement.
- **Steps**:
  1. Add `.sk-button--busy` as a modifier alongside the existing `--primary`/`--secondary`/`--ghost`/
     `--sm`/`--icon` rules, following the file's existing comment convention.
  2. Author `.sk-button__busy-cue`'s base rule: `position: absolute`, an inset within the existing
     padding box (start with `--sk-space-2` for the default/`--sm` sizes per `plan.md`'s Token
     inventory table, but **measure** against the real built stylesheet before finalizing — do not
     assume the value transfers to `--icon`), a fixed `inline-size`/`block-size`, `border-radius:
     50%`, a border-drawn ring (`border`, `border-top-color` differing from `border-color` — see
     `plan.md`'s CSS strategy block for the exact shape), `visibility: hidden`, `opacity: 0` at
     rest.
  3. Add `:host([busy]) .sk-button__busy-cue { visibility: visible; opacity: 1; animation:
     sk-button-busy-spin ... }`.
  4. Author `@keyframes sk-button-busy-spin` using `--sk-motion-duration-*`/`--sk-motion-ease-*`
     tokens exclusively (see `plan.md`'s Token inventory table for the specific candidates) — no
     hardcoded `ms`/`s`/cubic-bezier literal.
  5. Add a `--icon`-specific override for the cue's inset/size (`.sk-button--icon
     .sk-button__busy-cue { ... }`) — measure against the real rendered 40px-square icon button
     before finalizing values; do not reuse the default-size inset unmeasured.
  6. Add `@media (prefers-reduced-motion: reduce) { ... animation: none; ... }` scoped to exactly
     the cue selector and the `animation` property — never a wildcard over the button's own
     subtree. The frozen frame must be **visibly distinguishable from idle** — since the cue's
     `border-top-color` already differs from its `border-color` at rest, confirm the frozen ring
     reads as "a ring is present" rather than "nothing changed from idle," and adjust if the static
     frame is too subtle to distinguish in practice.
  7. Add `@media (forced-colors: active) { ... }` — per `adding-a-component.md`'s own guidance, a
     plain `border` already survives forced-colors automatically; confirm this holds for the cue's
     border-drawn ring by rendering under forced-colors emulation, and add an explicit override only
     if the automatic remap proves visually insufficient (do not add one preemptively).
  8. Confirm zero new stylelint exceptions are needed — token-only throughout (NFR-001).
  9. Extend the file's header comment: document the busy modifier's markup shape (the cue is a real
     shadow-DOM node, not shared with the static path) and add a one-line pointer to
     `kitty-specs/button-busy-axis-01M25DE5/spec.md`'s "Cross-Mission Decision" section for why this
     file authors its own cue rather than sharing one with `sk-progress`.
- **Files**: `packages/styles/src/button/sk-button.css` (edit).
- **Parallel?**: No — first subtask; T002/T003 need the class name (`sk-button--busy`) and part name
  (`busy-cue`) this subtask fixes.

### Subtask T002 – Element: reflected `busy` property and cue markup in `sk-button.ts`

- **Purpose**: FR-001, FR-007, FR-011 — the property that drives the axis, and the cue node that
  carries no accessible-tree presence and no text.
- **Steps**:
  1. Add `busy: { type: Boolean, reflect: true }` to `SkButton.properties`, and `declare busy:
     boolean;` with a doc comment (published API — `check-manifest-content.mjs` requires a
     description on every public attribute).
  2. In `render()`, widen the class-list call to `buttonClasses(this.variant, this.size, this.busy)`
     (T003 must land the matching markup-module signature change first, or in the same edit pass).
  3. Add `<span part="busy-cue" aria-hidden="true"></span>` **unconditionally** inside both the
     `<button>` and `<a>` render branches — same node, same position, on both branches (the existing
     `part="button"` part is already rendered on both; follow that precedent). Do not conditionally
     render it based on `this.busy` — its DOM presence must be constant; only its CSS visibility
     changes.
  4. Add `@csspart busy-cue` to the class-level JSDoc, alongside the existing `@csspart button`.
  5. Do not read or write `disabled` or `aria-disabled` anywhere in this change (C-002) — the
     existing `?disabled=${this.disabled}` binding on the `<button>` branch is untouched, and no
     branch gains a new `aria-disabled` read.
- **Files**: `packages/elements/src/button/sk-button.ts` (edit).
- **Parallel?**: No — depends on T001's class/part names; proceeds alongside T003.

### Subtask T003 – Markup module: `busy` threaded through the static form

- **Purpose**: FR-002 — the static form shares the same class name from one CSS source (ADR-10 §3),
  documented as NOT sharing the cue markup.
- **Steps**:
  1. Add `busy?: boolean` to `ButtonStaticOptions`.
  2. Widen `buttonClasses(variant?: string, size?: string, busy?: boolean): string` to append
     `'sk-button--busy'` when `busy` is true — a plain boolean append, no validation function needed
     (unlike variant/size, there is no "unknown busy value" failure mode).
  3. Update `buttonStaticHtml` to thread `opts.busy` through to its own `buttonClasses(...)` call, on
     both the `<button>` and `<a>` branches.
  4. Add a `Busy: { busy: true, variant: 'primary' }` entry to `BUTTON_AXES`, matching the existing
     rationale in the module's own comment for why entries are declared rather than derived (a
     derived entry using only `BUTTON_SIZES`/`BUTTON_VARIANTS` would never see a `busy`-only axis).
  5. Add a doc comment near `buttonStaticHtml` (or the module's top-level comment) stating explicitly
     that the static form renders no cue markup — a static consumer wanting the visual cue authors
     it themselves against the same generated stylesheet, following the pattern ADR-15 already
     establishes for other constructs a static consumer must author instead of receiving generated.
  6. Update every existing call site inside this file (and `sk-button.ts`'s call, from T002) to the
     new three-argument signature — check for any internal call using positional args that would
     silently shift.
- **Files**: `packages/elements/src/button/sk-button.markup.ts` (edit).
- **Parallel?**: No — depends on T001's class name; proceeds alongside T002.

### Subtask T004 – Stories: new busy exports in `sk-button.stories.ts`

- **Purpose**: Storybook demonstration and the substrate for axe/visual-regression coverage of every
  required state.
- **Steps**:
  1. Add per-tone busy stories (e.g. `BusyPrimary`, `BusySecondary`, `BusyGhost`, or a single `Busy`
     story rendering all three side by side — match the file's existing `AllVariants` convention for
     whichever shape reads better; either satisfies FR-013 as long as every tone is represented).
  2. Add `BusySmall` (`size="sm"`), `BusyIcon` (`size="icon"`, with `label`).
  3. Add `BusyDisabled` (`busy` + native `disabled`) and `BusyAriaDisabled` (`busy` +
     `aria-disabled="true"`, no native `disabled`).
  4. Extend the existing `LightMode` story to include at least one busy fixture, alongside its
     existing primary/secondary/ghost/icon fixtures.
  5. Ensure `Idle`-equivalent comparison is already covered by the existing `Primary`/`Secondary`/
     `Ghost` stories — no new "Idle" story is needed unless the busy stories are visually separated
     enough that a reviewer benefits from an explicit side-by-side; use judgement, but do not skip
     the comparison entirely (FR-013).
  6. `a11y: { disable: false }` is already set at the `meta` level — no per-story opt-in needed.
- **Files**: `packages/elements/src/button/sk-button.stories.ts` (edit).
- **Parallel?**: No — depends on T002/T003 (stories render the real element and reference the real
  static exports).

### Subtask T005 – Ratchets: `expected-parts.json`, `expected-docs.json`, `expected-stories.json`

- **Purpose**: FR-016 — the ratchets must describe the real shipped surface, in the same PR as the
  tests that exercise it.
- **Steps**:
  1. `expected-parts.json`: add `"busy-cue"` to `sk-button`'s array (`["button", "busy-cue"]`), bump
     `total` by 1, and add a dated note in the file's own note-log following its existing convention
     (see the `#79 adds FOUR...` style entries already there).
  2. `expected-docs.json`: bump `sk-button.attributes` from 5 to 6, bump `total` by 1.
  3. `expected-stories.json`: add every new story id from T004 to `sk-button`'s array, bump `total`
     by the count added.
  4. Do **not** touch `behaviours.json` — confirmed unnecessary by `research.md` R-06.
  5. `mutations.json` may gain new arms under the already-declared SC-010/SC-013/SC-014 ids for
     `sk-button` (e.g. an SC-013 arm dropping the `busy-cue` part) — add these alongside T006's test
     additions if you choose to, not required by any ratchet-shrink rule, but recommended for
     symmetry with the existing `button`/`SC-013` arm.
  6. Run `node scripts/check-part-ratchet.mjs` and confirm it passes now that T006's test targeting
     `busy-cue` exists (the ratchet requires the test to land in the same PR).
- **Files**: `expected-parts.json`, `expected-docs.json`, `expected-stories.json`, optionally
  `mutations.json` (all repo-root edits).
- **Parallel?**: No — depends on T001-T004 for the final counts.

### Subtask T006 – Behaviour tests: extend `fixtures/elements-behaviour/src/sk-button.test.ts`

- **Purpose**: FR-003 through FR-011, User Stories 1-4 — the bulk of this mission's acceptance
  evidence.
- **Steps**:
  1. **Geometry (FR-006, User Story 3, R-07's three-point lesson)**: for each tone × size ×
     {long label, short/icon label}, `mount()` idle, record `getBoundingClientRect()` width/height,
     set `el.busy = true`, await `updateComplete`, re-measure, set `el.busy = false`, await, measure
     a third time. Assert all three width/height pairs are pixel-identical (use the existing file's
     `Math.round(...)` convention from the icon-square test if sub-pixel noise appears, but prefer
     exact equality first and only round if a real, explainable sub-pixel source appears). Add a
     sibling-element check: append a second element after the first in a flex row and confirm its
     position is unchanged across the cycle.
  2. **Disabling-mechanism independence (FR-003/004/005, User Story 2)**: mount with `busy` +
     `disabled` and assert the existing `opacity: 0.4`/`cursor: not-allowed` treatment still applies
     (`getComputedStyle`) and the cue is visible (`getComputedStyle` on the `busy-cue` part shows
     `visibility: visible`/`opacity: 1`); mount with `busy` + `aria-disabled="true"` (no native
     `disabled`) and assert no dimming, the cue is visible, and the control remains focusable
     (mirror this file's existing `host focus delegates...` test's focus-and-`tabIndex` pattern).
     Additionally, parse `sk-button.css` (raw import) into a `CSSStyleSheet` and assert none of the
     busy rule's selectors reference `:disabled`, `[disabled]`, or `[aria-disabled]` (R-03's static
     half of the two-way check).
  3. **Accessible name parity and no announcement (FR-007/FR-008/FR-011, User Story 1)**:
     `toHaveAccessibleName()` before and after `busy` is set, for a text fixture and an icon-only
     fixture; assert the shadow tree contains no `role="status"`, `aria-live`, or live-region
     element in either state.
  4. **Reduced motion / forced colors (FR-009/FR-010, User Story 4)**: mirror
     `sk-status-indicator.test.ts`'s `authoredStatusSheet`/`mediaRuleFor` pattern exactly — parse the
     raw `sk-button.css` into a `CSSStyleSheet`, find the `(prefers-reduced-motion: reduce)` rule,
     and assert it sets `animation-name: none` on `.sk-button__busy-cue` while its
     `visibility`/`opacity` declarations (inherited from the busy-visible rule, or restated in the
     reduced-motion block) keep the cue visible — not reset to the idle-hidden values. Find the
     `(forced-colors: active)` rule (or confirm the base border rule needs no override, per T001's
     Activity Log note) and assert the cue's `border-style` stays solid.
  5. **Static markup module (FR-002)**: `buttonClasses(variant, size, true)` includes
     `sk-button--busy`; `buttonStaticHtml({ busy: true, variant: 'primary' })` on the `<button>`
     branch and `buttonStaticHtml({ busy: true, href: '/x' })` on the `<a>` branch both include the
     class; confirm the existing anchor-injection test's hostile-input case still passes unmodified
     (busy is a boolean, never interpolated as a string, so no new escaping question arises — assert
     this explicitly with a one-line comment rather than leaving it unstated).
  6. **`[SC-013]` part targetability, extended**: extend the existing `[SC-013]` test's loop to also
     assert `sk-button::part(busy-cue)` is targetable from outside, on both the `<button>` and `<a>`
     render branches — mirroring this file's own existing lesson about testing both branches for a
     part rendered by both.
  7. Run the full, pre-existing test file before and after your edits and confirm every existing
     test's outcome is unchanged (not just "still green" — the #308 lesson applies to this file's
     own untouched tests too).
- **Files**: `fixtures/elements-behaviour/src/sk-button.test.ts` (edit).
- **Parallel?**: No — depends on T001-T005 (tests assert against the real, ratcheted surface).

### Subtask T007 – New Playwright spec: `apps/storybook/src/tests/sk-button.spec.ts`

- **Purpose**: FR-014 — narrow-width/200%-zoom containment and RTL/logical-layout, which the vitest
  behaviour-test file's jsdom-adjacent environment cannot verify as precisely as a real Storybook
  page render.
- **Steps**:
  1. This file does not exist today — create it new, following `sk-copy-field.spec.ts`'s `story()` +
     `page.setViewportSize()` technique (read that file's imports and helper setup in full before
     writing your own).
  2. **Narrow width / 200% zoom**: set a narrow CSS viewport (mirror `sk-copy-field.spec.ts`'s
     `{ width: 195, height: 253 }`-style setup, or a value appropriate to a busy button with a long
     label) against a busy fixture with a long label, and assert
     `document.documentElement.scrollWidth === document.documentElement.clientWidth` (no horizontal
     overflow).
  3. **RTL / logical layout**: render a busy fixture with `dir="rtl"` set on a wrapping element (or
     `document.documentElement`, matching this repo's existing RTL-story convention if one exists —
     check sibling `*.spec.ts` files for the established technique before inventing one), and assert
     the cue's computed position (via `inset-inline-start`'s resolved physical value) is on the
     visually-correct side — proving the CSS strategy's use of a logical property (not physical
     `left`/`right`) is real, not merely intended.
  4. Keep the file scoped to these two concerns only — reduced-motion/forced-colors/geometry/
     accessible-name are already covered in T006's vitest file; do not duplicate them here.
- **Files**: `apps/storybook/src/tests/sk-button.spec.ts` (new).
- **Parallel?**: No — depends on T004 (a built Storybook story to render against).

### Subtask T008 – Regenerate every generated artifact and run the full local Gate Matrix

- **Purpose**: Confirm the whole WP is internally consistent before pushing, using every gate this
  host can run, per `plan.md`'s Gate Matrix.
- **Steps**:
  1. Regenerate in dependency order: `node scripts/build-elements-css.mjs`, `node
     scripts/build-element-markup.mjs`, `npx nx run elements:analyze`, `node
     scripts/build-react-wrappers.mjs`, `node scripts/build-vue-types.mjs`.
  2. Build then measure: `npx nx run-many --target=build --projects=tokens,styles,elements`, then
     `node scripts/measure-elements-sizes.mjs` (reads `dist/`, does not build it — build first, and
     never `rm -rf packages/tokens/dist`, which would delete the git-tracked
     `token-catalogue.json`).
  3. Run every `--check` variant of the generators above, plus `git diff --exit-code --
     packages/elements/custom-elements.json` and `node scripts/measure-elements-sizes.mjs --check`.
  4. Run `node scripts/check-manifest-content.mjs`, `node scripts/check-no-css-in-source.mjs`, `node
     scripts/check-elements-entries.mjs`, `node scripts/check-adopted-css-boundaries.mjs`, `node
     scripts/check-element-css-hygiene.mjs`, `node scripts/check-part-ratchet.mjs`, `node
     scripts/check-story-theme-wrapper.mjs`, `node scripts/typecheck-all.mjs`, `npm run
     quality:all`.
  5. Run `npx vitest run fixtures/elements-behaviour/src/sk-button.test.ts`, then the full `npm run
     test` and `node scripts/suite-selftest.mjs`.
  6. Build Storybook (`npx nx run storybook:storybook:build`) and run `node
     scripts/run-axe-storybook.js`.
  7. Run `npx playwright test apps/storybook/src/tests/sk-button.spec.ts --project=chromium
     --project=firefox` (WebKit is CI-authoritative only — this host cannot launch it).
  8. `git add -A && git status --porcelain` must be empty after regeneration — confirm every
     generated artifact (`.css.js`/`.css.d.ts`, static HTML if any, `custom-elements.json`,
     `packages/react/src/button/**`, `packages/elements/vue.d.ts`, `SIZES.md`) is committed and
     nothing else drifted.
  9. Confirm `git grep -nE ':host|::slotted|container-type' packages/styles/src/button/sk-button.css`
     still shows only the one pre-existing `display: inline-flex` `:host` rule (the ADR-15
     independence re-check, final not only plan-time).
- **Files**: none new — regeneration and verification only.
- **Parallel?**: No — depends on T001-T007.

### Subtask T009 – Final verification: rebase, full suite, CI-authoritative confirmation, PR notes

- **Purpose**: SC-011/SC-012 and the plan's own "Rebase / regenerate / rerun" checklist; the WebKit
  leg and the chromium visual baseline are CI-authoritative, so this WP is not done until CI confirms
  them.
- **Steps**:
  1. Rebase onto `train/elements-first`'s current head if it has moved since this mission's dispatch
     (recorded lesson: re-fetch main before implementing — a long design phase can go stale while
     sibling missions #301/#302/#304/#306/#308 land).
  2. Rerun the full Gate Matrix (T008) against the rebased head.
  3. Confirm no existing `sk-button` story, fixture, or test outcome changed — an explicit
     before/after diff, not merely "the suite is green."
  4. Push and confirm the `playwright` CI job is green across all three engines — this is the only
     place WebKit actually runs for this mission.
  5. Confirm the `visual-regression` job's new chromium baselines are accepted (harvest from the
     CI artifact if a local/CI mismatch appears — never trust a local screenshot as the baseline).
  6. Re-run the pre-merge adversarial squad against the final head SHA before requesting review, per
     #305's squad tier C (pre-merge only) — never skipped regardless of tier.
  7. Draft the PR description's evidence section noting: the ADR-15 static-form-freeze rationale, a
     link/citation to the Cross-Mission Decision, the R-02 reasoning for not adding a
     component-scoped #286 test, and the specific cue inset/size values measured in T001 (since
     `plan.md` deliberately left them as an implementation-phase measurement, the PR should record
     what was actually measured, not merely that measurement occurred).
- **Files**: none new — verification and PR-evidence drafting only.
- **Parallel?**: No — depends on T008.
