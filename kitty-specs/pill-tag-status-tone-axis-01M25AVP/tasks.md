# Tasks: sk-pill-tag status-tone axis

**Input**: Design documents from `kitty-specs/pill-tag-status-tone-axis-01M25AVP/`
**Prerequisites**: plan.md, spec.md

**Delivery constraint (issue #302, epic #300)**: one bounded Work Package, one PR. This mission
does not split into multiple WPs — the scope (no new tokens, no new element, one existing
component) fits within a single, larger-than-default WP rather than being force-split to satisfy
the generic 3-7-subtask sizing guideline. See plan.md's Complexity Tracking and this mission's own
report for why the scope was judged to genuinely fit one WP.

## Subtask Index

| ID | Description | WP | Parallel |
|----|--------------|----|----|
| T001 | Derive `PILL_TAG_STATUSES` from `STATUS_TONES` in `sk-pill-tag.markup.ts`, plus `isPillTagStatus`/`unknownStatusMessage` | WP01 | |
| T002 | Extend `pillTagClasses` (warn/degrade) and `pillTagStaticHtml`/`PillTagStaticOptions` (throw) with the `status` axis; extend `PILL_TAG_AXES` with derived `Status<Tone>` entries | WP01 | |
| T003 | Add the reflected `status` property to `sk-pill-tag.ts`, documented, wired into `render()` | WP01 | |
| T004 | Author the CSS: six `.sk-pill-tag--status-<tone>` blocks, brand-vs-status precedence comment, forced-colors block, measured-contrast comment | WP01 | |
| T005 | Regenerate all generated artifacts (styles CSS modules, element markup/HTML/index.ts, manifest, React wrappers, Vue types, a real build, `SIZES.md`) | WP01 | |
| T006 | New `fixtures/elements-behaviour/src/sk-pill-tag.test.ts`: vocabulary-order proof, fail-open, static-throw, empty-string-is-absent, precedence, `[SC-010]` upgrade-reach | WP01 | |
| T007 | Register `sk-pill-tag` as an `SC-010` subject in `behaviours.json`; add the red-first `SC-010` arm to `mutations.json`; verify with `suite-selftest.mjs` | WP01 | |
| T008 | Stories: element (`sk-pill-tag.stories.ts`) and static-path (`sk-pill-tag.stories.ts` in `packages/styles`), covering every required case from the issue's "Required stories and tests" list | WP01 | |
| T009 | Forced-colors distinguishability assertion in `apps/storybook/src/tests/elements-load.spec.ts`, mirroring `sk-card`'s equivalent case | WP01 | |
| T010 | Update ratchets: `expected-docs.json` (attributes 2 → 3, `total` +1), `expected-stories.json` (new story ids, `total` bumped); confirm `expected-parts.json` needs no change | WP01 | |
| T011 | Docs (`docs/design-system/using-components.md`), then run the full gate list from `docs/contributing/adding-a-component.md` §7 and commit | WP01 | |

No `[P]` markers: every subtask touches files another subtask in this WP also touches or depends
on (the markup module, the element, and the CSS are read by nearly every later subtask), and this
is a single-WP mission by design (C-001), so there is no cross-WP parallelism to schedule.

## Phase 1: The axis, its proofs, and its gates (WP01)

### WP01 — sk-pill-tag status-tone axis: source, proofs, ratchets

**Goal**: Ship the complete, one-PR status-tone axis on `sk-pill-tag` — markup derivation, element
attribute, CSS, generated artifacts, behaviour tests, stories, forced-colors assertion, ratchets,
and docs — per FR-001 through FR-019.

**Priority**: P1 (User Story 1) with P2 elements (User Stories 2 and 3) folded in, since the issue
requires one PR and none of the three user stories is separately shippable — a status axis with no
derivation test or no precedence rule is not the axis the issue asked for.

**Independent Test**: `<sk-pill-tag status="success">Active</sk-pill-tag>` and the generated static
`SkPillTagStatusSuccessHTML` both compute the same background/foreground pair; `npm test`,
`node scripts/suite-selftest.mjs`, and the full gate list in plan.md's Design §7 all pass; the
mission's own PR is the only PR the epic needs from #302.

**Included subtasks**: T001, T002, T003, T004, T005, T006, T007, T008, T009, T010, T011.

**Dependencies**: none (first and only WP in this mission).

**Risks**: see plan.md's Risks table — vocabulary spelled twice, nx cache masking drift, SIZES.md
against stale `dist/`, the forced-colors border reading as a rendering change outside forced-colors
mode, another session moving the train mid-mission, and `expected-stories.json` gaining a hard gate
on new story ids.

Prompt: `tasks/WP01-status-tone-axis.md`
