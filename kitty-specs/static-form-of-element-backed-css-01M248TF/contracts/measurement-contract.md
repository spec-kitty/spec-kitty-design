# Measurement contract: FR-008 discriminating evidence

This is not an API contract (this mission has no API). It is the pre-declared schema for what
counts as "a static exemplar demonstrated equal to the shadow form" versus "a recorded negative
measurement," per construct kind, so the ruling's evidence is checkable against a fixed bar rather
than judged after the fact. Written during planning; **the implementation Work Package fills in
the actual measured values** — every `<result>` placeholder below is unresolved by design.

## Result record shape (one per construct kind)

```json
{
  "construct_kind": "host-attribute-axis | host-container-type | slotted-child-rule",
  "component": "sk-app-shell | sk-action-row | sk-entity-marker",
  "shadow_form_source": "packages/elements/src/<name>/sk-<name>.ts (rendered via Storybook)",
  "static_exemplar_source": "kitty-specs/.../measurement/<construct>/exemplar.html (throwaway, cites packages/styles/dist/<name>/sk-<name>.css)",
  "observed_outcomes": [
    {
      "description": "human-readable observable being compared",
      "viewport_or_state": "e.g. 860px width, presentation=compact",
      "shadow_form_value": "<result>",
      "static_exemplar_value": "<result>",
      "equal": "<result: true|false>"
    }
  ],
  "composed_case_tested": "<result: true|false — was a nested/composed-container case included, per IC-01's risk note>",
  "verdict_for_this_construct_kind": "<result: generated-static-form | shadow-only>",
  "negative_measurement_detail": "<result, required only when verdict is shadow-only: the specific CSS/DOM mechanism that blocks a static equivalent, not a bare assertion>"
}
```

## Per-construct-kind observable outcomes to capture

These are the minimum outcomes; the implementer may add more but must not drop these without
recording why in the result record's narrative.

### 1. Host-attribute variant axis (`sk-app-shell`, `presentation="compact"` / `"rail-preserving"`)

- `grid-template-columns` computed value of the root layout element, at a width below and at a
  width above each documented `@container` breakpoint (860px for `compact`, 1100px for
  `rail-preserving`).
- `display` computed value of the compact-header and compact-navigation regions at the same
  breakpoints.
- **Composed case**: the same comparison with the exemplar/element nested inside an outer
  ancestor that also declares `container-type: inline-size` at a *different* width than the
  component's own container — this is the case IC-01 flags as a possible shadow/static divergence
  (nearest-container scoping).

### 2. Host-owned `container-type` (`sk-action-row`, the 400px reflow)

- `flex-wrap` / grid-template-areas computed value of `.sk-action-row`/`.sk-action-row__trigger`
  above and below 400px container inline size.
- **Composed case**: same as above — an outer ancestor container competing for "nearest
  container" status.

### 3. `::slotted()` child rule (`sk-entity-marker`, `::slotted(img)`)

- `display`, `inline-size`, `block-size`, `object-fit` computed values of a slotted `<img>` child,
  compared against the equivalent light-DOM descendant `<img>` under the static exemplar's root
  class.
- No composed-nesting case applies here (no container-type involved); instead record whether the
  descendant-selector specificity/cascade order differs in a way a page's own stylesheet could
  accidentally override that `::slotted(img)` could not (a one-way risk, not a two-way equality
  question, but worth recording either way it comes out).

## What "equal" and "negative" mean here

- **Equal**: every declared outcome for a construct kind, including its composed case, shows
  `equal: true`. The static exemplar reproduces the shadow form's behavior at every measured
  state, using only the real built CSS file at its real package subpath.
- **Negative**: at least one declared outcome cannot be reproduced by any static exemplar the
  implementer can construct, **and** the result record's `negative_measurement_detail` names the
  specific mechanism (e.g., "nearest-container-type scoping picks up the wrong ancestor once
  nested, and CSS has no scoped-container primitive that survives outside a shadow boundary
  without an explicit `container-name` renegotiation the static consumer would have to hand-author
  themselves"). A negative result is not "we didn't try"; it is "we tried, and here is exactly
  what breaks."

## Reproducibility (NFR-001)

Every value in `observed_outcomes` must be captured by a script committed under
`kitty-specs/static-form-of-element-backed-css-01M248TF/measurement/`, re-runnable against the
same train ref, not read off a one-time manual browser inspection. `quickstart.md` documents the
exact commands.
