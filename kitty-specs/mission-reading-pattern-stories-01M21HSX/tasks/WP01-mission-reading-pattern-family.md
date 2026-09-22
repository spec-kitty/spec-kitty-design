---
work_package_id: WP01
title: Prove the complete Mission Reading family from public surfaces
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
- FR-007
- FR-008
- FR-009
- FR-010
- FR-011
- FR-012
- FR-013
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- NFR-006
- NFR-007
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
- C-007
planning_base_branch: train/elements-first
merge_target_branch: train/elements-first
branch_strategy: Planning artifacts for this mission were generated on train/elements-first. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into train/elements-first unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-mission-reading-pattern-stories-01M21HSX
base_commit: 4ac977548da825e9b06568bc51cea0e47fece410
created_at: '2026-09-08T22:51:16.989421+00:00'
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
- T008
- T009
- T010
- T011
phase: Phase 1 - Mission Reading pattern proof
history:
- at: '2026-09-08T22:44:00Z'
  actor: codex
  action: Prompt authored during mission task finalization
agent_profile: frontend-freddy
authoritative_surface: packages/elements/src/patterns/mission-reading.stories.ts
create_intent:
- packages/elements/src/patterns/mission-reading.stories.ts
- apps/storybook/src/tests/sk-mission-reading-pattern.spec.ts
execution_mode: code_change
model: ''
owned_files:
- packages/elements/src/patterns/mission-reading.stories.ts
- apps/storybook/.storybook/preview.ts
- apps/storybook/src/tests/sk-context-nav.spec.ts
- apps/storybook/src/tests/sk-mission-reading-pattern.spec.ts
- apps/storybook/src/tests/visual.spec.ts
- apps/storybook/src/tests/visual.spec.ts-snapshots/sk-mission-reading-*.png
- expected-stories.json
- docs/design-system/using-components.md
role: implementer
tags:
- pattern
- storybook
- accessibility
- mission-reading
task_type: implement
tracker_refs:
- '#265'
---

# Work Package Prompt: WP01 — Mission Reading pattern family

## Do This First: Load Governed Context

Use the Codex agent surface only. Load `frontend-freddy` through the Spec Kitty resolver, then load
the action-scoped doctrine context and runtime prompt before editing. Read the checkout's
`AGENTS.md`, `CLAUDE.md`, charter, ADR-9/10/11, component-authoring recipe, and this mission's
`spec.md`, `research.md`, `data-model.md`, and `plan.md`. Read the original Mission Reading design
pack and reviewed M1-M8 HTML/PNG artifacts from the source paths registered in `source-register.csv`.
Never invoke Claude or Claude tooling, never hand-edit mission event logs, and never hand-edit a
generated artifact.

Recheck issue #265, open PRs, and the current heads of both `train/elements-first` and Team Kitty
`main` before implementation and again before final verification. If #255 lands, coordinate only
by rebasing the latest train and regenerating derived artifacts; do not copy temporary branch code.

## Outcome and Definition of Done

Ship one Storybook pattern family demonstrating the reviewed Mission Reading designs through
public surfaces only. The implementation is done when:

- M1 populated Specify desktop; M2 responsive 390px and controlled drawer; M3 fragment loading;
  M4 canonical page unavailable; M5 snapshot behind log; M6a/M6b Other artifacts present/absent;
  M7a/M7b Ops present/absent; and M8 factual/observed/reported-live states are individually
  discoverable and non-empty.
- A valid `LightMode` variant exists, and focused evidence covers forced-colors, reduced-motion,
  RTL, zoom, long paths/branches, 240px/390px containment, and both sides of the shell threshold.
- One deeply frozen fixture owns every repeated mission, SHA, branch, catalogue, artifact, Ops,
  observed, and live value; pure projections select story states without mutation or I/O.
- Available destinations are real anchors; unavailable entries are static native non-links with
  visible text annotation and no interactive affordance. Research, Contracts, Checklists, and
  bounded Other children are the only nested catalogue cases; Ops is terminal.
- A matching marker is the sole source of pushed time, snapshot-behind-log uses the same SHA,
  loading fabricates no facts/actions, and Ops exposes only Invocation, Action, Status.
- Factual, observed, and reported-live regions have separate labels and freshness claims, with no
  inferred person-to-Work-Package join.
