---
work_package_id: "WP01"
title: "sk-button danger-secondary axis: source, proofs, ratchets"
dependencies: []
requirement_refs: ["FR-001", "FR-002", "FR-003", "FR-004", "FR-005", "FR-006", "FR-007", "FR-008", "FR-009", "FR-010", "FR-011", "FR-012", "FR-013", "FR-014", "FR-015", "FR-016", "FR-017", "FR-018", "FR-019", "FR-020", "FR-021", "FR-022", "NFR-001", "NFR-002", "NFR-003", "NFR-004", "NFR-005", "NFR-006", "C-001", "C-002", "C-003", "C-004", "C-005", "C-006", "C-007", "C-008", "C-009", "C-010", "C-011", "C-012"]
subtasks: ["T001", "T002", "T003", "T004", "T005", "T006", "T007", "T008"]
owned_files: ["packages/styles/src/button/sk-button.css", "packages/styles/src/button/sk-button.html", "packages/styles/src/button/index.ts", "packages/styles/src/button/sk-button-html.stories.ts", "packages/elements/src/button/sk-button.markup.ts", "packages/elements/src/button/sk-button.ts", "packages/elements/src/button/sk-button.css.js", "packages/elements/src/button/sk-button.css.d.ts", "packages/elements/src/button/sk-button.stories.ts", "packages/react/src/**", "packages/elements/vue.d.ts", "packages/elements/custom-elements.json", "packages/elements/SIZES.md", "fixtures/elements-behaviour/src/sk-button.test.ts", "apps/storybook/src/tests/elements-load.spec.ts", "docs/design-system/using-components.md"]
authoritative_surface: "packages/styles/src/button/"
execution_mode: "code_change"
agent_profile: "frontend-freddy"
role: "implementer"
agent: "claude"
model: ""
---

# WP01 — sk-button danger-secondary axis: source, proofs, ratchets

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and
behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `claude`

If no profile is specified, run `spec-kitty agent profile list` and select the best match for this
work package's `task_type` and `authoritative_surface`.

---

## Objective

