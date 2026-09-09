# Issue #274 rail-preserving app-shell evidence

## Evidence identity

- Mission: `work-explorer-rail-preserving-app-shell-01M21A0P`, WP01.
- Initial implementation base: `origin/train/elements-first` at
  `86058d912313360d78cdbcf66cbc4b034389a7b4`, which contains #254 / PR #268.
- Initial safe product commit: `5532a3c1b5a7a69cdd2cb0ab2494147e3770e507`.
- Latest-train refresh before handoff found #270 at
  `7bcb8cacbf2ab7d662cfc924075ddf5005e6f7f2`; the implementation was rebased and
  regenerated on that exact train at `c6dc095bd83b5d4632a8c6ef601f9783073cca12`.
- The clean product-delivery branch was subsequently rebased and regenerated after #271 on exact
  train `a679d8374087e2d81198ce00398f4862c839f293`; no mission or Op metadata was transferred.
- The immutable-head correction cycle was rebased and regenerated again after #272 on exact train
  `c3cc2dedeb092a0b517e763847e6f1a498ed6323`.
- After #273 landed, the complete delivery was rebased and regenerated on exact train
  `674ebe23bea974eb8bef2dbd64f4481e5f94d212` (tree
  `c72f050bfad130fa1c486856201b782afcdb55d8`). The product-plus-generated tree exercised by the
  final browser-UI zoom check is commit `56688d5956ad7ebc8d1f2eedb8b939225a7936de`.
- The final handoff SHA is the commit containing this ledger and is therefore recorded by the
  Spec Kitty transition and Git history rather than circularly embedded here.
- Delivery remains one WP and one future PR to `train/elements-first`. No push or PR is part of
  this implementer handoff.

## Contract delivered

`SkAppShellPresentation` is exactly `'compact' | 'rail-preserving' | undefined`.
`rail-preserving` uses the existing ResizeObserver content-box logical inline size and is
effective through the inclusive 1100 CSS-pixel boundary. In that state the personal rail remains
the token-defined 56px column, context alone is suppressed, the existing compact header is
exposed, and the existing controlled compact navigation follows `open`. At 1101 the existing
three-column wide layout returns. The compact 860/861 contract and omitted-presentation legacy
720 physical-width contract remain unchanged.

The implementation reuses #254's single observer, exposure leases, direct slot assignment,
nearest-shell Escape ownership, `sk-app-shell-dismiss`, bounded post-dispatch closure sample,
trigger validation, and focus release/return paths. It adds no router, inferred route/state,
drawer, slot, part, property beyond the presentation value, event, timer, public Work Explorer
surface, or Team Kitty domain logic.

## Test-first evidence

Before the product source changed:

- the focused native/React run failed only the new rail-preserving contract assertions while the
  retained compact/default controls stayed green;
- `npx nx run react:typecheck` rejected `presentation="rail-preserving"` with TypeScript
  `TS2322`;
- the rebuilt focused Chromium/Firefox browser run produced 20 intended rail-preserving layout
  failures while 52 retained checks stayed green.

After the source correction:

- `npx vitest run fixtures/elements-behaviour/src/sk-app-shell.test.ts fixtures/react-consumer/src/sk-app-shell.test.tsx --reporter=default`
  passed 47/47;
- `npx nx run react:typecheck`, `npx nx run react-consumer-fixture:typecheck`,
  `npx nx run vue-consumer-fixture:typecheck`, and
  `node scripts/check-vue-template-types.mjs` passed;
- the isolated focused Chromium/Firefox app-shell run passed 72/72;
- the final full Chromium/Firefox repository run passed 628 with 18 intentional skips and zero
  failures after the canonical demo assembler ran.

The immutable-head review correction then replaced the constrained 1280px proxy with real browser
viewports at 1280, 1101, 1100, 1024, 768 and 390 CSS px. The browser assertions now measure page
overflow at the true viewport, pin the wide/default 56px rail + 240px context + content geometry,
retain separate constrained-shell coverage, and exercise both `vertical-rl` and `sideways-rl`.
The consumer-owned Menu trigger now derives a 44 by 44 CSS-pixel minimum from existing spacing
tokens. RED on both Chromium and Firefox measured the old trigger at only 26px high (72 passed,
2 failed); after the story correction the same focused command passed 74/74. The native/React
focused assertions remained green at 48/48; as expected, that deliberately partial direct Vitest
invocation exited nonzero only because the repository-wide assertion-floor reporter requires every
lane and subject. It is not represented as a full-suite pass.

Two initial commands used the obsolete Nx project names `react-consumer:typecheck` and
`vue-consumer:typecheck`; both failed with “Cannot find project”. They were immediately corrected
to the live `*-fixture:typecheck` targets above. The failed aliases are not represented as gate
passes.

