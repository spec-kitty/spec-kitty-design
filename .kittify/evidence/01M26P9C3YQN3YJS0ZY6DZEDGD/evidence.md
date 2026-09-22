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

### Final rebased exact-head record

- Rebased base: `origin/train/elements-first` at
  `91a7c8c36873141fdd5d0a7313726185c559768f`.
- Exact validation HEAD: `05064441d114165cf0ed1dd14b14b64673d1912b`.
- Full Vitest: 51 files / 662 tests passed (43 Node, 619 Chromium), zero skipped. The budgeted
  behavior run completed in 18.3 seconds against 40 seconds.
- Full mutation pass 1 found a test-evidence coupling at 252/253: the SC-012 input-type mutant
  prevented the interaction helper from locating a choice and therefore also prevented the
  SC-006 event assertion from acting. A fresh Codex debugger/remediation seat changed only the
  test helper to locate a choice by value; the radio semantics helper remains type-specific.
  Exact-mutant falsification then left SC-006/007/008 green while SC-012 went red. Full pass 2:
  all 253 mutations produced their named red in 1076 seconds against 1649.8 seconds. Mutation
  guard self-test: 10/10 in 96.4 seconds.
- Exact-head `quality:all` passed (zero lint errors; existing security-rule warnings retained),
  and the derived typecheck passed all five declared projects. All current generator drift,
  generator self-test, manifest, wrapper, Vue, entry, public-contract, ratchet, composition,
  architecture-index, workflow, action-pin, size, release, offline, audit, lockfile, and full
  branch commitlint checks passed.
- Storybook built in 11.37 seconds. The a11y gate's 50/50 self-test shapes behaved correctly;
  all 510 ratcheted story IDs were present; axe reported zero WCAG 2.1 AA violations across 632
  rendered stories. Demo assembly resolved all 42 references.
- Isolated-port Chromium + Firefox Playwright scheduled 1230 cases: 1183 passed, 47 explicit
  conditional skips, zero failures. WebKit was attempted for the 11 theme/no-JS cases and could
  not launch because required host GTK/ICU/JPEG/GStreamer libraries are unavailable; CI installs
  these and remains authoritative.
- Local Chromium visual regression was not hidden or updated: 6 passed / 216 failed on
  font-dependent dimensions. Three representative failures were reproduced against the exact
  train base and produced byte-identical actual PNGs on base and mission, proving the local
  failure class pre-exists #323. GitHub visual artifacts remain authoritative.
- Release graph: four publishable packages packed and every export resolved. Packed Vue types,
  SRI/size records, 31/31 packed-element offline upgrade, 30/30 shipped font files, zero network,
  no high/critical audit findings, lockfile dry-run, and action pinning passed.

### Second train refresh, adversarial closure, and executable gate snapshot

- Rebased base: `origin/train/elements-first` at
  `7032cf7792a83ee20d9fd70ddcfb28a057c72884`, incorporating PR #330 while preserving the #323
  generated/story-ratchet union. Product review cycle 6 approved exact clean HEAD
  `3234d06fcdec0081b5fb1b30dcbf976b7e58053c`; the complete executable gate snapshot was
  `4172c6fa04d531281d45db1efa1f69867ecf77c0`.
- A pre-accept runtime-failure lens rejected the preceding product snapshot for one Medium
  mission-owned test-harness race, independently reproducing `Axe is already running` 4/12 times
  under 12-worker pressure. No product or accessibility violation was present. A fresh
  `frontend-freddy` Codex seat changed only the Playwright test: ten bounded attempts retry only
  that exact sentinel, every other/exhausted error is rethrown, and the final assertion remains
  exact zero violations. Stress passed 12/12; full Chromium passed 627/627; fresh WP review then
  approved with no High or Medium findings.
