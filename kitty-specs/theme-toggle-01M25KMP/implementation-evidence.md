# WP01 implementation evidence

## Red-first record

- Starting train SHA: `4d4031fa2416ceaadcb0c51f313386c3dee3db36`
- Pre-implementation mission HEAD: `2e36772efbd99ab1b837adc22135be983a2c210d`
- Command: `npx vitest run fixtures/elements-behaviour/src/sk-theme-toggle.test.ts`
- Result: RED — 12 failed, 1 passed, before any `packages/elements/src/theme-toggle/` or `packages/styles/src/theme-toggle/` production file existed.
- Behavioral failures included: no labelled `fieldset`; no three same-name native radios; no public `preference`; no System light/dark resolution; stored manual overrides not restored; no root `data-theme` or `color-scheme`; no media-query listener; no current-page fallback when storage throws; no reflected pre-upgrade preference; no targetable `control` part; and no adopted stylesheet.
- The no-label negative test passed for the intended reason: the unknown element presented no interactive control. It remains as a regression check that enhancement never introduces unauthorized fallback copy.
- These were product-contract failures, not missing-import or syntax failures: the browser loaded and executed all 13 tests against an unupgraded `<sk-theme-toggle>`.

An exploratory combined browser/node run also exposed the existing package barrel's import-time
`customElements` dependency in `packages/elements/src/define.ts`. That setup failure was not
counted as the component's original red-first evidence; the dedicated actual-element import
remediation below records the complete runtime boundary separately.

## Green and gate record

Implementation is complete and the full exact-head rerun remains mandatory after the final
train rebase. The records below distinguish focused product evidence from full repository
gates and explicitly retain local/CI-only limitations.

### Actual-element SSR import remediation

- Red-first command: `npx vitest run --project node tests/node/theme-preference-contract.test.ts --reporter=default`.
  Result: 1 failed / 7 passed. Importing the real
  `packages/elements/src/theme-toggle/sk-theme-toggle.ts` with `document`, `window`,
  `CSSStyleSheet`, and `customElements` absent threw `ReferenceError: CSSStyleSheet is not
  defined` from its generated stylesheet module. This is the direct FR-008/NFR-004 boundary,
  not a leaf-module proxy or a mocked import.
- The authoritative CSS generator now emits one conditional artifact: a real constructed
  `CSSStyleSheet` in browsers, and Lit's DOM-free `CSSResult` around the same trusted generated
  CSS text only when `CSSStyleSheet` is absent. An `undefined` fallback was rejected because
  Lit's `CSSResultGroup` type and adoption path do not accept it. `define.ts` resolves and
  patches an available registry lazily, no-ops without one, and keeps browser registration
  synchronous.
- Green focused Node result: 9/9 passed, including inert direct registration-helper import and
  the actual element import with all four DOM globals absent before evaluation.
- `node scripts/build-elements-css.mjs --selftest` passed 2/2 SSR-fallback and native-browser
  identity probes; normal generation followed by `--check` reported all 30 component modules
  current. Every `.css.js` / `.css.d.ts` delta came from that generator.
- Focused real-Chromium behavior passed 17/17 across the `sk-theme-toggle` suite and the
  package registration backstop. The assertions include exact adopted-sheet identity and zero
  injected `<style>` elements.
- Direct elements TypeScript validation, uncached elements build, hand-authored-CSS boundary,
  30/30 adopted-CSS boundary, built-package SSR import, ESLint (zero errors; the Node test is
  outside the configured lint glob), regenerated size record plus size drift check, and
  `git diff --check` passed.
- Full `npm test` passed after the generator-wide regeneration: 50 files / 611 tests
  (43 Node and 568 Chromium), zero skipped, with the two-lane suite floor active.

### Bootstrap and no-JavaScript slice

- Red-first command: `npx vitest run tests/node/theme-preference-contract.test.ts --project=node`.
  Three assertions failed for behavioral reasons: a throwing `matchMedia` escaped the pre-paint
  entry, `--selftest` rewrote the artifact instead of probing the gate, and the required
  head-before-stylesheet documentation did not exist.
- Green focused Node result: 7/7 assertions passed. The committed classic script matches the
  generator byte-for-byte; its self-test passed 3/3 healthy/missing/stale probes.
- The published token build derives its no-JS light media override from the single authored
  `:root[data-theme="light"], .sk-light` block. Its check passed and its self-test passed 4/4
  single-source/missing/duplicate/drift probes. No token name or design value was introduced.
- Storybook built in 9.39 seconds (180-second ceiling). The no-application-JavaScript Playwright
  proof passed 2/2 in Chromium and 2/2 in Firefox: System light/dark differ, explicit root Light
  and Dark override opposing OS settings, and the unupgraded host exposes no inert control.
  Local WebKit could not launch because the workstation lacks its Ubuntu-targeted GTK/ICU/media
  libraries; CI remains authoritative for that browser.
