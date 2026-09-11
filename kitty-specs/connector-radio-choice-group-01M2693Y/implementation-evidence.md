# FR-018 delivery correction

`spec.md` is CLI-owned and is not hand-edited here (the same constraint lane #337 recorded). This
file corrects the record instead: FR-018 reads as fully met in `spec.md`'s Requirements table, and
it is not. This is a disclosed, deferred gap, not a hidden one — it was already stated in the PR
body and in `docs/architecture/validation/issue-336-radio-choice-group-zoom/README.md`'s "What
could not be produced" section before this file existed; this table makes the correction explicit
against the requirement text itself.

## FR-018 — Visual-regression evidence

> "As a reviewer, I want CI-compatible visual baselines for dark, `LightMode`, narrow, RTL,
> long-content, disabled, required-invalid, focus, forced-colors (including customized
> `accent-color`), and 200%-zoom states."

| Named state | Delivered? | Evidence |
|---|---|---|
| Dark (`default-dark`) | Yes | `apps/storybook/src/tests/visual.spec.ts`, committed baseline `sk-radio-choice-group-default-dark.png` |
| `LightMode` | Yes | committed baseline `sk-radio-choice-group-light.png` |
| Narrow | Yes | committed baseline `sk-radio-choice-group-narrow.png` |
| RTL | Yes | committed baseline `sk-radio-choice-group-rtl.png` |
| Long-content | Yes | committed baseline `sk-radio-choice-group-long-content.png` |
| Disabled | Yes | committed baselines `sk-radio-choice-group-disabled.png` (one disabled option) and `sk-radio-choice-group-disabled-group.png` (every option disabled) |
| Required-invalid | Yes | committed baseline `sk-radio-choice-group-required-invalid.png` |
| Focus | Yes | committed baseline `sk-radio-choice-group-focus.png` |
| Forced-colors (including customized `accent-color`) | Yes | committed baseline `sk-radio-choice-group-forced-colors.png`, plus a dedicated forced-colors Playwright pixel probe and a dedicated normal-colours one (`emulateMedia` deliberately omitted), both in `sk-radio-choice-group.spec.ts`. A pass-2 review found the first version of the forced-colors probe silently compared two differently-sized screenshot crops (an ancestor border-width difference shifted the live bounding boxes by a fraction of a device pixel) and a dimension-mismatch branch that returned a constant passing value instead of failing — making that probe permanently green regardless of the actual pixels. Fixed: screenshots are now taken via a dimension-stable clip helper, and a dimension mismatch now throws rather than passing. The normal-colours probe additionally asserts the checked control's centre pixel resolves to the live-resolved `--sk-color-yellow` token, not merely that some pixel difference exists — a pixel-count-only check was independently shown to pass (144-154px) even when the customized accent colour itself was invisible (swapped toward the card surface or `transparent`), because the checked/unchecked disc-vs-ring geometry alone produces a non-trivial pixel delta independent of colour. |
| **200%-zoom** | **No — not a committed visual baseline of any kind** | `docs/architecture/validation/issue-336-radio-choice-group-zoom/README.md` records why: this implementer's environment has `Xvfb`/`ffmpeg` but no `xdotool`/`xte`, so the native browser-chrome zoom chord (`Ctrl+Shift+=`) that #277's own zoom evidence used could not be sent, and there is no non-passwordless path to install them. A 599px-viewport layout-column proxy exists in `sk-radio-choice-group.spec.ts` ("long labels use at most two columns at a 200%-zoom-equivalent width") and is explicitly documented as a proxy, not a substitute — `visual.spec.ts` has no zoom-state screenshot at all |

## Net effect

Ten of eleven named FR-018 states have a real, committed, CI-shot visual baseline. The eleventh
(200%-zoom) is deferred, disclosed, and not silently dropped: no `visual.spec.ts` test or
`expected-stories.json` entry claims a zoom baseline exists. `spec.md`'s FR-018 row still reads
"Open"/unqualified against the full clause; this file is the correction until an operator or a
follow-up WP either produces the zoom capture (in an environment with `xdotool`/`xte`) or narrows
the clause itself through the CLI.
