# Quickstart: verify Team Overview current-main evidence

From the repository root, use the root npm toolchain.

```sh
npm run quality:all
node scripts/typecheck-all.mjs
node scripts/check-pattern-composition.mjs --selftest
node scripts/check-pattern-composition.mjs
npm run test
npx nx run storybook:storybook:build
npx playwright test apps/storybook/src/tests/sk-team-overview-pattern.spec.ts --project=chromium
npx playwright test apps/storybook/src/tests/sk-team-overview-pattern.spec.ts
node scripts/gate-selftest.mjs
node scripts/run-axe-storybook.js
PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium
npx nx run elements:build
node scripts/measure-elements-sizes.mjs --check
```

The fixture assertions run within `npm run test`; this repository's coverage floors intentionally
make a single-file Vitest invocation fail even when that file passes. Inspect every replacement
Team Overview PNG, then repeat the focused Chromium and pattern-composition subset immediately
before push.
