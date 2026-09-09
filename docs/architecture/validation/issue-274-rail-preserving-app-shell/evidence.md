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
  `c72f050bfad130fa1c486856201b782afcdb55d8`).
- When #265 / PR #292 then integrated independently, the complete delivery was rebased and
  regenerated once more on exact train `858ea6d7848923f39bc2ee0c1fd6eb82a207ad93`. The
  product-plus-generated tree at that point was commit
  `809dd7fceb3e78c19d268742d41c094a1e21ae20`.
- When #290 integrated before acceptance, the complete delivery was rebased and regenerated a
  fifth time on exact train `57d1b083a6799fc5ef7f2cff75493a7f64fd59a3`. The post-#290 generated
  product commit is `62a39c4d301e2976f24dbc96f092cba58316f20f` (tree
  `06e832d3369c4c187cd1d70587992f2d9097b665`). It is the commit exercised by the post-#290
  behavior, browser, packaging, mutation, accessibility, and browser-UI zoom evidence below.
- When #267 / PR #294 integrated before the final push, the complete delivery was rebased and
  regenerated again on exact train `c3430fa05f7dffadda8090e2988b86375ef7fe01` (tree
  `1cbafe5c87ac8b86dd4aac2d3513d81c9ba18813`). The exact source-derived product and evidence
  input commit before this ledger refresh is `7322e5acba357241ff91247a09c1cb96160aa2a8`
  (tree `da366fed1831c04d8e28f49a86455c4a143b504a`). The final revalidation section below records
  every applicable gate rerun on that post-#294 tree; no stale pre-rebase CI result is treated as
  merge authority.
- The final handoff SHA is the commit containing this ledger and is therefore recorded by the
  Spec Kitty transition and Git history rather than circularly embedded here.
- Delivery remains exactly one WP and PR #293 to `train/elements-first`.

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

