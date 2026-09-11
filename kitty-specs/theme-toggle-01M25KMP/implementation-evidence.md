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

### Pass-6 remediation — dormant-document memory (M1), live() checked binding (L1), attribute-canonicalization documentation (L2), authored-preference guidance (L3)

Governed by Op `01M26W0YAJ4JHY5N6Y52352H13`; fresh Claude Code `frontend-freddy` seat, working in a
dedicated worktree from clean exact HEAD `bf2451016e7749a7f769150a822419157502851a` on
`mission/theme-toggle` (merge-base with `origin/train/elements-first`:
`9df4b5a1518c964816e1f47162dae02c8b0db71b`). Changes are left uncommitted for the orchestrator.

**Red first, against unchanged pass-6-rejected production code:**

- `npx vitest run --project browser fixtures/elements-behaviour/src/sk-theme-toggle.test.ts` — new
  M1 test `[SC-012] a manual preference survives a zero-control gap when storage is denied`:
  `AssertionError: expected 'system' to be 'dark'`. The test denies both `localStorage.getItem` and
  `.setItem`, selects Dark on the only connected control, removes it, mounts a new unassigned
  control, and asserts the new control shows the retained Dark preference with the root still dark
  and the System listener still released — a direct reproduction of the pass-6 M1 black-box probe
  (deny storage; select Dark; remove the only control; mount a new one; observe `system`/Light
  instead of the retained `dark`).
- The same run: new L1 test
  `[SC-012] a synchronous change-handler revert leaves exactly the reverted radio checked`:
  `AssertionError: expected [ 'light' ] to deeply equal [ 'dark' ]`. The test selects Dark (a full
  committed render), then selects Light with a synchronous `sk-theme-change` listener that reverts
  `preference` back to Dark before the listener returns. Real Chromium's native radio-group
  semantics check the Light input during the click, and Lit's non-`live()` `.checked=` binding
  compares only against its own last-committed value — unchanged since the prior Dark selection —
  so it never re-commits the Dark radio's `checked` property even though the DOM's native state
  changed underneath it. Both failures are behavioral: the browser executed the full DOM/event
  machinery and the failure is the wrong observed value, not a missing symbol or setup error.
- A third new test,
  `[SC-012] a System preference reconnects to the live OS state after a zero-control gap`, and a
  fourth, `[SC-010] a connected invalid markup preference attribute canonicalizes to System`, were
  written for the same fix but passed unchanged against the pass-6-rejected code: the System branch
  is unaffected by the M1 defect (a fresh coordinator's own default is already `system`, so the
  dormant-vs-fresh distinction is unobservable there), and Lit's own asynchronous `update()`
  reflection already corrects an invalid connected attribute string on the next render — the L2
  finding's "never reflected" was already inaccurate; both are kept as completeness/regression
  coverage and their non-red status is recorded honestly rather than overstated as a reproduction.

**Implementation.**

- `DocumentTheme.disconnect()` no longer deletes the module-private `documentThemes` WeakMap entry
  when the last control disconnects — it only stops the System listener. The coordinator, and the
  preference it holds, now survive a zero-control gap for as long as the `Document` itself is
  reachable, which is exactly the pre-paint bootstrap's own lifetime assumption; the WeakMap key
  ties cleanup to the document's own garbage collection, not to a manual delete.
- `DocumentTheme` gains a persistent `#initialized` flag. `#controls.size === 0` is true both for a
  document that has never had a `connect()` call and for one that is merely dormant after every
  control disconnected; `#initialized` is the only signal that distinguishes them, since deleting
  the flag would repeat the M1 defect one level up.
- `connect()` is re-derived from first principles rather than patched: a control joining a
  still-populated document always adopts the live, sibling-synchronized preference (unchanged —
  storage is never stronger than a connected sibling). A control joining an *empty* document
  (`wasEmpty`) prefers its own freshly-read value — matching a genuine fresh page load, or another
  script's same-tab write — unless storage cannot currently be read, in which case only the
  dormant in-memory preference survived the gap and must not be discarded for a control's
  storage-denied `system` default. This is the M1 fix; it also makes `connect()` correct for the
  ordinary "stored 'light'/'dark' resolves" contract cases that a naive "always trust the dormant
  coordinator" fix would have broken (a fresh element populated from real, readable storage must
  win over a stale dormant value from a different prior page state).
- A control joining an empty document also re-queries `matchMedia` (`this.#media = mediaQuery()`)
  before publishing, so a dormant System remount resolves against the environment's current state
  and reinstalls exactly one listener, rather than trusting whatever `MediaQueryList` the previous
  connect captured.
