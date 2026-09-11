# ADR 17 (2026-09-11): sk-button's Tone × Intensity Flattening, and the Ceiling on `BUTTON_VARIANTS`

**Date:** 2026-09-11
**Status:** Proposed.
**Deciders:** None recorded. Raised by `architect-alphonso` at the #341 pre-merge gate in both
passes and dropped without disposition both times; filed as #403 so it would stop evaporating.
This record answers the question #403 asks — it is not an operator ruling, and it does not
ratify a design change.
**Technical Story:** Issue #403. Raised against `sk-button`'s fourth tone, `danger-secondary`,
landed by #320 under epic #319 and reviewed at #341. Related: #348 (the busy cue's per-tone rule
is hardcoded, the same "tone set is not first-class" defect family).

---

## Context and Problem Statement

`packages/elements/src/button/sk-button.markup.ts:20-25` defines:

```ts
export const BUTTON_VARIANTS = {
  primary: 'sk-button--primary',
  secondary: 'sk-button--secondary',
  ghost: 'sk-button--ghost',
  'danger-secondary': 'sk-button--danger-secondary',
} as const;
```

One flat string enum. Three of the four keys (`primary`, `secondary`, `ghost`) name a single
axis — call it *intensity/shape* — with no tone qualifier, because until #320 every tone was the
neutral one. The fourth, `danger-secondary`, names a **tone** (`danger`) crossed with an
**intensity** (`secondary`): it is `BUTTON_VARIANTS` for two axes wearing the clothes of one.
Nothing in the type system, the generator, or the docs says so — `ButtonVariant` is
`keyof typeof BUTTON_VARIANTS`, four opaque string literals with no structural relationship
between them.

**Why the current shape is not a defect.** With exactly four mutually exclusive values, a flat
enum has no illegal state to represent. The alternative the issue itself raises — a boolean
`danger` crossed with a three-value `variant` — would produce a 2×3 matrix with five undefined
cells (`danger` × `secondary` is the only combination that exists; `danger` × `primary`,
`danger` × `ghost`, and their non-danger reflections would all need explicit handling or an
implicit "off" default). A flat enum naming only the cells that are real is the correct shape
**for the cell that exists today**.

**Why the question does not wait.** The reasoning above stops holding at the exact moment a
solid-fill `danger-primary` is wanted — the more common destructive-button pattern, and one this
repository already has the token pair for (`--sk-status-danger` / `--sk-on-status-danger`, both
published and already consumed by `.sk-button--danger-secondary`'s own rules in
`sk-button.css`). At that point `BUTTON_VARIANTS` would hold `danger-secondary` and
`danger-primary` as two more flat siblings — a cartesian product (tone × intensity) flattened
into a string enum with no axis named anywhere in the type or the data. This repository's own
token doctrine argues against exactly that shape one layer down, in
`packages/tokens/src/tokens.css`'s tint-border comment: naming a border per component rather than
per tint "would have put this on an N-components x M-variants path (`--sk-border-feature-card-*`,
and so on) beside a family that already scales." `BUTTON_VARIANTS` is not yet on that path — it
has one occupied cell of a possible six (three intensities × two tones, once `neutral`/`danger`
is named as the second axis) — but a second `danger-*` sibling would put it there.

## The load-bearing fact: `BUTTON_VARIANTS` feeds ONE of two disconnected pipelines

This is the single most useful thing this record can state, and it corrects an error present in
an earlier draft of this same record (caught at review): the two pipelines below were conflated
into one. Both are read directly from source, not inferred.

**Pipeline 1 — `BUTTON_VARIANTS` → static HTML → `index.ts`.** `sk-button.markup.ts:14-18`'s own
comment: "The generator treats this map as the component's VARIANTS and emits one static export
per entry." Confirmed in the generator itself, `scripts/build-element-markup.mjs:288-300`: it
looks up `mod[`${screaming}_VARIANTS`]` by naming convention (`BUTTON_VARIANTS` for `sk-button`)
and derives one static-HTML export per key — refusing to run if the export is missing or not an
object, so a component "with genuinely no variants exports an empty object explicitly" rather
than the generator silently emitting nothing. That per-key derivation produces
`packages/styles/src/button/sk-button.html` and `index.ts`'s generated exports. **It stops
there.**

