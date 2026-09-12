# Target-era rebase evidence

Date: 2026-09-12

## Final train refresh after #410 and #429

- Exact target: `b38b40e74f4b1bf698697db5e127c5b52cce9bd3`
  (`origin/train/elements-first`). The pre-refresh approved head is preserved at
  `safety/382-pre-b38-refresh-b63112e5` (`b63112e536e43db5268efe98f09b3646fd270de7`).
- The 20-commit mission range was rebased linearly from its prior target
  `d3263e9488f7df85a537a927d417729eacc75f12` onto the exact target above. The validated
  post-rebase tree before this documentation-only addendum is
  `c3b0a26c55a3bc9072276b32f9810d6e712268e6`; it is 20 commits ahead and zero behind.
- `git range-diff` maps 19 commits patch-equivalently. The one changed mapping is executable
  evidence `d2e300d8` to `76bd36ff`, where the two expected shared-file conflicts were resolved:
  `visual.spec.ts` preserves all of #410's Account Front Door cases under `expect.soft` and adds
  the 18 Team Activity cases under the same rule; `expected-stories.json` preserves the 654-story
  target inventory and adds the 18 Team Activity routes for 672 unique IDs. No workflow or
  configuration file is changed by the mission range.
- The Team Activity source, focused browser spec, and all 18 PNGs are byte-identical to the
  approved safety ref. `status.json` and `status.events.jsonl` also retain identical Git blobs
  (`1662d23b` and `11a571bc`) and SHA-256 values
  (`3425659c38a428aff8ea5440a27fd7e8ecc818120014cbfcbe46d5ebfe8ca87a` and
  `c95b17436734f16db5f223010291419d521ab3b1bfb1c892e5389f4ffbc41116`). WP01 remains
  approved; historical event SHAs remain historical.

Final refresh validation on that tree:

| Gate | Result |
|---|---|
| full-range commitlint, `git diff --check`, clean-status check | pass: 20/20 commits; zero whitespace errors; clean |
| `npm run quality:all` | pass: 8 Nx lint projects, Stylelint, HTMLHint (163 files) |
| `node scripts/typecheck-all.mjs` | pass: 5/5 projects |
| `npm test -- --reporter=dot` | pass: 58 files, 808 tests |
| pattern composition selftest/live | pass: 47 probes; 17 fixtures, 368 inline rules, 25 public tags, zero private reach-through/copied CSS |
| visual-softness selftest/live | pass: 21 shapes and 52 soft visual specs |
| generated/static-form drift checks | pass: React 65/31, Vue 31, CSS 31, theme bootstrap, tokens, markup 11, static forms 4 |
| Storybook budget build | pass: 10.19 seconds under the 180-second ceiling |
| artifact size | pass: `packages/elements/SIZES.md` current |
| story ratchet and axe | pass: 672/672 declared IDs; 828/828 rendered with zero WCAG 2.1 AA violations |
| focused host Chromium | pass: 22/22 exact Team Activity contract probes |
| focused pinned Noble browser matrix | pass: 62 tests and 4 expected engine-specific skips across Chromium, Firefox, and WebKit |
| owned pinned Noble visuals | pass: replayed 18/18; all 18 inspected individually with no clipping, overflow, stale shell, or truth-region crossover; no baseline regeneration required |

This refresh did not push, comment, review, approve, merge, or alter mission lifecycle state.

## History and equivalence

- Exact target: `d3263e9488f7df85a537a927d417729eacc75f12`
  (`origin/train/elements-first`).
- Recoverable pre-compaction source: `safety/382-pre-compact-c3f049d0` at
  `c3f049d09d7558b0a0340e090269dc19614a9ca1`.
- Compact implementation: `e88db202`; executable evidence and target-era snapshots:
  `d2e300d882eb157cb73090708d0f03f5add2de99`.
- `team-activity.stories.ts` and `sk-team-activity-pattern.spec.ts` are byte-equivalent to
  the pre-compaction final tree. Shared `visual.spec.ts` was semantically ported into the
  target's soft-assertion and zoom-integrity conventions instead of replacing target work.
- The regenerated story ratchet preserves all 634 target stories and adds the 18 owned
  Team Activity stories, for 652 total. No upstream story or test was removed.
- The canonical `status.events.jsonl` and materialized `status.json` are preserved
  byte-for-byte from the safety ref (SHA-256 `2f991f2f16c3e6bcf60f55e2935cddb71ed912c1fe48749248147770b79f4c29`
  and `3b654b92f49f5961cc65b6b71a980bc3f6bbe536923935d941de2eb4099e96e3`).
  WP01 remains `for_review`; historical transition SHAs remain historical. No review or
  approval event was fabricated, and no `mission-events.jsonl` exists.

## Final target-era gates

