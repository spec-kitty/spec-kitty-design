# Tasks: Delivery-return metric elements

**Mission:** `delivery-return-metric-elements-01M1STPA`

**Issue:** #147, part of #144 and tracking #125

**Planning branch:** `mission/delivery-return-metric-elements`

**Planning base:** `train/elements-first` at `0fde2abffd26c53caeb40ced44bef8c79846b47b`

**Final delivery:** one issue-level PR from `mission/delivery-return-metric-elements` into `train/elements-first`, with `Refs #147`

## Delivery rule

The three work packages are implementation/review boundaries, not external PR boundaries. They execute in dependency order and return reviewed results to the mission's final consolidation. Do not push a WP branch or open a WP-specific PR.

WP01 owns the scalar metric and may touch only its local authored/generated stylesheet surface and focused test. WP02 depends on WP01 and owns only the evidence-chain surface and focused test. WP03 depends on both, registers the two approved components across shared public/generated surfaces and proves the consumer/documentation/release gates. No package implements Team Kitty state or modifies a sibling mission's authored component.

After all WPs are approved, refresh the canonical mission target from the then-current `train/elements-first` **before** consolidating the frozen WP results. Merge them in dependency order, regenerate shared outputs once, rerun full gates, and do not perform a later rebase without repeating regeneration/review. The eventual PR targets only the train. It requires CI-authoritative visuals, Tier C three-lens evidence, and one maintainer approval at the exact head. Never merge/push `main`, publish, or deploy.

## Subtask index

| ID | Work Package | Description | Parallel |
|---|---|---|---|
| T001 | WP01 | Add direct red-first metric contract and stylesheet-adoption probes | No |
| T002 | WP01 | Implement opaque label/value semantics, validation, tone, compact density, and pill-tag composition | No |
| T003 | WP01 | Add the six required metric stories and token-only visual surface | No |
| T004 | WP01 | Prove the focused metric boundary and hand off a clean reviewed commit | No |
| T005 | WP02 | Add direct red-first readonly/order/composition/accessibility probes | No |
| T006 | WP02 | Implement fail-closed stage validation, stable-ID repetition, and literal metric composition | No |
| T007 | WP02 | Add ordered-list/connectors, responsive styling, and nine required stories | No |
| T008 | WP02 | Prove the focused evidence-chain boundary and hand off a clean reviewed commit | No |
| T009 | WP03 | Register package entries, export subpaths, docs/parts/story ratchets, and changelogs | No |
| T010 | WP03 | Regenerate manifest, React/Vue surfaces, CSS modules, and sizes without hand edits | No |
| T011 | WP03 | Prove typed React property delivery/reset and Storybook functional/accessibility contracts | No |
| T012 | WP03 | Run deterministic quality, release, test, and serial mutation gates | No |
| T013 | WP03 | Record exact-scope closeout and hand off final train refresh/consolidation/PR gates | No |

## WP01 — Generic metric element

**Prompt:** [`tasks/WP01-generic-metric-element.md`](./tasks/WP01-generic-metric-element.md)

**Priority:** P1 component prerequisite

**Dependencies:** None

**Requirement refs:** FR-001–FR-005, FR-013, FR-016; NFR-001–NFR-004; C-001–C-007

**Independent review:** Mount `sk-metric` directly and prove opaque supplied content, definition semantics, generic validation/tone/density, real `sk-pill-tag` annotation composition, all five external parts, named constructed-sheet identity, and zero injected style nodes. The diff contains no evidence-chain or shared public/generated registry work.

### Included subtasks

- [ ] T001 Add direct red-first metric contract and stylesheet-adoption probes (WP01)
- [ ] T002 Implement opaque label/value semantics, validation, tone, compact density, and pill-tag composition (WP01)
- [ ] T003 Add the six required metric stories and token-only visual surface (WP01)
- [ ] T004 Prove the focused metric boundary and hand off a clean reviewed commit (WP01)

### Implementation sketch

1. Write the focused fixture first, keeping the test import local so no package barrel is needed yet. Demonstrate one direct source reversal per meaningful contract and restore before implementation is committed.
2. Add one token-only stylesheet with `:host { display: block; }`, BEM-prefixed internals, tabular strong-value treatment, compact density, generic tone modifiers, and a non-misleading empty state.
3. Implement five scalar public properties with consumer-facing JSDoc. Render a same-root native definition relationship. Treat the display value as text; never parse or transform it.
4. Omit annotation markup when empty. When present, render an actual `sk-pill-tag` using the plan's generic tone-to-existing-variant mapping; do not copy its classes or declarations.
5. Declare exactly `metric`, `label`, `value`, `annotation`, and `empty-state` parts. Generate only the metric-local CSS module/declaration needed to compile and test this WP.
6. Add exactly six stories: `Default`, `WithAnnotation`, `Tones`, `Compact`, `LongContent`, and `LightMode`. `LightMode` uses `.sk-light`; stories contain generic fixture strings.
7. Run focused non-heavy checks and return one clean internal commit for independent review. Do not alter shared entries, ratchets, manifest, wrappers, package exports, docs, changelogs, or size files.

