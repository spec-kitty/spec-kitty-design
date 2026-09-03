# Implementation Plan: sk-form-field Form Association

**Branch**: `mission/sk-form-field-form-association` | **Date**: 2026-09-03 | **Spec**: [spec.md](./spec.md)
**Issue**: #74 · part of epic #66 · **Squad tier**: A — post-spec ✅, post-plan, post-tasks, pre-merge

## Summary

Two form-associated custom elements — `sk-form-input` and `sk-form-textarea` — built to ADR-9
§4's arrangement B, with `static formAssociated = true` and `ElementInternals`. Getting there
requires two enabling changes the post-spec squad measured as hard blockers, and both are
prerequisites rather than side-effects: the CSS pipeline cannot serve two elements from one
styles directory, and the boundary gate owns nothing named `.sk-input`.

Everything the published `@spec-kitty/styles@1.0.0` surface exposes stays byte-identical.

### What the post-spec squad changed about this plan before it was written

| Was going to be | Is | Why |
|---|---|---|
| Three elements incl. a `sk-form-field` wrapper | Two | A wrapper's label, description and error region all cross a root boundary — ADR-9 §4 measured that failing as arrangements C and D |
| Rename `.sk-input` → `.sk-form-input*` in place | New sheets in new directories; old ones untouched | `@spec-kitty/styles` is published at 1.0.0; a rename is semver-major on a live package |
| Delete eight exports | Keep all eight | Same reason. Deferred, with the duplication recorded |
| Four mutations | Eight | Guard 7 pairs `(behaviour, subject file)`; two elements × four ids |
| Firefox parity claimed | Out of scope, reason recorded | No lane runs form association on Firefox at all |

## Technical Context

**Language/Version**: TypeScript 5.x, Node 22, Lit 3.3.3
**Primary Dependencies**: `lit`, `@spec-kitty/styles` (CSS source of record), `@spec-kitty/tokens`
**Testing**: Vitest 4.1.11 browser lane (chromium; **webkit under CI**), the mutation harness,
the floor reporter, the axe gate, Playwright
**Constraints**: ADR-9 §4 arrangement B (settled); no CSS in `packages/elements`; every adopted
rule owns its leftmost compound; the published styles surface may not move (C-007)
**Scale/Scope**: 2 new elements, 2 new styles directories, 8 behaviour subjects, 8 mutations,
1 new `config-contract` arm, 1 expected-stories ratchet, `suite-budget.json` re-measured

## Charter Check

- **`DIRECTIVE_046`** — the adversarial squad is a merge GATE. Tier A additionally requires
  post-spec (done — three BLOCKs, folded at `62dd484`/`6e86122`), post-plan and post-tasks.
- **No architectural decisions.** The one genuinely open question — the semver-major — is
  escalated on #74 and **routed around** rather than decided: the additive path needs no ruling.
- **C-004** — `kitty-specs/**` outside this mission, `docs/architecture/validation/**` and
  `docs/learnings/**` are frozen. `docs/design-system/**` is not.

## Project Structure

```
packages/styles/src/form-input/sk-form-input.css          # NEW  (FR-012, FR-013)
packages/styles/src/form-textarea/sk-form-textarea.css    # NEW
packages/styles/src/form-field/**                          # UNTOUCHED — published surface
packages/elements/src/form-input/sk-form-input.ts          # NEW
packages/elements/src/form-input/sk-form-input.stories.ts  # NEW  (named story set, SC-206)
packages/elements/src/form-textarea/sk-form-textarea.ts    # NEW
packages/elements/src/form-textarea/sk-form-textarea.stories.ts
packages/elements/src/form-control-base.ts                 # NEW? — see IC-02's open question
packages/elements/src/{index,elements}.ts                  # + both elements, BOTH entries
fixtures/elements-behaviour/src/sk-form-input.test.ts      # NEW
fixtures/elements-behaviour/src/sk-form-textarea.test.ts   # NEW
behaviours.json · mutations.json · expected-parts.json     # + 8 pairs, 8 mutations, 4 parts
tests/node/config-contract.test.ts                         # + the formAssociated arm (FR-009)
expected-stories.json                                      # NEW — shrink-only, SC-206
suite-budget.json                                          # re-measured (FR-016)
docs/design-system/using-components.md                     # corrected (FR-007)
```

## Implementation Concern Map

### IC-01 — Make "one stylesheet directory per element" true

- **Relevant requirements**: FR-012, FR-013, FR-014, FR-015, NFR-001, NFR-002
- **Surfaces**: `packages/styles/src/form-input/`, `packages/styles/src/form-textarea/`
- **Approach**: two new sheets, authored from `sk-form-field.css`'s control rules with
  conforming class names. `.is-focused` does not come across (FR-014) and
  `var(--sk-space-30, 120px)` is resolved rather than copied (FR-015).