| Gate | Result |
|---|---|
| `npm run quality:all` | pass: ESLint (8 projects), Stylelint, HTMLHint (163 files) |
| `node scripts/typecheck-all.mjs` | pass: 5/5 typechecks |
| `npm test -- --reporter=dot` | pass: 57 files, 787 tests |
| pattern composition selftest/live | pass: 47 probes; 15 fixtures, 354 inline rules, 24 public tags, zero private reach-through/copied CSS |
| visual-softness selftest/live | pass: 21 shapes and 51 soft visual specs |
| generated/static-form gates | pass: markup, 14+8 static-form probes, 4 rendered structural forms, CSS, React 65/31, Vue 31, theme bootstrap |
| static-form rendered checks | pass: Chromium 449/449 and Firefox 449/449; host WebKit unavailable on Fedora, while pinned Noble WebKit is covered below |
| release graph and package size | pass: 28 selftest probes, 4 publishable/3 buildable packages, `packages/elements/SIZES.md` current at 274885 bytes |
| Storybook budget and demo assembly | pass: build 10.01 seconds (180-second ceiling), all 42 demo references resolve |
| story ratchet and axe | pass: 652/652 story IDs; 808/808 rendered, zero WCAG 2.1 AA violations |
| focused pinned Noble browser matrix | pass: 62 tests and 4 expected engine-specific skips across Chromium, Firefox, and WebKit |
| owned pinned Noble visuals | pass: regenerated 18/18, replayed 18/18, and visually inspected 18/18 |
| gate selftest | pass: 50/50 shapes |
| offline packed load | pass: 31/31 elements, one sheet, 30 fonts, zero off-machine requests |

The pinned visual environment was
`mcr.microsoft.com/playwright:v1.62.1-noble`. The 18 inspected baseline SHA-256 values are:

```text
ec959549207633480f47e4025ec6bbd0536d3718f59eab1d1c8b9b98e85e6c93  team-activity-dm1-decision-chromium-linux.png
afa1ff58da861d42d3a693357e6e610615fba9aac0d01ee0fe2354df63c7e040  team-activity-forced-colors-chromium-linux.png
78bda0f139cadd082a514c40f6070a8d01c290a7c8e42b82036149693289b95a  team-activity-intermediate-chromium-linux.png
a3c1ac9c74171985388c1ea0d10baa678a0db66788a2b7f68eeabd0904da379e  team-activity-l1-default-chromium-linux.png
91033d89e77654aa902a6001a92beb187d3a3028a9f7e242aac5733bd9e39c31  team-activity-l2-quiet-chromium-linux.png
2193ecfc1e2e39ba2c8e8755b1c1c056d48c988739ae1f0967507b07b6b8a9d5  team-activity-l3-degraded-chromium-linux.png
1124a2aa2467f1a05c1216e14e49dda01145794f9f75b39dacba054e87a2564d  team-activity-l4-gap-chromium-linux.png
a67d583b0f9ef3f5ae85422d4b5be30ae94298c86f316af4b43be310a721720a  team-activity-l5-denial-chromium-linux.png
a966eff569d6befb8cdeddd7b9441ece243fa3f6918720402409b0bb7cd01de7  team-activity-light-mode-chromium-linux.png
a1229c6cd56389fb8e7c7f64bd344a3dd559d57efc682dcba14d3d82caccf0e6  team-activity-long-content-chromium-linux.png
5629e9a860832148346662fe56b868f166d09162b6fa76d65af9ad59777fa9b9  team-activity-narrow-chromium-linux.png
76dba42c5f67cd11e23e09c9b646b25bbfdbd39766cd6ed09c595d7d2dfe9246  team-activity-oa1-degraded-chromium-linux.png
df9329c328e36a6ed24cbe1dd2df56b9116c9f831b5de0414631c4783799597d  team-activity-oa1-loading-chromium-linux.png
fabaa1a4a216f56dcc6ed92d411b25d2c8110e5e0574af8d21cec642597a8eb9  team-activity-oa1-populated-chromium-linux.png
c6873cb163a86f1d082aea09ae3461104ab5b49f285eae6e6736a4f5d2bd14e6  team-activity-oa1-quiet-chromium-linux.png
1c30414f3197543dc3db68fa5785be575e9898497134207d6048e849c9d31e53  team-activity-reduced-motion-chromium-linux.png
3f307154e548dcf1607054ac6b76ca790031236cecdc2c2573f0d30257a845b2  team-activity-rtl-chromium-linux.png
182409b763f97fd22dbb7770aafc2b1d6b99302bf82af0553edfe9c98cae7b84  team-activity-tl1-mixed-chromium-linux.png
```

This is implementation/rebase evidence for independent final review. It is not a review
verdict, approval, merge authorization, hosted CI result, or issue closure.
