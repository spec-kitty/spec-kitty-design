# Exact-base transplant evidence

The approved Team Overview WP was transplanted without merge commits from the retained local
safety ref `refs/safety/issue-383-pre-rebase-71e64435` onto the exact target
`train/elements-first@d3263e9488f7df85a537a927d417729eacc75f12`.

## Rewritten seams

- `a17e6e72`: mission contract and the complete three-cycle review trail.
- `3f946ec0`: immutable TO1/TO2 fixture and current Team Overview stories.
- `1f4339ba`: focused browser/fixture tests, regenerated story inventory, current visual cases,
  and the 19 owned Linux/Chromium baselines.
- `d9e6baa3`: corrective test-only proof that real 200% browser zoom halves the normal story
  viewport to 720x512 in a fresh DPR-2 context and crosses the public compact-shell breakpoint.

The old #150 visual cases were removed only from the Team Overview-owned block. Every target-side
visual/composition/zoom guardrail and unrelated baseline remains inherited from `d3263e94`.
`expected-stories.json` retains the target's aggregate total of 634 and replaces only the six
historical Team Overview IDs with the six current IDs.

## Exact-base validation

- Quality: ESLint, stylelint, and HTMLHint pass.
- Type safety: all five declared typecheck projects pass.
- Behaviour: 58 files and 816 Vitest tests pass; the Team Overview fixture contributes 29 tests.
- Composition: 47 probes and all 15 pattern fixtures pass.
- Storybook: clean build completes in 11.17 seconds; release graph, generated sizes, and SRI pass.
- Focused browser: 12/12 Chromium and 36/36 across Chromium, Firefox, and WebKit in the pinned
  Playwright 1.62.1 Noble image.
- Accessibility: 634 declared IDs are present; 790/790 stories render; axe reports zero WCAG 2.1
  AA violations.
- Visual: all 19 owned Team Overview cases pass in Noble Chromium and were directly inspected.
  A non-owning full-suite confidence run exposed inherited environment/baseline drift, so no
  unrelated PNG was rewritten.

## Corrective real-zoom evidence

The original focused test applied CSS `zoom: 2` at an unchanged 780px CSS viewport. That remains
useful only as supplemental uniform-magnification stress and is labelled accordingly. It does not
claim browser-zoom equivalence.

Commit `d9e6baa3` adds the real acceptance path using the convention landed by #427: start from the
normal 1440x1024 story viewport, derive the 720x512 CSS viewport for 200% zoom, and create a fresh
Playwright browser context with `deviceScaleFactor: 2`. The test observes the public app-shell
contract without traversing its shadow root: the wide personal rail becomes suppressed, the
compact header becomes exposed, document/root/control geometry stays contained, focus remains
visible, and the compact trigger retains a 44px target. A deliberate mutation that retained the
old 780px CSS width failed the exact derived-width assertion (received 780, expected 720).

Corrective-head verification passes quality, all five typecheck projects, 58 Vitest files/816
tests, the clean Storybook build, all 47 composition probes, the 15-fixture composition gate, the
50-file screenshot-softness gate, 14/14 focused Chromium tests, and 42/42 focused tests across
Chromium, Firefox, and WebKit in the Playwright 1.62.1 Noble image. The two corrective commits
change no story, component, stylesheet, visual case, or PNG; all 19 owned baseline hashes remain
byte-identical to the inspected values recorded in `visual-inspection.md` and were not regenerated.

## Lifecycle note

WP01 remains `approved` because the original independent approval is real and retained in the
canonical event trail. Spec Kitty exposes an `approved -> planned` edge only as a review-rejection
transition requiring rejection feedback. No rejection exists here, so this transplant does not
fabricate one. Because commit identities and target context changed, the rewritten exact head is
ready for a fresh independent exact-head review before publication.
