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
packages/elements/src/form-control-base.ts                 # NEW — unanchored plumbing only (§B)
                                                           #       NOT sk-*-named, no @element
packages/elements/src/{index,elements}.ts                  # + both elements, BOTH entries
fixtures/elements-behaviour/src/sk-form-input.test.ts      # NEW
fixtures/elements-behaviour/src/sk-form-textarea.test.ts   # NEW
behaviours.json · mutations.json · expected-parts.json     # + 8 pairs, 8 mutations, +8 parts (4→12)
mutations.selftest.json                                    # + `subject` on the four redTest entries
packages/elements/custom-elements.json                     # regenerated
fixtures/elements-behaviour/tsconfig.json                  # + @vitest/browser/matchers types
tests/node/config-contract.test.ts                         # + the formAssociated arm (FR-009)
expected-stories.json                                      # NEW — shrink-only, SC-206
suite-budget.json                                          # re-measured (FR-016)
docs/design-system/using-components.md                     # corrected (FR-007)
```

## What the post-plan squad settled

Two lenses, one of which **built a working prototype** — two real arrangement-B elements, eight
tests, eight mutations — and ran the repository's own harness against it. The plan's central
obligation is therefore measured, not argued:

```
✅ All 37 mutations produced their named red, with a green baseline.  (80.7s, ceiling 180s)
```

Both open questions are answered, and three of my own claims were wrong.

### A — sharing a stylesheet: `:host`-anchored, and the deltas must be custom properties

| shape | gate verdict |
|---|---|
| `.sk-form-control` in a shared sheet | **rejected under both element names** |
| `:host .sk-form-control` in a shared sheet | **accepted under both**, exit 0 |

A leading `:host` confers ownership unconditionally (`compoundOwns`), and it matches only inside
the element's own tree — so this is the gate working, not a hole.

**But my stated mechanism was wrong in both halves.** "`build-elements-css.mjs` already supports
many sheets → one element, base first" — the slot forced first is *hardcoded* to
`packages/styles/src/<name>/sk-<name>.css`, so a shared sheet concatenates **last** and overrides
the per-element delta at equal specificity; with `:host .sk-form-control` (0,2,0) beating
`.sk-form-input__control` (0,1,0) the delta could never override at all.

**Therefore:** the shared rule carries `var(--sk-form-control-min-height, auto)` and
`var(--sk-form-control-resize, none)`, and each element's own sheet sets those on `:host`.
Custom properties resolve at use time, so cascade order stops mattering rather than merely being
survivable. Duplication falls to a two-line `:host { --sk-form-control-*: … }` block per element.

**And the shape gets probes.** `check-adopted-css-boundaries.mjs --selftest` is shrink-only with
`FLOOR = { rejects: 19, accepts: 12 }` and its own instruction to keep every defeated form in the
table. Adding `[':host .sk-form-control', 'accept']` and `['.sk-form-control', 'reject']` and
raising the floor to 20/13 is part of the same commit — otherwise the shape the whole mission
rests on has no regression protection.

### B — sharing the form-association block: split by ANCHOR, not by class

Measured, with a shared base class holding the four anchors:

```
❌ SC-002  other behaviour test(s) also failed: [SC-002]      (× 4 ids × 2 elements)
❌ 8 of 37 mutation(s) did not behave as specified.
```

Per-element call sites: **37/37 clean**. `expectCollateral: true` also passes (37/37, 78.9s) —
but a lens read the inverted arm and it asserts `collateral.length > 0` **and nothing else**: not
which tests, not how many, not that they are the intended sibling. It exists to reject an
over-declaration on a surgical mutation, not to verify a blast radius. **Ruled out**, not
deprioritised.

**Therefore:** the base class keeps only *unanchored* plumbing — `attachInternals()`, the
`validity`/`validationMessage`/`checkValidity` proxies, the upgrade dance, the error-node render
helper, the `#initialValue` capture (which becomes `protected`, since `#`-private is not
inheritable). The four anchor expressions live in each element file, ~8 lines apiece. No third
copy of the block, no collateral, neither guard touched.

### C — my base class would have voided my own new gate

`static formAssociated = true` on the base means no `sk-*.ts` contains the string, and
`Object.prototype.hasOwnProperty.call(Sub, 'formAssociated')` is **false** — measured. A
source-text or own-property arm would have matched zero elements and reported green over an
empty set: the exact shape IC-03 exists to close.

