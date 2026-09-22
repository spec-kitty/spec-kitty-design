# Tasks: Delivery-return metric elements

**Mission:** `delivery-return-metric-elements-01M1STPA`

**Issue:** #147, part of #144 and tracking #125

**Planning branch:** `mission/delivery-return-metric-elements`

**Planning base:** `train/elements-first` at `0fde2abffd26c53caeb40ced44bef8c79846b47b`

**Final delivery:** one issue-level PR from `mission/delivery-return-metric-elements` into `train/elements-first`, with `Refs #147`

## Delivery rule

The three work packages are implementation/review boundaries, not external PR boundaries. They execute in dependency order. Do not push a WP branch or open a WP-specific PR.

WP01 owns the scalar metric and may touch only its local authored/generated stylesheet surface and focused test. WP02 depends on WP01 and owns only the evidence-chain surface and focused test. After both are approved, WP03 remains held until #145/#146 have landed on the train; the clean mission target is then refreshed to latest train and WP01→WP02 are consolidated through the supported workflow before WP03 is claimed. WP03 registers those integrated components across shared public/generated surfaces and proves the consumer/documentation/release gates. No package implements Team Kitty state or modifies a sibling mission's authored component.

WP03 must start from the recorded latest-train + approved-WP01/WP02 integrated target and computes all ratchets/generated evidence there. After WP03 approval, verify the remote train SHA is unchanged before supported consolidation of WP03. If it moved, invalidate WP03 evidence and return WP03 through supported refresh/consolidation/implementation/review; never post-rebase an approved lane or hand-edit shared outputs. The eventual PR targets only the train. It requires CI-authoritative visuals, Tier C three-lens evidence, and one maintainer approval at the exact head. Never merge/push `main`, publish, or deploy.

## Subtask index

| ID | Work Package | Description | Parallel |
|---|---|---|---|
| T001 | WP01 | Add the enumerated red-first metric contract and stylesheet-adoption matrix | No |
| T002 | WP01 | Implement opaque label/value semantics, validation, tone, compact density, and pill-tag composition | No |
| T003 | WP01 | Add the six required metric stories and token-only visual surface | No |
| T004 | WP01 | Prove the focused metric boundary and hand off a clean reviewed commit | No |
| T005 | WP02 | Add the enumerated red-first readonly/order/composition/accessibility matrix, including absent optionals and forced-colors source proof | No |
| T006 | WP02 | Implement fail-closed stage validation, stable-ID repetition, and literal metric composition | No |
| T007 | WP02 | Add ordered-list/connectors, responsive styling, and nine required stories | No |
| T008 | WP02 | Prove the focused evidence-chain boundary and hand off a clean reviewed commit | No |
| T009 | WP03 | On the pinned integrated base, register entries/exports/docs/ratchets/changelogs and add exact-part/token/budget gate scripts | No |
| T010 | WP03 | Regenerate manifest, React/Vue surfaces, CSS modules, and sizes without hand edits | No |
| T011 | WP03 | Prove typed React delivery/reset, literal approved composition, computed theme variance, and active forced-colors behavior | No |
| T012 | WP03 | Run deterministic quality, release, exact-contract/token, 180-second Storybook, test, and serial mutation gates | No |
| T013 | WP03 | Record exact-scope closeout on the pinned base and hand off train-SHA verification/PR gates | No |

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

1. Write the focused fixture first, keeping the test import local so no package barrel is needed yet. Use the WP01 prompt's five-row reversal matrix verbatim: opaque text; native definition semantics; annotation/pill composition; validation/tone; parts/constructed stylesheet. Record each named assertion red after its specified production-source break, restore, and record it green before commit.
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

1. Start with frozen-array fixture tests for two/four/six stages, malformed/empty records, duplicate IDs, opaque values, metric composition, connector count, parts, and stylesheet adoption. Include a valid stage with both `tone` and `annotation` absent and prove neutral/no-annotation rendering without caller mutation. Use the WP02 prompt's six-row named reversal matrix rather than shadow snapshots.
2. Export the convenience `EvidenceStage` type, but spell the public `stages` field as a self-contained readonly structural literal so the generated manifest/wrapper cannot reference a missing alias.
3. Declare `stages: { attribute: false }` with `Object.freeze([])`. Validate the complete input without mutation; invalid input renders one generic safe status with no partial list.
4. Render a single native `<ol>` with direct `<li>` children, keyed by stable IDs via Lit `repeat`, one actual `sk-metric` per item, and explicit nonfinal `aria-hidden` connector nodes.
5. Use CSS only for wide-to-narrow direction; preserve DOM/input order. Declare exactly `list`, `stage`, `connector`, and `empty-state` parts.
6. Add exactly nine stories: `Default`, `ApprovedExample`, `TwoStages`, `SixStages`, `Narrow`, `LongContent`, `Empty`, `InvalidInput`, and `LightMode`. Only `ApprovedExample` contains Delivery-return fixture language, and that story must render real existing `sk-card` and `sk-grid` around the chain; its annotations reach real `sk-pill-tag` only through composed metrics.
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

**Independent review:** From the recorded latest-train + approved-WP01/WP02 integrated base, regenerate rather than hand-edit all public artifacts; verify exact per-tag manifest part sets and rendered targeting, docs/story counts, parsed token-literal coverage, self-contained React/Vue types, runtime property identity/replacement/reset with no attribute, literal card/grid/pill composition, active forced-colors and computed theme variance, release reachability, Storybook's enforced 180-second budget, full test/mutation preservation, and an exact declared diff. Post-WP03 train-SHA verification and PR exact-head review remain separate closeout gates.

### Included subtasks

