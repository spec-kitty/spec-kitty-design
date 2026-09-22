---
work_package_id: WP02
title: Ordered evidence-chain composition
dependencies:
- WP01
requirement_refs:
- FR-006
- FR-007
- FR-008
- FR-009
- FR-010
- FR-011
- FR-012
- FR-013
- FR-015
- FR-016
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
- C-007
planning_base_branch: mission/delivery-return-metric-elements
merge_target_branch: mission/delivery-return-metric-elements
branch_strategy: Planning artifacts for this mission were generated on mission/delivery-return-metric-elements. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/delivery-return-metric-elements unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-delivery-return-metric-elements-01M1STPA
base_commit: b9edb4cf657b5ce07c803523ec2e04e64ec5dc36
created_at: '2026-09-06T00:38:16.167148+00:00'
subtasks:
- T005
- T006
- T007
- T008
phase: Phase 2 - Evidence-chain composition
history: []
agent_profile: frontend-freddy
authoritative_surface: packages/elements/src/evidence-chain/
create_intent:
- packages/styles/src/evidence-chain/sk-evidence-chain.css
- packages/elements/src/evidence-chain/sk-evidence-chain.ts
- packages/elements/src/evidence-chain/sk-evidence-chain.stories.ts
- packages/elements/src/evidence-chain/sk-evidence-chain.css.js
- packages/elements/src/evidence-chain/sk-evidence-chain.css.d.ts
- fixtures/elements-behaviour/src/sk-evidence-chain.test.ts
execution_mode: code_change
owned_files:
- packages/styles/src/evidence-chain/sk-evidence-chain.css
- packages/elements/src/evidence-chain/sk-evidence-chain.ts
- packages/elements/src/evidence-chain/sk-evidence-chain.stories.ts
- packages/elements/src/evidence-chain/sk-evidence-chain.css.js
- packages/elements/src/evidence-chain/sk-evidence-chain.css.d.ts
- fixtures/elements-behaviour/src/sk-evidence-chain.test.ts
priority: P1
role: implementer
tags: []
task_type: implement
tracker_refs:
- '#147'
- '#144'
---

# WP02 — Ordered evidence-chain composition

## Do this first

Load the `frontend-freddy` profile through the profile-load skill and use Codex as the implementation agent. Enter only the dependency-aware workspace returned by:

```sh
spec-kitty agent action implement WP02 --agent codex --mission delivery-return-metric-elements-01M1STPA
```

Verify WP01 is the assigned base and its reviewed `sk-metric` exists. Do not invoke Claude or Claude-backed tooling.

## Objective

Implement `sk-evidence-chain` as a fail-closed, immutable ordered projection of consumer stages. It renders one actual `sk-metric` per stage, uses stable IDs only for DOM identity, adds exactly one decorative connector between adjacent stages, preserves order across wide/narrow layouts, and exposes a same-root native ordered sequence. It owns no application or interactive state.

## Public contract

Export the convenience type:

```ts
export type EvidenceStage = Readonly<{
  id: string;
  label: string;
  displayValue: string;
  annotation?: string;
  tone?: 'neutral' | 'info' | 'success' | 'attention';
}>;
```

The only public field is `stages`, declared `attribute: false` with `Object.freeze([])`. Spell its manifest-facing type as the equivalent inline readonly structural literal rather than only `ReadonlyArray<EvidenceStage>`; the generated wrapper must not later refer to an alias it does not import.

There are no public attributes, methods, events, or slots. The exact parts are `list`, `stage`, `connector`, and `empty-state`.

Valid input is a nonempty array of records with unique nonblank string IDs, nonblank string labels/display values, optional string annotations, and absent/supported tone. Input order is authoritative. Empty or invalid input renders `No evidence available.` in `part="empty-state"` with no partial list or fabricated stage.

## Scope and requirements

Allowed writes are exactly the six `owned_files` in frontmatter. WP01 metric files are a read-only dependency. Shared entries, ratchets, manifest, wrappers, package exports, docs, changelogs, Playwright files, behaviors, and mutations belong to WP03.

