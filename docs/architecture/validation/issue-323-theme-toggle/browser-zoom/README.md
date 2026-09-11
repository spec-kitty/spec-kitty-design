# Issue #323 theme-toggle browser zoom evidence

This evidence records genuine Chrome browser UI zoom for the composed
`patterns-operational-status--zoom-200` Storybook story and, new in this capture, the
`patterns-operational-status--light-mode` story, after the pass-7 remediation (Op
`01M275TD2FV77BEVH8D65XW4DC`). The production Storybook build and captures use base HEAD
`6c58764c1b582b757b5b4e9d6dcb11d624041281` plus the exact uncommitted product tree
`e47921c641e2cc521355d18253ac3f15d1ee868a` (`sourceDiffSha256`
`f7c0b454fa8b9ef54ee1272945c53ee619661755cc375258e6b6f189859159a5`). `metrics.json` lists every
included path and records the identity procedure so the two figures can be re-derived: a temporary
index seeded from HEAD takes every working-tree change except this evidence directory and
`kitty-specs/`, and `git write-tree` names it; the SHA-256 is taken over the binary `git diff HEAD`
of the same pathspec. `sourceProductTree.paths` is the literal `git diff HEAD --name-only` output
over that same pathspec, so the listed paths and the two hashes agree by construction — neither
`kitty-specs/` nor this evidence directory (including `operator-log.md`) appears in the list,
because neither is part of either hash. Evidence must be recaptured if the tree changes; this
capture replaces the pass-6 capture, whose tree identity the pass-7 product changes made stale.

## What changed since the previous capture

The product tree changed. `sk-theme-toggle.ts` gained the dormant coordinator's stored-value rule,
post-dispatch persistence and rendered-attribute canonicalization. The operational-status
composition now leaves the control's `preference` unbound unless a caller overrides it, and its
stories no longer pass one. The tree also changed in the consumer documentation, the tests, and
`mutations.json`, and in the regenerated manifest, React and Vue description text and `SIZES.md`.
No CSS changed. Every story still resolves the same state, because each story's `themePreference`
parameter is already the stored preference `isolateThemeStory` seeds before render. So no layout
difference was expected on the zoom-200 route.

None was measured. Every geometry figure and the keyboard sequence in `metrics.json` `at100` and
`at200` are numerically identical to the pass-6 capture. The PNG bytes are not identical, and the
hashes below are new. The capture was served from `127.0.0.1:6431`, not the previous `:6423`, and
the omnibox shows that. `x11grab` also records the mouse pointer wherever the last pointer event
left it. These are genuine fresh captures of an unchanged layout, not a relabel of the old images.

The pass-6 capture helpers were not preserved, neither in the repository nor in any scratch area
this seat could find. This seat re-implemented the documented method as three helpers outside the
repository: a Node Playwright driver, a python-xlib XTEST key helper, and an FFmpeg `x11grab`
frame grab. It followed the method below with one generalization: the keyboard cycle starts from
whichever choice is checked, which is Dark on the zoom-200 route and Light on the LightMode route.

## Environment and method

