# Tasks: site-footer-compact-mode

**Input**: `plan.md`, `spec.md`, `research.md` (no `data-model.md` — `plan.md`'s "Artifacts this plan
deliberately does not create" records this as genuinely not applicable: a presentational component
with no persistence, no schema, no migration, no server contract)
**Branch**: `mission/site-footer-compact-mode` (planning base **and** merge target — `meta.json`
records `topology: "single_branch"`, so this mission lives on its own mission branch; the eventual
PR onto `train/elements-first` is opened and merged per D-14 / C-012, not by this WP itself).

One work package. The issue's own "Delivery" line states "one bounded Work Package and one PR," and
C-012 binds it. `plan.md`'s D-14 names the seam that exists (the two Playwright specs have no
compile-time dependency on the rest) and then shows why it still cannot split: `check-manifest-
content.mjs` compares `expected-docs.json` to the **committed** manifest with exact equality, so the
element change, its manifest regeneration, and the ratchet edit must land together or CI is red;
`run-axe-storybook.js` asserts every id declared in `expected-stories.json` exists in the **built**
Storybook, so stories and that ratchet edit must land together too; and `build-element-markup.mjs
--check` fails against any tree where the authored module and the committed `index.ts` disagree, so
the authored change and its generated fan-out cannot be separated at all. One WP, below.

## Settled decisions carried from PLAN (not re-opened here)

- **D-1**: `presentation` is a non-variant `_AXES` entry (`SITE_FOOTER_AXES = { Compact, CompactNoLinks }`).
  `SITE_FOOTER_VARIANTS` stays `{}`. Precedent: `sk-check-bullet` (`CHECK_BULLET_VARIANTS = {}` +
  `CHECK_BULLET_AXES = { Pending: … }`).
- **D-2/D-3**: one new public reactive property `presentation: 'full' | 'compact' | undefined`
  (reflect, String), one new slot `compact-links`; no new `::part()`.
- **D-4/D-8/D-9**: the compact anatomy, the shared `siteFooterClasses()` helper, the plain
  `@media (max-width: 640px)` reuse, and the colour-free/no-focus-ring constraints are all fixed —
  see the WP prompt for the concrete shapes.
- **D-4a — [ORCHESTRATOR RULING, CONFIRMED, not escalated further]**: the compact link region slots
  bare `<a>` elements, not `<li>` inside an element-owned `<ul>`. This was flagged in `plan.md` as an
  extension of the operator's #77 ruling ("only link LISTS are slotted, as `<li>` directly inside the
  element-owned `<ul>`"). It has been **verified directly against the approved Family 6 corpus**
  (`/home/jeroennouws/dev/team-kitty-missions/ux_redesign/families/06-account-front-door/screens/`):
  the compact footer in P1, P2, P16 and P20 is byte-identical and contains no `<nav>`, no `<ul>`, no
  `<li>` and no heading — one supplied text block plus a bare sibling `<a class="text-link"
  href="/terms/">Terms</a>`. #77's clause governs a link **LIST**; in this region that premise is
  simply absent, so slotting bare anchors narrows the ruling to a region it never described rather
  than overriding it. #77's two load-bearing principles — the element owns the structure; content
  arrives as properties, not parsed markup — are preserved unchanged. **Resolved from the approved
  corpus; not escalated to the operator.**
  - **Rejected alternative L1** (recorded, not chosen): element-owned
    `<nav aria-label="{linksLabel}"><ul><slot name="compact-links"></slot></ul></nav>`, gated on a
    second new property `linksLabel`. Rejected because it (a) adds a second public property and
    therefore a second `expected-docs.json` count change, (b) adds a landmark/label the corpus does
    not have, (c) leaves a defined-but-bad degenerate state (label set, zero items → a labelled empty
    list), (d) buys nothing FR-004 asks for. **Cost if ever revisited**: `expected-docs.json`
    `sk-site-footer.attributes` `6 → 7` (instead of `5 → 6`), `total` `+2` (instead of `+1`).
- **D-10**: full three-column presentation frozen. `render()`'s full branch, `sk-site-footer.html`,
  `SkSiteFooterHTML` all byte-identical. A new `[FR-009]` test asserts the base form's exact anatomy.
