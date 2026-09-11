# Implementation evidence — connector section navigation (#337)

**Branch**: `mission/connector-section-navigation` (single_branch topology; no separate lane branch)
**Branch point**: `train/elements-first@7032cf7792a83ee20d9fd70ddcfb28a057c72884`
**Recorded**: 2026-09-10, after independent-review cycle 1 (REJECT → fix → re-verify)

## Two findings from independent review, and how each was closed

### 1. [BLOCKING] Firefox clipped the focus indicator on the off-screen-at-rest link

**Original claim**: `scroll-margin-inline: var(--sk-space-4)` (16px) on `.sk-section-nav__link`,
tested only at 16px and (when probing for a fix) 200px, and concluded — wrongly — that no
CSS-only remedy existed. The test suite shipped a `test.fail()` for Firefox instead of a fix.

**What the reviewer found, independently reproduced**: a real sequential-Tab walk to the last of
six links in the `many-routes`/`narrow` fixture left it **~37–42px short of full reveal in
Firefox** (measured `scrollLeft` 358px against the true full-reveal value of 395px). Because the
family's `:focus-visible` outline is drawn flush to the link's own box
(`outline-width: 2px; outline-offset: -2px`, zero expansion), the clipped ~40% of the link's
trailing edge took the outline's trailing segment with it — a real violation of #337's own
acceptance clause ("focused links scroll into view **without clipping their focus indicator**")
and of spec.md SC-003, which names Chromium **and** Firefox.

**The reviewer's fix, verified here**: `scroll-margin-inline` is non-monotonic across the range —
0px and 48–100px close the gap, 16px and 200px do not. `var(--sk-space-9)` (48px) — the same token
`sk-section-nav.css` already uses two lines above for the 44px target floor — closes it with zero
Chromium regression.

**Before/after measurement, this checkout, both engines, real sequential Tab walk to the sixth
link in `many-routes` at a 390×720 viewport with the 240px narrow demo frame:**

| | scrollLeft reached | trailing-edge overflow past the scroller |
|---|---:|---:|
| Chromium, before (`--sk-space-4`, 16px) | 395px | ~0px (already correct) |
| Firefox, before (`--sk-space-4`, 16px) | 358px | **~37.3px clipped** |
| Chromium, after (`--sk-space-9`, 48px) | 395px | ~0.45px (sub-pixel rounding) |
| Firefox, after (`--sk-space-9`, 48px) | 395px | ~0.27px (sub-pixel rounding) |

`packages/styles/src/section-nav/sk-section-nav.css:40` now reads
`scroll-margin-inline: var(--sk-space-9);`. The `test.fail()` conditional was deleted from
`apps/storybook/src/tests/sk-section-nav.spec.ts`'s "the last, off-screen-at-rest link scrolls
fully into view..." test; it now runs as a strict, unconditional assertion in both projects. Full
targeted-spec re-run after the fix: **57 passed, 0 failed** across Chromium + Firefox
(`test-results/.last-run.json`: `{"status":"passed","failedTests":[]}`).
`docs/design-system/using-components.md`'s claim that focus "scrolls fully into view... without
its focus outline being clipped" was verified rather than deleted — it is accurate as of this fix
and needed no wording change.

### 2. [MAJOR] 200%/400% zoom had no artifact, and an earlier report over-claimed coverage

