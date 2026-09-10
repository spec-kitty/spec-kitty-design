---
work_package_id: WP01
title: sk-pill-tag status-tone axis — source, proofs, ratchets
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
- C-011
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
planning_base_branch: mission/pill-tag-status-tone-axis
merge_target_branch: mission/pill-tag-status-tone-axis
branch_strategy: Planning artifacts for this mission were generated on mission/pill-tag-status-tone-axis (single_branch topology). During /spec-kitty.implement this WP commits directly on mission/pill-tag-status-tone-axis; completed changes stay on that branch for the mission's one PR unless the human explicitly redirects the landing branch.
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
phase: Phase 1 - the axis, its proofs, and its gates
history:
- at: '2026-09-10T09:48:23Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: ''
authoritative_surface: packages/elements/src/pill-tag/sk-pill-tag.markup.ts
create_intent:
- fixtures/elements-behaviour/src/sk-pill-tag.test.ts
execution_mode: code_change
model: ''
owned_files:
- packages/styles/src/pill-tag/sk-pill-tag.css
- packages/styles/src/pill-tag/sk-pill-tag.html
- packages/styles/src/pill-tag/index.ts
- packages/styles/src/pill-tag/sk-pill-tag.stories.ts
- packages/elements/src/pill-tag/sk-pill-tag.markup.ts
- packages/elements/src/pill-tag/sk-pill-tag.ts
- packages/elements/src/pill-tag/sk-pill-tag.css.js
- packages/elements/src/pill-tag/sk-pill-tag.css.d.ts
- packages/elements/src/pill-tag/sk-pill-tag.stories.ts
- packages/elements/custom-elements.json
- packages/elements/vue.d.ts
- packages/elements/SIZES.md
- packages/react/src/**
- fixtures/elements-behaviour/src/sk-pill-tag.test.ts
- behaviours.json
- mutations.json
- expected-docs.json
- expected-stories.json
- apps/storybook/src/tests/elements-load.spec.ts
- docs/design-system/using-components.md
role: implementer
tags: []
task_type: implement
tracker_refs:
- spec-kitty/spec-kitty-design#302
---

# Work Package Prompt: WP01 – sk-pill-tag status-tone axis

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or any
user-defined profile), and behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `` (none pinned — run `spec-kitty agent profile list` and select the best match for
  `implement` / `code_change` work on `packages/elements/**` and `packages/styles/**`)
- **Role**: `implementer`
- **Agent/tool**: unspecified

---

## Goal

Give the existing `sk-pill-tag` one reflected `status` axis, orthogonal to the existing `variant`
(brand) and `shape` (size) axes, carrying `status-tones.ts`'s six-tone vocabulary — the same
vocabulary `sk-card` already consumes (#146, #177, #216) — and prove it by test rather than by
comment. No new token (the `--sk-status-*` / `--sk-on-status-*` pair already exists from #177). No
new element. No change to `variant`, `shape`, `sk-status-indicator`, `sk-card`, or
`packages/styles/src/metric/sk-metric.css`. This is the mission's **only** Work Package — the issue
requires one bounded WP and one PR (C-001) — so it intentionally carries more subtasks than the
3-7 default: read plan.md's Complexity Tracking before objecting to its size.

Read `docs/contributing/adding-a-component.md` in full before starting, especially the `:host`
table near the top (rows on `container-type` and `::slotted()` do **not** apply to this component —
`sk-pill-tag.css`'s only `:host` rule is `display: inline-flex` — but the forced-colors and
`declaration-strict-value` sections in step 1 do). Read ADR-15
(`docs/architecture/decisions/2026-09-10-15-static-form-of-element-backed-css.md`)'s "#302" and
"#314" paragraphs before touching anything `::part()`-adjacent — you are not fixing the
`sk-metric.css:67` gap; you are being careful not to accidentally claim you did.

## What to build

1. **The vocabulary seam (T001).** In `packages/elements/src/pill-tag/sk-pill-tag.markup.ts`,
   mirror `sk-card.markup.ts`'s `CARD_STATUSES` exactly:
   ```ts
   import { STATUS_TONES, type StatusIndicatorTone } from '../status-indicator/status-tones.js';

   export const PILL_TAG_STATUSES: Readonly<Record<StatusIndicatorTone, string>> = Object.freeze(
     Object.fromEntries(STATUS_TONES.map((tone) => [tone, `sk-pill-tag--status-${tone}`])),
   ) as Readonly<Record<StatusIndicatorTone, string>>;

   export type PillTagStatus = StatusIndicatorTone;
   ```
   Add `isPillTagStatus()` using **`Object.hasOwn`**, never `in` — `sk-card.markup.ts`'s comment
   already records why (`in` reaches the prototype chain; `cardClasses('constructor')` emitted a
   native-code string into real markup). Add `unknownStatusMessage()` matching the existing
   `unknownVariantMessage`/`unknownShapeMessage` shape in this same file.

2. **The markup functions (T002).**
   - `pillTagClasses(variant?, shape?, status?)` gains a third parameter with the **same fail-open
     policy** the existing two parameters use: `status && !isPillTagStatus(status)` warns via
     `console.warn` and drops to `undefined` — **never throw** on this path. Use `status &&`, not
     `status !== undefined &&`, so `status=""` is silently treated as absent (mirrors `sk-card`'s
     `status=""` rule — an attribute present-but-empty is how a template writes "no status").
   - `PillTagStaticOptions` gains `status?: string`. `pillTagStaticHtml` **throws** on an unknown
     `status` — the build-time authoring path, where a bad value must not reach committed output —
     matching `cardStaticHtml`'s throw/warn split and its recorded rationale (a throw on the render
     path blanks the shadow root and eats the slotted label).
   - `PILL_TAG_AXES` gains one `Status<Tone>` entry per tone, **derived from `PILL_TAG_STATUSES`**
     the way `sk-card.markup.ts`'s `STATUS_AXES` is derived from `CARD_STATUSES` — never typed out
     by hand. `sk-pill-tag.markup.ts` stays evaluable in a bare Node process: the only import this
     module gains is the `status-tones.js` leaf; do not import anything else.

3. **The element (T003).** In `packages/elements/src/pill-tag/sk-pill-tag.ts`, add
   `status: { type: String, reflect: true }` to `static properties`, and a `declare status:` line
   with the **literal union spelled out inline**, not a `StatusIndicatorTone` alias — the same
   reason `sk-card.ts`'s own comment records: `build-vue-types.mjs` copies the manifest's type text
   verbatim into `packages/elements/vue.d.ts`, which imports nothing, so an alias would emit an
   unresolved identifier. Document the property with the same shape as `sk-card.ts`'s `status`
   doc comment: state it is orthogonal to `variant`/`shape`, that the vocabulary belongs to
   `sk-status-indicator`, that this element holds no domain mapping, and that an unknown value
   warns rather than throwing. Pass `this.status` as pill-tag's markup's third argument in
   `render()` — `pillTagClasses(this.variant, this.shape, this.status)`. Do **not** add a `role` or
   change accessible-name computation (FR-010): this axis is decoration only.

4. **The stylesheet (T004).** In `packages/styles/src/pill-tag/sk-pill-tag.css`, after the existing
   colour-variant block and before the eyebrow block, add:
   - Six `.sk-pill-tag--status-<tone>` rules, each setting exactly `background:
     var(--sk-status-<tone>)` and `color: var(--sk-on-status-<tone>)` — **no other property**, and
     no new token. Precede them with a comment stating the brand-vs-status precedence rule
     explicitly (equal specificity `(0,1,0)` to `.sk-pill-tag--<variant>`, authored **after** it, so
     while a status is present it supersedes the variant's `background`/`color` entirely) —
     mirroring `sk-card.css`'s equivalent block, including the "MEASURED, not assumed" framing.
   - A `@media (forced-colors: active)` block grouping all six status selectors and setting
     `border: var(--sk-border-width-2) solid;` with **no colour** — the browser remaps a plain
     border's colour automatically, and this component has no border of any kind today, so the
     block is load-bearing (not the redundant no-op `sk-card.css`'s own header comment warns
     against — there is nothing here for it to be redundant with). State in a comment that this
     makes all six tones mutually indistinguishable in this mode, which is an accepted consequence
     because tone is never the sole carrier of meaning (the slotted text is), matching `sk-card`'s
     documented equivalent.
   - **Measure and record contrast** for each tone, both themes: the pill's own text-on-surface
     pairing. Because this component sets `background` and `color` from the same pair, this is one
     measurement per tone, not two — plan.md's Design §5 has the token-level numbers already
     measured by #177's mission (reused because the token *values* are unchanged); **re-verify them
     against the real rendered pill** and record the result in a header comment in this file, in
     the same shape as the file's existing tint-contrast note (the one documenting the `green`/
     `purple`/`breaking`/`yellow` fix). All six must clear 4.5:1 (NFR-001) in both themes.
   - No reduced-motion block: this file sets no transition and this WP adds none.

5. **Regenerate everything generated (T005).** In order:
   ```bash
   node scripts/build-elements-css.mjs
   node scripts/build-element-markup.mjs
   npx nx run elements:analyze --skip-nx-cache
   node scripts/build-react-wrappers.mjs
   node scripts/build-vue-types.mjs
   rm -rf packages/tokens/dist packages/styles/dist packages/elements/dist
   npx nx run tokens:build --skip-nx-cache && npx nx run tokens:catalogue --skip-nx-cache
   npx nx run-many --target=build --projects=tokens,styles,elements --skip-nx-cache
   node scripts/measure-elements-sizes.mjs
   ```
   `packages/styles/src/pill-tag/sk-pill-tag.html` must regenerate **byte-identically** — the
   generator emits only the base form there, same as `sk-card`'s equivalent file; treat an
   unchanged diff on that file as expected, not as a skipped step.
   `packages/styles/src/pill-tag/index.ts` gains six new `SkPillTagStatus<Tone>HTML` exports.
   `git diff --exit-code -- packages/elements/custom-elements.json` must show only the new
   `status` attribute — no drift elsewhere.

6. **Behaviour tests (T006).** Create `fixtures/elements-behaviour/src/sk-pill-tag.test.ts` (this
   file does not exist yet — see `create_intent`). Import named symbols from
   `pill-tag/sk-pill-tag.markup.js` and `status-indicator/status-tones.js` **only** — never
   `@spec-kitty/elements` (enforced by `scripts/check-behaviour-fixture-imports.mjs`), plus a
   side-effect import of `pill-tag/sk-pill-tag.js` for the elements it instantiates. Cover:
   - **One vocabulary, order-pinned**: `Object.keys(PILL_TAG_STATUSES)` deep-equals `STATUS_TONES`,
     membership **and** order.
   - **Fail-open**: mount `<sk-pill-tag status="rogue">Label</sk-pill-tag>`, assert the class list
     is exactly `sk-pill-tag` (no status modifier), the slotted label survives, and exactly one
     `console.warn` fires naming the offending value.
   - **`status=""` is silently absent**: no warning, base class list.
   - **Static-authoring throw**: `pillTagStaticHtml({ status: 'rogue' })` throws.
   - **Precedence**: render `variant` + each `status`, and `status` alone; assert identical computed
     `background`/`color`. Render `shape="eyebrow"` + a `status`; assert both modifiers' declared
     properties are present (they are disjoint, so nothing is dropped).
   - **`[SC-010]`**: `status` assigned as a property *before* `sk-pill-tag`'s definition upgrades
     survives and reflects to the attribute — mirror `sk-card.test.ts`'s existing `[SC-010]` case.
   - **Both themes**: the status surface resolves differently under `.sk-light`, proving the light
     variance crosses the shadow boundary as a value, not a selector (mirrors the pattern the base
     `variant` fix already established in this file's sibling `sk-card.test.ts`).

7. **Registry (T007).** `behaviours.json`: add `sk-pill-tag` as a new subject of `SC-010` — its
   existing `SC-013`/`SC-014` subject entries (from #79) are unchanged. Write the note explaining
   *why* `SC-010` is new here (mirror `sk-card`'s own note: "`status` is its first reflected string
   property added since `SC-010` became a live obligation for this element; `variant` and `shape`
   predate that obligation and are not retroactively claimed"). `mutations.json`: one red-first arm
   against `packages/elements/src/pill-tag/sk-pill-tag.ts` flipping `status`'s `reflect: true` →
   `reflect: false`, reding `[SC-010]@fixtures/elements-behaviour/src/sk-pill-tag.test.ts`. Verify
   with `node scripts/suite-selftest.mjs` before moving on — guard 7 will reject a mutation whose
   `(id, subject)` pair isn't declared in `behaviours.json` first.

8. **Stories (T008).** In `packages/elements/src/pill-tag/sk-pill-tag.stories.ts` (element path),
   add coverage for every case the issue's "Required stories and tests" list names: all six tones;
   a brand-alone story (already exists — do not duplicate); brand × each status (or one composed
   grid story covering all combinations, documented as such); `shape="eyebrow"` combined with a
   status; a no-modifier-plus-status baseline; a long/wrapped-label story; an RTL/logical-layout
   story (`dir="rtl"` wrapper); a 200%-zoom story (viewport/zoom parameter or a fixed narrow
   container simulating it); a forced-colors documentation story; an `UnknownStatus` fail-open
   story; and extend the existing **`LightMode`** story (`class="sk-light"`, never
   `data-theme="light"`, per #93) to include at least one status tone. In
   `packages/styles/src/pill-tag/sk-pill-tag.stories.ts` (static path), add stories rendering from
   the **newly generated** `SkPillTagStatus<Tone>HTML` exports only — never hand-written markup —
   following the file's existing `label()` helper pattern (update the `MARKER` guard's usage sites
   if a status story's default content differs).

9. **Forced-colors assertion (T009).** In `apps/storybook/src/tests/elements-load.spec.ts`, add a
   case for `sk-pill-tag` mirroring `sk-card`'s existing forced-colors case: emulate
   `forced-colors: active` in both color schemes and assert a status-bearing pill's computed
   `border-width` is non-zero while a status-less pill's is `0px`.

10. **Ratchets (T010).** `expected-docs.json`: `sk-pill-tag.attributes` 2 → 3, bump `total` by 1
    (the check is **exact** in both directions). `expected-stories.json`: `sk-pill-tag`'s array
    gains the new story ids added in T008 — **verify each id against the built Storybook index**
    (`npx nx run storybook:storybook:build --skip-nx-cache`, then inspect `index.json`) before
    committing, and bump `total` by the same count. `expected-parts.json` is **unchanged** — no
    new `::part()` is added; the existing single `tag` part is untouched.

11. **Docs and gates (T011).** Update `docs/design-system/using-components.md` (or the component's
    own doc surface) to state the `status` axis: its six values, the fallback policy, and the
    boundary from C-006 (this mission makes no claim about the `sk-metric` `::part()` composition;
    that is #314's). Then run the **full** gate list in `docs/contributing/adding-a-component.md`
    §7, blocks 1–7, in order, including `npm run quality:all`, `node scripts/typecheck-all.mjs`,
    `npm run test`, `node scripts/suite-selftest.mjs`, and
    `npx nx run storybook:storybook:build && node scripts/run-axe-storybook.js`. Commit every
    generated artifact block 1–2 produced; `git status --porcelain` must be empty before the PR
    opens.

## Constraints

- **No new token.** `--sk-status-<tone>` / `--sk-on-status-<tone>` already exist in both blocks of
  `packages/tokens/src/tokens.css` (from #177). Touch nothing in `packages/tokens/`.
- **No new component, no new part.** No `sk-status-badge`; the existing single `tag` part is
  untouched.
- **`sk-metric.css` is out of scope**, even to "fix" the `::part(tag)` gap ADR-15/#314 describe.
  Nothing in this WP may edit `packages/styles/src/metric/sk-metric.css`, and no doc/story/test
  this WP produces may claim the static pill-tag composes into `sk-metric`'s annotation
  equivalently to the element form (C-006).
- **No domain vocabulary.** Private / Holder / Active / Expired / Revoked / Exhausted labels and
  their tone mapping belong to Team Kitty; this WP ships no such mapping, and no story should use
  those exact labels as if this library owned them (use generic labels like "Active"/"Revoked" only
  as illustrative copy, the way the existing `variant` stories use "SemVer"/"Breaking").
- **No interactive affordance, no `role`, no accessible-name change.** Tone is decoration only.
- **No `render()` gate.** #286 is open and unenforced repo-wide; do not build one here (C-011).
  This WP's own `render()` diff is a class-list computation only — verify by review that no text
  node is added.
- Commit scopes: `styles`, `elements`, `docs` (unscoped `docs:` for documentation-only lines) —
  never `specs` or `adr`.

## Definition of Done

- `node scripts/build-elements-css.mjs --check`, `node scripts/build-element-markup.mjs --check`,
  `node scripts/build-react-wrappers.mjs --check`, `node scripts/build-vue-types.mjs --check`,
  `node scripts/measure-elements-sizes.mjs --check`, and
  `git diff --exit-code -- packages/elements/custom-elements.json` all pass.
- `node scripts/check-manifest-content.mjs`, `node scripts/check-no-css-in-source.mjs`,
  `node scripts/check-elements-entries.mjs`, `node scripts/check-adopted-css-boundaries.mjs`,
  `node scripts/check-element-css-hygiene.mjs`, `node scripts/check-part-ratchet.mjs`,
  `node scripts/check-story-theme-wrapper.mjs`, `node scripts/check-gate-wiring.mjs`, and
  `node scripts/typecheck-all.mjs` all pass.
- `npm run quality:all` (ESLint, Stylelint, HTMLHint) passes.
- `npm test` and `node scripts/suite-selftest.mjs` are green, with the new `[SC-010]@sk-pill-tag`
  mutation arm reported red-first.
- `npx nx run storybook:storybook:build --skip-nx-cache && node scripts/run-axe-storybook.js`
  reports zero violations across the new stories.
- Every measured contrast ratio recorded in T004 meets NFR-001's 4.5:1 threshold, in both themes,
  for all six tones.
- The forced-colors assertion from T009 passes in both color schemes.
- `git status --porcelain` is empty before the PR opens.
- No file outside this WP's `owned_files` was modified; if a small, justified out-of-map edit was
  necessary, it is recorded with a one-line rationale in the PR description.
