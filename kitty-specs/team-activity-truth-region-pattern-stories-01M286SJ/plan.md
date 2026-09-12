# Implementation Plan: Team activity truth-region pattern stories

**Branch**: `team-activity-truth-region-pattern-stories` | **Date**: 2026-09-11 |
**Spec**: `kitty-specs/team-activity-truth-region-pattern-stories-01M286SJ/spec.md`
**Planning base / merge target**: `train/elements-first` at
`0a232a01a17627de6f1553ad0948b8b2f6f4f286`
**Input**: issue #382 under epic #381 and the binding Family 1 programme handoff.

## Summary

Add one Storybook-only `Patterns/Team Activity` module. A single recursively frozen fixture owns
all visible and accessible copy, times, identifiers, state labels, truth markers, repository facts,
and stress variants. Pure validation/projection functions select L1–L5, TL1, four OA1 states, and
DM1 without a clock, router, relay client, permission engine, or mutable store. Lit render helpers
compose current public elements and native semantic HTML; pattern-local token-only CSS supplies
only layout. A focused built-Storybook Playwright suite and visual inventory prove boundaries,
accessibility, responsive containment, themes, media preferences, and baseline appearance.

## Technical Context

**Language/Version**: TypeScript 5.x, Lit 3.3.3 templates, CSS custom properties
**Primary Dependencies**: Storybook 10.6, Playwright 1.62.1, axe-playwright 2.2.2, current public
`@spec-kitty/elements` and `@spec-kitty/styles` surfaces
**Storage**: N/A — compile-time Storybook fixtures only
**Testing**: Storybook play assertions; focused Playwright against built stories in Chromium,
Firefox, and WebKit; axe; Chromium/Linux visual regression; repository composition/generation gates
**Target Platform**: Modern browsers supported by the repository Playwright matrix
**Project Type**: Nx web-component design-system monorepo
**Performance Goals**: Storybook build stays below the checked 180-second ceiling; no new runtime
package/API/bundle surface
**Constraints**: existing tokens only; all copy supplied by fixtures; no private shadow access,
copied component CSS, application imports/state/logic, or new component/helper API
**Scale/Scope**: one story source, one focused browser suite, exact story ratchet, visual inventory,
and reviewed snapshots in one bounded Work Package

## Charter Check

- **Specification fidelity / bounded context**: pass. The plan implements only issue #382's
  live/observed/Decision region matrix and treats Team Kitty application behavior as external.
- **Accessibility**: pass by design. Native regions, headings, lists, `time`, busy/status behavior,
  logical properties, axe, accessibility-tree and keyboard assertions are first-class outputs.
- **Tokens first**: pass. Pattern-local CSS contains only existing `var(--sk-*)` design values;
  forced-colors system keywords appear only in the repository-sanctioned media query.
- **Canonical/public surfaces**: pass. Direct element modules and native style classes are consumed;
  no custom element, wrapper, manifest, token, style package, or public barrel changes.
- **Test first**: a focused Storybook test is introduced and run red for the absent story contract
  before the production story is authored.
- **Review boundary**: Frontend Freddy authors; a separate reviewer seat owns approval. No merge is
  performed by this Work Package.

## Architecture and data flow

```text
deep-frozen TeamActivityFixture (consumer-owned values and copy)
  -> validateTeamActivityFixture (rejects unsafe combinations)
  -> projectTeamActivity(state) (pure, deeply frozen view data)
  -> renderTeamActivity(projection, presentation) (Storybook-only Lit template)
       -> native region / section / list / time / code / status semantics
       -> public sk-notice / sk-status-indicator / sk-entity-marker where appropriate
       -> pattern-local token-only layout CSS
  -> built Storybook
       -> focused Playwright semantic/guard/layout/a11y checks
       -> shared visual inventory and Chromium/Linux snapshots
```

The fixture is the only content source. Projection selects supplied data but does not classify
events, infer a tier, format a time, construct a route, calculate retention, or join presence to
work. Rendering never accepts raw application objects and publishes no reusable runtime helper.

## Truth-region matrix

| Boundary | Projection | Required inclusion | Required exclusion |
|---|---|---|---|
| L1 | repository populated | named reported-live region; presence/focus/event rows; entry presence marker | observed/retention marker |
| L2 | repository quiet | named boundary; exact quiet copy | rows, notice, CTA/history |
| L3 | repository degraded | named boundary; relay notice | stale live rows; factual-host degradation |
| L4 | repository gap | complete supplied gap sentence before current rows | inferred missing count/history |
| L5 | unauthorized | bare exact denial only | every repository/host/tier/shell datum |
| TL1 | Team mixed | four independently named repository regions | Team-wide freshness/status |
| OA1 | populated/degraded/quiet/loading | canonical observed + retention boundary; degraded retained rows; heading-safe loading | presence/gap marker; heading `role=status` |
| DM1 | Decision | exactly `Decision` + wire-safe identifier under observed boundary | prose/workflow/source/owner/action |

## Story inventory

The exact ratchet gains these user-facing IDs under `patterns-team-activity`:

- `default` — L1 repository populated dark
- `l2-repository-quiet`
- `l3-repository-degraded`
- `l4-repository-sequence-gap`
- `l5-repository-unauthorized`
- `tl1-team-mixed`
- `oa1-observed-populated`
- `oa1-observed-retained-degraded`
- `oa1-observed-quiet`
- `oa1-observed-loading`
- `dm1-decision`
- `light-mode` — same L1 fixture/projection
- `narrow` — TL1 at the 390px evidence target
- `intermediate` — OA1 matrix at the integration width
- `long-content`
- `rtl`
- `forced-colors`
- `reduced-motion`

