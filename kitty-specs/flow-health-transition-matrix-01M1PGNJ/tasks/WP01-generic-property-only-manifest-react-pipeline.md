---
work_package_id: WP01
title: Generic property-only manifest and React pipeline
dependencies: []
requirement_refs:
- C-001
- C-006
- C-010
- FR-002
- FR-018
- FR-019
- FR-021
- FR-024
- NFR-004
- NFR-009
- NFR-010
planning_base_branch: mission/flow-health-transition-matrix
merge_target_branch: mission/flow-health-transition-matrix
branch_strategy: Planning artifacts for this mission were generated on mission/flow-health-transition-matrix. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/flow-health-transition-matrix unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-flow-health-transition-matrix-01M1PGNJ
base_commit: d29feb466a33ba9281d98f741c8b0ed411bb64a8
created_at: '2026-09-04T18:58:50.951143+00:00'
subtasks:
- T001
- T002
- T003
- T004
phase: Phase 1 - Generic pipeline prerequisite
history:
- timestamp: '2026-09-04T16:25:01Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
agent_profile: frontend-freddy
authoritative_surface: scripts/
create_intent: []
execution_mode: code_change
owned_files:
- scripts/normalise-manifest.mjs
- scripts/build-react-wrappers.mjs
- scripts/check-manifest-content.mjs
- tests/node/react-wrappers.test.ts
- fixtures/react-consumer/src/wrappers.test.tsx
- expected-docs.json
priority: P1
role: implementer
tags: []
task_type: implement
tracker_refs:
- '#149'
- '#144'
---

# WP01 — Generic property-only manifest and React pipeline

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and
behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `codex`

If the profile cannot be loaded, run `spec-kitty agent profile show frontend-freddy` and apply the
resolved identity, boundaries, and initialization before continuing.

---

## Objective

Create the generic manifest-to-React seam needed for public structured JavaScript properties that
intentionally have `attribute: false`. The seam must publish and type those properties, route them
through real property assignment, reset a removed array prop to its proven immutable empty default,
and continue excluding Lit internal state without adding any transition-matrix source or changing
existing wrapper output.

Run this WP through:

```sh
spec-kitty agent action implement WP01 --agent codex
```

## Context

`columns` and `routes` in issue #149 are readonly arrays/records, not serializable attributes. The
current normalizer correctly strips false attributes for `state: true`, while the wrapper generator
intentionally drops every public field that has no observed attribute. That protects internal state,
but it also drops an intentional `attribute: false` public input because the normalized manifest has
no structural way to distinguish the two cases.

The approved plan chooses one reusable distinction:

```json
"x-spec-kitty-property-only": true
```

The marker belongs only on a public, settable field whose source declaration explicitly opts out of
attribute observation. It does not belong on internal `state: true`, readonly/static/private fields,
computed/spread declarations the AST walk cannot safely resolve, or fields that merely happen to lack
an analyzer-produced attribute. The wrapper generator then admits observed-attribute fields plus
explicitly marked fields. Property-only values use its existing `useProperties` path and never enter
the attributes passed to `React.createElement`.

This WP is IC-01 only. It must be reviewable without adding `sk-transition-matrix`, without adding a
test-only public field to an existing production element, and without hand-editing generated React
files. WP02 supplies the real transition-matrix contract and end-to-end production proof after this
generic seam is approved.

The issue #149 conductor explicitly authorizes this narrow cross-cutting prerequisite under C-001:
the TypeScript-AST normalizer marker, manifest-content validation/counting, generated React property
delivery and immutable empty-array removal reset, with matching probes. It does not authorize any
unrelated generator cleanup, component-name allowlist, or change to existing public APIs.

### Branch strategy

- Planning branch and internal merge target: `mission/flow-health-transition-matrix`.
- Spec Kitty computes the execution lane in `lanes.json`; enter only the workspace returned by
  `spec-kitty agent action implement WP01 --agent codex`.
- Commit WP01 as one focused internal change and merge it back to the mission branch through the
  runtime workflow. Do not push or open a WP-specific PR.
- WP02 depends on this WP and shares selected generator/ratchet files. That overlap is intentional,
  serial, and expected to keep both WPs in one writer lane.