- `npm test`: 51 files / 665 tests passed (43 Node, 622 Chromium), zero skipped. Timed suite:
  18.5 seconds / 40 seconds. ADR-11: 253/253 named mutations red from a 622-assertion green
  baseline in 977.7 seconds / 1649.8 seconds; mutation harness self-test 10/10 in 83.1 seconds.
- Full Chromium + Firefox Playwright: 1,207 passed, 47 explicit conditional skips, zero failures
  across 1,254 scheduled cases. Selected WebKit theme/no-JS: 11 launch failures solely because the
  host lacks GTK 4, ICU 74, JPEG Turbo 8, and GStreamer; the GitHub lane installs those libraries.
- `quality:all` and all five uncached typecheck projects passed. All applicable generator drift,
  self-test, manifest, wrapper, Vue, entry, ratchet, composition, gate-wiring, ADR/LLM, release,
  offline, size, audit, lockfile, action-pin, and branch-wide commitlint checks passed.
- Storybook built in 10.20 seconds; demo assembly resolved 42/42 references; 519 declared story IDs
  were present; axe rendered 637/637 stories with zero WCAG 2.1 AA violations.
- Local Chromium visual regression was not updated or hidden: 6 passed / 217 failed out of 223 on
  the already base-reproduced host-font geometry class. GitHub's pinned runner remains the visual
  and WebKit acceptance authority.

### Cycle-seven acceptance-gap remediation and cycle-eight record correction

- The final pre-accept point-cut rejected exact HEAD
  `61d2a5f150900517454262c79fc59083d4c3d0bb` with three Medium findings: a
  listenerless `MediaQueryList` could throw, the manifest advertised a story-only helper that the
  package did not export, and the automated `deviceScaleFactor: 2` case had been described as
  200% browser zoom even though it proved only HiDPI density. A fresh Codex
  `frontend-freddy` seat, governed by Op `01M26DDXM559KWABQZGM9ST1Z6`, remediated those
  findings from exact cycle-seven start HEAD
  `c158e53cce903235b85751dc97dc5e2ea339aca2`. The exact product commit is
  `3c64c4286b8cc5e1511edb890a59f83640087895`.
- Listener installation now requires a complete modern add/remove pair or a complete legacy pair,
  records the mechanism only after successful installation, and treats listenerless or throwing
  implementations as a static System source. Focused Chromium covered listenerless plus partial
  modern/legacy shapes, cleanup, reconnect, and exact root state; the fixture's ADR-11 mutation
  makes the missing feature-detection boundary red.
- `theme-story-environment.fixture.ts` is excluded through the manifest's authoritative fixture
  policy rather than exposed as public API. The manifest gate now rejects story-helper names in
  the manifest, explicit authored package root, and declaration input set, and carries negative
  probes for each boundary. Independent review also checked the fresh built runtime. Fresh manifest generation retained 31 registered elements
  and 138 documented public surfaces while omitting the helper from the manifest, declaration
  publication, package root, and built runtime.
- Genuine headed Chrome UI zoom evidence is committed under
  `docs/architecture/validation/issue-323-theme-toggle/browser-zoom/`. With a fixed physical
  `1199 x 799` browser window, native Chrome controls reduced the effective CSS viewport from
  `1199 x 712` at 100% to `599 x 356` at 200%. Native keyboard input exercised
  `dark -> light -> system -> dark`; preference, root `data-theme`, and `color-scheme` agreed at
  every transition. Machine-readable geometry proves all three visible choices remained contained,
  non-overlapping, unclipped, singly selected, and horizontally overflow-free, with a visible 2px
  focus outline. The two capture hashes are `60a440bbe4f57f9140db24fa587d5abc7e005939804dacb9f20988c0aec1f7cf`
  (100%) and `0a123c1866552d706e843e62302d2617d7603878cc2372ca194dd918ce772397`
  (200%); `metrics.json` hashes to
  `35c0079d7b147aed1333641fc16e19e10948a52e46284e25ae210bff5c3b8a9e`.
  Primary Codex inspection found the complete labelled control, selected Dark text/semantics, and
  focus ring visible at both levels, with the native `200%` indicator visible in the second capture.
  The independent cycle-seven reviewer inspected both images and accepted the evidence as credible.
  The Playwright DPR case remains only supplemental HiDPI coverage and is labelled accordingly.
