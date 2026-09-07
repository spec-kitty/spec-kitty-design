# Tasks: Native context-navigation styles

**Input**: `spec.md`, `research.md`, `data-model.md`, `plan.md`, `quickstart.md`, and `contracts/context-nav.md`
**Planning base / merge target**: `train/elements-first`; implementation runs in the Spec Kitty lane and its single PR targets the train.

## Work-package topology

Exactly one work package and one PR. `.sk-context-nav` is one styles-layer public contract: authored CSS and canonical native HTML, its generated TypeScript barrel, public exports, stories, tests, ratchet, and consumer documentation must land together. None is independently releasable without exposing either an incomplete or unverified API. Shared repository generators and gates validate that contract; they are not separate architectural deliverables.

## Subtask index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | Fetch/reconcile latest train in the lane, record baseline bytes for manifest/React/Vue/behavior registries, and author the focused source/Playwright acceptance contract first so the missing stylesheet/stories fail for the intended reasons (FR-001–FR-011; NFR-001–NFR-007; C-001–C-006). | WP01 | No |
| T002 | Author the token-only `.sk-context-nav` stylesheet and canonical native fixtures for grouped text/icon links, top/current child/current parent/no-current/explicit-false states, one/three/twenty children, empty/overflow, long labels and RTL without JavaScript or application inference (FR-001–FR-008; NFR-002–NFR-006; C-001–C-005). | WP01 | No |
| T003 | Generate the styles-only TypeScript barrel, wire root/subpath exports, and author the axe-enabled Storybook catalogue including Default, current variants, Empty, EmptyOverflow, LongLabels, TwentyChildren, Narrow, ForcedColors, Rtl and real LightMode (FR-009, FR-011; NFR-001–NFR-007). | WP01 | No |
| T004 | Turn the focused contract green in Chromium and Firefox: native landmark/heading/list/link semantics, accessible names/icons, DOM/tab order, non-false `aria-current`, neutral visited state, 44×44 primary targets, state/focus distinction, nested hierarchy, theme/forced-colour/reduced-motion, 240px/390px/zoom containment, RTL, and zero document overflow (FR-002–FR-009; NFR-001–NFR-006; SC-001–SC-004). | WP01 | No |
| T005 | Document the public native structure, imports, `aria-current`/icon/empty-overflow ownership, styles-only rationale and `sk-context-sidebar` composition; ratchet every cited story and confirm no duplicate component or Team Kitty behavior entered the package (FR-009–FR-010; C-001–C-006; SC-001, SC-006). | WP01 | No |
| T006 | Regenerate every required shared artifact from source after a real build, run focused-to-full repository gates including Storybook/axe/visual, Chromium/Firefox/WebKit where available, mutation self-test, security/release checks, and execute/record every acceptance criterion on one committed SHA (all requirements). | WP01 | No |
| T007 | Immediately before independent review and PR delivery, fetch/rebase on current `origin/train/elements-first`, regenerate and rerun affected/full gates; complete independent Codex WP review and Tier-C exact-head lenses, remediate every finding, create one PR with `Refs #256`, and rerun evidence after any push (FR-009–FR-011; NFR-001–NFR-007; C-001–C-006). | WP01 | No |

No `[P]` task is honest. T001 creates the red contract; T002 supplies the source it targets; T003 requires final fixtures; T004 requires runnable stories; T005 documents the stable API; and T006/T007 require the complete exact-head delta.

## Work package

### WP01 — Native grouped and nested context-navigation contract

- **Goal**: publish exactly the `.sk-context-nav` family on consumer-authored native light-DOM navigation, including all ten requested treatments and resilient interactive/current/nested/empty presentation, with no custom element or behavior.
- **Priority**: P1 — it is the complete outcome of #256 and the public dependency that #255 may consume.
- **Independent test**: the focused Playwright module passes on Chromium and Firefox (and WebKit in the repository full suite where available); the built story set is ratcheted, non-empty, axe-clean and theme-correct; generated barrel/export/release checks pass; actual zoom evidence is recorded; and manifest/React/Vue/behavior/mutation surfaces remain unchanged.
- **Included subtasks**: T001–T007.
- **Dependencies**: closed #92, #145, and #176 plus current ADR-9/10/11 and train tokens. No other Repository Dossier child is a source prerequisite.
- **Owned surfaces**: `packages/styles/src/context-nav/**`, styles root/package exports, `apps/storybook/src/tests/sk-context-nav.spec.ts`, context-nav visual registration/snapshots where required, `expected-stories.json`, `docs/design-system/using-components.md`, and regenerated shared outputs required by the current recipe.
- **Risks**: shared generated outputs can collide with concurrent Wave A work; pseudo-state/visited tests need deterministic evidence; WebKit or browser UI zoom may be host-limited; any rebase or push invalidates exact-head review evidence.

## Requirement and invariant coverage

- T001–T003 cover FR-001–FR-011, NFR-004/NFR-007, and C-001–C-006 in source/distribution form.
- T004 covers FR-002–FR-009, NFR-001–NFR-006, SC-001–SC-004 in real browsers.
- T005 covers FR-009/FR-010, C-001–C-006, SC-001/SC-006 in public guidance and ratchets.
- T006/T007 cover every requirement on the final rebased SHA and prove SC-005.

All FR-001–FR-011, NFR-001–NFR-007, and C-001–C-006 are mapped. Success criteria are WP acceptance outcomes rather than requirement refs.

## MVP and delivery boundary

The whole WP is the MVP. The implementer completes the lane and independent review loop. This issue mission opens exactly one PR into `train/elements-first` with `Refs #256`; the programme orchestrator, not this WP, controls serial Wave A merge and issue closure.
