# Implementation Plan: Elements Verification Harness

**Mission**: `elements-verification-harness-01M1JGEZ` · Issue #71 · Epic #66
**Branch**: `mission/elements-verification-harness` off `train/elements-first` (`b99c293`)
**Spec**: `spec.md` — 14 FR / 4 NFR / 7 C / 22 SC, post-spec squad folded at `c2fbb5a`

## Summary

Give the repository its first test runner, express ADR-11's required behaviours against a
fixture element that owns them, and wire the result into `gate` so a behavioural
regression blocks a merge. The mission's centre of gravity is **not** the runner — it is
making the suite unfakeable, because five of this programme's six shipped defects were
gates that passed on absence.

## Technical Context

### Toolchain, verified against the registry in this checkout

| Package | Version | Note |
|---|---|---|
| `vitest` | **4.1.11** | engines `node ^20 \|\| ^22 \|\| >=24`; CI runs node 22 ✅ |
| `@vitest/browser` | 4.1.11 | peer: `vitest` |
| `@vitest/browser-playwright` | 4.1.11 | peer: `vitest@4.1.11`, `playwright@*` |
| `vite` | 7.3.6 (installed) | satisfies vitest's peer `^6 \|\| ^7 \|\| ^8` ✅ |
| `vite-tsconfig-paths` | 6.1.1 | candidate for FR-004's alias; an explicit `resolve.alias` is the simpler option |

**Vitest 4 changed the provider shape.** Browser mode is no longer `browser.provider:
'playwright'` against `@vitest/browser`; the provider is its own package,
`@vitest/browser-playwright`. Any recipe written against Vitest 2/3 is wrong here.

**`playwright` is present at 1.62.1 but only transitively**, via `@playwright/test`. Two
things already depend on that accident: `scripts/run-axe-storybook.js` does
`require('playwright')`, and the new provider peer-depends on it. This is the same
unpinned-dependency shape the #70 squad flagged for `vite`. **Pin `playwright` directly**
as part of this mission.

Also observed: `playwright-core` resolves to 1.57.0 against `playwright` 1.62.1.

### Settled by the squad — measured, do not re-investigate

The post-plan feasibility lens installed Vitest 4 and ran both lanes. These are results,
not readings.

1. **The Vitest 4 provider is a FUNCTION, not a string.** `import { playwright } from
   '@vitest/browser-playwright'` then `provider: playwright()`. Verified running against a
   real `HeadlessChrome/151`.
2. **The resolved project name carries the instance** — `browser (chromium)`, not
   `browser`. Any floor keyed on the literal `'browser'` matches nothing.
3. **Use `vitest.config.mts`.** A `.ts` config in a package without `"type": "module"`
   emits a Vite `configLoader` deprecation on *every* run.
4. **`passWithNoTests` is per-RUN.** Three projects, one with a non-matching `include`:
   `Test Files 2 passed`, **exit 0**, and the empty lane is not named, not warned, and
   absent from `vitest list --json`. FR-009 is load-bearing.
5. **`--reporter=json` cannot carry the floor.** `testResults[].name` is an absolute file
   path; there is no project key anywhere. Worse — when webkit failed to launch, the JSON
   said `success: true`, `numFailedTests: 0`, and two browser files `status: "passed"`
   with zero assertions. **The specified mechanism was itself the defect class.** A ~30-line
   custom reporter over `vitest.projects` × `testModule.project.name` works and was
   verified.
6. **`CSSStyleSheet` has no `cssText`.** It is `undefined`. The only read-back,
   `cssRules[].cssText`, is CSSOM-normalised — comments stripped, shorthands collapsed,
   `#010203` → `rgb(1, 2, 3)` — and normalised *differently per engine*, on a lane that
   runs two. SC-014 is now identity: `adoptedStyleSheets[0] === Ctor.styles[0]`, measured
   `true` against the repo's real shape.
7. **`useDefineForClassFields` unset ≡ true, and the SHIPPED BUNDLE has it too.**
   `packages/elements/project.json`'s bare `esbuild … --bundle` resolves the same
   `tsconfig.base.json`. SC-010 fails on the first attempt with Lit's class-field-shadowing
   error. A lane-local override would give a green lane over a broken artifact.
8. **The Vitest 4 config key is `retry`, not `retries`** — and it defaults to 0, so
   asserting the raw object is near-vacuous.
9. **webkit cannot launch on the operator's machine** (Fedora 44, missing Ubuntu-targeted
   libs). It works on `ubuntu-latest`. Download costs: webkit 4.8 s, chromium 11.7 s.
