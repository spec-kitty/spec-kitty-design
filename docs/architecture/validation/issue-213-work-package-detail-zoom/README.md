# Issue #213 Work Package detail browser zoom evidence

This evidence records actual Chromium page zoom for representative Work Package detail
primitives. It was captured from implementation commit
`9e4827ee1397adc01f406de5c864993d2f9d3ce7` (tree
`e8699fc7048316a7c80845de9a1675a2214faf8d`) after the long-breadcrumb collision found by
the first capture was fixed and its rendered regression passed.

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
`visualViewport.scale` remained `1`. Document `scrollWidth` equalled `clientWidth` for every
route at both zoom levels (the timeline measured `592px` after its vertical scrollbar), so
there was no page-level horizontal overflow.

The production Storybook build resolves the token font declarations relative to its bundled CSS
as `/assets/fonts/*`, while its static-copy configuration publishes those same packaged font bytes
under `/tokens-dist/fonts`. For this capture only, the ignored build output's `/assets/fonts`
directory was populated from byte-identical `packages/tokens/dist/fonts`; this loaded the intended
packaged fonts with zero resource errors and did not mutate tracked source.

## Routes and observations

The captured Storybook ids were:

- `primitives-skbreadcrumbs-html--long-labels`
- `primitives-skprose-html--long-code`
- `primitives-skeventtimeline-html--narrow`
- `elements-skcheckbullet--mixed`

At both zoom levels, the breadcrumb retained three real links, one terminal
`aria-current="page"`, its complete first accessible label, and a visible `2px` focus outline.
Its `256px` local scroller contained the `933px` list without sibling-label collision or document
overflow. The prose retained its native heading and focused code region; the code scroller remained
local (`1930px` content inside `638px` at 100% and `566px` at 200%). The timeline retained two native
ordered-list items in authored order, with each actor and time attached to the same wrapping item.
The checklist retained three passive listitems, no checkbox role, and distinct complete `✓` /
`Complete` versus pending `○` / `Pending` presentation. Every automated observation passed with no
console or page errors.

The eight desktop screenshots retain Chrome's UI so the 100%/200% change is independently visible.
Their SHA-256 digests are:

| State | 100% | 200% |
|---|---|---|
| Breadcrumbs, long labels | `ed48fc2a7010c9a89e1bbc28a7406b4af47933e0b8a6c0221f48a336931b991d` | `6ed2d65797f85644d58947a9294646cbb0f0b83936b2454e8cc4ba80e771dc4e` |
| Prose, long code | `865959f0260dd14e9fbf1392d2ae29220a72924a5e31dba1501fad2340154eda` | `da058e27bd6222fe12338244f23473bc77bae462a6bcd518a47a81283604350e` |
| Event timeline, narrow | `330f10405f438a711fb8ea80f1c95960770a1f8d55fdf82b7dff6ea78f09aee3` | `0c9762c91be4f7e5eef743dce5295a815ba39daefc9002d447c045fbf429c046` |
| Check bullet, mixed states | `df5c488fdd138a429862e51eb5f7997c2fa02600f4248a658d403d1121ed7434` | `68f36ce9df076d4dd725161ebf1c6797f3cfad7f190c5f9aaff32db1fad28998` |

The pre-merge gate repeats this procedure after the final push and records the final SHA and
measurements on the issue #213 PR; any later push invalidates that final record.
