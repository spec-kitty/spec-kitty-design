# Implementation Plan: Team overview feed elements

**Branch**: `mission/team-overview-feed-elements` | **Date**: 2026-09-05 | **Spec**:
[`spec.md`](./spec.md)
**Input**: GitHub issue #146, epic #144, programme parent #125, landed #76 authoring recipe,
issue #92 list-semantics evidence, landed #79 primitives, deferred #112 conformance matrix and the
approved Team overview screenshot.

## Summary

Add four element-only feed primitives to the elements-first design system:
`sk-section-header`, `sk-action-row`, `sk-status-indicator` and `sk-entity-marker`.
Consumers retain native `ul > li`, all content and selected values, while `sk-action-row` emits one
typed activation intent. The implementation uses one token-only CSS source per component, one Lit
template, generated constructed stylesheets, manifest-driven React wrappers/Vue declarations and
the existing ADR-11 conformance/mutation system. There is no `section-list`, static string form,
application state, domain calculation, clock, dependency or token change.

## Technical Context

**Language/Version**: TypeScript and JavaScript ES modules on the repository's Node 22 toolchain
**Primary Dependencies**: Lit; existing `@spec-kitty/tokens`, `@spec-kitty/styles`,
`@spec-kitty/elements` and generated `@spec-kitty/react`; landed `sk-button` and `sk-pill-tag` are
story/consumer dependencies only
**Storage**: N/A—no persisted or collection-owned data
**Testing**: Vitest browser and Node projects, mutation harness, TypeScript type fixtures,
Playwright behavior/visual tests, Storybook 10 and axe
**Target Platform**: Modern browsers supported by the repository's elements-first programme;
generated ESM and IIFE distributions plus React and Vue typing consumers
**Project Type**: Nx design-system monorepo
**Performance Goals**: Storybook CI build strictly below 180 seconds; generated element sizes
measured and committed after a clean build
**Constraints**: 320px narrow fixture without collisions; zero WCAG 2.1 AA violations; token-only
CSS; open shadow roots; no hidden selection or application action
**Scale/Scope**: Four new component directories, one controlled event, one serial execution lane,
one PR into `train/elements-first`

## Charter Check

### Before design

- **Elements-first dependency direction**: pass. Authored CSS remains in styles; elements consume
  generated sheets; React and Vue surfaces remain generated.
- **Token authority**: pass. Existing tokens cover the intended surfaces and states. A measured need
  for a new token becomes a blocking scope decision rather than a raw CSS value.
- **Canonical markup**: pass. These slot-driven primitives do not create static string forms;
  therefore each has one authored Lit template and no `.markup.ts`/static `.html` pair.
- **Accessibility**: pass by design. Consumer native lists remain intact; a native primary trigger
  owns row activation; trailing controls are sibling interactive content; marker mode and visible
  status text are explicit.
- **Behavior evidence**: pass in plan. Applicable event, upgrade, part and sheet behaviors receive
  browser assertions and mutation arms; slot projection gets direct behavior assertions without
  inventing fallback copy.
- **Review policy**: pass in plan. Tier C receives exactly the required pre-merge three-lens squad,
  exact-SHA CI/visual evidence, same-head external acceptance (or explicit SK-178 waiver) and
  maintainer approval.
- **Protected branches/releases**: pass. One PR targets `train/elements-first`; `main`, publish and
  deploy are excluded.
- **Supply chain**: pass. No dependency or lockfile change.

### After design

No charter exception is required. The operator resolved the issue's original `cancelable: true`
request in favor of `cancelable: false`: the row is controlled and owns no preventable default
action. ADR-11 SC-009 is therefore inapplicable and is not weakened to a flag-only assertion.

## Project Structure

### Documentation and mission state

```text
kitty-specs/team-overview-feed-elements-01M1S8T0/
├── spec.md
├── research.md
├── data-model.md
├── plan.md
├── tasks.md
├── lanes.json
├── research/
│   ├── evidence-log.csv
│   └── source-register.csv
└── tasks/
    ├── WP01-presentational-feed-primitives.md
    ├── WP02-controlled-action-row.md
    └── WP03-generated-consumers-and-final-gate.md
```

### Authored component sources

