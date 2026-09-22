# Quickstart: Work Package view patterns

## Focused development loop

```bash
npm ci --ignore-scripts
npx nx run storybook:storybook:build
npx playwright test apps/storybook/src/tests/sk-work-package-view-patterns.spec.ts --project=chromium
node scripts/run-axe-storybook.js
```

Run the generated Storybook and inspect `Patterns/Work Package Views`. The default dark and
LightMode routes must show identical fixture-derived content; use the dedicated narrow stories
rather than adding a viewport observer to the render functions.

## Before review

```bash
node scripts/build-elements-css.mjs
node scripts/build-element-markup.mjs
npx nx run elements:analyze
node scripts/build-react-wrappers.mjs
node scripts/build-vue-types.mjs
npx nx run-many --target=build --projects=tokens,styles,elements
node scripts/measure-elements-sizes.mjs

node scripts/build-elements-css.mjs --check
node scripts/build-element-markup.mjs --check
node scripts/build-react-wrappers.mjs --check
node scripts/build-vue-types.mjs --check
node scripts/measure-elements-sizes.mjs --check
node scripts/typecheck-all.mjs
npm run quality:all
npm run test
node scripts/suite-selftest.mjs
npx nx run storybook:storybook:build
node scripts/run-axe-storybook.js
```

Then run the full configured Playwright and visual suites, release/offline checks, security gates,
and commitlint. Visual PNGs are Ubuntu-CI-authoritative; local images are diagnostic only.

## Final synchronization

Fetch and rebase on the latest `origin/train/elements-first`, regenerate shared artifacts, rerun
all affected tests, and push. A rebase or later push invalidates CI, zoom evidence, and every
adversarial review; rerun all of them against the new head.

The PR targets `train/elements-first` and contains `Refs #214` plus `part of #208`. Never merge the
train into `main` from this mission.
