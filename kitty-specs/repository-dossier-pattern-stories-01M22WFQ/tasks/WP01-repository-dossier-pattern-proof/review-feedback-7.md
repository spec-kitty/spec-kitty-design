# Delivery review finding — CI-authoritative visual baselines

Hosted CI run `34388381057` rejected commit
`f9868841198ef4b0410faf466b34c293cf0418c7` because all 18 new Repository
Dossier PNG baselines had been captured locally. The repository's visual-test
contract requires baselines to come from the `ubuntu-latest` CI runner because
runner font metrics change element screenshot dimensions.

Reproduction:

`PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium`

The `visual-regression-diffs` artifact from run `34388381057` was downloaded,
and every CI-rendered Dossier actual image was reviewed individually and as a
cross-screen family before replacing the corresponding local PNG. No story,
fixture, component, behavior, or non-Dossier baseline changed.

The refreshed baselines must pass a new hosted visual-regression run on the
exact reviewed commit before merge.

All review work used Codex; no Claude, Hermes, or `/tk` transport was used.