- A new local `canReadStorage()` helper (module-private to `sk-theme-toggle.ts`; imports the
  already-public `THEME_STORAGE_KEY` constant, adding no new export) attempts `storage.getItem()`
  and reports whether the call itself succeeded, distinguishing "storage denied/throwing" from
  "storage readable but empty or invalid" — the DOM-free `theme-preference.ts` contract's own
  `readThemePreference()` collapses both into `system` by design and was left untouched.
- L1: the radio template's `.checked=${this.preference === value}` becomes
  `.checked=${live(this.preference === value)}` (new `import { live } from 'lit/directives/live.js'`).
  `live()` compares against the actual DOM property instead of Lit's own committed-value cache,
  which is exactly the mismatch the red-first repro exploits.
- L2: no production change. Lit's `_$attributeToProperty` reentrancy guard
  (`__reflectingProperty`) is cleared synchronously once the attribute-to-property conversion
  itself returns, before the next asynchronous `update()` pass runs — so a property change that
  originated from an invalid connected attribute is *not* exempt from the following render's normal
  `reflect: true` write-back. Verified directly: mounting `sk-theme-toggle` with a raw
  `preference="sepia"` attribute leaves the attribute literally `"sepia"` for one synchronous tick,
  then Lit's own next render corrects it to `"system"` — already true on the pass-6-rejected code.
- L3: documentation only.

**Documentation (`docs/design-system/using-components.md`).** The multi-control paragraph now
states the dormant-survives-a-gap contract precisely (adopts the live sibling value; on an empty
document, re-reads storage unless storage cannot be read, in which case the retained value wins).
A new paragraph tells ordinary consumers to omit `preference` entirely so the stored/bootstrap
value governs, and that supplying it is an explicit *initial* override that does not itself persist
(L3). The invalid-value paragraph replaces "it is never reflected" with the true, narrower claim:
invalid JavaScript/property assignment reflects immediately; an invalid raw connected attribute is
corrected once the element's next update commits (L2).

**Green.**

- Full focused file: `npx vitest run --project browser fixtures/elements-behaviour/src/sk-theme-toggle.test.ts`
  — 45/45 passed (41 pre-existing + 4 new).
- Node contract: `tests/node/theme-preference-contract.test.ts` 10/10;
  `tests/node/theme-root-barrel.test.ts` 1/1 (unaffected by this remediation; re-run for
  completeness since the DOM-free contract module is upstream of the changed file).
- Composed pattern: `fixtures/elements-behaviour/src/pattern-operational-status.test.ts` 13/13.
- `npm test` (FORCE_COLOR/NO_COLOR unset — see the React-wrapper note below): 54 files / 709 tests
  (56 Node, 653 Chromium), zero skipped; `node scripts/measure-suite-time.mjs`: 19.3 s against the
  40 s ceiling.
- `NX_SKIP_NX_CACHE=true node scripts/typecheck-all.mjs`: all 5 declared projects passed.
- `npm run quality:all`: zero errors (29 pre-existing `security/detect-object-injection` warnings
  in unrelated fixture files, unchanged by this remediation).
- Generators regenerated from authored sources and rechecked, each idempotent afterward:
  `npx nx run elements:analyze` (manifest: description text only — 31 registered elements, 138
  documented public surfaces, both counts unchanged); `node scripts/build-react-wrappers.mjs`
  (regenerate) then `--check` twice **with `FORCE_COLOR`/`NO_COLOR` explicitly unset** — byte-
  identical both times (65 files, 31 elements) — the session shell exports both variables, and with
  them set the check's third-party generator subprocess returns its result but leaves the Node
  event loop alive past the harness's SIGTERM window, which is tooling friction, not drift (see
  prior-cycle evidence and this repository's own memory note); `--selftest` 26/26 probes;
  `node scripts/build-vue-types.mjs` (regenerate) + `--check` (31 elements);
  `check-vue-template-types.mjs` and `check-vue-packed-types.mjs` (after an uncached
  `tokens,styles,elements` build) both passed; `build-elements-css.mjs --check` (31 components
  current); `build-element-markup.mjs --check` (11) and `build-styles-only-markup.mjs --check` (18
  styles-only barrels); `check-manifest-content.mjs` (31/138, all described);
  `check-pattern-composition.mjs` (9 fixtures, 256 inline rules, 22 composed tags, all parts inside
  the 142-part ratchet); `check-behaviour-fixture-imports.mjs` (35 files, none reaching the package
  barrel — after removing an untracked `__screenshots__/sk-theme-toggle.test.ts/` directory this
  seat's own earlier failed-assertion runs had left behind, which the gate correctly refused to
  read as a source file); `check-gate-wiring.mjs`; `check-adopted-css-boundaries.mjs`,
  `check-element-css-hygiene.mjs`, `check-story-theme-wrapper.mjs`, `check-part-ratchet.mjs`;
  `check-component-public-contract.mjs --selftest` (6/6) and `check-component-token-literals.mjs
  --selftest` (27/27) plus a direct run against `packages/styles/src/theme-toggle/sk-theme-toggle.css`;
  `npx nx run tokens:build && npx nx run tokens:catalogue` (catalogue diff was timestamp-only —
  reverted, since token content did not change); release graph
  (`check-release-graph.mjs`, 4 packages / all exports resolving, plus `--selftest` 28/28),
  `measure-elements-sizes.mjs` (regenerated — the new `canReadStorage` helper, `live()` import, and
  expanded comments grew the bundle from 243.9/262.5 KiB to 244.9/264.4 KiB raw ESM/IIFE; `SIZES.md`
  and its worked example were regenerated, not hand-edited) + `--check`, `check-offline-load.mjs`
  (31/31 elements upgraded, zero off-machine requests) + `--selftest`; `check-adr-index.mjs` and
  `check-llms-adr-surface.mjs` (both unaffected, both pass).
