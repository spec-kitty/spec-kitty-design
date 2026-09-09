# Issue #278 Mission Kanban browser zoom evidence

This evidence records actual Chrome page zoom for the narrow K2 board and the supplied
long-content stress story. The production Storybook build and captures were produced from
implementation commit `7ffaae1033e032dafd1e42255a97392e8a80456d` (tree
`6aac6defb52c3fcfdff47b3932cd981f8c2f5b17`). The evidence files are committed afterward because
a Git commit cannot contain its own hash.

## Environment and method

- Fedora Linux 44, x86_64
- Chrome for Testing `151.0.7922.34`, Playwright `1.62.1`, Storybook `10.6.0`
- Production Storybook served from `127.0.0.1:6178` in a `1200 x 800 x 24` Xvfb display
- X11/XTEST focused the real headed Chrome window, sent `Ctrl+0`, then five native
  `Ctrl+Shift+=` browser-UI chords
- Native Tab traversal reached the final WP15 route; native horizontal and page navigation
  revealed it without script-controlled scrolling
- FFmpeg captured the complete X11 display, including browser chrome; the screenshots are not
  page-only or viewport emulations
- No CSS zoom/transform, Playwright viewport override, device-scale override, CDP emulation, or
  pinch/page-scale emulation was used

The physical Chrome window remained `1199` CSS pixels wide on a 1200-pixel X11 display.
`innerWidth` changed from `1199` to `599`, `devicePixelRatio` changed from `1` to `2`, and
`visualViewport.scale` remained `1`. Chrome also persisted a host zoom factor of exactly `2` for
`127.0.0.1`.

All four story/zoom states passed. Document `scrollWidth` equalled `clientWidth`; horizontal
overflow remained owned by the labelled, keyboard-focusable board region; all five supplied lanes
retained their 220-pixel intrinsic width; the WP15 native link was focused and contained; the
long supplied repository label remained present; and no console or page errors occurred. The
focus calculation includes the painted outline extent. In these captures the two-pixel outline
has a negative two-pixel offset, so it is fully inset rather than clipped at the viewport edge.
Vertical document scrolling at 200% is expected.

Primary Codex visual inspection covered all four full-desktop captures. The dark composition,
five-lane order, distinct status tones, local horizontal board scroll, supplied content, and
visible WP15 focus ring remained legible at both zoom levels.

The CSS `zoom` Playwright cases remain supplemental cross-engine layout stress. This record is the
authoritative evidence for genuine browser page zoom.

## Capture hashes

| Story | 100% SHA-256 | 200% SHA-256 |
| --- | --- | --- |
| `k-2-narrow-contained` | `7627211d34b8e9818ab962f6f6e69cf6d0b32887f6e256b89e18e0bca9badb12` | `fd5692a4b98be2c67f89420609e15abaca817e20b96c66b3c5af437f86ec03cc` |
| `long-content` | `dbce78631ad5015239252e5a84a5ab17c65c790d595b3161d83e640e6dd3c3d1` | `66aee2a4df24b59ce0a8966b099937e4e4b90ed62ef432591254923ce65a6c7a` |

The machine-readable `metrics.json` record has SHA-256
`5afdabe2cc49207b143990c32644d7ec2300168c5c44138de30b3c3370c08c8c`.
Any later implementation change requires a fresh exact-source capture and inspection.
