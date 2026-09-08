# Issue #270 segmented-choice browser zoom evidence

This evidence records actual Chrome page zoom for all thirteen required native
segmented-choice stories. Twelve unchanged stories were captured from commit
`2152c7544ac2435d39d82d57bf3dbfe4eee2e67a` (tree
`62ebd799389d3f54e0283d705dd4521f770bad26`) after the CI-authored visual baselines
were committed. The `narrow` story was refreshed after the wrap review fix from product
commit `b9724983c721ba8e876fb07cac724904285b3d98` (tree
`0e17137e763001fdb3739203caac70bcaeb5358f`).

## Environment and method

- Fedora Linux 44, kernel `7.1.5-201.fc44.x86_64`, x86_64
- Chrome for Testing `151.0.7922.34`, Playwright `1.62.1`, Storybook `10.6.0`
- Production Storybook builds served at `127.0.0.1` in a `1200 x 800` Xvfb screen
- X11/XTEST focused the real headed Chrome window and sent `Ctrl+0`, followed by five
  native `Ctrl+Shift+=` chords
- FFmpeg captured the complete X11 screen, including browser chrome and its visible zoom
  indicator; no page-only screenshot is represented as desktop evidence
- No CSS zoom/transform, Playwright viewport or device-scale override, CDP emulation, or
  pinch/page-scale emulation was used

For the original twelve-story capture, the physical Chrome window stayed `1200 x 800`.
Its CSS viewport changed from `1200 x 657` at 100% to `600 x 328` at 200%. For the
post-review `narrow` refresh, the real headed Chrome window stayed `1024 x 768`; its CSS
viewport changed from `1024 x 681` to `512 x 340`. In both runs,
`devicePixelRatio` changed from `1` to `2`, while `visualViewport.scale` remained `1`.

At each zoom level the harness opened each built story directly, focused the first native
enabled button by keyboard, measured the document, group, every button's content box, and
the focused outline reach, then captured the desktop. Every document and group had equal
client/scroll widths, every button had equal-or-larger client dimensions than its content,
and every applicable focus outline stayed inside the document. `AllDisabled` correctly had
no focusable button; that native exclusion is the expected result rather than a missing focus
check. Primary Codex visual inspection of both 13-image sets found no clipped label, item,
or focus indicator.

The story named `forced-colors` is included in the real-zoom matrix as required, but Chrome
was not put into a simulated colour scheme for these desktop captures. Forced-colors
behaviour is independently exercised by the dedicated Playwright and CI visual-regression
checks; this evidence isolates genuine browser zoom.

## 100% measurements and captures

Unless noted for `narrow`, rows used CSS viewport `1200 x 657`, DPR `1`, and visual
viewport scale `1`. Client/scroll values are CSS pixels.

| Story             | Capture SHA-256                                                    | Document client/scroll | Group client/scroll | Keyboard focus observation                       |
| ----------------- | ------------------------------------------------------------------ | ---------------------: | ------------------: | ------------------------------------------------ |
| `default`         | `1c780225af112b05e5f3d36f880e998f457578431b85b8feadd3bcf29c04d513` |              1200/1200 |             262/262 | Overview; 2px solid; contained                   |
| `second-selected` | `46d00b9bb1ef89a823aac206d743c4346073da7ac7c59e6d8477b2c6dc86f7e7` |              1200/1200 |             263/263 | Overview; 2px solid; contained                   |
| `third-selected`  | `485e1e122451311cba4584633f7c6bb3186a1f1201fd62b1ba9f76bfdb571842` |              1200/1200 |             261/261 | Overview; 2px solid; contained                   |
| `two-items`       | `b6c7fb969a9c43a45dcfa8c17aecc02a82855dfee35e6b810a620083b01b4ca4` |              1200/1200 |             123/123 | Grid; 2px solid; contained                       |
| `five-items`      | `a6424a2494572d06142c32a65dcc303b717204f405c1bd61f77d72b86dd01644` |              1200/1200 |             363/363 | Day; 2px solid; contained                        |
| `long-labels`     | `0d9df48ad4622c15cb91dfc9f94ca0bc6822ff0ff5b614b29d14e03899e8c7b6` |              1200/1200 |             648/648 | Summary of current results; 2px solid; contained |
| `no-selection`    | `2d663bc0ccfb9c7e8eb6c5ed680236d0c7ffffbe8f940aa0024ca6ce5236868b` |              1200/1200 |             257/257 | Overview; 2px solid; contained                   |
| `all-disabled`    | `1a72b14462e8ee92bb352290ba9706d9ad68dcc961495743f48a34771c4e1107` |              1200/1200 |             262/262 | N/A; every native button is disabled             |
| `one-disabled`    | `152e2eef173d6bcf1592a25b671b1897c4f1599df4f0b68a5e08bf00047ac7d2` |              1200/1200 |             262/262 | Overview; 2px solid; contained                   |
| `narrow`          | `7ce5941288255fec6e6c06455113428a6685a41fc790c54f26335d1d33d7d225` |              1024/1024 |               96/96 | Overview; 2px solid; contained                   |
| `forced-colors`   | `235f440de8767203c77befba217af35f7b705fb74bb95e3fdfd9fcdb40d54a4b` |              1200/1200 |             262/262 | Overview; 2px solid; contained                   |
| `default-dark`    | `657f12e6eb984a127db250140ce543968083563a6dc107749f5614dcead91bb6` |              1200/1200 |             262/262 | Overview; 2px solid; contained                   |
| `light-mode`      | `d71212db0b4b19c588e38a27b5dfec9ee972d08a1dae2d25c0b8e29fa313277c` |              1200/1200 |             262/262 | Overview; 2px solid; contained                   |

