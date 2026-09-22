# Radio choice group public contract

## Required structure

1. The root is a native `fieldset` with `.sk-radio-choice-group`.
2. The fieldset contains one native `legend` with `__legend`.
3. Choices are grouped visually by `__options` without replacing fieldset semantics.
4. Each choice is a real `label.__choice` containing exactly one visible native
   `input.__control[type="radio"]` and visible `__label` content.
5. Every `__control` in one group shares one `name` attribute value — this, not library script, is
   what makes the group exactly-one-of-many.
6. Optional `__secondary-value` content is ordinary consumer text (a machine-readable value, e.g. an
   opaque path or identifier) and contributes no implicit behavior.

## Public selector set

The public set is exactly:

- `.sk-radio-choice-group`
- `.sk-radio-choice-group__legend`
- `.sk-radio-choice-group__options`
- `.sk-radio-choice-group__choice`
- `.sk-radio-choice-group__control`
- `.sk-radio-choice-group__label`
- `.sk-radio-choice-group__secondary-value`

Native pseudo-classes and relational selectors (`:checked`, `:disabled`, `:required`, `:invalid`,
`:hover`, `:active`, `:focus-visible`, `:has()`) may qualify these selectors without creating a new
public class or state vocabulary.

## Ownership

The browser owns exactly-one-selection enforcement (via shared `name`), focus, arrow-key roving
selection, activation, constraint validation (including `required`/`:invalid`), submission, reset,
and native disabled behavior. The consumer owns content, values, checked/default-checked/disabled/
required state, secondary values, validation-message copy, actions, routing, persistence, and URL
state (#286). The library owns only presentation and responsive/RTL containment.

## Forbidden surface

No custom element, JavaScript initializer, selection store, callback, event, validation-message
API, custom radio glyph, provider vocabulary, routing/mutation logic, or auto-submit behavior is
part of this contract.

## Distinction from `.sk-checkbox-choice-group` (#277)

The two families share BEM shape (root/legend/options/choice/control/label + one optional content
slot) deliberately, but are non-aliased, separate contracts:

| | `.sk-checkbox-choice-group` (#277) | `.sk-radio-choice-group` (#336) |
|---|---|---|
| Selection cardinality | zero-to-many checked | browser-enforced exactly-one (via shared `name`) |
| `required`/invalid contract | not in scope | required, with a native invalid state |
| Optional content slot | `__metadata` (count-shaped) | `__secondary-value` (machine-value-shaped) |
| Keyboard | Tab + Space + label activation | Tab (group tab-stop) + arrow-key roving + Space + label |

Neither family's selector, story, or documentation may imply the other's cardinality or validation
behavior.

## Conformance

Conformance requires DOM/accessibility-tree fidelity, native exactly-one-selection and
required/invalid behavior tests, zero axe violations, token-only CSS, forced-colors resilience
(including accent-color-truthfulness proof), dark and `LightMode`, narrow/RTL/long/200%-zoom
containment, a 44px interactive-target floor, visual baselines, generated barrel determinism, exact
story ratchet, and absence from all element and wrapper surfaces.