- `node scripts/check-gate-wiring.mjs`, its 13/13 self-test, the 18-defeat table, ESLint for the
  new scripts/test, Stylelint, `elements:build`, and the elements TypeScript check passed.
- The derived all-project typecheck reached an unrelated existing diagnostic at
  `fixtures/elements-behaviour/src/sk-form-input.test.ts:471` (`TS2538`, unique symbol index);
  this slice did not change that file. The exact-base/final full gate must classify it.

### WP01 review-cycle-1 remediation

- Independent `reviewer-renata` rejected exact HEAD
  `ab7d4d5a2d055eddf6ef09e227eb9b9062827b58` with four Medium evidence gaps. A fresh
  Codex `frontend-freddy` seat loaded the complete runtime fix prompt and implement-scoped
  doctrine before changing the rejected implementation.
- The public `sk-theme-change` assertion now carries `[SC-006][SC-007][SC-008]`, observes the
  event at an ancestor, and proves one delivery, the exact two-key detail/value contract,
  `bubbles: true`, `composed: true`, and the intentionally non-cancelable SC-009 boundary.
  `behaviours.json` registers this exact subject for all three applicable IDs and
  `mutations.json` carries one surgical arm per ID. Direct falsification reds were:
  duplicate delivery expected 1 / received 2; wrong detail expected preference `dark` /
  received `system`; disabled bubbling/composed expected one ancestor event / received zero.
- A browser consumer fixture executes the byte-exact generated classic bootstrap as a blocking
  `<head>` script, records root `data-theme` and inline `color-scheme` before a following real
  external stylesheet, and then proves that stylesheet loaded. Seven cases cover stored Light,
  stored Dark, missing storage, invalid storage, explicit System-light, explicit System-dark,
  and throwing storage. Reversing the bootstrap/stylesheet order red at DOM position expected
  `FOLLOWING` (4) / received `PRECEDING` (2); restored focused fixture passed 24/24 total tests.
- A legacy-only MediaQueryList fake exposes no modern event-listener methods. It proves live
  System updates, zero listeners after entering manual mode, listener restoration when returning
  to System, disconnect cleanup, and one-only reconnect installation. Omitting the production
  `addListener` call red immediately at listener count expected 1 / received 0.
- The forced-colors Storybook proof now compares the choice's computed foreground/background to
  browser system `CanvasText`/`Canvas` and asserts computed `forced-color-adjust: auto`, in
  addition to preserving operation and root/storage resolution. A generated CSS falsification
  with authored `forced-color-adjust: none` red at expected `auto` / received `none`; authored
  CSS was restored, generated via `build-elements-css.mjs`, Storybook rebuilt, and the isolated
  Chromium lane passed on `STORYBOOK_PORT=63232`. No snapshot was updated.
- Focused integrity checks: theme browser fixture 24/24; forced-colors Playwright 1/1 on the
  isolated port; configured-baseURL timezone navigation 1/1 on isolated port 63234; Node config
  contract 14/14; elements typecheck; CSS/bootstrap generated checks;
  behavior-fixture deep-import gate 34/34 plus 22/22 self-test; relevant ESLint with zero errors;
  all three new mutation source anchors unique/effective; and `git diff --check` passed. The
  deterministic registry now has 244 arms. The three added arms were directly applied and each
  produced its named red, but the full 244-arm copy-isolated sweep is intentionally deferred to
  the exact-head gate rather than represented as completed here.
- The uncached `elements-behaviour-fixture:typecheck` then exposed a generator declaration
  mismatch: RED with 31 diagnostics because all 30 generated sheet declarations had been
  widened to `CSSStyleSheet | CSSResult`, while the browser-only behavior fixtures correctly
  inspect `cssRules` and constructed-sheet identity. The generated `.css.js` paths are internal
  to the package graph (not package subpath exports); sheet values re-exported by the package are
  likewise a browser-facing adoption surface. The
  runtime `CSSResult` branch is intentionally limited to inert DOM-free package/element import,
  not server-side sheet inspection. The authoritative generator now retains that runtime branch
  while declaring the supported browser surface as `CSSStyleSheet`; its self-test pins both
  behaviors independently.
- GREEN after generator-only source remediation and regeneration of all 30 declarations:
  `build-elements-css --selftest` passed 3/3, `--check` reported all 30 components current,
  the actual source-element Node import passed 9/9, a fresh uncached elements build plus
  built-package SSR import passed without `document`, `window`, `CSSStyleSheet`, or
  `customElements`, the exact Chromium constructed-sheet identity assertion passed 1/1,
  uncached `elements-behaviour-fixture:typecheck` passed, and the derived uncached all-project
  typecheck passed all five projects (`elements-behaviour-fixture`, `react-consumer-fixture`,
  `vue-consumer-fixture`, `elements`, and `react`).
