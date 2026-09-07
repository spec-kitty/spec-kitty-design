# Tasks: Work Package overview/detail pattern stories

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`  
**Branch**: `mission/work-package-view-pattern-stories`; the eventual PR targets
`train/elements-first`, never `main`.

One cohesive package owns the Storybook-only fixture, pure projections, overview/detail
renderers, state stories, composition tests, documentation, and exact-head evidence. Splitting
overview from detail would duplicate the one authoritative fixture; splitting tests from stories
would leave a partial package that cannot satisfy #214 independently. The order is deliberately
test-first: characterize existing public surfaces and author failing contract tests before the
corresponding pattern implementation.

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | Establish the clean current-train baseline; inventory public predecessor surfaces, Storybook discovery/style seams, current story/visual ratchets, and exact focused/full commands. Record the unavailable authenticated T10/T11 payload and make no unseen pixel claim (FR-001, FR-017, FR-019–FR-020; NFR-009–NFR-011; C-002, C-006, C-009–C-011). | WP01 | No |
| T002 | Add red-first story/play or focused fixture tests for deep immutability of all fifty fixture-owned scale records, duplicate/unknown fail-closed cases, 5-of-8 from the supplied completed lane, valid empty progress `value=0,max=1`, 50-item derivation without fabrication, lane/list/progress reconciliation, direct-child passive checklist semantics, detail totals, verbatim event order, and dark/light data signatures (FR-002–FR-005, FR-010, FR-013; NFR-001–NFR-002, NFR-006–NFR-007; C-004–C-005). | WP01 | No |
| T003 | Implement the deeply readonly `WORK_PACKAGE_VIEW_FIXTURE` with all fifty scale records and `completedLaneId`, recursive freezing, and pure typed `deriveOverview`/`deriveDetail` projections inside the excluded story module only; read no clock, random, route, network, storage, parser, sorter, or trust classifier (FR-001–FR-003, FR-005, FR-010; NFR-001–NFR-002, NFR-007; C-002–C-005, C-010). | WP01 | No |
| T004 | Add the sanctioned component-scoped style imports to Storybook preview and author only token-backed composition layout styles; add no component CSS copy, token, package export, generated-file edit, private selector, or Team Kitty import (FR-001, FR-004, FR-009, FR-017; C-001–C-003, C-006–C-008). | WP01 | No |
| T005 | Implement the public-surface-only overview renderer: page header, labelled native progress (including visible 0/0 with valid DOM `value=0,max=1`), five native lane sections/lists, compact action rows, pills/markers/status, inline empty treatment, conditional named board scroller, and native narrow select with consumer-supplied visibility (FR-004–FR-005, FR-008, FR-012, FR-014, FR-016–FR-017; NFR-002–NFR-005; C-001–C-007). | WP01 | No |
| T006 | Add populated/dark, `LightMode`, all-empty, 50-item scale, live claim, stale claim, snapshot-behind-log, and narrow overview exports. Wire pointer/Enter/Space and select change to spies while keeping selection/lane visibility controlled by supplied inputs (FR-006–FR-008, FR-012–FR-016; NFR-003–NFR-007; C-003–C-006). | WP01 | No |
| T007 | Implement the public-surface-only detail renderer with native breadcrumbs, page header, native `ul` with direct passive `sk-check-bullet[role=listitem]` children and no wrapper `li`/checkbox/tabindex, `.sk-prose` prompt/code, base card and facts, and source-ordered native event timeline; preserve supplied labels/content without parsing, sorting, inference, or toggle behavior (FR-009–FR-010, FR-014, FR-017; NFR-001–NFR-005; C-001–C-007). | WP01 | No |
| T008 | Add populated/dark, `LightMode`, no-subtasks, absent-prompt, history-unavailable, long-content, and narrow detail exports. Use public empty state for ordinary absence and `sk-notice` only for supplied announcement states (FR-011–FR-013, FR-016; NFR-003, NFR-005–NFR-006; C-005–C-007). | WP01 | No |
| T009 | Document the Storybook pattern and immutable fixture → selectors → renderers seam in the usage guide, including every application-owned boundary; declare every helper in `meta.excludeStories`, build Storybook, prove exactly fifteen story entries, update the authored story ratchet from the current train total by exactly +15, and prove no public API/generated drift (FR-001, FR-007, FR-011, FR-018, FR-020; NFR-009; C-002–C-003, C-008–C-010). | WP01 | No |
| T010 | Add the focused Chromium/Firefox/WebKit composition suite covering direct-child checklist and all other native semantics, exact counts/progress DOM properties, fixture-owned scale records, uniqueness, notices versus passive empty states, controlled pointer/Enter/Space activation, native lane choice, keyboard/focus walkthrough, theme parity/token delta, 50-item scale, narrow/mobile/200%-zoom containment, and reachable board/code overflow (FR-003–FR-016, FR-020; NFR-001–NFR-007, NFR-010; C-004–C-007). | WP01 | No |
| T011 | Add only #214 visual cases and CI-authoritative baselines for complete dark/light/narrow T10/T11 routes plus board/progress/claim/checklist/history/code risks; ratchet every pattern story through non-empty axe, leave every unrelated baseline unchanged, and record qualitative T10/T11 evidence limits (FR-007, FR-011, FR-013, FR-016, FR-019–FR-020; NFR-003, NFR-005–NFR-009; C-008–C-010). | WP01 | No |
| T012 | Fetch/rebase the latest train, regenerate applicable shared artifacts, rerun focused-first then the complete repository generation/type/lint/behavior/mutation/Storybook/axe/Playwright/visual/quality/release/security gate surface, audit all forbidden scope, and prepare exact-head CI plus four-lens Codex review and Spec Kitty acceptance evidence (all requirements and SC-001–SC-011). | WP01 | No |

No `[P]` marker is valid: the single story module, Storybook preview imports, story ratchet, visual
cases, and docs are shared write surfaces, and later proof depends on the complete set of stories.

## Work Packages

### WP01 — Work Package view patterns and proof

- **Goal**: deliver the complete non-published T10/T11 Storybook composition and executable proof
  without adding application behavior or a page-level element.
- **Independent review**: the package is acceptable only when all fifteen states are discoverable,
  its semantic/interaction/responsive/visual evidence is green, and full exact-head repository
  gates pass after the last train rebase.
- **Included subtasks**: T001–T012.
- **Dependencies**: closed programme predecessors #177, #178, and #209–#213.
- **Owned surfaces**: one `*.stories.ts` pattern module, Storybook preview imports, the dedicated
  composition Playwright suite, #214-only axe/visual ratchet entries and baselines, and the focused
  usage-guide section. Generated artifacts are changed only by repository generators.

## Requirement coverage

| Coverage | Tasks |
|---|---|
| FR-001–FR-003 pattern/fixture/selectors | T001–T004, T009, T012 |
| FR-004–FR-008 overview/states/intents | T002, T005–T006, T009–T012 |
| FR-009–FR-012 detail/states/notices | T002, T007–T012 |
| FR-013–FR-017 theme/native/keyboard/overflow/public guard | T004–T012 |
| FR-018–FR-020 docs/visual/axe | T001, T009–T012 |
| NFR-001–NFR-011 | T001–T012, with complete final proof in T012 |
| C-001–C-011 | surface-specific tasks above, with complete scope audit in T012 |
| SC-001–SC-011 | focused evidence in T002–T011; exact-head evidence in T012 |

## Delivery note

The Codex implementer and read-only reviewer work only in the fresh primary clone. The programme
orchestrator owns GitHub closeout and must not merge the train to `main`. Any rebase or push
invalidates CI and adversarial evidence, which must be rerun at the resulting exact head.
