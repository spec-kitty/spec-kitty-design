# Tasks: form-input-constraints-and-datalist

**Input**: `plan.md`, `spec.md`, `data-model.md`, `research.md`, `contracts/sk-form-input.contract.md`, `quickstart.md`
**Branch**: `mission/form-input-constraints-and-datalist` (planning base **and** merge target — this mission
lives entirely on its own mission branch; it PRs back to `train/elements-first` at merge time, per the
programme's standing branch strategy, not as a second planning branch here).

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | Forward `pattern`/`min`/`max`/`step`/`inputmode`/`autocomplete` (FR-001) | WP01 | |
| T002 | `readonly`: reflected property, submission split, `validate()` early return (FR-003, FR-004 guard) | WP01 | |
| T003 | Merge inner control's UA `ValidityState` flags into `validate()` (FR-002) | WP01 | |
| T004 | Shadow-root `<datalist>` + `options` property + rationale comments (FR-005, FR-006) | WP01 | |
| T005 | Behaviour tests: constraint round-trip + mutation reds (FR-001/SC-001) | WP01 | |
| T006 | Behaviour tests: merged-validity real-submit + readonly submission/validation split (FR-002/SC-002, FR-003/SC-003) | WP01 | |
| T007 | Behaviour tests: datalist node-identity + unmatched-value-stays-valid (FR-005/SC-005, FR-006) | WP01 | |
| T008 | Registry entries (`mutations.json`/`behaviours.json`) + Storybook story arms (constraints, readonly, datalist, `LightMode`) | WP01 | |
| T009 | Regenerate `custom-elements.json` + `check-manifest-content.mjs` (SC-007) | WP02 | |
| T010 | Regenerate React wrapper; confirm `options` routes through `useProperties` (FR-005/FR-006 delivery) | WP02 | |
| T011 | `fixtures/react-consumer` ssrSafe measurement test (NFR-001/SC-006) | WP02 | |
| T012 | Regenerate static styles-only markup; document any FR-008 gap | WP02 | |
| T013 | Size report regen + conformance-registry reconciliation note (SC-007) | WP02 | |
| T014 | Full drift-gate sweep + rebase-on-train check | WP02 | |

No `[P]` markers: every subtask in WP01 edits the same file (`sk-form-input.ts`) or a file whose
correctness depends on that file already being in its final shape (its own test file, the registry
entries describing its new mutation anchors); every subtask in WP02 regenerates FROM WP01's output
and must run in the printed order. There is no safe-to-parallelize pair in this mission.

## Work Packages

### WP01 — Element source: constraints, merged validity, readonly, datalist

- **Goal**: `sk-form-input` forwards all seven new attributes/properties, merges UA validity
  correctly, implements the corrected `readonly` contract, and renders its own shadow-root
  `<datalist>` — with every new behaviour covered by a red-before-green Vitest browser-mode test.
- **Priority**: P0 — everything else in this mission (generated artifacts, the React measurement)
  reads FROM this WP's output.
- **Independent test**: `npx vitest run --project browser fixtures/elements-behaviour/src/sk-form-input.test.ts`
  passes with every new `[SC-0xx]`-tagged test present and each one's mutation anchor registered.
- **Included subtasks**: T001, T002, T003, T004, T005, T006, T007, T008.
- **Dependencies**: none.
- **Estimated prompt size**: ~650 lines (8 subtasks — at the guideline's upper end because the
  seven-attribute forwarding, the readonly split, and the datalist render are all edits to the
  SAME method/render function and cannot be safely split across WPs without two WPs racing to own
  one file).
- **Risks**: see `plan.md` IC-02/IC-03's named traps (merge-not-replace; readonly flags-still-
  compute). Both are called out again in the WP prompt's own Risks section so the implementer
  reads them at the point of writing the code, not only in a planning document three files away.

### WP02 — Generated artifacts, React `ssrSafe` measurement, conformance close-out

- **Goal**: Every generator regenerates cleanly from WP01's source; the React wrapper delivers
  `options` correctly under `ssrSafe`, proven by a fixture test mirroring `sk-transition-matrix`'s
  already-shipped `[SC-010]` pattern; any gap in the generated static/no-build form is a
  documented limitation, not a silent divergence; the mission's size report and behaviour-registry
  bookkeeping are current before hand-off to the squad's pre-merge pass.
- **Priority**: P0 — required for SC-006/SC-007/FR-008, and for the manifest/wrapper drift gates
  that would otherwise fail CI on this mission's first push.
- **Independent test**: `node scripts/build-react-wrappers.mjs --check` and
  `npx nx run elements:analyze && git diff --exit-code -- packages/elements/custom-elements.json`
  both exit 0; the new `fixtures/react-consumer` test passes.
- **Included subtasks**: T009, T010, T011, T012, T013, T014.
- **Dependencies**: WP01 (regenerating a manifest from source that does not yet have the new
  members is meaningless).
- **Estimated prompt size**: ~450 lines.
- **Risks**: see `plan.md` IC-06's risk (replication vs. re-derivation of the `ssrSafe` answer) and
  R6's registry-numbering note (fresh `SC-0xx` ids, not spec.md's own labels, already handled by
  WP01's T008 — WP02 only VERIFIES the registration is present and current, it does not re-author it).

## Parallelization

None available in this mission — see the Subtask Index note above. Two WPs, strictly sequential.

## MVP scope

WP01 alone is a coherent, mergeable slice IF the mission's exit criteria did not also require the
React measurement and generated-artifact currency (they do — FR-008/SC-006/SC-007 are binding
requirements, not stretch goals) — so WP01 is the natural review/read-ahead unit, but WP02 is not
optional scope-creep; both WPs are required for this mission's Success Criteria to be met.

## Notes on requirements NOT separately tasked

- **FR-004** (disabled behaviour untouched) is a non-regression guard, not new work: WP01's T002
  and T006 must assert the EXISTING `disabled` tests still pass unmodified alongside the new
  `readonly` ones, rather than tasking a no-op change.
- **NFR-002** (forced-colors baseline from #176) and **NFR-003** (no behaviour change to
  `sk-form-textarea`/`form-control-base.ts` contracts) are constraints WP01's own review checklist
  must confirm, not separate build tasks.
- **SC-007's "conformance-matrix entry"**: `scripts/build-conformance-matrix.mjs` and
  `conformance-matrix.json` do **not exist** in this train snapshot (`dcf7af2`) — confirmed by
  direct filesystem check, not assumed. The mechanism that DOES exist and IS current is the
  `mutations.json`/`behaviours.json` registry (WP01 T008, verified by WP02 T013). If the
  conformance-matrix generator has landed on `train/elements-first` by the time this mission
  rebases (plan.md/quickstart.md both require a pre-final-gate rebase), WP02's T013 must also
  register there; this is flagged so the rebase step does not silently skip a real, newly-added
  gate.
