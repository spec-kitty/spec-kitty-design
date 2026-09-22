# Tasks: notice-heading-in-region-and-tint-doctrine

**Input**: `plan.md`, `spec.md`
**Branch**: `mission/notice-heading-in-region-and-tint-doctrine` (planning base **and** merge
target — `single_branch` topology; the PR onto `train/elements-first` is the operator's step, not
this loop's).

Two ratified operator rulings on disjoint surfaces. #228 is a behavioural change to one element
plus the record of it; #217 is a doctrine amendment in two documents.

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | The red is captured first: the new test asserting a slotted heading is inside the live region, run against the unchanged template, and its failure text recorded verbatim (FR-003, SC-001) | WP01 | |
| T002 | The heading box moves inside the `keyed()` body; `[part="heading"]` and the other six parts survive (FR-001) | WP01 | |
| T003 | `.sk-notice__heading` takes the `--sk-space-2` margin the vanished grid gap supplied, so the render is unchanged with and without a heading (NFR-001) | WP01 | |
| T004 | The four existing announcement-contract assertions still pass with a heading in scope, and an explicit sweep asserts `announce="off"` yields no `[role]` and no `[aria-live]` anywhere (FR-002, FR-004, SC-002, SC-003) | WP01 | |
| T005 | The `keyed()` caveat is re-read against the new shape and widened: the region is born holding more, `aria-atomic` makes every re-announcement re-read the heading, and the documented reliable path no longer reaches an empty region (FR-007, SC-005) | WP01 | |
| T006 | The `@slot heading` JSDoc, the class docblock and the story prose describe the new behaviour; the manifest and the React wrappers are regenerated cache-free (FR-005, NFR-003, SC-004) | WP01 | |
| T007 | `docs/design-system/changelog.md` carries the behaviour change and a migration line under `[Unreleased]` (FR-006, SC-004) | WP01 | |
| T008 | `SIZES.md` is regenerated from a real cache-free build and `measure-elements-sizes.mjs --check` is green (NFR-003) | WP01 | |
| T009 | The token facts are re-measured in-tree before anything is written down, including whether the four siblings are all aliases (SC-008) | WP02 | [P] |
| T010 | `docs/contributing/adding-a-token.md` distinguishes completing an existing family from an existing hue from introducing a new hue, and states the rule as an applicable test (FR-008, FR-009, SC-006) | WP02 | [P] |
| T011 | `docs/design-system/using-tokens.md` stops claiming every status token resolves to a token above it, and says which bottom out in literals (FR-010, SC-007) | WP02 | [P] |

T001–T008 are sequential: T001 is red-first and must precede T002; T003 follows T002; T006–T008
regenerate artefacts that depend on T002. T009–T011 touch disjoint documents and carry `[P]`; T009
must precede T010 and T011, because both write down what it measures.

## Work Packages

### WP01 — The heading is inside the region, and the record says so

- **Goal**: close #228 — the whole notice is announced, heading first, with the existing region
  guarantees intact, the render unchanged, and the change written down for consumers.
- **Priority**: P0 — it changes what every existing consumer hears.
- **Independent test**: `npx vitest run --project browser fixtures/elements-behaviour/src/sk-notice.test.ts`
  is green; the new test is red against `HEAD~` of T002 with a message naming a heading present and
  not announced; `node scripts/measure-elements-sizes.mjs --check` and
  `npx nx run elements:analyze --skip-nx-cache` leave the tree clean.
- **Included subtasks**: T001–T008.
- **Dependencies**: none.
- **Risks**: a vacuous `textContent` assertion; a silent geometry change. Both are addressed in
  `plan.md` §B and §C.

### WP02 — The doctrine permits what the palette does

- **Goal**: close #217 — the two sentences the ruling names are amended, and the permission is
  written as a test a future mission can apply to its own case.
- **Priority**: P1.
- **Independent test**: a reader given "I need a teal status surface" and "I need a danger status
  surface" reaches opposite, unambiguous answers from the written test alone;
  `packages/tokens/src/tokens.css` and `packages/tokens/dist/token-catalogue.json` are unchanged.
- **Included subtasks**: T009–T011.
- **Dependencies**: none. Disjoint from WP01's file set.
- **Risks**: writing down the ruling's summary rather than the tree's facts — T009 exists to stop
  that, and it already caught one (butter is a literal too).
