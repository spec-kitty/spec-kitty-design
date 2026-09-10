---
work_package_id: WP01
title: Widen sk-entity-marker on the size, border and image axes (#304, ADR-15 split)
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
- NFR-001
- NFR-002
- NFR-003
planning_base_branch: mission/entity-marker-size-border-image-axis
merge_target_branch: mission/entity-marker-size-border-image-axis
branch_strategy: Planning artifacts for this mission were generated on mission/entity-marker-size-border-image-axis. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/entity-marker-size-border-image-axis unless the human explicitly redirects the landing branch.
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
phase: Phase 1 - Implementation (only phase; C-001 bounds this mission to one WP)
history:
- at: '2026-09-10T09:51:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: packages/styles/src/entity-marker/, packages/elements/src/entity-marker/
create_intent: []
execution_mode: code_change
model: ''
owned_files:
- packages/styles/src/entity-marker/sk-entity-marker.css
- packages/elements/src/entity-marker/sk-entity-marker.ts
- packages/elements/src/entity-marker/sk-entity-marker.stories.ts
- fixtures/elements-behaviour/src/sk-entity-marker.test.ts
- expected-docs.json
- behaviours.json
- mutations.json
- expected-stories.json
- expected-parts.json
- packages/elements/SIZES.md
role: implementer
tags: []
task_type: implement
tracker_refs:
- '#304'
- '#300'
---

# Work Package Prompt: WP01 – Widen sk-entity-marker on the size, border and image axes

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or
any user-defined profile), and behave according to its guidance before parsing the rest of this
prompt.

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: *(assign at dispatch time)*

If no profile is specified, run `spec-kitty agent profile list` and select the best match for
`task_type: implement` against `authoritative_surface: packages/styles/src/entity-marker/,
packages/elements/src/entity-marker/`.

---

## ⚠️ IMPORTANT: This mission implements a ruling, it does not make one

ADR-15 (`docs/architecture/decisions/2026-09-10-15-static-form-of-element-backed-css.md`) already
decided, by name, how #304's three axes split:

> "**Split.** The size and border axes are ordinary root-class modifiers
> (`.sk-entity-marker--sm`, `.sk-entity-marker--circle`) and may be frozen as a static API now.
> The **image axis may not be frozen as an equality-gated static API** — it is construct kind 3,
> ruled shadow-only above. It may be frozen as a documented *authoring instruction* (the
> paired-spelling rule), and that instruction **must state the tie boundary explicitly**, and
> must state it **generically rather than by transcribing a number**."

Do not re-open this question. Do not add a CI check that asserts shadow-vs-static cascade
**position** equality for the image rule — ADR-15 measured that no such check can be true. Do not
transcribe `(0,1,1)` or `(0,2,1)` from ADR-15 or from `plan.md`/`spec.md`/`research.md` into any
file this WP produces — compute the figure fresh from whatever selector this WP's own CSS ships.

**Read, in this order, before writing anything**: `spec.md` (all FRs, Non-Goals, Downstream
Contract for #303), `plan.md` (Implementation Concern Map IC-01..IC-04), `research.md` (five
decisions, each quoting ADR-15 or the source issues directly), `data-model.md`,
`docs/contributing/adding-a-component.md` (the `::slotted()` tie-boundary table and the
`:host`/container-type table), and ADR-15 itself in full. Then read the live issues —
`gh issue view 304 --repo spec-kitty/spec-kitty-design` and `gh issue view 300` — do not trust
this prompt's paraphrase over the live text.

---

## Markdown Formatting

