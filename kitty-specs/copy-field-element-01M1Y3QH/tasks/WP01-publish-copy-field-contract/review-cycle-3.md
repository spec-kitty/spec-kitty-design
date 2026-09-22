---
cycle_number: 3
mission_slug: copy-field-element-01M1Y3QH
reviewed_commit: bc74b4f691bb91ea4728d031ac3f2efd3708e056
base_commit: a679d8374087e2d81198ce00398f4862c839f293
reviewer_agent: independent-codex-squad
verdict: changes_requested
---

# Final exact-head review cycle 3 — changes requested

The independent Codex architecture/accessibility and debugger/reduction reviews rejected the
post-#287 candidate. Four additional broad Codex sessions were preserved in
`/tmp/issue257-bc74-review-{architect,debugger,reviewer,reducer}.session.log`; each hit its 900-second
transport wrapper before emitting a final report and therefore supplies investigation detail, not
an approval or verdict.

## Required corrections

1. **High — intrinsic host sizing:** `container-type: inline-size` can collapse `sk-copy-field` as
   a flex or grid item. Give the host a safe preferred inline size and add normal-flow, flex, and
   grid regressions while retaining the explicit 115px constrained-host proof.
2. **High — story clipboard truthfulness:** stories currently stub a property on a story target,
   while the element reads `navigator.clipboard`. Stub and restore `navigator.clipboard` directly;
   assert copied results in `CopiedSuccess`, `ForcedColors`, and both `RepeatedAndMultiple`
   instances, assert no escaped errors, await the intended forced-colors result in the visual test,
   and regenerate that authoritative baseline.
3. **Medium — story control names:** acceptance stories must supply meaningful labels, with
   distinct labels for multiple controls. Extend the accessibility-tree assertions while retaining
   dedicated missing/blank-label fail-open tests.
4. **High — manual-fallback focus indicator:** a pointer-triggered programmatic focus move to the
   code value must always have a visible indicator; `:focus-visible` alone is insufficient. Add a
   real Chromium/Firefox pointer-fallback assertion.
5. **High — browser fallback matrix:** add parameterized real Chromium/Firefox coverage for absent,
   present-but-non-callable, synchronously throwing, and asynchronously rejected clipboard routes.
   Each route must prove exact selection and focus, one truthful event, and no escaped exception.
6. **Medium — logical container query:** express the 20rem boundary with logical
   `max-inline-size`, prove it under vertical writing mode, and update the SC-017 mutation binding
   so the logical declaration is deletion-resistant.
7. **Medium — dead outcome attribute:** remove the undocumented and otherwise unused
   `data-outcome` rendering seam and its stale internal state; feedback text and the private typed
   event remain the truthful contract.

All seven findings must be fixed in this WP, followed by regeneration, focused behavior/browser/
visual/mutation checks, a complete exact-head gate replay, a fresh independent four-lens Codex
review, and Spec Kitty acceptance. No PR or remote mutation is authorized by this rejection.
