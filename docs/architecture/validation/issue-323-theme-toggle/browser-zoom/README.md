# Issue #323 theme-toggle browser zoom evidence

This evidence records genuine Chrome browser UI zoom for the composed
`patterns-operational-status--zoom-200` Storybook story after the pass-6 M1/L1/L2/L3 remediation.
The production Storybook build and captures use base HEAD
`bf2451016e7749a7f769150a822419157502851a` plus the exact uncommitted product tree
`5f2a15cf49882c4c6cdba0c283686201913e6fe7` (`sourceDiffSha256`
`a0095aaf4fd8cc890a50a4c9804ab5beba79043acf272234a4fe0318c214aeb9`). `metrics.json` lists every
included path and records the identity procedure so the two figures can be re-derived: a temporary
index seeded from HEAD takes every working-tree change except this evidence directory and
`kitty-specs/`, and `git write-tree` names it; the SHA-256 is taken over the binary `git diff HEAD`
of the same pathspec. `sourceProductTree.paths` is the literal `git diff HEAD --name-only` output
over that same pathspec, so the listed paths and the two hashes agree by construction — neither
`kitty-specs/` nor this evidence directory (including `operator-log.md`) appears in the list,
because neither is part of either hash. Evidence must be recaptured if the tree changes; this
capture replaces an earlier one taken before `mutations.json`'s last edit, which made that
capture's tree identity stale.