- The only external PR is created after WP03 has been reviewed and integrated: the full mission
  branch targets `train/elements-first`, uses `Refs #149`, and opens once as a draft for CI and the
  final gate.

## Scope and requirement trace

This WP directly covers FR-002, FR-018, FR-019, FR-021, FR-024, NFR-004, NFR-009, NFR-010,
C-001, C-006, and C-010. Its independent acceptance boundary is the generic pipeline: a synthetic explicit
property-only field is marked, documented, emitted as a typed React prop, and assigned as a property;
omitting that prop after a prior array assignment resets it to a fresh frozen empty array; state and
unsafe AST shapes are not silently published.

Allowed writes are exactly the `owned_files` frontmatter. Do not modify the production manifest or
generated wrapper tree merely to make a test green. If the generic change deterministically alters an
existing wrapper, explain the cause before proceeding; the expected result at this WP is no production
wrapper drift because no existing public field uses the new marker.

### T001: Add red-first probes for explicit public `attribute: false` classification

**Purpose:** Define the marker boundary before changing the normalizer or wrapper generator, so a
future regression cannot confuse intentional structured inputs with internal state.

**Steps:**

1. Extend the existing selftest/probe surfaces rather than introducing a second parser. Use synthetic
   TypeScript and manifest inputs that are isolated from production element declarations.
2. Add a positive probe for a public settable field declared in a resolvable `static properties`
   object with `attribute: false`. The post-normalization member must carry exactly
   `x-spec-kitty-property-only: true` and must not gain an `attributes[]` entry.
3. Add negative probes for all ambiguity boundaries:
   - `state: true`, including a field with both state-like and attribute-like options;
   - readonly, static, private/protected, and `#private` members;
   - a field with a real observed attribute;
   - a field absent from source or absent from the manifest;
   - spread/computed/unresolvable `static properties` declarations.
4. Require unsafe AST shapes to fail closed with an actionable error, matching the existing
   `stateFields()` policy. A silent “no marker found” result is a failure.
5. Add generator probes that are red until the generator admits explicitly marked fields. Pin both
   the declaration and runtime behavior:
   - the `.d.ts` contains the typed property-only prop;
   - the emitted component calls `useProperties(ref, "field", field, <proven-empty-array-reset>)`;
   - `React.createElement` receives no property-only attribute key;
   - rerendering without a previously supplied array prop assigns a fresh frozen empty array and
     never retains the prior identity;
   - removing the marker drops/fails the prop rather than silently keeping it;
   - falsely marking internal state is rejected by the seam.
6. Record the initial red output in the WP implementation/review evidence, then restore the working
   tree before implementing T002/T003. Do not commit a deliberately broken production source.

**Files:**

- `scripts/normalise-manifest.mjs`
- `scripts/build-react-wrappers.mjs`
- `scripts/check-manifest-content.mjs`
- `tests/node/react-wrappers.test.ts`

**Validation:**

The scoped single-file Vitest command deliberately uses the default reporter; the custom suite
floor applies only to the complete `npm run test` run.

```sh
node scripts/build-react-wrappers.mjs --selftest
node scripts/check-manifest-content.mjs --selftest
npx vitest run --project node tests/node/react-wrappers.test.ts --reporter=default
```

The pre-implementation run must fail on the newly added positive property-only cases, while every
pre-existing probe remains meaningful and green once the implementation is restored.

### T002: Normalize and document the generic property-only manifest marker

**Purpose:** Make the normalized CEM the single canonical authority that distinguishes an intentional
property-only public API from analyzer noise or internal reactive state.

**Steps:**

1. Extend the current TypeScript AST walk in `scripts/normalise-manifest.mjs`. Reuse its unwrapping,
   source-by-tag resolution, and fail-closed approach; do not match `attribute: false` with regex.
2. Detect only an explicit literal opt-out on a public settable field. Handle the source declaration
   forms already accepted by the analyzer/normalizer (`static properties = {}` and the supported
   getter/decorator form) and fail loudly on a shape the walk cannot prove.