- **D-12**: `expected-docs.json` (`attributes` 5→6, `total` 133→134) and `expected-stories.json`
  (new ids + total) are obliged; `expected-parts.json`, `behaviours.json`, `mutations.json`,
  `expected-inert-theme-wrappers.json` are **not** touched.
- **C-010 / #309 / #310**: does **not** fire. No `container-type`, no `@container`, no
  `:host([attr])` rule anywhere in the compact rules. No dependency recorded.

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | Authored markup module — `SiteFooterLink`/`SiteFooterPresentation` types, `SITE_FOOTER_AXES = { Compact, CompactNoLinks }` (`SITE_FOOTER_VARIANTS` stays `{}`), `siteFooterClasses()` helper, options-object `presentation`/`links` extension, the compact branch of `siteFooterStaticHtml` (row/meta/brand/tagline/legal/links, no `<nav>`/heading/`<ul>`/`<hr>`), `links` deliberately absent from `DEFAULTS`, no new import (FR-001, FR-002, FR-003, FR-004, FR-006, FR-007, FR-008, FR-010, C-005, C-006, C-008, C-009) | WP01 | |
| T002 | Authored element — new public reactive property `presentation` (reflect, `'full'\|'compact'\|undefined`, consumer-facing `/** */`), new `@slot compact-links`, private compact render branch calling `siteFooterClasses()`, full branch's existing template literal left untouched (FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-009, FR-010, C-005, C-006, C-008, C-009) | WP01 | |
| T003 | CSS — `.sk-site-footer--compact`, `__row`, `__meta`, `__link--compact` (light-DOM 44px target-size rule), one added line inside the **existing** `@media (max-width: 640px)` block, zero `color:` declarations anywhere in the new rules, tokens-only, BEM (FR-011, FR-012, FR-013, NFR-001, NFR-002, NFR-003, NFR-005, NFR-011, C-001, C-002, C-003, C-010) | WP01 | |
| T004 | Regenerate the generated fan-out — `build-elements-css.mjs`, `build-element-markup.mjs`, `nx run elements:analyze --skip-nx-cache`, `build-react-wrappers.mjs`, `build-vue-types.mjs`; confirm `sk-site-footer.html` byte-identical and `index.ts`'s diff purely additive (FR-007, FR-008, FR-009, NFR-009, C-007) | WP01 | |
| T005 | Ratchet — `expected-docs.json`: `sk-site-footer.attributes` **5 → 6**, `total` **133 → 134** (`properties`/`methods` unchanged; re-read the live total before applying — R9) (C-007) | WP01 | |
| T006 | Build then measure — `npx nx run-many --target=build --projects=tokens,styles,elements --skip-nx-cache`, then `node scripts/measure-elements-sizes.mjs` (writes `SIZES.md`); confirm the delta is a plausible small increase, never a compressed/gzipped figure hand-reasoned about (NFR-010, C-007) | WP01 | |
| T007 | Author 9 stories — elements layer: `Compact`, `CompactNoLinks`, `CompactSeveralLinks`, `CompactWithoutLegal`, `CompactLongContent`, `CompactRtl`, `CompactLightMode` (7); styles layer: `Compact`, `CompactLightMode` (2); every `LightMode` export wraps `class="sk-light"`, never `data-theme="light"` (FR-002, FR-003, FR-004, FR-005, FR-008, FR-011, FR-013, C-004, C-005) | WP01 | |
| T008 | Build Storybook, read the new story ids from `storybook-static/index.json` (never hand-derive), edit `expected-stories.json` — `byElement["sk-site-footer"]` grows, new key `"sk-site-footer (static path)"` added (precedent: `"sk-card (static path)"`), `total` moved by the same count (FR-007, NFR-004, C-007) | WP01 | [P] with T009/T010 |
| T009 | Extend `fixtures/elements-behaviour/src/sk-site-footer.test.ts` **in place** — landmark/heading/list absence at zero/one/several links in both paths (D-5), `[FR-007]` element↔static equivalence case (D-6), no-clock assertion extended to iterate `SITE_FOOTER_AXES` (D-7), `[FR-009]` base-form-untouched case (D-10), mixed-property-ignored case (D-10), confirm the existing colour-derived AA test passes with no new case (FR-005, FR-006, FR-007, FR-009, NFR-004, NFR-005, NFR-007, C-006) | WP01 | [P] with T008/T010 |
| T010 | `fixtures/vue-consumer/src/types.test-d.ts` — two lines asserting the generated Vue prop carries the literal union, mirroring the existing `sk-app-shell` lines (FR-007) | WP01 | [P] with T008/T009 |
| T011 | New Playwright spec `apps/storybook/src/tests/sk-site-footer-compact.spec.ts` — 390px/200%-zoom overflow, ≥44px target size, live narrow-stack threshold at 639px/641px, `dir="rtl"` mirroring, keyboard Tab order/visible focus (FR-011, FR-012, FR-013, NFR-001, NFR-002, NFR-006, NFR-011) | WP01 | [P] with T012 |
| T012 | New Playwright spec `apps/storybook/src/tests/sk-site-footer-compact-forced-colors.spec.ts` — `forced-colors: active`, boundary visible, link focus outline unclipped, idiom of `sk-copy-field-forced-colors.spec.ts` (NFR-003, NFR-006) | WP01 | [P] with T011 |
| T013 | Full local verification gate matrix — drift `--check` reruns, content/hygiene gates, `quality:all`, `npm run test` + `suite-selftest.mjs`, Storybook build + `run-axe-storybook.js`, full Playwright lane; confirm the port-6006 server under test is **this checkout's** build before trusting any Playwright result; `git add -A && git status --porcelain` empty (all SC-001…SC-014 gates) | WP01 | |
| T014 | Rebase onto the current `train/elements-first` head, push, confirm CI green, harvest the accepted visual-regression baseline from the **CI artifact** (never a local `--update-snapshots`), confirm `expected-parts.json`/`behaviours.json`/`mutations.json`/`expected-inert-theme-wrappers.json` are still untouched, run the pre-merge adversarial squad (tier C, C-011), open the PR with `Refs #354` / `Refs #352` — never `Closes` (NFR-008, C-011, C-012) | WP01 | |