10. **The suite is not the cost.** 5 files across both lanes, cold: **~1.5 s**. The CI job
    is dominated by `npm ci` and `playwright install --with-deps`. But the mutation harness
    runs 16 full suites at ~1.8 s each — *that* is what the ceiling will measure.
11. **`gate`'s `if:` is `always()`** and must stay. The real gate is the shell disjunction
    inside its `[ENFORCED]` step.
12. **`fixtures/` beats `packages/elements-fixtures/`.** Storybook's story glob is
    `packages/**`, so a sibling package is free of it only by the author remembering not to
    add a `.stories.ts`. `fixtures/` is free by construction, already carries a
    `scope:fixture` precedent, is already in the eslint glob and the `components` filter,
    and is not an npm-workspace match.
13. **Corrections to this plan's own first draft:** `playwright@1.62.1` resolves
    `playwright-core@1.62.1` nested — the top-level `1.57.0` is mermaid's, so the "skew" I
    reported did not exist. And a fresh pin resolves `vite 8.2.2`, not the tree's 7.3.6.

### Still unverified, and it is the first thing IC-06 measures

**No behaviour has been run on WebKit.** The spike could not launch it locally. Given
engine-specific CSSOM and `ElementInternals` differences, expect at least one divergence.
That is exactly the risk FR-005 exists to expose.

## Charter Check

| Charter clause | This mission |
|---|---|
| Testing Standards — the ADR-11 required-behaviours list, no line-coverage minimum | FR-007 decomposes it to the fifteen sub-behaviours the charter actually enumerates; C-002 keeps coverage out |
| Quality Gates (5) — every applicable item has a test *demonstrated to fail before it passes* | FR-008's mutation harness is what makes that re-derivable rather than pasted |
| Performance Benchmarks — "Storybook CI build time under 3 minutes" | Does not cover a test suite. FR-013 asserts a ceiling; **venue escalated** (operator question 1) |
| Review Policy — the squad is a merge gate | Tier A: post-spec done, post-plan next, post-tasks, pre-merge |
| **charter.yaml vs charter.md** | They contradict each other. Escalated; this mission does not amend either |

## Project Structure

```
fixtures/elements-behaviour/         NEW — the behaviour fixture, scope:fixture
  src/sk-behaviour-fixture.ts        form association, events, parts, slots, focus
  src/*.test.ts                      browser-lane tests (IC-04 owns these)
  project.json                       tags: [scope:fixture]; lint + typecheck targets
  tsconfig.json                      MUST include *.test.ts — tsconfig.lib.json excludes them
behaviours.json                      NEW — the id registry; floor, mutations and matrix all read it
vitest.config.mts                    NEW — two projects, retry 0, explicit alias
scripts/
  floor-reporter.mjs                 NEW — custom reporter: per-lane + per-behaviour + zero-skip
  suite-selftest.mjs                 NEW — mutation harness
  measure-suite-time.mjs             NEW — ceiling assertion (separate source from the floor)
tsconfig.base.json                   useDefineForClassFields: false  (FR-015)
.github/workflows/ci-quality.yml     test job + the gate's SHELL disjunction (not its `if:`)
docs/architecture/decisions/…-11-….md  budget; and amend "no second install in CI", now false
```

`fixtures/` rather than a sibling package — see settled fact 12. Nothing in the four
`nx run-many --target=build --projects=tokens,styles,elements` call sites needs editing:
all four use an explicit project list, and the fixture needs no `build` target.

## Complexity Tracking

Three new scripts plus a reporter. Each exists because a simpler expression is fakeable,
and the first draft's instruction to merge two of them was **wrong**:

| Script | Why not simpler |
|---|---|
| `floor-reporter.mjs` | Vitest has no per-project empty check; the JSON reporter has no project attribution and calls an unlaunched lane `passed` |
| `suite-selftest.mjs` | "committed evidence" degrades to a paste; only a re-executed mutation proves red-first |
| `measure-suite-time.mjs` | a number in markdown is stale on the next merge — and it reads **wall-clock**, which is not in any reporter output, so it is *not* the same reader as the floor |

## Implementation Concern Map

Eight concerns. The first draft had nine and three of them edited files a fourth owned —
work-package overlap, which this project's doctrine forbids.

### IC-01 — Runner, config, floor, and the id registry *(FIRST; depends on nothing)*
Absorbs the old IC-02, IC-06 and IC-07, all of which edited `vitest.config.mts` or the
floor. Delivers: `vitest.config.mts` (both projects, `retry: 0`, explicit alias,
env-gated webkit instance); `behaviours.json`; `scripts/floor-reporter.mjs`;
`npm run test`; the pinned deps (`vitest`, `@vitest/browser`,
`@vitest/browser-playwright`, and **`playwright` directly** — `run-axe-storybook.js`
already `require`s it transitively); `useDefineForClassFields: false` in
`tsconfig.base.json` with a node-lane assertion on the value the *build* resolves.

