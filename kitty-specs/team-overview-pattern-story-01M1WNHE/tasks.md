# Tasks: team-overview-pattern-story

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`  
**Branch**: `mission/team-overview-pattern-story` (mission target and eventual aggregate PR head)  
**External merge target**: `train/elements-first`

One cohesive work package. The immutable fixture, selectors, composition, story variants, story
ratchet, semantic/event/layout test, and visual cases all address the same non-publishable Storybook
surface. Splitting them would create a story that is not independently acceptable or a test package
that cannot render anything, while the operator requires one aggregate PR per mission.

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | Define the deeply readonly Team overview fixture and pure delivery/flow/feed selectors in the excluded story module; assert €1,840 − €166 = €1,674, 320+410+340+604 = €1,674, rounded 91%, 62 moves, and independent 50-WP inventory. (FR-002–FR-005, FR-007–FR-011; NFR-001–NFR-002) | WP01 | |
| T002 | Build the non-registered render helper and shell composition from existing public slots/properties only, including one account identity above logout and no private child reach-through. (FR-001, FR-006, FR-012, FR-022; C-001–C-005) | WP01 | |
| T003 | Compose Delivery return and Flow health with the exact evidence framing, subordinate annotations, fixed dates, present-only legend, route grammar, independent status summary, and aggregate matrix. (FR-005–FR-011; C-006) | WP01 | |
| T004 | Compose native operational lists and action rows with stable identities, exact lowercase references, row grammar, non-duplicated/reasoned feed events, at most two amber meanings, and non-link warnings. (FR-013–FR-015; C-006–C-007) | WP01 | |
| T005 | Export exactly six stories: `Default` displayed as `ApprovedDark`, `LightMode`, `Narrow`, `Scale50WPs`, `ControlledInteractions`, and `EmptyPartialData`; reuse one raw fixture for dark/light and label partial coverage honestly. (FR-017–FR-021; NFR-005–NFR-007) | WP01 | |
| T006 | Wire typed row/bar/route events to distinct Storybook `fn()` spies, add play assertions for exact flags/detail/counts, and prove emitted intent does not mutate controlled child selection. (FR-016, FR-019; NFR-004) | WP01 | |
| T007 | Add direct/source integrity coverage for deep immutability, selector purity, arithmetic, dates/hashes, public-element-only composition, absent Team Kitty imports/`sk-team-overview` definition, account/feed/tone invariants, and unchanged generated/package surfaces. (FR-023–FR-024; C-001–C-007) | WP01 | |
| T008 | Add `sk-team-overview-pattern.spec.ts` against the real built stories for semantics, arithmetic, event control, dark/light parity, 390×844 document order/overflow, and Scale50WPs geometry/ownership across configured browsers. (FR-024, FR-026; NFR-003–NFR-007, NFR-010) | WP01 | |
| T009 | Ratchet all six emitted IDs, add seven full-story and four focused visual cases, acquire/inspect CI-authoritative PNGs with honest Stitch/#149 provenance, and run axe over every pattern story. (FR-023, FR-025–FR-026; NFR-003, NFR-008) | WP01 | |
| T010 | Run the complete regeneration/drift/build/type/quality/behavior/mutation/Storybook/axe/visual/Playwright/release/security gates; rebase onto latest train, preserve append-only unions, rerun exact-head CI, terminalize #150's issue-matrix row, and present the exact SHA to three Codex lenses. (NFR-009–NFR-011; C-008–C-011) | WP01 | |

No `[P]` markers inside WP01: T001–T006 edit one story module; T007–T009 consume that exact
module and share the test/ratchet/visual surfaces; T010 is the integration tail. Parallelism belongs
at the independent Codex review point-cut, not as overlapping writers.

## Work Packages

### WP01 — Team overview Storybook composition and proof

- **Goal**: ship the six-story Team overview pattern from one immutable fixture, assembled solely
  from existing public elements, with executable arithmetic/content/event/reflow/accessibility
  proof and CI-authoritative visual evidence.
- **Priority**: P1 — this is #150's whole independently reviewable outcome.
- **Independent test**: build Storybook; confirm the six IDs in `index.json`; run the dedicated
  pattern Playwright spec in Chromium/Firefox and CI WebKit; run axe with 0 violations; run the
  visual suite with all eleven new baselines; regenerate every public artifact and prove unexpected
  CEM/React/Vue/CSS/markup/SIZES/ratchet changes are zero.
- **Included subtasks**: T001–T010.
- **Dependencies**: none inside the mission. External #79 and #145–#149 are closed and landed on
  planning base `2bbbd7b`.
- **Risks**: content arithmetic drift, domain fixture leakage into the package, duplicate story
  markup in tests, private shadow access, unauthenticated Stitch provenance, CI-only visual bytes,
  and train movement across shared ratchet/visual files.

## Parallelization

The implementation is a single writer. Three independent Codex reviewers run concurrently at the
Tier-C pre-merge point-cut, each with a distinct lens: data/content integrity; public
architecture/event/accessibility boundary; rebase/generated/visual/gate fidelity.

## MVP scope

WP01 in full. A partial composition without its one-source fixture and verification does not prove
the future Team Kitty seam.

## Requirement ownership notes

- Negative constraints C-001–C-007 are implemented by construction in T001–T006 and explicitly
  checked in T007/T010.
- No behavior/mutation subject is added because the story owns no custom-element behavior; T006/T008
  exercise existing child contracts.
- No token/CEM/wrapper/Vue/SIZES change is expected. T010 treats such drift as a blocker, not work to
  commit.
- T010 must set #150 from `in-mission` to terminal `fixed` before the WP moves to done, preventing
  the post-merge issue-matrix defect found during #148 closeout.

