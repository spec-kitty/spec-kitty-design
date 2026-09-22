---
work_package_id: WP01
title: '.sk-progress--indeterminate: accessible unknown-duration activity over the existing progress family'
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
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
- C-007
- C-008
- C-009
planning_base_branch: mission/progress-indeterminate
merge_target_branch: mission/progress-indeterminate
branch_strategy: Planning artifacts for this mission were generated on mission/progress-indeterminate. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/progress-indeterminate unless the human explicitly redirects the landing branch.
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
phase: Phase 1 - .sk-progress--indeterminate
history:
- at: '2026-09-10T10:16:39Z'
  actor: system
  action: 'Prompt authored during mission planning for #306'
agent_profile: frontend-freddy
authoritative_surface: packages/styles/src/progress/
create_intent:
- packages/styles/src/progress/sk-progress-indeterminate.html
- packages/styles/src/progress/sk-progress-indeterminate-with-meta.html
- packages/styles/src/progress/sk-progress-indeterminate-narrow.html
- packages/styles/src/progress/sk-progress-indeterminate-long-label.html
- packages/styles/src/progress/sk-progress-indeterminate-forced-colors.html
execution_mode: code_change
model: ''
owned_files:
- packages/styles/src/progress/**
- apps/storybook/src/tests/sk-progress.spec.ts
- apps/storybook/src/tests/visual.spec.ts
- docs/design-system/using-components.md
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP01 – `.sk-progress--indeterminate`: accessible unknown-duration activity over the existing progress family

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and
behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `claude`

If no profile is specified, run `spec-kitty agent profile list` and select the best match for
`implement` work against `packages/styles/src/` involving CSS animation, accessibility, and a
cross-engine rendering risk.

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

Wrap HTML/XML tags in backticks: `<progress>`, `<label>`, `<span>`
Use language identifiers in code blocks: ```css, ```ts, ```bash

---

## Objectives & Success Criteria

Extend `packages/styles/src/progress/` — #210's existing styles-only `.sk-progress` family — with a
`.sk-progress--indeterminate` root-class modifier expressing unknown-duration activity: a real,
valueless `<progress class="sk-progress__bar">`, an authored token-driven animation on the existing
vendor pseudo-element surface, and five new fixtures. `spec.md`'s Context section states the
motivating gap: Family 4's T8 join-link-capture screen hand-authors `.busy-cue`/`.busy-track` with
its own animation, its own reduced-motion fallback and its own forced-colors treatment, in a screen
file where it should not exist.

**Read `plan.md` and `research.md` in full before starting.** Both are already authored for this
mission. `plan.md`'s "CSS strategy," "Test-file strategy," and "Gate Matrix" sections, and
`research.md`'s R-00 through R-07, answer nearly every implementation question this prompt would
otherwise restate. This prompt sequences and scopes that material into twelve subtasks.

**Read `spec.md`'s "Cross-Mission Decision: TKT5/TKT6 Activity Cue" section before starting.** It is
binding on this WP even though it names no direct implementation action: it rules OUT building
anything that could be mistaken for a shared cue primitive with `sk-button`. Nothing in this WP
creates a second consumer of any class, keyframe, or element it introduces.

Done means:

- `packages/styles/src/progress/sk-progress.css` gains `.sk-progress--indeterminate`, a
  `@keyframes` animation token-driven by `--sk-motion-*`, and a reduced-motion override that stops
  the animation while leaving a frame that is neither the Complete nor the Zero determinate visual.
- The forced-colors block covers the animated fill, verified across more than one point in the
  animation cycle, not assumed from the existing static-fill precedent.
- Five new `.html` fixtures exist: indeterminate with label (no meta), indeterminate with
  non-percentage meta, indeterminate + `--narrow`, indeterminate + a long label, and an
  indeterminate forced-colors fixture. Every one carries **no `value` attribute** on `<progress>`.
- `packages/styles/src/progress/index.ts` is regenerated (never hand-written) and `--check` is
  clean. No `packages/elements/src/progress/` directory exists. No ratchet file
  (`expected-parts.json`, `expected-docs.json`, `behaviours.json`, `mutations.json`) gains an entry.
- `sk-progress-html.stories.ts` gains the corresponding story exports.
- `apps/storybook/src/tests/sk-progress.spec.ts` is edited in place: the existing
  percentage-consistency test is scoped to determinate fixtures only (still passing for every one
  of them, unchanged), and new assertions cover the indeterminate no-value/no-percentage-meta
  contract, accessibility tree, reduced-motion frozen frame, multi-sample forced-colors, and
  narrow/long-label overflow.
- The full gate matrix from `plan.md` passes locally (chromium+firefox) and, on CI, the `playwright`
  job is green across all three engines and the chromium `visual-regression` baseline is accepted.
- Every existing determinate fixture, story, and test outcome is unchanged — verified by an
  explicit before/after comparison, not merely "the suite is green."

## Context & Constraints

- **Mission spec**: `kitty-specs/progress-indeterminate-01M25C78/spec.md` — read all five user
  stories, all sixteen FRs, all five NFRs, all nine constraints, the Edge Cases section, and the
  Cross-Mission Decision section before starting.
- **Mission plan**: `kitty-specs/progress-indeterminate-01M25C78/plan.md` — the authoritative source
  for file layout, the CSS technique, the test-file edit strategy, and the full gate command list.
  This WP's subtasks map onto that plan's IC-01 through IC-04 concern map.
- **Mission research**: `kitty-specs/progress-indeterminate-01M25C78/research.md` — R-00 (the
  activity-cue pairing ruling — read this even though it names no subtask of your own), R-01
  (ADR-15 independence, measured), R-02 (why `value` must be structurally absent, not empty/invalid),
  R-03 (why `__meta`'s optionality breaks the existing consistency test), R-04 (the `playwright` CI
  job is the three-engine mechanism), R-05 (authored animation, not native UA rendering — and why),
  R-06 (forced-colors on an animated fill needs multi-frame verification), R-07 (why no
  component-scoped #286 test is added, and what narrow guard replaces it).
- **Data model**: `kitty-specs/progress-indeterminate-01M25C78/data-model.md` — the extended
  markup/attribute contract table and the fixture matrix are the literal spec for T003.
- **The family you are extending, not replacing**: `packages/styles/src/progress/sk-progress.css`,
  `index.ts` (generated), `sk-progress-html.stories.ts`, and
  `apps/storybook/src/tests/sk-progress.spec.ts` all already exist from #210. Read all four in full
  before editing any of them. Every existing determinate rule, fixture, story export, and test must
  survive this WP unchanged in outcome.
- **Generator**: `scripts/build-styles-only-markup.mjs` — no change to this script. It already
  discovers `packages/styles/src/progress/` (from #210); it re-derives its export list from every
  `.html` file present, which now includes your five new ones.
- **Package wiring is already complete — do not touch it.** `packages/styles/src/index.ts:57`
  (`export * from './progress/index';`) and `packages/styles/package.json:45`
  (`"./progress/*": "./dist/progress/*"`) already exist from #210. This WP adds no new export-map
  entry.
- **The `value` attribute must be structurally absent** (R-02) — never `value=""`, never an
  out-of-range value relied on for parse-failure behaviour. Assert this at the source-file text
  level in T003/T006, not only at the rendered-DOM level.
- **`__meta` is optional; when present it must never read as a percentage** (R-03). At least one
  fixture omits it entirely; at least one supplies non-numeric status text (e.g. "Syncing…").
- **No invented ARIA anywhere** (FR-006) — zero `aria-*`, `role`, `aria-live`, `aria-busy`. The
  native, valueless `<progress>` plus the existing `for`/`id` label pair is the sole mechanism, same
  as the determinate family.
- **The animation is authored, not native.** Do not rely on any browser's own default indeterminate
  paint. R-05 explains why: it is not switched off by `prefers-reduced-motion` on its own, and it is
  the named cross-engine divergence risk itself. Reset the vendor pseudo-elements exactly as the
  determinate rules already do (`appearance: none`, `::-webkit-progress-bar`,
  `::-webkit-progress-value`, `::-moz-progress-bar`) and author your own `@keyframes` on them,
  token-driven by `--sk-motion-*` (check `packages/tokens/src/tokens.css` for the exact duration/
  easing token names already in use elsewhere in the library — reuse, do not invent a new one
  absent a demonstrated gap, per C-009).
- **Reduced motion must leave a real, measurable, non-full/non-empty frame** (FR-008, NFR-005). Do
  not merely set `animation: none` and stop there — pick (and document, in the CSS comment and the
  Activity Log) a specific fixed `background-position`/`background-size` state that is visually and
  measurably distinct from both the Complete and Zero determinate fixtures' fill extents. T008
  asserts this by measurement, not by trusting the rule's intent.
- **Forced-colors**: the existing `Highlight` override on the fill pseudo-elements
  (`background-color: Highlight` inside `@media (forced-colors: active)`) very likely already
  applies regardless of `animation-name`, since it overrides a property the animation does not
  itself touch differently — but this is something to **measure during T002/T008**, not assume.
  Sample at least two points in the animation cycle (e.g. pause the animation at two different
  `animation-delay` offsets via a test-only style override, or capture two points in time with a
  short wait between them).
- **Cross-engine verification runs through the existing `playwright` CI job, not a new mechanism**
  (R-04). `playwright.config.ts` already declares `chromium`/`firefox`/`webkit` projects;
  `.github/workflows/ci-quality.yml`'s `playwright` job already runs `npx playwright test`
  unfiltered after installing all three engines. Do not add a new CI job, workflow, or install
  step. Locally, run `npx playwright test apps/storybook/src/tests/sk-progress.spec.ts
  --project=chromium --project=firefox` — WebKit is verified on CI only (this workstation cannot
  launch it; a pre-existing, already-recorded gap, not something this WP is expected to fix).
- **Do not add firefox/webkit visual-regression (pixel) baselines** (R-04, SC-014). The existing
  `visual-regression` CI job is chromium-only by already-recorded repository policy; this WP's new
  stories get chromium baselines only, added the normal way any new story does.
- **No component-scoped #286 no-literal test** (R-07). This family has no `render()` and no shadow
  root — the defect class #286 targets cannot occur here. Instead, add a five-line extension to the
  existing "no CSS-generated arithmetic" test asserting `sk-progress.css` contains no `content:`
  declaration carrying literal text. Do not build a broader gate — that is #286's own scope.
- **No shared primitive with `sk-button`/#305** (C-004, C-005; spec.md's Cross-Mission Decision).
  Nothing you author here is designed, named, or structured to be reused by a future `sk-button`
  busy-axis implementation. If you find yourself generalizing a class name or extracting a
  standalone "cue" concept, stop — that is out of this WP's scope by ruling, not by oversight.
- **No custom element, no shadow root, no `::part()`, no ratchet entry** (C-001). Do not create
  `packages/elements/src/progress/`. Confirm via `git grep -nE ':host|::slotted|container-type|::part'
  packages/styles/src/progress/sk-progress.css` that the file still shows zero matches after your
  edit — this is the ADR-15-independence check made executable (SC-013), not a one-time note.
- **No arithmetic, no JavaScript, no state, no timer, no transition between indeterminate and
  determinate** (C-002, C-003). Every fixture is a static snapshot.
- **This mission is independent of #301/ADR-15 and of every other Wave B sibling** (C-006) — no
  composition target, no cross-mission dependency to check for at implementation time beyond the
  Cross-Mission Decision's own constraint above.

## Branch Strategy

- **Strategy**: single_branch — this mission's target branch IS `mission/progress-indeterminate`;
  there is no separate mission-lane branch.
- **Planning base branch**: `mission/progress-indeterminate`
- **Merge target branch**: `mission/progress-indeterminate`
- The mission branch is later opened as a PR into `train/elements-first` per
  `docs/architecture/elements-first-run-prompt.md` — that sequence runs after this WP is done and is
  not this WP's own action to take.

> These fields are populated automatically by `spec-kitty agent mission tasks`.
> Do NOT change them manually unless you are certain the branch topology has changed.

## Subtasks & Detailed Guidance

### Subtask T001 – Author `.sk-progress--indeterminate`'s CSS rule, `@keyframes`, and reduced-motion override

- **Purpose**: The core visual/motion contract — an authored, token-driven activity animation that
  can actually be stopped under reduced motion, per R-05.
- **Steps**:
  1. Add `.sk-progress--indeterminate` as a modifier alongside the existing `--compact`/`--narrow`
     rules, following the file's existing comment convention.
  2. Target the existing reset vendor pseudo-elements
     (`.sk-progress--indeterminate .sk-progress__bar::-webkit-progress-value`,
     `.sk-progress--indeterminate .sk-progress__bar::-moz-progress-bar`) with a sliding-gradient or
     equivalent sweep technique: a `background-image`/`background-size` combination animated via
     `background-position`, so the "fill" reads as continuous activity rather than a static
     percentage.
  3. Author `@keyframes sk-progress-indeterminate-sweep` (or similarly namespaced) using
     `--sk-motion-*` duration/easing tokens exclusively — no hardcoded `ms`/`s`/cubic-bezier
     literal.
  4. Add `@media (prefers-reduced-motion: reduce) { ... animation: none; ... }` scoped to exactly
     the selector(s) and property the animation touches — never a wildcard. Set a fixed
     `background-position`/`background-size` state that is visibly partial (neither the Complete
     fixture's full fill nor the Zero fixture's empty one).
  5. Confirm zero new stylelint exceptions are needed — token-only throughout.
- **Files**: `packages/styles/src/progress/sk-progress.css` (edit).
- **Parallel?**: No — first subtask; everything else in this WP depends on this rule existing in
  some form to render fixtures against meaningfully.

### Subtask T002 – Extend the forced-colors block for the animated fill

- **Purpose**: FR-009 — track and fill each remain distinguishable under `forced-colors: active`
  across the animation cycle, not only at a single coincidental frame.
- **Steps**:
  1. Confirm (by rendering, not by reading the CSS alone) whether the existing
     `background-color: Highlight` override on the fill pseudo-elements already covers the
     indeterminate animation's frames. If it does not — e.g. if the sweep technique introduces a
     `background-image` gradient that the `Highlight` override does not fully replace — extend the
     rule so it does.
  2. The track's plain `border` continues to need no override; do not add one.
  3. Record in the Activity Log which case applied (override already sufficient vs. extended) so
     T008's test author does not have to re-derive it.
- **Files**: `packages/styles/src/progress/sk-progress.css` (edit, continuing T001).
- **Parallel?**: No — same file and rule block as T001.

### Subtask T003 – Author the five new fixture `.html` files

- **Purpose**: Real, authored markup for every required indeterminate state — the sole source the
  generator turns into barrel exports.
- **Steps**:
  1. `sk-progress-indeterminate.html` — `sk-progress sk-progress--indeterminate` root, a label (e.g.
     "Syncing your changes"), `<progress class="sk-progress__bar" id="...">` with **no `value`
     attribute anywhere in the source** (verify by reading the raw file, not just the rendered DOM),
     no `sk-progress__meta`.
  2. `sk-progress-indeterminate-with-meta.html` — same as above, plus a `sk-progress__meta` span
     with short, **non-percentage** status text (e.g. "Working…") — never a string matching `\d+%`.
  3. `sk-progress-indeterminate-narrow.html` — the base indeterminate content with
     `sk-progress--narrow` added to the root's class list alongside `--indeterminate`.
  4. `sk-progress-indeterminate-long-label.html` — a label string long enough to exercise
     wrapping/truncation at normal and narrow widths, matching the existing determinate long-label
     fixture's proportions.
  5. `sk-progress-indeterminate-forced-colors.html` — any valid indeterminate fixture, used by the
     `ForcedColors` story/test.
  6. Every fixture keeps the three-flat-children order (label, bar, optional meta) — no wrapper, no
     reorder — and a unique `id` per fixture, per the existing determinate convention.
  7. Zero `aria-*`/`role` attributes anywhere, same as every determinate fixture.
  8. Leading HTML comment header, matching the generator's lazy leading-comment-strip convention
     (see the existing fixtures for the exact shape).
- **Files**: five new `.html` files under `packages/styles/src/progress/`.
- **Parallel?**: No — depends on T001/T002 existing in some renderable form.

### Subtask T004 – Regenerate the barrel and verify clean

- **Purpose**: Produce the generated barrel from T003's fixtures with no hand-editing.
- **Steps**:
  1. Run `node scripts/build-styles-only-markup.mjs`. No code change to the script — its
     directory-shape discovery already covers this directory from #210.
  2. Run `node scripts/build-styles-only-markup.mjs --check` — must report the barrel current.
  3. Confirm `git ls-files packages/elements/src` still shows no `progress` directory.
  4. Confirm none of `expected-parts.json`, `expected-docs.json`, `behaviours.json`,
     `mutations.json` gained an entry.
  5. Confirm `packages/styles/src/index.ts` and `packages/styles/package.json` are unchanged by this
     WP — their `progress` wiring already exists.
- **Files**: `packages/styles/src/progress/index.ts` (generated).
- **Parallel?**: No — depends on T003.

### Subtask T005 – Extend `sk-progress-html.stories.ts`

- **Purpose**: Storybook demonstration of every new fixture, rendered from the generated barrel only.
- **Steps**:
  1. Import the five new generated named exports from `./index`.
  2. Add story exports: e.g. `Indeterminate`, `IndeterminateWithMeta`, `IndeterminateNarrow`,
     `IndeterminateLongLabel`, `IndeterminateForcedColors` — names consistent with the file's
     existing PascalCase convention.
  3. Do not hand-write any HTML in the story file — render from the generated constants only, same
     as every existing export.
  4. Leave every existing determinate story export untouched.
- **Files**: `packages/styles/src/progress/sk-progress-html.stories.ts` (edit).
- **Parallel?**: No — depends on T004 (the generated barrel must include the new exports).

### Subtask T006 – `sk-progress.spec.ts` part 1: scope the existing test, add the indeterminate consistency check

- **Purpose**: FR-014/R-03 — the existing "every maintained fixture keeps its visible meta text
  consistent with its own value/max pair" test iterates every barrel export generically and will
  break on the first fixture with no `value`/`max` and no percentage meta.
- **Steps**:
  1. Read the existing `readFixtures`/`parseFixture` helpers and the test that currently iterates
     every export.
  2. Scope that specific test to fixtures matching the existing determinate naming convention (i.e.
     exclude anything whose exported name contains `Indeterminate`) — a targeted filter, not a
     loosened assertion. Every determinate fixture must still be checked exactly as before.
  3. Add a new, parallel test: every fixture whose name contains `Indeterminate` has (a) no `value`
     attribute anywhere in its source HTML string, and (b) if it has a `sk-progress__meta` span, its
     text does not match `/^\d+%$/`.
  4. Run the full existing determinate portion of this test file before and after your edit and
     confirm the results are byte-identical in outcome (not just "still green") — this is the
     concrete verification for SC-010, not an assumption.
- **Files**: `apps/storybook/src/tests/sk-progress.spec.ts` (edit).
- **Parallel?**: No — depends on T005 (a built Storybook / generated barrel to test against).

### Subtask T007 – `sk-progress.spec.ts` part 2: accessibility tree

- **Purpose**: FR-004/FR-006/NFR-002 — the indeterminate control is exposed with the platform's
  native role and the label's accessible name, no numeric value, and zero invented ARIA.
- **Steps**:
  1. For the `Indeterminate` story, assert the control's role is the platform's native
     progress-indicator role and its accessible name matches the label text (same pattern as the
     existing determinate `getByRole('progressbar', { name })` assertion).
  2. Assert `HTMLProgressElement.position === -1` via `page.evaluate` — the HTML spec's own
     engine-agnostic signal for indeterminate state, more robust than depending on any particular
     ARIA string.
  3. Assert zero `aria-*`/`role`/`aria-live`/`aria-busy` attributes exist anywhere in the fixture's
     markup, mirroring the existing determinate assertion's shape.
  4. Run axe-core against the new stories (covered by the standing `run-axe-storybook.js` gate; no
     new per-story opt-in needed).
- **Files**: `apps/storybook/src/tests/sk-progress.spec.ts` (edit, continuing T006).
- **Parallel?**: No — same file.

### Subtask T008 – `sk-progress.spec.ts` part 3: reduced motion and multi-sample forced colors

- **Purpose**: FR-008/FR-009 — measure, not assume, that the reduced-motion frame is real and
  non-full/non-empty, and that forced-colors legibility holds across the animation cycle.
- **Steps**:
  1. Emulate `prefers-reduced-motion: reduce`, read the computed `animation-name` (or
     `animation-play-state`) on the fill pseudo-element (via CDP/`getComputedStyle` as the existing
     test infrastructure allows), and confirm it is inert.
  2. Measure the frozen frame's `background-position`/equivalent state and confirm it is distinct
     from both the Complete and Zero determinate fixtures' fill extents (per T001's authored fixed
     state).
  3. Emulate `forced-colors: active`, sample the fill's colour at two distinct points in the
     animation cycle (e.g. two `animation-delay` offsets, or two measurements separated by a short
     wait), and confirm the track boundary and fill remain each distinguishable from the page and
     from each other at both samples — per T002's Activity Log note on which forced-colors case
     applied.
- **Files**: `apps/storybook/src/tests/sk-progress.spec.ts` (edit, continuing T007).
- **Parallel?**: No — same file.

### Subtask T009 – `sk-progress.spec.ts` part 4: overflow and the no-literal CSS guard

- **Purpose**: NFR-004 (no horizontal overflow) and R-07's narrow substitute for a component-scoped
  #286 test.
- **Steps**:
  1. Add narrow-viewport no-overflow assertions for the indeterminate-narrow and
     indeterminate-long-label fixtures, mirroring the existing determinate long-label/large-total
     tests' `page.setViewportSize` + `scrollWidth`/`clientWidth` comparison shape exactly.
  2. Extend the existing "no CSS-generated arithmetic" test (or add an adjacent one in the same
     `describe` block) asserting `sk-progress.css` contains no `content:` declaration carrying
     literal text — a five-line regex-based guard, not a new component-scoped gate.
- **Files**: `apps/storybook/src/tests/sk-progress.spec.ts` (edit, continuing T008).
- **Parallel?**: No — same file.

### Subtask T010 – Documentation

- **Purpose**: A future reader of the CSS file or the component docs should not have to rediscover
  the Cross-Mission Decision from a GitHub issue.
- **Steps**:
  1. Extend `sk-progress.css`'s header comment: document the indeterminate markup shape (root
     modifier, valueless `<progress>`, optional `__meta`) and add a one-line pointer to
     `kitty-specs/progress-indeterminate-01M25C78/spec.md`'s "Cross-Mission Decision" section for
     why this file authors its own cue rather than sharing one with `sk-button`.
  2. If `docs/design-system/using-components.md` already documents `sk-progress`, extend its entry
     with the indeterminate variant. If it does not document `sk-progress` at all yet, do not create
     that documentation from scratch here — out of this WP's scope (it was #210's responsibility,
     not reopened by this mission).
- **Files**: `packages/styles/src/progress/sk-progress.css` (comment edit),
  `docs/design-system/using-components.md` (edit, if applicable).
- **Parallel?**: Can start once T001-T003 are stable; sequenced last here for convenience only.

### Subtask T011 – Local gate matrix and regression confirmation

- **Purpose**: Confirm the whole WP is internally consistent before pushing, using every gate this
  host can run.
- **Steps**:
  1. Run the full local Gate Matrix from `plan.md` (typecheck, lint, barrel `--check`,
     `check-adopted-css-boundaries.mjs`, `check-story-theme-wrapper.mjs`, `check-release-graph.mjs`,
     Storybook build, axe, and `npx playwright test --project=chromium --project=firefox` against
     the edited spec file).
  2. Run `git grep -nE ':host|::slotted|container-type|::part' packages/styles/src/progress/sk-progress.css`
     and confirm zero matches (SC-013).
  3. Confirm every existing determinate fixture/story/test outcome is unchanged (SC-010) — an
     explicit before/after comparison of the determinate portion of `sk-progress.spec.ts`'s results.
  4. Commit every generated artifact (`index.ts`) alongside the authored source; confirm
     `git status --porcelain` is empty after `git add -A`.
- **Files**: none new — verification and commit only.
- **Parallel?**: No — depends on everything before it.

### Subtask T012 – Rebase, push, and confirm CI is green across all three engines

- **Purpose**: SC-008/SC-014 — the WebKit leg and the chromium visual baseline are CI-authoritative;
  this WP is not done until CI confirms them.
- **Steps**:
  1. Rebase onto the current `mission/progress-indeterminate` tip and, if `train/elements-first`'s
     head has moved since this mission's dispatch, onto that head too.
  2. Rerun the full gate matrix against the new head.
  3. Push and confirm the `playwright` CI job is green — this is the only place WebKit actually runs
     for this mission.
  4. Confirm the `visual-regression` job's new chromium baselines are accepted (or re-capture from
     the CI artifact if a local/CI mismatch appears — never trust a local screenshot as the
     baseline).
  5. Re-run the pre-merge adversarial squad against the final head SHA before requesting review, per
     #306's squad tier C (pre-merge only) — never skipped regardless of tier.
- **Files**: none new — verification only.
- **Parallel?**: No — depends on T011.
