# Tasks: form-input-constraints-and-datalist

**Input**: `plan.md`, `spec.md`, `data-model.md`, `research.md`, `contracts/sk-form-input.contract.md`, `quickstart.md`
**Branch**: `mission/form-input-constraints-and-datalist` (planning base **and** merge target — this mission
lives entirely on its own mission branch; it PRs back to `train/elements-first` at merge time, per the
programme's standing branch strategy, not as a second planning branch here).

**Post-tasks squad BLOCK, folded in.** The squad reproduced two CRITICAL engine defects in the
original T002/T003 guidance (a `willUpdate`/render-timing bug in the validity merge;
`setValidity(flags, '')` throwing), reversed the `readonly` reflection decision, corrected a false
claim about the behaviour-id registry being open (it is closed, `config-contract.test.ts`
hard-codes the applicable set), corrected the `options` field-declaration shape, and found two
files this plan had not touched at all (`vue.d.ts`, `expected-docs.json`) plus one WP02 subtask
pointed at files that do not exist. All folded in; see `plan.md` and `research.md`.

**Second fold, coordinator-directed: WP01 merged from 8 subtasks to 4.** The original T005–T008
put every test in its own later subtask, sequenced strictly after the code it covers — the
Objectives section's own claim ("every subtask IS a test-writing subtask") was contradicted by the
subtask boundaries themselves, making red-before-green not structurally reachable (DIRECTIVE_034).
Merged pairwise: T001+T005 → **T001**; T002+T003+T006 → **T002**; T004+T007 → **T003**; T008 →
**T004** (kept separate — cross-cutting registry/story bookkeeping over all three, not a
test-writing phase for one concern). WP01 dropped from ~806 to ~560 lines by cutting duplicated
context blocks, not by cutting steps.

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | Forward `pattern`/`min`/`max`/`step`/`inputmode`/`autocomplete`, reflected, WITH round-trip tests (FR-001/SC-001) — merged with former T005 | WP01 | |
| T002 | `readonly` (**unreflected**, reversed post-squad) + merged validity (pre-read DOM sync, non-throwing fallback message, corrected flag list), WITH their tests (mount-time, post-mount-mutation, message-fallback, readonly, post-reset arms) (FR-002/SC-002, FR-003/SC-003, FR-004) — merged with former T003+T006 | WP01 | |
| T003 | Shadow-root `<datalist>` + `options` property (field-initializer form) + rationale comments, WITH its tests (node-identity, absent-case, unmatched-value) (FR-005, FR-006, SC-005) — merged with former T007, field shape corrected | WP01 | |
| T004 | Registry ARMS under EXISTING `(id, subject)` pairs (`mutations.json`/`behaviours.json`) + Storybook story arms (constraints, readonly, datalist, `LightMode`) — no new ids, corrected post-squad; formerly T008 | WP01 | |
| T009 | Regenerate `custom-elements.json` + `check-manifest-content.mjs` (SC-007) | WP02 | |
| T010 | Regenerate React wrapper; confirm `options` routes through `useProperties`; confirm prop naming (`readonly`/`inputmode`, lowercase) | WP02 | |
| T011 | `fixtures/react-consumer` ssrSafe measurement test (NFR-001/SC-006) | WP02 | |
| T012 | Document the FR-008 static-markup gap against the REAL file location (`packages/styles/src/form-field/sk-form-input-*.html`) — repointed post-squad, no edit to that directory | WP02 | |
| T013 | Size report regen + conformance-registry reconciliation note (SC-007) | WP02 | |
| T014 | Regenerate `packages/elements/vue.d.ts`; hand-update `expected-docs.json` counts (9→16 attrs, 0→1 properties, total 65→73) — new, post-squad | WP02 | |
| T015 | Full drift-gate sweep + rebase-on-train check (now runs LAST, after T014) | WP02 | |

WP02's T009–T015 numbering is unaffected by WP01's merge (WP01's subtask IDs restart cleanly at
T001–T004; WP02 keeps its original T009–T015 range rather than renumbering, since WP02 was
authored, reviewed, and cross-referenced against those numbers separately).

No `[P]` markers: every subtask in WP01 edits the same file (`sk-form-input.ts`) or a file whose
correctness depends on that file already being in its final shape (its own test file, the registry
entries describing its new mutation anchors); every subtask in WP02 regenerates FROM WP01's output
and must run in the printed order. There is no safe-to-parallelize pair in this mission.

## Work Packages

### WP01 — Element source: constraints, merged validity, readonly, datalist

- **Goal**: `sk-form-input` forwards all seven new attributes/properties, merges UA validity
  correctly (against the CURRENT update's DOM state, with a non-throwing message), implements the
  corrected — and now twice-corrected — `readonly` contract (unreflected), and renders its own
  shadow-root `<datalist>` — with every new behaviour covered by a red-before-green Vitest
  browser-mode test, written in the SAME subtask as its code.
- **Priority**: P0 — everything else in this mission (generated artifacts, the React measurement)
  reads FROM this WP's output.
- **Independent test**: `npx vitest run --project browser fixtures/elements-behaviour/src/sk-form-input.test.ts`
  passes with every new `[SC-0xx]`-tagged test present and each one's mutation anchor registered.
- **Included subtasks**: T001, T002, T003, T004.
- **Dependencies**: none.
- **Estimated prompt size**: ~560 lines (4 subtasks — merged pairwise per the coordinator's
  direction, code-with-its-own-test rather than code-then-tests-later, cutting the duplicated
  context blocks that were most of the original 806 lines without cutting any step).
- **Risks**: see `plan.md` IC-02/IC-03's named traps (read-before-write ordering; the
  `setValidity` throw; readonly-flags-still-compute; readonly reflection now reversed). All are
  called out again in the WP prompt's own Risks section so the implementer reads them at the
  point of writing the code, not only in a planning document three files away.

### WP02 — Generated artifacts, React `ssrSafe` measurement, conformance close-out

- **Goal**: Every generator regenerates cleanly from WP01's source (now including `vue.d.ts` and
  `expected-docs.json`, missed in the original plan); the React wrapper delivers `options`
  correctly under `ssrSafe` with the correct (lowercase) prop names, proven by a fixture test
  mirroring `sk-transition-matrix`'s already-shipped `[SC-010]` pattern; the FR-008 static-markup
  gap is documented against the REAL file location, not a nonexistent one; the mission's size
  report and behaviour-registry bookkeeping are current before hand-off to the squad's pre-merge
  pass.