- Storybook rebuilt three times as the generated tree changed underneath it (each `build-storybook-
  with-budget.mjs` run 10–12 s against the 180 s ceiling); `gate-selftest.mjs` 50/50 shapes
  classified correctly; `run-axe-storybook.js` — 668/668 rendered stories, zero WCAG 2.1 AA
  violations; `assemble-demo-dist.sh` — 42/42 references resolved (re-run once after a later
  Storybook rebuild had cleared the previously assembled demo pages out of `storybook-static`,
  which is the exact cause of a transient `nav-pill-behaviour.spec.ts` failure recorded and
  resolved below, not a product regression).
- Playwright (Chromium + Firefox) on isolated `STORYBOOK_PORT=6324`: **default port 6006 was
  occupied by an unrelated checkout's already-running `http-server`**, serving stale Storybook
  content missing the operational-status theme stories; Playwright's `webServer` silently reuses
  whatever already listens on its configured port rather than verifying its content, so the first
  runs against the default port produced 28 failures — every `sk-theme-toggle-pattern.spec.ts` case
  (timing out waiting for `[data-theme-composition]` to render) plus unrelated
  `elements-load.spec.ts`, `nav-pill-behaviour.spec.ts`, and `sk-progress.spec.ts` cases — none of
  it theme-toggle regression evidence. Re-run on the free port 6324: `sk-theme-toggle-pattern.spec.ts`
  12/12 and `theme-no-js.spec.ts` 2/2 passed on both browsers immediately. The full suite on 6324
  then showed 3 failures (the stale-demo-assembly `nav-pill-behaviour.spec.ts` case, closed by
  re-running `assemble-demo-dist.sh`, and two different sub-cases of `sk-action-row.spec.ts`'s
  keyboard-Enter hash-navigation test — a test already "classified flaky" in this mission's own
  prior-cycle evidence, unrelated to theme-toggle, unowned by this remediation). The final full run
  on 6324: **1364 passed, 1 failed (`sk-action-row.spec.ts`, the same flaky test, yet another
  sub-case), 49 skipped** — zero theme-toggle-related failures; the flaky case passed cleanly on an
  isolated single-worker retry immediately afterward.
- ADR-11 falsification of the three new arms (below) was applied and reverted directly against the
  production source, each verified restored via `md5sum` equality before/after, rather than only
  through the deterministic-registry sweep.
- The deterministic mutation sweep (`node scripts/suite-selftest.mjs`, 263 arms) ran four times in
  this cycle. The first run surfaced a real, load-bearing finding, closed below (a pre-existing arm
  whose exact source pattern the M1 refactor removed). The last run is the current record, stated
  factually: **259 of 263 arms produced their named red with no collateral, including the three new
  pass-6 arms and the corrected pre-existing arm. Four did not: three runs failed on the repeated
  `Failed to fetch dynamically imported module` transport error, and one intermittent existing arm
  ("System installs only a complete media-query listener lifecycle pair") hit the harness's 180-second
  timeout.** That arm's mutated code is untouched by this remediation, and neither failure mode names
  a #323 source or config change; no root cause for either was established in this seat, and neither
  claim is asserted here as environmental — that determination is left to whoever reruns the sweep.
  This run is not reported as clean. The three new arms' and the corrected arm's own direct,
  isolated falsifications (below) are the load-bearing red-first evidence; the full-sweep run is
  corroborating, not primary. **A full 263/263 sweep against the exact post-rebase HEAD is
  mandatory before acceptance** — this mission's own gate inventory requires the deterministic
  mutation sweep at the exact-head point-cut, and the four outstanding results above have not been
  re-derived there.

