# Tasks: repository-dossier-compact-navigation-shell-01M1Y3FY

**Inputs**: `spec.md`, `research.md`, `data-model.md`, `plan.md`

**Planning base / merge target**: `train/elements-first`

One work package and one PR. The compact shell API, its effective-open state, inline-container
CSS, controlled dismissal/focus behavior, browser evidence, public documentation, generated
wrappers/types, and ADR-11 registrations are one backward-compatible component contract. Splitting
them would make either the public API or its verification/distribution incomplete.

## Subtask index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | Author red-first behavior, accessibility, layout, responsive, and compatibility fixtures. | WP01 | No |
| T002 | Implement the element API, rendering, effective-open logic, controlled dismissal event, and bounded focus reconciliation. | WP01 | No |
| T003 | Implement token-only compact CSS, new slots/parts, the inclusive 860px shell-inline threshold, modes, and overflow containment. | WP01 | No |
| T004 | Add focused stories, consumer documentation, approved-artifact comparisons, and durable zoom/visual evidence. | WP01 | No |
| T005 | Register applicable ADR-11 behaviors/mutations and update authored contract ratchets against the latest train. | WP01 | No |
| T006 | Regenerate applicable CSS, manifest, React/Vue, styles, ratchet, and size artifacts from authored sources. | WP01 | No |
| T007 | Rebase on the latest train, rerun the pinned exact gate matrix, obtain independent exact-SHA Codex review, and open the WP PR. | WP01 | No |

No `[P]` marker is valid. T001 establishes executable acceptance before the behavior exists. T002
and T003 share the same effective-open threshold and must remain synchronized. T004 validates the
rendered surface. T005/T006 can only describe a complete authored contract. T007 is last because a
rebase, regeneration, or later push invalidates the reviewed/tested SHA.

## Work package

### WP01 — Compact navigation shell seam

- **Goal**: extend the existing `sk-app-shell` with one opt-in compact presentation axis, optional
  `compact-header` and `compact-navigation` regions, consumer-controlled open presentation, and one
  typed Escape dismissal request while preserving all absent-axis behavior and application-state
  ownership.
- **Priority**: P1 — this is the complete #254 outcome and a dependency of Repository Dossier
  integration issue #255.
- **Independent test**: at the exact final SHA, focused and full Vitest/Storybook/axe/Playwright
  runs pass in Chromium and Firefox; app-shell inline sizes 390/768/860/861 and a constrained-shell
  case prove layout/event/focus behavior; real 200%/400% zoom and approved D1/D2/D4–D8 comparisons
  are recorded; all generator/manifest/wrapper/type/ratchet/mutation/size/release checks pass.
- **Included subtasks**: T001–T007.
- **Dependencies**: closed #145; no other component mission is a source dependency.
- **Owned surfaces**: exactly the authored, fixture, story, documentation, evidence, registry,
  generated, ratchet, and size paths listed in the WP01 frontmatter.
- **Non-goals**: no router, route registry, application state/store, data, current-link inference,
  history, persistence, breakpoint service, application focus trap, new shell/navigation component,
  Team Kitty branding/copy, or changes to adjacent navigation components.

## Coverage

WP01 covers FR-001–FR-021, NFR-001–NFR-008, and C-001–C-008. Its task prompt separately maps the
mission SC-001–SC-006 outcomes and the applicable ADR-11 SC-006/007/008/010/012/013/014/017 behavior
IDs so those two namespaces cannot be confused.

## Delivery note

The work package produces exactly one PR targeting `train/elements-first` whose body says
`Refs #254`, never `Closes #254`. The assigned programme orchestrator owns merge and issue/epic
closure after all Wave A gates; this mission must not merge itself or target `main`.
