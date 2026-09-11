# Implementation Plan: Mission Kanban ten-lane pattern extension

**Mission**: `mission-kanban-ten-lane-pattern-extension-01M288RG` · **Issue**: #395 · **Epic**: #276  
**Planning branch**: `mission/mission-kanban-ten-lane-pattern-extension` (single_branch)  
**Date**: 2026-09-11 · **Spec**: [spec.md](./spec.md)  
**Planning base**: `origin/train/elements-first@0a232a01a17627de6f1553ad0948b8b2f6f4f286`

## Summary

Add one Storybook-only sibling pattern module,
`packages/elements/src/patterns/mission-kanban-ten-lane.stories.ts`, titled
`Patterns/Mission Kanban Ten-Lane`. It imports #278's exported, deeply frozen
`MISSION_KANBAN_FIXTURE` (and its `deepFreezeMissionKanban` / `isMissionKanbanDeeplyFrozen`
helpers) as the single source of committed truth, adds a small deeply frozen extension fixture for
ten-lane copy and the unverified overlay claim, derives a pure ten-lane projection, and renders
eleven stories through already published surfaces.

A focused built-Storybook Playwright suite proves the product states, the #209 conditional overflow
contract (fit, overflow, resize, content change, threshold, teardown/remount), keyboard and
accessibility-tree structure, and every required geometry. Twelve Chromium visual cases extend
`visual.spec.ts`; eleven ids join `expected-stories.json` under a new key. #278's module, focused
suite, visual cases, baselines, and ratchet entry are not touched.

## Technical Context

**Language/Version**: TypeScript 5.x, Lit 3.3 templates, native HTML/CSS  
**Primary Dependencies**: Storybook 10.6 (web-components/Vite), existing `@spec-kitty/elements`
modules and `@spec-kitty/styles` families already imported by the Storybook preview, Playwright
1.62, axe-playwright, Nx 22  
**Storage**: N/A — two deterministic, deeply frozen in-memory Storybook fixtures  
**Testing**: story `play` invariants, focused Chromium/Firefox/WebKit Playwright suite, accessibility-
tree snapshots, axe over the ratcheted story set, Chromium visual regression, repository gates  
**Target Platform**: built static Storybook; evergreen Chromium, Firefox, WebKit  
**Project Type**: token-first Nx design-system monorepo; Storybook-only pattern composition  
**Performance Goals**: no timer, polling, fetch, store, or runtime data processing; one
`ResizeObserver` and two `MutationObserver`s per mounted board, all released on teardown  
**Constraints**: public surfaces and `--sk-*` tokens only; logical properties only; no #278 file
edits; no generated-artifact change; no exported overflow helper  
**Scale/Scope**: one story module, eleven stories (six product states, five evidence variants), ten
lanes, fifteen Work Packages, one focused suite, twelve visual cases

## Planning decisions

### PD-001 — A sibling module, not an edit of #278

The issue requires #278's stories and baselines to stay unchanged, and allows a sibling "per existing
convention". Adding stories to `mission-kanban.stories.ts` would change #278's built story inventory
(its focused suite asserts exactly ten `patterns-mission-kanban--*` ids) and put new code beside
already-accepted render helpers that embed literals. A sibling module with its own title keeps every
#278 byte, story id, and test untouched while extending the pattern family in the same sidebar group.

The title is `Patterns/Mission Kanban Ten-Lane`, producing ids `patterns-mission-kanban-ten-lane--*`.
It is a separate component node rather than a child of `Patterns/Mission Kanban`, because a
Storybook node cannot be both a component and a group. `packages/elements/tsconfig.lib.json`
excludes `*.stories.ts`, so nothing reaches the published build.

### PD-002 — Import the #278 fixture; restate nothing

The module imports `MISSION_KANBAN_FIXTURE`, `deepFreezeMissionKanban`, and
`isMissionKanbanDeeplyFrozen` from `./mission-kanban.stories.js`. These exports already exist and
are already excluded from #278's CSF index. Importing them does not change #278's module.