```text
packages/styles/src/
├── section-header/sk-section-header.css
├── action-row/sk-action-row.css
├── status-indicator/sk-status-indicator.css
└── entity-marker/sk-entity-marker.css

packages/elements/src/
├── section-header/
│   ├── sk-section-header.ts
│   └── sk-section-header.stories.ts
├── action-row/
│   ├── sk-action-row.ts
│   └── sk-action-row.stories.ts
├── status-indicator/
│   ├── sk-status-indicator.ts
│   └── sk-status-indicator.stories.ts
└── entity-marker/
    ├── sk-entity-marker.ts
    └── sk-entity-marker.stories.ts
```

There are deliberately no `.markup.ts`, static `.html`, or styles-layer `index.ts` files for these
four element-only components.

### Tests, registries, documentation and shared outputs

```text
fixtures/elements-behaviour/src/
├── sk-section-header.test.ts
├── sk-action-row.test.ts
├── sk-status-indicator.test.ts
└── sk-entity-marker.test.ts
fixtures/react-consumer/src/sk-action-row.test.tsx
packages/react/type-tests/wrappers.type-test.tsx
apps/storybook/src/tests/elements-load.spec.ts
apps/storybook/src/tests/visual.spec.ts
apps/storybook/src/tests/visual.spec.ts-snapshots/*action-row*.png
apps/storybook/src/tests/visual.spec.ts-snapshots/*status-indicator*.png
apps/storybook/src/tests/visual.spec.ts-snapshots/*entity-marker*.png
apps/storybook/src/tests/visual.spec.ts-snapshots/*section-header*.png
behaviours.json
mutations.json
expected-docs.json
expected-parts.json
expected-stories.json
docs/design-system/using-components.md
docs/design-system/using-react.md
docs/design-system/changelog.md
packages/elements/src/index.ts
packages/elements/src/elements.ts
packages/styles/package.json
packages/elements/custom-elements.json                 # generated
packages/elements/src/*/sk-*.css.{js,d.ts}            # generated per component
packages/elements/vue.d.ts                             # generated
packages/elements/SIZES.md                             # generated
packages/react/src/**                                  # generated
packages/react/.wrapper-floor                          # generated floor
```

**Structure Decision**: Keep each component in the existing styles → elements → generated-consumer
pipeline. Tests and docs are component-specific where possible; committed registries, distribution
entries and generated outputs are shared and therefore force all WPs into one serial lane.

## Component Architecture

### `sk-section-header`

- Open shadow root with a non-heading structural header.
- Named slots: `eyebrow`, `title`, `description`, `metadata`, `action`.
- The title slot receives a consumer-authored `h1`–`h6`; the component emits no heading itself.
- Empty optional regions collapse through slot-presence styling/handling without fallback copy.
- Public parts: `header`, `eyebrow`, `title`, `description`, `metadata`, `action`.
- Public attributes/properties/methods/events: none.

### `sk-status-indicator`

- One `tone` attribute/property typed as
  `neutral | info | success | attention | danger | recovery`, default neutral.
- A `marker` slot is decorative support; the default slot is visible consumer-owned meaning.
- Unknown runtime tone input warns/degrades to neutral rather than painting an undocumented tone or
  throwing away slotted text.
- Public parts: `status`, `marker`, `text`.
- The element does not import `sk-pill-tag`, map product words to tones, or generate status copy.

### `sk-entity-marker`

- One `label` string attribute/property. Trimmed non-empty label renders a named image-like mark;
  empty/absent label renders the mark as decorative and hidden from assistive technology.
- Default slot accepts consumer icon, initials or short mark; there is no network/identity helper.
- Public parts: `marker`, `content`.

### `sk-action-row`

- Inputs: `rowId` (`row-id`, string), `selectable` (boolean) and `selected` (boolean, controlled).
- Named slots: `marker`, `title`, `reference`, `tags`, `metadata`, `controls`.
- A stable `[part=row]` root is rendered in both selectable and non-selectable branches. A valid
  selectable row uses one internal native primary trigger for the non-control scan content. The
  controls slot is a sibling; it may contain native links/buttons or the landed `sk-button`.
- An invalid/empty ID fails closed and exposes no interactive affordance or event.
- Native trigger behavior supplies pointer, Enter and Space parity. A keydown handler calls
  `preventDefault()` only for repeated Enter/Space keydowns, suppressing their duplicate native click
  while leaving initial keydowns and unrelated keys native. Real-browser input proves this path.
