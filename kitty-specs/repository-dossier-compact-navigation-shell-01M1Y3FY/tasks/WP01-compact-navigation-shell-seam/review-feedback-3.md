# WP01 final-review correction — cycle 3 disposition

**Rejected SHA:** `2646d4ffa581a77f70d09effbea17b7748951295`

**Disposition:** addressed in a separate review-fix commit.

## High finding

- Added a deterministic red-first `[SC-012]` behavior regression proving a true-to-false
  consumer-controlled close cannot leave focus inside newly hidden compact navigation and does not
  focus `compactTrigger`.
- Added the narrow authored-source guard in `SkAppShell.willUpdate()`: only an `open` transition
  whose previous value was `true` invokes the existing assigned-navigation focus release.
- Kept the pending accepted-Escape path unchanged, so accepted Escape still restores a connected,
  valid same-root trigger after the closed render.
- Covered rejected Escape followed by ordinary route close in the authored behavior fixture and in
  the Storybook browser regression. The consumer still owns `open`, routes, expanded state, and
  destination; the shell adds no route behavior or public API.
- Registered the source-owned mutation `SC-012 / ordinary controlled close releases focus from
  hidden compact navigation`. Removing the new transition guard must red the named behavior test
  without marked collateral.

## Low finding

- Corrected the stale 32-case evidence references. The exact pre-fix suite was 34/34; the settled
  post-fix suite is 36/36 across Chromium and Firefox.

## Verification status

- Red-first reproduction: failed as required because the focused navigation still contained
  `document.activeElement` after the closed render.
- Focused behavior: 23/23 passed after the fix.
- Rebuilt Storybook and focused Chromium/Firefox: 36/36 passed.
- Mutation guard self-check: 10/10 passed in 48.8s from a green 461-assertion baseline.
- Full mutation gate: 187/187 named reds in 564.5s with 40 mutated sources, zero fallbacks, and no
  collateral on the new arm. The exact isolated substitution also made only its named test red.
- CSS/markup/React/Vue drift, manifest, element-entry, CSS-boundary/hygiene, part, story-theme,
  gate-wiring, five-project typecheck, and full quality checks passed. The source-derived size
  ledger was regenerated and its check passes.
- The behavior-import guard and selftest pass after removing only the ignored Vitest failure
  screenshot whose `.test.ts` directory name had caused `EISDIR` during the first probe.
- Final-tree checks are recorded in the tracked evidence ledger and implementation handoff; no
  earlier review cycle is erased or rewritten.