- Cycle-seven implementation validation passed: focused theme behavior 27/27; composed-pattern
  Chromium 9/9; full `npm test` 668/668; five-project typecheck; `quality:all`; manifest generation,
  content, and negative/self-test probes; React and Vue generators/types; Storybook build; and
  commitlint/lockfile checks. Fresh independent `reviewer-renata` review at exact lifecycle HEAD
  `eb77cd52e4445f4f7634ab9171ebc0bf3ac1f29e`, governed by Op
  `01M26FDAW4MB8YV7VTYRZSATCQ`, verified all three product findings closed and independently passed
  Vitest 36/36, composed-pattern Chromium 9/9, five-project typecheck, manifest 31/138 plus 15/15
  self-tests, wrapper/Vue generators, release-graph 4 packages plus 28/28 self-tests,
  `quality:all`, commitlint, and lockfile dry-run.
- That reviewer correctly rejected the review head with two Medium evidence/package findings:
  `packages/elements/SIZES.md` had been measured against stale `dist/`, and this file plus the
  operator log stopped at the older `4172c6fa04d531281d45db1efa1f69867ecf77c0` snapshot. Cycle
  eight began at exact HEAD `9807f3c984ec60ef15864f049f097f6e74422460` under a fresh Codex
  `frontend-freddy` seat and Op `01M26G61HC68WA7TS6XBDAD2VM`.
- Cycle-eight disposition used the recipe's required order: an uncached authoritative
  `elements:build`, then the repository generator, then `measure-elements-sizes.mjs --check`.
  The generated record now contains ESM 247291 raw / 165794 minified bytes (241.5 / 161.9 KiB),
  IIFE 266279 raw / 175672 minified bytes (260.0 / 171.6 KiB), 34 / 38 KiB min+gzip, IIFE SRI
  `sha384-LxNIa59oFAZHhaAik41sUkpsz62WC+5EybutmXM945orIz6bCp49pr8ZMU7nBD9A`, and
  `@spec-kitty/elements` 56 files / 976.4 KiB unpacked. The complete release sequence then passed:
  28/28 release-gate self-tests, uncached build of the three buildable projects, four publishable
  packages packing with every export resolving, packed Vue declarations compiling without
  workspace paths, and a final byte-identical size/SRI check. No product behavior changed in this
  cycle. The exact generated-size remediation commit is
  `7b69e3140bb14f4d002bcad453583fbf34114a9c`; this evidence update follows it without changing
  executable or generated package content. Acceptance and fresh review remain pending.
- Reviewer Low follow-ups remain deferred without expanding #323: document or regenerate the
  canonical `sourceDiffSha256` procedure; optionally harden the manifest parity probe for
  `export *`; and make the behavior-fixture import gate ignore screenshot directories whose names
  end in `.ts`.

### Third train refresh and exact-head validation

- Rebased base: `origin/train/elements-first` at
  `bab211c9876d85c2c004daf05ef27046bbf0e671`. Shared lifecycle/generated conflicts were resolved
  from authored sources. Conventional-header normalization changed history only: the before/after
  tree remained `c5b8a435c63a4ec95745414c3cefdf3e9be26e1f`, and all 147 mission commits now pass
  branch-wide commitlint. Clean executable validation HEAD:
  `9eb4e5950e6bc8a7e4bcec28d496576a2be21b3a`.
- Full Vitest and its timed rerun passed 677/677 across 51 files (43 Node, 634 Chromium), zero
  skipped, in 18.6 seconds / 40 seconds. `quality:all` passed and uncached typecheck passed all
  five projects. Every applicable generated-artifact, contract, ratchet, architecture, workflow,
  audit, lockfile, action-pin, release, package-export, offline, and size/SRI check passed.
