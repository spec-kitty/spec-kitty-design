# Research: Delivery-return metric elements

## Scope and method

Research is bounded to `spec-kitty/spec-kitty-design` issue #147 under epic #144. It uses the exact `train/elements-first` base `0fde2abffd26c53caeb40ced44bef8c79846b47b`, the repository's current source/generator contracts, and the approved Stitch screen identified by the tracker issue. No Team Kitty source, application API, browser-heavy suite, or implementation experiment is required to settle the component boundary.

## Confirmed terminology

- **Metric** means a generic supplied label/value pair with optional supporting annotation/status. It is not a calculated statistic.
- **Display value** means opaque consumer-formatted content. Strings that look like money or percentages have no special behavior.
- **Evidence stage** means one readonly record with a stable ID plus metric content.
- **Evidence chain** means the ordered visual/accessibility composition of those stage records. It does not mean a Team Kitty deployment or verification workflow.
- **Controlled/presentational** means inputs are read and rendered without application-side mutation, selection, actions, timers, fetching, routing, or stores.

These interpretations are explicit in issues #144/#147 and therefore require no new product decision.

## Repository observations

1. `packages/elements/src/transition-matrix/sk-transition-matrix.ts` establishes the current structured-input seam: exported readonly types, `attribute: false`, `Object.freeze([])` default, source-located manifest normalization, and a generated React property hook.
2. `scripts/normalise-manifest.mjs` recognizes public `ReadonlyArray` fields configured with `attribute: false`; `scripts/build-react-wrappers.mjs` refuses unsafe or erased property-only fields. The evidence-chain stage array belongs on this existing seam.
3. ADR-9 requires open shadow roots, token/part/custom-property styling only, and prohibits selectors that rely on ancestors outside a component root.
4. ADR-10 makes authored `.css` the style source of record and permits markup modules only where a genuine static form exists. Generated CSS modules, manifest, wrappers, Vue declarations, and sizes are committed outputs.
5. ADR-11 requires behavior tests only for behaviors a component owns. Both proposed elements are read-only and own no event, focus, form, keyboard, or selection contract. Styling-part targeting and style adoption still require verification.
6. `sk-pill-tag` already owns pill/status presentation; `sk-card` and `sk-grid` already own container and grid layout. Issue #147 depends on #79 specifically so this mission composes those capabilities instead of reproducing them.
7. Existing design tokens cover tabular typography, surfaces, semantic foregrounds, borders, radii, and spacing. Research found no demonstrated need for a new component-named token.

## Decisions

### D1 — Both public surfaces are custom elements

`sk-metric` adds a reusable label/value/annotation composition, and `sk-evidence-chain` adds structured rendering plus nested element composition. Neither is merely a class applied to a native element, so ADR-10's styles-only ruling does not apply.

### D2 — The chain takes one property-only readonly array

The public structured input is `stages`, typed as a `ReadonlyArray` of readonly stage records and configured with `attribute: false`. This is the repository's proven manifest/wrapper route for objects and arrays. JSON-in-an-attribute is rejected because it creates parsing/error semantics and loses the direct typed-property contract.

### D3 — Input validation is fail-closed and non-transforming

Valid stages have unique nonblank string IDs, string labels/display values, optional string annotations, and one supported generic tone. Invalid input yields one generic non-misleading empty/invalid presentation; it is not partially rendered, sorted, corrected, or enriched. This mirrors the fail-closed structured-data precedent without importing that component's domain logic.

### D4 — Native semantics remain inside one root

`sk-metric` uses a native label/value relationship such as definition-list semantics rather than treating the value as a heading. This lets the consumer own the surrounding section heading while keeping an isolated metric understandable. `sk-evidence-chain` owns one native ordered list and its direct list items inside the same shadow root, avoiding #92's broken cross-root list relationship. Decorative connectors are excluded from accessible names and item counts.

### D5 — Composition is literal, not visual imitation

Each valid evidence stage renders one actual `sk-metric`. Optional metric annotations/statuses use the existing `sk-pill-tag` capability rather than a second pill implementation. Reference stories may place these elements in existing `sk-card`/`sk-grid`, but neither new element takes ownership of those outer containers.

### D6 — Stable IDs drive DOM identity, not selection

