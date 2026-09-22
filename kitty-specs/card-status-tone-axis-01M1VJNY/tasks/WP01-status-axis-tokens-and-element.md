---
work_package_id: WP01
title: The status axis — tokens, stylesheet, markup module and element
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
- C-001
- C-002
- C-003
- C-004
- C-006
- C-007
planning_base_branch: mission/card-status-tone-axis
merge_target_branch: mission/card-status-tone-axis
branch_strategy: Planning artifacts for this mission were generated on mission/card-status-tone-axis. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/card-status-tone-axis unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
phase: Phase 1 - the axis
history:
- at: '2026-09-06T12:00:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: ''
authoritative_surface: packages/elements/src/card/sk-card.markup.ts
create_intent: []
execution_mode: planning_artifact
model: ''
owned_files:
- packages/tokens/src/tokens.css
- packages/tokens/dist/token-catalogue.json
- packages/styles/src/card/sk-card.css
- packages/elements/src/card/sk-card.markup.ts
- packages/elements/src/card/sk-card.ts
- packages/elements/src/card/sk-card.css.js
- packages/elements/src/card/sk-card.css.d.ts
- packages/elements/src/status-indicator/sk-status-indicator.ts
- packages/elements/src/index.ts
- packages/styles/src/card/sk-card.html
- packages/styles/src/card/index.ts
role: implementer
tags: []
task_type: feature
tracker_refs:
- spec-kitty/spec-kitty-design#177
---

# Work Package Prompt: WP01 – The status axis

## Goal

Give the existing `sk-card` one reflected `status` axis, orthogonal to `variant`, carrying #146's
six-tone vocabulary, and land the `--sk-status-*` / `--sk-on-status-*` semantic token category it
needs. No new element. No change to `variant` or `inset`.

## What to build

1. **The vocabulary seam (T001).** Export the ordered frozen tone array that already exists at
   `packages/elements/src/status-indicator/sk-status-indicator.ts:14` — additively, renaming the
   module-private `TONES` to an exported `STATUS_TONES` and keeping `statusTone()` reading from it,
   so #146's behaviour is byte-equivalent. Re-export it from `packages/elements/src/index.ts`.
   **Do not** restate the list there; the array is the one authored copy.

2. **Tokens (T002).** In **both** blocks of `packages/tokens/src/tokens.css`, in one commit:
   - `--sk-surface-tint-rose` (`#2B1515` dark / `#F8E5E5` light) and `--sk-on-tint-rose`
     (`var(--sk-color-red)` dark / `#6B2424` light) — completing the existing tint family from the
     existing `--sk-color-red` hue. No other new colour value.
   - `--sk-border-width-4: 4px` in the single `:root` width block (theme-invariant, beside `-1`
     and `-2`), for the edge treatment.
   - `--sk-status-<tone>` and `--sk-on-status-<tone>` for all six tones, **as aliases** —
     `neutral→--sk-surface-muted`/`--sk-fg-muted`, `info→sky`, `success→mint`,
     `attention→butter`, `danger→rose`, `recovery→lilac` — declared in both blocks so neither
     theme is half-populated (#93).
   Regenerate `packages/tokens/dist/token-catalogue.json`.

3. **The markup module (T003).** In `packages/elements/src/card/sk-card.markup.ts`, beside
   `CARD_VARIANTS`:
   - `CARD_STATUSES` — the status→BEM map, `sk-card--status-<tone>` per tone.
   - `isCardStatus()` using **`Object.hasOwn`**, never `in` — the file already records why
     (`in` reaches the prototype chain and `cardClasses('constructor')` emitted a native-code
     string into real markup).
   - `cardClasses(variant?, inset?, status?)` — third parameter, **same fail-open policy**: warn
     once, drop the status, return the base card. **Never throw**; the file already records that a
     throw blanks the shadow root and eats the slotted children.
   - `CardStaticOptions.status?: string` and `cardStaticHtml` **throwing** on an unknown status —
     the authoring path, where a bad value must not reach generated output.
   - `CARD_AXES` gains one entry per tone, **derived from `CARD_STATUSES`** rather than typed out.
   The module stays a **leaf**: no relative imports. The generator evaluates it from a `data:` URL
   and fails by name on one.

4. **The element (T004).** Add `status: { type: String, reflect: true }` to `static properties`,
   a documented `/** */` for it (the analyzer publishes it and `check-manifest-content.mjs`
   refuses an undocumented attribute), and pass `this.status` to `cardClasses`. The field
   annotation must be the **literal union**, not a type alias — `build-vue-types.mjs` copies the
   manifest's type text verbatim into `vue.d.ts`, which imports nothing. Say so in a `//` comment
   at the site, not in the doc comment.

5. **The stylesheet (T005).** In `packages/styles/src/card/sk-card.css`, after the existing variant
   and inset blocks, one `.sk-card--status-<tone>` rule per tone setting
   `background: var(--sk-status-<tone>)`, `border-color: var(--sk-on-status-<tone>)` and
   `border-inline-start-width: var(--sk-border-width-4)`. **No theme selector** — light variance is
   entirely in the tokens (ADR-9 §3).
   - `@media (forced-colors: active)`: `border-inline-start-color: CanvasText` on the status
     modifier, on the **LONGHAND** policed property, following `sk-action-row.css` and
     `sk-skip-link.css`. The card must not depend on `background-color` to stay distinguishable.
   - `@media (prefers-reduced-motion: reduce)`: `transition: none` scoped to `.sk-card`, the exact
     selector and property this component owns.

6. **Regenerate (T006).** `build-elements-css.mjs`, `build-element-markup.mjs`,
   `elements:analyze`, `build-react-wrappers.mjs`, `build-vue-types.mjs`, then a real
   `nx run-many --target=build --projects=tokens,styles,elements --skip-nx-cache` followed by
   `measure-elements-sizes.mjs`. Commit every generated artifact.

## Constraints

- `sk-card.html` holds only the base form, so it regenerates **byte-identically**. That is expected,
  not a skipped step. `packages/styles/src/card/index.ts` gains six exports.
- No `sk-status-card`. No domain→tone mapping. No new brand hue.
- `.sk-facts` / `.sk-disclosure` belong to #176 and are not edited.

## Definition of done

- `node scripts/build-element-markup.mjs --check`, `build-elements-css.mjs --check`,
  `build-react-wrappers.mjs --check`, `build-vue-types.mjs --check`,
  `measure-elements-sizes.mjs --check` and
  `git diff --exit-code -- packages/elements/custom-elements.json` all pass.
- `npm run quality:all` and `node scripts/typecheck-all.mjs` pass.
- Every measured contrast ratio in NFR-001..003 is recorded and meets its threshold.