- The composition gate, focused browser suite, axe, visual regression, full repository gates, and
  exact-head Tier C review all pass after the final train rebase.

## Scope Boundaries

Compose only these existing public surfaces and native markup:

- `sk-app-shell`, `sk-personal-rail`, `sk-context-sidebar`, `.sk-context-nav`, `sk-page-header`,
  `.sk-breadcrumbs`, `sk-status-indicator`, `sk-pill-tag`, `.sk-facts`, `sk-section-header`,
  `sk-card`, `.sk-prose`, `.sk-data-table`, `sk-notice`, `.sk-empty-state`, `sk-grid`;
- native lists, links, code, tables, `article`, and `section` markup.

Do not create a Mission Reader or other page component, tier badge, skeleton/spinner, row/link/truth
component, recursive tree, generated TOC/outline/scroll spy, parser/sanitizer/highlighter, router,
fetching, polling, timers, truth verification, snapshot comparison, or application state. Do not
add search, filtering, sorting, pagination, editing, review, approval, comments, export, download,
retry, refresh, share, or copy actions. Placeholder geometry, artifact/Ops arrangements, and exact
git presentation stay pattern-owned. No React/Vue surface, token, manifest subject, or package
export is introduced.

All pattern classes use the `sk-mission-reading-pattern` BEM block. Use only approved token variables—no
raw color, spacing, type, radius, shadow, breakpoint, or sizing values. Preserve semantic
surface/foreground pairings and native source/focus order. A hard test viewport is test input, not
an authored design value.

## Subtasks

### T001 — Write the red focused contract first

Create the focused Storybook Playwright suite before the story implementation and record a failure
for the missing story/surface rather than infrastructure failure. Cover the complete expected story
inventory, public component/CSS-family inventory, absence of forbidden custom elements/exports,
native link versus static unavailable semantics, and anti-vacuity (visible root, no console error).

The eventual suite must exercise Chromium, Firefox, and WebKit where repository configuration
supports them. It may inspect public/light DOM and native accessibility behavior; it must not reach
into a composed component's shadow root to implement or restyle the pattern.

### T002 — Build the immutable fixture and pure state projections

In `mission-reading.stories.ts`, define readonly domain-neutral story types, a recursive deep-freeze
helper, and one exported fixture for testability (list it under `meta.excludeStories`). It must own:

- Team `Collaborative Demo Team`;
- repository `spec-kitty/EXPERIMENTAL-spec-kitty-saas`;
- Mission `Launch resilience tranche A`, number `1042`, TLDR, branch
  `feature/launch-resilience`, and SHA `72c4e9a`;
- the canonical catalogue, bounded Research/Contracts/Checklists children, four exact Other paths,
  terminal Ops row, observed WP02 activity, and reported-live actor/repository/branch/age.

Pure selectors project every M1-M8 state. Assert at module/test level that the source is deeply
frozen, every repeated value comes from it, snapshot and log use one SHA, unmatched/absent markers
produce no pushed time, loading has no document facts/actions, Ops has exactly three fields, and
observed/live records have no join key that fabricates an actor-to-WP relationship.

### T003 — Compose M1 and M2

Compose M1 through the public shell, rails/sidebar/navigation, page header, breadcrumbs, status,
pills, facts, section headers, cards, prose, tables/notices/empty states/grid as applicable, plus
native semantic markup. Keep source order meaningful.

For M2, use `sk-app-shell`'s public compact presentation and consumer-controlled `open` state.
Render a visible trigger at 390px, a 240px drawer from the public shell/sidebar surface, handle
`sk-app-shell-dismiss` by updating story-local state, and prove the first focus target is Back to
repository, Escape closes, focus returns to the trigger, and closed content creates no tab stops.
Do not introduce route state or a hidden duplicate catalogue.

### T004 — Compose M3, M4, and M5

- M3: show pattern-owned static placeholder geometry/loading copy without publishing a skeleton or
  spinner component and without document facts, artifact facts, actions, or false freshness.
- M4: keep Plan visibly unavailable as static non-anchor content while Specify is the current real
  link; retain the rest of the catalogue truthfully.
- M5: state that the snapshot is behind the log while rendering the exact same fixture SHA in both
  the header/facts and notice evidence.

### T005 — Compose M6a/M6b and M7a/M7b

