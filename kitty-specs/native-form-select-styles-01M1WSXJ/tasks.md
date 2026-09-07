# Tasks: Native form-select styles

**Input**: `spec.md`, `research.md`, `data-model.md`, `plan.md`  
**Branch**: `mission/native-form-select-styles` under the mission's `single_branch` topology; the
eventual PR targets `train/elements-first`, never `main`.

One work package and one PR. The select's token-only CSS, native HTML fixtures, generated barrel,
stories, public exports, documentation and browser evidence form one public styles-only contract.
Splitting those surfaces would leave either an unexported stylesheet or tests with no canonical
render target. Seven serial subtasks preserve red-first implementation and fit the repository's
reviewable 3–7 subtask range.

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | Rebase on the latest train, author the focused Playwright/source acceptance contract first, and demonstrate the expected red because the form-select story/surface does not exist (FR-001–FR-014; NFR-001–NFR-010; C-001–C-010). | WP01 | No |
| T002 | Author the token-only `.sk-form-select` and `.sk-form-select--compact` stylesheet plus seven native select/option/optgroup fixtures, preserving UA indicator, native focus/validity/disabled semantics, full-width/long-content containment and zero motion; Narrow reuses Default/T10 at 320px (FR-001–FR-010; NFR-002–NFR-007; C-001–C-004, C-008–C-010). | WP01 | No |
| T003 | Generate the styles-only barrel, wire aggregate/subpath exports, and author the axe-enabled Storybook catalogue with T10/T12, compact, long, optgroup, invalid, disabled, narrow, forced-colors, default dark and real `.sk-light` coverage (FR-007, FR-011–FR-013; NFR-001, NFR-004–NFR-009). | WP01 | No |
| T004 | Turn the focused contract green across native label/keyboard/typeahead/form/reset/validation/disabled/option semantics, 320px reflow, forced-colors, theme delta and available browser projects; record separate 200% zoom evidence (FR-003–FR-013; NFR-001–NFR-009; SC-001–SC-009). | WP01 | No |
| T005 | Document the native light-DOM rationale, closed-select versus #180 datalist distinction and consumer ownership; add story/visual ratchets and regenerate shared release/documentation outputs without adding element/wrapper/behaviour/mutation surfaces (FR-012–FR-014; NFR-008–NFR-010; C-003–C-009; SC-010–SC-013). | WP01 | No |
| T006 | Run focused-first and full repository verification; use supported Spec Kitty acceptance commands to bind exact evidence to every criterion and execute the predeclared negative invariants for generation drift, forbidden surfaces/selectors/CSS and application logic (all requirements). | WP01 | No |
| T007 | Before pre-merge review, fetch and rebase onto current `train/elements-first`, regenerate, rerun all affected/full gates, and produce CI plus four-lens Codex evidence and an aggregate finding-disposition comment tied to the exact final head; repeat after any later push (FR-012–FR-014; NFR-008–NFR-010; C-002, C-008–C-010; SC-011–SC-013). | WP01 | No |

No `[P]` marker is valid. T001 creates the red contract. T002 supplies the surface it targets. T003
needs fixtures before generation and stories before live browser evidence. T004 proves the rendered
contract. T005 documents the stable final API and updates collision-prone shared inventories. T006
requires the complete delta, and T007 is intentionally last because a rebase or push invalidates
CI and adversarial evidence.

## Work Packages

### WP01 — Native light-DOM form-select styles

- **Goal**: ship exactly `.sk-form-select` and `.sk-form-select--compact` on a native `<select>`;
  preserve real option/optgroup, label, form, keyboard, typeahead, validation, disabled, zoom and
  forced-colors behaviour; generate and publish the styles-only barrel; expose all required stories
  and documentation; and add no element, wrapper, runtime behaviour, mutation, state or app logic.
- **Priority**: P1 — this package is the complete independently deliverable outcome of #211 and a
  prerequisite of #214.
- **Independent test**: the focused Playwright module passes in Chromium, Firefox and WebKit CI;
  generator drift and styles package root/subpath resolution pass; all ratcheted stories are
  non-empty and axe-clean; required Chromium visual baselines match; 200% zoom evidence is recorded;
  and the delta has exactly two public form-select selectors with no element/wrapper/behaviour or
  mutation addition.
- **Included subtasks**: T001–T007.
- **Dependencies**: styles/tokens foundation, #141/#172, #180 and ADR-9/10/11 are all satisfied;
  no other #208 child is a source prerequisite.
- **Owned surfaces**: `packages/styles/src/form-select/**`, styles aggregate/package exports,
  `expected-stories.json`, consumer documentation, focused browser tests, visual registrations and
  form-select snapshots, plus regenerated shared outputs required by the component recipe.
- **Risks**: browser popup pixels and typeahead timing differ by engine, WebKit is CI-only in this
  Fedora host, and browser zoom cannot truthfully be replaced by a narrow viewport. Assert native
  semantics and closed-control observables; preserve exact-head CI for WebKit and record a separate
  200% manual/browser evidence check.

## Requirement and invariant coverage

- **Public/native contract**: T001–T003 cover FR-001–FR-010, NFR-002–NFR-007, C-001–C-004 and
  C-008–C-010.
- **Live browser/accessibility contract**: T001/T003/T004 cover FR-003–FR-013, NFR-001 and
  NFR-004–NFR-009, SC-001–SC-009.
- **Distribution/documentation**: T003/T005 cover FR-012–FR-014, NFR-008, C-003–C-009 and
  SC-010–SC-013.
- **Final health**: T006/T007 cover every requirement against the rebased exact final SHA.

All FR-001–FR-014, NFR-001–NFR-010 and C-001–C-010 are covered. Success criteria and non-goals
remain executable WP acceptance evidence rather than `requirement_refs`, whose runtime schema
accepts only formal requirement/constraint identifiers.

## MVP scope

The whole WP. CSS without generated/distributed canonical markup is not consumable, while stories
or tests without the stylesheet do not deliver the component.

## Delivery note

The WP stops after implementation and independent Spec Kitty review on the mission branch. The
programme orchestrator owns the PR into `train/elements-first`, exact-head CI/adversarial comment,
squash merge, issue closeout and epic checkbox. It must not merge the train into `main`.
