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
| FR-017 (stories/tests for every required state, incl. "200% zoom, short viewport") | short viewport (390×720/900, `≈320px`/240px narrow hosts) is proven live in both browsers; the CDP reflow-approximation test exists and passes (Chromium) | genuine browser-chrome zoom at 200%/400% is not proven anywhere in this environment |
| NFR-005 ("200% and 400% browser zoom... no horizontal or unexpected two-dimensional overflow, and no focus indicator or label is clipped") | the CDP-approximated reflow shows the strip stays within its container and loses no content at both simulated factors, in Chromium | this is reflow-under-constraint evidence, explicitly not browser-chrome zoom; Firefox/WebKit have no CDP equivalent exercised here |
| SC-001 ("...200%/400% zoom...has a documented, runnable Storybook example") | no dedicated `Zoom200`/`Zoom400` CSF story exists (matching every other component in this styles catalogue — none ships one); zoom-adjacent states are covered by the narrow/short-viewport stories plus the CDP test | a zoom-labelled story specifically |
| SC-004 ("...zoom/short-viewport checks... pass on the exact reviewed SHA") | short-viewport checks pass on the reviewed SHA; the CDP reflow approximation passes on the reviewed SHA | genuine zoom checks do not exist to pass or fail |

This is recorded as an **honest, disclosed evidence gap** for the zoom sub-clauses specifically —
not as a passed criterion, and not as a defect in the shipped CSS. No FR/NFR/SC above is marked
"satisfied" by zoom evidence this WP does not have.

## Everything else independent review already confirmed and is unchanged by this cycle

- Absence-assertions (no `tablist`/`tab`/`tabpanel`, no `aria-controls`/`aria-selected`, no
  arrow-key handling, no explicit `tabindex`) genuinely test absence — verified against the live
  accessibility tree and keyboard behaviour, not just source-regex.
- Local horizontal-overflow containment is verified live: the strip's own `scrollWidth` exceeds its
  `clientWidth` when constrained, while the document's does not, at 390×900 and inside the 240px
  narrow demo frame.
- `packages/elements/SIZES.md`'s `@spec-kitty/styles` delta (236→245 files, 640.4→650.2 KiB) was
  independently reproduced via `npm pack --dry-run`: exactly 245, and the +9 files trace to the
  nine files this WP added under `packages/styles/src/section-nav/`.
- `custom-elements.json`, `packages/react/src/**`, `packages/elements/vue.d.ts` are confirmed
  byte-identical to the pre-change baseline (`git diff --exit-code` over each, plus a full
  regenerate-then-`--check` pass).
- `expected-stories.json` ratchet arithmetic is correct (505→517, the exact 12 new story ids).
- `LightMode` uses a real `.sk-light` ancestor wrapper (never `data-theme`), verified to resolve
  genuinely different computed styling than the dark default.
- No visual-regression PNG was shot or committed locally; baselines remain CI-authoritative.

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
