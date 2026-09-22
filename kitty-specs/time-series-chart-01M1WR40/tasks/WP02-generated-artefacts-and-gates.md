---
work_package_id: WP02
title: Generated artefacts and closing gates
dependencies:
- WP01
requirement_refs:
- FR-014
- NFR-001
- NFR-004
- C-003
planning_base_branch: mission/time-series-chart
merge_target_branch: mission/time-series-chart
branch_strategy: Planning artifacts for this mission were generated on mission/time-series-chart. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/time-series-chart unless the human explicitly redirects the landing branch.
subtasks:
- T012
- T013
- T014
- T015
- T016
phase: Phase 2 - Generated artefacts and gates
history:
- timestamp: '2026-09-07T01:40:00Z'
  agent: claude
  action: Prompt authored from the approved specification and plan
authoritative_surface: packages/elements/custom-elements.json
create_intent:
- packages/elements/src/time-series-chart/sk-time-series-chart.css.js
- packages/elements/src/time-series-chart/sk-time-series-chart.css.d.ts
- packages/react/src/SkTimeSeriesChart.js
- packages/react/src/SkTimeSeriesChart.d.ts
execution_mode: code_change
owned_files:
- packages/elements/custom-elements.json
- packages/elements/vue.d.ts
- packages/elements/SIZES.md
- packages/elements/src/time-series-chart/sk-time-series-chart.css.js
- packages/elements/src/time-series-chart/sk-time-series-chart.css.d.ts
- packages/react/src/SkTimeSeriesChart.js
- packages/react/src/SkTimeSeriesChart.d.ts
- packages/react/src/index.js
- packages/react/src/index.d.ts
- expected-docs.json
- suite-budget.json
- docs/design-system/using-components.md
tags: []
tracker_refs: []
---

# Work Package Prompt: WP02 – Generated artefacts and closing gates

## T012 — Regenerate, cache-free

```bash
node scripts/build-elements-css.mjs
npx nx run elements:analyze --skip-nx-cache
node scripts/build-react-wrappers.mjs
node scripts/build-vue-types.mjs
```

`build-element-markup.mjs` has nothing to do here — this element ships no markup module, like
`sk-bar-chart`, `sk-notice` and `sk-transition-matrix`. The nx cache can serve `analyze` from a stale
artifact and make a later `--check` compare a stale artifact against itself; `--skip-nx-cache` is not
optional.

## T013 — Build, then measure; reconcile the exact ratchet

```bash
npx nx run-many --target=build --projects=tokens,styles,elements --skip-nx-cache
node scripts/measure-elements-sizes.mjs
```

`measure-elements-sizes.mjs` **reads** `packages/elements/dist/` and does not build it. Running it
before a real build records whatever bytes are on disk, and the symptom is CI reporting different
numbers for the same commit.

Then reconcile `expected-docs.json` — it is an **exact** ratchet in both directions, so the attribute
and method counts must match the manifest and `total` must be bumped.

## T014 — Gates

```bash
node scripts/build-elements-css.mjs --check
node scripts/build-element-markup.mjs --check
node scripts/build-react-wrappers.mjs --check
node scripts/build-vue-types.mjs --check
git diff --exit-code -- packages/elements/custom-elements.json
node scripts/measure-elements-sizes.mjs --check
node scripts/check-manifest-content.mjs
node scripts/check-no-css-in-source.mjs
node scripts/check-elements-entries.mjs
node scripts/check-adopted-css-boundaries.mjs
node scripts/check-element-css-hygiene.mjs
node scripts/check-part-ratchet.mjs
node scripts/check-story-theme-wrapper.mjs
node scripts/check-story-theme-wrapper.mjs --selftest
node scripts/typecheck-all.mjs
npm run quality:all
node scripts/check-gate-wiring.mjs
npm run test
git add -A && git status --porcelain   # must be empty
```

Do **not** report local visual-regression failures as findings: they are environmental in this
checkout and all baselines including untouched components go red. CI is authoritative for those and
for the mutation harness.

## T015 — Documentation

Record the element in `docs/design-system/using-components.md` and the `--sk-chart-*` prefix in
`docs/contributing/adding-a-token.md`.

## T016 — Rebase, lint the commits, open the PR

Re-fetch the train — another session merges to it constantly — and rebase rather than hand-merging any
generated artefact; regenerate instead.

```bash
npx commitlint --from origin/train/elements-first --to HEAD
gh pr create --base train/elements-first ...
```

Any other base runs **zero** gates and still looks green. Commit scopes come from the enum
`[tokens storybook doctrine ci docs release deps security styles elements react acceptance merge team-overview]`;
`docs(adr)` and `docs(specs)` are not in it — use unscoped `docs:`. Headers stay at or under 100
characters, and no line in a commit body may start with a bare `word:`, which parses as a footer token.

Report the mutation-harness figure from CI against the **unchanged** 1405.5s ceiling. If it breaches,
report the measured figure and stop — do not raise the ceiling; it is #225's, held by an operator
ruling. Record the measured row in `suite-budget.json`'s `selftestMeasurements`, ceiling untouched.
