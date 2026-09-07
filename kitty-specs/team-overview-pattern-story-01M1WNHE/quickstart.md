# Quickstart: Team overview pattern story

## Inspect the story

1. Install with `npm ci --ignore-scripts`.
2. Run `npx nx run storybook:storybook`.
3. Open **Patterns / Team Overview / ApprovedDark**.
4. Check the same fixture in LightMode, Narrow, Scale50WPs, ControlledInteractions, and
   EmptyPartialData.

## Targeted proof

```bash
npx playwright test apps/storybook/src/tests/sk-team-overview-pattern.spec.ts --project=chromium
npx playwright test apps/storybook/src/tests/sk-team-overview-pattern.spec.ts --project=firefox
node scripts/build-storybook-with-budget.mjs
node scripts/run-axe-storybook.js
```

Use the Storybook interaction panel to inspect one row, bar, and route event. Each event is
bubbling, composed, non-cancelable, and carries the child component's documented detail. Emitting
intent alone must not change controlled selection.

## Integrity checks

- €1,840 − €166 = €1,674.
- Full buckets: 320 + 410 + 340 + 604 = 1,674.
- Rounded attribution: 91%.
- Evidence path: €1,840 → 42 WPs → 6 missions → 2 verified.
- Transition cells total 62 moves.
- Status inventory 12 + 21 + 13 + 4 = 50 open WPs.
- Dates remain literal regardless of clock/timezone.
- Exactly one account identity appears above logout.

## Final gate

Run the complete command sequence in `docs/contributing/adding-a-component.md`, even though no new
component is added. Regenerated CEM, React, Vue, CSS/markup, token catalogue, SIZES, parts/docs, and
behavior/mutation artifacts must remain unchanged. Visual PNGs come from CI artifacts and require
manual comparison to the approved design.

The PR targets `train/elements-first` with `Refs #150`. Never target or merge `main`, publish,
or deploy.