**Pipeline 2 — the hand-spelled union in `sk-button.ts` → `custom-elements.json` → the React
wrapper.** `sk-button.ts:35` declares
`declare variant: 'primary' | 'secondary' | 'ghost' | 'danger-secondary' | undefined;` by hand —
derived from nothing. The custom-elements-manifest analyzer (`nx run elements:analyze`) reads
this literal TypeScript type off the class field and writes it into
`custom-elements.json`'s `SkButton.variant.type.text`, verbatim, confirmed identical to the
`sk-button.ts` union in the committed manifest. `scripts/build-react-wrappers.mjs`'s own header
comment states the wrappers are "GENERATED from custom-elements.json"; the generated
`packages/react/src/SkButton.d.ts:42` reads `variant?: SkButtonElement["variant"]` — an indexed
type read off the element class, which is this same hand-spelled union one layer removed. None of
Pipeline 2 reads `BUTTON_VARIANTS`.

`BUTTON_VARIANTS` does appear inside `custom-elements.json` — the analyzer globs
`sk-button.markup.ts` too, so it is indexed as its own independent `variable` export
(`kind: "variable"`, `name: "BUTTON_VARIANTS"`) — but nothing wires that entry to
`SkButton.variant`'s type. The two sit side by side in the same manifest file, sourced from two
different files, and nothing compares them.

**The consequence — and the hazard, not just the cost.** Regenerating from `BUTTON_VARIANTS`
(adding a `danger-primary` key and running the markup generator) updates the static HTML and
`index.ts` exports correctly. It does **not** touch `sk-button.ts`'s union, does **not** touch
`custom-elements.json`'s `variant` type, and does **not** touch the React or Vue wrapper's prop
type. A contributor who stops at "`BUTTON_VARIANTS` is a codegen source" would add the key,
regenerate, watch every currently wired `--check` gate pass, and ship: static markup and CSS
would support `danger-primary` while the manifest and the generated consumer surface still
advertised only the original four values. **This split is itself a standing drift risk.** No
gate in this repository compares `BUTTON_VARIANTS`'s keys against `sk-button.ts`'s hand-spelled
union — each pipeline's own `--check` only compares its generated output against its own source
(the markup check against `BUTTON_VARIANTS`; the manifest check against the class declaration),
so a two-thirds-complete `danger-primary` addition (styles + markup, manifest/wrapper untouched)
would pass every gate wired today.

## Decision

**The flattened enum is deliberate for the cell that exists, and its ceiling is one more
sibling.**

- **The ceiling.** `BUTTON_VARIANTS` can absorb exactly one more flat sibling —
  `danger-primary` — before the "which axis does this name" question becomes unavoidable. A
  fifth *tone* value beyond `danger` (e.g. a `success` or `warning` tone, should one ever be
  proposed) would make a flat enum's naming collide immediately (`success-secondary` next to
  `danger-secondary` next to `secondary` itself, with no way to express "the neutral-tone
  secondary" and "the success-tone secondary" as siblings of the same intensity without the
  string enum growing combinatorially). One additional flat sibling is tolerable; two is the
  point at which flattening stops paying for itself.
