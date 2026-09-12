# Target-era rebase evidence

Date: 2026-09-12

## CI-authoritative baseline harvest after final compaction

The current baseline bytes come from the exact GitHub Actions failure that rendered the preserved
approved source head against the final #410/#429 train:

- CI Quality run [`34666218964`](https://github.com/spec-kitty/spec-kitty-design/actions/runs/34666218964),
  visual job [`103478749864`](https://github.com/spec-kitty/spec-kitty-design/actions/runs/34666218964/job/103478749864),
  source head `e07757731ffbc88e122c0e76e38e219d98a0bba8`, base
  `b38b40e74f4b1bf698697db5e127c5b52cce9bd3`, and checked PR merge commit
  `898689dd9e2bf97893db2c2526e3d8a6acd6c18c`.
- Artifact `10289042050`, `visual-regression-diffs`, GitHub digest
  `sha256:856f375bad667bbeaaa2aaae1cb5aeccd0ac1437201984d087c3ed5768f697a6`.
  The downloaded Playwright HTML report records 364 tests: 347 expected and exactly 17
  unexpected. Its Team Activity subset contains all 18 cases, with those 17 failures and L5
  passing.
- The compact pre-harvest head was `a53ff0754e0006355ffe8ff970346de6cde79179`.
  `git diff --name-status e0775773..a53ff075` names only `acceptance-matrix.json`,
  `issue-matrix.json`, and this rebase-evidence document. A scoped comparison of `packages/`,
  `apps/`, `fixtures/`, `expected-stories.json`, `package*.json`, `nx.json`,
  `playwright.config.ts`, `scripts/`, and `.storybook/` is empty. The explicit blob IDs match at
  both heads: Team Activity story `9bf170c9e6312e0c05a049bfa92a66e3ec9b8a7d`, focused spec
  `323b3db2a3dc3f303b4b0b5ff9309fa5f8c884b6`, visual spec
  `c08eedeca58afff5f1a794ac351660c750ce0952`, story inventory
  `c623db4620d21426dca2aef6003d7c3137aad527`, and Playwright config
  `3b61eb72a74a379b6d2a0bb233726fd28f7b1e9e`. The compaction delta is therefore
  documentation-only and cannot change these renders.
- Each failed test's `Snapshot:` value and named `*-expected.png`, `*-actual.png`, and
  `*-diff.png` attachments were read from the decoded Playwright report manifest. Before any
  replacement, every expected attachment byte-matched the corresponding checked-in
  `*-chromium-linux.png`; that proves all 17 mappings without relying on archive order or loose
  filename inference. Only the paired 17 actual attachments were copied. L5 remained unchanged
  at Git blob `55279faebe05157e22b946f4fce76af668885d94` and SHA-256
  `a67d583b0f9ef3f5ae85422d4b5be30ae94298c86f316af4b43be310a721720a`.

All 17 actuals and their 17 expected/diff counterparts were inspected individually. L1-L4 retain
their distinct live/quiet/degraded/gap boundaries and stable factual region; TL1 retains four
independent repository states; OA1 populated/degraded/quiet/loading remain distinct and DM1 shows
only `Decision` / `dp-42`. Default dark, required light, 390px narrow, intermediate, long-content,
RTL, forced-colors, and reduced-motion identities are correct. Long and narrow content remains
fully wrapped with no clipping or horizontal overflow; RTL alignment is coherent; forced-colors
keeps visible borders and markers. The diffs show the systematic CI typography/metric change and
its downstream wrapping/height effects, not substituted content, lost hierarchy, or truth-region
crossover.

The current CI-authoritative SHA-256 ledger is:

```text
2550e0bf419f6a7b3e0080c387b40695761f74649d94b5d26ff67cfdd1d758bb  team-activity-dm1-decision-chromium-linux.png
fc64a24e7c93f44383d5a14478edf48c8bc85f7ef1b2bf82b121355e0c2561eb  team-activity-forced-colors-chromium-linux.png
9c46e4ada07989fa40dccfaefe2cde4a4ba3d8570ee93aa01e9e5df2c299a602  team-activity-intermediate-chromium-linux.png
66f28173b20809500ea05dd4902537baf10c488a06f787c2763a47eaefbaeffa  team-activity-l1-default-chromium-linux.png
4f7c53234167b5c5dceefe023aa00ced9502c91f8aef046509c2336221400f98  team-activity-l2-quiet-chromium-linux.png
4212003cc8417b0a3ea312f27d28bee32d4d5ca0ac04aa18e2c784a9c5fd9912  team-activity-l3-degraded-chromium-linux.png
797a630f96ed18df6a97e4cd2a549ce68c6a382a0219bebc04d6b842944c7e49  team-activity-l4-gap-chromium-linux.png
a67d583b0f9ef3f5ae85422d4b5be30ae94298c86f316af4b43be310a721720a  team-activity-l5-denial-chromium-linux.png
1d2c547b410b4d97cfb1bb8037acc0391f44402b2bbfa34e30864c5bdf03053e  team-activity-light-mode-chromium-linux.png
fb52d3df5637e39f0b24fa722997d3f72c2d0d32cc2f189fa1447e037dfbd895  team-activity-long-content-chromium-linux.png
e1d8e74f3b82b936c434592be836db48ab8efcc7326bccd46ddbc74af6a0a186  team-activity-narrow-chromium-linux.png
e16b3a02556f1e408440a00f13395fd7faedd2793a445fd42e1f6b08a0946e9f  team-activity-oa1-degraded-chromium-linux.png
a6eb97149484365fdb3988a240a88613da7c96201c0ec5a7730e047812684e7e  team-activity-oa1-loading-chromium-linux.png
fd35fde5ef501f1a18799c2cd726e0e3f3a080af548b11ede2c4eaf77db85664  team-activity-oa1-populated-chromium-linux.png
d2452d3b1fb6f75afa2832f72ca71281f354f240dbcc1555b86e649b65ce64cb  team-activity-oa1-quiet-chromium-linux.png
339327be2cd44d03b7a52213d8f5ef800e20d175ab64aa267d1cf3c0370092f6  team-activity-reduced-motion-chromium-linux.png
ab6931b0e3a066fdce1aa3c421dc5ef10de883243d5769ca7223c9586ff242dc  team-activity-rtl-chromium-linux.png
d12a3652c9d8ff40645112e0b8315b94a5baad05ae7dc2d49f9c5a48e4bf95af  team-activity-tl1-mixed-chromium-linux.png
```

This section supersedes only the older locally rendered Noble baseline bytes documented below;
their source/behavioral gate results remain historical evidence. A local Noble visual replay is
diagnostic on this host and is not used to overwrite these CI-authoritative images.

## Final approved compaction on #410/#429 train

- Exact target: `b38b40e74f4b1bf698697db5e127c5b52cce9bd3`
  (`origin/train/elements-first`). The complete pre-compaction approved line is preserved at
  `safety/382-pre-final-compact-e0775773`
  (`e07757731ffbc88e122c0e76e38e219d98a0bba8`).
- The approved tree was rebuilt without merge commits as four logical changes: mission contract
  and preserved review/lifecycle record `3ca9c43e`, story implementation `a260ef9e`, executable
  browser/visual/inventory evidence `495b018b`, and exact-target evidence `3f551486`.
- Before this SHA-only documentation reconciliation, compact commit
  `3f5514864d020e4b996afd8744afbdfe051d992e` and the preserved source head had the identical Git
  tree `008e6d4fa064bed9da2ed1300ba1d188c4777d28`; `git diff --exit-code` was empty. The shared files
  therefore retain all Account Front Door cases under the current soft visual convention and all
  672 unique story IDs, including the 18 Team Activity routes. No source, test behavior, snapshot,
  workflow, or configuration changed during compaction.
- `status.json`, `status.events.jsonl`, and every review-cycle/review-feedback artifact retain their
  exact source blobs. WP01 remains approved; canonical historical event and review SHAs remain
  historical. Only the mutable acceptance, issue, and rebase evidence references were reconciled
  to the compact implementation/evidence commits.

Final refresh validation on that tree:

| Gate | Result |
|---|---|
| full-range commitlint, `git diff --check`, clean-status check | pass: 5/5 compact commits; zero whitespace errors; clean |
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

At that historical checkpoint the pinned visual environment was
`mcr.microsoft.com/playwright:v1.62.1-noble`. Those 18 locally rendered, inspected baseline
SHA-256 values were:

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
