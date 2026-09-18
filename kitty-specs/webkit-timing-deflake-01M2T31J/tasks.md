# Tasks: WebKit Timing De-flake

**Mission**: `webkit-timing-deflake-01M2T31J`
**Branch**: `mission/webkit-deflake`
**PR base**: `train/elements-first`
**Revised**: 2026-09-18 after the cross-artifact analysis returned `blocked` (7 high, 7 medium).

## Verification reality (read before planning any task)

Every test in scope is `[webkit]`-only, and **webkit cannot launch on the development workstation**.
Measured here, with a positive control:

```
webkit:   FAILED — Host system is missing dependencies to run browsers
chromium: LAUNCHED — Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 …
```

The named packages (`libgtk-4-1`, `libicu74`, …) are Debian/Ubuntu soname-pinned; this host is
Fedora. The repository's existing claim in `vitest.config.mts` is **confirmed**, not inherited.

1. **CI is the only webkit authority.** A local chromium pass is evidence about chromium and nothing else.
2. **A full `playwright` job takes 25.6 min** (the pre-mission run; NFR-004's baseline). Ten sequential CI runs per item is not viable, so NFR-001 means ten **repeats inside one job**. Do not quote a rounder figure — NFR-004's tolerance is 5%, and "~27 min" is 5.5% off, so the two numbers disagree about whether an unchanged job already passes.
3. **`playwright.config.ts:19` sets `retries: 2` under CI.** A rig inheriting that reports a failing test as `flaky` at exit 0 — a retry-wrapped green by inheritance. Every measurement in this mission runs with `retries: 0`, and a `flaky` line counts as a **failure** (NFR-002, C-001).
4. A repeat loop over a test that performs a one-way mutation to a shared fixture measures the mutation, not the flake. Check for that shape before reporting a count.
5. **Findings log (charter, C-010).** Before doing anything else in a lane worktree, symlink its `tmp/finding/` to the repository root's — the charter requires one shared location, never an isolated per-lane directory. Log every reasoning-loop failure, recovery or `spec-kitty` error there: what was attempted, the verbatim error, the workaround, a root-cause hypothesis, a proposed remediation.
6. **Do not run `git add -A` from the repository root checkout.** `.worktrees/` holds live lane worktrees; work inside your own lane directory.

## Why this is on a critical path

The train's own push run is red (`playwright` 3 failed / 2 flaky → `gate` failed), which **skips the
`promote-develop` job** (`needs: [gate]`, no `always()`). `develop` is synced only by that job opening
and merging a `promote/<40-hex>` PR, and it additionally requires `vars.PROMOTE_DEVELOP_ENABLED`.
So this mission is a **necessary but not sufficient** condition for promotion resuming: SC-007 is
scoped to what the mission controls (zero failures/flakes in its own final pre-merge run), and the
promotion itself is post-merge follow-up.

## Canonical scope

The twelve items and their owners are defined in `spec.md` under **Canonical scope**. That table is
the single source of truth; do not restate counts here.

# Work Packages

Each package's **subtasks, risks and independent test live in its own file** under `tasks/`, which is
the single source for that detail. This section carries only what the mission-level reader needs:
goal, owner surface and dependencies. Detail is deliberately not repeated here — an earlier revision
pasted it into nine places and the copies immediately disagreed with each other.

## Work Package WP01: Measurement rig, cost accounting, and the suppression scan

- **Goal**: A reproducible CI invocation runs the five affected specs under **webkit** with `--repeat-each=10` and **`retries: 0`**, reporting a per-test pass/fail count. Plus the two accounting deliverables no other package owns.
- **Priority**: P0 — blocks WP02–WP05.
- **Owns**: `scripts/**`, `.github/workflows/**`, `playwright.config.ts`.
- **Dependencies**: none.
- **Subtasks, risks, independent test**: `tasks/WP01-webkit-repeat-run-rig.md`

## Work Package WP02: sk-progress — find why the two hard failures fail, then fix that

- **Goal**: Items 1–5 pass repeatedly for a demonstrated reason, assertions no weaker than before.
- **Priority**: P0 — items 1 and 4 are the hard failures reddening the train's gate.
- **Owns**: `apps/storybook/src/tests/sk-progress.spec.ts`, `packages/styles/src/progress/**`.
- **Dependencies**: WP01.
- **Subtasks, risks, independent test**: `tasks/WP02-sk-progress-hard-failures.md`

## Work Package WP03: Await observable effects rather than intervals

- **Goal**: Items 10 and 12 await the effect they assert.
- **Priority**: P1 — item 12 lands in unrelated missions' output, costing other people a wrong first hypothesis; item 10 failed on the train.
- **Owns**: `apps/storybook/src/tests/sk-action-row.spec.ts`, `apps/storybook/src/tests/sk-workflow-board.spec.ts`.
- **Dependencies**: WP01.
- **Subtasks, risks, independent test**: `tasks/WP03-await-observable-effects.md`

## Work Package WP04: The composition must exist before anything measures it

- **Goal**: Items 6–9 are stable for a demonstrated reason, or reported unfixed with measurements.
- **Priority**: P1 — four of twelve items, spanning the pre-mission train, the PR run and the train run.
- **Owns**: `apps/storybook/src/tests/sk-team-overview-shell-layout.spec.ts`.
- **Dependencies**: WP01.
- **Subtasks, risks, independent test**: `tasks/WP04-shell-layout-premise.md`

## Work Package WP05: Settle both states before comparing them

- **Goal**: Item 11 compares two settled states.
- **Priority**: P2 — one flaky test, no evidence of wider impact.
- **Owns**: `apps/storybook/src/tests/sk-radio-choice-group.spec.ts`.
- **Dependencies**: WP01.
- **Subtasks, risks, independent test**: `tasks/WP05-radio-choice-group-settle.md`

## Work Package WP06: Make the lane stop readable, without disarming the harness

- **Goal**: The behaviour suite's job log stops truncating before the error. **This package does not promise to fix the stop.**
- **Priority**: P2 — independent of every other package.
- **Owns**: `fixtures/**`, `mutations.json`, `behaviours.json`, `suite-budget.json`.
- **Dependencies**: none.
- **Subtasks, risks, independent test**: `tasks/WP06-lane-stop-observability.md`

## Mission-wide acceptance

Reported as counts, and for suppressions from WP01's scan rather than self-report:

- rewritten assertions = N; red-first proofs = N (equal, non-zero)
- assertions deleted / skipped / `fixme` / quarantined / retry-wrapped = 0 *(from the scan)*
- tolerances widened = 0; wait durations increased = 0 *(from the scan)*
- every measurement ran with `retries: 0`, and said so
- items fixed with a demonstrated cause + items reported unfixed = 12
- final `playwright` duration within 5% of 25.6 min
- every verification claim names its engine
