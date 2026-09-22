# Native form-select styles contract

This mission adds a styles-only public surface for native light-DOM `<select>` controls. It does
not register a custom element, create a shadow root, generate a framework wrapper, or own
application state or behavior. Issue #211 remains the binding implementation contract.

## Public CSS surface

The complete public selector vocabulary is:

- `.sk-form-select`
- `.sk-form-select--compact`

The base class is applied directly to a native `<select>`; the compact class is its only public
modifier. Design values resolve through authoritative `--sk-*` tokens. The stylesheet does not
reset native appearance, replace the browser indicator, suppress forced-colors behavior, or add
motion.

## Consumer-authored markup and behavior

Consumers compose the existing `.sk-form-field`, `.sk-form-field__label`, and
`.sk-form-field__description` classes around real `<select>`, `<option>`, and `<optgroup>` nodes.
They own option data, selected value, `change` handling, filtering, and lane/application state.
The browser remains authoritative for `name`, `value`, `required`, `disabled`, form submission,
reset, keyboard interaction, typeahead, validity, and option semantics.

Required-invalid help is visible text referenced by same-root `aria-describedby`. Focus, invalid,
and disabled presentations retain non-color cues. The native indicator and state affordances
remain visible in forced colors and at 200% browser zoom.

This closed authored option set is intentionally distinct from #180's datalist input, which
permits unmatched free text.

## Distribution and verification

Seven authored HTML fixtures are the source for the generated form-select barrel. The styles
package exports both the generated TypeScript surface and the independently consumable CSS
subpath without a side-effect CSS import from its root TypeScript barrel.

`apps/storybook/src/tests/sk-form-select.spec.ts` is the executable contract for selector and token
boundaries, native semantics and form behavior, full-width and 320px containment, themes,
forced-colors behavior, and forbidden later-layer surfaces. Storybook axe, visual regression,
cross-browser Playwright, generated-artifact, package, release, mutation, and separate real 200%
Chrome UI zoom evidence complete the acceptance envelope.
