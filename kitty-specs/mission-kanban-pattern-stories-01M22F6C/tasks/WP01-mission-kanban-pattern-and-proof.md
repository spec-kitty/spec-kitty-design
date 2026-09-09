---
work_package_id: WP01
title: Mission Kanban pattern and proof
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
- FR-014
- FR-015
- FR-016
- FR-017
- FR-018
- FR-019
- FR-020
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- NFR-006
- NFR-007
- NFR-008
- NFR-009
- NFR-010
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
- C-007
- C-008
- C-009
- C-010
planning_base_branch: train/elements-first
merge_target_branch: train/elements-first
branch_strategy: Planning artifacts for this mission were generated on train/elements-first. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into train/elements-first unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-mission-kanban-pattern-stories-01M22F6C
base_commit: 1fca8c20ad68f558a693c75f17f14f867af67567
created_at: '2026-09-09T08:42:32.246883+00:00'
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
- T012
phase: Phase 1 - complete Mission Kanban pattern and proof
history:
- at: '2026-09-09T07:40:00Z'
  actor: codex
  action: Prompt authored for issue
agent_profile: frontend-freddy
authoritative_surface: packages/elements/src/patterns/mission-kanban.stories.ts
create_intent:
- packages/elements/src/patterns/mission-kanban.stories.ts
- apps/storybook/src/tests/sk-mission-kanban-pattern.spec.ts
execution_mode: code_change
owned_files:
- packages/elements/src/patterns/mission-kanban.stories.ts
- apps/storybook/.storybook/preview.ts
- apps/storybook/src/tests/sk-mission-kanban-pattern.spec.ts
- apps/storybook/src/tests/sk-checkbox-choice-group.spec.ts
- expected-stories.json
- apps/storybook/src/tests/visual.spec.ts
- apps/storybook/src/tests/visual.spec.ts-snapshots/mission-kanban-*.png
priority: P1
role: implementer
tags:
- elements-first
- pattern
- mission-kanban
- storybook
- accessibility
task_type: implement
tracker_refs:
- '#278'
- '#276'
---

# Work Package Prompt: WP01 — Mission Kanban pattern and proof

## Governed Codex context

Load the `frontend-freddy` profile and implementation-scoped charter context through the installed
Spec Kitty resolver. Read the repository `AGENTS.md`, `CLAUDE.md`, charter, accepted ADR-9/10/11,
current component-authoring guide, issue #278, issue #276, predecessors #176/#178/#209/#211/#212/
#254/#272/#277, and this mission's committed `spec.md`, `plan.md`, `research.md`, and
`data-model.md`. Use the installed Spec Kitty runtime for WP state and evidence. Do not hand-edit
mission status, acceptance matrix, issue matrix, generated artifacts, or runtime state.

Run implementation on a Codex worker seat only. The independent reviewer must be another Codex
seat. Do not delegate to Claude or another external coding agent. Stay inside the runtime-provided
WP workspace and branch. Do not push, merge, close an issue, publish, release, deploy, or modify
`main`/`train/elements-first` directly.

## Outcome and non-negotiable boundary

Deliver the exact K1–K6 Mission Kanban family as a Storybook-only composition built from existing
public surfaces and native semantics. One deeply frozen fixture must reconcile all cards, detailed
lanes, five-stage reduction, counts, routes, snapshot warning, observed overlay, and reported-live
records. Add the required dark-first, `LightMode`, narrow, long-content, forced-colors,
reduced-motion, 200%-zoom, accessibility-tree, axe, and visual evidence.

Do not publish/register `sk-mission-kanban` or create a public helper/API. Do not add Team Kitty
imports, a custom checkbox, filter/query engine, router, route builder, polling, timer, fetch,
store, backend adapter, state mutation, drag-and-drop, snapshot comparison, freshness inference,
progress arithmetic, or unsupported titles/reasons/owners/dates/estimates/priorities. Keep
checked state, counts, filtering, Apply/Clear behavior, persistence, query parameters, lane
vocabulary/reduction, routes, and every application claim consumer-owned. Do not touch #279–#284.

