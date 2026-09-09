# Checkbox choice group public contract

## Required structure

1. The root is a native `fieldset` with `.sk-checkbox-choice-group`.
2. The fieldset contains one native `legend` with `__legend`.
3. Choices are grouped visually by `__options` without replacing fieldset semantics.
4. Each choice is a real `label.__choice` containing exactly one visible native
   `input.__control[type="checkbox"]` and visible `__label` content.
5. Optional `__metadata` content is ordinary consumer text and contributes no implicit behavior.

## Public selector set

The public set is exactly:

- `.sk-checkbox-choice-group`
- `.sk-checkbox-choice-group__legend`
- `.sk-checkbox-choice-group__options`
- `.sk-checkbox-choice-group__choice`
- `.sk-checkbox-choice-group__control`
- `.sk-checkbox-choice-group__label`
- `.sk-checkbox-choice-group__metadata`

Native pseudo-classes and relational selectors may qualify these selectors without creating a new
public class or state vocabulary.

## Ownership

The browser owns focus, activation, checkedness mechanics, submission, reset, and native disabled
behavior. The consumer owns content, values, checked/disabled state, metadata, filtering, actions,
persistence, and URL state. The library owns only presentation and responsive containment.

## Forbidden surface

No custom element, JavaScript initializer, item array, callback, event, validation API, custom
checkbox glyph, lane vocabulary, filter function, or disclosure/action behavior is part of this
contract.

## Conformance

Conformance requires DOM/accessibility-tree fidelity, native behavior tests, zero axe violations,
token-only CSS, forced-colors resilience, dark and `LightMode`, narrow/long/200%-zoom containment,
visual baselines, generated barrel determinism, exact story ratchet, and absence from all element
and wrapper surfaces.