- Storybook built in 9.73 seconds; all 551 declared IDs were present; axe's self-test passed 50/50
  and all 669 rendered stories had zero WCAG AA violations. Full Chromium + Firefox Playwright:
  1,341 passed, 47 explicit conditional skips, zero failures out of 1,388 scheduled. WebKit's 11
  selected theme/no-JS cases could not launch only because this host lacks its GTK/ICU/JPEG/media
  dependencies; CI installs them and is authoritative.
- Local visual regression remained the documented host-font class (6 passed / 229 failed out of
  235) and diagram normalization reported eight analogous geometry diffs. No snapshot was updated,
  and #323 changes no tracked visual baseline; the GitHub jobs are authoritative.
- The 254-arm mutation sweep initially failed closed on unrelated nav-pill/app-shell dynamic-import
  transport errors during concurrent browser work from other isolated mission checkouts.
  Independent `debugger-debbie` diagnosis found matching Chromium renderer SIGSEGV coredumps, no
  OOM/disk exhaustion, no #323 source/config change to the runner, and prior issue #238 evidence
  for the same class. The required isolated idle-host full retry then completed 252/254: unchanged
  `sk-bar-chart` SC-006 and `sk-app-shell` SC-012 arms each hung for 180 seconds before producing a
  report; every other arm, including every theme arm, produced its named red. The harness self-test
  passed 10/10, but the exact-head mutation gate remains fail-closed until a post-remediation sweep
  or authoritative GitHub mutation job passes. No shared harness change is absorbed into #323.

### Final pre-accept adversarial point-cut — pass 5

Four fresh governed read-only lenses reviewed exact clean HEAD
`c5337dd9f82e5f1467616f2563f0ac9b177b3794`. `architect-alphonso` passed the resolver/bootstrap,
SSR, package-boundary, generated-surface, Factory-scope, cleanup, and rebase-union architecture with
zero High or Medium findings. `designer-dagmar` rejected one High because the committed genuine
200% capture visibly loses compact page-header text and the browser assertion measures only toggle
geometry. `debugger-debbie` and Randy Reducer rejected the independent per-instance System
listeners, which let one live control overwrite a sibling's manual root preference after an OS
change. The runtime lens also found invalid direct property assignment bypassing System fallback;
the semantic lens found the exact System media query duplicated and unasserted across production
adapters. All other scoped acceptance surfaces passed. See `reviews/adversarial-review-pass-5.md`.

### Pass-5 remediation — multi-control coherence, property normalization, query authority, zoom

Governed by Op `01M26P9C3YQN3YJS0ZY6DZEDGD`; fresh Claude Code `frontend-freddy` seat, starting
from clean exact HEAD `aafa24e82577ba9fdb47ca7cde85015e373d1a3a` on `mission/theme-toggle`. The
changes are left uncommitted for the orchestrator.

**Red first, against unchanged production code at that HEAD** (every failure a behavioural
assertion; no missing-symbol or collection failure):

- `npx vitest run --project browser fixtures/elements-behaviour/src/sk-theme-toggle.test.ts
  fixtures/elements-behaviour/src/pattern-operational-status.test.ts` — 16 failed / 38 passed.
  Sibling sync: `expected [ 'light', 'system' ] to deeply equal [ 'light', 'light' ]`. Stale System
  sibling: `after the OS reported dark=true: expected { theme: 'dark', colorScheme: 'dark' }` to
  equal the manual Light state. Ownership: `expected 3 to be 1` listeners. Reconnect: the root
  resolved System's light instead of the live Dark. Explicit newcomer: `[ 'system', 'dark' ]`.
  Storage-denied adoption: root light instead of the current-page Dark. Invalid property
  (`sepia`, `''`, `SYSTEM`, `null`, `undefined`, `42`): `expected 'sepia' to be 'system'` and the
  equivalent for each value. `[SC-010]` invalid pre-upgrade: `expected 'sepia' to be 'system'`.
  Story overlap: `expected 2 to be 1` concurrent listeners, and both cleanup orders reported the
  older System control still live under the newer manual session.
