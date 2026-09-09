# Issue #278 Mission Kanban browser zoom evidence

This evidence records actual Chrome page zoom for the narrow K2 board and the supplied
long-content stress story. The production Storybook build and captures were produced from
implementation commit `e8603cbaea449bf09af9736fe8eb5189fddd4216` (tree
`377d2d6f99303fcce6df93552d257e0036907c6d`). The evidence files are committed afterward because
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
| `k-2-narrow-contained` | `25a2d3b36532c4942ca04e1945e81d8efe68d87724fba839d93961f5a02f454b` | `cd734b67782cd4c20cf146e895f95dd4fb94e9bdcf0cbac98884532cf316b79c` |
| `long-content` | `2e7d5b686c1dfc2147442c17b09a7e5de0973d7509e82e61e9a92243688338b6` | `ba1235bf94a1ccdc27249f4096f372428c57eb8959d72f51c1c021deee6dbc3f` |

The machine-readable `metrics.json` record has SHA-256
`b5d80deb1a741ed62af76edfa7b46f5222317926dc91ac4ff3fc55fe56c5e0ca`.
Any later implementation change requires a fresh exact-source capture and inspection.
