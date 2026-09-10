# Issue #323 theme-toggle browser zoom evidence

This evidence records genuine Chrome browser UI zoom for the composed
`patterns-operational-status--zoom-200` Storybook story. The production build and
captures use base HEAD `c158e53cce903235b85751dc97dc5e2ea339aca2` plus the exact
uncommitted product tree `2b59e239254938f06cf6dffb040af4043843eb79`. The product tree
contains the cycle-seven implementation changes but excludes this evidence directory and
the temporary capture harness; `metrics.json` lists every included path. Evidence must be
recaptured if that product tree changes.

## Environment and method

- Fedora Linux 44, kernel `7.1.5-201.fc44.x86_64`, x86_64
- Chrome for Testing `151.0.7922.34`, Playwright `1.62.1`, Storybook `10.6.0`
- Production Storybook built with `node scripts/build-storybook-with-budget.mjs`, then
  served from `127.0.0.1:6323` with
  `npx http-server apps/storybook/storybook-static -a 127.0.0.1 -p 6323 -c-1`
- Capture ran inside `xvfb-run -a -s '-screen 0 1200x800x24'`; Chromium was launched
  headed on X11 with a fixed `1200 x 800` window and a device-scale factor of `1`
- An Xlib/XTEST helper selected and focused the largest visible Chrome window, sent native
  `Ctrl+0`, then sent five native `Ctrl+Shift+=` chords. FFmpeg `x11grab` captured the
  complete `1200 x 800` display, including browser chrome and the visible `200%` indicator
- No CSS zoom/transform, Playwright viewport or device-scale override, CDP zoom emulation,
  or pinch/page-scale emulation was used

The physical browser window remained `1199 x 799`. Genuine browser UI zoom reduced the
effective CSS viewport from `1199 x 712` at 100% to `599 x 356` at 200%; DPR changed from
`1` to `2`, while `visualViewport.scale` remained `1`.

At each zoom level the harness used native Tab navigation to place visible keyboard focus
on the selected radio, then used native ArrowLeft input to exercise all three choices in
the sequence `dark -> light -> system -> dark`. Every transition matched the persisted
preference, root `data-theme`, and root `color-scheme`, including System resolving to the
host's light preference. Measurements confirmed all three labelled choices were visible,
contained by their fieldset, non-overlapping and unclipped; exactly one choice was selected;
the selected choice matched the root preference; the 2px focus outline remained visible;
and the document had no horizontal overflow at either zoom level. Vertical scrolling at
200% is expected.

Primary Codex visual inspection of both complete-display captures found the three choices,
selected Dark state, and focus ring visible at both levels, with the toggle contained and
without overlap. The 200% capture visibly includes Chrome's native zoom indicator.

## Captures and machine-readable record

| Zoom | CSS viewport | DPR | visual scale | Capture | SHA-256 |
| --- | ---: | ---: | ---: | --- | --- |
| 100% | `1199 x 712` | `1` | `1` | `operational-status-100-desktop.png` | `60a440bbe4f57f9140db24fa587d5abc7e005939804dacb9f20988c0aec1f7cf` |
| 200% | `599 x 356` | `2` | `1` | `operational-status-200-desktop.png` | `0a123c1866552d706e843e62302d2617d7603878cc2372ca194dd918ce772397` |

`metrics.json` contains the exact root states, native-keyboard sequence, geometry, checks,
browser path/version, source paths, and capture hashes. Its SHA-256 is
`35c0079d7b147aed1333641fc16e19e10948a52e46284e25ae210bff5c3b8a9e`.

The existing Playwright route whose stable export name is `Zoom200` is now described as a
capture target only; it applies no zoom or device-density emulation. The remaining
`deviceScaleFactor: 2` Playwright case is explicitly labelled supplemental HiDPI coverage
and is not claimed as browser-zoom proof.
