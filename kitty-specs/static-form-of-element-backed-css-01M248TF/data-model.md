# Data and semantic model: static form of element-backed CSS families

This is a decision mission (Gap G0). It introduces no stored data, application state, runtime
model, or new component. The "entities" below are the CSS/architecture constructs the ruling must
reason about — not data the library owns.

| Entity | What it is | Where it lives today | What the ruling must say about it |
|---|---|---|---|
| Host-attribute variant axis | A `:host([presentation="..."])` selector gating layout inside a `@container` block whose container is the host itself | `packages/styles/src/app-shell/sk-app-shell.css` (`compact`, `rail-preserving`) | Whether a static/light-DOM equivalent is generated (candidate a) or explicitly declared unavailable with a documented consumer substitute (candidate b) |
| Host-owned container query | `:host { container-type: inline-size }`, the container every descendant `@container` rule in the same sheet depends on | `packages/styles/src/app-shell/sk-app-shell.css`, `packages/styles/src/action-row/sk-action-row.css` | Whether the container axis moves to a root class for the static path (candidate a) or is named as a shadow-only mechanism (candidate b) |
| `::slotted()` child rule | A rule that only matches slotted light-DOM children of a shadow host | `packages/styles/src/entity-marker/sk-entity-marker.css` (`::slotted(img)`) | Whether it becomes a descendant rule under a root class in the static form (candidate a) or is named as inapplicable outside a shadow root, with the consumer told what selector to author instead (candidate b) |
| The ruling itself | An ADR (new or amended) recording which shape the repo adopts, for all three constructs, and why | Not yet recorded — this mission's deliverable | Must address all three constructs individually; must not leave any implicit by omission |
| The measurement | Either a static exemplar demonstrated equal to the shadow form on the train ref, or a recorded negative measurement | Not yet performed — `plan.md`/implementation deliverable | Selects which candidate the ruling adopts; is evidence, not an assertion |
| Gated children | #302 (TKT2/G1), #304 (TKT4/G3), #305 (TKT5/G4), #307 (TKT7/G6) | Open issues under epic #300 | The ruling states which may freeze a static API and in what form |
| #161 (package export path) | An open defect: `@spec-kitty/styles`' declared entry point is unemittable | This repo, `packages/styles/package.json` vs `tsconfig.lib.json` | The ruling must hold for real package consumption under this constraint, or record it as a dependency if it makes the answer unmeasurable |
| #239 (inverse question) | Open: can a shadow-DOM element consume a light-DOM primitive's stylesheet? | This repo, issue #239 | The ruling states its relationship to #239 without deciding it |

## Measurement entities (added during planning; see `contracts/measurement-contract.md`)

| Entity | What it is | Produced by |
|---|---|---|
| Result record | One JSON record per construct kind: shadow-form source, static-exemplar source, the declared observable outcomes, whether the composed/nested case was tested, and the verdict this evidence selects | Implementation WP (IC-01) |
| Observed outcome | A single computed-style/behavioral comparison point (e.g. `grid-template-columns` at a given width) with its shadow-form value, static-exemplar value, and equality | Implementation WP (IC-01), schema fixed in `contracts/measurement-contract.md` |
| Composed/nested case | A specific outcome comparison performed with the exemplar nested inside a competing `container-type` ancestor, to catch nearest-container scoping divergence the shadow boundary would otherwise hide | Implementation WP (IC-01) |
| Negative-measurement detail | Required only when a construct kind's verdict is shadow-only: the specific CSS/DOM mechanism that blocks a static equivalent | Implementation WP (IC-01) |

## Relationships and invariants

- Every one of the three measured constructs is a legitimate, ADR-9-compliant shadow-DOM
  authoring pattern today (confirmed against `check-adopted-css-boundaries.mjs`'s own accept/reject
  table — `:host`, `:host([attr])`, and `::slotted()` compounds are all accepted). The ruling does
  not correct a defect in these files; it decides what, if anything, a non-shadow consumer gets in
  their place.
- The ruling is scoped to these three construct *kinds* (host-attribute axis, host-owned container
  query, `::slotted()` child rule), not to the two specific components (`sk-app-shell`,
  `sk-action-row`) beyond using them as the measured exemplars — the epic's other gated children
  reuse the same construct kinds on different components.
- The measurement (static exemplar vs. negative record) is per construct kind, not a single
  pass/fail for the whole mission: candidate (a) and candidate (b) can be selected independently
  for different construct kinds if the evidence supports that, and the spec's requirements must
  not force a single global answer where the measurement doesn't produce one.
- Nothing here creates, modifies, or removes a Team/invitation/membership/bearer-link/session
  model; component-visible copy stays consumer-supplied and translatable (#286), unaffected by
  this ruling.
