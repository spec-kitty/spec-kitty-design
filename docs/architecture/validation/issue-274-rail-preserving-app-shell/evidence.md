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
guard; measured collateral is declared only on the shared navigation arm. The refreshed standing
set is 223 arms.

## Verification ledger

| Command or evidence | Result |
|---|---|
| `npm ci --ignore-scripts` | Pass; 1534 packages installed. The later audit gate found no high/critical vulnerability. |
| `bash scripts/npm-audit-gate.sh`; `npm run security:lockfile-check`; `bash scripts/check-action-pins.sh` | Pass. |
| CSS, element-markup, styles-only-markup, React and Vue generation checks/selftests | Pass after source-derived regeneration. |
| `npx nx run elements:analyze`; manifest content check/selftest | Pass; 28 registered elements, 114 documented public members. |
| builds plus `node scripts/measure-elements-sizes.mjs --check` | Pass after each required rebuild. |
| entries, no-CSS-in-source, adopted-CSS boundary/selftest, CSS hygiene, part ratchet | Pass. |
| behavior-import guard/selftest | Pass for 31 fixture files and 22 probe rows after deleting only Vitest's ignored failure screenshots. No visual baseline was removed. |
| story-theme, pattern-composition, gate-wiring/defeat, ADR index and LLM ADR surface checks/selftests | Pass. |
| `node scripts/typecheck-all.mjs` | Pass for all five projects. |
| `npm run quality:all`; `npm run quality:commitlint` | Pass; existing security-plugin warnings remain non-failing and none comes from the changed app-shell surface. |
| `npm run test` | Pass, 519/519 across 45 files; suite floor node 34 plus browser 485, zero skipped. Log SHA-256 `0bad35dbb57d3c5d6fad00face005e22a14509b7c2d2333937b8faf5a26c17ee`. |
| `node scripts/measure-suite-time.mjs` | Pass, 14.7s against the 40s ceiling. |
| `node scripts/gate-selftest.mjs` | Pass, 50/50 shapes. Log SHA-256 `cacc8faff349f6c90e09c70e3bc1e68eb42dfa2be5be8a8601a5cc131078592e`. |
| `node scripts/build-storybook-with-budget.mjs` | Pass in 9.74s against the 180s ceiling. Log SHA-256 `c2a8ed81daca75ee81582be649348722bb357c18753a8f023e6d06391efe0942`. |
| `node scripts/run-axe-storybook.js` with mission-local `TMPDIR` | Pass: 457/457 rendered, zero WCAG 2.1 AA violations. Log SHA-256 `78c9759433f93f52e451e1daa70fe267a68e9f68a64c8f052153cf26dde81dea`. |
| `bash scripts/assemble-demo-dist.sh apps/storybook/storybook-static`; mission-local `TMPDIR npx playwright test --project=chromium --project=firefox --workers=2` | Pass: two demo pages / 42 references assembled; 628 passed, 18 intentional skips, zero failures. Log SHA-256 `6770e69f0476f95f64a57a9ec570300e2bd93ef7c5fdec6de3199a9b1d07a74e`. |
| release graph/selftest, packed Vue, offline-load/selftest | Pass; four packages pack and resolve, packed Vue compiles, 28/28 packed elements upgrade with zero off-machine requests. |

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
correction commit freezes the canonically regenerated input tree before one exclusive 223-arm
sweep; its exact command, result and log digest are recorded in the PR evidence because they cannot
be circularly embedded in the commit under test.

The canonical three-browser Playwright run with a mission-local `TMPDIR` passed 640 tests and
skipped 29, but failed 300: the host lacks the libraries Playwright requires to launch WebKit,
and the pre-assembler/non-serialized Chromium/Firefox attempt also exposed the missing demo and
shared-host flake. The assembled two-worker Chromium/Firefox replay above resolved every
non-WebKit failure. Full-run log SHA-256:
`aa668147039ad510dd484d6502711a17b2f89d2e06bd56115a123ef71825d4ae`.
WebKit remains a real CI requirement and is not claimed as passed locally.

The host `/tmp` was concurrently at 13 GiB of 16 GiB. Initial mutation, axe, and Playwright
attempts therefore produced import timeouts, `ERR_INSUFFICIENT_RESOURCES`, and Chromium
`Disk quota exceeded`. Reruns redirected only temporary browser profiles to an ignored cache
inside this mission lane; no foreign process or temporary file was stopped or removed.

T017 independent exact-head Codex review, T018 PR/CI baseline inspection, and T019 reviewer-owned
real Chrome browser-UI 200% evidence remain intentionally pending after implementer handoff. No
CSS zoom, browser viewport resize, Playwright device scale factor, or local screenshot is claimed
as real browser-UI zoom, and `chromium-200-percent.png` has not been created.