- `selected` projects only into visual state and `aria-current="true"` on the stable row/root surface,
  for either render branch, and never changes in response to activation. The element never uses
  `aria-selected`, `aria-pressed` or a checkbox/switch role because it owns no container selection or
  toggle semantics.
- Event type is exported as `ActionRowActivateDetail = Readonly<{ id: string }>` and its `@fires`
  annotation drives the generated React callback type.
- The event uses `bubbles: true`, `composed: true` and `cancelable: false`; the row owns no
  preventable default action and does not claim ADR-11 SC-009. One composite browser probe calls
  `preventDefault()` from an external listener and proves the actual dispatch returned `true`, the
  event's `defaultPrevented` stayed `false`, and no selection/navigation/default action occurred.
- Public parts: `row`, `trigger`, `marker`, `title`, `reference`, `tags`, `metadata`, `controls`.

### Consumer composition boundary

```text
Team Kitty container (data, ordering, selected id, routing, time)
  -> Team Kitty view
       -> native ul
            -> native li
                 -> sk-action-row (projection + intent only)
                      -> optional sk-entity-marker / sk-status-indicator / sk-pill-tag
                      -> trailing native control or sk-button
```

`sk-pill-tag` is registered/imported only by stories/consumer fixtures. No new component imports,
nests, mutates or assigns product-specific variants to it in runtime code.

## Generated Artifact Strategy

1. Author CSS and element/story/test sources only.
2. Generate per-component `.css.js` and `.css.d.ts` modules before a component test can compile.
3. Run `elements:analyze --skip-nx-cache` so the manifest records exact slots/parts/attributes and
   the typed action event.
4. Regenerate the entire React wrapper set, Vue declaration and element distribution entries.
5. Build tokens/styles/elements before measuring and committing `SIZES.md`.
6. Leave the timestamp-bearing token catalogue unchanged because this mission changes no token
   source. If the held train SHA changes token inputs or its canonical generator requires refresh,
   run the catalogue exactly once before the shared generation commit, review the semantic diff,
   and exclude it from byte-for-byte rerun checks; its timestamp makes a second run expected drift.
7. WP03 owns final reconciliation of `acceptance-matrix.json`, `issue-matrix.json` and the canonical
   `analysis-report.md`; final head evidence is appended during wrap-up through supported Spec Kitty
   seams without letting those writes masquerade as implementation proof.
8. Never hand-edit generated product output. A generator change is outside scope; if the unchanged
   generators cannot express the contract, stop for a scope decision.

The generated global outputs collide with parallel #145 and other element batches; #145/#146 must
never reconcile them independently on stale train tips. The mission's internal WPs are serial. After
every WP is approved, wrap-up freezes the lane, records one train SHA, rebases the clean target onto
that held SHA, merges the lane through Spec Kitty, and regenerates everything from that exact tree.

## Behavior and Mutation Matrix

Existing ADR-11 behavior IDs are used; mission-local success IDs never enter `behaviours.json`.

| Subject | Registry IDs | Required mutation arms |
|---|---|---|
| `sk-section-header` | SC-013, SC-014 | one non-root declared-part removal; sheet length; sheet identity |
| `sk-status-indicator` | SC-010, SC-013, SC-014 | status-tone property omitted during late upgrade; marker-part removal; sheet length; sheet identity |
| `sk-entity-marker` | SC-010, SC-013, SC-014 | accessible label property omitted during late upgrade; content-part removal; sheet length; sheet identity |
| `sk-action-row` | SC-006, SC-007, SC-008, SC-010, SC-013, SC-014 | duplicate dispatch; wrong detail key/value; bubbling/composed flags; pre-upgrade property loss; controls/reference-part removal; sheet length; sheet identity |
| `react-action-row` | SC-006 | generated wrapper listener removed |

Slot assignment, meaningful/decorative marker mode, tone degradation, native Enter/Space behavior,
invalid-ID fail-closed behavior, controlled selection, nested-control isolation and narrow layout
receive direct assertions. They do not receive mislabeled ADR IDs merely to enter the mutation
harness. Every declared part is targeted through a literal `::part(name)` selector and a computed
style assertion in its own component fixture; error strings/comments do not duplicate the literal.

SC-014 always has two mutations per element: an empty styles array reaches the adopted-sheet count
assertion, while a fresh `CSSStyleSheet` preserves count and reaches the identity assertion. A
single mutation cannot prove both because the first failed assertion aborts the test.

