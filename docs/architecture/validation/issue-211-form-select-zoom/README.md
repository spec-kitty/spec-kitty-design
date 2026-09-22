# Issue #211 form-select browser zoom evidence

This evidence records actual Chromium page zoom for the native light-DOM form-select surface.
It was captured from commit `a3245ae7def93da2c2de7777cfb2be74ff1feca2` (tree
`cf61acb02fc5d067da19a56dac95a585d6aa082f`) after the fullscreen T10 correction and its
CI-authored visual baseline were folded.

## Environment and method

- Fedora Linux 44, kernel `7.1.5-201.fc44.x86_64`, x86_64
- Chrome `151.0.7922.34`, Playwright `1.62.1`, Storybook `10.6.0`
- Storybook production build served at `127.0.0.1`
- X11/XTEST sent `Ctrl+0`, then `Ctrl+Shift+=` five times through Chrome's real desktop UI
- Chrome's persisted per-host zoom level was `3.8017840169239308`, factor `2`
- No CSS zoom, viewport resize, device-scale override, CDP emulation, or pinch/page-scale
  emulation was used

The physical browser window remained `1200 x 800`. The CSS viewport changed from
`1200 x 657` at 100% to `600 x 328` at 200%; `devicePixelRatio` changed from `1` to `2`, while
`visualViewport.scale` remained `1`. Document `scrollWidth` tracked `clientWidth` at both zoom
levels, so there was no page-level horizontal overflow.

## Routes and observations

The captured Storybook ids were:

- `form-skformselect-html--default` (focused T10 lane selector)
- `form-skformselect-html--required-invalid`
- `form-skformselect-html--disabled`

At 200% the focused Default control remained a native light-DOM select with its UA indicator and
token focus outline visible. It occupied `568px` inside the `600px` CSS viewport with no clipping.
RequiredInvalid retained native `valueMissing`, its double invalid boundary, and same-root visible
described help. Disabled retained the native disabled state, dashed boundary, and omission from
`FormData`. Every automated observation passed with no console or page errors.

The six desktop screenshots retain Chrome's UI so the 100%/200% change is independently visible.
Their SHA-256 digests are:

| State | 100% | 200% |
|---|---|---|
| Default focused | `39656042c381d604da92a812c79a22aaa741ad039dc43b49b9f1fb4f211df053` | `be0db6f98dcec4b2956188dad82c217b01889cb148a411d1155caa23765a5b5c` |
| RequiredInvalid | `290929b4530f9ca7b8baaf7392c071f2e7781d51ddff197673110a97008e8e6a` | `9e929e5de285a686e33b403041212965b3ebe5c4fb27b6db9fb97f13a03db4a0` |
| Disabled | `5927a9dd998a9540c009c422445de3953349460a8541c2a0efa39942f3533263` | `e8de26433ca8917eb7bcbfa905b82b3acb2023d7b71563838483f49471fd928d` |

The pre-merge gate reruns this same procedure after the final push and records the final SHA and
measurements on PR #243; any later push invalidates that final record.
