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

### Settled by the post-spec squad — do not re-investigate

1. **`nx affected --target=test` exits 0 with no tasks.** Measured: prints
   `NX No tasks were run`, exit code 0. The enforced job runs `npm run test`.
2. **`passWithNoTests` defaults false but is per-RUN, not per-project.** An empty lane
   beside a populated one is a green run. FR-009's floor is per-lane.
3. **`adoptedStyleSheets.length === 1` proves nothing about provenance.** Lit's own
   `static styles = css\`…\`` yields exactly that. SC-014 asserts byte equality with the
   `@spec-kitty/styles` source instead.
4. **The fixture cannot live in `packages/elements`.** Five scanners; see spec.
5. **CLAUDE.md §7 does not say what ADR-11 attributes to it.** Escalated, not acted on.

### Unresolved and deliberately not assumed

- **Vitest's `projects` aggregation of the no-test-files check.** The post-spec lens could
  not test it and neither can I without installing. IC-01 opens with a two-project spike:
  one project with tests, one with a deliberately broken glob. FR-009's mechanism is
  written *after* that spike, not before.
- **Whether esbuild-in-Vitest honours `useDefineForClassFields`.** `tsconfig.base.json`
  sets `target: ES2022` and leaves the flag unset, so TypeScript defaults it **true** —
  the documented configuration that makes class fields clobber Lit accessors and breaks
  property-before-upgrade. That makes SC-010 a genuinely repo-owned risk, but only if the
  lane exercises the same transform the artifact ships. Settled in IC-02.

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
packages/elements-fixtures/          NEW — the behaviour fixture, scope:fixture
  src/sk-behaviour-fixture.ts        owns form association, events, parts, slots, focus
  src/*.test.ts                      browser-lane tests
  project.json                       tags: [scope:fixture]; lint target
scripts/
  suite-selftest.mjs                 NEW — mutation harness (FR-008)
  suite-floor.mjs                    NEW — per-lane/per-behaviour floor + zero-skip (FR-009, FR-010)
  measure-suite-time.mjs             NEW — ceiling assertion (FR-013)
vitest.config.ts                     NEW — two projects, retries 0, explicit alias
.github/workflows/ci-quality.yml     test job + `gate` `if:` wiring (FR-014)
docs/architecture/decisions/…-11-….md  budget recorded in Consequences
```

The fixture is a **new nx project outside `packages/elements`**, which is the only
location free of all five scanners. `eslint.config.mjs` already permits `scope:fixture` to
reach `scope:elements`, and `ci-quality.yml`'s `components` filter is already
`packages/**`, so it is covered without touching either.

## Complexity Tracking

The mission adds four scripts. That is a lot, and three of them exist only because a
simpler expression is fakeable:

| Script | Why not simpler |
|---|---|
| `suite-selftest.mjs` | "committed evidence" degrades to a paste; only a re-executed mutation proves red-first |
| `suite-floor.mjs` | Vitest has no per-project empty check and no fail-on-skip |
| `measure-suite-time.mjs` | a number in markdown is stale on the next merge |

`suite-floor.mjs` and `measure-suite-time.mjs` both consume `vitest run --reporter=json`,
so they are one reader with two assertions — **build them as one script with two modes**
unless the spike shows the JSON shape makes that awkward.

## Implementation Concern Map

### IC-01 — Runner, two projects, and the floor *(sequenced FIRST)*
Covers FR-001, FR-002, FR-003, FR-009, FR-011. Opens with the projects-aggregation spike,
because FR-009's mechanism depends on its outcome. Delivers `vitest.config.ts` with both
projects, `retries: 0`, `npm run test`, and the floor script. **Depends on nothing.**

### IC-02 — Module resolution and the artifact under test
Covers FR-004, SC-022. Explicit alias so `@spec-kitty/elements` resolves from source;
suite passes with no `dist/`. Settles the `useDefineForClassFields` question and records
which transform the lane exercises. **Depends on IC-01.**

### IC-03 — The fixture element
Covers FR-006, C-006, C-007. New nx project, `scope:fixture`, owning form association,
a documented cancelable event, `::part()`s, slots with fallback, and focus/keyboard.
Includes the negative assertion that **no #70 gate changes behaviour because it exists**.
**Depends on IC-01.**

### IC-04 — The fifteen behaviours
Covers FR-007 and SC-002 … SC-015. The browser-lane tests. **Depends on IC-02, IC-03.**

### IC-05 — The mutation harness
Covers FR-008, NFR-002, SC-016. Committed mutation list, one entry per behaviour, applied
to a copy, asserting the named test goes red plus a green baseline. **Depends on IC-04**,
since it mutates those tests' subjects.

### IC-06 — Engine coverage
Covers FR-005, NFR-003. chromium and webkit. Prices the browser install into IC-08's
measurement. **Depends on IC-01.**

### IC-07 — Zero-skip discipline
Covers FR-010, SC-018. Folded into the floor script rather than a separate reporter.
**Depends on IC-01.**

### IC-08 — CI wiring, gate condition, and the budget
Covers FR-013, FR-014, NFR-001, NFR-004, SC-020, SC-021. The test job; the `gate` `if:`
edit, not just `needs:`; the measured ceiling recorded in ADR-11's Consequences.
**Depends on IC-01, IC-06.**

### IC-09 — Conformance matrix *(P2 — droppable, see operator question 2)*
Covers FR-012, SC-019. Machine-readable artifact with the cell enum and its three guards.
Carries the **Svelte toolchain addition** — `svelte` + `@sveltejs/vite-plugin-svelte`, new
dependencies requiring supply-chain review, in a repo where Svelte currently appears only
in ADR prose. **Depends on IC-04.** May be dropped without failing the mission.

### Cross-cutting

- **`playwright` gets pinned directly** (see Technical Context), in IC-01.
- **Item 9, generation determinism, is deferred to #75** with the reasoning in the spec —
  its subject does not exist, and the artifacts that do already have enforced drift checks.
- Every IC that adds a gate carries its red-first probe in the same work package. NFR-002
  is not satisfied by a commit message.