The chain uses stage IDs only to preserve repeated-stage identity across rerenders. It exposes no selected-stage property and emits no action. The chain never mutates a consumer's array/record and does not derive application state.

### D7 — No authored static form is planned for the structured chain

An evidence chain cannot be represented by a finite attribute-only static form: its ordered stage array is property-only, and reproducing metric markup inside a second leaf markup module would violate the explicit composition boundary. `sk-evidence-chain` therefore has no markup module or generated static HTML. During planning, `sk-metric` should also remain element-only if its required `sk-pill-tag` composition cannot be preserved meaningfully without JavaScript; no duplicated static annotation implementation is permitted. ADR-10 explicitly makes markup modules conditional on a genuine static form.

### D8 — Presentational components add no behavior-registry subjects

There is no event, form association, focus transfer, keyboard action, selection, or slot fallback owned by this mission. Adding behavior/mutation entries would falsely claim a contract or test Lit itself. Focused fixture coverage instead proves opaque values, readonly preservation, validation, ordered semantics, composition, parts, and style adoption. The full repository mutation fleet remains a final mission gate, not a new subject requirement.

### D9 — Existing tokens first

Implementation should reuse current semantic foreground/surface/border, spacing, radius, weight, size, and mono/tabular typography tokens. A new token is allowed only if a measured visual requirement cannot be expressed by an existing semantic token; that would trigger token-package ownership and maintainer sign-off and must be folded explicitly before implementation.

### D10 — Generated artifacts are isolated to the final integration package

Metric and evidence-chain authored sources/tests/stories can be reviewed independently. Shared barrels, ratchets, manifest, React/Vue outputs, CSS modules, `SIZES.md`, documentation, and final cross-component fixtures are integrated serially after their prerequisites. This avoids write-scope overlap and preserves one regeneration point after the required latest-train rebase.

## Alternatives rejected

- **One Team-specific `sk-team-overview` or `sk-delivery-return` element**: violates epic #144 and couples the library to application language/state.
- **A new stat-grid/card/tag primitive**: duplicates existing `sk-grid`, `sk-card`, or `sk-pill-tag`.
- **Slotted arbitrary stage markup**: weakens the typed immutable stage model and cannot guarantee one metric per stage or stable order.
- **JSON stage attributes**: adds parsing/failure policy and loses wrapper type fidelity.
- **Currency/percentage numeric properties**: moves formatting and domain calculations into the library.
- **Clickable/selectable stages**: introduces unrequested application action/state and an event/keyboard contract.
- **A second internal metric template in the chain**: violates the issue's explicit composition requirement.
- **Hand-authored wrapper or generated output edits**: violates the repository generator contract.

## Verification implications

- Focused element tests should use frozen stage arrays/records and retain copies of input values before/after rendering without shadow-DOM snapshot testing.
- Type tests must prove the generated React `stages` prop accepts the exported readonly stage type and rejects malformed/`any`-masking use.
- Part tests must target every declared part from outside each shadow root and keep `expected-parts.json` exact.
- Story coverage must be ratcheted for two/four/six stages, approved four-stage density, long/large values, narrow layout, invalid/empty state, and `LightMode`.
- Visual tests compare the approved reference; local baselines are not authority.
- Final integration requires a latest-train refresh before regeneration, then the full recipe gates and Tier C exact-head three-lens review.

## Open questions and risks

- **Visual token sufficiency**: the exact approved connector treatment may expose a missing semantic token. Prefer existing tokens; escalate rather than inventing a component-named token.
- **Metric static form**: planning must make an explicit yes/no decision after checking whether an annotation can genuinely reuse `sk-pill-tag` in the no-JavaScript path. Absence is safer than duplicated authored markup.
- **Nested definition/list semantics**: verify with the browser accessibility tree and axe that one metric per list item does not add noisy or misleading grouping.
- **Stable-ID validation**: a repeated-render identity assertion should prove IDs are used while remaining outside behavior/mutation ownership.
- **Shared artifact drift**: #145/#146 are landing serially on the same train. Final implementation must refresh from the then-current train and regenerate exactly once after authored lanes consolidate.

No product decision is currently blocked. The risks above are implementation/verification obligations and do not broaden mission scope.
