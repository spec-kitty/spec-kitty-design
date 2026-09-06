# Quickstart: Delivery-return metric elements

This is the implementation handoff for issue #147. It is not authorization to implement before the mission is prioritized.

## Preconditions

1. Work only on `mission/delivery-return-metric-elements` in the isolated `design-147` checkout.
2. Fetch `origin/train/elements-first` and record its exact head before WP01 begins; this is planning/authored-work provenance, not WP03's final integration base.
3. Confirm #79 remains present (`sk-pill-tag`) and preserve every sibling component's authored sources.
4. Use the finalized dependency order: WP01 → WP02 → wait for #145/#146 → refresh latest train → supported-consolidate WP01/WP02 → WP03.

## Consumer shape

```ts
import type { EvidenceStage, SkEvidenceChain } from '@spec-kitty/elements';

const stages = Object.freeze([
  Object.freeze({ id: 'one', label: 'First stage', displayValue: '€1,840' }),
  Object.freeze({ id: 'two', label: 'Second stage', displayValue: '42', annotation: '34 first pass' }),
]) satisfies ReadonlyArray<EvidenceStage>;

const chain = document.querySelector('sk-evidence-chain') as SkEvidenceChain;
chain.stages = stages;
```

The example deliberately assigns already formatted strings. The component must not infer currency, percentage, totals, trends, or status.

## Implementation rules

- Write CSS only in `packages/styles/src/metric/` and `packages/styles/src/evidence-chain/`; generate the element-side stylesheet modules.
- Use literal manifest-facing union/structure types so generated wrappers are self-contained.
- Compose a real `sk-pill-tag` for annotations and a real `sk-metric` for every evidence stage.
- Keep one native ordered list and direct list items in the chain's own shadow root.
- Do not create markup modules/static HTML for these structured/composed elements.
- Do not add behavior/mutation registry subjects: no interactive behavior is owned.
- Record every named row in the WP01/WP02 direct-red reversal matrices, including absent optionals and the forced-colors authored rule.

## Handoff check

WP01 and WP02 may run only focused non-heavy checks. After they are approved and #145/#146 are on train, refresh the clean mission target and supported-consolidate WP01→WP02 before claiming WP03. WP03 regenerates shared outputs once, proves exact per-tag parts, parsed token-literal coverage, literal approved card/grid/pill composition, computed theme variance, active forced colors, and the fail-closed 180-second Storybook budget, then runs the complete recipe/release graph/test/mutation/Storybook/axe/visual gates serially. If train moves, rerun/re-review WP03 on the new base. The eventual PR is one issue-level PR with `Refs #147` into `train/elements-first` only.