The media-preference stories remain normal deterministic markup; tests activate the corresponding
browser preference. Narrow/zoom/short-viewport assertions run at test-selected viewport dimensions
rather than deriving layout behavior from an application state API.

## Project Structure

### Mission artifacts

```text
kitty-specs/team-activity-truth-region-pattern-stories-01M286SJ/
├── spec.md
├── plan.md
├── tasks.md
├── tasks/WP01-team-activity-pattern-and-proof.md
├── meta.json
├── issue-matrix.json
├── acceptance-matrix.json
├── status.json
├── status.events.jsonl        # canonical CLI-emitted lifecycle history
├── mission-events.jsonl       # requested compatibility invocation record
└── lanes.json
```

`status.events.jsonl` remains the Spec Kitty 3.2 canonical lifecycle surface and is never
hand-edited. The separate one-line `mission-events.jsonl` exists only to satisfy the programme's
requested compatibility shape and records the actual final WP01 packaging review invocation; it
does not claim a lane transition or duplicate the canonical history. Cycle 6's planned/doing/
for-review transitions remain emitted through the supported CLI only.

### Authored and evidence surfaces

```text
packages/elements/src/patterns/team-activity.stories.ts
apps/storybook/src/tests/sk-team-activity-pattern.spec.ts
expected-stories.json
apps/storybook/src/tests/visual.spec.ts
apps/storybook/src/tests/visual.spec.ts-snapshots/team-activity-*.png
```

**Structure Decision**: Follow the landed Mission Reading, Work Explorer, and Mission Kanban
pattern convention: authored pattern module in `packages/elements/src/patterns`, black-box browser
proof in `apps/storybook/src/tests`, and shared Storybook/visual ratchets. Storybook auto-discovers
the story; no separate index or public barrel is added.

## Implementation Concern Map

### IC-01 — Immutable truth model and validation

- **Purpose**: make unsafe tier/state combinations unrepresentable at render time and preserve all
  strings as consumer inputs.
- **Relevant requirements**: FR-002–FR-013, FR-017; NFR-001.
- **Affected surfaces**: `team-activity.stories.ts`, focused browser test.
- **Sequencing/depends-on**: none; authored after the red built-story contract.
- **Risks**: a broad generic model could become a de facto library API. Keep types/functions
  story-local exports excluded from Storybook and tied only to this evidence family.

### IC-02 — Semantic pattern rendering and resilient layout

- **Purpose**: render the matrix with native relationships and public elements while containing
  long/RTL/narrow content.
- **Relevant requirements**: FR-003–FR-016, FR-018; NFR-002–NFR-004.
- **Affected surfaces**: `team-activity.stories.ts`.
- **Sequencing/depends-on**: IC-01.
- **Risks**: accidental product copy outside the fixture, copied child styles, or passive tab stops.
  Guard source and built DOM for each.

### IC-03 — Black-box and visual evidence

- **Purpose**: assert the external Storybook contract across state, semantics, accessibility,
  viewport/media stress and pixel baselines.
- **Relevant requirements**: FR-015–FR-019; NFR-001–NFR-007.
- **Affected surfaces**: focused spec, `expected-stories.json`, `visual.spec.ts`, new snapshots.
- **Sequencing/depends-on**: IC-01 and IC-02.
- **Risks**: CI-authoritative font metrics may differ locally. Generate through Playwright tooling,
  inspect local images, and iterate from CI artifacts if the Ubuntu baseline differs.

## One-Work-Package strategy

The issue explicitly requires one bounded Work Package. The story model, renderer, focused browser
contract, exact story ratchet, and visual entries are one tightly coupled review unit; splitting
them would create a branch with an unratcheted or unverified story family. WP01 owns only the five
surface groups listed above and performs no generated/public element change.

## Verification order

1. Establish exact-head inventory and a focused expected-red failure for the absent story family.
2. Add fixture/guard/projection and run typecheck/composition/targeted checks.
3. Render L1–L5, TL1, OA1 and DM1; run focused Chromium tests after each boundary group.
4. Add theme/responsive/long/RTL/media stories and corresponding black-box assertions.
5. Update story and visual ratchets; build Storybook; run focused Chromium then all configured
   browsers; generate and visually inspect Chromium/Linux snapshots.
6. Run the full repository gate set, confirm only owned files changed, safe-commit, push, and open
   the PR for independent review.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| L5 protected data leaks through shared wrapper attributes | render L5 through a dedicated bare branch and assert the full text/attribute surface against an allowlist |
| Observed rows regain a live presence marker | fixture guard and built-DOM mutual-exclusion assertions |
| OA1 degradation hides retained history | guard requires retained moment/rollup data and built-story order assertions |
| TL1 flattens repository state | one region and heading per supplied repository; reject duplicate IDs; assert no aggregate freshness node |
| DM1 grows unsupported prose | validate two-field event shape, wire-safe ID grammar, and exact rendered text signature |
| Loading heading role is overridden | heading remains plain; separate visually hidden `role=status` node |
| Pattern CSS becomes reusable component CSS | composition gate plus strict `sk-team-activity-pattern*` scope and public-part-only selectors |
| Shared ratchets move before sibling #383 lands | open this PR first; sibling rebases/regenerates after human landing |

## Complexity Tracking

No charter exception or new architectural mechanism is required. One Work Package is an explicit
issue constraint, and its scope remains one pattern family plus its direct evidence.
