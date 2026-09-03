# Feature Specification: elements-first-authoring-recipe

**Mission** `elements-first-authoring-recipe` · issue #76 · part of #66
**Squad tier:** C — pre-merge only, 3 lenses
**Depends on:** #75 (M9), closed. **Must land before #77, #78, #79.**

## Why this mission exists

Nine components are about to be migrated across three batches by three agents. They will read
`docs/contributing/adding-a-component.md` and the LLM context files, and build whatever those
describe. Every inaccuracy in them is multiplied by nine.

## What the issue says, and what is actually true

The issue's Intent says the docs tell an agent to *"create `packages/html-js/src/<name>/`, then
wrap it in Angular"*. **Measured on the merged head, that is half wrong and worth correcting
before anyone works from it.**

`html-js` appears **zero** times in all nine in-scope files. #69 renamed that package to `styles`
and the documents followed. The Angular half is real, and larger than the Intent implies:

| file | lines | angular refs |
|---|---:|---:|
| `llms-full.txt` | 851 | **73** |
| `docs/design-system/using-components.md` | 300 | **18** |
| `docs/architecture/sad-lite.md` | 215 | 8 |
| `CLAUDE.md` | 108 | 6 |
| `docs/architecture/system-context-canvas.md` | 129 | 6 |
| `docs/architecture/risk-register.md` | 112 | 5 |
| `docs/contributing/adding-a-component.md` | 117 | 2 |
| `llms.txt` | 49 | 1 |
| `skills/spec-kitty-design/SKILL.md` | 61 | 0 |

Angular is **fully retired from the code**: `packages/` is `elements`, `react`, `styles`,
`tokens`; zero Angular dependencies in `package.json`; and the only Angular string in any `.ts`
is a historical comment in `visual.spec.ts` explaining why some baselines were once blank. All
119 references are stale prose, not descriptions of a live topology.

Two consequences for how this is sized. `adding-a-component.md` is in **better** shape than the
Intent implies — it was already rewritten for elements-first in #72, and its two Angular
references are a deliberate historical note that should stay. The heavy lifting is
`llms-full.txt` and `using-components.md`, the two files the Intent does not mention.

## What #75 made stale, which the issue could not have known

The recipe was accurate when written and is not now. Three specific defects, each measured:

1. **"Components live in three packages."** There are four. #126 added `packages/react`, whose
   `src/` is entirely generated and committed. This is the issue's third exit criterion, and it
   is wrong in a second way the criterion does not mention: the fourth package is *generated*,
   which changes what a contributor must do about it (nothing by hand, and never edit it).

2. **"There are no wrappers. ADR-8 confirmation #1 requires that none exist."** No longer true,
   and the reason matters. ADR-8's confirmations are a **sequenced pair**: #1 is *"one component
   ships … into three consumption paths … with no wrapper package in existence"*, and #2 is
   *"a generated React wrapper of that same component passes the conformance matrix"*. #75
   discharged #2, which necessarily creates a wrapper. The recipe carries a point-in-time
   statement as though it were permanent. **This is not an ADR violation** — verified against
   ADR-8 lines 108-109 — and the corrected text must say so, or the next reader will think one
   happened.

3. **Step 7's gate list is missing most of the gates.** It names six commands. A component that
   passes all six can still fail CI on at least eight others, several added by #126 and #129
   and several of which reject exactly what a naïve new component looks like.

## The exit criterion is now testable, and was not when written

*"A contributor following only the new recipe produces a component that passes every gate."*
Since #126 and #129 the gates are concrete and enumerable, so this stops being aspirational.
These reject a component the current recipe would produce:

- **`check-manifest-content.mjs`** — every public attribute and public method needs a
  description, and `expected-docs.json` is an **exact-equality** ratchet. Undocumented
  properties fail CI; adding a documented one without a ratchet row also fails.
- **`build-react-wrappers.mjs --check`** — the element must reach the manifest with a `tagName`,
  its prop set must match, and the emitted `createElement` key must be the attribute name Lit
  observes (`isOpen` → `open`).
- **`normalise-manifest.mjs`** — hard-fails on a `static properties` shape it cannot parse.
- **`check-elements-entries.mjs`** — the element must reach **both** distribution entries.
- **`check-adopted-css-boundaries.mjs`**, **`check-element-css-hygiene.mjs`** — ADR-9's rules.
- **`behaviours.json` + `suite-selftest.mjs`** — a new element needs behaviour subjects and
  mutations, or the floor reporter reds.
- **`check-gate-wiring.mjs`**, **`typecheck-all.mjs`** — a new project needs a `typecheck`
  target, a `scope:` tag and a lint target, or it sits outside enforcement entirely.

## Requirements

- **FR-001**: `docs/contributing/adding-a-component.md` describes the **four**-package topology,
  names `packages/react` as generated-and-committed, and says plainly that it is never hand-edited.
- **FR-002**: The "no wrappers" statement is corrected **with its reason** — ADR-8's two
  confirmations are sequenced, #2 creates the wrapper, and no ADR was violated.
- **FR-003**: Step 7 lists every gate a new component must pass, as the commands that run them.
- **FR-004**: The recipe states the three authoring facts #75 established: reactive-property and
  public-method JSDoc is **published API and enforced**; `@fires` needs a `{Type}` or the React
  handler's detail is untyped; `@slot` must be declared because the analyzer will not infer it.
- **FR-005**: The recipe states that maintainer rationale goes in `//`, never a doc comment,
  because doc comments are copied verbatim into consumer-facing documentation.
- **FR-006**: No in-scope document describes Angular as a live target. Historical notes that
  explain a past decision may remain **if** dated and marked historical.
- **FR-007**: `CLAUDE.md` §1 matches reality — four packages, one generated.
- **FR-008**: `llms.txt` and `llms-full.txt` describe the elements-first topology.

### Non-functional

- **NFR-001**: No code changes. Docs, skills and LLM context only. Gates are *described*, never
  modified — #77–#79 are the missions that exercise them.
- **NFR-002**: The recipe stays followable end-to-end. Length is not the measure; a contributor
  reaching CI without surprises is.

## Success criteria

- **SC-001**: Every gate named in FR-003 exists and runs. Asserted, not transcribed — a recipe
  naming a script that has been renamed is worse than one naming none.
- **SC-002**: Zero occurrences of Angular-as-live-target across the nine files, verified by grep,
  with any surviving reference demonstrably historical.
- **SC-003**: `adding-a-component.md`'s package table matches `packages/` exactly.
- **SC-004**: A reader following only the recipe knows to add an `expected-docs.json` row, a
  `behaviours.json` subject, and a `typecheck` target — the three things a new component needs
  that no existing document mentions.

## Out of scope

ADRs (#67 owns them). The charter (O5). Code, gates and tests. The `packages/react` README —
#80 owns publishing.

## Deferred questions

None. The mission is bounded by the file list in #76 plus the corrections above.
