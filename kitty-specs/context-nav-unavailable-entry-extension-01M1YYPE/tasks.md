# Tasks: Context navigation unavailable-entry extension

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, and `contracts/context-nav-unavailable.md`  
**Planning base / merge target**: `train/elements-first`; implementation runs in one Spec Kitty lane and its single PR targets the train.

## Work-package topology

Exactly one work package and one PR. The two selectors are one extension of the existing
styles-only `.sk-context-nav` contract; authored CSS/HTML, the generated barrel, stories,
browser proof, visual baselines, ratchets, and consumer documentation are not independently
releasable. The package owns no tokens, elements, wrappers, or runtime behavior.

## Subtask index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | Refresh the lane onto the latest train, record dependency and frozen-surface hashes, then add focused tests first and demonstrate their expected missing-selector/story failure (FR-001–FR-010; NFR-001–NFR-007; C-001–C-006). | WP01 | No |
| T002 | Author generic native HTML exemplars and the two token-only BEM selectors for mixed, annotation-free, all-unavailable, unavailable-parent, and long-content states without adding interaction or changing existing links (FR-001–FR-007; NFR-002–NFR-005; C-001–C-006). | WP01 | No |
| T003 | Generate the styles-only barrel, add independently addressable dark/LightMode/forced-colours/RTL/narrow stories, update the exact story ratchet and public documentation, and prove forbidden distribution surfaces remain absent (FR-008–FR-010; NFR-004–NFR-006; C-001–C-006). | WP01 | No |
| T004 | Turn the focused contract green in Chromium and Firefox for native semantics, aria state, real-link current/focus order, pointer/focus invariance, absent children, 240px/390px/zoom containment, RTL, forced colours, reduced motion, theme resolution, and axe (FR-001–FR-010; NFR-001–NFR-005; SC-001–SC-004). | WP01 | No |
| T005 | Rebase onto current `origin/train/elements-first`, regenerate every applicable artifact, run focused and complete repository quality/type/build/Storybook/axe/browser/visual/mutation/composition/package gates, and record truthful exact-head evidence (FR-010; NFR-001–NFR-007; SC-001–SC-006). | WP01 | No |
| T006 | Perform a separate Codex implementation review and every required charter lens against the exact final head, remediate confirmed findings and repeat invalidated evidence, then open one `Refs #264` PR to `train/elements-first` (all requirements). | WP01 | No |

No task is safely parallel within the package: the red contract precedes source, generated/public
surfaces depend on final authored fixtures, and final gates/review depend on the complete rebased
delta.

## Work package

### WP01 — Native unavailable context-navigation entries

- **Goal**: publish the smallest styles-only unavailable-entry extension to `.sk-context-nav`, with canonical native examples and exact-head proof that unavailable content is visible, truthful, contained, and inert beside unchanged real links.
- **Priority**: P1 — it is the full outcome of #264 and the required public dependency for #265.
- **Independent test**: the focused real-browser suite passes in Chromium and Firefox; canonical stories cover every required state including real `LightMode`; axe and exact-head visual routes pass; generated output is byte-identical on rerun; and element/wrapper/token/neighbor surfaces remain unchanged.
- **Included subtasks**: T001–T006.
- **Dependencies**: #256 and PR #262 merged into `train/elements-first` at `57e1f466afd3ead40523aa3d25d86b85eda87bce`; current ADR-9/10/11 and component-authoring recipe.
- **Owned surfaces**: `packages/styles/src/context-nav/**`, `apps/storybook/src/tests/sk-context-nav.spec.ts`, context-nav routes/baselines in `apps/storybook/src/tests/visual.spec.ts*`, `expected-stories.json`, `docs/design-system/using-components.md`, and regenerated shared artifacts only when required by current tooling.
- **Risks**: flex wrapping can visually separate annotations from labels; forced colours can collapse state contrast; trusted-event/focus tests can accidentally prove only DOM shape; concurrent train changes can invalidate generated, visual, and review evidence.

## Requirement coverage

- T001–T002 cover FR-001–FR-007 and every constraint in the authored semantics and CSS boundary.
- T003 covers FR-008–FR-010 and the public/generated compatibility surface.
- T004 proves FR-001–FR-009, NFR-001–NFR-005, and SC-001–SC-004 in real browsers.
- T005–T006 cover every requirement, NFR-006/NFR-007, and SC-005/SC-006 on the final rebased head.

All FR-001–FR-010, NFR-001–NFR-007, and C-001–C-006 are mapped. Success criteria are
acceptance outcomes and are deliberately not frontmatter requirement references.

## MVP and delivery boundary

The whole WP is the MVP. It opens exactly one PR into `train/elements-first` with `Refs #264`.
The Spec Kitty acceptance/merge/mission-review gates, issue closure, and downstream #265 start
belong to the programme orchestrator after this package is approved.
