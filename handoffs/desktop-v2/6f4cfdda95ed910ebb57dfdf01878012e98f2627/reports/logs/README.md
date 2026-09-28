# Exact-S command output archive

All local logs below were produced from a clean detached worktree at source S `6f4cfdda95ed910ebb57dfdf01878012e98f2627`. The log files contain the complete captured stdout/stderr for the named command; exit codes and positive counts are summarized in sibling `gates.json`.

| Gate / evidence | Command or archive | Result |
|---|---|---|
| Lint | `npm run quality:all` — `quality-all.log` | Exit 0; eight Nx lint projects, Stylelint, HTMLHint (163 files); 59 warnings, zero errors. |
| Focused contract/export tests | `npx vitest run --project node --reporter=default tests/node/desktop-v2-contract.test.ts tests/node/desktop-v2-handoff.test.ts` — `focused-contract-handoff-vitest.log` | Exit 0; 2 files, 26 tests passed. |
| Package build | `npx nx run-many --target=build --projects=tokens,styles,elements,react` — `package-build.log` | Exit 0; tokens/styles/elements built; React has no build target. |
| Storybook build | `npx nx run storybook:storybook:build` — `storybook-build.log` | Exit 0; build completed. |
| Export | Two additional fresh S exports — `export-c.log`, `export-d.log` | Both report 180 payload files and digest `26329fb7eecc0d19b662819b45de1eadd311656ce0838af8127e8df9cf8a5c59`; both compare byte-for-byte to the preserved `export-a`/`export-b` pair and retained artifact. |
| Visual inventory | `PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium --list` — `visual-inventory-list.log` | Exit 0; exactly 456 S test IDs enumerated. This is inventory only; the executed 456/456 result is from the linked exact-S CI job in `gates.json`. |
| Full test suite | [Exact-S CI test job](https://github.com/spec-kitty/spec-kitty-design/actions/runs/36457894235/job/109048811195) | Raw CI log is retained by GitHub Actions; `npm test`, 108 files / 1,532 tests passed. |
| Axe | [Exact-S CI axe job](https://github.com/spec-kitty/spec-kitty-design/actions/runs/36457894235/job/109049374667) | Raw CI log is retained by GitHub Actions; all 810 IDs and outcomes are extracted in `../axe-story-results.tsv`. |
| Visual execution | [Exact-S CI visual job](https://github.com/spec-kitty/spec-kitty-design/actions/runs/36457894235/job/109049374784) | Raw CI log is retained by GitHub Actions; 456 passed, zero failed/skipped. Contract-state snapshot mappings and complete test/snapshot inventories are in `../visual-mapping.json`; its stated mapping scope is intentionally explicit. |

The first local invocations predated this archive. The four local commands named above were rerun once at the same clean S after the raw-log retention gap was identified. No full test, axe, or visual suite was repeated locally.