3. Apply the marker to the corresponding normalized `members[]` field. Do not synthesize an observed
   attribute, alter the public field type, or overwrite unrelated extension metadata.
4. Keep `state: true` unattributed and unmarked. The order between stripping false state attributes,
   propagating descriptions, applying the property-only marker, and sorting must be deterministic and
   documented where order matters.
5. Extend `scripts/check-manifest-content.mjs` so a marked public property:
   - must be a public settable field;
   - must have a non-empty consumer-facing description;
   - must not also claim an observed attribute;
   - is counted in a new exact per-element `properties` dimension.
6. Extend the gate selftest for missing description, marker on state/readonly/private fields,
   property/attribute double-publication, wrong counts, and the anti-vacuity case.
7. Update `expected-docs.json` to add `properties: 0` for every current element while preserving the
   current exact `attributes` and `methods` counts and total semantics. Define whether `total` counts
   attributes + property-only fields + methods, and make code, comments, and selftests agree.
8. For an explicitly property-only member, emit an empty-array reset marker only when the AST and
   normalized type both prove the documented immutable empty-array default. Reject the marker on a
   non-array, mutable/unknown default, internal state, or unresolvable declaration.

**Files:**

- `scripts/normalise-manifest.mjs`
- `scripts/check-manifest-content.mjs`
- `expected-docs.json`

**Validation:**

```sh
npx nx run elements:analyze
node scripts/check-manifest-content.mjs
node scripts/check-manifest-content.mjs --selftest
git diff --exit-code -- packages/elements/custom-elements.json
```

The final diff for T002 may contain the scripts and `expected-docs.json`; it must not contain a
production `custom-elements.json` change merely from adding the capability.

### T003: Generate property-only React props through `useProperties` without attributes

**Purpose:** Deliver readonly arrays/objects to custom elements before upgrade and on reassignment
without serializing them, while preserving the generator’s internal-state exclusion.

**Steps:**

1. Update `taggedDeclarations()` and `manifestForGeneration()` in
   `scripts/build-react-wrappers.mjs` so the allowed public field set is:
   - fields backed by real observed attributes; plus
   - fields carrying the exact normalized property-only marker.
2. Keep readonly/static/private/protected fields out. Keep `EXPECTED_NON_PROP_FIELDS` as a set-valued
   guard for unattributed internal fields; do not replace it with a component-specific allowlist.
3. Preserve emitted type identity. A property-only prop must reference the element field type, not
   degrade to `unknown`, `object`, `string`, or `any`.
4. Ensure the generator routes the field through `useProperties`. It must not be destructured into
   the attribute map passed to `React.createElement`; arrays and records retain identity.
5. Pin first-render/upgrade ordering. The generated wrapper must assign the original property value
   after the custom element becomes available, reassign a new reference on React rerender, and when
   a previously supplied array prop becomes `undefined`, assign a fresh frozen empty array instead
   of skipping the write. Do not add JSON attribute fallback or guess a reset for other types.
6. Exercise the generic hook/runtime path in the existing React fixture only through a synthetic
   test-owned element/wrapper seam. Do not add a new production element property. Keep the test
   decoupled from transition-matrix so WP01 remains independently reviewable.
7. Add selftest mutations for a lost marker, state falsely admitted, property-only declaration
   dropped, invalid reset metadata, `useProperties` removed, the current `value === undefined`
   stale-value guard retained, assignment replaced with an attribute, and update dependency
   removed. Each probe must fail for its named reason.

**Files:**

- `scripts/build-react-wrappers.mjs`
- `tests/node/react-wrappers.test.ts`
- `fixtures/react-consumer/src/wrappers.test.tsx`

**Validation:**

The scoped single-file Vitest commands deliberately use the default reporter; the custom suite
floor applies only to the complete `npm run test` run.

```sh
node scripts/build-react-wrappers.mjs --selftest
npx vitest run --project node tests/node/react-wrappers.test.ts --reporter=default
npx vitest run --project browser fixtures/react-consumer/src/wrappers.test.tsx --reporter=default
node scripts/typecheck-all.mjs
node scripts/build-react-wrappers.mjs --check
```

