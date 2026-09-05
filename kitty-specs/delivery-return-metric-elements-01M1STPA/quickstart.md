# Quickstart: Delivery-return metric elements

This is the implementation handoff for issue #147. It is not authorization to implement before the mission is prioritized.

## Preconditions

1. Work only on `mission/delivery-return-metric-elements` in the isolated `design-147` checkout.
2. Fetch `origin/train/elements-first` and record its exact head before implementation begins.
3. Confirm #79 remains present (`sk-pill-tag`) and preserve every sibling component's authored sources.
4. Use the finalized WP dependency order: WP01 → WP02 → WP03.

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
- Record direct red reversals for each WP's focused acceptance evidence.

## Handoff check

WP01 and WP02 may run only focused non-heavy checks. WP03 refreshes onto the latest train, integrates approved component commits, regenerates shared outputs once, runs the complete recipe/release graph/test/mutation/Storybook/axe/visual gates serially, and prepares the exact-head Tier C three-lens review. The eventual PR is one issue-level PR with `Refs #147` into `train/elements-first` only.
