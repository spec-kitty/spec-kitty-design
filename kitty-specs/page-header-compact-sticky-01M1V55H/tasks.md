# Tasks: page-header-compact-sticky

**Input**: `plan.md`, `spec.md`
**Branch**: `mission/page-header-compact-sticky` (planning base **and** merge target — `single_branch`
topology; the PR onto `train/elements-first` is opened by the loop and merged by the operator).

Two work packages, split where the dependency is real: the axes cannot be verified before they
exist, and every generated artefact in this repo is derived from the element the first package
writes. They are not split by file type — the stylesheet, the element and the tokens are one change,
because a token referenced before it is declared fails `check-element-css-hygiene.mjs` and a class
applied before it is styled is a green no-op.

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | Add `--sk-layout-page-header-sticky-offset`, `-compact-height`, `-sticky-layer` and the derived `-sticky-scroll-margin` to **both** blocks of `tokens.css`; regenerate the catalogue (FR-007, FR-008) | WP01 | |
| T002 | Compact density in `sk-page-header.css`: padding, gap, single-row text, truncation, non-shrinking actions, `min-block-size` (FR-001, FR-004, FR-005) | WP01 | |
| T003 | Sticky on `:host([sticky])` — offset, stacking layer, elevation and the reserved border band (FR-002, FR-008) | WP01 | |
| T004 | Two separate viewport drop blocks, `(max-width: 720px)` and `(max-height: 480px)`, each returning the host to static flow and removing the elevation (FR-006) | WP01 | |
| T005 | Reduced-motion block over the one transitioning property, and a forced-colors block overriding the longhand `border-block-end-color` (FR-009, FR-010) | WP01 | |
| T006 | Two reflected properties, a warn-and-degrade classes helper, and the JSDoc that becomes published API — leaving the part/slot tree byte-identical (FR-001, FR-002, FR-003, FR-011) | WP01 | |
| T007 | Regenerate `sk-page-header.css.js` / `.css.d.ts` and confirm the existing SC-013 mutation's anchor still matches (FR-012) | WP01 | |
| T008 | Behaviour tests: four-combination orthogonality, attribute↔property both ways, `[SC-010]` pre-upgrade reflection, narrow reflow reachability, live and sheet-read sticky-drop, reduced-motion and forced-colors sheet reads (FR-001…FR-006, FR-009, FR-010) | WP02 | |
| T009 | The no-timer guard in two halves: comment-stripped source scan with an anti-vacuity anchor, plus the extended runtime spy (FR-011) | WP02 | |
| T010 | `behaviours.json` SC-010 subject and two `mutations.json` arms, one per axis; confirm guard 7 and guard 5's collateral bound (FR-001, FR-002, NFR-003, C-004) | WP02 | |
| T011 | Stories: compact, sticky-over-a-long-fixture, narrow reflow, short viewport, verbatim sync with a slotted indicator, and `LightMode` in `class="sk-light"` (FR-012, NFR-002, C-001) | WP02 | |
| T012 | Document the scroll-margin and scroll-container contract once, on the header, in `docs/design-system/using-components.md` (FR-007, C-002) | WP02 | |
| T013 | Update `expected-docs.json` and `expected-stories.json` exactly; confirm `expected-parts.json` is unchanged (FR-012, NFR-001) | WP02 | |
| T014 | Regenerate manifest, React wrappers, Vue types and `SIZES.md` **after a real build** and with `--skip-nx-cache`; run every gate in the recipe's step 7 (FR-012, NFR-003) | WP02 | |
| T015 | File the behaviour-registry gap as an issue with the measurement attached, and record the number here (C-004) | WP02 | |

No `[P]` markers: T001–T007 are one interlocking change to one component, and T008–T015 all read
what it produced.

## Work Packages

### WP01 — The two axes, in tokens, stylesheet and element

- **Goal**: `sk-page-header` carries reflected `density` and `sticky` axes; the compact form is the
  same five slots at reduced density on one row with a pinned trailing action; the host is the
  sticky box; stickiness is dropped by two viewport thresholds; reduced motion and forced colors are
  handled in the shape `sk-skip-link.css` and `sk-data-table.css` already establish; every value is
  a token.
- **Priority**: P0.
- **Independent test**: `npx nx run tokens:catalogue` lists the four new tokens;
  `node scripts/check-element-css-hygiene.mjs` and `npm run quality:stylelint` pass;
  `node scripts/build-elements-css.mjs --check` is clean; the element compiles under
  `node scripts/typecheck-all.mjs`.
- **Included subtasks**: T001–T007.
- **Dependencies**: none.
- **Risks**: `plan.md` IC-02 and IC-03 — a duplicate `(selector, media)` declaration, and the
  existing SC-013 mutation anchor that matches an exact indented template line.

### WP02 — Verification, stories, docs and generated artefacts

- **Goal**: every requirement in `spec.md` is checked by something that can go red, the two axes
  carry registered mutations, the stories the issue names exist and pass axe, the scroll-margin
  contract is documented once, and every committed generated artefact is current.
- **Priority**: P0.
- **Independent test**: `npm run test` green; `node scripts/suite-selftest.mjs` reports every
  mutation's named red with a green baseline and stays under the ceiling; the recipe's step-7 gate
  list passes; `git status --porcelain` is empty after regeneration.
- **Included subtasks**: T008–T015.
- **Dependencies**: WP01.
- **Risks**: `plan.md` IC-04 and IC-05 — guard 5's collateral bound, the mutation budget, and the
  two artefacts that silently pass locally (`SIZES.md` needs a build first; nx cache makes a
  `--check` compare a stale artefact with itself).

## Parallelization

None. One component, one implementer.

## MVP scope

Both work packages. WP01 alone ships two axes nothing proves; WP02 alone has nothing to prove.

## Notes on requirements not separately tasked

- **NFR-001** is a property of T006 and T013 together: exactly two attributes are added and
  `expected-docs.json` is exact-equality, so the figure cannot drift silently.
- **NFR-002** is discharged by the repository's own a11y job over the stories T011 adds; there is no
  separate subtask because a story that fails axe is not a story this mission can ship.
- **C-001** (no invented status tokens) and **C-002** (no new element, no shell change) are
  boundaries on T001–T012 rather than work: they are confirmed by `git diff --name-only` showing no
  new file under `packages/elements/src` or `packages/styles/src` and no `--sk-status-*` token.
- **C-003** (ADR records and index untouched) is confirmed the same way, over
  `docs/architecture/decisions/`, `docs/architecture/README.md` and `scripts/check-adr-index.mjs`.
- **C-004** is why T015 exists: the registry gap is filed, not minted.