**Ordering hazard, stated:** the floor makes `npm run test` red until IC-04 lands tests.
IC-01 therefore ships **one seed browser-lane test** carrying a registry id, so the floor
is satisfiable from its own commit.

### IC-02 — The fixture element *(parallel with IC-01)*
`fixtures/elements-behaviour/`, `scope:fixture`, owning form association, a documented
cancelable event, `::part()`s, slots with fallback, and focus/keyboard. Ships `lint` **and
`typecheck`** targets — the fixture's TypeScript is otherwise checked by nothing, which is
the hole `elements:typecheck` closed for `packages/elements` three missions ago. Owns
`project.json` and the element; **IC-03 owns the `*.test.ts`.** Carries the negative
assertion that no #70 gate changes behaviour because the fixture exists.

### IC-03 — The fourteen behaviours
The browser-lane tests, keyed by registry id. Covers SC-002 … SC-015. **Depends on IC-01,
IC-02.** Two criteria carry corrections: SC-014 is identity plus zero `<style>`, and
SC-013 needs the ratchet below.

### IC-04 — The `::part()` ratchet
SC-013 is vacuous today — the manifest declares **0** `cssParts`, so a "derived expected
list" is a green assertion over nothing. Ships a committed `EXPECTED_PART_COUNT`, starting
at 0, that fails when the manifest's part count exceeds it without the file being updated
in the same PR. Shrink-only, red-first demonstrable today by adding a `@csspart` JSDoc.
**Depends on IC-03.**

### IC-05 — The mutation harness
`scripts/suite-selftest.mjs`, chromium-only, `node_modules` **symlinked** not copied (it is
1.2 GB and the harness runs 16 times). Ten guards, each demonstrated live by the spike:

1. pattern not found → fail (the sixth-instance defect)
2. pattern occurs more than once → fail
3. replacement is a no-op → fail
4. the **named** test must be **present and failed** — not merely `exit != 0`
5. every *other* behaviour test must still pass (collateral bound)
6. baseline must have **executed > 0**, not merely exited 0
7. mutation ids ↔ `behaviours.json` equal **bidirectionally**
8. `mutations.length > 0`
9. no `-t` scoping — it makes guard 4 undetectable, and the full lane costs ~2 s
10. elements-owned mutations (SC-013/014/015) must **redirect the alias**, since their
    subject is `packages/elements/src`, not the copied fixture

Guard 4 is the one that will actually fire: a syntax-breaking mutation exits 1 with the
named test **absent** from the report, which an exit-code assertion reads as success.
**Depends on IC-03.**

### IC-06 — Engine coverage in CI *(first task: run the suite on WebKit)*
webkit is unverified against any behaviour. This IC's first act is to measure it on
`ubuntu-latest`, before the rest of the wiring assumes it passes. Adds the explicit
`npx playwright install --with-deps chromium webkit` step — `npm ci --ignore-scripts`
means nothing downloads browsers implicitly. **Depends on IC-01, IC-03.**

### IC-07 — CI wiring, the gate, and the budget
The four **real** edits, since `gate`'s `if:` is `always()` and must stay: add `test` to
`needs:`, add its echo line, add `[ "${{ needs.test.result }}" != "success" ]` to the
shell disjunction, and give it **no** entry in the skipped-tolerance block — FR-003 makes
the job unconditional, so `skipped` is never legitimate for it. Records the ceiling,
stating whether it covers the suite alone or suite + selftest (the selftest is 5–10× the
suite). Amends ADR-11's now-false *"no second install in CI"*. **Depends on IC-01, IC-06.**

### IC-08 — Conformance matrix *(P2 — see operator question 2)*
Machine-readable artifact with the cell enum and its three guards. Carries the Svelte
toolchain addition and the only other lockfile edit. **Not cleanly droppable as the spec
stands**: FR-010's not-applicable escape hatch *is* this matrix's cell. If it is dropped,
FR-010 must stand alone — zero skips, full stop, and a behaviour with no applicable
subject is simply not in `behaviours.json`. That wording is now in the spec, so dropping
IC-08 is coherent. **Depends on IC-03.**

### Cross-cutting

- Item 9, generation determinism, is **deferred to #75** — its subject does not exist and
  the artifacts that do already have enforced drift checks. That is why the registry holds
  fourteen, not the charter's fifteen.
- Every IC that adds a gate carries its red-first probe in the same work package.
