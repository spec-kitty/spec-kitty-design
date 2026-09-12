# Exact-base transplant evidence

The approved Team Overview WP was transplanted without merge commits from the retained local
safety ref `refs/safety/issue-383-pre-rebase-71e64435` onto the exact target
`train/elements-first@d3263e9488f7df85a537a927d417729eacc75f12`.

## Rewritten seams

- `a17e6e72`: mission contract and the complete three-cycle review trail.
- `3f946ec0`: immutable TO1/TO2 fixture and current Team Overview stories.
- `1f4339ba`: focused browser/fixture tests, regenerated story inventory, current visual cases,
  and the 19 owned Linux/Chromium baselines.

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

## Lifecycle note

WP01 remains `approved` because the original independent approval is real and retained in the
canonical event trail. Spec Kitty exposes an `approved -> planned` edge only as a review-rejection
transition requiring rejection feedback. No rejection exists here, so this transplant does not
fabricate one. Because commit identities and target context changed, the rewritten exact head is
ready for a fresh independent exact-head review before publication.
