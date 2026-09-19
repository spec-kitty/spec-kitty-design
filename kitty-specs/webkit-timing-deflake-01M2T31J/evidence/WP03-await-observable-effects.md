# WP03 — await observable effects (items 10 and 12)

Recorded by the orchestrator. WP03's reviewer noted that, unlike WP04 and WP05, this package left no
committed evidence file — its run ids lived only in `status.events.jsonl` and on GitHub Actions.
Evidence a reader cannot reach from the repository is weaker than evidence they can, so it is
transcribed here. Every figure below was independently verified by WP03's reviewer against the CI
logs or the source, not taken from the implementer's report alone.

**Engine**: webkit throughout. **Retries**: 0 on every rig run (explicit `--retries=0`), except the
contention run, which deliberately used the ordinary CI settings.

## Item 10 — `sk-workflow-board.spec.ts` focused overflow scroller

| | result |
|---|---|
| T003 baseline | **8/10** |
| post-fix (35353960983) | **10/10** |
| post-revert reconfirm (35355085697) | **10/10** |

**Fix**: `waitForScrollSettled(scroller, reason, {timeoutMs: 5000, stableFrames: 3})` — polls
`scrollLeft` via `requestAnimationFrame` until three consecutive frames agree, rejecting with the
last observed value and stable-read count if it never settles. Replaces a threshold-crossing poll.
Both halves of the original claim are preserved and one is strengthened: a second
`await expect(scroller).toBeFocused()` now runs after ArrowRight, in addition to the pre-existing
one after ArrowLeft.

**Why it is not vacuous** (reviewer's trace): if the scroller never moves, the helper resolves
*fast* with the stable-but-wrong value `0` — it does not skip or short-circuit. The downstream
`expect(movedRight).toBeGreaterThan(0)` therefore still does real work, which is exactly what the
red-first proof demonstrates.

**C-003**: `playwright.config.ts` carries no `expect: { timeout }` override, so Playwright's 5000ms
default governs. The helper's bound *matches* the suite default rather than exceeding it —
confirmed by absence-of-override, not by assertion. On the success path three RAF frames (~50ms) is
cheaper than the repeated re-evaluation it replaced.

## Item 12 — `sk-action-row.spec.ts` "external controls" family (six modes)

**Verdict: NOT REPRODUCED**, four samples, and — per §8's principle — across *conditions*, not just
volume:

| sample | condition | result |
|---|---|---|
| T003 baseline | near-isolated, repeat-10, pre-fix | 60/60 |
| 35352216424 | near-isolated, **repeat-100**, pre-fix | **600/600** |
| 35353960983 | near-isolated, repeat-10, post-fix | 60/60 |
| 35352049054 | **full-suite contention**, ~2770 tests, 2 workers, `retries: 2`, pre-fix (lane-e) | clean |

The contention sample is the load-bearing one: it is the condition under which item 12 was
historically observed failing on two independent trees. Under `retries: 2` a retry-masked failure
would surface in the `flaky` bucket; item 12 appears in neither the failed nor the flaky list, so it
passed first-attempt with zero retries consumed.

**Disclosed gap**: that contention run is on lane-e and carries WP01's rig but **not** WP03's fixes,
so it is a *pre-fix* sample. Post-fix-under-contention was never directly measured. For item 12 the
pre-fix reading is arguably the stronger one — the unfixed code passed clean under the historical
condition, so the reproduction did not recur, rather than the fix having suppressed it.

**The rewrite lands on its own merits.** `expect.poll(() => new URL(page.url()).hash).toBe('#details')`
replaces an immediate post-keypress assert, matching the idiom already used at line 72 of the same
file, and closing a genuine async-navigation race. It is not credited with fixing something that was
never observed failing.

## Red-first proofs (run 35354582083, mutation `f11a33c2`, reverted in `ee093dbe`)

| item | mutation | result |
|---|---|---|
| 10 | `sk-workflow-board.css:30` `overflow-x: auto`→`hidden` | **0/3** — `Expected: > 0, Received: 0` at `sk-workflow-board.spec.ts:646` |
| 12 | `sk-action-row.stories.ts:129` href `#details`→`#not-details` | **0/3 × 6 modes** — `Expected: "#details", Received: "#not-details"` at `sk-action-row.spec.ts:151` |

Both bounded, not hung. The href was *changed* rather than removed deliberately: the test's locator
is `getByRole('link', { name: 'Details' })`, resolved by accessible name rather than `href`, so the
earlier Tab-order and focus assertions still pass and only the post-Enter hash assertion breaks —
isolating the proof to the rewritten line. Verified by the reviewer by checking out the mutation
commit and reading both lines.

**Revert verified three ways**: `git diff` byte-empty against both mutated files; neither
`overflow-x: hidden` nor `#not-details` present in them at the lane tip; post-revert run green.

## Cross-package contribution

`tmp/finding/wp03-lane-c-rig-line-number-drift.md` — the rig selects items by hardcoded `file:line`,
so a fix that inserts lines above its own target silently retargets the selector. WP03 hit it, logged
a mission-wide root-cause hypothesis naming the other at-risk files, and corrected the rig
(`6179d0c6`, one line, outside its owned surface, disclosed three times). That hypothesis is what let
the orchestrator sweep the remaining lanes in one pass; WP02 had four of five items mis-selected and
corrected them before its measurement run completed.

Contrast worth recording: WP02 later hit the same class of defect and avoided touching the shared
file at all, by keeping its target tests' declaration lines stable. Where a package can make its own
file conform, that is the better remedy and needs no disclosure.