- Fedora Linux 44, kernel `7.1.5-201.fc44.x86_64`, x86_64
- Chrome for Testing `151.0.7922.34` (Playwright 1.62.1's managed browser), Storybook 10.x
- Production Storybook rebuilt fresh from the current tree with
  `node scripts/build-storybook-with-budget.mjs`, then served from `127.0.0.1:6431` with the
  repository's own `http-server` (`node node_modules/http-server/bin/http-server
  apps/storybook/storybook-static -a 127.0.0.1 -p 6431 -c-1 --silent`). Port 6006 belongs to
  another checkout's stale server and was not used.
- Capture ran inside `xvfb-run -a -s '-screen 0 1200x800x24'`. Chromium was launched headed with a
  fixed `1200 x 800` window (`--window-size=1200,800 --window-position=0,0`), no Playwright
  viewport override (`viewport: null`, so the real window governs layout), and
  `--ozone-platform=x11`.
- A python-xlib XTEST helper found and focused the sole viewable top-level window. For each zoom
  level it sent a native `Ctrl+0`, followed by five native `Ctrl+Shift+=` chords for 200%.
- At each zoom level one real Playwright pointer click focused the checked radio, through
  Chromium's CDP input injection and its trusted-input pipeline rather than a script-level
  `element.click()`. The same helper then sent three native `ArrowLeft` chords to cycle the group
  back to its starting choice.
- FFmpeg `x11grab` captured the complete `1200 x 800` display, including browser chrome, at each
  zoom level.
- No CSS zoom/transform, Playwright viewport or device-scale override, CDP zoom emulation, or
  pinch/page-scale emulation was used

The physical browser window remained `1199 x 799`. Genuine browser UI zoom reduced the effective
CSS viewport from `1199 x 712` at 100% to `599 x 356` at 200%. DPR changed from `1` to `2`, while
`visualViewport.scale` remained `1`. These are identical to the pass-6 figures, on both routes.

Native keyboard input exercised all three choices at both zoom levels on both routes:
`dark -> light -> system -> dark` on the zoom-200 route, and `light -> system -> dark -> light` on
the LightMode route. Every transition matched the persisted preference, root `data-theme`, and
root `color-scheme`, including System resolving to the host's light preference.

The LightMode story carries the `.sk-light` wrapper as well as the root attribute; `metrics.json`
records it as `themeScopes: ["div.sk-pattern-operations.sk-light"]`. These two images are
therefore LightMode visual evidence at 100% and 200%, not evidence of root-only resolution. That
claim is asserted in `apps/storybook/src/tests/sk-theme-toggle-pattern.spec.ts` by the System-light
and manual-Light cases, which require an empty `themeScopes` and a light surface luminance.

## Results

At both zoom levels, on both routes:

- every supplied header string — `Operations`, `Regional service status`, `Every value below is
  supplied by the application. The library styles none of it.`, and `Updated 4 minutes ago` —
  is complete and visible, with computed `text-overflow: clip` and `white-space: normal`. No line
  box extends past any clipping ancestor or the viewport (`clippedBy` is empty for all four). The
  supporting sentence wraps to two lines.
- the three labelled choices are visible, contained by their fieldset, non-overlapping and
  unclipped; exactly one is selected and it matches the root preference;
- the document has no horizontal overflow;
- the starting choice (Dark on the zoom-200 route, Light on the LightMode route) is selected with
  a visible focus ring. The prominent ring is the `.sk-theme-toggle__choice:has(input:focus-visible)`
  label rule: `metrics.json`'s `focus.label` records computed `solid`, `2px`, a `4px` offset and
  `rgb(245, 197, 24)`. The native `<input>` keeps the browser's own 1px near-black focus outline
  inside the label border.
- on the LightMode route the composition surface is the light palette: background
  `rgb(248, 245, 236)` with text `rgb(42, 42, 34)`.

I inspected all four complete-display captures directly:

- **Zoom-200 route, 100%:** the header shows the eyebrow, the title, the supporting sentence on
  two lines and the sync text in full. Beside it is the Theme group with Dark selected and the
  gold label ring, then the `Open runbook` action. The notice, the three toned cards and the start
  of the chart follow.
- **Zoom-200 route, 200%:** the same four strings are complete in larger type. The Theme group,
  with the same ring around Dark, and `Open runbook` sit beneath them without overlap. Chrome's
  magnifying-glass zoom indicator is visible in the omnibox.
- **LightMode route:** the same at both levels, on the cream light palette, with Light selected
  and ringed.

No string anywhere in any header is painted as an ellipsis.

One console entry was recorded: `Failed to load resource: the server responded with a status of
404`. It is the same benign entry recorded in every prior capture, most likely Chrome's automatic
headed-mode `favicon.ico` request; the static build ships `favicon.svg`. No page response failed.
Both are recorded in `metrics.json`, not suppressed.

## Captures and machine-readable record

| Route | Zoom | CSS viewport | DPR | visual scale | Capture | SHA-256 |
| --- | --- | ---: | ---: | ---: | --- | --- |
| zoom-200 | 100% | `1199 x 712` | `1` | `1` | `operational-status-100-desktop.png` | `55d0288dcfa183a5920c365bbe959a04eb915536557680b3122b0a6995ec2461` |
| zoom-200 | 200% | `599 x 356` | `2` | `1` | `operational-status-200-desktop.png` | `e94e1fec17b65c43289774d56eb848838fa041eb9eb88ac1dbce1391adba7b33` |
| light-mode | 100% | `1199 x 712` | `1` | `1` | `operational-status-light-mode-100-desktop.png` | `4c1c2be28462d7029c7002963c4e1fa1d08a3c09f0af182bea03efd444e762f7` |
| light-mode | 200% | `599 x 356` | `2` | `1` | `operational-status-light-mode-200-desktop.png` | `5468662fed6ac06a915fed2c89c2151b2243b208c22a6600cfc477f800654e7b` |

`metrics.json` contains, for both routes:

- the exact root states and native-keyboard sequence;
- header-copy visibility with each string's line-box count and clipping ancestors;
- the geometry, and both focus outlines (input and label);
- the composition surface colours and any wrapper theme scopes;
- the checks;
- the browser path and version, the source identity, and the capture hashes.

The zoom-200 route stays under the top-level `pageUrl`, `at100` and `at200` keys, so the pass-6
record remains directly comparable. The LightMode route is under `lightMode`. The file's SHA-256 is
`05ced9046b4db90e508a7c0c82e001a35f4a1ea7b2162677bb3af6393b834a78`.

The automated guard is `apps/storybook/src/tests/sk-theme-toggle-pattern.spec.ts`. It asserts the
same header-copy visibility at the desktop, the 200%-zoom CSS viewport measured here, and a narrow
viewport. It is CSS-geometry evidence, not browser zoom; these headed captures remain the
browser-zoom proof. The route whose stable export name is `Zoom200` applies no zoom or
device-density emulation itself.