## Generated outputs and registries

The authored sources were followed by the canonical CSS, markup, CEM, React, Vue, build, and size
generators. The derived app-shell CSS module, CEM union/documentation, React declaration, Vue
declaration, story inventory, and size report changed. The React runtime wrapper, app-shell CSS
declaration, markup barrels, part/docs ratchets, token catalogue, and unrelated generated files
remained no-ops.

After #270, #271, #272, #273, and the independently integrated checkbox-choice-group work landed,
the train-owned stories plus WP01's 14 rail-preserving stories were reconciled to 405 unique
ratcheted story IDs.
`packages/elements/SIZES.md` was regenerated from that merged source rather than conflict-edited
as final output.

Ten new surgical mutations cover valid-value recognition, inclusive TypeScript and CSS 1100
thresholds, logical `max-inline-size`, personal retention, context suppression, header exposure,
the shared responsive-navigation derivation, the rail-plus-content grid, and the rail-preserving
forced-colors selector. Three existing #254 arms were retargeted to the shared expressions they now
guard. Final review retargeted the existing presentation-focus arm again to the shared destination
exposure matrix, without changing the standing count. A deliberate mutation of the controlled-open
navigation decision made 16 tests fail in the same native app-shell fixture; every failure carried
SC-012 because slot reconciliation, lease transfer, controlled close, rail exposure, boundary
transitions, and destination-hidden focus all consume that decision. Its measured collateral and
rationale are declared in the registry. The final slot-reassignment correction adds one surgical
SC-012 arm, so the refreshed standing set is 224 arms.

## Independent-review correction evidence

The final correction batch remained inside the existing responsive shell seam. A deliberate
counterfeit repository landmark and removal of the forced-colors compact-header focus outline made
the two new browser assertions fail before correction. The app-shell browser suite now proves that
closed rail navigation contributes zero repository landmarks, zero context landmarks and no Tab
targets while retaining exactly one personal navigation and one main landmark; open navigation
contributes exactly one consumer-named repository landmark. It also proves the focused Menu gives
the compact header a system-color outline while the drawer boundary remains visible.

The #254 controlled seam is replayed for both compact and rail-preserving presentations: native
pointer/keyboard route close, accepted and rejected Escape, ordinary close, missing/invalid/
disconnected/false-nested/cross-root/cross-shell authority, direct and wrapped assignment,
1100↔1101 focus/state transitions in both directions, dynamic slot assignment, and exposure-lease
move/disconnect/reconnect. The shared native fixtures expanded from 44 to 53 app-shell tests in
that correction and to 54 after the final slot-reassignment regression.

Firefox then exposed a product defect at the rail 1100→1101 boundary: the compact-header root was
already inert and hidden while focus remained inside it. The actual RED is
`/tmp/issue-274-review-corrections-cf.log` (87 passed, 1 failed); the later misleadingly named
`/tmp/issue-274-focus-release-red-firefox.log` is a one-test GREEN rerun and is not cited as RED.
The existing focus-release seam now reads the same destination exposure matrix as root suppression
and explicitly blurs only an assigned region that becomes hidden. Personal-rail focus remains
untouched in rail-preserving mode. Rebuilt focused Chromium/Firefox passed 88/88 and repository-
matched WebKit passed 44/44.

A subsequent immutable-head review found that a `slotchange` reconciled assigned-root exposure
without first releasing focus from a root newly assigned to a destination-hidden region. The
browser RED at `/tmp/issue-274-slot-reassignment-red-cf.log` passed Chromium only and failed
Firefox because focus remained within the newly inert root (SHA-256
`e9de875bdbf750a40af696eae6b6a430d8ac6e251ed41fc922cba06cf0b9464b`). The slot-change handler
now invokes the same destination exposure-matrix focus release immediately before reconciliation.
Native and real-browser assertions cover exposed compact-navigation and personal-rail roots moving
to hidden context, plus an exposed default root moving to closed compact-navigation. The same
correction makes the closed rail Tab sequence explicit (`Work` then `Menu`, never hidden context or
navigation) and proves a native anchor's Enter activation changes the real fragment destination,
leaves closing consumer-owned, and does not synthesize trigger focus.

## Verification ledger

