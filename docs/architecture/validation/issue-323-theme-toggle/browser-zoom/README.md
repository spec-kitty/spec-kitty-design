# Issue #323 theme-toggle browser zoom evidence

This evidence records genuine Chrome browser UI zoom for the composed
`patterns-operational-status--zoom-200` Storybook story after the pass-5 remediation. The
production Storybook build and captures use base HEAD `aafa24e82577ba9fdb47ca7cde85015e373d1a3a`
plus the exact uncommitted product tree `85cbf6e2413d695a242eef3870d497c91cc1f1f0`
(`sourceDiffSha256` `13c921d3c3ae18e039e13f616dbdd3af38b5f0144de58daaf9d653689b9fe3e5`; the one
untracked product file, `tests/node/theme-root-barrel.test.ts`, is hashed separately in
`metrics.json` because `git diff HEAD` does not carry untracked files).
`metrics.json` lists every included path and records the identity procedure, so the two figures
can be re-derived: a temporary index seeded from HEAD takes every working-tree change except this
evidence directory and `kitty-specs/`, and `git write-tree` names it; the SHA-256 is taken over
the binary `git diff HEAD` of the same pathspec. Evidence must be recaptured if that tree changes.

This is the second capture of the pass-5 remediation. The first named tree
`1b5f6f016b9efd0ef9e98bb23f90f59934fd1704`; an independent inspection then found the generated
manifest advertising `THEME_DARK_SCHEME_QUERY` from `./dist/index.js` while the root barrel did
not export it. `packages/elements/src/index.ts` now exports it, which changed the product tree, so
Storybook was rebuilt and both zoom levels were recaptured under the rule above rather than the
identity being updated in place. Both new captures are byte-identical to the first pass (same
SHA-256 below); that is the observed result of the fresh capture, not an assumption that replaced
it.

## What changed since the previous capture

Pass 5 rejected the previous 200% capture because the composition selected the page header's
`density="compact"` presentation, whose shadow stylesheet sets the eyebrow, title, supporting
and sync copy to `nowrap` with a visual-only ellipsis. The previous 100% capture truncated three
of those strings and the 200% capture all four. The composition now uses the page header's
default density (the change is local to `packages/elements/src/patterns/operational-status.ts`;
the shared page-header stylesheet is untouched), and the element's multi-control coordinator,
property normalization and query authority changed with it, so both captures were retaken.

## Environment and method

- Fedora Linux 44, kernel `7.1.5-201.fc44.x86_64`, x86_64
- Chrome for Testing `151.0.7922.34`, Playwright `1.62.1`, Storybook `10.6.0`
- Production Storybook built with `node scripts/build-storybook-with-budget.mjs`, then served from
  `127.0.0.1:6323` with `npx http-server apps/storybook/storybook-static -a 127.0.0.1 -p 6323 -c-1`
- Capture ran inside `xvfb-run -a -s '-screen 0 1200x800x24'`; Chromium was launched headed with a
  fixed `1200 x 800` window, a device-scale factor of `1`, and `viewport: null`, so the real
  window governed layout. This workstation's desktop session is Wayland, so Chrome was forced onto
  the Xvfb display with `--ozone-platform=x11` and `WAYLAND_DISPLAY` unset
- A python-xlib XTEST helper selected and focused the largest viewable window, sent native
  `Ctrl+0`, then five native `Ctrl+Shift+=` chords. FFmpeg `x11grab` captured the complete
  `1200 x 800` display, including browser chrome
- No CSS zoom/transform, Playwright viewport or device-scale override, CDP zoom emulation, or
  pinch/page-scale emulation was used

The physical browser window remained `1199 x 799`. Genuine browser UI zoom reduced the effective
CSS viewport from `1199 x 712` at 100% to `599 x 356` at 200%; DPR changed from `1` to `2`, while
`visualViewport.scale` remained `1`.

At each zoom level native Tab navigation placed visible keyboard focus on the selected radio, and
native ArrowLeft input exercised all three choices in the sequence `dark -> light -> system ->
dark`. Every transition matched the persisted preference, root `data-theme`, and root
`color-scheme`, including System resolving to the host's light preference.

## Results

At both zoom levels:

- every supplied header string — `Operations`, `Regional service status`, `Every value below is
  supplied by the application. The library styles none of it.`, and `Updated 4 minutes ago` —
  is complete and visible. Each string's line boxes lie inside every overflow-clipping box between
  it and the document, across slot assignment and the page header's shadow root, and inside the
  viewport; computed `text-overflow` is `clip` and `white-space` is `normal`. The supporting
  sentence wraps to two lines;
- the three labelled choices are visible, contained by their fieldset, non-overlapping and
  unclipped; exactly one is selected and it matches the root preference;
- the visible focus indicator is the selected choice label's `2px` solid outline at a `4px`
  offset;
- the document has no horizontal overflow. Vertical scrolling at 200% is expected.

The header stays `sticky` at 100% (174 CSS px tall) and returns to normal flow at 200% through
the page header's own 720px threshold (310.5 CSS px tall).

Direct visual inspection of both complete-display captures: at 100% the header shows the eyebrow,
the title, the supporting sentence on two lines and the sync text in full, beside the Theme group
with Dark selected and focus-ringed and the `Open runbook` action; the notice, the three toned
cards and the start of the chart follow. At 200% the same four strings are complete in larger
type, the Theme group and `Open runbook` sit beneath them without overlap, and Chrome's omnibox
zoom indicator is visible. No string anywhere in either header is painted as an ellipsis.
Chrome's transient percentage bubble had closed before the capture; DPR `2` and the `599 x 356`
CSS viewport in `metrics.json` are the machine-readable record of the zoom level.

One console entry, `Failed to load resource: the server responded with a status of 404`, was
recorded. No response the page made returned a 4xx status, and a headless load of the same story
records none, so it is a request outside the page itself — most likely Chrome's automatic
headed-mode `favicon.ico` request (the static build ships `favicon.svg`). It is recorded in
`metrics.json`, not suppressed.

## Captures and machine-readable record

| Zoom | CSS viewport | DPR | visual scale | Capture | SHA-256 |
| --- | ---: | ---: | ---: | --- | --- |
| 100% | `1199 x 712` | `1` | `1` | `operational-status-100-desktop.png` | `3ea7314c09d868ac16db8503592ae514a99649f1e1122b163a1fd88d3010e45e` |
| 200% | `599 x 356` | `2` | `1` | `operational-status-200-desktop.png` | `5e15275cf203b26a83eab5c6eb9c7c4e3f91a23d675f3c89914056802e26fb91` |

`metrics.json` contains the exact root states, native-keyboard sequence, header-copy visibility,
geometry, checks, browser path/version, source identity, and capture hashes. Its SHA-256 is
`bf02d21344737846795dfb86b4f14c536b82432e2fff090f1f6cda4abed4ee8d`.

The automated guard is `apps/storybook/src/tests/sk-theme-toggle-pattern.spec.ts`, which asserts
the same header-copy visibility at the desktop, the 200%-zoom CSS viewport measured here, and a
narrow viewport. It is CSS-geometry evidence, not browser zoom; these headed captures remain the
browser-zoom proof. The route whose stable export name is `Zoom200` applies no zoom or
device-density emulation itself.
