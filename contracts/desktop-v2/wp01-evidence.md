# WP01 — Desktop V2 source-contract evidence

Evidence refreshed: 2026-09-28. These results were run locally in the lane against the committed source revision below.

## Tested source revision and ownership

- Tested source commit: 932756693c82cf9e9d313574f7ab2f604e347019
- Tested source tree: 10db02a2539a67ead38238e161961c5f85be24fd
- This file is a tracked, post-source evidence sidecar; it is intentionally outside `source-contract.json`, which contains no run result or self-referential SHA.
- All correction gates below were run against the tested source commit before this evidence file was added. The evidence commit follows that source commit.

## Rights basis and fail-closed boundary

- Each of the 22 required families records `sourceRights.status=cleared`, `spdx=MIT`, `basis=repository-license`, and root `LICENSE` as its evidence path. The `coveredPaths` arrays map all 140 inventoried authored CSS, markup, element, static-markup, and Storybook source files.
- The live checker verifies the root `LICENSE` declares MIT and that every family’s covered-path set exactly matches the authored path inventory; the full Vitest run includes deletion probes for missing MIT basis, missing `LICENSE` evidence, and removed authored-path coverage.
- Shared asset rights remain distinct from repository-code rights: Inter is OFL-1.1 with `packages/tokens/src/fonts/Inter-OFL.txt`; Falling Sky is OFL-1.1 based on the embedded font license documented in `packages/tokens/src/tokens.css` (including embedded-license OTF files); Swansea remains unresolved.
- `node scripts/check-desktop-v2-contract.mjs --require-exportable` fails closed because Swansea redistribution remains unresolved. Do not export the unchanged full token stylesheet.

## Gate outcomes

- `npx vitest run` — PASS, exit 0; 59 files and 815 tests passed, 0 skipped; both configured lanes were non-empty.
- `npx nx run storybook:storybook:build` — PASS, exit 0; Storybook build completed successfully.
- `node scripts/check-desktop-v2-contract.mjs` — PASS, exit 0; validated exactly 22 families and 110 independently required states, including generated Storybook story IDs and snapshot paths.
- `node scripts/check-desktop-v2-contract.mjs --require-exportable` — EXPECTED BLOCK, exit 1; Swansea is unresolved. This is the required fail-closed result, not a checker regression.
- `PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium --grep 'desktop-v2/'` — PASS, exit 0; all 110 Desktop V2 visual cases passed without updating snapshots.
- `PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium` — FAIL, exit 1; 456 tests enumerated, 251 passed and 205 existing non-Desktop visual-baseline tests failed. `test-results/.last-run.json` recorded 205 failed test IDs. The supplemental `PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium --reporter=dot` also exited 1 with the same 251/205 split. This is not a green full visual gate, and no unrelated baselines were updated.
- The 110 new Desktop V2 cases are the focused passing group above. Local screenshot output is not asserted equivalent to CI raster output; CI remains authoritative for portability/equivalence, and no CI-equivalence claim is made here.
- `node scripts/run-axe-storybook.js` — PASS, exit 0; 810/810 stories rendered, 0 timed out, and zero WCAG 2.1 AA violations. The 88 distinct Storybook story IDs referenced by the 110 contract states all appear among these passing results.
- `npx eslint scripts/check-desktop-v2-contract.mjs tests/node/desktop-v2-contract.test.ts` — exit 0, zero errors; ESLint reported the existing test file is ignored because no matching configuration was supplied.
- `git diff --check` — PASS, exit 0.

## Required-state story → visual test → snapshot map

Each row is one required contract state. Shared Storybook stories intentionally repeat where multiple states use the same source story.

