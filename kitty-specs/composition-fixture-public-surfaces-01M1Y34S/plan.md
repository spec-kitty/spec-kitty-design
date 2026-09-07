# Implementation Plan: Composition fixture, and a gate that can red on both its claims

**Mission**: `composition-fixture-public-surfaces-01M1Y34S` · **Issue**: #259 · **Epic**: #183
**Base**: `train/elements-first@753bbf2` · **Branch**: `mission/composition-fixture-public-surfaces`

## Architecture

Four artefacts, one authored composition, three independent kinds of evidence over it.

```
packages/elements/src/patterns/operational-status.ts          the composition (authored)
   ├─ operational-status.stories.ts                           visual · autodocs · axe · LightMode · narrow
   ├─ fixtures/elements-behaviour/src/                        slot assignment · list semantics ·
   │    pattern-operational-status.test.ts                    native disclosure · published gap literal
   └─ scripts/check-pattern-composition.mjs                   no reach-through · no undeclared part ·
        (2 [ENFORCED] steps in lint-code)                     no duplicated component CSS
```

The composition is a MODULE rather than only a story so all three consumers read one artefact.
`team-overview.stories.ts` — the precedent — carries six ratcheted story ids and no behaviour
test; a story id proves a story exists at a stable name and cannot notice that the slot stopped
assigning.

## The gate's rules, and why each is decidable

| rule | subject | decision procedure |
|---|---|---|
| R1 reach-through | fixture source, comments stripped by esbuild | `.shadowRoot`, `shadowRoot?.`, `attachShadow(`, `::shadow`, `/deep/`; `>>>` in extracted CSS only, because in JS it is the unsigned right shift |
| R2 public parts | every `::part()` in extracted CSS | resolve the element from the type selector, else from the class the fixture's own markup binds to exactly one `sk-` tag; check against `expected-parts.json` |
| R3 duplicated CSS | every selector in extracted CSS | reject any class a `packages/styles/src/**/sk-*.css` sheet declares rules for |
| R4 floors | the whole pass | zero fixtures, zero owned classes, zero recorded parts, a `<style>` parsing to zero rules, or fewer than 3 composed `sk-` tags |

R3 is the operational definition of "duplicated component CSS": the library owns the appearance
of `.sk-card`, `.sk-facts__term`, `.sk-disclosure__summary`, so a fixture writing rules for them
has copied or is overriding them. USING such a class in markup is composition and stays legal —
the rule is about writing CSS *for* it.

R2's class fallback exists because a first cut without it red `team-overview.stories.ts`'s three
correct `.sk-pattern-overview__context-navigation::part(...)` rules, where the class sits on
`<sk-nav-pill>` and all three parts are recorded. A checker that reds correct code gets deleted.

## Scope boundary

`fixtures/elements-behaviour/` and `tests/browser/` are OUT of the gate's scope and must stay so.
Those suites read `element.shadowRoot` deliberately — that is how a test verifies a public surface
produced the right private structure, and 30 existing files do it. The criterion is about the
composition fixture, and so is the gate.

## Risks

| risk | mitigation |
|---|---|
| the gate passes vacuously over a directory it does not reach — the exact defect #259 measured in `check-adopted-css-boundaries.mjs` | `--selftest` carries an end-to-end arm that plants violations into a COPY of the real patterns directory and requires each to go red, plus a refusal when a plant changes nothing |
| a probe table that only ever expects red | 9 of the 26 probes are ACCEPT arms, including "a library-owned class used in markup" and "`>>>` as an unsigned right shift" |
| the gate becomes deletable | two `REQUIRED_LINT` entries; deleting either CI step reds `check-gate-wiring.mjs` |
| the fixture inflates the published package or the public manifest | manifest excluded via the analyzer config (measured: 63 lines, one of them the whole stylesheet); the `dist` growth is recorded in `SIZES.md` rather than hidden |
| budget | no ceiling raised; the harness is re-measured and the figure recorded |

## Vocabulary

#183 criterion 4 forbids consumer-specific role, failure, queue, signal, authentication and
refresh vocabulary in public contracts, and puts consumer adoption out of scope. The fixture
therefore demonstrates the SHAPES in generic operational terms and names no consumer domain: it
is evidence about the library's surfaces, and naming a consumer would make it evidence about
that consumer instead.