### Review boundaries

- No currency/percentage parsing, trend/status inference, Team Kitty import, event, action, slot, selection, timer, or app state.
- No new token/dependency and no component-named token. Stop if existing semantic tokens cannot meet the measured visual requirement.
- No `.markup.ts`, static HTML, or styles-layer `index.ts`; annotation composition has no honest no-JavaScript static form.
- No `behaviours.json` or `mutations.json` change. Focused acceptance red evidence is recorded without inventing ADR behavior ownership.
- No shared generated output is committed except the metric-local generated `.css.js`/`.css.d.ts` pair.

## WP02 — Ordered evidence-chain composition

**Prompt:** [`tasks/WP02-ordered-evidence-chain-composition.md`](./tasks/WP02-ordered-evidence-chain-composition.md)

**Priority:** P1 composite feature

**Dependencies:** WP01

**Requirement refs:** FR-006–FR-013, FR-015–FR-016; NFR-001–NFR-004; C-001–C-007

**Independent review:** Assign frozen valid and invalid arrays directly and prove exact stage count/order/content, no caller mutation, stable node identity on immutable rerender, one actual `sk-metric` per stage, `n - 1` decorative connectors, same-root ordered-list semantics, narrow reflow without DOM reordering, all four parts, and named constructed-sheet identity. The diff contains no shared public/generated integration work.

### Included subtasks

- [ ] T005 Add direct red-first readonly/order/composition/accessibility probes (WP02)
- [ ] T006 Implement fail-closed stage validation, stable-ID repetition, and literal metric composition (WP02)
- [ ] T007 Add ordered-list/connectors, responsive styling, and nine required stories (WP02)
- [ ] T008 Prove the focused evidence-chain boundary and hand off a clean reviewed commit (WP02)

### Implementation sketch

1. Start with frozen-array fixture tests for two/four/six stages, malformed/empty records, duplicate IDs, opaque values, metric composition, connector count, parts, and stylesheet adoption. Record direct red reversals rather than shadow snapshots.
2. Export the convenience `EvidenceStage` type, but spell the public `stages` field as a self-contained readonly structural literal so the generated manifest/wrapper cannot reference a missing alias.
3. Declare `stages: { attribute: false }` with `Object.freeze([])`. Validate the complete input without mutation; invalid input renders one generic safe status with no partial list.
4. Render a single native `<ol>` with direct `<li>` children, keyed by stable IDs via Lit `repeat`, one actual `sk-metric` per item, and explicit nonfinal `aria-hidden` connector nodes.
5. Use CSS only for wide-to-narrow direction; preserve DOM/input order. Declare exactly `list`, `stage`, `connector`, and `empty-state` parts.
6. Add exactly nine stories: `Default`, `ApprovedExample`, `TwoStages`, `SixStages`, `Narrow`, `LongContent`, `Empty`, `InvalidInput`, and `LightMode`. Only `ApprovedExample` contains Delivery-return fixture language.
7. Generate only the evidence-chain-local CSS module/declaration, run focused non-heavy checks, and return one clean internal commit for review.

### Review boundaries

- `id` is render identity only. No sorting, selected ID, click/keyboard action, event, animation, navigation, timer, or domain derivation.
- No duplicate metric markup; every valid item contains an actual `sk-metric`.
- No cross-root list item relationship and no ARIA role that erases native ordered-list semantics.
- No JSON stage attribute, mutable default, caller freezing, partial invalid rendering, Team Kitty import/default/API, or four-stage hardcoding.
- No `.markup.ts`, static HTML, styles-layer `index.ts`, new token/dependency, registry/mutation change, or shared generated artifact.

## WP03 — Public surfaces and verification closure

**Prompt:** [`tasks/WP03-public-surfaces-and-verification-closure.md`](./tasks/WP03-public-surfaces-and-verification-closure.md)

**Priority:** P1 integration/release closure

**Dependencies:** WP01, WP02

**Requirement refs:** FR-014–FR-016; NFR-001–NFR-006; C-001–C-008 plus all end-to-end success criteria

