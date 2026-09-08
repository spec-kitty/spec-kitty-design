# Preliminary independent Codex review

**Reviewer:** Codex, Reviewer Renata profile

**Reviewed commit:** `285ae6c4eb4309d70a43dd4f3cad2f6d2b887e6e`

**Reviewed tree:** `10de4d5e5e94d4de8efc803780cd4e3926353a69`

**Base:** `origin/train/elements-first` at `86058d912313360d78cdbcf66cbc4b034389a7b4`

**Preliminary verdict:** changes required; no WP verdict recorded

## F-270-01 — High — resolved before PR

The selected-rest and native active states shared the same load-bearing cue: double 2px border and
semibold weight. They were distinguishable only by color, and selected-active was structurally
identical to selected-rest. This contradicted issue #270's requirement that selected, hover, active,
focus-visible, and disabled remain distinct without relying only on color.

Resolution: add browser assertions for unselected-active versus selected-rest and selected-active
versus selected-rest. The tests first failed against the reviewed commit. Change the native active
cue to an inset border while retaining the selected double border; the focused tests then passed.
Full Chromium/Firefox component coverage passed with 42 tests and 6 intentional forced-color/source
contract skips.

## Pending merge-gate evidence

- CI-authoritative segmented-choice visual baselines, obtained only from the first expected CI
  visual failure and reviewed before commit.
- Real Chrome UI 200% zoom evidence for all 13 stories on the post-baseline head.
- Final Tier-C independent review against the exact post-baseline/post-zoom head.

No Claude worker or process participated in this review or remediation.