This WP covers FR-006–FR-013 and the evidence-chain half of FR-015/FR-016, the element-local portion of NFR-001–NFR-004, and C-001–C-007.

### T005 — Red-first readonly/order/composition evidence

1. Create `fixtures/elements-behaviour/src/sk-evidence-chain.test.ts` with local dependency imports.
2. Use deeply frozen two-, four-, and six-stage arrays. At least one valid stage omits both `annotation` and `tone`; prove it remains present, renders neutral/no annotation chrome, and is not mutated to acquire defaults. Retain original references and serialized field bytes; verify all remain unchanged after initial render and immutable reference replacement.
3. Assert a single native ordered list with direct list items, exact stage order, one actual `SK-METRIC` per item, and supplied label/display/annotation/tone forwarded unchanged.
4. Assert connector count is `stage count - 1`, the final stage has no connector, and connectors are absent from the accessibility tree/name/item count.
5. Reassign a new frozen array whose records preserve IDs but change content/order. Require same-ID stage node identity to be preserved while current supplied order/content updates.
6. Assert empty array, non-array, malformed record, blank/duplicate ID, invalid field type, and unsupported tone all produce the same whole-input safe status and no partial list.
7. Target all four literal external `::part()` selectors and verify present nodes in the appropriate valid/empty states.
8. Compare the adopted sheet with named `skEvidenceChainSheet` by identity and require zero shadow `<style>` elements.
9. Execute every row of this fixed reversal matrix against production source. Capture the named failing assertion and command exit nonzero, restore the exact source, rerun that assertion green, and record both outputs. Do not register mutation subjects.

| Coherent group | Temporary production-source reversal | Required named assertion that must turn red |
|---|---|---|
| Immutable order and stable identity | Key Lit `repeat` by array index instead of `stage.id` | `preserves supplied order and same-id node identity without caller mutation` |
| Literal metric composition and connectors | Replace the composed `sk-metric` with a plain element | `composes one metric per stage with exactly n-minus-one connectors` |
| Whole-input validation and absent optionals | Make missing `tone` or `annotation` invalid | `accepts absent optional fields and fails closed only for invalid whole input` |
| Native ordered accessibility semantics | Replace `<ol>/<li>` with generic containers | `exposes one same-root ordered list with decorative connectors` |
| Forced-colors authored treatment | Remove the connector rule from `@media (forced-colors: active)` | `ships a scoped forced-colors connector distinction without forced-color-adjust none` |
| Public parts and constructed stylesheet | Remove `part="connector"` from the valid template | `targets all four public parts and adopts only skEvidenceChainSheet` |

### T006 — Structured element and literal composition

1. Implement a pure validator with guard clauses. It reads input without sorting, trimming, freezing, mutating, adding defaults to records, or accepting partial validity.
2. Keep the frozen empty default and document `stages` as a consumer-assigned property requiring a new reference for Lit updates.
3. Import/register `sk-metric` through its direct component path. Use Lit's existing `repeat` directive with `stage.id` as key.
4. Render one `<ol part="list">`; each record yields one direct `<li part="stage">` containing one actual `<sk-metric>` whose values are property-bound unchanged.
5. Add an explicit connector node only for nonfinal stages, with `part="connector"` and `aria-hidden="true"`.
6. Invalid/empty input contains no list, metric, or connector. No raw consumer ID is interpolated into a DOM id or selector.
7. Publish consumer-facing `@element`/`@csspart` and field descriptions, plus the exact existing token dependency list. Use guarded `define()`.

### T007 — Responsive style and stories