**Independent review:** From the integrated component commits, regenerate rather than hand-edit all public artifacts; verify exact manifest/docs/parts/story counts, self-contained React/Vue types, runtime property identity/replacement/reset with no attribute, release reachability, required functional/axe/visual stories, full test/mutation preservation, and an exact declared diff. Final train refresh/consolidation and PR exact-head review remain a separate mission closeout gate after WP03 approval.

### Included subtasks

- [ ] T009 Register package entries, export subpaths, docs/parts/story ratchets, and changelogs (WP03)
- [ ] T010 Regenerate manifest, React/Vue surfaces, CSS modules, and sizes without hand edits (WP03)
- [ ] T011 Prove typed React property delivery/reset and Storybook functional/accessibility contracts (WP03)
- [ ] T012 Run deterministic quality, release, test, and serial mutation gates (WP03)
- [ ] T013 Record exact-scope closeout and hand off final train refresh/consolidation/PR gates (WP03)

### Implementation sketch

1. Export/register both elements at runtime, add `@spec-kitty/styles` subpaths, and update exact ratchets from the implementation-time train baseline: five/zero/zero metric docs, zero/one/zero chain docs, nine parts, and fifteen story IDs.
2. Update `CHANGELOG.md` with exactly `sk-metric` and `sk-evidence-chain` so the release graph matches the manifest. Synchronize component/React usage docs and the design-system changelog without documenting application calculations.
3. Run generators in prescribed order. Never hand-edit manifest, wrapper, Vue, CSS-module, or size outputs. Inspect generated declarations for an unimported `EvidenceStage`/tone alias and fix source shape if present.
4. Extend React type tests and a dedicated React runtime fixture. Prove exact frozen-array identity, replacement, removal reset, no `stages` attribute, scalar metric props, literal tone rejection, and no `any`; do not change the generic generator unless a distinct scoped defect is escalated.
5. Add functional Storybook assertions for semantics, counts/order, narrow reflow, and nonblank renders. Add visual entries for the planned dark/light/compact/long/general/narrow states; local actuals are diagnostic only.
6. Run all deterministic, content, part, entry, package export, release-graph, type, quality, test, Storybook, and axe gates. Run the full existing mutation fleet serially after lighter gates, with no new registry arm expected.
7. Record exact command outputs, counts, elapsed times, generated-file identity, and diff scope. Return one clean internal commit for review. Do not push, open/merge a PR, rebase the mission target, or claim CI/WebKit/authoritative visual/squad/maintainer gates.

### Review boundaries

- Generated artifacts move only from these two elements or an explicitly recorded latest-train baseline; no sibling authored component source may change.
- Root/design changelogs may name the public generic tags and fixture purpose, not publish Team Kitty domain behavior.
- No behavior/mutation entries are added for presentational components. The full fleet must still pass.
- No token/dependency/lockfile/ADR/app change. Any such need blocks for explicit scope.
- WP03 review is not merge authority. Tier C and maintainer evidence are taken only at the eventual exact PR head after canonical consolidation/regeneration.

## Mission closeout after WP03 approval

1. Fetch current `origin/train/elements-first`.
2. Refresh/rebase the canonical mission target before consolidating the frozen approved WPs.
3. Consolidate WP01 → WP02 → WP03, resolve only shared generated files, regenerate all artifacts once, and rerun the complete local gate set. Do not rebase after this point without invalidating and rerunning the evidence.
4. Open exactly one draft PR with base `train/elements-first` and body `Refs #147`. Do not target `main` and do not open one PR per WP.
5. Obtain CI-authoritative visual actuals, compare them with the approved Stitch screen, commit only approved CI bytes, and rerun all exact-head checks including unqualified Playwright/WebKit, mutation selftests/budget, and Storybook build below 180 seconds.
6. Run Tier C's three independent lenses and obtain one maintainer approval at that same current head. Any push invalidates the SHA-pinned evidence and requires affected gates/reviews to rerun.
7. Only a separately authorized orchestrator may merge the verified PR into the train and then close exactly issue #147. No agent merges the train into `main`, publishes, or deploys.

## Dependency and lane expectation

```text
WP01 metric
  ↓
WP02 evidence-chain composition
  ↓
WP03 shared public/generated surfaces and local verification
  ↓
mission closeout: refresh train → consolidate → regenerate → exact-head PR gates
```

The owned source sets are disjoint across WPs except that later packages consume earlier outputs. Spec Kitty should therefore retain three reviewable lanes ordered by explicit dependencies. If lane computation collapses them because it treats generated ownership as overlap, serial execution is still correct; never run concurrent writers against shared generated artifacts.
