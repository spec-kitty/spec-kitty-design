# Tasks: sk-confirm-dialog

**Input**: `plan.md`, `spec.md`, `data-model.md`, `research.md`, `contracts/sk-confirm-dialog.md`, `quickstart.md`
**Feature dir**: `/home/jeroennouws/dev/spec-kitty-design-missions/308/kitty-specs/confirm-dialog-element-01M248TN`

## Work Package count: ONE, deliberately, overriding the usual sizing guideline

Issue #308 states: "**Delivery:** one bounded Work Package and one PR." Epic #300 repeats it for
every child: "Each child is one Spec Kitty mission, one Work Package and one PR." This is a
constraint from the source issue, not a sizing choice made here — so **WP01 below intentionally
exceeds the generic "3-7 subtasks / 200-500 lines" guideline**. The alternative (splitting into
multiple WPs to fit that guideline) would violate the explicit one-WP mandate. If, during
implementation, the work turns out not to fit one WP after all, the correct response is to stop
and report that back — not to split unilaterally.

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | Author `sk-confirm-dialog.ts` skeleton: LitElement wrapping native `<dialog>`, no-default required string properties, `initialFocus`/backdrop-dismiss properties, `define()` registration, class-level JSDoc | WP01 | |
| T002 | Implement the single reporting mechanism: native `close` event + `returnValue`, with every non-confirm path (cancel, Escape, backdrop, programmatic close with no explicit value) defaulting to `'cancel'` before it can become anything else | WP01 | |
| T003 | Implement focus management: documented/overridable initial focus (default `'cancel'`), focus-returns-to-invoker on every close path | WP01 | |
| T004 | Implement FR-017: an omitted required string renders no substituted literal and emits a development-time warning naming the missing string | WP01 | |
| T005 | Author `packages/styles/src/confirm-dialog/sk-confirm-dialog.css`: tokens-only, `:host` display, scrollable body, reachable action group at narrow widths/200% zoom, reduced-motion, forced-colors, RTL/logical properties, 44px targets | WP01 | [P] with T001-T004 (different file) |
| T006 | Add `"./confirm-dialog/*": "./dist/confirm-dialog/*"` to `packages/styles/package.json`'s `exports` (C-010) | WP01 | [P] with T005 |
| T007 | Author `sk-confirm-dialog.stories.ts`: every required state from issue #308's "Required stories and tests" section, including `LightMode` | WP01 | |
| T008 | Write the ADR-11 behavior test file `fixtures/elements-behaviour/src/sk-confirm-dialog.test.ts`, claiming SC-005/006/007/008/013/014/015 (and SC-017 only if a documented breakpoint is actually introduced), each with a red-first-demonstrated mutation | WP01 | |
| T009 | Add the component-scoped, unmarked "no literal text" test (FR-018) to the same fixture file, red-first-demonstrated, explicitly NOT generalized into a repo-wide gate | WP01 | |
| T010 | Register the three-plus-one ratchets: `expected-parts.json`, `expected-docs.json` (bump totals), `behaviours.json` (subject entries), `mutations.json` (red-first arms for every claimed id) | WP01 | |
| T011 | Team-deletion absence audit (FR-014): grep this WP's own added stories/docs/fixtures for Team-deletion framing; confirm only membership-removal/leave/bearer-link-revoke exemplars appear | WP01 | |
| T012 | Regenerate every generated artifact and drift-check: `custom-elements.json`, `packages/react/src/**`, `packages/elements/vue.d.ts`, `packages/elements/SIZES.md` | WP01 | |
| T013 | Run the full gate list from `docs/contributing/adding-a-component.md` §7 (regen/drift, content/hygiene, quality:all, typecheck-all, axe-storybook, suite-selftest, gate-wiring, release-graph) until green | WP01 | |
| T014 | Author element-level documentation recording the static-twin deferral to #301 (mirrors spec.md FR-016) and the single reporting mechanism (mirrors contracts/sk-confirm-dialog.md), and confirm `quickstart.md`/`contracts/sk-confirm-dialog.md` still match the shipped attribute names — update them if the exact names chosen in T001 differ from the illustrative ones | WP01 | |

## Work Package WP01 — `sk-confirm-dialog` end to end

**Priority**: P1 (this mission's entire scope)
**Independent test**: Mount `sk-confirm-dialog` with all four required strings supplied plus an
invoker; open via `showModal()`; confirm reports `'confirm'`, cancel/Escape/backdrop/unset-programmatic-close
all report `'cancel'`; focus returns to the invoker every time; axe reports zero WCAG 2.1 AA
violations across every required story; `npm run quality:all` and the recipe's gate list (§7) pass;
`git status --porcelain` is empty after regeneration.
**Estimated size**: 14 subtasks — larger than the generic 10-subtask ceiling, deliberately, per the
"Work Package count" note above. Estimated prompt length ~750-900 lines given the density of the
public contract; if implementation finds the single prompt unworkable in one session, report that
rather than splitting the WP.

### Included subtasks

T001, T002, T003, T004, T005, T006, T007, T008, T009, T010, T011, T012, T013, T014

### Implementation sketch

1. T001-T004: build the element itself — properties, reporting mechanism, focus, no-defaults
   enforcement. This is the foundation every later subtask depends on.
2. T005-T006 can run in parallel with T001-T004 (different files: CSS and the styles package
   manifest), but the CSS's part-targeting selectors depend on T001's final `part` names, so true
   parallelism is limited — sequence CSS after the element's shadow structure is at least
   drafted, even if the file edits themselves don't conflict.
3. T007 (stories) needs the finished element and CSS.
4. T008-T009 (behavior tests) need the finished element; T009 can be written alongside T008 in the
   same file.
5. T010 (ratchets) needs the final part/attribute/behavior-id sets from T001-T009 — do this last
   among the "authoring" subtasks, not speculatively early.
6. T011 (Team-deletion audit) is a review pass over everything T007-T010 produced.
7. T012 (regenerate) and T013 (full gate run) close out the WP.
8. T014 (docs reconciliation) can happen any time after T001 fixes the real attribute names, but
   must be re-checked as the last step in case names changed during implementation.

### Dependencies

None — this is the only Work Package.

### Risks

- Getting the native `<dialog>` backdrop-dismissal wiring wrong (no native handler exists for it;
  see research.md's platform-behavior note).
- Under- or over-claiming ADR-11 ids in `behaviours.json` (see plan.md's Charter Check table and
  research.md's applicability table).
- Forgetting the `packages/styles/package.json` exports entry (T006) — CI-enforced
  (`check-release-graph.mjs`) but not caught by the component-authoring recipe itself.
- Conflating T009's component-scoped test with issue #286's own (not-yet-built) repo-wide gate —
  explicitly out of scope; do not generalize it.
- Any change to the illustrative attribute names in `contracts/sk-confirm-dialog.md`/`quickstart.md`
  during T001 must be reflected back into those docs (T014), or the mission's own planning
  artifacts will disagree with the shipped element.

**Requirement coverage**: FR-001 through FR-018, NFR-001 through NFR-005, C-001 through C-010 —
the full spec, since this is the mission's only Work Package.
