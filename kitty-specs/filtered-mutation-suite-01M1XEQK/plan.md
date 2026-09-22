# Implementation Plan: filtered mutation suite

**Mission**: `filtered-mutation-suite-01M1XEQK` · **Branch**: `mission/filtered-mutation-suite`
**Base**: `train/elements-first@99a5144` · **Issue**: #225 · **Blocks**: PR #241

## Technical Context

**Language/Version**: TypeScript 5.x on Node 22 (CI: `actions/setup-node` v6.4.0, `node-version: '22'`)

**Primary Dependencies**: Vitest (browser mode, `vitest/node`'s `createVitest` +
`getRelevantTestSpecifications`), `@vitest/browser-playwright`, Playwright chromium (the mutation
harness spawns Vitest with `CI: ''`, so `vitest.config.mts` gives it chromium only; the ordinary
behaviour suite runs chromium + webkit), Lit for the elements.

**Storage**: none. `mutations.json`, `behaviours.json` and `suite-budget.json` are the committed
inputs; the harness works in a `mkdtemp` sandbox with `node_modules` symlinked.

**Testing**: `scripts/measure-suite-time.mjs` (ordinary behaviour suite, 40s ceiling),
`scripts/suite-selftest.mjs` (157 mutation arms), `scripts/suite-selftest.mjs --selftest`
(10 deliberately-bad entries, each rejected by the guard it names).

**Target Platform**: GitHub Actions `ubuntu-latest`, job `test` in `.github/workflows/ci-quality.yml`.

**Project Type**: monorepo — `packages/{tokens,styles,elements,react}`, `fixtures/*`, `tests/*`.

**Performance Goals**: mean selected test files per element arm below 15 (NFR-003); the harness
completes PR #241's 165-arm set inside the re-derived ceiling on a slow runner (SC-006).

**Constraints**: no selection logic edited (C-001); guards 1–8 unedited (C-002); `behaviours.json`
and the ADR-11 id set untouched (C-003); the ceiling is set from CI figures only (C-004).

**Scale/Scope**: 21 fixture test files rewritten, 1 additive guard, 1 budget file re-derived.

## Architecture of the change

Nothing in the harness's selection logic is edited. The filter already exists and is already
sound; it is inert because the fixture's imports make every element source reach almost every
browser test file. The change is in the fixture, plus one additive pre-loop guard.

```
BEFORE                                        AFTER
sk-button.test.ts                             sk-button.test.ts
  └─ import '@spec-kitty/elements'              └─ import '…/button/sk-button.js'
       └─ index.ts                                   (leaf-ward only)
            ├─ sk-button.ts
            ├─ sk-notice.ts   ← false edge
            ├─ sk-grid.ts     ← false edge
            └─ … 24 more      ← false edges

getRelevantTestSpecifications('sk-notice.ts')  getRelevantTestSpecifications('sk-notice.ts')
  → 30 of 36 browser files                       → sk-notice.test.ts + the fixed consumer block
```

The edges removed are false in the precise sense the harness cares about: a mutation to
`sk-notice.ts` cannot change what `sk-button.test.ts` observes, because that file never
instantiates `<sk-notice>` and never reads a `sk-notice` export. Every edge that *is* real is
kept — see WP01's rule.

## Work packages

### WP01 — honest imports in the elements-behaviour fixture (FR-001, NFR-001, C-003)

Rewrite the 21 `fixtures/elements-behaviour/src/*.test.ts` files that import
`@spec-kitty/elements`, so each imports:

1. **Registration**: the element module for every `sk-*` tag the file instantiates outside a
   comment — matched on `<sk-x`, `createElement('sk-x')`, `querySelector('sk-x')`,
   `customElements.get/whenDefined('sk-x')`. The rule is deliberately **inclusive**: a tag
   mentioned in live code is imported even where the assertion would hold without it
   (`sk-blog-card.test.ts` asserts a nested `<sk-card>` is *absent*, and still imports it), because
   over-inclusion costs a fraction of a second per arm and under-inclusion could hide collateral.
