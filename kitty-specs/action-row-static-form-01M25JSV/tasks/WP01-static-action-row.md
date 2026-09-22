---
work_package_id: WP01
title: sk-action-row static form — two-element wrapper markup, parity proofs, docs
dependencies: []
requirement_refs:
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
- C-007
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
- FR-021
- FR-022
- FR-023
- FR-024
- FR-025
planning_base_branch: mission/action-row-static-form
merge_target_branch: mission/action-row-static-form
branch_strategy: Planning artifacts for this mission were generated on mission/action-row-static-form. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/action-row-static-form unless the human explicitly redirects the landing branch.
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
phase: Phase 1 - the wrapper, its parity proofs, and its gates
history:
- at: '2026-09-10T12:06:48Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: ''
authoritative_surface: packages/elements/src/action-row/sk-action-row.markup.ts
create_intent:
- packages/elements/src/action-row/sk-action-row.markup.ts
- packages/elements/src/action-row/sk-action-row-html.stories.ts
- packages/styles/src/action-row/sk-action-row.html
- packages/styles/src/action-row/index.ts
execution_mode: code_change
model: ''
owned_files:
- packages/elements/src/action-row/sk-action-row.markup.ts
- packages/elements/src/action-row/sk-action-row-html.stories.ts
- packages/styles/src/action-row/sk-action-row.html
- packages/styles/src/action-row/index.ts
- packages/elements/custom-elements.json
- packages/elements/vue.d.ts
- packages/elements/SIZES.md
- packages/react/src/**
- fixtures/elements-behaviour/src/sk-action-row.test.ts
- apps/storybook/src/tests/elements-load.spec.ts
- expected-docs.json
- expected-parts.json
- behaviours.json
- mutations.json
- docs/design-system/using-components.md
role: implementer
tags: []
task_type: implement
tracker_refs:
- spec-kitty/spec-kitty-design#307
---

# Work Package Prompt: WP01 – sk-action-row static form

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or any
user-defined profile), and behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `` (none pinned — run `spec-kitty agent profile list` and select the best match for
  `implement` / `code_change` work on `packages/elements/**`, `packages/styles/**` and
  `fixtures/elements-behaviour/**`)
- **Role**: `implementer`
- **Agent/tool**: unspecified

---

## Goal

Give `sk-action-row` the ONE thing it is missing: a server-renderable static form, frozen in the
**two-element wrapper** shape ADR-15 ruled for host-owned `container-type`
(`docs/architecture/decisions/2026-09-10-15-static-form-of-element-backed-css.md`, "2. Host-owned
`container-type`"), never a single-element collapse. `sk-action-row.css` is **already correct and
already documents the contract** (its header comment, shipped by #301/#312) — this WP does not
touch that file. What does not exist yet is the one authored markup module ADR-10 §3 requires
(`sk-action-row.markup.ts`), the generated static HTML/index.ts it drives, and the proofs that the
static form is a real parity match for the shadow form rather than a visual approximation. This is
the mission's **only** Work Package — the issue requires one bounded WP and one PR (C-001) — so it
intentionally carries more subtasks than the 3-7 default: read plan.md's Implementation Concern Map
before objecting to its size.

Read, in full, before starting:
- `docs/contributing/adding-a-component.md`, especially the `:host` table and the
  `container-type`/wrapper section (lines ~48-135) — this is the one component in the repo that
  section is written about.
- ADR-15's `#307`-specific paragraph under "Which gated children may freeze a static API" — it is
  the binding ruling for this WP, not just background.
- `packages/styles/src/action-row/sk-action-row.css` lines 1-38 (the header comment) — the exact
  literal `.sk-action-row-host` block you reuse verbatim in T003 and T009.
- `packages/elements/src/action-row/sk-action-row.ts` in full — the shadow form's DOM shape
  (trigger/controls sibling relationship, `aria-current` branching, slot-presence hiding) is what
  every part of this WP reproduces structurally.
- Issue #272 (closed) — the sibling-not-descendant rule this WP's T004 encodes.
- Issue #283 (open) — read it live, do not trust a summary; confirm your own understanding matches
  spec.md's "Boundary with #283" section before writing the PR description in T011.

## What to build

1. **The markup module (T001).** Create `packages/elements/src/action-row/sk-action-row.markup.ts`
   — evaluated in a bare Node process by `build-element-markup.mjs`, so import nothing beyond a
   leaf module (this component needs none). Export:
   - `ACTION_ROW_VARIANTS = {}` — action-row has no mutually-exclusive variant enum (unlike
     `sk-card`'s `blue`/`purple`); the generator requires the export even when empty (see
     `sk-grid.markup.ts`'s comment on exactly this — `?? {}` cannot distinguish "no variants" from
     "wrong export name").
   - `ACTION_ROW_AXES`, a `Record<string, ActionRowStaticOptions>` with at minimum `Card: { layout:
     'card' }`, `Flush: { presentation: 'flush' }`, and `Link: { href: '#' }` (mirroring
     `BUTTON_AXES.Link` in `sk-button.markup.ts` — the anchor branch is the one every real Team
     Kitty row uses).
   - `ActionRowStaticOptions`: `{ layout?: 'card'; presentation?: 'flush'; href?: string; current?:
     boolean }`. Name the current-row flag `current`, not `selected` — the static form has no
     activation concept to select *from*, and the name should not imply one exists.
   - `isActionRowLayout()` / `isActionRowPresentation()` using **`Object.hasOwn`**, never `in`
     (`sk-card.markup.ts`'s comment records why: `in` reaches the prototype chain and a value like
     `"constructor"` would emit a native-code string into real markup).
   - `actionRowClasses(layout?, presentation?)` — **warns and degrades** on an unrecognised value
     (fail-open, matching `cardClasses`/`buttonClasses`/`gridClasses`'s documented policy: this is
     the render path, and a throw there would blank a shadow root — even though this specific
     function only ever runs at static-authoring time today, keep the same two-policy discipline
     the recipe requires so a future caller on the render path is safe by construction).
   - `actionRowStaticHtml(opts: ActionRowStaticOptions = {}, content?)` — **an options object, not
     positionals** — **throws** on an unrecognised `layout`/`presentation` (the authoring-time
     policy: a bad value must not reach committed output). Produces:
     ```html
     <div class="sk-action-row-host">
       <div class="sk-action-row{ --card}{ --flush}"{ aria-current="true" iff current && !href}>
         <a class="sk-action-row__trigger" href="…" aria-labelledby="sk-action-row-title"{ aria-current="page" iff current && href}>
           …scan content…
         </a>
         <!-- OR, when href is blank: -->
         <div class="sk-action-row__trigger sk-action-row__trigger--static">…scan content…</div>
         <div class="sk-action-row__controls">…</div>  <!-- only when controls content supplied -->
       </div>
     </div>
     ```
     **Never** a `<button>` trigger — there is no listener without the custom element (FR-010); this
     is a documented non-goal, not an oversight. `aria-current` is **omitted entirely** when not
     current — never emit `aria-current="false"` (mirrors the element's own `nothing`-sentinel
     behaviour in `sk-action-row.ts`'s `render()`).
   - `content` shape: accept a structured options bag for the scan-content parts — `{ mark?, title,
     reference?, tags?, metadata?, supporting?, controls? }`, `title` mandatory (the one part the
     issue never marks optional), everything else optional. **Each optional part's wrapper element
     is omitted entirely when its content is blank** — never rendered empty (FR-013; this is the
     static form's only way to express "absent", since there is no `#syncSlot()` script to toggle
     `hidden`). Reuse `sk-button.markup.ts`'s `attr()` HTML-escaping helper (copy, not import —
     `sk-button.markup.ts` documents why this stays local until #163) for the `href` attribute; a
     parsing-based test in T003 verifies it, not substring matching.
   - `unknownLayoutMessage()` / `unknownPresentationMessage()` diagnostics, matching the shape of
     every sibling markup module's equivalent functions.

2. **Styles-layer stories file (T002).** Create
   `packages/elements/src/action-row/sk-action-row-html.stories.ts` (confirm this exact naming
   against the nearest static-form precedent — `sk-button.stories.ts` plus its static-path sibling
   — before committing to the filename; the generator's glob and Storybook's own file discovery
   must agree). Do not hand-write markup in it — render exclusively from
   `ACTION_ROW_AXES`-generated exports and from `actionRowStaticHtml()` calls, per ADR-10 §3 ("no
   markup authored twice").

3. **Regenerate everything generated (T003).** In order:
   ```bash
   node scripts/build-elements-css.mjs
   node scripts/build-element-markup.mjs
   npx nx run elements:analyze --skip-nx-cache
   node scripts/build-react-wrappers.mjs
   node scripts/build-vue-types.mjs
   rm -rf packages/tokens/dist packages/styles/dist packages/elements/dist
   npx nx run tokens:build --skip-nx-cache
   npx nx run-many --target=build --projects=tokens,styles,elements --skip-nx-cache
   node scripts/measure-elements-sizes.mjs
   ```
   `packages/styles/src/action-row/sk-action-row.html` and `index.ts` are generated from
   `sk-action-row.markup.ts` for the **first time** — they do not exist before this WP. Confirm
   `git diff --exit-code -- packages/elements/custom-elements.json` shows **no** diff: this markup
   module adds no new attribute, method or `@csspart` to the custom element's manifest (it is a
   separate authored source, not a change to `sk-action-row.ts`). If it does show a diff, that is a
   signal the design drifted from plan.md's IC-06 expectation — stop and reconcile before
   proceeding, do not silently accept a ratchet change.

4. **Reflow parity test (T004).** In `fixtures/elements-behaviour/src/sk-action-row.test.ts`, add a
   test block following the existing sized-frame pattern from
   `fixtures/elements-behaviour/src/sk-app-shell.test.ts` (`frame.style.width = …; await …;
   getComputedStyle(...)`):
   - Mount the real `<sk-action-row>` (representative slotted content, one trailing control) in one
     sized frame; mount the static two-element markup (via `actionRowStaticHtml()`, equivalent
     content) in a second sized frame, with the `.sk-action-row-host` CSS block authored **locally
     in the test** (the same four declarations from `sk-action-row.css`'s header comment) plus the
     real built `sk-action-row.css` adopted — reproducing exactly what a real consumer does per
     ADR-15/FR-005.
   - At 360px, 400px and 401px: assert `flex-wrap` on the row and `grid-template-columns`/
     `grid-template-areas` on the trigger are equal between the two forms, and specifically that
     400px reads `wrap` while 401px keeps the three-column trigger areas — the exact boundary
     ADR-15's own measurement used to catch the collapsed-form defect (do not hardcode a literal
     grid-track string transcribed from ADR-15's tables; compute and compare within this test's own
     run, since sub-pixel values are not portable across engines).
   - Add one assertion pinning the test's local `.sk-action-row-host` CSS block textually equal
     (order-insensitive on declarations) to the block in `sk-action-row.css`'s header comment, so
     the two copies cannot silently diverge before #309 replaces the hand-authored one.
   - Add one assertion that `actionRowStaticHtml()` and `buttonStaticHtml`-style escaping both
     reject/escape a hostile `href` (parse the output, assert no attribute breakout — matching
     `sk-button.markup.ts`'s own documented test approach).

5. **Structural sibling-not-descendant test (T005).** For every generated exemplar with controls
   content, assert `container.querySelector('.sk-action-row__trigger .sk-action-row__controls') ===
   null` AND that `.sk-action-row__controls` exists as a **direct sibling** of the trigger under
   `.sk-action-row` (#272's load-bearing rule, restated as this mission's own). Run the same query
   against the real element's shadow root as a control, proving the two forms agree structurally.

6. **Absent-state tests (T006).** One test per axis, each asserting the ABSENT case as explicitly
   as the present case (the #308 defect-pattern lesson — a leaked class or attribute must actually
   fail the assertion, not merely look closed):
   - `aria-current`: `hasAttribute('aria-current')` is `false` (never `getAttribute(...) ===
     'false'`) when not current, for both the row (non-route) and the anchor (route) cases.
   - Flush: read `getComputedStyle` for `background-color`/`border-width` in both the flush and
     bordered states — do not trust class-list membership alone.
   - Optional parts (mark/reference/tags/metadata/supporting): `querySelector('.sk-action-row__<part>')`
     is `null` when no content was supplied for that part — not merely visually empty.
   - Controls: `querySelector('.sk-action-row__controls')` is `null` when no controls content was
     supplied — no `hidden` attribute, the element is absent from the DOM entirely.

7. **Keyboard and target-size test (T007).** For a route-mode row with two trailing controls,
   assert: the anchor and each control are distinct, DOM-order tab stops; each interactive target's
   `getBoundingClientRect()` width/height is ≥44px at both a ≤400px frame and a desktop frame width.

8. **Stories (T008).** In `sk-action-row-html.stories.ts` (styles layer, T002's file), cover the
   issue's full required matrix for the static form: one row and a collection; with/without a mark;
   with/without metadata, tags and supporting content; one trailing control and several; no
   trailing control; route mode with trailing controls beside it; `aria-current`; long identifiers
   and long email addresses; narrow (≤400px) and desktop widths shown side by side with the shadow
   form for visual comparison; default dark plus required **`LightMode`** (`class="sk-light"`, never
   `data-theme="light"`, per #93 — verify the computed value actually differs between themes, do
   not assume); a single-row fragment rendered alone with no surrounding collection markup (FR-015
   proof — Family 4's T4 use case).

9. **Forced-colors, RTL, zoom, reduced-motion (T009).** These states are inherited unchanged from
   the shared, unmodified `sk-action-row.css` (its `@media (forced-colors: active)` and
   `@media (prefers-reduced-motion: reduce)` blocks already exist and this WP edits neither), so
   the work here is **verification, not new CSS**: add stories/assertions proving the static form
   receives the same treatment as the shadow form —
   - forced-colors story (documentation), and a `apps/storybook/src/tests/elements-load.spec.ts`
     case mirroring the existing pattern for other components, asserting the static form's
     `aria-current` row keeps its forced-colors border treatment;
   - a reduced-motion assertion that the row's background/border-color transition does not animate
     in the static form (same mechanism as the shadow form — the sheet is shared);
   - an RTL/logical-layout story (`dir="rtl"` wrapper) and a 200%-zoom story with the long-content
     fixture from T008, asserting no document-level horizontal overflow (NFR-004).

10. **Ratchets (T010).** Run `node scripts/check-manifest-content.mjs` and
    `node scripts/check-part-ratchet.mjs` and confirm both `expected-docs.json` and
    `expected-parts.json` need **no change** — this markup module adds no new attribute, method or
    `@csspart` (see T003's note). Confirm at the same time whether the new tests in T004-T007 need a
    `behaviours.json`/`mutations.json` entry: they do **not** correspond to any id on ADR-11's
    required-behaviours list (they are this mission's own parity/structural/absent-state bar, not a
    form-association/event/focus contract), so the expectation is **no new entry**. If either
    ratchet turns out to need a change, stop and reconcile against plan.md's IC-06 rather than
    silently accepting it.

11. **Docs, boundary statement, and gates (T011).** Add the static-form usage note to
    `docs/design-system/using-components.md`: the two-element markup shape, the literal
    `.sk-action-row-host` CSS block (word-for-word identical to `sk-action-row.css`'s header
    comment and to T004's pinned test copy), and the explicit sentence that this block does **not**
    ship as package CSS until #309 lands. State the `#283` boundary in the PR description using the
    prose already committed in `spec.md`'s "Boundary with #283" section (FR-018) — do not
    paraphrase it differently there. Then run the full gate list in
    `docs/contributing/adding-a-component.md` §7, blocks 1-7 in order, including
    `npm run quality:all`, `node scripts/typecheck-all.mjs`, `npm run test`,
    `node scripts/suite-selftest.mjs`, and
    `npx nx run storybook:storybook:build && node scripts/run-axe-storybook.js`. Commit every
    generated artifact blocks 1-2 produced; `git status --porcelain` must be empty before the PR
    opens.

## Constraints

- **No `.sk-action-row-host` CSS shipped in any package stylesheet.** That generator output is
  #309's scope, gated by #310 (C-002). This WP's only copies of the literal block live in a test
  assertion (T004) and in documentation (T011), both textually pinned to
  `sk-action-row.css`'s header comment.
- **`sk-action-row.css` stays unmodified.** Its header comment and `@container` rule already ship
  via #301/#312 (C-003). Nothing in this WP edits that file.
- **No `<button>`-trigger static equivalent.** The static form's only two trigger shapes are the
  route anchor and the static div (FR-010) — do not add a third to "complete" the parity; it would
  promise an activation contract the static form cannot keep without JavaScript.
- **No repo-wide `#286` literal-check gate** (C-004) — this WP's own `render`/`staticHtml` diff
  introduces no user-visible string beyond caller-supplied content, verified by review, not by a
  new enforcement mechanism.
- **`.sk-record-list` / `#283` untouched** (C-005) — no file under that component's surface is
  edited; the boundary is prose only, in spec.md and the PR body.
- **Commit scopes**: `elements`, `styles`, `docs` (unscoped `docs:` for documentation-only
  commits) — never `specs`, never `adr`, and `spec-kitty` is not a scope (C-007). Verify with:
  ```bash
  git show origin/train/elements-first:commitlint.config.cjs > /tmp/cfg307.cjs
  npx commitlint --config /tmp/cfg307.cjs --from=origin/train/elements-first --to=HEAD
  ```

## Definition of Done

- `node scripts/build-element-markup.mjs --check`, `node scripts/build-elements-css.mjs --check`,
  `node scripts/build-react-wrappers.mjs --check`, `node scripts/build-vue-types.mjs --check`,
  `node scripts/measure-elements-sizes.mjs --check`, and
  `git diff --exit-code -- packages/elements/custom-elements.json` all pass, the last with **zero**
  diff.
- `node scripts/check-manifest-content.mjs`, `node scripts/check-no-css-in-source.mjs`,
  `node scripts/check-elements-entries.mjs`, `node scripts/check-adopted-css-boundaries.mjs`,
  `node scripts/check-element-css-hygiene.mjs`, `node scripts/check-part-ratchet.mjs`,
  `node scripts/check-story-theme-wrapper.mjs`, `node scripts/check-gate-wiring.mjs`, and
  `node scripts/typecheck-all.mjs` all pass.
- `npm run quality:all` (ESLint, Stylelint, HTMLHint) passes.
- `npm test` and `node scripts/suite-selftest.mjs` are green.
- The reflow-parity test (T004) fails if run against a deliberately collapsed single-element form
  (verify this once locally during development, then leave the two-element wrapper in place) —
  demonstrating the test actually discriminates rather than passing by construction.
- The sibling-not-descendant test (T005) and every absent-state assertion (T006) pass, and each was
  confirmed to fail against a deliberately broken fixture at least once during development.
- `npx nx run storybook:storybook:build --skip-nx-cache && node scripts/run-axe-storybook.js`
  reports zero violations across the new stories.
- `git status --porcelain` is empty before the PR opens.
- No file outside this WP's `owned_files` was modified; if a small, justified out-of-map edit was
  necessary, it is recorded with a one-line rationale in the PR description.
- The PR description states the `#283` boundary verbatim from spec.md and the "wrapper CSS does not
  ship until #309" note verbatim from the docs added in T011.

## Activity Log

- 2026-09-10T13:26:57Z – claude – T002 frontmatter (owned_files/create_intent) names packages/elements/src/action-row/sk-action-row-html.stories.ts for the styles-layer story file. Verified against actual repo convention before authoring: every existing *-html.stories.ts (sk-button-html, sk-card-html, sk-feature-card-html, sk-data-table-html, and 21 others — 25 total) lives under packages/styles/src/<name>/, never packages/elements/src/<name>/, and eslint.config.mjs's depConstraints forbid scope:styles from depending on scope:elements at all, which a file physically inside packages/elements/src/action-row/ would not by itself violate but which the generator/story-discovery convention already treats as a packages/styles surface. Placed the file at packages/styles/src/action-row/sk-action-row-html.stories.ts instead, matching precedent and T002's own prose ('styles-layer stories file'). The frontmatter path is the one entry that does not match the file actually created; everything else in owned_files/create_intent is unchanged.