**Dependency order, and why almost nothing is `[P]`.** T002 depends on T001 — the element imports
`siteFooterClasses()` from the markup module. T003 depends on T001/T002 — its selectors target the
exact class names the markup module and element declare. T004 depends on T001–T003 — it regenerates
from all three authored files at once (a partial regeneration is meaningless — `build-element-
markup.mjs` reads the whole module). T005 depends on T004 — the manifest must exist before the
ratchet number is knowable, not before it is guessed. T006 depends on T004 (a clean `dist/` needs the
regenerated sources) but not on T005. T007 depends on T004 (stories render the generated static
exports and exercise the new element property) and T005 is independent of it. T008 depends on T007 —
story ids do not exist before the stories do. T009 and T010 depend on T004 only (they exercise the
generated exports and the element directly, not Storybook), so they are marked `[P]` relative to T008
— three different files, no shared dependency among them, though in practice one implementer working
this single WP will still do them in some order. T011/T012 depend on T008 — both specs navigate to
built story URLs by id — and are `[P]` relative to each other (two independent new files). T013
depends on everything before it (it is the full gate matrix). T014 depends on T013.

## Work Packages

### WP01 — `sk-site-footer` gains a compact, server-renderable presentation

- **Goal**: `sk-site-footer` gains a second presentation of the **same** element, selected by one new
  public reactive property `presentation="compact"`, declared to the generator as a non-variant axis,
  rendered from the same authored markup module and generated by the same generator. The compact
  presentation renders a consumer-supplied brand/tagline/legal text block beside a consumer-supplied
  region of real, native `<a>` links, with no `<nav>`, no heading, no `<ul>`, and no `<hr>` — zero
  links therefore produces no scaffolding at all, structurally, in both the element and the generated
  static path. The existing full three-column presentation is untouched: its markup, classes, parts,
  stories, and CI visual baseline stay byte/pixel-identical.
- **Priority**: P1 — every user story in `spec.md` (US1–US6) is a property of this one presentation
  under a different condition; there is no independently deliverable slice.