The four element subjects require 18 mutations: SC-013 plus both SC-014 arms for each element (12),
action-row SC-006/SC-007/SC-008/SC-010 (4), status-indicator SC-010 tone preservation (1), and
entity-marker SC-010 label preservation (1). The dedicated React SC-006 subject adds one, for 19
planned mission mutations total. SC-009 is deliberately absent because the event is non-cancelable
and has no preventable default.

SC-010 sets `rowId`, `selectable` and `selected` on an undefined `sk-action-row`, `tone` on an
undefined `sk-status-indicator`, and `label` on an undefined `sk-entity-marker`; each definition is
then imported and each dedicated subject proves its property survived upgrade and rendered its
observable contract. The React wrapper uses ordinary primitive attributes and requires no custom
property delivery seam.

The generated React type fixture has a positive `onSkActionRowActivate` handler that reads
`event.detail.id`, plus `@ts-expect-error` checks for a nonexistent detail field and invalid prop
types. Vue generation supplies the new props/tags only; it does not type custom event handlers, so
the mission makes no typed-Vue-event claim.

## Story and Visual Matrix

| Element | Required stories |
|---|---|
| section header | `Default`, `WithMetadataAndAction`, `LongContent`, `LightMode` |
| status indicator | `Default`, `AllTones`, `LongText`, `LightMode` |
| entity marker | `Initials`, `MeaningfulIcon`, `Decorative`, `LightMode` |
| action row | `Default`, `NativeList`, `Selected`, `NonSelectable`, `WithControls`, `LongContent`, `SelectableStates`, `LightMode` |

`LightMode` wraps in `.sk-light` and a behavior assertion proves the light/dark surfaces differ.
`NativeList` renders consumer-owned `ul > li > sk-action-row` and proves no element owns list roles.
`WithControls` includes a native link, native button and `sk-button`; `LongContent` uses a long
unbroken reference, several `sk-pill-tag` children and supplied age text at 320px. `SelectableStates`
provides real rest/hover/focus-visible/pointer-active/selected states for Playwright captures rather
than simulated CSS classes.

CI-authoritative visual baselines cover at least: approved dark feed row, LightMode row, narrow long
row, selectable rest/hover/focus-visible/pointer-active/selected/non-selectable states, all six
status tones and both entity-marker accessibility modes. Before the PR baseline commit, running the
visual spec against missing/stale expected bytes is a diagnostic and is expected red; it proves the
cases execute but is never green acceptance. Local baseline generation has no authority. Baseline
bytes come from the PR's Linux Chromium artifact, are visually approved, and are committed to the
same PR before the explicit post-baseline Chromium command becomes required green evidence.

## Validation Plan

### Per-WP focused evidence

- Write compile-safe fixture scaffolds, then demonstrate one deliberate source break per registered
  behavior/mutation arm before restoring green.
- Run the new component's Vitest fixture and targeted Nx build/type/lint commands.
- Regenerate any artifact needed for the WP head and confirm only expected files changed.
- Reviewer is independent of implementer; no author self-approval.

### Complete local final gate

Run the following one-time generation block on the post-merge target produced by rebasing the clean
target first and then merging the frozen lane with Spec Kitty:

```bash
node scripts/build-elements-css.mjs
node scripts/build-element-markup.mjs
npx nx run elements:analyze --skip-nx-cache
node scripts/build-react-wrappers.mjs
node scripts/build-vue-types.mjs
PROJECTS="$(node scripts/release-graph.mjs --projects)"
test -n "$PROJECTS"
npx nx run-many --target=build --projects="$PROJECTS"
node scripts/measure-elements-sizes.mjs
```

Review and commit every generated output before continuing. If current train requires the
timestamp-bearing token catalogue, generate it exactly once in this same block and include it in
that commit. Then run the following repeatable exact-head check block; there is no later rebase:

