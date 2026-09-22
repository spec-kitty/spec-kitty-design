# Tasks: `.sk-button` busy axis

**Input**: `spec.md`, `plan.md`, `research.md` (all committed)
**Branch**: `mission/button-busy-axis` (single_branch topology — this mission's WP executes directly
on this branch; no worktree, per `spec-kitty`'s own `single_branch` contract)

Per `plan.md`'s "Work package shape" section, this mission is **one bounded Work Package and one
PR**, per #305's own "Delivery" line. `plan.md` found no internal seam that benefits from splitting:
the CSS rule, the reflected property, the cue markup, the static markup module change, the ratchet
updates, and both test files are interdependent (the tests need the cue to exist; the ratchets need
the final part/attribute count; the static module change needs the same class name the CSS defines).

## Subtask Index

| ID | Description | WP | Parallel |
|----|---|----|----|
| T001 | CSS: `.sk-button--busy` rule set, cue geometry, `@keyframes`, reduced-motion and forced-colors blocks, header comment | WP01 | |
| T002 | Element: reflected `busy` property and `part="busy-cue"` cue markup in `sk-button.ts` | WP01 | |
| T003 | Markup module: `busy` threaded through `ButtonStaticOptions`/`buttonClasses`/`buttonStaticHtml`/`BUTTON_AXES`, static-path boundary doc comment | WP01 | |
| T004 | Stories: new busy story exports in `sk-button.stories.ts` | WP01 | |
| T005 | Ratchets: `expected-parts.json`, `expected-docs.json`, `expected-stories.json` | WP01 | |
| T006 | Behaviour tests: extend `fixtures/elements-behaviour/src/sk-button.test.ts` | WP01 | |
| T007 | New Playwright spec: `apps/storybook/src/tests/sk-button.spec.ts` (narrow/zoom/RTL) | WP01 | |
| T008 | Regenerate every generated artifact and run the full local Gate Matrix | WP01 | |
| T009 | Final verification: rebase, full suite, CI-authoritative WebKit/visual-baseline confirmation, PR evidence notes | WP01 | |

No subtask is parallel-safe against another: T001-T003 all touch the same component's coupled
surface (CSS class name and cue part name must agree across all three files before T004-T007 can
usefully render or test them), and T008-T009 depend on everything before them existing.

## Work Package WP01 — `.sk-button` busy axis (single WP, single PR)

**Priority**: P1 (all of spec.md's user stories are P1 except User Story 4's forced-colors/reduced
motion sub-scenarios, which are P1 too — there is no P2/P3 slice of this mission to defer).

**Independent test**: render `sk-button` with `busy` set at every tone/size, toggle it off, and
confirm (a) the accessible name is unchanged, (b) the button's own `getBoundingClientRect()` box is
unchanged across idle→busy→idle, and (c) the disabled/aria-disabled compositions both render
correctly. This is fully testable as one slice — there is no smaller independently-shippable unit
that satisfies any of spec.md's acceptance scenarios in isolation.

**Included subtasks**: T001, T002, T003, T004, T005, T006, T007, T008, T009 (tracked via
`spec-kitty agent tasks mark-status`, not markdown checkboxes).

**Implementation sketch** (sequence, not parallel — see dependency note above):

1. T001 first — the CSS defines the class name (`sk-button--busy`), the part name
   (`busy-cue`), and the token usage every other subtask references.
2. T002 and T003 next, in either order — the element and the markup module both consume the class
   name T001 fixed; they do not depend on each other's output, only on T001's.
3. T004 (stories) after T002/T003 — stories render the real element and the real static exports.
4. T005 (ratchets) after T001-T004 — the final part/attribute/story counts are only known once the
   real surface exists.
5. T006 and T007 (tests) after T001-T005 — tests assert against the real, ratcheted surface.
6. T008 (regenerate + local gate matrix) after everything above.
7. T009 (final verification, rebase, CI confirmation) last.

**Risks** (from `plan.md`'s carried-forward research items):

- The cue's exact inset/size values at `--icon` and `--sm` are not yet measured against real
  rendering (research.md R-04) — T001 must verify zero-shift at all three sizes empirically, not
  assume the default-size values transfer.
- The reduced-motion frozen frame must be shown *distinguishable* from idle, not merely
  "not animating" (spec.md Edge Cases) — T001's CSS and T006's assertion must agree on what property
  makes that distinction visible (e.g., a resting border color, not visibility alone).
- The #308 closed-dialog lesson (spec.md User Story 3, research.md R-07): T006's geometry assertion
  must measure idle→busy→idle (three points), never idle→busy alone.

**Dependencies**: None — this is the mission's only WP, based on `mission/button-busy-axis` directly
(already the current branch; single_branch topology, no worktree).

**Requirement coverage**: FR-001 through FR-018, NFR-001 through NFR-006, C-001 through C-010 (see
`spec.md`) are all addressed within this one WP — mapped to the CLI via
`spec-kitty agent tasks map-requirements` after this file and `tasks/WP01-*.md` are written.

**Estimated prompt size**: ~450-550 lines (9 subtasks, moderate detail per subtask given the
plan's already-fixed CSS technique, token inventory, and test patterns — subtasks cite `plan.md`
sections rather than re-deriving them).