**Arm record (mutations.json now 263 arms; three new, all reusing existing SC-012/SC-010 pairs — no
new behaviour id was needed since `behaviours.json`'s SC-012/SC-010 pairs for the
`sk-theme-toggle.ts` subject already existed).** Each was applied directly to the production
source, run against the full `sk-theme-toggle.test.ts` file, confirmed to redden only its named
test with the other 44 green, then the source was restored and verified byte-identical by
`md5sum`:

- SC-012 "a dormant document trusts storage over the last in-memory preference" — mutates `useOwn`'s
  `canReadStorage(storage())` term to a literal `true`. RED: `[SC-012] a manual preference survives
  a zero-control gap when storage is denied` — `expected 'system' to be 'dark'`. No collateral.
- SC-012 "the last disconnected control's coordinator is forgotten rather than kept dormant" —
  reintroduces the deleted `documentThemes.delete(this.#document);` call in `disconnect()`. RED: the
  same M1 test, same failure. No collateral.
- SC-012 "the radio checked binding trusts Lit's cache instead of the live DOM property" — removes
  the `live()` wrapper. RED: `[SC-012] a synchronous change-handler revert leaves exactly the
  reverted radio checked` — `expected [ 'light' ] to deeply equal [ 'dark' ]`. No collateral.

**A pre-existing arm's `from` pattern went stale and was corrected, not silently dropped.** The
first full-sweep run surfaced `❌ SC-012 PATTERN NOT FOUND` for the pre-existing arm "the last
disconnected control releases the shared System listener." Its `from` text
(`"    if (this.#controls.size === 0) {\n      this.#stopListening();"`) matched the OLD
multi-line braced `disconnect()` body; the M1 refactor collapsed `disconnect()` to a single-line
conditional, so that exact substring no longer exists — a mechanical consequence of the refactor,
not a deliberate change to this arm's claim. Fixed by re-deriving the `from`/`to` pair against the
new single-line body (`"    if (this.#controls.size === 0) this.#stopListening();"` →
`"    if (false) this.#stopListening();"`), preserving the arm's original name and behavioral
claim. A manual `vitest run` of the whole subject file showed this corrected mutation collaterally
failing several other tests, which looked at first like a genuinely broader arm needing
`expectCollateral: true` — but the canonical harness's own two independent runs both reported "no
collateral" for it. The harness's `isBehaviourTest` filter (`/\[SC-\d+\]/`) and its own impact-graph
test selection are narrower and more precise than a bare whole-file `vitest run`, which is why the
two disagreed; the canonical harness's verdict is authoritative, so `expectCollateral` was left
unset (its default) to match. Verified clean across the harness's own two subsequent full runs.