Add a fourth tone, `danger-secondary`, to the existing `sk-button` component (both the shadow-DOM
element and its generated static form), reusing the already-published `--sk-status-danger` /
`--sk-on-status-danger` pair for the control boundary — no new token, no edit to
`packages/tokens/src/tokens.css` — with a resolved `:active` parity behaviour and a forced-colors-
only distinguishing marker, and ship it with full stories, behaviour-test coverage, and ratchet
confirmation, as one PR (issue #320, epic #319).

## Context

Issue #320 asks for a danger-toned combination of `sk-button` for Family 5 CLI-auth Deny/decline
actions, without inheriting `.sk-button--secondary`'s already-failing hairline border (#155). The
binding programme decision BORDER-ROLE-319 (`_program-319/DECISION-border-role.md`) fixes the token
altitude: this WP touches **zero** files under `packages/tokens/` — the danger role's own foreground
token, `--sk-on-status-danger`, already clears WCAG 1.4.11 (independently re-measured at 6.58:1 dark
/ 10.12:1 light against `--sk-surface-page`; see plan.md Design §3 for the full three-surface table)
and is reused directly as the border/text colour.

Two textual ambiguities in the issue are resolved in spec.md's Assumptions and must be implemented
exactly as resolved, not re-litigated:

1. **`:active` parity.** Only `.sk-button--primary` declares `:active { transform: scale(0.97) }`
   today; `secondary`/`ghost` do not. This WP adds that declaration to `.sk-button--danger-secondary`
   only — it does **not** retrofit `secondary` or `ghost` (C-003). That would be scope creep.
2. **Forced-colors distinguishability.** `.sk-button--secondary` already has an unconditional,
   non-transparent border, so `danger-secondary`'s border alone would remap to the *same* system
   colour under `forced-colors: active` and the two tones would be indistinguishable by colour or
   border-presence alone. This WP adds a content-drawn, alt-texted-empty marker
   (`content: '<glyph>' / '';`, mirroring `sk-disclosure__summary::before`'s technique) scoped
   entirely inside `@media (forced-colors: active)` — it must be invisible/inert in normal light and
   dark rendering. See plan.md Design §3 for the two construction options and pick option 1 (a bare
   pseudo-element on the existing `part="button"` node) unless it measurably distorts layout at
   `size="icon"`'s fixed 40×40 box, in which case fall back to option 2 and update
   `expected-parts.json`'s `sk-button` entry and `total` explicitly.

Read `plan.md` in full before starting — it contains the exact CSS block, the exact regeneration
command sequence, and the exact gate list this WP must run to completion.

### Subtask T001: Add the fourth tone to the markup module

**Purpose**: Register `danger-secondary` in the single source the generator, the render-path
warn/degrade logic, and the static-path throw logic all already iterate generically.

**Steps**:
1. In `packages/elements/src/button/sk-button.markup.ts`, add one entry to `BUTTON_VARIANTS`:
   ```ts
   'danger-secondary': 'sk-button--danger-secondary',
   ```
2. Do **not** touch `BUTTON_AXES` — neither `secondary` nor `ghost` has a dedicated axis entry
   today, and `danger-secondary` needs none either (plan.md Design §1 explains why the generator's
   one-export-per-`BUTTON_VARIANTS`-key behaviour already covers it).
3. Confirm (do not assume) that `isButtonVariant`, `unknownVariantMessage`, `buttonClasses`, and
   `buttonStaticHtml` need no code change — they all derive from `Object.keys(BUTTON_VARIANTS)` /
   `Object.hasOwn(BUTTON_VARIANTS, …)` already.

**Files**: `packages/elements/src/button/sk-button.markup.ts` (~1 line changed)
**Validation**: `buttonClasses('danger-secondary')` returns `'sk-button sk-button--danger-secondary'`;
`buttonStaticHtml({ variant: 'danger-secondary' })` renders `<button class="sk-button
sk-button--danger-secondary" type="button">Label</button>`; `buttonStaticHtml({ variant: 'rogue' })`
still throws `/unknown button variant/`.

### Subtask T002: Widen the element's `variant` type union

**Purpose**: Publish the fourth value through the manifest, the generated React prop type, and
`vue.d.ts` — this is a hand-spelled inline union, not derived, and is easy to miss.

**Steps**:
1. In `packages/elements/src/button/sk-button.ts`, change:
   ```ts
   declare variant: 'primary' | 'secondary' | 'ghost' | undefined;
   ```
   to:
   ```ts
   declare variant: 'primary' | 'secondary' | 'ghost' | 'danger-secondary' | undefined;
   ```
2. Update the preceding JSDoc line from `` Tone: `primary`, `secondary` or `ghost`. `` to
   `` Tone: `primary`, `secondary`, `ghost` or `danger-secondary`. ``.
3. `render()` needs no change — it already calls `buttonClasses(this.variant, this.size)`
   generically.

**Files**: `packages/elements/src/button/sk-button.ts` (~2 lines changed)
**Validation**: after regeneration (T005), `custom-elements.json`'s `sk-button.variant` type
includes `"danger-secondary"`, and the generated React/Vue prop types widen to match.

### Subtask T003: Author the CSS

**Purpose**: Paint the new tone at rest, hover, active and (forced-colors only) with a
distinguishing marker — all token-driven, all reusing only the danger pair.

**Steps**:
1. In `packages/styles/src/button/sk-button.css`, add (after the existing `.sk-button--ghost:hover`
   block, before `.sk-button--sm`) the exact block from `plan.md` Design §3, including its header
   comment carrying the independently re-measured contrast figures. Do not paraphrase the comment —
   copy the measured numbers exactly:
   ```css
   .sk-button--danger-secondary {
     background: transparent;
     color: var(--sk-on-status-danger);
     border-color: var(--sk-on-status-danger);
   }

   .sk-button--danger-secondary:hover {
     background: var(--sk-status-danger);
   }

   .sk-button--danger-secondary:active {
     transform: scale(0.97);
   }
   ```
2. Add the forced-colors block per plan.md Design §3's resolved option 1 — a bare
   `content: '<glyph>' / '';` pseudo-element on `.sk-button--danger-secondary`'s rendered
   `part="button"` node, scoped to `@media (forced-colors: active)` only. Choose a glyph that reads
   clearly at both the default/`--sm` text sizes and the `--icon` 40×40 box (a filled triangle or
   similar is a reasonable default; verify visually before committing). Do **not** use
   `forced-color-adjust: none` anywhere (FR-014). Do **not** let the glyph contribute to the
   accessible name — the alt-text half of the `content` shorthand (`/ '';`) must be present.
3. Verify empirically (Playwright, `forced-colors: active` media emulation, both colour schemes)
   that the marker does not distort layout at any size. If it does, switch to plan.md's option 2 (a
   dedicated wrapper/`::part()`) and update `expected-parts.json` explicitly (bump `total`), noting
   the change in the PR body rather than silently landing it.
4. Do **not** edit `.sk-button--secondary` or `.sk-button--ghost` in any way (C-003) — this WP adds
   new selectors only.
5. Do **not** edit `packages/tokens/src/tokens.css` (C-002) — every colour here is `var(--sk-status-
   danger)` or `var(--sk-on-status-danger)`, already published.

**Files**: `packages/styles/src/button/sk-button.css` (~25-40 lines added)
**Validation**: `npm run quality:stylelint` passes (every value is `var(--sk-*)`); a rendered
`<sk-button variant="danger-secondary">`'s computed `border-color`/`color` equal a
`--sk-on-status-danger` token probe in both themes; `:hover` changes only `background-color`;
`:active` computed `transform` is `scale(0.97)`.

### Subtask T004: Stories — element and static path

**Purpose**: Cover the issue's required story/test matrix: default/hover/active/focus-visible/
disabled at both `--sm` and `--icon` sizes, dark + `LightMode`, and the static generated form.

**Steps**:
1. In `packages/elements/src/button/sk-button.stories.ts`, add stories for `danger-secondary`
   mirroring the existing `Secondary`/`Ghost`/`Icon`/`IconFocus` patterns: a base story, a
   `size="sm"` story, and a `size="icon"` story with a supplied `label` (e.g. `"Deny"` as an example
   value only — never a component default). Add the new tone to the existing `AllVariants` and
   `LightMode` stories alongside the three existing tones. Use Storybook's own mechanisms (or
   story naming, matching `IconFocus`'s existing pattern) to make hover/active/focus-visible states
   inspectable — this repo does not require a dedicated story per pseudo-class where the state is
   demonstrable via documented interaction.
2. In `packages/styles/src/button/sk-button-html.stories.ts`, add one story,
   `DangerSecondary`, rendering `label(SkButtonDangerSecondaryHTML, 'Deny')` using the file's own
   guarded `swap()`/`label()` helpers (never a second unguarded `.replace`). Add it to `AllVariants`
   and `LightMode`.
3. Every `LightMode` story must wrap content in `class="sk-light"`, never `data-theme="light"` (hard
   rule 6) — verify the new entries actually render light styling (assert computed colour differs
   between default and `.sk-light`, per the recipe's own instruction, in T006's tests).
4. Add a forced-colors story or extend `apps/storybook/src/tests/elements-load.spec.ts` (T007
   covers the latter) demonstrating the FR-013 marker.

**Files**: `packages/elements/src/button/sk-button.stories.ts`,
`packages/styles/src/button/sk-button-html.stories.ts` (~40-60 lines added combined)
**Validation**: `npx nx run storybook:storybook:build` succeeds with no console errors on any new
story; every new story appears in `storybook-static/index.json`.

### Subtask T005: Regenerate every derived artifact

**Purpose**: Produce the generated static HTML, the element CSS module, the manifest, the React
wrapper, and the Vue types from the T001-T003 source changes — ADR-10 §3's "authored once,
regenerated everywhere else" contract.

**Steps**: run, in order, exactly the command sequence in `plan.md`'s "Regeneration" section:
```bash
node scripts/build-elements-css.mjs
node scripts/build-element-markup.mjs
npx nx run elements:analyze
node scripts/build-react-wrappers.mjs
node scripts/build-vue-types.mjs

npx nx run-many --target=build --projects=tokens,styles,elements
node scripts/measure-elements-sizes.mjs        # WRITES packages/elements/SIZES.md — commit it

node scripts/build-elements-css.mjs --check
node scripts/build-element-markup.mjs --check
node scripts/build-react-wrappers.mjs --check
node scripts/build-vue-types.mjs --check
git diff --exit-code -- packages/elements/custom-elements.json
node scripts/measure-elements-sizes.mjs --check
```
Confirm `packages/styles/src/button/sk-button.html` and `index.ts` gained exactly one new export,
`SkButtonDangerSecondaryHTML`, and no other component's generated file changed. If any other
component's generated output differs, STOP and investigate before committing — that is a signal of
an unrelated regression, not something to commit through.

**Files**: `packages/styles/src/button/sk-button.html`, `packages/styles/src/button/index.ts`,
`packages/elements/src/button/sk-button.css.js`, `packages/elements/src/button/sk-button.css.d.ts`,
`packages/elements/custom-elements.json`, `packages/react/src/**` (SkButton only),
`packages/elements/vue.d.ts`, `packages/elements/SIZES.md` — all generated, all committed as-is.
**Validation**: every `--check` command above exits 0; `git status --porcelain` shows no
uncommitted generated-file drift after this subtask's commit.

### Subtask T006: Behaviour test — update and extend

**Purpose**: Update the one hardcoded tone-count literal and add the new tone-specific assertions
the issue's required-tests list calls for, in the existing `sk-button` behaviour-test file (no new
file — this component has exactly one today).

