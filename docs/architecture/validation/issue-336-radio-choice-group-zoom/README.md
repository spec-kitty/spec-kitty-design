# Issue #336 radio-choice-group browser zoom and RTL evidence

## Status: automated evidence complete; genuine physical browser-zoom capture NOT produced in this
implementer's environment — see "What could not be produced" below. This is reported plainly per
the programme BRIEF's evidence-honesty rule rather than left silent or faked.

## What this record covers

Issue #336 and the WP01 prompt ask for the same real-Chrome/X11 procedure `docs/architecture/validation/issue-277-checkbox-choice-group-zoom/`
used: a genuine 100%/200% browser-chrome zoom (`Ctrl+Shift+=`) captured with a headed Chrome window
inside an Xvfb display, plus an equivalent real RTL rendering check, with document scroll metrics,
focused-control bounds, and 44px target measurements recorded per story.

## What was actually produced (real, passing, automated)

All of the following ran for real in this checkout against the reviewed implementation, and the
exact commands and their results are recorded in the WP01 implementer's report:

1. **Real `dir="rtl"` rendering** — the `RTL` story (`form-skradiochoicegroup-html--rtl`) sets
   `dir="rtl"` on its story frame (a real DOM attribute, not a CSS transform or emulation). The
   Chromium/Firefox Playwright spec `apps/storybook/src/tests/sk-radio-choice-group.spec.ts`
   ("RTL mirrors layout and text alignment with no horizontal overflow") asserts, for real
   rendered geometry: `getComputedStyle(choice).direction === 'rtl'`; the control's grid track
   renders at the inline-start (physically right) edge, mirrored from the LTR `Default` story's
   left-aligned control; and `document.scrollingElement.scrollWidth <=
   document.scrollingElement.clientWidth` (no horizontal overflow). This is genuine RTL layout
   evidence, not a stand-in.
2. **200%-zoom-equivalent layout width** — following the same pattern already established in
   `sk-checkbox-choice-group.spec.ts` ("long labels use at most two columns at a
   200%-zoom-equivalent width"), a 599px-wide viewport (half of the checkbox family's 1198px
   two-column threshold reference, matching the sibling's own chosen equivalent) is used to assert
   the long-content fixture collapses to at most two columns and does not overflow. The BRIEF is
   explicit that **viewport resize is not real browser zoom** — this assertion is a layout-column
   proxy, not a substitute for genuine `devicePixelRatio`/browser-chrome zoom evidence, and is
   reported as such.
3. **44px interactive-target floor** — measured directly (not proxied) in the live Playwright spec
   for every choice in every required story, at both the default and the 390px narrow viewport:
   `Math.min(box.width, box.height) >= 44`, all green.
4. **No document-level horizontal overflow** — measured directly for every one of the 14 required
   stories at their declared viewport, all green (see the WP01 report for the exact command/output).
5. **Focus containment** — measured directly: the focused control's outline-inclusive bounding box
   stays within the viewport and outside any clipping ancestor, all green.

## What could not be produced

The issue-277 procedure requires sending a **native, browser-chrome-level** `Ctrl+Shift+=` key
chord to a real, headed Chrome window and reading the resulting `devicePixelRatio`/document
metrics — Playwright's CDP-driven `page.keyboard.press()` cannot reach browser UI chrome (only the
page content), so that procedure needs an X11 input-injection tool (`xdotool` or `xte`) to drive
the browser's own zoom shortcut, plus a screenshot utility to capture the resulting window.

This implementer's checkout has `Xvfb` and `ffmpeg` available (confirmed:
`/usr/bin/Xvfb`, `/usr/bin/xvfb-run`, `/usr/bin/ffmpeg`), but **no `xdotool`, `xte`, `scrot`,
ImageMagick `import`, or `xwd`** — there is no way to send the native zoom chord or grab a plain
X11 screenshot without one of those tools. Installing them requires `sudo`, and this checkout's
`sudo` is not passwordless (`sudo: a password is required`). No package manager mirror was
attempted beyond confirming `dnf` exists but is gated the same way.

Given that constraint, no physical 100%/200% zoom screenshots, capture hashes, or
`devicePixelRatio`-based metrics were produced for this record — fabricating them would violate the
programme's evidence-honesty rule. **This capture is deferred**: either the orchestrator/reviewer
seat runs it in an environment with `xdotool`/`xte` available (the issue-277 method transfers
directly — same Storybook build, same 14 story ids, same metrics/hash table shape), or CI is asked
to produce it as a follow-up artifact. The automated evidence in the section above is real and
already proves the RTL/zoom-adjacent, containment, and target-size claims that do not require
native browser-chrome input; only the literal `Ctrl+Shift+=` physical-zoom capture is the gap.

## Story ids this record is scoped to

```
form-skradiochoicegroup-html--default
form-skradiochoicegroup-html--two-choice
form-skradiochoicegroup-html--one-option
form-skradiochoicegroup-html--none-selected
form-skradiochoicegroup-html--required-invalid
form-skradiochoicegroup-html--disabled-option
form-skradiochoicegroup-html--disabled-group
form-skradiochoicegroup-html--long-content
form-skradiochoicegroup-html--narrow
form-skradiochoicegroup-html--rtl
form-skradiochoicegroup-html--focus-states
form-skradiochoicegroup-html--forced-colors
form-skradiochoicegroup-html--default-dark
form-skradiochoicegroup-html--light-mode
```