2. **Named symbols**: from the module `index.ts` re-exports them from, so `BUTTON_SIZES` comes from
   `button/sk-button.markup.js` — a markup leaf that registers nothing — rather than dragging the
   element in.
3. `STATUS_TONES` from `status-indicator/status-tones.js`, the authored leaf `index.ts` re-exports
   through the element. Importing the leaf keeps the tone-vocabulary edge without putting
   `sk-status-indicator`'s registration into `sk-card`'s and `sk-notice`'s graphs.

Each rewritten file carries the `@nx/enforce-module-boundaries` disable comment the six
already-deep-importing siblings carry, naming #225.

The rewrite is mechanical and is performed by a script so the rule is uniform, then reviewed file
by file. Only 3 files instantiate an element other than their own subject: `sk-action-row`
(`<sk-button>` in a slot), `sk-grid` (`createElement('sk-card')`), `sk-blog-card` (the absence
assertion). Every other cross-element mention in these files is in a comment.

### WP02 — guard 9: the selection must contain the subject (FR-002, C-002)

`scripts/suite-selftest.mjs`, immediately after the impact graph resolves and before the first
arm runs: for every mutation whose source did **not** fall back to the full suite, assert the
mutation's declared `subject` is in that source's selection. Exit 1 naming the mutation, the
source, the subject and the resolved selection.

Today an over-narrow selection produces guard 4's `absent` — "named test is ABSENT from the
report — red for the wrong reason" — which is the same verdict a syntax-breaking mutation
produces, so a filter defect is reported as a mutation defect. Guard 9 separates them.

Guard 9 joins guards 6, 7 and 8 in the documented self-check exemption: it exits before the loop,
and `--selftest` mode disables filtering entirely (`relatedSubjects = selftestMode ? null : …`), so
`mutations.selftest.json` cannot reach it. The exemption is written into the header comment beside
the existing three rather than left silent, and the three prose claims that say "eight numbered
guards" / "Guards 6, 7 and 8" are corrected in the same commit.

### WP03 — measure, then set the ceiling (FR-003, FR-004, NFR-003, SC-006, SC-007)

1. Resolve the graph for all 36 mutated sources before and after; record mean selected files.
2. Run the complete 157-arm harness before and after on this workstation; diff the verdict of
   every arm. Any disagreement is the finding and stops the mission.
3. Filtered-vs-full agreement on a sample spanning all three selection classes: for each sampled
   arm, run it with the graph selection and again with the full browser suite, and require the same
   verdict, the same named red, and the same collateral finding.
4. Re-derive `selftestCeilingSeconds` from CI figures only, stating arm count, test count, basis,
   and the fraction of the measured 1.56–1.65× runner spread it absorbs.
5. Append the before/after rows and the cost model to `suite-budget.json`'s `$comment` and
   `selftestMeasurements`.

## Risks

| Risk | Mitigation |
|---|---|
| A test silently proves less because an element it rendered is no longer registered | The tag rule is inclusive and derived from live code, not comments; the harness's own baseline guard requires all 118 registry pairs present and every assertion passing; NFR-001 compares the assertion multiset per file and per name; NFR-002 compares all 157 verdicts. |
| Narrowing hides collateral the full suite would have caught | SC-004's filtered-vs-full sample, and the fact that removed edges are precisely those a mutation cannot traverse. |
| The 1.6× runner spread makes any ceiling a coin flip | The ceiling is set from the SLOW runner's measured figure, not the fast one, and the absorbed multiple is stated. |
| `train/elements-first` moves under the mission | Re-fetch and rebase before finishing; regenerate any derived artefact with `--skip-nx-cache` rather than hand-merging. |

## Out of scope, filed rather than taken

- Narrowing `packages/react/src/Sk*.js`'s `import("@spec-kitty/elements")` to per-element subpaths.
  This is what keeps six `fixtures/react-consumer` files plus `vue-interop.test.ts` and
  `registered-elements.test.ts` in every element arm — the fixed block that now dominates the
  per-arm cost. It needs a published subpath export and a change to `build-react-wrappers.mjs`.
- #238's browser-lane instability. Measured as *not* a contributor to the mutation harness's
  wall-clock spread, but reproduced twice on chromium inside the harness on this workstation.
