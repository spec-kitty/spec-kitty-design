---
work_package_id: WP01
title: Team activity pattern and proof
dependencies: []
requirement_refs:
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
- C-007
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
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- NFR-006
- NFR-007
planning_base_branch: team-activity-truth-region-pattern-stories
merge_target_branch: team-activity-truth-region-pattern-stories
branch_strategy: Planning artifacts for this mission were generated on team-activity-truth-region-pattern-stories. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into team-activity-truth-region-pattern-stories unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-team-activity-truth-region-pattern-stories-01M286SJ
base_commit: 0a232a01a17627de6f1553ad0948b8b2f6f4f286
created_at: '2026-09-11T12:32:57.873891+00:00'
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
- T008
phase: Phase 1 - complete Team activity pattern and proof
history: []
agent_profile: frontend-freddy
authoritative_surface: packages/elements/src/patterns/team-activity.stories.ts
create_intent:
- packages/elements/src/patterns/team-activity.stories.ts
- apps/storybook/src/tests/sk-team-activity-pattern.spec.ts
- apps/storybook/src/tests/visual.spec.ts-snapshots/team-activity-*.png
execution_mode: code_change
owned_files:
- packages/elements/src/patterns/team-activity.stories.ts
- apps/storybook/src/tests/sk-team-activity-pattern.spec.ts
- expected-stories.json
- apps/storybook/src/tests/visual.spec.ts
- apps/storybook/src/tests/visual.spec.ts-snapshots/team-activity-*.png
priority: P1
role: implementer
tags:
- elements-first
- pattern
- team-activity
- storybook
- accessibility
task_type: implement
tracker_refs:
- '#382'
- '#381'
---

# Work Package Prompt: WP01 — Team activity pattern and proof

## Governed context

Load `frontend-freddy` through the resolver and apply implementation-scoped charter context. Read
the repository `CLAUDE.md`, `AGENTS.md`, charter, ADR-9/10/11, current component-authoring and
visual rules, issues #381/#382, binding Family 1 handoff/evidence, the landed Team Overview,
Mission Reading, Work Explorer, and Mission Kanban pattern precedents, plus this mission's
committed spec and plan. Use the Spec Kitty runtime for WP lifecycle state. Never hand-edit
CLI-owned metadata, status/event logs, frontmatter state, or task checkboxes.

Remain the author/implementer. Do not review or approve your own output. Stay inside the issue-382
checkout and the owned files below. Use `spec-kitty safe-commit` for authored commits. Do not
merge, close issues, publish packages, deploy, or modify `main`/`train/elements-first`.

## Outcome and non-negotiable boundary

Deliver the exact L1–L5, TL1, OA1, and DM1 truth-region family as Storybook-only composition.
Deeply frozen supplied fixtures and pure projections own every string/value. Render through public
element/static/native surfaces and pattern-local token-only CSS. No runtime component, public API,
generic helper, application import, relay client, route/permission/poll/clock/retention/truth logic,
Mission-strip implementation, Topics UI, or hidden state is permitted.

Reported live and observed are distinct named regions. Every L1 row carries supplied
`Presence · unverified`; observed rows never do. L5 is only the route-exact denial and must not
render a shell or protected datum. OA1 degraded retains rows. OA1 loading keeps a heading and puts
polite status elsewhere. DM1 is exactly `Decision` plus supplied wire-safe ID; Dossier Mission
`is_decision` remains a documented Team Kitty prerequisite only.

## Owned files

```text
packages/elements/src/patterns/team-activity.stories.ts
apps/storybook/src/tests/sk-team-activity-pattern.spec.ts
expected-stories.json
apps/storybook/src/tests/visual.spec.ts
apps/storybook/src/tests/visual.spec.ts-snapshots/team-activity-*.png
```

Expected public/generated delta is zero. Do not modify element/style implementations, preview
configuration, tokens/catalogue, package barrels, manifest, React/Vue output, behavior/mutation
registries, sizes, demos, workflow/config, another mission, or sibling issue #383.

## ⚡ Do This First

1. Fetch `origin/train/elements-first`; confirm HEAD and merge base are
   `0a232a01a17627de6f1553ad0948b8b2f6f4f286` unless authorized train movement is recorded.
2. Record the current story total, absence of `patterns-team-activity`, visual inventory tail, and
   hashes/status of public/generated surfaces.