After #270, #271, #272, #273, and the independently integrated checkbox-choice-group, Mission
Reading, and copy-field work landed, the refreshed train owned 420 story IDs. Those plus WP01's
14 rail-preserving stories were source-reconciled to 434 unique ratcheted story IDs.
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
SC-012 arm. The refreshed train owned 226 arms; the complete source-reconciled set is 237 arms.

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
| `npm ci --ignore-scripts` | Pass; 1534 packages installed. The audit gate found no high/critical vulnerability, lockfile dry-run passed, and every Action remained SHA-pinned. Final post-#290 install/security log SHA-256 `c8b804d7c3995197adf4fe74b0c6a284d53740002cabf602b7a5fbdd02f8105b`. |
| `bash scripts/npm-audit-gate.sh`; `npm run security:lockfile-check`; `bash scripts/check-action-pins.sh` | Pass. |
| CSS, element-markup, styles-only-markup, CEM, React and Vue generation/checks/selftests | Pass after source-derived post-#290 regeneration. The complete generation, manifest, distribution, boundary, pattern, fixture-import, story-theme, workflow, ADR, type and quality lane is green; log SHA-256 `bd39324a62afbc85af1be54a45a209aa78c89e5ee2ca72be61657e411f3d4577`. |
| `npx nx run elements:analyze`; manifest content check/selftest | Pass; 29 registered elements, 121 documented public members. |
| official Node 22.23.2 `scripts/measure-elements-sizes.mjs` generation/check | Pass after the rebuilt release graph; SIZES is current. |
| entries, no-CSS-in-source, adopted-CSS boundary/selftest, CSS hygiene, part ratchet | Pass. |
| behavior-import guard/selftest | Pass for 32 fixture files and 22 probe rows. No visual baseline was removed. |
| story-theme, pattern-composition, gate-wiring/defeat, ADR index and LLM ADR surface checks/selftests | Pass in the complete static/quality lane above. |
| `node scripts/typecheck-all.mjs`; `npm run quality:all` | Pass for all five typecheck projects and all quality gates. Existing security-plugin warnings remain non-failing and none comes from the changed app-shell surface. Log SHA-256 `bd39324a62afbc85af1be54a45a209aa78c89e5ee2ca72be61657e411f3d4577`. |
| `npm test` on the post-#290 tree | Pass, 562/562 across 47 files; suite floor node 34 plus browser Chromium 528, zero skipped. Log SHA-256 `f1e2abea6cd27d86deca858bfe5df0669acae2ffced23af49e4afeb37a98f4fb`. |
| assembled full Playwright, Chromium + Firefox | Gate pass: 1046 passed with 43 intentional skips. One inherited action-row navigation assertion was flaky on its first Chromium attempt and passed on retry; its fresh whole-file no-retry rerun passed 51/51. Aggregate log SHA-256 `7db840adb28229f901ef3056a12f17fa0b749f25df28a40e48ccbce32b88a84a`; focused rerun `e5ac2d200842cda3b14823d8df30679d016ff3c73df0372b891832548d39c744`. |
| official Playwright 1.62.1 Noble container, full WebKit | Gate pass: 500 passed with 43 intentional skips. Two inherited Team Overview assertions passed on retry; their fresh whole-file no-retry rerun passed 9/9. Aggregate log SHA-256 `334d425927977b93152019669d05181bf19b1c46f39d36ad868954e7ee45e96e`; focused rerun `8ba3875b7c6240750d3484fa679056ac421dc706cebd28631ba114c7e66f7572`. |
| `node scripts/suite-selftest.mjs`; `node scripts/suite-selftest.mjs --selftest` | Pass: green 528-assertion baseline, 139 registry pairs, 44-source impact graph, zero fallbacks, all 237 mutations produced the named RED in 883s under the 1649.8s ceiling; all 10 guard self-checks passed. Mutation log SHA-256 `2927d48f958987da0eb1859651b30a6b076b7c4191ef9d1ce3f8b451c5d384c2`; selftest log `827b32f45c9af0cceefb8a97874b0311abc1cff67407794f702331fce6ecee2d`. |
| `node scripts/measure-suite-time.mjs` | Pass, 14.1s against the 40s ceiling. Log SHA-256 `0b9977232a5bb0662f3ab44b4ac4edc26fa851f43c07fe528ab9b2069e918969`. |
| `node scripts/gate-selftest.mjs`; `node scripts/build-storybook-with-budget.mjs` | Pass: 50/50 gate shapes and build in 11.56s against the 180s ceiling. |
| Storybook build plus `node scripts/run-axe-storybook.js` | Pass: the ratchet contains all 434 declared story IDs; 543/543 rendered stories satisfied the render wait with zero WCAG 2.1 AA violations. Build log SHA-256 `eabff81e8b98236aefe36423104c43862b83c5ee5f43be44a34c5846a7da1ae2`; axe log `8ea5b4520f89487281af859a4dc183564997e1e11657cbc763c35e34d662be8c`. |
| release graph/selftest, packed Vue, official size check, offline-load/selftest | Pass; 28/28 release probes tripped, four packages pack and resolve, packed Vue compiles, SIZES is current, and 29/29 packed elements upgrade with zero off-machine requests. Log SHA-256 `4c5f9a96ba6e565ddb89495549f5b582a2bf0bba0e284bf3a827680e60cc9c4c`. |
| headed Chrome browser-UI zoom at the fixed 390 CSS-pixel story | Pass at real 100% and 200% browser zoom on product commit `62a39c4d301e2976f24dbc96f092cba58316f20f`. Chrome for Testing 151.0.7922.34 received PID-targeted XTEST `Ctrl+0`, then five `Ctrl+Shift+=` chords for 200%; DPR changed exactly 1.203125→2.40625 while `visualViewport.scale` remained 1. Both phases measured shell 390px, rail 56px, hidden 0px context, content at x=56, Menu approximately 70.88×44px, Work→Menu Tab order, visible/unclipped focus, and document scrollWidth=clientWidth. Metrics log SHA-256 `4d0aee074fdf2fcd23046ce25197c67a28a9360847a8df911b2421c44dfea4c5`; the visually inspected 100% transport has SHA-256 `75c879cd7123c41e707f96d6b592d04d3011f170cd49252b600c43e6443d4453`. The visually inspected 1204×1204 200% screenshot is tracked as `chromium-200-percent.png`, SHA-256 `dca942137460a52bcce10920ecbbfdafe343a15d97268362ddd60c4568fcced9`. |

## Post-#294 exact-tree revalidation

This section supersedes the earlier point-cut results for final review. Every command ran from
the clean delivery worktree on product/evidence input commit
`7322e5acba357241ff91247a09c1cb96160aa2a8`, based on exact train
`c3430fa05f7dffadda8090e2988b86375ef7fe01`. Temporary browser and package files used
`/var/tmp/issue-274-post294`; generated repository output was source-derived and inspected, and
the worktree was clean before the evidence ledger and inspected zoom screenshot were refreshed.

