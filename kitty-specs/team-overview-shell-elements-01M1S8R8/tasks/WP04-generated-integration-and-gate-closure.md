---
work_package_id: WP04
title: Generated integration and exact gate closure
dependencies:
- WP01
- WP02
- WP03
requirement_refs:
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
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- NFR-006
- NFR-007
- NFR-008
planning_base_branch: mission/team-overview-shell-elements
merge_target_branch: mission/team-overview-shell-elements
branch_strategy: Planning artifacts for this mission were generated on mission/team-overview-shell-elements. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/team-overview-shell-elements unless the human explicitly redirects the landing branch.
subtasks:
- T013
- T014
- T015
- T016
- T017
phase: Phase 4 - Integration and evidence
history:
- timestamp: '2026-09-05T00:00:00Z'
  agent: codex
  action: Prompt generated via spec-kitty tasks
authoritative_surface: packages/elements/src/
create_intent:
- apps/storybook/src/tests/sk-team-overview-shell-layout.spec.ts
execution_mode: code_change
owned_files:
- packages/elements/src/index.ts
- packages/elements/src/elements.ts
- packages/styles/package.json
- expected-docs.json
- expected-parts.json
- expected-stories.json
- behaviours.json
- mutations.json
- packages/elements/custom-elements.json
- packages/react/src/**
- packages/react/.wrapper-floor
- packages/elements/vue.d.ts
- packages/elements/SIZES.md
- apps/storybook/src/tests/sk-team-overview-shell-layout.spec.ts
- apps/storybook/src/tests/visual.spec.ts
- docs/design-system/using-components.md
- docs/design-system/changelog.md
tags: []
tracker_refs:
- '#145'
- '#144'
- '#146'
---

# Work Package Prompt: WP04 – Generated integration and exact gate closure

## Objective

Integrate the four approved component WPs through the only owner of collision-prone shared files,
then produce stable generated surfaces and aggregate behavior, browser, axe and visual evidence.
Do not change any WP01–WP03 authored component behavior during this package; reject the
earlier WP if such a fix is needed.

Before editing, load the assigned integration profile and read every mission artifact, ADR-9/10/11,
the component recipe, the approved review records for WP01–WP03 and current train movement. Start
from WP03's canonical dependency base; do not rebase/rewrite any claimed lane during execution.

## Owned paths

- `packages/elements/src/index.ts`, `packages/elements/src/elements.ts`
- `packages/styles/package.json` (not `packages/styles/src/index.ts`)
- `expected-docs.json`, `expected-parts.json`, `expected-stories.json`
- `behaviours.json`, `mutations.json`
- generated `packages/elements/custom-elements.json`
- generated `packages/react/src/**`, `packages/react/.wrapper-floor`
- generated `packages/elements/vue.d.ts`, `packages/elements/SIZES.md`
- `apps/storybook/src/tests/sk-team-overview-shell-layout.spec.ts`
- `apps/storybook/src/tests/visual.spec.ts` (test cases only; wrap-up owns authoritative snapshots)
- `docs/design-system/using-components.md`, `docs/design-system/changelog.md`

These are the mission's only shared-file owners. If #146 has landed, preserve its authored sources
and reconcile shared files by regeneration. Do not edit its source directories or take a stale
aggregate file wholesale.

## Subtasks

### T013 — Integrate entries, exports and exact ratchets

Export/register all four tags from both element entries and add their four CSS package subpaths.
Leave `packages/styles/src/index.ts` unchanged. Update exact public contracts:

- docs total 65 -> 68: new tags 0/1/1/0 attributes and existing `sk-button` 4 -> 5;
- parts total 44 -> 69: 6 + 7 + 4 + 8 new parts;
- exact new/changed story ids from the built Storybook index, with no unexplained shrink.

Register all four new shells for SC-013 and SC-014. Also register `sk-personal-rail`,
`sk-context-sidebar`, and `sk-button` for SC-010 against their focused fixtures. Do not register
slots/pass-through as SC-011 and do not attach a new behavior id to button name/focus tests.

### T014 — Prove mutation sensitivity

Add exactly three SC-013/SC-014 arms per new element: one unique non-root public-part removal, one
stylesheet array-length reversal (`[]`), and one same-length stylesheet-identity reversal
(`[new CSSStyleSheet()]`). Add three uniquely attributable SC-010 arms that change only the reflected
`label` declaration to `reflect: false` for personal rail, context sidebar, and button. Run the named
tests under all 15 new mutations and prove each fails only its declared assertion; then pass the
complete mutation suite, self-test and suite self-test. Keep the existing button SC-013/SC-014 arms
intact.

### T015 — Regenerate every public derivative

Run exactly this order, never hand-editing outputs:

```bash
node scripts/build-elements-css.mjs
node scripts/build-element-markup.mjs
npx nx run elements:analyze --skip-nx-cache
node scripts/build-react-wrappers.mjs
node scripts/build-vue-types.mjs
npx nx run-many --target=build --projects=tokens,styles,elements
node scripts/measure-elements-sizes.mjs
```

WP01 already generated and committed the timestamped token catalogue for the changed token-source
state and ran the exact read-only source/catalogue comparator. Do not rerun the timestamped
generator as a determinism probe. The uncached CEM analysis and build-before-measure ordering are
mandatory. Verify stable-output repeat generation is byte-identical and wrapper floors only advance
for the intended public API.

### T016 — Add consumer docs and browser/visual evidence

Document generic shell composition, labelled navigation regions and named icon button usage without
Team Kitty routes/icons. Add a real Storybook composition browser spec at 390, 414, 1280 and
1440px. Measure column geometry/bounds/order, exact landmarks, one bottom account location, full
long-label accessible text, unchanged sync copy, zero timer calls, native event count, keyboard
reachability and inner-control naming/focus.

Author Chromium screenshot cases for desktop dark/light, 390px narrow and icon focus dark/light.
Execute every new case locally to prove its locator reaches a visible, non-empty target and records a
diagnostic actual. A missing authoritative baseline is the expected local result: never stage a
locally produced PNG and never claim visual approval in WP04. Every added/changed story must be
non-empty and axe WCAG 2.1 AA clean. Post-consolidation mission wrap-up owns retrieving, reviewing,
committing and rerunning CI-authoritative PNGs after the draft PR exists.

### T017 — Run the aggregate-lane gate and prepare handoff

Run every stable command in `plan.md`'s generation/check list on the aggregate dependency lane,
including the exact affected ESLint, Stylelint, HTMLHint, lockfile dry-run, dynamic publishable-graph
build, demo assembly, and `git diff --check` commands from the planning base. Record the local visual
diagnostic separately; it is not a passing gate. Do not claim latest-train, post-consolidation PR,
approved visual, or CI-authoritative exact-head readiness as WP04 evidence. Capture
environment/timing, end with `git status --porcelain` empty and pin WP04 approval to its exact lane
SHA.

After all WPs approve, mission wrap-up—not WP04 approval—must perform SK-179 ordering: fetch and
refresh/rebase the clean planning target onto latest `origin/train/elements-first` while execution
lanes remain frozen; check current #112/train conformance-gate state; then run canonical
`spec-kitty merge`. Reconcile only shared generated/entry/ratchet conflicts, generate the
timestamped catalogue only if token inputs changed, regenerate stable outputs, commit and run every
exact-head gate, including the exact read-only source/catalogue comparator and `git diff --check`.
Do not rebase after consolidation. Push one draft PR with `Refs #145`; obtain its CI-authoritative
actual PNGs, compare them to the approved export, commit only accepted baselines, push, and rerun the
exact `PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts
--project=chromium` command on that exact new head. Then obtain exact-SHA three-lens plus maintainer
approval and record all exact-head results externally on immutable PR comment/check surfaces. Under
the SK-178 waiver, do not invoke an acceptance-verdict writer whose tracked auto-commit would move
the certified head; if no non-mutating acceptance surface is available, stop for maintainer
disposition rather than starting an infinite evidence-invalidating commit loop. Any other push
invalidates evidence; later train movement requires stop/rebaseline, not a blind rebase. Never
merge/push to `main`, close an issue, publish or deploy.

## Definition of done

- Public entries and exports expose exactly the four shell tags and existing-button addition.
- Docs/parts/story ratchets match built reality; behavior registry has only the intended subjects.
- All 15 new mutation arms are killed precisely and every existing arm remains green.
- CEM/React/Vue/CSS/size outputs regenerate byte-identically without cache false evidence; the
  timestamped token catalogue is generated once per changed source state and matches the exact
  read-only source/catalogue comparator outside its validated `generated_at` value.
- Layout, semantics, keyboard and axe assertions pass at every target viewport/theme; every new
  visual case produces a non-empty local diagnostic, while approved baseline passing is explicitly
  deferred to post-consolidation wrap-up.
- The aggregate-lane static/type/build/security/release/offline gate list passes at one clean SHA;
  latest-train consolidation and exact-PR gates are explicitly deferred to mission wrap-up.
- No sibling authored source, app state/icon, `main`, publish or deployment action enters the diff.