The manifest *does* propagate inherited statics (`superclass: FormControlBase`,
`static members: ["formAssociated"]`), so a manifest-derived arm sees it — and a lens wrote one
and proved it red-first. It is still evadable by post-hoc assignment
(`(SkFormInput as …).formAssociated = true` leaves the manifest empty), and by
`static get formAssociated()` if the arm keys on `default === "true"`.

**Therefore:** the arm keys on the member **name** (fails closed), and a browser-lane companion
asserts `customElements.get(tag).formAssociated === true` for every registered tag. Runtime truth
is the only unevadable source, and the node lane has no `customElements`.

### D — SC-204 as written has no satisfying implementation

| how `disabled` is toggled | `formDisabledCallback` fires | SC-005 mutation |
|---|---|---|
| `setAttribute('disabled','')` | yes | **green** — the UA excludes it unaided |
| ancestor `fieldset.disabled = true` | yes | **green** |
| `el.disabled = true` (non-reflected) | **no** | **RED** |
| direct `formDisabledCallback(true)` | n/a | **RED** |

Every route that genuinely invokes the callback makes the element's own exclusion unobservable;
every route that keeps it observable bypasses the callback. "Routes through the element's own
`setFormValue`" and "re-checked after a live *attribute* toggle" cannot both hold. The anchor is
the direct callback call, as the fixture already does, and "live toggle" means the **property**.

## Implementation Concern Map

### IC-01 — One stylesheet directory per element (`form-input` only)

- **Relevant requirements**: FR-012, FR-013, FR-014, FR-015, NFR-001, NFR-002
- **Surfaces**: `packages/styles/src/form-input/`
- **Approach**: per §A above. **Scoped to `form-input/` alone.** The boundary gate iterates
  elements, not styles directories, so a `form-textarea/` sheet created before its element would
  land completely unchecked by the very gate FR-012 exists to satisfy — and extracting a shared
  base from a single consumer is generalising from one. The shared sheet arrives in IC-02 when
  the second element does.
- **Risks**: NFR-002 says every rule owns its leftmost compound "under its own element's name",
  and the gate accepts four leading forms (`:host`, `::slotted(`, bare `slot`, `^sk-<name>`). The
  recommended shape satisfies the gate and violates NFR-002's letter — **NFR-002 is restated to
  the gate's actual rule**, or the mission ships a criterion its own CSS breaks.
- **FR-014 / FR-015 are narrowed by the additive path, and this is the record.** `.is-focused`
  and `var(--sk-space-30, 120px)` exist only in `form-field/sk-form-field.css`, which C-007
  freezes. Neither can be "deleted from the stylesheet". They become positive, checkable
  assertions instead: neither new sheet contains `is-focused`, and neither carries an
  undefined-token fallback. The record lives in the new sheets' header comments, which survive.

### IC-02 — The two elements, and exactly how much they share

- **Relevant requirements**: FR-001, FR-002, FR-004, FR-005, FR-006
- **Approach**: per §B. `label`, `description` and `error` are **properties**.
- **The property-vs-slot call is a DECISION, not an inheritance.** ADR-9 §4 measured *label*
  ownership and its finding is about `aria-labelledby`. Extending it to `aria-describedby` is a
  sound inference — same ID-reference resolution, same `getRootNode()` scoping — but it is an
  inference, and a lens showed my stated premise does not even reach the conclusion: a
  `<slot id="desc">` **is** shadow-internal, the lookup succeeds in the referencing root, and the
  description computes over the flat tree. ADR-9's own negative consequences flag the i18n cost
  of attribute-borne text. Recorded as this mission's decision, made on the inference, and
  raised on #74 as operator question 3.
- **`error` is READ-ONLY, derived from validity.** A settable `error` property alongside
  `setValidity` is two sources of truth: `error="…"` would paint the error state while the
  element stays `:valid`, the story renders red, axe passes, submission is not blocked, and
  nothing notices.
- **The base class filename is load-bearing**: `form-control-base.ts`, deliberately not
  `sk-`-prefixed. Four scripts glob `**/sk-*.ts` with `/^sk-[a-z0-9-]+\.ts$/`; an `sk-`-named
  base would be treated as an element and fail four gates. It also carries no `@element` JSDoc —
  `config-contract` requires the manifest's registered set to equal the source glob exactly.

