# WP01 review feedback — stale Dossier baselines

Reviewer: independent Codex architecture and debugging seats  
Reviewed SHA: `fd5b4325f4b777a902960b551e0f3f98fb6da8eb`  
Verdict: changes requested

## Blocking finding

- **High — committed Dossier visual baselines were stale.** The source correction changed the pushed label from `pushed 6 minutes ago` to `6 minutes ago`, but the existing D1-family PNGs still rendered “Pushed pushed 6 minutes ago”. The visual suite's 2% tolerance masked the small text delta. Force-regenerate all Dossier snapshots with `--update-snapshots=all`, inspect the full D1/D2/D4–D8 family, commit the refreshed images, and rerun the exact-SHA visual/focused gates before review.

All earlier findings concerning 860/861 layout seams, tracker destinations, keyboard operation/focus containment, fixture purity, truth/omission invariants, and packaging were verified closed.

No Claude, Hermes worker, or `/tk` transport was used.
