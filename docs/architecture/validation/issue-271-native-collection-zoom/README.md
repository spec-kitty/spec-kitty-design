# Issue #271 native collection browser evidence

This evidence records real headed Chrome rendering for the native `.sk-collection`
surface after independent review remediation at product commit
`08d421c81acfff108358711325d9373a7fd36a46`. The remediation hardened the permanent
no-Blocked-surface guard, proved the real heading relationship, and made the 50-item
canonical fixture an ordered list.

## Environment and method

- Fedora Linux 44, kernel `7.1.5-201.fc44.x86_64`, x86_64
- Chrome for Testing `151.0.7922.34`
- Production Storybook build served locally in a `1200 x 800 x 24` Xvfb display
- A real headed Chrome window stayed `1024 x 768` for the desktop matrix
- X11/XTEST focused Chrome and sent native `Ctrl+0`, followed by five
  `Ctrl+Shift+=` browser UI chords for the 200% matrix
- FFmpeg captured the complete physical X11 display, including browser chrome and the
  visible 200% zoom indicator
- No CSS zoom/transform, emulated viewport/device scale, CDP page-scale, or pinch
  emulation was used

At 100%, the desktop CSS viewport was `1024 x 625` with DPR `1`. At 200%, it
was `512 x 312` with DPR `2`. The browser's real minimum outer width prevented the
requested `390px` narrow window: Chrome produced a `500px` outer and inner width.
That limitation is recorded rather than concealed; the automated Chromium and Firefox
suite independently exercises the exact `390px` viewport.

The measurement harness checked native heading and list elements, page and collection
horizontal overflow, header overlap, visible keyboard focus, focus clipping, and
viewport containment. Every recorded check passed. The desktop matrix includes default,
light, Blocked-as-ordinary-consumer-content, long-text, and 50-item ordered-list
compositions. The 200% matrix covers default, long text, and the 50-item ordered list.
The narrow capture covers the dedicated narrow composition. Vertical scrolling for long
content and 50 items is expected and was not treated as an overflow defect.

## Measurement records

| Record | Requested outer width | Actual outer/CSS width | DPR | Stories | SHA-256 |
| --- | ---: | ---: | ---: | ---: | --- |
| `100-desktop-metrics.json` | 1024 | 1024/1024 | 1 | 5 | `81b1c4e76f0ca6f74c083c322a1a0b07275aab8b9dc751a983c72b922adb8378` |
| `100-narrow-metrics.json` | 390 | 500/500 | 1 | 1 | `4b447cfe51f2f65b80c71c33f1575c8a3bbff482e895b193c4c2bad8b866dcb3` |
| `200-desktop-metrics.json` | 1024 | 1024/512 | 2 | 3 | `d09e67e4048c692c423be2fac9cb9a5b3d8e080b8c3b105c68c6dd5362cbb7f5` |

## Physical-screen captures

Every PNG is a `1200 x 800` RGB capture of the complete X11 display.

| Capture | SHA-256 |
| --- | --- |
| `default-100-desktop.png` | `d021778e3d509752ed06c8cdfe0cc5769ac060dc5b2c56301aee5604d56e3b5b` |
| `light-mode-100-desktop.png` | `266d3f63cdd824863f20f1b397dc89265ec52053f084183b9037a280cf55441f` |
| `blocked-100-desktop.png` | `d3972c1ed693302b75da9f624675c03c942ab3f2a0b4628ba549ea27fc7cecf4` |
| `long-text-100-desktop.png` | `a68914cb493278d83bf13b6d83d8c34be59d593bdb96a80a54e06533cdb0922b` |
| `fifty-items-100-desktop.png` | `a5d9e2ce34fccb68d35df95dc344f97bcbdcc3cfb0616bd3f0ab46ff3388ca86` |
| `narrow-100-narrow.png` | `51f4c51fd1558c728cd6260b2a9f13913ee25ffec67fd07fb87e460015cff850` |
| `default-200-desktop.png` | `71b7380fe7090e19100d19d6dd0e53fa806659729546cf2424543107fb49e4da` |
| `long-text-200-desktop.png` | `6beffa5c2c5e795d1b65472501b20d9ab9ada821bf67eaa9e38cb8b78331d7c3` |
| `fifty-items-200-desktop.png` | `a7b694100534f887731ab6ef0b5c63c8316e6b662600263ab88421fc17ee64d2` |

Primary Codex visual inspection found no clipped heading, count, list content, control,
or focus indicator and no header collision or horizontal overflow. The final PR evidence
pins the post-evidence delivery SHA, because a Git commit cannot contain its own hash.
Any later product change requires a new exact-head applicability review.