## Files and ownership

Only these seven authored/product evidence surface groups may change:

```text
packages/elements/src/patterns/mission-kanban.stories.ts
apps/storybook/.storybook/preview.ts
apps/storybook/src/tests/sk-mission-kanban-pattern.spec.ts
apps/storybook/src/tests/sk-checkbox-choice-group.spec.ts
expected-stories.json
apps/storybook/src/tests/visual.spec.ts
apps/storybook/src/tests/visual.spec.ts-snapshots/mission-kanban-*.png
```

The Storybook module owns fixture types/data, deep-freeze and guard functions, pure projections,
the render helper, and all story exports. `preview.ts` receives only the missing #277 stylesheet
import. The browser suite exercises the built stories. `expected-stories.json` receives one new
ten-ID family. `visual.spec.ts` and new snapshots receive only #278 cases.

`apps/storybook/src/tests/sk-checkbox-choice-group.spec.ts` is a shared, integration-sensitive
#277 evidence surface owned by this WP only for its global story-total assertion. After the final
train refresh, set that assertion to the refreshed train total plus exactly the ten #278 stories.
Preserve #277's accepted `STORY_IDS`, selector/ID, native-semantics, documentation, focus, axe, and
visual assertions relative to the refreshed train; no other change in that file is authorized.

Expected generated/public delta is zero. Do not alter `packages/elements/src/index.ts`, custom
elements manifest, Vue declarations, React wrappers, generated CSS modules, styles-only barrels,
`SIZES.md`, tokens/catalogue, parts/docs/behavior/mutation ratchets, component implementation, or
any existing visual baseline.

## T001 — Establish exact-head baseline and red-first contract

**Requirements**: FR-001, FR-018, FR-020; NFR-009; C-001–C-004, C-008–C-010  
**Files**: create `apps/storybook/src/tests/sk-mission-kanban-pattern.spec.ts`; read all other owned
files and current public predecessors  
**Depends on**: none

1. Fetch `origin/train/elements-first`, confirm the WP base contains #277 and #272, record the exact
   base SHA, current story total/IDs, existing Mission Kanban absence, and generated/public hashes.
2. Inventory the exact public import and CSS seams; verify #272 `href` route mode and #277 native
   checkbox-choice classes from current source rather than recreating them.
3. Add a minimal focused test that requests the planned built story family and its render-complete
   contract. Build/run it before implementation and record the expected red result caused by the
   absent story/module—not an unrelated environment error.

**Commands**:

```bash
git fetch origin train/elements-first
git status --short --branch
git rev-parse HEAD origin/train/elements-first
node -e "const x=require('./expected-stories.json'); console.log(x.total)"
rg -n "href|layout|selectable" packages/elements/src/action-row/sk-action-row.ts
rg -n "fieldset|legend|input.*checkbox" packages/styles/src/checkbox-choice-group
npx nx run storybook:storybook:build
npx playwright test apps/storybook/src/tests/sk-mission-kanban-pattern.spec.ts --project=chromium
```

**Done when**: base/public/ratchet facts are recorded, the failure targets the missing #278 story
contract, the test itself compiles, and no product/public/generated file changed.

## T002 — Author one immutable fixture and pure projections

**Requirements**: FR-002–FR-006, FR-012, FR-014–FR-017; NFR-008; C-001, C-003–C-005  
**Files**: `packages/elements/src/patterns/mission-kanban.stories.ts`  
**Depends on**: T001

1. Define one recursively frozen `MISSION_KANBAN_FIXTURE` with exact ordered stages, ten detailed
   lanes, fifteen supplied Work Packages, routes/profiles/tracker references, K3 checked set,
   unchanged commit, snapshot record, WP03 observation, reported-live records, approved empty copy,
   and fixture-owned long-content evidence.