```bash
# Generated drift, manifest, distribution and gate self-tests
node scripts/build-elements-css.mjs --check
node scripts/build-element-markup.mjs --check
node scripts/build-styles-only-markup.mjs --check
node scripts/build-react-wrappers.mjs --check
node scripts/build-react-wrappers.mjs --selftest
node scripts/build-vue-types.mjs --check
npx nx run elements:analyze
git diff --exit-code -- packages/elements/custom-elements.json
node scripts/check-manifest-content.mjs
node scripts/check-manifest-content.mjs --selftest
node scripts/check-elements-entries.mjs --selftest
node scripts/check-elements-entries.mjs

# Content, style, type and workflow hygiene
npm run quality:all
node scripts/typecheck-all.mjs
node scripts/check-no-css-in-source.mjs
node scripts/check-adopted-css-boundaries.mjs --selftest
node scripts/check-adopted-css-boundaries.mjs
node scripts/check-element-css-hygiene.mjs
node scripts/check-part-ratchet.mjs
node scripts/check-story-theme-wrapper.mjs --selftest
node scripts/check-story-theme-wrapper.mjs
node scripts/check-vue-template-types.mjs
node scripts/check-gate-wiring.mjs

# Storybook, demo assembly, accessibility and browsers
npx nx run storybook:storybook:build
node scripts/measure-elements-sizes.mjs --check
PROJECTS="$(node scripts/release-graph.mjs --projects)"
test -n "$PROJECTS"
npx nx run-many --target=build --projects="$PROJECTS"
bash scripts/assemble-demo-dist.sh apps/storybook/storybook-static
node scripts/gate-selftest.mjs
node scripts/run-axe-storybook.js
npx playwright test

# Behavior timing, mutations and the mutation harness's own guards
node scripts/measure-suite-time.mjs
node scripts/suite-selftest.mjs
node scripts/suite-selftest.mjs --selftest

# Release/packed-consumer/offline gates
node scripts/check-release-graph.mjs --selftest
PROJECTS="$(node scripts/release-graph.mjs --projects)"
test -n "$PROJECTS"
npx nx run-many --target=build --projects="$PROJECTS"
node scripts/check-release-graph.mjs
node scripts/check-vue-packed-types.mjs
node scripts/measure-elements-sizes.mjs --check
node scripts/check-offline-load.mjs --selftest
node scripts/check-offline-load.mjs

# Repository/security/history gates
bash scripts/npm-audit-gate.sh
npm ci --dry-run --ignore-scripts
bash scripts/check-action-pins.sh
for commit in $(git rev-list --reverse origin/train/elements-first..HEAD); do
  npx commitlint --from="${commit}^" --to="$commit"
done
npx commitlint --from=origin/train/elements-first --to=HEAD
git diff --check origin/train/elements-first...HEAD
test -z "$(git status --porcelain --untracked-files=no)"
```

Before approved baselines exist, execute the visual cases only as an expected-red diagnostic and
retain no locally generated PNG as authority. After the Linux Chromium artifacts are approved and
committed to the PR, this exact current `[ENFORCED]` command is mandatory and must be green:

```bash
PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium
```

The Playwright run includes the current train's cross-surface conformance test at
`apps/storybook/src/tests/elements-load.spec.ts`. At wrap-up, inspect rebased current train and issue
#112 again: if its canonical conformance matrix has landed, run its repository-defined generator and
check commands too; while #112 remains open, do not invent an absent matrix or Svelte dependency.

`npx nx run tokens:catalogue` is intentionally not in the repeatable check block because its output
contains the current timestamp. This mission does not change token sources. If the held train SHA
makes catalogue regeneration necessary, run it once before the generation commit and validate the
semantic token diff without demanding a second byte-identical run.

After generation and the final evidence commit, tracked status must be empty; `.worktrees/` is the
only permitted runtime-only untracked path. No check may be skipped. CI must reproduce the
suite/mutation/axe/visual results, Storybook duration below 180 seconds and all workflow jobs green
on the exact PR head.

## Delivery and Git Sequence

1. Before WP01 allocation, keep a small conventional planning history and run task finalization
   last so `lanes.json.planning_commit_sha` names the actual current planning parent.
2. Allocate WP01, WP02 and WP03 to one lane and run implement → independent review serially.
3. Do not fetch/rebase the active lane after execution begins; Spec Kitty 3.2.6rc4 freezes recorded
   planning provenance.
4. After every WP is approved, freeze the lane. Fetch `origin/train/elements-first`, record its exact
   SHA as the SK-179 hold, and rebase the clean planning target
   `mission/team-overview-feed-elements` onto that held SHA.
5. Use Spec Kitty to merge the frozen lane into that rebased target. Regenerate shared outputs once,
   commit them, and run the complete exact-head gate above. Do not rebase after this consolidation.
   Re-fetch before every external gate; if the train no longer equals the recorded SHA, mark the
   mission BLOCKED. There is no truthful post-consolidation local rebaseline path under SK-179.
