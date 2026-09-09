# Issue #277 checkbox-choice-group browser zoom evidence

This evidence records actual Chrome page zoom for all twelve required native checkbox-choice-group
stories. The production Storybook build and captures were produced from implementation commit
`218a1783fe463d3a37898cb551c5e9edf40dc32b` (tree
`7ff82e10ab52a5f01b1396405bdc21cdcf23289e`). The evidence files are committed afterward because
a Git commit cannot contain its own hash.

## Environment and method

- Fedora Linux 44, x86_64
- Chrome for Testing `151.0.7922.34`, Playwright `1.62.1`, Storybook `10.6.0`
- Production Storybook served from `127.0.0.1:6177` in a `1200 x 800 x 24` Xvfb display
- X11/XTEST focused the real headed Chrome window, sent `Ctrl+0`, then five native
  `Ctrl+Shift+=` browser-UI chords, and used native Tab input to visit each enabled checkbox
- FFmpeg captured the complete X11 display, including browser chrome; the screenshots are not
  page-only or viewport emulations
- No CSS zoom/transform, Playwright viewport override, device-scale override, CDP emulation, or
  pinch/page-scale emulation was used

The physical Chrome window remained `1200 x 800`. Its document client width was `1199` CSS pixels
at 100% and `599` CSS pixels at 200% (`592` where a vertical scrollbar was present).
`devicePixelRatio` changed from `1` to `2`, while `visualViewport.scale` remained `1`.

The harness opened every built story at each zoom level, waited for fonts, and tabbed through every
enabled native checkbox. It recorded document, frame, group, choice, focused-input, and visible
focus-boundary geometry. All 24 story/zoom states passed: document `scrollWidth` equalled
`clientWidth`, every label/metadata box stayed within its choice, every enabled checkbox was
reached in source order, focus remained visible and locally contained, and no console or page
errors occurred. That is 166 successful native-checkbox focus observations and zero pixels of
maximum document-level horizontal overflow. Vertical scrolling at 200% is expected.

Primary Codex visual inspection covered all 24 captures. The first evidence pass exposed a focus
boundary clipped at 200%; a red geometry regression and token-based inset focus correction closed
it. A later visual pass exposed overly dense long-content columns; a second red regression and
token-based intrinsic minimum closed that before this final capture. The final K3 frame retains
the approved disclosure, legend, ten-choice hierarchy, two selected lanes, and static Apply/Clear
rhythm without copying application behavior.

The story named `forced-colors` is present in the real-zoom matrix, but Chrome was not put into a
simulated forced-colors mode for these desktop captures. The dedicated Playwright and visual tests
exercise forced colors independently; this record isolates genuine browser zoom.

## Review-cycle 1 visual-baseline authority check

Cycle-one review observed different intrinsic dimensions on the Fedora host. All eight owned
Playwright baselines were therefore regenerated from final CSS at `a97e602` inside the pinned
`mcr.microsoft.com/playwright:v1.62.1-noble` environment, using its bundled browser and the built
Storybook. The authoritative regeneration was byte-for-byte identical to the tracked files. The
exact targeted reviewer command then passed 8/8 in that same environment from a clean tree:

```sh
PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts \
  --project=chromium --grep 'SK-checkbox-choice-group'
```

Primary Codex visual inspection covered each regenerated image. Dark and LightMode retain their
token contrast; K3 retains disclosure, ten lanes, two selections, and static actions; narrow and
long content remain locally contained; disabled choices remain distinct; focus remains visible;
and forced colors retains native glyphs plus checked, disabled, and focus cues.

| Visual baseline | Dimensions | SHA-256 |
| --- | ---: | --- |
| `sk-checkbox-choice-group-default-dark-chromium-linux.png` | `186 x 578` | `349e884f5be8697466529a6873f34bdde800be32ca94ded73f1f209c90f269c8` |
| `sk-checkbox-choice-group-light-chromium-linux.png` | `186 x 578` | `8f7d95f4f44ac5c5aa0472e3094b6a368f21ab13ed43a457f0d5d1529befe9a4` |
| `sk-checkbox-choice-group-k3-chromium-linux.png` | `1024 x 376` | `142fd57818282d0c07b5cc5bf08a7507ab05fd63eaa6b2e68b5d423fcf068b62` |
| `sk-checkbox-choice-group-narrow-chromium-linux.png` | `186 x 578` | `349e884f5be8697466529a6873f34bdde800be32ca94ded73f1f209c90f269c8` |
| `sk-checkbox-choice-group-long-content-chromium-linux.png` | `358 x 376` | `627c35c99a9857f97a01cf954164d42475e48441386d1f4b680c20c3ccbd9eaf` |
| `sk-checkbox-choice-group-disabled-chromium-linux.png` | `280 x 266` | `1f6c7dc2ce6acfc02f1f7b4308d19cbf6c2d1c2738f6aa0dba3dc31bdb2e426d` |
| `sk-checkbox-choice-group-focus-chromium-linux.png` | `186 x 578` | `94d7ff6a60b93f4755013085a05ec0153da391c03626a0ba96d01da9133cc950` |
| `sk-checkbox-choice-group-forced-colors-chromium-linux.png` | `280 x 266` | `6f42580d632bbee78b4da7434f9240bdc179f5e335959c120200d8c8e4508d92` |