**What was wrong, plainly**: an earlier report from this WP claimed 200%/400% zoom was "exercised
at test level... matching the `.sk-context-nav` precedent's own convention." Neither half of that
sentence is true. A case-insensitive `zoom` grep over `sk-section-nav.spec.ts` at that point
returned zero matches — the state was absent, not exercised differently. And
`native-context-navigation-styles-01M1Y3MG` does not establish "no zoom story/test is normal
practice here": its own reviewer filed the identical gap as **[HIGH]**
(`tasks/WP01-native-context-navigation-contract/review-cycle-1.md:15` — *"No exact-head evidence
records real browser zoom at 200% and 400%; viewport-width tests are not a substitute"*), and
`review-cycle-2.md:36` still had it unresolved when that mission closed. **That claim is withdrawn
here and must not be repeated as a justification in any future report on this mission.**

**What this sandbox can and cannot produce.** This environment has no host browser UI to drive
real `ctrl`/`cmd`-`+` zoom through — that specific evidence (browser chrome's own zoom mechanism,
UI scaling, real input/hit-testing at zoom) is **out of reach here**, is systemic to this
programme's sandboxed CI/local environment rather than something this one WP can close, and the
orchestrator is tracking it at programme level. `native-context-navigation-styles-01M1Y3MG`'s own
task file states the boundary precisely: *"Viewport resizing or CSS `zoom` does not substitute for
browser zoom"* (`tasks/WP01-native-context-navigation-contract.md:172`) — so neither of those two
techniques is offered here as zoom evidence either.

**What was actually added, and how it is captioned.** `sk-section-nav.spec.ts` now has one
Chromium-only test, `CDP-approximated 200%/400% reflow: the strip stays within its container and
no content is lost`, using CDP's `Emulation.setDeviceMetricsOverride` at a halved (then quartered)
viewport with a correspondingly doubled (then quadrupled) `deviceScaleFactor`. This approximates
the **reflow** a page experiences under real 200%/400% browser zoom (less available inline space
at the same physical pixel count) — it does **not** approximate the browser chrome's zoom
mechanism itself. The test and its surrounding comment say so explicitly, in those words, so nobody
downstream mistakes it for genuine zoom evidence.

Measured while building this test: this suite's own `storyFrame()` helper wraps every fixture in a
**fixed**-width demo box (240px narrow / 320px default) — a deliberate, fixed-size "this is how
wide a column might be" sandbox, not a fluid page. At the most aggressive simulated scale (4x,
~98px effective viewport) that fixed 240px frame legitimately exceeds the simulated viewport and
the outer document scrolls — that is the **fixed-width demo fixture's own choice**, present in
every story in this file the same way, not `.sk-section-nav` forcing document overflow (a real
fluid consumer container would shrink with the viewport; the demo frame deliberately does not).
The test therefore asserts what is actually attributable to the family under test — the strip never
exceeds the width its own immediate container gives it, and no content or link text is lost — not
a document-level `scrollWidth` equality the fixed demo frame cannot honestly satisfy at 400%. Full
detail is in the test's own code comment at `sk-section-nav.spec.ts`.

**FR/NFR/SC wording, held to what is actually proven** (spec.md itself is not hand-edited — it is
a frozen kitty-specs design artifact; this section is the correction of record):

| clause | what is proven | what is not |
|---|---|---|
| FR-017 (stories/tests for every required state, incl. "200% zoom, short viewport") | NARROW viewports (390×720/900, `≈320px`/240px narrow hosts) are proven live in both browsers; a genuinely SHORT viewport (390×400) is proven live, in all three browsers, via "a short (390×400) viewport does not clip the strip or a focused link" (added in review cycle 2, below — an earlier version of this row conflated narrow with short and is corrected here); the CDP reflow-approximation test exists and passes (Chromium) | genuine browser-chrome zoom at 200%/400% is not proven anywhere in this environment |
| NFR-005 ("200% and 400% browser zoom... no horizontal or unexpected two-dimensional overflow, and no focus indicator or label is clipped") | the CDP-approximated reflow shows the strip stays within its container and loses no content at both simulated factors, in Chromium; the short-viewport test above covers the "documented short viewport height" sub-clause independently of zoom | this is reflow-under-constraint evidence, explicitly not browser-chrome zoom; Firefox/WebKit have no CDP equivalent exercised here |
| SC-001 ("...200%/400% zoom...has a documented, runnable Storybook example") | no dedicated `Zoom200`/`Zoom400` CSF story exists (matching every other component in this styles catalogue — none ships one); zoom-adjacent states are covered by the narrow/short-viewport stories plus the CDP test | a zoom-labelled story specifically |
| SC-004 ("...zoom/short-viewport checks... pass on the exact reviewed SHA") | the genuine short-viewport check passes on the reviewed SHA, in chromium, firefox, and webkit; the CDP reflow approximation passes on the reviewed SHA (chromium) | genuine zoom checks do not exist to pass or fail |

This is recorded as an **honest, disclosed evidence gap** for the zoom sub-clauses specifically —
not as a passed criterion, and not as a defect in the shipped CSS. No FR/NFR/SC above is marked
"satisfied" by zoom evidence this WP does not have.

**Correction, review cycle 2:** the FR-017 row above originally read "short viewport (390×720/900...)
is proven" — those are NARROW viewports (720/900px tall), not short ones; every `setViewportSize`
in the suite before this cycle was 720 or 900 tall, and NFR-005's own "documented short viewport
height" clause had no test at all. An inaccurate line inside this disclosure table is worse than an
acknowledged gap, since the whole point of the table is that it can be trusted; see review cycle 2
below for the real fix (a genuine 390×400 test) rather than a corrected sentence alone.

## Everything else independent review already confirmed and is unchanged by this cycle

- Absence-assertions (no `tablist`/`tab`/`tabpanel`, no `aria-controls`/`aria-selected`, no
  arrow-key handling, no explicit `tabindex`) genuinely test absence — verified against the live
  accessibility tree and keyboard behaviour, not just source-regex.