| Command or evidence | Exact post-#294 result |
|---|---|
| canonical CSS, markup, styles-only, CEM, React, Vue, release-graph and size generation | Pass; the source-reconciled tree remained stable after generation. Log SHA-256 `cebc67feccbf211a98d267f42fb8dd69e24ef3176be799ab2f04a2d804e70c24`. |
| `npm ci --ignore-scripts`; `bash scripts/npm-audit-gate.sh`; `npm run security:lockfile-check`; `bash scripts/check-action-pins.sh` | Pass: 1534 packages installed, zero high/critical vulnerabilities, lockfile dry-run green, all Actions SHA-pinned. Log SHA-256 `e385746d28ed86534797d1f8c251d1b2660a37ecb56e3082760b2f38a346af2c`. |
| complete generated-drift, manifest, wrapper, distribution, adopted-CSS, composition, fixture-import, story-theme, workflow-defeat, ADR/LLM, typecheck, lint, stylelint, HTMLHint and commitlint lane | Pass, including every associated selftest; 29 elements, 121 documented public members, 134 public parts, 32 behavior fixture files, 62 story files, five typecheck projects, and eight lint projects. Existing security-plugin warnings remain non-failing and outside the changed app-shell surface. Log SHA-256 `d658d6db390b293bfb86b4a6a7525e2b8a32cf65e906cd6b5bb79b8cd8516b39`. |
| `npm test` | Pass: 562/562 tests across 47 files; node lane 34 and Chromium browser lane 528, zero skipped. Log SHA-256 `17cc453424cbd860344c2eec39466eee5ea98e9bc569ff4521c672d9e3222535`. |
| `node scripts/suite-selftest.mjs`; `node scripts/suite-selftest.mjs --selftest` | Pass: all 237 mutations produced their named red against the green 528-assertion baseline in 921.8s under the 1649.8s ceiling; all 10 harness guards passed. Log SHA-256 values `aafe59b8c59d32b894f44229be49d33dac9e63885362eaffea71242e5ee31f50` and `fc3f633c1b612e0b31f2230ecbc57bf486bd6b1582bbf6b178e8505870afb09d`. |
| `node scripts/measure-suite-time.mjs`; `node scripts/gate-selftest.mjs` | Pass: 562/562 in 14.1s under the 40s ceiling; all 50 render-gate shapes classified correctly. Log SHA-256 values `9f1a61338f857d7c81f0a0fcbbe2846b65bc3f17f50eb681191d3751cb7d75b7` and `cacc8faff349f6c90e09c70e3bc1e68eb42dfa2be5be8a8601a5cc131078592e`. |
| `node scripts/build-storybook-with-budget.mjs`; `node scripts/run-axe-storybook.js` | Pass: Storybook built in 10.42s under the 180s ceiling; all 543 rendered stories satisfied the wait and had zero WCAG 2.1 AA violations. Log SHA-256 values `fe7d2158967d46d78602ce953147ec60277e903ee1394a5878b9de6a7053402f` and `be648ecb6084846597f725b28bd1b6471aafe422aec37b45c5a3a667da8dc2f1`. |
| release graph/selftest, publishable builds, packed Vue types, size/SRI check, offline-load/selftest | Pass: all 28 defeat probes tripped, four packages packed and resolved, packed Vue compiled, sizes and SRI were current, and 29/29 packed elements upgraded with zero off-machine requests. Log SHA-256 `76c2fc5231fda40856f3d1854206a9e344baf0d4b8d1429b389b267f56fca4d9`. |
| canonical Chromium + Firefox Playwright gate (`CI=1`, two workers, isolated server) | Pass: 1047 passed and 43 intentional skips in 3.1m. Log SHA-256 `c00dc964b39f482b7a0df4eca54e5f6b12404b96ceb3b422da8280b58fed7487`. |
| official Playwright 1.62.1 Noble container, full WebKit | Pass: 502 passed and 43 intentional skips in 1.6m, without retry or failure. Log SHA-256 `16ef5b310a373cfbab3ad3dd0f2a0b51432b25ddb89204071712ccacd539472d`. |
| local Chromium visual diagnostic | Non-authoritative host diagnostic: 5 passed and 164 inherited baselines differed under workstation font/raster metrics. No baseline was changed or removed. Final CI remains the visual-regression authority. Log SHA-256 `a0af5efd143d0bfc1d5a69c126ff8b8438b92e03e81652d3b3831b81aba528ec`. |
| headed Chrome browser-UI zoom at the fixed 390 CSS-pixel story | Pass at real 100% and 200% browser zoom on commit `7322e5acba357241ff91247a09c1cb96160aa2a8`. PID-targeted XTEST applied `Ctrl+0` and five `Ctrl+Shift+=` chords; DPR changed 1.203125→2.40625 while `visualViewport.scale` remained 1. Both phases retained the 390px shell, 56px rail, 0px context, content at x=56, approximately 70.88×44px Menu target, Work→Menu Tab order, visible unclipped focus, and no horizontal page overflow. Metrics log SHA-256 `1edf4be0445c91cc55dde7a75b4d2dee0410336546c8a2278458acb4c9c275ca`; visually inspected 100% transport SHA-256 `897a5d58d688715721526f67285d5e08a1f0574d07531e96774874a6def185e3`; tracked visually inspected 200% screenshot SHA-256 `d50d0e1d091655bc6ed4931e200cac28dda8b9f1be77948e84c85b7f2f08d45f`. |

