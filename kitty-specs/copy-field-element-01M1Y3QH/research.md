# Research: `sk-copy-field`

## Question

How can the design library publish one JavaScript-dependent copy control that preserves native
button semantics, copies the exact visible value, degrades safely when clipboard access fails,
and exposes truthful feedback without absorbing application behavior?

## Findings

### R-001 — One reactive value must drive both presentation and clipboard input

Issue #257 makes `value` the single source of truth. Lit text interpolation preserves the supplied
string as text and avoids an HTML interpretation boundary. The click handler must snapshot that
same property and pass it unchanged to `Clipboard.writeText`; it must not trim, parse, normalize,
validate, or include the value in the emitted event.

### R-002 — The copy control is a real native button and the host is not a tab stop

The current `sk-button` contract (#79 plus #153) renders a native button and owns the shared visual
vocabulary. `sk-copy-field` can reuse that vocabulary without inventing a second class family by
adopting the existing button sheet before its own sheet and applying the existing button classes
to one native `type="button"` in its shadow root. The host receives no `tabindex`; a programmatic
manual-fallback focus target uses `tabindex="-1"`, so the component adds exactly one sequential tab
stop and does not worsen open issue #154.

### R-003 — Clipboard success is an observed result, not an optimistic state

The asynchronous Clipboard API is attempted only when the page is a secure context and a callable
`writeText` is available. Only a fulfilled promise can yield `copied`. API absence, insecure
context, permission rejection, and synchronous or asynchronous throws are contained and routed to
the same deterministic fallback. Tests replace the browser clipboard surface; no test touches the
developer machine's clipboard.

### R-004 — Manual fallback selects the visible code node

The public fallback is selection, not a hidden textarea or command execution. The visible `<code>`
node is programmatically focusable but not sequentially tabbable. The fallback focuses it without
scrolling, selects its complete text with a DOM `Range`, and announces the documented manual-copy
instruction. If focus, range creation, or selection cannot be completed, the honest outcome is
`failed`; no legacy copy attempt is needed.

### R-005 — One stable polite status node owns per-instance feedback

The #178 live-region lesson is that the node must exist before result text changes. Each field
therefore renders one `role="status"`, `aria-live="polite"`, `aria-atomic="true"` node on first
render and changes only its text after an attempt. Instances do not share state. A custom reactive
`value` accessor advances the revision and clears feedback synchronously on every actual assignment
change, so even a batched A→B→A sequence invalidates an A attempt. Same-revision overlapping
attempts complete independently; completion order owns visible status. No timers or retries are
introduced.

### R-006 — This component has no honest static HTML form

ADR-10 permits omitting a markup module when behavior is inseparable from the component. An inert
static Copy button would misrepresent the contract, so `sk-copy-field` ships only as an element.
Its authored CSS still lives in `@spec-kitty/styles`; generated element CSS, manifest, React
wrapper/types, Vue declarations, indexes, ratchets, and size report remain committed derived
artifacts.

### R-007 — The approved Dossier screens are composition evidence, not a source of app behavior

The operator-approved dark set D1, D2, and D4-D8 and the live issue's named D1, D3, D4, D6, D8
references consistently show a compact bordered value field with a right-side Copy action. D2
proves long commands must wrap at 390px; D3 provides light-mode composition parity. The
design-library element may reproduce that immediate composition and feedback only. Repository
discovery, routing, command selection, execution, progress, timestamps, truth inference, and setup
policy remain consumer concerns.

## Verification implications

- Browser behavior must cover Chromium and Firefox with deterministic success, unavailable,
  insecure/rejected, manual, and unrecoverable branches.
- Behavior/mutation coverage applies to ADR-11 event, property-before-upgrade, focus/keyboard,
  styling-part, style-adoption, registration, and reactive-update responsibilities.
- Accessibility evidence must prove the control's name, one sequential tab stop when non-empty and
  zero when empty, readable value, stable atomic live region, focus retention/transfer, and
  per-instance announcements.
- Layout evidence must cover default dark, `LightMode`, 390px, 200% and 400% zoom, forced colors,
  reduced motion, long Unicode/shell punctuation, and no page-level horizontal overflow.
- React wrapper evidence must preserve `value`, `label`, three message properties, and the literal
  `copied | manual | failed` event-detail union. Vue declarations must preserve the registered tag
  and public input properties; the current generator does not publish custom-event listener types.

## Risks and open questions

- Browser engines differ in shadow-root selection behavior; the fallback must be verified in both
  required engines rather than assumed from Chromium.
- The existing button stylesheet owns a transition without a reduced-motion guard. The local
  copy-field stylesheet must neutralize it for the adopted native button (`transition: none`) so
  this component adds no unguarded motion; it must not edit the shared button contract.
- Visual baselines are CI-authoritative per the repository recipe. Local captures can verify
  geometry and comparison to approved Dossier evidence, but cannot be represented as canonical CI
  approval unless the CI artifact is available.

No product decision remains open: the live issue and operator instruction are the binding scope.