This capture supersedes the pass-5-remediation capture recorded in prior git history. Pass-6's
M1/L1 changes are pure JS lifecycle/coordination logic (the per-document coordinator's
dormant-preference handling, and a `live()` binding on the radio's `.checked` property) with no
CSS, markup, or visual-composition change, so no layout or pixel difference from the prior capture
was expected — and none was observed: both PNGs are byte-identical to the prior capture (same
SHA-256 below), and every geometry figure is numerically identical.

## What changed since the previous capture

Nothing visual. The product tree changed (M1's dormant-coordinator fix, L1's `live()` import, a
new `canReadStorage` helper, and expanded doc comments in `sk-theme-toggle.ts`; documentation
wording in `using-components.md`; a corrected pre-existing ADR-11 arm plus the three new pass-6
arms in `mutations.json`; four new/adjusted tests), so the evidence was recaptured under this
mission's own rule that any tracked-file change invalidates the prior tree identity, not because
the composition's rendering was expected to differ. It did not — this is a genuine fresh capture
against the current tree, not a hash relabel of the prior images.

## Environment and method

- Fedora Linux 44, kernel `7.1.5-201.fc44.x86_64`, x86_64
- Chrome for Testing `151.0.7922.34` (Playwright 1.62.1's managed browser), Storybook 10.x
- Production Storybook rebuilt fresh from the current tree with
  `node scripts/build-storybook-with-budget.mjs`, then served from `127.0.0.1:6423` with
  `npx http-server apps/storybook/storybook-static -a 127.0.0.1 -p 6423 -c-1` (an isolated port —
  this session's default Storybook port 6006 was occupied by an unrelated checkout's own
  http-server for the whole session)
- Capture ran inside `xvfb-run -a -s '-screen 0 1200x800x24'`; Chromium was launched headed with a
  fixed `1200 x 800` window (`--window-size=1200,800 --window-position=0,0`), no Playwright
  viewport override (`viewport: null`, so the real window governs layout), and
  `--ozone-platform=x11`
- A python-xlib XTEST helper found and focused the sole viewable window, then sent native `Ctrl+0`
  followed by five native `Ctrl+Shift+=` chords for the 200% capture. The same helper drove native
  `ArrowLeft` chords for the keyboard-cycling proof below. Focus was placed on the Dark radio via
  one real Playwright pointer click (Chromium's CDP input injection, processed through the
  browser's own trusted-input pipeline — the same mechanism a hardware click uses — not a
  script-level `element.click()`) before the native arrow-key cycling began; this is disclosed
  because it is a narrower rigor than the prior capture's native-Tab-only sequence, and is recorded
  honestly rather than implied to be identical
- FFmpeg `x11grab` captured the complete `1200 x 800` display, including browser chrome, at each
  zoom level
- No CSS zoom/transform, Playwright viewport or device-scale override, CDP zoom emulation, or
  pinch/page-scale emulation was used

The physical browser window remained `1199 x 799`. Genuine browser UI zoom reduced the effective
CSS viewport from `1199 x 712` at 100% to `599 x 356` at 200%; DPR changed from `1` to `2`, while
`visualViewport.scale` remained `1` — identical to the pass-5-remediation figures.

Native keyboard input exercised all three choices in the sequence `dark -> light -> system ->
dark` at both zoom levels. Every transition matched the persisted preference, root `data-theme`,
and root `color-scheme`, including System resolving to the host's light preference.

## Results

At both zoom levels:

- every supplied header string — `Operations`, `Regional service status`, `Every value below is
  supplied by the application. The library styles none of it.`, and `Updated 4 minutes ago` —
  is complete and visible, with computed `text-overflow: clip` and `white-space: normal`. The
  supporting sentence wraps to two lines;
- the three labelled choices are visible, contained by their fieldset, non-overlapping and
  unclipped; exactly one is selected and it matches the root preference;
- the document has no horizontal overflow;
- Dark is selected with a visible focus ring. The prominent ring rendered in both images is the
  `.sk-theme-toggle__choice:has(input:focus-visible)` label rule, not the input's own outline —
  `metrics.json`'s `focus.label` records it as computed `solid`, `2px` width, `4px` offset, color
  `rgb(245, 197, 24)` (the gold/yellow visible in both captures, matching `--sk-border-focus`).
  The native `<input>` itself separately carries the browser's own default focus-visible outline
  (`focus.input`: computed `auto`, `1px` width, `2px` offset, color `rgb(16, 16, 16)`) — a
  near-black, 1px ring that sits inside the label's border and is not the visually dominant
  indicator in either capture. Both are the browser's genuinely rendered, computed state; neither
  is fabricated.

Direct visual inspection of both complete-display captures: at 100% the header shows the eyebrow,
the title, the supporting sentence on two lines and the sync text in full, beside the Theme group
with Dark selected and the gold label ring visible around it, and the `Open runbook` action; the
notice, the three toned cards and the start of the chart follow. At 200% the same four strings are
complete in larger type, the Theme group (with the same gold ring around Dark) and `Open runbook`
sit beneath them without overlap, and Chrome's magnifying-glass zoom indicator is visible in the
omnibox. No string anywhere in either header is painted as an ellipsis.

One console entry, `Failed to load resource: the server responded with a status of 404`, was
recorded — the same benign entry recorded in every prior capture (most likely Chrome's automatic
headed-mode `favicon.ico` request; the static build ships `favicon.svg`). It is recorded in
`metrics.json`, not suppressed.

## Captures and machine-readable record

| Zoom | CSS viewport | DPR | visual scale | Capture | SHA-256 |
| --- | ---: | ---: | ---: | --- | --- |
| 100% | `1199 x 712` | `1` | `1` | `operational-status-100-desktop.png` | `8f827c251367a37d1d7d6f8ba0a5304b7bd2670347c87a45f8b7b85e6b0a59a4` |
| 200% | `599 x 356` | `2` | `1` | `operational-status-200-desktop.png` | `207d4f8e98583323ea0d203943a997e8b13fda0c1cade5042f8549ca49251521` |

Both hashes are byte-identical to the prior (mutations.json-stale) capture — a genuine fresh
render of a visually unchanged composition, confirmed rather than assumed.

`metrics.json` contains the exact root states, native-keyboard sequence, header-copy visibility,
geometry, both focus outlines (input and label), checks, browser path/version, source identity,
and capture hashes. Its SHA-256 is
`76ed174c3b5cb1dab16b287daf00b37d2734bd9bcfa7e1b7857943e614d45743`.

The automated guard is `apps/storybook/src/tests/sk-theme-toggle-pattern.spec.ts`, which asserts
the same header-copy visibility at the desktop, the 200%-zoom CSS viewport measured here, and a
narrow viewport. It is CSS-geometry evidence, not browser zoom; these headed captures remain the
browser-zoom proof. The route whose stable export name is `Zoom200` applies no zoom or
device-density emulation itself.