2. Encode only the supplied reduction: Planned/Blocked → Planned; Claimed/In progress → Doing; For
   review/In review → For review; Approved → Approved; Done/Canceled → Done. Keep empty Genesis
   unmapped; reject any non-empty unmapped lane.
3. Add unique-id/route/membership/selection/count guards and pure `deriveMissionKanban` plus
   `renderMissionKanban` seams. Freeze returned projections; never mutate fixture/prior output.
4. Add play-visible invariant signatures proving deep freeze, K1 `3/4/3/1/4` and 15, K3 WP05/WP10,
   K4 same commit, K5 WP03 `in_progress`/Doing, and K6 five zero-count stages.

**Commands**:

```bash
npx nx run elements:typecheck
npm run quality:lint
node scripts/check-pattern-composition.mjs
git diff --check
```

**Done when**: every value is traceable to the one frozen root; invalid duplicate/unmapped inputs
fail closed; repeated projections are identical and frozen; no clock/random/network/storage/app
dependency or unsupported fixture field exists.

## T003 — Establish the sanctioned styles and layout seam

**Requirements**: FR-018; NFR-009; C-002, C-007–C-008  
**Files**: `apps/storybook/.storybook/preview.ts`,
`packages/elements/src/patterns/mission-kanban.stories.ts`  
**Depends on**: T002

1. Add only `packages/styles/src/checkbox-choice-group/sk-checkbox-choice-group.css` to the
   Storybook preview beside existing disclosure/workflow/empty/breadcrumb imports.
2. Scope all pattern-local layout CSS under `sk-mission-kanban-pattern*` classes and use existing
   `var(--sk-*)` values for every design choice. Never select child private roots, copy an owned
   library class rule, use unscoped `sk-*`, or inject runtime CSS.
3. Import existing element modules only by their authored direct paths; add no barrel/public entry.

**Commands**:

```bash
npm run quality:stylelint
node scripts/check-pattern-composition.mjs --selftest
node scripts/check-pattern-composition.mjs
node scripts/check-no-css-in-source.mjs
npx nx run storybook:storybook:build
```

**Done when**: the Storybook build loads #277 styles, the composition gate sees the new pattern,
all design values are token-backed, and unrelated component/public sources remain unchanged.

## T004 — Render and prove K1 populated desktop

**Requirements**: FR-003, FR-005–FR-008, FR-018; NFR-001–NFR-002; C-002–C-007  
**Files**: story module and focused Playwright suite  
**Depends on**: T002–T003

1. Compose the public app shell and mission navigation, native breadcrumbs, page heading,
   status/pill context, and workflow board/lane surfaces.
2. Render five native `section[aria-labelledby]` stages with direct `ol > li` relationships in
   exact order and counts `3/4/3/1/4`; render all fifteen Work Packages once.
3. Put public `sk-action-row[layout="card"][href]` in every `li`. Use WP id as primary link name,
   retain exact committed detailed lane/profile, and keep optional tracker links independent.
   Omit `selectable` and every `sk-action-row-activate` handler.
4. Omit the board region/name/tab-stop triad while the desktop board fits.

**Commands**:

```bash
npx nx run storybook:storybook:build
npx playwright test apps/storybook/src/tests/sk-mission-kanban-pattern.spec.ts --project=chromium --grep "K1"
node scripts/run-axe-storybook.js
```

**Done when**: K1 contains exact ids/lanes/profiles/routes/tracker controls and stage/list counts;
routes are real anchors with visible focus/native behavior; the fitting board adds no dead tab stop;
K1 is non-empty and axe-clean.

## T005 — Render and prove K2 narrow containment

**Requirements**: FR-009–FR-010; NFR-002–NFR-004; C-002–C-004, C-007  
**Files**: story module and focused Playwright suite  
**Depends on**: T004

