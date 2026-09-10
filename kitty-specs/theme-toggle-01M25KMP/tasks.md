# Tasks: sk-theme-toggle

**Mission:** `theme-toggle-01M25KMP`  
**Branch:** `mission/theme-toggle` (cut from `train/elements-first@4d4031fa2416ceaadcb0c51f313386c3dee3db36`)  
**Spec:** [`spec.md`](./spec.md) · **Plan:** [`plan.md`](./plan.md)  
**Tracker:** [#323](https://github.com/spec-kitty/spec-kitty-design/issues/323), child of [#183](https://github.com/spec-kitty/spec-kitty-design/issues/183)

## Scope

Exactly one Work Package and one mission PR. The resolver contract, element lifecycle, pre-paint
artifact, Factory composition, generated distribution surfaces, and acceptance evidence are one
inseparable public delivery. Splitting them would create an intermediate WP that cannot satisfy the
component recipe or be approved independently.

## Subtask index

| ID | Description | WP |
|---|---|---|
| T001 | Author and run discriminating tests first; preserve red-first and ADR-11 mutation evidence | WP01 |
| T002 | Implement the single DOM-free preference/resolution/root-application contract | WP01 |
| T003 | Implement the accessible native three-choice element, token-only styles, safe lifecycle, and no-JS/static behavior | WP01 |
| T004 | Generate and package the pre-paint classic bootstrap from the same contract | WP01 |
| T005 | Extend the generic Factory operational-status composition and prove both themes mechanically | WP01 |
| T006 | Generate manifest, CSS/static forms/barrels, React/Vue wrappers/types, exports, story ratchets, and size records | WP01 |
| T007 | Document API, bootstrap placement, degradation, forced colors, #93 boundary, and consumer handoff | WP01 |
| T008 | Run focused tests and the complete rebased exact-HEAD gate inventory | WP01 |

## WP01 — Theme preference element, pre-paint contract, and Factory proof

- **Prompt:** [`tasks/WP01-theme-preference-element-and-factory-proof.md`](./tasks/WP01-theme-preference-element-and-factory-proof.md)
- **Dependencies:** none.
- **Requirements:** FR-001–FR-014, NFR-001–NFR-005, C-001–C-006.
- **Independent result:** a consumer can use one published `sk-theme-toggle` and one generated
  pre-paint artifact to select System, Light, or Dark; the exact same contract owns validation,
  persistence, system resolution, root application, and failures. Browser/Storybook evidence proves
  native semantics, keyboard/a11y/forced-colors/no-JS behavior, listener cleanup, SSR safety,
  root-level light/dark distinction, AA contrast, Factory public-surface composition, generated
  artifacts, and package typing.
- **Review boundary:** the implementation seat moves WP01 through the synchronous `for_review`
  gate; a fresh read-only reviewer records approve/reject through the deterministic event-log seam.