The first post-#294 full browser attempt intentionally remains non-green evidence: 1045 tests
passed, 43 skipped, and both engines failed only the deployed nav-pill check because the freshly
built Storybook target had not yet received the canonical demo assembler (log SHA-256
`c210ce260a4e4dd84a30e61909f2dc9f104ba8ccdef1361a1e9390e82370e230`). Running the canonical
assembler produced two pages and 42 resolved references, then the affected file passed 2/2 without
retry (log SHA-256 `73e25e3b62c13554e00213df18a52fd228992acff8fa2427f434fcb0e74ecb96`).
A subsequent non-CI run reused another workspace's transient server on the repository's shared
port and therefore saw an internally consistent older surface: all rail stories absent, an old
SRI, and old action-row behavior. Its 1002 pass / 43 skip / 45 fail result is invalid environment
evidence, not a product result (log SHA-256
`2828d8d2dfa5b679778d755f50f7f2e1ef0ac37fdbde6dd52ca00eb6b0524ed5`). Canonical CI mode first
refused that occupied port, then owned an isolated server from this exact worktree and produced the
green 1047/43 result above.

## CI visual convergence and environment evidence

The pre-CI visual command added four genuinely new rail-preserving screenshot expectations:
1024 dark, 1024 light, 390 dark, and forced colors. Exact-head CI run
`34340858837` produced only those four missing actuals. Each was visually inspected for the retained
56px rail, suppressed context region, responsive navigation, theme, containment, and supplied
content before being adopted. Their SHA-256 digests are, respectively,
`7ede07fc10196c65f25afc6750d65173e1a5a0b0ead8f8522954479866baf6d8`,
`4fc66e61dd6a161bd3d28a92d3091b1edd4131a6986946e2d22308bc5e64ecb8`,
`6f5dd33a62bed1ed789758b4215996ffae8c927bcedb3a753905dcee34c757f0`, and
`9f7c80dc932ededd6c3069f83d9de6ba4f4cc3438bb314e9281d7cf6b4876dab`.
No legacy or compact baseline changed. The post-#273 host Chromium visual run was non-diagnostic
because broad inherited screenshots use different local font metrics
(for example, the stable stub expected 336×34 but rendered 312×38). It was stopped rather than
adopting workstation output; its four generated #274 actuals were moved outside the repository to
`/var/tmp/issue-274-post273/local-visual-untracked/`. The stopped local log has SHA-256
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

The host `/tmp` was concurrently at 13 GiB of 16 GiB. Initial mutation, axe, Playwright, and final
offline-load attempts therefore produced import timeouts, `ERR_INSUFFICIENT_RESOURCES`, npm
`Unknown system error -122`, and Chromium `Disk quota exceeded`. Reruns redirected only temporary
browser/package files to `/var/tmp/issue-274-post290`; no foreign process or temporary file was
stopped or removed. The incomplete attempts are not represented as gate passes.

An ad-hoc whole-file invocation of `check-component-token-literals.mjs` remains non-green on the
inherited structural `100dvh` viewport cap already present in #254's train source; the checker does
not classify viewport units as structural. The final correction changes no CSS, and the aggregate
#274 CSS diff introduces no Stitch-derived visual literal: declaration values use `--sk-*` tokens,
while 1100 is the binding container-query contract coordinate. This diagnostic is not represented
as a passing gate or used to widen the correction into unrelated gate policy.

T019 is complete on post-#290 product commit `62a39c4d301e2976f24dbc96f092cba58316f20f`
using actual headed Chrome UI keystrokes, not CSS zoom, device scale factor, or a resized viewport
substitute. Black compositor captures were excluded; only the visually inspected Spectacle
active-window images above are cited. T018's new baselines were adopted only from the inspected CI
actuals; final exact-head CI will be recorded on PR #293 rather than circularly in this commit. T017 is
recorded by the exact-head independent Codex review artifact and PR evidence rather than claimed
by the implementer ledger itself.