**Steps**:
1. In `fixtures/elements-behaviour/src/sk-button.test.ts`, in the test `the primary tone PAINTS,
   and the three tones are distinct`, change `expect(variants.length, …).toBe(3);` to `.toBe(4);`.
   The rest of that test (derived from `Object.keys(BUTTON_VARIANTS)`, per-tone computed-style
   capture, `Set` uniqueness check) needs no other edit — it will fail red-first against the
   unmodified source (before T001-T003 land) and pass once they do, which doubles as this WP's own
   red-first proof for FR-002/FR-003.
2. Add a hover-fill assertion: computed `background-color` for `.sk-button--danger-secondary`
   changes from `transparent` to the resolved `--sk-status-danger` value under a synthetic `:hover`
   (or via a matched-stylesheet-rule lookup, matching this file's existing computed-style assertion
   style).
3. Add an active-transform assertion: `.sk-button--danger-secondary:active`'s `transform` equals
   `scale(0.97)`.
4. Add a two-theme border/text-colour token-boundary assertion, mirroring the existing `icon
   controls are exactly 40px square and token-focus-visible in both themes` test's two-theme probe
   pattern: `danger-secondary`'s computed `border-color` and `color` both equal a
   `--sk-on-status-danger` token probe, in both the default and `.sk-light`-wrapped frames.