Wrap HTML/XML tags in backticks: `` `<div>` ``, `` `<script>` ``
Use language identifiers in code blocks: ````css`, ````typescript`, ````bash`

---

## Objectives & Success Criteria

- Every one of spec.md's FR-001 through FR-013 is satisfied, checkably, in the resulting PR.
- The existing default and `sm` sizes are byte-for-byte unchanged (NFR-001) — every existing
  story/snapshot passes with zero diff.
- The new named size is backed by a `--sk-space-*` token and cites, by name, the Family 4 screen
  that justifies it (no speculative size).
- The border modifier's outer-box-unchanged claim is proven by a visual-regression snapshot, not
  asserted in a comment.
- The image axis ships with **no** CSS/behavior change to `::slotted(img)` itself, and its header
  comment's tie-boundary statement is generic in prose and computed-from-the-shipped-selector in
  any printed figure.
- The accessible-naming contract (`label` → `role="img"` + name; empty → `aria-hidden`) is
  provably unaffected by size, shape, border, or image presence — add or extend a test that
  proves this at the new axis combinations, not just the old ones.
- Invalid `size`, `shape`, and the new `border` values each warn via `console.warn` and fall back
  independently, without disturbing the other axes or projected content (mirrors the existing
  `entityMarkerSize`/`entityMarkerShape` pattern exactly).
- No user-visible literal string is introduced into `render()` (FR-012, #286 stays open and
  cross-cutting — this WP does not build a repo-wide gate for it).
- All ratchets (`expected-docs.json`, `behaviours.json`/`mutations.json`, `expected-stories.json`)
  are updated and their enforcing scripts pass; `expected-parts.json` is reviewed and left
  unchanged (no new `@csspart`).
- `SIZES.md` is regenerated from a **real** `dist/` build, never a stale local measure.
- `packages/react/src` and `packages/elements/vue.d.ts` regenerate cleanly (`--check` green); no
  hand-edit under either.

## Context & Constraints

- **C-001**: one Work Package, one PR. If mid-implementation the work genuinely does not fit,
  STOP and report rather than splitting silently.
- **C-002**: tokens-first. No raw hex/rgba/px anywhere in the new CSS. Size uses `--sk-space-*`;
  radius uses `--sk-radius-sm`/`--sk-radius-pill` (already the case); border uses
  `--sk-border-*`/`--sk-border-tint-*`.
- **C-003**: `packages/react/src` is generated — never hand-edit. Get the manifest (JSDoc on the
  new `border` property, widened `size` documentation) right and the wrapper follows.
- **C-004**: do not build a repo-wide "no user-visible literal in `render()`" gate — that is
  #286's deliverable. A component-scoped red-first test for `sk-entity-marker` specifically
  (the #308 precedent, registered in `behaviours.json`) is optional and only worth adding if the
  new axes introduce any render-time string risk — they should not, since size/shape/border are
  class-name/attribute driven.
- **C-005**: no CI check may assert shadow-vs-static cascade-**position** equality for the image
  rule. Appearance-equality checks (display/inline-size/block-size/object-fit) are fine and
  already effectively covered by the existing behaviour test's cover/clip assertions.
- **C-006**: `sk-entity-marker`'s `::slotted()` instruction is already discharged by ADR-15/#301's
  landing PR. This WP may only **update** that existing header comment if the new size/border
  modifiers change the demonstrated rewrite's specificity or worked example. It must not touch
  any of #311's six other named sheets (`sk-context-sidebar`, `sk-personal-rail`,
  `sk-section-header`, `sk-notice`, `sk-page-header`, `sk-nav-pill-drawer`) — those are out of
  scope entirely.
- **C-007**: binding non-goals — no `sk-avatar`; no Team/membership/identity model; no new
  component; no image fetch/crop/upload/loading-state/fallback chain; no initials generation from
  name/email; no presence/status/notification dot; no stacked/grouped marks; no hover cards.
- **C-008**: this mission may be implemented at ready-for-Lynn status per #300/#304. Never cite a
  Lynn product verdict anywhere in code comments, tests, stories, or the PR — none is recorded.
- **`.kittify/charter/charter.md`** is stale on Angular/SCSS framing (predates the elements-first
  pivot) — follow the ADRs and `docs/architecture/README.md` over it, per `plan.md`'s Charter
  Check section.
- Never hand-edit `kitty-specs/` or `.kittify/` artifacts outside the normal CLI/skill flow; this
  WP's own status transitions go through `spec-kitty agent tasks mark-status` / `move-task`, not
  manual file edits.
- Environment: `--skip-nx-cache` on anything used as a check; `timeout >= 400000` on any
  long-running build/test/gate invocation; never `rm -rf packages/tokens/dist`
  (`token-catalogue.json` is tracked inside that ignored dir) — only `rm -rf
  packages/styles/dist packages/elements/dist` if a clean styles/elements rebuild is needed.

## Branch Strategy

- **Strategy**: single_branch topology — planning artifacts were generated directly on
  `mission/entity-marker-size-border-image-axis`; completed changes commit to and merge from that
  same branch. There is no separate mission branch to cut and no worktree lane split for this WP
  (it is the only one).
- **Planning base branch**: `mission/entity-marker-size-border-image-axis`
- **Merge target branch**: `mission/entity-marker-size-border-image-axis`

> These fields are populated automatically by `spec-kitty agent mission tasks`. Do NOT change
> them manually.

## Subtasks & Detailed Guidance

### Subtask T001 – Resolve and add the new named size

- **Purpose**: Satisfy FR-001/FR-002: exactly one new named size, backed by a `--sk-space-*`
  token, justified by a named Family 4 screen, with the existing default and `sm` boxes left
  untouched.
- **Steps**:
  1. Re-read #304's evidence section (`gh issue view 304`) for the four marks and their screens:
     T1 account-avatar (top bar), T2 personal-mark, T1/T3 entity-glyph (workspace list, members
     table), T6 profile-avatar (a real image on the membership-detail page). Confirm which of
     these the existing default (`--sk-space-7` content + `--sk-space-1` padding) and `sm`
     (`--sk-space-5` content + `--sk-space-1` padding) already cover, and which screen has no
     existing size to reach for — per research.md's Decision on the size scale, this is expected
     to be T6's profile-avatar (a page-prominent image, not a compact list glyph).
  2. Pick the smallest `--sk-space-*` token from `packages/tokens/src/tokens.css`
     (`--sk-space-8` through `--sk-space-10` are the plausible range for a page-scale mark, one to
     two steps above the existing default's `--sk-space-7`) that gives a visually distinct,
     clearly-larger mark without inventing a size no screen needs. Name the modifier
     (`.sk-entity-marker--lg` is the natural BEM-consistent name unless the docs already use a
     different vocabulary elsewhere in this file's own family — check before committing to a
     name).
  3. Add the rule to `packages/styles/src/entity-marker/sk-entity-marker.css`, directly below
     `.sk-entity-marker--sm`, following its exact shape (`inline-size`/`block-size` only — padding
     stays the shared `--sk-space-1` unless T003's border work requires touching it).
  4. Add a one-line comment above the new rule naming the token and the justifying screen (e.g.
     `/* T6: membership-detail profile-avatar */`), so a future reader does not have to
     re-derive the justification from the issue.
- **Files**: `packages/styles/src/entity-marker/sk-entity-marker.css` (modified).
- **Parallel?**: No — everything else in this WP composes against the final size set.
- **Notes**: Do not add a second new size "while you're in there." FR-001 is explicit: "no
  speculative sizes are added." If the evidence genuinely supports two new sizes rather than one,
  stop and report rather than deciding unilaterally — this changes the WP's own scope claim.

### Subtask T002 – Widen the element's `size` property

- **Purpose**: Make the new CSS modifier reachable from the element's public API, exactly
  matching the existing `size`/`shape` reflect-and-fallback pattern.
- **Steps**:
  1. In `packages/elements/src/entity-marker/sk-entity-marker.ts`, widen the `EntityMarkerSize`
     type union to include the new value.
  2. Update `entityMarkerSize()` to accept the new value and keep warning-and-falling-back to
     `undefined` (default) for anything else — do not change its warning message shape
     (`unknown entity-marker size "<value>"; using default`), since the behaviour test asserts it
     verbatim.
  3. Update `render()`'s class-list ternary/template to add the new modifier class when
     applicable, following the existing `size === 'sm'` pattern exactly (extend to a small
     lookup/switch if a third size value makes the inline ternary unreadable — readability here
     is a judgment call, not a hard requirement).
  4. Update the `size` property's JSDoc comment to name both supported values (`sm` and the new
     one), since `check-manifest-content.mjs` copies this into the published manifest.
- **Files**: `packages/elements/src/entity-marker/sk-entity-marker.ts` (modified).
- **Parallel?**: No — depends on T001's CSS class name; blocks T004/T005/T008.
- **Notes**: Do not change `shape`'s existing behavior at all in this subtask — shape is already
  size-independent and needs no widening, only re-verification (folded into T004).

### Subtask T003 – Add the optional border modifier

- **Purpose**: Satisfy FR-004/FR-005/FR-006: an optional bordered presentation using existing
  border tokens, with an outer box identical to the unbordered form, remaining visible and
  distinguishing under forced-colors.
- **Steps**:
  1. In `packages/styles/src/entity-marker/sk-entity-marker.css`, add
     `.sk-entity-marker--bordered` (or the project's established border-modifier name if one
     exists elsewhere in this codebase — check `sk-card.css`/`sk-notice.css` for precedent before
     inventing a new naming convention).
  2. State the outer-box-preservation mechanism explicitly in a comment: since the marker is
     `box-sizing: content-box`, a naive `border` shorthand adds to the box. Compensate by
     reducing padding by the border's width on each side (padding stays token-driven — pick the
     border width from an existing `--sk-border-*` width token, and reduce the existing
     `--sk-space-1` padding by that amount using `calc()`, or restructure to `box-sizing:
     border-box` for this modifier only if that proves simpler — verify either approach against
     the actual computed `getBoundingClientRect()` before committing, per FR-004's "prove it
     visually" requirement, not assume the arithmetic is correct from the CSS alone).
  3. Use `border-color` (longhand, not the `border` shorthand) with a token from
     `--sk-border-tint-*` or `--sk-border-*`, per `docs/contributing/adding-a-component.md`'s
     forced-colors guidance on `declaration-strict-value` only policing longhand `-color`
     properties — verify `stylelint` passes on whatever form you choose.
  4. Confirm the border traces the circle's own radius when `--circle` is also applied — a
     border added as a separate box that ignores `border-radius` inheritance is a visible defect
     at the circle shape specifically; test this explicitly, don't assume it from the square case.
  5. Add the `border` reflected boolean (or string, if a future non-boolean border variant is
     anticipated — but do not build for a hypothetical; a boolean matches "optional border" from
     the issue text exactly) property to `sk-entity-marker.ts`, with its own fallback-and-warn
     function mirroring `entityMarkerSize`/`entityMarkerShape`, and wire it into `render()`'s
     class list.
- **Files**: `packages/styles/src/entity-marker/sk-entity-marker.css`,
  `packages/elements/src/entity-marker/sk-entity-marker.ts` (both modified).
- **Parallel?**: No — depends on T001 (must be provably unchanged at every size, so the size set
  must be final first).
- **Notes**: This is the subtask most likely to hide a silent geometry regression. Do not merge
  until T007's visual-regression proof exists and passes — an assertion in this subtask's own
  comment is not sufficient evidence per FR-004's explicit "prove it with a visual test rather
  than asserting it."

### Subtask T004 – Extend behaviour tests

- **Purpose**: Cover the new size and border axes with the same rigor
  `fixtures/elements-behaviour/src/sk-entity-marker.test.ts` already gives `size`/`shape` —
  geometry, independence, fail-open-with-warning, and interaction with existing content/naming.
- **Steps**:
  1. Extend the "size and shape compose as two independent presentation axes" test (or add a
     sibling test) to include the new size value in the case matrix, confirming it is strictly
     larger than default and composes correctly with both shapes.
  2. Extend "unknown values warn and fail open on only their own axis without losing content" to
     cover an invalid `border` value, mirroring the existing size/shape assertions (falls back to
     unbordered, warns exactly once, does not disturb size/shape/content).
  3. Add a new test (or extend "omitted axes preserve the current default square geometry")
     proving the border modifier does not change `geometryOf(element).width`/`.height` at every
     size/shape combination — this is the FR-004 outer-box-unchanged assertion in test form, not
     just the visual snapshot from T007. Both forms of proof are required; they check different
     things (a computed-style assertion catches a regression a snapshot's tolerance might miss,
     and vice versa).
  4. Extend "$label images cover and remain clipped in every size/shape combination" to also loop
     over the new size and the bordered/unbordered states, confirming `object-fit: cover` and
     clipping hold unchanged (FR-007 — no image-axis behavior change).
  5. Confirm the accessible-naming tests ("a trimmed non-empty label…", "an absent or blank
     label…") are unaffected by adding `size`/`shape`/`border` to their mount calls in at least
     one new assertion — the point is proving the naming contract's independence from every other
     axis, not just leaving the existing tests as-is.
- **Files**: `fixtures/elements-behaviour/src/sk-entity-marker.test.ts` (modified).
- **Parallel?**: Yes, alongside T005, once T001-T003 land.
- **Notes**: `scripts/check-behaviour-fixture-imports.mjs` enforces named-symbol imports from the
  element module, never the `@spec-kitty/elements` barrel — this file already follows that
  pattern; preserve it.

### Subtask T005 – Extend stories

- **Purpose**: Give the new axes visual, reviewable coverage per the issue's "Required stories
  and tests" section — every size × square/circle × bordered/unbordered; the image case at the
  new size; dark + `LightMode`; forced-colors.
- **Steps**:
  1. Extend `AxisMatrix` in `sk-entity-marker.stories.ts` to include the new size, both shapes,
     and both border states — this will grow from a 4-item matrix to a larger one; keep each
     item labelled with its own accessible name describing what it demonstrates (matching the
     existing "Default square"/"Compact square" labelling convention).
  2. Extend `ImageNaming` (or add a sibling story) to demonstrate the slotted `<img>` at the new
     size, confirming the existing cover/no-distortion behavior visually.
  3. Add a forced-colors story or extend an existing one to show the border modifier remaining
     visible — check whether this repo has an established forced-colors story pattern elsewhere
     (`sk-disclosure.stories.ts`, `sk-skip-link.stories.ts` per `docs/contributing/adding-a-component.md`'s
     citations) and follow it rather than inventing a new story-parameter shape.
  4. Confirm `CompactCircleLightMode` (or a renamed/extended equivalent) still asserts the
     computed value differs between themes, per `docs/contributing/adding-a-component.md`'s
     "Verify LightMode actually renders light styling" requirement — do not just add the class and
     assume it works.
- **Files**: `packages/elements/src/entity-marker/sk-entity-marker.stories.ts` (modified).
- **Parallel?**: Yes, alongside T004.
- **Notes**: New stories need entries in `expected-stories.json` (T008) — do not add a story and
  forget the ratchet, or CI will flag an uncounted addition.

### Subtask T006 – Re-verify and update the image-axis instruction

- **Purpose**: Satisfy FR-008/FR-009: confirm `::slotted(img)`'s existing behavior is unaffected
  (no CSS/behavior change), and update the CSS header comment's worked example and tie-boundary
  figure only if this WP's own new size/border selectors change what the comment currently
  documents for the bare rewrite.
- **Steps**:
  1. Re-read `packages/styles/src/entity-marker/sk-entity-marker.css`'s existing header comment
     in full — it already states the shadow-only classification, the structurally faithful
     rewrite (`.sk-entity-marker__content > img`), and the three-row tie-boundary table computed
     at `(0,1,1)`.
  2. Determine whether this WP's own docs/stories/tests demonstrate a **combined** selector — for
     example, a static consumer styling the image specifically inside the new larger size
     (`.sk-entity-marker__content > img` scoped under a size modifier class, e.g.
     `.sk-entity-marker--lg .sk-entity-marker__content > img`). If T001-T005 do not actually ship
     or demonstrate such a combined selector anywhere, the comment's existing `(0,1,1)` figure
     for the bare rewrite remains accurate and **no change is required** — do not manufacture a
     combined example just to exercise this subtask.
  3. If a combined selector IS demonstrated (e.g. in a story or doc example), compute its actual
     specificity by counting selector components (a class-modifier prefix adds one to the class
     count) and update the comment's worked example and printed tuple to match — verify the
     count by hand, do not guess. State the boundary rule's prose generically regardless
     ("strictly higher specificity than the shipped rewrite is required to override reliably; at
     a tie, last stylesheet wins; the shadow form would have yielded unconditionally") — this
     prose does not change even if the printed tuple does.
  4. Grep this WP's own diff (`git diff`) for any instance of `(0,1,1)` or `(0,2,1)` appearing
     outside this CSS comment — if found in a story, test, or doc file this WP authored, remove
     it and replace with the generic prose (per spec FR-009/SC-004's explicit ban on transcribing
     the figure into spec/plan/tasks prose — the same discipline applies to any new file this WP
     writes).
- **Files**: `packages/styles/src/entity-marker/sk-entity-marker.css` (comment-only edit, if any
  edit is needed at all — no selector or declaration change).
- **Parallel?**: No — depends on T001-T005 (needs to see the final shipped surface before
  deciding whether an update is even required).
- **Notes**: This is the subtask ADR-15 warns is "easy to get wrong." If in doubt about whether a
  demonstrated selector counts as "combined," err toward computing and stating it rather than
  assuming the bare figure still applies — a stale figure that no longer matches what a consumer
  would actually copy from this component's docs is worse than a verbose comment.

### Subtask T007 – Visual-regression proof for the border's unchanged outer box

- **Purpose**: Directly satisfy FR-004's "prove it with a visual test rather than asserting it."
- **Steps**:
  1. Add or extend a Playwright visual-regression spec (alongside the existing
     `apps/storybook/src/tests/visual.spec.ts` pattern for `sk-entity-marker-*` snapshots) that
     captures the bordered and unbordered presentations at the same size/shape side by side (or
     as paired before/after snapshots), so a reviewer or the pre-merge squad can see the outer
     box did not move.
  2. Generate the new baseline snapshot(s) through the project's normal snapshot-update flow —
     per this repo's own recorded pattern, visual baselines are **CI-authoritative**; do not run
     a local `--update-snapshots` and commit it as if verified. Follow whatever the repo's
     existing contribution flow documents for landing a new baseline (check
     `docs/contributing/adding-a-component.md`'s stories section and any CI workflow that runs
     `visual.spec.ts` for the sanctioned process), or explicitly flag in the PR that the new
     snapshot needs the CI run's own baseline before merge.
  3. Confirm the existing `sk-entity-marker-decorative-chromium-linux.png` and
     `sk-entity-marker-meaningful-chromium-linux.png` snapshots are unaffected (zero diff) by this
     WP's changes.
- **Files**: `apps/storybook/src/tests/visual.spec.ts` (extended), new snapshot file(s) under
  `apps/storybook/src/tests/visual.spec.ts-snapshots/`.
- **Parallel?**: No — depends on T001, T003, T005 (needs the final CSS, border modifier, and the
  stories that render both states).
- **Notes**: Do not treat a locally-generated snapshot as ground truth for merge purposes — per
  this repo's own pattern, harvest or confirm the PNG from the CI run's own artifact before
  treating this subtask as done.

### Subtask T008 – Update ratchets

- **Purpose**: Bring every ratchet file into exact agreement with the new surface, per
  `docs/contributing/adding-a-component.md` step 4.
- **Steps**:
  1. `expected-parts.json` — confirm no new `@csspart` was added (this WP adds classes and a
     property, not a new part); leave unchanged, but re-run its check to confirm.
  2. `expected-docs.json` — add the `border` attribute to `sk-entity-marker`'s row and bump
     `total` by exactly the count `check-manifest-content.mjs` reports after building the
     manifest; if the `size` enum widening changes any documented-value count that file tracks,
     update that too — do not guess the delta, run the check and read its failure message for
     the exact expected number.
  3. `behaviours.json` / `mutations.json` — if T004 added mutation-worthy test coverage for the
     border axis, add a matching mutation arm under the existing `sk-entity-marker` subject
     entry (same file, same shape as the existing size/shape arms) — do not create a new
     behaviour id; this remains a presentational-axis extension per
     `docs/contributing/adding-a-component.md`'s "purely presentational component owns none of
     them" guidance, unless the border axis genuinely introduces new interaction/keyboard/focus
     behavior (it should not).
  4. `expected-stories.json` — add every new story id from T005, bump `total`.
  5. Re-run each enforcing script listed in `docs/contributing/adding-a-component.md`'s ratchet
     table (`check-part-ratchet.mjs`, `check-manifest-content.mjs`, `floor-reporter.mjs`,
     `suite-selftest.mjs`) and confirm each passes before moving to T009.
- **Files**: `expected-docs.json`, `behaviours.json`, `mutations.json` (if applicable),
  `expected-stories.json` (all modified); `expected-parts.json` (reviewed, likely unchanged).
- **Parallel?**: No — depends on T001-T005, T007 (records the final surface).
- **Notes**: `expected-docs.json`'s equality check is exact in both directions — an
  under-counted or over-counted total fails CI regardless of which direction is wrong.

### Subtask T009 – Regenerate artifacts and run existing gates

- **Purpose**: Confirm every generated artifact reflects the new CSS/manifest and every existing
  gate passes, without inventing a new one.
- **Steps**:
  1. `rm -rf packages/styles/dist packages/elements/dist` (never `packages/tokens/dist` —
     `token-catalogue.json` lives there and is tracked).
  2. `npx nx run tokens:build --skip-nx-cache && npx nx run styles:build --skip-nx-cache && npx nx run elements:build --skip-nx-cache`
     (adjust target names if `npx nx show project <name> --json` reveals a different actual build
     target — do not guess).
  3. `node scripts/build-elements-css.mjs` and `node scripts/build-element-markup.mjs` if this
     component has generated static HTML (confirm first — per research.md Decision 3,
     `sk-entity-marker` has no markup module today; if that is still true, these scripts should
     report no work for this component).
  4. `node scripts/build-react-wrappers.mjs --check` and `node scripts/build-vue-types.mjs
     --check` — must be green with the widened manifest; if either drifts, run without `--check`
     to regenerate, then re-run `--check`.
  5. `node scripts/measure-elements-sizes.mjs` (or the project's actual invocation — confirm from
     `package.json`/CI workflow) against the **freshly built** `dist/`, never a stale one, to
     regenerate `packages/elements/SIZES.md`. This is enforced in two workflows — do not skip it
     even if the size change looks trivial.
  6. `npm run quality:all` (lint, stylelint, htmlhint) with `timeout >= 400000`.
  7. `npm run test` (or the project's Vitest invocation scoped to the touched fixture) with
     `timeout >= 400000`.
  8. `node scripts/check-part-ratchet.mjs`, `node scripts/check-manifest-content.mjs`,
     `node scripts/check-adopted-css-boundaries.mjs`, `node scripts/check-element-css-hygiene.mjs`
     — confirm each passes.
  9. `git status --porcelain` — confirm every generated-artifact change is one this WP intended
     (React wrappers, Vue types, SIZES.md, styles barrels) and nothing unexpected drifted.
- **Files**: none authored directly; regenerates `packages/react/src/**`,
  `packages/elements/vue.d.ts`, `packages/elements/SIZES.md`, and any generated CSS barrel under
  `packages/styles`.
- **Parallel?**: No — final verification pass, after T001-T008.
- **Notes**: Never end a turn with one of these long-running commands backgrounded and
  unmonitored — use `timeout >= 400000` rather than letting the harness auto-background a slow
  gate.

### Subtask T010 – Write the PR description

- **Purpose**: Let the tier-C pre-merge squad verify every FR without re-deriving this mission's
  reasoning.
- **Steps**: Write a PR body that:
  - States the ADR-15 split plainly: size/border frozen as equality-gated modifiers now; image
    axis frozen only as a documented instruction, quoting ADR-15's own #304 paragraph.
  - Lists FR-001 through FR-013 with a one-line "where satisfied" pointer (file + section/test
    name).
  - States explicitly whether T006 changed the CSS header comment's tie-boundary figure, and why
    (or why not).
  - Confirms the default and `sm` sizes are unchanged (cites the zero-diff snapshot result).
  - States the downstream contract this WP guarantees to #303, matching spec.md's "Downstream
    Contract for #303" section.
  - Notes the binding non-goals (no `sk-avatar`, no identity model) were not violated.
  - Notes: merges to `train/elements-first` in this repo do **not** auto-deploy production — this
    is the design-tooling repo, not Team Kitty's SaaS app (the "merges auto-deploy production"
    rule is specific to spec-kitty-saas and does not apply here).
  - Does not cite a Lynn product verdict anywhere (C-008).
- **Files**: none (PR body text, not a repo file).
- **Parallel?**: No — final subtask.

## Test Strategy

Behaviour tests (`fixtures/elements-behaviour/src/sk-entity-marker.test.ts`, extended in T004)
cover geometry, independence, fail-open/warn, naming-contract invariance, and image cover/clip at
every axis combination. Visual-regression snapshots (extended in T007) prove the border's
outer-box claim and catch any unintended shift to the existing default/`sm` presentations. Axe
accessibility checks run automatically via the Storybook a11y addon already wired into this
component's stories. No new permanent CI gate is added (C-004, C-005) — this WP's test additions
extend existing, already-enforced suites.

## Risks & Mitigations

- **Border geometry regression** (plan.md IC-02 risk): mitigated by requiring both a computed-
  style test (T004) and a visual-regression snapshot (T007) before this subtask is considered
  done — neither alone is sufficient evidence per FR-004.
- **Stale or mismatched tie-boundary figure** (plan.md IC-03 risk): mitigated by T006's explicit
  instruction to compute fresh from whatever selector this WP actually ships, and to grep the
  WP's own diff for a transcribed literal that doesn't match.
- **Speculative size creep**: mitigated by T001's explicit "no speculative sizes" check and the
  instruction to stop and report if the evidence seems to justify more than one new size.
- **Ratchet under/over-count**: mitigated by T008's instruction to run the enforcing script and
  read its exact expected number rather than estimating the delta.
- **Citing Lynn's verdict by accident**: mitigated by C-008 named in both Objectives and T010.

## Review Guidance

- Confirm the default and `sm` sizes are pixel-identical to before this mission (zero-diff
  snapshot).
- Confirm the new size is backed by a `--sk-space-*` token and a named Family 4 screen, and that
  no second speculative size was added.
- Confirm the border modifier's outer box is proven unchanged by both a computed-style test and a
  visual-regression snapshot, at every size/shape.
- Confirm no CSS/behavior change to `::slotted(img)` itself, and that the header comment's
  tie-boundary prose is generic while any printed figure is freshly computed, not transcribed
  from ADR-15.
- Confirm the accessible-naming contract is unaffected by every new axis combination.
- Confirm every ratchet file's enforcing script passes, and that `git status --porcelain` after a
  fresh build shows only intended generated-artifact changes.
- Confirm no user-visible literal was added to `render()`, and that no repo-wide #286 gate was
  built.
- Confirm "Lynn" does not appear as an approval citation anywhere in the diff.

## Activity Log

> **CRITICAL**: Activity log entries MUST be in chronological order (oldest first, newest last).

- 2026-09-10T09:51:00Z – system – Prompt created.

---

### Updating Status

Status is managed via `status.events.jsonl`. Use `spec-kitty agent tasks move-task WP01 --to
<status>` to change WP status, and `spec-kitty agent tasks mark-status T001 T002 ... --status done`
to record subtask completion.
