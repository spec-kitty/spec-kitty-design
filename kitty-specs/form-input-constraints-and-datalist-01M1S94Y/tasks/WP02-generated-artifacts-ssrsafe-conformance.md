---
work_package_id: WP02
title: Generated artifacts, React ssrSafe measurement, conformance close-out
dependencies:
- WP01
requirement_refs:
- FR-008
planning_base_branch: mission/form-input-constraints-and-datalist
merge_target_branch: mission/form-input-constraints-and-datalist
branch_strategy: Planning artifacts were generated on mission/form-input-constraints-and-datalist; completed changes must merge back into mission/form-input-constraints-and-datalist, which itself PRs into train/elements-first at mission close (per docs/architecture/elements-first-programme.md).
subtasks:
- T009
- T010
- T011
- T012
- T013
- T014
phase: Phase 2 - Generated artifacts and cross-framework proof
history:
- at: '2026-09-05T18:37:18Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: ''
authoritative_surface: packages/react/src/
create_intent:
- fixtures/react-consumer/src/sk-form-input-options.test.tsx
execution_mode: code_change
model: ''
owned_files:
- packages/elements/custom-elements.json
- packages/react/src/SkFormInput.tsx
- packages/react/src/SkFormInput.js
- packages/react/src/SkFormInput.d.ts
- fixtures/react-consumer/src/sk-form-input-options.test.tsx
- packages/styles/src/form-input/**
- packages/elements/SIZES.md
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP02 – Generated artifacts, React ssrSafe measurement, conformance close-out

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or
any user-defined profile), and behave according to its guidance before parsing the rest of this
prompt.

- **Profile**: `{{agent_profile}}` — if empty, run `spec-kitty agent profile list` and pick the
  best match for `task_type: implement` over generated-artifact regeneration and a React fixture.
- **Role**: `implementer`
- **Agent/tool**: `{{agent}}`

**Do not start this WP until WP01 is merged/landed on this branch.** Every subtask here reads
FROM `sk-form-input.ts`'s final shape; running any of these generators against WP01's
intermediate state produces output that will need regenerating again, and `--check` gates will
fail against whatever partial manifest results.

---

## Markdown Formatting

Wrap HTML/XML tags in backticks: `<div>`, `<script>`. Use language identifiers in code blocks.

---

## Objectives & Success Criteria

Every build artifact that depends on `sk-form-input`'s manifest shape is current, and the mission's
two remaining open requirements are closed with evidence, not assertion:

- `custom-elements.json` reflects the new members and passes `check-manifest-content.mjs` (every
  new property has a doc comment that propagated correctly) — FR-001/SC-007.
- `packages/react/src/SkFormInput.{tsx,js,d.ts}` regenerate cleanly, and `options` is confirmed
  (by reading the generated `.js`, not by assumption) to go through `useProperties(...)` rather
  than becoming a dropped or attribute-only prop — FR-005/FR-006 delivery.
- **NFR-001/SC-006 is answered with a passing test**, not a documentation-only claim: a new
  `fixtures/react-consumer` test proves `options` reaches the element even before
  `customElements.define` runs, survives a re-render with a new array (identity-checked), and
  resets to a fresh frozen `[]` on removal — mirroring `sk-transition-matrix`'s already-shipped
  `[SC-010]` test.
- Any true gap in the generated static/no-build form is written down as a documented limitation
  with a stated workaround — FR-008. (Read Subtask T012 before assuming there IS a gap; there may
  not be one, since plain HTML already supports every one of this mission's new attributes.)
- The size report and behaviour-registry bookkeeping are current — SC-007 — and this WP records,
  rather than silently skips, whatever `conformance-matrix.json`'s actual state turns out to be
  on the train this mission rebases onto (see Subtask T013).

## Context & Constraints

Read, in this order:

1. `kitty-specs/form-input-constraints-and-datalist-01M1S94Y/plan.md` IC-06, IC-08 — the
   `ssrSafe` measurement decision and the generated-artifacts concern, including the explicit
   choice to REPLICATE `sk-transition-matrix`'s (#149) already-shipped mechanism rather than
   design a new one.
2. `kitty-specs/form-input-constraints-and-datalist-01M1S94Y/research.md` R4 — the exact
   mechanical chain: `attribute: false` in source → `propertyOnlyFields()` in
   `scripts/normalise-manifest.mjs` marks `x-spec-kitty-property-only` (and
   `x-spec-kitty-property-reset` if the type is `ReadonlyArray`-shaped) → `manifestForGeneration()`
   in `scripts/build-react-wrappers.mjs` keeps the member instead of dropping it → the generator
   emits `useProperties(ref, 'options', options, () => Object.freeze([]))` instead of a
   `createElement` attribute prop.
3. `fixtures/react-consumer/src/sk-transition-matrix.test.tsx` — the EXACT test this WP's T011
   adapts. Read the whole `[SC-010]` test; note it asserts delivery BEFORE
   `customElements.define('sk-transition-matrix', …)` runs (the harder case than a normal
   upgrade), a re-render identity check, and a frozen-empty-array reset on removal — all three
   are required here too, not just the first.
4. `packages/react/src/SkTransitionMatrix.js` — the GENERATED output your own regeneration (T010)
   should produce an analogous shape for. Compare, do not copy verbatim (the prop names and event
   names differ).
5. `scripts/build-react-wrappers.mjs`'s own file-header comment in full — it explains why the
   outdir is under `src/` (not `dist/`, which `.gitignore` would swallow), why props are compared
   by FILE-SET AND CONTENT (not just file existence), and the `EXPECTED_NON_PROP_FIELDS`
   mechanism (not relevant to `options`, since it is property-only rather than state-only, but
   understanding the distinction matters for reviewing your own diff).
6. `kitty-specs/form-input-constraints-and-datalist-01M1S94Y/tasks.md`'s closing "Notes on
   requirements NOT separately tasked" section — it already recorded, as a FACT verified by
   direct filesystem check, that `scripts/build-conformance-matrix.mjs` and
   `conformance-matrix.json` do not exist in this train snapshot. Re-verify this yourself at the
   START of T013 (the train may have moved since planning) rather than trusting the note blindly.

## Branch Strategy

- **Strategy**: Planning artifacts were generated on
  `mission/form-input-constraints-and-datalist`; completed changes must merge back into
  `mission/form-input-constraints-and-datalist`, which itself PRs into `train/elements-first` at
  mission close.
- **Planning base branch**: `mission/form-input-constraints-and-datalist`
- **Merge target branch**: `mission/form-input-constraints-and-datalist`

> These fields are populated automatically by `spec-kitty agent mission finalize-tasks`. Do not
> change them manually.

## Subtasks & Detailed Guidance

### Subtask T009 – Regenerate the manifest and confirm doc-comment enforcement

- **Purpose**: SC-007 — the manifest is the shared input every other generator in this WP reads.
- **Steps**:
  1. `npx nx run elements:analyze` (runs `cem analyze` then `scripts/normalise-manifest.mjs`).
  2. `git diff -- packages/elements/custom-elements.json` — read the diff. Confirm every new
     property from WP01 (`pattern`, `min`, `max`, `step`, `inputmode`, `autocomplete`, `readonly`,
     `options`) appears with the doc comment WP01 wrote, and that `options` carries
     `"attribute": false"` — if instead it shows up as a plain string attribute, WP01's T004
     property declaration does not match the shape `propertyOnlyFields()` requires; go back and
     fix the SOURCE (do not hand-edit the generated manifest).
  3. `node scripts/check-manifest-content.mjs` — must exit 0. If it fails naming a missing doc
     comment, the fix is in `sk-form-input.ts`'s field declarations, not in this generated file.
  4. `node scripts/check-manifest-content.mjs --selftest` — the gate's own self-check; must also
     exit 0.
- **Files**: `packages/elements/custom-elements.json` (generated — do not hand-edit).
- **Parallel?**: No — every later subtask reads this file's output.

### Subtask T010 – Regenerate the React wrapper; confirm `options` routes through `useProperties`

- **Purpose**: The mechanical half of NFR-001 — proving the GENERATOR produced the right shape,
  before T011 proves the RUNTIME behaviour.
- **Steps**:
  1. `node scripts/build-react-wrappers.mjs`.
  2. Open the regenerated `packages/react/src/SkFormInput.js` and confirm, by reading it (not by
     grepping for a substring you expect):
     - `options` is destructured out of `props` alongside the OTHER non-attribute-forwarded
       fields, the way `columns`/`routes` are in `SkTransitionMatrix.js`.
     - There is a line `useProperties(ref, "options", options, () => Object.freeze([]));`.
     - `options` does NOT appear in the `React.createElement("sk-form-input", { ... })` props
       object as a plain key (it must not become an attribute prop).
  3. Open the regenerated `packages/react/src/SkFormInput.d.ts` and confirm `options` is typed as
     `SkFormInputElement['options']` (or the generator's equivalent re-export pattern), matching
     how `SkTransitionMatrix.d.ts` types `columns`/`routes`.
  4. `node scripts/build-react-wrappers.mjs --check` — must exit 0 (confirms the regeneration is
     idempotent and nothing manual needs re-running).
  5. `node scripts/build-react-wrappers.mjs --selftest` — must exit 0 (the generator's own
     internal consistency checks, run as a SEPARATE step per the script's own refusal to combine
     `--check` and `--selftest`).
  6. If step 2 or 3 does NOT hold — e.g. `options` was dropped entirely, or emitted as a plain
     attribute prop — STOP and re-open WP01's T004: the property shape does not match what
     `propertyOnlyFields()`'s AST walk requires (it must be a literal `{ attribute: false }` in
     `static properties`, on a public, non-readonly, non-static, non-`#private` field, typed as a
     `ReadonlyArray<…>` for the empty-array reset marker). Do not work around a wrong shape in the
     generator or by hand-editing generated output.
- **Files**: `packages/react/src/SkFormInput.tsx`, `.js`, `.d.ts` (all generated — do not
  hand-edit).
- **Parallel?**: No.

### Subtask T011 – `fixtures/react-consumer` ssrSafe measurement test (NFR-001/SC-006)

- **Purpose**: The runtime proof NFR-001 requires — "measured, not assumed."
- **Steps**:
  1. Create `fixtures/react-consumer/src/sk-form-input-options.test.tsx`, structured directly on
     `sk-transition-matrix.test.tsx`'s `[SC-010]` test (read it again if you skipped ahead):
     - Set up `host`/`root` via `createRoot`/`beforeEach`/`afterEach` exactly as that file does.
     - `options`/`replacementOptions` as frozen arrays of `{ value, label? }` matching this
       element's shape (not `columns`/`routes`'s shape — adapt the field names).
  2. Write the test body:
     - Before rendering, assert `customElements.get('sk-form-input')` is `undefined` — same
       precondition the transition-matrix test establishes, proving this is the PRE-DEFINITION
       delivery case, not a normal-upgrade case.
     - Render `<SkFormInput options={options} />` (plus whatever required props keep the
       component sane — `label`, `name` — check `SkFormInputProps` in the regenerated `.d.ts`
       from T010 for the real prop names).
     - Query the rendered `sk-form-input` element and assert `element.options` is the SAME array
       identity as `options`, and `element.hasAttribute('options')` is `false`.
     - Define a probe class (mirroring the transition-matrix test's
       `TransitionMatrixProbeElementClass` pattern) that declares an `options` property
       defaulting to `Object.freeze([])`, `customElements.define('sk-form-input', ProbeClass)`,
       `await customElements.whenDefined('sk-form-input')`, and re-assert the identity survived
       upgrade.
     - Re-render with `replacementOptions` and assert the identity updates.
     - Re-render with NO `options` prop and assert `element.options` resets to a FRESH, FROZEN
       empty array (`toEqual([])` AND `Object.isFrozen(...)` AND `not.toBe` the previous array).
  3. Run the test: use this repo's Vitest browser-mode invocation for `fixtures/react-consumer`
     (check `fixtures/react-consumer/project.json` for the exact target name rather than
     guessing a package.json script). It must pass.
  4. If it does NOT pass on the first try, do not weaken the assertions — go back to T010 and
     confirm the generated wrapper actually has the `useProperties` call; a failure here usually
     means the generated shape is wrong, not that the test is too strict.
- **Files**: `fixtures/react-consumer/src/sk-form-input-options.test.tsx` (new).
- **Parallel?**: No.
- **Notes**: This is the artifact that answers epic #183's standing question for whichever of
  #180/#179 gets there first. Reference `sk-transition-matrix` (#149) explicitly in a comment at
  the top of the new test file, naming it as the precedent this test replicates — a future reader
  of #179 or #147-#149 should be able to find both examples from either one.

### Subtask T012 – Regenerate static styles-only markup; document any real FR-008 gap

- **Purpose**: FR-008 — confirm there IS or IS NOT a genuine no-build-consumer gap, and record
  whichever is true.
- **Steps**:
  1. If any of WP01's new Storybook story arms (T008) render through the element-backed static
     markup path (check whether `sk-form-input` has a `.markup.ts` module the way some other
     elements do, or whether its static HTML in `packages/styles/src/form-input/` is generated
     directly from the element template) — run `node scripts/build-element-markup.mjs` and
     `node scripts/build-element-markup.mjs --check`.
  2. Read the regenerated `.html` for the new attributes (`pattern`, `min`, `max`, `step`,
     `inputmode`, `autocomplete`, `readonly`, `list`+`<datalist>`) — confirm they appear as plain
     HTML attributes with no JavaScript. This is expected to WORK with zero code changes, since
     native HTML already supports every one of these attributes; if it does not appear, the
     element's TEMPLATE (not the generator) is missing the binding — go back to WP01, do not
     patch the generated file.
  3. Write ONE paragraph (in this WP's Activity Log, and cross-reference it from `plan.md`'s
     IC-08 risk note if that note needs updating) stating explicitly: the true FR-008 gap is that
     the static/no-build consumer gets NO custom validity-merge message text (T003's merged flags
     are JavaScript behaviour, absent in a script-free consumer) — but this is NOT a defect,
     because native browser validation already produces its own UA message in that consumer with
     zero code. If you find any OTHER gap during this subtask, document it the same way instead
     of silently working around it.
- **Files**: `packages/styles/src/form-input/**` (generated — do not hand-edit).
- **Parallel?**: No.

### Subtask T013 – Size report regen + registry reconciliation note (SC-007)

- **Purpose**: Keep the committed size report current, and settle SC-007's "conformance-matrix
  entry" language against what actually exists on the train.
- **Steps**:
  1. `npx nx run elements:build && node scripts/measure-elements-sizes.mjs` (the build step is
     required first — `measure-elements-sizes.mjs` reads `dist/`, not source, and a stale local
     `dist/` produces a report that looks fine locally and is wrong).
  2. `node scripts/measure-elements-sizes.mjs --check` — must exit 0 after the regen above.
  3. Re-verify (do not trust the planning-time note blindly — the train may have moved):
     `ls scripts/build-conformance-matrix.mjs conformance-matrix.json 2>&1`. If BOTH are still
     absent, record in this WP's Activity Log that SC-007's conformance-matrix obligation is
     currently discharged by `mutations.json`/`behaviours.json` alone (WP01's T008), because the
     generator this requirement anticipates has not landed on this train yet. If EITHER now
     exists (the train moved since planning), run whatever `--check`/regeneration that new
     tooling defines for these new behaviour ids, and record that you did so.
- **Files**: `packages/elements/SIZES.md` (generated).
- **Parallel?**: No.

### Subtask T014 – Full drift-gate sweep + rebase-on-train check

- **Purpose**: Everything this mission's PR will be judged on by CI, run locally first, plus the
  plan.md/quickstart.md-required pre-final-gate rebase.
- **Steps**:
  1. Re-run every `--check` invocation this WP has already run once (T009, T010, T013) — a LATER
     subtask's regeneration can occasionally re-dirty an EARLIER generated file if two generators
     read overlapping input; running all of them again catches that instead of leaving it for CI.
  2. `git fetch` and check whether `train/elements-first` has moved since this mission branched
     (`git log --oneline train/elements-first -5` compared against this mission's base commit,
     recorded in `plan.md`'s header as `dcf7af2`). If it has moved, rebase this mission branch on
     the current tip and re-run steps 1-13's `--check` invocations again post-rebase — plan.md and
     quickstart.md both require this before the final gate, and it is cheap to do now rather than
     leave it as a surprise for the pre-merge squad.
  3. Run the full `fixtures/elements-behaviour` and `fixtures/react-consumer` suites one more time
     end to end, not just the two files this mission touched, to catch any cross-element
     regression the manifest/wrapper regeneration might have introduced.
- **Files**: none new — verification only.
- **Parallel?**: No.

## Test Strategy

- T010's `--check`/`--selftest` and T009's `check-manifest-content.mjs`/`--selftest` are the
  build-tooling verification layer (ADR-11 required behaviour #9, generation determinism).
- T011 is the ONLY new browser-mode test file in this WP; it is also the one with the highest
  review scrutiny, since it is this mission's answer to a cross-mission open question (epic #183).
- T014 is a verification-only subtask with no new test file — it exists to make sure nothing
  written in T009-T013 quietly broke something else's drift gate.

## Risks & Mitigations

- **Re-deriving the ssrSafe answer instead of replicating it (IC-06's named risk)**: if T011's
  test reveals `sk-form-input` behaves differently from `sk-transition-matrix` in some way (e.g.
  because `sk-form-input` is form-associated and `sk-transition-matrix` is not), do NOT paper over
  the difference — record it explicitly as a new finding in this WP's Activity Log and flag it for
  the pre-merge squad; it may be exactly the kind of thing epic #183 wants recorded for #147-#149's
  future readers.
- **Working around a wrong generated shape instead of fixing the source**: every subtask above
  says this explicitly at least once because it is the most likely shortcut under time pressure —
  hand-editing `SkFormInput.js`/`.d.ts` or `custom-elements.json` to make a `--check` pass will be
  caught by the NEXT regeneration (CI runs the same generator), so it does not actually save time.
- **Rebasing late**: T014 step 2's rebase is placed LAST deliberately (after all local
  regeneration is already correct against the mission's own tip), but if it surfaces a real
  conflict with `train/elements-first`'s own movement (e.g. another mission changed
  `form-control-base.ts` in the interim), stop and report rather than resolving a substantive
  conflict silently.

## Review Guidance

- Confirm T011's test file explicitly names `sk-transition-matrix`/#149 as the precedent, so a
  reviewer (and epic #183's future readers) can trace the lineage without re-deriving it.
- Confirm T012's Activity Log paragraph distinguishes "no gap" from "gap, documented" rather than
  asserting one or the other without having actually looked.
- Confirm T013's registry-reconciliation note reflects the REPO STATE AT THE TIME THIS WP RAN, not
  a copy-paste of the planning-time note in `tasks.md` (the train may have moved).

## Activity Log

> **CRITICAL**: Activity log entries MUST be in chronological order (oldest first, newest last).

- 2026-09-05T18:37:18Z – system – Prompt created.