### IC-03 — Behaviour subjects, and a gate arm that cannot be evaded

- **Relevant requirements**: FR-009, NFR-004 · **Success**: SC-201…SC-205, SC-211
- **Approach**: per §C — name-keyed manifest arm plus a runtime browser-lane companion.
- **`mutations.selftest.json` must be updated in the same commit.** Its `guard4`/`guard5` entries
  carry `redTest` but no `subject`, so `inSubject()` is vacuously true and they match `[SC-002]`
  in *any* file. The moment the new files carry `[SC-002]`, the syntax-error probe stops
  producing an absent named test: measured `❌ guard4-syntax-error expected "absent", got
  "green"`, 1 of 8 self-checks failing. Adding `"subject": ".../behaviours.test.ts"` to the four
  entries restores 8/8. **This is the CI step the first draft of this plan did not name.**
- **Intra-file collateral is the trap.** A lens's first SC-005 test asserted the *enabled*
  FormData entry before disabling, and SC-002's mutation redded it — twice. Each of the eight
  tests must depend only on its own behaviour, and SC-204's wording pushes directly toward the
  violating shape.

### IC-04 — The states the axe gate must see, and the parts the ratchet must know

- **Relevant requirements**: NFR-003 · **Success**: SC-206, SC-207
- **`@csspart` JSDoc is required or SC-013 and the ratchet stay vacuous for these elements.**
  Measured: eight `part=` attributes shipped, manifest `cssParts` empty for both, ratchet green
  at the old count of 4. The analyzer populates `cssParts` only from the JSDoc tag.
- **Counts corrected**: four parts *per element* is **+8**, taking `expected-parts.json` from 4
  to 12 — not "+4". If the elements become SC-013 subjects too (the `sk-card` / `sk-nav-pill`
  precedent), pairs go 23 → 33 and mutations 29 → 39, not 31/37.
- **SC-202 and SC-207 are directly assertable** — a lens expected `toHaveAccessibleDescription`
  to fail across a shadow root and it does not; it resolves within the control's own root and
  concatenates both referenced nodes. It needs `"types": ["vitest/globals",
  "@vitest/browser/matchers"]` in `fixtures/elements-behaviour/tsconfig.json` or typecheck fails
  with TS2339. (`@vitest/browser/jest-dom` is not in that package's `exports`.)

### IC-05 — WebKit, settled by capability

- Unchanged from the first draft, and untested by either lens: WebKit cannot launch on this host.
  The evidence is the CI run URL plus the floor reporter's `browser (webkit)=N` line covering the
  new files.

### IC-06 — Budget, measured and moved earlier

- **Relevant requirements**: FR-016
- **Measured on this workstation, chromium, warm cache**: head `2cc613e` = 29 mutations / 39
  tests / **57.2s**; prototype = 37 / 47 / **80.7s**. +39% wall time, comfortably inside 180s
  locally; the CI-runner ratio is unknown and no committed artifact records the harness's CI
  elapsed.
- **My stated cause was wrong.** The harness spawns vitest with `CI: ''`, so it is
  **chromium-only** — the "doubled browser set" applies to `ceilingSeconds: 25` (`npm run test`),
  not to the 180s harness ceiling. `suite-budget.json`'s own comment says the two exist
  separately precisely so a regression can be attributed; the first draft mixed them.
- **Moved from last to first-mutation-commit.** The ceiling asserts at the end of *every* run and
  is wired into CI, so it reds at the commit that pushes the set over — not at a final
  measurement pass.

## Complexity Tracking

Two enabling changes (IC-01, and IC-03's new gate arm) touch shared machinery rather than these
components. Both are prerequisites the post-spec squad measured, not scope creep. The property
the post-plan squad should check first: **nothing under `packages/styles/src/form-field/` moves,
and `packages/styles`' packed file list is unchanged.**

## Sequencing

IC-01 → IC-02 → IC-03 alongside IC-02 (red-first) → IC-04 → IC-05 at the gate → IC-06 last,
measured on the finished set. The mission is sequenced so the operator's answer to question 1
(one mission or two) can still split it after IC-01.
