# Issue #254 compact-navigation evidence

## Evidence identity

- Merge target and tested base: `origin/train/elements-first` at
  `a78445552e42cb6bbde4e1d2e497137bc30c9dee` (after #213, #256, #214, and #264 merged).
- Mission: `repository-dossier-compact-navigation-shell-01M1Y3FY`, WP01.
- The exact delivery SHA is deliberately recorded in the PR and issue evidence comment after
  this ledger is committed: a Git commit cannot contain its own hash. Every post-commit command
  in those records is pinned to that SHA; no parent-SHA result is represented as final evidence.
- Independent Codex review cycle 2 approved the implementation at `e870d030` with no code
  blockers. That SHA was later superseded by mission-state integration, history normalization,
  the evidence below, the review-driven 390px story containment regression, the authored SVG menu
  mark, and the ordinary-close focus-release fix. The final independent review at `fc4187e5`
  rejected native `presentation` attribute removal; review cycle 4 and the focused correction
  evidence below preserve that disposition without promoting pre-fix results.
- Independent architecture review later rejected the exact replacement head
  `1e93ec8f9acfd210465c3ecff230eafe0debb2e6`: cross-shell root handoff could lose the
  consumer snapshot, nested open shells could both emit for one composed Escape, CSS used
  physical width while JavaScript used logical inline size, and the two public app-shell types
  were absent from the root barrel. Review cycle 5 supersedes that head; its successor hash must
  be taken from the commit/handoff because this file cannot contain its own commit hash.
- Review cycle 5 also removed a dead opacity/reduced-motion styling seam and recorded the
  consumer-write-while-suppressed ownership boundary. Independent Codex proof approved the
  corrections at `f08e6675280093de1796b237ae56550cdfd1f215`; subsequent train rebases and
  source-derived regeneration supersede that proof SHA without changing those authored contracts.

## Real browser UI zoom

The four captures use headed browsers on X11/Xvfb. A small XTEST helper focused the real browser
window and sent `Ctrl+0`, followed by native `Ctrl+Shift+=` key chords. The browser window was
then resized at the X11 window-system boundary to produce an exact 390 CSS-pixel viewport; the
zoom itself was not produced by viewport resizing. The capture harness queried the active X11
window geometry and FFmpeg captured exactly that browser window, including browser chrome and its
visible zoom indicator. No CSS `zoom`/`transform`, Playwright
device scale factor, CDP emulation, or pinch/visual-viewport scaling was used.

| Browser | UI zoom | Native key steps | DPR | CSS viewport | `visualViewport.scale` | document client/scroll | drawer client/scroll | Result | Capture SHA-256 |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Chromium 151.0.7922.34 | 200% | 5 | 2 | 390 × 506 | 1 | 382 / 382 | 331 / 331 | Pass | `4573b9677a55319d32a4128af2a4e2a1d826f653d3d4904cfb25ba90584b1e66` |
| Chromium 151.0.7922.34 | 400% | 8 | 4 | 390 × 253 | 1 | 386 / 386 | 157 / 334 | Pass; drawer scrolls internally | `870ff42cade3fa161a0507c33da375e5555aff9b1b4622d851db137fbc8263cd` |
| Firefox 153.0 | 200% | 10 | 2 | 390 × 503 | 1 | 390 / 390 | 336 / 336 | Pass | `fced3e07131232917eb5ea0a6d42d3821883328b5280a8beaf75ab6931ff162d` |
| Firefox 153.0 | 400% | 16 | 4 | 390 × 251 | 1 | 390 / 390 | 155 / 334 | Pass; drawer scrolls internally | `bf16d9dcebeb915ffde960ec7eefdb1173e027480fa436ee89c2ceab533812ba` |

Every observation also passed: compact header visible, controlled drawer visible, story frame
contained, no page-level horizontal overflow, long consumer label intact, consumer trigger
focused with a visible outline, and drawer `overflow-y: auto`. Visual inspection also confirmed
that the story's three-line SVG menu mark renders in both browsers at both zoom levels without the
unsupported U+2630 glyph or a missing-glyph box. The captures are:

- `chromium-200-percent.png`
- `chromium-400-percent.png`
- `firefox-200-percent.png`
- `firefox-400-percent.png`

The first headed Chromium probe exposed an 8px scrollbar-width overflow in the fixed-width 390px
story frame. The frame now has `max-width: 100%`, and a focused Chromium/Firefox regression proves
the 390px fixture remains contained even when the available containing block is 380px. The
dedicated compact suite passed 36/36 across Chromium and Firefox after that correction. The exact
pre-fix suite was 34/34; the cycle-3 correction added one regression per browser. The cycle-4
native-attribute removal regression adds one more per browser, and the source-rebuilt focused suite
now passes 69/69 across Chromium, Firefox, and the pinned Playwright WebKit runtime.

Chromium printed one `Failed to load resource: ... 404` console line during each headed capture.
The console location identifies `http://127.0.0.1:6006/favicon.ico`; the story page itself had no
failed response, request failure, or page error. Firefox printed no console error. This missing
development-server favicon is recorded, not silently represented as a clean console.

## Approved Dossier family comparison

The immutable D1, D2, and D4-D8 dark sources were rechecked at their registered SHA-256 values in
`research/source-register.csv`.

- D1 confirms the absent-axis desktop contract: personal rail, contextual column, and content
  canvas remain three distinct regions. This delivery does not change that default composition.
- D2 confirms the opt-in compact intent: a consumer-authored identity/trigger row, a controlled
  navigation drawer, and a single content canvas. The component adds only the placement,
  visibility, bounded scrolling, and dismissal-intent seam required to compose that screen.
- D4-D8 vary repository truth and content state while preserving the same shell ownership. No
  state-specific routing, progress arithmetic, discovery, polling, truth inference, or Team
  Kitty copy has been absorbed into `sk-app-shell`; those remain consumer/pattern-story concerns.
- The dark and required `LightMode` stories resolve distinct token surfaces. Forced-colors retains
  a system-color outline. The unused opacity transition and its reduced-motion override were
  removed; the reduced-motion story now proves controlled close/reopen, focusability, and bounded
  drawer scrolling as observable behavior.

This is an intent/ownership comparison, not a claim that a component fixture reproduces a full
Repository Dossier screen. Issue #255 owns the public-component composition.

## Verification ledger

Historical rows below preserve the red-first findings and their disposition. The final exact
delivery SHA and post-ledger command hashes are recorded in the PR and issue evidence after this
tracked ledger is committed; embedding a commit's own hash here is impossible. No historical or
pre-rebase row is promoted as final-SHA evidence.

| Command or evidence | Result |
|---|---|
| `npx nx run storybook:storybook:build` | Pass; static Storybook rebuilt after the containment fix. |
| `npx playwright test apps/storybook/src/tests/sk-app-shell-compact-navigation.spec.ts --project=chromium --project=firefox` | Pass, 36/36 after the ordinary-close focus regression; the exact pre-fix suite was 34/34. |
| Independent Codex review cycle 2 at `e870d030` | Implementation approved; 30/30 then-current focused Playwright and 22/22 focused Vitest checks independently reproduced. Evidence completion remained on hold. |
| `node scripts/suite-selftest.mjs` diagnostic at the normalized parent | 180/184; three measured, inherent SC-012 collateral relationships and one transient runner-level module fetch were surfaced fail-closed. |
| Three app-shell collateral findings | Fixed in source-owned `mutations.json` using inverted `expectCollateral`: SC-014 stylesheet removal also removes SC-012 compact visibility; SC-010 forced close enters SC-012 focus behavior; SC-006 duplicate dismissal perturbs SC-012 accepted focus timing. |
| Isolated rerun of the SC-013 datalist arm | Pass in 14.9s with a 453-assertion green baseline. The identical mutation produced its named red with no collateral, proving the earlier `packages/elements/src/index.ts` dynamic-import errors were runner/orchestration transience rather than mutation behavior. |
| Full diagnostic sweep at `5d661cf` | Fail-closed at 182/184: mutation 11 could not connect to its Chromium session and mutation 176 produced no JSON report before the 180-second bound. The substitutions were respectively an upgrade-hook no-op and two event-flag booleans, neither of which owns server/session behavior. Log SHA-256: `6b30f2c1b56e860da07afc01442715b68d0659e25cc6803df661743ec7b7f8da`. |
| Isolated rerun of diagnostic mutations 11 and 176 | Pass, 2/2 in 15.9s: 453-assertion green baseline, 125 registry pairs, two impacted sources, zero fallbacks, both named tests red, and no collateral. Log SHA-256: `2458530bc4b095bf2f92f76dc052ec41a6a5f10a9a3cafa6907bf62f61ecc27d`. This pre-fix 186-arm state is superseded by the review-fix result below. |
| Final independent review at `2646d4ffa581a77f70d09effbea17b7748951295` | Rejected: ordinary consumer-controlled close could hide/inert the drawer while leaving focus on its link; the evidence ledger and acceptance matrix also retained a stale 32-case focused-suite count instead of the exact pre-fix 34/34. Review cycle 3 records the findings and correction disposition. |
| Final-review ordinary-close regression | Red before the source fix in Chromium (`navigation.contains(document.activeElement)` was `true` after the closed render); green after the fix in the 23/23 focused Vitest run and the 36/36 Chromium/Firefox Storybook run. Accepted Escape still restores the trigger; ordinary and rejected-Escape-then-route closes release hidden focus without focusing it. |
| `node scripts/suite-selftest.mjs --selftest` after the review fix | Pass, 10/10 guard probes in 48.8s from a green 461-assertion baseline with all 126 registry pairs present. |
| `node scripts/suite-selftest.mjs` after the review fix, before the final train rebase | Pass, 187/187 named reds in 564.5s from the green 461-assertion baseline; 40 mutated sources, zero full-suite fallbacks, and the new ordinary-close SC-012 arm had no collateral. This is diagnostic evidence; the PR and issue evidence record the mandatory exact post-rebase sweep. |
| Isolated ordinary-close SC-012 substitution | Pass: replacing only the new true-to-false guard with the registered mutation made only the named focused test red (`navigation.contains(document.activeElement)` remained `true`); restoring the guard returned it to green. The harness has no arm-filter option, so this exact manual substitution is the isolated proof. |
| Final independent review at `fc4187e5a926b343f96f7f8a27b0f40fdedb831e` | Rejected: native `removeAttribute('presentation')` left the public property at `null` and emitted `unknown sk-app-shell presentation "null"`; the committed cycle-2 supersession narrative and acceptance timestamps were also stale. Review cycle 4 preserves the rejection verbatim. |
| Cycle-4 red-first reproduction | `TMPDIR=/home/jeroennouws/dev/spec-kitty-design-missions/254/.tmp npx vitest run fixtures/elements-behaviour/src/sk-app-shell.test.ts -t 'removing the native presentation attribute' --reporter=default` failed as required: 1 failed / 21 skipped with `null` received instead of `undefined`. The later exact registered substitution additionally captured the unknown-null warning. |
| Cycle-4 authored fix | A `presentation` `fromAttribute` converter normalizes only removed attributes from `null` to `undefined`. Unknown strings still use the existing warning/fail-open path, while Lit's default `toAttribute` path continues property reflection. |
| Cycle-4 focused Vitest | Pass, 24/24 across `fixtures/elements-behaviour/src/sk-app-shell.test.ts` and `fixtures/react-consumer/src/sk-app-shell.test.tsx` after restoring the authored converter. |
| Cycle-4 focused Chromium/Firefox | Pass, 38/38 after rebuilding Storybook from the corrected source. The new unmarked integration case proves the omitted runtime value, no null warning, legacy/compact visibility, and hidden-navigation focus release in both engines; the authored SC-010 unit regression remains scoped to omission/reflection rather than claiming SC-012 focus behavior. |
| Cycle-4 mutation guard selftest | Pass, 10/10 in 42.7s from a green 462-assertion baseline with all 126 registry pairs present. |
| Isolated removed-attribute SC-010 substitution | Pass: weakening only `return value ?? undefined` to `return value` and running the complete app-shell behavior file produced 1 failed / 21 passed. Only the named `[SC-010]` removal test failed, on both `null` and the exact unknown-null warning; restoring the converter returned the focused app-shell/React run to 24/24. |
| Cycle-4 source-derived outputs | CEM, React, Vue, CSS, and markup regeneration produced no tracked drift. Node 24.20.0 performed the exact no-cache elements build before size generation; only `packages/elements/SIZES.md` changed. |
| `npx vitest run fixtures/elements-behaviour/src/sk-app-shell.test.ts fixtures/react-consumer/src/sk-app-shell.test.tsx --reporter=default` | Pass, 23/23 on the restored final tree. The expected dev-mode, unknown-presentation, and transient ResizeObserver-loop diagnostics remain non-failing. |
| `node scripts/build-storybook-with-budget.mjs` | Pass in 9.79s; rebuilt the authored app-shell source into the static test target before final browser execution. |
| First 36-case browser attempt before rebuild | 34 passed and the two new engine cases reproduced hidden focus because the server reused the stale pre-fix static Storybook bundle. After the required rebuild, the identical command passed 36/36; no retry was represented as changing source behavior. |
| Generator and structural checks | Pass: CSS, markup, React, and Vue drift checks; manifest content; no-CSS-in-source; element entries; adopted-CSS boundary/hygiene; part ratchet; story theme; and gate wiring. |
| `node scripts/typecheck-all.mjs` | Pass, all five projects. |
| `npm run quality:all` | Pass: eight-project lint, stylelint, and 89-file HTMLHint. Existing security-plugin warnings remain non-failing; no changed app-shell file adds one. |
| Behavior-import guard and selftest | Initial concurrent and serial attempts failed before rule evaluation with `EISDIR` at `readFileSync` because Vitest's deliberate red created the ignored directory `fixtures/elements-behaviour/src/__screenshots__/sk-app-shell.test.ts`, whose name matched the guard's test glob. After removing only that generated failure screenshot, the guard passed for 31 fixture files and its selftest passed 22 probe rows plus the plant/detect arm. No committed or approved visual artifact was touched. |
| `node scripts/measure-elements-sizes.mjs` then `--check` | Regenerated the source-derived byte/hash ledger after the three-line guard changed ESM/IIFE raw sizes by 103/109 bytes; final check passes. |
| Rejected-head exact matrix at `1e93ec8f9acfd210465c3ecff230eafe0debb2e6` | Preserved from the supplied independent reports: unit 500/500; mutation 201/201 from a green 466-assertion baseline; assembled Chromium/Firefox 565 passed / 15 skipped, focused app-shell 38/38; official Playwright 1.62.1 noble WebKit 19/19; axe 435/435; Storybook, generation, release, packed-Vue, offline-load, build, and headed 200%/400% zoom checks passed. These results describe the rejected parent, not the cycle-5 successor. |
| First unassembled rejected-head browser attempt | Preserved as infrastructure evidence: only two nav-pill tests failed because `/dashboard-demo.html` had not been assembled. After assembly, the targeted rerun passed 2/2 and the complete Chromium/Firefox run passed 565 with 15 skipped. |
| PR CI run `34186620186` at `755dcf6b7ff84c5ea37602736889654a006db88b` | Historical red, not waived: 836 passed / 30 skipped, with two WebKit failures because the closed Repository navigation and compact personal Product areas remained exposed through a CSS-hidden wrapper. Later exact-head WebKit evidence fixed those failures, but the cycle-5 successor still requires orchestrator CI. |
| Cycle-5 red-first app-shell behavior | Against rejected head `1e93ec8`, the 30-test browser-mode unit file produced exactly 4 new failures and 26 passes: inactive cross-shell handoff, active-destination stale-lease release, nearest-shell nested Escape ownership, and vertical logical-threshold CSS parity. The root React typecheck separately failed with exactly two missing exports: `SkAppShellDismissDetail` and `SkAppShellPresentation`. |
| Cycle-5 focused unit/type correction | Pass: app-shell browser-mode unit 30/30; root React consumer typecheck passes with both canonical aliases. The implementation preserves exact absent/empty/arbitrary/`"false"` snapshots through inactive and active two-shell handoffs, prevents stale owners restoring transferred roots, and claims Escape only at the nearest shell without stopping the original key event. |
| Cycle-5 Storybook and focused cross-browser | Storybook rebuilt successfully. The complete app-shell file passes 46/46 across Chromium and Firefox. The already-cached official `mcr.microsoft.com/playwright:v1.62.1-noble` image passes WebKit 23/23 from a read-only worktree mount, including vertical 860/861 CSS/JS/exposure/Escape parity and personal/context/header focus release. No image pull or package installation occurred. |
| Cycle-5 generation and static gates | CSS, markup, CEM, React, Vue, and Node 24.20.0 size/SRI outputs regenerated. Drift checks, manifest content, no-CSS-in-source, entries, adopted-CSS boundary/hygiene, part and theme ratchets, Vue SFC proof, generator selftests, gate wiring, all five typecheck projects, eight-project lint, stylelint, and 89-file HTMLHint pass. Existing security-plugin warnings remain non-failing and none originate in changed app-shell files. |
| Cycle-5 complete unit suite | Pass, 504/504 across 45 files; suite floor reports node 34 and browser 470 with zero skipped. |
| Cycle-5 mutation verification | Each of the five new registered substitutions was applied in isolation to the real generated/product source and the complete 30-test app-shell behavior file: each produced exactly 1 named failure / 29 passes, with no same-subject collateral, and restoring all five returned the file to 30/30. A later exact pre-#264 train candidate completed the full 206-arm union; the mandatory post-#264 exact run is recorded externally with the final delivery SHA. |
| Cycle-6 four-lens review at `219c73b0d21da21b6519cd217faf263fedd53663` | Architect Alphonso and Randy Reducer found no new product blocker. Debugger Debbie reproduced two integration defects: dismissal acceptance was sampled before a React 19 controlled close committed, and omitting `compactTrigger` through the generated wrapper retained the previous property value. Reviewer Renata held readiness on those findings and exact evidence. The cycle was rejected; no prior approval is promoted over it. |
| Cycle-6 red-first React integration | A stateful React 19 consumer proved the Escape handler scheduled `open=false` while the component still observed open during the dispatch turn; the old synchronous sample did not return focus after the close. A wrapper rerender that omitted `compactTrigger` likewise left the old connected button installed. Both failures were captured before correction. |
| Cycle-6 bounded dismissal correction | The component now samples effective closure (`open !== true`) in exactly one queued microtask, then awaits its own Lit update before focus restoration. The pending identity still expires on that first bounded attempt, so a rejected request cannot affect a later route close. This supports React's scheduled custom-element update without importing React, weakening native controlled-state ownership, or adding an unbounded timer. |
| Cycle-6 source-derived nullable reset | The manifest normalizer marks the property-only nullable trigger with a `null` reset contract. The generic React generator validates that the declared type admits null and emits `useProperties(..., () => null)`; selftests reject unsupported reset metadata and null resets on non-nullable types. The generated wrapper, not handwritten code, clears the trigger on omission. |
| Cycle-6 mutation ownership correction | Four measured branches were adjudicated against their real subjects: reflection and effective-close mutations declare observed collateral where appropriate, the deferred acceptance arm targets the React subject, and stale strict-false text was updated to the shipped effective-falsiness expression. The later complete diagnostic sweep passed 210/210 from a 471-assertion green baseline with 128 registry pairs, 41 impacted sources, and zero full-suite fallback. |
| Post-ledger diagnostic gate matrix | On the clean one-commit candidate directly above `a78445552e42cb6bbde4e1d2e497137bc30c9dee`: unit 505/505; suite wall clock 23.9s within 40s; guard selftest 10/10; authoritative type/lint/generation/ratchet and Node 24 size checks pass; Storybook 8.69s; release graph, packed Vue, and offline tarball load 28/28 pass; pinned Chromium/Firefox full suite 602 passed / 18 skipped; focused Chromium/Firefox/WebKit 69/69; axe 443/443 with zero violations; and headed Chromium/Firefox at 200%/400%, exact 390 CSS px, DPR 2/4, scale 1, focus visible, long labels intact, and no page overflow all pass. These are pre-ledger diagnostic results; the PR/issue record pins the required replay to the final reviewed SHA. |
| Cycle-7 final-squad review at `47f2deebfebe136e8cc02bf2c6f7622f3032da66` | Rejected: canonical artifacts still described dispatch-turn-only acceptance, four necessary generic-wrapper source/test paths were outside WP01 and lane-a ownership, and the `SkAppShell` class JSDoc omitted all eleven stylesheet token dependencies. Debugger Debbie approved the corrected React behavior with no findings. These results describe the rejected parent; `review-cycle-7.md` and `review-feedback-7.md` preserve the exact lens evidence and bounded correction. |
| Cycle-7 bounded correction | Authored governance and documentation now describe exactly one post-dispatch microtask sample of effective falsiness, intent expiry at that sample, and Lit-update-before-focus sequencing; WP01/lane-a authorize only the four already-necessary paths; and the class JSDoc records the exact eleven tokens. Source-derived CEM/React/Vue/size artifacts and focused local checks belong to the successor handoff. No successor full matrix, independent approval, live GitHub refresh, or pinned Ubuntu CI result is claimed here. |
| Preserved infrastructure diagnostics | A stale checklist invoked four renamed/nonexistent gate paths before the live workflow command names were rerun fail-fast and passed. A first read-only focused container failed before tests with `EROFS`, and a too-narrow full-suite container mount was stopped after a git-aware probe could not resolve the worktree gitdir; the corrected mission-root mount passed. Chromium's headed run reports only the already-scoped missing development favicon; Firefox has no console/page/request failure. None is represented as a product pass or silently omitted. |

Earlier pre-rebase observations (458 tests, 26/26 focused browser checks, Storybook, 350-story axe,
suite timing, and guard selftest) remain historical. The supplied exact-head matrix for rejected
`1e93ec8` is recorded above rather than omitted, while every cycle-5 result is labeled as a
successor result. Final successor full browser, axe, release, offline, mutation, real-zoom, and
independent-review evidence belongs to the immutable external logs and PR evidence comment. The
cycle-6 diagnostic matrix above is complete but remains explicitly pre-ledger. Cycle 7 rejected
`47f2deeb` for governance/documentation gaps; after the bounded correction is frozen, every
mandatory gate and all four independent Codex lenses run again on the resulting immutable commit
before the replacement PR head is published.

Live `gh issue view 254` access succeeded on 2026-09-08. The issue remains open, and PR #268's
remote head still identifies `755dcf6b7ff84c5ea37602736889654a006db88b`; that public record is
intentionally not updated until the rebased successor passes its exact-SHA review and acceptance.

The installed `spec-kitty-cli 3.2.6rc4` exposes task finalization, validation, mapping, status, and
lane-transition commands, but no command for appending an `owned_files` path to an existing WP.
The earlier narrow ownership correction added `packages/elements/src/index.ts` to both WP01
`owned_files` and lane-a `write_scope`. Cycle 7 identified four more already-necessary cycle-6
paths: `scripts/build-react-wrappers.mjs`, `scripts/normalise-manifest.mjs`,
`tests/node/react-wrappers.test.ts`, and `fixtures/react-consumer/src/wrappers.test.tsx`. They are
now authorized in that same one-WP/lane boundary. Successor workflow/scope validation is recorded
in the handoff; no successor review or acceptance is claimed in this ledger.

## Environment limitations retained for closeout

- `npx playwright install --with-deps chromium firefox` requires unavailable interactive `sudo`
  authentication for system packages. The already-installed Playwright Chromium and Firefox
  binaries execute the required browser tests and headed zoom checks; the prerequisite failure is
  recorded separately from browser execution.
- Host WebKit still cannot launch because its system libraries require the same unavailable package
  permission. The cached official Playwright noble image supplies those libraries and completed the
  focused 23-case WebKit run above without changing the host.
- The repository's committed Chromium visual baselines were authored in a different font/rendering
  environment; the scoped final local visual run reports 4 passes and 87 unrelated pixel diffs. Diff
  artifacts are reviewed and this known baseline mismatch is not represented as a passing visual
  regression gate.