- **Priority**: P0 — required for SC-006/SC-007/FR-008, and for the manifest/wrapper/`vue.d.ts`/
  `expected-docs.json` drift gates that would otherwise fail CI on this mission's first push.
- **Independent test**: `node scripts/build-react-wrappers.mjs --check`,
  `node scripts/build-vue-types.mjs --check`,
  `npx nx run elements:analyze && git diff --exit-code -- packages/elements/custom-elements.json`,
  and `node scripts/check-manifest-content.mjs` all exit 0; the new `fixtures/react-consumer` test
  passes.
- **Included subtasks**: T009, T010, T011, T012, T013, T014, T015.
- **Dependencies**: WP01 (regenerating a manifest from source that does not yet have the new
  members is meaningless).
- **Estimated prompt size**: ~500 lines (grew by one subtask, T015).
- **Risks**: see `plan.md` IC-06's risk (replication vs. re-derivation of the `ssrSafe` answer),
  R6's corrected registry note (the id space is CLOSED — WP02 only VERIFIES WP01's arm
  registrations are present and current, it does not add new ids), and R7/R8's newly-identified
  drift surfaces (form-field is out of scope; `vue.d.ts`/`expected-docs.json` are in scope, newly).

## Parallelization

None available in this mission — see the Subtask Index note above. Two WPs, strictly sequential.

## MVP scope

WP01 alone is a coherent, mergeable slice IF the mission's exit criteria did not also require the
React measurement and generated-artifact currency (they do — FR-008/SC-006/SC-007 are binding
requirements, not stretch goals) — so WP01 is the natural review/read-ahead unit, but WP02 is not
optional scope-creep; both WPs are required for this mission's Success Criteria to be met.

## Notes on requirements NOT separately tasked

- **FR-004** (disabled behaviour untouched) is a non-regression guard, not new work: WP01's T002
  must assert the EXISTING `disabled` tests still pass unmodified alongside the new `readonly`
  ones, rather than tasking a no-op change. FR-004 also now covers the post-reset validity
  correctness arm (also T002), which is the SAME root-cause fix as the read-before-write ordering
  defect, tested at a different call site.
- **NFR-002** (forced-colors baseline from #176) and **NFR-003** (no behaviour change to
  `sk-form-textarea`/`form-control-base.ts` contracts) are constraints WP01's own review checklist
  must confirm, not separate build tasks. NFR-003 is now load-bearing for IC-07's corrected
  decision too: the reason `readonly`/`autocomplete`/`inputmode` do NOT move to the shared base
  despite genuinely applying to `<textarea>` is precisely that doing so would risk violating
  NFR-003 (silently-inert inherited attributes on `sk-form-textarea`).
- **The behaviour-id registry is CLOSED, not merely "use fresh ids" as originally noted.**
  `tests/node/config-contract.test.ts` hard-codes the applicable set as EXACTLY `SC-002`–`SC-015`
  and asserts exact-equality against it; no new id — not `SC-016`, not any other number — may be
  added to `behaviours.json` without also editing that hard-coded array, which is outside both
  WPs' `owned_files` and outside this mission's scope to change. **This replaces the original
  "SC-016+ are unallocated" note, which was itself wrong** (research.md R6). WP01's T004 registers
  new ARMS under EXISTING ids (`SC-002`, `SC-003`, `SC-004`, `SC-013` — see research.md R6 for the
  per-behaviour mapping and which one is a judgement call).
- **SC-007's "conformance-matrix entry"**: `scripts/build-conformance-matrix.mjs` and
  `conformance-matrix.json` do **not exist** in this train snapshot (`dcf7af2`) — confirmed by
  direct filesystem check, not assumed. The mechanism that DOES exist and IS current is the
  `mutations.json`/`behaviours.json` registry (WP01 T004, verified by WP02 T013). If the
  conformance-matrix generator has landed on `train/elements-first` by the time this mission
  rebases (plan.md/quickstart.md both require a pre-final-gate rebase), WP02's T013 must also
  register there; this is flagged so the rebase step does not silently skip a real, newly-added
  gate.
- **FR-008's static/no-build gap is discharged as documentation, not regeneration.** The original
  T012 named files that do not exist for this element (`packages/styles/src/form-input/` has no
  `.html`). The real static markup for this element lives in
  `packages/styles/src/form-field/sk-form-input-*.html`, in `form-field`'s own owned territory
  (C-004) — this mission does not edit it (research.md R7). T012 documents the resulting gap and
  its stated workaround instead.
- **Two artifacts this mission's manifest change touches were missing from the original task list
  entirely**: `packages/elements/vue.d.ts` (generated, `--check`-gated in CI) and
  `expected-docs.json` (hand-updated ratchet, exact-count-compared). Both are now T014, in WP02
  (research.md R8) — inserted before the final drift-gate sweep, which is renumbered T015.