- **Risks**: this is the mission's first commit and everything depends on it. `.sk-input` and
  `.sk-textarea` differ in exactly **two** declarations (`min-height`, `resize`), so two files
  authored independently are 73% duplicate on day one — the plan's answer is a shared base sheet
  plus a delta, which `build-elements-css.mjs` already supports (many sheets → one element,
  base first). **The base sheet's class names must still own their leftmost compound under EACH
  element's name**, which a shared `.sk-form-control` class does not. This is the sharp edge:
  verify with `check-adopted-css-boundaries.mjs` before writing either element.

### IC-02 — The two elements, and how much they share

- **Relevant requirements**: FR-001, FR-002, FR-004, FR-005, FR-006
- **Surfaces**: `packages/elements/src/form-input/`, `.../form-textarea/`, possibly a base class
- **Approach**: arrangement B — the shadow root owns label, control, description and error node.
  `label`, `description` and `error` are **properties**, not slots: ADR-9 §4's `getRootNode()`
  finding applies to `aria-describedby` exactly as it does to `aria-labelledby`, so anything an
  ID reference targets must be shadow-internal. Slotted content is permitted only where nothing
  references it by id.
- **OPEN QUESTION, for the post-plan squad**: a shared base class is the obvious way to avoid a
  third copy of the form-association block (the fixture has one already) — but
  `suite-selftest.mjs` guard 5 computes collateral over *every* `[SC-…]` test outside the
  mutation's declared `(id, subject)` pair, so **one mutation to a shared line reds both
  elements' `[SC-002]` tests and is rejected as collateral**. The alternatives are
  `expectCollateral: true` (which inverts the guard and then *requires* the blast radius), or
  per-element call sites, which is copy-paste the harness rewards. Named here rather than
  resolved, because it is a real tension between two of this repo's own mechanisms.
- **Risks**: `setFormValue` must track the property, not just the initial state — the fixture
  records `el.value = 'x'` submitting stale as a real failure. Published prose stays short.

### IC-03 — Behaviour subjects, and making FR-009 bind

- **Relevant requirements**: FR-009, NFR-004 · **Success**: SC-201…SC-205, SC-211
- **Surfaces**: `behaviours.json`, `mutations.json`, `tests/node/config-contract.test.ts`, both test files
- **Approach**: each element becomes a subject of SC-002…SC-005 with a test file named for it,
  and `config-contract` gains the arm that makes the four-id obligation real: *any element
  declaring `static formAssociated = true` must be a subject of all four.* Without it the
  derived obligation is "≥1 behaviour" and SC-013/SC-014 alone would satisfy every gate.
- **Risks**: the new arm needs its own red-first proof — a declared-but-unbacked arm is worse
  than none. Eight `(id, subject)` pairs means eight mutations, and each must red exactly one
  named test. SC-203's seed must be **non-empty** or a blanking regression passes; SC-204 must
  route through the element's own `setFormValue` or the UA's own exclusion makes it unobservable.

### IC-04 — The states the axe gate must actually see

- **Relevant requirements**: NFR-003 · **Success**: SC-206, SC-207, SC-211
- **Surfaces**: both `*.stories.ts`, `expected-stories.json` (new), `scripts/run-axe-storybook.js`
- **Approach**: a committed expected-stories list per element, shrink-only, in the shape of
  `expected-parts.json`. The axe gate refuses only a *globally* empty set today, so one
  `Default` story would report green over one state.
- **Risks**: SC-207 needs a real accessible-name query, not `querySelector('[aria-label=…]')` —
  #73's corrected assertion was still a tag check plus an attribute selector, so the precedent
  the spec cites does not implement what it asks for. Find the mechanism in the browser lane
  before writing the criterion's test.

### IC-05 — WebKit, settled by capability rather than by lane

- **Relevant requirements**: FR-010 · **Success**: SC-210
- **Approach**: the webkit instance is already unconditional under CI and the floor reporter
  asserts the lane executed. What is *not* yet asserted is that these four callbacks ran there.
  The evidence is the CI run URL plus the floor line showing the new files' count.
- **Risks**: "verified in CI" is free and uninformative on its own — any new file under
  `fixtures/**/src/` runs on webkit automatically. The claim must name the capability.

### IC-06 — Budget

- **Relevant requirements**: FR-016
- **Risks**: 29 mutations against a 180s ceiling; eight more plus a doubled browser set is very
  likely over. Raise deliberately with the run that justifies it, or show the set fits — the
  file's own docstring demands exactly that.

## Complexity Tracking

Two enabling changes (IC-01, and IC-03's new gate arm) touch shared machinery rather than these
components. Both are prerequisites the post-spec squad measured, not scope creep. The property
the post-plan squad should check first: **nothing under `packages/styles/src/form-field/` moves,
and `packages/styles`' packed file list is unchanged.**

## Sequencing

IC-01 → IC-02 → IC-03 alongside IC-02 (red-first) → IC-04 → IC-05 at the gate → IC-06 last,
measured on the finished set. The mission is sequenced so the operator's answer to question 1
(one mission or two) can still split it after IC-01.
