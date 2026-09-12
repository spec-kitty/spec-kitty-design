# Team Overview visual inspection

Inspected on 2026-09-11 after rebuilding Storybook without the Nx cache and regenerating every
Team Overview baseline from an absent file in the version-matched Playwright 1.62.1 Noble image.
The 19 Linux/Chromium images cover dark and identical-fixture light, 1440 px, intermediate 1123 px,
390 px, short viewport, alternate 168-hour retention, long localized content, all six TO2
responses, and five focused truth/setup regions.

Re-inspected all 19 images on 2026-09-12 after transplanting the evidence onto
`train/elements-first@d3263e9488f7df85a537a927d417729eacc75f12`. The exact committed bytes pass
the version-matched Noble Chromium slice 19/19 and retain the hashes below; no baseline was
regenerated or accepted through an unrelated full-suite drift.

The captures show one H1, native readable facts, single-character personal-rail marks, no clipped
focus rings, no document overflow, passive activity, authorization-aware actions, and copy controls
that remain usable at narrow width. The TO2 fixture control is visibly separated and labelled as
design-review scaffolding. No obsolete #150 image remains in the inventory.

The regenerated alternate-retention capture was re-inspected after the retention derivation fix.
It shows four events across four populated weekday cells in the supplied 168-hour window, with the
other three cells quiet and the derived summary, in-flight row, and recent-activity rows unclipped.

## Baseline hashes

```text
0e1c88760187fe87affbf6fafe38eb15b27d9b85159e8cdb5ad60877c3b64463  team-overview-current-first-run-setup-chromium-linux.png
49ec2ca1cc3014fa83ccbd0f4182030130a270ada467248db735295b6e17179d  team-overview-current-recent-activity-chromium-linux.png
5dec5959a95f8cf1c73098a056bc88a85d3d7f3ae01c4d585db66511e0aa74be  team-overview-current-repositories-chromium-linux.png
8f08fd9d0caa36efeb94ffcc4d3a4cd785249df1d6aa0a547be14b7858b0f941  team-overview-current-review-scaffolding-chromium-linux.png
96edfda98f3af8b9d44f155b79a1bf43ada77ac0fee7258b40058eac482b2f5b  team-overview-current-to1-1123-chromium-linux.png
f3c4efa2b00eff2c316234dee4ffd22ecfde2e69f4b042df451d3185a8bfc4ae  team-overview-current-to1-1440-chromium-linux.png
eac813c0d4cf7f41ddefd11eb8f455aa4c84bfaf84b2657c7836b0bf22f8e721  team-overview-current-to1-390-chromium-linux.png
c03fe36520a29776b0dc79c81c325aa31cc5b349d455575a751b81cdcc38a5b9  team-overview-current-to1-light-1440-chromium-linux.png
36486adddf23c3d180818e2a85e326af75f283ac21924acbd03f23228964b108  team-overview-current-to1-long-390-chromium-linux.png
40df00e3dca3b7101a4886af50e35c4d644deee128ad5916d8bdec15e8902675  team-overview-current-to1-retention-168-chromium-linux.png
7023439690f2e6c48259799341b30cc5efc43b395c1e704935e842258628ba73  team-overview-current-to2-admin-install-1440-chromium-linux.png
e088a1aa6db7184540e610678c543ac547b8b3b24c2d8c7cbc9a1f99cd01f215  team-overview-current-to2-admin-install-390-chromium-linux.png
ac0d9b60f28cdb79d7b7b8c5f68dbd20925f805e0f45092c9024503a59ea01a6  team-overview-current-to2-admin-mission-1440-chromium-linux.png
3ef2ba797cedd5377b8f4ea458f7ea3a44d607bb0d71d7a73ec6107e82afa0a2  team-overview-current-to2-admin-mission-390-chromium-linux.png
470a472fa7cca640844b57e12f9a2c8f26f9b75340c51ce0096c2af253dacddf  team-overview-current-to2-admin-repo-1440-chromium-linux.png
3ef11a95c746d1ab7ac2c3d1dc2f46d42602d1a5b47d5681bc16fb1533368f4d  team-overview-current-to2-joined-1440-chromium-linux.png
d9b8f2d87bea4e4676be52fb6de38ba6eb1300fa4cf45f7155f897f6862d772d  team-overview-current-to2-member-repo-1440-chromium-linux.png
a0ad920e1b7cc299178f65c9161ed49786d78ef3af7dfaf38379453221a195e9  team-overview-current-to2-private-install-1440-chromium-linux.png
a14809110773f78fb1226e6afec9a2945ac09e6e4994cbc25d104cfb1248ced9  team-overview-current-velocity-chromium-linux.png
```
