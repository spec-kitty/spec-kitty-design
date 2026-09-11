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

## The load-bearing fact: `BUTTON_VARIANTS` is a codegen source

This is the single most useful thing this record can state, and it is read directly from
`sk-button.markup.ts:14-18`'s own comment, not inferred:

> The generator treats this map as the component's VARIANTS and emits one static export per
> entry.

Confirmed in the generator itself, `scripts/build-element-markup.mjs:288-300`: it looks up
`mod[`${screaming}_VARIANTS`]` by naming convention (`BUTTON_VARIANTS` for `sk-button`) and
derives one static-HTML export per key — refusing to run if the export is missing or not an
object, specifically so a component "with genuinely no variants exports an empty object
explicitly" rather than the generator silently emitting nothing. That per-key derivation is what
produces `packages/styles/src/button/sk-button.html` and `index.ts`'s generated exports and,
downstream of the elements build, `packages/elements/custom-elements.json`'s `sk-button.variant`
type and the generated React wrapper's prop type (`packages/react/src/**`).

**The consequence for a future axis split.** Splitting `BUTTON_VARIANTS` into two axes — a
`tone` and an `intensity`/`variant` — is not a local edit to one TypeScript file. It changes what
the generator derives one export per key *from*, which changes the generated static HTML
exports, the manifest entry, and the generated React (and Vue) wrapper's prop surface in the same
motion. Any mission that takes on this split must treat it as a generated-artifact change with
the blast radius that implies — full regeneration, `--check` verification across every generated
consumer, and a manifest diff review — not as a same-shape rename.

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
- **The migration shape, if `danger-primary` is added.** Splitting into two axes means: (1)
  `BUTTON_VARIANTS` (or its replacement) stops being the generator's sole per-key derivation
  source — either the generator's `<COMPONENT>_VARIANTS` convention is extended to compose two
  maps (a `BUTTON_TONES` × `BUTTON_INTENSITIES` product, generated combinatorially) or the
  component keeps one flat map but the generator, the manifest, and the wrapper types are updated
  to know that some keys are compounds; (2) `sk-button.ts`'s hand-spelled `variant` type union
  (currently `'primary' | 'secondary' | 'ghost' | 'danger-secondary' | undefined`, not derived —
  see `sk-button.ts`, widened by hand at #320) would need the same widening exercise repeated,
  or the union derived from the map(s) instead of hand-spelled, closing the drift risk that
  hand-spelling already carries; (3) every per-tone rule elsewhere in the component that is
  keyed on a specific variant string rather than on `BUTTON_VARIANTS`'s keys generically must be
  re-derived — see the next section, which is the live example of exactly this risk.
- **Widening `BUTTON_VARIANTS` with a `danger-primary` sibling costs less than splitting the
  axis** — one more map entry, one more generated export, one more manifest value, no generator
  change — but it does not stop the underlying question from recurring at the next tone. This
  record does not choose between "add the one sibling and defer the split again" and "split now";
  it states the ceiling and the cost of each path so the mission that adds `danger-primary`, if
  one is ever filed, does not have to re-derive this analysis.

## Related: #348, the same defect family, not fixed here

`packages/styles/src/button/sk-button.css`'s busy axis carries a per-tone override,
`.sk-button--primary .sk-button__busy-cue`, that is not derived from `BUTTON_VARIANTS` at all —
it is one hardcoded selector naming one tone. #348 observes that a fifth tone (or, on this
record's terms, a `danger-primary` sixth flat sibling) gets no busy-cue rule of its own and
silently inherits the wrong one. This is the identical root cause named above — a per-tone
concern (the busy-cue override, here; the enum's key shape, in this record) with nothing tying
it back to the tone set as a first-class thing other rules can derive from — reached from a
different file. **This record does not fix #348.** It is named here because both records are
evidence for the same underlying claim: `BUTTON_VARIANTS`' four keys are a closed, hand-maintained
list that multiple parts of this component (the type union, the busy-cue CSS, and — per the
codegen-source fact above — every generated artifact) each independently assume stays small.

## Consequences

**Positive** — the question raised twice at #341 and dropped both times now has one indexed
answer; a future `danger-primary` proposal can cite this record's ceiling and migration-cost
analysis instead of re-deriving it, and the codegen-source fact is now written down where a
contributor proposing an axis split will find it before scoping the change as "just a type
change."

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
  explicit-empty-object requirement), `packages/elements/src/button/sk-button.ts` (the
  hand-spelled `variant` type union), `packages/styles/src/button/sk-button.css` (the
  `.sk-button--primary .sk-button__busy-cue` hardcoding #348 names), and
  `packages/tokens/src/tokens.css` (the tint-border N-components-x-M-variants comment, quoted
  accurately above rather than paraphrased).
