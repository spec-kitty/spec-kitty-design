# Tasks: sk-time-series-chart

**Mission:** `time-series-chart-01M1WR40`
**Branch:** `mission/time-series-chart` (cut from `train/elements-first@5fd031d`)
**Spec:** [`spec.md`](./spec.md) · **Plan:** [`plan.md`](./plan.md)
**Tracker:** [`#179`](https://github.com/spec-kitty/spec-kitty-design/issues/179) — last open child of epic #183.

## Overview

Two work packages, strictly serial, sixteen subtasks. WP01 owns everything authored: the
`--sk-chart-*` token family, the stylesheet, the element, the stories, the behaviour and React tests,
and the registry/ratchet entries. WP02 owns everything generated plus the closing gates: the manifest,
the React wrappers, the Vue types, `SIZES.md` (after a real build), the docs entries, the
`suite-budget.json` measured row, and the PR onto `train/elements-first`.

```text
train/elements-first @ 5fd031d
        │
        ▼
WP01 authored contract ──▶ WP02 generated artefacts + closing gates
```

## Subtask Index

| ID | Work | WP |
|---|---|---|
| T001 | Land the `--sk-chart-*` family in both theme blocks and regenerate the token catalogue | WP01 |
| T002 | Author the token-only stylesheet, including the reduced-motion and forced-colors blocks | WP01 |
| T003 | Implement the fail-closed validation, time/value scales and run splitting | WP01 |
| T004 | Render the gap objects, segment boundaries and gap notes | WP01 |
| T005 | Render the persistent published representation and the paired native table | WP01 |
| T006 | Implement controlled selection: typed cancelable event and the scroll-into-view default | WP01 |
| T007 | Export the element and side-effect import it | WP01 |
| T008 | Write the browser behaviour tests, including the SC-013 null-run mount | WP01 |
| T009 | Write the React first-render structured-property test | WP01 |
| T010 | Author the stories, `LightMode` wrapped in `class="sk-light"` | WP01 |
| T011 | Register in `expected-parts.json`, `expected-stories.json`, `behaviours.json`, `mutations.json` | WP01 |
| T012 | Regenerate the CSS module, manifest, React wrappers and Vue types cache-free | WP02 |
| T013 | Build, then measure `SIZES.md`; reconcile `expected-docs.json` exactly | WP02 |
| T014 | Run every drift, content and hygiene gate plus `quality:all` and the suites | WP02 |
| T015 | Document the element and the new token prefix | WP02 |
| T016 | Rebase on the current train, verify commitlint, open the PR onto `train/elements-first` | WP02 |

## Work Packages

### WP01 — Authored contract

- **Prompt:** [`tasks/WP01-authored-time-series-contract.md`](./tasks/WP01-authored-time-series-contract.md)
- **Dependencies:** none.
- **Requirements:** FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012, FR-013; NFR-002, NFR-003; C-001, C-002, C-004, C-005, C-006.
- **Independent result:** the element validates, renders gaps as drawn objects, publishes every value
  persistently in a paired table, differentiates series without colour, and emits a controlled
  cancelable selection request — with browser and React evidence and every registry entry it owns.
  It owns no generated artefact and no `suite-budget.json` row.

### WP02 — Generated artefacts and closing gates

- **Prompt:** [`tasks/WP02-generated-artefacts-and-gates.md`](./tasks/WP02-generated-artefacts-and-gates.md)
- **Dependencies:** WP01.
- **Requirements:** FR-014; NFR-001, NFR-004; C-003.
- **Independent result:** every committed generated file is regenerated from WP01's sources cache-free
  and matches its own `--check`; the docs record the element and the new token prefix; the PR is open
  against `train/elements-first` with the mutation-harness figure reported against the **unchanged**
  1405.5s ceiling.