- Local horizontal-overflow containment is verified live: the strip's own `scrollWidth` exceeds its
  `clientWidth` when constrained, while the document's does not, at 390×900 and inside the 240px
  narrow demo frame.
- `packages/elements/SIZES.md`'s `@spec-kitty/styles` figure is refreshed here to the current head
  rather than carried from an earlier rebase: this mission's own +9 files under
  `packages/styles/src/section-nav/` are part of a `@spec-kitty/styles` total that has since moved
  with every unrelated sibling mission the train absorbed (boundary-page, public-header,
  radio-choice-group, and others). At this head: **289 files / 843.7 KiB**, independently
  reproduced via `npm pack --dry-run --workspace=@spec-kitty/styles` (289 files / 864.0 kB
  unpacked — the two figures agree; SIZES.md reports KiB, `npm pack` reports kB). The absolute
  numbers recorded here at earlier points in this file's own history (236→245 files, then
  280→289 across a later rebase) were each accurate for the SHA they described and are superseded
  by rebasing, not by a defect — refresh the absolute figures again at any future SHA rather than
  trust a number this file has already recorded.
- `custom-elements.json`, `packages/react/src/**`, `packages/elements/vue.d.ts` are confirmed
  byte-identical to the pre-change baseline (`git diff --exit-code` over each, plus a full
  regenerate-then-`--check` pass).
- `expected-stories.json` ratchet arithmetic is correct: this mission's own 12 ids are unchanged
  since first added; the FILE's total has moved with the train at every rebase (536→548→576→610 at
  various heads) the same way `@spec-kitty/styles`'s size has — at this head, declared total 610
  equals `sum(len(v) for v in byElement.values())` counted independently, verified before
  committing.
- `LightMode` uses a real `.sk-light` ancestor wrapper (never `data-theme`), verified to resolve
  genuinely different computed styling than the dark default.
- No visual-regression PNG was shot or committed locally; baselines remain CI-authoritative.

## Review cycle 2: a four-lens pre-merge squad, and the headline repair's own guard was fake

A four-lens squad (randy-reducer, architect-alphonso, reviewer-renata, debugger-debbie) reviewed
this WP after cycle 1's rebase. The most consequential finding: **the Firefox scroll-margin fix
from cycle 1 was never actually proven.** Its own regression test checked only the LAST link
during a real Tab walk; the scroller clamps at its own max scroll position when the walk ends
there regardless of any CSS value, so "the last link ends up flush" held even with the fix
completely deleted. Checking every link visited during the walk (not only the last) found a real,
separate defect the last-link-only check could never see: in Chromium specifically, INTERMEDIATE
links (route-3, route-5 of six) were left up to 103px outside the scroller on focus — independent
of `scroll-margin-inline`'s value, which had zero measured effect on this specific defect.

**The real fix, measured, not guessed:** `scroll-padding-inline: calc(var(--sk-space-9) +
var(--sk-space-2))` (56px) on `.sk-section-nav` itself — the scroll CONTAINER, not
`scroll-margin-inline` on each `__link` — closes the gap for every link, in both Chromium and
Firefox, at every frame width this family's stories exercise (240px, 320px, 1280px viewport). This
replaces cycle 1's `scroll-margin-inline` entirely (removed from `__link`). The new guard,
`tabWalkContainment()`/"every link scrolls fully into view on Tab focus..." in
`sk-section-nav.spec.ts`, was proven red-first against the real regression: with
`scroll-padding-inline` deleted from the committed CSS, the same #route-3 overhang (measured 103.3px
in Chromium, 103.2px in Firefox) reproduced and reded the test in both engines; restoring the
declaration and rebuilding returned it to green. `scroll-padding-inline` is also now pinned by an
explicit source-inventory assertion (`toContain('scroll-padding-inline: calc(...)')`), because the
existing token cross-check cannot catch its removal on its own — `--sk-space-9` and `--sk-space-2`
are each used elsewhere in the file, so the documented token SET is unchanged even if this specific
declaration vanishes.

**Other real defects the squad found and this cycle closed, briefly** (each verified, not assumed):

- `Narrow`'s story rendered byte-identically to `ManyRoutes` (an inert `parameters.viewport` —
  this repo has no viewport addon) while ratcheted as independent evidence — the identical defect
  `#353`/sk-public-header already diagnosed and fixed. Fixed the same way: a genuinely different
  frame width (200px vs 240px, `veryNarrow`), inert `parameters` dropped.