- **The migration shape if `danger-primary` is added — even as a same-shape widening, not a
  full axis split.** Because Pipeline 1 and Pipeline 2 above are disconnected, adding the value
  correctly requires touching both, by hand, in the same change — nothing propagates
  automatically from one to the other:
  1. Add `'danger-primary': 'sk-button--danger-primary'` to `BUTTON_VARIANTS` and run the markup
     generator (Pipeline 1). This alone updates only the static HTML and `index.ts` exports.
  2. **Separately, by hand**, widen `sk-button.ts`'s `variant` type union to include
     `'danger-primary'` (Pipeline 2, widened by hand at #320 the same way). Nothing derives this
     step from step 1 — skipping it is exactly the silent, gate-invisible drift this record names
     above.
  3. Regenerate `custom-elements.json` (`nx run elements:analyze`) and the React/Vue wrappers
     from the now-widened union, and run every `--check` gate — none of which catches a *missed*
     step 2, since each gate compares only within its own pipeline.
  4. Every per-tone rule elsewhere in the component keyed on a specific variant string — the
     busy-cue CSS is the live example, see #348 below — must be re-derived by hand; neither
     pipeline touches CSS selectors.

  A genuine two-axis split (rather than one more flat sibling) would need to restructure both
  pipelines: the generator's `<COMPONENT>_VARIANTS` convention composing a `BUTTON_TONES` ×
  `BUTTON_INTENSITIES` product (or an explicit compound-key convention), and `sk-button.ts`'s
  union derived from that same source instead of hand-spelled — which is also the point at which
  a single source feeding both pipelines would close the drift hazard above, rather than only
  widening it by one more manually-synchronised value.
- **Widening `BUTTON_VARIANTS` with a `danger-primary` sibling costs less than a full axis
  split** — one more map entry, one more generated export, plus the mandatory hand-edit to
  `sk-button.ts`'s union (step 2 above, never automatic) — but it is not the single-file edit it
  looks like, and it does not stop the underlying question from recurring at the next tone. This
  record does not choose between "add the one sibling and defer the split again" and "split now";
  it states the ceiling, the two-pipeline cost, and the drift hazard of each path so the mission
  that adds `danger-primary`, if one is ever filed, does not have to re-derive this analysis or
  rediscover the hazard by shipping it.

## Related: #348, the same defect family, not fixed here

`packages/styles/src/button/sk-button.css`'s busy axis carries a per-tone override,
`.sk-button--primary .sk-button__busy-cue`, that is not derived from `BUTTON_VARIANTS` at all —
it is one hardcoded selector naming one tone. #348 observes that a fifth tone (or, on this
record's terms, a `danger-primary` sixth flat sibling) gets no busy-cue rule of its own and
silently inherits the wrong one. This is the identical root cause named above — a per-tone
concern (the busy-cue override, here; the enum's key shape, in this record) with nothing tying
it back to the tone set as a first-class thing other rules can derive from — reached from a
different file. **This record does not fix #348.** It is named here because both records are
evidence for the same underlying claim: `sk-button`'s tone set is spelled out independently in
at least three places — `BUTTON_VARIANTS` (Pipeline 1), `sk-button.ts`'s hand-spelled union
(Pipeline 2), and the busy-cue CSS's hardcoded selector — and nothing in this component ties the
three together or checks that they agree.

## Consequences

**Positive** — the question raised twice at #341 and dropped both times now has one indexed
answer; a future `danger-primary` proposal can cite this record's ceiling and migration-cost
analysis instead of re-deriving it, and the two-pipeline split — and the drift hazard it creates
— is now written down where a contributor proposing an axis split, or even the one-sibling
widening, will find it before scoping the change as "just a type change" or "just a map edit."

**Negative** — none: this record makes no code change (C-002) and asserts no operator
ratification it does not have.

**Neutral** — the record's Status stays `Proposed`. Per this file's own convention
(`docs/architecture/README.md`'s "What a Status obliges"), a Proposed record does not bind a
future spec to follow its migration-shape sketch; it is this repository's recorded reasoning on
the subject, to be read and either followed or explicitly amended when `danger-primary` (or a
fifth tone) is actually proposed.

## More Information

* Related: #403 (this record's source issue), #341 / #320 (where the fourth tone landed and the
  question was first raised), #348 (busy-cue hardcoding, same defect family, not fixed here).
* Evidence read directly from source for this record: `packages/elements/src/button/
  sk-button.markup.ts:14-26` (the `BUTTON_VARIANTS` map and its generator-derivation comment),
  `scripts/build-element-markup.mjs:288-300` (the generator's per-key derivation and its
  explicit-empty-object requirement), `packages/elements/src/button/sk-button.ts:35` (the
  hand-spelled `variant` type union — Pipeline 2's actual source), `packages/elements/
  custom-elements.json` (`SkButton.variant.type.text`, confirmed verbatim-identical to
  `sk-button.ts`'s union, and `BUTTON_VARIANTS`'s own disconnected `variable` entry in the same
  file), `scripts/build-react-wrappers.mjs:1-10` (its own header comment: wrappers are generated
  from `custom-elements.json`, not from `BUTTON_VARIANTS`), `packages/react/src/SkButton.d.ts:42`
  (`variant?: SkButtonElement["variant"]`, confirming the wrapper prop type is indexed off the
  element class), `packages/styles/src/button/sk-button.css` (the
  `.sk-button--primary .sk-button__busy-cue` hardcoding #348 names), and
  `packages/tokens/src/tokens.css` (the tint-border N-components-x-M-variants comment, quoted
  accurately above rather than paraphrased).
* **Correction note.** An earlier draft of this record stated that `BUTTON_VARIANTS`'s
  per-key derivation reaches `custom-elements.json`'s `sk-button.variant` type and the generated
  React wrapper's prop type "downstream of the elements build." That was wrong — caught at
  review, before this record left Proposed status — and is corrected above: those two surfaces
  are sourced from `sk-button.ts`'s hand-spelled union (Pipeline 2), entirely independent of
  `BUTTON_VARIANTS` (Pipeline 1). The drift hazard this correction surfaces is now this record's
  central claim, not a footnote.
