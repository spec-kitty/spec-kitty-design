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
  `c3cc2dedeb092a0b517e763847e6f1a498ed6323`. This is an intermediate delivery base: #273 must
  still integrate before #274's mandatory final refresh and review.
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

After #270, #271 and #272 landed, the train-owned segmented-choice, collection and action-row
stories plus WP01's 14 rail-preserving stories were reconciled to 383 unique ratcheted story IDs.
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
| `npm ci --ignore-scripts` | Pass; 1534 packages installed. The later audit gate found no high/critical vulnerability. |
| `bash scripts/npm-audit-gate.sh`; `npm run security:lockfile-check`; `bash scripts/check-action-pins.sh` | Pass. |
| CSS, element-markup, styles-only-markup, React and Vue generation checks/selftests | Pass after source-derived regeneration. |
| `npx nx run elements:analyze`; manifest content check/selftest | Pass; 28 registered elements, 116 documented public members. |
| builds plus `node scripts/measure-elements-sizes.mjs --check` | Pass after each required rebuild. |
| entries, no-CSS-in-source, adopted-CSS boundary/selftest, CSS hygiene, part ratchet | Pass. |
| behavior-import guard/selftest | Pass for 31 fixture files and 22 probe rows after deleting only Vitest's ignored failure screenshots. No visual baseline was removed. |
| story-theme, pattern-composition, gate-wiring/defeat, ADR index and LLM ADR surface checks/selftests | Pass. |
| `node scripts/typecheck-all.mjs` | Pass for all five projects. |
| `npm run quality:all`; `npm run quality:commitlint` | Pass; existing security-plugin warnings remain non-failing and none comes from the changed app-shell surface. |
| `npm test` after the final slot-reassignment correction | Pass, 542/542 across 45 files; suite floor node 34 plus browser Chromium 508, zero skipped. Log SHA-256 `335b34027a4923228df46a862329d6ec3c14a33475f3667b811a2866c7b2c0ba`. |
| rebuilt app-shell Playwright, Chromium + Firefox | Pass, 90/90, including exact focus order and native pointer/Enter destination paths. Log SHA-256 `ec1b8fc5affcc19d574286e74d77671d9564909fc7967e211d2ef9f56433d4a4`. |
| official Playwright 1.62.1 Noble container, focused WebKit | Pass, 45/45. Log SHA-256 `c5e0b6e9ff1c4dfbabce755e26eeefa2a4351986c87d876ddd8b3b90e4af0e3a`. |
| `node scripts/suite-selftest.mjs` after the final slot-reassignment correction | Pass: green 508-assertion baseline, 128 registry pairs, 41-source impact graph, zero fallbacks, all 224 mutations produced the named RED in 746.7s under the 1649.8s ceiling. Log SHA-256 `4df8e1db0879bb68d77e4e4ea917ca3926fca747e1446e0b066ab752cefede6d`. |
| typecheck-all, quality-all, behavior-import selftest/live | Pass after the final correction: all five typecheck projects, lint/stylelint/htmlhint, 22 guard probes, and 31 fixture files. Log SHA-256 `4c4d280c57e511f3ed89addba5f9c6ccdcadfbef2b50c4d45e51ef7fcfe2fa4b`. Fresh CEM/entry/no-CSS/exact-part checks also pass at 28 elements and 116 documented public members; log SHA-256 `0eb074e8ee1acf9dbb6f551c9d3766f525a1cdabde409fcaad06b7321c75bcd3`. |
| generation/drift checks and official Node 22 size regeneration/check | Pass; CSS/markup/React/Vue outputs current, entries/CSS/parts/story/pattern/ADR surfaces current, and SIZES regenerated after the final runtime change by Node 22.23.2. Drift log SHA-256 `164792babb913541f06210591a91b8621d904beabca2b256a62610dd30a0bdb4e`; final size log SHA-256 `1a85d46e205849f47c8cc3ee8ed07b67164632831bb2d9cbfb77695a3cd5798f`. |
| `node scripts/measure-suite-time.mjs` | Pass, 14.7s against the 40s ceiling. |
| `node scripts/gate-selftest.mjs` | Pass, 50/50 shapes. Log SHA-256 `cacc8faff349f6c90e09c70e3bc1e68eb42dfa2be5be8a8601a5cc131078592e`. |
| `node scripts/build-storybook-with-budget.mjs` | Pass in 9.74s against the 180s ceiling. Log SHA-256 `c2a8ed81daca75ee81582be649348722bb357c18753a8f023e6d06391efe0942`. |
| `node scripts/run-axe-storybook.js` with mission-local `TMPDIR` | Pass: 457/457 rendered, zero WCAG 2.1 AA violations. Log SHA-256 `78c9759433f93f52e451e1daa70fe267a68e9f68a64c8f052153cf26dde81dea`. |
| `bash scripts/assemble-demo-dist.sh apps/storybook/storybook-static`; mission-local `TMPDIR npx playwright test --project=chromium --project=firefox --workers=2` | Pass: two demo pages / 42 references assembled; 628 passed, 18 intentional skips, zero failures. Log SHA-256 `6770e69f0476f95f64a57a9ec570300e2bd93ef7c5fdec6de3199a9b1d07a74e`. |
| release graph/selftest, packed Vue, offline-load/selftest | Pass; four packages pack and resolve, packed Vue compiles, 28/28 packed elements upgrade with zero off-machine requests. Log SHA-256 `0fc4f0c595f0814562e52502b90ddfbdb2510d06ab891aa8f1a13cb27ce8e997`. |

## Honest pending and environment evidence

The pre-CI visual command added four genuinely new rail-preserving screenshot expectations:
1024 dark, 1024 light, 390 dark, and forced colors. The local run failed only because those four
baselines do not exist. Playwright wrote missing images as a side effect; they were deleted and
were never committed. T018 remains responsible for inspecting the CI-produced Linux artifact and
committing only approved #274 images. No legacy or compact baseline changed.

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
gap is now closed by the repository-matched official Playwright container result above. The last
pre-review assembled aggregate Chromium/Firefox run remains green at 812 passed and 36 intentional
skips. A post-review attempt scheduled 862 cases through the isolated server but is invalid: one
inherited Team Overview test hard-codes `localhost:6006`, retried twice against the deliberately
unused foreign port, and the runner then ended without a summary at case 576. It is preserved as
non-green/non-gate evidence with SHA-256
`0831d0ceb5e51ac0e2f107c67189e3cc4fa99b39d5ea04f278664cd0ad813f16`; it does not displace the
exact post-review focused 90/90 Chromium/Firefox and 45/45 WebKit results. The mandatory
post-#273 refresh will rerun the full aggregate on its canonical isolated server.

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

T017 fresh exact-head Codex review, T018 PR/CI convergence, and T019 final-head reviewer-owned real
Chrome browser-UI 200% evidence remain pending until #273 integrates and this branch is rebased and
regenerated on the new train. No CSS zoom, browser viewport resize, Playwright device scale factor,
or local screenshot is claimed as real browser-UI zoom in this intermediate correction head.
