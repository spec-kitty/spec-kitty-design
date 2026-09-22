# Tasks: sk-action-row static form

**Input**: Design documents from `kitty-specs/action-row-static-form-01M25JSV/`
**Prerequisites**: plan.md, spec.md

**Delivery constraint (issue #307, epic #300)**: one bounded Work Package, one PR. This mission
does not split into multiple WPs — the scope (one authored markup module, its generated output,
its parity/structural/absent-state proofs, stories, docs and ratchet checks, all on one existing
component) fits within a single, larger-than-default WP rather than being force-split to satisfy
the generic 3-7-subtask sizing guideline. See plan.md's Implementation Concern Map and this
mission's own report for why the scope was judged to genuinely fit one WP.

## Subtask Index

| ID | Description | WP | Parallel |
|----|--------------|----|----|
| T001 | Author `sk-action-row.markup.ts`: empty `ACTION_ROW_VARIANTS`, `ACTION_ROW_AXES` (Card/Flush/Link), `ActionRowStaticOptions`, `actionRowClasses` (warn/degrade), `actionRowStaticHtml` (throw, two-element wrapper, two trigger shapes, per-part omission on absence) | WP01 | |
| T002 | Author the styles-layer stories file `sk-action-row-html.stories.ts`, rendering only from generated exports | WP01 | |
| T003 | Regenerate all generated artifacts (element markup → static HTML/index.ts, manifest, React wrappers, Vue types, a real build, `SIZES.md`); confirm zero `custom-elements.json` diff | WP01 | |
| T004 | Reflow-parity test: sized-frame comparison of static vs. shadow form at 360/400/401px, plus the `.sk-action-row-host` literal-block equality pin and the `href`-escaping proof | WP01 | |
| T005 | Structural sibling-not-descendant test, against every controls-bearing exemplar and the shadow root as control | WP01 | |
| T006 | Absent-state tests: `aria-current` presence/absence, flush computed-style presence/absence, each optional part's DOM presence/absence, controls DOM presence/absence | WP01 | |
| T007 | Keyboard order and 44px target-size test across route + multi-control row, narrow and desktop widths | WP01 | |
| T008 | Stories: full required-matrix coverage (mark/metadata/tags/supporting present-absent, one/several/no controls, route mode, `aria-current`, long content, narrow/desktop, dark default + `LightMode`, isolated single-row fragment) | WP01 | |
| T009 | Forced-colors, RTL, 200%-zoom and reduced-motion verification stories/assertions (inherited CSS, new proof only) | WP01 | |
| T010 | Ratchet check: confirm `expected-docs.json`/`expected-parts.json` need no change; confirm `behaviours.json`/`mutations.json` need no new subject | WP01 | |
| T011 | Docs (`docs/design-system/using-components.md`, literal host-CSS block + #309 note), `#283` boundary prose for the PR body, then the full gate list from `docs/contributing/adding-a-component.md` §7 and commit | WP01 | |

No `[P]` markers: every subtask reads or depends on files earlier subtasks in this WP also touch
(the markup module is read by nearly every later subtask), and this is a single-WP mission by
design (C-001), so there is no cross-WP parallelism to schedule.

## Phase 1: The wrapper, its parity proofs, and its gates (WP01)

### WP01 — sk-action-row static form: two-element wrapper markup, parity proofs, docs

**Goal**: Ship the complete, one-PR static form for `sk-action-row` — the authored markup module,
its generated static HTML/index.ts, the reflow-parity proof against the shadow form at the ADR-15
reflow boundary, the sibling-not-descendant structural proof (#272), the present/absent-state
proofs (the #308 defect pattern), stories, docs, and ratchet confirmation — per FR-001 through
FR-025.

**Priority**: P1 (User Stories 1 and 2) with P2 elements (User Stories 3 and 4) folded in, since
the issue requires one PR and none of the four user stories is separately shippable — a static
form with no parity test, or with controls nested inside the trigger, is not the static form the
issue asked for.

**Independent Test**: the generated static exemplar and the real `<sk-action-row>` element compute
identical `flex-wrap`/`grid-template-*` values at 360/400/401px; `.sk-action-row__trigger
.sk-action-row__controls` never matches in either form; `npm test`,
`node scripts/suite-selftest.mjs`, and the full gate list in plan.md's IC-01 through IC-06 all
pass; the mission's own PR is the only PR the epic needs from #307.

**Included subtasks**: T001, T002, T003, T004, T005, T006, T007, T008, T009, T010, T011.

**Dependencies**: none (first and only WP in this mission).

**Risks**: see plan.md's Charter Check and Implementation Concern Map — the styles-layer stories
file naming convention must be confirmed against precedent before authoring (T002); the parity
test must be shown to actually discriminate (fail against a deliberately collapsed single-element
form) rather than pass by construction; nx cache masking drift on `--skip-nx-cache`-less runs;
`measure-elements-sizes.mjs` reading stale `dist/`; and another session moving
`train/elements-first` mid-mission (re-fetch before implementing, per standing practice).

Prompt: `tasks/WP01-static-action-row.md`