The extension fixture `MISSION_KANBAN_TEN_LANE_FIXTURE` holds only:

- `copy` — plain composition strings (navigation labels, page title, filter summary and legend,
  Apply/Clear, board heading, board-region name, per-lane empty sentence, reported-live heading
  and tier, overlay marker, `live overlays shown`);
- `format` — consumer-owned formatter functions for parameterised strings (eyebrow, subtitle,
  compact brand, pluralised lane-count label, `Detailed lane · <lane>`, `→ <lane>, not yet pushed`);
- `routes` — the page-local hrefs the shell uses that the base fixture does not carry;
- `tones` — the consumer's presentation tones for the commit-trust and reported-live indicators;
- `unverifiedOverlays` — `[{ workPackageId: 'WP03', classification: 'unverified', tierLabel:
  'Presence · unverified', tierTone: 'neutral', actorLabel: 'lynn', targetLaneId: 'for_review' }]`;
- `stress.laneLabels` — long localized labels for all ten lanes.

Copy follows the Family 2 `COPY-CATALOG.md` K rows where they exist (`Work package kanban board`,
`Kanban lanes. Scroll horizontally to see all lanes.`, `No work packages in this lane.`,
`Filter lanes`, `Detailed lane · {lane}`, `Presence · unverified`, `→ {lane}, not yet pushed`,
`live overlays shown`) and reuses the base fixture or #278's wording elsewhere (`Work packages`,
`Committed detailed lanes`, `Live now`, `Reported live · ≤90s`, the base `emptyActivity`). Lane-count
accessible names are pluralised by the fixture's formatter, which fixes the catalogue's
`(1 cards)` defect rather than copying it. All of these are candidate strings supplied by a
fixture; none becomes a library default.

### PD-003 — A pure, vocabulary-free projection

`deriveMissionKanbanTenLanes(base, extension, options)` validates both sources, then returns a
deeply frozen record:

- `lanes` — base lanes filtered to `selectedLaneIds` when supplied, **always in the base's supplied
  order**, each with `count` and its committed Work Package cards;
- `choices` — all ten lanes with label, derived count over the included set, and checked state;
- `renderedWorkPackageIds`, `selectedLaneIds`, `total`, `commit`;
- `snapshot` (the base record) when `includeSnapshot`;
- `unverifiedOverlays` attached to their cards when `includeUnverifiedOverlays`;
- `reportedActivity` (the base records) when `includeReportedActivity`.

It never reads the base `observedActivity` field. It holds no lane list, lane order, or count of its
own: the guard checks structural integrity (uniqueness, known references, non-blank routes and
labels, one overlay per Work Package, overlay classification and tone, stress labels covering
exactly the supplied lanes, selection and inclusion referencing known ids) and throws on any
violation. The expected counts `0/2/1/3/2/1/1/4/1/0` live only in tests, as the oracle.

A `missionKanbanTenLaneGuardProof()` returns a frozen map of named fail-closed checks, each
constructed from a mutated clone of the fixtures, so the story root can publish it and the play
function and suite can assert every guard actually throws.

### PD-004 — Eleven stories, one render function

| Export | Story id suffix | Projection options | Presentation |
|---|---|---|---|
| `Default` (K1) | `default` | reported | — |
| `K2NarrowContained` | `k-2-narrow-contained` | reported | viewport `mobile1` |
| `K3FilteredLanes` | `k-3-filtered-lanes` | reported, selection = base `k3SelectedLaneIds` | filters open |
| `K4SnapshotBehindLog` | `k-4-snapshot-behind-log` | reported, snapshot | — |
| `K5UnverifiedOverlay` | `k-5-unverified-overlay` | reported, overlays | — |
| `K6EmptyLanes` | `k-6-empty-lanes` | included = `[]` | — |
| `LightMode` | `light-mode` | reported | `.sk-light` |
| `LongContent` | `long-content` | reported | long labels, filters open |
| `ForcedColors` | `forced-colors` | reported, snapshot, overlays | — |
| `ReducedMotion` | `reduced-motion` | reported, overlays | — |
| `RTL` | `rtl` | reported | `dir="rtl"` |

