# Tasks: Dashboard semantic primitives

**Mission:** `dashboard-semantic-primitives-01M1S94M`
**Issue:** #176, epic #183, tracks #125
**Planning branch:** `mission/dashboard-semantic-primitives` (topology: `single_branch` — this IS
the target/merge branch; no separate mission-lane worktree exists for planning)
**Final delivery:** one PR from `mission/dashboard-semantic-primitives` into `train/elements-first`

## Delivery rule

Four work packages, three of which are independent (WP01–WP03, one per set of primitives that
share no files) and one dependent closure package (WP04, the shared `packages/styles/src/index.ts`
entry point plus the authoring-recipe doc). `finalize-tasks` computes execution lanes from the
declared `owned_files`; WP01–WP03 may run in parallel lanes, WP04 waits for all three. No WP opens
its own PR — all commits land on this single mission branch, and the mission opens exactly one PR
into `train/elements-first` per `Refs #176`.

The operator has added an explicit **post-tasks adversarial-squad point-cut** to this mission
(#176 declares no tier itself; this is the same treatment #180 received). This `tasks.md` and its
WP prompts are reviewed by that squad before any WP is implemented — do not begin implementation
until that review has folded its findings.

No WP may invent a `--sk-status-*`/`--sk-chart-*` token, add a custom element, add JavaScript
behaviour, or add sort/filter/pagination/virtualization/row-selection/column-resizing. If any of
those becomes necessary, stop and report rather than widening a WP's scope.

**Post-tasks squad findings folded 2026-09-05** — read `plan.md`'s "Corrected premises" and
"Pre-mortem and Risks" sections before starting any WP; two of the spec's own premises were wrong
(the reduced-motion precedent guards nothing; FR-009's third forced-colors location is row
distinction, not table borders) and are corrected there and in `spec.md` directly. Three
mission-wide rules apply to every WP below:

1. **A `.css` and at least one `.html` land in the same commit, always.** The generator throws
   (not a clean failure) on a directory with a `.css` but zero `.html`, and fails generation for
   **every** directory when it does — see plan.md's "Delivery rule" section.
2. **The one sanctioned forced-colors CSS pattern** (unpoliced `border:`/`outline:` shorthand with
   a system-color keyword, never the `-color` longhand) is fixed once in plan.md's "Sanctioned
   forced-colors CSS pattern" section. WP02 and WP03 both write forced-colors declarations and
   must use the same pattern, not invent independent answers.
3. **`lanes.json`'s `mission_branch` field names a branch that does not exist.** This mission's
   real, only branch is `mission/dashboard-semantic-primitives` (topology `single_branch`, per
   `meta.json` and every WP's own frontmatter) — use that, not whatever `lanes.json` says, if the
   two ever disagree at dispatch time.

## Subtask index

| ID | Work Package | Description | Parallel |
|---|---|---|---|
| T001 | WP01 | Author `sk-facts` CSS (stacked/two-col/compact, term/value BEM) | [P] |
| T002 | WP01 | Author `sk-facts` HTML exemplars (stacked, two-col, compact, long value, empty value) | [P] |
| T003 | WP01 | Regenerate `facts/index.ts` and author `sk-facts-html.stories.ts` | No |
| T004 | WP01 | Author `sk-empty-state` CSS (heading/body/action, no invented copy) | [P] |
| T005 | WP01 | Author `sk-empty-state` HTML exemplars (with action, without action) | [P] |
| T006 | WP01 | Regenerate `empty-state/index.ts` and author `sk-empty-state-html.stories.ts` | No |
| T007 | WP01 | Stylelint + htmlhint scoped to `facts/` and `empty-state/` | No |
| T008 | WP02 | Author `sk-disclosure` CSS incl. reduced-motion + forced-colors marker treatment | [P] |
| T009 | WP02 | Author `sk-disclosure` HTML exemplars (closed, open, long body, nested) | [P] |
| T010 | WP02 | Regenerate `disclosure/index.ts` and author `sk-disclosure-html.stories.ts` | No |
| T011 | WP02 | Author `sk-skip-link` CSS incl. reduced-motion + forced-colors focus treatment | [P] |
| T012 | WP02 | Author `sk-skip-link` HTML exemplar (unfocused only, real `#main` target) | [P] |
| T013 | WP02 | Regenerate `skip-link/index.ts` and author `sk-skip-link-html.stories.ts` | No |
| T014 | WP02 | Stylelint + htmlhint scoped to `disclosure/` and `skip-link/`; verify motion/forced-colors shape | No |
| T015 | WP03 | Author `sk-data-table` CSS (zebra/hover/numeric/sticky-header/scroller/forced-colors row distinction) | No |
| T016 | WP03 | Author `sk-data-table` HTML exemplars (default+caption, sticky header, narrow-scrollable) | No |
| T017 | WP03 | Regenerate `data-table/index.ts` and author `sk-data-table-html.stories.ts` | No |
| T018 | WP03 | Verify SC-003: scroller is focusable, named, and `<th scope>` association is intact | No |
| T019 | WP03 | Verify SC-002 for this primitive: real `<table>`/`<caption>`/`<th scope>`, no cell reflow | No |
| T020 | WP03 | Stylelint + htmlhint scoped to `data-table/`; confirm forced-colors covers row distinction only | No |
| T021 | WP04 | Add 5 `export *` lines to `packages/styles/src/index.ts` + 5 subpath exports to `package.json`; verify SC-004 | No |
| T022 | WP04 | Document forced-colors + reduced-motion baselines in `adding-a-component.md` (FR-011) | No |
| T023 | WP04 | Run `build-styles-only-markup.mjs` (+ `--check`) across all five directories | No |
| T024 | WP04 | Run full mission gate suite (incl. `check-release-graph.mjs`) and record evidence; grep tokens.css for SC-006 | No |
| T025 | WP04 | Mission-wide SC-002 grep across all five primitives, with per-tag match counts | No |
| T026 | WP04 | Run the already-instantiated acceptance-matrix's SC/C checks and record real evidence | No |

Record completion with `spec-kitty agent tasks mark-status T001 T002 ... --status done`
(single or batch). There is no `- [ ]` checkbox to tick; the reduced event-log snapshot is the
sole authority for subtask completion.

## WP01 — Facts and empty-state primitives

**Prompt:** [`tasks/WP01-facts-and-empty-state-primitives.md`](./tasks/WP01-facts-and-empty-state-primitives.md)
**Priority:** P1 — lowest-risk, no-transition primitives
**Dependencies**: None
**Requirement refs:** FR-001, FR-005, FR-007, NFR-001, NFR-003; C-001, C-002, C-004, C-005
**Independent review:** Render each story; confirm `<dl>`/`<dt>`/`<dd>` and the empty-state block
render with real semantic markup, axe is clean, and `LightMode` actually changes computed colors.

### Included subtasks

- T001 Author `sk-facts` CSS (WP01)
- T002 Author `sk-facts` HTML exemplars (WP01)
- T003 Regenerate `facts/index.ts` and author its stories (WP01)
- T004 Author `sk-empty-state` CSS (WP01)
- T005 Author `sk-empty-state` HTML exemplars (WP01)
- T006 Regenerate `empty-state/index.ts` and author its stories (WP01)
- T007 Stylelint + htmlhint scoped to this WP's two directories (WP01)

### Implementation sketch

1. Copy the `form-field` precedent's file shape (CSS header comment, `.html` header-comment
   convention the generator strips, `-html.stories.ts` naming) for both primitives.
2. `.sk-facts`: stacked is the default; `.sk-facts--two-col` and `.sk-facts--compact` are
   modifiers on the same `<dl>` root. Values render verbatim — no truncation, no formatting.
3. `.sk-empty-state`: heading + body + one optional action slot position; the primitive supplies
   no copy of its own.
4. Regenerate with `node scripts/build-styles-only-markup.mjs` after each directory's `.html`
   files exist; author the story file importing named exports from the generated `index.ts`.
5. Every story set includes the required `LightMode` story wrapped in `class="sk-light"`.

### Review boundaries

- No transition, no `forced-colors`/`prefers-reduced-motion` media query belongs in this WP —
  neither primitive introduces a transition (see plan.md IC-01/IC-04).
- Do not touch `packages/styles/src/index.ts` — that is WP04's single-writer surface.
- No status/tone colouring on the empty-state block (C-002).

## WP02 — Disclosure and skip-link primitives

**Prompt:** [`tasks/WP02-disclosure-and-skip-link-primitives.md`](./tasks/WP02-disclosure-and-skip-link-primitives.md)
**Priority:** P1 — the two primitives that introduce a transition and the forced-colors/reduced-motion baseline
**Dependencies**: None (parallel with WP01 and WP03 — disjoint files)
**Requirement refs:** FR-002, FR-006, FR-007, FR-009, FR-010, NFR-001, NFR-002, NFR-003; C-001, C-004, C-005
**Independent review:** Toggle the disclosure with mouse and keyboard (native, nothing to
simulate); tab to the skip link and confirm it becomes visible at AA contrast and its `href`
resolves to a real `id="main"` in the story fixture. Emulate `forced-colors: active` and
`prefers-reduced-motion: reduce` in devtools and confirm both primitives still read correctly.

### Included subtasks

- T008 Author `sk-disclosure` CSS incl. reduced-motion + forced-colors marker (WP02)
- T009 Author `sk-disclosure` HTML exemplars (WP02)
- T010 Regenerate `disclosure/index.ts` and author its stories (WP02)
- T011 Author `sk-skip-link` CSS incl. reduced-motion + forced-colors focus (WP02)
- T012 Author `sk-skip-link` HTML exemplars (WP02)
- T013 Regenerate `skip-link/index.ts` and author its stories (WP02)
- T014 Stylelint + htmlhint scoped to this WP's two directories; verify motion/forced-colors shape (WP02)

### Implementation sketch

1. `.sk-disclosure`: style `<details>`/`<summary>`; the marker is decorative and never the sole
   affordance (pair it with visible text/icon change, not only a rotated triangle); `:focus-visible`
   on the summary must be visible. The `open` attribute stays entirely the consumer's — no CSS
   logic reads or sets it.
2. `.sk-skip-link`: a real `<a href="#main">`. Off-screen technique must keep the link in the
   accessibility tree (e.g. an off-canvas transform/clip, not `display: none` or
   `visibility: hidden`), then become visible above all content at AA contrast on `:focus-visible`.
   `outline` is never suppressed.
3. Both introduce exactly one transition each (marker reveal; off-screen → visible). Guard both
   with `@media (prefers-reduced-motion: reduce)`, copying the **shape** already shipped at
   `packages/styles/src/transition-matrix/sk-transition-matrix.css:237` — do not invent a second
   convention (spec's own stale-issue correction; the issue said this baseline was absent, it is
   not).
4. Add `@media (forced-colors: active)` for exactly two of this mission's three required
   locations: the skip-link's focused state and the disclosure marker. (The third — table
   borders — is WP03's.) This is genuinely new territory: no `forced-colors` block exists
   anywhere in the repo yet.
5. Regenerate both barrels; author both story files, each including the required `LightMode`
   story and a forced-colors visual-baseline story/note.

### Review boundaries

- Do not touch `.sk-data-table`'s forced-colors border treatment — that stays in WP03 so the
  three required locations (SC-005) are each authored exactly once, in the primitive that owns
  them.
- Do not touch `packages/styles/src/index.ts` — WP04's surface.
- No re-implementation of `aria-expanded`/open-state bookkeeping — `<details>` owns that natively
  (C-001, and the mission's own light-DOM rule).

## WP03 — Data-table primitive and the narrow-width region

**Prompt:** [`tasks/WP03-data-table-primitive.md`](./tasks/WP03-data-table-primitive.md)
**Priority:** P1 — highest-risk concern in the mission
**Dependencies**: None (parallel with WP01 and WP02 — disjoint files)
**Requirement refs:** FR-003, FR-004, FR-007, FR-009, NFR-001, NFR-003; C-001, C-003, C-004, C-005
**Independent review:** At a narrow viewport, confirm the scroll region is a labelled,
`tabindex="0"` container wrapping an **intact** `<table>` — headers, `scope`, and cell structure
unchanged. Reject any change that reflows cells to blocks at any breakpoint.

### Included subtasks

- T015 Author `sk-data-table` CSS (WP03)
- T016 Author `sk-data-table` HTML exemplars (WP03)
- T017 Regenerate `data-table/index.ts` and author its stories (WP03)
- T018 Verify SC-003 — scroller focusable, named, header association intact (WP03)
- T019 Verify SC-002 for this primitive — real table markup, no reflow (WP03)
- T020 Stylelint + htmlhint scoped to `data-table/`; confirm forced-colors covers row distinction only (WP03)

### Implementation sketch

1. `.sk-data-table` on `<table>`: zebra rows, row hover highlight, `.sk-data-table__cell--numeric`
   (tabular-nums, right-aligned), `.sk-data-table--sticky-header` modifier.
2. `.sk-data-table__scroller`: wraps an **intact** table. `role="region"`, an accessible name
   (`aria-label` or `aria-labelledby`), `tabindex="0"`. This is the *one documented approach*
   FR-004 requires — block-reflow of cells is explicitly rejected, it is the exact defect being
   fixed in the Factory Dashboard source.
3. `@media (forced-colors: active)` covers **zebra/hover row distinction**, not borders — the
   third of the mission's three required locations (skip-link focus and disclosure marker are
   WP02's). Measured: a plain `border` already survives forced-colors with zero author rule; the
   `background`-based zebra/hover treatment is what flattens to `Canvas` and needs a real block
   (e.g. a border/outline-based row separator using the sanctioned shorthand pattern from
   plan.md's "Sanctioned forced-colors CSS pattern" section).
4. Exemplars: a default table with `<caption>` and `<th scope="col">`/`<th scope="row">` where
   applicable, a sticky-header variant, and a narrow-width variant demonstrating the scroller.
5. The narrow-width story must be verifiable, not just visual: assert (in the story or a note
   describing manual verification) that the scroller has `tabindex="0"`, an accessible name, and
   that every `<th scope>` still associates with its column after wrapping.

### Review boundaries

- No sorting, filtering, pagination, virtualization, row-selection, column-resizing, sticky
  *columns*, or JavaScript of any kind (C-003).
- No status/tone row or cell colouring (C-002).
- Do not touch `packages/styles/src/index.ts` — WP04's surface.

## WP04 — Barrel registration, package exports, docs, and mission-wide verification

**Prompt:** [`tasks/WP04-barrel-registration-and-recipe.md`](./tasks/WP04-barrel-registration-and-recipe.md)
**Priority:** P2 — closure package
**Dependencies**: WP01, WP02, WP03 (needs all five directories' `.html` files to exist for the
generator, and needs no other WP writing `packages/styles/src/index.ts` or `package.json`
concurrently)
**Requirement refs:** FR-007, FR-008, FR-011, NFR-001; SC-001, SC-002 (mission-wide), SC-004,
SC-006, SC-007; C-001–C-005 (as negative invariants)
**Independent review:** Import `@spec-kitty/styles`'s entry point and confirm every one of the
five new generated export names resolves. Confirm `packages/styles/package.json` has a `./<name>/*`
subpath export for each new directory and `check-release-graph.mjs` passes. Confirm
`docs/contributing/adding-a-component.md` now documents both baselines accurately (establishing,
not generalising; row distinction, not borders). Confirm no `--sk-status-*`/`--sk-chart-*` token
was introduced. Confirm `acceptance-matrix.json` has real, non-placeholder content.

### Included subtasks

- T021 Add five `export *` lines to `packages/styles/src/index.ts` + five subpath exports to
  `packages/styles/package.json`; verify SC-004 (WP04)
- T022 Document both baselines in `adding-a-component.md` (WP04)
- T023 Run the generator's `--check` only across all five directories — never its mutating form
  from this WP (WP04)
- T024 Run the full mission gate suite, including `check-release-graph.mjs`, and record evidence
  (WP04)
- T025 Mission-wide SC-002 grep across all five primitives, with per-tag match counts (WP04)
- T026 Run the already-instantiated acceptance-matrix's SC/C checks and record real evidence
  (WP04) — `acceptance-matrix.json`'s SC-001..SC-007/C-001..C-005 content was authored during
  this post-tasks fold, not by WP04

### Implementation sketch

1. Add one `export * from './facts/index';`-style line per new directory to
   `packages/styles/src/index.ts`, matching the existing alphabetical style. This is the single
   hand-maintained per-*directory* line #156 tracks — there is no gate to catch a missed one, so
   verify by actually importing the entry point and checking all five export names resolve
   (SC-004); **commit that check as a real test, or record its verbatim output in the PR body** —
   `packages/styles/project.json` has no `test` target, so recording output in the PR body is the
   pragmatic default rather than inventing new test infrastructure. Also add one `"./<name>/*":
   "./dist/<name>/*"` entry per new directory to `packages/styles/package.json`'s `exports` map —
   this was missing from the original plan and is what `check-release-graph.mjs`'s
   `checkSubpathCoverage` (`[ENFORCED]` at `ci-quality.yml:533`) actually enforces. While editing
   `packages/styles/src/index.ts`'s header comment, **delete its stale directory/export count
   rather than recomputing it** — it undercounted CSS-only directories before this mission (it
   names two, `form-input`/`form-textarea`; the real count is three, including
   `transition-matrix`) and has already been wrong twice.
2. Add a short section to `docs/contributing/adding-a-component.md` documenting the
   `forced-colors` and `prefers-reduced-motion` baselines this mission **establishes** (not
   "generalises" — the prior precedent guarded nothing), pointing at the real shipped CSS: the
   three forced-colors locations are skip-link focus, disclosure marker, and data-table
   **zebra/hover row distinction** (not borders), and the reduced-motion shape is scoped
   per-declaration, not copied from the inert `sk-transition-matrix.css:237` wildcard (FR-011).
3. Run `node scripts/build-styles-only-markup.mjs --check` only — must be clean with all five new
   directories included in its reported set. Do **not** run the mutating form from this WP: it
   rewrites every styles-only directory's `index.ts`, including WP01–03's, outside lane-d's
   declared write scope. If `--check` reports staleness in a directory this WP doesn't own, that
   bounces back to the owning WP.
4. Run the full local gate list from `plan.md`'s "Local gate commands" section and record real
   output: stylelint, htmlhint, `quality:lint`, `check-story-theme-wrapper.mjs` (+ `--selftest`),
   a Storybook build, `run-axe-storybook.js`, and `check-release-graph.mjs` (+ `--selftest` first).
   Grep `packages/tokens/src/tokens.css` to confirm SC-006 (no `--sk-status-*`/`--sk-chart-*`
   token exists).
5. Rebase onto the current `train/elements-first` if it has moved during the mission, and
   regenerate before this final gate run (SC-007).
6. Run one grep confirming every primitive's authored `.html` contains its real native tag
   (`<dl>` in `facts/`, `<details>` in `disclosure/`, `<table>` in `data-table/`, `<a>` in
   `skip-link/` — `.sk-empty-state` has no single required native tag, note it explicitly rather
   than silently skipping it), printing per-tag match counts. This is SC-002 verified
   mission-wide; the original plan verified it for `.sk-data-table` only.
7. Replace `acceptance-matrix.json`'s 11 TODO placeholders (currently all claiming
   `proof_type: automated_test`, which this mission's styles-only, no-test-target package cannot
   honestly claim for most of them) with real criteria keyed to SC-001..SC-007, using
   `proof_type: automated_test` only where a real script with its own exit code performs the
   check (`build-styles-only-markup.mjs --check`, `check-release-graph.mjs`) and `manual_qa`
   elsewhere (SC-002/SC-003/SC-005 devtools/accessibility-tree inspection, SC-004's recorded
   output). Add C-001 through C-005 as `negative_invariants` (schema: `invariant_id`,
   `description`, `verification_method` — `grep_absence` fits all five here, `verification_command`,
   `result`) — e.g. C-001 verified by confirming no new directory appears under
   `packages/elements/src/{facts,disclosure,data-table,empty-state,skip-link}`, C-002 by grep
   against `packages/tokens/src/tokens.css` (same command as SC-006), C-004 by grep for
   Team-Kitty/Factory-Dashboard domain strings across the five new directories, C-005 by pointing
   at `check-story-theme-wrapper.mjs`'s ratchet as the enforcing mechanism.

### Review boundaries

- This WP is the **only** writer of `packages/styles/src/index.ts` and
  `packages/styles/package.json` in the whole mission.
- Do not re-author or restyle any of the five primitives here — fixes to authored CSS/HTML belong
  in the WP that owns that directory.
- Do not run the generator's mutating form from this WP (see subtask T023).