- [ ] T009 On the pinned integrated base, register entries/exports/docs/ratchets/changelogs and add exact-part/token/budget gate scripts (WP03)
- [ ] T010 Regenerate manifest, React/Vue surfaces, and sizes without hand edits; verify the WP01/WP02-owned CSS modules remain byte-identical (WP03)
- [ ] T011 Prove typed React delivery/reset, literal approved composition, computed theme variance, and active forced-colors behavior (WP03)
- [ ] T012 Run deterministic quality, release, exact-contract/token, 180-second Storybook, test, and serial mutation gates (WP03)
- [ ] T013 Record exact-scope closeout on the pinned base and hand off train-SHA verification/PR gates (WP03)

### Implementation sketch

1. Enter only after #145/#146 are verified on train, the clean mission target is refreshed, and approved WP01→WP02 are supported-consolidated. Record train/WP/integrated SHAs; block if the returned WP03 workspace is not that exact integrated base. Export/register both elements at runtime, add `@spec-kitty/styles` subpaths, and update exact ratchets from this base: five/zero/zero metric docs, zero/one/zero chain docs, nine parts, and fifteen story IDs.
2. Update `CHANGELOG.md` with exactly `sk-metric` and `sk-evidence-chain` so the release graph matches the manifest. Synchronize component/React usage docs and the design-system changelog without documenting application calculations.
3. Run generators in prescribed order. Never hand-edit manifest, wrapper, Vue, CSS-module, or size outputs. Inspect generated declarations for an unimported `EvidenceStage`/tone alias and fix source shape if present.
4. Extend React type tests and a dedicated React runtime fixture. Prove exact frozen-array identity, replacement, removal reset, no `stages` attribute, scalar metric props, literal tone rejection, and no `any`; do not change the generic generator unless a distinct scoped defect is escalated.
5. Add `scripts/check-component-public-contract.mjs` with explicit per-tag part expectations and missing/extra selftests; add parsed `scripts/check-component-token-literals.mjs` with red selftests for every governed property class; add `scripts/build-storybook-with-budget.mjs` with a 180-second real-build ceiling and cheap success/nonzero/timeout selftests. No dependency or broad unrelated gate rewrite is allowed.
6. Add functional Storybook assertions for semantics, counts/order, narrow reflow, and nonblank renders. Prove `ApprovedExample` contains real `sk-card`/`sk-grid` and nested real pill tags, each tag has a token-driven computed dark/light difference on equivalent content, and an active `forcedColors: 'active'` Chromium context preserves connector/stage distinction. Add visual entries for planned states; local actuals are diagnostic only.
7. Run all deterministic, content, exact-part, parsed-token, entry, package export, release-graph, type, quality, test, budgeted Storybook, axe, and serial mutation gates. Run the full mutation fleet after lighter gates, including the governed SC-013 registry remediation: exactly one part-removal arm for `sk-metric` and one for `sk-evidence-chain`, with no new behavior id or SC-014 pair.
8. Record exact command outputs, counts, elapsed times, generated-file identity, integration-base SHAs, and diff scope. Return one clean internal commit for review. Do not push, open/merge a PR, rebase the mission target, or claim CI/WebKit/authoritative visual/squad/maintainer gates.

### Review boundaries

- Generated artifacts move only from these two elements or the explicitly recorded latest-train integration base; no sibling authored component source may change.
- Root/design changelogs may name the public generic tags and fixture purpose, not publish Team Kitty domain behavior.
- The only behavior/mutation entries are the operator-authorized SC-013 subjects and one exact non-root part-removal arm per new element required by the repository config contract. No new behavior id, SC-014 pair, or interactive behavior is added; the full fleet must pass.
- No token/dependency/lockfile/ADR/app change. Any such need blocks for explicit scope.
- WP03 review is not merge authority. If train moves, WP03 must be rerun/re-reviewed on the new supported integration base. Tier C and maintainer evidence are taken only at the eventual exact PR head.

## Mission closeout after WP03 approval

1. Fetch current `origin/train/elements-first` and compare it with WP03's recorded train SHA.
2. If it differs, stop closeout and use supported stale-state recovery to refresh the clean target, reconsolidate approved WP01→WP02, and rerun WP03 implementation/review. Do not post-rebase the approved WP03 lane or patch ratchets/generated output in closeout.
3. If it matches, consolidate approved WP03 through the supported workflow and rerun deterministic exact-head checks; any unexpected generated diff invalidates WP03 evidence.
4. Open exactly one draft PR with base `train/elements-first` and body `Refs #147`. Do not target `main` and do not open one PR per WP.
5. Obtain CI-authoritative visual actuals, compare them with the approved Stitch screen, commit only approved CI bytes, and rerun all exact-head checks including unqualified Playwright/WebKit, mutation selftests/budget, parsed token and exact-part selftests, and the fail-closed Storybook build budget.
6. Run Tier C's three independent lenses and obtain one maintainer approval at that same current head. Any push invalidates the SHA-pinned evidence and requires affected gates/reviews to rerun.
7. Only a separately authorized orchestrator may merge the verified PR into the train and then close exactly issue #147. No agent merges the train into `main`, publishes, or deploys.

## Dependency and lane expectation

```text
WP01 metric
  ↓
WP02 evidence-chain composition
  ↓
wait #145/#146 → refresh train → supported WP01/WP02 consolidation
  ↓
WP03 shared public/generated surfaces and local verification
  ↓
mission closeout: verify train unchanged → consolidate WP03 → exact-head PR gates
```

The owned source sets are disjoint across WPs except that later packages consume earlier outputs. Spec Kitty should therefore retain three reviewable lanes ordered by explicit dependencies. If lane computation collapses them because it treats generated ownership as overlap, serial execution is still correct; never run concurrent writers against shared generated artifacts.