## 200% measurements and captures

Unless noted for `narrow`, rows used CSS viewport `600 x 328`, DPR `2`, and visual
viewport scale `1`. Client/scroll values are CSS pixels.

| Story             | Capture SHA-256                                                    | Document client/scroll | Group client/scroll | Keyboard focus observation                       |
| ----------------- | ------------------------------------------------------------------ | ---------------------: | ------------------: | ------------------------------------------------ |
| `default`         | `406582bd21f6401a74c1a870bb6f23c4703ce8ee394fd4cfb220b520915596d8` |                600/600 |             262/262 | Overview; 2px solid; contained                   |
| `second-selected` | `aa66c81a317ed52cf3d4db4a2b98daddf1faf7c43c8624026abcda045ce5eb96` |                600/600 |             263/263 | Overview; 2px solid; contained                   |
| `third-selected`  | `e189aa6c21b293841e0476148983492f7e90d68da1d30147bf5ce5df5ad68f3f` |                600/600 |             261/261 | Overview; 2px solid; contained                   |
| `two-items`       | `044c0ded578f273ef8ca4fb98e3033b267d51ac94c8bf6a5ad364fff02e3a461` |                600/600 |             123/123 | Grid; 2px solid; contained                       |
| `five-items`      | `58410a25e0017785d12a15386416312c6c2af2af4325e8bfc9cdcc8c05ad1718` |                600/600 |             363/363 | Day; 2px solid; contained                        |
| `long-labels`     | `4ab8a232497430dfa6175e79f09b6c171aafe308cf0a2e3480594d737bcc4123` |                600/600 |             536/536 | Summary of current results; 2px solid; contained |
| `no-selection`    | `05cef8d4072e0450f5fa95c21895a68d90eeabf411b7469e3042ee41fc9a4ae4` |                600/600 |             257/257 | Overview; 2px solid; contained                   |
| `all-disabled`    | `7d8efd680bbd4088da4069036b40804c3f63f506b6eda6676cf3bbde0896237f` |                600/600 |             262/262 | N/A; every native button is disabled             |
| `one-disabled`    | `f4707c7450a767110c26395706d591734cbb6b35c9afaf56e9f3aca62f4172d1` |                600/600 |             262/262 | Overview; 2px solid; contained                   |
| `narrow`          | `948bd700605a8c34c3e74f843c286e8558a98a7e40f6bcde54bf4ff5884e69c4` |                512/512 |               96/96 | Overview; 2px solid; contained                   |
| `forced-colors`   | `fbc694feb4f45f0e396ce9e002672e810cc53645e213c7f64d55b0c5e5cf870f` |                600/600 |             262/262 | Overview; 2px solid; contained                   |
| `default-dark`    | `0073c565e74c56708faf0c261963436e1aa789a97bac06b0e3776c36fb3a7505` |                600/600 |             262/262 | Overview; 2px solid; contained                   |
| `light-mode`      | `c2ba4abbf03d219ee02fae027b2c1bc191f24d22b797483379447b71e2570df9` |                600/600 |             262/262 | Overview; 2px solid; contained                   |

## Post-review `narrow` refresh

The refreshed story deliberately constrains the presentation frame so the three native
buttons wrap onto separate rows. At 100%, their top coordinates were `266.5`, `325.5`,
and `370.5` CSS pixels; at 200%, they were `96.25`, `155.25`, and `200.25`. At both zoom
levels, button border-boxes measured `96 x 58`, `96 x 44`, and `96 x 44` CSS pixels. The
document had no horizontal overflow, the group remained contained by its frame, no
buttons overlapped or clipped, and the first button's 2px keyboard-focus outline with a
4px offset remained visible and inside the document.

The reviewer-owned measurement record is
`narrow-metrics.json`, SHA-256
`9e5093014697a59df8db0885bb2fbda25ecfa1d05b7eed04b668dfada18a4c01`.

The tracked files are named `<story>-100-desktop.png` and
`<story>-200-desktop.png`. The PR evidence comment pins the post-evidence exact delivery
SHA, since a Git commit cannot contain its own hash. Any later code change requires a fresh
exact-head review and a recheck of this evidence's applicability.