- **Independent test**: `node scripts/build-element-markup.mjs --check` passes with `sk-site-footer.
  html` byte-identical; `node scripts/check-manifest-content.mjs` passes with the `5→6`/`133→134`
  ratchet; `npx nx run storybook:storybook:build --skip-nx-cache && node scripts/run-axe-storybook.js`
  passes with every new story id present in both the build and `expected-stories.json`, zero axe
  violations; `npx playwright test apps/storybook/src/tests/sk-site-footer-compact.spec.ts
  apps/storybook/src/tests/sk-site-footer-compact-forced-colors.spec.ts` passes; `npm run test`
  passes including the extended `sk-site-footer.test.ts`; `git diff` shows the existing full-
  presentation stories, `sk-site-footer.html`, and `SkSiteFooterHTML` completely unchanged; CI's
  `visual-regression-diffs` artifact reports zero diff for the existing full-presentation baselines.
- **Included subtasks**: T001–T014.
- **Dependencies**: none on other missions. Conditional dependency on #309/#310 evaluated and found
  **not to fire** (D-8, C-010) — no dependency recorded.
- **Estimated prompt size**: large (fourteen subtasks spanning an authored TS module, an authored
  element, an authored CSS sheet, a five-command generated fan-out, two ratchet files, nine stories, a
  behaviour-fixture extension, a type-level assertion, and two new Playwright specs).
- **Risks**: `plan.md`'s D-17 table (R1–R11) is carried into the WP prompt verbatim — most load-
  bearing here are R5 (a half-edited `expected-docs.json` ratchet), R7 (the compact branch leaking
  into the frozen base form), R9 (the ratchet total going stale if the branch's base has moved), and
  R11 (D-4a being read as unauthorized — it is not; see "Settled decisions" above).

## Parallelization

Real parallelism inside this WP is narrow: T008/T009/T010 share no file and share only the T004
dependency; T011/T012 share no file and share only the T008 dependency. Nothing else is safe to run
as two independent diffs — every other subtask either edits a file a later subtask also edits, or
consumes an artifact only a specific earlier subtask produces (D-14's own finding: the gates are
computed over the whole tree in one run, and three of them are same-commit obligations by
construction). This WP has exactly one implementer; the `[P]` markers record which pairs of subtasks
could theoretically be reordered without changing the outcome, not an instruction to split the WP.

## MVP scope

The whole work package. C-012 and the issue both mandate exactly one bounded WP and one PR; `plan.
md`'s D-14 shows the ratchet-file same-commit obligations make a smaller slice structurally
impossible to land green in isolation.

## Notes on requirements not separately tasked

- **FR-001** (one extended component, not a second footer) is a structural property every subtask
  observes by construction — there is no subtask "do not create a second component," verified
  negatively by T013's `git status`/`git diff` review (no new element directory, no new custom-
  element tag).
- **NFR-004** (zero axe violations) has no dedicated authoring subtask — it is discharged by T007's
  story authorship plus T013's `run-axe-storybook.js` run over every required story, per SC-006.
- **C-004** (`class="sk-light"`, never `data-theme="light"`) constrains T007's `LightMode` story
  exports; there is no separate subtask because it is a property of how those two stories are written,
  not a standalone deliverable.
- **C-009** (published API documented at authorship) constrains T002's property doc comment directly;
  no `@csspart` obligation exists because D-3 adds no new part.
- **C-010** (container-query axis is a recorded dependency, not a silent choice) is discharged by
  *absence* — T003 never introduces `container-type`, `@container`, or `:host([attr])`, and T013's
  gate matrix includes the `git grep` check that makes this a measured claim rather than a review
  opinion, not a positive "build the dependency" subtask.
- **C-011** (squad tier C, pre-merge only) and **C-012** (one WP, one PR, correct branch topology) are
  process constraints on the WP as a whole, discharged by T014, not by an authoring subtask.
- **C-013** (model routing — delegated implementation seats use the smaller model) is a governance
  constraint on how this WP is dispatched, not a subtask inside it; recorded in the WP frontmatter's
  `agent_profile` and `model` fields rather than as a T0xx item.