Every story uses `sk-app-shell presentation="compact"`, so the same composition is the full shell
above 860 px and the compact shell at or below it (the element's own threshold). The page gutter
switches from `--sk-space-6` to `--sk-space-4` through Mission Reading's precedent: the shell marks
the compact header `inert` while it is not presented, so
`.…__compact-header:not([inert]) ~ .…__page` selects the compact gutter with no media query.

### PD-005 — Public composition and native structure

```text
div.sk-mission-kanban-ten-lane-pattern [dir, .sk-light]
└── sk-app-shell[presentation=compact]
    ├── sk-personal-rail                  rail links
    ├── sk-context-sidebar                eyebrow, mission label, nav.sk-context-nav (available / unavailable)
    ├── div[slot=compact-header]          brand + current-page link
    ├── sk-page-header                    eyebrow, h1, supporting, sk-status-indicator (commit trust)
    └── div.…__page
        ├── nav.sk-breadcrumbs > ol > li > a
        ├── truth band                    tier label + sk-pill-tag sha + branch
        ├── overlay-presence line         sk-pill-tag "live overlays shown" (only with overlays)
        ├── sk-notice[tone=attention]     K4 / ForcedColors only; h2 heading slot
        ├── details.sk-disclosure         open in K3 / LongContent
        │   └── fieldset.sk-checkbox-choice-group > legend + label > input[type=checkbox] × 10
        │       + sk-button Apply, sk-button Clear (Clear only with a selection)
        ├── section.sk-workflow-board[aria-labelledby=h2]
        │   ├── h2 board heading
        │   └── div.sk-workflow-board__scroller   conditional triad
        │       └── section.sk-workflow-lane[aria-labelledby=h3] × rendered lanes
        │           ├── header > h3 + span.sk-workflow-lane__count[aria-label]
        │           ├── ol > li > sk-action-row[layout=card][href]
        │           │     title, reference "Detailed lane · x", metadata, supporting overlay, controls
        │           └── div.sk-empty-state--inline   sibling of the empty list
        └── section.…__reported[aria-labelledby=h2]  reported-live panel
```

The sidebar carries no heading, so the page's heading outline is one `h1`, then `h2` (notice, board,
reported-live), then `h3` lanes. The overlay is `sk-status-indicator` (tier) + actor + destination
inside the card's `supporting` slot, bounded by a dashed token border so the unverified tier has a
non-colour cue. Tracker references are `controls`-slot anchors. No `selectable`, activation event,
role override, or event handler is used.

Pattern CSS targets only `sk-mission-kanban-ten-lane-pattern*` classes, the `shell` and `tag` parts
already recorded in `expected-parts.json`, and uses `--sk-*` tokens and logical properties. CSS system
colours appear only inside the `forced-colors: active` block. `scripts/check-pattern-composition.mjs`
and its self-test must stay green. No Storybook preview change is needed: every styles family used is
already imported there.

### PD-006 — #209's overflow contract, locally

A module-local `createBoardRegionRef(name)` returns a Lit callback ref for the scroller. On attach it:

1. measures `scrollWidth > clientWidth` and sets or removes `role="region"`, `aria-label=<name>`,
   and `tabindex="0"` together;
2. observes the scroller and each lane with one `ResizeObserver` (viewport and lane-box changes);
3. observes the scroller subtree with a `MutationObserver` (`childList`, `characterData`; never
   `attributes`, which would observe its own writes) to re-measure after content change and to
   start or stop observing added or removed lanes;
4. watches `document.body` with a second `MutationObserver` and disconnects everything once the
   scroller leaves the document — the same remount-safe teardown #278 proved, because Storybook
   force-remounts without disconnecting Lit parts.

