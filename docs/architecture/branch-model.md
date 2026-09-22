# Branch model: `main` and `develop`

Two long-lived branches carry this repository's code.

| Branch | Purpose | How it changes |
|---|---|---|
| `main` | Production and the default branch. | The operator promotes an accepted release from `develop`; ordinary work never targets `main`. |
| `develop` | Integration and release-candidate line. | Mission, contributor, and dependency-update branches are cut from `develop` and merge back through reviewed PRs. RC publishing consumes this branch. |

## Contribution flow

1. Fetch the latest `origin/develop`.
2. Create a short-lived mission or contributor branch from that exact tip.
3. Open the PR with `base: develop`.
4. Merge only after the repository's review evidence and CI gates pass.

Fixes for an active release candidate follow the same path. There is no secondary integration
branch and no direct push shortcut.

## Production promotion

`main` remains operator-owned. Moving an accepted release from `develop` to `main` is a distinct
release act; merging an ordinary mission directly to `main` is not permitted.

## `develop` ruleset

The committed policy is [`.github/rulesets/develop-ruleset.json`](../../.github/rulesets/develop-ruleset.json).
It requires pull requests, linear history, non-fast-forward protection, deletion protection, and
the configured CodeQL threshold, with no bypass actors. The live ruleset id is `23706031` and
`scripts/check-develop-ruleset-parity.mjs` checks it against the committed artifact.

## Cutover record

Until 2026-09-22, `train/elements-first` was the integration line and an automated tree-sync
mechanism copied each accepted train tip into `develop`. Promotion PR #467 established the final
identical tree (`train/elements-first@173774af` → `develop@bf0f4e0c`). The operator then selected
`develop` as the direct integration line. The promoter was disabled before the transition,
existing train-targeted PRs were retargeted, and the remote train branch was retired only after
the direct-PR configuration landed.

Historical mission records, evidence logs, and commit-qualified references to the retired train
remain unchanged because they describe the repository state that was actually reviewed.
