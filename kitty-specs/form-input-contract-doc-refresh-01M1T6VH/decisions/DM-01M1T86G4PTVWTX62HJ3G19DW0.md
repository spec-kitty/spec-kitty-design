# Decision Moment `01M1T86G4PTVWTX62HJ3G19DW0`

- **Mission:** `form-input-contract-doc-refresh-01M1T6VH`
- **Origin flow:** `review`
- **Step id:** `review.pre-merge-fold`
- **Input key:** `class_row_original_name_path`
- **Status:** `resolved`
- **Created:** `2026-09-06T02:19:13.942941+00:00`
- **Resolved:** `2026-09-06T02:19:13.942941+00:00`
- **Opened by:** `34285209+MOES-Media@users.noreply.github.com`
- **Other answer:** `false`

## Question

Where should the deeper trace of the `class` row's `originalName` path in
`@wc-toolkit/react-wrappers` be recorded, now that it has been read out of the installed bundle?

## Options

_(none)_

## Final answer

Park it here, as a note only. It is out of scope for `sk-form-input.contract.md` (which documents
one element, not the generator), out of scope for ADR-11 (which is merged and deliberately stops
short of this path), and it decides nothing — no code, gate, ADR or contract changes because of it.
It exists so the next mission that needs the `class` path does not re-derive it from scratch.

What was read, in `node_modules/@wc-toolkit/react-wrappers/dist/index.js` at the version pinned
exactly at `package.json:49` (`@wc-toolkit/react-wrappers@1.2.7`) — line numbers are that file's:

- The `class` row of `MAPPED_PROPS` (`:3`–`:9`) is the only row carrying an `originalName`
  (`originalName: "class"`, `:7`). Its `name` and `fieldName` are both `"className"`.
- That row reaches a generated wrapper through `addGlobalAttributes()` — called at `:963`, defined
  at `:966` — which walks `MAPPED_PROPS` and keeps only rows whose **`name`** appears in
  `GLOBAL_MAPPED_PROP_NAMES` (`:134`). For this row that match is on `"className"`, not `"class"`.
- `originalName` is consumed later and elsewhere, by `getAttributeTemplates()`, as the attribute
  name actually written into the wrapper: `outputName = attr.originalName || attr?.name` (`:1037`),
  with a further `attr.originalName !== outputName` fallback branch at `:1046`.
- The `attributeMapping` / `getMappedAttribute` / `throwKeywordException` path that ADR-11 pointed
  at (`:953`–`:959`, `:995`, `:1017`) is a *different* path. It fires only when a component's own
  manifest attribute is named in `RESERVED_WORDS` (`:621`, which contains both `class` and
  `className` but not `for`), and this repo configures no `attributeMapping` at all, so a manifest
  attribute literally named `class` would throw there rather than be renamed.

Bounds on the above: it is a reading of one pinned bundle version, not a behavioural test; nothing
in this repo declares a `class` or `className` attribute, so none of it is exercised today.

## Rationale

ADR-11:246-253 states of the `class` row that "this ADR did not trace that path fully, and does not
claim the same key-mismatch mechanism applies" — that limit stands, and this note does not overturn
it. The note extends the trace one step further than ADR-11 went and is explicitly *not* a claim
that ADR-11 was wrong: ADR-11's verified finding (this repo's gate reads no `originalName` at all)
is unaffected.

Hand-authored during the pre-merge review fold of PR #192, not emitted by `spec-kitty decision`.
It is deliberately absent from `decisions/index.json`: that index is parsed under a strict schema
whose `origin_flow` enum admits only `charter`/`specify`/`plan`, so an entry for a review-time note
would fail to load. The record lives as this file alone.

## Change log

- `2026-09-06T02:19:13.942941+00:00` — opened
- `2026-09-06T02:19:13.942941+00:00` — resolved (parking note; no architectural decision taken)
