# Team Overview visual inspection

Inspected on 2026-09-11 after rebuilding Storybook without the Nx cache and regenerating every
Team Overview baseline from an absent file in the version-matched Playwright 1.62.1 Noble image.
The original 19 Linux/Chromium images cover dark and identical-fixture light, 1440 px,
intermediate 1123 px, 390 px, alternate 168-hour retention, long localized content, all six TO2
responses, and five focused truth/setup regions. The 390x540 short-viewport case is semantic
containment evidence in `sk-team-overview-pattern.spec.ts`, not a pixel baseline.

Re-inspected all 19 images on 2026-09-12 after transplanting the evidence onto
`train/elements-first@d3263e9488f7df85a537a927d417729eacc75f12`. The exact committed bytes passed
the version-matched Noble Chromium slice 19/19 without an unrelated full-suite acceptance.

Refreshed and compared all 19 owned images again on 2026-09-12 after rebasing onto the exact
`train/elements-first@b38b40e74f4b1bf698697db5e127c5b52cce9bd3` target. That target adds the
Account Front Door shared preview imports and global style baselines, so the inherited typography
and frame dimensions changed deterministically. Only the 19 Team Overview images were regenerated
in the version-matched Noble Chromium image. Their exact committed bytes replay 19/19 and carry the
hashes below; the old and new captures were visually compared, and no story, inventory, or unrelated
baseline was accepted as part of the refresh.

Replayed all 19 owned cases after the pre-publication route/authorization, compact-navigation, and
single-response correction at product/test commit `8793a7a9` on exact train base
`57fe4ce7a752d2fcbce19e963a7c833acf951473`. The version-matched Noble Chromium run passed 19/19,
and a fresh SHA-256 comparison reproduced every hash below exactly. The correction changes only
light-DOM relationships, mounted-response cardinality, and unsafe-route fallback behavior, so no
baseline was regenerated.

Added and inspected the two media baselines at correction commit `48580637` on 2026-09-12. The
forced-colors capture exposes high-contrast system-color Velocity cells and clear structural
boundaries; the reduced-motion capture retains the complete static default composition. The final
version-matched Noble Chromium replay passes all 21/21 owned cases. The earlier 19 hashes remain
unchanged, and the two new exact hashes are included below.

The first hosted run for published head `f9ddc9db` used the CI-authoritative Ubuntu font/raster
environment and therefore rejected all 21 locally generated Noble bytes while preserving the same
content and states. Actions run `34677426105`, artifact `10292399428` (artifact digest
`ecc97baa8f9e46b966283e0517644b683e962891b4b6da2804201e1b40cb88d6`), supplied the retry-stable
actuals. All 21 were manifest-mapped; the dark, light, mobile-long, administrator-Mission,
forced-colors, and reduced-motion representatives were directly re-inspected with no clipping,
content, authorization, route, or state regression. Only these 21 owned baselines were replaced.
The hashes below are the resulting CI-authoritative bytes pending their clean replay.

The captures show one H1, native readable facts, single-character personal-rail marks, no clipped
focus rings, no document overflow, passive activity, authorization-aware actions, and copy controls
that remain usable at narrow width. The TO2 fixture control is visibly separated and labelled as
design-review scaffolding. No obsolete #150 image remains in the inventory.

The regenerated alternate-retention capture was re-inspected after the retention derivation fix.
It shows four events across four populated weekday cells in the supplied 168-hour window, with the
other three cells quiet and the derived summary, in-flight row, and recent-activity rows unclipped.

## Baseline hashes

```text
5be75b4a2fb0907e9f049999752dddefcfe153cda1240edcf387ce4a26e56e19  team-overview-current-first-run-setup-chromium-linux.png
fc4f67d74eea92e3bb78382ddeaf0d977513ea5669d96db692887336f812d6f4  team-overview-current-forced-colors-chromium-linux.png
09c7a8a88a11294f045d93c12f427665891f04a436b558470187d7e73feeb21e  team-overview-current-recent-activity-chromium-linux.png
97f95a087269d0ea9c20fc7e8e73670a7073f040f5ef42e1909526d26f9bb674  team-overview-current-reduced-motion-chromium-linux.png
b5a64fa46c3221750b6391384c4f56a15ed8aeaa29919dcf4ac3befad1237242  team-overview-current-repositories-chromium-linux.png
8f08fd9d0caa36efeb94ffcc4d3a4cd785249df1d6aa0a547be14b7858b0f941  team-overview-current-review-scaffolding-chromium-linux.png
2dee8e8801d6564b68004c5330cbc918b7dcd344b23cfc23ac72d48ea7a7ff52  team-overview-current-to1-1123-chromium-linux.png
97f95a087269d0ea9c20fc7e8e73670a7073f040f5ef42e1909526d26f9bb674  team-overview-current-to1-1440-chromium-linux.png
eac813c0d4cf7f41ddefd11eb8f455aa4c84bfaf84b2657c7836b0bf22f8e721  team-overview-current-to1-390-chromium-linux.png
750a6d17306ae8ee5c6ac4a9544675709d0a16f58399dc81ac2133e20f637049  team-overview-current-to1-light-1440-chromium-linux.png
36486adddf23c3d180818e2a85e326af75f283ac21924acbd03f23228964b108  team-overview-current-to1-long-390-chromium-linux.png
ec5d9785b343fac3412da0644e261aae20282826ae29a368ee19682cc31fedb0  team-overview-current-to1-retention-168-chromium-linux.png
89fe7465514aa06de3032d37a6c73ab94c4e24cbf7f2200d5b09ba7a575e2e0f  team-overview-current-to2-admin-install-1440-chromium-linux.png
e088a1aa6db7184540e610678c543ac547b8b3b24c2d8c7cbc9a1f99cd01f215  team-overview-current-to2-admin-install-390-chromium-linux.png
710b41c1a41683dedee385308b7bdaafe49b9384c80746209f3fc0064b00eabd  team-overview-current-to2-admin-mission-1440-chromium-linux.png
3ef2ba797cedd5377b8f4ea458f7ea3a44d607bb0d71d7a73ec6107e82afa0a2  team-overview-current-to2-admin-mission-390-chromium-linux.png
470a472fa7cca640844b57e12f9a2c8f26f9b75340c51ce0096c2af253dacddf  team-overview-current-to2-admin-repo-1440-chromium-linux.png
8188727248579bad3b0ead9d396fc33b80bdd24cf967ca6196928779073d2017  team-overview-current-to2-joined-1440-chromium-linux.png
d9b8f2d87bea4e4676be52fb6de38ba6eb1300fa4cf45f7155f897f6862d772d  team-overview-current-to2-member-repo-1440-chromium-linux.png
42d1332e6632a57806af32b92a8ec27bd9c685a6d063e4c51d36dfab32e9174d  team-overview-current-to2-private-install-1440-chromium-linux.png
a14809110773f78fb1226e6afec9a2945ac09e6e4994cbc25d104cfb1248ced9  team-overview-current-velocity-chromium-linux.png
```