The ref is recreated per render, and Lit calls the previous closure with `undefined`, which also
disconnects. Nothing is exported or shared; no `setTimeout`, `requestAnimationFrame`, or polling is
used. Content change is part of the contract because adding a lane to a fixed-width grid scroller
changes `scrollWidth` without resizing the scroller's box, which a scroller-only `ResizeObserver`
cannot see.

### PD-007 — K3 stays a controlled composition

The disclosure is open with `<summary>Filter lanes</summary>`; the fieldset legend is
`Committed detailed lanes`, so the two visible labels differ. Checkbox `name="lanes"` mirrors the
shipped `?lanes=` shape, but there is no `<form>`, no handler, and no re-render: a toggled checkbox
changes only its own state. Apply and Clear are public `sk-button`s; Clear renders only when a
selection is supplied. At 1440 px the two result lanes fit and the scroller carries no triad; at
390 px they overflow and it does.

### PD-008 — Truth tiers stay separate

K4 adds `sk-notice` with the base `snapshot` heading and message; the commit band is the base
`commit`, unchanged. K5 attaches the extension overlay to WP03 only; WP03's lane, count, and position
are identical to K1. The overlay classification is `unverified`; the base `observedActivity`
(`Observed · up to 60 s behind`) is never read. The reported-live panel is a separate named section
with its own tier indicator. The ForcedColors composition carries snapshot, overlay, and
reported-live together to prove they stay distinct.

### PD-009 — Story ratchet and generated-surface proof

Add `mission-kanban-ten-lane-pattern` to `expected-stories.json` `byElement` with the eleven emitted
ids, read from the built `index.json`, plus a `$comment` entry, and move `total` 598 → 609
(recomputed after the final rebase). `behaviours.json`, `mutations.json`, `expected-parts.json`,
`expected-docs.json`, tokens, and every generated artifact stay byte-identical.

### PD-010 — Visual authority