- Several assertions were tautological or vacuous: `navOwnsItsOverflow` used `>=` where
  `scrollWidth >= clientWidth` holds for every element by CSSOM definition (now `>`, plus a real
  per-link nonzero-bounding-box check replacing a non-discriminating frame-containment check); the
  document-overflow check in "six routes overflow locally..." ran at a 1280px viewport where a
  240px centred frame can never reach the document edge (now 390px, where it is discriminating);
  three `for (const link of ...)` loops had no `count > 0` floor, so a renamed CSS class would make
  them iterate zero times and pass vacuously (floors added); `:visited`'s "presentation-neutral"
  claim used `getComputedStyle`, which deliberately always reports the unvisited style in every
  engine (privacy protection) and therefore could never fail regardless of what `:visited` actually
  does — the equality assertion was dropped, the navigation proof kept, and the real `:visited`
  contract is already pinned by the source-level selector-pairing check.
- Two dead/misleading CSS declarations removed: `overflow-y: visible` (the initial value, and CSS
  overflow propagation forces it to compute `auto` anyway once `overflow-x: auto` is present —
  measured `["auto","auto"]` with and without) and `overflow-wrap: anywhere` (inert: every child is
  a `.sk-section-nav__link` with `white-space: nowrap`, so no soft-wrap opportunity exists anywhere
  in this family; its own source-inventory assertion was asserting an inert declaration and is
  removed with it).
- Two under-documented invariants given a comment: the numeric equality between `__link`'s
  `margin-block-end` and the root's `border-block-end-width` (both `var(--sk-border-width-1)`, so
  the current-route accent bar sits flush); and why `:focus-visible`'s `outline-offset` is
  NEGATIVE here where `sk-context-nav`'s is positive (this family's own scroll container clips at
  its padding box, so an outward outline would be clipped at the scroll edge).
- Docs gained the one sentence the styles-only contract had been silently missing: since the
  family ships no JavaScript, only the CONSUMER can scroll the `aria-current` link into view at
  initial paint when the strip is constrained (own committed `many-routes`/`long-labels` baselines
  demonstrate the current route landing off-screen at rest) — now stated explicitly, pointing at
  `scroll-padding-inline` as the mechanism the family reserves for that call. The `:visited`
  sentence was strengthened from "not required to differ" to stating plainly that the family
  neutralises visited colouring ON PURPOSE, and named the override specificity bar (`(0,2,0)`).
- Added: a real RTL mirroring fact (first-DOM-link renders right of the last-DOM-link under
  `dir="rtl"`, not only that `direction` computes to `rtl`); a genuine 390×400 short-viewport test
  (see the correction above); the WebKit branches of the Tab-order and scroll-into-view tests were
  narrowed to state precisely what `.focus()` can and cannot prove there, after this cycle's own
  first attempt at the DOM-order webkit branch was found by the squad to be unfalsifiable (a bare
  `.focus()` plus `toBeFocused()` can only fail if the anchor is entirely unfocusable) and the
  scroll-into-view webkit branch was found to be blind to the exact defect class the chromium/
  firefox branch exists to catch (a bare `.focus()` also clamps to the scroll limit regardless of
  whether the fix is present, the same unfalsifiable shape as the chromium/firefox last-link-only
  bug this cycle fixed elsewhere).

All gates re-run after folding: `npm run quality:all`, `typecheck-all`, `build-styles-only-markup
--check`, a full Storybook rebuild, `run-axe-storybook.js` (zero WCAG 2.1 AA violations, 729
rendered stories, all 12 `navigation-sksectionnav-html--*` individually green), and the full
targeted Playwright spec on an isolated port — **chromium 33/33, firefox 26 passed/7 skipped/0
failed**, both clean. WebKit remains unrun locally (this sandbox lacks WebKit's system
dependencies) and CI-verified only, as recorded in cycle 1.

## Gates not run locally, and why

`scripts/suite-selftest.mjs` was **not** run to completion locally and is **not** reported as
passed. `.sk-section-nav` is styles-only and owns no behaviour (no custom element, no events, no
focus/keyboard handling — the arrow-key model is an explicit non-goal per C-004), so it contributes
no `behaviours.json` subject and no `mutations.json` entry (confirmed: `sk-section-nav`/
`SkSectionNav` do not appear in either registry). `suite-selftest.mjs` re-derives red-first claims
across the pre-existing mutation corpus this mission does not touch; two local attempts on this
shared box were killed outright by an OS-level low-memory sweep (the first left a log with no
verdict line and `EXIT:143` — a SIGTERM, verified before reporting anything). `.github/
workflows/ci-quality.yml` runs both `suite-selftest.mjs` and its `--selftest` as `[ENFORCED]` jobs
on the PR head SHA, which is this programme's actual merge-gate authority; that is where this gate
is authoritative and where it will run.