| Command or evidence | Result |
|---|---|
| `npm ci --ignore-scripts` | Pass; 1534 packages installed. The audit gate found no high/critical vulnerability. Final post-#273 install/security log SHA-256 `65440b4c7f7d6857ff98963978dfc6122a698808ffc24e01fb417b497635e976`. |
| `bash scripts/npm-audit-gate.sh`; `npm run security:lockfile-check`; `bash scripts/check-action-pins.sh` | Pass. |
| CSS, element-markup, styles-only-markup, CEM, React and Vue generation/checks/selftests | Pass after source-derived post-#273 regeneration. Build log SHA-256 `712dbb264a54a7be13ec7edc5f4f4293133d9620af03ac69f34e75d30cd6c098`; drift/build-check log SHA-256 `81d81e3c37f6df1c1de21b20070d07a4a6d28fbb45a87a4fcd6fcf9532aaaae6`. |
| `npx nx run elements:analyze`; manifest content check/selftest | Pass; 28 registered elements, 116 documented public members. |
| official Node 22.23.2 `scripts/measure-elements-sizes.mjs` generation/check | Pass after the rebuilt release graph; SIZES is current. |
| entries, no-CSS-in-source, adopted-CSS boundary/selftest, CSS hygiene, part ratchet | Pass. |
| behavior-import guard/selftest | Pass for 31 fixture files and 22 probe rows. No visual baseline was removed. |
| story-theme, pattern-composition, gate-wiring/defeat, ADR index and LLM ADR surface checks/selftests | Pass; content/hygiene log SHA-256 `cd817ad722485236327e5e68a4e8e5ba4f440f100deaaf298a9a4bf74375609f`. |
| `node scripts/typecheck-all.mjs`; `npm run quality:all` | Pass for all five typecheck projects and all quality gates. Existing security-plugin warnings remain non-failing and none comes from the changed app-shell surface. Log SHA-256 `ac1a5563f54913471ac64553a146c3f55f9dcabfdc02a0572ca9828b88926bf5`. |
| `npm test` on the post-#273 tree | Pass, 542/542 across 45 files; suite floor node 34 plus browser Chromium 508, zero skipped. Log SHA-256 `c94a8835cccbc51747b7156ac0029ae7c30b98c5a323b2f44cfc2761bf92ce32`. |
| assembled full Playwright, Chromium + Firefox | Pass, 972 with 42 intentional skips and zero failures. The initial run's only RED was the inherited checkbox story-ratchet total moving 391→405; the governed one-line reconciliation then passed its focused check and this full rerun. Final log SHA-256 `637af9057c227b40d69be5bb7a72c48c26a8fcc4ee105afedae8a13ab4811652`; initial integration RED log SHA-256 `1895797bcae33d17aca2a2126d549ada6d7fcf1d67bc49d5929224200b119618`. |
| official Playwright 1.62.1 Noble container, full and focused WebKit | Pass: full 465 with 42 intentional skips; focused app-shell 45/45. Full log SHA-256 `ee19ea9a72b17251f96400b58ef992689b3c785fcaac1ceeea4f6eac6b62f9ee`; focused log SHA-256 `30488309e2b3b09af435cf8dd01fc1f0636889f5b3eb7ac1fe979d0487df84e9`. |
| `node scripts/suite-selftest.mjs`; `node scripts/suite-selftest.mjs --selftest` | Pass: green 508-assertion baseline, 128 registry pairs, 41-source impact graph, zero fallbacks, all 224 mutations produced the named RED in 802.9s under the 1649.8s ceiling; all 10 guard self-checks passed. Log SHA-256 `1cf8b79ea4f5147c11d6f20a7c8d6320935be71c7b660c897869938b724e700a`. |
| `node scripts/measure-suite-time.mjs` | Pass, 12.8s against the 40s ceiling. |
| `node scripts/gate-selftest.mjs`; `node scripts/build-storybook-with-budget.mjs` | Pass: 50/50 gate shapes and build in 9.57s against the 180s ceiling. |
| `node scripts/check-expected-stories.mjs`; `node scripts/run-axe-storybook.js` | Pass: all 405 declared story IDs present; 514/514 rendered, zero WCAG 2.1 AA violations. Log SHA-256 `94ef33bc6d957f7eed93687e597ca70d2e97454358bfd04612387540d1745c06`. |
| release graph/selftest, packed Vue, official size check, offline-load/selftest | Pass; 28/28 release probes tripped, four packages pack and resolve, packed Vue compiles, SIZES is current, and 28/28 packed elements upgrade with zero off-machine requests. Log SHA-256 `9c7579bf88b37a45ab90d562a979c35fd6d84ba3c8d220935b706e1fce575550`. |
| headed Chrome browser-UI zoom at the fixed 390 CSS-pixel story | Pass at real 100% and 200% browser zoom. Chrome for Testing 151.0.7922.34 received PID-targeted XTEST `Ctrl+0`, then five `Ctrl+Shift+=` chords for 200%; DPR changed exactly 1.203125→2.40625 while `visualViewport.scale` remained 1. Both phases measured shell 390px, rail 56px, hidden 0px context, content at x=56, Menu 70.87×44px, Work→Menu Tab order, visible/unclipped focus, and document scrollWidth=clientWidth. Metrics log SHA-256 `9ad64ece8ddaaf2b99320b84fd7497190c13d68143df261e0bf7ab45c3d6d4f8`; the 100% browser-UI screenshot remains reviewer transport at `/var/tmp/issue-274-post273/zoom-evidence/chrome-100-percent-browser-ui.png`, SHA-256 `3b7c403556e3a73d930a8c4fa855fc54855cdc204301944f5521972a6dc24e13`. The visually inspected 1204×1204 200% screenshot is tracked as `chromium-200-percent.png`, SHA-256 `054a07eb4f1c391152362e34752950d02b29746207c8f72223f88250ae05f0a3`. |

