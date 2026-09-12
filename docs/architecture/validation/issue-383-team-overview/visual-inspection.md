# Team Overview visual inspection

Inspected on 2026-09-11 after rebuilding Storybook without the Nx cache and regenerating every
Team Overview baseline from an absent file in the version-matched Playwright 1.62.1 Noble image.
The 19 Linux/Chromium images cover dark and identical-fixture light, 1440 px, intermediate 1123 px,
390 px, short viewport, alternate 168-hour retention, long localized content, all six TO2
responses, and five focused truth/setup regions.

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

The captures show one H1, native readable facts, single-character personal-rail marks, no clipped
focus rings, no document overflow, passive activity, authorization-aware actions, and copy controls
that remain usable at narrow width. The TO2 fixture control is visibly separated and labelled as
design-review scaffolding. No obsolete #150 image remains in the inventory.

The regenerated alternate-retention capture was re-inspected after the retention derivation fix.
It shows four events across four populated weekday cells in the supplied 168-hour window, with the
other three cells quiet and the derived summary, in-flight row, and recent-activity rows unclipped.

## Baseline hashes

```text
4f3390379f07640854c7917594d7634a911b5643da007c1aaa46b2d8e14840ba  team-overview-current-first-run-setup-chromium-linux.png
f29b97c0792c644f4f792cf23ea0c3ae10a8d765eecd2c7ea7886bbea94ca2af  team-overview-current-recent-activity-chromium-linux.png
b29f6b66d68dc493ef74124ef50c082a7485f0068f7ec4072509b8eb225fd27a  team-overview-current-repositories-chromium-linux.png
8388a3d91fea75f580d9656241afb478c97a9b06027debd393738519a5d3b175  team-overview-current-review-scaffolding-chromium-linux.png
760e298eadadd71a90f65b0d8d1eaa4cd44426642027ca6395c66d8e989e0139  team-overview-current-to1-1123-chromium-linux.png
95b1aabb3e9a9de6a16fb8a3ed343bb96814fb6cdf345fe7959bf83ba3f3505e  team-overview-current-to1-1440-chromium-linux.png
05812e54dd28b40ea90367b333341aaf9dc2ad1bc387e5806577174ce374c860  team-overview-current-to1-390-chromium-linux.png
fbf403d3cac3366a2057be0d285a1d805fad76c0d5d662ae2469afb8b4602067  team-overview-current-to1-light-1440-chromium-linux.png
cc8e2f9203e0be7eecb08ba0f70a33d72167a91540d54fedcbdddb7f89e76d20  team-overview-current-to1-long-390-chromium-linux.png
218fc07b2b446bbb16a553ccf36822c2718c953b38790ba8e6062264c7a347fd  team-overview-current-to1-retention-168-chromium-linux.png
0acaa594084f4367eee850d410076674ff0980e00d3ba693f0baa4f68fb891ff  team-overview-current-to2-admin-install-1440-chromium-linux.png
1f3925e7431eb4d879e6ae2cd44403052949905e5982761ca07517a854700c40  team-overview-current-to2-admin-install-390-chromium-linux.png
f942e990191c24d44b3139ddab66ad3efb9aef416e2805313aeacc88e535fb08  team-overview-current-to2-admin-mission-1440-chromium-linux.png
ac5d08a8910567b27affeb5cda675ce9ae5757ce0ae855a782aee2b542fe0223  team-overview-current-to2-admin-mission-390-chromium-linux.png
b094466af0fa66f0a5d4e5f5031b9716d335fee7a6a1249667d0afd64aa49e19  team-overview-current-to2-admin-repo-1440-chromium-linux.png
b864fb321ad73ecf13b8b09bdd723ceeda1fe21de59b0af9215a03ff7f90f850  team-overview-current-to2-joined-1440-chromium-linux.png
1be35d1680d3aee86bc401d5d597f8045d74711dc22e903cefb2ee15094cd473  team-overview-current-to2-member-repo-1440-chromium-linux.png
76eba96a20c81c06facc5eb0049c785cd8efc797eb40eb38a3d7b0fddc54dee1  team-overview-current-to2-private-install-1440-chromium-linux.png
61350e1b717907eef4891b6b2bc9af3f5a50f8e7a61e23709f662d5de4e5c0fe  team-overview-current-velocity-chromium-linux.png
```
