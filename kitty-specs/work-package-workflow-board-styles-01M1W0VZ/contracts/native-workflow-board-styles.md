# Native workflow board and lane styles contract

This mission adds a styles-only public surface. It does not register a custom element, create a
shadow root, generate a framework wrapper, or own application behavior. The binding implementation
contract remains issue #209; this artifact records the package-facing seam that consumers use.

## Public CSS surface

The complete public selector inventory is:

- `.sk-workflow-board`
- `.sk-workflow-board__scroller`
- `.sk-workflow-lane`
- `.sk-workflow-lane__header`
- `.sk-workflow-lane__title`
- `.sk-workflow-lane__count`
- `.sk-workflow-lane__list`

No modifier, state, item, domain, or tone class is part of this contract. The authored sources are
`packages/styles/src/workflow-board/sk-workflow-board.css` and
`packages/styles/src/workflow-lane/sk-workflow-lane.css`; all design values resolve through
authoritative `--sk-*` tokens.

## Consumer-authored markup and behavior

Each lane is a natively named `<section>` with a native heading and a direct `<ol>` whose direct
children are `<li>` elements. Consumers supply lane names, visible counts, item content, ordering,
empty-state siblings, and the single lane shown in a mobile route state. The library does not parse,
derive, filter, select, navigate, fetch, observe, time, animate, or infer any of those values.

The `.sk-workflow-board__scroller` receives `role="region"`, an accessible name, and `tabindex="0"`
only when measured geometry proves horizontal overflow. Consumers remove the complete triad when it fits. The styles
provide local horizontal scrolling, visible `:focus-visible` treatment, neutral lane boundaries,
content wrapping, and forced-colors preservation; they do not perform the measurement or mutate ARIA.

## Distribution and verification

Both families are exported from `@spec-kitty/styles` at the package root and their documented
subpaths. HTML fixtures and Storybook stories are authored consumer examples; their generated
barrels remain generator-owned. `apps/storybook/src/tests/sk-workflow-board.spec.ts` is the executable
contract for selector inventory, native semantics, counts/order, overflow keyboard behavior,
containment, themes, forced colors, and the absence of element/wrapper/behavior leakage.
