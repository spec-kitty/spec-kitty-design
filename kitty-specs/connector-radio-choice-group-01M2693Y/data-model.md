# Native presentation model: radio choice group

This mission creates no application data model, store, selection collection API, or serialized
schema. The only model is the consumer-authored DOM contract used by examples and tests.

## Group

- Element: one `fieldset.sk-radio-choice-group`.
- Required child: one `legend.sk-radio-choice-group__legend`.
- Required child: one `.sk-radio-choice-group__options` container after the legend.
- Invariant: the fieldset is not replaced by `role="group"` on a generic element.
- Invariant: every radio inside one group shares one `name` attribute value; the browser, not the
  library, enforces exactly-one-checked from that shared name.
- Consumer-owned fields: legend text, `name`, and any form-level context.

## Choice

- Element: one `label.sk-radio-choice-group__choice` inside the options container.
- Required descendant: one visible `input.sk-radio-choice-group__control[type="radio"]`.
- Required descendant: visible `.sk-radio-choice-group__label` primary text.
- Optional descendant: `.sk-radio-choice-group__secondary-value` text (a machine-readable value —
  e.g. an opaque path or identifier — not a count).
- Consumer-owned fields: value, primary label text, secondary value text, order, checked/
  defaultChecked, disabled, required, and any additional standard native attributes.
- Invariant: the input and its visible text share the same real label; no generated ID linkage or
  cross-root association is needed.

## State transitions

All transitions are browser or consumer owned:

```text
unchecked -> checked          native click/Space/arrow-key/label activation or consumer assignment
checked   -> checked(other)   native arrow-key/click/label activation moves the group's one checked
                               radio to a different choice (never two checked at once)
enabled   -> disabled         consumer attribute/property assignment
valid     <-> invalid         native constraint validation: `required` + nothing checked = invalid;
                               becomes valid the instant any radio in the group is checked
current   -> default state    native form reset (restores authored default-checked choice, or none)
```

The stylesheet observes these states (`:checked`, `:disabled`, `:required`, `:invalid`, `:hover`,
`:active`, `:focus-visible`) but performs no transition of its own and maintains no state store.
The secondary value has no state semantics and may be absent or any text, including text that looks
like an identifier.

## Anatomy source (Family 3 C5, generalized)

C5's real payload is `full_path` (machine value) and a display name per group, with the first group
pre-checked and every radio `required`. That shape maps directly to primary label / secondary value
/ default-checked / required above — but C5's own `group_id` field name, GitLab group labels, and
`sr-only` legend text are fixture/composition detail only, never exported vocabulary or a required
legend-visibility choice (a consumer may author a visible or a programmatically-hidden legend; the
library does not mandate either).