Require identity before upgrade and after rerender, then omit the prop and require a frozen empty
array with a different identity in the browser probe, plus text/manifest selftests that bind the
generated call site. Neither layer alone is sufficient.

### T004: Prove the generic seam with focused selftests, type checks, and drift checks

**Purpose:** Hand WP02 a stable, independently reviewed prerequisite instead of asking the component
implementer to debug generator architecture while also matching the visual contract.

**Steps:**

1. Run every focused command below from the repository root in the allocated WP workspace.
2. Inspect `git diff --check` and the complete diff. Confirm only WP01 owned files changed.
3. Re-run manifest and wrapper generation twice. Existing production manifest/wrapper bytes must be
   stable and the normalizer/generator selftests must state that their new probes ran.
4. Confirm `expected-docs.json` still records the existing public surface exactly, now with a zero
   property-only count for each current element.
5. Confirm the synthetic runtime sequence proves initial identity → replacement identity → omitted
   prop yields a fresh frozen empty array, with zero structured attributes throughout.
6. Confirm no production element, `packages/react/src/**`, `packages/elements/custom-elements.json`,
   token, package, lockfile, ADR, or sibling mission artifact changed.
7. Use Spec Kitty’s targeted safe commit/review flow for WP01. Do not use blanket staging, do not
   push, and do not open a PR. The resulting internal commit returns to the mission branch before
   WP02 begins.

**Files:** All WP01 owned files; no generated production artifact is expected to change.

**Verification commands:**

The scoped single-file Vitest commands deliberately use the default reporter; the custom suite
floor applies only to the complete `npm run test` run, which remains authoritative below.

```sh
node scripts/build-react-wrappers.mjs --selftest
node scripts/check-manifest-content.mjs --selftest
npx nx run elements:analyze
node scripts/check-manifest-content.mjs
node scripts/build-react-wrappers.mjs --check
npx vitest run --project node tests/node/react-wrappers.test.ts --reporter=default
npx vitest run --project browser fixtures/react-consumer/src/wrappers.test.tsx --reporter=default
node scripts/typecheck-all.mjs
npm run quality:all
npm run test
git diff --check
```

After the runtime-authorized targeted commit, require a clean tracked, staged, and untracked state;
these commands must all exit zero:

```sh
git diff --exit-code
git diff --cached --exit-code
test -z "$(git ls-files --others --exclude-standard)"
```

If generation changes a production artifact, stop and determine whether the generic change exposed a
real pre-existing inconsistency. Do not absorb that inconsistency or regenerate-and-commit it without
an explicit scope decision.

## Definition of Done

- [ ] Only explicit public settable `attribute: false` fields receive
  `x-spec-kitty-property-only: true` in normalized CEM.
- [ ] Internal `state: true`, readonly/static/private/protected fields, and unsafe AST shapes are
  excluded or rejected with non-vacuous selftests.
- [ ] Property-only docs are required and counted independently from observed attributes/methods.
- [ ] Generated React declarations preserve the element field type with no `any`.
- [ ] Generated runtime uses `useProperties` and never serializes the value as an attribute.
- [ ] Synthetic runtime evidence proves pre-upgrade identity, reassignment identity, and removal to
  a fresh frozen empty array rather than stale state.
- [ ] All focused and repository gates listed in T004 pass.
- [ ] No transition-matrix source or generated artifact exists in WP01.
- [ ] The WP01 diff contains only declared owned files and one focused internal commit.
- [ ] No push or WP-specific PR was created.

## Risks

- **Internal state becomes public:** require both the source-AST opt-in and normalized marker; retain
  the exact unattributed-field set guard.
- **Marker is text-matched:** comments, strings, spreads, and computed declarations create false
  positives. Use the TypeScript compiler walk and fail closed.
- **Types look right but runtime drops values:** pair generated text/type checks with a browser
  identity probe through `useProperties`.
- **Runtime uses an attribute on first render:** explicitly assert the create-element attribute map
  omits the property-only key.
- **Selftests certify absence:** include positive and negative synthetic declarations and assert the
  probes executed, not just that the command exited zero.
- **Generic work widens into component work:** stop at the seam. WP02 owns all transition-matrix
  production source and generated output.