1. Render K1 data at 390×844 through `sk-app-shell[presentation="compact"]` without changing stage
   vocabulary, source order, or card facts.
2. Put horizontal overflow on the board scroller only. Because it genuinely overflows, give it
   the region/name/tab-stop triad and show one full lane plus a glimpse of the next.
3. Exercise keyboard traversal and focused-route visibility. Repeat with the repository-calibrated
   200%-zoom/half-viewport harness and long focus paths.

**Commands**:

```bash
npx nx run storybook:storybook:build
npx playwright test apps/storybook/src/tests/sk-mission-kanban-pattern.spec.ts --project=chromium --grep "K2|390|200%"
npx playwright test apps/storybook/src/tests/sk-mission-kanban-pattern.spec.ts --grep "K2"
```

**Done when**: document `scrollWidth` does not exceed `clientWidth`, board overflow is measurable and
locally reachable, every focused control/route is fully visible, and results pass Chromium,
Firefox, and WebKit at narrow and calibrated zoom.

## T006 — Render and prove K3 native detailed filters

**Requirements**: FR-004, FR-011–FR-013; NFR-001–NFR-004; C-002–C-006  
**Files**: story module and focused Playwright suite  
**Depends on**: T004

1. Compose an open native `.sk-disclosure` around one real fieldset/legend and ten #277
   label/input checkbox choices in exact order with counts `0/2/1/3/2/1/1/4/1/0`.
2. Check only In review and Blocked; show “2 of 15 work packages”; project only WP10 under For
   review and WP05 under Planned.
3. Render separate existing Apply and Clear controls as inert/observable story actions. Add no
   filtering, persistence, query update, checked-state owner, or application handler.
4. Prove summary/disclosure/fieldset/legend/labels/checkboxes and controls by keyboard and
   accessibility tree. Toggle a native checkbox and prove the fixed board stays unchanged.

**Commands**:

```bash
npx nx run storybook:storybook:build
npx playwright test apps/storybook/src/tests/sk-mission-kanban-pattern.spec.ts --project=chromium --grep "K3"
npx playwright test apps/storybook/src/tests/sk-mission-kanban-pattern.spec.ts --grep "K3"
node scripts/run-axe-storybook.js
```

**Done when**: ten labelled native choices, exact checked/count state, separate controls, native
keyboard behavior, fixed WP05/WP10 board, and zero axe violations are all asserted without an
engine or consumer-state claim.

## T007 — Render and prove K4/K5 truth separation

**Requirements**: FR-014–FR-016; NFR-001, NFR-005–NFR-006, NFR-008; C-003–C-005  
**Files**: story module and focused Playwright suite  
**Depends on**: T004

1. K4 adds exactly one attention `sk-notice` alongside K1's unchanged commit and board. Add no
   second SHA, clock, comparison, freshness result, or changed card.
2. K5 keeps WP03 committed `in_progress` under Doing and renders the exact supplied observation
   `lynn → for_review, not yet pushed` as explicitly Observed supporting content.
3. Keep reported-live activity in its own named sibling region. Never derive or overwrite one
   truth tier from another.

**Commands**:

```bash
npx nx run storybook:storybook:build
npx playwright test apps/storybook/src/tests/sk-mission-kanban-pattern.spec.ts --project=chromium --grep "K4|K5|truth"
node scripts/run-axe-storybook.js
```

**Done when**: K4 equals K1 in commit/cards/lanes/counts plus one notice; K5 preserves WP03's
committed placement; accessibility snapshots and DOM assertions label committed, snapshot,
observed, and reported-live facts separately.

## T008 — Render K6 and theme/stress evidence

**Requirements**: FR-017, FR-019; NFR-001–NFR-006, NFR-010; C-002–C-007, C-010  
**Files**: story module and focused Playwright suite  
**Depends on**: T004–T007

1. K6 derives no Work Packages yet retains five named stage sections/counts, five empty ordered
   lists, sibling “No work packages in this stage.” content, separate “No live activity reported.”
   copy, and no CTA.