3. Create the focused Playwright spec with a minimal built-story discovery/render-complete
   contract; build and run it in Chromium before authoring the story. Preserve the expected red
   caused by the missing story ID, not an environment failure.

## T001 — Exact-head inventory and red-first contract

**Requirements**: FR-001, FR-015, FR-019; NFR-006–NFR-007; C-005–C-007
**Files**: focused test only; all other surfaces read-only
**Depends on**: none

- Verify current pattern direct imports, token/static style availability, Storybook auto-discovery,
  test server conventions, story ratchet schema, and visual inventory conventions from source.
- Add a minimal focused test for `patterns-team-activity--default`, build Storybook, start the
  standard local server, and record the expected missing-story red.
- Do not change production/public/generated sources in this step.

## T002 — Immutable fixture, guards, and pure projections

**Requirements**: FR-002–FR-013, FR-017; NFR-001; C-001–C-004
**Files**: story module, focused test
**Depends on**: T001

- Define one recursively frozen root fixture containing all L1–L5/TL1/OA1/DM1 content, truth
  labels/tooltips, accessible names, ISO values plus display labels, exact denial, retention copy,
  prerequisite note, and long-content variants. No visible/accessibility product literal may live
  in a renderer or story declaration.
- Validate unique IDs, state-specific inclusion/exclusion, complete supplied L4 gap, no L3 rows,
  L5 denial-only shape, TL1 independent repo states, OA1 retained degradation, presence/observed
  marker exclusion, and wire-safe DM1 shape.
- Export excluded story-local `deepFreezeTeamActivity`, `isTeamActivityDeeplyFrozen`, fixture,
  `projectTeamActivity`, guard proof, and renderer. Freeze all projections and keep them pure.

## T003 — L1–L5 repository truth boundaries

**Requirements**: FR-003–FR-007, FR-012–FR-016; NFR-001–NFR-003; C-001–C-006
**Files**: story module, focused test
**Depends on**: T002

- Render L1 with one named reported-live section and native ordered list of supplied presence,
  focus, and opaque event rows. Use public entity/status/notice surfaces only where their existing
  contract fits; retain native list/time/code semantics.
- Render L2 with exact ordinary quiet copy, L3 with notice and no rows, and L4 with complete gap
  sentence before current rows.
- Render L5 through a dedicated bare-response branch whose full text/attribute surface is
  allowlisted by tests. It must contain no shared wrapper data or shell.
- Scope CSS under `sk-team-activity-pattern*`, use logical properties and existing tokens only,
  never copy another class family or select a child's private internals.

## T004 — TL1 mixed repository regions

**Requirements**: FR-008, FR-012–FR-016; NFR-002–NFR-003; C-001–C-006
**Files**: story module, focused test
**Depends on**: T003

- Render four independently named repository sections: populated, quiet, degraded, and supplied
  gap. Each repository owns its own reported-live boundary; the parent has no aggregate
  freshness/status badge.
- Assert heading/region uniqueness, local gap ordering, zero stale degraded rows, and no observed
  marker/person-to-work join.

## T005 — OA1 observed matrix and DM1

**Requirements**: FR-009–FR-014, FR-016–FR-017; NFR-001–NFR-003; C-001–C-006
**Files**: story module, focused test
**Depends on**: T003

- Render OA1 populated, retained-degraded, quiet, and loading under identical supplied observed
  freshness and retention boundaries. Use compact native `.sk-event-timeline--compact` semantics
  or an equally direct current public/native surface; never add a second timeline API.
- In degraded, place the notice before retained moments and recorded rows. In loading, keep the
  section heading untouched, apply `aria-busy` to its region, put `role=status`/`aria-live=polite`
  on a hidden sibling or wrapper, and hide static skeletons from accessibility.
- Render DM1 under the same observed header with exactly two row fields: supplied Decision label
  and wire-safe ID. Keep the application prerequisite in Storybook documentation/fixture metadata,
  not inside product output.

## T006 — Theme and resilience stories

**Requirements**: FR-013–FR-018; NFR-002–NFR-005; C-005–C-006
**Files**: story module, focused test
**Depends on**: T004–T005

- Export exactly eighteen stories named in the plan. `Default` is L1 dark. `LightMode` wraps the
  exact same fixture/projection in `.sk-light`; assert a computed theme value differs while the
  semantic signature stays equal.