1. Author one token-only `sk-evidence-chain.css` with `:host { display: block; }`, BEM-owned selectors, horizontal stage flow at wide widths, and a narrow vertical flow at the established repository breakpoint.
2. Preserve DOM order in CSS. Connectors must remain visually distinct in both themes and forced-colors without `forced-color-adjust: none`, raw colors, or content glyphs that leak into accessible names.
3. Use flex/grid layout that accepts two/four/six items; do not encode four columns/stages as a component invariant.
4. Create title `Elements/SkEvidenceChain` with exactly: `Default`, `ApprovedExample`, `TwoStages`, `SixStages`, `Narrow`, `LongContent`, `Empty`, `InvalidInput`, `LightMode`.
5. `Default` is domain-neutral. `ApprovedExample` alone may use Investment/Completed/Deployed/Verified, values `€1,840`, `42 WPs`, `6 missions`, `2 outcomes`, and honest supplied annotations; none is component default/API. Import/register and render actual existing `sk-card` and `sk-grid` around the chain. Annotated metrics must yield actual nested `sk-pill-tag` descendants; do not reproduce any of those components' markup or styles.
6. `Narrow` uses a bounded story viewport rather than mutating order. `LightMode` uses a real `.sk-light` wrapper and equivalent content.
7. Generate only the local `.css.js`/`.css.d.ts` pair.

### T008 — Focused proof and review handoff

Run focused non-heavy verification:

```sh
node scripts/build-elements-css.mjs
node scripts/build-elements-css.mjs --check
npx vitest run --project browser fixtures/elements-behaviour/src/sk-metric.test.ts fixtures/elements-behaviour/src/sk-evidence-chain.test.ts --reporter=default
npx nx run elements:typecheck
npx nx run elements:lint
npm run quality:stylelint
git diff --check
```

If a build-only Storybook smoke is uncontended it is allowed; do not run axe, visual Playwright, the full repository test, or the mutation fleet. WP03 owns heavy/full evidence.

Use Spec Kitty's targeted commit/review flow, require a clean worktree after the focused commit, and do not push/open a PR.

## Definition of Done

- [ ] `stages` is the only public field, property-only, readonly, frozen-empty by default, and analyzer-safe without an external alias reference.
- [ ] All valid inputs preserve exact bytes/order/caller identity and render one metric per stage.
- [ ] A stage with absent `tone` and `annotation` is valid, neutral, chrome-free, and never mutated to add defaults.
- [ ] Stable IDs preserve repeated node identity without becoming selection/domain state.
- [ ] Invalid/empty input fails closed as a whole and fabricates nothing.
- [ ] Native ordered-list/direct-item semantics and `n - 1` decorative connectors are verified.
- [ ] Wide/narrow CSS changes direction only; two/four/six are all ordinary inputs.
- [ ] Four parts and named constructed sheet are targetable/adopted with zero `<style>` nodes.
- [ ] Exactly nine required stories exist; only fixture data uses Delivery-return language.
- [ ] Direct red reversals and focused commands are recorded green after restoration.
- [ ] Diff contains only `owned_files`, one focused commit, no push, and no PR.

## Risks

- **Readonly type but mutable behavior:** verify caller references and bytes before/after; avoid in-place array APIs.
- **Stable IDs become application identity:** use only as `repeat` keys and never reflect/expose selection.
- **List semantics break across roots:** keep `<ol>` and direct `<li>` in the same shadow root; metric is inside each item.
- **Chain imitates metric:** reject duplicated label/value markup; require an actual custom element per stage.
- **Four-stage fixture shapes code:** two/six/narrow tests must exercise the same path; real card/grid wrappers belong only to the approved story composition, not the chain implementation.
- **Alias leaks into generated wrapper:** keep the field's manifest type self-contained.

## Reviewer guidance

Reject on any out-of-frontmatter write, consumer-data mutation, JSON attribute, partial invalid rendering, sorting, Team-specific API/default, event/action/selection, cross-root list item, missing actual `sk-metric`, incorrect connector count/a11y, static markup, new token/dependency, behavior registry entry, or missing direct red evidence. Approval covers WP02 only and grants no PR/merge authority.

## Activity Log

> **CRITICAL**: Activity log entries MUST be in chronological order (oldest first, newest last).

- 2026-09-06T00:00:00Z – system – Planning prompt finalized; implementation has not started.