5. Extend the existing `size is an axis independent of tone` test's loop (or add assertions inline)
   to cover `danger-secondary` at `size="sm"` and `size="icon"` — same padding/dimension behaviour
   as every other tone, tone's own colours unaffected by size.
6. Add the FR-017 no-copy-default assertion: `buttonStaticHtml({ variant: 'danger-secondary'
   })`'s default rendered content is still exactly the shared `'Label'` placeholder, and neither
   `sk-button.ts` nor `sk-button.markup.ts` contains any new string literal resembling "Deny" or
   "Decline" outside a story/doc example file (a targeted assertion, not a repo-wide #286 gate —
   C-011-equivalent boundary named in plan.md).
7. Confirm — do not silently skip — that no `behaviours.json`/`mutations.json` edit is needed:
   `sk-button` is already an SC-013/SC-014 subject; this mission adds no new `::part()` (unless T003
   fell back to option 2, in which case revisit), no new reflected property, and no responsive
   threshold.

**Files**: `fixtures/elements-behaviour/src/sk-button.test.ts` (~1 literal changed, ~60-100 lines
added)
**Validation**: `npm run test` and `node scripts/suite-selftest.mjs` both green; the updated `.toBe(4)`
assertion fails against the pre-T001 source and passes after (verify this manually once, as the
red-first proof).