- Narrow uses TL1 at 390px; intermediate uses OA1; long-content uses supplied stress strings; RTL
  sets a logical direction without reordering facts; forced-colors and reduced-motion remain
  deterministic stories exercised by browser emulation.
- Every story enables axe and a play assertion verifies render completion, frozen fixture/
  projection, and complete guard proof.

## T007 — Focused black-box quality proof

**Requirements**: FR-015–FR-018; NFR-001–NFR-005; C-001–C-006
**Files**: focused test, story module only for defect fixes
**Depends on**: T006

- Test the built stories, not duplicate fixture markup. Assert all eighteen IDs and state-specific
  inclusion/exclusion, L5 allowlist, TL1 boundaries, OA1 retention/order/loading roles, DM1 exact
  text, native headings/regions/lists/time/status/code, and absence of passive tab stops.
- Exercise 390px, intermediate and 1440px, short viewport, long copy, calibrated 200% zoom, RTL,
  forced colors and reduced motion; assert zero document overflow and visible logical containment.
- Run axe on required stories, inspect accessibility snapshots/roles, and confirm keyboard Tab has
  no pattern-created destination. Run Chromium first, then all configured browsers.

## T008 — Ratchets, visuals, and final gates

**Requirements**: all requirements
**Files**: all owned files
**Depends on**: T007

- Add exactly eighteen story IDs to `expected-stories.json`. Add focused representative visual
  cases for L1/L3/L4/L5/TL1/OA1 states/DM1/light/narrow/long/RTL/forced/reduced without touching an
  existing baseline.
- Generate snapshots only through Playwright tooling. Inspect every new image directly for
  hierarchy, wrapping, clipping, theme, forced-colors and state distinctions before commit.
- Run, at minimum:

```text
npm run quality:all
node scripts/typecheck-all.mjs
node scripts/check-pattern-composition.mjs --selftest
node scripts/check-pattern-composition.mjs
npm run test
npx nx run storybook:storybook:build
npx playwright test apps/storybook/src/tests/sk-team-activity-pattern.spec.ts --project=chromium
npx playwright test apps/storybook/src/tests/sk-team-activity-pattern.spec.ts
node scripts/gate-selftest.mjs
node scripts/run-axe-storybook.js
PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium
```

- Run relevant generated/artifact-size/release/security checks from current CI. Confirm no public
  or generated element/token/wrapper delta. Run the fast focused subset again immediately before
  push, safe-commit only owned changes, and hand the exact head to a distinct reviewer.

## Author handoff

Return exact commit SHA(s), changed files, focused/full gate counts, inspected visual list, mission
lifecycle result, and any documented CLI anomaly. Do not approve, merge, or close the issue.

## Activity Log

> **CRITICAL**: Activity log entries are chronological (oldest first, newest last).

- 2026-09-11 — Initial implementation, five review cycles, and their CLI lifecycle transitions
  completed on the mission branch.
- 2026-09-11 — A three-lens post-PR adversarial review converged on L5 payload exposure,
  caller-owned projection freezing, permissive DM1 keys, overstated zoom evidence, hosted visual
  drift, and incomplete mission evidence; cycle 6 was reopened through the supported CLI.
- 2026-09-12 — Corrective implementation `aa2bfe15`, cycle-6 criterion evidence, all local gates,
  CI artifact forensics, and the canonical `for_review` handoff completed. No push, approval,
  merge, workflow/config edit, issue comment, or issue closure was performed by this author.
- 2026-09-12 — Rebased onto `train/elements-first@d3263e94` without merge commits. Compact
  implementation `e88db202` and evidence `d2e300d8` preserve WP01 for independent final review;
  target-era visual softness, honestly named zoom evidence, story total 652, the Noble
  cross-browser matrix (62 pass, 4 expected skips), and regenerated/replayed 18/18 Noble visuals
  are green.
- 2026-09-12 — Refreshed the approved mission linearly onto
  `train/elements-first@b38b40e7` after #410 and #429, preserving Account Front Door and Team
  Activity shared inventories, approved status/event blobs, and all 18 reviewed Team Activity
  baselines. The updated 672-story ratchet, 828-story axe run, exact contract probes, and pinned
  Noble cross-browser/visual suites are green.

Status is managed through canonical `status.events.jsonl`. Use `spec-kitty agent tasks move-task
WP01 --to <lane>` for WP transitions and `spec-kitty agent tasks mark-status T001 T002 ...
--status done` for subtask completion; do not edit the event log by hand.
