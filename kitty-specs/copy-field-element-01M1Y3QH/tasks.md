# Tasks: `sk-copy-field`

**Input**: `spec.md`, `research.md`, `data-model.md`, `plan.md`, `quickstart.md`, and
`contracts/sk-copy-field.md`
**Branch**: `mission/copy-field-element` under the mission's `single_branch` topology. The eventual
PR targets `train/elements-first`, not `main`.

One work package and one PR. The custom element, authored stylesheet, behavior/visual stories,
browser contract, registrations, conformance registries, generated framework integrations, and
size report are one public API addition. None is independently useful or safely mergeable without
the others. Six sequential subtasks keep that architectural unit reviewable and preserve
test-first/generator ordering.

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | Author focused behavior, React-type, Storybook/browser/accessibility/geometry tests first; record the expected red caused by the absent element and cover every exact-string, clipboard, fallback, message-default, event/privacy, focus, synchronous A→B→A reset, completion-order, multi-instance, theme, real-zoom, forced-color, and reduced-motion branch (FR-001–FR-017, FR-019–FR-021; NFR-001–NFR-005, NFR-007; C-008). | WP01 | No |
| T002 | Implement `SkCopyField` with one custom-accessor reactive value, one native button using the existing button stylesheet/classes, secure Clipboard API truthfulness, verified visible-value focus/selection fallback, stable live status, synchronous value-revision reset, completion-order semantics, typed privacy-safe event, parts/JSDoc, and `define()` registration (FR-001–FR-016, FR-018; C-003–C-006). | WP01 | No |
| T003 | Author token-only `sk-copy-field.css` with explicit block host, wrapping/containment, focus/status/empty treatment, existing button/surface vocabulary, a local `transition: none` override, forced-colors safety, and no component-owned motion; wire only applicable authored package exports (FR-002, FR-015–FR-018; NFR-003–NFR-006). | WP01 | No |
| T004 | Add default/hover/focus/active/disabled and every other required Storybook state plus consumer usage, exact token-dependency, and JavaScript-boundary documentation, keeping fixtures deterministic and application-neutral (FR-003, FR-008–FR-011, FR-020, FR-022; NFR-002–NFR-006; C-003–C-005). | WP01 | No |
| T005 | Register applicable ADR-11 behavior subjects, meaningful mutation/selftest arms, public parts/docs/stories ratchets, and React/Vue contract tests; do not claim inapplicable form, slot, responsive-threshold, or cancelation responsibilities (FR-012–FR-021; NFR-007; C-007). | WP01 | No |
| T006 | Run the fixed repository command matrix from authored inputs, inspect and commit manifest/React/Vue/CSS/index/ratchet/size outputs, then execute focused and full build/lint/type/test/Storybook/axe/browser/visual/quality gates with exact-SHA results (FR-018–FR-022; NFR-001–NFR-008; C-007). | WP01 | No |

No `[P]` markers are valid. T001 establishes the red contract. T002 and T003 converge on one
rendered shadow surface. T004 needs the working element/style. T005 binds stable source and tests to
the repository's behavior/mutation schemas. T006 requires the authored surface to be complete.
Mission-branch rebase, PR creation, accept, and exact-head pre-merge review are orchestrator
delivery gates after WP01 runtime approval; they are not lane-owned WP subtasks because they can
invalidate the reviewed lane SHA.

## Work Packages

### WP01 — Publish the exact-value copy field contract

- **Goal**: Ship `sk-copy-field` as one JavaScript-dependent, framework-neutral design-system
  element. A consumer gets one named native Copy button, exact visible/copied string identity,
  truthful async success, deterministic selected-value manual fallback, honest failure, stable
  polite per-instance status, a typed privacy-safe result event, narrow/zoom/theme/forced-colors
  support, and generated framework distribution—without command execution or application state.
- **Priority**: P1. This is the complete independently usable outcome of #257 and a public input to
  #255.
- **Independent test**: Focused behavior and React consumer tests pass; the dedicated Storybook
  Playwright specs pass in Chromium and Firefox with zero axe violations and page containment at
  390px/200%/400%; all generators/checks and full repository gates are clean; required visual
  baselines pass in the authoritative environment; and independent Codex runtime review evidence
  names the exact approved lane SHA.
- **Included subtasks**: T001–T006.
- **Dependencies**: Closed #79/#153 provide the button contract and closed #178 the live-region
  precedent. Open #154 is a non-blocking defect whose host-tab-stop pattern this WP must not repeat.
  #213 is explicitly not a dependency. No sibling #253 mission is a source prerequisite.
- **Owned surfaces**: new copy-field element/style/story/tests, existing element/style exports and
  package maps, behavior/mutation/parts/docs/story registries, focused browser/visual registrations,
  and generator-produced manifest/wrapper/Vue/CSS/index/size outputs.
- **Risks**: Cross-engine shadow selection, non-writable clipboard globals, async stale results,
  generated overlap with Wave-A siblings, and CI-only visual snapshots. Each has an explicit
  verification/rebase path in `plan.md`; an unrepresentable required browser branch is reported as
  an exact blocker rather than inferred green.

## Requirement Coverage

- **Value, control, copy/fallback, state, event and privacy**: T001–T002 cover FR-001–FR-016 and
  C-003–C-006.
- **Styles, stories, modes and docs**: T001/T003/T004 cover FR-002/FR-003/FR-008–FR-011/FR-015–
  FR-017/FR-020/FR-022, NFR-002–NFR-006, and C-003–C-007.
- **Distribution and test quality**: T001/T005/T006 cover FR-018–FR-022 and NFR-001/NFR-002/
  NFR-007/NFR-008.
- **Read-only evidence boundary**: T001 records the external Dossier tree's pre-implementation
  SHA-256 aggregate and T006 recomputes it after implementation; equality covers C-008 without
  writing to that tree.
- **Fresh-base, review and delivery boundary**: The orchestrator's post-WP rebase/PR/accept/
  exact-head gates cover C-001/C-002/C-009/C-010 and SC-005–SC-008 while preserving all earlier
  requirements.

All FR-001–FR-022, NFR-001–NFR-008, and C-001–C-010 are mapped. SC-001–SC-004 are observable in
T001/T002/T006; SC-005–SC-008 are final gate and post-WP delivery outcomes.

## MVP Scope

The whole WP. Copy behavior without accessible presentation/distribution is not publishable, and
generated wrapper/types or stories without the canonical element are not usable. Splitting this
single public contract would create incomplete train states and duplicate the shared-artifact
rebase/gate cycle.

## Delivery Boundary

WP01 ends when the runtime reviewer approves its implementation. The mission orchestrator then
integrates it to the mission branch, fetches/rebases the latest train, regenerates and reruns the
fixed matrix, completes Spec Kitty accept, opens/updates the exact-SHA-reviewed `Refs #257` PR, and
records four-lens Codex evidence. It does not merge the PR or close #257; the parent programme
orchestrator owns serial Wave-A merge and issue/epic closeout.