The Fedora-only `196`/`320`/`412`-pixel intrinsic results are local font-metric drift: adopting
them would make the pinned Noble replay red and contradict the repository's Linux-baseline rule.
No CSS changed during this review fix, so the genuine 100%/200% zoom evidence below remains tied
to the same implementation tree.

## Capture hashes

| Story | 100% SHA-256 | 200% SHA-256 |
| --- | --- | --- |
| `default` | `2b4e920d4839074e27a6d98aa1400852a349e8ec87c1ea838720683a111c1da4` | `ccc3c20e0be653e23555de476a552684018eb36338f34a42b684f2e92a8f323d` |
| `k-3-detailed-lane-filters` | `2ecdd5f5f478c06d7f54b2a5af71b4d404291a0563f4b551f15d68df9ea361a2` | `1b722868d8d3150b7ed323c412dae4b6e2cc9dcf3d5203f821af4c6c8d0bc3b8` |
| `none-selected` | `4bb1d4c1a33707605e44ce09fdc3aabc50cc9b3584690667b207028843b123a4` | `5ab42f730a5b1feffe1857ffc426ef4e14044630e8faa2f4245872f33ce4ff10` |
| `several-selected` | `c2bcff7b695a84f229860b0c0b4f9c30bbe29489ffc442458ba35d12774a30d7` | `f3e1f78a92f80e5af2f38c108fcfae78deacdef236f0d87c801b2d7108cef3fe` |
| `zero-counts` | `6cdd2c4346b58c02f3e7999bf19f0419b554b5c31d71ba3d77de9be4b199c1dc` | `0dffead5f402a1e9901c1fff63b4d489684826f2133d0ab0b916dd5a4b72671a` |
| `disabled-choices` | `5271d51c2615d533bfcde06d5dc23deb499fa926962be60dbeb9f9dda93235fd` | `eda436c426f3a70f46359be844f21aadf66410bfcb246b878a0a40d42c978e70` |
| `long-content` | `348ce8afcb6b2e948d42d7799c39b3bffaac3cea30557aedc7f3514c0fed7515` | `04fa090f35759e3505d62bab4529cbf7e4551df13c351f3ffeb37c7b89e8c267` |
| `narrow` | `7cd6509c99d08991efa27024e8c7b3364427d9d450741149f413248694e49f1a` | `9d898d42d3b235e8c3bf505c8bd7adbad5f23535ad4089dd55c140cbea674e8c` |
| `focus-states` | `04ae587b2fff9efa407351e91fa06ffcb7590cb098d991320a189a4a87c7bd2c` | `2e611c11514f97b96562a4001e117f74d5201bcc842334e5aeb8547517baa4e0` |
| `forced-colors` | `80876ffcff6bc542b05d8d6415d7ff1a4c37e3a08491ce09f16560190b6a8999` | `8e1a8588592bfdfa9cd0a3ce64fc60dd1f865e5f753bc18cde6848116c4567e5` |
| `default-dark` | `93d19f9fd6d19c26bf2a61ba94e3c80140fe614094fe8eebf766dbb05ee83944` | `19e4c9a767d741c7a0e8f87a8a16a17a19706cb642d8b19381632c900a4df6ea` |
| `light-mode` | `33ef3e8dc2a1bf40aeca6e64ec90da1d5a16a36cc63f9b547cbed89cd6e7ec17` | `c82cedd6345d9d85fd36c718e6a27908a12dc13b910fd9a8757b8d3bdada19fc` |

The machine-readable `metrics.json` record has SHA-256
`1c26328c3bed48a7f17f06ca1ea0b543f1232c331809d19cdf88e4eff94b8862`.
Any later implementation change requires a fresh exact-source capture and inspection.