### Subtask T007: Forced-colors distinguishability assertion

**Purpose**: Prove, not merely assert in prose, that `danger-secondary` remains visually
distinguishable from plain `secondary` under `forced-colors: active` in both colour schemes.

**Steps**:
1. In `apps/storybook/src/tests/elements-load.spec.ts`, add a case emulating `forced-colors: active`
   (matching whatever existing forced-colors emulation pattern this file or a sibling
   `*-forced-colors.html` demo page already uses in this repo) for both `<sk-button
   variant="secondary">` and `<sk-button variant="danger-secondary">`, and assert a measurable
   difference between them — e.g., the presence/absence or content of the T003 pseudo-element marker
   — in both the dark and light colour schemes.
2. If a dedicated `sk-button-forced-colors.html` demo page fits this repo's existing pattern better
   than a spec-file case (see `sk-breadcrumbs-forced-colors.html`, `sk-event-timeline-forced-colors.html`
   for precedent), use that shape instead — WP's choice, but the assertion must be real (a Playwright
   emulation check), not a screenshot-only story with no assertion.

**Files**: `apps/storybook/src/tests/elements-load.spec.ts` (~20-40 lines added)
**Validation**: the new assertion fails if the T003 forced-colors block is reverted (manually verify
once as a red-first proof), and passes with it in place.

### Subtask T008: Ratchets, docs, full gate run, commit

**Purpose**: Confirm the ratchets that do NOT need edits, update docs, run every gate from
`docs/contributing/adding-a-component.md` §7, and produce the single commit (or small commit
sequence within this one WP/PR) this mission ships as.

**Steps**:
1. Confirm `expected-parts.json`'s `sk-button` entry stays `["button"]` and `total` is unchanged —
   **unless** T003 used option 2 (new `::part()`), in which case update both explicitly and say so
   in the PR body.
