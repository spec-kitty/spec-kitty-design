# Implementation Plan: React Wrapper Generation

**Branch**: `mission/react-wrapper-generation` | **Date**: 2026-09-03 | **Spec**: [spec.md](./spec.md)
**Issue**: #75 · part of epic #66 · **Squad tier**: B — post-tasks, pre-merge

## Summary

Generate React wrappers from `custom-elements.json` with `@wc-toolkit/react-wrappers`, commit
the output, and gate it on drift. **The generator was run against the real manifest before this
plan was written**, so most of what follows is measured rather than designed.

## The spike, and what it settled

`@wc-toolkit/react-wrappers@1.2.7`, `generateReactWrappers(manifest, { outdir, modulePath })`,
against `packages/elements/custom-elements.json` as it stands on the train.

**It works.** All five elements emit `.d.ts` + `.js`, and — the criterion this mission is
really about — **two runs are byte-identical**, verified with `diff -rq`. FR-003's no-op
requirement is achievable off the shelf, which was not obvious before #74 made the manifest
deterministic in the first place.

Six findings, each of which changes the plan:

### S1 — protected members are correctly filtered. My spec's worry was wrong.

`internals`, `validate`, `upgradeProperty`, `errorId`, `customError` and `initialValue` do
**not** become props. My first grep said `internals` and `initialValue` "LEAKED" — both were
false positives: one from React's own `ref` prose, the other from **my own docstring text**
quoted into the output. The generator reads `privacy: protected` and honours it.

**FR-004 stands, but as a regression guard rather than a thing to build.**

### S2 — the base class gets a wrapper, and it is not an element

`out/FormControlBase.d.ts` is emitted: a full `ForwardRefExoticComponent` for an abstract class
with no tag name, importing a symbol that is exported but not registrable. Junk output that
would ship. The generator emits for declarations, and `FormControlBase` is a declaration.

**Must be filtered on `tagName`, and asserted — not left to a config option nobody re-checks.**

### S3 — the event is typed as bare `CustomEvent`, losing its documented detail

```ts
onSkNavPillToggle?: (event: CustomEvent) => void;
```

`sk-nav-pill`'s `@fires` documents `detail: { open: boolean }`. The wrapper's whole value
proposition is JSX-level types, and the one event in the catalogue arrives untyped. This is the
single sharpest answer to SC-305 — it is precisely the ergonomics gap a wrapper is supposed to
close, and off the shelf it does not.

### S4 — twenty-four `/** undefined */` blocks reach consumer-facing types

| file | count |
|---|---:|
| `SkFormInput.d.ts` | 10 |
| `SkFormTextarea.d.ts` | 10 |
| `SkNavPill.d.ts` | 2 |
| `SkCard.d.ts` | 2 |

The elements' reactive properties carry no JSDoc, so the manifest has no `description` for them,
so the generated prop docs say the literal word `undefined`. **The manifest's quality is now
visible to React consumers**, and this is the second place (after IDE hovers) where short,
accurate published prose stopped being cosmetic.

### S5 — my internal review narrative is now published API. C-005 predicted this exactly.

`SkFormInput.d.ts` carries, as the documentation for the `error` prop and `setCustomError`:

> *"This exists because a lens found the only lever a consumer HAD was `el.invalid = true` … the
> story would render red, axe would pass, and nothing would notice."*

That is squad-review narrative — correct, useful to a maintainer, and wrong in a consumer's
editor tooltip. I wrote it in a `/** */` because the surrounding convention is that rationale
goes in `//`; these two slipped.

### S6 — `sk-card`'s undeclared slot does NOT break children typing, so FR-007's premise was wrong

`SkCard.d.ts` gets `children` from `Pick<React.AllHTMLAttributes<HTMLElement>, "children" | …>`,
not from the manifest's slot list. So the missing `@slot` costs **documentation**, not types.
FR-007 is still worth doing; the reason stated in the spec is not the real one, and the spec is
corrected rather than left to imply a type-level consequence it does not have.

## Technical Context

**Language/Version**: TypeScript 5.x, Node 22
**New dependency**: `@wc-toolkit/react-wrappers` 1.2.7 (dev-only, generator side)
**Testing**: node lane for generation and drift (ADR-11 names wrapper generation as browserless
work); browser lane only where a real React render is required
**Constraints**: no hand edits; React must not become a dependency of `@spec-kitty/elements`;
`@spec-kitty/styles` is published and untouchable; the manifest is a normalised artifact (#74)

## Charter Check

- **Tier B** — post-tasks and pre-merge only. Two point-cuts, not four.
- **No architectural decisions.** The generator is settled by the issue and ADR-11. S3 raises a
  question about *typing the event detail* that is an implementation choice within that, not a
  re-opening of it.
- **C-003** — frozen paths respected.

## Implementation Concern Map

### IC-01 — The generator, its filter, and the drift gate

- **Relevant requirements**: FR-001, FR-002, FR-003, FR-004, NFR-002
- **Approach**: a committed `scripts/build-react-wrappers.mjs` in the same shape as
  `build-elements-css.mjs` and `build-element-markup.mjs` — generate, commit, `--check` on
  drift. Filter declarations on `tagName` (S2) and **assert the filter**, because a config
  option that silently stops filtering is this programme's recurring shape.
- **Risks**: the generator writes a whole directory, so `--check` compares a tree rather than
  two files. An empty-set floor is mandatory: a generator that emits nothing must not pass.

### IC-02 — What the wrapper actually buys (SC-305)

- **Relevant requirements**: FR-005, FR-006
- **Approach**: answer it with the three things the spike surfaced. Typed refs: **yes**, real and
  working (`React.Ref<SkFormInputElement>`). Typed props: **yes** for properties. Typed events:
  **no** — `CustomEvent` with no detail generic (S3). SSR: untested, and a custom element has no
  server rendering, so what the wrapper emits there is a decision.
- **Risks**: this is the criterion the issue insists must be allowed to come back negative. The
  honest form of the answer may be "typed refs and props are worth it; the event typing is not
  there and we either fix it upstream, post-process, or accept it" — and that is a finding, not
  a failure.

### IC-03 — The manifest is now consumer documentation

- **Relevant requirements**: FR-007, C-005 · **Findings**: S4, S5, S6
- **Approach**: add property JSDoc so the 24 `undefined` blocks become real prose; move the two
  review narratives out of `/** */` into `//`; add `sk-card`'s `@slot`; correct FR-007's stated
  reason.
- **Risks**: this is a change to five element files for a documentation outcome, and it will
  look like scope creep in review. It is not: the manifest is the generator's only input, and
  the mission's deliverable is generated *from* it.

### IC-04 — Proving it in a real render

- **Relevant requirements**: FR-005, FR-006 · **Success**: SC-306, SC-307
- **Approach**: browser lane. `sk-nav-pill`'s event reaching a React handler, and a
  form-associated wrapper submitting inside a React `<form>`.
- **Risks**: adds React to the test toolchain. It must stay a devDependency of the wrapper
  package and the fixture, never of `@spec-kitty/elements` (NFR-003).

### IC-05 — Budget

- **Relevant requirements**: FR-008, NFR-004
- **Risks**: 41 mutations at 141.6s CI against a 180s ceiling, ~10s per added mutation (#74's
  measured slope). Roughly four more breach it. ADR-11's behaviour 9 wants a registry id here,
  and that means a mutation — so the ceiling is very likely raised in this mission, deliberately,
  with the run that justifies it.

## Sequencing

IC-03 first (the manifest is the input, and fixing it changes every generated file) → IC-01 →
IC-02 alongside → IC-04 → IC-05 measured on the finished set.
