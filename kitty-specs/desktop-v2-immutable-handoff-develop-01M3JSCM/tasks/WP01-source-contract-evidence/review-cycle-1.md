---
affected_files: []
cycle_number: 1
mission_slug: desktop-v2-immutable-handoff-develop-01M3JSCM
reproduction_command:
reviewed_at: '2026-09-28T03:33:13Z'
reviewer_agent: user
wp_id: WP01
---

# WP01 review — changes requested

Reviewed implementation commit `ce24a13f9e99eb22a372eeb8cde58b403ff9a5b4` against the mission spec, plan, tasks, WP prompt, and repository guidance.

## Blocking findings

1. **FR-007 / T003: the per-story evidence is not persistent PR evidence.** The only report is `tmp/finding/desktop-v2-wp01-evidence.md` in the primary checkout. `.gitignore:73` ignores `tmp/`, `git ls-files` has no entry for the report, and the WP commit contains only the contract, checker, test, visual runner, and PNGs. Thus the 110 visual results, 810 per-story axe outcomes, commands, and tested SHA are unavailable from the reviewed branch or a resulting PR. Put the report at a tracked post-source location such as `docs/architecture/validation/desktop-v2-wp01-evidence.md`, or publish the equivalent as a PR evidence comment pinned to the tested head before claiming this requirement complete. Preserve the exact command, exit status, executed count, per-state mapping, per-story axe outcome, and tested full SHA. Re-run or refresh it when the reviewed source head changes. Keep run results outside `source-contract.json`.

2. **FR-003 / NFR-004 / T001–T002: the family source files have no recorded redistribution basis.** `contracts/desktop-v2/source-contract.json` lists paths, token closure, and font rights, but contains no `LICENSE`/MIT reference for the 22 families' repository code and CSS; `scripts/check-desktop-v2-contract.mjs` validates only font rights. The spec explicitly requires license evidence for every named family and distinguishes repository-MIT files from assets whose rights cannot be inferred from MIT. Add a machine-checked source-rights record that links the inventoried code/CSS/markup to the repository `LICENSE`, while retaining separate OFL evidence for Inter/Falling Sky and unresolved Swansea. Add a negative probe proving that removing the MIT basis or its evidence path fails the checker.

## Gate disposition

The checked 22-family/110-state map, generated Storybook ID resolution, 110 focused visual cases, and Swansea full-export rejection are sound in this review. The ignored report also records the required unfiltered visual command as **251 passed / 205 failed**; it is not a green visual gate. Its failures are reported as older non-Desktop baselines, so this is a mission PR gate to resolve or adjudicate with base/head evidence and rerun at the eventual PR head, not a claim that the 110 new cases failed. The local PNGs still need portability validation in CI.

## Prompt anti-pattern checklist

1. Dead code: PASS — the checker is called by its CLI and imported by the node test; the contract drives the visual runner.
2. Synthetic-fixture test: PASS — deletion probes invoke `checkDesktopV2Contract` on mutated contract copies.
3. Silent empty return: PASS — no unexplained empty failure return was introduced.
4. FR coverage: FAIL — FR-003 source-rights completeness and FR-007 persistent evidence lack effective checks/delivery, as above.
5. Frozen surface: PASS — no frozen/generated React or markup output changed.
6. Locked decision: PASS — Swansea remains blocked; the contract contains no self-SHA or gate result; no external approval PKI was introduced.
7. Shared-file ownership: N/A — no concurrent WP02 edit to these files is identified.
8. Production fragility: PASS — no new bare production `raise` was introduced.

WP01 has no dependencies. WP02 depends on WP01 approval and remains planned; do not start it against this rejected revision. No dependent lane needs a rebase yet.
