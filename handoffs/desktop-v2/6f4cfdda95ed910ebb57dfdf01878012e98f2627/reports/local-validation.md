# Exact-S local validation

Source: `6f4cfdda95ed910ebb57dfdf01878012e98f2627` in a clean detached worktree at `/tmp/d1-stage-b-wp01.t4u3xU/s-worktree`.

## Lint

`npm run quality:all` exited 0. Nx lint completed for all 8 projects; Stylelint exited 0; HTMLHint scanned 163 files with no errors. ESLint emitted 59 warnings across elements and the behaviour fixture, with 0 errors. Raw stdout/stderr is retained at `reports/logs/quality-all.log`.

## Focused tests

`npx vitest run --project node --reporter=default tests/node/desktop-v2-contract.test.ts tests/node/desktop-v2-handoff.test.ts` exited 0: 2 files and 26 tests passed. The two files contributed 10 contract tests and 16 handoff tests. Raw stdout/stderr is retained at `reports/logs/focused-contract-handoff-vitest.log`.

## Package build

`npx nx run-many --target=build --projects=tokens,styles,elements,react` exited 0. Nx built tokens, styles and elements plus the elements CSS dependency. The React project has no build target; its generated source is the package artifact, and its wrapper-consistency check passed in the exact-S CI lint run. Raw stdout/stderr is retained at `reports/logs/package-build.log`.

## Storybook

`npx nx run storybook:storybook:build` exited 0 and completed successfully. Exact-S CI additionally ran `node scripts/check-desktop-v2-contract.mjs`, which confirmed 22 families, 110 states, generated stories and snapshot paths. Raw stdout/stderr is retained at `reports/logs/storybook-build.log`.

The complete CI run and job logs for the full tests, native axe and visual suites are linked from `gates.json`. No full native suite was rerun locally.