| Family | State | Story source | Story ID | Export | Visual test ID | Snapshot path |
| --- | --- | --- | --- | --- | --- | --- |
| action-row | default-dark | packages/elements/src/action-row/sk-action-row.stories.ts | elements-skactionrow--default | Default | desktop-v2/action-row/default-dark | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-action-row-default-dark-chromium-linux.png |
| action-row | light-mode | packages/elements/src/action-row/sk-action-row.stories.ts | elements-skactionrow--light-mode | LightMode | desktop-v2/action-row/light-mode | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-action-row-light-mode-chromium-linux.png |
| action-row | responsive-narrow | packages/elements/src/action-row/sk-action-row.stories.ts | elements-skactionrow--long-content | LongContent | desktop-v2/action-row/responsive-narrow | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-action-row-responsive-narrow-chromium-linux.png |
| action-row | hover | packages/elements/src/action-row/sk-action-row.stories.ts | elements-skactionrow--default | Default | desktop-v2/action-row/hover | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-action-row-hover-chromium-linux.png |
| action-row | focus | packages/elements/src/action-row/sk-action-row.stories.ts | elements-skactionrow--default | Default | desktop-v2/action-row/focus | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-action-row-focus-chromium-linux.png |
| action-row | active | packages/elements/src/action-row/sk-action-row.stories.ts | elements-skactionrow--default | Default | desktop-v2/action-row/active | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-action-row-active-chromium-linux.png |
| action-row | selected | packages/elements/src/action-row/sk-action-row.stories.ts | elements-skactionrow--selected | Selected | desktop-v2/action-row/selected | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-action-row-selected-chromium-linux.png |
| app-shell | default-dark | packages/elements/src/app-shell/sk-app-shell.stories.ts | elements-skappshell--default | Default | desktop-v2/app-shell/default-dark | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-app-shell-default-dark-chromium-linux.png |
| app-shell | light-mode | packages/elements/src/app-shell/sk-app-shell.stories.ts | elements-skappshell--light-mode | LightMode | desktop-v2/app-shell/light-mode | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-app-shell-light-mode-chromium-linux.png |
| app-shell | responsive-narrow | packages/elements/src/app-shell/sk-app-shell.stories.ts | elements-skappshell--narrow | Narrow | desktop-v2/app-shell/responsive-narrow | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-app-shell-responsive-narrow-chromium-linux.png |
| app-shell | focus | packages/elements/src/app-shell/sk-app-shell.stories.ts | elements-skappshell--compact-open | CompactOpen | desktop-v2/app-shell/focus | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-app-shell-focus-chromium-linux.png |
| app-shell | compact-open | packages/elements/src/app-shell/sk-app-shell.stories.ts | elements-skappshell--compact-open | CompactOpen | desktop-v2/app-shell/compact-open | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-app-shell-compact-open-chromium-linux.png |
| app-shell | compact-closed | packages/elements/src/app-shell/sk-app-shell.stories.ts | elements-skappshell--compact-closed | CompactClosed | desktop-v2/app-shell/compact-closed | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-app-shell-compact-closed-chromium-linux.png |
| button | default-dark | packages/elements/src/button/sk-button.stories.ts | elements-skbutton--primary | Primary | desktop-v2/button/default-dark | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-button-default-dark-chromium-linux.png |
| button | light-mode | packages/elements/src/button/sk-button.stories.ts | elements-skbutton--light-mode | LightMode | desktop-v2/button/light-mode | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-button-light-mode-chromium-linux.png |
| button | responsive-narrow | packages/elements/src/button/sk-button.stories.ts | elements-skbutton--primary | Primary | desktop-v2/button/responsive-narrow | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-button-responsive-narrow-chromium-linux.png |
| button | hover | packages/elements/src/button/sk-button.stories.ts | elements-skbutton--primary | Primary | desktop-v2/button/hover | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-button-hover-chromium-linux.png |
| button | focus | packages/elements/src/button/sk-button.stories.ts | elements-skbutton--primary | Primary | desktop-v2/button/focus | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-button-focus-chromium-linux.png |
| button | active | packages/elements/src/button/sk-button.stories.ts | elements-skbutton--primary | Primary | desktop-v2/button/active | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-button-active-chromium-linux.png |
| button | disabled | packages/elements/src/button/sk-button.stories.ts | elements-skbutton--disabled | Disabled | desktop-v2/button/disabled | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-button-disabled-chromium-linux.png |
| card | default-dark | packages/elements/src/card/sk-card.stories.ts | elements-skcard--default | Default | desktop-v2/card/default-dark | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-card-default-dark-chromium-linux.png |
| card | light-mode | packages/elements/src/card/sk-card.stories.ts | elements-skcard--light-mode | LightMode | desktop-v2/card/light-mode | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-card-light-mode-chromium-linux.png |
| card | responsive-narrow | packages/elements/src/card/sk-card.stories.ts | elements-skcard--default | Default | desktop-v2/card/responsive-narrow | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-card-responsive-narrow-chromium-linux.png |
| card | hover | packages/elements/src/card/sk-card.stories.ts | elements-skcard--status-info | StatusInfo | desktop-v2/card/hover | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-card-hover-chromium-linux.png |
| context-sidebar | default-dark | packages/elements/src/context-sidebar/sk-context-sidebar.stories.ts | elements-skcontextsidebar--default | Default | desktop-v2/context-sidebar/default-dark | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-context-sidebar-default-dark-chromium-linux.png |
| context-sidebar | light-mode | packages/elements/src/context-sidebar/sk-context-sidebar.stories.ts | elements-skcontextsidebar--light-mode | LightMode | desktop-v2/context-sidebar/light-mode | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-context-sidebar-light-mode-chromium-linux.png |
| context-sidebar | responsive-narrow | packages/elements/src/context-sidebar/sk-context-sidebar.stories.ts | elements-skcontextsidebar--long-labels | LongLabels | desktop-v2/context-sidebar/responsive-narrow | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-context-sidebar-responsive-narrow-chromium-linux.png |
| data-table | default-dark | packages/styles/src/data-table/sk-data-table-html.stories.ts | primitives-skdatatable-html--default | Default | desktop-v2/data-table/default-dark | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-data-table-default-dark-chromium-linux.png |
| data-table | light-mode | packages/styles/src/data-table/sk-data-table-html.stories.ts | primitives-skdatatable-html--light-mode | LightMode | desktop-v2/data-table/light-mode | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-data-table-light-mode-chromium-linux.png |
| data-table | responsive-narrow | packages/styles/src/data-table/sk-data-table-html.stories.ts | primitives-skdatatable-html--narrow-scrollable | NarrowScrollable | desktop-v2/data-table/responsive-narrow | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-data-table-responsive-narrow-chromium-linux.png |
| data-table | hover | packages/styles/src/data-table/sk-data-table-html.stories.ts | primitives-skdatatable-html--default | Default | desktop-v2/data-table/hover | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-data-table-hover-chromium-linux.png |
| data-table | focus | packages/styles/src/data-table/sk-data-table-html.stories.ts | primitives-skdatatable-html--sticky-header | StickyHeader | desktop-v2/data-table/focus | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-data-table-focus-chromium-linux.png |
| data-table | sticky-header | packages/styles/src/data-table/sk-data-table-html.stories.ts | primitives-skdatatable-html--sticky-header | StickyHeader | desktop-v2/data-table/sticky-header | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-data-table-sticky-header-chromium-linux.png |
| disclosure | default-dark | packages/styles/src/disclosure/sk-disclosure-html.stories.ts | primitives-skdisclosure-html--closed | Closed | desktop-v2/disclosure/default-dark | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-disclosure-default-dark-chromium-linux.png |
| disclosure | light-mode | packages/styles/src/disclosure/sk-disclosure-html.stories.ts | primitives-skdisclosure-html--light-mode | LightMode | desktop-v2/disclosure/light-mode | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-disclosure-light-mode-chromium-linux.png |
| disclosure | responsive-narrow | packages/styles/src/disclosure/sk-disclosure-html.stories.ts | primitives-skdisclosure-html--long-body | LongBody | desktop-v2/disclosure/responsive-narrow | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-disclosure-responsive-narrow-chromium-linux.png |
| disclosure | focus | packages/styles/src/disclosure/sk-disclosure-html.stories.ts | primitives-skdisclosure-html--closed | Closed | desktop-v2/disclosure/focus | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-disclosure-focus-chromium-linux.png |
| disclosure | open | packages/styles/src/disclosure/sk-disclosure-html.stories.ts | primitives-skdisclosure-html--open | Open | desktop-v2/disclosure/open | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-disclosure-open-chromium-linux.png |
| empty-state | default-dark | packages/styles/src/empty-state/sk-empty-state-html.stories.ts | primitives-skemptystate-html--without-action | WithoutAction | desktop-v2/empty-state/default-dark | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-empty-state-default-dark-chromium-linux.png |
| empty-state | light-mode | packages/styles/src/empty-state/sk-empty-state-html.stories.ts | primitives-skemptystate-html--light-mode | LightMode | desktop-v2/empty-state/light-mode | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-empty-state-light-mode-chromium-linux.png |
| empty-state | responsive-narrow | packages/styles/src/empty-state/sk-empty-state-html.stories.ts | primitives-skemptystate-html--inline-long-narrow | InlineLongNarrow | desktop-v2/empty-state/responsive-narrow | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-empty-state-responsive-narrow-chromium-linux.png |
| empty-state | with-action | packages/styles/src/empty-state/sk-empty-state-html.stories.ts | primitives-skemptystate-html--with-action | WithAction | desktop-v2/empty-state/with-action | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-empty-state-with-action-chromium-linux.png |
| empty-state | without-action | packages/styles/src/empty-state/sk-empty-state-html.stories.ts | primitives-skemptystate-html--without-action | WithoutAction | desktop-v2/empty-state/without-action | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-empty-state-without-action-chromium-linux.png |
| event-timeline | default-dark | packages/styles/src/event-timeline/sk-event-timeline-html.stories.ts | primitives-skeventtimeline-html--default | Default | desktop-v2/event-timeline/default-dark | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-event-timeline-default-dark-chromium-linux.png |
| event-timeline | light-mode | packages/styles/src/event-timeline/sk-event-timeline-html.stories.ts | primitives-skeventtimeline-html--light-mode | LightMode | desktop-v2/event-timeline/light-mode | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-event-timeline-light-mode-chromium-linux.png |
| event-timeline | responsive-narrow | packages/styles/src/event-timeline/sk-event-timeline-html.stories.ts | primitives-skeventtimeline-html--narrow | Narrow | desktop-v2/event-timeline/responsive-narrow | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-event-timeline-responsive-narrow-chromium-linux.png |
| event-timeline | compact | packages/styles/src/event-timeline/sk-event-timeline-html.stories.ts | primitives-skeventtimeline-html--compact-default | CompactDefault | desktop-v2/event-timeline/compact | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-event-timeline-compact-chromium-linux.png |
| facts | default-dark | packages/styles/src/facts/sk-facts-html.stories.ts | primitives-skfacts-html--default | Default | desktop-v2/facts/default-dark | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-facts-default-dark-chromium-linux.png |
| facts | light-mode | packages/styles/src/facts/sk-facts-html.stories.ts | primitives-skfacts-html--light-mode | LightMode | desktop-v2/facts/light-mode | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-facts-light-mode-chromium-linux.png |
| facts | responsive-narrow | packages/styles/src/facts/sk-facts-html.stories.ts | primitives-skfacts-html--long-value | LongValue | desktop-v2/facts/responsive-narrow | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-facts-responsive-narrow-chromium-linux.png |
| facts | compact | packages/styles/src/facts/sk-facts-html.stories.ts | primitives-skfacts-html--compact | Compact | desktop-v2/facts/compact | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-facts-compact-chromium-linux.png |
| form-select | default-dark | packages/styles/src/form-select/sk-form-select-html.stories.ts | form-skformselect-html--default | Default | desktop-v2/form-select/default-dark | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-form-select-default-dark-chromium-linux.png |
| form-select | light-mode | packages/styles/src/form-select/sk-form-select-html.stories.ts | form-skformselect-html--light-mode | LightMode | desktop-v2/form-select/light-mode | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-form-select-light-mode-chromium-linux.png |
| form-select | responsive-narrow | packages/styles/src/form-select/sk-form-select-html.stories.ts | form-skformselect-html--narrow | Narrow | desktop-v2/form-select/responsive-narrow | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-form-select-responsive-narrow-chromium-linux.png |
| form-select | focus | packages/styles/src/form-select/sk-form-select-html.stories.ts | form-skformselect-html--default | Default | desktop-v2/form-select/focus | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-form-select-focus-chromium-linux.png |
| form-select | disabled | packages/styles/src/form-select/sk-form-select-html.stories.ts | form-skformselect-html--disabled | Disabled | desktop-v2/form-select/disabled | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-form-select-disabled-chromium-linux.png |
| form-select | invalid | packages/styles/src/form-select/sk-form-select-html.stories.ts | form-skformselect-html--required-invalid | RequiredInvalid | desktop-v2/form-select/invalid | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-form-select-invalid-chromium-linux.png |
| metric | default-dark | packages/elements/src/metric/sk-metric.stories.ts | elements-skmetric--default | Default | desktop-v2/metric/default-dark | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-metric-default-dark-chromium-linux.png |
| metric | light-mode | packages/elements/src/metric/sk-metric.stories.ts | elements-skmetric--light-mode | LightMode | desktop-v2/metric/light-mode | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-metric-light-mode-chromium-linux.png |
| metric | responsive-narrow | packages/elements/src/metric/sk-metric.stories.ts | elements-skmetric--long-content | LongContent | desktop-v2/metric/responsive-narrow | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-metric-responsive-narrow-chromium-linux.png |
| metric | compact | packages/elements/src/metric/sk-metric.stories.ts | elements-skmetric--compact | Compact | desktop-v2/metric/compact | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-metric-compact-chromium-linux.png |
| nav-pill | default-dark | packages/elements/src/nav-pill/sk-nav-pill.stories.ts | elements-sknavpill--default | Default | desktop-v2/nav-pill/default-dark | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-nav-pill-default-dark-chromium-linux.png |
| nav-pill | light-mode | packages/styles/src/nav-pill/sk-nav-pill.stories.ts | navigation-sknavpill-html--light-mode | LightMode | desktop-v2/nav-pill/light-mode | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-nav-pill-light-mode-chromium-linux.png |
| nav-pill | responsive-narrow | packages/styles/src/nav-pill/sk-nav-pill.stories.ts | navigation-sknavpill-html--mobile | Mobile | desktop-v2/nav-pill/responsive-narrow | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-nav-pill-responsive-narrow-chromium-linux.png |
| nav-pill | hover | packages/elements/src/nav-pill/sk-nav-pill.stories.ts | elements-sknavpill--default | Default | desktop-v2/nav-pill/hover | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-nav-pill-hover-chromium-linux.png |
| nav-pill | focus | packages/elements/src/nav-pill/sk-nav-pill.stories.ts | elements-sknavpill--default | Default | desktop-v2/nav-pill/focus | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-nav-pill-focus-chromium-linux.png |
| nav-pill | active | packages/styles/src/nav-pill/sk-nav-pill.stories.ts | navigation-sknavpill-html--active-item | ActiveItem | desktop-v2/nav-pill/active | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-nav-pill-active-chromium-linux.png |
| notice | default-dark | packages/elements/src/notice/sk-notice.stories.ts | elements-sknotice--default | Default | desktop-v2/notice/default-dark | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-notice-default-dark-chromium-linux.png |
| notice | light-mode | packages/elements/src/notice/sk-notice.stories.ts | elements-sknotice--light-mode | LightMode | desktop-v2/notice/light-mode | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-notice-light-mode-chromium-linux.png |
| notice | responsive-narrow | packages/elements/src/notice/sk-notice.stories.ts | elements-sknotice--long-message | LongMessage | desktop-v2/notice/responsive-narrow | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-notice-responsive-narrow-chromium-linux.png |
| notice | focus | packages/elements/src/notice/sk-notice.stories.ts | elements-sknotice--dismissible | Dismissible | desktop-v2/notice/focus | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-notice-focus-chromium-linux.png |
| notice | dismissible | packages/elements/src/notice/sk-notice.stories.ts | elements-sknotice--dismissible | Dismissible | desktop-v2/notice/dismissible | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-notice-dismissible-chromium-linux.png |
| page-header | default-dark | packages/elements/src/page-header/sk-page-header.stories.ts | elements-skpageheader--default | Default | desktop-v2/page-header/default-dark | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-page-header-default-dark-chromium-linux.png |
| page-header | light-mode | packages/elements/src/page-header/sk-page-header.stories.ts | elements-skpageheader--light-mode | LightMode | desktop-v2/page-header/light-mode | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-page-header-light-mode-chromium-linux.png |
| page-header | responsive-narrow | packages/elements/src/page-header/sk-page-header.stories.ts | elements-skpageheader--narrow-reflow | NarrowReflow | desktop-v2/page-header/responsive-narrow | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-page-header-responsive-narrow-chromium-linux.png |
| page-header | compact | packages/elements/src/page-header/sk-page-header.stories.ts | elements-skpageheader--compact | Compact | desktop-v2/page-header/compact | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-page-header-compact-chromium-linux.png |
| page-header | sticky | packages/elements/src/page-header/sk-page-header.stories.ts | elements-skpageheader--default-sticky | DefaultSticky | desktop-v2/page-header/sticky | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-page-header-sticky-chromium-linux.png |
| personal-rail | default-dark | packages/elements/src/personal-rail/sk-personal-rail.stories.ts | elements-skpersonalrail--default | Default | desktop-v2/personal-rail/default-dark | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-personal-rail-default-dark-chromium-linux.png |
| personal-rail | light-mode | packages/elements/src/personal-rail/sk-personal-rail.stories.ts | elements-skpersonalrail--light-mode | LightMode | desktop-v2/personal-rail/light-mode | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-personal-rail-light-mode-chromium-linux.png |
| personal-rail | responsive-narrow | packages/elements/src/personal-rail/sk-personal-rail.stories.ts | elements-skpersonalrail--long-labels | LongLabels | desktop-v2/personal-rail/responsive-narrow | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-personal-rail-responsive-narrow-chromium-linux.png |
| pill-tag | default-dark | packages/elements/src/pill-tag/sk-pill-tag.stories.ts | elements-skpilltag--default | Default | desktop-v2/pill-tag/default-dark | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-pill-tag-default-dark-chromium-linux.png |
| pill-tag | light-mode | packages/elements/src/pill-tag/sk-pill-tag.stories.ts | elements-skpilltag--light-mode | LightMode | desktop-v2/pill-tag/light-mode | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-pill-tag-light-mode-chromium-linux.png |
| pill-tag | responsive-narrow | packages/elements/src/pill-tag/sk-pill-tag.stories.ts | elements-skpilltag--long-label | LongLabel | desktop-v2/pill-tag/responsive-narrow | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-pill-tag-responsive-narrow-chromium-linux.png |
| pill-tag | variants | packages/elements/src/pill-tag/sk-pill-tag.stories.ts | elements-skpilltag--all-variants | AllVariants | desktop-v2/pill-tag/variants | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-pill-tag-variants-chromium-linux.png |
| progress | default-dark | packages/styles/src/progress/sk-progress-html.stories.ts | primitives-skprogress-html--default | Default | desktop-v2/progress/default-dark | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-progress-default-dark-chromium-linux.png |
| progress | light-mode | packages/styles/src/progress/sk-progress-html.stories.ts | primitives-skprogress-html--light-mode | LightMode | desktop-v2/progress/light-mode | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-progress-light-mode-chromium-linux.png |
| progress | responsive-narrow | packages/styles/src/progress/sk-progress-html.stories.ts | primitives-skprogress-html--narrow | Narrow | desktop-v2/progress/responsive-narrow | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-progress-responsive-narrow-chromium-linux.png |
| progress | indeterminate | packages/styles/src/progress/sk-progress-html.stories.ts | primitives-skprogress-html--indeterminate | Indeterminate | desktop-v2/progress/indeterminate | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-progress-indeterminate-chromium-linux.png |
| segmented-choice | default-dark | packages/styles/src/segmented-choice/sk-segmented-choice-html.stories.ts | components-sksegmentedchoice-html--default | Default | desktop-v2/segmented-choice/default-dark | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-segmented-choice-default-dark-chromium-linux.png |
| segmented-choice | light-mode | packages/styles/src/segmented-choice/sk-segmented-choice-html.stories.ts | components-sksegmentedchoice-html--light-mode | LightMode | desktop-v2/segmented-choice/light-mode | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-segmented-choice-light-mode-chromium-linux.png |
| segmented-choice | responsive-narrow | packages/styles/src/segmented-choice/sk-segmented-choice-html.stories.ts | components-sksegmentedchoice-html--narrow | Narrow | desktop-v2/segmented-choice/responsive-narrow | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-segmented-choice-responsive-narrow-chromium-linux.png |
| segmented-choice | hover | packages/styles/src/segmented-choice/sk-segmented-choice-html.stories.ts | components-sksegmentedchoice-html--default | Default | desktop-v2/segmented-choice/hover | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-segmented-choice-hover-chromium-linux.png |
| segmented-choice | focus | packages/styles/src/segmented-choice/sk-segmented-choice-html.stories.ts | components-sksegmentedchoice-html--default | Default | desktop-v2/segmented-choice/focus | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-segmented-choice-focus-chromium-linux.png |
| segmented-choice | active | packages/styles/src/segmented-choice/sk-segmented-choice-html.stories.ts | components-sksegmentedchoice-html--default | Default | desktop-v2/segmented-choice/active | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-segmented-choice-active-chromium-linux.png |
| segmented-choice | disabled | packages/styles/src/segmented-choice/sk-segmented-choice-html.stories.ts | components-sksegmentedchoice-html--one-disabled | OneDisabled | desktop-v2/segmented-choice/disabled | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-segmented-choice-disabled-chromium-linux.png |
| segmented-choice | selected | packages/styles/src/segmented-choice/sk-segmented-choice-html.stories.ts | components-sksegmentedchoice-html--second-selected | SecondSelected | desktop-v2/segmented-choice/selected | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-segmented-choice-selected-chromium-linux.png |
| status-indicator | default-dark | packages/elements/src/status-indicator/sk-status-indicator.stories.ts | elements-skstatusindicator--default | Default | desktop-v2/status-indicator/default-dark | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-status-indicator-default-dark-chromium-linux.png |
| status-indicator | light-mode | packages/elements/src/status-indicator/sk-status-indicator.stories.ts | elements-skstatusindicator--light-mode | LightMode | desktop-v2/status-indicator/light-mode | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-status-indicator-light-mode-chromium-linux.png |
| status-indicator | responsive-narrow | packages/elements/src/status-indicator/sk-status-indicator.stories.ts | elements-skstatusindicator--long-text | LongText | desktop-v2/status-indicator/responsive-narrow | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-status-indicator-responsive-narrow-chromium-linux.png |
| status-indicator | all-tones | packages/elements/src/status-indicator/sk-status-indicator.stories.ts | elements-skstatusindicator--all-tones | AllTones | desktop-v2/status-indicator/all-tones | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-status-indicator-all-tones-chromium-linux.png |
| status-indicator | pulsing | packages/elements/src/status-indicator/sk-status-indicator.stories.ts | elements-skstatusindicator--pulsing-states | PulsingStates | desktop-v2/status-indicator/pulsing | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-status-indicator-pulsing-chromium-linux.png |
| workflow-board | default-dark | packages/styles/src/workflow-board/sk-workflow-board-html.stories.ts | primitives-skworkflowboard-html--populated | Populated | desktop-v2/workflow-board/default-dark | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-workflow-board-default-dark-chromium-linux.png |
| workflow-board | light-mode | packages/styles/src/workflow-board/sk-workflow-board-html.stories.ts | primitives-skworkflowboard-html--light-mode | LightMode | desktop-v2/workflow-board/light-mode | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-workflow-board-light-mode-chromium-linux.png |
| workflow-board | responsive-narrow | packages/styles/src/workflow-board/sk-workflow-board-html.stories.ts | primitives-skworkflowboard-html--single-lane-narrow | SingleLaneNarrow | desktop-v2/workflow-board/responsive-narrow | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-workflow-board-responsive-narrow-chromium-linux.png |
| workflow-board | focus | packages/styles/src/workflow-board/sk-workflow-board-html.stories.ts | primitives-skworkflowboard-html--populated | Populated | desktop-v2/workflow-board/focus | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-workflow-board-focus-chromium-linux.png |
| workflow-board | empty | packages/styles/src/workflow-board/sk-workflow-board-html.stories.ts | primitives-skworkflowboard-html--all-empty | AllEmpty | desktop-v2/workflow-board/empty | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-workflow-board-empty-chromium-linux.png |
| workflow-lane | default-dark | packages/styles/src/workflow-lane/sk-workflow-lane-html.stories.ts | primitives-skworkflowlane-html--default | Default | desktop-v2/workflow-lane/default-dark | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-workflow-lane-default-dark-chromium-linux.png |
| workflow-lane | light-mode | packages/styles/src/workflow-lane/sk-workflow-lane-html.stories.ts | primitives-skworkflowlane-html--light-mode | LightMode | desktop-v2/workflow-lane/light-mode | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-workflow-lane-light-mode-chromium-linux.png |
| workflow-lane | responsive-narrow | packages/styles/src/workflow-lane/sk-workflow-lane-html.stories.ts | primitives-skworkflowlane-html--default | Default | desktop-v2/workflow-lane/responsive-narrow | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-workflow-lane-responsive-narrow-chromium-linux.png |
| workflow-lane | empty | packages/styles/src/workflow-lane/sk-workflow-lane-html.stories.ts | primitives-skworkflowlane-html--empty | Empty | desktop-v2/workflow-lane/empty | apps/storybook/src/tests/visual.spec.ts-snapshots/desktop-v2-workflow-lane-empty-chromium-linux.png |

