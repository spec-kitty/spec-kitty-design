# Tasks: sk-boundary-page styles-only frame

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`
**Mission**: `boundary-page-styles-01M25TBY` on `mission/boundary-page-styles` (single_branch — plan, base, and merge target are all this one branch)

## Scope note

Per spec C-001, this mission is bounded to **exactly one Work Package and one PR**. All subtasks
below land in WP01. There is no phase 2/3 — everything in this mission's diff ships together.

## Subtask Index

| ID | Description | WP | Parallel |
|----|---|----|----|
| T001 | Author `sk-boundary-page.css`'s anatomy: `__stage`/`__card`/`__title`/`__body`/`__action-group`, tokens-first, logical properties, no card-shape modifier; header comment records the ADR-10 styles-only-class reason and the ADR-15 non-applicability check | WP01 | |
| T002 | Add `__mark` and title-row status-composition placement CSS (spacing/alignment only — no default size/shape/border/tone, no `::part()`) | WP01 | |
| T003 | Add `__footnote` CSS and verify the DOM-absence contract for `__mark`/`__footnote` (ordinary `gap`, no attribute/`[hidden]` gate) | WP01 | |
| T004 | Add long-content containment (`overflow-wrap` etc.) to `__body`, reusing the `sk-empty-state--inline` pattern, verified against this component's own geometry | WP01 | [P] |
| T005 | Add `@media` responsive rules (narrow width, 200% zoom, action-group wrap/44px targets) and RTL/logical-layout verification | WP01 | [P] |
| T006 | Add `@media (forced-colors: active)` border treatment and confirm no reduced-motion rule is needed (frame introduces no transition/animation) | WP01 | [P] |
| T007 | Author required `.html` exemplars: form-card, terminal-card, with/without mark, with/without footnote, one/several/no action, long identifier, long email, forced-colors | WP01 | |
| T008 | Run `node scripts/build-styles-only-markup.mjs` to generate `index.ts`; add `export * from './boundary-page/index';` to `packages/styles/src/index.ts` | WP01 | |
| T009 | Author `sk-boundary-page-html.stories.ts` (Default, per-exemplar exports, `LightMode`) | WP01 | |
| T010 | Write the mark/footnote absence-contract Playwright spec (computed-geometry assertions, present vs. absent) — write and prove it fails against a deliberately-wrong CSS mutation before trusting it green | WP01 | |
| T011 | Write the responsive/forced-colors/reduced-motion/RTL/target-size Playwright spec | WP01 | [P] |
| T012 | Add named visual-regression baseline tests to `apps/storybook/src/tests/visual.spec.ts` (research.md Decision 7's snapshot names, confirmed against the exemplars actually authored) | WP01 | |
| T013 | Confirm no change is needed to `expected-parts.json`, `expected-docs.json`, `behaviours.json`/`mutations.json`, `packages/elements/src/`, `packages/react/src/` (no element exists); update `expected-stories.json` only if it enumerates styles-only families | WP01 | |
| T014 | Rebuild `dist/`, regenerate `SIZES.md`; run the repo's existing gates (stylelint, htmlhint, axe, visual, `check-adopted-css-boundaries.mjs`) | WP01 | |
| T015 | Write the PR description | WP01 | |

T004, T005, T006, and T011 are marked `[P]` — T004/T005/T006 touch disjoint rule blocks within the
one CSS file and can be authored in any order once T001-T003 land the base anatomy; T011 can be
drafted in parallel with T010 since they target different Playwright spec files. All must complete
before T012 (visual baselines need the finished exemplars), T013 (ratchet review needs the final
surface) and T014 (the gate pass needs the finished diff).

## Work Package WP01 — Add the sk-boundary-page styles-only frame

- **Summary**: Implement the one-anatomy public-boundary-page frame from spec.md in one PR: base
  layout and containment (T001, T004), mark/status composition placement (T002), the
  footnote/mark DOM-absence contract with its proof (T003, T010), responsive/forced-colors/
  reduced-motion baselines (T005, T006, T011), exemplars/stories/generated barrel (T007, T008,
  T009), named visual baselines (T012), a ratchet review confirming nothing outside
  `packages/styles/src/boundary-page/` needs to change (T013), and a full regeneration/gate pass
  (T014) before the PR is written (T015).
- **Priority**: P1 (this mission's only WP; the last Wave C child of epic #300).
- **Independent test**: A reviewer can render every required exemplar (form-card, terminal-card,
  with/without mark, with/without footnote, one/several/no action, long identifier, long email,
  forced-colors, `LightMode`), confirm the consumer's own `<h1>`/landmark is unaffected, confirm
  the mark/footnote absence is asserted by computed geometry rather than visual inspection alone,
  confirm no default tone/size/shape/border is set by the frame's own CSS, confirm no `::part()`
  selector exists in the shipped sheet, and confirm the visual-baseline snapshot names match
  research.md Decision 7's list before they are harvested from CI.
- **Included subtasks**: T001 through T015.
- **Requirement refs**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009,
  FR-010, FR-011, FR-012, FR-013, FR-014, FR-015, FR-016, FR-017, NFR-001, NFR-002, NFR-003,
  NFR-004, C-001, C-002, C-003, C-004, C-005, C-006, C-007, C-008.
- **Estimated prompt size**: ~500-600 lines (15 subtasks).
- **Dependencies**: none (first and only WP).
- **Prompt file**: `tasks/WP01-boundary-page-styles.md`
