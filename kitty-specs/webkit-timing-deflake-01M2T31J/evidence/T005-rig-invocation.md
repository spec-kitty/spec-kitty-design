# T005 — the rig's exact invocation, so a reviewer can re-run it

**Mission**: `webkit-timing-deflake-01M2T31J` · **Script**: `scripts/webkit-repeat-run.mjs`

## Why this file exists

Every stability figure in this mission comes from this one script. A reviewer who cannot re-run it
has to take the counts on trust, which is the thing this mission spent its whole length refusing to
do. Everything needed to reproduce a figure is below.

## The command CI actually runs

From `.github/workflows/webkit-repeat-run.yml`, the `[MEASUREMENT]` step, verbatim:

```bash
ARGS=(--json-dir=webkit-repeat-run-results "--repeat-each=${REPEAT_EACH:-10}")
if [ -n "${ITEMS:-}" ]; then ARGS+=("--items=${ITEMS}"); fi
node scripts/webkit-repeat-run.mjs "${ARGS[@]}"
```

So the default run is:

```bash
node scripts/webkit-repeat-run.mjs --json-dir=webkit-repeat-run-results --repeat-each=10
```

Prerequisites in the same job, in order — the rig assumes all three and does not check them:

```bash
npm ci --ignore-scripts
npx playwright install --with-deps webkit     # webkit ONLY; chromium is deliberately not installed
node scripts/build-storybook-with-budget.mjs  # same builder as ci-quality's storybook-build stage
```

## What the script then issues, per item

```
npx playwright test <file>:<line> [...] --repeat-each=N --project=webkit --retries=0 --reporter=list,json
```

and, for item 12 (six modes, no single line), a title grep instead of a `file:line`:

```
npx playwright test apps/storybook/src/tests/sk-action-row.spec.ts --repeat-each=N \
  -g 'keeps external controls on their own Tab and activation paths' \
  --project=webkit --retries=0 --reporter=list,json
```

`--retries=0` and `--project=webkit` are appended by the script on **every** invocation and are not
configurable. `--workers=N` is appended only when `--workers` is passed.

## Options

| flag | effect |
|---|---|
| `--repeat-each=N` | repeats per test (default 10). NFR-001 means repeats *inside one job* — ten sequential CI runs is not viable at ~20 min a run. |
| `--items=a,b,c` | restrict to those item numbers. **Refuses** on an item the rig does not define, rather than silently measuring a smaller set. |
| `--json-dir=DIR` | where per-invocation JSON reports land (default: a fresh temp dir). |
| `--workers=N` | measurement control only. Overrides `playwright.config.ts`'s `workers: 2`. A count taken at `--workers=1` does **not** describe the ordinary `playwright` job. |

## What it prints before measuring, and why you should read it

```
Retries: 0 (explicit --retries=0 CLI flag on every invocation below ...)
Engine: webkit (NFR-007 ...)
Workers: inherited from playwright.config.ts (fullyParallel: true; 2 under CI) ...
Selectors: all 11 line-items resolve to a test( declaration.
```

The `Selectors:` line is load-bearing. Playwright **silently drops** a `file:line` argument matching
no test when it is mixed with arguments that do match — no warning, exit 0 — so a stale selector
would produce a per-item table that omits rows while every remaining number still looks correct.
The guard refuses the run instead, and additionally checks **identity**: a word from each item's
label must appear in the declaration it points at, so a drift landing one item's line on a
*different* `test(` is caught too. It has refused in CI twice (runs `35373383981`, and locally a
third time), every time against drift this mission's own fixes created.

## Reproducing a specific recorded figure

| figure | command |
|---|---|
| The final 12/12 10/10 (runs `35374639239`, `35375265259`) | default invocation above |
| The 20-repeat shell-layout sample (run `35368849015`) | `--items=6,7,8,9 --repeat-each=20` |
| The worker-count comparison | `--items=6,7,8,9,10 --repeat-each=10` then the same with `--workers=1` |

## Local runs

`webkit` **cannot launch on the development workstation** — measured, with a chromium positive
control. The rig will run and fail there for that reason, which is not a script defect. CI is the
only webkit authority in this mission. `--selftest` is not offered by this script; the guards are
exercised by running it, and by the two sibling scripts' own `--selftest` suites.