**A genuine test/mutation coupling was found and fixed during this remediation, not left latent.**
The first draft of the L1 test triggered its revert from `event.detail.preference` (the emitted
`CustomEvent`'s own field) rather than the element's own `preference` getter. Running the
deterministic sweep exposed this immediately: the pre-existing SC-007 arm (which hardcodes
`detail.preference` to the literal `'system'` to prove the event's detail-shape contract) made the
revert condition (`detail.preference === 'light'`) permanently false, so the revert never fired and
the L1 test went red for the wrong reason — a real, if narrow, instance of the same "test-evidence
coupling" class this mission has hit before (the SC-012 radio-type/SC-006 event coupling from
review-cycle-1 remediation). The fix reads `element.preference` (the element's own live getter,
set synchronously before the event is even constructed) instead of the event's mutable `detail`
field; re-running the SC-007 arm directly afterward confirmed it reds only its own named test with
zero collateral, and the M1/L1 arms above were re-verified against the corrected test.

**Not run by this seat:** the Chromium visual-regression job (`PW_INCLUDE_VISUAL=1`) — this
remediation touches no CSS, markup, or visual composition (pure JS lifecycle/coordination logic
plus one Lit directive), and prior cycles already established the local host-font-geometry
baseline-drift class as pre-existing and CI-authoritative; WebKit (this workstation still lacks
GTK4/ICU/JPEG/GStreamer, as in every prior cycle); `npm run quality:commitlint` (no commit was made
in this remediation, per the governing instruction). Genuine headed-Chrome 100%/200% zoom evidence
was re-captured on the changed product tree and inspected directly (recorded separately in
`docs/architecture/validation/issue-323-theme-toggle/browser-zoom/`).

**Operator note — an unrelated session's process was inadvertently terminated.** While diagnosing a
mutation-sweep collision, this seat ran `pkill -f "scripts/suite-selftest.mjs"` intending to stop
only its own run; the pattern matched by command-line substring regardless of working directory and
also killed PID 477996, an unrelated session's own full mutation sweep against a different checkout
(`/home/jeroennouws/dev/spec-kitty-design-missions/304`, working on issue #380, mid-flight since
02:38). No file in that checkout was touched — only the process was killed. The operator should
tell whoever owns that session so it can be re-run; this seat had no way to notify it directly.

### Pass-7 remediation (Op `01M275TD2FV77BEVH8D65XW4DC`)

Governed by Op `01M275TD2FV77BEVH8D65XW4DC`. The seat was a fresh Claude Code `frontend-freddy` on
Opus, in worktree `.claude/worktrees/theme-toggle-pass6-remediation` on branch
`worktree-theme-toggle-pass7-remediation`. It started from clean mission head
`6c58764c1b582b757b5b4e9d6dcb11d624041281`. Changes are left uncommitted.

#### Red first, against the unmodified pass-6 production source

At these runs only the two test files had been edited.

`npx vitest run --project browser fixtures/elements-behaviour/src/sk-theme-toggle.test.ts` gave
**8 failed / 47 passed (55)**:

| Finding | Test that failed | Assertion |
| --- | --- | --- |
| F1(a) | `[SC-012] a choice storage refused to save survives a zero-control gap while reads still work` | `AssertionError: expected { preference: 'system', …(3) } to deeply equal { preference: 'dark', …(3) }` (stored `null`) |
| F1(a) | `[SC-012] a choice made after storage fills survives a gap instead of the last saved one` | `AssertionError: expected { preference: 'light', …(3) } to deeply equal { preference: 'dark', …(3) }` (stored `"light"`) |
| F1(a) | `[SC-012] after adopting another script's write, an unsaved choice still survives the next gap` | `AssertionError: expected { preference: 'dark', …(3) } to deeply equal { preference: 'light', …(3) }` |
| F1(b) | `[SC-012] a detached control reconnecting into an empty document shows the choice saved since it left` | `AssertionError: expected { preference: 'system', …(3) } to deeply equal { preference: 'dark', …(3) }` (stored `"dark"`) |
| F1 (docs claim) | `[SC-012] a same-tab storage write made while the document is dormant wins for the same control reattached` | `AssertionError: expected { preference: 'dark', …(3) } to deeply equal { preference: 'light', …(3) }` |
| F2 | `[SC-012] a synchronous change-handler revert is what storage keeps for the next load` | `AssertionError: expected { stored: 'light', root: 'dark' } to deeply equal { stored: 'dark', root: 'dark' }` |
| F8 | `[SC-010] an invalid attribute written onto a rendered system control canonicalizes to System`, and the same test for a rendered `light` control | Both: `expected { preference: 'system', …(3) } to deeply equal { preference: 'system', …(3) }`, diff `- "attribute": "system"` / `+ "attribute": "sepia"` |

These tests passed against the pass-6 code, and are kept as seam coverage rather than claimed as
reproductions:

- the `a new control` same-tab variant, because pass 6 already re-read storage for a fresh
  element;
- `[SC-012] a choice made after storage stops answering survives a gap instead of the last saved
  one`, because pass 6 already kept dormant memory when reads throw;
- the rewritten System-reconnect test, because pass 6 already re-queried matchMedia.

For F9, `npx vitest run --project browser fixtures/elements-behaviour/src/pattern-operational-status.test.ts`
gave **1 failed / 13 passed (14)**. `the composition leaves the theme preference to storage unless
the caller passes one` received `default: { preference: "dark", root: "dark" }` where
`{ preference: "light", root: "light" }` was expected, because the exemplar bound `.preference=${'dark'}`.

For F4(b), the System-reconnect test used to reuse one `FakeMediaQueryList`. It now installs a
fresh list, dark this time, between remove and remount, so a remount that kept the old light list
resolves light and fails.

#### Implementation (`packages/elements/src/theme-toggle/sk-theme-toggle.ts`)

- **F1.** `DocumentTheme` replaces `#initialized` with `#stored`: the stored preference this
  document last read or saved, `undefined` until one is known.
  - `connect()` publishes one of three values:
    - the assigned preference, when a preference was assigned before connect;
    - the live preference, when the document is still populated;
    - `#resume()`, when the document is empty.
  - `#resume()` returns the dormant preference in two cases: when `canReadStorage()` fails, and
    when `readThemePreference()` equals `#stored`. Otherwise it records the read and adopts it.
  - A never-joined document falls out of the same rule. `#stored` is `undefined`, so any readable
    value is adopted; unreadable storage keeps the default System.
  - The joining control's constructor-time value is no longer used on an empty document.
- **F2.** `#select` dispatches `sk-theme-change` first and then calls
  `documentThemeFor(this.ownerDocument).persist(this.preference)`, which writes once.
  `persist()` records `#stored` only when `writeThemePreference()` returns `true`. Its boolean was
  previously discarded.
- **F8.** An `attributeChangedCallback` override calls `super` and then, for a non-null invalid
  `preference` value, calls `this.requestUpdate('preference', value)`. Lit sets
  `__reflectingProperty` during attribute conversion, which suppressed the reflection. The
  requested update reflects `system` on the next render.
- The element JSDoc, and therefore the manifest, React and Vue description text, now states the
  resume rule.
- **F9 (`packages/elements/src/patterns/operational-status.ts` and its stories).** The control is
  unbound by default, and `preference=${options.preference ?? nothing}` renders an attribute only
  for an explicit override.
  - It is an attribute binding rather than a property binding because a property binding of
    `nothing` assigns `undefined`, and an assigned invalid value is itself an override: it
    normalizes to System.
  - Every story now renders unbound. Each state, the manual ones included, is the stored preference
    the story's `themePreference` parameter seeds.
- **F6.** Not folded; see below.

#### Tests (`fixtures/elements-behaviour/src/sk-theme-toggle.test.ts`)

- F3: a `resetDocumentTheme()` `beforeEach` pins both halves of the dormant state through the
  public contract.
  - An assigned System at connect pins the preference.
  - A seeded-System connect pins the remembered stored value.
- F3 starting-state assertions:
  - the two denied-storage tests assert `system` before they choose Dark, so each choice is now a
    real selection;
  - the test that expects `toBe('system')` is now order-independent;
  - every new test asserts its start.
- New `[SC-012]` tests: the write-denied probe, filled-quota after a saved choice, reads stop
  answering after a saved choice, adopting another script's write, the stale detached instance,
  same-tab write while dormant (both variants), and the F2 storage-keeps-the-revert test.
- New `[SC-010]` tests: the rendered-attribute canonicalization cases.
- The F4(b) fresh-media reconnect test.
- The F9 test in `pattern-operational-status.test.ts`. It first connects a bare control against
  stored Dark so that the composition's connect sees storage change, independent of test order.

#### Playwright (`apps/storybook/src/tests/sk-theme-toggle-pattern.spec.ts`)

- **F7.** `measuredTheme(page, root, expected)` asserts the root `data-theme` and `color-scheme`
  equal the expected theme. It asserts which side of the 0.5 luminance threshold the surface falls
  on, and keeps AA contrast. It also reports `themeScopes`: every `.sk-light` or nested
  `data-theme` ancestor.
  - Default, LightMode, System-light, System-dark, manual Light and manual Dark all pass their
    expected theme.
  - System-light, System-dark, manual Light, manual Dark and Default require empty `themeScopes`,
    so the root attribute alone re-themes the surface.
  - LightMode is recorded as the wrapper-confounded case.
- **F5.** `expectCheckedStandsOutWithoutColour()` compares the checked label's
  `border-block-end-style`, `border-block-end-width` and `font-weight` with each unchecked label.
  The two unchecked labels must match each other, and the checked one must differ from both. It
  runs on the Greyscale story (Dark checked) and under forced colours (Light checked).
  `packages/styles/src/theme-toggle/sk-theme-toggle.css` was not changed, because the assertion
  passed against the shipped sheet.

#### F7 and F5 red-first, by probe

Neither finding changes production, so red-first is a demonstration that the new assertions
discriminate. Each probe was applied, Storybook rebuilt, and the files restored and verified
byte-identical (sha256); Storybook was then rebuilt clean.

- **Probe 1 was invalid, and it is recorded as not being evidence.** It disabled the root light
  selector in `packages/tokens/src/tokens.css`. `tokens:build` refused the edit, because
  `scripts/build-tokens-css.mjs` requires exactly one authored
  `:root[data-theme="light"], .sk-light` block. The Storybook build therefore exited 130, and both
  specs ran against the old build and passed.
- **Probe 2 was valid.** It made two temporary changes:
  - A composition rule, `:root[data-theme="light"] .sk-pattern-operations:not(.sk-light) {
    color: #F8F5EC; background: #0D0E11; }`. This is root-says-light-but-the-surface-stays-dark,
    the #93 failure mode, and it leaves the `.sk-light` LightMode alone.
  - The checked choice's non-colour cues were removed from the CSS: `border-style`,
    `border-width` and `font-weight`, and the forced-colours `border-block-end-style` and
    `border-block-end-width`.
- Results in Chromium:
  - **Old HEAD spec: 1 failed, 11 passed.** The SC-004 cases (System-light, manual Light/Dark),
    greyscale and forced-colours all passed. Only the axe test failed: it visits `system-light`,
    and the probe's dark surface raised contrast violations there.
  - **New spec: 5 failed, 7 passed.**
    - `System-light …` and `manual Light and Dark …` failed with `light surface rgb(13, 14, 17)
      has luminance 0.004`.
    - `greyscale …` failed with `Dark (checked) against System (unchecked)`.
    - `forced colours …` failed with `Light (checked) against System (unchecked)`.
    - The same axe test failed.

#### Green

- Focused theme browser file: 55/55. The pattern file: 14/14 (69/69 together).
- Node: `tests/node/theme-preference-contract.test.ts` 10/10 and
  `tests/node/theme-root-barrel.test.ts` 1/1.
- `npm test` with `FORCE_COLOR` and `NO_COLOR` unset, on the final tree: **55 files / 730 tests**
  (node 58, chromium 672), zero skipped, with the suite floor satisfied.
- `NX_SKIP_NX_CACHE=true node scripts/typecheck-all.mjs`: 5/5 projects.
- `npm run quality:all`: 0 errors and 32 `security/detect-object-injection` warnings. One was
  introduced by this pass, at `pattern-operational-status.test.ts:199`, and was fixed by using a
  `Map`. Direct eslint of both touched fixture files then reported nothing, and every remaining
  warning is in a file this pass did not modify.
- Regenerated: `npx nx run elements:build --skip-nx-cache`,
  `npx nx run elements:analyze --skip-nx-cache`, `node scripts/build-react-wrappers.mjs` and
  `node scripts/build-vue-types.mjs`. The only derived drift is the JSDoc description in
  `custom-elements.json`, `vue.d.ts` and `packages/react/src/SkThemeToggle.d.ts`.
- `P="$(node scripts/release-graph.mjs --projects)"` (`tokens,styles,elements`), then
  `npx nx run-many --target=build --projects="$P" --skip-nx-cache`, then
  `node scripts/measure-elements-sizes.mjs` rewrote `SIZES.md`, and `--check` reports it up to
  date. `packages/tokens/dist/token-catalogue.json` did not change.
- Checks, all exit 0:
  - generator checks: `build-theme-bootstrap.mjs --check`, `build-element-markup.mjs --check`
    (11), `build-react-wrappers.mjs --check` (65 files, 31 elements, two runs byte-identical),
    `build-vue-types.mjs --check` (31), `build-elements-css.mjs --check` (31);
  - manifest and composition: `check-manifest-content.mjs` (139 surfaces, 31 elements),
    `check-pattern-composition.mjs` (9 fixtures, 256 inline rules, 22 tags, 142-part ratchet);
  - imports and Vue types: `check-behaviour-fixture-imports.mjs` (35),
    `check-vue-template-types.mjs`, `check-vue-packed-types.mjs`;
  - entries and contract: `check-elements-entries.mjs` (31),
    `check-component-public-contract.mjs --selftest` (6/6);
  - stories and parts: `check-story-theme-wrapper.mjs` (70 story files, no new inert wrapper),
    `check-part-ratchet.mjs` (142);
  - release and load: `check-release-graph.mjs` (4 packages), `check-offline-load.mjs` (31/31
    from the packed tarballs, zero off-machine requests);
  - wiring and CSS: `check-gate-wiring.mjs`, `check-adopted-css-boundaries.mjs`,
    `check-element-css-hygiene.mjs`, `check-component-token-literals.mjs --selftest` (27/27).
- Storybook: `node scripts/build-storybook-with-budget.mjs`, about 9 s against the 180 s ceiling.
  Playwright with `STORYBOOK_PORT=6392`, Chromium and Firefox,
  `sk-theme-toggle-pattern.spec.ts` + `theme-no-js.spec.ts`: **25 passed, 3 skipped**. The skips
  are the Chromium-owned forced-colours, HiDPI and axe cases in Firefox.
- `git diff --check`: clean.

#### Arm record

`mutations.json` goes from 263 to 272 arms. All arms reuse existing `(id, subject)` pairs, so no
behaviour id was minted.

Each arm was applied in place with a single-arm prover. The prover reproduces `suite-selftest.mjs`'s
verdict: the named `[id]` test in `subject` fails, and no other `[SC-NNN]` test fails. It ran
`vitest run --project browser` over both related subject files: `sk-theme-toggle.test.ts` and
`pattern-operational-status.test.ts`, 69 tests. Afterwards it restored the file and compared
sha256 hashes, and every arm was restored byte-identical.

The "failed" figure counts all failing tests of the 69, including unmarked tests, which are
invisible to guard 5.

| Arm | Mutation | Failed | Named red |
| --- | --- | ---: | --- |
| *Re-derived:* `a dormant document trusts storage over the last in-memory preference` | `if (!canReadStorage(store)) return this.#preference;` becomes `if (!true) …` | 1 | the reads-stop-answering test |
| `a dormant document re-reads readable storage rather than always resuming memory` | the same anchor becomes `if (!false) …` | 5 | the adopting test and both same-tab variants |
| `a dormant document adopts storage only when it changed since the page last read or saved it` | the `stored === this.#stored` guard becomes `false` | 3 | the refused-save, filled-quota and adopting tests |
| `an adopted stored value becomes the value the page remembers having read` | the adopt path no longer records `#stored` | 2 | the adopting test |
| `a write storage refused is not remembered as saved` | a refused write is recorded anyway | 3 | the refused-save, filled-quota and adopting tests |
| `an empty document re-reads storage instead of the joining control's constructor-time value` | an empty document publishes the joining control's own value | 7 | seven SC-012 tests, including the detached-instance and reattached same-tab tests |
| `an empty document re-queries matchMedia rather than reusing the list it captured first` | `if (!this.#media)` | 22 | six SC-012 tests, including the fresh-list System reconnect |
| `a selection saves the preference the page settled on after dispatch` | `persist(input.value …)` | 1 | the F2 test, `expected { stored: 'light', root: 'dark' } …` |
| `System installs only a complete modern media-query listener pair` | the `removeEventListener` check is dropped | 1 | the incomplete-`modern` test, `expected 1 to be +0` |
| `an invalid attribute written onto a rendered control is reflected back as System` (SC-010) | the requested reflection is removed | 2 | both rendered-attribute cases |

The "re-reads readable storage" arm first failed guard 5. Its collateral was
`[SC-006][SC-007][SC-008] a user choice emits once…`: the first reset drove the preference through
storage, so the mutation leaked Dark into the event test and its click selected nothing. The reset
now pins the preference by assignment, and the arm was re-proved clean without `expectCollateral`.

These existing arms were re-proved against the changed test file, each with a named red, no marked
collateral and a byte-identical restore:

- SC-006, SC-007 and SC-008 on the event contract;
- the SC-011 composition arm;
- the eleven sk-theme-toggle and theme-preference arms numbered 249–259;
- the pass-6 "coordinator is forgotten" arm, which now reds five SC-012 tests;
- the pass-6 `live()` arm.

The restored hashes are:

- `sk-theme-toggle.ts`: `d2f7a09a803974b716fd4c46dcf33a743a833de685a3964688d3303022034ea5`;
- `operational-status.ts`: `78b9f843fcc63895e93b17bab5cf8616731460c55d6380d2c0576e5105fb278e`;
- `theme-preference.ts`: `7eb94419328710b0019d36be564ecfbad3c4f3c62e5d7417c6e12c872de72299`.

The full sweep, `node scripts/suite-selftest.mjs` over 272 arms, was **not** run by this seat. It is
the orchestrator's final-tree gate.

#### F6, not folded

Replacing the accessors' `'system' | 'light' | 'dark'` with the imported `ThemePreference` changes
generated output:

- `custom-elements.json` type text becomes `"ThemePreference"`;
- `vue.d.ts` gains `'preference'?: ThemePreference;`, a type that declaration file does not import;
- `SkThemeToggle.d.ts` changes as well.

The fold was reverted, and analyze, React and Vue were regenerated. The outputs are byte-identical
to the pre-fold generation, compared by sha256 over the manifest, `vue.d.ts` and every tracked
`packages/react/src` file.

#### Zoom evidence

This was a genuine headed-Chrome recapture on the final tree; see `browser-zoom/README.md` and
`metrics.json`. It covers the zoom-200 route and, new this pass, LightMode, each at 100% and 200%.
All four images were inspected directly. On the zoom-200 route the geometry and keyboard sequence
are numerically identical to pass 6, while the PNG bytes differ because the capture port (6431)
and the pointer position differ.

The pass-6 capture helpers were not preserved. The documented method was re-implemented outside
the repository (a Playwright driver, a python-xlib XTEST helper and an FFmpeg `x11grab` grab),
and they are not committed.

#### Not run by this seat

- WebKit, because this workstation still lacks its system libraries.
- The full 272-arm mutation sweep, the orchestrator's gate on the final tree.
- The full Playwright suite, `run-axe-storybook.js` and the Chromium visual-regression job. Only
  the two theme specs were run. No CSS changed, and the composition's rendered state is unchanged:
  the bound property became a reflected attribute of the same value.
- `npm run quality:commitlint`, because no commit was made.

Failure screenshots written by the red-first runs, in an untracked
`fixtures/elements-behaviour/src/__screenshots__/` directory, were removed before the gates.
