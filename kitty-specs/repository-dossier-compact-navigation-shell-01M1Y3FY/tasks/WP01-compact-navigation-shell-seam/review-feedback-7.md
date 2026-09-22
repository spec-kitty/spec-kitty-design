# WP01 final-squad correction — cycle 7 disposition

**Rejected SHA:** `47f2deebfebe136e8cc02bf2c6f7622f3032da66`

**Base/merge-base:** `a78445552e42cb6bbde4e1d2e497137bc30c9dee`

**Disposition:** bounded governance/documentation correction in a separate local commit; no
product runtime behavior, CSS declaration, test, or generic nullable-reset algorithm is changed.

## Canonical dismissal timing

- Synchronized `spec.md`, `plan.md`, `data-model.md`, `research.md`, and WP01 on exactly one
  bounded post-dispatch microtask sample of effective falsiness (`open !== true`), including React
  19's omitted/undefined false property.
- A framework commit scheduled by the current dispatch may be observed at that sample; acceptance
  is therefore not described as synchronous or dispatch-turn-only, and asynchronous work is not
  rejected as a class.
- The pending intent expires at the sample whether accepted or rejected. After acceptance, the
  component awaits its Lit update before focusing a connected valid trigger. Any close after the
  sample, including a later route/state close, cannot inherit focus-return intent.
- The consumer remains the sole owner of controlled `open`, dismissal acceptance, routes, and
  destination state.

## One-WP ownership boundary

- Added only `scripts/build-react-wrappers.mjs`, `scripts/normalise-manifest.mjs`,
  `tests/node/react-wrappers.test.ts`, and `fixtures/react-consumer/src/wrappers.test.tsx` to both
  WP01 `owned_files` and lane-a `write_scope`.
- These paths contain the already-reviewed generic nullable-reset source and its direct tests;
  no second WP, lane, or broader ownership surface was introduced.

## Token documentation and derived artifacts

- Added the repository-standard `Token dependencies:` paragraph to the `SkAppShell` class JSDoc
  with exactly the eleven tokens consumed by its authored stylesheet.
- Regenerated only JSDoc-affected CEM/React/Vue outputs and any authoritative size ledger changed
  by the no-cache Node 24 elements build; generated files were not hand-edited.

## Review status

Debugger Debbie approved the rejected parent behavior with no findings. Architect Alphonso,
Randy Reducer, and Reviewer Renata supplied the rejection findings preserved in
`review-cycle-7.md`, together with all four report hashes.

This disposition is not self-approval. Successor exact-SHA full gates, four-lens independent
review, live GitHub state refresh, pinned Ubuntu PR CI, and any replacement-head publication remain
pending and are not claimed here.