2. Confirm `expected-docs.json`'s `sk-button` entry stays `{ "attributes": 5, "properties": 0,
   "methods": 0 }` — unchanged, because `danger-secondary` is a new *value*, not a new attribute.
3. Update `docs/design-system/using-components.md` (or `sk-button`'s own doc section, whichever
   already carries the three-tone table): add the fourth tone, its reused-token boundary, the
   measured contrast figures, and a one-line pointer to the #155 coordination record.
4. Run the full gate list from `plan.md`'s Verification section, in order:
   ```bash
   node scripts/check-manifest-content.mjs
   node scripts/check-no-css-in-source.mjs
   node scripts/check-elements-entries.mjs
   node scripts/check-adopted-css-boundaries.mjs
   node scripts/check-element-css-hygiene.mjs
   node scripts/check-part-ratchet.mjs
   node scripts/check-story-theme-wrapper.mjs
   node scripts/check-story-theme-wrapper.mjs --selftest
   node scripts/typecheck-all.mjs
   npm run quality:all

   node scripts/build-react-wrappers.mjs --selftest
   node scripts/check-manifest-content.mjs --selftest
   node scripts/check-gate-wiring.mjs

   git add -A && git status --porcelain   # must be empty before opening the PR

   npm run test
   node scripts/suite-selftest.mjs
   npx nx run storybook:storybook:build && node scripts/run-axe-storybook.js
   npx playwright test
   ```
5. Record the measured contrast figures and the #155 coordination outcome in the PR body, in #155's
   `ratio : 1, per theme` format, and post a comment on #155 linking back (FR-022) — do not close or
   widen #155's scope.
6. Commit with conventional-commit scopes from the closed enum (`styles`, `elements`; unscoped
   `docs:` for the doc-only change) — never `specs`, `spec`, `adr`, or `button`.

**Files**: `expected-parts.json` (confirm-only, or explicit bump per step 1), `expected-docs.json`
(confirm-only), `docs/design-system/using-components.md`
**Validation**: every command in step 4 exits 0; `git status --porcelain` is empty; the PR body
contains the measured contrast table and the #155 coordination note.

## Definition of Done

- [ ] `BUTTON_VARIANTS` includes `danger-secondary`; no new `BUTTON_AXES` entry (T001)
- [ ] `sk-button.ts`'s `variant` type union and JSDoc both include `danger-secondary` (T002)
- [ ] `.sk-button--danger-secondary` (rest, hover, active) authored using only `--sk-status-danger`/
      `--sk-on-status-danger`, with the measured-contrast header comment; zero edits to
      `.sk-button--secondary`/`.sk-button--ghost`; zero edits to `packages/tokens/src/tokens.css` (T003)
- [ ] Forced-colors-only marker present, content-drawn, alt-texted-empty, no `forced-color-adjust:
      none`, verified not to distort layout at any size (T003)
- [ ] Element and static-path stories cover default/hover/active/focus-visible/disabled at `--sm`
      and `--icon`, dark + `LightMode` (T004)
- [ ] All generated artifacts regenerated and `--check`-clean; only `sk-button`'s generated files
      changed (T005)
- [ ] Behaviour test's tone-count literal updated to 4; new hover/active/two-theme-boundary/size/
      no-copy-default assertions added and green (T006)
- [ ] Forced-colors distinguishability assertion added and green in both colour schemes (T007)
- [ ] `expected-parts.json`/`expected-docs.json` confirmed unchanged (or explicitly updated if T003
      fell back to option 2); docs updated; full gate list green; #155 coordination recorded (T008)
- [ ] No state machine, confirmation step, mutation/lifecycle code, or copy default anywhere in the
      diff (C-006, FR-010, FR-011)
- [ ] `git status --porcelain` empty before the PR is opened

## Risks

- **Forced-colors marker distorts layout.** Mitigation: verify empirically before committing to
  option 1; fall back to option 2 (new `::part()`) with an explicit ratchet update if needed.
- **nx cache serves a stale `dist/` to `measure-elements-sizes.mjs`.** Mitigation: run the real
  build immediately before measuring; use `--skip-nx-cache` if a stale-cache symptom appears.
- **Accidentally retrofitting `:active` onto `secondary`/`ghost`, or editing their existing rules
  while adding the new one.** Mitigation: review `git diff --stat` against plan.md's Design §3
  before commit — only new selectors should appear in the diff to `sk-button.css`.
- **Confusing BORDER-ROLE-319's own figures with this mission's required independent
  re-measurement.** Mitigation: the CSS header comment and the PR body both carry the figures this
  WP itself re-derives (matching BORDER-ROLE-319's numbers, which is expected — the token values on
  this branch have not moved), not a copy-pasted quote presented as new evidence.

## Reviewer Guidance

Focus review on: (1) zero edits to `packages/tokens/src/tokens.css` and zero edits to
`.sk-button--secondary`/`.sk-button--ghost`'s existing rules; (2) the forced-colors marker is
genuinely inert outside `forced-colors: active` and does not use `forced-color-adjust: none`; (3)
the `:active` scoping is explicit to `danger-secondary` only, with the parity rationale visible in
the CSS comment; (4) no copy default, confirmation logic, or lifecycle code anywhere in the diff;
(5) the measured contrast figures in the PR body are independently computed, not merely copied from
BORDER-ROLE-319; (6) `expected-parts.json`/`expected-docs.json` are correctly left unchanged (or, if
T003 fell back to option 2, correctly and explicitly updated).

Implementation command: `spec-kitty agent action implement WP01 --agent claude`
