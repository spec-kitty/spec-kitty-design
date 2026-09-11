# Contract: the other `ci-quality.yml` / `pr-preview.yml` / gate-wiring edits

New in this revision (post-plan squad B4/M9). `contracts/promote-develop.workflow.yml` is the new
`promote-develop` job itself; this file is the surrounding edits that make it safe and non-wasteful,
kept separate because they touch already-hardened, heavily-probed logic
(`scripts/check-gate-wiring.mjs`, `scripts/check-gate-wiring-defeats.mjs`) that deserves its own
careful read rather than a full re-paste of either file going stale against the real one.

## 1. `ci-quality.yml` trigger block

```yaml
on:
  pull_request:
    branches: [main, 'train/**', develop]     # develop added (FR-003)
  push:
    branches: [main, 'train/**', develop]     # develop added (FR-003)
  workflow_dispatch: {}                        # added for the future (research.md R18) — not
                                                # invocable until this file reaches `main`
  schedule:
    - cron: '17 2 * * *'
    - cron: '43 3 * * *'   # research.md R25 — check-develop-ruleset-parity.mjs --check, daily
```

## 2. The four heavy jobs: skip on `promote/*` heads

Add to `storybook-build`, `a11y`, `visual-regression`, `playwright`, and `lighthouse`'s existing
`if:` (each already has one — this is `&&`-ed onto it, not a replacement):

```yaml
if: >-
  needs.storybook-build.result == 'success' &&
  !startsWith(github.head_ref, 'promote/')
```

(`storybook-build` itself: `needs.changes.outputs.tokens == 'true' || needs.changes.outputs.components == 'true'`
gains the same `&& !startsWith(github.head_ref, 'promote/')` conjunct.)

`github.head_ref` is empty for `push` events (only meaningful for `pull_request`) — this guard is
therefore a no-op for the `push`-to-`develop` run that follows a merge, and only actually skips the
`pull_request`-triggered run against the promotion PR itself, which is where the redundant
~30-minute suite would otherwise run a second time over identical content (research.md R15).

## 3. The `gate` job's skip-tolerance logic: one new, precisely-scoped branch

`ci-quality.yml`'s `gate` job currently treats `storybook-build`/`a11y`/`visual-regression`/
`playwright` reporting `skipped` as a **failure** whenever `changes.outputs.tokens` or
`.components` is `true` (the `relevant` case block) — correct for a normal PR, where a skip despite
real changes is a real gap. A promotion PR's tree **will** set those outputs `true` (it is real,
already-gated content), so without an explicit, narrowly-scoped exception this job would fail every
promotion PR — exactly backwards. Add, immediately before the existing `relevant` case:

```bash
head_ref="${{ github.head_ref }}"
if [[ "$head_ref" == promote/* ]]; then
  # This ref's tree is byte-identical to an already-fully-gated train commit (research.md R15) —
  # the visual/a11y/browser suite proved nothing new on train and is deliberately skipped here.
  # lint-code/test/release-gate/security/workflow-pin-check are UNCHANGED and still strictly
  # required on this ref, as defense in depth.
  sb_ok="success"; a11y_ok="success"; vr_ok="success"; pw_ok="success"
fi
```

**This is exactly the class of edit `check-gate-wiring-defeats.mjs`'s own header comment warns is
easy to get subtly wrong** (research.md R9) — implement it as a positively-scoped exception (only
`promote/*`, only overriding the four named `_ok` variables, never touching `test`/`release-gate`'s
own strict checks below it), and add the defeat-table row named in section 5.

## 4. `pr-preview.yml`

Add the same head-ref guard to whichever job actually deploys the preview (read the file to find
its exact job/step name before writing the diff — not duplicated here to avoid drifting from the
real file):

```yaml
if: "!startsWith(github.head_ref, 'promote/')"
```

## 5. `scripts/check-gate-wiring.mjs` and its defeat table

- `REQUIRED_LINT` (the array at `scripts/check-gate-wiring.mjs:636` onward) gains two entries, one
  per new self-test invocation:
  ```js
  [/node\s+scripts\/promote-develop\.mjs\s+--selftest(\s|$)/, "the develop-promotion mechanism's own probe table", 'scripts/promote-develop.mjs --selftest'],
  [/node\s+scripts\/check-develop-ruleset-parity\.mjs\s+--selftest(\s|$)/, "the ruleset-parity checker's own probe table", 'scripts/check-develop-ruleset-parity.mjs --selftest'],
  ```
- The branch-coverage loop (the "BRANCH COVERAGE" block, `for (const ref of ['main',
  'train/elements-first'])`, confirmed live at approximately line 433) gains `'develop'`:
  ```js
  for (const ref of ['main', 'train/elements-first', 'develop']) { /* unchanged body */ }
  ```
- `scripts/check-gate-wiring-defeats.mjs` gains two new cases, following its existing
  mutate-a-parsed-copy-and-assert-the-real-checker-still-catches-it shape:
  1. A mutated `ci-quality.yml` copy with `pull_request.branches` narrowed back to
     `[main, 'train/**']` — the (updated) `check-gate-wiring.mjs` must still flag `develop` as
     uncovered.
  2. A mutated `ci-quality.yml` copy where the `gate` job's new `promote/*` tolerance branch
     (section 3) is widened to apply unconditionally (dropping the `head_ref == promote/*` guard)
     — `check-gate-wiring.mjs` must flag this as an unconditional accept of a skip that should be a
     failure. (This second case requires `check-gate-wiring.mjs` itself to gain an assertion for
     the new tolerance branch's *conditionality* — named here as required implementation work, not
     assumed to already exist.)

## 6. Verification, tied to M17

`scripts/check-gate-wiring.mjs`'s own structural parse (not a live-run comparison) is what proves
NFR-002/SC-003 (research.md R29): before/after the trigger-block edit, the job **key set** and
every job's `if:`/`needs:` are byte-identical except the one new `promote-develop` job (whose `if:`
structurally cannot fire for a `main` push) and the four heavy jobs' new conjunct (which
structurally cannot fire for anything but a `promote/*` head). This is an assertion the
implementation can and should write as a small, dedicated static check — not left as something a
reviewer verifies by eye.
