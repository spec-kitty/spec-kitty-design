# Tasks: Form Input Contract Doc Refresh

**Input**: `kitty-specs/form-input-contract-doc-refresh-01M1T6VH/spec.md`,
`kitty-specs/form-input-contract-doc-refresh-01M1T6VH/plan.md`

Single-WP mission: one file, one section, two factual corrections plus a canonical-source pointer.
No parallelization is possible or useful here.

## WP01: Correct the React wrapper contract (delta) section

**Dependencies**: none
**Requirements**: FR-001, FR-002, FR-003, FR-004

Rewrite the "React wrapper contract (delta)" section of
`kitty-specs/form-input-constraints-and-datalist-01M1S94Y/contracts/sk-form-input.contract.md` so
that it:

- Describes the CURRENT `scripts/build-react-wrappers.mjs` gate (#187's exact comparison against
  the real `MAPPED_PROPS` table read from the installed `@wc-toolkit/react-wrappers` bundle via
  `loadReactPropRenameMap()`), not the superseded #180 lower-case-fold gate.
- Drops the false "every rename in the generator's table is CASE-ONLY" claim and states the
  verified, narrower truth: `for`→`htmlFor` and `class`→`className` are word substitutions, not
  case changes, while this element's own three renames (`readonly`/`autocomplete`/`inputmode`)
  remain case-only.
- Points to ADR-11's "wrapper prop-name invariant" section
  (`docs/architecture/decisions/2026-09-02-11-verification-stack-and-wrapper-generation.md`) as the
  canonical statement of the `for`/`class` mechanics, rather than re-deriving or restating it.
- Does not assert a parallel between the `for` and `class` rows' internal mechanics beyond what
  has been verified (ADR-11 itself records where its own trace of the `class` row's
  `originalName`/`attributeMapping` path stops).

### Subtasks

- [X] T001 Read `scripts/build-react-wrappers.mjs` (`loadReactPropRenameMap`, the per-element exact
  comparison) to confirm the gate's current behaviour at this head.
- [X] T002 Read the installed `node_modules/@wc-toolkit/react-wrappers/dist/index.js` `MAPPED_PROPS`
  array directly to confirm which of its 17 rows are case-only vs. word-substitution renames.
- [X] T003 Run `node scripts/build-react-wrappers.mjs --check` to confirm it passes, both before
  and after the doc edit (no behaviour change).
- [X] T004 Rewrite the "React wrapper contract (delta)" section per the four bullets above.

**Verification**: `node scripts/build-react-wrappers.mjs --check` passes; the corrected section
matches the current gate source and the real `MAPPED_PROPS` table; ADR-11 is cited, not restated.