M6a renders exactly the four fixture-owned Other artifact paths as bounded supplied children. M6b
renders the direct absent route truthfully and has no current navigation link for a destination
that does not exist. M7a renders Ops as a terminal catalogue destination and a native table with
only Invocation, Action, Status. M7b is the direct absent route, with no implied Ops child list and
no false current navigation link.

### T006 — Compose M8 truth regions

Render factual document content, observed activity, and reported-live presence as three separately
headed/labelled regions. Retain the fixture's distinct freshness wording. Observed activity names
WP02 and `for_review`; reported-live presence names actor `lynn`, repository, branch, and age only.
Do not place the actor in the Work Package row or phrase presence as verified truth.

### T007 — Theme and resilience variants

Add an actual `.sk-light` `LightMode` story whose data and semantics match the default story while
a paired token-dependent computed value changes. Add story variants or focused viewport cases that
prove forced-colors, reduced-motion, RTL, 200% zoom, long opaque paths/branches, 240px contextual
navigation containment, 390px layout, and viewports immediately below/at/above the public shell
threshold. Long labels and visible unavailable annotations must remain contained without clipping
or overlap. Do not add motion merely to test reduced motion.

### T008 — Register and document the pattern

Add every exported story ID to `expected-stories.json` in its current sorted/ratcheted format and
declare all non-story exports through `meta.excludeStories`. Update
`docs/design-system/using-components.md` with a concise Mission Reading composition recipe: public
surfaces used; fixture/projector/story ownership; native available/unavailable contract; controlled
drawer responsibilities; and explicit application-owned routing, data, fetching, truth checking,
Markdown processing, and actions.

Do not generate or export a runtime pattern component. Run the existing Storybook/index generator
commands to update any derived registries; never edit generated distribution files directly.

### T009 — Focused executable and accessibility evidence

Complete the focused suite with behavior assertions for every state and data invariant above.
Verify native `<nav>`/list/anchor semantics, exactly one `aria-current` on a real link where a
current destination exists, zero where an all-unavailable/absent route truthfully has none, static
unavailable entries with no href/role/tabindex/handler affordance, bounded child lists, and terminal
Ops. Verify drawer focus, Escape, and focus return; document/page containment; long text; zoom; RTL;
theme semantic parity; forced-color structure/focus; and no motion under reduced motion.

Ratchet every new story into the repository's non-empty axe scan. Register a focused but complete
visual matrix for reviewed desktop, 390px/drawer, loading, unavailable/behind-log, optional
present/absent, truth-region, LightMode, forced-colors, long-content, zoom, and threshold-edge
risks. Generate baselines only with the repository's Playwright visual tooling and inspect them.

### T010 — Full repository verification

Run focused tests followed by every current repository-required quality, lint, formatting, type,
build, Storybook, axe, Chromium/Firefox/WebKit browser, visual-regression, mutation,
composition-boundary, generated-artifact, package, and security gate. Do not weaken a test, accept
unrelated snapshot churn, or claim a skipped/unavailable gate as passing. Record exact commands,
results, and any environment limitation for the orchestrator.

### T011 — Latest-train rebase and exact-head handoff

Fetch `origin`, verify the state of #255 and all train PRs, rebase the WP lane onto the latest
`origin/train/elements-first`, resolve only genuine shared-train drift, and regenerate all derived
artifacts. Rerun focused and full gates. Capture/review visual baselines from that exact final
commit. Return a clean lane, a requirement evidence map, exact final head SHA, and concise test and
visual ledger to the orchestrator. Do not open/merge the PR or close issues yourself.

## Definition of Done

- FR-001-FR-013, NFR-001-NFR-007, C-001-C-007, and SC-001-SC-006 are covered by executable or
  reviewable evidence on one final head.
- Every reviewed M1-M8 state and `LightMode` is independently discoverable, non-empty, axe-clean,
  and built solely from public surfaces and native semantics.
- One immutable fixture supplies repeated truth; no false pushed time, SHA mismatch, loading fact,
  Ops field, freshness claim, or person-to-WP join exists.
- Responsive, zoom, RTL, forced-color, reduced-motion, long-content, and threshold-edge evidence is
  green, with reviewed visual baselines generated from the exact final head.
- The full repository gate set passes after the latest train rebase, and the diff creates no new
  public component, token, wrapper, parser, router, action, or application-state surface.
