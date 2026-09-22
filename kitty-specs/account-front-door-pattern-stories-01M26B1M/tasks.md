# Tasks: Account Front Door Pattern Stories

**Mission**: `account-front-door-pattern-stories-01M26B1M`
**Input**: `spec.md` (`dac543da`), `plan.md` (`4ef5a82a`)
**Planning base / merge target**: `mission/account-front-door-pattern-stories` (topology `single_branch` — verified in `meta.json`)

One work package and one PR (C-017, issue #355's own "one bounded Work Package and one PR").
`plan.md` Part 4 argues at length why this does not split further: every composition shares one
fixture module, one projection, one inline `<style>` block, one ratchet key and one `$comment`
entry; splitting by composition serialises six WPs on five shared artefacts for zero parallelism,
splitting by lane inverts red-first evidence, and splitting public from authenticated saves only
the chrome (everything else — fixture module, freeze helper, projection contract, floor class,
ratchet key — is shared). The spec's own deferrable/blocked seam (FR-030, C-012) is also closed:
Part 0 of `plan.md` re-verified `train/elements-first@0a232a01` on 2026-09-11 and found every
composed dependency surface already landed except `.sk-button--secondary`'s open colour-only
defect (#155), which the mission works around rather than waits on. There is nothing left to
sequence a second work package around.

**Both of `plan.md`'s open decisions are settled, not carried forward as `[NEEDS DECISION]`:**
D-1 (which tone carries P20's `Re-send Verification`) is resolved as option (a) — compose
`.sk-button .sk-button--secondary` bare, document the open #155 defect where a reader will meet
it, add no pattern-local border compensation (epic #352 forbids reproducing
`.front-door-secondary-action`). D-2 (whether composition 6 composes `sk-action-row`) is resolved
as option (a) — it does not: the shipped anatomy is a native radio choice group plus a flat row of
plain submit buttons with no identity/title/trigger, so a pattern-local `__email-actions` row with
its own 44px floor is composed instead. No further `[NEEDS DECISION]` was found while authoring
this task breakdown — `plan.md` closes every seam it opens.

## Subtask Index

| ID | Description | Requirements | Parallel |
|---|---|---|---|
| T001 | Write the failing Playwright contract for every story id and surface this mission will publish, before the fixture/stories modules exist — red for a missing story/surface, never for missing infrastructure | FR-031 | |
| T002 | Author the frozen fixture family and pure projection: twelve states, truth constraints made unrepresentable at the type level, `LegalBlock[]` document representation | FR-006, FR-007, FR-009, FR-014, FR-016, FR-018, FR-020, FR-022, FR-024, C-011, C-014 | |
| T003 | Compose the shared route-aware public chrome once (header/footer/theme-toggle) and the landing composition (P1) | FR-001, FR-002, FR-003, FR-004, FR-010, FR-023, FR-025, FR-027, C-011, C-015, NFR-003 | |
| T004 | Compose the boundary-framed compositions: entry boundary, submitted validation, recovery sent, terminal (P22/P23), legal unavailable | FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, FR-014, FR-015, FR-016, FR-018, C-003, C-010, C-013 | |
| T005 | Compose the document and authenticated compositions: legal published, email management, password change/set | FR-017, FR-019, FR-020, FR-021, FR-022, C-013, C-015 | |
| T006 | Add the ten system-condition proof stories (three `LightMode` ids, `ForcedColors`, `ReducedMotion`, `Rtl`, `Narrow390`, `ShortViewport`, `Zoom200`, `LongStrings`) | FR-025, FR-026, NFR-002, NFR-004, NFR-005, NFR-013 | |
| T007 | Register the ratchet (derived, never hand-guessed) and document the pattern section | FR-028, SC-001, SC-019, C-016 | |
| T008 | Complete the fixture-behaviour and browser evidence: freeze/purity/truth-preservation, tokens-only assertion demonstrated failing first, DOM/a11y/geometry/keyboard/network assertions across all 20 stories, the C-004 path-allowlist and dependency-owned-class assertions | FR-004, FR-011, FR-012, FR-013, FR-019, FR-020, FR-021, FR-024, FR-026, FR-027, NFR-001, NFR-003–NFR-008, NFR-013, C-004, C-006, C-007 | |
| T009 | Harvest and review CI-produced visual baselines — never a local `--update-snapshots` | NFR-010, SC-017 | |
| T010 | Run the full local gate set from `plan.md` Part 5 | NFR-001, NFR-009, NFR-010, NFR-011, NFR-012, SC-010, SC-011, SC-012, SC-013 | |
| T011 | Rebase onto the current `train/elements-first` tip, resolve contention with PR #409, re-derive the ratchet total, re-run every gate on the exact final SHA | FR-029, SC-015, C-012, C-017, C-018, C-020, SC-020 | |

No subtask is parallel: T001 precedes every authored surface; T002 is the source T003–T006 compose
against; T007–T009 require the complete family; T010 is the full local gate pass; T011 is the final
integration cut and cannot start before every earlier subtask is green on a stable local SHA.

## Work Packages

### WP01 — Account Front Door pattern stories

- **Goal**: publish the six approved Family 6 compositions as a Storybook-only pattern family
  (`Patterns/Account Front Door`, 20 story ids) composed from surfaces already on
  `train/elements-first`, native semantics, immutable frozen fixtures and pure projections — no
  runtime component.
- **Priority**: P0 — this is issue #355's complete deliverable, child of epic #352.
- **Independent test**: the fixture-behaviour suite proves every fixture frozen and every
  projection pure; the browser suite proves the DOM/a11y/geometry/keyboard/network claim for all 20
  stories; `run-axe-storybook.js` proves the story ratchet and zero WCAG 2.1 AA violations;
  `check-pattern-composition.mjs` (+ `--selftest`) proves no private-root reach, every `::part()`
  declared, no CSS for an owned class in any of the four spellings, and all four anti-vacuity
  floors; visual baselines are harvested from CI and reviewed against the Family 6 corpus.
- **Included subtasks**: T001–T011.
- **Dependencies**: none internal. External: every composed surface (`.sk-public-header`,
  `sk-site-footer` compact, `.sk-boundary-page`, `sk-theme-toggle`, `.sk-radio-choice-group`,
  `.sk-form-field`/`.sk-input`, `.sk-button` incl. `--danger-secondary`, `sk-copy-field`,
  `sk-app-shell`, `sk-page-header`) is already merged to `train/elements-first@0a232a01` per
  `plan.md` Part 0 — re-verify at T011, the train moves.
- **Estimated prompt size**: large — one fixture module, one stories module (20 ids), two test
  files, one ratchet entry, one docs section, CI-harvested baselines, full gate pass.
- **Risks**: the train moved eleven times during sibling missions and PR #409
  (`mission/cli-auth-pattern-stories`) is a live contender for `expected-stories.json`,
  `visual.spec.ts` and the `Patterns/` namespace — expect a rebase collision at T011. Port 6006 is
  shared with sibling checkouts. A carried (not re-derived) ratchet `total` silently under-counts
  after any rebase. Mitigations are named per-subtask below and in `plan.md` Part 6.

## Parallelization

None. One implementer seat carries the whole WP in dependency order; a separate pre-merge
adversarial squad (tier C, per issue #355) reviews the frozen final diff before the PR is opened
for operator merge.

## MVP Scope

The entire work package. Omitting any of the six compositions, any of the ten system-condition
proofs, the tokens-only assertion, the C-004 diff-boundary assertions, or CI-harvested visual
baselines fails the spec's own Success Criteria (SC-001 through SC-020) and leaves the epic's truth
constraints partially proven.