## Honest pending and environment evidence

The pre-CI visual command added four genuinely new rail-preserving screenshot expectations:
1024 dark, 1024 light, 390 dark, and forced colors. Those four baselines still do not exist because
this final-refresh task explicitly excludes opening/pushing a PR. The post-#273 host Chromium visual
run was also non-diagnostic because broad inherited screenshots use different local font metrics
(for example, the stable stub expected 336×34 but rendered 312×38). It was stopped rather than
adopting workstation output; its four generated #274 actuals were moved outside the repository to
`/var/tmp/issue-274-post273/local-visual-untracked/`. T018 remains responsible for inspecting the
future CI-produced Linux artifact and committing only approved #274 images. No legacy or compact
baseline changed. The stopped local log has SHA-256
`f27d4e63d1b9e023e899af29e2e88020c848f4204c0da518e17bcccc1b68cbf5`.

The first correction-cycle mutation sweep froze a green 498-assertion baseline and an impact graph
of 41 sources with zero full-suite fallbacks, but finished 222/223 after an unrelated bar-chart
fixture collection/import failure under concurrent host load. The isolated arm later passed; the
222/223 log remains invalid and is not relabeled green. A clean rerun produced all 223 semantic
REDs, then correctly failed its final authored-input fingerprint because the agent-created empty
`fixtures/elements-behaviour/src/__screenshots__/sk-app-shell.test.ts/` directory was removed after
the harness had frozen its input directory tree. That mixed-revision log also remains invalid. The
first committed-tree sweep then kept its fingerprint stable and made all 221 inherited arms red,
but rejected the two new generated-CSS arms as pattern misses: their JSON values decoded to real
newlines and unescaped quotes while the generated JavaScript source contains literal `\\n` and
`\\"` bytes inside `replaceSync(...)`. Each corrected anchor occurs exactly once. Applying either
mutation in a temporary frozen checkout made only the named SC-017 relational assertion red. The
follow-up commit freezes those corrected anchors before another exclusive 223-arm sweep; its exact
command, result and log digest are recorded in PR evidence because they cannot be circularly
embedded in the commit under test.

The old host three-browser run failed because host WebKit libraries are absent; that environment
gap is now closed by the repository-matched official Playwright container result above. The first
post-#273 ad-hoc full WebKit container transport used a read-only checkout and a noncanonical host
port: 463 passed and 42 skipped, while the inherited Team Overview hard-coded `localhost:6006`
and smoke fixture could not write `_token-cdn-test.html`. That invalid environment-only run remains
recorded at SHA-256 `4ffb8b39fd64126bc679cb62ec109532f598abcc2d590c06b4f9c41968285d63`.
The corrected isolated writable container then passed the complete full and focused WebKit lanes;
no unrelated test was edited for the ad-hoc transport.

The host `/tmp` was concurrently at 13 GiB of 16 GiB. Initial mutation, axe, and Playwright
attempts therefore produced import timeouts, `ERR_INSUFFICIENT_RESOURCES`, and Chromium
`Disk quota exceeded`. Reruns redirected only temporary browser profiles to an ignored cache
inside this mission lane; no foreign process or temporary file was stopped or removed.

An ad-hoc whole-file invocation of `check-component-token-literals.mjs` remains non-green on the
inherited structural `100dvh` viewport cap already present in #254's train source; the checker does
not classify viewport units as structural. The final correction changes no CSS, and the aggregate
#274 CSS diff introduces no Stitch-derived visual literal: declaration values use `--sk-*` tokens,
while 1100 is the binding container-query contract coordinate. This diagnostic is not represented
as a passing gate or used to widen the correction into unrelated gate policy.

T019 is complete on post-#273 product commit `56688d5956ad7ebc8d1f2eedb8b939225a7936de`
using actual headed Chrome UI keystrokes, not CSS zoom, device scale factor, or a resized viewport
substitute. The first attempted X11/ffmpeg capture was all black and is excluded; only the later
Spectacle active-window images above are cited. T017 fresh independent exact-head Codex review and
T018 future PR/CI baseline convergence remain pending and are intentionally not claimed by this
implementer.