2. Add `LightMode` as semantic/data-identical K1 under real `.sk-light`; assert a resolved
   token-backed visual difference.
3. Add fixture-owned LongContent, representative K4/K5 ForcedColors, and K5 ReducedMotion stories.
   Preference proof must use real `page.emulateMedia`, never decoy classes.
4. Preserve all meaning, controls, boundaries, focus, and truth labels through long/narrow,
   forced-color remapping, and reduced motion.

**Commands**:

```bash
npx nx run storybook:storybook:build
npx playwright test apps/storybook/src/tests/sk-mission-kanban-pattern.spec.ts --project=chromium --grep "K6|LightMode|long|forced|reduced"
node scripts/check-story-theme-wrapper.mjs
node scripts/run-axe-storybook.js
```

**Done when**: K6's stable native empty architecture/no-CTA contract is exact; dark/light content
signatures match and computed themes differ; long/forced/reduced states preserve complete content,
focus, and zero document overflow.

## T009 — Finalize story exports, source invariants, and story ratchet

**Requirements**: FR-001–FR-020; NFR-008–NFR-009; C-001–C-010  
**Files**: story module, focused Playwright suite, `expected-stories.json`, and the shared global
story-total assertion in `apps/storybook/src/tests/sk-checkbox-choice-group.spec.ts` only
**Depends on**: T002–T008

1. Export exactly six product states through `Default` (display name K1), K2, K3, K4, K5, and K6,
   plus `LightMode`, `LongContent`, `ForcedColors`, and `ReducedMotion` evidence.
2. List fixture/guard/projection/render exports in CSF `excludeStories`; enable axe for every story.
3. Build Storybook, read the ten normalized IDs from `index.json`, add exactly those under one new
   `mission-kanban-pattern` ratchet key, and increase the then-current total by exactly ten. Update
   only the predecessor test's global-total expectation to that same base total plus ten; preserve
   all of #277's accepted selector/ID assertions.
4. Add source/play assertions forbidding public element definition/export, app import, private
   selector, copied CSS, filtering/router/fetch/timer/store/mutation code, and unsupported data.

**Commands**:

```bash
npx nx run storybook:storybook:build
node -e "const x=require('./apps/storybook/storybook-static/index.json'); console.log(Object.keys(x.entries).filter(id=>id.startsWith('patterns-mission-kanban--')).sort())"
node -e "const x=require('./expected-stories.json'); console.log(x.total, x.byElement['mission-kanban-pattern'])"
node scripts/check-pattern-composition.mjs
node scripts/typecheck-all.mjs
npm run quality:all
git diff --check
```

**Done when**: built discovery contains exactly ten user-facing IDs and zero helper IDs; the ratchet
matches those exact IDs/+10; source guards pass; no public/generated/adjacent surface is added.

## T010 — Complete cross-browser accessibility and interaction evidence

**Requirements**: FR-007–FR-020; NFR-001–NFR-006, NFR-009; C-003–C-006  
**Files**: focused Playwright suite; story module only for defect corrections  
**Depends on**: T009

Cover all of the following in the built Storybook suite:

- exact native landmarks, heading/section/list relationships, list/count equality, disclosure,
  fieldset/legend, label/input associations, empty-list sibling copy, and no CTA;
- real action-row route role/name/href, Enter, modified click, context menu, independent tracker
  controls, absence of custom activation, keyboard order, and visible focus;
- K2 conditional scroller triad, 390px/200%-zoom document geometry, lane glimpse, and focus scroll;
- K3 native Space toggling with unchanged fixed projection and separate Apply/Clear controls;
- K4 same-commit parity, K5 truth-tier separation, K6 stable empty structure;
- long-content containment, dark/light semantic parity plus computed delta, forced-colors boundaries
  and non-color truth labels, and reduced-motion content completeness.