## Per-story axe outcomes

The following are the runner’s 810 individual successful story result lines (preflight success lines are omitted). Every listed result is a pass; summary above records render count, timeout count, and WCAG outcome.

```
✅ elements-skactionrow--default
✅ elements-skactionrow--native-list
✅ elements-skactionrow--selected
✅ elements-skactionrow--non-selectable
✅ elements-skactionrow--with-controls
✅ elements-skactionrow--route
✅ elements-skactionrow--route-flush
✅ elements-skactionrow--button-flush
✅ elements-skactionrow--selected-flush
✅ elements-skactionrow--route-selected
✅ elements-skactionrow--unknown-presentation
✅ elements-skactionrow--forced-colors
✅ elements-skactionrow--long-content
✅ elements-skactionrow--selectable-states
✅ elements-skactionrow--card-states
✅ elements-skactionrow--card-long-content
✅ elements-skactionrow--t-10-compact-item
✅ elements-skactionrow--t-10-compact-item-light-mode
✅ elements-skactionrow--light-mode
✅ elements-skactionrow--route-flush-light-mode
✅ elements-skappshell--default
✅ elements-skappshell--desktop-composition
✅ elements-skappshell--narrow
✅ elements-skappshell--compact-closed
✅ elements-skappshell--compact-open
✅ elements-skappshell--compact-390
✅ elements-skappshell--compact-768
✅ elements-skappshell--compact-860
✅ elements-skappshell--compact-861
✅ elements-skappshell--compact-long-labels
✅ elements-skappshell--compact-short-viewport
✅ elements-skappshell--compact-tall-viewport
✅ elements-skappshell--reduced-motion
✅ elements-skappshell--forced-colors
✅ elements-skappshell--rail-preserving-closed
✅ elements-skappshell--rail-preserving-open
✅ elements-skappshell--rail-preserving-390
✅ elements-skappshell--rail-preserving-768
✅ elements-skappshell--rail-preserving-1024
✅ elements-skappshell--rail-preserving-1100
✅ elements-skappshell--rail-preserving-1101
✅ elements-skappshell--rail-preserving-wide
✅ elements-skappshell--rail-preserving-long-labels
✅ elements-skappshell--rail-preserving-short-viewport
✅ elements-skappshell--rail-preserving-tall-viewport
✅ elements-skappshell--rail-preserving-reduced-motion
✅ elements-skappshell--rail-preserving-forced-colors
✅ elements-skappshell--rail-preserving-light-mode
✅ elements-skappshell--empty-regions
✅ elements-skappshell--light-mode
✅ elements-skbarchart--default
✅ elements-skbarchart--close-values
✅ elements-skbarchart--zero-values
✅ elements-skbarchart--empty
✅ elements-skbarchart--long-labels
✅ elements-skbarchart--controlled-selection
✅ elements-skbarchart--selectable-states
✅ elements-skbarchart--light-mode
✅ elements-skblogcard--default
✅ elements-skblogcard--without-image
✅ elements-skblogcard--without-eyebrow
✅ elements-skblogcard--long-title
✅ elements-skblogcard--light-mode
✅ elements-skbutton--primary
✅ elements-skbutton--secondary
✅ elements-skbutton--ghost
✅ elements-skbutton--danger-secondary
✅ elements-skbutton--small
✅ elements-skbutton--as-link
✅ elements-skbutton--disabled
✅ elements-skbutton--icon
✅ elements-skbutton--icon-link
✅ elements-skbutton--icon-focus
✅ elements-skbutton--busy
✅ elements-skbutton--busy-small
✅ elements-skbutton--busy-icon
✅ elements-skbutton--busy-disabled
✅ elements-skbutton--busy-aria-disabled
✅ elements-skbutton--danger-secondary-icon
✅ elements-skbutton--danger-secondary-focus
✅ elements-skbutton--danger-secondary-disabled
✅ elements-skbutton--danger-secondary-busy
✅ elements-skbutton--all-variants
✅ elements-skbutton--light-mode
✅ elements-skbutton--forced-colors
✅ elements-skcard--default
✅ elements-skcard--blue
✅ elements-skcard--purple
✅ elements-skcard--inset
✅ elements-skcard--status-neutral
✅ elements-skcard--status-info
✅ elements-skcard--status-success
✅ elements-skcard--status-attention
✅ elements-skcard--status-danger
✅ elements-skcard--status-recovery
✅ elements-skcard--all-statuses
✅ elements-skcard--status-with-variant
✅ elements-skcard--status-card-composition
✅ elements-skcard--unknown-status
✅ elements-skcard--greyscale
✅ elements-skcard--forced-colors
✅ elements-skcard--light-mode
✅ elements-skcheckbullet--default
✅ elements-skcheckbullet--single
✅ elements-skcheckbullet--complete
✅ elements-skcheckbullet--pending
✅ elements-skcheckbullet--mixed
✅ elements-skcheckbullet--long-items
✅ elements-skcheckbullet--no-subtasks
✅ elements-skcheckbullet--fifty-items
✅ elements-skcheckbullet--custom-icon
✅ elements-skcheckbullet--light-mode
✅ elements-skconfirmdialog--closed
✅ elements-skconfirmdialog--open-short-body
✅ elements-skconfirmdialog--open-long-scrolling-body
✅ elements-skconfirmdialog--different-length-labels
✅ elements-skconfirmdialog--wrapping-title
✅ elements-skconfirmdialog--default
✅ elements-skconfirmdialog--light-mode
✅ elements-skconfirmdialog--reduced-motion
✅ elements-skconfirmdialog--forced-colors
✅ elements-skconfirmdialog--rtl
✅ elements-skconfirmdialog--narrow-width
✅ elements-skcontextsidebar--default
✅ elements-skcontextsidebar--long-labels
✅ elements-skcontextsidebar--empty
✅ elements-skcontextsidebar--light-mode
✅ elements-skcopyfield--default
✅ elements-skcopyfield--hover
✅ elements-skcopyfield--focused
✅ elements-skcopyfield--active
✅ elements-skcopyfield--disabled-empty
✅ elements-skcopyfield--long-wrapping-command
✅ elements-skcopyfield--quotes-and-unicode
✅ elements-skcopyfield--copied-success
✅ elements-skcopyfield--manual-fallback
✅ elements-skcopyfield--failure
✅ elements-skcopyfield--repeated-and-multiple
✅ elements-skcopyfield--narrow
✅ elements-skcopyfield--forced-colors
✅ elements-skcopyfield--default-dark
✅ elements-skcopyfield--light-mode
✅ elements-skentitymarker--initials
✅ elements-skentitymarker--meaningful-icon
✅ elements-skentitymarker--decorative
✅ elements-skentitymarker--axis-matrix
✅ elements-skentitymarker--image-naming
✅ elements-skentitymarker--large-size
✅ elements-skentitymarker--image-naming-large-size
✅ elements-skentitymarker--bordered-axis-matrix
✅ elements-skentitymarker--bordered-outer-box-comparison
✅ elements-skentitymarker--bordered-forced-colors
✅ elements-skentitymarker--long-label
✅ elements-skentitymarker--compact-circle-light-mode
✅ elements-skentitymarker--light-mode
✅ elements-skevidencechain--default
✅ elements-skevidencechain--approved-example
✅ elements-skevidencechain--two-stages
✅ elements-skevidencechain--six-stages
✅ elements-skevidencechain--narrow
✅ elements-skevidencechain--long-content
✅ elements-skevidencechain--empty
✅ elements-skevidencechain--invalid-input
✅ elements-skevidencechain--light-mode
✅ elements-skfeaturecard--default
✅ elements-skfeaturecard--yellow
✅ elements-skfeaturecard--green
✅ elements-skfeaturecard--purple
✅ elements-skfeaturecard--bordered-variants
✅ elements-skfeaturecard--mixed-axes
✅ elements-skfeaturecard--light-mode
✅ elements-skforminput--default
✅ elements-skforminput--filled
✅ elements-skforminput--error
✅ elements-skforminput--disabled
✅ elements-skforminput--light-mode
✅ elements-skforminput--light-mode-error
✅ elements-skforminput--constraints
✅ elements-skforminput--read-only
✅ elements-skforminput--datalist
✅ elements-skformtextarea--default
✅ elements-skformtextarea--filled
✅ elements-skformtextarea--error
✅ elements-skformtextarea--disabled
✅ elements-skformtextarea--light-mode
✅ elements-skformtextarea--light-mode-error
✅ elements-skgrid--default
✅ elements-skgrid--two-column
✅ elements-skgrid--three-column
✅ elements-skgrid--four-column
✅ elements-skgrid--wide-gap
✅ elements-skgrid--responsive
✅ elements-skgrid--light-mode
✅ elements-skmetric--default
✅ elements-skmetric--with-annotation
✅ elements-skmetric--tones
✅ elements-skmetric--compact
✅ elements-skmetric--long-content
✅ elements-skmetric--light-mode
✅ elements-sknavpill--default
✅ elements-sknavpill--open
✅ elements-sknotice--default
✅ elements-sknotice--neutral
✅ elements-sknotice--info
✅ elements-sknotice--success
✅ elements-sknotice--attention
✅ elements-sknotice--danger
✅ elements-sknotice--recovery
✅ elements-sknotice--all-tones
✅ elements-sknotice--announce-off
✅ elements-sknotice--announce-polite
✅ elements-sknotice--announce-assertive
✅ elements-sknotice--message-change
✅ elements-sknotice--dismissible
✅ elements-sknotice--long-message
✅ elements-sknotice--multi-paragraph-body
✅ elements-sknotice--trailing-actions
✅ elements-sknotice--with-status-indicator
✅ elements-sknotice--greyscale
✅ elements-sknotice--forced-colors
✅ elements-sknotice--light-mode
✅ elements-skpageheader--default
✅ elements-skpageheader--long-title
✅ elements-skpageheader--without-metadata
✅ elements-skpageheader--light-mode
✅ elements-skpageheader--compact
✅ elements-skpageheader--density-comparison
✅ elements-skpageheader--compact-sticky
✅ elements-skpageheader--default-sticky
✅ elements-skpageheader--narrow-reflow
✅ elements-skpageheader--short-viewport
✅ elements-skpageheader--compact-truncation
✅ elements-skpageheader--compact-sticky-light-mode
✅ patterns-account-front-door--landing
✅ patterns-account-front-door--entry-boundary
✅ patterns-account-front-door--submitted-validation
✅ patterns-account-front-door--recovery-sent
✅ patterns-account-front-door--terminal-inactive
✅ patterns-account-front-door--legal-published
✅ patterns-account-front-door--legal-unavailable
✅ patterns-account-front-door--email-management
✅ patterns-account-front-door--password-change
✅ patterns-account-front-door--password-set
✅ patterns-account-front-door--light-mode
✅ patterns-account-front-door--legal-light-mode
✅ patterns-account-front-door--account-light-mode
✅ patterns-account-front-door--forced-colors
✅ patterns-account-front-door--reduced-motion
✅ patterns-account-front-door--rtl
✅ patterns-account-front-door--narrow-390
✅ patterns-account-front-door--short-viewport
✅ patterns-account-front-door--zoom-200
✅ patterns-account-front-door--long-strings
✅ patterns-cli-auth--code-entry-default
✅ patterns-cli-auth--code-entry-invalid
✅ patterns-cli-auth--code-entry-light-mode
✅ patterns-cli-auth--authorization-decision
✅ patterns-cli-auth--authorization-decision-light-mode
✅ patterns-cli-auth--terminal-success
✅ patterns-cli-auth--terminal-success-light-mode
✅ patterns-cli-auth--terminal-denied
✅ patterns-cli-auth--terminal-denied-light-mode
✅ patterns-cli-auth--terminal-error-no-action
✅ patterns-cli-auth--terminal-error-no-action-light-mode
✅ patterns-cli-auth--terminal-error-with-action
✅ patterns-cli-auth--terminal-error-with-action-light-mode
✅ patterns-connectors--c-1-setup-admin-empty
✅ patterns-connectors--c-2-operating-admin
✅ patterns-connectors--c-2-operating-member
✅ patterns-connectors--c-3-handoff-installation-waiting
✅ patterns-connectors--c-3-handoff-reconnect-completing
✅ patterns-connectors--c-3-handoff-user-link-failed
✅ patterns-connectors--c-4-github-app-failure-resolved-team
✅ patterns-connectors--c-4-github-app-failure-no-team-boundary
✅ patterns-connectors--c-5-gitlab-group-populated
✅ patterns-connectors--c-5-gitlab-group-no-groups
✅ patterns-connectors--c-5-gitlab-group-validation
✅ patterns-connectors--c-5-gitlab-group-connected-refresh-failed
✅ patterns-connectors--c-9-b-slack-channel-populated
✅ patterns-connectors--c-9-b-slack-channel-empty
✅ patterns-connectors--c-9-b-slack-channel-refused
✅ patterns-connectors--c-9-b-slack-channel-rate-limited
✅ patterns-connectors--c-9-b-slack-channel-incomplete
✅ patterns-connectors--c-6-installation-admin-active
✅ patterns-connectors--c-6-installation-member-active
✅ patterns-connectors--c-6-installation-health-degraded
✅ patterns-connectors--c-6-installation-health-revoked
✅ patterns-connectors--c-6-installation-health-needs-reauth
✅ patterns-connectors--c-7-workspace-scope-populated
✅ patterns-connectors--c-7-workspace-scope-empty
✅ patterns-connectors--c-7-workspace-scope-unavailable
✅ patterns-connectors--c-7-workspace-scope-stale-after-refresh-failure
✅ patterns-connectors--c-7-workspace-scope-member-boundary
✅ patterns-connectors--c-8-project-routing-populated
✅ patterns-connectors--c-8-project-routing-empty
✅ patterns-connectors--c-8-project-routing-validation
✅ patterns-connectors--c-8-project-routing-jira-rescue
✅ patterns-connectors--c-8-project-routing-purge-confirm
✅ patterns-connectors--c-9-a-team-accounts-admin-active
✅ patterns-connectors--c-9-a-team-accounts-admin-unhealthy
✅ patterns-connectors--c-9-a-team-accounts-member-unlinked
✅ patterns-connectors--c-9-a-team-accounts-member-empty
✅ patterns-connectors--light-mode
✅ patterns-mission-kanban-ten-lane--default
✅ patterns-mission-kanban-ten-lane--k-2-narrow-contained
✅ patterns-mission-kanban-ten-lane--k-3-filtered-lanes
✅ patterns-mission-kanban-ten-lane--k-4-snapshot-behind-log
✅ patterns-mission-kanban-ten-lane--k-5-unverified-overlay
✅ patterns-mission-kanban-ten-lane--k-6-empty-lanes
✅ patterns-mission-kanban-ten-lane--light-mode
✅ patterns-mission-kanban-ten-lane--long-content
✅ patterns-mission-kanban-ten-lane--forced-colors
✅ patterns-mission-kanban-ten-lane--reduced-motion
✅ patterns-mission-kanban-ten-lane--rtl
✅ patterns-mission-kanban--default
✅ patterns-mission-kanban--k-2-narrow-contained
✅ patterns-mission-kanban--k-3-detailed-lane-filters
✅ patterns-mission-kanban--k-4-snapshot-behind-log
✅ patterns-mission-kanban--k-5-observed-not-yet-pushed
✅ patterns-mission-kanban--k-6-stable-empty-board
✅ patterns-mission-kanban--light-mode
✅ patterns-mission-kanban--long-content
✅ patterns-mission-kanban--forced-colors
✅ patterns-mission-kanban--reduced-motion
✅ patterns-mission-reading--default
✅ patterns-mission-reading--m-2-responsive-390
✅ patterns-mission-reading--m-2-controlled-drawer-open
✅ patterns-mission-reading--m-3-fragment-loading
✅ patterns-mission-reading--m-4-canonical-page-unavailable
✅ patterns-mission-reading--m-5-snapshot-behind-log
✅ patterns-mission-reading--m-6-a-other-artifacts-present
✅ patterns-mission-reading--m-6-b-other-artifacts-absent
✅ patterns-mission-reading--m-7-a-ops-present
✅ patterns-mission-reading--m-7-b-ops-absent
✅ patterns-mission-reading--m-8-truth-regions
✅ patterns-mission-reading--light-mode
✅ patterns-mission-reading--long-content
✅ patterns-mission-reading--rtl
✅ patterns-operational-status--default
✅ patterns-operational-status--light-mode
✅ patterns-operational-status--system-light
✅ patterns-operational-status--system-dark
✅ patterns-operational-status--manual-light
✅ patterns-operational-status--manual-dark
✅ patterns-operational-status--greyscale
✅ patterns-operational-status--forced-colors
✅ patterns-operational-status--narrow
✅ patterns-operational-status--zoom-200
✅ patterns-operational-status--without-banner
✅ patterns-operational-status--complete-series
✅ patterns-repository-dossier--default
✅ patterns-repository-dossier--d-2-narrow-closed
✅ patterns-repository-dossier--d-2-narrow-open
✅ patterns-repository-dossier--d-4-cross-branch
✅ patterns-repository-dossier--d-5-not-spec-kitty
✅ patterns-repository-dossier--d-6-snapshot-behind-log
✅ patterns-repository-dossier--d-7-indexing
✅ patterns-repository-dossier--d-8-no-missions
✅ patterns-repository-dossier--light-mode
✅ patterns-repository-dossier--long-data
✅ patterns-repository-dossier--progress-thresholds
✅ patterns-repository-dossier--layout-threshold-860
✅ patterns-repository-dossier--layout-threshold-861
✅ patterns-repository-dossier--tracker-destinations
✅ patterns-repository-dossier--forced-colors
✅ patterns-repository-dossier--reduced-motion
✅ patterns-repository-dossier--zoom-200
✅ patterns-repository-dossier--zoom-400
✅ patterns-team-overview--default
✅ patterns-team-overview--light-mode
✅ patterns-team-overview--narrow
✅ patterns-team-overview--scale-50-w-ps
✅ patterns-team-overview--controlled-interactions
✅ patterns-team-overview--empty-partial-data
✅ patterns-work-explorer--w-1-by-lane-desktop-dark
✅ patterns-work-explorer--w-2-by-person-desktop-dark
✅ patterns-work-explorer--w-3-by-type-desktop-dark
✅ patterns-work-explorer--w-4-by-lane-1024-dark
✅ patterns-work-explorer--w-5-by-lane-light-mode
✅ patterns-work-explorer--w-6-filtered-empty-dark
✅ patterns-work-explorer--w-7-no-active-work-dark
✅ patterns-work-explorer--w-8-degraded-context-dark
✅ patterns-work-explorer--w-9-loading-dark
✅ patterns-work-explorer--w-10-no-admitted-repositories-dark
✅ patterns-work-package-views--default
✅ patterns-work-package-views--light-mode
✅ patterns-work-package-views--all-lanes-empty
✅ patterns-work-package-views--scale-50-work-packages
✅ patterns-work-package-views--live-claim
✅ patterns-work-package-views--stale-claim
✅ patterns-work-package-views--snapshot-behind-log
✅ patterns-work-package-views--narrow-overview
✅ patterns-work-package-views--detail-populated
✅ patterns-work-package-views--detail-light-mode
✅ patterns-work-package-views--detail-no-subtasks
✅ patterns-work-package-views--detail-absent-prompt
✅ patterns-work-package-views--detail-history-unavailable
✅ patterns-work-package-views--detail-long-content
✅ patterns-work-package-views--detail-narrow
✅ elements-skpersonalrail--default
✅ elements-skpersonalrail--long-labels
✅ elements-skpersonalrail--empty-groups
✅ elements-skpersonalrail--light-mode
✅ elements-skpilltag--default
✅ elements-skpilltag--green
✅ elements-skpilltag--purple
✅ elements-skpilltag--breaking
✅ elements-skpilltag--yellow
✅ elements-skpilltag--eyebrow
✅ elements-skpilltag--tinted-eyebrow
✅ elements-skpilltag--all-variants
✅ elements-skpilltag--status-neutral
✅ elements-skpilltag--status-info
✅ elements-skpilltag--status-success
✅ elements-skpilltag--status-attention
✅ elements-skpilltag--status-danger
✅ elements-skpilltag--status-recovery
✅ elements-skpilltag--all-statuses
✅ elements-skpilltag--brand-with-status
✅ elements-skpilltag--eyebrow-with-status
✅ elements-skpilltag--long-label
✅ elements-skpilltag--rtl
✅ elements-skpilltag--zoom-200
✅ elements-skpilltag--unknown-status
✅ elements-skpilltag--forced-colors
✅ elements-skpilltag--light-mode
✅ elements-skribboncard--default
✅ elements-skribboncard--with-ribbon
✅ elements-skribboncard--ribbon-colours
✅ elements-skribboncard--bordered-variants
✅ elements-skribboncard--light-mode
✅ elements-sksectionbanner--default
✅ elements-sksectionbanner--neutral
✅ elements-sksectionbanner--purple
✅ elements-sksectionbanner--green
✅ elements-sksectionbanner--all-variants
✅ elements-sksectionbanner--light-mode
✅ elements-sksectionheader--default
✅ elements-sksectionheader--with-metadata-and-action
✅ elements-sksectionheader--long-content
✅ elements-sksectionheader--light-mode
✅ elements-sksitefooter--default
✅ elements-sksitefooter--without-legal
✅ elements-sksitefooter--light-mode
✅ elements-sksitefooter--compact
✅ elements-sksitefooter--compact-no-links
✅ elements-sksitefooter--compact-several-links
✅ elements-sksitefooter--compact-short-label
✅ elements-sksitefooter--compact-without-legal
✅ elements-sksitefooter--compact-long-content
✅ elements-sksitefooter--compact-rtl
✅ elements-sksitefooter--compact-light-mode
✅ elements-skstatusindicator--default
✅ elements-skstatusindicator--all-tones
✅ elements-skstatusindicator--long-text
✅ elements-skstatusindicator--pulsing-states
✅ elements-skstatusindicator--multiple-pulsing-all-tones
✅ elements-skstatusindicator--pulsing-preferences
✅ elements-skstatusindicator--pulsing-light-mode
✅ elements-skstatusindicator--light-mode
✅ elements-skstub--default
✅ elements-skstub--light-mode
✅ elements-skthemetoggle--default
✅ elements-skthemetoggle--system
✅ elements-skthemetoggle--manual-light
✅ elements-skthemetoggle--greyscale
✅ elements-skthemetoggle--forced-colors
✅ elements-skthemetoggle--narrow
✅ elements-skthemetoggle--light-mode
✅ elements-sktimeserieschart--default
✅ elements-sktimeserieschart--interior-gap
✅ elements-sktimeserieschart--annotated-gap
✅ elements-sktimeserieschart--leading-and-trailing-gaps
✅ elements-sktimeserieschart--entirely-unobserved
✅ elements-sktimeserieschart--mixed-resolution
✅ elements-sktimeserieschart--unequal-spacing
✅ elements-sktimeserieschart--dense-series
✅ elements-sktimeserieschart--multiple-series
✅ elements-sktimeserieschart--single-point
✅ elements-sktimeserieschart--empty
✅ elements-sktimeserieschart--controlled-selection
✅ elements-sktimeserieschart--narrow-viewport
✅ elements-sktimeserieschart--light-mode
✅ elements-sktransitionmatrix--default
✅ elements-sktransitionmatrix--approved-example
✅ elements-sktransitionmatrix--fifty-active-w-ps
✅ elements-sktransitionmatrix--sparse-data
✅ elements-sktransitionmatrix--equal-totals-different-distribution
✅ elements-sktransitionmatrix--empty
✅ elements-sktransitionmatrix--controlled-selection
✅ elements-sktransitionmatrix--selectable-states
✅ elements-sktransitionmatrix--light-mode
✅ primitives-skactionrow-html--default
✅ primitives-skactionrow-html--collection
✅ primitives-skactionrow-html--static-trigger
✅ primitives-skactionrow-html--route
✅ primitives-skactionrow-html--current
✅ primitives-skactionrow-html--route-current
✅ primitives-skactionrow-html--flush
✅ primitives-skactionrow-html--card
✅ primitives-skactionrow-html--without-mark
✅ primitives-skactionrow-html--sparse
✅ primitives-skactionrow-html--several-controls
✅ primitives-skactionrow-html--without-controls
✅ primitives-skactionrow-html--route-with-controls
✅ primitives-skactionrow-html--long-content-narrow
✅ primitives-skactionrow-html--long-content-desktop
✅ primitives-skactionrow-html--rtl
✅ primitives-skactionrow-html--zoom-200
✅ primitives-skactionrow-html--forced-colors
✅ primitives-skactionrow-html--reduced-motion
✅ primitives-skactionrow-html--light-mode
✅ components-skblogcard--default
✅ components-skblogcard--without-image
✅ components-skblogcard--without-eyebrow
✅ components-skblogcard--title-only
✅ components-skblogcard--long-title
✅ components-skblogcard--light-mode
✅ components-skboundarypage-html--form-card
✅ components-skboundarypage-html--terminal-card
✅ components-skboundarypage-html--without-mark
✅ components-skboundarypage-html--without-footnote
✅ components-skboundarypage-html--with-footnote
✅ components-skboundarypage-html--several-actions
✅ components-skboundarypage-html--no-action
✅ components-skboundarypage-html--long-identifier
✅ components-skboundarypage-html--long-email
✅ components-skboundarypage-html--forced-colors
✅ components-skboundarypage-html--light-mode
✅ primitives-skbreadcrumbs-html--default
✅ primitives-skbreadcrumbs-html--one-level
✅ primitives-skbreadcrumbs-html--three-level
✅ primitives-skbreadcrumbs-html--six-level
✅ primitives-skbreadcrumbs-html--long-labels
✅ primitives-skbreadcrumbs-html--narrow
✅ primitives-skbreadcrumbs-html--forced-colors
✅ primitives-skbreadcrumbs-html--light-mode
✅ components-button-html--default
✅ components-button-html--secondary
✅ components-button-html--ghost
✅ components-button-html--danger-secondary
✅ components-button-html--small
✅ components-button-html--link
✅ components-button-html--busy
✅ components-button-html--disabled
✅ components-button-html--all-variants
✅ components-button-html--light-mode
✅ components-card--default
✅ components-card--blue
✅ components-card--purple
✅ components-card--inset
✅ components-card--blog-card-example
✅ components-card--statuses
✅ components-card--statuses-greyscale
✅ components-card--light-mode
✅ primitives-skcheckbullet-html--default
✅ primitives-skcheckbullet-html--list-of-three
✅ primitives-skcheckbullet-html--complete
✅ primitives-skcheckbullet-html--pending
✅ primitives-skcheckbullet-html--mixed
✅ primitives-skcheckbullet-html--light-mode
✅ form-skcheckboxchoicegroup-html--default
✅ form-skcheckboxchoicegroup-html--k-3-detailed-lane-filters
✅ form-skcheckboxchoicegroup-html--none-selected
✅ form-skcheckboxchoicegroup-html--several-selected
✅ form-skcheckboxchoicegroup-html--zero-counts
✅ form-skcheckboxchoicegroup-html--disabled-choices
✅ form-skcheckboxchoicegroup-html--long-content
✅ form-skcheckboxchoicegroup-html--narrow
✅ form-skcheckboxchoicegroup-html--focus-states
✅ form-skcheckboxchoicegroup-html--forced-colors
✅ form-skcheckboxchoicegroup-html--default-dark
✅ form-skcheckboxchoicegroup-html--light-mode
✅ primitives-skcollection-html--default
✅ primitives-skcollection-html--closed
✅ primitives-skcollection-html--one-item
✅ primitives-skcollection-html--fifty-items
✅ primitives-skcollection-html--empty
✅ primitives-skcollection-html--no-count
✅ primitives-skcollection-html--no-footer
✅ primitives-skcollection-html--long-text
✅ primitives-skcollection-html--narrow
✅ primitives-skcollection-html--forced-colors
✅ primitives-skcollection-html--blocked
✅ primitives-skcollection-html--blocked-light-mode
✅ primitives-skcollection-html--blocked-forced-colors
✅ primitives-skcollection-html--light-mode
✅ navigation-skcontextnav-html--default
✅ navigation-skcontextnav-html--current-top-level
✅ navigation-skcontextnav-html--current-nested
✅ navigation-skcontextnav-html--current-parent
✅ navigation-skcontextnav-html--no-current
✅ navigation-skcontextnav-html--empty
✅ navigation-skcontextnav-html--empty-overflow
✅ navigation-skcontextnav-html--long-labels
✅ navigation-skcontextnav-html--one-child
✅ navigation-skcontextnav-html--three-children
✅ navigation-skcontextnav-html--twenty-children
✅ navigation-skcontextnav-html--narrow
✅ navigation-skcontextnav-html--forced-colors
✅ navigation-skcontextnav-html--rtl
✅ navigation-skcontextnav-html--light-mode
✅ navigation-skcontextnav-html--unavailable-mixed
✅ navigation-skcontextnav-html--unavailable-annotation-free
✅ navigation-skcontextnav-html--unavailable-all
✅ navigation-skcontextnav-html--unavailable-parent
✅ navigation-skcontextnav-html--unavailable-long
✅ navigation-skcontextnav-html--unavailable-forced-colors
✅ navigation-skcontextnav-html--unavailable-rtl
✅ navigation-skcontextnav-html--unavailable-light-mode
✅ primitives-skdatatable-html--default
✅ primitives-skdatatable-html--sticky-header
✅ primitives-skdatatable-html--narrow-scrollable
✅ primitives-skdatatable-html--light-mode
✅ primitives-skdisclosure-html--closed
✅ primitives-skdisclosure-html--open
✅ primitives-skdisclosure-html--long-body
✅ primitives-skdisclosure-html--nested
✅ primitives-skdisclosure-html--light-mode
✅ primitives-skemptystate-html--with-action
✅ primitives-skemptystate-html--without-action
✅ primitives-skemptystate-html--inline
✅ primitives-skemptystate-html--inline-long-narrow
✅ primitives-skemptystate-html--inline-preferences
✅ primitives-skemptystate-html--inline-light-mode
✅ primitives-skemptystate-html--light-mode
✅ primitives-skeventtimeline-html--default
✅ primitives-skeventtimeline-html--one-event
✅ primitives-skeventtimeline-html--two-events
✅ primitives-skeventtimeline-html--twenty-events
✅ primitives-skeventtimeline-html--long-transition
✅ primitives-skeventtimeline-html--verified-marker
✅ primitives-skeventtimeline-html--unavailable-retention
✅ primitives-skeventtimeline-html--narrow
✅ primitives-skeventtimeline-html--forced-colors
✅ primitives-skeventtimeline-html--light-mode
✅ primitives-skeventtimeline-html--compact-one-event
✅ primitives-skeventtimeline-html--compact-default
✅ primitives-skeventtimeline-html--compact-twenty-events
✅ primitives-skeventtimeline-html--compact-leading-marker
✅ primitives-skeventtimeline-html--compact-long-content
✅ primitives-skeventtimeline-html--compact-linked
✅ primitives-skeventtimeline-html--compact-narrow
✅ primitives-skeventtimeline-html--compact-degraded
✅ primitives-skeventtimeline-html--compact-forced-colors
✅ primitives-skeventtimeline-html--compact-light-mode
✅ primitives-skfacts-html--default
✅ primitives-skfacts-html--two-column
✅ primitives-skfacts-html--compact
✅ primitives-skfacts-html--long-value
✅ primitives-skfacts-html--empty-value
✅ primitives-skfacts-html--light-mode
✅ components-skfeaturecard-html--default
✅ components-skfeaturecard-html--green-icon
✅ components-skfeaturecard-html--purple-icon
✅ components-skfeaturecard-html--colorized-borders
✅ components-skfeaturecard-html--grid
✅ components-skfeaturecard-html--light-mode
✅ form-formfield-html--form-input-default
✅ form-formfield-html--form-input-focus
✅ form-formfield-html--form-input-error
✅ form-formfield-html--form-input-disabled
✅ form-formfield-html--form-input-filled
✅ form-formfield-html--form-textarea-default
✅ form-formfield-html--form-textarea-error
✅ form-formfield-html--light-mode
✅ form-formfield-html--light-mode-error
✅ form-skformselect-html--default
✅ form-skformselect-html--t-12-two-filters
✅ form-skformselect-html--compact
✅ form-skformselect-html--long-options
✅ form-skformselect-html--optgroups
✅ form-skformselect-html--required-invalid
✅ form-skformselect-html--disabled
✅ form-skformselect-html--narrow
✅ form-skformselect-html--forced-colors
✅ form-skformselect-html--light-mode
✅ form-skformselect-html--light-mode-invalid
✅ components-skgrid--default
✅ components-skgrid--two-column
✅ components-skgrid--three-column
✅ components-skgrid--four-column
✅ components-skgrid--responsive
✅ components-skgrid--light-mode
✅ navigation-sknavpill-html--default
✅ navigation-sknavpill-html--active-item
✅ navigation-sknavpill-html--mobile
✅ navigation-sknavpill-html--collapsed-static
✅ navigation-sknavpill-html--light-mode
✅ primitives-skpilltag-html--default
✅ primitives-skpilltag-html--green
✅ primitives-skpilltag-html--purple
✅ primitives-skpilltag-html--breaking
✅ primitives-skpilltag-html--yellow
✅ primitives-skpilltag-html--all-variants
✅ primitives-skpilltag-html--eyebrow
✅ primitives-skpilltag-html--statuses
✅ primitives-skpilltag-html--light-mode
✅ primitives-skprogress-html--default
✅ primitives-skprogress-html--zero
✅ primitives-skprogress-html--complete
✅ primitives-skprogress-html--large-total
✅ primitives-skprogress-html--long-label
✅ primitives-skprogress-html--compact
✅ primitives-skprogress-html--narrow
✅ primitives-skprogress-html--forced-colors
✅ primitives-skprogress-html--indeterminate
✅ primitives-skprogress-html--indeterminate-with-meta
✅ primitives-skprogress-html--indeterminate-narrow
✅ primitives-skprogress-html--indeterminate-long-label
✅ primitives-skprogress-html--indeterminate-compact
✅ primitives-skprogress-html--indeterminate-forced-colors
✅ primitives-skprogress-html--light-mode
✅ primitives-skprose-html--default
✅ primitives-skprose-html--prompt
✅ primitives-skprose-html--long-code
✅ primitives-skprose-html--wide-table
✅ primitives-skprose-html--absent-prompt
✅ primitives-skprose-html--narrow
✅ primitives-skprose-html--light-mode
✅ navigation-skpublicheader-html--default
✅ navigation-skpublicheader-html--brand-only
✅ navigation-skpublicheader-html--one-action
✅ navigation-skpublicheader-html--many-actions
✅ navigation-skpublicheader-html--long-labels
✅ navigation-skpublicheader-html--current-action
✅ navigation-skpublicheader-html--mixed-controls
✅ navigation-skpublicheader-html--theme-toggle-composition
✅ navigation-skpublicheader-html--narrow
✅ navigation-skpublicheader-html--short-viewport
✅ navigation-skpublicheader-html--rtl
✅ navigation-skpublicheader-html--forced-colors
✅ navigation-skpublicheader-html--light-mode
✅ form-skradiochoicegroup-html--default
✅ form-skradiochoicegroup-html--two-choice
✅ form-skradiochoicegroup-html--one-option
✅ form-skradiochoicegroup-html--none-selected
✅ form-skradiochoicegroup-html--required-invalid
✅ form-skradiochoicegroup-html--disabled-option
✅ form-skradiochoicegroup-html--disabled-group
✅ form-skradiochoicegroup-html--long-content
✅ form-skradiochoicegroup-html--narrow
✅ form-skradiochoicegroup-html--rtl
✅ form-skradiochoicegroup-html--focus-states
✅ form-skradiochoicegroup-html--forced-colors
✅ form-skradiochoicegroup-html--default-dark
✅ form-skradiochoicegroup-html--light-mode
✅ components-skribboncard-html--default
✅ components-skribboncard-html--with-ribbon
✅ components-skribboncard-html--border-yellow
✅ components-skribboncard-html--border-green
✅ components-skribboncard-html--border-purple
✅ components-skribboncard-html--all-borders
✅ components-skribboncard-html--light-mode
✅ primitives-sksectionbanner-html--default
✅ primitives-sksectionbanner-html--neutral
✅ primitives-sksectionbanner-html--purple
✅ primitives-sksectionbanner-html--green
✅ primitives-sksectionbanner-html--all-variants
✅ primitives-sksectionbanner-html--light-mode
✅ navigation-sksectionnav-html--default
✅ navigation-sksectionnav-html--current-first
✅ navigation-sksectionnav-html--current-last
✅ navigation-sksectionnav-html--no-current
✅ navigation-sksectionnav-html--one-route
✅ navigation-sksectionnav-html--two-route
✅ navigation-sksectionnav-html--many-routes
✅ navigation-sksectionnav-html--long-labels
✅ navigation-sksectionnav-html--narrow
✅ navigation-sksectionnav-html--forced-colors
✅ navigation-sksectionnav-html--rtl
✅ navigation-sksectionnav-html--light-mode
✅ components-sksegmentedchoice-html--default
✅ components-sksegmentedchoice-html--second-selected
✅ components-sksegmentedchoice-html--third-selected
✅ components-sksegmentedchoice-html--two-items
✅ components-sksegmentedchoice-html--five-items
✅ components-sksegmentedchoice-html--long-labels
✅ components-sksegmentedchoice-html--no-selection
✅ components-sksegmentedchoice-html--all-disabled
✅ components-sksegmentedchoice-html--one-disabled
✅ components-sksegmentedchoice-html--narrow
✅ components-sksegmentedchoice-html--forced-colors
✅ components-sksegmentedchoice-html--default-dark
✅ components-sksegmentedchoice-html--light-mode
✅ components-sitefooter-html--default
✅ components-sitefooter-html--light-mode
✅ components-sitefooter-html--compact
✅ components-sitefooter-html--compact-light-mode
✅ primitives-skskiplink-html--unfocused
✅ primitives-skskiplink-html--focused
✅ primitives-skskiplink-html--light-mode
✅ primitives-skstub-html--default
✅ primitives-skstub-html--mobile
✅ primitives-skstub-html--desktop
✅ primitives-skstub-html--light-mode
✅ primitives-skworkflowboard-html--default
✅ primitives-skworkflowboard-html--populated
✅ primitives-skworkflowboard-html--fitting
✅ primitives-skworkflowboard-html--all-empty
✅ primitives-skworkflowboard-html--one-empty-lane
✅ primitives-skworkflowboard-html--fifty-items
✅ primitives-skworkflowboard-html--long-labels-and-items
✅ primitives-skworkflowboard-html--single-lane-narrow
✅ primitives-skworkflowboard-html--forced-colors
✅ primitives-skworkflowboard-html--default-dark
✅ primitives-skworkflowboard-html--light-mode
✅ primitives-skworkflowlane-html--default
✅ primitives-skworkflowlane-html--empty
✅ primitives-skworkflowlane-html--light-mode
```
