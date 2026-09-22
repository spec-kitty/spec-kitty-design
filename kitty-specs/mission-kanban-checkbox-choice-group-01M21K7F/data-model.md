# Native presentation model: checkbox choice group

This mission creates no application data model, store, collection API, or serialized schema. The
only model is the consumer-authored DOM contract used by examples and tests.

## Group

- Element: one `fieldset.sk-checkbox-choice-group`.
- Required child: one `legend.sk-checkbox-choice-group__legend`.
- Required child: one `.sk-checkbox-choice-group__options` container after the legend.
- Invariant: the fieldset is not replaced by `role="group"` on a generic element.
- Consumer-owned fields: legend text and any form-level context.

## Choice

- Element: one `label.sk-checkbox-choice-group__choice` inside the options container.
- Required descendant: one visible `input.sk-checkbox-choice-group__control[type="checkbox"]`.
- Required descendant: visible `.sk-checkbox-choice-group__label` label content.
- Optional descendant: `.sk-checkbox-choice-group__metadata` text.
- Consumer-owned fields: name, value, label text, metadata, order, checked/defaultChecked,
  disabled, and any additional standard native attributes.
- Invariant: the input and its visible text share the same real label; no generated ID linkage or
  cross-root association is needed.

## State transitions

All transitions are browser or consumer owned:

```text
unchecked <-> checked       native Space/click/label activation or consumer assignment
enabled   -> disabled       consumer attribute/property assignment
current   -> default state  native form reset
```

The stylesheet observes these states but performs no transition. Visible metadata has no state
semantics and may be absent, zero, or non-numeric.

## K3 fixture mapping

The K3 story has ten choices in consumer-defined order and two checked values. Those lane strings
and counts are immutable story fixture data, not exported constants or reusable vocabulary.