Capture and review `locator.ariaSnapshot()` evidence for K1–K6. Do not duplicate story markup or
style/query private child internals.

**Commands**:

```bash
npx nx run storybook:storybook:build
npx playwright test apps/storybook/src/tests/sk-mission-kanban-pattern.spec.ts
node scripts/gate-selftest.mjs
node scripts/run-axe-storybook.js
```

**Done when**: the focused suite passes in Chromium, Firefox, and WebKit; every added story is
non-empty and has zero WCAG 2.1 AA axe violations; accessibility-tree evidence is reviewed and
matches the committed/observed/empty semantics.

## T011 — Render, inspect, and baseline every story

**Requirements**: FR-019–FR-020; NFR-003, NFR-005–NFR-007, NFR-010; C-007–C-010  
**Files**: `apps/storybook/src/tests/visual.spec.ts` and new
`apps/storybook/src/tests/visual.spec.ts-snapshots/mission-kanban-*.png` only  
**Depends on**: T010

1. Add one #278 visual case for each of the ten emitted stories. Use 390×844 for K2; real media
   emulation for forced/reduced; stable full-page/crop dimensions that keep each claim visible.
2. Render and directly inspect K1, K2, K3, K4, K5, K6, LightMode, LongContent, ForcedColors, and
   ReducedMotion against the durable HTML/PNG authority under
   `/home/jeroennouws/dev/team-kitty-missions/ux_redesign/mission-kanban`.
3. Separately inspect K2/long content at calibrated 200% zoom for page overflow and clipped focus.
4. Use local screenshots diagnostically. Obtain Ubuntu CI candidates, inspect each, promote only
   ten intended new `mission-kanban-*` baselines, and leave every existing PNG byte unchanged.

**Commands**:

```bash
npx nx run storybook:storybook:build
PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium
git diff --name-status -- apps/storybook/src/tests/visual.spec.ts apps/storybook/src/tests/visual.spec.ts-snapshots
git diff --exit-code origin/train/elements-first -- 'apps/storybook/src/tests/visual.spec.ts-snapshots/*.png' ':!apps/storybook/src/tests/visual.spec.ts-snapshots/mission-kanban-*.png'
```

**Done when**: all ten stories and 200%-zoom state have written inspection dispositions; every new
visual is intentional and readable; K1–K6 match approved hierarchy/truth distinctions; LightMode,
forced colors, reduced motion, narrow/long containment pass; no legacy baseline changes.

## T012 — Refresh, prove no public drift, and run exact-head gates

**Requirements**: all FR-001–FR-020, NFR-001–NFR-010, C-001–C-010, and SC-001–SC-008  
**Files**: all owned surfaces for defect corrections only; generated outputs are tool-owned and
must finish byte-identical to the refreshed base  
**Depends on**: T001–T011

1. Fetch/rebase the latest train, preserve append-only ratchet unions, rebuild the ten exact IDs,
   set the ratchet and shared #277 test's global-total expectation to the refreshed train total
   plus exactly ten while preserving #277's accepted selector/ID assertions, and rerun all
   evidence at the resulting head.
2. Run generators/builds, then prove CEM, React, Vue, CSS modules, markup/barrels, SIZES, token
   catalogue, expected parts/docs, behaviors, and mutations have zero feature delta.
3. Run focused tests first, then the complete lint/style/type/unit/mutation/Storybook/axe/
   Playwright/visual/release/offline/security surface. Do not weaken or skip a gate.
4. Audit the final diff for consumer-owned behavior, public API, raw values, private reach-through,
   generated hand edits, unsupported facts, and every #279–#284 term/path.
5. Return exact commands/results, direct visual/a11y inspection dispositions, accepted residual
   risks, and final head SHA to the orchestrator for independent Codex review.

**Commands**:

```bash
git fetch origin train/elements-first
git rebase origin/train/elements-first

node scripts/build-elements-css.mjs
node scripts/build-element-markup.mjs
node scripts/build-styles-only-markup.mjs
npx nx run elements:analyze
node scripts/build-react-wrappers.mjs
node scripts/build-vue-types.mjs
npx nx run-many --target=build --projects=tokens,styles,elements
node scripts/measure-elements-sizes.mjs

node scripts/build-elements-css.mjs --check
node scripts/build-element-markup.mjs --check
node scripts/build-styles-only-markup.mjs --check
node scripts/build-react-wrappers.mjs --check
node scripts/build-vue-types.mjs --check
node scripts/measure-elements-sizes.mjs --check
git diff --exit-code origin/train/elements-first -- packages/elements/custom-elements.json packages/elements/vue.d.ts packages/react/src packages/elements/SIZES.md packages/tokens/src docs/design-system/token-catalogue.md expected-parts.json expected-docs.json behaviours.json mutations.json

node scripts/check-manifest-content.mjs
node scripts/check-no-css-in-source.mjs
node scripts/check-elements-entries.mjs
node scripts/check-adopted-css-boundaries.mjs
node scripts/check-element-css-hygiene.mjs
node scripts/check-part-ratchet.mjs
node scripts/check-story-theme-wrapper.mjs
node scripts/check-story-theme-wrapper.mjs --selftest
node scripts/check-pattern-composition.mjs --selftest
node scripts/check-pattern-composition.mjs
node scripts/build-react-wrappers.mjs --selftest
node scripts/check-manifest-content.mjs --selftest
node scripts/check-gate-wiring.mjs
node scripts/typecheck-all.mjs
npm run quality:all
npm run test
node scripts/suite-selftest.mjs
node scripts/suite-selftest.mjs --selftest
npx nx run storybook:storybook:build
node scripts/gate-selftest.mjs
node scripts/run-axe-storybook.js
npx playwright test
PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium

npm run security:lockfile-check
node scripts/check-release-graph.mjs --selftest
node scripts/check-release-graph.mjs
node scripts/check-vue-packed-types.mjs
node scripts/check-offline-load.mjs --selftest
node scripts/check-offline-load.mjs
npm run quality:commitlint
git diff --check
git status --short --branch
```

`npm run tokens:catalogue` is conditional only if an authorized token change exists. This WP
authorizes none: stop and return to planning if a new token appears necessary.

**Done when**: all commands pass on the final rebased head; only the seven owned file groups have
intentional deltas; generated/public surfaces and legacy baselines are unchanged; exactly ten
stories are ratcheted/axe-clean/visually approved; one-WP evidence maps every requirement and SC;
and #279–#284 remain untouched.

## Definition of done

- FR-001–FR-020, NFR-001–NFR-010, C-001–C-010, and SC-001–SC-008 have executable or directly
  reviewed evidence against one coherent fixture and one exact branch head.
- Exactly ten user-facing Storybook entries cover K1–K6 plus `LightMode`, LongContent,
  ForcedColors, and ReducedMotion; no helper is discovered and no public `sk-mission-kanban`
  surface exists.
- Exact counts, native routes and semantics, consumer-owned K3 behavior, truth-tier separation,
  empty architecture, three-browser accessibility, narrow/zoom focus containment, axe, and all
  visuals are green.
- Every story and the 200%-zoom state have been rendered and inspected against durable approved UX
  evidence; CI-authoritative baselines contain only intended new images.
- Generated/public product delta is zero, legacy tests/baselines remain intact, full repository
  gates pass after the last train refresh, and the diff is ready for an independent Codex reviewer.

## Activity Log

- 2026-09-09T12:31:33Z – planner-priti – Review cycle 1 Finding 2: amended WP01 ownership to include apps/storybook/src/tests/sk-checkbox-choice-group.spec.ts solely for the integration-sensitive global story-total expectation (refreshed train total + 10), while preserving #277's accepted selector/ID and all other assertions.
