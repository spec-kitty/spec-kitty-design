# WP06 (lane-f) — no node_modules in the lane worktree

**Attempted**: run `npx vitest run` / `node scripts/suite-selftest.mjs` from the lane-f worktree
(`.worktrees/webkit-timing-deflake-01M2T31J-lane-f`) to measure the behaviour-suite job log
before/after an output-volume change (T050/T054) and to re-derive the mutation harness's
red-first proofs (T053).

**Verbatim error**: `node -e "console.log(require('fs').existsSync('node_modules'))"` → `false`.
`npx playwright --version` still resolved (global npx cache), but `npx vitest run` would have
failed to resolve `vitest`, `@vitest/browser-playwright`, `lit`, etc. — the lane worktree was
created without an `npm ci`.

**Workaround**: symlinked `node_modules` in the lane-f worktree to the repository root
checkout's `node_modules` (`ln -s <root>/node_modules node_modules`), which already had a full
`npm ci` install. Removed the symlink again once local verification (T050/T052/T053/T054/T055)
was complete and before committing — `node_modules` is `.gitignore`d as a directory pattern
(`node_modules/`) but that pattern does not match a symlink of the same name, so it would not
have been auto-excluded from `git add`; the fix was to remove it, not to rely on the ignore rule.

**Root-cause hypothesis**: lane worktrees created by `spec-kitty implement` do not run `npm ci`
(or a workspace-aware equivalent) as part of worktree setup, unlike the primary checkout. This is
consistent with the earlier memory note that shared node_modules across checkouts risks a stale
generated client — the risk that note describes did not apply here (no generated api-client is
involved), but the absence-of-install failure mode is a distinct, first-hit case worth recording.

**Proposed remediation**: `spec-kitty implement`'s lane-workspace bootstrap could either (a) run
`npm ci --ignore-scripts` once per lane worktree, or (b) symlink `node_modules` itself (with a
comment recording the staleness risk), so a WP whose verification needs to actually run the
suite does not have to discover and work around this by hand.