Append a `missionKanbanTenLaneVisuals` block to `visual.spec.ts`: eleven story captures plus K3 under
forced-colors emulation, at 1440×1024 (K1, K3, K4, K5, K6, LightMode, ForcedColors, ReducedMotion,
RTL) and 390×844 (K2, LongContent). Baselines are harvested from the CI run's
`visual-regression-diffs` artifact (the repository's rule — local fonts differ), inspected, and
committed. The ten #278 baselines must stay byte-identical.

### PD-011 — 200% zoom evidence

Browser zoom at 200% halves the CSS viewport and doubles the device pixel ratio. The suite
reproduces that layout exactly with a 720×512 CSS-px viewport at `deviceScaleFactor: 2` for the
1440×1024 case, and adds #278's CSS `zoom: 2` stress on K2 and LongContent at 780 px. This is
layout-equivalent emulation, not a headed browser-UI capture; the difference is recorded in the PR.

## Architecture and data flow

```mermaid
flowchart LR
  Base["#278 MISSION_KANBAN_FIXTURE (frozen)"] --> Guard[structural guards]
  Ext[ten-lane extension fixture (frozen)] --> Guard
  Guard --> Project[deriveMissionKanbanTenLanes]
  Project --> K1[K1 / K2 / Light / Long / RTL]
  Project --> K3[K3 selected lanes]
  Project --> K4[K4 + snapshot]
  Project --> K5[K5 + overlay]
  Project --> K6[K6 empty]
  K1 & K3 & K4 & K5 & K6 --> Render[renderMissionKanbanTenLanes]
  Render --> Public[public elements + styles families]
  Render --> Region[local board-region ref]
  Public --> Evidence[play + Playwright + axe + visual]
  Evidence -. never writes back .-> Base
```

## Project Structure

### Mission documentation

```text
kitty-specs/mission-kanban-ten-lane-pattern-extension-01M288RG/
├── meta.json · spec.md · plan.md · tasks.md
├── status.events.jsonl · status.json · lanes.json      # CLI-owned
├── issue-matrix.json · acceptance-matrix.json          # CLI-owned
└── tasks/WP01-ten-lane-pattern-and-proof.md
```

### Authored source and evidence

```text
packages/elements/src/patterns/mission-kanban-ten-lane.stories.ts     # new
apps/storybook/src/tests/sk-mission-kanban-ten-lane-pattern.spec.ts   # new
apps/storybook/src/tests/visual.spec.ts                               # append one block
apps/storybook/src/tests/visual.spec.ts-snapshots/mission-kanban-ten-lane-*.png   # 12 new
expected-stories.json                                                 # new key, +11 total
```

### Explicitly unchanged

```text
packages/elements/src/patterns/mission-kanban.stories.ts
apps/storybook/src/tests/sk-mission-kanban-pattern.spec.ts
apps/storybook/src/tests/visual.spec.ts-snapshots/mission-kanban-{k1,k2,k3,k4,k5,k6,light,long,forced,reduced}*.png
apps/storybook/.storybook/preview.ts
packages/elements/src/index.ts · custom-elements.json · vue.d.ts · SIZES.md · **/*.css.{js,d.ts}
packages/react/src/** · packages/styles/src/** · packages/tokens/**
expected-parts.json · expected-docs.json · behaviours.json · mutations.json
```

## Implementation Concern Map

### IC-01 — Single-source fixture and pure projection
- **Requirements**: FR-002, FR-003, FR-013, FR-015; NFR-008; C-005.
- **Surface**: story module.
- **Risks**: restated counts, shallow freeze, reading `observedActivity`, vocabulary in the guard.

### IC-02 — Public semantic composition
- **Requirements**: FR-001, FR-004–FR-010, FR-012, FR-014; C-001–C-004, C-007.
- **Surface**: story module.
- **Risks**: copied component selectors, physical properties, heading-order breaks, literal copy.

### IC-03 — Conditional overflow lifecycle
- **Requirements**: FR-011; NFR-002, NFR-003; C-006.
- **Surface**: story module, focused suite.
- **Risks**: dead tab stop, missed content change, observer leak across remounts, self-observation loop.

### IC-04 — Evidence
- **Requirements**: NFR-001–NFR-010; SC-001–SC-007.
- **Surface**: focused suite, `visual.spec.ts`, snapshots, `expected-stories.json`.
- **Risks**: sibling Storybook on port 6006, stale `storybook-static`, host-font baselines, train
  movement changing the ratchet total.

## Focused acceptance strategy

`apps/storybook/src/tests/sk-mission-kanban-ten-lane-pattern.spec.ts`, against the built Storybook:

- catalogue: exactly eleven ten-lane ids **and** exactly the ten #278 ids;
- fixture: guard proof, deep freeze, direct mutation attempts through the story seam, repeated
  projection equality, counts that move when a cloned base moves a Work Package (derived, not
  restated), extension fixture holding no lane/Work Package/route data;
- source: no element definition, app import, private-root reach, handler, timer, fetch, storage,
  history, domain-invention vocabulary, motion, physical property, raw colour, or user-visible literal
  in render code;
- K1–K6 structure, counts, cards, routes (keyboard Enter, modified click, independent tracker tab
  stop), filters, notice parity, overlay placement and separation, empty lanes;
- overflow: K1/K2/K6 overflowing triad; K3@1440 and K6@2800 fitting with no triad and no tab stop;
  live resize both directions on one mounted root; content change on one mounted root; ±1 px
  board-fit threshold; remount observer balance through Storybook's Reload;
- geometry: 1440, 390, 860/861, 1440×600, 390×480, 200% (DPR-2 half viewport and CSS zoom), long,
  RTL — document never overflows; focus revealed by keyboard only, unclipped, in viewport;
- theme and preferences: LightMode semantic parity with a theme delta; forced colors (tier text,
  boundaries, checked cue, focus); reduced motion (no running animations, complete content);
- accessibility tree for K1–K6.

## Validation commands

```bash
npm ci --ignore-scripts
npm run quality:all
node scripts/typecheck-all.mjs
node scripts/check-pattern-composition.mjs --selftest && node scripts/check-pattern-composition.mjs
node scripts/check-story-theme-wrapper.mjs --selftest && node scripts/check-story-theme-wrapper.mjs
npx nx run storybook:storybook:build --skip-nx-cache
STORYBOOK_PORT=6395 npx playwright test apps/storybook/src/tests/sk-mission-kanban-ten-lane-pattern.spec.ts --project=chromium --project=firefox
STORYBOOK_PORT=6395 npx playwright test apps/storybook/src/tests/sk-mission-kanban-pattern.spec.ts --project=chromium
node scripts/gate-selftest.mjs && node scripts/run-axe-storybook.js
node scripts/build-elements-css.mjs --check
node scripts/build-element-markup.mjs --check
node scripts/build-styles-only-markup.mjs --check
node scripts/build-react-wrappers.mjs --check
node scripts/build-vue-types.mjs --check
npx commitlint --from=origin/train/elements-first --to=HEAD
```

WebKit cannot launch on the development host, and visual baselines are CI-authoritative, so the PR's
CI run is the authority for WebKit, the visual job, the full Playwright suite, and the mutation
harness. A unique `STORYBOOK_PORT` keeps local runs off sibling checkouts' port 6006.

## One-Work-Package strategy

`WP01 — Ten-lane pattern and proof` owns the whole slice: module, suite, visual block, baselines,
ratchet. Splitting would leave a fixture without its proof or a proof without its fixture. The WP is
done when every requirement has evidence at the PR head, CI is green, and the baselines were
harvested and inspected.

## Delivery, rollback, and migration

- One PR `mission/mission-kanban-ten-lane-pattern-extension` → `train/elements-first`, body
  `Refs #395` / `Refs #276`, never a closing keyword for the epic. Merge is operator-gated.
- Rebase onto the latest train before review; recompute the ratchet total; regenerate nothing
  (no generated surface is touched) but re-run every `--check`.
- Rollback removes the module, the suite, the visual block and twelve PNGs, and the ratchet key.
  No state, API, or consumer migration exists.

## Risk register

| Risk | Detection | Mitigation |
|---|---|---|
| #278 changes by accident | `git diff --name-only origin/train...HEAD` | sibling module; explicit unchanged list |
| Counts restated | clone-and-move projection test | counts computed from base Work Packages only |
| Overlay freshens committed truth | K1/K5 lane parity, tree placement test | overlay attached to card; lane from committed id |
| Dead tab stop on a fitting board | K3@1440 and K6@2800 tab traversal | measured triad, removed as a set |
| Content change missed | lane-injection test on a mounted K3 | subtree `MutationObserver` |
| Observer leak on remount | instrumented Reload test | body watcher + per-render closure |
| Literal copy in render code | source scan for text nodes and literal names | all strings from fixtures |
| Train moves (#409, #368 also edit the ratchet and visual suite) | fetch before PR and before review | rebase, re-derive total, re-run gates |
| Sibling Storybook on 6006 | `pgrep -af "storybook dev"` | unique `STORYBOOK_PORT` |
| Host-font baselines | CI artifact | harvest CI actuals; never `--update-snapshots` locally |

## Charter Check

| Gate | Response | Result |
|---|---|---|
| Token authority | existing `--sk-*` tokens; system colours only under forced colors | Pass |
| Elements-first boundary | excluded story module; no element, export, wrapper | Pass |
| ADR-9 public styling | public classes, recorded parts, composition gate | Pass |
| ADR-10 ownership | no generated artifact touched | Pass |
| ADR-11 behaviour | no new behaviour subject; native and existing element behaviour only | Pass |
| Delivery | one WP, one PR to the train, operator merges | Pass |

No charter exception, ADR, or product decision is required.

## Complexity Tracking

None.