- `npx vitest run --project node tests/node/theme-preference-contract.test.ts` — 1 failed / 9
  passed: `expected { contract: +0, element: 1, bootstrap: 1, storySupport: 1 }` to equal
  `{ contract: 1, element: 0, bootstrap: 0, storySupport: 0 }`.
- `STORYBOOK_PORT=63323 npx playwright test apps/storybook/src/tests/sk-theme-toggle-pattern.spec.ts
  --project=chromium -g "keeps every supplied string"` against a fresh HEAD build — 3/3 failed:
  eyebrow, title, supporting and sync copy each clipped by the slotted node and its
  `.sk-page-header__*` wrapper at `599 x 356`, the supporting sentence (and title at 390px) also by
  the viewport; the desktop case clipped eyebrow, title and supporting copy.
- Two new assertions pass on the old code by design and are contract coverage, not red-first:
  the exact `matchMedia` argument (the literal was already right — its drift is caught by the
  argument-sensitive fake and the new SC-012 arm) and a choice made inside an older story
  session (a regression guard for the reworked story isolation).

**Implementation.** A module-private `DocumentTheme` coordinator per document owns the preference
every connected control shows, the root, and the only System listener; the first control, or one
assigned a preference while disconnected, sets it and any later control adopts it. `preference`
now owns its accessor and normalizes invalid direct, attribute and pre-upgrade values to System;
its public type stays exactly `'system' | 'light' | 'dark'`. `THEME_DARK_SCHEME_QUERY` in the
DOM-free contract is the only spelling of the query; the bootstrap entry, the element and the
story support import it. Story isolation records user choices per session and restores a
surviving session by assigning its preference to one connected owned control. The composition
header uses the default density so no supplied string is ellipsized.

**Green.**

- Focused: browser 54/54 across both subject files; Node contract 10/10; theme Playwright
  (`sk-theme-toggle-pattern.spec.ts`, `theme-no-js.spec.ts`) Chromium + Firefox 25 passed, 3
  explicit Chromium-only skips (forced colours, HiDPI supplement, axe lane) in Firefox.
- `npm test`: 51 files / 693 tests (44 Node, 649 Chromium), zero skipped, 18.8 s; suite floor
  green. The `ResizeObserver loop` console lines come from the untouched `sk-app-shell.test.ts`.
- `NX_SKIP_NX_CACHE=true node scripts/typecheck-all.mjs`: 5/5 projects. `npm run quality:all`:
  zero errors (existing warnings only; the nine changed source/test files lint clean).
- Generators from authored sources: `build-theme-bootstrap` (regenerated; `--check` + 3/3
  self-test), `elements:analyze` (manifest: descriptions only, `preference` type unchanged),
  `build-react-wrappers` (regenerated; `--check` byte-identical twice), `build-vue-types`
  (regenerated; `--check`), `check-vue-template-types`, uncached `elements:build` then
  `measure-elements-sizes` (regenerated; `--check`), `build-elements-css --check` (31 current).
- `check-manifest-content` 31 elements / 138 surfaces + 15/15 self-test;
  `check-pattern-composition` + 47-probe self-test; `check-behaviour-fixture-imports` 35 files +
  22-row self-test; release graph 28/28 self-test, uncached build of `tokens,styles,elements`, 4
  packages packing with every export resolving; packed Vue types; offline load 31/31 elements,
  zero off-machine requests, plus its self-test; `security:lockfile-check`.
- Storybook built in 9.4 s; axe gate self-test 50/50 and zero WCAG 2.1 AA violations across 669
  rendered stories. Mutation-harness guard self-test 10/10 in 96.7 s.