## Reviewer Guidance

Reject WP01 if the implementation recognizes `columns`/`routes` by name, serializes structured data,
adds a public field to an existing element just for coverage, or hand-edits generated wrapper files.
Trace one synthetic field from TypeScript source through the normalized manifest and `.d.ts` to the
generated `useProperties` call, then trace one `state: true` field and verify it never crosses that
boundary. Deliberately remove the marker and property assignment in the selftest harness; the named
probes must go red. Finally confirm the production generated tree is byte-stable.

## Activity Log

- 2026-09-04T19:52:08Z – codex – Review cycle 1 evidence at fix commit 1e8f1e8aadc57f5897c07216574b1380074109f8. Browser mutation: changed scripts/build-react-wrappers.mjs applyPropertyOnlyResets generated assignment from el[propName] = nextValue to el[propName] = value; ran node scripts/build-react-wrappers.mjs then npx vitest run --project browser fixtures/react-consumer/src/wrappers.test.tsx -t a synthetic wrapper preserves identity and resets an omitted array prop. RED: named test failed at wrappers.test.tsx:154, expected undefined to deeply equal empty array. Restored the nextValue assignment, regenerated, and the browser fixture passed 6 of 6. Computed decorator mutation: disabled the attributeOption guard in scripts/normalise-manifest.mjs; ran npx vitest run --project node tests/node/react-wrappers.test.ts -t normalizer source-locates a computed decorated attribute:false field. RED: named test failed because the normalizer did not throw. Restored the guard at commit 1e8f1e8; node fixture passed 11 of 11. Final GREEN: wrapper selftest 24 of 24; manifest selftest 14 of 14; analyze, manifest content, wrapper drift and determinism green; typecheck 4 of 4; quality:all green with known warnings only; npm test 15 files and 145 tests, suite floor node 23 and browser 122; production CEM and React bytes stable.
- 2026-09-04T20:12:35Z – codex – Cycle 2 fix at 93879b4: initial TDD probe run failed 4/15 for unresolved static/decorator state/attribute metadata; literal classification implemented; deliberate weakened-state mutation then failed both targeted state probes and was restored. Green: focused node 15/15 and browser 6/6 with --reporter=default; wrapper selftest 24/24; manifest selftest 14/14; typecheck 4/4 projects; quality:all; full npm test 15 files/149 tests with node=27/browser=122; two analyze/wrapper regeneration passes retained CEM sha256 828d748d14b547015d7438d10144e6dbd8d045b8b91926b9139688357ba574f0 and React-tree sha256 5e73cd49d5d6e20bc8ab382f01dfa0f8da5800e37e3fc7f36b2e3598565f2359.
- 2026-09-04T20:41:07Z – codex – Cycle 3 computed-decorator validation evidence at b7a20a9: red-first focused Node run before implementation exited 1 with two named failures; unresolved attribute did not throw and attribute:false plus unresolved state threw the wrong computed-name error. Deliberate source mutation replaced the computed-decorator inspectLiteralOptions call with fixed false flags. Command: npx vitest run --project node tests/node/react-wrappers.test.ts --reporter=default -t unresolved-computed-decorator. Red exit 1: both named computed-decorator attribute/state tests failed at toThrow because no error was raised. Restored the shared literal-only validator call; the same command exited 0 with 2/2 named tests green. Final focused Node 17/17, focused browser 6/6, wrapper selftest 24/24, content selftest 14/14, full suite 151/151 with node=29/browser=122 and zero skips. Two analyze/content/wrapper-check passes retained CEM SHA-256 828d748d14b547015d7438d10144e6dbd8d045b8b91926b9139688357ba574f0 and React-tree SHA-256 5e73cd49d5d6e20bc8ab382f01dfa0f8da5800e37e3fc7f36b2e3598565f2359.
- 2026-09-04T20:41:17Z – codex – Cycle 3 evidence clarification: the exact mutation and restored-green command used the quoted Vitest filter -t unresolved computed-decorator, with a space between unresolved and computed-decorator. The preceding history note rendered that filter with hyphens; this note corrects the command transcript.
