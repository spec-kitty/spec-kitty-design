---
work_package_id: WP01
title: Styles-only Work Package detail primitives
dependencies: []
requirement_refs:
- C-001
- C-002
- C-004
- C-005
- C-006
- C-008
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
- FR-007
- FR-011
- FR-012
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- NFR-007
- NFR-008
planning_base_branch: mission/work-package-detail-primitives
merge_target_branch: mission/work-package-detail-primitives
branch_strategy: Planning artifacts for this mission were generated on mission/work-package-detail-primitives. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/work-package-detail-primitives unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
phase: Phase 1 - Native detail presentation
history:
- at: '2026-09-07T11:53:49Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: packages/styles/src/
create_intent:
- packages/styles/src/breadcrumbs/sk-breadcrumbs.css
- packages/styles/src/breadcrumbs/sk-breadcrumbs-html.stories.ts
- packages/styles/src/prose/sk-prose.css
- packages/styles/src/prose/sk-prose-html.stories.ts
- packages/styles/src/event-timeline/sk-event-timeline.css
- packages/styles/src/event-timeline/sk-event-timeline-html.stories.ts
- apps/storybook/src/tests/sk-work-package-detail-primitives.spec.ts
execution_mode: code_change
model: ''
owned_files:
- packages/styles/src/breadcrumbs/**
- packages/styles/src/prose/**
- packages/styles/src/event-timeline/**
- packages/styles/src/index.ts
- packages/styles/package.json
- apps/storybook/src/tests/sk-work-package-detail-primitives.spec.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP01 – Styles-only Work Package detail primitives

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `codex`

If no profile is specified, run `spec-kitty agent profile list` and select the best match for this work package's `task_type` and `authoritative_surface`.

---

## Objective

Deliver the three light-DOM presentation primitives required by #213: breadcrumbs, prose, and ordered event history. Each must be independently usable over native semantic markup, documented in Storybook, and covered by rendered behavior that proves accessibility and local overflow rather than merely checking source strings.

## Context

Read `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/public-surfaces.md`, ADR-9/10/11, issue #213, and the current component-authoring recipe. These primitives have no element directories by design. The consumer owns all content, labels, order, links, headings, tables, trust, and time.

The T11 Stitch screen is visual intent only and was not available beyond an unauthenticated account shell during planning. Use the current train's tokens and established T10/T11 visual grammar; do not invent app behavior or claim pixel fidelity to an inaccessible screen.

Run this WP in the already-created primary clone. Do not call the action that allocates a worktree. Transition with `spec-kitty agent tasks move-task WP01 --to doing --mission 01M1XTPW`, resolve action context/profile, and work only in this checkout.

## Branch Strategy

- **Strategy**: single branch in fresh primary checkout; no git worktree
- **Planning base branch**: `mission/work-package-detail-primitives`
- **Merge target branch**: `mission/work-package-detail-primitives`
- **External integration target**: `train/elements-first`

The programme deliberately overrides the default lane-worktree mechanism because Spec Kitty can resolve and mutate the wrong primary checkout from a worktree. Stay on the exact mission branch.

## Subtasks & Detailed Guidance

### Subtask T001 – Add the red-first rendered contract

- **Purpose**: Prove the browser suite fails before any primitive exists and later constrains the actual semantic/layout outcomes.
- **Steps**:
  1. Create `apps/storybook/src/tests/sk-work-package-detail-primitives.spec.ts` using current Storybook Playwright helpers and web-server conventions.
  2. Reference stable story IDs for all three families; the first focused run must fail because those IDs do not exist.
  3. Assert one/three/six breadcrumb list-item counts, exactly one terminal `aria-current="page"`, links independently focusable, and the long-label accessible text left intact.
  4. Assert prose retains real headings/lists/links/code and that long `<pre>` plus nested `.sk-data-table` overflow their own regions without increasing document scroll width. At a wide viewport, measure the prose content box and its computed `max-inline-size` to prove the token-derived readable measure is actually bounded; at the narrow viewport, prove it contracts to the available width without page overflow. This assertion must fail if the measure rule is deleted.
  5. Assert event list count/order at 1/2/20, long metadata grouping, supplied verified marker presence without inference, and decorative geometry absent from authored text/accessibility names.
  6. Run the single file before implementation and record the named missing-story red in the activity/evidence handoff.
- **Files**: the new Playwright spec only.
- **Validation**: focused Playwright collection succeeds and test execution fails for the intended absent stories, not configuration or browser setup.
- **Parallel?**: No; it defines the contract for T002–T004.

### Subtask T002 – Author `.sk-breadcrumbs`

- **Purpose**: Provide accessible repository/mission/WP orientation over native navigation.
- **Steps**:
  1. Create `packages/styles/src/breadcrumbs/sk-breadcrumbs.css` with `.sk-breadcrumbs`, `__list`, `__item`, and `__link` as needed.
  2. Preserve consumer-authored `<nav aria-label="Breadcrumb"><ol><li><a>`; do not add generated navigation/back behavior.
  3. Draw separators on adjacent items as decorative CSS. If `content` is used, use the alternate text syntax with `''` so the glyph adds no accessible name.
  4. Keep the list/region at `min-inline-size: 0`/`max-inline-size: 100%`; local horizontal overflow is acceptable only inside the breadcrumb region. Do not truncate DOM text or use `aria-label` to mask it.
  5. Give links a token-driven visible `:focus-visible` outline that remains present under forced colors.
  6. Author HTML fixtures for one, three, six, long-label, narrow, and forced-colors acceptance states using real links and one current terminal link.
- **Files**: new breadcrumbs CSS/HTML files.
- **Validation**: stylelint, htmlhint, focused list/current/focus/overflow tests.
- **Parallel?**: Yes, after T001; disjoint from prose/timeline.

### Subtask T003 – Author `.sk-prose`

- **Purpose**: Provide readable prompt/article typography while retaining source semantics and containing code/table width.
- **Steps**:
  1. Create `packages/styles/src/prose/sk-prose.css` using current typography/surface/foreground/spacing/border/radius tokens only, including an explicit token-derived readable-measure bound rather than an ungoverned literal.
  2. Style native headings without assigning levels, plus paragraphs, ordered/unordered lists, links, inline `<code>`, and `<pre><code>`.
  3. Give `<pre>` its own `overflow-x: auto`, `max-inline-size: 100%`, and focus/region treatment only when the authored fixture actually makes it keyboard-scrollable.
  4. Do not implement Markdown parsing, sanitization, highlighting, a copy button, TOC, or scroll spy.
  5. Compose a real existing `.sk-data-table` for wide structured data; do not restyle it into event history or flatten table semantics.
  6. Author prompt, long prose/code, wide table, absent-prompt composition, narrow, and light-mode fixtures. Absence uses `.sk-empty-state` outside/in composition and does not invent copy in CSS.
- **Files**: new prose CSS/HTML files.
- **Validation**: stylelint, htmlhint, focused native element/link/code/table/overflow tests.
- **Parallel?**: Yes, after T001.

### Subtask T004 – Author `.sk-event-timeline`

- **Purpose**: Present consumer-ordered transitions as a native chronology with metadata attached at every width.
- **Steps**:
  1. Create `packages/styles/src/event-timeline/sk-event-timeline.css` for an `<ol>` root and BEM item/summary/metadata/content/marker hooks.
  2. Use grid or flex with intrinsic wrapping; avoid absolute positioning that can detach actor/time metadata from a long entry.
  3. Draw connectors/dots with borders/backgrounds or empty-alt generated content. They must remain purely decorative.
  4. Render transition, actor/time, optional support content, and any supplied `sk-status-indicator`/marker verbatim. Add no sorting, verification, trust/tone inference, timestamp formatting, pagination, or clock.
  5. Author one/two/twenty-event, long-transition, supplied-verified-marker, unavailable-retention composition, narrow, forced-colors, and light-mode fixtures.
  6. Use `.sk-empty-state` for passive unavailable retention; demonstrate `sk-notice` only if the story explicitly needs announcement semantics and do not duplicate its CSS.
- **Files**: new event-timeline CSS/HTML files.
- **Validation**: stylelint, htmlhint, order/count/text/metadata-width checks.
- **Parallel?**: Yes, after T001.

### Subtask T005 – Publish stories and package surfaces

- **Purpose**: Make every acceptance fixture discoverable to Storybook and consumers without hand-authoring generated barrels.
- **Steps**:
  1. Add one `*-html.stories.ts` per primitive, importing its CSS and generated HTML constants.
  2. Include `Default`, all named acceptance states, and a real `LightMode` wrapped in `.sk-light`; every meta enables a11y.
  3. Avoid inline raw design values. Use story viewport parameters or token-only fixture wrappers for narrow evidence.
  4. Run `node scripts/build-styles-only-markup.mjs` to create each directory `index.ts`; never edit those generated files.
  5. Add exactly three root `export *` lines to `packages/styles/src/index.ts` and three package export subpaths to `packages/styles/package.json` in sorted order.
  6. Run `node scripts/build-styles-only-markup.mjs --check` and the release/export graph gates that cover missing package surfaces.
- **Files**: style stories, generated per-directory indexes, styles root index/package map.
- **Validation**: TypeScript build, generated-barrel drift, release graph, Storybook index IDs.
- **Parallel?**: No; follows all authored fixtures.

### Subtask T006 – Run focused WP01 verification

- **Purpose**: Establish reviewable evidence before the check-bullet extension begins.
- **Steps**:
  1. Run styles build, styles lint/stylelint/htmlhint, styles-only generation `--check`, release graph, and story theme wrapper gate/selftest.
  2. Build Storybook without relying on a stale Nx cache when diagnosing render output.
  3. Run the focused Playwright file on Chromium and Firefox; run WebKit in the supported container/environment if host libraries are unavailable.
  4. Run the axe harness and confirm every new story is assessed, not skipped or missing.
  5. For each new family, compare one named token-derived computed property between its default-dark and actual `.sk-light` story and require a difference: breadcrumb link ink, prose body ink, and timeline metadata ink. Also assert the LightMode wrapper is present; an inert theme must red the focused suite.
  6. Under active Chromium forced-colors emulation, focus a breadcrumb link and measure a nonzero visible focus outline, then measure nonzero breadcrumb separator/timeline dot-or-connector geometry with system-resolved paint. A media-query match or source rule alone is not evidence; add targeted authored CSS only if a rendered observable fails.
  7. Confirm no component element directories, behavior entries, tokens, app state, or unrelated sources entered the diff.
  8. Commit the WP with a conventional `styles`/`storybook` scoped history through `spec-kitty safe-commit`, mark T001–T006 done through the CLI, then move WP01 to `for_review` and wait for its synchronous gate to finish.
- **Files**: no new scope; evidence comes from real commands.
- **Validation**: all commands exit zero on the committed WP head.
- **Parallel?**: No.

## Test Strategy

- Focused first: new Playwright file, styles build, stylelint/htmlhint.
- Rendered evidence must inspect the real Storybook iframe and exact story root.
- Use no source-string-only assertion as the sole proof for native semantics or overflow.
- Forced colors is Chromium-owned where Playwright emulation is engine-specific; ordinary semantics/layout run in Chromium, Firefox, and WebKit.
- Axe must discover every new story and report zero WCAG 2.1 AA violations.

## Definition of Done

- T001–T006 are recorded done by Spec Kitty.
- Three CSS/HTML/story families exist with generated per-directory barrels and published package/root exports.
- Required states are separately addressable and `LightMode` is functional.
- Browser tests prove semantics, focus, ordering, names, local overflow, and scale.
- No element, parser, state machine, trust/time logic, or raw design value was added.
- Focused Storybook/axe/browser/build/lint/drift gates are green on the committed head.
- Independent review records approve or returns actionable feedback through the event-log seam.

## Risks & Mitigations

- **Pseudo-content becomes speech**: use empty accessible alternatives and test names/text.
- **Page overflow remains hidden**: compare each local scroller's dimensions and document root scroll width at narrow viewport/zoom.
- **Fixtures are decoys**: every named state must differ in source data and have at least one state-specific assertion.
- **Generated barrels hand-edited**: regenerate and check; review file headers.
- **Domain leakage**: story copy may illustrate a WP route, but production CSS/API names remain generic and no Team Kitty state logic is added.

## Reviewer Guidance

- Load `reviewer-renata` and compare the implementation to FR-001–FR-007 plus the issue's complete state list.
- Check every test would fail if its corresponding CSS/story/semantic fix were deleted.
- Inspect native DOM, accessible names, and overflow measurements rather than trusting story titles.
- Reject any shadow wrapper, app behavior, fake forced-colors claim, inert LightMode, missing package export, or manually written generated index.
- Record approve/reject only via `spec-kitty agent tasks move-task` with structured evidence.

## Activity Log

- 2026-09-07T11:53:49Z – system – Prompt created.
- 2026-09-07T15:15:37Z – codex – Review-cycle-2 visual finding folded at 9e4827ee: the long-label rendered geometry assertion first failed with the first link ending at 335.328px while the next item began at 108.453px. Adding flex:none to each breadcrumb item restores local horizontal scrolling without overlap. Fresh exact-head evidence: Chromium/Firefox 35 pass + 1 Firefox forced-colors skip; WebKit 17 pass + 1 forced-colors skip; quality:all; styles-only drift; token-literal/no-CSS; adopted-boundary/hygiene/theme; release graph; Storybook budget build; and axe 359/359 all green.