- ADR-11: six new arms (five SC-012, one SC-010) and the SC-010 anchor update; mutations.json now
  holds 260 arms. Every arm in the three touched sources was applied directly and restored; see
  the arm record below. The full 260-arm sweep is the orchestrator's.
- Genuine headed Chrome 100%/200% captures replaced; see
  `docs/architecture/validation/issue-323-theme-toggle/browser-zoom/README.md`.

Not run here: the Chromium visual-regression job (no committed baseline covers the touched
stories, and the local host-font failure class is recorded above), WebKit (host libraries
absent), commitlint (no commit was made), and the full mutation sweep.

**Arm record (direct application, copy-free, each source restored and hash-verified).** Every
`mutations.json` arm whose file is `sk-theme-toggle.ts`, `theme-preference.ts` or
`operational-status.ts` was applied and run against both subject files; the verdict applies the
harness's own rule (named `[SC-NNN]` test in the subject file failed, no other marked test failed).
15/15 RED, zero collateral: SC-006, SC-007, SC-008, SC-011 (composition), SC-010 (unregistered
property; anchor updated for `noAccessor`), SC-012 radio type, SC-012 complete listener pair,
SC-013, SC-014, and the six new arms — shared document state (6 named reds), sibling display (5),
manual-mode listener release (3), last-disconnect release (2), contract query identity (4), and
SC-010 invalid normalization (1). A first pass found the SC-012 radio-type arm also redding the
new `[SC-010]` upgrade case through a radio-typed test helper; the helper now locates checked
choices by value, and the re-run is clean.

**Operator follow-up — root-barrel export parity.** Independent inspection found
`packages/elements/custom-elements.json` advertising `THEME_DARK_SCHEME_QUERY` as a JavaScript export
of `./dist/index.js` (the manifest config rewrites every module path to that root) while
`packages/elements/src/index.ts` and the built `dist/index.js` did not export it; every adjacent
DOM-free contract value is a root export. The earlier handoff wrongly described the omission as a
deliberate choice.

- Red first: new `tests/node/theme-root-barrel.test.ts`, run with
  `npx vitest run --project node tests/node/theme-root-barrel.test.ts
  tests/node/theme-preference-contract.test.ts` — 1 failed / 10 passed:
  `expected [ 'THEME_DARK_SCHEME_QUERY' ] to deeply equal []`. The test lives in its own file
  because importing the root loads Lit's Node build, whose DOM shims made two DOM-global-absence
  assertions order-dependent when it first sat in the contract test file.
- Fix: one line in the authored barrel. Green: 11/11 (a node-only subset exits 1 by design on
  the suite-floor reporter, which requires the browser lane).
- Regenerated/checked from repository generators: `elements:analyze --skip-nx-cache` (manifest
  delta against HEAD unchanged by this fix — it already advertised the export),
  `build-react-wrappers` + `--check` (byte-identical twice) + 26-probe `--selftest`,
  `build-vue-types` + `--check`, `check-vue-template-types`, `check-manifest-content` 31/138 +
  15/15 self-test, uncached five-project typecheck, uncached `elements:build`; the built
  `dist/index.js` exports the constant and `dist/index.d.ts` declares it; `measure-elements-sizes`
  regenerated (ESM `dist/index.js` 249707 raw / 166585 minified bytes; IIFE and SRI unchanged)
  + `--check`; release graph 28/28 self-test, uncached `tokens,styles,elements` build, 4 packages
  packing with every export resolving; packed Vue types; offline load 31/31 + self-test.
- `npm test`: 52 files / 694 tests (45 Node, 649 Chromium), zero skipped, 18.6 s.
- The product tree changed, so Storybook was rebuilt (9.83 s) and both genuine headed-Chrome zoom
  levels were recaptured and inspected; the images are byte-identical to the first pass and
  `metrics.json` names the new tree `85cbf6e2413d695a242eef3870d497c91cc1f1f0`.