6. Open/update exactly one draft PR from `mission/team-overview-feed-elements` into
   `train/elements-first`, with `Refs #146` and no closing keyword.
7. Run the visual spec as expected-red diagnostic before baselines. Obtain CI-authoritative Linux
   Chromium baselines, visually approve and commit them to the same PR, then rerun all CI including
   the explicit `PW_INCLUDE_VISUAL=1 ... --project=chromium` command.
8. Dispatch the Tier-C pre-merge squad: three distinct profile-loaded Codex lenses, structured
   findings and verdicts pinned to the exact current head. Fold every blocker/major finding; any
   push invalidates all affected lens evidence and requires rerun.
9. Invoke the external acceptance writer only after every code/evidence artifact is frozen. It must
   attest the current SHA without committing or pushing. If SK-178 still makes acceptance recording
   mutate the branch, stop and require an explicit operator/maintainer waiver recorded against this
   exact SHA; do not run the writer and then pretend its new SHA was reviewed.
10. Require one maintainer approval on the same exact current head. Any push invalidates the squad,
    acceptance and approval; a train advance blocks the mission under step 5.
11. Merge only into `train/elements-first` after explicit operator authorization. Verify the train
    contains the exact accepted head, then have orchestrator wrap-up close #146 immediately. WP
    workers never close issues; keep #144, #125, #112 and unfinished siblings open. Never touch
    `main`, publish or deploy.

## Implementation Concern Map

### IC-01 — Native semantic composition

- **Purpose**: Preserve consumer `ul/li` and document heading ownership across shadow boundaries.
- **Relevant requirements**: FR-001–FR-006, FR-016, C-002–C-007.
- **Affected surfaces**: section-header/action-row element and story sources; axe/Playwright fixtures.
- **Sequencing/depends-on**: none.
- **Risks**: Accidental list roles, generated heading levels or interactive descendants inside the
  row trigger.

### IC-02 — Presentational tone and marker accessibility

- **Purpose**: Deliver domain-neutral status and compact marks with visible/non-color meaning.
- **Relevant requirements**: FR-012–FR-015, NFR-001–NFR-003.
- **Affected surfaces**: status-indicator/entity-marker CSS, elements, stories and browser tests.
- **Sequencing/depends-on**: IC-01 only for shared composition examples.
- **Risks**: Unnamed meaningful marks, low-contrast light tones or domain label inference.

### IC-03 — Controlled action intent

- **Purpose**: Deliver pointer/keyboard activation and nested-control isolation without application
  state or navigation ownership.
- **Relevant requirements**: FR-007–FR-011, NFR-004–NFR-005, C-004.
- **Affected surfaces**: action-row element/CSS/story/test and behavior/mutation registries.
- **Sequencing/depends-on**: IC-01.
- **Risks**: Browser-native repeat clicks without the repeat-only guard, false affordance on invalid
  IDs, accidental cancelability/SC-009 drift, invalid selected ARIA, controlled state mutation and
  nested interactive semantics.

### IC-04 — Generated multi-consumer surface

- **Purpose**: Keep manifest, React, Vue, distribution entries and size evidence deterministic.
- **Relevant requirements**: FR-019, NFR-007–NFR-008, C-006, C-009.
- **Affected surfaces**: generated outputs, React runtime/type fixture, package exports and ratchets.
- **Sequencing/depends-on**: IC-01–IC-03.
- **Risks**: Hand-edited generated files, wrapper detail erasure and collisions with parallel missions.

### IC-05 — Exact-head production gate

- **Purpose**: Reconcile one recorded train head and prove the final PR head before train merge.
- **Relevant requirements**: FR-020, NFR-001–NFR-010, C-010–C-013.
- **Affected surfaces**: mission topology, all local gates, CI visual artifacts and review evidence.
- **Sequencing/depends-on**: IC-04.
- **Risks**: Mid-lane or post-consolidation rebase corrupting recorded ancestry/evidence, #145/#146
  shared-output collision, timestamped catalogue churn, an SK-178 acceptance write changing the
  reviewed head, or review/approval evidence attached to an earlier SHA.

## Complexity Tracking

No charter violation or additional abstraction is accepted. Four element directories are the issue's
exact scope; three serial WPs are the smallest reviewable delivery shape because the three
presentational elements share one pattern, the action row owns materially different behavior, and
generated consumer/final-gate evidence is a separate closure concern.
